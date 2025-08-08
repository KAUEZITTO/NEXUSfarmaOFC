import type { Product, Order, Patient, Unit } from './types';

export const products: Product[] = [
  { id: 'PROD001', name: 'Dipirona 500mg', category: 'Medicamento', quantity: 150, expiryDate: '2025-12-31', status: 'Em Estoque' },
  { id: 'PROD002', name: 'Seringa 10ml', category: 'Material Técnico', quantity: 500, expiryDate: '2026-06-30', status: 'Em Estoque' },
  { id: 'PROD003', name: 'Luva de Procedimento (M)', category: 'Material Técnico', quantity: 20, expiryDate: '2024-09-30', status: 'Baixo Estoque' },
  { id: 'PROD004', name: 'Resina Composta Z350', category: 'Odontológico', quantity: 0, expiryDate: '2025-01-15', status: 'Sem Estoque' },
  { id: 'PROD005', name: 'Tubo de Coleta (Tampa Vermelha)', category: 'Laboratório', quantity: 1200, expiryDate: '2025-08-20', status: 'Em Estoque' },
  { id: 'PROD006', name: 'Paracetamol 750mg', category: 'Medicamento', quantity: 80, expiryDate: '2025-05-10', status: 'Em Estoque' },
  { id: 'PROD007', name: 'Agulha Hipodérmica 25x7', category: 'Material Técnico', quantity: 250, expiryDate: '2026-02-28', status: 'Em Estoque' },
];

export const units: Unit[] = [
  { id: 'UNIT001', name: 'UBS Centro', type: 'Posto de Saúde', address: 'Rua Principal, 123' },
  { id: 'UNIT002', name: 'Hospital Municipal', type: 'Hospital', address: 'Av. da Saúde, 456' },
  { id: 'UNIT003', name: 'Laboratório Central', type: 'Laboratório', address: 'Rua das Análises, 789' },
  { id: 'UNIT004', name: 'CEO - Centro de Especialidades Odontológicas', type: 'Odontologia', address: 'Av. dos Dentistas, 101' },
  { id: 'UNIT005', name: 'UBS Bairro Novo', type: 'Posto de Saúde', address: 'Rua Projetada, 321' },
];

export const patients: Patient[] = [
    { id: 'PAT001', name: 'João da Silva', cpf: '111.222.333-44', mandateType: 'Legal' },
    { id: 'PAT002', name: 'Maria Oliveira', cpf: '555.666.777-88', mandateType: 'Municipal' },
    { id: 'PAT003', name: 'José Pereira', cpf: '999.888.777-66', mandateType: 'Legal' },
    { id: 'PAT004', name: 'Ana Souza', cpf: '123.456.789-00', mandateType: 'N/A' },
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
