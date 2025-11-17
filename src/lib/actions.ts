
'use server';

import { revalidatePath } from 'next/cache';
import { readData, writeData, getProducts, getAllUsers, getSectorDispensations, getUnits as getUnitsFromDb, getHospitalPatients as getHospitalPatientsFromDb, getHospitalPatientDispensations as getHospitalPatientDispensationsFromDb } from './data';
import type { User, Product, Unit, Patient, Order, OrderItem, Dispensation, DispensationItem, StockMovement, PatientStatus, Role, SubRole, AccessLevel, OrderType, PatientFile, OrderStatus, UserLocation, SectorDispensation, HospitalSector as Sector, HospitalOrderTemplateItem, HospitalPatient, HospitalPatientDispensation } from './types';
import { getCurrentUser } from './session';
import { generatePdf } from '@/lib/pdf-generator';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin';

// --- UTILITIES ---
const generateId = (prefix: string) => `${prefix}_${new Date().getTime()}_${Math.random().toString(36).substring(2, 8)}`;
const generateNumericId = (): string => {
    const timestamp = Date.now().toString(); // e.g., "1678886400000"
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return (timestamp.slice(-3) + random).padStart(6, '0').slice(0, 6);
};


const logStockMovement = async (
  productId: string, 
  productName: string, 
  type: StockMovement['type'], 
  reason: StockMovement['reason'], 
  quantityChange: number, 
  quantityBefore: number,
  movementDate: string,
  relatedId?: string
) => {
  const session = await getCurrentUser();
  const movements = await readData<StockMovement>('stockMovements');
  const userName = session?.name || 'Sistema';

  const newMovement: StockMovement = {
    id: generateId('mov'),
    productId,
    productName,
    type,
    reason,
    quantityChange,
    quantityBefore,
    quantityAfter: quantityBefore + quantityChange,
    date: movementDate,
    user: userName,
    relatedId
  };
  await writeData('stockMovements', [newMovement, ...movements]);
};


// --- PRODUCT ACTIONS ---
export async function addProduct(productData: Omit<Product, 'id' | 'status'>): Promise<Product> {
    const products = await getProducts('all');
    const newProduct: Product = {
        ...productData,
        id: generateId('prod'),
        status: productData.quantity === 0 ? 'Sem Estoque' : productData.quantity < 20 ? 'Baixo Estoque' : 'Em Estoque',
    };
    await writeData('products', [newProduct, ...products]);
    await logStockMovement(newProduct.id, newProduct.name, 'Entrada', 'Entrada Inicial', newProduct.quantity, 0, new Date().toISOString());
    revalidatePath('/dashboard/inventory');
    return newProduct;
}

export async function updateProduct(productId: string, productData: Partial<Omit<Product, 'id' | 'status'>>): Promise<Product> {
    const products = await getProducts('all');
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) throw new Error('Produto não encontrado.');

    const originalProduct = products[productIndex];
    const updatedProduct = { 
        ...originalProduct, 
        ...productData, 
        status: productData.quantity === 0 ? 'Sem Estoque' : (productData.quantity ?? originalProduct.quantity) < 20 ? 'Baixo Estoque' : 'Em Estoque' 
    } as Product;
    
    if (productData.quantity !== undefined && productData.quantity !== originalProduct.quantity) {
        const quantityChange = productData.quantity - originalProduct.quantity;
        const type = quantityChange > 0 ? 'Entrada' : 'Saída';
        await logStockMovement(productId, updatedProduct.name, type, 'Ajuste de Inventário', quantityChange, originalProduct.quantity, new Date().toISOString());
    }

    products[productIndex] = updatedProduct;
    await writeData('products', products);
    revalidatePath('/dashboard/inventory');
    revalidatePath(`/labels/${productId}`);
    return updatedProduct;
}

export async function zeroStock(category?: Product['category']): Promise<{ success: boolean, message: string }> {
    const session = await getCurrentUser();
    const userName = session?.name || 'Sistema';
    const products = await getProducts('all');
    const movements: StockMovement[] = [];
    const movementDate = new Date().toISOString();
    let count = 0;

    const productsToUpdate = category && category !== 'Todos'
        ? products.filter(p => p.category === category)
        : products;
    
    if (productsToUpdate.length === 0) {
        return { success: false, message: 'Nenhum produto encontrado para a categoria selecionada.' };
    }

    productsToUpdate.forEach(p => {
        if (p.quantity !== 0) {
            const originalQuantity = p.quantity;
            p.quantity = 0;
            p.status = 'Sem Estoque';
            count++;
            
            const newMovement: StockMovement = {
                id: generateId('mov'),
                productId: p.id,
                productName: p.name,
                type: 'Saída',
                reason: 'Ajuste de Inventário (Zerar)',
                quantityChange: -originalQuantity,
                quantityBefore: originalQuantity,
                quantityAfter: 0,
                date: movementDate,
                user: userName,
                relatedId: `zero_stock_${category || 'all'}`
            };
            movements.push(newMovement);
        }
    });

    if (count > 0) {
        await writeData('products', products);
        const existingMovements = await readData<StockMovement>('stockMovements');
        await writeData('stockMovements', [...movements, ...existingMovements]);
        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/reports');
    }

    const categoryText = category && category !== 'Todos' ? `da categoria "${category}"` : 'completo';
    return { success: true, message: `${count} produto(s) tiveram seu estoque zerado. O zeramento de estoque ${categoryText} foi concluído.` };
}

