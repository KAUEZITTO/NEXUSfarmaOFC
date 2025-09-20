
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


export default async function InventoryPage() {
  const products = await getProducts();

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
        </div>
      </CardHeader>
      <CardContent>
         <InventoryClient initialProducts={products} />
      </CardContent>
    </Card>
  );
}
