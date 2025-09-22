
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { Product, Unit, Patient, Order, Dispensation, StockMovement, PatientFilter, PatientStatus, User, KnowledgeBaseItem, Role, SubRole } from './types';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as jose from 'jose';
import bcrypt from 'bcrypt';
import { stat, mkdir } from 'fs/promises';
import { cache } from 'react';
import { kv } from './kv';


const dataPath = path.join(process.cwd(), 'src', 'data');
const uploadPath = path.join(process.cwd(), 'public', 'uploads');

// --- FILE I/O HELPERS ---

const readData = cache(async <T>(key: string): Promise<T[]> => {
    const data = await kv.get<T[]>(key);
    return data || [];
});

async function writeData<T>(key: string, data: T[]): Promise<void> {
    await kv.set(key, data);
}


// --- AUTH ACTIONS ---

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development');
const saltRounds = 10;

export const getCurrentUser = cache(async (): Promise<User | null> => {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;

    try {
        const { payload } = await jose.jwtVerify(sessionCookie, secret);
        const userId = payload.sub;
        if (!userId) return null;

        const users = await readData<User>('users');
        return users.find(u => u.id === userId) || null;

    } catch (error) {
        console.error("Failed to verify session cookie:", error);
        return null;
    }
});

export async function register(userData: Omit<User, 'id' | 'password' | 'accessLevel'> & { password: string }): Promise<{ success: boolean; message: string }> {
    const users = await readData<User>('users');
    if (users.find(u => u.email === userData.email)) {
        return { success: false, message: 'Este e-mail já está em uso.' };
    }

    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    // First user registered is an Admin, others are Users
    const accessLevel = users.length === 0 ? 'Admin' : 'User';

    const newUser: User = {
        id: `user-${Date.now()}`,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        subRole: userData.subRole,
        accessLevel,
    };
    
    users.push(newUser);
    await writeData('users', users);
    await logActivity('Cadastro de Usuário', `Novo usuário cadastrado: ${userData.email} com cargo ${userData.role} e nível ${accessLevel}.`);

    return { success: true, message: 'Conta criada com sucesso!' };
}


export async function login(formData: FormData): Promise<{ success: boolean; message: string } | undefined> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const users = await readData<User>('users');
    const user = users.find(u => u.email === email);

    if (!user) {
        return { success: false, message: 'Email ou senha inválidos.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return { success: false, message: 'Email ou senha inválidos.' };
    }

    const token = await new jose.SignJWT({ 'urn:example:claim': true, accessLevel: user.accessLevel })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setSubject(user.id)
        .setIssuer('urn:example:issuer')
        .setAudience('urn:example:audience')
        .setExpirationTime('7d')
        .sign(secret);
    
    cookies().set('session', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
    await logActivity('Login', `Usuário fez login: ${user.email}`);

    redirect('/dashboard');
    
    return { success: true, message: "Login bem-sucedido!" };
}


export async function logout() {
  const user = await getCurrentUser();
  if (user) {
    await logActivity('Logout', `Usuário ${user.email} saiu.`);
  }
  cookies().delete('session');
}

export async function getAllUsers(): Promise<User[]> {
    const currentUser = await getCurrentUser();
    if (currentUser?.accessLevel !== 'Admin') {
        throw new Error("Acesso não autorizado.");
    }
    return await readData<User>('users');
}


// --- ACTIVITY LOGGING ---

type ActivityLog = {
    user: string;
    action: string;
    details: string;
    timestamp: string;
}

async function logActivity(action: string, details: string) {
    const user = await getCurrentUser();
    const logs = await readData<ActivityLog>('logs');
    const logEntry: ActivityLog = {
        user: user?.email || 'Sistema',
        action,
        details,
        timestamp: new Date().toISOString(),
    };
    logs.unshift(logEntry); 
    await writeData('logs', logs.slice(0, 1000)); 
}

// --- STOCK MOVEMENT LOGGING ---

async function logStockMovement(
    productId: string,
    productName: string,
    type: StockMovement['type'],
    reason: StockMovement['reason'],
    quantityChange: number,
    quantityBefore: number,
    relatedId?: string
) {
    const user = await getCurrentUser();
    const movements = await readData<StockMovement>('stockMovements');
    const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        productId,
        productName,
        type,
        reason,
        quantityChange,
        quantityBefore,
        quantityAfter: quantityBefore + quantityChange, 
        date: new Date().toISOString(),
        relatedId: relatedId || '',
        user: user?.email || 'Sistema'
    };
    movements.unshift(movement);
    await writeData('stockMovements', movements);
}

