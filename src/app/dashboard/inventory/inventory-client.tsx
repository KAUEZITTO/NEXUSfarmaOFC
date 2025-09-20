
'use client';

import { useState, useEffect } from 'react';
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Printer } from "lucide-react";
import type { Product } from '@/lib/types';
import { AddProductDialog } from '@/components/dashboard/add-product-dialog';
import { getColumns } from './columns';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleProductSaved = () => {
    router.refresh();
  }

  const columns = getColumns({ onProductSaved: handleProductSaved });
  
  // Barcode scanner detection logic
  const [lastKeystrokeTime, setLastKeystrokeTime] = useState(Date.now());
  const [barcodeBuffer, setBarcodeBuffer] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const now = Date.now();
    const timeDiff = now - lastKeystrokeTime;
    setLastKeystrokeTime(now);

    // If keystrokes are very fast (typical for a scanner), buffer them.
    if (timeDiff < 50) { // 50ms threshold
        setBarcodeBuffer(prev => prev + value.slice(-1));
    } else {
        setBarcodeBuffer(value.slice(-1));
    }
    
    setSearchTerm(value);
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
          // A barcode scanner often sends an "Enter" key after the scan.
          // If the buffer has content and Enter is pressed, it's likely a scan.
          if (barcodeBuffer.length > 5) { // Arbitrary length to qualify as a potential barcode
              setSearchTerm(barcodeBuffer);
          }
      }
  }


  const filteredProducts = filterProducts(initialProducts, activeFilter).filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        
        <div className="flex items-center py-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por nome ou ID (código de barras)..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  className="pl-10"
                />
            </div>
        </div>
      
        <DataTable columns={columns} data={filteredProducts} filterColumn="name" />
    </>
  );
}