export async function deleteProducts(productIds: string[]): Promise<{ success: boolean; message: string }> {
    const allProducts = await getProducts('all');
    const productsToDelete = allProducts.filter(p => productIds.includes(p.id));
    const remainingProducts = allProducts.filter(p => !productIds.includes(p.id));
    
    if (productsToDelete.length === 0) {
        return { success: false, message: "Nenhum produto encontrado para exclusão." };
    }

    const movements: StockMovement[] = [];
    const session = await getCurrentUser();
    const userName = session?.name || 'Sistema';
    const movementDate = new Date().toISOString();

    for (const product of productsToDelete) {
        movements.push({
            id: generateId('mov'),
            productId: product.id,
            productName: product.name,
            type: 'Saída',
            reason: 'Exclusão de Produto',
            quantityChange: -product.quantity,
            quantityBefore: product.quantity,
            quantityAfter: 0,
            date: movementDate,
            user: userName,
            relatedId: `delete_prod_${product.id}`
        });
    }

    const existingMovements = await readData<StockMovement>('stockMovements');
    await writeData('stockMovements', [...movements, ...existingMovements]);
    await writeData('products', remainingProducts);

    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/reports');

    return { success: true, message: `${productsToDelete.length} produto(s) foram excluídos permanentemente.` };
}


// --- UNIT ACTIONS ---
export async function addUnit(unitData: Omit<Unit, 'id'>) {
    const units = await readData<Unit>('units');
    const newUnit: Unit = {
        ...unitData,
        id: generateId('unit'),
    };
    await writeData('units', [...units, newUnit]);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/orders/new');
}

export async function updateUnit(unitId: string, unitData: Partial<Omit<Unit, 'id'>>) {
    const units = await readData<Unit>('units');
    const unitIndex = units.findIndex(u => u.id === unitId);
    if (unitIndex === -1) throw new Error('Unidade não encontrada.');
    units[unitIndex] = { ...units[unitIndex], ...unitData };
    await writeData('units', units);
    revalidatePath('/dashboard/units');
    revalidatePath(`/dashboard/units/${unitId}`);
}

export async function deleteUnit(unitId: string): Promise<{ success: boolean; message?: string }> {
    const units = await readData<Unit>('units');
    const orders = await readData<Order>('orders');

    if (orders.some(order => order.unitId === unitId)) {
        return { success: false, message: 'Não é possível excluir unidades que possuem pedidos associados.' };
    }

    const updatedUnits = units.filter(u => u.id !== unitId);
    await writeData('units', updatedUnits);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/orders/new');
    return { success: true };
}


// --- PATIENT ACTIONS ---
export async function addPatient(patientData: Omit<Patient, 'id' | 'status' | 'createdAt'>) {
    const patients = await readData<Patient>('patients');
    const newPatient: Patient = {
        ...patientData,
        id: generateId('pat'),
        status: 'Ativo',
        createdAt: new Date().toISOString(),
    };
    await writeData('patients', [newPatient, ...patients]);
    revalidatePath('/dashboard/patients');
}

