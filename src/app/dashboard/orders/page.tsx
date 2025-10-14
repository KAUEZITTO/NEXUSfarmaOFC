
import { Suspense } from 'react';
import { getUnits, getOrders } from "@/lib/data";
import { OrdersClientPage } from './client-page';
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';

function OrdersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-36" />
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
    const [units, orders] = await Promise.all([
        getUnits(),
        getOrders()
    ]);

    return (
        <Suspense fallback={<OrdersSkeleton />}>
            <OrdersClientPage initialUnits={units} initialOrders={orders} />
        </Suspense>
    );
}
