

'use server';

import { Suspense } from 'react';
import { getOrders, getProducts } from "@/lib/data";
import { OrdersClientPage } from './client-page';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { unstable_noStore as noStore } from 'next/cache';

function OrdersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
                <Skeleton className="h-7 w-48 bg-muted rounded-md" />
                <Skeleton className="h-4 w-72 mt-2 bg-muted rounded-md" />
            </div>
            <Skeleton className="h-9 w-40 bg-muted rounded-md" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-10 w-full max-w-lg" />
        </div>
      </CardHeader>
      <CardContent>
         <div className="space-y-2 mt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function OrdersPage() {
    noStore();
    
    // As chamadas de dados agora são feitas aqui, no Server Component
    const [allOrders, cafInventory, hospitalInventory] = await Promise.all([
      getOrders(),
      getProducts('CAF'),
      getProducts('Hospital'),
    ]);
    const sortedOrders = allOrders.sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());

    return (
        <Suspense fallback={<OrdersSkeleton />}>
            <OrdersClientPage 
              initialOrders={sortedOrders} 
              cafInventory={cafInventory} 
              hospitalInventory={hospitalInventory || []}
            />
        </Suspense>
    );
}