export async function updatePatient(patientId: string, patientData: Partial<Omit<Patient, 'id'>>): Promise<Patient> {
    const patients = await readData<Patient>('patients');
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) throw new Error('Paciente não encontrado.');
    
    patients[patientIndex] = { 
        ...patients[patientIndex], 
        ...patientData,
    };
    await writeData('patients', patients);
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${patientId}`);
    return patients[patientIndex];
}

export async function updatePatientStatus(patientId: string, status: PatientStatus) {
    const patients = await readData<Patient>('patients');
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) throw new Error('Paciente não encontrado.');
    patients[patientIndex].status = status;
    await writeData('patients', patients);
    revalidatePath('/dashboard/patients');
}

export async function deletePatient(patientId: string): Promise<{ success: boolean; message?: string }> {
    const patients = await readData<Patient>('patients');
    const dispensations = await readData<Dispensation>('dispensations');

    if (dispensations.some(d => d.patientId === patientId)) {
        return { success: false, message: "Não é possível excluir pacientes com histórico de dispensação. Torne-o inativo." };
    }

    const updatedPatients = patients.filter(p => p.id !== patientId);
    await writeData('patients', updatedPatients);
    
    revalidatePath('/dashboard/patients');
    return { success: true };
}


// --- ORDER ACTIONS ---
export async function addOrder(orderData: { unitId: string; unitName?: string; orderType: OrderType, items: OrderItem[]; notes?: string; sentDate?: string; }): Promise<Order> {
    const session = await getCurrentUser();
    const orders = await readData<Order>('orders');
    const products = await getProducts('CAF');

    let unitName = orderData.unitName;
    if (!unitName) {
        const units = await getUnitsFromDb();
        const unit = units.find(u => u.id === orderData.unitId);
        if (!unit) throw new Error("Unit not found for order");
        unitName = unit.name;
    }


    const sentDate = orderData.sentDate ? new Date(orderData.sentDate).toISOString() : new Date().toISOString();

    const newOrder: Order = {
        id: generateNumericId(),
        unitId: orderData.unitId,
        unitName: unitName,
        items: orderData.items,
        orderType: orderData.orderType,
        notes: orderData.notes,
        sentDate: sentDate,
        status: 'Em análise',
        itemCount: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
        creatorName: session?.name || 'Usuário Desconhecido',
    };

    // If order is created by CAF, deduct stock. If by Hospital, it's a request, so don't deduct.
    const isCafUser = session?.location === 'CAF' || session?.subRole === 'Coordenador';
    if (isCafUser) {
        for (const item of newOrder.items) {
            const productIndex = products.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                const originalQuantity = products[productIndex].quantity;
                products[productIndex].quantity -= item.quantity;
                products[productIndex].status = products[productIndex].quantity <= 0 ? 'Sem Estoque' : products[productIndex].quantity < 20 ? 'Baixo Estoque' : 'Em Estoque';
                await logStockMovement(item.productId, item.name, 'Saída', 'Saída por Remessa', -item.quantity, originalQuantity, sentDate, newOrder.id);
            }
        }
        await writeData('products', products);
    }

    await writeData('orders', [newOrder, ...orders].sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime()));

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/hospital/orders');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/reports');
    revalidatePath(`/dashboard/units/${orderData.unitId}`);
    
    return newOrder;
}

export async function deleteOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
    const allOrders = await readData<Order>('orders');
    const allProducts = await getProducts('all');

    const orderToDelete = allOrders.find(o => o.id === orderId);
    if (!orderToDelete) {
        return { success: false, message: 'Pedido não encontrado.' };
    }

    const reversalDate = new Date().toISOString();

    for (const item of orderToDelete.items) {
        const productIndex = allProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            const originalQuantity = allProducts[productIndex].quantity;
            allProducts[productIndex].quantity += item.quantity;
            allProducts[productIndex].status = allProducts[productIndex].quantity > 0 ? (allProducts[productIndex].quantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque';
            await logStockMovement(item.productId, item.name, 'Entrada', 'Estorno de Remessa', item.quantity, originalQuantity, reversalDate, orderToDelete.id);
        } else {
             console.warn(`Produto com ID ${item.productId} não encontrado durante estorno. Criando novo produto.`);
            const newProduct: Product = {
                id: item.productId,
                name: item.name,
                category: item.category as Product['category'],
                quantity: item.quantity,
                expiryDate: item.expiryDate || '',
                batch: item.batch,
                presentation: item.presentation as Product['presentation'],
                status: item.quantity > 0 ? 'Em Estoque' : 'Sem Estoque',
                location: 'CAF'
            };
            allProducts.push(newProduct);
            await logStockMovement(newProduct.id, newProduct.name, 'Entrada', 'Estorno de Remessa', newProduct.quantity, 0, reversalDate, orderToDelete.id);
        }
    }

    const updatedOrders = allOrders.filter(o => o.id !== orderId);
    await writeData('products', allProducts);
    await writeData('orders', updatedOrders);

    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/units/${orderToDelete.unitId}`);
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/reports');

    return { success: true };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const orders = await readData<Order>('orders');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error('Pedido não encontrado.');
    
    orders[orderIndex].status = status;
    if (status === 'Atendido') {
        orders[orderIndex].deliveryDate = new Date().toISOString();
    } else {
        delete orders[orderIndex].deliveryDate;
    }

    await writeData('orders', orders);
    
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/hospital/orders');
    revalidatePath(`/dashboard/units/${orders[orderIndex].unitId}`);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/reports');
}


// --- DISPENSATION ACTIONS ---
export async function addDispensation(dispensationData: { patientId: string; patient: Omit<Patient, 'files'>; items: DispensationItem[]; notes?: string; }): Promise<Dispensation> {
    const session = await getCurrentUser();
    const dispensations = await readData<Dispensation>('dispensations');
    const products = await getProducts('CAF');
    const dispensationDate = new Date().toISOString();

    const { files, ...patientForDispensation } = dispensationData.patient;
    
    const newDispensation: Dispensation = {
      id: generateNumericId(),
      patientId: dispensationData.patientId,
      patient: patientForDispensation,
      date: dispensationDate,
      items: dispensationData.items,
      creatorName: session?.name || 'Usuário Desconhecido',
      notes: dispensationData.notes,
    };

    for (const item of newDispensation.items) {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            const originalQuantity = products[productIndex].quantity;
            products[productIndex].quantity -= item.quantity;
            products[productIndex].status = products[productIndex].quantity <= 0 ? 'Sem Estoque' : products[productIndex].quantity < 20 ? 'Baixo Estoque' : 'Em Estoque';
            await logStockMovement(item.productId, item.name, 'Saída', 'Saída por Dispensação', -item.quantity, originalQuantity, dispensationDate, newDispensation.id);
        }
    }

    await writeData('products', products);
    await writeData('dispensations', [newDispensation, ...dispensations]);
    
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${dispensationData.patientId}`);
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/reports');
    revalidatePath('/dashboard');
    
    return newDispensation;
}

export async function deleteDispensation(dispensationId: string): Promise<{ success: boolean; message?: string }> {
    const allDispensations = await readData<Dispensation>('dispensations');
    const allProducts = await getProducts('all');

    const dispensationToDelete = allDispensations.find(d => d.id === dispensationId);
    if (!dispensationToDelete) {
        return { success: false, message: 'Dispensação não encontrada.' };
    }

    const reversalDate = new Date().toISOString();

    for (const item of dispensationToDelete.items) {
        const productIndex = allProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            const originalQuantity = allProducts[productIndex].quantity;
            allProducts[productIndex].quantity += item.quantity;
            allProducts[productIndex].status = allProducts[productIndex].quantity > 0 ? (allProducts[productIndex].quantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque';
            await logStockMovement(item.productId, item.name, 'Entrada', 'Estorno de Dispensação', item.quantity, originalQuantity, reversalDate, dispensationToDelete.id);
        } else {
             console.warn(`Produto com ID ${item.productId} não encontrado durante estorno de dispensação.`);
        }
    }

    const updatedDispensations = allDispensations.filter(d => d.id !== dispensationId);
    await writeData('products', allProducts);
    await writeData('dispensations', updatedDispensations);

    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${dispensationToDelete.patientId}`);
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/reports');
    revalidatePath('/dashboard');

    return { success: true };
}


