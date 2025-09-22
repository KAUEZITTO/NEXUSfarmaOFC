
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

// This type can be defined here or in the client component, doesn't matter much.
// For clarity, we'll define it where it's used.
export type GroupedProduct = Product & {
    batches: Product[];
    totalQuantity: number;
}

// This is a Server Component. Its only responsibility is to fetch the data.
export default async function InventoryPage() {
  const products = await getProducts();
  
  // The grouping logic is moved to the client component.
  // The server component now only passes the raw data.
  const groupedProductsMap = new Map<string, GroupedProduct>();

  products.forEach(product => {
      const key = `${product.name}|${product.presentation}`;
      const existing = groupedProductsMap.get(key);

      if (existing) {
          existing.batches.push(product);
          existing.totalQuantity += product.quantity;
      } else {
          groupedProductsMap.set(key, {
              ...product,
              id: key, 
              batches: [product],
              totalQuantity: product.quantity,
          });
      }
  });

  const groupedProducts = Array.from(groupedProductsMap.values()).map(group => {
      const total = group.totalQuantity;
      let status: Product['status'] = 'Em Estoque';
      if (total === 0) {
          status = 'Sem Estoque';
      } else if (total < 20) {
          status = 'Baixo Estoque';
      }
      group.status = status;
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
         {/* The data is passed to the Client Component which handles interactivity. */}
         <InventoryClient initialProducts={groupedProducts} />
      </CardContent>
    </Card>
  );
}
