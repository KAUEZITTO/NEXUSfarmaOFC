
import { getUnits } from "@/lib/data";
import { getProducts } from "@/lib/actions/inventory";
import NewOrderPageContent from "./page";

// This is now a Server Component that fetches data and passes it to the client component.
export default async function NewOrderPageLayout() {
  const [units, products] = await Promise.all([
    getUnits(),
    getProducts()
  ]);

  return <NewOrderPageContent units={units} allProducts={products} />;
}
