
'use client'; // This component now manages client-side interactions

import { getProducts } from "@/lib/data";
import InventoryClient from './inventory-client';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddProductDialog } from "@/components/dashboard/add-product-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from "next/navigation";

// The dynamic export is still crucial for the data fetching part.
export const dynamic = 'force-dynamic';


export default function InventoryPage() {
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const fetchAndSetProducts = async () => {
      setIsLoading(true);
      const products = await getProducts();
      setRawProducts(products);
      setIsLoading(false);
  }

  useEffect(() => {
    fetchAndSetProducts();
  }, []);

  const handleProductSaved = () => {
    startTransition(() => {
        // Instead of router.refresh(), we manually refetch data.
        // This avoids a full page reload and gives a smoother UX.
        fetchAndSetProducts();
    });
  }

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>Inventário de Produtos</CardTitle>
                    <CardDescription>
                    Gerencie seus produtos, adicione novos e acompanhe o estoque. Itens agrupados por nome e apresentação.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {/* The AddProductDialog is now a sibling to the client, not a child, breaking the dependency chain */}
            <InventoryClient 
                rawProducts={rawProducts}
                onProductSaved={handleProductSaved}
            >
                {/* We pass the AddProductDialog as a child, which React handles correctly */}
                <AddProductDialog onProductSaved={handleProductSaved} trigger={
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Produto
                    </Button>
                } />
            </InventoryClient>
        </CardContent>
    </Card>
  );
}
