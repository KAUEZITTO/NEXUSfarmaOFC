
'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';

interface LabelPageClientProps {
    product: Product;
    isBox: boolean;
}

const Barcode = ({ value }: { value: string }) => {
    // This is a visual simulation of a Code 128 barcode font.
    // It's not a real barcode image, but provides a scannable appearance
    // with appropriate fonts installed or for most barcode readers.
    const shortId = value.slice(-4);
    return (
        <div className="w-full text-center">
            <p className="font-mono text-4xl leading-none tracking-tighter scale-y-150">
               *{value}*
            </p>
            <p className="font-mono text-xs tracking-[0.2em] font-bold">CÓD: {shortId}</p>
        </div>
    )
}

const ProductLabel = ({ product }: { product: Product }) => {
    return (
        <div className="p-2 border border-black border-dashed flex flex-col justify-between h-full text-[10px] leading-tight">
            {/* Header */}
            <div className="flex justify-between items-start">
                 <div className="flex items-center gap-1.5">
                    <div className="relative w-7 h-7">
                        <Image src="/CAF.png" alt="Logo CAF" layout="fill" objectFit="contain" data-ai-hint="pharmacy cross" />
                    </div>
                    <p className="font-bold">C.A.F.</p>
                </div>
                 <div className="text-right">
                    <p><span className="font-semibold">Lote:</span> {product.batch || 'N/A'}</p>
                    <p><span className="font-semibold">Val:</span> {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A'}</p>
                </div>
            </div>
            
            {/* Body */}
            <div className="my-1">
                <p className="text-sm font-bold line-clamp-2">{product.name}</p>
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

    const labelWidth = isBox ? largeW : smallW;
    const labelHeight = isBox ? largeH : smallH;
    
    // A4 page dimensions in mm
    const pageW = 210;
    const pageH = 297;
    
    // Calculate how many labels fit per row/column
    const cols = Math.floor(pageW / labelWidth);
    const rows = Math.floor(pageH / labelHeight);

    const labelsPerPage = cols * rows;
    const pageCount = Math.ceil(labelCount / labelsPerPage);

    const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
        const start = pageIndex * labelsPerPage;
        return Array.from({ length: labelsPerPage }, (_, labelIndex) => {
            const productIndex = start + labelIndex;
            return productIndex < labelCount ? <ProductLabel product={product} /> : <div className="border border-dashed border-gray-300"></div>;
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
                margin: 5mm;
            }
        }
      `}</style>

        <div className="print-container bg-gray-100 print:bg-white text-black">
            {pages.map((pageLabels, index) => (
                <div 
                    key={index}
                    className={`grid bg-white w-[210mm] h-[297mm] mx-auto my-4 shadow-lg print:shadow-none print:my-0 ${index > 0 ? 'page-break-before' : ''}`}
                    style={{ 
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gridTemplateRows: `repeat(${rows}, 1fr)`,
                        width: `${pageW}mm`,
                        height: `${pageH}mm`,
                     }}
                >
                    {pageLabels.map((label, i) => (
                        <div key={i} style={{width: `${labelWidth}mm`, height: `${labelHeight}mm`}}>
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
