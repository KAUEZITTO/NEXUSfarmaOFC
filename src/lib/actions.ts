
'use server';

import { Product, Unit, Patient, Order, Dispensation, StockMovement, PatientStatus, User, Role, SubRole, KnowledgeBaseItem } from './types';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as jose from 'jose';
import bcrypt from 'bcrypt';
import { promises as fs } from 'fs';
import path from 'path';
import { readData, writeData } from './data';
import knowledgeBaseData from '@/data/knowledge-base.json';

const uploadPath = path.join(process.cwd(), 'public', 'uploads');
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development');
const saltRounds = 10;

// This function is now self-contained within the actions file to avoid build issues.
async function getCurrentUserAction(): Promise<User | null> {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;

    try {
        const { payload } = await jose.jwtVerify(sessionCookie, secret);
        const userId = payload.sub;
        if (!userId) return null;
        
        const allUsers = await readData<User>('users');
        const user = allUsers.find(u => u.id === userId);
        
        if (user) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword as User;
        }
        return null;

    } catch (error) {
        return null;
    }
}


// --- AUTH ACTIONS ---

export async function register(userData: Omit<User, 'id' | 'password' | 'accessLevel'> & { password: string }): Promise<{ success: boolean; message: string }> {
    try {
        const users = await readData<User>('users');
        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: 'Este e-mail já está em uso.' };
        }

        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        
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
        // On registration, the user is not logged in, so the action is performed by the "Sistema".
        await logActivity('Cadastro de Usuário', `Novo usuário cadastrado: ${userData.email} com cargo ${userData.role} e nível ${accessLevel}.`, 'Sistema');

        return { success: true, message: 'Conta criada com sucesso!' };
    } catch (error) {
        console.error('Registration Error:', error);
        return { success: false, message: 'Não foi possível criar a conta. Tente novamente mais tarde.' };
    }
}


export async function login(formData: FormData): Promise<{ success: boolean; message?: string }> {
    try {
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

        const token = await new jose.SignJWT({ id: user.id, accessLevel: user.accessLevel })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setSubject(user.id)
            .setIssuer('urn:nexusfarma')
            .setAudience('urn:nexusfarma:users')
            .setExpirationTime('7d')
            .sign(secret);
        
        cookies().set('session', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
        await logActivity('Login', `Usuário fez login: ${user.email}`, user.email);

        // Return success to the client, which will handle the redirect.
        return { success: true };

    } catch (error) {
        console.error("Login error:", error);
        // Return a generic error message to the client.
        return { success: false, message: 'Ocorreu um erro inesperado durante o login.'}
    }
}


export async function logout() {
  const currentUser = await getCurrentUserAction();
  if (currentUser) {
    await logActivity('Logout', `Usuário ${currentUser.email} saiu.`, currentUser.email);
  }
  cookies().delete('session');
  redirect('/');
}

// --- ACTIVITY LOGGING ---

type ActivityLog = {
    user: string;
    action: string;
    details: string;
    timestamp: string;
}

// Internal helper, not exported as a server action
async function logActivity(action: string, details: string, userEmail: string) {
    const logs = await readData<ActivityLog>('logs');
    const logEntry: ActivityLog = {
        user: userEmail,
        action,
        details,
        timestamp: new Date().toISOString(),
    };
    logs.unshift(logEntry); 
    await writeData('logs', logs.slice(0, 1000)); 
}

// --- STOCK MOVEMENT LOGGING ---

// Internal helper, not exported as a server action
async function logStockMovement(
    productId: string,
    productName: string,
    type: StockMovement['type'],
    reason: StockMovement['reason'],
    quantityChange: number,
    quantityBefore: number,
    userEmail: string,
    relatedId?: string
) {
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
        user: userEmail
    };
    movements.unshift(movement);
    await writeData('stockMovements', movements);
}

// --- KNOWLEDGE BASE ---
export async function getKnowledgeBase(): Promise<KnowledgeBaseItem[]> {
    // Directly return the imported JSON data. This is safe.
    return knowledgeBaseData;
}


// --- IMAGE UPLOAD ---
export async function uploadImage(formData: FormData): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
        const file = formData.get('image') as File;
        if (!file) {
            return { success: false, error: 'Nenhum arquivo enviado.' };
        }

        await fs.mkdir(uploadPath, { recursive: true });

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

export async function addProduct(product: Omit<Product, 'id' | 'status'>): Promise<Product> {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) throw new Error('Acesso não autorizado.');

    const products = await readData<Product>('products');
    const newProduct: Product = {
        id: `prod-${Date.now()}`,
        ...product,
        status: product.quantity > 0 ? (product.quantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque',
    };
    products.push(newProduct);
    await writeData('products', products);
    
    await logStockMovement(newProduct.id, product.name, 'Entrada', 'Entrada Inicial', product.quantity, 0, currentUser.email);
    await logActivity('Produto Adicionado', `Novo produto "${product.name}" (ID: ${newProduct.id}) foi adicionado com quantidade ${product.quantity}.`, currentUser.email);
    revalidatePath('/dashboard/inventory');
    return newProduct;
}

export async function updateProduct(productId: string, productData: Partial<Product>): Promise<Product> {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) throw new Error('Acesso não autorizado.');
    
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
        await logStockMovement(productId, productData.name || oldProductData.name, 'Ajuste', 'Ajuste de Inventário', quantityChange, quantityBefore, currentUser.email);
    }
    
    products[productIndex] = updatedProduct;
    await writeData('products', products);
    
    await logActivity('Produto Atualizado', `Produto "${updatedProduct.name}" (ID: ${productId}) foi atualizado.`, currentUser.email);
    revalidatePath('/dashboard/inventory');
    revalidatePath(`/labels/${productId}`);
    return updatedProduct;
}

