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

function OrdersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pedidos</CardTitle>
        <CardDescription>Visualize todos os pedidos enviados para as unidades de saúde.</CardDescription>
        <div className="flex justify-between items-center pt-4">
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
    const [orders, cafInventory] = await Promise.all([
      getOrders(),
      getProducts('CAF'),
    ]);
    const sortedOrders = orders.sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());

    return (
        <Suspense fallback={<OrdersSkeleton />}>
            <OrdersClientPage initialOrders={sortedOrders} cafInventory={cafInventory} />
        </Suspense>
    );
}
