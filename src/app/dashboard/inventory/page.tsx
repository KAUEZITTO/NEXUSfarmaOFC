import InventoryClient from './inventory-client';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProducts } from '@/lib/data';

// Garante que os dados sejam buscados no servidor em tempo de execução
export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const initialProducts = await getProducts();
  
  return (
    <Card>
        <CardHeader>
            <CardTitle>Inventário de Produtos</CardTitle>
            <CardDescription>
            Gerencie seus produtos, adicione novos e acompanhe o estoque. Itens agrupados por nome e apresentação.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <InventoryClient initialProducts={initialProducts} />
        </CardContent>
    </Card>
  );
}
