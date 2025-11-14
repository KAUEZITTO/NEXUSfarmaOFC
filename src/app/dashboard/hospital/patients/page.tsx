
'use server';

import { getHospitalPatients, getProducts, getHospitalSectors, getHospitalPatientDispensations } from '@/lib/data';
import { HospitalPatientsClientPage } from './client-page';
import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/lib/types';

function PatientsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-10 w-48" />
                </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-1/2 mb-4" />
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    )
}

export default async function HospitalPatientsPage() {
    noStore();
    const [patients, hospitalInventory, hospitalSectors, dispensations] = await Promise.all([
        getHospitalPatients(),
        getProducts('Hospital'),
        getHospitalSectors(),
        getHospitalPatientDispensations()
    ]);

    const sortedDispensations = dispensations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Suspense fallback={<PatientsSkeleton />}>
            <HospitalPatientsClientPage 
                initialPatients={patients} 
                hospitalInventory={hospitalInventory as Product[]} 
                hospitalSectors={hospitalSectors}
                dispensations={sortedDispensations}
            />
        </Suspense>
    )
}
