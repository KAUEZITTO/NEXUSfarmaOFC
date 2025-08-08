import type { Product, Order, Patient, Unit, Dispensation } from './types';

export const products: Product[] = [
  { id: 'PROD001', name: 'Dipirona 500mg', category: 'Medicamento', quantity: 150, expiryDate: '2025-12-31', status: 'Em Estoque', batch: 'LOTE202401A', presentation: 'Comprimido' },
  { id: 'PROD002', name: 'Seringa 10ml', category: 'Material Técnico', quantity: 500, expiryDate: '2026-06-30', status: 'Em Estoque', batch: 'LOTE202402B', presentation: 'Unidade' },
  { id: 'PROD003', name: 'Luva de Procedimento (M)', category: 'Material Técnico', quantity: 20, expiryDate: '2024-09-30', status: 'Baixo Estoque', batch: 'LOTE202401M', presentation: 'Caixa c/ 100' },
  { id: 'PROD004', name: 'Resina Composta Z350', category: 'Odontológico', quantity: 0, expiryDate: '2025-01-15', status: 'Sem Estoque', batch: 'LOTE202312C', presentation: 'Seringa 4g' },
  { id: 'PROD005', name: 'Tubo de Coleta (Tampa Vermelha)', category: 'Laboratório', quantity: 1200, expiryDate: '2025-08-20', status: 'Em Estoque', batch: 'LOTE202405F', presentation: 'Unidade' },
  { id: 'PROD006', name: 'Paracetamol 750mg', category: 'Medicamento', quantity: 80, expiryDate: '2025-05-10', status: 'Em Estoque', batch: 'LOTE202403D', presentation: 'Comprimido' },
  { id: 'PROD007', name: 'Agulha Hipodérmica 25x7', category: 'Material Técnico', quantity: 250, expiryDate: '2026-02-28', status: 'Em Estoque', batch: 'LOTE202404E', presentation: 'Caixa c/ 100' },
  { id: 'PROD008', name: 'Insulina NPH', category: 'Medicamento', quantity: 50, expiryDate: '2025-11-30', status: 'Em Estoque', batch: 'LOTE-NPH-1', presentation: 'Frasco 10ml' },
  { id: 'PROD009', name: 'Insulina Regular', category: 'Medicamento', quantity: 40, expiryDate: '2026-01-31', status: 'Em Estoque', batch: 'LOTE-REG-2', presentation: 'Frasco 10ml' },
  { id: 'PROD010', name: 'Tiras de Glicemia', category: 'Material Técnico', quantity: 100, expiryDate: '2025-10-31', status: 'Em Estoque', batch: 'LOTE-TIRA-3', presentation: 'Caixa c/ 50' },
  { id: 'PROD011', name: 'Agulha para Caneta de Insulina 32G', category: 'Material Técnico', quantity: 300, expiryDate: '2026-04-30', status: 'Em Estoque', batch: 'LOTE-AGULHA-4', presentation: 'Caixa c/ 100' },
];

export const units: Unit[] = [
  { id: 'UNIT001', name: 'UBS Centro', type: 'Posto de Saúde', address: 'Rua Principal, 123' },
  { id: 'UNIT002', name: 'Hospital Municipal', type: 'Hospital', address: 'Av. da Saúde, 456' },
  { id: 'UNIT003', name: 'Laboratório Central', type: 'Laboratório', address: 'Rua das Análises, 789' },
  { id: 'UNIT004', name: 'CEO - Centro de Especialidades Odontológicas', type: 'Odontologia', address: 'Av. dos Dentistas, 101' },
  { id: 'UNIT005', name: 'UBS Bairro Novo', type: 'Posto de Saúde', address: 'Rua Projetada, 321' },
];

export const patients: Patient[] = [
    { id: 'PAT001', name: 'João da Silva', cpf: '111.222.333-44', cns: '898 0010 7777 6666', mandateType: 'Legal', unitName: 'UBS Centro', status: 'Ativo' },
    { id: 'PAT002', name: 'Maria Oliveira', cpf: '555.666.777-88', cns: '700 5050 4444 3333', mandateType: 'Municipal', unitName: 'Hospital Municipal', status: 'Ativo' },
    { id: 'PAT003', name: 'José Pereira', cpf: '999.888.777-66', cns: '708 2020 1111 0000', mandateType: 'Legal', unitName: 'UBS Centro', status: 'Tratamento Concluído' },
    { id: 'PAT004', name: 'Ana Souza', cpf: '123.456.789-00', cns: '704 8080 2222 9999', mandateType: 'N/A', unitName: 'UBS Bairro Novo', status: 'Ativo' },
];

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
        patient: patients[0],
        date: '21/05/2024',
        items: [
            { productId: 'PROD008', name: 'Insulina NPH', quantity: 2, category: 'Insulinas', presentation: 'Frasco 10ml', batch: 'LOTE-NPH-1', expiryDate: '30/11/2025' },
            { productId: 'PROD010', name: 'Tiras de Glicemia', quantity: 1, category: 'Tiras/Lancetas', presentation: 'Caixa c/ 50', batch: 'LOTE-TIRA-3', expiryDate: '31/10/2025' }
        ]
    },
    { 
        id: 'DISP-1716310000000', 
        patientId: 'PAT002', 
        patient: patients[1],
        date: '22/05/2024',
        items: [
            { productId: 'PROD006', name: 'Paracetamol 750mg', quantity: 30, category: 'Medicamentos', presentation: 'Comprimido', batch: 'LOTE202403D', expiryDate: '10/05/2025' }
        ]
    },
        { 
        id: 'DISP-1716320000000', 
        patientId: 'PAT001', 
        patient: patients[0],
        date: '23/05/2024',
        items: [
            { productId: 'FRD001', name: 'Fralda Geriátrica M', quantity: 4, category: 'Fraldas', presentation: 'Pacote' }
        ]
    }
];