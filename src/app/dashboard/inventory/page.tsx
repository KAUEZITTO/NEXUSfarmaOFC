
import { getProducts } from "@/lib/data";
import InventoryPageContent from './inventory-client';

// Esta linha é a correção definitiva.
// Ela força a página a ser renderizada dinamicamente no servidor a cada requisição,
// em vez de ser pré-renderizada estaticamente durante o build.
// Isso garante que as variáveis de ambiente do Vercel KV estejam disponíveis quando getProducts() for chamado.
export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const rawProducts = await getProducts();
  return <InventoryPageContent rawProducts={rawProducts} />;
}
