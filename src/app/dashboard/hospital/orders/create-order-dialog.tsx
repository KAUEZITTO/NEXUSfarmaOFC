'use client';

import { useState, useEffect } from 'react';
import type { OrderItem, OrderType, HospitalOrderTemplateItem } from '@/lib/types';
import { getHospitalOrderTemplate, addOrder } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PackagePlus, Send, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type RequestedItem = OrderItem & { internalId: string };

interface CreateOrderDialogProps {
    trigger: React.ReactNode;
    hospitalUnitId: string;
    onOrderCreated: () => void;
}

export function CreateOrderDialog({ trigger, hospitalUnitId, onOrderCreated }: CreateOrderDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [standardItems, setStandardItems] = useState<RequestedItem[]>([]);
    const [otherItems, setOtherItems] = useState<RequestedItem[]>([]);
    const [orderType, setOrderType] = useState<OrderType>('Pedido Mensal');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchTemplate = async () => {
                setIsLoading(true);
                try {
                    const template = await getHospitalOrderTemplate();
                    const requestedItems: RequestedItem[] = template.map(item => ({
                        ...item,
                        internalId: `std-${item.productId}`,
                        quantity: 0,
                    }));
                    setStandardItems(requestedItems);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Erro ao Carregar', description: 'Não foi possível carregar o pedido padrão.'});
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTemplate();
        } else {
            // Reset state on close
            setStandardItems([]);
            setOtherItems([]);
            setOrderType('Pedido Mensal');
            setNotes('');
        }
    }, [isOpen, toast]);

    const handleQuantityChange = (id: string, newQuantity: number, isStandard: boolean) => {
        const list = isStandard ? standardItems : otherItems;
        const setList = isStandard ? setStandardItems : setOtherItems;
        setList(list.map(item => item.internalId === id ? { ...item, quantity: newQuantity >= 0 ? newQuantity : 0 } : item));
    };

    const handleAddOtherItem = () => {
        setOtherItems(prev => [...prev, {
            internalId: `other-${Date.now()}`,
            productId: `other-${Date.now()}`, // Placeholder ID
            name: '',
            presentation: '',
            category: 'Outro',
            quantity: 1,
        }]);
    };

    const handleOtherItemChange = (id: string, field: 'name' | 'presentation', value: string) => {
        setOtherItems(otherItems.map(item => item.internalId === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveOtherItem = (id: string) => {
        setOtherItems(otherItems.filter(item => item.internalId !== id));
    };

    const handleSendOrder = async () => {
        const allItems = [...standardItems, ...otherItems];
        const itemsToSubmit = allItems.filter(item => item.quantity > 0 && item.name);
        
        if (itemsToSubmit.length === 0) {
            toast({ variant: "destructive", title: "Pedido Vazio", description: "Adicione a quantidade de pelo menos um item." });
            return;
        }

        setIsSaving(true);
        try {
            await addOrder({
                unitId: hospitalUnitId,
                unitName: 'Hospital Municipal', // The action should confirm this name
                orderType,
                items: itemsToSubmit.map(({ internalId, ...rest }) => rest),
                notes,
            });
            onOrderCreated();
            setIsOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao Enviar", description: "Não foi possível enviar o pedido." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Criar Novo Pedido para o CAF</DialogTitle>
                    <DialogDescription>Preencha as quantidades dos itens do seu pedido padrão ou adicione outros itens.</DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex justify-center items-center h-96">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
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
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><PackagePlus className="h-5 w-5"/> Itens do Pedido</h3>
                            <ScrollArea className="h-96">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead className="w-[100px]">Qtd.</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {standardItems.map((item) => (
                                            <TableRow key={item.internalId}>
                                                <TableCell className="font-medium">{item.name} <span className="text-muted-foreground text-xs">({item.presentation})</span></TableCell>
                                                <TableCell>
                                                    <Input type="number" min="0" value={item.quantity} onChange={(e) => handleQuantityChange(item.internalId, parseInt(e.target.value, 10) || 0, true)} className="w-20 h-8" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-4">
                                    <h4 className="font-semibold text-sm mb-2">Outros Itens</h4>
                                    {otherItems.length > 0 && (
                                        <Table>
                                             <TableBody>
                                                {otherItems.map((item) => (
                                                     <TableRow key={item.internalId}>
                                                        <TableCell className='flex gap-2'>
                                                            <Input placeholder='Nome do item' value={item.name} onChange={e => handleOtherItemChange(item.internalId, 'name', e.target.value)} />
                                                            <Input placeholder='Apresentação' value={item.presentation} onChange={e => handleOtherItemChange(item.internalId, 'presentation', e.target.value)} />
                                                        </TableCell>
                                                         <TableCell>
                                                            <Input type="number" min="1" value={item.quantity} onChange={(e) => handleQuantityChange(item.internalId, parseInt(e.target.value, 10) || 0, false)} className="w-20 h-8" />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveOtherItem(item.internalId)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        </TableCell>
                                                     </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                    <Button variant="outline" size="sm" className="mt-2" onClick={handleAddOtherItem}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Outro Item
                                    </Button>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleSendOrder} disabled={isSaving || isLoading}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                        Enviar Pedido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