// --- KNOWLEDGE BASE ---
export const getKnowledgeBase = cache(async (): Promise<KnowledgeBaseItem[]> => {
    const filePath = path.join(dataPath, 'knowledge-base.json');
     try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return [];
        }
        console.error(`Error reading knowledge-base.json:`, error);
        throw error;
  }
});

// --- IMAGE UPLOAD ---
export async function uploadImage(formData: FormData): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
        const file = formData.get('image') as File;
        if (!file) {
            return { success: false, error: 'Nenhum arquivo enviado.' };
        }

        await mkdir(uploadPath, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = path.extname(file.name);
        const fileName = `img-${Date.now()}${fileExtension}`;
        const filePath = path.join(uploadPath, fileName);
        
        await fs.writeFile(filePath, buffer);
        
        const publicPath = `/uploads/${fileName}`;
        return { success: true, filePath: publicPath };

    } catch (e) {
        console.error('Upload error:', e);
        return { success: false, error: 'Falha ao salvar a imagem no servidor.' };
    }
}


// --- PRODUCTS ACTIONS ---

export const getProducts = cache(async (): Promise<Product[]> => {
    return await readData<Product>('products');
});

export async function getProduct(productId: string): Promise<Product | null> {
    const products = await getProducts();
    return products.find(p => p.id === productId) || null;
}

