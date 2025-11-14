'use client';

import { useState, useMemo } from 'react';
import type { Product, HospitalOrderTemplateItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateHospitalOrderTemplate } from '@/lib/actions';
import { useRouter } from 'next/navigation';

// Represents an item in the selection table, could be in the template or not.
type SelectableItem = {
    productId: string;
    name: string;
    presentation: string;
    category: string;
    isInTemplate: boolean;
};

export function OrderTemplateClientPage({ cafInventory, initialTemplate }: { cafInventory: Product[], initialTemplate: HospitalOrderTemplateItem[] }) {
    const { toast } = useToast();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Group CAF inventory by name and presentation to get unique requestable items
    const uniqueRequestableItems = useMemo(() => {
        const map = new Map<string, SelectableItem>();
        cafInventory.forEach(product => {
            const key = `${product.name}|${product.presentation}`;
            if (!map.has(key)) {
                map.set(key, {
                    productId: product.id, // Use the ID of the first product instance as the reference
                    name: product.name,
                    presentation: product.presentation || 'N/A',
                    category: product.category,
                    isInTemplate: initialTemplate.some(t => t.name === product.name && t.presentation === product.presentation),
                });
            }
        });
        return Array.from(map.values());
    }, [cafInventory, initialTemplate]);
    
    const [selection, setSelection] = useState<Record<string, boolean>>(() => {
        const initialSelection: Record<string, boolean> = {};
        uniqueRequestableItems.forEach(item => {
            if (item.isInTemplate) {
                initialSelection[item.productId] = true;
            }
        });
        return initialSelection;
    });

    const filteredItems = useMemo(() => {
        return uniqueRequestableItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.presentation.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [uniqueRequestableItems, searchTerm]);

    const handleSaveTemplate = async () => {
        setIsSaving(true);
        const newTemplate: HospitalOrderTemplateItem[] = [];
        Object.keys(selection).forEach(productId => {
            if (selection[productId]) {
                const item = uniqueRequestableItems.find(i => i.productId === productId);
                if (item) {
                    newTemplate.push({
                        productId: item.productId,
                        name: item.name,
                        presentation: item.presentation,
                        category: item.category,
                    });
                }
            }
        });
        
        try {
            await updateHospitalOrderTemplate(newTemplate);
            toast({ title: "Sucesso!", description: "Seu pedido padrão foi salvo."});
            router.refresh(); // To reflect changes if the user navigates away and comes back
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar o pedido padrão.'});
        } finally {
            setIsSaving(false);
        }
    };
    
    const columns: ColumnDef<SelectableItem>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => {
                        const newSelection = { ...selection };
                        table.getRowModel().rows.forEach(row => {
                            newSelection[row.original.productId] = !!value;
                        });
                        setSelection(newSelection);
                        table.toggleAllPageRowsSelected(!!value);
                    }}
                    aria-label="Selecionar tudo"
                />
            ),
            cell: ({ row }) => (
                 <Checkbox
                    checked={!!selection[row.original.productId]}
                    onCheckedChange={(value) => {
                        setSelection(prev => ({
                            ...prev,
                            [row.original.productId]: !!value,
                        }));
                    }}
                    aria-label="Selecionar linha"
                />
            ),
        },
        { accessorKey: 'name', header: 'Nome do Produto' },
        { accessorKey: 'presentation', header: 'Apresentação' },
        { accessorKey: 'category', header: 'Categoria' },
    ];
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Definir Pedido Padrão</CardTitle>
                <CardDescription>
                    Selecione os itens que aparecerão na sua lista de pedidos para o CAF. Itens marcados serão seu pedido padrão.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <Input 
                        placeholder="Buscar item no inventário do CAF..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                    <Button onClick={handleSaveTemplate} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Salvar Pedido Padrão
                    </Button>
                </div>
                <DataTable columns={columns} data={filteredItems} rowSelection={selection} setRowSelection={setSelection} />
            </CardContent>
        </Card>
    );
}
