

'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
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
  FileText,
  ShieldHalf,
  Milk,
} from 'lucide-react';
import { addDispensation } from '@/lib/actions';
import { getPatients, getProducts } from '@/lib/data';
import type { Patient, Product, DispensationItem as DispensationItemType, PatientDemandItem } from '@/lib/types';
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
import { unstable_noStore as noStore } from 'next/cache';
import { Badge } from '../ui/badge';


type DispensationItem = DispensationItemType & {
  internalId: string;
}

type Category =
  | 'Insulinas'
  | 'Tiras/Lancetas'
  | 'Medicamentos'
  | 'Material Técnico'
  | 'Fraldas'
  | 'Fórmulas'
  | 'Itens Judiciais'
  | 'Imunoglobulina'
  | 'Outros';

const categories: {
  name: Category;
  icon: React.ElementType;
  demandItem?: PatientDemandItem;
}[] = [
  { name: 'Insulinas', icon: Syringe, demandItem: 'Insulinas Análogas' },
  { name: 'Tiras/Lancetas', icon: ClipboardList, demandItem: 'Tiras de Glicemia' },
  { name: 'Fraldas', icon: Baby, demandItem: 'Fraldas' },
  { name: 'Fórmulas', icon: Milk, demandItem: 'Fórmulas' },
  { name: 'Itens Judiciais', icon: FileText, demandItem: 'Itens Judiciais' },
  { name: 'Imunoglobulina', icon: ShieldHalf, demandItem: 'Imunoglobulina' },
  { name: 'Medicamentos', icon: Pill },
  { name: 'Material Técnico', icon: Stethoscope },
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
    
    if (category === 'Fórmulas') {
        const formulaProducts = allProducts.filter(p => p.category === 'Fórmulas');
        if (formulaProducts.length > 0) return formulaProducts;
        return [];
    }

    if (category === 'Insulinas') {
         return allProducts.filter(p => insulinKeywords.some(keyword => p.name.toLowerCase().includes(keyword)));
    }
    
    if (category === 'Tiras/Lancetas') {
        return allProducts.filter(p => stripKeywords.some(keyword => p.name.toLowerCase().includes(keyword)));
    }

    if(category === 'Medicamentos' || category === 'Itens Judiciais' || category === 'Imunoglobulina') {
        return allProducts.filter(p => p.category === 'Medicamento' && !insulinKeywords.some(kw => p.name.toLowerCase().includes(kw)));
    }

    if(category === 'Material Técnico') {
        return allProducts.filter(p => p.category === 'Material Técnico' && !stripKeywords.some(kw => p.name.toLowerCase().includes(kw)));
    }
    
    if (category === 'Outros') {
        const usedProductIds = new Set<string>();
        categories.forEach(cat => {
            if (cat.name !== 'Outros') {
                const products = getProductsForCategory(allProducts, cat.name as Category);
                products.forEach(p => {
                    if (p.id) usedProductIds.add(p.id);
                });
            }
        });
        return allProducts.filter(p => !usedProductIds.has(p.id));
    }
    return [];
}

interface AttendPatientDialogProps {
    onDispensationSaved: () => void;
    trigger?: React.ReactNode;
    initialPatient?: Patient;
}