// --- USER PROFILE & MANAGEMENT ACTIONS ---
const avatarColors = [
  'hsl(211 100% 50%)', // Blue
  'hsl(39 100% 50%)', // Orange
  'hsl(0 84.2% 60.2%)', // Red
  'hsl(142.1 76.2% 36.3%)', // Green
  'hsl(262.1 83.3% 57.8%)', // Purple
  'hsl(314.5 72.4% 57.3%)', // Pink
  'hsl(198.8 93.4% 42%)' // Teal
];

export async function register(data: { name: string, email: string; password: string; birthdate: string; role: Role; subRole?: SubRole; location?: UserLocation; }) {
    const { name, email, password, birthdate, role, subRole, location } = data;

    try {
        const adminAuth = getAdminApp(); // Garantir que o app admin está inicializado
        const auth = getAuth(adminAuth);

        const users = await getAllUsers();

        if (users.some(u => u.email === email)) {
            return { success: false, message: 'Este email já está em uso.' };
        }
        
        try {
            await auth.getUserByEmail(email);
            return { success: false, message: 'Este email já está registrado no sistema de autenticação.' };
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }

        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: name,
        });
        
        const isFirstUser = users.length === 0;

        const userLocation = subRole === 'Coordenador' ? 'CAF' : location;
        if (!userLocation) {
            return { success: false, message: 'O local de trabalho é obrigatório para este cargo.' };
        }
        
        let locationId;
        if (userLocation === 'Hospital') {
            const units = await getUnitsFromDb();
            const hospitalUnit = units.find(u => u.name.toLowerCase().includes('hospital'));
            if(hospitalUnit) locationId = hospitalUnit.id;
        }

        const newUser: User = {
            id: userRecord.uid,
            email,
            name,
            birthdate,
            location: userLocation,
            locationId,
            role,
            subRole: role === 'Farmacêutico' ? subRole : undefined,
            accessLevel: isFirstUser ? 'Admin' : 'User',
            avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
        };

        await writeData<User>('users', [...users, newUser]);
        revalidatePath('/dashboard/user-management');

        return { success: true, message: 'Usuário registrado com sucesso.' };

    } catch (error: any) {
        console.error("Registration error:", error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, message: 'Este email já está em uso.' };
        }
        if (error.code === 'auth/weak-password') {
            return { success: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
        }
        return { success: false, message: `Ocorreu um erro desconhecido ao criar a conta: ${error.message}` };
    }
}

export async function updateUserProfile(userId: string, data: { name?: string; birthdate?: string; avatarColor?: string }) {
    const users = await readData<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('Usuário não encontrado.');
    }

    users[userIndex] = { ...users[userIndex], ...data };
    await writeData('users', users);
    revalidatePath('/dashboard', 'layout');
    
    return { success: true, user: users[userIndex] };
}

export async function updateUserLastSeen(userId: string) {
    const users = await readData<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].lastSeen = new Date().toISOString();
        await writeData('users', users);
    }
    // No revalidatePath here to avoid potential issues in auth flow
}

export async function updateUserAccessLevel(userId: string, accessLevel: AccessLevel) {
    const users = await getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('Usuário não encontrado.');
    }
    users[userIndex].accessLevel = accessLevel;
    await writeData('users', users);
    revalidatePath('/dashboard/user-management');
}

export async function deleteUser(userId: string) {
    const adminAuth = getAuth(getAdminApp());
    const users = await getAllUsers();
    const userToDelete = users.find(u => u.id === userId);

    if (!userToDelete) {
        throw new Error('Usuário não encontrado para exclusão.');
    }

    try {
        await adminAuth.deleteUser(userId);
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            console.error("Erro ao excluir usuário do Firebase Auth:", error);
            throw new Error('Erro ao excluir usuário do sistema de autenticação.');
        }
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    await writeData('users', updatedUsers);
    revalidatePath('/dashboard/user-management');
}


