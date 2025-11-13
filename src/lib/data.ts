
import { Product, Unit, Patient, Order, Dispensation, StockMovement, User, PatientFilter, SectorDispensation } from './types';
import type { KnowledgeBaseItem } from './types';
import { kv } from '@/lib/server/kv.server';
import path from 'path';
import { promises as fs } from 'fs';


// --- GENERIC DATA ACCESS ---

export const readData = async <T>(key: string): Promise<T[]> => {
    try {
        const data = await kv.get<T[]>(key);
        return data || [];
    } catch (error) {
        console.error(`Error reading data from KV for key "${key}":`, error);
        return [];
    }
};

export async function writeData<T>(key: string, data: T[]): Promise<void> {
    try {
        await kv.set(key, data);
    } catch (error) {
        console.error(`Error writing data to KV for key "${key}":`, error);
        throw error;
    }
}

// --- SPECIFIC DATA ACCESSORS ---

export async function getProducts(): Promise<Product[]> {
    try {
        const products = await readData<Product>('products');
        return products;
    } catch (error) {
        console.error("Falha ao buscar produtos no KV:", error);
        return [];
    }
}

export async function getProduct(productId: string): Promise<Product | null> {
    const products = await readData<Product>('products');
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

export const getOrders = async (): Promise<Order[]> => {
    return await readData<Order>('orders');
};

export async function getOrder(orderId: string): Promise<Order | null> {
    const orders = await getOrders();
    return orders.find(o => o.id === orderId) || null;
}

export const getOrdersForUnit = async (unitId: string): Promise<Order[]> => {
    const allOrders = await readData<Order>('orders');
    const unitOrders = allOrders.filter(o => o.unitId === unitId);
    return unitOrders.sort((a,b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());
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
    return users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword as User;
    });
}

export async function getKnowledgeBase(): Promise<KnowledgeBaseItem[]> {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'knowledge-base.json');
    const fileContents = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(fileContents);
    return data;
}

// --- Functions that were Server Actions and now are regular data fetching functions ---

export async function getPatients(filter: PatientFilter = 'active', query?: string, unitId?: string): Promise<Patient[]> {
    const allPatients = await readData<Patient>('patients');
    
    let filteredPatients = allPatients;

    // Se uma query de busca é fornecida, ela tem prioridade e busca em todos os pacientes.
    if (query) {
        const lowercasedQuery = query.toLowerCase();
        if (query.startsWith('pat_')) { // Busca por ID exato
            const foundPatient = allPatients.find(p => p.id === query);
            return foundPatient ? [foundPatient] : [];
        }
        
        filteredPatients = allPatients.filter(patient => {
            const numericQuery = query.replace(/[^\d]/g, '');
            return (
                patient.name.toLowerCase().includes(lowercasedQuery) ||
                (patient.cpf && patient.cpf.replace(/[^\d]/g, '').includes(numericQuery)) ||
                (patient.cns && patient.cns.replace(/[^\d]/g, '').includes(numericQuery))
            );
        });
    } else {
        // Se não há query, aplica os filtros de categoria.
        if (filter !== 'all') {
            switch (filter) {
                case 'active':
                    filteredPatients = allPatients.filter(p => p.status === 'Ativo');
                    break;
                case 'inactive':
                    filteredPatients = allPatients.filter(p => p.status !== 'Ativo');
                    break;
                case 'insulin':
                    filteredPatients = allPatients.filter(p => p.demandItems?.includes('Insulinas Análogas') && p.status === 'Ativo');
                    break;
                case 'diapers':
                    filteredPatients = allPatients.filter(p => p.demandItems?.includes('Fraldas') && p.status === 'Ativo');
                    break;
                case 'strips':
                    filteredPatients = allPatients.filter(p => p.demandItems?.includes('Tiras de Glicemia') && p.status === 'Ativo');
                    break;
                case 'formulas':
                    filteredPatients = allPatients.filter(p => p.demandItems?.includes('Fórmulas') && p.status === 'Ativo');
                    break;
                case 'immunoglobulin':
                    filteredPatients = allPatients.filter(p => p.demandItems?.includes('Imunoglobulina') && p.status === 'Ativo');
                    break;
                case 'bedridden':
                    filteredPatients = allPatients.filter(p => p.isBedridden && p.status === 'Ativo');
                    break;
                case 'legal':
                    filteredPatients = allPatients.filter(p => p.demandItems?.includes('Itens Judiciais') && p.status === 'Ativo');
                    break;
                case 'municipal':
                    filteredPatients = allPatients.filter(p => p.demandItems?.includes('Medicamentos/Materiais Comprados') && p.status === 'Ativo');
                    break;
                default:
                    break;
            }
        }
    }
    
    // Filtro adicional por unidade, se fornecido.
    if (unitId) {
        filteredPatients = filteredPatients.filter(p => p.unitId === unitId);
    }

    return filteredPatients.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllDispensations(): Promise<Dispensation[]> {
    const dispensations = await readData<Dispensation>('dispensations');
    return dispensations;
}

export async function getAllPatients(): Promise<Patient[]> {
    return await readData<Patient>('patients');
};

export async function getSectorDispensations(): Promise<SectorDispensation[]> {
    return await readData<SectorDispensation>('sectorDispensations');
}
