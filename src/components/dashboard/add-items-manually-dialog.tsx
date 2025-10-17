'use client';

import { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronDown, ChevronUp, Pill, Stethoscope, Beaker, Baby, Milk, ShoppingCart, Tooth } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { cn } from '@/lib/utils';


type AddItemsManuallyDialogProps = {
  trigger: React.ReactNode;
  allProducts: Product[];
  onAddProduct: (product: Product, quantity: number) => boolean;
  selectedCategories: Product['category'][];
};

type GroupedProduct = {
  id: string;
  name: string;
  presentation?: string;
  category: Product['category'];
  totalQuantity: number;
  batches: Product[];
};

const categoryConfig: { name: Product['category'], icon: React.ElementType }[] = [
    { name: 'Medicamento', icon: Pill },
    { name: 'Material Técnico', icon: Stethoscope },
    { name: 'Odontológico', icon: Tooth },
    { name: 'Laboratório', icon: Beaker },
    { name: 'Fraldas', icon: Baby },
    { name: 'Fórmulas', icon: Milk },
    { name: 'Não Padronizado (Compra)', icon: ShoppingCart },
]

export function AddItemsManuallyDialog({ trigger, allProducts, onAddProduct, selectedCategories }: AddItemsManuallyDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [batchQuantities, setBatchQuantities] = useState<Record<string, number>>({});
  
  const initialStep = selectedCategories.length > 1 ? 'category' : 'list';
  const initialCategory = selectedCategories.length === 1 ? selectedCategories[0] : null;

  const [step, setStep] = useState<'category' | 'list'>(initialStep);
  const [currentCategory, setCurrentCategory] = useState<Product['category'] | null>(initialCategory);
  
  useEffect(() => {
    if (isOpen) {
      const newInitialStep = selectedCategories.length > 1 ? 'category' : 'list';
      const newInitialCategory = selectedCategories.length === 1 ? selectedCategories[0] : null;
      setStep(newInitialStep);
      setCurrentCategory(newInitialCategory);
      setExpandedProducts({});
      setBatchQuantities({});
    }
  }, [isOpen, selectedCategories]);


  const handleCategorySelect = (category: Product['category']) => {
    setCurrentCategory(category);
    setStep('list');
  };

  const handleBack = () => {
    if (step === 'list') {
      if (selectedCategories.length > 1) {
        setStep('category');
        setCurrentCategory(null);
      } else {
        setIsOpen(false);
      }
    }
  };

 const handleAddSelectedBatches = (productGroup: GroupedProduct) => {
    let itemsAddedCount = 0;
    let allAdditionsSucceeded = true;
    
    productGroup.batches.forEach(batch => {
        const quantity = batchQuantities[batch.id];
        if (quantity && quantity > 0) {
            const wasAdded = onAddProduct(batch, quantity);
            if(wasAdded) {
                itemsAddedCount++;
            } else {
                allAdditionsSucceeded = false;
            }
        }
    });

    if (itemsAddedCount > 0) {
        toast({
            title: `${itemsAddedCount} lote(s) adicionado(s)`,
            description: `${productGroup.name} foi adicionado à remessa.`,
        });
    }
    
    if (allAdditionsSucceeded) {
      // Clear quantities for this group and collapse it
      const newQuantities = {...batchQuantities};
      productGroup.batches.forEach(batch => {
          delete newQuantities[batch.id];
      });
      setBatchQuantities(newQuantities);
      setExpandedProducts(prev => ({...prev, [productGroup.id]: false}));
    }
  };

  const groupProducts = (products: Product[]): GroupedProduct[] => {
    const map = new Map<string, GroupedProduct>();
    products.forEach(product => {
      const key = `${product.name}|${product.presentation}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: product.name,
          presentation: product.presentation,
          category: product.category,
          totalQuantity: 0,
          batches: [],
        });
      }
      const group = map.get(key)!;
      group.totalQuantity += product.quantity;
      group.batches.push(product);
      // Sort batches by expiry date, soonest first
      group.batches.sort((a, b) => {
          const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
          const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
          return dateA - dateB;
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  };
  
  const productsForCategory = currentCategory 
    ? groupProducts(allProducts.filter(p => p.category === currentCategory))
    : [];

  const renderContent = () => {
    if (step === 'category') {
      const availableCategories = categoryConfig.filter(cc => selectedCategories.includes(cc.name));

      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {availableCategories.map(({ name, icon: Icon }) => (
            <Button
              key={name}
              variant="outline"
              className="h-28 flex-col gap-2"
              onClick={() => handleCategorySelect(name)}
            >
              <Icon className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-center">{name}</span>
            </Button>
          ))}
        </div>
      );
    }

    if (step === 'list') {
      return (
        <ScrollArea className="h-96">
            <div className="space-y-2">
                {productsForCategory.length > 0 ? productsForCategory.map(group => (
                    <Collapsible
                        key={group.id}
                        open={expandedProducts[group.id]}
                        onOpenChange={(isOpen) => setExpandedProducts(prev => ({ ...prev, [group.id]: isOpen }))}
                        className="space-y-2"
                    >
                        <CollapsibleTrigger asChild>
                            <div className="flex w-full cursor-pointer items-center justify-between rounded-md border p-3 text-left hover:bg-muted">
                                <div>
                                    <p className="font-semibold">{group.name}</p>
                                    <p className="text-sm text-muted-foreground">{group.presentation}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={group.totalQuantity > 0 ? 'default' : 'destructive'}>
                                      Estoque Total: {group.totalQuantity}
                                  </Badge>
                                  <Button variant="ghost" size="sm" className="w-9 p-0">
                                      {expandedProducts[group.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      <span className="sr-only">Toggle</span>
                                  </Button>
                                </div>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 pl-4 border-l-2 ml-2">
                             <div className="p-3 bg-muted/50 rounded-md">
                                {group.batches.map(batch => (
                                    <div key={batch.id} className="grid grid-cols-5 items-center gap-4 py-2 border-b last:border-b-0">
                                        <div className="col-span-2">
                                            <p className="text-sm">Lote: <span className="font-mono">{batch.batch || 'N/A'}</span></p>
                                            <p className="text-xs text-muted-foreground">Val: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}</p>
                                        </div>
                                        <div className="text-sm">
                                            Estoque: <Badge variant="outline">{batch.quantity}</Badge>
                                        </div>
                                        <div className="col-span-2">
                                            <Label htmlFor={`qty-${batch.id}`} className="sr-only">Quantidade</Label>
                                            <Input 
                                                id={`qty-${batch.id}`}
                                                type="number"
                                                min="0"
                                                max={batch.quantity}
                                                placeholder="Qtd."
                                                className="h-9"
                                                value={batchQuantities[batch.id] || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    const qty = parseInt(value, 10);
                                                    setBatchQuantities(prev => ({
                                                        ...prev,
                                                        [batch.id]: isNaN(qty) ? 0 : Math.min(qty, batch.quantity)
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button className="mt-4 w-full" onClick={() => handleAddSelectedBatches(group)}>Adicionar Selecionados</Button>
                             </div>
                        </CollapsibleContent>
                    </Collapsible>
                )) : (
                    <div className="text-center text-muted-foreground pt-10">Nenhum produto encontrado para esta categoria.</div>
                )}
            </div>
        </ScrollArea>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center">
            {step !== 'category' && selectedCategories.length > 1 && (
              <Button variant="ghost" size="icon" className="mr-2" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
                {step === 'category' && 'Selecione a Categoria'}
                {step === 'list' && `Itens em ${currentCategory}`}
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4">
            {renderContent()}
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Fechar</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
