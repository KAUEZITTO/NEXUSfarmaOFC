
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UserCheck,
  Search,
  PlusCircle,
  X,
  Save,
  ChevronLeft,
  Stethoscope,
  Syringe,
  Pill,
  Baby,
  Package,
  ClipboardList,
} from 'lucide-react';
import { patients as allPatients, products as allProducts } from '@/lib/data';
import type { Patient, Product } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type DispensationItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  batch?: string;
  expiryDate?: string;
  source: 'Estoque' | 'Farmácia';
  category: string;
};

type Category =
  | 'Insulinas'
  | 'Tiras/Lancetas'
  | 'Medicamentos'
  | 'Material Técnico'
  | 'Fraldas'
  | 'Outros';

const categories: {
  name: Category;
  icon: React.ElementType;
  fields: ('lote' | 'validade' | 'nome')[];
}[] = [
  { name: 'Insulinas', icon: Syringe, fields: ['lote', 'validade'] },
  { name: 'Tiras/Lancetas', icon: ClipboardList, fields: ['lote', 'validade'] },
  { name: 'Medicamentos', icon: Pill, fields: ['lote', 'validade'] },
  { name: 'Fraldas', icon: Baby, fields: [] },
  { name: 'Material Técnico', icon: Stethoscope, fields: ['nome'] },
  { name: 'Outros', icon: Package, fields: ['nome'] },
];

const insulinTypes = [
    { id: 'INS001', name: 'Lantus', batch: 'LOTE-LANTUS-1', expiryDate: '2025-10-31' },
    { id: 'INS002', name: 'NPH Refil', batch: 'LOTE-NPHR-2', expiryDate: '2025-11-30' },
    { id: 'INS003', name: 'NPH Frasco', batch: 'LOTE-NPHF-3', expiryDate: '2025-12-31' },
    { id: 'INS004', name: 'Regular', batch: 'LOTE-REG-4', expiryDate: '2026-01-31' },
];

export function AttendPatientDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'selectPatient' | 'dispenseForm'>(
    'selectPatient'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [items, setItems] = useState<DispensationItem[]>([]);
  const { toast } = useToast();

  const filteredPatients = allPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cpf.includes(searchTerm)
  );

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setStep('dispenseForm');
  };

  const handleBack = () => {
    setStep('selectPatient');
    setSelectedPatient(null);
    setSelectedCategory(null);
    setItems([]);
  };

  const handleAddItem = () => {
    if (!selectedCategory) return;
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        productId: '',
        name: '',
        quantity: 1,
        source: 'Estoque',
        category: selectedCategory,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof DispensationItem,
    value: any
  ) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };
  
  const handleProductSelect = (id: string, productId: string) => {
     let product: { name: string; batch?: string; expiryDate?: string; } | undefined;

     if (selectedCategory === 'Insulinas' || selectedCategory === 'Tiras/Lancetas') {
        product = insulinTypes.find(p => p.id === productId);
     } else {
        product = allProducts.find(p => p.id === productId);
     }
     
     if (product) {
         setItems(items.map(item => item.id === id ? {
            ...item,
            productId: productId,
            name: product!.name,
            batch: product!.batch || 'N/A',
            expiryDate: product!.expiryDate ? new Date(product!.expiryDate).toLocaleDateString('pt-BR') : 'N/A'
         } : item));
     }
  }


  const handleSaveDispensation = () => {
    console.log('Dispensa salva:', { patient: selectedPatient, items });
    toast({
      title: 'Dispensação Registrada!',
      description: `Os itens foram dispensados para ${selectedPatient?.name}.`,
    });
    setIsOpen(false);
    // Reset state for next time
    setTimeout(() => {
        handleBack();
    }, 300);
  };
  
  const renderItemInput = (item: DispensationItem) => {
    const categoryInfo = categories.find(c => c.name === selectedCategory);
    if (!categoryInfo) return null;
    
    if (selectedCategory === 'Insulinas' || selectedCategory === 'Tiras/Lancetas' || selectedCategory === 'Medicamentos') {
        const productList = selectedCategory === 'Insulinas' ? insulinTypes : allProducts.filter(p => p.category === 'Medicamento');
         return (
             <Select value={item.productId} onValueChange={(value) => handleProductSelect(item.id, value)}>
                <SelectTrigger><SelectValue placeholder="Selecione o item..." /></SelectTrigger>
                <SelectContent>
                    {productList.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
             </Select>
         )
    }

    if (categoryInfo.fields.includes('nome')) {
        return (
            <Input 
                placeholder="Nome do item"
                value={item.name}
                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
            />
        )
    }
    
    return <span className="text-muted-foreground">--</span>;
  }

  const renderTable = () => {
    if (!selectedCategory) return null;
    const categoryInfo = categories.find((c) => c.name === selectedCategory);

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">{selectedCategory}</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Item</TableHead>
              {categoryInfo?.fields.includes('lote') && <TableHead>Lote</TableHead>}
              {categoryInfo?.fields.includes('validade') && <TableHead>Validade</TableHead>}
              <TableHead>Origem</TableHead>
              <TableHead className="w-[100px]">Qtd.</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items
              .filter((i) => i.category === selectedCategory)
              .map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{renderItemInput(item)}</TableCell>
                  {categoryInfo?.fields.includes('lote') && <TableCell>{item.batch || 'N/A'}</TableCell>}
                  {categoryInfo?.fields.includes('validade') && <TableCell>{item.expiryDate || 'N/A'}</TableCell>}
                  <TableCell>
                     <Select value={item.source} onValueChange={(value) => handleItemChange(item.id, 'source', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Estoque">Estoque</SelectItem>
                            <SelectItem value="Farmácia">Farmácia</SelectItem>
                        </SelectContent>
                     </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value))}
                      min="1"
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={handleAddItem}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Item
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserCheck className="mr-2 h-4 w-4" />
          Atender Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {step === 'selectPatient' ? (
              'Atender Paciente'
            ) : (
              <>
                <Button variant="ghost" size="icon" className="mr-2" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                Dispensação para: {selectedPatient?.name}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-hidden">
          {step === 'selectPatient' && (
            <div className="p-1">
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome ou CPF..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[calc(80vh-150px)]">
                <div className="space-y-2">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          CPF: {patient.cpf}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Selecionar
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {step === 'dispenseForm' && selectedPatient && (
            <ScrollArea className="h-[calc(90vh-150px)]">
              <div className="p-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados do Paciente</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold">Nome:</span> {selectedPatient.name}</div>
                    <div><span className="font-semibold">CPF:</span> {selectedPatient.cpf}</div>
                    <div><span className="font-semibold">Mandado:</span> {selectedPatient.mandateType}</div>
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Selecione uma categoria para dispensar:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {categories.map(({ name, icon: Icon }) => (
                      <button
                        key={name}
                        onClick={() => setSelectedCategory(name)}
                        className={cn(
                          'flex flex-col items-center justify-center p-4 border rounded-lg aspect-square text-center',
                          'hover:bg-accent hover:text-accent-foreground transition-colors',
                          selectedCategory === name && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                        )}
                      >
                        <Icon className="h-8 w-8 mb-2" />
                        <span className="text-sm font-medium">{name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCategory && renderTable()}
              </div>
            </ScrollArea>
          )}
        </div>

        {step === 'dispenseForm' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveDispensation} disabled={items.length === 0}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Dispensação
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
