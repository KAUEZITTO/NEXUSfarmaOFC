
'use server';

import { writeData } from './data';

/**
 * Resets all application data in the KV store to empty arrays.
 * This is a destructive operation.
 */
export async function resetAllData() {
    console.log("Initiating data reset...");
    const dataKeys = [
        'products',
        'units',
        'patients',
        'orders',
        'dispensations',
        'stockMovements',
        'logs',
        'users'
    ];

    try {
        for (const key of dataKeys) {
            await writeData(key, []);
            console.log(`- Cleared data for key: ${key}`);
        }
        console.log("All application data has been successfully reset.");
    } catch (error) {
        console.error("Failed to reset application data:", error);
        // Depending on the use case, you might want to re-throw the error
        // or handle it gracefully.
        throw new Error("Could not complete the data reset process.");
    }
}
