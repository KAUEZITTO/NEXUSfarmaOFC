

import React from 'react';

export default function DispensationReceiptLayout({
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
