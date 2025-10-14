
import { Suspense } from 'react';
import { getPatients } from '@/lib/data';
import type { PatientFilter } from '@/lib/types';
import { PatientsClientPage } from './client-page';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function PatientsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <div className="h-7 w-48 bg-muted rounded-md animate-pulse" />
                        <div className="h-4 w-72 mt-2 bg-muted rounded-md animate-pulse" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-9 w-32 bg-muted rounded-md animate-pulse" />
                        <div className="h-9 w-40 bg-muted rounded-md animate-pulse" />
                    </div>
                </div>
                <div className="flex items-center space-x-2 pt-4 overflow-x-auto pb-2">
                    <div className="h-9 w-20 bg-muted rounded-full animate-pulse" />
                    <div className="h-9 w-24 bg-muted rounded-full animate-pulse" />
                    <div className="h-9 w-28 bg-muted rounded-full animate-pulse" />
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
    const initialPatients = await getPatients(filter);

    return (
        <Suspense fallback={<PatientsSkeleton />}>
            <PatientsClientPage initialPatients={initialPatients} searchParams={searchParams} />
        </Suspense>
    );
}
