import { getProducts } from "@/lib/actions/inventory";
import { Suspense } from "react";
import InventoryPageContent from "./inventory-client";
import { Skeleton } from "@/components/ui/skeleton";

// This is now a pure Server Component.
// Its only responsibility is to fetch the raw data and pass it down.
export default async function InventoryPage() {
  const products = await getProducts();
  
  return (
    <Suspense fallback={<InventorySkeleton />}>
      <InventoryPageContent rawProducts={products} />
    </Suspense>
  );
}

function InventorySkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-10 w-48" />
            </div>
            <Skeleton className="h-8 w-full" />
            <div className="border rounded-md p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
}
