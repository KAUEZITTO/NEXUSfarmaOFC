
'use client';

import { useState } from 'react';
import type { Product, OrderItem, OrderType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddItemsManuallyDialog } from '@/components/dashboard/add-items-manually-dialog';
import { ListPlus, PackagePlus, X, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addOrder } from '@/lib/actions';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type RemessaItem = OrderItem & { internalId: string };
const itemCategories: Product['category'][] = ['Medicamento', 'Material Técnico', 'Tiras de Glicemia/Lancetas', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)'];

interface CreateOrderDialogProps {
    trigger: React.ReactNode;
    cafInventory: Product[];
    hospitalUnitId: string;
    onOrderCreated: () => void;
}

export function CreateOrderDialog({ trigger, cafInventory, hospitalUnitId, onOrderCreated }: CreateOrderDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [items, setItems] = useState<RemessaItem[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<Product['category'][]>([]);
    const [orderType, setOrderType] = useState<OrderType>('Pedido Mensal');
    const [notes, setNotes] = useState('');

    const handleCategoryToggle = (category: Product['category']) => {
        setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    };

    const addProductToOrder = (product: Product, quantity: number) => {
        const existingItem = items.find(item => item.productId === product.id);
        if (existingItem) {
            setItems(items.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item));
        } else {
            const newItem: RemessaItem = {
                internalId: `item-${Date.now()}-${Math.random()}`,
                productId: product.id,
                name: product.name,
                quantity: quantity,
                batch: product.batch,
                expiryDate: product.expiryDate,
                presentation: product.presentation,
                category: product.category,
            };
            setItems(prev => [newItem, ...prev]);
        }
        toast({ title: "Item Adicionado", description: `${product.name} foi adicionado ao seu pedido.` });
        return true; // Assume success, as we are requesting from CAF's inventory
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.internalId !== id));
    };

    const handleItemQuantityChange = (id: string, newQuantity: number) => {
        setItems(items.map(item => item.internalId === id ? { ...item, quantity: newQuantity >= 1 ? newQuantity : 1 } : item));
    };

    const handleSendOrder = async () => {
        if (items.length === 0) {
            toast({ variant: "destructive", title: "Pedido Vazio", description: "Adicione pelo menos um item ao pedido." });
            return;
        }
        setIsSaving(true);
        try {
            // We need the hospital unit's name, which we don't have here. 
            // The action can fetch it based on hospitalUnitId.
            // For now, let's pass a placeholder.
            await addOrder({
                unitId: hospitalUnitId,
                unitName: 'Hospital Municipal', // This should be fetched dynamically
                orderType,
                items: items.map(({ internalId, ...rest }) => rest),
                notes,
            });
            onOrderCreated();
            setIsOpen(false);
            setItems([]);
            setNotes('');
            setSelectedCategories([]);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao Enviar", description: "Não foi possível enviar o pedido." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const productsForManualAdd = selectedCategories.length > 0 
        ? cafInventory.filter(p => selectedCategories.includes(p.category)) 
        : [];


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Criar Novo Pedido para o CAF</DialogTitle>
                    <DialogDescription>Selecione os itens e quantidades que deseja solicitar do Centro de Abastecimento Farmacêutico.</DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold">1. Filtre e adicione itens</h3>
                         <div className="flex flex-wrap gap-2">
                            {itemCategories.map(cat => (
                                <Button key={cat} variant={selectedCategories.includes(cat) ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryToggle(cat)}>{cat}</Button>
                            ))}
                        </div>
                        <AddItemsManuallyDialog
                            allProducts={productsForManualAdd}
                            selectedCategories={selectedCategories}
                            onAddProduct={addProductToOrder}
                            trigger={<Button variant="secondary" className="w-full" disabled={selectedCategories.length === 0}><ListPlus className="mr-2 h-4 w-4" /> Adicionar Itens</Button>}
                        />
                         <div className="space-y-2">
                            <label className="font-medium">Tipo de Pedido</label>
                            <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pedido Mensal">Pedido Mensal</SelectItem>
                                    <SelectItem value="Pedido Extra">Pedido Extra</SelectItem>
                                    <SelectItem value="Pedido Urgente">Pedido Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="font-medium">Justificativa / Observações</label>
                            <Textarea placeholder="Ex: Aumento da demanda no setor de emergência." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2"><PackagePlus className="h-5 w-5"/> Itens no Pedido</h3>
                        <ScrollArea className="h-96">
                            {items.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead className="w-[100px]">Qtd.</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => (
                                            <TableRow key={item.internalId}>
                                                <TableCell className="font-medium">{item.name} <span className="text-muted-foreground text-xs">({item.presentation})</span></TableCell>
                                                <TableCell>
                                                    <Input type="number" min="1" value={item.quantity} onChange={(e) => handleItemQuantityChange(item.internalId, parseInt(e.target.value, 10) || 0)} className="w-20 h-8" />
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.internalId)}><X className="h-4 w-4 text-destructive" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center h-full text-muted-foreground flex items-center justify-center border rounded-md">Aguardando adição de itens...</div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleSendOrder} disabled={isSaving || items.length === 0}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                        Enviar Pedido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

