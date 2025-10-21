
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPatient, getDispensationsForPatient } from "@/lib/data";
import { Skeleton } from '@/components/ui/skeleton';
import { PatientHistoryClientPage } from './client-page';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

function PatientHistorySkeleton() {
  return (
      <div className="space-y-6">
          <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                  </div>
              </CardContent>
          </Card>
           <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-1/3" />
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
      </div>
  )
}

async function PatientHistoryData({ patientId }: { patientId: string }) {
    const patientData = await getPatient(patientId);
    if (!patientData) {
        notFound();
    }
    const dispensationsData = await getDispensationsForPatient(patientId);
    
    return <PatientHistoryClientPage initialPatient={patientData} initialDispensations={dispensationsData} />;
}

export default async function PatientHistoryPage({ params }: { params: { patientId: string } }) {
  return (
    <Suspense fallback={<PatientHistorySkeleton />}>
      <PatientHistoryData patientId={params.patientId} />
    </Suspense>
  );
}
