
'use client';

import { useState } from 'react';
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import type { Product } from '@/lib/types';
import { AddProductDialog } from '@/components/dashboard/add-product-dialog';
import { columns } from './columns';

type FilterCategory = 'Todos' | Product['category'];

const filterCategories: FilterCategory[] = ['Todos', 'Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Outro'];

const filterProducts = (products: Product[], filter: FilterCategory): Product[] => {
    if (filter === 'Todos') {
        return products;
    }
    return products.filter(p => p.category === filter);
}

interface InventoryClientProps {
    initialProducts: Product[];
}

export function InventoryClient({ initialProducts }: InventoryClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('Todos');

  const filteredProducts = filterProducts(initialProducts, activeFilter);

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
             <AddProductDialog trigger={
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Produto
                </Button>
            } />
        </div>
      
        <DataTable columns={columns} data={filteredProducts} filterColumn="name" />
    </>
  );
}
