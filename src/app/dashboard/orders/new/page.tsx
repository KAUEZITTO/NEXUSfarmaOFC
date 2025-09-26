
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { X, Save, Trash2, Loader2, Barcode, Warehouse, PackagePlus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { addOrder } from '@/lib/actions';
import { getUnits, getProducts } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Unit, Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type RemessaItem = {
  internalId: string;
  productId: string;
  name: string;
  quantity: number;
  batch?: string;
  expiryDate?: string;
  presentation?: string;
  category: string;
};


export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const scannerInputRef = useRef<HTMLInputElement>(null);
  
  const [destinationUnitId, setDestinationUnitId] = useState('');
  const [notes, setNotes] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [items, setItems] = useState<RemessaItem[]>([]);
  const [scannerInput, setScannerInput] = useState('');
  const [quantityMultiplier, setQuantityMultiplier] = useState(1);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [fetchedUnits, fetchedProducts] = await Promise.all([
        getUnits(),
        getProducts()
      ]);
      setUnits(fetchedUnits);
      setProducts(fetchedProducts);
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    // Focus the scanner input when the page loads or the destination is set
    if (!loading && destinationUnitId) {
        scannerInputRef.current?.focus();
    }
  }, [loading, destinationUnitId]);

  const addProductToRemessa = (product: Product, quantity: number) => {
    if (product.quantity < quantity) {
        toast({
            variant: 'destructive',
            title: 'Estoque Insuficiente',
            description: `Apenas ${product.quantity} unidades de ${product.name} disponíveis.`
        });
        return;
    }

    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex > -1) {
        // Update quantity if item already in list
        const newItems = [...items];
        newItems[existingItemIndex].quantity += quantity;
        setItems(newItems);
    } else {
        // Add new item to list
        const newItem: RemessaItem = {
            internalId: `item-${Date.now()}`,
            productId: product.id,
            name: product.name,
            quantity: quantity,
            batch: product.batch || 'N/A',
            expiryDate: product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A',
            presentation: product.presentation || 'N/A',
            category: product.category,
        };
        setItems(prevItems => [newItem, ...prevItems]);
    }
  };

  const handleScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    
    e.preventDefault();
    const value = scannerInput.trim();

    // Check for quantity multiplier command (e.g., "4*")
    if (value.endsWith('*')) {
        const qty = parseInt(value.slice(0, -1), 10);
        if (!isNaN(qty) && qty > 0) {
            setQuantityMultiplier(qty);
            toast({
                title: 'Quantidade Definida!',
                description: `Próximos itens serão adicionados em grupos de ${qty}.`
            });
        }
        setScannerInput('');
        return;
    }

    // Process as barcode (product ID)
    const product = products.find(p => p.id === value);

    if (product) {
        addProductToRemessa(product, quantityMultiplier);
    } else {
        toast({
            variant: 'destructive',
            title: 'Produto não encontrado',
            description: `Nenhum produto corresponde ao código "${value}".`
        });
    }

    // Reset for next scan
    setScannerInput('');
    setQuantityMultiplier(1);
  };


  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.internalId !== id));
  };
    
  const handleItemQuantityChange = (id: string, newQuantity: number) => {
    const product = products.find(p => p.id === items.find(i => i.internalId === id)?.productId);
    if(product && newQuantity > product.quantity) {
        toast({
            variant: 'destructive',
            title: 'Estoque Insuficiente',
            description: `Apenas ${product.quantity} unidades de ${product.name} disponíveis.`
        })
        return;
    }
    setItems(items.map(item => item.internalId === id ? { ...item, quantity: newQuantity >= 1 ? newQuantity : 1 } : item));
  };


  const handleSave = async () => {
    if (!destinationUnitId) {
      toast({
        variant: 'destructive',
        title: 'Erro de Validação',
        description: 'Por favor, selecione uma unidade de destino.',
      });
      return;
    }

    if (items.length === 0) {
       toast({
        variant: 'destructive',
        title: 'Remessa Vazia',
        description: 'Adicione pelo menos um item à remessa.',
      });
      return;
    }

    setIsSaving(true);
    const unitName = units.find(u => u.id === destinationUnitId)?.name || 'Desconhecida';

    const orderItems = items.map(({ internalId, ...rest }) => rest);

    try {
        await addOrder({
            unitId: destinationUnitId,
            unitName: unitName,
            items: orderItems,
            notes,
        });

        toast({
            title: 'Remessa Salva!',
            description: 'A nova remessa foi criada com sucesso.',
        });
        router.push('/dashboard/orders');
    } catch(error) {
        console.error("Error saving order: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar',
            description: 'Não foi possível salvar a remessa. Tente novamente.'
        })
    } finally {
        setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    router.back();
  };

  if (loading) {
    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="mx-auto grid w-full max-w-5xl flex-1 auto-rows-max gap-4">
                 <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Criar Nova Remessa
                 </h1>
                 <Card>
                    <CardHeader><CardTitle>Detalhes da Remessa</CardTitle></CardHeader>
                    <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                 </Card>
                 <Card>
                    <CardHeader><CardTitle>Itens da Remessa</CardTitle></CardHeader>
                    <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                 </Card>
            </div>
        </div>
    )
  }

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="mx-auto grid w-full max-w-6xl flex-1 auto-rows-max gap-6">
        <div className="flex items-center gap-4">
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Criar Nova Remessa
          </h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="sm" onClick={handleDiscard} disabled={isSaving}>
                <Trash2 className="mr-2 h-4 w-4" />
                Descartar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving || items.length === 0}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Salvando...' : 'Salvar Remessa'}
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
                 {/* Step 1: Destination */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Warehouse className="h-5 w-5" /> Passo 1: Destino</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="unit" className="mb-2 block">Selecione a Unidade de Destino</Label>
                        <Select onValueChange={setDestinationUnitId} value={destinationUnitId}>
                            <SelectTrigger id="unit" aria-label="Selecione a unidade"><SelectValue placeholder="Selecione a unidade..." /></SelectTrigger>
                            <SelectContent>
                            {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Step 2: Barcode Scanner */}
                <Card className={!destinationUnitId ? 'opacity-50 pointer-events-none' : ''}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Barcode className="h-5 w-5" /> Passo 2: Escanear Itens</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="scanner">Leitor de Código de Barras</Label>
                        <Input
                            ref={scannerInputRef}
                            id="scanner"
                            placeholder="Use o leitor ou digite o código/ID aqui..."
                            value={scannerInput}
                            onChange={(e) => setScannerInput(e.target.value)}
                            onKeyDown={handleScannerKeyDown}
                            disabled={!destinationUnitId || isSaving}
                        />
                         <p className="text-xs text-muted-foreground mt-2">
                           Dica: Para adicionar múltiplos itens, digite a quantidade e um asterisco (ex: <strong>4*</strong>) e pressione Enter antes de escanear.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Step 3: Remessa Itens */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5" /> Itens na Remessa</CardTitle>
                    <CardDescription>
                        Lista de produtos adicionados à remessa. A quantidade pode ser ajustada manualmente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Produto</TableHead>
                                    <TableHead>Lote</TableHead>
                                    <TableHead>Validade</TableHead>
                                    <TableHead className="w-[120px]">Qtd.</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length > 0 ? items.map((item, index) => (
                                    <TableRow key={item.internalId}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.batch || '—'}</TableCell>
                                        <TableCell>{item.expiryDate || '—'}</TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                min="1" 
                                                value={item.quantity} 
                                                onChange={(e) => handleItemQuantityChange(item.internalId, parseInt(e.target.value, 10) || 0)}
                                                className="w-24"
                                            />
                                        </TableCell>
                                         <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.internalId)}><X className="h-4 w-4 text-destructive" /></Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            Aguardando leitura do código de barras...
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Step 4: Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Observações (Opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea placeholder="Adicione qualquer observação sobre a remessa..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </CardContent>
            </Card>
        </div>
        
        <div className="flex items-center justify-center gap-2 md:hidden">
          <Button variant="outline" size="sm" onClick={handleDiscard} disabled={isSaving}>
            Descartar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || items.length === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Salvando...' : 'Salvar Remessa'}
          </Button>
        </div>
      </div>
    </div>
  );
}
