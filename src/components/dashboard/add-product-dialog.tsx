

'use client';

import React, { useState, useEffect } from 'react';
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
import { Save, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addProduct, updateProduct, uploadImage } from '@/lib/actions';
import { getKnowledgeBase } from '@/lib/data';
import type { Product, KnowledgeBaseItem } from '@/lib/types';
import { ProductSavedDialog } from './product-saved-dialog';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';

type AddProductDialogProps = {
  trigger: React.ReactNode;
  productToEdit?: Product;
  onProductSaved: () => void;
};

const categories: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Não Padronizado (Compra)'];
const presentations: Exclude<Product['presentation'], undefined>[] = ['Comprimido', 'Unidade', 'Caixa c/ 100', 'Seringa 4g', 'Frasco 10ml', 'Caixa c/ 50', 'Caneta 3ml', 'Pacote', 'Bolsa', 'Outro'];
const suppliers: Exclude<Product['supplier'], undefined>[] = ['Casmed', 'Mednutri', 'Doação', 'Outro'];

export function AddProductDialog({ trigger, productToEdit, onProductSaved }: AddProductDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
  const [imageUrl, setImageUrl] = useState('');
  
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseItem[]>([]);
  const [debouncedName] = useDebounce(name, 300);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    if (debouncedName && knowledgeBase.length > 0 && !isEditing) {
      const searchTerm = debouncedName.toLowerCase();
      // Improved search: check if searchTerm includes kb.name OR kb.name includes searchTerm
      const match = knowledgeBase.find(item => {
        const kbName = item.name.toLowerCase();
        return searchTerm.includes(kbName) || kbName.includes(searchTerm);
      });
      
      if (match) {
        setTherapeuticClass(match.therapeuticClass);
        setMainFunction(match.mainFunction);
      } else {
        setTherapeuticClass('');
        setMainFunction('');
      }
    }
  }, [debouncedName, knowledgeBase, isEditing]);


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
    setImageUrl('');
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
        setImageUrl(productToEdit.imageUrl || '');
    } else if (!isEditing && isOpen) {
        resetForm();
    }
  }, [productToEdit, isOpen, isEditing]);
  
 const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
        const result = await uploadImage(formData);
        if (result.success && result.filePath) {
            setImageUrl(result.filePath);
            toast({ title: 'Upload Concluído', description: 'A imagem foi carregada com sucesso.' });
        } else {
            throw new Error(result.error || 'Falha no upload da imagem.');
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro de Upload', description: (error as Error).message });
    } finally {
        setIsUploading(false);
    }
};


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
                imageUrl,
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
                imageUrl,
            };
            resultProduct = await addProduct(newProductData);
            toast({
                title: 'Produto Adicionado!',
                description: `${newProductData.name} foi adicionado ao inventário com sucesso.`,
            });
        }
        
        onProductSaved();
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
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            {/* Coluna 1 e 2: Campos de texto */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
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
               <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="therapeuticClass">Classe Terapêutica</Label>
                  <Input id="therapeuticClass" value={therapeuticClass} placeholder="Preenchido automaticamente..." readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mainFunction">Função Principal</Label>
                  <Input id="mainFunction" value={mainFunction} placeholder="Preenchido automaticamente..." readOnly className="bg-muted/50" />
              </div>
            </div>
            
            {/* Coluna 3: Upload de Imagem */}
            <div className="space-y-2 flex flex-col items-center justify-center border-l pl-6">
                <Label>Imagem do Produto (Opcional)</Label>
                <div className="w-full h-48 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/50 relative">
                    {imageUrl ? (
                        <Image src={imageUrl} alt="Pré-visualização do produto" layout="fill" objectFit="contain" className="rounded-md" />
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <Upload className="mx-auto h-8 w-8" />
                            <p className="text-sm mt-2">Sem imagem</p>
                        </div>
                    )}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                    )}
                </div>
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                    disabled={isUploading}
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full mt-2" disabled={isUploading}>
                   <Upload className="mr-2 h-4 w-4" />
                   {isUploading ? 'Enviando...' : (imageUrl ? 'Alterar Imagem' : 'Selecionar Imagem')}
                </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving || isUploading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSave} disabled={isSaving || isUploading}>
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
    

    