export async function addProduct(product: Omit<Product, 'id' | 'status'>): Promise<Product> {
    const products = await readData<Product>('products');
    const newProduct: Product = {
        id: `prod-${Date.now()}`,
        ...product,
        status: product.quantity > 0 ? (product.quantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque',
    };
    products.push(newProduct);
    await writeData('products', products);
    
    await logStockMovement(newProduct.id, product.name, 'Entrada', 'Entrada Inicial', product.quantity, 0);
    await logActivity('Produto Adicionado', `Novo produto "${product.name}" (ID: ${newProduct.id}) foi adicionado com quantidade ${product.quantity}.`);
    revalidatePath('/dashboard/inventory');
    return newProduct;
}

export async function updateProduct(productId: string, productData: Partial<Product>): Promise<Product> {
    let products = await readData<Product>('products');
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
        throw new Error(`Product with ID ${productId} not found.`);
    }
    
    const oldProductData = products[productIndex];
    const quantityBefore = oldProductData.quantity;

    const updatedProduct = { ...oldProductData, ...productData };

    if (productData.quantity !== undefined && productData.quantity !== quantityBefore) {
        updatedProduct.status = productData.quantity > 0 ? (productData.quantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque';
        const quantityChange = productData.quantity - quantityBefore;
        const type = quantityChange > 0 ? 'Entrada' : 'Saída';
        await logStockMovement(productId, productData.name || oldProductData.name, type, 'Ajuste de Inventário', quantityChange, quantityBefore);
    }
    
    products[productIndex] = updatedProduct;
    await writeData('products', products);
    
    await logActivity('Produto Atualizado', `Produto "${updatedProduct.name}" (ID: ${productId}) foi atualizado.`);
    revalidatePath('/dashboard/inventory');
    return updatedProduct;
}

// --- UNITS ACTIONS ---

export const getUnits = cache(async (): Promise<Unit[]> => {
    return await readData<Unit>('units');
});

export async function getUnit(unitId: string): Promise<Unit | null> {
    const units = await getUnits();
    return units.find(u => u.id === unitId) || null;
}

export async function addUnit(unit: Omit<Unit, 'id'>) {
    const units = await readData<Unit>('units');
    const newUnit: Unit = {
        id: `unit-${Date.now()}`,
        ...unit
    };
    units.push(newUnit);
    await writeData('units', units);
    
    await logActivity('Unidade Adicionada', `Nova unidade "${unit.name}" (ID: ${newUnit.id}) foi adicionada.`);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/orders/new');
}

export async function updateUnit(unitId: string, unitData: Partial<Unit>) {
    let units = await readData<Unit>('units');
    const unitIndex = units.findIndex(u => u.id === unitId);
    if (unitIndex === -1) throw new Error('Unit not found');
    
    units[unitIndex] = { ...units[unitIndex], ...unitData };
    await writeData('units', units);

    await logActivity('Unidade Atualizada', `Unidade "${unitData.name}" (ID: ${unitId}) foi atualizada.`);
    revalidatePath('/dashboard/units');
    revalidatePath(`/dashboard/units/${unitId}`);
}

// --- PATIENTS ACTIONS ---

export const getPatients = cache(async (filter: PatientFilter = 'active'): Promise<Patient[]> => {
    const allPatients = await readData<Patient>('patients');
    
    switch (filter) {
        case 'active':
            return allPatients.filter(p => p.status === 'Ativo');
        case 'inactive':
            return allPatients.filter(p => p.status !== 'Ativo');
        case 'insulin':
            return allPatients.filter(p => p.isAnalogInsulinUser && p.status === 'Ativo');
        case 'diapers':
             return allPatients.filter(p => p.municipalItems?.includes('Fraldas') && p.status === 'Ativo');
        case 'bedridden':
            return allPatients.filter(p => p.isBedridden && p.status === 'Ativo');
        case 'legal':
            return allPatients.filter(p => p.mandateType === 'Legal' && p.status === 'Ativo');
        case 'municipal':
            return allPatients.filter(p => p.mandateType === 'Municipal' && p.status === 'Ativo');
        case 'all':
        default:
            return allPatients;
    }
});

export const getAllPatients = cache(async (): Promise<Patient[]> => {
    return await readData<Patient>('patients');
});

export async function getPatient(patientId: string): Promise<Patient | null> {
    const patients = await getAllPatients();
    return patients.find(p => p.id === patientId) || null;
}

export async function addPatient(patient: Omit<Patient, 'id' | 'status'>) {
    const patients = await readData<Patient>('patients');
    const newPatient: Patient = {
        id: `pat-${Date.now()}`,
        status: 'Ativo' as PatientStatus,
        ...patient,
    };
    patients.push(newPatient);
    await writeData('patients', patients);
    
    await logActivity('Paciente Adicionado', `Novo paciente "${patient.name}" (ID: ${newPatient.id}) foi cadastrado.`);
    revalidatePath('/dashboard/patients');
}

export async function updatePatient(patientId: string, patientData: Partial<Patient>) {
    let patients = await readData<Patient>('patients');
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) throw new Error('Patient not found');

    patients[patientIndex] = { ...patients[patientIndex], ...patientData };
    await writeData('patients', patients);

    await logActivity('Paciente Atualizado', `Paciente "${patientData.name}" (ID: ${patientId}) foi atualizado.`);
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function updatePatientStatus(patientId: string, status: PatientStatus) {
    let patients = await readData<Patient>('patients');
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) throw new Error('Patient not found');

    const patientName = patients[patientIndex].name;
    patients[patientIndex].status = status;
    await writeData('patients', patients);
    
    await logActivity('Status do Paciente Alterado', `Status do paciente "${patientName}" (ID: ${patientId}) foi alterado para "${status}".`);
    revalidatePath('/dashboard/patients');
}

// --- ORDERS / DISPENSATIONS (STOCK UPDATE) ---

async function processStockUpdate(items: (Order['items'] | Dispensation['items']), reason: StockMovement['reason'], relatedId: string) {
    let products = await readData<Product>('products');
    let productsUpdated = false;

    for (const item of items) {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex > -1) {
            const product = products[productIndex];
            const quantityBefore = product.quantity;
            const newQuantity = quantityBefore - item.quantity;
            
            if (newQuantity < 0) {
                throw new Error(`Estoque insuficiente para o produto ${product.name}. Apenas ${quantityBefore} disponíveis.`);
            }

            product.quantity = newQuantity;
            product.status = newQuantity > 0 ? (newQuantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque';
            products[productIndex] = product;
            productsUpdated = true;

            await logStockMovement(item.productId, item.name, 'Saída', reason, -item.quantity, quantityBefore, relatedId);
        } else {
            throw new Error(`Produto com ID ${item.productId} não encontrado.`);
        }
    }

    if (productsUpdated) {
        await writeData('products', products);
    }
}