// --- UNITS ACTIONS ---

export async function addUnit(unit: Omit<Unit, 'id'>) {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) throw new Error('Acesso não autorizado.');

    const units = await readData<Unit>('units');
    const newUnit: Unit = {
        id: `unit-${Date.now()}`,
        ...unit
    };
    units.push(newUnit);
    await writeData('units', units);
    
    await logActivity('Unidade Adicionada', `Nova unidade "${unit.name}" (ID: ${newUnit.id}) foi adicionada.`, currentUser.email);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/orders/new');
}

export async function updateUnit(unitId: string, unitData: Partial<Unit>) {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) throw new Error('Acesso não autorizado.');

    let units = await readData<Unit>('units');
    const unitIndex = units.findIndex(u => u.id === unitId);
    if (unitIndex === -1) throw new Error('Unit not found');
    
    units[unitIndex] = { ...units[unitIndex], ...unitData };
    await writeData('units', units);

    await logActivity('Unidade Atualizada', `Unidade "${unitData.name}" (ID: ${unitId}) foi atualizada.`, currentUser.email);
    revalidatePath('/dashboard/units');
    revalidatePath(`/dashboard/units/${unitId}`);
}

// --- PATIENTS ACTIONS ---

export async function addPatient(patient: Omit<Patient, 'id' | 'status'>) {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) throw new Error('Acesso não autorizado.');

    const patients = await readData<Patient>('patients');
    const newPatient: Patient = {
        id: `pat-${Date.now()}`,
        status: 'Ativo' as PatientStatus,
        ...patient,
    };
    patients.push(newPatient);
    await writeData('patients', patients);
    
    await logActivity('Paciente Adicionado', `Novo paciente "${patient.name}" (ID: ${newPatient.id}) foi cadastrado.`, currentUser.email);
    revalidatePath('/dashboard/patients');
}

export async function updatePatient(patientId: string, patientData: Partial<Patient>) {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) throw new Error('Acesso não autorizado.');

    let patients = await readData<Patient>('patients');
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) throw new Error('Patient not found');

    patients[patientIndex] = { ...patients[patientIndex], ...patientData };
    await writeData('patients', patients);

    await logActivity('Paciente Atualizado', `Paciente "${patientData.name}" (ID: ${patientId}) foi atualizado.`, currentUser.email);
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function updatePatientStatus(patientId: string, status: PatientStatus) {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) throw new Error('Acesso não autorizado.');

    let patients = await readData<Patient>('patients');
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) throw new Error('Patient not found');

    const patientName = patients[patientIndex].name;
    patients[patientIndex].status = status;
    await writeData('patients', patients);
    
    await logActivity('Status do Paciente Alterado', `Status do paciente "${patientName}" (ID: ${patientId}) foi alterado para "${status}".`, currentUser.email);
    revalidatePath('/dashboard/patients');
}

// --- ORDERS / DISPENSATIONS (STOCK UPDATE) ---

// Internal helper, not exported.
async function processStockUpdate(items: (Order['items'] | Dispensation['items']), reason: StockMovement['reason'], relatedId: string, userEmail: string) {
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

            await logStockMovement(item.productId, item.name, 'Saída', reason, -item.quantity, quantityBefore, userEmail, relatedId);
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
    const currentUser = await getCurrentUserAction();
    if (!currentUser) throw new Error('Acesso não autorizado.');

    const newOrderId = `ord-${Date.now()}`;
    await processStockUpdate(orderData.items, 'Saída por Remessa', newOrderId, currentUser.email);
    
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
    
    await logActivity('Remessa Criada', `Nova remessa (ID: ${newOrder.id}) com ${newOrder.itemCount} itens foi criada para a unidade "${newOrder.unitName}".`, currentUser.email);
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');
    
    return newOrder;
}

// --- DISPENSATIONS ACTIONS ---

export async function addDispensation(dispensationData: Omit<Dispensation, 'id' | 'date'>): Promise<Dispensation> {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) throw new Error('Acesso não autorizado.');
    
    const newDispensationId = `disp-${Date.now()}`;
    await processStockUpdate(dispensationData.items, 'Saída por Dispensação', newDispensationId, currentUser.email);
    
    const dispensations = await readData<Dispensation>('dispensations');
    const newDispensation: Dispensation = {
        id: newDispensationId,
        ...dispensationData,
        date: new Date().toISOString(),
    };
    dispensations.unshift(newDispensation);
    await writeData('dispensations', dispensations);

    const totalItems = dispensationData.items.reduce((sum, item) => sum + item.quantity, 0);
    await logActivity('Dispensação Registrada', `Nova dispensação (ID: ${newDispensation.id}) com ${totalItems} itens foi registrada para o paciente "${dispensationData.patient.name}".`, currentUser.email);
    revalidatePath(`/dashboard/patients/${dispensationData.patientId}`);
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');

    return newDispensation;
}

// --- DATA RESET ---
export async function resetAllData() {
    const currentUser = await getCurrentUserAction();
    if (!currentUser || currentUser.accessLevel !== 'Admin') {
        throw new Error("Acesso não autorizado para limpar dados.");
    }
    
    const dataKeys = ['products', 'units', 'patients', 'orders', 'dispensations', 'stockMovements', 'logs'];

    for (const key of dataKeys) {
        await writeData(key, []);
    }
    
    await logActivity('Reset de Dados', `Todos os dados da aplicação foram limpos pelo administrador ${currentUser.email}.`, currentUser.email);
    
    revalidatePath('/dashboard', 'layout');
}
