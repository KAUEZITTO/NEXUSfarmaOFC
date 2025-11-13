
import { getProducts } from '@/lib/data';
import { InventoryClientPage } from './client-page';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Product, UserLocation } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';

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
// It fetches the initial data and passes it down to the client component.
// This is a robust pattern for complex pages with client-side interactivity.
export default async function InventoryPageWrapper() {
    noStore();
    const session = await getServerSession(authOptions);
    const userLocation = session?.user?.location;
    const isCoordinator = session?.user?.subRole === 'Coordenador';

    let allProducts = await getProducts();
    let filteredProducts: Product[] = [];

    // Coordinators see everything.
    if (isCoordinator) {
        filteredProducts = allProducts;
    } 
    // Other users see products based on their location.
    else if (userLocation) {
        // We'll need a way to distinguish products by location.
        // For now, let's assume there's a property on the product.
        // If not, we might need to adjust data model or logic.
        // For this example, let's assume no filtering exists yet and show all,
        // but this is where the logic would go.
        // A better approach would be to have a `location` field on the product itself.
        // Let's simulate this for now:
        const isHospitalProduct = (p: Product) => p.category === 'Odontológico' || p.category === 'Laboratório';
        if (userLocation === 'Hospital') {
            filteredProducts = allProducts.filter(p => isHospitalProduct(p));
        } else { // CAF
            filteredProducts = allProducts.filter(p => !isHospitalProduct(p));
        }
    } else {
        // Fallback for users without a location (should not happen for non-coordinators)
        filteredProducts = [];
    }
    
    return (
        <Suspense fallback={<InventorySkeleton />}>
            <InventoryClientPage initialProducts={filteredProducts} />
        </Suspense>
    );
}
