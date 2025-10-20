

'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
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
  ShoppingCart,
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
  | 'Não Padronizado (Compra)'
  | 'Outros';

const categories: {
  name: Category;
  icon: React.ElementType;
  demandItem?: PatientDemandItem;
  productCategory?: Product['category'] | (Product['category'])[]
}[] = [
  { name: 'Insulinas', icon: Syringe, demandItem: 'Insulinas Análogas' },
  { name: 'Tiras/Lancetas', icon: ClipboardList, demandItem: 'Tiras de Glicemia', productCategory: 'Tiras de Glicemia/Lancetas' },
  { name: 'Fraldas', icon: Baby, demandItem: 'Fraldas', productCategory: 'Fraldas' },
  { name: 'Fórmulas', icon: Milk, demandItem: 'Fórmulas', productCategory: 'Fórmulas' },
  { name: 'Itens Judiciais', icon: FileText, demandItem: 'Itens Judiciais', productCategory: 'Não Padronizado (Compra)' },
  { name: 'Não Padronizado (Compra)', icon: ShoppingCart, demandItem: 'Medicamentos/Materiais Comprados', productCategory: 'Não Padronizado (Compra)' },
  { name: 'Imunoglobulina', icon: ShieldHalf, demandItem: 'Imunoglobulina'},
  { name: 'Material Técnico', icon: Stethoscope, productCategory: 'Material Técnico', demandItem: 'Materiais Técnicos (Acamados)' },
  { name: 'Medicamentos', icon: Pill, productCategory: 'Medicamento' },
  { name: 'Outros', icon: Package },
];

const insulinKeywords = ['insulina', 'lantus', 'apidra', 'nph', 'regular', 'agulha para caneta'];

const getProductsForCategory = (allProducts: Product[], categoryName: Category): Product[] => {
    const categoryInfo = categories.find(c => c.name === categoryName);

    if (categoryName === 'Insulinas') {
        return allProducts.filter(p => insulinKeywords.some(kw => p.name.toLowerCase().includes(kw)));
    }
    
    if (categoryName === 'Imunoglobulina') {
        return allProducts.filter(p => p.name.toLowerCase().includes('imunoglobulina'));
    }

    if (categoryInfo?.productCategory) {
        const productCategories = Array.isArray(categoryInfo.productCategory) ? categoryInfo.productCategory : [categoryInfo.productCategory];
        return allProducts.filter(p => productCategories.includes(p.category));
    }

    if (categoryName === 'Outros') {
        // IDs of categories explicitly handled by other rules
        const handledCategories: Product['category'][] = [
            'Tiras de Glicemia/Lancetas',
            'Fraldas',
            'Fórmulas',
            'Não Padronizado (Compra)',
            'Material Técnico',
            'Medicamento',
        ];
        const handledKeywords = [...insulinKeywords, 'imunoglobulina'];

        return allProducts.filter(p => {
            const productNameLower = p.name.toLowerCase();
            const isHandledByCategory = handledCategories.includes(p.category);
            const isHandledByKeyword = handledKeywords.some(kw => productNameLower.includes(kw));
            // Return true only if it's not handled by any other category or keyword
            return !isHandledByCategory && !isHandledByKeyword;
        });
    }

    // Default to empty array if no specific logic matches
    return [];
};


interface AttendPatientDialogProps {
    onDispensationSaved: () => void;
    trigger: React.ReactNode;
    initialPatient: Patient;
}

