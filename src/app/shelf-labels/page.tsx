
'use server';

import React from 'react';
import type { Product } from '@/lib/types';
import { getProducts } from '@/lib/data';
import { PrintActions } from '../labels/[productId]/print-actions';

const ShelfLabel = ({ product }: { product: Product }) => {
    return (
        <div className="p-2 border border-black border-dashed flex flex-col justify-between h-full bg-white text-black">
            <div className="text-center">
                <p className="font-bold bg-black text-white text-xs uppercase tracking-wider py-1 px-2 -m-2 mb-2">{product.category}</p>
                <p className="text-lg font-bold mt-2 leading-tight">{product.name}</p>
                <p className="text-sm text-gray-700">{product.presentation}</p>
            </div>
            <div className="text-center mt-auto">
                <p className="text-xs text-muted-foreground">Posicione esta etiqueta na prateleira correspondente.</p>
            </div>
        </div>
    );
};

export default async function ShelfLabelsPage() {
    const fetchedProducts = await getProducts();
    
    // Group products by name and presentation, creating a unique key for each combination
    const groupedProductsMap = new Map<string, Product>();
    fetchedProducts.forEach(product => {
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
    
    const labelW = 100; // mm
    const labelH = 30;  // mm
    const pageW = 210;
    const pageH = 297;

    const cols = Math.floor(pageW / labelW);
    const rows = Math.floor(pageH / labelH);
    const labelsPerPage = cols * rows;
    const pageCount = Math.ceil(uniqueProducts.length / labelsPerPage);

    const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
        const start = pageIndex * labelsPerPage;
        const end = start + labelsPerPage;
        return uniqueProducts.slice(start, end).map((product, i) => (
            <div key={`${pageIndex}-${i}`} style={{ width: `${labelW}mm`, height: `${labelH}mm`, boxSizing: 'border-box' }}>
                <ShelfLabel product={product} />
            </div>
        ));
    });

  return (
    <>
        <div className="print-container bg-gray-100 print:bg-white">
            {pages.map((pageLabels, index) => (
                <div 
                    key={index}
                    className={`grid bg-white mx-auto my-4 shadow-lg print:shadow-none print:my-0 ${index > 0 ? 'page-break-before' : ''}`}
                    style={{ 
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gridTemplateRows: `repeat(${rows}, 1fr)`,
                        width: `${pageW}mm`,
                        height: `${pageH}mm`,
                        boxSizing: 'border-box'
                    }}
                >
                    {pageLabels.length > 0 ? pageLabels : (
                        <div className="col-span-full row-span-full flex items-center justify-center text-muted-foreground">
                            Nenhum produto para exibir.
                        </div>
                    )}
                </div>
            ))}
        </div>

        <PrintActions />
    </>
  );
}
