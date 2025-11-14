
'use server';

import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getHospitalOrderTemplate } from "@/lib/data";
import { OrderTemplateClientPage } from "./client-page";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TemplateSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-80 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-48" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 mt-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-10 w-36 mt-4" />
            </CardContent>
        </Card>
    );
}


export default async function OrderTemplatePage() {
    noStore();
    
    // Fetch only the template, not the entire CAF inventory
    const hospitalTemplate = await getHospitalOrderTemplate();

    return (
        <Suspense fallback={<TemplateSkeleton />}>
            <OrderTemplateClientPage 
                initialTemplate={hospitalTemplate}
            />
        </Suspense>
    )
}
