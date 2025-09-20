
'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import JsBarcode from 'jsbarcode';

interface LabelPageClientProps {
    product: Product;
    isBox: boolean;
}

const Barcode = ({ value }: { value: string }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const shortId = value.slice(-4);

    useEffect(() => {
        if (svgRef.current) {
            JsBarcode(svgRef.current, value, {
                format: 'CODE128',
                displayValue: false, // We'll display the value manually
                margin: 0,
                height: 30, // Reduced height to fit better
                width: 1.2, // Reduced width for smaller labels
            });
        }
    }, [value]);

    return (
        <div className="w-full text-center flex flex-col items-center">
            <svg ref={svgRef} className="w-full max-w-[80%]"></svg>
            <p className="font-mono text-[8px] tracking-wider font-bold">CÓD: {shortId}</p>
        </div>
    );
};

const ProductLabel = ({ product }: { product: Product }) => {
    return (
        <div className="p-1 border border-black border-dashed flex flex-col justify-between h-full text-[8px] leading-tight bg-white">
            {/* Header */}
            <div className="flex justify-between items-start">
                 <div className="relative w-6 h-6">
                    <Image src="/CAF.png" alt="Logo CAF" layout="fill" objectFit="contain" data-ai-hint="pharmacy cross" />
                 </div>
                 <div className="text-right">
                    <p><span className="font-semibold">Lote:</span> {product.batch || 'N/A'}</p>
                    <p><span className="font-semibold">Val:</span> {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A'}</p>
                </div>
            </div>
            
            {/* Body */}
            <div className="my-1 text-center">
                <p className="text-[10px] font-bold line-clamp-2">{product.name}</p>
                {product.manufacturer && <p className="text-gray-700">Fab: {product.manufacturer}</p>}
            </div>

            {/* Footer */}
            <div className="w-full mt-auto">
                 <Barcode value={product.id} />
            </div>
        </div>
    )
}

export function LabelPageClient({ product, isBox }: LabelPageClientProps) {
    const router = useRouter();

    useEffect(() => {
        // Automatically trigger print dialog when the page loads
        window.print();
    }, []);

    const labelCount = product.quantity > 0 ? product.quantity : 1;

    // Define dimensions in mm
    const largeW = 100;
    const largeH = 50;
    const smallW = 50;
    const smallH = 25;
    
    // Define gap in mm
    const gap = 2; 

    const labelWidth = isBox ? largeW : smallW;
    const labelHeight = isBox ? largeH : smallH;
    
    // A4 page dimensions in mm
    const pageW = 210;
    const pageH = 297;
    
    // Calculate how many labels fit per row/column considering the gap
    const cols = Math.floor(pageW / (labelWidth + gap));
    const rows = Math.floor(pageH / (labelHeight + gap));

    const labelsPerPage = cols * rows;
    const pageCount = Math.ceil(labelCount / labelsPerPage);

    const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
        const start = pageIndex * labelsPerPage;
        const pageItemsCount = Math.min(labelCount - start, labelsPerPage);

        return Array.from({ length: pageItemsCount }, (_, labelIndex) => {
            return <ProductLabel product={product} />;
        });
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
                margin: 5mm; /* Give a little margin for the printer */
            }
        }
      `}</style>

        <div className="print-container bg-gray-100 print:bg-white text-black">
            {pages.map((pageLabels, index) => (
                <div 
                    key={index}
                    className={`grid bg-white w-[210mm] h-[297mm] mx-auto my-4 shadow-lg print:shadow-none print:my-0 ${index > 0 ? 'page-break-before' : ''}`}
                    style={{ 
                        gridTemplateColumns: `repeat(${cols}, ${labelWidth}mm)`,
                        gridTemplateRows: `repeat(${rows}, ${labelHeight}mm)`,
                        gap: `${gap}mm`,
                        width: `${pageW}mm`,
                        height: `${pageH}mm`,
                        boxSizing: 'border-box'
                     }}
                >
                    {pageLabels.map((label, i) => (
                        <div key={i} style={{width: `${labelWidth}mm`, height: `${labelHeight}mm`, boxSizing: 'border-box'}}>
                           {label}
                        </div>
                    ))}
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
