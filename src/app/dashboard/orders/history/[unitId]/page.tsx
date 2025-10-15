
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getOrdersForUnit, getUnit } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderHistoryClientPage } from './client-page';

async function OrderHistoryData({ unitId }: { unitId: string }) {
  const [unit, orders] = await Promise.all([
    getUnit(unitId),
    getOrdersForUnit(unitId)
  ]);

  if (!unit) {
    notFound();
  }

  return <OrderHistoryClientPage initialUnit={unit} initialOrders={orders} />;
}

function OrderHistorySkeleton() {
  return (
      <Card>
          <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
              <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
              </div>
          </CardContent>
      </Card>
  )
}

export default async function OrderHistoryPage({ params }: { params: { unitId: string } }) {
  return (
    <Suspense fallback={<OrderHistorySkeleton />}>
      <OrderHistoryData unitId={params.unitId} />
    </Suspense>
  );
}
