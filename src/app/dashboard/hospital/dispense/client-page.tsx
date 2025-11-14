
'use client';

import { useState }from 'react';
import { addSectorDispensation } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Product, HospitalSector, SectorDispensation, DispensationItem, ProductCategory } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackagePlus, ListPlus, X, Save, Loader2, Hospital, History } from 'lucide-react';
import { AddItemsManuallyDialog } from '@/components/dashboard/add-items-manually-dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

type RemessaItem = DispensationItem & { internalId: string };

const itemCategories: ProductCategory[] = ['Medicamento', 'Material Técnico', 'Outro'];

interface DispenseToSectorClientPageProps {
    initialProducts: Product[];
    initialDispensations: SectorDispensation[];
    hospitalSectors: HospitalSector[];
}

export function DispenseToSectorClientPage({ initialProducts, initialDispensations, hospitalSectors }: DispenseToSectorClientPageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedSector, setSelectedSector] = useState<string>('');
    const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
    const [items, setItems] = useState<RemessaItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    const recentDispensationsForSector = selectedSector ? initialDispensations.filter(d => d.sector === selectedSector).slice(0, 5) : [];

    const handleCategoryToggle = (category: ProductCategory) => {
        setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    };

    const addProductToDispensation = (product: Product, quantity: number) => {
        if (product.quantity < quantity) {
            toast({ variant: 'destructive', title: 'Estoque Insuficiente', description: `Apenas ${product.quantity} unidades de ${product.name} disponíveis.` });
            return false;
        }

        const existingItem = items.find(item => item.productId === product.id);
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (product.quantity < newQuantity) {
                toast({ variant: 'destructive', title: 'Estoque Insuficiente', description: `Quantidade total (${newQuantity}) excede o estoque disponível (${product.quantity}).` });
                return false;
            }
            setItems(items.map(item => item.productId === product.id ? { ...item, quantity: newQuantity } : item));
        } else {
            const newItem: RemessaItem = {
                internalId: `item-${Date.now()}-${Math.random()}`,
                productId: product.id,
                name: product.name,
                quantity: quantity,
                batch: product.batch || 'N/A',
                expiryDate: product.expiryDate,
                presentation: product.presentation || 'N/A',
                category: product.category,
            };
            setItems(prev => [newItem, ...prev]);
        }
        return true;
    };
    
    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.internalId !== id));
    };

    const handleItemQuantityChange = (id: string, newQuantity: number) => {
        const itemToUpdate = items.find(i => i.internalId === id);
        if (!itemToUpdate) return;
        
        const product = initialProducts.find(p => p.id === itemToUpdate.productId);
        if(product && newQuantity > product.quantity) {
            toast({ variant: 'destructive', title: 'Estoque Insuficiente', description: `Apenas ${product.quantity} disponíveis.` });
            return;
        }
        setItems(items.map(item => item.internalId === id ? { ...item, quantity: newQuantity >= 1 ? newQuantity : 1 } : item));
    };

    const handleSave = async () => {
        if (!selectedSector) {
            toast({ variant: 'destructive', title: 'Selecione um Setor', description: 'Você precisa escolher um setor de destino.' });
            return;
        }
        if (items.length === 0) {
            toast({ variant: 'destructive', title: 'Nenhum Item', description: 'Adicione pelo menos um item para dispensar.' });
            return;
        }
        setIsSaving(true);
        try {
            const dispensationItems = items.map(({ internalId, ...rest }) => rest);
            await addSectorDispensation({ sector: selectedSector, items: dispensationItems });
            toast({ title: 'Dispensação Registrada', description: `Itens dispensados para ${selectedSector} com sucesso.` });
            router.refresh();
            setItems([]);
            setSelectedCategories([]);
            setSelectedSector('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível registrar a dispensação.' });
        } finally {
            setIsSaving(false);
        }
    };

    const productsForManualAdd = selectedCategories.length > 0 
        ? initialProducts.filter(p => selectedCategories.includes(p.category)) 
        : initialProducts.filter(p => itemCategories.includes(p.category));


    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Hospital className="h-6 w-6"/> Dispensar Itens para Setores</CardTitle>
                        <CardDescription>Registre a saída de materiais para os setores do hospital.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/dashboard/hospital/sectors')}>Gerenciar Setores</Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Selecione o Destino e os Itens</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="font-medium">Setor de Destino</label>
                                <Select value={selectedSector} onValueChange={(v) => setSelectedSector(v as string)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o setor..." /></SelectTrigger>
                                    <SelectContent>
                                        {hospitalSectors.length > 0 ? hospitalSectors.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>) : <SelectItem value="" disabled>Nenhum setor cadastrado</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className={!selectedSector ? 'opacity-50 pointer-events-none' : ''}>
                                <label className="font-medium block mb-2">Categorias de Itens</label>
                                <div className="flex flex-wrap gap-2">
                                    {itemCategories.map(cat => (
                                        <Button key={cat} variant={selectedCategories.includes(cat) ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryToggle(cat)}>{cat}</Button>
                                    ))}
                                </div>
                                <AddItemsManuallyDialog 
                                    allProducts={productsForManualAdd}
                                    selectedCategories={selectedCategories.length > 0 ? selectedCategories : itemCategories}
                                    onAddProduct={addProductToDispensation}
                                    trigger={
                                        <Button variant="secondary" className="w-full mt-4">
                                            <ListPlus className="mr-2 h-4 w-4" /> Adicionar Itens
                                        </Button>
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Histórico Recente do Setor</CardTitle>
                            <CardDescription>Últimas 5 dispensações para o setor selecionado.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {selectedSector && recentDispensationsForSector.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                    {recentDispensationsForSector.map(d => (
                                        <li key={d.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                                            <span>{new Date(d.date).toLocaleString('pt-BR')} por {d.dispensedBy}</span>
                                            <span className="font-semibold">{d.items.reduce((sum, i) => sum + i.quantity, 0)} itens</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                                    {selectedSector ? 'Nenhuma dispensação recente para este setor.' : 'Selecione um setor para ver o histórico.'}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5"/> Itens na Dispensação Atual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {items.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%]">Produto</TableHead>
                                        <TableHead>Lote</TableHead>
                                        <TableHead>Validade</TableHead>
                                        <TableHead className="w-[100px]">Qtd.</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.internalId}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.batch || '—'}</TableCell>
                                            <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR', {month: '2-digit', year:'2-digit', timeZone: 'UTC'}) : '—'}</TableCell>
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
                             <div className="text-center h-24 text-muted-foreground flex items-center justify-center border rounded-md">Aguardando adição de itens...</div>
                        )}
                    </CardContent>
                </Card>
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving || items.length === 0 || !selectedSector}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        {isSaving ? 'Salvando...' : 'Salvar Dispensação'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
