
import React from 'react';
import { Suspense } from 'react';
import { getUnits, getProducts } from '@/lib/data';
import { NewOrderClientPage } from './client-page';
import LoadingNewOrderPage from './loading';

export default async function NewOrderPageWrapper() {
    // Fetch data on the server
    const unitsData = await getUnits();
    const productsData = await getProducts();

    return (
        <Suspense fallback={<LoadingNewOrderPage />}>
            <NewOrderClientPage initialUnits={unitsData} initialProducts={productsData} />
        </Suspense>
    );
}
