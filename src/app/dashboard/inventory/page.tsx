
'use server';

import { getProducts } from "@/lib/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InventoryClient } from "./inventory-client";
import type { Product } from "@/lib/types";

export type GroupedProduct = Product & {
    batches: Product[];
    totalQuantity: number;
}

export default async function InventoryPage() {
  const products = await getProducts();
  
  const groupedProductsMap = new Map<string, GroupedProduct>();

  products.forEach(product => {
      const key = `${product.name}|${product.presentation}`;
      const existing = groupedProductsMap.get(key);

      if (existing) {
          existing.batches.push(product);
          existing.totalQuantity += product.quantity;
      } else {
          groupedProductsMap.set(key, {
              ...product, // Use first product as representative
              id: key, // Use a stable key for the group
              batches: [product],
              totalQuantity: product.quantity,
          });
      }
  });

  const groupedProducts = Array.from(groupedProductsMap.values()).map(group => {
      // Recalculate status based on total quantity
      const total = group.totalQuantity;
      let status: Product['status'] = 'Em Estoque';
      if (total === 0) {
          status = 'Sem Estoque';
      } else if (total < 20) {
          status = 'Baixo Estoque';
      }
      group.status = status;
      // Overwrite quantity with total for display
      group.quantity = total;
      return group;
  });

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
         <InventoryClient initialProducts={groupedProducts} />
      </CardContent>
    </Card>
  );
}
