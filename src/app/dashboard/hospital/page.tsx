
'use server';

import { Suspense } from "react";
import { getProducts, getSectorDispensations } from "@/lib/data";
import { HospitalClientPage, HospitalDashboardSkeleton } from "./client-page";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { unstable_noStore as noStore } from "next/cache";

// This is the main page component. It's a server component.
// It fetches data and then passes it to the client component.
export default async function HospitalDashboardPage() {
    noStore(); // Ensures fresh data on every request
    const [products, dispensations] = await Promise.all([
        getProducts('Hospital'), // Fetch only hospital products
        getSectorDispensations(),
    ]);

    return (
        <>
            <DashboardHeader />
            <Suspense fallback={<HospitalDashboardSkeleton />}>
                <HospitalClientPage products={products} dispensations={dispensations} />
            </Suspense>
        </>
    );
}

    