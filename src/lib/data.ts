

import { Product, Unit, Patient, Order, Dispensation, StockMovement, User, PatientFilter } from './types';
import type { KnowledgeBaseItem } from './types';


// --- GENERIC DATA ACCESS ---

export const readData = async <T>(key: string): Promise<T[]> => {
    // Import kv inside the function to avoid build errors
    const { kv } = await import('@/lib/server/kv.server');
    try {
        const data = await kv.get<T[]>(key);
        return data || [];
    } catch (error) {
        console.error(`Error reading data from KV for key "${key}":`, error);
        return [];
    }
};

export async function writeData<T>(key: string, data: T[]): Promise<void> {
    // Import kv inside the function to avoid build errors
    const { kv } = await import('@/lib/server/kv.server');
    try {
        await kv.set(key, data);
    } catch (error) {
        console.error(`Error writing data to KV for key "${key}":`, error);
        throw error;
    }
}

// --- SPECIFIC DATA ACCESSORS ---

/**
 * Fetches all products from the data source.
 * This is a standard data-fetching function.
 * @returns A promise that resolves to an array of products.
 */
export async function getProducts(): Promise<Product[]> {
    try {
        const products = await readData<Product>('products');
        return products;
    } catch (error) {
        console.error("Falha ao buscar produtos no KV:", error);
        return []; // Retorna um array vazio em caso de erro.
    }
}

export async function getProduct(productId: string): Promise<Product | null> {
    const products = await getProducts();
    return products.find(p => p.id === productId) || null;
}

export const getUnits = async (): Promise<Unit[]> => {
    const units = await readData<Unit>('units');
    return units.sort((a, b) => a.name.localeCompare(b.name));
};

export async function getUnit(unitId: string): Promise<Unit | null> {
    const units = await getUnits();
    return units.find(u => u.id === unitId) || null;
}

export const getPatients = async (filter: PatientFilter = 'active'): Promise<Patient[]> => {
    const allPatients = await readData<Patient>('patients');
    
    switch (filter) {
        case 'active':
            return allPatients.filter(p => p.status === 'Ativo');
        case 'inactive':
            return allPatients.filter(p => p.status !== 'Ativo');
        case 'insulin':
            return allPatients.filter(p => p.demandItems?.includes('Insulinas Análogas') && p.status === 'Ativo');
        case 'diapers':
             return allPatients.filter(p => p.demandItems?.includes('Fraldas') && p.status === 'Ativo');
        case 'bedridden':
            return allPatients.filter(p => p.isBedridden && p.status === 'Ativo');
        case 'legal':
            return allPatients.filter(p => p.demandItems?.includes('Itens Judiciais') && p.status === 'Ativo');
        case 'municipal':
            return allPatients.filter(p => p.demandItems?.includes('Itens Judiciais') && p.status === 'Ativo'); // Assuming judicial covers this.
        case 'all':
        default:
            return allPatients;
    }
};

export const getAllPatients = async (): Promise<Patient[]> => {
    return await readData<Patient>('patients');
};

export async function getPatient(patientId: string): Promise<Patient | null> {
    const patients = await getAllPatients();
    return patients.find(p => p.id === patientId) || null;
}

export const getOrders = async (): Promise<Order[]> => {
    return await readData<Order>('orders');
};

export async function getOrder(orderId: string): Promise<Order | null> {
    const orders = await getOrders();
    return orders.find(o => o.id === orderId) || null;
}

export const getOrdersForUnit = async (unitId: string): Promise<Order[]> => {
    const allOrders = await readData<Order>('orders');
    return allOrders.filter(o => o.unitId === unitId);
};

export const getAllDispensations = async (): Promise<Dispensation[]> => {
    return await readData<Dispensation>('dispensations');
};

export async function getDispensation(dispensationId: string): Promise<Dispensation | null> {
    const dispensations = await getAllDispensations();
    return dispensations.find(d => d.id === dispensationId) || null;
}

export const getDispensationsForPatient = async (patientId: string): Promise<Dispensation[]> => {
    const allDispensations = await readData<Dispensation>('dispensations');
    return allDispensations.filter(d => d.patientId === patientId);
};

export const getStockMovements = async (): Promise<StockMovement[]> => {
    return await readData<StockMovement>('stockMovements');
};

export async function getAllUsers(): Promise<User[]> {
    const users = await readData<User>('users');
    // Remove o campo 'password' de cada usuário antes de retornar
    return users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword as User;
    });
}

/**
 * Busca um usuário no nosso banco de dados (Vercel KV) pelo email.
 * Centraliza a lógica de leitura e tratamento de erros.
 */
export async function getUserByEmailFromDb(email: string): Promise<User | null> {
  if (!email) return null;
  try {
    const users = await readData<User>('users');
    const user = users.find(u => u.email === email);
    return user || null;
  } catch (error) {
    console.error("CRITICAL: Falha ao ler dados do usuário do Vercel KV.", error);
    // Em caso de falha de leitura do banco, o login deve ser impedido.
    return null;
  }
}

/**
 * Busca um usuário no banco de dados. Se não encontrar, cria um novo com base nos dados do provedor.
 * Esta função é robusta, buscando primeiro por ID e depois por email.
 */
export async function getOrCreateUser(userData: { id: string; email: string; name?: string | null; image?: string | null; }): Promise<User | null> {
    const allUsers = await readData<User>('users');
    
    // 1. Tenta encontrar pelo ID (método mais confiável)
    let existingUser = allUsers.find(u => u.id === userData.id);
    if (existingUser) {
        return existingUser;
    }

    // 2. Se não encontrou pelo ID, tenta pelo email (fallback para consistência)
    const userByEmail = allUsers.find(u => u.email === userData.email);
    if (userByEmail) {
         // Opcional: corrigir o ID se estiver inconsistente
        if (userByEmail.id !== userData.id) {
            console.warn(`Inconsistência de ID encontrada para ${userData.email}. Atualizando para o ID correto do Firebase.`);
            userByEmail.id = userData.id;
            const userIndex = allUsers.findIndex(u => u.email === userData.email);
            if (userIndex !== -1) {
                allUsers[userIndex] = userByEmail;
                await writeData('users', allUsers);
            }
        }
        return userByEmail;
    }

    // 3. Se não existe de forma alguma, cria um novo perfil.
    console.log(`Nenhum perfil encontrado para ${userData.email}. Criando um novo...`);
    const newUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        image: userData.image || undefined,
        role: 'Farmacêutico', // Role padrão
        accessLevel: allUsers.length === 0 ? 'Admin' : 'User', // O primeiro usuário é sempre Admin.
    };

    try {
        await writeData('users', [...allUsers, newUser]);
        console.log(`Novo perfil criado com sucesso para ${userData.email}.`);
        return newUser;
    } catch (error) {
        console.error(`Falha ao criar o perfil para ${userData.email}:`, error);
        return null;
    }
}

export async function getKnowledgeBase(): Promise<KnowledgeBaseItem[]> {
    // A importação foi movida para dentro da função para evitar que a análise
    // de dependências do Next.js a associe incorretamente a Server Actions durante o build.
    const kb = (await import('@/data/knowledge-base.json')).default;
    return kb;
}
