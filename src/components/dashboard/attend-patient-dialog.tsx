
'use client';

import { useEffect, useState, useTransition } from 'react';
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
  X,
  Save,
  ChevronLeft,
  Stethoscope,
  Syringe,
  Pill,
  Baby,
  Package,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { getPatients, getProducts, addDispensation } from '@/lib/actions';
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
}[] = [
  { name: 'Insulinas', icon: Syringe },
  { name: 'Tiras/Lancetas', icon: ClipboardList },
  { name: 'Medicamentos', icon: Pill },
  { name: 'Material Técnico', icon: Stethoscope },
  { name: 'Fraldas', icon: Baby },
  { name: 'Outros', icon: Package },
];

const insulinKeywords = ['insulina', 'lantus', 'apidra', 'nph', 'regular', 'agulha para caneta'];
const stripKeywords = ['tira', 'lanceta'];


const getProductsForCategory = (allProducts: Product[], category: Category): Partial<Product>[] => {
    if (category === 'Fraldas') {
        const diaperProducts = allProducts.filter(p => p.category === 'Fraldas');
        if (diaperProducts.length > 0) return diaperProducts;
        return [];
    }

    if (category === 'Insulinas') {
         return allProducts.filter(p => insulinKeywords.some(keyword => p.name.toLowerCase().includes(keyword)));
    }
    
    if (category === 'Tiras/Lancetas') {
        return allProducts.filter(p => stripKeywords.some(keyword => p.name.toLowerCase().includes(keyword)));
    }

    if(category === 'Medicamentos') {
        return allProducts.filter(p => p.category === 'Medicamento' && !insulinKeywords.some(kw => p.name.toLowerCase().includes(kw)));
    }

    if(category === 'Material Técnico') {
        return allProducts.filter(p => p.category === 'Material Técnico' && !stripKeywords.some(kw => p.name.toLowerCase().includes(kw)));
    }
    
    if (category === 'Outros') {
        const usedProductIds = new Set(
            categories.flatMap(cat => getProductsForCategory(allProducts, cat.name as Category)).map(p => p.id)
        );
        return allProducts.filter(p => !usedProductIds.has(p.id));
    }
    return [];
}

interface AttendPatientDialogProps {
    onDispensationSaved: () => void;
}

