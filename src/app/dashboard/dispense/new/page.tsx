

import React from 'react';
import { Suspense } from 'react';
import { getProducts, getAllDispensations } from '@/lib/data';
import { NewDispensationClientPage } from './client-page';
import LoadingNewDispensationPage from './loading';
import type { Dispensation } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function NewDispensationPageWrapper() {
    noStore();
    const [productsData, dispensationsData] = await Promise.all([
        getProducts(),
        getAllDispensations()
    ]);

    return (
        <Suspense fallback={<LoadingNewDispensationPage />}>
            <NewDispensationClientPage 
                initialProducts={productsData} 
                initialDispensations={dispensationsData as Dispensation[]}
            />
        </Suspense>
    );
}
