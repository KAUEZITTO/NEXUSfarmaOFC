export type Product = {
  id: string;
  name: string;
  category: 'Medicamento' | 'Material Técnico' | 'Odontológico' | 'Laboratório' | 'Outro';
  quantity: number;
  expiryDate: string;
  status: 'Em Estoque' | 'Baixo Estoque' | 'Sem Estoque';
  batch?: string;
  presentation?: string;
};

export type Unit = {
  id: string;
  name: string;
  type: 'Hospital' | 'Posto de Saúde' | 'Laboratório' | 'Odontologia' | 'Outro';
  address: string;
};

export type Patient = {
    id: string;
    name: string;
    cpf: string;
    cns: string;
    rg?: string;
    address?: string;
    phone?: string;
    isAnalogInsulinUser?: boolean;
    analogInsulinType?: 'Lantus (Glargina)' | 'Apidra (Glulisina)';
    mandateType: 'Legal' | 'Municipal' | 'N/A';
    judicialItems?: ('Medicamentos' | 'Material Técnico')[];
    municipalItems?: ('Fraldas' | 'Material Técnico' | 'Medicamentos')[];
    unitName?: string;
    unitId?: string;
};

export type Order = {
  id: string;
  unit: string;
  unitId: string;
  patient?: string;
  sentDate: string;
  deliveryDate?: string;
  status: 'Entregue' | 'Pendente' | 'Cancelado' | 'Em Trânsito';
  itemCount: number;
};

export type DispensationItem = {
  productId: string;
  name: string;
  quantity: number;
  batch?: string;
  expiryDate?: string;
  presentation?: string;
  category: string;
};

export type Dispensation = {
    id: string;
    patientId: string; // Keep patientId for easy filtering
    patient: Patient;
    date: string;
    items: DispensationItem[];
};
