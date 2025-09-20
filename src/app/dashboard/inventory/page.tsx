
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

// Este é um Server Component. Sua única responsabilidade é buscar os dados.
export default async function InventoryPage() {
  const products = await getProducts();
  
  // A lógica de agrupamento permanece no servidor, pois é computação de dados.
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
         {/* Os dados são passados para o Client Component que lida com a interatividade. */}
         <InventoryClient initialProducts={groupedProducts} />
      </CardContent>
    </Card>
  );
}
