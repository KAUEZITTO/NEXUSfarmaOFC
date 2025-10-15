

import { Suspense } from 'react';
import { getProducts, getAllPatients, getAllDispensations, getUnits, getOrders, getStockMovements } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportsClientPage } from "./client-page";

async function ReportsData() {
    const [products, patients, dispensations, units, orders, stockMovements] = await Promise.all([
        getProducts(),
        getAllPatients(),
        getAllDispensations(),
        getUnits(),
        getOrders(),
        getStockMovements(),
    ]);

    return (
        <ReportsClientPage
            initialProducts={products}
            initialPatients={patients}
            initialDispensations={dispensations}
            initialUnits={units}
            initialOrders={orders}
            initialStockMovements={stockMovements}
        />
    );
}


function ReportsSkeleton() {
    return (
      <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                  <div className="flex flex-wrap gap-4 justify-between items-center">
                      <div>
                          <Skeleton className="h-8 w-64" />
                          <Skeleton className="h-4 w-80 mt-2" />
                      </div>
                       <div className="flex gap-2 flex-wrap">
                          <Skeleton className="h-9 w-32" />
                          <Skeleton className="h-9 w-40" />
                      </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                      <Skeleton className="h-28 w-full" />
                      <Skeleton className="h-28 w-full" />
                      <Skeleton className="h-28 w-full" />
                  </div>

                  <Skeleton className="h-64 w-full" />
              </div>
              
              <div className="lg:col-span-1">
                 <Skeleton className="h-80 w-full" />
              </div>
          </div>
         <Skeleton className="h-96 w-full" />
      </div>
    )
}

export default async function ReportsPageWrapper() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsData />
    </Suspense>
  );
}