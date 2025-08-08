
'use client';

import { useState } from 'react';
import { products } from "@/lib/data";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Product } from '@/lib/types';
import { AddProductDialog } from '@/components/dashboard/add-product-dialog';

type FilterCategory = 'Todos' | Product['category'];

const filterCategories: FilterCategory[] = ['Todos', 'Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Outro'];

const filterProducts = (products: Product[], filter: FilterCategory): Product[] => {
    if (filter === 'Todos') {
        return products;
    }
    return products.filter(p => p.category === filter);
}

export default function InventoryPage() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('Todos');

  const filteredProducts = filterProducts(products, activeFilter);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Inventário de Produtos</CardTitle>
            <CardDescription>
              Gerencie seus produtos, adicione novos e acompanhe o estoque.
            </CardDescription>
          </div>
          <AddProductDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </AddProductDialog>
        </div>
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
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={filteredProducts} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
