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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

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

export function AddItemsManuallyDialog({ trigger, allProducts, onAddProduct, selectedCategories }: AddItemsManuallyDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  
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

  const handleAddProduct = (product: Product) => {
    const wasAdded = onAddProduct(product, 1);
    if(wasAdded) {
        toast({
            title: "Item Adicionado",
            description: `${product.name} (Lote: ${product.batch}) foi adicionado à remessa.`,
        });
        setIsOpen(false);
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
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  };
  
  const productsForCategory = currentCategory 
    ? groupProducts(allProducts.filter(p => p.category === currentCategory))
    : [];

  const renderContent = () => {
    if (step === 'category') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {selectedCategories.map(cat => (
            <Button key={cat} variant="outline" className="h-20" onClick={() => handleCategorySelect(cat)}>
              {cat}
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
                        <CollapsibleContent className="space-y-2 pl-4">
                            {group.batches.map(batch => (
                                <div key={batch.id} className="flex cursor-pointer items-center justify-between rounded-md border p-2 text-sm hover:bg-muted/50" onClick={() => handleAddProduct(batch)}>
                                    <div>
                                        <p>Lote: <span className="font-mono">{batch.batch || 'N/A'}</span></p>
                                        <p>Validade: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}</p>
                                    </div>
                                    <Badge variant="outline">Estoque: {batch.quantity}</Badge>
                                </div>
                            ))}
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center">
            {step !== 'category' && (
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
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
