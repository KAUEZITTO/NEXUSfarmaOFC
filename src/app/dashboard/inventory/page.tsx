
import { getProducts } from '@/lib/data';
import { InventoryClientPage } from './client-page';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
    const initialProducts = await getProducts();
    
    return (
        <Suspense fallback={<InventorySkeleton />}>
            <InventoryClientPage initialProducts={initialProducts} />
        </Suspense>
    );
}
