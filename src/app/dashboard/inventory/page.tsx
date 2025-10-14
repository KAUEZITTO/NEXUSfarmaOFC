
import { Suspense } from 'react';
import { getProducts } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryClientPage } from './client-page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


export default async function InventoryPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const products = await getProducts();
    
    return (
        <Suspense fallback={<InventorySkeleton />}>
            <InventoryClientPage initialProducts={products} searchParams={searchParams} />
        </Suspense>
    );
}

function InventorySkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Inventário de Produtos</CardTitle>
                <CardDescription>
                Gerencie seus produtos, adicione novos e acompanhe o estoque. Itens agrupados por nome e apresentação.
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
    )
}
