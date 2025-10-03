
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as jose from 'jose';
import bcrypt from 'bcrypt';
import { kv } from '@/lib/kv';
import { readData, writeData, getProducts, getKnowledgeBase as getKbData } from './data';
import type { User, Product, Unit, Patient, Order, OrderItem, Dispensation, DispensationItem, StockMovement, PatientStatus, Role, SubRole } from './types';
import { revalidatePath } from 'next/cache';
import { resetAllData } from './seed';

// --- UTILITIES ---
const generateId = (prefix: string) => `${prefix}_${new Date().getTime()}_${Math.random().toString(36).substring(2, 8)}`;

const logStockMovement = async (
  productId: string, 
  productName: string, 
  type: StockMovement['type'], 
  reason: StockMovement['reason'], 
  quantityChange: number, 
  quantityBefore: number,
  relatedId?: string
) => {
  const movements = await readData<StockMovement>('stockMovements');
  const user = await getCurrentUser();
  const newMovement: StockMovement = {
    id: generateId('mov'),
    productId,
    productName,
    type,
    reason,
    quantityChange,
    quantityBefore,
    quantityAfter: quantityBefore + quantityChange,
    date: new Date().toISOString(),
    user: user?.email || 'Sistema',
    relatedId
  };
  await writeData('stockMovements', [newMovement, ...movements]);
};


// --- AUTH ACTIONS ---

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email e senha são obrigatórios.' };
  }
  
  const users = await readData<User>('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return { error: 'Credenciais inválidas.' };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return { error: 'Credenciais inválidas.' };
  }
  
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const alg = 'HS256';

    const token = await new jose.SignJWT({ id: user.id, email: user.email, role: user.role, accessLevel: user.accessLevel })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('1h')
      .setSubject(user.id)
      .sign(secret);
    
    cookies().set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hora
      path: '/',
      sameSite: 'strict',
    });

    redirect('/dashboard');

  } catch (error) {
    if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Falha ao autenticar:', error);
    return { error: 'Ocorreu um erro inesperado durante o login.' };
  }
}

export async function register({ email, password, role, subRole }: { email: string; password: string; role: Role; subRole?: SubRole; }) {
    const users = await readData<User>('users');
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
        return { success: false, message: 'Este email já está cadastrado.' };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isFirstUser = users.length === 0;

    const newUser: User = {
        id: generateId('user'),
        email,
        password: passwordHash,
        role,
        subRole: role === 'Farmacêutico' ? subRole : undefined,
        accessLevel: isFirstUser ? 'Admin' : 'User',
    };

    await writeData<User>('users', [...users, newUser]);

    return { success: true, message: 'Usuário registrado com sucesso.' };
}


export async function logout() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
  redirect('/login');
}


export async function getCurrentUser(): Promise<(Omit<User, 'password'> & { id: string }) | null> {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jose.jwtVerify(sessionCookie, secret);
        
        return {
            id: payload.sub!,
            email: payload.email as string,
            role: payload.role as Role,
            accessLevel: payload.accessLevel as User['accessLevel'],
            subRole: payload.subRole as SubRole | undefined
        };

    } catch (error) {
        console.warn("Sessão inválida:", error);
        return null;
    }
}

// --- PRODUCT ACTIONS ---
export async function addProduct(productData: Omit<Product, 'id' | 'status'>): Promise<Product> {
    const products = await getProducts();
    const newProduct: Product = {
        ...productData,
        id: generateId('prod'),
        status: productData.quantity === 0 ? 'Sem Estoque' : productData.quantity < 20 ? 'Baixo Estoque' : 'Em Estoque',
    };
    await writeData('products', [newProduct, ...products]);
    await logStockMovement(newProduct.id, newProduct.name, 'Entrada', 'Entrada Inicial', newProduct.quantity, 0);
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
        status: productData.quantity === 0 ? 'Sem Estoque' : productData.quantity < 20 ? 'Baixo Estoque' : 'Em Estoque' 
    } as Product;
    
    if (productData.quantity !== undefined && productData.quantity !== originalProduct.quantity) {
        const quantityChange = productData.quantity - originalProduct.quantity;
        const type = quantityChange > 0 ? 'Entrada' : 'Saída';
        await logStockMovement(productId, updatedProduct.name, type, 'Ajuste de Inventário', quantityChange, originalProduct.quantity);
    }

    products[productIndex] = updatedProduct;
    await writeData('products', products);
    revalidatePath('/dashboard/inventory');
    revalidatePath(`/labels/${productId}`);
    return updatedProduct;
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


