
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

type AddItemsManuallyDialogProps = {
  trigger: React.ReactNode;
  allProducts: Product[];
  onAddProduct: (product: Product, quantity: number) => boolean;
  selectedCategories: Product['category'][];
};

type GroupedProduct = {
  name: string;
  presentation?: string;
  category: Product['category'];
  therapeuticClass?: string;
  mainFunction?: string;
  imageUrl?: string;
  batches: Product[];
};

const allCategories: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)'];

export function AddItemsManuallyDialog({ trigger, allProducts, onAddProduct, selectedCategories }: AddItemsManallyDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Determine initial step based on selected categories
  const initialStep = selectedCategories.length > 1 ? 'category' : 'list';
  const initialCategory = selectedCategories.length === 1 ? selectedCategories[0] : null;

  const [step, setStep] = useState<'category' | 'list' | 'details'>(initialStep);
  const [currentCategory, setCurrentCategory] = useState<Product['category'] | null>(initialCategory);
  const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Reset state when dialog opens or closes
  useEffect(() => {
    if (isOpen) {
      const newInitialStep = selectedCategories.length > 1 ? 'category' : 'list';
      const newInitialCategory = selectedCategories.length === 1 ? selectedCategories[0] : null;
      setStep(newInitialStep);
      setCurrentCategory(newInitialCategory);
      setSelectedProduct(null);
      setQuantities({});
    }
  }, [isOpen, selectedCategories]);


  const handleCategorySelect = (category: Product['category']) => {
    setCurrentCategory(category);
    setStep('list');
  };

  const handleProductSelect = (product: GroupedProduct) => {
    setSelectedProduct(product);
    // Initialize quantities for batches
    const initialQuantities = product.batches.reduce((acc, batch) => {
        acc[batch.id] = 1;
        return acc;
    }, {} as Record<string, number>);
    setQuantities(initialQuantities);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('list');
      setSelectedProduct(null);
      setQuantities({});
    } else if (step === 'list') {
      // If we started from a multi-category selection, go back to category selection
      if (selectedCategories.length > 1) {
        setStep('category');
        setCurrentCategory(null);
      } else {
        // If we started with a single category, just close the dialog
        setIsOpen(false);
      }
    }
  };

  const handleAddItems = () => {
    if (!selectedProduct) return;
    let itemsAdded = 0;
    
    for (const batch of selectedProduct.batches) {
        const quantity = quantities[batch.id];
        if (quantity > 0) {
            const wasAdded = onAddProduct(batch, quantity);
            if (wasAdded) {
                itemsAdded++;
            }
        }
    }

    if (itemsAdded > 0) {
        toast({
            title: "Itens Adicionados",
            description: `${itemsAdded} lote(s) de ${selectedProduct.name} foram adicionados à remessa.`,
        })
    }
    
    setIsOpen(false);
  };
  
  const groupProducts = (products: Product[]): GroupedProduct[] => {
    const map = new Map<string, GroupedProduct>();
    products.forEach(p => {
        const key = `${p.name}|${p.presentation}`;
        if (map.has(key)) {
            map.get(key)!.batches.push(p);
        } else {
            map.set(key, {
                name: p.name,
                presentation: p.presentation,
                category: p.category,
                therapeuticClass: p.therapeuticClass,
                mainFunction: p.mainFunction,
                imageUrl: p.imageUrl,
                batches: [p]
            });
        }
    });
    return Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name));
  }

  const productsForCategory = currentCategory ? groupProducts(allProducts.filter(p => p.category === currentCategory)) : [];

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
                    <div key={p.name + p.presentation} className="border p-3 rounded-md cursor-pointer hover:bg-muted" onClick={() => handleProductSelect(p)}>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.presentation}</p>
                    </div>
                )) : (
                    <div className="text-center text-muted-foreground pt-10">Nenhum produto encontrado para esta categoria.</div>
                )}
            </div>
        </ScrollArea>
      );
    }

    if (step === 'details' && selectedProduct) {
        return (
             <ScrollArea className="h-96">
                <div className="space-y-4">
                    <h3 className="font-bold text-lg">{selectedProduct.name}</h3>
                    <p>{selectedProduct.presentation}</p>
                    <div className="space-y-3">
                        {selectedProduct.batches.map(batch => (
                            <div key={batch.id} className="flex items-center justify-between gap-4 p-2 border rounded-md">
                                <div>
                                    <p className="text-sm">Lote: <span className="font-mono">{batch.batch || 'N/A'}</span></p>
                                    <p className="text-sm">Validade: <span className="font-mono">{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}</span></p>
                                    <p className="text-sm">Estoque: <span className="font-mono">{batch.quantity.toLocaleString('pt-BR')}</span></p>
                                </div>
                                <div className="w-24">
                                     <Input 
                                        type="number" 
                                        min="0"
                                        max={batch.quantity}
                                        value={quantities[batch.id] || 0}
                                        onChange={e => setQuantities(q => ({ ...q, [batch.id]: parseInt(e.target.value, 10) || 0 }))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>
        )
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
                {step === 'details' && 'Adicionar Lotes e Quantidades'}
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
            {step === 'details' && (
                <Button onClick={handleAddItems}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar à Remessa
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
