'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Printer, Loader2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { AddProductDialog } from '@/components/dashboard/add-product-dialog';
import { columns } from './columns';
import type { Product } from '@/lib/types';
import type { GroupedProduct } from './page';
import { BatchDetailsDialog } from './batch-details-dialog';

type FilterCategory = 'Todos' | Product['category'];

const filterCategories: FilterCategory[] = ['Todos', 'Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Outro'];

const groupAndFilterProducts = (products: Product[], filter: FilterCategory, searchTerm: string): GroupedProduct[] => {
    const groupedProductsMap = new Map<string, GroupedProduct>();

    products.forEach(product => {
        const key = `${product.name}|${product.presentation}`;
        const existing = groupedProductsMap.get(key);

        if (existing) {
            existing.batches.push(product);
            existing.quantity += product.quantity;
        } else {
            groupedProductsMap.set(key, {
                ...product,
                id: key, 
                batches: [product],
            });
        }
    });

    let groupedProducts = Array.from(groupedProductsMap.values()).map(group => {
        const total = group.quantity;
        let status: Product['status'] = 'Em Estoque';
        if (total === 0) {
            status = 'Sem Estoque';
        } else if (total < 20) {
            status = 'Baixo Estoque';
        }
        group.status = status;
        return group;
    });

    if (filter !== 'Todos') {
        groupedProducts = groupedProducts.filter(p => p.category === filter);
    }
    
    if (searchTerm) {
        groupedProducts = groupedProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    return groupedProducts;
}

interface InventoryClientProps {
    rawProducts: Product[];
}

export function InventoryClient({ rawProducts }: InventoryClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<GroupedProduct[]>([]);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State for the details dialog
  const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleProductSaved = () => {
    startTransition(() => {
        router.refresh();
    });
    // Also close the dialog if it's open
    setIsDialogOpen(false);
  }

  const handleRowClick = (product: GroupedProduct) => {
      setSelectedProduct(product);
      setIsDialogOpen(true);
  }
  
  useEffect(() => {
    const processedProducts = groupAndFilterProducts(rawProducts, activeFilter, searchTerm);
    setProducts(processedProducts);
  }, [rawProducts, activeFilter, searchTerm]);

  return (
    <>
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2 pt-4 overflow-x-auto pb-2">
                {filterCategories.map(filter => (
                    <Button 
                        key={filter}
                        variant={activeFilter === filter ? "default" : "outline"}
                        onClick={() => setActiveFilter(filter)}
                        className="rounded-full flex-shrink-0"
                    >
                        {filter}
                    </Button>
                ))}
            </div>
             <div className="flex gap-2">
                <Button variant="outline" asChild>
                    <Link href="/shelf-labels" target="_blank">
                        <Printer className="mr-2 h-4 w-4" />
                        Etiquetas de Prateleira
                    </Link>
                </Button>
                 <AddProductDialog onProductSaved={handleProductSaved} trigger={
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Produto
                    </Button>
                } />
             </div>
        </div>
        
        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Filtrar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-sm"
            />
            {isPending && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
        </div>
      
        <DataTable columns={columns} data={products} onRowClick={handleRowClick} />
        
        <BatchDetailsDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            product={selectedProduct!}
            onProductSaved={handleProductSaved}
        />
    </>
  );
}
