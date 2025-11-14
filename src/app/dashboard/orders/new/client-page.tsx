
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { X, Save, Trash2, Loader2, Warehouse, PackagePlus, ListPlus, CalendarClock, History, Layers, Printer, Hourglass, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { addOrder, updateOrderStatus } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Unit, Product, OrderType, Order } from '@/lib/types';
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

const itemCategories: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)'];

interface NewOrderClientPageProps {
    initialUnits: Unit[];
    initialProducts: Product[];
}

export function NewOrderClientPage({ initialUnits, initialProducts }: NewOrderClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [destinationUnitId, setDestinationUnitId] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('Pedido Mensal');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Product['category'][]>([]);
  
  const [items, setItems] = useState<RemessaItem[]>([]);
  const [sentDate, setSentDate] = useState(new Date().toISOString().split('T')[0]);

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);


   const handleCategoryToggle = (category: Product['category']) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

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
        const newItem: RemessaItem = {
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
    const unitName = initialUnits.find(u => u.id === destinationUnitId)?.name || 'Desconhecida';

    const orderItems = items.map(({ internalId, ...rest }) => rest);

    try {
        const newOrder = await addOrder({
            unitId: destinationUnitId,
            unitName: unitName,
            items: orderItems,
            orderType: orderType,
            notes,
            sentDate: sentDate,
        });

        toast({
            title: 'Remessa Salva!',
            description: 'Defina o status do pedido para continuar.',
        });
        setCreatedOrder(newOrder);
        setShowStatusDialog(true);
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

  const handleStatusDecision = async (status: Order['status']) => {
    if (!createdOrder) return;

    setShowStatusDialog(false);
    
    try {
        await updateOrderStatus(createdOrder.id, status);
        toast({
          title: "Status do Pedido Atualizado!",
          description: `O status do pedido foi alterado para ${status}.`,
        });

        if (status === 'Atendido') {
            window.open(`/receipt/${createdOrder.id}`, '_blank');
        }

        router.push('/dashboard/orders');

    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Erro ao Atualizar Status',
            description: 'Não foi possível atualizar o status do pedido.'
        });
    }
  };

  const handleDiscard = () => {
    router.back();
  };

  const groupedItems = items.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {} as Record<string, RemessaItem[]>);

  const categoryOrder: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)'];
  
  const productsForManualAdd = selectedCategories.length > 0
    ? initialProducts.filter(p => selectedCategories.includes(p.category))
    : [];

  return (
    <>
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
                            {initialUnits.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card className={!destinationUnitId ? 'opacity-50 pointer-events-none' : ''}>
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
                                Data de Envio (registros antigos)
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
                        <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Passo 3: Adicionar Itens</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Label className="mb-2 block">Selecione as Categorias dos Itens</Label>
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
                                onAddProduct={addProductToRemessa} 
                                trigger={
                                    <Button variant="outline" className="w-full mt-4" disabled={selectedCategories.length === 0}>
                                        <ListPlus className="mr-2 h-4 w-4" />
                                        Adicionar Manualmente
                                    </Button>
                                }
                            />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5" /> Itens na Remessa</CardTitle>
                    <CardDescription>
                        Lista de produtos adicionados à remessa.
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
                                                        <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : '—'}</TableCell>
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
        
        <div className="md:hidden sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t -mx-4 z-10">
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
    
    <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Remessa Salva!</AlertDialogTitle>
                <AlertDialogDescription>
                    A remessa para {createdOrder?.unitName} foi registrada. O que você deseja fazer agora?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-around gap-2">
                <Button 
                    className="w-full sm:w-auto"
                    onClick={() => handleStatusDecision('Atendido')}
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Atender e Imprimir
                </Button>
                <Button 
                    variant="destructive" 
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                    onClick={() => handleStatusDecision('Não atendido')}
                >
                    <X className="mr-2 h-4 w-4" />
                    Marcar como Não Atendido
                </Button>
                <Button 
                    variant="outline" 
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                    onClick={() => handleStatusDecision('Em análise')}
                >
                    <Hourglass className="mr-2 h-4 w-4" />
                    Manter em Análise
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
