
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { X, PlusCircle, Save, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
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

export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<RemessaItem[]>([
    { internalId: `item-${Date.now()}`, productId: '', quantity: 1, name: '', category: 'Medicamento' },
  ]);
  const [destinationUnitId, setDestinationUnitId] = useState('');
  const [notes, setNotes] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleAddItem = () => {
    setItems([...items, { internalId: `item-${Date.now()}`, productId: '', quantity: 1, name: '', category: 'Medicamento' }]);
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
        batch: product.batch,
        expiryDate: product.expiryDate,
        presentation: product.presentation,
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

  if (loading) {
    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="mx-auto grid max-w-5xl flex-1 auto-rows-max gap-4">
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
      <div className="mx-auto grid max-w-5xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Criar Nova Remessa
          </h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="sm" onClick={handleDiscard} disabled={isSaving}>
                <Trash2 className="mr-2 h-4 w-4" />
                Descartar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Salvando...' : 'Salvar Remessa'}
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Remessa</CardTitle>
                <CardDescription>
                  Selecione a unidade de destino e adicione os produtos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <Label htmlFor="unit">Unidade de Destino</Label>
                  <Select onValueChange={setDestinationUnitId} value={destinationUnitId}>
                    <SelectTrigger
                      id="unit"
                      aria-label="Selecione a unidade"
                    >
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Itens da Remessa</CardTitle>
                <CardDescription>
                  Adicione os produtos e quantidades para esta remessa.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.internalId}
                      className="grid grid-cols-[1fr_100px_auto] items-center gap-4"
                    >
                      <Select
                        value={item.productId}
                        onValueChange={(value) => handleProductSelect(item.internalId, value)}
                      >
                        <SelectTrigger
                          id={`product-${index}`}
                          aria-label="Selecione o produto"
                        >
                          <SelectValue placeholder="Selecione um produto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id} disabled={product.quantity === 0}>
                              {product.name} (Estoque: {product.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        type="number" 
                        placeholder="Qtd." 
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.internalId, 'quantity', parseInt(e.target.value, 10) || 0)}
                        min="1"
                      />
                       <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.internalId)} disabled={items.length <= 1}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Separator />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAddItem}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar outro item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Adicione qualquer observação sobre a remessa..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 md:hidden">
          <Button variant="outline" size="sm" onClick={handleDiscard} disabled={isSaving}>
            Descartar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Salvando...' : 'Salvar Remessa'}
          </Button>
        </div>
      </div>
    </div>
  );
}
