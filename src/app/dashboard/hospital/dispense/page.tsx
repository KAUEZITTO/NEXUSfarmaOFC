

'use server';

import { getProducts, getSectorDispensations, getHospitalSectors } from '@/lib/data';
import { DispenseToSectorClientPage } from './client-page';
import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function DispenseToSectorSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
                 <div className="mt-6">
                    <Skeleton className="h-64 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}


export default async function DispenseToSectorPage() {
    noStore();
    const [products, dispensations, sectors] = await Promise.all([
        getProducts('Hospital'),
        getSectorDispensations(),
        getHospitalSectors()
    ]);
    
    const sortedDispensations = dispensations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Suspense fallback={<DispenseToSectorSkeleton />}>
            <DispenseToSectorClientPage 
                initialProducts={products}
                initialDispensations={sortedDispensations}
                hospitalSectors={sectors}
            />
        </Suspense>
    )
}
