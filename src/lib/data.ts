import type { Product, Order, Patient, Unit, Dispensation } from './types';

export const products: Product[] = []; // This will now be fetched from Firestore

export const units: Unit[] = []; // This will now be fetched from Firestore

export const patients: Patient[] = []; // This will now be fetched from Firestore

export const orders: Order[] = [
  { id: 'ORD001', unitId: 'UNIT001', unit: 'UBS Centro', sentDate: '2024-05-20', deliveryDate: '2024-05-21', status: 'Entregue', itemCount: 5 },
  { id: 'ORD002', unitId: 'UNIT002', unit: 'Hospital Municipal', patient: 'João da Silva', sentDate: '2024-05-19', deliveryDate: '2024-05-20', status: 'Entregue', itemCount: 2 },
  { id: 'ORD003', unitId: 'UNIT004', unit: 'CEO', sentDate: '2024-05-18', status: 'Em Trânsito', itemCount: 12 },
  { id: 'ORD004', unitId: 'UNIT003', unit: 'Laboratório Central', sentDate: '2024-05-17', status: 'Cancelado', itemCount: 8 },
  { id: 'ORD005', unitId: 'UNIT001', unit: 'UBS Bairro Novo', sentDate: '2024-05-16', deliveryDate: '2024-05-17', status: 'Entregue', itemCount: 3 },
  { id: 'ORD006', unitId: 'UNIT002', unit: 'Hospital Municipal', sentDate: '2024-06-01', status: 'Pendente', itemCount: 7 },
  { id: 'ORD007', unitId: 'UNIT001', unit: 'UBS Centro', sentDate: '2024-06-02', status: 'Em Trânsito', itemCount: 4 },
];

// Mock data for dispensations
export const dispensations: Dispensation[] = [
    { 
        id: 'DISP-1716300000000', 
        patientId: 'PAT001', 
        patient: { id: 'PAT001', name: 'João da Silva', cpf: '111.222.333-44', cns: '898 0010 7777 6666', mandateType: 'Legal', unitName: 'UBS Centro', status: 'Ativo' },
        date: '21/05/2024',
        items: [
            { productId: 'PROD-008', name: 'Insulina NPH', quantity: 2, category: 'Medicamentos', presentation: 'Frasco 10ml', batch: 'LOTE-NPH-1', expiryDate: '30/11/2025' },
            { productId: 'PROD-010', name: 'Tiras de Glicemia', quantity: 1, category: 'Material Técnico', presentation: 'Caixa c/ 50', batch: 'LOTE-TIRA-3', expiryDate: '31/10/2025' }
        ]
    },
    { 
        id: 'DISP-1716310000000', 
        patientId: 'PAT002', 
        patient: { id: 'PAT002', name: 'Maria Oliveira', cpf: '555.666.777-88', cns: '700 5050 4444 3333', mandateType: 'Municipal', unitName: 'Hospital Municipal', status: 'Ativo' },
        date: '22/05/2024',
        items: [
            { productId: 'PROD-006', name: 'Paracetamol 750mg', quantity: 30, category: 'Medicamentos', presentation: 'Comprimido', batch: 'LOTE202403D', expiryDate: '10/05/2025' }
        ]
    },
        { 
        id: 'DISP-1716320000000', 
        patientId: 'PAT001', 
        patient: { id: 'PAT001', name: 'João da Silva', cpf: '111.222.333-44', cns: '898 0010 7777 6666', mandateType: 'Legal', unitName: 'UBS Centro', status: 'Ativo' },
        date: '23/05/2024',
        items: [
            { productId: 'FRD001', name: 'Fralda Geriátrica M', quantity: 4, category: 'Fraldas', presentation: 'Pacote' }
        ]
    }
];
