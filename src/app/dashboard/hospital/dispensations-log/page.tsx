
'use server';

import { getSectorDispensations } from '@/lib/data';
import { DispensationsLogClientPage } from './client-page';
import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function DispensationsLogSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    );
}

export default async function DispensationsLogPage() {
    noStore();
    const dispensations = await getSectorDispensations();
    const sortedDispensations = dispensations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return (
        <Suspense fallback={<DispensationsLogSkeleton />}>
            <DispensationsLogClientPage initialDispensations={sortedDispensations} />
        </Suspense>
    );
}
