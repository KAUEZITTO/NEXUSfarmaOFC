
'use server';

import { getHospitalSectors } from "@/lib/data";
import { HospitalSectorsClientPage } from "./client-page";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function SectorsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-10 w-48" />
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

export default async function HospitalSectorsPage() {
    noStore();
    const sectors = await getHospitalSectors();

    return (
        <Suspense fallback={<SectorsSkeleton />}>
            <HospitalSectorsClientPage initialSectors={sectors} />
        </Suspense>
    );
}
