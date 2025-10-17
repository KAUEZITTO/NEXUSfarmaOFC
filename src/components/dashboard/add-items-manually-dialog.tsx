
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
import { ChevronLeft, PlusCircle } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Badge } from '../ui/badge';

type AddItemsManuallyDialogProps = {
  trigger: React.ReactNode;
  allProducts: Product[];
  onAddProduct: (product: Product, quantity: number) => boolean;
  selectedCategories: Product['category'][];
};

const allCategories: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)'];

export function AddItemsManuallyDialog({ trigger, allProducts, onAddProduct, selectedCategories }: AddItemsManuallyDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
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
    const wasAdded = onAddProduct(product, 1); // Add with quantity 1 by default, can be changed later
    if(wasAdded) {
        toast({
            title: "Item Adicionado",
            description: `${product.name} (Lote: ${product.batch}) foi adicionado à remessa.`,
        });
        setIsOpen(false);
    }
  };
  
  const productsForCategory = currentCategory 
    ? allProducts.filter(p => p.category === currentCategory).sort((a,b) => a.name.localeCompare(b.name))
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
                {productsForCategory.length > 0 ? productsForCategory.map(p => (
                    <div key={p.id} className="border p-3 rounded-md cursor-pointer hover:bg-muted" onClick={() => handleAddProduct(p)}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{p.name}</p>
                                <p className="text-sm text-muted-foreground">{p.presentation}</p>
                            </div>
                            <Badge variant={p.quantity > 0 ? "default" : "destructive"}>
                                Estoque: {p.quantity}
                            </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                           <span>Lote: {p.batch || 'N/A'}</span> | <span>Val: {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}</span>
                        </div>
                    </div>
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