export function AttendPatientDialog({ onDispensationSaved }: AttendPatientDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'selectPatient' | 'dispenseForm'>(
    'selectPatient'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<DispensationItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
        if (isOpen) {
            setLoading(true);
            const [patients, products] = await Promise.all([getPatients(), getProducts()]);
            setAllPatients(patients);
            setAllProducts(products);
            setLoading(false);
        }
    }
    loadData();
  }, [isOpen])

  const filteredPatients = allPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cpf.includes(searchTerm)
  );
  
  const setupInitialItems = (patient: Patient) => {
    const initialItems: DispensationItem[] = [];

    if (patient.isAnalogInsulinUser && patient.insulinDosages && patient.insulinDosages.length > 0) {
        const insulinProduct = allProducts.find(p => 
            p.name.toLowerCase().includes(patient.analogInsulinType!.toLowerCase().split(' ')[0]) &&
            p.presentation?.toLowerCase().includes(patient.insulinPresentation!.toLowerCase())
        );

        if(insulinProduct) {
             initialItems.push({
                internalId: `item-insulin-${Date.now()}`,
                productId: insulinProduct.id,
                name: insulinProduct.name,
                category: 'Insulinas',
                quantity: 1, 
                presentation: insulinProduct.presentation,
                batch: insulinProduct.batch,
                expiryDate: insulinProduct.expiryDate ? new Date(insulinProduct.expiryDate).toLocaleDateString('pt-BR') : 'N/A',
            });
        }
    }

    if (patient.usesStrips && patient.stripDosages && patient.stripDosages.length > 0) {
        const stripProduct = allProducts.find(p => p.name.toLowerCase().includes('tiras de glicemia'));
        if (stripProduct) {
            const totalStripsPerDay = patient.stripDosages.reduce((sum, d) => sum + d.quantity, 0);
            const boxesNeeded = Math.ceil((totalStripsPerDay * 30) / 50); // Assuming box of 50
             initialItems.push({
                internalId: `item-strips-${Date.now()}`,
                productId: stripProduct.id,
                name: stripProduct.name,
                category: 'Tiras/Lancetas',
                quantity: boxesNeeded,
                presentation: stripProduct.presentation,
                batch: stripProduct.batch,
                expiryDate: stripProduct.expiryDate ? new Date(stripProduct.expiryDate).toLocaleDateString('pt-BR') : 'N/A',
            });
        }
    }


    setItems(initialItems);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setupInitialItems(patient);
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
     
     const productList = getProductsForCategory(allProducts, itemToUpdate.category as Category);
     const product = productList.find(p => p.id === productId);
     
     if (product) {
         const fullProduct = allProducts.find(p => p.id === productId);
         setItems(items.map(item => item.internalId === id ? {
            ...item,
            productId: productId,
            name: product.name!,
            batch: fullProduct?.batch || 'N/A',
            expiryDate: fullProduct?.expiryDate ? new Date(fullProduct.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A',
            presentation: product.presentation || '--'
         } : item));
     }
  }


  const handleSaveDispensation = async () => {
    if (!selectedPatient) return;

    if (items.some(item => !item.productId || item.quantity <= 0)) {
        toast({
            variant: 'destructive',
            title: 'Itens Inválidos',
            description: 'Por favor, preencha todos os itens corretamente antes de salvar.'
        });
        return;
    }
    
    setIsSaving(true);
    const patientForDispensation = { ...selectedPatient };

    const dispensationItems = items.map(({ internalId, ...rest }) => ({...rest}));

    try {
        const newDispensation = await addDispensation({
            patientId: selectedPatient.id,
            patient: patientForDispensation,
            items: dispensationItems
        });
        
        toast({
          title: 'Dispensação Registrada!',
          description: `Gerando recibo para ${selectedPatient?.name}.`,
        });
        
        onDispensationSaved();
        setIsOpen(false);
        
        router.push(`/dispensation-receipt/${newDispensation.id}?new=true`);

        setTimeout(() => {
            handleBack();
        }, 300);

    } catch (error) {
        console.error("Error saving dispensation: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar',
            description: 'Não foi possível registrar a dispensação. Tente novamente.'
        })
    } finally {
        setIsSaving(false);
    }
  };
  
  const renderItemInput = (item: DispensationItem) => {
    const productList = getProductsForCategory(allProducts, item.category as Category);

    if (productList.length > 0) {
      return (
        <Select value={item.productId} onValueChange={(value) => handleProductSelect(item.internalId, value)}>
          <SelectTrigger><SelectValue placeholder="Selecione o item..." /></SelectTrigger>
          <SelectContent>
            {productList.map(p => <SelectItem key={p.id} value={p.id!} disabled={allProducts.find(fp => fp.id === p.id)?.quantity === 0}>
                {p.name} (Estoque: {allProducts.find(fp => fp.id === p.id)?.quantity || 0})
            </SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    
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
                  {loading ? <p>Carregando pacientes...</p> : filteredPatients.map((patient) => (
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
                    {selectedPatient.isAnalogInsulinUser && (
                        <>
                           <div><span className="font-semibold">Tipo de Insulina:</span> {selectedPatient.analogInsulinType} ({selectedPatient.insulinPresentation})</div>
                            <div className="col-span-2"><span className="font-semibold">Posologia Insulina:</span> {selectedPatient.insulinDosages?.map(d => `${d.quantity} UI ${d.period}`).join(', ') || 'N/A'}</div>
                        </>
                    )}
                     {selectedPatient.usesStrips && (
                        <>
                           <div className="col-span-2"><span className="font-semibold">Posologia Tiras:</span> {selectedPatient.stripDosages?.map(d => `${d.quantity}x ${d.period}`).join(', ') || 'N/A'}</div>
                        </>
                    )}
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
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSaveDispensation} disabled={items.length === 0 || isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar e Gerar Recibo'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
