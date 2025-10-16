
'use server';

import { revalidatePath } from 'next/cache';
import { readData, writeData, getProducts, getKnowledgeBase } from './data';
import type { User, Product, Unit, Patient, Order, OrderItem, Dispensation, DispensationItem, StockMovement, PatientStatus, Role, SubRole, AccessLevel, OrderType, PatientFile, OrderStatus } from './types';
import * as admin from 'firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

// --- FIREBASE ADMIN INITIALIZATION (CORRECTED & CENTRALIZED) ---
// This function initializes the Firebase Admin SDK. It's designed to be called
// only when needed and ensures it only runs once.
function initializeAdminApp() {
    // If the app is already initialized, return the existing app.
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
        throw new Error('A variável de ambiente FIREBASE_SERVICE_ACCOUNT não está definida ou está vazia.');
    }

    try {
        // The service account is now expected to be a direct JSON string,
        // which avoids file system and Buffer issues in different runtimes.
        const serviceAccount = JSON.parse(serviceAccountString);

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

    } catch (error: any) {
        console.error("Falha Crítica ao Inicializar o Firebase Admin SDK:", error.message);
        // Throw a more informative error.
        throw new Error(`Não foi possível inicializar o Firebase Admin. Causa: ${error.message}`);
    }
}


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
  const session = await getServerSession(authOptions);
  const movements = await readData<StockMovement>('stockMovements');
  const userEmail = session?.user?.name || 'Sistema';

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
    user: userEmail,
    relatedId
  };
  await writeData('stockMovements', [newMovement, ...movements]);
};


// --- PRODUCT ACTIONS ---
export async function addProduct(productData: Omit<Product, 'id' | 'status'>): Promise<Product> {
    const products = await getProducts();
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
    const products = await getProducts();
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
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.name || 'Sistema';
    const products = await getProducts();
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
                user: userEmail,
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
    const allProducts = await getProducts();
    const productsToDelete = allProducts.filter(p => productIds.includes(p.id));
    const remainingProducts = allProducts.filter(p => !productIds.includes(p.id));
    
    if (productsToDelete.length === 0) {
        return { success: false, message: "Nenhum produto encontrado para exclusão." };
    }

    // Opcional: registrar a exclusão como uma movimentação de estoque
    const movements: StockMovement[] = [];
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.name || 'Sistema';
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
            user: userEmail,
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


// --- ORDER ACTIONS ---
export async function addOrder(orderData: { unitId: string; unitName: string; orderType: OrderType, items: OrderItem[]; notes?: string; sentDate?: string; }) {
    const session = await getServerSession(authOptions);
    const orders = await readData<Order>('orders');
    const products = await getProducts();

    const sentDate = orderData.sentDate ? new Date(orderData.sentDate).toISOString() : new Date().toISOString();

    const newOrder: Order = {
        id: generateNumericId(),
        unitId: orderData.unitId,
        unitName: orderData.unitName,
        items: orderData.items,
        orderType: orderData.orderType,
        notes: orderData.notes,
        sentDate: sentDate,
        status: 'Em análise',
        itemCount: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
        creatorName: session?.user?.name || 'Usuário Desconhecido',
    };

    // Update stock for each item
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
    await writeData('orders', [newOrder, ...orders].sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime()));

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/reports');
    revalidatePath(`/dashboard/orders/history/${orderData.unitId}`);
}

