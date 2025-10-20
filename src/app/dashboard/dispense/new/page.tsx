
import React from 'react';
import { Suspense } from 'react';
import { getPatients, getProducts } from '@/lib/data';
import { NewDispensationClientPage } from './client-page';
import LoadingNewDispensationPage from './loading';

export default async function NewDispensationPageWrapper() {
    const [patientsData, productsData] = await Promise.all([
        getPatients('active'),
        getProducts()
    ]);

    return (
        <Suspense fallback={<LoadingNewDispensationPage />}>
            <NewDispensationClientPage initialPatients={patientsData} initialProducts={productsData} />
        </Suspense>
    );
}
