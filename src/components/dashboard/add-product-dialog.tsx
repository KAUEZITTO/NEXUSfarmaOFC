
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { products } from '@/lib/data';
import type { Product } from '@/lib/types';

type AddProductDialogProps = {
  children: React.ReactNode;
};

const categories: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Outro'];
const presentations: Exclude<Product['presentation'], undefined>[] = ['Comprimido', 'Unidade', 'Caixa c/ 100', 'Seringa 4g', 'Frasco 10ml', 'Caixa c/ 50', 'Caneta 3ml', 'Pacote', 'Bolsa', 'Outro'];
const suppliers: Exclude<Product['supplier'], undefined>[] = ['Casmed', 'Mednutri', 'Doação', 'Outro'];

export function AddProductDialog({ children }: AddProductDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [commercialName, setCommercialName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [category, setCategory] = useState<Product['category']>('Medicamento');
  const [batch, setBatch] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplier, setSupplier] = useState<Product['supplier']>('Casmed');
  const [quantity, setQuantity] = useState(0);
  const [presentation, setPresentation] = useState<Product['presentation']>('Unidade');

  const generateProductId = (productName: string): string => {
    const existingProducts = products.filter(p => p.name.toLowerCase() === productName.toLowerCase());

    if (existingProducts.length === 0) {
      // It's a new product, find the max ID and increment
      const maxIdNum = products.reduce((max, p) => {
        const idNum = parseInt(p.id.split('-')[1], 10);
        return idNum > max ? idNum : max;
      }, 0);
      const newId = (maxIdNum + 1).toString().padStart(3, '0');
      return `PROD-${newId}`;
    }

    // It's a new batch of an existing product
    const baseId = existingProducts[0].id.split('-').slice(0, 2).join('-');
    const maxSuffix = existingProducts.reduce((max, p) => {
      const parts = p.id.split('-');
      if (parts.length > 2) {
        const suffix = parseInt(parts[2], 10);
        return suffix > max ? suffix : max;
      }
      return max;
    }, 0);
    return `${baseId}-${maxSuffix + 1}`;
  };

  const handleSave = () => {
    if (!name || !category || quantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Campos Obrigatórios',
        description: 'Nome, Categoria e Quantidade são obrigatórios.',
      });
      return;
    }

    const newProductId = generateProductId(name);

    const newProduct: Product = {
      id: newProductId,
      name,
      commercialName: category === 'Medicamento' ? commercialName : undefined,
      manufacturer: manufacturer,
      category,
      quantity,
      batch,
      expiryDate,
      supplier,
      presentation,
      status: quantity > 0 ? (quantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque',
    };

    products.unshift(newProduct); // Add to the beginning of the array

    toast({
      title: 'Produto Adicionado!',
      description: `${newProduct.name} foi adicionado ao inventário com sucesso.`,
    });

    setIsOpen(false);
    // Reset form
    setName('');
    setCommercialName('');
    setManufacturer('');
    setBatch('');
    setExpiryDate('');
    setQuantity(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto ao Inventário</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto (Princípio Ativo/Descrição)</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select onValueChange={(v) => setCategory(v as any)} value={category}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {category === 'Medicamento' && (
            <div className="space-y-2">
              <Label htmlFor="commercialName">Nome Comercial (Opcional)</Label>
              <Input id="commercialName" value={commercialName} onChange={(e) => setCommercialName(e.target.value)} />
            </div>
          )}
           <div className="space-y-2">
              <Label htmlFor="manufacturer">Laboratório/Indústria (Opcional)</Label>
              <Input id="manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
            </div>
          <div className="space-y-2">
            <Label htmlFor="batch">Lote</Label>
            <Input id="batch" value={batch} onChange={(e) => setBatch(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Data de Validade</Label>
            <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="presentation">Apresentação</Label>
             <Select onValueChange={(v) => setPresentation(v as any)} value={presentation}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {presentations.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label htmlFor="supplier">Fornecedor</Label>
             <Select onValueChange={(v) => setSupplier(v as any)} value={supplier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Produto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