export async function deleteOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
    const allOrders = await readData<Order>('orders');
    const allProducts = await getProducts();

    const orderToDelete = allOrders.find(o => o.id === orderId);
    if (!orderToDelete) {
        return { success: false, message: 'Pedido não encontrado.' };
    }

    const reversalDate = new Date().toISOString();

    // Return items to stock
    for (const item of orderToDelete.items) {
        const productIndex = allProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            const originalQuantity = allProducts[productIndex].quantity;
            allProducts[productIndex].quantity += item.quantity;
            allProducts[productIndex].status = allProducts[productIndex].quantity <= 0 ? 'Sem Estoque' : allProducts[productIndex].quantity < 20 ? 'Baixo Estoque' : 'Em Estoque';
            await logStockMovement(item.productId, item.name, 'Entrada', 'Estorno de Remessa', item.quantity, originalQuantity, reversalDate, orderToDelete.id);
        } else {
            // Product does not exist anymore, create it
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
            };
            allProducts.push(newProduct);
            await logStockMovement(newProduct.id, newProduct.name, 'Entrada', 'Estorno de Remessa', newProduct.quantity, 0, reversalDate, orderToDelete.id);
        }
    }

    // Filter out the deleted order
    const updatedOrders = allOrders.filter(o => o.id !== orderId);

    // Save updated data
    await writeData('products', allProducts);
    await writeData('orders', updatedOrders);

    // Revalidate paths
    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/orders/history/${orderToDelete.unitId}`);
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
    revalidatePath(`/dashboard/orders/history/${orders[orderIndex].unitId}`);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/reports');
}


// --- DISPENSATION ACTIONS ---
export async function addDispensation(dispensationData: { patientId: string; patient: Omit<Patient, 'files'>; items: DispensationItem[] }): Promise<Dispensation> {
    const session = await getServerSession(authOptions);
    const dispensations = await readData<Dispensation>('dispensations');
    const products = await getProducts();
    const dispensationDate = new Date().toISOString();
    
    const newDispensation: Dispensation = {
      id: generateNumericId(),
      patientId: dispensationData.patientId,
      patient: dispensationData.patient,
      items: dispensationData.items,
      date: dispensationDate,
      creatorName: session?.user?.name || 'Usuário Desconhecido',
    };

    // Update stock for each item
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
    
    return newDispensation;
}

// --- USER PROFILE ACTIONS ---

export async function updateUserProfile(userId: string, data: { name?: string; birthdate?: string; image?: string }) {
    const users = await readData<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('Usuário não encontrado.');
    }

    // Update the user data in our database (Vercel KV)
    users[userIndex] = { ...users[userIndex], ...data };
    await writeData('users', users);

    // Revalidate the path to ensure the UI updates on navigation
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    
    // Return the updated user data so the client can update the session
    return { success: true, user: users[userIndex] };
}

// --- USER MANAGEMENT ACTIONS ---
export async function updateUserAccessLevel(userId: string, accessLevel: AccessLevel) {
    const users = await readData<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('Usuário não encontrado.');
    }
    users[userIndex].accessLevel = accessLevel;
    await writeData('users', users);
    revalidatePath('/dashboard/user-management');
}

export async function deleteUser(userId: string) {
    const adminAuth = initializeAdminApp().auth();
    const users = await readData<User>('users');
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
         throw new Error('Usuário não encontrado para exclusão.');
    }

    // Excluir do Firebase Auth
    try {
        await adminAuth.deleteUser(userId);
    } catch (error: any) {
        // Se o usuário não for encontrado no Firebase, podemos continuar para removê-lo do nosso DB
        if (error.code !== 'auth/user-not-found') {
            console.error("Erro ao excluir usuário do Firebase Auth:", error);
            throw new Error('Erro ao excluir usuário do sistema de autenticação.');
        }
    }

    // Excluir do Vercel KV
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

    // Convert the file to a Base64 data URL to store in KV.
    // This is not ideal for large files but works for a self-contained solution without external storage.
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


// --- REGISTER ---
export async function register({ email, password, role, subRole }: { email: string; password: string; role: Role; subRole?: SubRole; }) {
    
    try {
        const adminAuth = initializeAdminApp().auth();
        const users = await readData<User>('users');

        // Check in our KV database first
        if (users.some(u => u.email === email)) {
            return { success: false, message: 'Este email já está em uso.' };
        }
        
        // Check in Firebase Auth
        try {
            await adminAuth.getUserByEmail(email);
            // If it doesn't throw, user exists in Firebase Auth
            return { success: false, message: 'Este email já está registrado no sistema de autenticação.' };
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                // Another error occurred, propagate it
                throw error;
            }
            // If user is not found, we can proceed with creation
        }


        // Usar o Firebase Admin SDK para criar o usuário
        const userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            displayName: email.split('@')[0], // Nome padrão
        });
        
        const isFirstUser = users.length === 0;
        const newUser: User = {
            id: userRecord.uid,
            email,
            role,
            subRole: role === 'Farmacêutico' ? subRole : undefined,
            accessLevel: isFirstUser ? 'Admin' : 'User',
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
        return { success: false, message: 'Ocorreu um erro desconhecido ao criar a conta.' };
    }
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

        // In a real app, you'd upload to a service and get a URL.
        // For this self-contained example, the data URL is the "path".
        return { success: true, filePath: dataUrl };
    } catch (e) {
        return { success: false, error: 'Falha ao processar a imagem.' };
    }
}


export async function updateUserLastSeen(userId: string) {
    const users = await readData<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].lastSeen = new Date().toISOString();
        await writeData('users', users);
        // We don't need to revalidate here, as it's a background task.
        // The dashboard page will refetch on its own interval.
    }
}

    