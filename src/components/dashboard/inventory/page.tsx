
'use server';

import { getProducts } from '@/lib/data';
import { InventoryClientPage } from './client-page';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { unstable_noStore as noStore } from 'next/cache';
import type { UserLocation } from '@/lib/types';


function InventorySkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Inventário de Produtos</CardTitle>
                <CardDescription>
                    Gerencie seus produtos, adicione novos e acompanhe o estoque.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <div className="flex items-center space-x-2 pt-2 overflow-x-auto pb-2">
                        <Skeleton className="h-9 w-20 rounded-full" />
                        <Skeleton className="h-9 w-28 rounded-full" />
                        <Skeleton className="h-9 w-36 rounded-full" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-44" />
                        <Skeleton className="h-9 w-40" />
                    </div>
                </div>
                <div className="relative mb-4">
                    <Skeleton className="h-10 max-w-sm" />
                </div>
                <div className="space-y-2 mt-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

// This component now acts as a Server Component wrapper.
// It fetches the initial data filtered by user location and passes it down to the client component.
export default async function InventoryPageWrapper({ searchParams }: { searchParams: { location?: UserLocation | 'all' } }) {
    noStore();
    const session = await getServerSession(authOptions);
    const userLocation = session?.user?.location;
    const isCoordinator = session?.user?.subRole === 'Coordenador';

    // For coordinators, the filter can be passed via URL. If not, show all.
    // For regular users, force the filter to be their own location.
    let productLocationFilter: UserLocation | 'all' = 'all';

    if (isCoordinator) {
        // A coordinator can view 'CAF', 'Hospital', or 'all' based on the query param. Default to 'all'.
        productLocationFilter = searchParams.location || 'all';
    } else {
        // A regular user is always restricted to their own location.
        productLocationFilter = userLocation || 'all'; // Fallback to 'all' if location is missing, though it shouldn't happen.
    }
    
    const initialProducts = await getProducts(productLocationFilter);
    
    return (
        <Suspense fallback={<InventorySkeleton />}>
            <InventoryClientPage initialProducts={initialProducts} />
        </Suspense>
    );
}
