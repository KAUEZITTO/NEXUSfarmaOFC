'use server';

import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getProducts, getHospitalOrderTemplate } from "@/lib/data";
import { OrderTemplateClientPage } from "./client-page";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TemplateSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="space-y-2 mt-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}


export default async function OrderTemplatePage() {
    noStore();
    
    // Fetch all products from CAF inventory that hospital might request
    const cafInventory = await getProducts('CAF');
    const hospitalTemplate = await getHospitalOrderTemplate();

    return (
        <Suspense fallback={<TemplateSkeleton />}>
            <OrderTemplateClientPage 
                cafInventory={cafInventory}
                initialTemplate={hospitalTemplate}
            />
        </Suspense>
    )
}