// --- FILE ACTIONS ---
export async function uploadFile(formData: FormData): Promise<{ success: boolean; file?: PatientFile; error?: string; }> {
    const file = formData.get('file') as File | null;
    if (!file) {
        return { success: false, error: 'Nenhum arquivo enviado.' };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return { success: false, error: 'O arquivo é muito grande (limite de 5MB).' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const newFile: PatientFile = {
        id: generateId('file'),
        name: file.name,
        type: file.type,
        path: dataUrl,
        uploadedAt: new Date().toISOString(),
    };

    return { success: true, file: newFile };
}

export async function uploadImage(formData: FormData): Promise<{ success: boolean; filePath?: string; error?: string }> {
    const file = formData.get('image') as File | null;
    if (!file) {
        return { success: false, error: 'Nenhuma imagem enviada.' };
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for images
        return { success: false, error: 'A imagem é muito grande (limite de 2MB).' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = file.type;
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return { success: true, filePath: dataUrl };
    } catch (e) {
        return { success: false, error: 'Falha ao processar a imagem.' };
    }
}


// --- PDF GENERATION ACTIONS ---

type PdfActionResult = Promise<{ success: boolean; data?: string; error?: string }>;

export async function generateCompleteReportPDF(
    { products, patients, dispensations, orders, period }: { products: Product[], patients: Patient[], dispensations: Dispensation[], orders: Order[], period: string }
): PdfActionResult {
  return generatePdf(
    'Relatório Gerencial Completo',
    period,
    (doc) => {
        const summaryData = [
          ['Total de Produtos em Inventário (Geral):', products.length.toString()],
          ['Total de Itens em Estoque (Geral):', products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString('pt-BR')],
          ['Produtos com Baixo Estoque (Geral):', products.filter(p => p.status === 'Baixo Estoque').length.toString()],
          ['Total de Pacientes Ativos (Geral):', patients.filter(p => p.status === 'Ativo').length.toString()],
          ['Total de Dispensações no Período:', dispensations.length.toLocaleString('pt-BR')],
          ['Total de Pedidos para Unidades no Período:', orders.length.toLocaleString('pt-BR')],
        ];

        doc.autoTable({
          startY: 85,
          head: [['Métrica', 'Valor']],
          body: summaryData,
          theme: 'striped',
          headStyles: { fillColor: [22, 163, 74] },
        });

        // The logic to add a new page for each table is now handled inside generatePdf
        doc.addPage();
        doc.autoTable({ startY: 85, head: [['Nome', 'Categoria', 'Qtd', 'Status', 'Validade', 'Lote']], body: products.map(p => [ p.name, p.category, p.quantity.toString(), p.status, p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR') : 'N/A', p.batch || 'N/A' ]), theme: 'grid', headStyles: { fillColor: [37, 99, 235] } });
        doc.addPage();
        doc.autoTable({ startY: 85, head: [['Data', 'Paciente', 'CPF', 'Nº de Itens']], body: dispensations.map(d => [ new Date(d.date).toLocaleDateString('pt-BR', { timeZone: 'UTC'}), d.patient.name, d.patient.cpf, d.items.reduce((sum, item) => sum + item.quantity, 0).toString() ]), theme: 'grid', headStyles: { fillColor: [107, 33, 168] } });
        doc.addPage();
        doc.autoTable({ startY: 85, head: [['Data', 'Unidade', 'Tipo', 'Nº de Itens', 'Status']], body: orders.map(o => [ new Date(o.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}), o.unitName, o.orderType, o.itemCount.toString(), o.status ]), theme: 'grid', headStyles: { fillColor: [13, 148, 136] } });
        doc.addPage();
        doc.autoTable({ startY: 85, head: [['Nome', 'CPF', 'CNS', 'Unidade', 'Demandas']], body: patients.filter(p => p.status === 'Ativo').map(p => [ p.name, p.cpf, p.cns, p.unitName || 'N/A', p.demandItems?.join(', ') || 'N/A' ]), theme: 'grid', headStyles: { fillColor: [192, 38, 211] } });
    }
  );
};

export async function generateStockReportPDF({ products, categoryFilter }: { products: Product[], categoryFilter?: string }): PdfActionResult {
    const title = categoryFilter && categoryFilter !== 'all' ? `Relatório de Estoque - ${categoryFilter}` : 'Relatório de Estoque Geral';
    const productsToDisplay = categoryFilter && categoryFilter !== 'all' ? products.filter(p => p.category === categoryFilter) : products;

    return generatePdf(
        title,
        undefined,
        {
          head: [['Nome Comercial', 'Princípio Ativo', 'Apresentação', 'Categoria', 'Qtd', 'Status', 'Validade', 'Lote', 'Fabricante', 'Fornecedor']],
          body: productsToDisplay.map(p => [p.name, p.activeIngredient || 'N/A', p.presentation || 'N/A', p.category, p.quantity.toLocaleString('pt-BR'), p.status, p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A', p.batch || 'N/A', p.manufacturer || 'N/A', p.supplier || 'N/A']),
          headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
          styles: { fontSize: 8 },
        },
        true // landscape
    );
}

export async function generateExpiryReportPDF({ products }: { products: Product[] }): PdfActionResult {
    const expiringProducts = products
        .filter(p => p.expiryDate)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    return generatePdf(
        'Relatório de Produtos a Vencer',
        undefined,
        {
             head: [['Nome do Produto', 'Lote', 'Data de Validade', 'Quantidade']],
             body: expiringProducts.map(p => [
                 p.name,
                 p.batch || 'N/A',
                 new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}),
                 p.quantity.toString(),
             ]),
             headStyles: { fillColor: [217, 119, 6] },
        }
    );
}

export async function generatePatientReportPDF({ dispensations, period }: { dispensations: Dispensation[], period: string }): PdfActionResult {
    return generatePdf(
        'Relatório de Atendimento de Pacientes',
        period,
        {
            head: [['Paciente', 'CPF', 'Data da Dispensação', 'Nº de Itens']],
            body: dispensations.map(d => {
                const totalItems = d.items.reduce((sum, item) => sum + item.quantity, 0);
                return [
                    d.patient.name,
                    d.patient.cpf,
                    new Date(d.date).toLocaleDateString('pt-BR', { timeZone: 'UTC'}),
                    totalItems.toString()
                ]
            }),
            headStyles: { fillColor: [107, 33, 168] },
        }
    );
}

export async function generatePatientListReportPDF({ patients }: { patients: Patient[] }): PdfActionResult {
    return generatePdf(
        'Relatório de Pacientes Cadastrados',
        undefined,
        {
             head: [['Nome do Paciente', 'CPF', 'CNS', 'Status', 'Demandas']],
             body: patients.map(p => [
                p.name,
                p.cpf,
                p.cns,
                p.status,
                p.demandItems?.join(', ') || 'Nenhuma'
            ]),
            headStyles: { fillColor: [107, 33, 168] },
            columnStyles: { 4: { cellWidth: 50 } },
        }
    );
}

export async function generateUnitDispensationReportPDF({ orders, units, period }: { orders: Order[], units: Unit[], period: string }): PdfActionResult {
    const unitDataMap = new Map<string, { totalItems: number, orderCount: number, type: string, name: string }>();
    units.forEach(u => unitDataMap.set(u.id, { totalItems: 0, orderCount: 0, type: u.type, name: u.name }));
    orders.forEach(order => {
        const unit = unitDataMap.get(order.unitId);
        if (unit) {
            unit.totalItems += order.itemCount;
            unit.orderCount += 1;
        }
    });

    return generatePdf(
        'Relatório de Dispensação por Unidade',
        period,
        {
            head: [['Nome da Unidade', 'Tipo', 'Total de Pedidos', 'Total de Itens Recebidos']],
            body: Array.from(unitDataMap.values()).map(u => [
                u.name,
                u.type,
                u.orderCount.toString(),
                u.totalItems.toLocaleString('pt-BR')
            ]),
            headStyles: { fillColor: [13, 148, 136] },
        }
    );
}

export async function generateBatchReportPDF({ products }: { products: Product[] }): PdfActionResult {
    return generatePdf(
        'Relatório de Lotes',
        undefined,
        {
            head: [['Nome do Produto', 'Lote', 'Validade', 'Quantidade']],
            body: products.map(p => [
                p.name,
                p.batch || 'N/A',
                p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A',
                p.quantity.toString()
            ]),
            headStyles: { fillColor: [19, 78, 74] },
        }
    );
}

export async function generateEntriesAndExitsReportPDF({ movements, allProducts, period }: { movements: StockMovement[], allProducts: Product[], period: string }): PdfActionResult {
    const productMap = new Map(allProducts.map(p => [p.id, p]));
    const summary: Record<string, { entries: number, exits: number }> = {};
    
    movements.forEach(m => {
        const product = productMap.get(m.productId);
        const category = product?.category || 'Desconhecida';
        if (!summary[category]) {
            summary[category] = { entries: 0, exits: 0 };
        }
        if (m.type === 'Entrada') {
            summary[category].entries += m.quantityChange;
        } else if (m.type === 'Saída') {
            summary[category].exits += Math.abs(m.quantityChange);
        }
    });

    const summaryBody = Object.entries(summary).map(([category, data]) => [
        category,
        data.entries.toLocaleString('pt-BR'),
        data.exits.toLocaleString('pt-BR')
    ]);

    const entries = movements.filter(m => m.type === 'Entrada');
    const exits = movements.filter(m => m.type === 'Saída');

    return generatePdf(
        'Relatório de Entradas e Saídas',
        period,
        (doc) => {
             doc.autoTable({
                startY: 85,
                head: [['Categoria', 'Total de Entradas (Itens)', 'Total de Saídas (Itens)']],
                body: summaryBody,
                theme: 'grid',
                headStyles: { fillColor: [107, 114, 128] }, // Gray
            });

            if (entries.length > 0) {
                doc.addPage();
                doc.autoTable({ startY: 85, head: [['Data', 'Produto', 'Motivo', 'Quantidade', 'Usuário']], body: entries.map(m => [ new Date(m.date).toLocaleString('pt-BR', { timeZone: 'UTC' }), m.productName, m.reason, m.quantityChange.toLocaleString('pt-BR'), m.user ]), headStyles: { fillColor: [22, 163, 74] } });
            }

            if (exits.length > 0) {
                 doc.addPage();
                 doc.autoTable({ startY: 85, head: [['Data', 'Produto', 'Motivo', 'Quantidade', 'Usuário']], body: exits.map(m => [ new Date(m.date).toLocaleString('pt-BR', { timeZone: 'UTC' }), m.productName, m.reason, Math.abs(m.quantityChange).toLocaleString('pt-BR'), m.user ]), theme: 'grid', headStyles: { fillColor: [220, 38, 38] } });
            }
        }
    );
}

export async function generateOrderStatusReportPDF({ units, lastOrdersMap, status }: { units: Unit[], lastOrdersMap: Map<string, Order>, status: OrderStatus }): PdfActionResult {
    const title = `Relatório de Unidades: Status "${status}"`;
    const filteredUnits = units.filter(unit => {
        const lastOrder = lastOrdersMap.get(unit.id);
        return lastOrder?.status === status;
    });

    return generatePdf(
        title,
        undefined,
        {
            head: [['Nome da Unidade', 'Tipo', 'Data do Último Pedido', 'Tipo do Pedido']],
            body: filteredUnits.map(unit => {
                const lastOrder = lastOrdersMap.get(unit.id);
                return [
                    unit.name,
                    unit.type,
                    lastOrder ? new Date(lastOrder.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A',
                    lastOrder?.orderType || 'N/A'
                ];
            }),
            headStyles: { fillColor: [37, 99, 235] },
        }
    );
}


// --- HOSPITAL-SPECIFIC ACTIONS ---

export async function addHospitalPatient(patientData: Omit<HospitalPatient, 'id'>) {
    const patients = await getHospitalPatientsFromDb();
    const newPatient: HospitalPatient = {
        ...patientData,
        id: generateId('hpat'),
    };
    await writeData('hospitalPatients', [newPatient, ...patients]);
    revalidatePath('/dashboard/hospital/patients');
}

export async function updateHospitalPatient(patientId: string, patientData: Partial<Omit<HospitalPatient, 'id'>>) {
    const patients = await getHospitalPatientsFromDb();
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) throw new Error('Paciente não encontrado.');
    
    patients[patientIndex] = { ...patients[patientIndex], ...patientData };
    await writeData('hospitalPatients', patients);
    revalidatePath('/dashboard/hospital/patients');
}

export async function deleteHospitalPatient(patientId: string) {
    const patients = await getHospitalPatientsFromDb();
    const updatedPatients = patients.filter(p => p.id !== patientId);
    await writeData('hospitalPatients', updatedPatients);
    revalidatePath('/dashboard/hospital/patients');
}

export async function updateHospitalPatientStatus(patientId: string, status: HospitalPatient['status']) {
    const patients = await getHospitalPatientsFromDb();
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) throw new Error('Paciente não encontrado.');
    patients[patientIndex].status = status;
    await writeData('hospitalPatients', patients);
    revalidatePath('/dashboard/hospital/patients');
}


export async function addHospitalSector(sectorData: Omit<Sector, 'id'>) {
    const sectors = await readData<Sector>('hospitalSectors');
    const newSector: Sector = {
        ...sectorData,
        id: generateId('sector'),
    };
    await writeData('hospitalSectors', [...sectors, newSector]);
    revalidatePath('/dashboard/hospital/sectors');
    revalidatePath('/dashboard/hospital/dispense');
}

export async function updateHospitalSector(sectorId: string, sectorData: Partial<Omit<Sector, 'id'>>) {
    const sectors = await readData<Sector>('hospitalSectors');
    const sectorIndex = sectors.findIndex(s => s.id === sectorId);
    if (sectorIndex === -1) throw new Error('Setor não encontrado.');
    sectors[sectorIndex] = { ...sectors[sectorIndex], ...sectorData };
    await writeData('hospitalSectors', sectors);
    revalidatePath('/dashboard/hospital/sectors');
    revalidatePath('/dashboard/hospital/dispense');
}

export async function deleteHospitalSector(sectorId: string): Promise<{ success: boolean; message?: string }> {
    const sectors = await readData<Sector>('hospitalSectors');
    const dispensations = await readData<SectorDispensation>('sectorDispensations');

    const sectorToDelete = sectors.find(s => s.id === sectorId);
    if (sectorToDelete && dispensations.some(d => d.sector === sectorToDelete.name)) {
        return { success: false, message: 'Não é possível excluir setores que possuem dispensações associadas.' };
    }

    const updatedSectors = sectors.filter(s => s.id !== sectorId);
    await writeData('hospitalSectors', updatedSectors);
    revalidatePath('/dashboard/hospital/sectors');
    revalidatePath('/dashboard/hospital/dispense');
    return { success: true };
}


export async function addSectorDispensation(data: { sector: string; items: DispensationItem[] }) {
    const session = await getCurrentUser();
    const dispensations = await readData<SectorDispensation>('sectorDispensations');
    const products = await getProducts('Hospital');
    const dispensationDate = new Date().toISOString();

    const newDispensation: SectorDispensation = {
        id: generateId('secdisp'),
        sector: data.sector,
        date: dispensationDate,
        items: data.items,
        dispensedBy: session?.name || 'Usuário Desconhecido',
    };

     for (const item of newDispensation.items) {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            const originalQuantity = products[productIndex].quantity;
            products[productIndex].quantity -= item.quantity;
            products[productIndex].status = products[productIndex].quantity <= 0 ? 'Sem Estoque' : products[productIndex].quantity < 20 ? 'Baixo Estoque' : 'Em Estoque';
            await logStockMovement(item.productId, item.name, 'Saída', 'Saída por Dispensação (Setor)', -item.quantity, originalQuantity, dispensationDate, newDispensation.id);
        }
    }
    
    // This is a critical fix: we must write back the 'products' array which includes ALL products,
    // not just the hospital ones, otherwise we would wipe out the CAF inventory.
    const allProducts = await getProducts('all');
    const updatedAllProducts = allProducts.map(p => {
        const updatedProduct = products.find(up => up.id === p.id);
        return updatedProduct || p;
    });

    await writeData('products', updatedAllProducts);
    await writeData('sectorDispensations', [newDispensation, ...dispensations]);

    revalidatePath('/dashboard/hospital/dispense');
    revalidatePath('/dashboard/hospital');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/hospital/reports');
}

export async function addHospitalPatientDispensation(data: { patient: HospitalPatient; items: DispensationItem[] }): Promise<void> {
    const session = await getCurrentUser();
    const dispensations = await getHospitalPatientDispensationsFromDb();
    const products = await getProducts('Hospital');
    const dispensationDate = new Date().toISOString();

    const newDispensation: HospitalPatientDispensation = {
        id: generateId('hpatdisp'),
        hospitalPatientId: data.patient.id,
        patientName: data.patient.name,
        sectorName: data.patient.sectorName || 'N/A',
        date: dispensationDate,
        items: data.items,
        dispensedBy: session?.name || 'Usuário Desconhecido',
    };

    for (const item of newDispensation.items) {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            const originalQuantity = products[productIndex].quantity;
            products[productIndex].quantity -= item.quantity;
            products[productIndex].status = products[productIndex].quantity <= 0 ? 'Sem Estoque' : 'Em Estoque';
            await logStockMovement(item.productId, item.name, 'Saída', 'Saída por Dispensação (Paciente Internado)', -item.quantity, originalQuantity, dispensationDate, newDispensation.id);
        }
    }

    const allProducts = await getProducts('all');
    const updatedAllProducts = allProducts.map(p => {
        const updatedProduct = products.find(up => up.id === p.id);
        return updatedProduct || p;
    });

    await writeData('products', updatedAllProducts);
    await writeData('hospitalPatientDispensations', [newDispensation, ...dispensations]);

    revalidatePath('/dashboard/hospital/patients');
    revalidatePath('/dashboard/hospital');
    revalidatePath('/dashboard/inventory?location=Hospital');
}


// --- HOSPITAL-SPECIFIC REPORTS ---

export async function generateHospitalStockReportPDF(options: any = {}): PdfActionResult {
    const products = await getProducts('Hospital');
    return generatePdf(
        'Relatório de Estoque da Farmácia Hospitalar',
        undefined,
        {
            head: [['Nome', 'Categoria', 'Qtd', 'Status', 'Validade', 'Lote']],
            body: products.map(p => [ p.name, p.category, p.quantity.toString(), p.status, p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A', p.batch || 'N/A' ]),
            headStyles: { fillColor: [37, 99, 235] },
        },
        true, // isLandscape
        true // isHospitalReport
    );
}

export async function generateHospitalEntriesAndExitsReportPDF({ startDate, endDate, period }: { startDate: Date, endDate: Date, period: string }): PdfActionResult {
    const allMovements = await readData<StockMovement>('stockMovements');
    const hospitalProducts = await getProducts('Hospital');
    const hospitalProductIds = new Set(hospitalProducts.map(p => p.id));
    
    const movements = allMovements.filter(m => {
        const mDate = new Date(m.date);
        return mDate >= startDate && mDate <= endDate && hospitalProductIds.has(m.productId);
    });

    return generatePdf(
        'Relatório de Entradas e Saídas do Hospital',
        period,
        (doc) => {
            const entries = movements.filter(m => m.type === 'Entrada');
            const exits = movements.filter(m => m.type === 'Saída');

            if (entries.length > 0) {
                doc.autoTable({ startY: 85, head: [['Data', 'Produto', 'Motivo', 'Qtd', 'Usuário']], body: entries.map(m => [ new Date(m.date).toLocaleString('pt-BR'), m.productName, m.reason, m.quantityChange.toString(), m.user ]), headStyles: { fillColor: [22, 163, 74] } });
            } else {
                 doc.autoTable({ startY: 85, body: [['Nenhuma entrada registrada no período.']] });
            }

            if (exits.length > 0) {
                 doc.addPage();
                 doc.autoTable({ startY: 85, head: [['Data', 'Produto', 'Motivo', 'Qtd', 'Usuário']], body: exits.map(m => [ new Date(m.date).toLocaleString('pt-BR'), m.productName, m.reason, Math.abs(m.quantityChange).toString(), m.user ]), headStyles: { fillColor: [220, 38, 38] } });
            } else {
                 doc.addPage();
                 doc.autoTable({ startY: 85, body: [['Nenhuma saída registrada no período.']] });
            }
        },
        true, // isLandscape
        true // isHospitalReport
    );
}

export async function generateHospitalSectorDispensationReportPDF({ startDate, endDate, period }: { startDate: Date, endDate: Date, period: string }): PdfActionResult {
    const allDispensations = await getSectorDispensations();
    const dispensations = allDispensations.filter(d => {
        const dDate = new Date(d.date);
        return dDate >= startDate && dDate <= endDate;
    });

    const sectorData: Record<string, { totalItems: number, totalDispensations: number }> = {};
    dispensations.forEach(d => {
        if (!sectorData[d.sector]) {
            sectorData[d.sector] = { totalItems: 0, totalDispensations: 0 };
        }
        sectorData[d.sector].totalItems += d.items.reduce((sum, item) => sum + item.quantity, 0);
        sectorData[d.sector].totalDispensations += 1;
    });

    const body = Object.keys(sectorData).length > 0 
        ? Object.entries(sectorData).map(([sector, data]) => [sector, data.totalDispensations.toString(), data.totalItems.toLocaleString('pt-BR')])
        : [['Nenhuma dispensação encontrada no período.']];

    const head = Object.keys(sectorData).length > 0 
        ? [['Setor', 'Nº de Dispensações', 'Total de Itens']] 
        : [[]];


    return generatePdf(
        'Relatório de Dispensação por Setor',
        period,
        {
            head: head,
            body: body,
            headStyles: { fillColor: [13, 148, 136] },
        },
        true, // isLandscape
        true // isHospitalReport
    );
}

// --- HOSPITAL ORDER TEMPLATE ---
export async function updateHospitalOrderTemplate(templateItems: HospitalOrderTemplateItem[]): Promise<void> {
    await writeData('hospitalOrderTemplate', templateItems);
    revalidatePath('/dashboard/hospital/orders/template');
}
