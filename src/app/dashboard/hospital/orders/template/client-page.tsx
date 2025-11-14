
'use client';

import { useState } from 'react';
import type { HospitalOrderTemplateItem, ProductCategory } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateHospitalOrderTemplate } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const productCategories: ProductCategory[] = ['Medicamento', 'Material Técnico', 'Tiras de Glicemia/Lancetas', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)', 'Outro'];

type EditableTemplateItem = HospitalOrderTemplateItem & {
    internalId: string;
};

export function OrderTemplateClientPage({ initialTemplate }: { initialTemplate: HospitalOrderTemplateItem[] }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    
    const [templateItems, setTemplateItems] = useState<EditableTemplateItem[]>(() => 
        initialTemplate.map(item => ({ ...item, internalId: `item-${Math.random()}` }))
    );

    const handleAddItem = () => {
        setTemplateItems(prev => [
            ...prev,
            {
                internalId: `new-${Date.now()}`,
                productId: `temp-${Date.now()}`, // Placeholder ID
                name: '',
                presentation: '',
                category: 'Medicamento',
            }
        ]);
    };
    
    const handleRemoveItem = (internalId: string) => {
        setTemplateItems(prev => prev.filter(item => item.internalId !== internalId));
    };
    
    const handleItemChange = (internalId: string, field: keyof EditableTemplateItem, value: string) => {
        setTemplateItems(prev => prev.map(item => 
            item.internalId === internalId ? { ...item, [field]: value } : item
        ));
    };

    const handleSaveTemplate = async () => {
        setIsSaving(true);
        const newTemplate = templateItems
            .filter(item => item.name.trim() !== '') // Ensure item has a name
            .map(({ internalId, ...rest }) => rest);
        
        try {
            await updateHospitalOrderTemplate(newTemplate);
            toast({ title: "Sucesso!", description: "Seu pedido padrão foi salvo."});
            router.refresh(); 
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar o pedido padrão.'});
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div>
                        <CardTitle>Definir Pedido Padrão</CardTitle>
                        <CardDescription>
                            Crie e gerencie a lista de itens que aparecerão no seu formulário de pedido para o CAF.
                        </CardDescription>
                    </div>
                    <Button onClick={handleSaveTemplate} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Salvar Pedido Padrão
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Nome do Produto</TableHead>
                            <TableHead className="w-[30%]">Apresentação</TableHead>
                            <TableHead className="w-[20%]">Categoria</TableHead>
                            <TableHead className="w-[10%]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templateItems.length > 0 ? templateItems.map((item) => (
                            <TableRow key={item.internalId}>
                                <TableCell>
                                    <Input 
                                        value={item.name} 
                                        onChange={(e) => handleItemChange(item.internalId, 'name', e.target.value)}
                                        placeholder="Ex: Dipirona 500mg"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        value={item.presentation} 
                                        onChange={(e) => handleItemChange(item.internalId, 'presentation', e.target.value)}
                                        placeholder="Ex: Comprimido"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select 
                                        value={item.category} 
                                        onValueChange={(value) => handleItemChange(item.internalId, 'category', value)}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {productCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.internalId)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Nenhum item no pedido padrão. Comece adicionando um.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <Button onClick={handleAddItem} variant="outline" className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Item
                </Button>
            </CardContent>
        </Card>
    );
}
