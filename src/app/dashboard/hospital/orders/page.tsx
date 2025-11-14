'use server';

import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getOrdersForUnit } from "@/lib/data";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HospitalOrdersClientPage } from "./client-page";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function OrdersSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-80 mt-2" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-44" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2 mt-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}


export default async function HospitalOrdersPage() {
    noStore();
    const session = await getServerSession(authOptions);
    const unitId = session?.user?.locationId; // Assuming hospital user has a locationId pointing to the Unit ID.

    if (!unitId) {
        return <div className="text-center text-destructive">Erro: ID da unidade hospitalar não encontrado para o usuário.</div>
    }

    const orders = await getOrdersForUnit(unitId);

    return (
        <Suspense fallback={<OrdersSkeleton />}>
            <HospitalOrdersClientPage 
                initialOrders={orders} 
                hospitalUnitId={unitId}
            />
        </Suspense>
    )
}
