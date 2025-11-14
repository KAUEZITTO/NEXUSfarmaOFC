
import { Suspense } from 'react';
import { getPatients, getUnits, getAllDispensations } from '@/lib/data';
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
                        <Skeleton className="h-9 w-44 bg-muted rounded-md" />
                    </div>
                </div>
                 <div className="mt-4">
                   <Skeleton className="h-10 w-full max-w-lg" />
                 </div>
            </CardHeader>
            <CardContent>
                <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                    <p className="mt-2 text-muted-foreground">Carregando...</p>
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
    
    // As chamadas de dados permanecem aqui, no Server Component
    const [initialPatients, initialUnits, initialDispensations] = await Promise.all([
        getPatients(filter, query),
        getUnits(),
        getAllDispensations()
    ]);
    
    const sortedDispensations = initialDispensations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Suspense fallback={<PatientsSkeleton />}>
            <PatientsClientPage 
                initialPatients={initialPatients} 
                initialUnits={initialUnits}
                initialDispensations={sortedDispensations}
                searchParams={searchParams} 
            />
        </Suspense>
    );
}
