
import { Suspense } from 'react';
import { getPatients } from '@/lib/data';
import type { PatientFilter } from '@/lib/types';
import { PatientsClientPage } from './client-page';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

function PatientsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <Skeleton className="h-7 w-48 bg-muted rounded-md" />
                        <Skeleton className="h-4 w-72 mt-2 bg-muted rounded-md" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-40 bg-muted rounded-md" />
                    </div>
                </div>
                <div className="flex items-center space-x-2 pt-4 overflow-x-auto pb-2">
                    <Skeleton className="h-9 w-20 bg-muted rounded-full" />
                    <Skeleton className="h-9 w-24 bg-muted rounded-full" />
                    <Skeleton className="h-9 w-28 bg-muted rounded-full" />
                </div>
                 <div className="relative mt-4">
                    <Skeleton className="h-10 max-w-sm" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                    <p className="mt-2 text-muted-foreground">Carregando pacientes...</p>
                </div>
            </CardContent>
        </Card>
    )
}

export default async function PatientsPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const filter = (searchParams?.filter as PatientFilter) || 'active';
    const query = (searchParams?.q as string) || '';
    
    // The data fetching is now aware of the search query
    const initialPatients = await getPatients(filter, query);

    return (
        <Suspense fallback={<PatientsSkeleton />}>
            <PatientsClientPage initialPatients={initialPatients} searchParams={searchParams} />
        </Suspense>
    );
}

    
