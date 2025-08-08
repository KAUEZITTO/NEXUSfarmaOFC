
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
import { Checkbox } from '@/components/ui/checkbox';
import { X, PlusCircle, Save, Trash2, Loader2, PackageSearch } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { getUnits, getProducts, addOrder } from '@/lib/actions';
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

type Category = 'Medicamento' | 'Material Técnico' | 'Odontológico' | 'Laboratório' | 'Fraldas' | 'Outro';
const availableCategories: Category[] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Outro'];


export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [destinationUnitId, setDestinationUnitId] = useState('');
  const [notes, setNotes] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<RemessaItem[]>([]);

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

  const handleCategoryToggle = (category: Category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const handleAddItem = (category: Category) => {
    setItems([...items, { internalId: `item-${Date.now()}`, productId: '', quantity: 1, name: '', category: category }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.internalId !== id));
  };
    
  const handleItemChange = (id: string, field: 'quantity', value: number) => {
    setItems(items.map(item => item.internalId === id ? { ...item, [field]: value } : item));
  };

  const handleProductSelect = (id: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setItems(items.map(item => item.internalId === id ? { 
        ...item, 
        productId: product.id,
        name: product.name,
        batch: product.batch || 'N/A',
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A',
        presentation: product.presentation || 'N/A',
        category: product.category,
      } : item));
    }
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

    if (items.some(item => !item.productId || item.quantity <= 0)) {
       toast({
        variant: 'destructive',
        title: 'Erro de Validação',
        description: 'Por favor, preencha todos os produtos e quantidades corretamente.',
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

  const productsByCategory = useMemo(() => {
    return (category: Category) => products.filter(p => p.category === category);
  }, [products]);


  if (loading) {
    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="mx-auto grid w-full max-w-5xl flex-1 auto-rows-max gap-4">
                 <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Criar Nova Remessa
                 </h1>
                 <Card>
                    <CardHeader>
                        <CardTitle>Detalhes da Remessa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Itens da Remessa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full mb-4" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                 </Card>
            </div>
        </div>
    )
  }

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="mx-auto grid w-full max-w-5xl flex-1 auto-rows-max gap-4">
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
        
        <div className="grid gap-8">
            {/* Step 1: Destination */}
            <Card>
              <CardHeader>
                <CardTitle>Passo 1: Destino e Categorias</CardTitle>
                <CardDescription>
                  Selecione a unidade de destino e as categorias de itens que serão enviados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="unit" className="mb-2 block">Unidade de Destino</Label>
                        <Select onValueChange={setDestinationUnitId} value={destinationUnitId}>
                            <SelectTrigger id="unit" aria-label="Selecione a unidade"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                            <SelectContent>
                            {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className={!destinationUnitId ? 'opacity-50' : ''}>
                        <Label className="mb-2 block">Categorias de Itens</Label>
                        <div className="grid grid-cols-2 gap-4">
                             {availableCategories.map(cat => (
                                <div key={cat} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={cat} 
                                        checked={selectedCategories.includes(cat)} 
                                        onCheckedChange={() => handleCategoryToggle(cat)}
                                        disabled={!destinationUnitId}
                                    />
                                    <Label htmlFor={cat} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {cat}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Items */}
            {selectedCategories.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Passo 2: Adicionar Itens</CardTitle>
                        <CardDescription>
                          Adicione os produtos e quantidades para cada categoria selecionada.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {selectedCategories.map(category => (
                            <div key={category}>
                                <h3 className="text-lg font-semibold mb-3">{category}</h3>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[40%]">Produto</TableHead>
                                                <TableHead>Lote</TableHead>
                                                <TableHead>Validade</TableHead>
                                                <TableHead>Apresentação</TableHead>
                                                <TableHead className="w-[100px]">Qtd.</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.filter(i => i.category === category).map((item, index) => (
                                                <TableRow key={item.internalId}>
                                                    <TableCell>
                                                        <Select value={item.productId} onValueChange={(value) => handleProductSelect(item.internalId, value)}>
                                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                            <SelectContent>
                                                                {productsByCategory(category).map(p => (
                                                                    <SelectItem key={p.id} value={p.id} disabled={p.quantity === 0}>
                                                                        {p.name} (Estoque: {p.quantity})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>{item.batch || '—'}</TableCell>
                                                    <TableCell>{item.expiryDate || '—'}</TableCell>
                                                    <TableCell>{item.presentation || '—'}</TableCell>
                                                    <TableCell>
                                                        <Input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(item.internalId, 'quantity', parseInt(e.target.value, 10) || 0)}/>
                                                    </TableCell>
                                                     <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.internalId)}><X className="h-4 w-4 text-destructive" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {items.filter(i => i.category === category).length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                        <PackageSearch className="mx-auto h-8 w-8 mb-2" />
                                                        Nenhum item adicionado a esta categoria.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Button variant="outline" size="sm" className="mt-4" onClick={() => handleAddItem(category)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Notes */}
             {items.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Passo 3: Observações (Opcional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea placeholder="Adicione qualquer observação sobre a remessa..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </CardContent>
                </Card>
             )}
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

    