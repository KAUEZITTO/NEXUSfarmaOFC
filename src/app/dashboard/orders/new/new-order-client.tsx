
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
import { X, Save, Trash2, Loader2, Barcode, Warehouse, PackagePlus, ListPlus, CalendarClock, History } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { addOrder } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Unit, Product, OrderType } from '@/lib/types';
import { AddItemsManuallyDialog } from '@/components/dashboard/add-items-manually-dialog';

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

interface NewOrderPageContentProps {
  units: Unit[];
  allProducts: Product[];
}


export default function NewOrderPageContent({ units, allProducts }: NewOrderPageContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const scannerInputRef = useRef<HTMLInputElement>(null);
  
  const [destinationUnitId, setDestinationUnitId] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('Pedido Mensal');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [items, setItems] = useState<RemessaItem[]>([]);
  const [scannerInput, setScannerInput] = useState('');
  const [quantityMultiplier, setQuantityMultiplier] = useState(1);
  const [sentDate, setSentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Focus the scanner input when the page loads or the destination is set
    if (destinationUnitId) {
        scannerInputRef.current?.focus();
    }
  }, [destinationUnitId]);

  const addProductToRemessa = (product: Product, quantity: number) => {
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
        // Update quantity if item already in list
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
        // Add new item to list
        const newItem: RemessaItem = {
            internalId: `item-${Date.now()}-${Math.random()}`,
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
    return true;
  };

  const handleScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    
    e.preventDefault();
    const value = scannerInput.trim();

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

    const product = allProducts.find(p => p.id === value);

    if (product) {
        addProductToRemessa(product, quantityMultiplier);
    } else {
        toast({
            variant: 'destructive',
            title: 'Produto não encontrado',
            description: `Nenhum produto corresponde ao código "${value}".`
        });
    }

    setScannerInput('');
    setQuantityMultiplier(1);
  };


  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.internalId !== id));
  };
    
  const handleItemQuantityChange = (id: string, newQuantity: number) => {
    const itemToUpdate = items.find(i => i.internalId === id);
    if (!itemToUpdate) return;
    
    const product = allProducts.find(p => p.id === itemToUpdate.productId);
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
            orderType: orderType,
            notes,
            sentDate: sentDate,
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

  // Group items by category for rendering
  const groupedItems = items.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {} as Record<string, RemessaItem[]>);

  const categoryOrder: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Não Padronizado (Compra)'];


  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Warehouse className="h-5 w-5" /> Passo 1: Destino</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="unit" className="mb-2 block">Selecione a Unidade</Label>
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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Passo 2: Tipo e Data</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label htmlFor="order-type" className="mb-2 block">Classifique o Pedido</Label>
                            <Select onValueChange={(v) => setOrderType(v as OrderType)} value={orderType}>
                                <SelectTrigger id="order-type" aria-label="Selecione o tipo de pedido">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pedido Mensal">Pedido Mensal</SelectItem>
                                    <SelectItem value="Pedido Extra">Pedido Extra</SelectItem>
                                    <SelectItem value="Pedido Urgente">Pedido Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                         <div>
                             <Label htmlFor="sentDate" className="mb-2 block flex items-center gap-2">
                                <History className="h-4 w-4" /> 
                                Data de Envio (para registros antigos)
                            </Label>
                            <Input
                                id="sentDate"
                                type="date"
                                value={sentDate}
                                onChange={(e) => setSentDate(e.target.value)}
                            />
                         </div>
                    </CardContent>
                </Card>

                <Card className={!destinationUnitId ? 'opacity-50 pointer-events-none' : ''}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Barcode className="h-5 w-5" /> Passo 3: Escanear ou Adicionar</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                            <div>
                                <Label htmlFor="scanner">Leitor de Código de Barras</Label>
                                <Input
                                    ref={scannerInputRef}
                                    id="scanner"
                                    placeholder="Use o leitor ou digite o código..."
                                    value={scannerInput}
                                    onChange={(e) => setScannerInput(e.target.value)}
                                    onKeyDown={handleScannerKeyDown}
                                    disabled={!destinationUnitId || isSaving}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                Dica: Para múltiplos itens, digite a quantidade e um asterisco (ex: <strong>4*</strong>) antes de escanear.
                                </p>
                            </div>
                            <AddItemsManuallyDialog 
                                allProducts={allProducts} 
                                onAddProduct={addProductToRemessa} 
                                trigger={
                                    <Button variant="outline" className="w-full">
                                        <ListPlus className="mr-2 h-4 w-4" />
                                        Adicionar Manualmente
                                    </Button>
                                }
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5" /> Itens na Remessa</CardTitle>
                    <CardDescription>
                        Lista de produtos adicionados à remessa, agrupados por categoria.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {items.length > 0 ? (
                        <div className="space-y-6">
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
                                                    <TableHead>Validade</TableHead>
                                                    <TableHead className="w-[120px]">Qtd.</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {categoryItems.map((item) => (
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

            <Card>
                <CardHeader>
                    <CardTitle>Observações (Opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea placeholder="Adicione qualquer observação sobre a remessa..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </CardContent>
            </Card>
        </div>
        
        {/* Mobile-only action buttons */}
        <div className="md:hidden sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t -mx-4">
            <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={handleDiscard} disabled={isSaving} className="flex-1">
                    Descartar
                </Button>
                <Button onClick={handleSave} disabled={isSaving || items.length === 0} className="flex-1">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
