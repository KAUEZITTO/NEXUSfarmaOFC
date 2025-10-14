
import { Suspense } from 'react';
import { getUnits } from '@/lib/data';
import { UnitsClientPage } from './client-page';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function UnitsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-7 w-24" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </div>
                    <Skeleton className="h-9 w-40" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}


export default async function UnitsPage() {
    const units = await getUnits();

    return (
        <Suspense fallback={<UnitsSkeleton />}>
            <UnitsClientPage initialUnits={units} />
        </Suspense>
    );
}
