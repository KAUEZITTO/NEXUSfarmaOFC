
import React from 'react';
import { Suspense } from 'react';
import { getPatients, getProducts, getAllDispensations } from '@/lib/data';
import { NewDispensationClientPage } from './client-page';
import LoadingNewDispensationPage from './loading';
import type { Dispensation } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function NewDispensationPageWrapper() {
    noStore();
    const [patientsData, productsData, dispensationsData] = await Promise.all([
        getPatients('active'),
        getProducts(),
        getAllDispensations()
    ]);

    return (
        <Suspense fallback={<LoadingNewDispensationPage />}>
            <NewDispensationClientPage 
                initialPatients={patientsData} 
                initialProducts={productsData} 
                initialDispensations={dispensationsData as Dispensation[]}
            />
        </Suspense>
    );
}
