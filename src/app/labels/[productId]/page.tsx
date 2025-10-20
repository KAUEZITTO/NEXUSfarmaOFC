
import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { getProduct } from '@/lib/data';
import { Barcode } from './barcode';
import { PrintActions } from './print-actions';

export const dynamic = 'force-dynamic';

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

export default async function LabelsPage({ params }: { params: { productId: string } }) {
    const product = await getProduct(params.productId);
    
    if (!product) {
        notFound();
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

      <PrintActions />
    </>
  );
}