// --- PATIENT ACTIONS ---
export async function addPatient(patientData: Omit<Patient, 'id' | 'status'>) {
    const patients = await readData<Patient>('patients');
    const newPatient: Patient = {
        ...patientData,
        id: generateId('pat'),
        status: 'Ativo',
    };
    await writeData('patients', [newPatient, ...patients]);
    revalidatePath('/dashboard/patients');
}

export async function updatePatient(patientId: string, patientData: Partial<Omit<Patient, 'id'>>) {
    const patients = await readData<Patient>('patients');
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) throw new Error('Paciente não encontrado.');
    patients[patientIndex] = { ...patients[patientIndex], ...patientData };
    await writeData('patients', patients);
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${patientId}`);
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
export async function addOrder(orderData: { unitId: string; unitName: string; items: OrderItem[]; notes?: string; }) {
    const orders = await readData<Order>('orders');
    const products = await getProducts();

    const newOrder: Order = {
        ...orderData,
        id: generateId('ord'),
        sentDate: new Date().toISOString(),
        status: 'Em Trânsito',
        itemCount: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
    };

    // Update stock for each item
    for (const item of newOrder.items) {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            const originalQuantity = products[productIndex].quantity;
            products[productIndex].quantity -= item.quantity;
            products[productIndex].status = products[productIndex].quantity === 0 ? 'Sem Estoque' : products[productIndex].quantity < 20 ? 'Baixo Estoque' : 'Em Estoque';
            await logStockMovement(item.productId, item.name, 'Saída', 'Saída por Remessa', -item.quantity, originalQuantity, newOrder.id);
        }
    }

    await writeData('products', products);
    await writeData('orders', [newOrder, ...orders]);

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/reports');
}

// --- DISPENSATION ACTIONS ---
export async function addDispensation(dispensationData: { patientId: string; patient: Omit<Patient, 'files'>; items: DispensationItem[] }): Promise<Dispensation> {
    const dispensations = await readData<Dispensation>('dispensations');
    const products = await getProducts();
    
    const newDispensation: Dispensation = {
      ...dispensationData,
      id: generateId('disp'),
      date: new Date().toISOString(),
    };

    // Update stock for each item
    for (const item of newDispensation.items) {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            const originalQuantity = products[productIndex].quantity;
            products[productIndex].quantity -= item.quantity;
            products[productIndex].status = products[productIndex].quantity === 0 ? 'Sem Estoque' : products[productIndex].quantity < 20 ? 'Baixo Estoque' : 'Em Estoque';
            await logStockMovement(item.productId, item.name, 'Saída', 'Saída por Dispensação', -item.quantity, originalQuantity, newDispensation.id);
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

// --- FILE UPLOAD ---
// This is a simplified example. In a real app, you'd upload to a cloud storage like Vercel Blob, S3, etc.
// For now, we'll simulate by returning a placeholder path.
export async function uploadImage(formData: FormData): Promise<{ success: boolean; filePath?: string; error?: string; }> {
    const file = formData.get('image') as File;
    if (!file) {
        return { success: false, error: 'Nenhum arquivo enviado.' };
    }
    // In a real scenario, you would upload the file here and get a URL.
    // For this project, we'll just return a placeholder from picsum.
    const randomId = Math.floor(Math.random() * 1000);
    const filePath = `https://picsum.photos/seed/${randomId}/400/400`;
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true, filePath };
}

// --- KNOWLEDGE BASE ---
export async function getKnowledgeBase() {
    return await getKbData();
}

    