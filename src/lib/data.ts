

import { kv } from '@/lib/kv';
import { Product, Unit, Patient, Order, Dispensation, StockMovement, User, PatientFilter } from './types';
import { getKnowledgeBase as getKbData } from './actions';

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

export const getProducts = async (): Promise<Product[]> => {
    return await readData<Product>('products');
};

export async function getProduct(productId: string): Promise<Product | null> {
    const products = await getProducts();
    return products.find(p => p.id === productId) || null;
}

export const getUnits = async (): Promise<Unit[]> => {
    return await readData<Unit>('units');
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

export async function getKnowledgeBase() {
    return await getKbData();
}

