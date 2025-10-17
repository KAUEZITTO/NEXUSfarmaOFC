

// Adicionando tipos do NextAuth para extender o objeto de sessão
import type { DefaultUser, DefaultSession } from 'next-auth';
import { ColumnDef } from '@tanstack/react-table';

declare module 'next-auth' {
  interface Session {
    user?: DefaultUser & {
      id: string;
      name?: string | null;
      email?: string | null;
      birthdate?: string | null;
      role?: Role;
      subRole?: SubRole;
      accessLevel?: AccessLevel;
      lastSeen?: string;
      avatarColor?: string; 
    };
  }
  interface User extends DefaultUser {
      id: string;
      name?: string | null;
      email?: string | null;
      birthdate?: string | null;
      role?: Role;
      subRole?: SubRole;
      accessLevel?: AccessLevel;
      lastSeen?: string;
      avatarColor?: string;
  }
}

// O JWT precisa conter os dados que queremos persistir.
declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role?: Role;
        subRole?: SubRole;
        accessLevel?: AccessLevel;
        name?: string | null;
        email?: string | null;
        birthdate?: string | null;
        avatarColor?: string;
    }
}


export type Role =
  | 'Farmacêutico'
  | 'Coordenador'
  | 'Enfermeiro(a)'
  | 'Odontólogo(a)'
  | 'Biomédico(a)'
  | 'Técnico de Enfermagem'
  | 'Auxiliar de Farmácia'
  | 'Digitador';

export type SubRole = 'CAF' | 'CAPS' | 'Hospital' | 'e-Multi' | 'Outro';

export type AccessLevel = 'Admin' | 'User';

export type User = {
    id: string;
    email: string;
    name?: string;
    birthdate?: string;
    image?: string; // Kept in DB type, but not used in session
    role: Role;
    subRole?: SubRole;
    accessLevel: AccessLevel;
    lastSeen?: string; // ISO 8601 date string
    password?: string; // Only used for creation, should not be stored or returned in most cases
    avatarColor?: string; // e.g., 'hsl(211 100% 50%)'
}

export type Product = {
  id: string;
  name: string;
  commercialName?: string;
  manufacturer?: string;
  category: 'Medicamento' | 'Material Técnico' | 'Tiras de Glicemia/Lancetas' | 'Odontológico' | 'Laboratório' | 'Fraldas' | 'Fórmulas' | 'Não Padronizado (Compra)';
  therapeuticClass?: string; 
  mainFunction?: string; 
  quantity: number;
  expiryDate: string;
  status: 'Em Estoque' | 'Baixo Estoque' | 'Sem Estoque';
  batch?: string;
  presentation?: 'Comprimido' | 'Unidade' | 'Caixa c/ 100' | 'Seringa 4g' | 'Frasco 10ml' | 'Caixa c/ 50' | 'Caneta 3ml' | 'Pacote' | 'Bolsa' | 'Outro';
  supplier?: 'Casmed' | 'Mednutri' | 'Doação' | 'Outro';
  imageUrl?: string;
};

// Tipo para o produto agrupado, usado na interface do cliente
export type GroupedProduct = Product & {
    batches: Product[];
}

export type Unit = {
  id: string;
  name: string;
  type: string;
  address: string;
  coordinatorName?: string;
  hasDentalOffice?: boolean;
  hasPharmacy?: boolean;
};

export type PatientStatus = 'Ativo' | 'Tratamento Concluído' | 'Tratamento Interrompido' | 'Óbito';

export type Dosage = {
    id: string;
    period: 'Manhã' | 'Tarde' | 'Noite' | 'Ao deitar' | 'Após Café' | 'Jejum';
    quantity: number;
}

export type PatientDemandItem = 'Fraldas' | 'Insulinas Análogas' | 'Tiras de Glicemia' | 'Itens Judiciais' | 'Imunoglobulina' | 'Fórmulas' | 'Medicamentos/Materiais Comprados' | 'Materiais Técnicos (Acamados)';

export type PatientFile = {
    id: string;
    name: string;
    type: string;
    path: string; // This will be a data URL for the file
    uploadedAt: string;
}

export type Patient = {
    id: string;
    name: string;
    cpf: string;
    cns: string;
    rg?: string;
    address?: string;
    phone?: string;
    createdAt?: string; // ISO 8601 date string
    isAnalogInsulinUser?: boolean; // Kept for backwards compatibility if needed, but logic moves to demandItems
    diabetesType?: 'DM1' | 'DM2';
    analogInsulinType?: 'Lantus (Glargina)' | 'Apidra (Glulisina)' | 'Outro';
    customInsulinType?: string;
    insulinReportDate?: string;
    hasInsulinReport?: boolean;
    insulinDosages?: Dosage[];
    manualDispensingQuantity?: number;
    insulinPresentation?: 'Caneta' | 'Frasco';
    usesStrips?: boolean; // Kept for backwards compatibility if needed, logic moves to demandItems
    stripDosages?: Dosage[];
    demandItems?: PatientDemandItem[];
    unitName?: string;
    unitId?: string;
    status: PatientStatus;
    isBedridden?: boolean;
    pathology?: string;
    mandateType?: string; // Added from patient report
    files?: PatientFile[];
};

export type PatientFilter = 'active' | 'inactive' | 'insulin' | 'diapers' | 'bedridden' | 'legal' | 'municipal' | 'all';

export type OrderItem = {
    productId: string;
    name: string;
    quantity: number;
    batch?: string;
    expiryDate?: string;
    presentation?: string;
    category: string;
};

export type OrderType = 'Pedido Mensal' | 'Pedido Extra' | 'Pedido Urgente';

export type OrderStatus = 'Atendido' | 'Em análise' | 'Não atendido';

export type Order = {
  id: string;
  unitId: string;
  unitName: string;
  sentDate: string;
  deliveryDate?: string;
  status: OrderStatus;
  orderType: OrderType;
  itemCount: number;
  items: OrderItem[];
  notes?: string;
  creatorName?: string;
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
    patientId: string; 
    patient: Omit<Patient, 'files'>;
    date: string;
    items: DispensationItem[];
    creatorName?: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  type: 'Entrada' | 'Saída' | 'Ajuste';
  reason: 'Entrada por Compra' | 'Saída por Remessa' | 'Saída por Dispensação' | 'Ajuste de Inventário' | 'Entrada Inicial' | 'Estorno de Remessa' | 'Exclusão de Produto';
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  date: string;
  relatedId?: string; 
  user: string;
};

export type KnowledgeBaseItem = {
    name: string;
    therapeuticClass: string;
    mainFunction: string;
}

export { ColumnDef };
