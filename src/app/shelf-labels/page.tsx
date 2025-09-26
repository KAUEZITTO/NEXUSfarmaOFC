
import { getProducts } from '@/lib/data';
import { ShelfLabelsClient } from './shelf-labels-client';

export const dynamic = 'force-dynamic';

export default async function ShelfLabelsPage() {
  const products = await getProducts();
  
  // Group products by name and presentation, creating a unique key for each combination
  const groupedProductsMap = new Map<string, typeof products[0]>();

  products.forEach(product => {
    const key = `${product.name}|${product.presentation}`;
    if (!groupedProductsMap.has(key)) {
        groupedProductsMap.set(key, product);
    }
  });

  const uniqueProducts = Array.from(groupedProductsMap.values());
  
  // Sort by category first, then by name
  uniqueProducts.sort((a, b) => {
    if (a.category < b.category) return -1;
    if (a.category > b.category) return 1;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  return <ShelfLabelsClient products={uniqueProducts} />;
}

    
