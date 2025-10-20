
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardContent
} from "@/components/ui/card";
import { getUnit, getPatients, getOrdersForUnit } from "@/lib/data";
import { Skeleton } from '@/components/ui/skeleton';
import { UnitDetailsClientPage } from './client-page';
import { unstable_noStore as noStore } from 'next/cache';

async function UnitDetailsData({ unitId }: { unitId: string }) {
    noStore(); // Garante que os dados da unidade e pedidos são sempre frescos.
    const unitData = await getUnit(unitId);
    if (!unitData) {
        notFound();
    }
    
    // Otimização: buscar apenas os pacientes da unidade específica.
    const [unitPatients, unitOrdersData] = await Promise.all([
        getPatients('all', '', unitId),
        getOrdersForUnit(unitId),
    ]);

    return <UnitDetailsClientPage initialUnit={unitData} initialPatientCount={unitPatients.length} initialOrders={unitOrdersData} />;
}

function UnitDetailsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-5 w-72" />
                </div>
            </div>
             <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-8 w-12" /></CardHeader></Card>
                <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-8 w-12" /></CardHeader></Card>
                <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-8 w-12" /></CardHeader></Card>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-4 w-80 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default async function UnitDetailsPage({ params }: { params: { unitId: string } }) {
  return (
    <Suspense fallback={<UnitDetailsSkeleton />}>
      <UnitDetailsData unitId={params.unitId} />
    </Suspense>
  );
}