export function AttendPatientDialog({ onDispensationSaved, trigger, initialPatient }: AttendPatientDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState<DispensationItem[]>([]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    async function loadData() {
        if (isOpen) {
            setLoading(true);
            try {
                // Force dynamic data fetching every time the dialog opens
                noStore();
                const productsData = await getProducts();
                setAllProducts(productsData); 
            } catch (error) {
                console.error("Failed to load data for dialog:", error);
                toast({
                    variant: 'destructive',
                    title: 'Erro ao carregar dados',
                    description: 'Não foi possível buscar produtos.'
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
        setupInitialItems(initialPatient);
    }
  }, [initialPatient, isOpen]);
  
  const setupInitialItems = (patient: Patient) => {
    const initialItems: DispensationItem[] = [];
    
    patient.demandItems?.forEach(demand => {
        const categoryInfo = categories.find(c => c.demandItem === demand);
        if (categoryInfo) {
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
      if (scrollAreaRef.current) {
        const lastTable = scrollAreaRef.current.querySelector('div.space-y-6 > div:last-child');
        lastTable?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
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
     
     const fullProduct = allProducts.find(p => p.id === productId);
     
     if (fullProduct) {
         let formattedDate = 'N/A';
         if (fullProduct?.expiryDate) {
             const date = new Date(fullProduct.expiryDate);
             if (!isNaN(date.getTime())) {
                 formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
             }
         }

         setItems(items.map(item => item.internalId === id ? {
            ...item,
            productId: productId,
            name: fullProduct.name!,
            batch: fullProduct?.batch || 'N/A',
            expiryDate: formattedDate,
            presentation: fullProduct.presentation || '--'
         } : item));
     }
  }


  const handleSaveDispensation = async () => {
    if (!initialPatient) return;

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
    const patientForDispensation = { ...initialPatient };

    const dispensationItems = validItems.map(({ internalId, ...rest }) => ({...rest}));

    try {
        const newDispensation = await addDispensation({
            patientId: initialPatient.id,
            patient: patientForDispensation,
            items: dispensationItems
        });
        
        toast({
          title: 'Dispensação Registrada!',
          description: `Gerando recibo para ${initialPatient?.name}.`,
        });
        
        onDispensationSaved();
        setIsOpen(false);
        
        window.open(`/dispensation-receipt/${newDispensation.id}`, '_blank');


        setTimeout(() => {
            setItems([]);
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
            {productList.map(p => <SelectItem key={p.id} value={p.id!} disabled={p.quantity === 0}>
                {p.name} ({p.presentation}) (Estoque: {p.quantity || 0})
            </SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    
    return (
        <Input 
            placeholder="Nenhum produto encontrado"
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
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Dispensação para: {initialPatient?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-hidden" ref={scrollAreaRef}>
          {loading ? (
             <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <ScrollArea className="h-[calc(90vh-150px)]">
              <div className="p-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados do Paciente</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold">Nome:</span> {initialPatient.name}</div>
                    <div><span className="font-semibold">CPF:</span> {initialPatient.cpf}</div>
                    <div><span className="font-semibold">CNS:</span> {initialPatient.cns}</div>
                    <div><span className="font-semibold">Demandas:</span> {initialPatient.demandItems?.join(', ') || 'Nenhuma'}</div>
                    {initialPatient.demandItems?.includes('Insulinas Análogas') && (
                        <>
                           <div><span className="font-semibold">Tipo de Insulina:</span> {initialPatient.analogInsulinType} ({initialPatient.insulinPresentation})</div>
                            <div className="col-span-1 sm:col-span-2"><span className="font-semibold">Posologia Insulina:</span> {initialPatient.insulinDosages?.map(d => `${d.quantity} UI ${d.period}`).join(', ') || 'N/A'}</div>
                        </>
                    )}
                     {initialPatient.demandItems?.includes('Tiras de Glicemia') && (
                        <>
                           <div className="col-span-1 sm:col-span-2"><span className="font-semibold">Posologia Tiras:</span> {initialPatient.stripDosages?.map(d => `${d.quantity}x ${d.period}`).join(', ') || 'N/A'}</div>
                        </>
                    )}
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Adicionar itens para dispensar:</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
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

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSaveDispensation} disabled={items.filter(i => i.productId).length === 0 || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Salvando...' : 'Salvar e Gerar Recibo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


