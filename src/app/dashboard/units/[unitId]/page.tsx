
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { getUnit, getPatients, getOrdersForUnit } from "@/lib/data";
import { Skeleton } from '@/components/ui/skeleton';
import { UnitDetailsClientPage } from './client-page';

async function UnitDetailsData({ unitId }: { unitId: string }) {
    const unitData = await getUnit(unitId);
    if (!unitData) {
        notFound();
    }
    
    // Otimização: A contagem de pacientes pode ser derivada da página de pacientes
    // ou de uma busca mais específica, se necessário.
    const [allPatientsData, unitOrdersData] = await Promise.all([
        getPatients('all'), // Busca todos para filtrar
        getOrdersForUnit(unitId),
    ]);

    const patientCount = allPatientsData.filter(p => p.unitId === unitId).length;

    return <UnitDetailsClientPage initialUnit={unitData} initialPatientCount={patientCount} initialOrders={unitOrdersData} />;
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
