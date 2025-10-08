
import { getUnits } from "@/lib/data";
import { getProducts } from "@/lib/actions/inventory";
import NewOrderPageContent from "./new-order-client";

// This line is the definitive fix.
// It forces the page to be rendered dynamically on the server at request time,
// instead of being statically pre-rendered during build.
// This ensures that Vercel KV environment variables are available when data fetching occurs.
export const dynamic = 'force-dynamic';

// This is now the Server Component for the page.
export default async function NewOrderPage() {
  const [units, products] = await Promise.all([
    getUnits(),
    getProducts()
  ]);

  return <NewOrderPageContent units={units} allProducts={products} />;
}
