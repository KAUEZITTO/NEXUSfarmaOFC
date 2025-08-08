
'use client';

import React from 'react';

export default function DispensationReceiptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-100 print:bg-white">
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
             display: none;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .print-container {
            margin: 0;
            padding: 0;
          }
          .page-break-after {
            page-break-after: always;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
