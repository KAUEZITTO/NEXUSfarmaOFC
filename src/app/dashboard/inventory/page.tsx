
import { getProducts } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InventoryClient } from "./inventory-client";

// This is a Server Component. Its only responsibility is to fetch the raw data.
export default async function InventoryPage() {
  const products = await getProducts();
  
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
         {/* The raw data is passed to the Client Component which handles all logic. */}
         <InventoryClient rawProducts={products} />
      </CardContent>
    </Card>
  );
}
