
'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export const Barcode = ({ value }: { value: string }) => {
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