// --- ORDERS ACTIONS ---

export async function addOrder(orderData: Omit<Order, 'id' | 'status' | 'sentDate' | 'itemCount'>): Promise<Order> {
    const newOrderId = `ord-${Date.now()}`;
    await processStockUpdate(orderData.items, 'Saída por Remessa', newOrderId);
    
    const orders = await readData<Order>('orders');
    const newOrder: Order = {
        id: newOrderId,
        ...orderData,
        sentDate: new Date().toISOString(),
        status: 'Em Trânsito',
        itemCount: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
    };
    orders.unshift(newOrder);
    await writeData('orders', orders);
    
    await logActivity('Remessa Criada', `Nova remessa (ID: ${newOrder.id}) com ${newOrder.itemCount} itens foi criada para a unidade "${newOrder.unitName}".`);
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');
    
    return newOrder;
}

export const getOrdersForUnit = cache(async (unitId: string): Promise<Order[]> => {
    const allOrders = await readData<Order>('orders');
    return allOrders.filter(o => o.unitId === unitId);
});

export const getOrders = cache(async (): Promise<Order[]> => {
    return await readData<Order>('orders');
});

export async function getOrder(orderId: string): Promise<Order | null> {
    const orders = await getOrders();
    return orders.find(o => o.id === orderId) || null;
}

// --- DISPENSATIONS ACTIONS ---

export async function addDispensation(dispensationData: Omit<Dispensation, 'id' | 'date'>): Promise<Dispensation> {
    const newDispensationId = `disp-${Date.now()}`;
    await processStockUpdate(dispensationData.items, 'Saída por Dispensação', newDispensationId);
    
    const dispensations = await readData<Dispensation>('dispensations');
    const newDispensation: Dispensation = {
        id: newDispensationId,
        ...dispensationData,
        date: new Date().toISOString(),
    };
    dispensations.unshift(newDispensation);
    await writeData('dispensations', dispensations);

    const totalItems = dispensationData.items.reduce((sum, item) => sum + item.quantity, 0);
    await logActivity('Dispensação Registrada', `Nova dispensação (ID: ${newDispensation.id}) com ${totalItems} itens foi registrada para o paciente "${dispensationData.patient.name}".`);
    revalidatePath(`/dashboard/patients/${dispensationData.patientId}`);
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');

    return newDispensation;
}

export const getDispensationsForPatient = cache(async (patientId: string): Promise<Dispensation[]> => {
    const allDispensations = await readData<Dispensation>('dispensations');
    return allDispensations.filter(d => d.patientId === patientId);
});

export const getAllDispensations = cache(async (): Promise<Dispensation[]> => {
    return await readData<Dispensation>('dispensations');
});

export async function getDispensation(dispensationId: string): Promise<Dispensation | null> {
    const dispensations = await getAllDispensations();
    return dispensations.find(d => d.id === dispensationId) || null;
}

// --- REPORTS ACTIONS ---

export const getStockMovements = cache(async (): Promise<StockMovement[]> => {
    return await readData<StockMovement>('stockMovements');
});

// --- DATA RESET ---
export async function resetAllData() {
    const currentUser = await getCurrentUser();
    if (currentUser?.accessLevel !== 'Admin') {
        throw new Error("Acesso não autorizado para limpar dados.");
    }
    
    // Lista de todas as chaves de dados
    const dataKeys = ['products', 'units', 'patients', 'orders', 'dispensations', 'stockMovements', 'logs'];

    for (const key of dataKeys) {
        await writeData(key, []);
    }

    // A chave de usuários não é limpa, mas o primeiro usuário pode ser resetado se necessário
    // Por segurança, vamos apenas registrar a ação
    await logActivity('Reset de Dados', `Todos os dados da aplicação foram limpos pelo administrador ${currentUser.email}.`);
    
    // Revalidar caminhos para refletir os dados limpos na UI
    revalidatePath('/dashboard', 'layout');
}

    