export function AttendPatientDialog({ onDispensationSaved, trigger, initialPatient }: AttendPatientDialogProps) {
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    async function loadData() {
        if (isOpen) {
            setLoading(true);
            try {
                // Ensure fresh data is fetched every time dialog is opened
                const [patients, products] = await Promise.all([getPatients('all'), getProducts()]);
                setAllPatients(patients);
                setAllProducts(products);
            } catch (error) {
                console.error("Failed to load data for dialog:", error);
                toast({
                    variant: 'destructive',
                    title: 'Erro ao carregar dados',
                    description: 'Não foi possível buscar pacientes e produtos.'
                });
            } finally {
                setLoading(false);
            }
        }
    }
    loadData();
  }, [isOpen, toast]);

  useEffect(() => {
    if (initialPatient && isOpen) {
        handleSelectPatient(initialPatient);
    }
  }, [initialPatient, isOpen]);

  const filteredPatients = searchTerm
    ? allPatients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.cpf?.replace(/[^\d]/g, '').includes(searchTerm.replace(/[^\d]/g, ''))
      )
    : allPatients;
  
  const setupInitialItems = (patient: Patient) => {
    const initialItems: DispensationItem[] = [];
    
    patient.demandItems?.forEach(demand => {
        const categoryInfo = categories.find(c => c.demandItem === demand);
        if (categoryInfo) {
            // Add an empty item to pre-populate the category section
            initialItems.push({
                internalId: `item-${categoryInfo.name}-${Date.now()}`,
                productId: '',
                name: '',
                quantity: 1,
                category: categoryInfo.name,
                presentation: '',
            });
        }
    });

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
     setTimeout(() => {
      scrollAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
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

    const validItems = items.filter(item => item.productId && item.quantity > 0);

    if (validItems.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Nenhum Item Válido',
            description: 'Adicione pelo menos um produto e quantidade antes de salvar.'
        });
        return;
    }
    
    setIsSaving(true);
    const patientForDispensation = { ...selectedPatient };

    const dispensationItems = validItems.map(({ internalId, ...rest }) => ({...rest}));

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

  const isNewlyRegistered = (patient: Patient): boolean => {
    if (!patient.createdAt) return false;
    const fiveMinutes = 5 * 60 * 1000;
    const createdAtDate = new Date(patient.createdAt);
    const now = new Date();
    return now.getTime() - createdAtDate.getTime() < fiveMinutes;
  }
  
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
            placeholder="Nenhum produto encontrado nesta categoria"
            value={item.name}
            disabled
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
                                                onChange={(e) => handleItemChange(item.internalId, 'quantity', parseInt(e.target.value, 10) || 0)}
                                                min="0"
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
        {trigger ? trigger : (
            <Button>
                <UserCheck className="mr-2 h-4 w-4" />
                Atender Paciente
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {step === 'selectPatient' && !initialPatient ? (
              'Atender Paciente'
            ) : (
              <>
                {!initialPatient && <Button variant="ghost" size="icon" className="mr-2" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>}
                Dispensação para: {selectedPatient?.name}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-hidden" ref={scrollAreaRef}>
          {step === 'selectPatient' && !initialPatient && (
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
                  {loading ? <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div> : filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {patient.name}
                           {isNewlyRegistered(patient) && <Badge variant="secondary">Recém-cadastrado</Badge>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          CPF: {patient.cpf}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Selecionar
                      </Button>
                    </div>
                  ))}
                   {!loading && filteredPatients.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                      Nenhum paciente encontrado.
                    </div>
                  )}
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
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold">Nome:</span> {selectedPatient.name}</div>
                    <div><span className="font-semibold">CPF:</span> {selectedPatient.cpf}</div>
                    <div><span className="font-semibold">CNS:</span> {selectedPatient.cns}</div>
                    <div><span className="font-semibold">Demandas:</span> {selectedPatient.demandItems?.join(', ') || 'Nenhuma'}</div>
                    {selectedPatient.demandItems?.includes('Insulinas Análogas') && (
                        <>
                           <div><span className="font-semibold">Tipo de Insulina:</span> {selectedPatient.analogInsulinType} ({selectedPatient.insulinPresentation})</div>
                            <div className="col-span-1 sm:col-span-2"><span className="font-semibold">Posologia Insulina:</span> {selectedPatient.insulinDosages?.map(d => `${d.quantity} UI ${d.period}`).join(', ') || 'N/A'}</div>
                        </>
                    )}
                     {selectedPatient.demandItems?.includes('Tiras de Glicemia') && (
                        <>
                           <div className="col-span-1 sm:col-span-2"><span className="font-semibold">Posologia Tiras:</span> {selectedPatient.stripDosages?.map(d => `${d.quantity}x ${d.period}`).join(', ') || 'N/A'}</div>
                        </>
                    )}
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Adicionar itens para dispensar:</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2">
                    {categories.map(({ name, icon: Icon }) => (
                      <Button
                        key={name}
                        variant="outline"
                        onClick={() => handleAddItem(name)}
                        className="flex flex-col h-20 sm:h-24 justify-center"
                      >
                        <Icon className="h-6 w-6 sm:h-8 sm:w-8 mb-1" />
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
                        Nenhum item adicionado à dispensação. Use os botões acima.
                    </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {step === 'dispenseForm' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSaveDispensation} disabled={items.filter(i => i.productId).length === 0 || isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar e Gerar Recibo'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
