
// Adicionando tipos do NextAuth para extender o objeto de sessão
import type { DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: DefaultUser & {
      id: string;
      name?: string | null;
      birthdate?: string | null;
      role?: Role;
      subRole?: SubRole;
      accessLevel?: AccessLevel;
      lastSeen?: string;
    };
  }
  interface User extends DefaultUser {
      id: string;
      name?: string | null;
      birthdate?: string | null;
      role?: Role;
      subRole?: SubRole;
      accessLevel?: AccessLevel;
      lastSeen?: string;
  }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        name?: string | null;
        birthdate?: string | null;
        image?: string | null;
        role?: Role;
        subRole?: SubRole;
        accessLevel?: AccessLevel;
        lastSeen?: string;
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
    image?: string;
    role: Role;
    subRole?: SubRole;
    accessLevel: AccessLevel;
    lastSeen?: string; // ISO 8601 date string
}

export type Product = {
  id: string;
  name: string;
  commercialName?: string;
  manufacturer?: string;
  category: 'Medicamento' | 'Material Técnico' | 'Odontológico' | 'Laboratório' | 'Fraldas' | 'Não Padronizado (Compra)';
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
    hasInsulinReport?: boolean;
    insulinDosages?: Dosage[];
    insulinPresentation?: 'Caneta' | 'Frasco';
    usesStrips?: boolean;
    stripDosages?: Dosage[];
    mandateType: 'Legal' | 'Municipal' | 'N/A';
    judicialItems?: ('Medicamentos' | 'Material Técnico')[];
    municipalItems?: ('Fraldas' | 'Material Técnico' | 'Medicamentos')[];
    unitName?: string;
    unitId?: string;
    status: PatientStatus;
    isBedridden?: boolean;
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

export type Order = {
  id: string;
  unitId: string;
  unitName: string;
  sentDate: string;
  deliveryDate?: string;
  status: 'Entregue' | 'Pendente' | 'Cancelado' | 'Em Trânsito';
  itemCount: number;
  items: OrderItem[];
  notes?: string;
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
};

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  type: 'Entrada' | 'Saída' | 'Ajuste';
  reason: 'Entrada por Compra' | 'Saída por Remessa' | 'Saída por Dispensação' | 'Ajuste de Inventário' | 'Entrada Inicial';
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
