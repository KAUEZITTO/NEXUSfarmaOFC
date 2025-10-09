
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import JsBarcode from 'jsbarcode';
import { getProduct } from '@/lib/data';

const Barcode = ({ value }: { value: string }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const shortId = value.slice(-4);

    useEffect(() => {
        if (svgRef.current) {
            JsBarcode(svgRef.current, value, {
                format: 'CODE128',
                displayValue: false,
                margin: 0,
                height: 30,
                width: 1.2,
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
            <div className="flex justify-between items-start">
                 <div className="relative w-6 h-6">
                    <Image src="/CAF.png" alt="Logo CAF" layout="fill" objectFit="contain" data-ai-hint="pharmacy cross" />
                 </div>
                 <div className="text-right">
                    <p><span className="font-semibold">Lote:</span> {product.batch || 'N/A'}</p>
                    <p><span className="font-semibold">Val:</span> {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A'}</p>
                </div>
            </div>
            
            <div className="my-1 text-center">
                <p className="text-[10px] font-bold line-clamp-2">{product.name}</p>
                {product.manufacturer && <p className="text-gray-700">Fab: {product.manufacturer}</p>}
            </div>

            <div className="w-full mt-auto">
                 <Barcode value={product.id} />
            </div>
        </div>
    )
}

export default function LabelsPage({ params }: { params: { productId: string } }) {
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      async function fetchProduct() {
        setIsLoading(true);
        const productData = await getProduct(params.productId);
        if (!productData) {
          notFound();
        }
        setProduct(productData);
        setIsLoading(false);
      }
      fetchProduct();
    }, [params.productId]);
    
    useEffect(() => {
        // Automatically trigger print dialog when the data is loaded
        if (product) {
            window.print();
        }
    }, [product]);

    if (isLoading || !product) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-4">Carregando etiquetas...</p>
            </div>
        )
    }

    const isBox = ['Caixa c/ 100', 'Caixa c/ 50', 'Pacote', 'Bolsa'].includes(product.presentation || '');
    
    const largeW = 100;
    const largeH = 50;
    const smallW = 50;
    const smallH = 25;
    const gap = 2;

    const labelWidth = isBox ? largeW : smallW;
    const labelHeight = isBox ? largeH : smallH;
    
    const pageW = 210;
    const pageH = 297;
    
    const cols = Math.floor(pageW / (labelWidth + gap));
    const rows = Math.floor(pageH / (labelHeight + gap));
    const labelsPerPage = cols * rows;

    const labelsToPrint = Array.from({ length: labelsPerPage }, (_, i) => (
      <ProductLabel key={i} product={product} />
    ));

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
                <div 
                    className="grid bg-white w-[210mm] h-[297mm] mx-auto my-4 shadow-lg print:shadow-none print:my-0"
                    style={{ 
                        gridTemplateColumns: `repeat(${cols}, ${labelWidth}mm)`,
                        gridTemplateRows: `repeat(${rows}, ${labelHeight}mm)`,
                        gap: `${gap}mm`,
                        width: `${pageW}mm`,
                        height: `${pageH}mm`,
                        boxSizing: 'border-box'
                     }}
                >
                    {labelsToPrint.map((label, i) => (
                        <div key={i} style={{width: `${labelWidth}mm`, height: `${labelHeight}mm`, boxSizing: 'border-box'}}>
                           {label}
                        </div>
                    ))}
                </div>
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
