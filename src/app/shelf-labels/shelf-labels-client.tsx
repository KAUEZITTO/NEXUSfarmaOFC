
'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';

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

export function ShelfLabelsClient({ products }: { products: Product[] }) {
    const router = useRouter();

    useEffect(() => {
        // Automatically trigger print dialog when the page loads
        window.print();
    }, []);

    const labelW = 100; // mm
    const labelH = 30;  // mm
    const pageW = 210;
    const pageH = 297;

    const cols = Math.floor(pageW / labelW);
    const rows = Math.floor(pageH / labelH);
    const labelsPerPage = cols * rows;
    const pageCount = Math.ceil(products.length / labelsPerPage);

    const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
        const start = pageIndex * labelsPerPage;
        const end = start + labelsPerPage;
        return products.slice(start, end).map((product, i) => (
            <div key={`${pageIndex}-${i}`} style={{ width: `${labelW}mm`, height: `${labelH}mm`, boxSizing: 'border-box' }}>
                <ShelfLabel product={product} />
            </div>
        ));
    });

  return (
    <>
        <style jsx global>{`
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .print-container {
                    margin: 0;
                    padding: 0;
                }
                .print\\:hidden {
                    display: none;
                }
                .page-break-before {
                    page-break-before: always;
                }
                @page {
                    size: A4;
                    margin: 5mm;
                }
            }
        `}</style>

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
                    {pageLabels}
                </div>
            ))}
        </div>

        <div className="fixed bottom-4 right-4 flex gap-2 print:hidden">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
            </Button>
        </div>
    </>
  );
}
