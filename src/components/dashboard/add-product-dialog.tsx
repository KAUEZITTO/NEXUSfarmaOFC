
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Save, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addProduct, updateProduct, getKnowledgeBase } from '@/lib/actions';
import type { Product, KnowledgeBaseItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ProductSavedDialog } from './product-saved-dialog';
import { useDebounce } from 'use-debounce';

type AddProductDialogProps = {
  trigger: React.ReactNode;
  productToEdit?: Product;
};

const categories: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Outro'];
const presentations: Exclude<Product['presentation'], undefined>[] = ['Comprimido', 'Unidade', 'Caixa c/ 100', 'Seringa 4g', 'Frasco 10ml', 'Caixa c/ 50', 'Caneta 3ml', 'Pacote', 'Bolsa', 'Outro'];
const suppliers: Exclude<Product['supplier'], undefined>[] = ['Casmed', 'Mednutri', 'Doação', 'Outro'];

export function AddProductDialog({ trigger, productToEdit }: AddProductDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!productToEdit;

  const [savedProduct, setSavedProduct] = useState<Product | null>(null);
  const [showSavedDialog, setShowSavedDialog] = useState(false);

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
  const [therapeuticClass, setTherapeuticClass] = useState('');
  const [mainFunction, setMainFunction] = useState('');
  
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseItem[]>([]);
  const [debouncedName] = useDebounce(name, 300);


  useEffect(() => {
    async function loadKnowledgeBase() {
        if(isOpen) {
            const kb = await getKnowledgeBase();
            setKnowledgeBase(kb);
        }
    }
    loadKnowledgeBase();
  }, [isOpen]);

  useEffect(() => {
      if(debouncedName && knowledgeBase.length > 0) {
          const searchTerm = debouncedName.toLowerCase();
          const match = knowledgeBase.find(item => searchTerm.includes(item.name.toLowerCase()));
          if(match) {
              setTherapeuticClass(match.therapeuticClass);
              setMainFunction(match.mainFunction);
          } else {
              setTherapeuticClass('');
              setMainFunction('');
          }
      }
  }, [debouncedName, knowledgeBase]);


  const resetForm = () => {
    setName('');
    setCommercialName('');
    setManufacturer('');
    setCategory('Medicamento');
    setBatch('');
    setExpiryDate('');
    setSupplier('Casmed');
    setQuantity(0);
    setPresentation('Unidade');
    setTherapeuticClass('');
    setMainFunction('');
  }

  useEffect(() => {
    if (productToEdit && isOpen) {
        setName(productToEdit.name);
        setCommercialName(productToEdit.commercialName || '');
        setManufacturer(productToEdit.manufacturer || '');
        setCategory(productToEdit.category);
        setTherapeuticClass(productToEdit.therapeuticClass || '');
        setMainFunction(productToEdit.mainFunction || '');
        setBatch(productToEdit.batch || '');
        setExpiryDate(productToEdit.expiryDate || '');
        setSupplier(productToEdit.supplier || 'Outro');
        setQuantity(productToEdit.quantity);
        setPresentation(productToEdit.presentation || 'Outro');
    } else if (!isEditing && isOpen) {
        resetForm();
    }
  }, [productToEdit, isOpen, isEditing]);

  const handleSave = async () => {
    if (!name || !category || (quantity < 0)) {
      toast({
        variant: 'destructive',
        title: 'Campos Obrigatórios',
        description: 'Nome, Categoria e Quantidade são obrigatórios.',
      });
      return;
    }
    setIsSaving(true);

    try {
        let resultProduct: Product;
        if (isEditing && productToEdit) {
            const productDataToUpdate = {
                name,
                commercialName: category === 'Medicamento' ? commercialName : undefined,
                manufacturer,
                category,
                therapeuticClass,
                mainFunction,
                quantity,
                batch,
                expiryDate,
                supplier,
                presentation,
            };
            resultProduct = await updateProduct(productToEdit.id, productDataToUpdate);
            toast({
              title: 'Produto Atualizado!',
              description: `${name} foi atualizado com sucesso.`,
            });
        } else {
            const newProductData: Omit<Product, 'id' | 'status'> = {
                name,
                commercialName: category === 'Medicamento' ? commercialName : undefined,
                manufacturer: manufacturer,
                category,
                therapeuticClass,
                mainFunction,
                quantity,
                batch,
                expiryDate,
                supplier,
                presentation,
            };
            resultProduct = await addProduct(newProductData);
            toast({
                title: 'Produto Adicionado!',
                description: `${newProductData.name} foi adicionado ao inventário com sucesso.`,
            });
        }
        
        router.refresh();
        setIsOpen(false);
        setSavedProduct(resultProduct);
        setShowSavedDialog(true);
        resetForm();
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Erro ao salvar',
            description: 'Ocorreu um erro ao salvar o produto. Tente novamente.',
        });
        console.error("Failed to save product:", error);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
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
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <Label htmlFor="therapeuticClass">Classe Terapêutica</Label>
                <Input id="therapeuticClass" value={therapeuticClass} placeholder="Preenchido automaticamente..." readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
                <Label htmlFor="mainFunction">Função Principal</Label>
                <Input id="mainFunction" value={mainFunction} placeholder="Preenchido automaticamente..." readOnly className="bg-muted/50" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {savedProduct && (
          <ProductSavedDialog
            isOpen={showSavedDialog}
            onOpenChange={setShowSavedDialog}
            product={savedProduct}
          />
      )}
    </>
  );
}
