
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
import type { Patient, Product, DispensationItem as DispensationItemType } from '@/lib/types';
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
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type DispensationItem = DispensationItemType & {
  internalId: string;
}

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
  productCategory: Product['category'] | 'Fralda' | 'Insulina' | 'Tira/Lanceta';
}[] = [
  { name: 'Insulinas', icon: Syringe, productCategory: 'Insulina' },
  { name: 'Tiras/Lancetas', icon: ClipboardList, productCategory: 'Tira/Lanceta' },
  { name: 'Medicamentos', icon: Pill, productCategory: 'Medicamento' },
  { name: 'Material Técnico', icon: Stethoscope, productCategory: 'Material Técnico' },
  { name: 'Fraldas', icon: Baby, productCategory: 'Fralda' },
  { name: 'Outros', icon: Package, productCategory: 'Outro' },
];

const getProductsForCategory = (category: Category): Partial<Product>[] => {
    const categoryInfo = categories.find(c => c.name === category);
    if (!categoryInfo) return [];

    if (category === 'Fraldas') {
        return [{ id: 'FRD001', name: 'Fralda Geriátrica M', presentation: 'Pacote' }, { id: 'FRD002', name: 'Fralda Geriátrica G', presentation: 'Pacote' }];
    }
    
    // This is a special mapping for Insulinas, Tiras/Lancetas etc.
    const productCategoryMapping: Record<string, Product['category'] | 'any'> = {
      'Insulinas': 'Medicamento',
      'Tiras/Lancetas': 'Material Técnico',
      'Medicamentos': 'Medicamento',
      'Material Técnico': 'Material Técnico',
      'Outros': 'any',
    }
    const productCategory = productCategoryMapping[category];

    let filtered = productCategory === 'any' ? allProducts : allProducts.filter(p => p.category === productCategory);
    
    if (category === 'Insulinas') {
        filtered = filtered.filter(p => p.name.toLowerCase().includes('insulina') || p.name.toLowerCase().includes('agulha para caneta'));
    }
    if (category === 'Tiras/Lancetas') {
        filtered = filtered.filter(p => p.name.toLowerCase().includes('tira') || p.name.toLowerCase().includes('lanceta'));
    }

    return filtered;
}


export function AttendPatientDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'selectPatient' | 'dispenseForm'>(
    'selectPatient'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
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
    setItems([]);
  };

  const handleAddItem = (category: Category) => {
    setItems([
      ...items,
      {
        internalId: `item-${Date.now()}`,
        productId: '',
        name: '',
        quantity: 1,
        category: category,
        presentation: '',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.internalId !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof DispensationItem,
    value: any
  ) => {
    setItems(
      items.map((item) => (item.internalId === id ? { ...item, [field]: value } : item))
    );
  };
  
  const handleProductSelect = (id: string, productId: string) => {
     const itemToUpdate = items.find(i => i.internalId === id);
     if (!itemToUpdate) return;
     
     const productList = getProductsForCategory(itemToUpdate.category as Category);
     const product = productList.find(p => p.id === productId);
     
     if (product) {
         setItems(items.map(item => item.internalId === id ? {
            ...item,
            productId: productId,
            name: product.name!,
            batch: product.batch || 'N/A',
            expiryDate: product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('pt-BR') : 'N/A',
            presentation: product.presentation || '--'
         } : item));
     }
  }


  const handleSaveDispensation = () => {
    if (!selectedPatient) return;

    const dispensationId = `DISP-${Date.now()}`;
    const dispensationData = {
      id: dispensationId,
      patientId: selectedPatient.id,
      patient: selectedPatient,
      date: new Date().toLocaleDateString('pt-BR'),
      items: items.map(({ internalId, ...rest }) => rest), // Remove internalId before saving
    };
    
    // In a real app, you'd save this to a DB. 
    // Here, we can add it to our mock data array for the history page to work.
    // Note: this won't persist across reloads without a backend.
    allDispensations.push(dispensationData);

    toast({
      title: 'Dispensação Registrada!',
      description: `Gerando recibo para ${selectedPatient?.name}.`,
    });
    
    setIsOpen(false);
    
    // Redirect to the receipt page with a query param to trigger printing
    router.push(`/dispensation-receipt/${dispensationId}?new=true`);

    // Reset state for next time
    setTimeout(() => {
        handleBack();
    }, 300);
  };
  
  const renderItemInput = (item: DispensationItem) => {
    const productList = getProductsForCategory(item.category as Category);

    if (productList.length > 0) {
      return (
        <Select value={item.productId} onValueChange={(value) => handleProductSelect(item.internalId, value)}>
          <SelectTrigger><SelectValue placeholder="Selecione o item..." /></SelectTrigger>
          <SelectContent>
            {productList.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    
    // For categories with manual input
    return (
        <Input 
            placeholder="Nome do item"
            value={item.name}
            onChange={(e) => handleItemChange(item.internalId, 'name', e.target.value)}
        />
    )
  }
  
  const renderDispensationTables = () => {
    const groupedItems = items.reduce((acc, item) => {
        const category = item.category as Category;
        (acc[category] = acc[category] || []).push(item);
        return acc;
    }, {} as Record<Category, DispensationItem[]>);

    return (
        <div className="space-y-6">
            {categories.map(categoryInfo => {
                const categoryItems = groupedItems[categoryInfo.name];
                if (!categoryItems || categoryItems.length === 0) return null;

                return (
                    <div key={categoryInfo.name}>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                           <categoryInfo.icon className="h-5 w-5" />
                           {categoryInfo.name}
                        </h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[30%]">Item</TableHead>
                                    <TableHead>Apresentação</TableHead>
                                    <TableHead>Lote</TableHead>
                                    <TableHead>Validade</TableHead>
                                    <TableHead className="w-[100px]">Qtd.</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categoryItems.map(item => (
                                    <TableRow key={item.internalId}>
                                        <TableCell>{renderItemInput(item)}</TableCell>
                                        <TableCell>{item.presentation || '--'}</TableCell>
                                        <TableCell>{item.batch || 'N/A'}</TableCell>
                                        <TableCell>{item.expiryDate || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(item.internalId, 'quantity', parseInt(e.target.value))}
                                                min="1"
                                                className="w-full"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.internalId)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )
            })}
        </div>
    )
  }

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
                    <div><span className="font-semibold">CNS:</span> {selectedPatient.cns}</div>
                    <div><span className="font-semibold">Mandado:</span> {selectedPatient.mandateType}</div>
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Adicionar itens para dispensar:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {categories.map(({ name, icon: Icon }) => (
                      <Button
                        key={name}
                        variant="outline"
                        onClick={() => handleAddItem(name)}
                        className="flex flex-col h-24"
                      >
                        <Icon className="h-8 w-8 mb-2" />
                        <span className="text-xs text-center">{name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />

                {items.length > 0 ? (
                    renderDispensationTables()
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        Nenhum item adicionado à dispensação.
                    </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {step === 'dispenseForm' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveDispensation} disabled={items.length === 0}>
              <Save className="mr-2 h-4 w-4" />
              Salvar e Gerar Recibo
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
