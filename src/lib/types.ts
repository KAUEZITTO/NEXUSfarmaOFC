export type Product = {
  id: string;
  name: string;
  category: 'Medicamento' | 'Material Técnico' | 'Odontológico' | 'Laboratório' | 'Outro';
  quantity: number;
  expiryDate: string;
  status: 'Em Estoque' | 'Baixo Estoque' | 'Sem Estoque';
  batch?: string;
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
    mandateType: 'Legal' | 'Municipal' | 'N/A';
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
