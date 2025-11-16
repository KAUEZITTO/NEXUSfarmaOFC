

'use server';

import { kv } from './server/kv.server';
import path from 'path';
import { promises as fs } from 'fs';
import type { Product, Unit, Patient, Order, Dispensation, StockMovement, User, PatientFilter, SectorDispensation, KnowledgeBaseItem, UserLocation, HospitalOrderTemplateItem, HospitalPatient, HospitalSector, HospitalPatientDispensation } from './types';
import { getCurrentUser } from './session';

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

export async function getProducts(location?: UserLocation | 'all'): Promise<Product[]> {
    const allProducts = await readData<Product>('products');
    if (!location || location === 'all') {
        return allProducts;
    }
    return allProducts.filter(p => p.location === location);
}

export async function getProduct(productId: string): Promise<Product | null> {
    const products = await getProducts('all');
    return products.find(p => p.id === productId) || null;
}

export async function getUnits(): Promise<Unit[]> {
    const units = await readData<Unit>('units');
    return units.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getUnit(unitId: string): Promise<Unit | null> {
    const units = await getUnits();
    return units.find(u => u.id === unitId) || null;
}

export async function getOrders(): Promise<Order[]> {
    return await readData<Order>('orders');
}

export async function getOrder(orderId: string): Promise<Order | null> {
    const orders = await getOrders();
    return orders.find(o => o.id === orderId) || null;
}

export async function getOrdersForUnit(unitId: string): Promise<Order[]> {
    const allOrders = await readData<Order>('orders');
    const unitOrders = allOrders.filter(o => o.unitId === unitId);
    return unitOrders.sort((a,b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());
}

export async function getDispensation(dispensationId: string): Promise<Dispensation | null> {
    const dispensations = await getAllDispensations();
    return dispensations.find(d => d.id === dispensationId) || null;
}

export async function getDispensationsForPatient(patientId: string): Promise<Dispensation[]> {
    const allDispensations = await readData<Dispensation>('dispensations');
    return allDispensations.filter(d => d.patientId === patientId);
}

export async function getStockMovements(): Promise<StockMovement[]> {
    return await readData<StockMovement>('stockMovements');
}

export async function getAllUsers(): Promise<User[]> {
    const users = await readData<User>('users');
    return users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword as User;
    });
}

export async function getKnowledgeBase(): Promise<KnowledgeBaseItem[]> {
    // This function reads a local JSON file, it does not use 'use server' logic
    // but it's safe to be called from Server Components.
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'knowledge-base.json');
    const fileContents = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(fileContents);
    return data;
}

export async function getPatients(filter: PatientFilter = 'active', query?: string, unitId?: string): Promise<Patient[]> {
    const allPatients = await readData<Patient>('patients');
    
    let filteredPatients = allPatients;

    if (query) {
        const lowercasedQuery = query.toLowerCase();
        if (query.startsWith('pat_')) {
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
    
    if (unitId) {
        filteredPatients = filteredPatients.filter(p => p.unitId === unitId);
    }

    return filteredPatients.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPatient(patientId: string): Promise<Patient | null> {
    const patients = await readData<Patient>('patients');
    return patients.find(p => p.id === patientId) || null;
}

export async function getAllDispensations(): Promise<Dispensation[]> {
    return await readData<Dispensation>('dispensations');
}

export async function getAllPatients(): Promise<Patient[]> {
    return await readData<Patient>('patients');
};

export async function getSectorDispensations(): Promise<SectorDispensation[]> {
    return await readData<SectorDispensation>('sectorDispensations');
}

export async function getHospitalOrderTemplate(): Promise<HospitalOrderTemplateItem[]> {
    const data = await kv.get<HospitalOrderTemplateItem[]>('hospitalOrderTemplate');
    return data || [];
}

// --- HOSPITAL SPECIFIC DATA ---
export async function getHospitalPatients(): Promise<HospitalPatient[]> {
    const patients = await readData<HospitalPatient>('hospitalPatients');
    return patients.sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime());
}

export async function getHospitalSectors(): Promise<HospitalSector[]> {
    const sectors = await readData<HospitalSector>('hospitalSectors');
    return sectors.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getHospitalPatientDispensations(): Promise<HospitalPatientDispensation[]> {
    return await readData<HospitalPatientDispensation>('hospitalPatientDispensations');
}
