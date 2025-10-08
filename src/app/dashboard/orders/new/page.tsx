
import { getUnits } from "@/lib/data";
import { getProducts } from "@/lib/actions/inventory";
import NewOrderPageContent from "./new-order-client";

// This is now the Server Component for the page.
export default async function NewOrderPage() {
  const [units, products] = await Promise.all([
    getUnits(),
    getProducts()
  ]);

  return <NewOrderPageContent units={units} allProducts={products} />;
}
