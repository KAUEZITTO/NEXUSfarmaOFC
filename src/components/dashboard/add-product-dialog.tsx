
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
import type { Product, ProductCategory, UserLocation } from '@/lib/types';
import { ProductSavedDialog } from './product-saved-dialog';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

type AddProductDialogProps = {
  trigger: React.ReactNode;
  productToEdit?: Product;
  onProductSaved: () => void;
};

const cafCategories: ProductCategory[] = ['Medicamento', 'Material Técnico', 'Tiras de Glicemia/Lancetas', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)'];
const hospitalCategories: ProductCategory[] = ['Medicamento', 'Material Técnico', 'Fraldas', 'Outro'];
const cafSuppliers: Exclude<Product['supplier'], undefined>[] = ['Casmed', 'Mednutri', 'Doação', 'Outro'];
const hospitalSuppliers: Exclude<Product['supplier'], undefined>[] = ['CAF', 'Doação', 'Outro'];
const subCategories: Exclude<Product['subCategory'], undefined>[] = ['Medicamento', 'Material'];
const presentations: Exclude<Product['presentation'], undefined>[] = ['Comprimido', 'Unidade', 'Caixa c/ 100', 'Seringa 4g', 'Frasco 10ml', 'Caixa c/ 50', 'Caneta 3ml', 'Pacote', 'Bolsa', 'Outro'];

export function AddProductDialog({ trigger, productToEdit, onProductSaved }: AddProductDialogProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!productToEdit;

  const [savedProduct, setSavedProduct] = useState<Product | null>(null);
  const [showSavedDialog, setShowSavedDialog] = useState(false);
  
  const userLocation = session?.user?.location;
  const isHospital = userLocation === 'Hospital';

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [category, setCategory] = useState<ProductCategory>(isHospital ? 'Medicamento' : 'Medicamento');
  const [subCategory, setSubCategory] = useState<Product['subCategory'] | undefined>(undefined);
  const [batch, setBatch] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplier, setSupplier] = useState<Product['supplier']>(isHospital ? 'CAF' : 'Casmed');
  const [quantity, setQuantity] = useState(0);
  const [presentation, setPresentation] = useState<Product['presentation']>('Unidade');
  const [therapeuticClass, setTherapeuticClass] = useState('');
  const [mainFunction, setMainFunction] = useState('');
  const [storageLocation, setStorageLocation] = useState('');

  const resetForm = () => {
    setCode('');
    setName('');
    setActiveIngredient('');
    setManufacturer('');
    setCategory(isHospital ? 'Medicamento' : 'Medicamento');
    setSubCategory(undefined);
    setBatch('');
    setExpiryDate('');
    setSupplier(isHospital ? 'CAF' : 'Casmed');
    setQuantity(0);
    setPresentation('Unidade');
    setTherapeuticClass('');
    setMainFunction('');
    setStorageLocation('');
  }

  useEffect(() => {
    if (productToEdit && isOpen) {
        setCode(productToEdit.code || '');
        setName(productToEdit.name);
        setActiveIngredient(productToEdit.activeIngredient || '');
        setManufacturer(productToEdit.manufacturer || '');
        setCategory(productToEdit.category);
        setSubCategory(productToEdit.subCategory);
        setTherapeuticClass(productToEdit.therapeuticClass || '');
        setMainFunction(productToEdit.mainFunction || '');
        setBatch(productToEdit.batch || '');
        setExpiryDate(productToEdit.expiryDate || '');
        setSupplier(productToEdit.supplier || (isHospital ? 'CAF' : 'Outro'));
        setQuantity(productToEdit.quantity);
        setPresentation(productToEdit.presentation || 'Outro');
        setStorageLocation(productToEdit.storageLocation || '');
    } else if (!isEditing && isOpen) {
        resetForm();
    }
  }, [productToEdit, isOpen, isEditing, isHospital]);
  
  const handleSave = async () => {
    if (!name || !category || (quantity < 0)) {
      toast({
        variant: 'destructive',
        title: 'Campos Obrigatórios',
        description: 'Nome Comercial, Categoria e Quantidade são obrigatórios.',
      });
      return;
    }
     if (isHospital && code && (code.length < 3 || code.length > 6)) {
        toast({ variant: 'destructive', title: 'Código Inválido', description: 'O código do produto deve ter entre 3 e 6 dígitos.'});
        return;
    }

    setIsSaving(true);

    try {
        let resultProduct: Product;
        const productData = {
            name,
            code: isHospital ? code : undefined,
            activeIngredient,
            manufacturer,
            category,
            subCategory: category === 'Não Padronizado (Compra)' ? subCategory : undefined,
            therapeuticClass,
            mainFunction,
            quantity,
            batch,
            expiryDate,
            supplier,
            presentation,
            location: userLocation!,
            storageLocation,
        };

        if (isEditing && productToEdit) {
            resultProduct = await updateProduct(productToEdit.id, productData);
            toast({
              title: 'Produto Atualizado!',
              description: `${name} foi atualizado com sucesso.`,
            });
        } else {
            resultProduct = await addProduct(productData);
            toast({
                title: 'Produto Adicionado!',
                description: `${productData.name} foi adicionado ao inventário com sucesso.`,
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

  const isMedicamento = category === 'Medicamento' || (category === 'Não Padronizado (Compra)' && subCategory === 'Medicamento');
  const categoriesToShow = isHospital ? hospitalCategories : cafCategories;
  const suppliersToShow = isHospital ? hospitalSuppliers : cafSuppliers;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Comercial</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

               {isHospital && (
                 <div className="space-y-2">
                    <Label htmlFor="code">Código do Produto (3-6 dígitos)</Label>
                    <Input id="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} maxLength={6} />
                 </div>
               )}

               {isMedicamento && (
                <div className={cn("space-y-2", !isHospital && "md:col-span-2")}>
                  <Label htmlFor="activeIngredient">Princípio Ativo (Opcional)</Label>
                  <Input id="activeIngredient" value={activeIngredient} onChange={(e) => setActiveIngredient(e.target.value)} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select onValueChange={(v) => {
                    const newCategory = v as ProductCategory;
                    setCategory(newCategory);
                    if (newCategory !== 'Não Padronizado (Compra)') {
                        setSubCategory(undefined);
                    }
                }} value={category}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoriesToShow.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

             {category === 'Não Padronizado (Compra)' && !isHospital && (
                <div className="space-y-2">
                    <Label htmlFor="subCategory">Subcategoria</Label>
                    <Select onValueChange={(v) => setSubCategory(v as Product['subCategory'])} value={subCategory}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            {subCategories.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                        </SelectContent>
                    </Select>
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
                    {suppliersToShow.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
                
              <div className="space-y-2">
                <Label htmlFor="storageLocation">Localização no Estoque (Opcional)</Label>
                <Input id="storageLocation" value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} placeholder="Ex: Prateleira A-1"/>
              </div>

                {isMedicamento ? (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="therapeuticClass">Classe Terapêutica</Label>
                            <Input id="therapeuticClass" value={therapeuticClass} onChange={(e) => setTherapeuticClass(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mainFunction">Função Principal</Label>
                            <Input id="mainFunction" value={mainFunction} onChange={(e) => setMainFunction(e.target.value)} />
                        </div>
                    </>
                ) : (
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="mainFunction">Função/Descrição do Produto</Label>
                        <Input id="mainFunction" value={mainFunction} onChange={(e) => setMainFunction(e.target.value)} placeholder="Ex: Cobertura de feridas, fixação de curativos..." />
                    </div>
                )}
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
