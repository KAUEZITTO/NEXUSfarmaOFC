
'use client';

import React from 'react';

export default function ReceiptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-100 print:bg-white">
      {children}
    </div>
  );
}
