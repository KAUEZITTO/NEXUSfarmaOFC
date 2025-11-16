
'use server';

import { writeData } from './data';

/**
 * Resets all application data in the KV store to empty arrays,
 * but preserves the 'users' data.
 * This is a destructive operation for operational data.
 */
export async function resetAllData() {
    console.log("Initiating data reset (preserving users)...");
    const dataKeysToReset = [
        'products',
        'units',
        'patients',
        'orders',
        'dispensations',
        'stockMovements',
        'logs',
        'hospitalPatients',
        'hospitalSectors',
        'sectorDispensations',
        'hospitalPatientDispensations',
        'hospitalOrderTemplate'
    ];

    try {
        for (const key of dataKeysToReset) {
            await writeData(key, []);
            console.log(`- Cleared data for key: ${key}`);
        }
        console.log("All operational data has been successfully reset. User data was preserved.");
    } catch (error) {
        console.error("Failed to reset operational data:", error);
        throw new Error("Could not complete the data reset process.");
    }
}
