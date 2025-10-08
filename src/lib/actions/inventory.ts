'use server';

import { readData } from '@/lib/data';
import type { Product } from '@/lib/types';

/**
 * Fetches all products from the data source.
 * This is isolated in its own server action file to prevent build issues.
 * @returns A promise that resolves to an array of products.
 */
export async function getProducts(): Promise<Product[]> {
    try {
        const products = await readData<Product>('products');
        return products;
    } catch (error) {
        console.error("Falha ao buscar produtos no KV:", error);
        return []; // Retorna um array vazio em caso de erro para não quebrar o build.
    }
}
