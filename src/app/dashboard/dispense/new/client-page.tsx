
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X, Save, Trash2, Loader2, User, PackagePlus, ListPlus, CalendarClock, History, Layers, Info, FileText } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { addDispensation } from '@/lib/actions';
import { getPatients, getProducts, getAllDispensations } from '@/lib/data';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Patient, Product, DispensationItem as DispensationItemType, Dispensation, UserLocation } from '@/lib/types';
import { AddItemsManuallyDialog } from '@/components/dashboard/add-items-manually-dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from 'use-debounce';

type DispensationItem = DispensationItemType & {
  internalId: string;
};

const itemCategories: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)', 'Tiras de Glicemia/Lancetas'];

interface NewDispensationClientPageProps {
  initialProducts: Product[];
  initialDispensations: Dispensation[];
}

export function NewDispensationClientPage({ initialProducts, initialDispensations }: NewDispensationClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Patient Search State
  const [patientSearch, setPatientSearch] = useState('');
  const [debouncedPatientSearch] = useDebounce(patientSearch, 300);
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [lastDispensationInfo, setLastDispensationInfo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState<DispensationItem[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Product['category'][]>([]);
  
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // Patient search effect
  useEffect(() => {
    async function searchPatients() {
        if (debouncedPatientSearch.length > 1) {
            setIsSearching(true);
            const patients = await getPatients('all', debouncedPatientSearch);
            setPatientResults(patients);
            setIsSearching(false);
        } else {
            setPatientResults([]);
        }
    }
    searchPatients();
  }, [debouncedPatientSearch]);

  // Handle selecting a patient from URL param
  useEffect(() => {
    const selectPatientById = async (patientId: string) => {
        const patientToSelect = await getPatients('all', patientId); // Search by ID
        if (patientToSelect.length > 0) {
            handlePatientSelect(patientToSelect[0]);
        }
    }
    const patientIdFromUrl = searchParams.get('patientId');
    if (patientIdFromUrl) {
        selectPatientById(patientIdFromUrl);
    }
  }, [searchParams]);


  const handleCategoryToggle = (category: Product['category']) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const addProductToDispensation = (product: Product, quantity: number) => {
     if (product.quantity < quantity) {
        toast({
            variant: 'destructive',
            title: 'Estoque Insuficiente',
            description: `Apenas ${product.quantity.toLocaleString('pt-BR')} unidades de ${product.name} (Lote: ${product.batch}) disponíveis.`
        });
        return false;
    }

    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex > -1) {
        const newItems = [...items];
        const newQuantity = newItems[existingItemIndex].quantity + quantity;

         if (product.quantity < newQuantity) {
            toast({
                variant: 'destructive',
                title: 'Estoque Insuficiente',
                description: `A quantidade total (${newQuantity}) excede o estoque disponível (${product.quantity}) para ${product.name} (Lote: ${product.batch}).`
            });
            return false;
        }

        newItems[existingItemIndex].quantity = newQuantity;
        setItems(newItems);
    } else {
        const newItem: DispensationItem = {
            internalId: `item-${Date.now()}-${Math.random()}`,
            productId: product.id,
            name: product.name,
            quantity: quantity,
            batch: product.batch || 'N/A',
            expiryDate: product.expiryDate, // Salva a data original
            presentation: product.presentation || 'N/A',
            category: product.category,
        };
        setItems(prevItems => [newItem, ...prevItems]);
    }
    return true;
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.internalId !== id));
  };
    
  const handleItemQuantityChange = (id: string, newQuantity: number) => {
    const itemToUpdate = items.find(i => i.internalId === id);
    if (!itemToUpdate) return;
    
    const product = initialProducts.find(p => p.id === itemToUpdate.productId);
    if(product && newQuantity > product.quantity) {
        toast({
            variant: 'destructive',
            title: 'Estoque Insuficiente',
            description: `Apenas ${product.quantity} unidades de ${product.name} (Lote: ${itemToUpdate.batch}) disponíveis.`
        })
        return;
    }
    setItems(items.map(item => item.internalId === id ? { ...item, quantity: newQuantity >= 1 ? newQuantity : 1 } : item));
  };

  const handleSave = async () => {
    if (!selectedPatient) {
      toast({
        variant: 'destructive',
        title: 'Erro de Validação',
        description: 'Por favor, selecione um paciente.',
      });
      return;
    }

    if (items.length === 0) {
       toast({
        variant: 'destructive',
        title: 'Dispensação Vazia',
        description: 'Adicione pelo menos um item à dispensação.',
      });
      return;
    }

    setIsSaving(true);
    const dispensationItems = items.map(({ internalId, ...rest }) => rest);

    // Create a version of the patient object without the files property
    const { files, ...patientForDispensation } = selectedPatient;

    try {
        const newDispensation = await addDispensation({
            patientId: selectedPatient.id,
            patient: patientForDispensation,
            items: dispensationItems,
            notes,
        });

        toast({
            title: 'Dispensação Registrada!',
            description: `A dispensação para ${selectedPatient.name} foi salva com sucesso.`,
        });
        
        window.open(`/dispensation-receipt/${newDispensation.id}`, '_blank');
        router.push('/dashboard/patients');

    } catch(error) {
        console.error("Error saving dispensation: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar',
            description: 'Não foi possível salvar a dispensação. Tente novamente.'
        })
    } finally {
        setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    router.back();
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setPopoverOpen(false);
    setPatientResults([]); // Clear search results
    setPatientSearch(''); // Clear search input

    const patientDispensations = initialDispensations
      .filter(d => d.patientId === patient.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (patientDispensations.length > 0) {
      const lastDate = new Date(patientDispensations[0].date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      setLastDispensationInfo(`Última retirada em: ${lastDate}`);
    } else {
      setLastDispensationInfo('Esta é a primeira dispensação para este paciente.');
    }
  };


  const groupedItems = useMemo(() => items.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {} as Record<string, DispensationItem[]>), [items]);

  const categoryOrder: Product['category'][] = ['Medicamento', 'Material Técnico', 'Tiras de Glicemia/Lancetas', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)'];
  
  const productsForManualAdd = selectedCategories.length > 0
    ? initialProducts.filter(p => selectedCategories.includes(p.category))
    : [];

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 auto-rows-max gap-6">
      <div className="flex items-center gap-4">
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Registrar Nova Dispensação (CAF)
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm" onClick={handleDiscard} disabled={isSaving}>
              <Trash2 className="mr-2 h-4 w-4" />
              Descartar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || items.length === 0}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar e Gerar Recibo'}
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Selecionar Paciente</CardTitle>
                <CardDescription>Busque e selecione o paciente para iniciar a dispensação.</CardDescription>
            </CardHeader>
            <CardContent>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={popoverOpen}
                            className="w-full justify-between md:w-[400px]"
                        >
                            {selectedPatient ? selectedPatient.name : "Selecione o paciente..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                        <Command>
                            <CommandInput 
                                placeholder="Buscar por nome, CPF ou CNS..." 
                                value={patientSearch}
                                onValueChange={setPatientSearch}
                            />
                            <CommandList>
                                {isSearching && <CommandItem disabled>Buscando...</CommandItem>}
                                {!isSearching && debouncedPatientSearch.length > 1 && patientResults.length === 0 && <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>}
                                {debouncedPatientSearch.length <= 1 && !isSearching && <CommandEmpty>Digite 2 ou mais caracteres para buscar.</CommandEmpty>}
                                <CommandGroup>
                                    {patientResults.map((patient) => (
                                        <CommandItem
                                            key={patient.id}
                                            value={`${patient.name} ${patient.cpf} ${patient.cns}`}
                                            onSelect={() => handlePatientSelect(patient)}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0")} />
                                            <div className='flex flex-col'>
                                                <span>{patient.name}</span>
                                                <span className='text-xs text-muted-foreground'>{patient.cpf}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </CardContent>
        </Card>

        {selectedPatient && (
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Detalhes do Paciente</CardTitle>
                    </CardHeader>
                     <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div><span className="font-semibold">Nome:</span> {selectedPatient.name}</div>
                        <div><span className="font-semibold">CPF:</span> {selectedPatient.cpf}</div>
                        <div><span className="font-semibold">CNS:</span> {selectedPatient.cns}</div>
                        <div><span className="font-semibold">Demandas:</span> {selectedPatient.demandItems?.join(', ') || 'Nenhuma'}</div>
                        {lastDispensationInfo && (
                            <div className="col-span-full">
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Histórico do Paciente</AlertTitle>
                                    <AlertDescription>
                                        {lastDispensationInfo}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Adicionar Itens</CardTitle>
                        <CardDescription>Selecione as categorias para adicionar itens à dispensação.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex flex-wrap gap-2">
                            {itemCategories.map(cat => (
                                <Button
                                    key={cat}
                                    type="button"
                                    variant={selectedCategories.includes(cat) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleCategoryToggle(cat)}
                                >
                                    {cat}
                                </Button>
                            ))}
                         </div>
                         <AddItemsManuallyDialog 
                                allProducts={productsForManualAdd}
                                selectedCategories={selectedCategories}
                                onAddProduct={addProductToDispensation} 
                                trigger={
                                    <Button variant="secondary" className="w-full mt-4" disabled={selectedCategories.length === 0}>
                                        <ListPlus className="mr-2 h-4 w-4" />
                                        Adicionar Itens Manualmente
                                    </Button>
                                }
                            />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5" /> Itens na Dispensação</CardTitle>
                        <CardDescription>Lista de produtos a serem dispensados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {items.length > 0 ? (
                             <div className="space-y-6 max-h-96 overflow-y-auto">
                                {categoryOrder.map(category => {
                                    const categoryItems = groupedItems[category];
                                    if (!categoryItems || categoryItems.length === 0) return null;

                                    return (
                                        <div key={category}>
                                            <h3 className="text-md font-semibold text-muted-foreground border-b pb-2 mb-2">{category}</h3>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[40%]">Produto</TableHead>
                                                        <TableHead>Lote</TableHead>
                                                        <TableHead>Val.</TableHead>
                                                        <TableHead className="w-[100px]">Qtd.</TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {categoryItems.map((item) => (
                                                        <TableRow key={item.internalId}>
                                                            <TableCell className="font-medium">{item.name}</TableCell>
                                                            <TableCell>{item.batch || '—'}</TableCell>
                                                            <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR', {month: '2-digit', year:'2-digit', timeZone: 'UTC'}) : '—'}</TableCell>
                                                            <TableCell>
                                                                <Input 
                                                                    type="number" 
                                                                    min="1" 
                                                                    value={item.quantity} 
                                                                    onChange={(e) => handleItemQuantityChange(item.internalId, parseInt(e.target.value, 10) || 0)}
                                                                    className="w-20 h-8"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.internalId)}><X className="h-4 w-4 text-destructive" /></Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center h-24 text-muted-foreground flex items-center justify-center border rounded-md">
                                Aguardando adição de itens...
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )}
      </div>

       {selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Observações (Opcional)
            </CardTitle>
            <CardDescription>
              Adicione qualquer observação ou justificativa sobre a dispensação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ex: Itens retirados por um familiar com documento."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>
      )}
      
      <div className="md:hidden sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t -mx-4 z-10">
        <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleDiscard} disabled={isSaving} className="flex-1">Descartar</Button>
            <Button onClick={handleSave} disabled={isSaving || items.length === 0} className="flex-1">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
        </div>
      </div>
    </div>
  );
}
