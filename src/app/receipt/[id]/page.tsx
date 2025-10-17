

import React, { Suspense } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Logo } from "@/components/logo";
import Image from "next/image";
import type { Order, OrderItem, Product } from "@/lib/types";
import { getOrder } from "@/lib/data";
import { notFound } from "next/navigation";
import { PrintActions } from "./print-actions";

const renderItemRows = (items: OrderItem[]) => {
    if (!items || items.length === 0) return null;
    return items.map((item, index) => {
        let formattedDate = "N/A";
        if (item.expiryDate) {
            // Fix for dates stored as 'YYYY-MM-DD' strings.
            // new Date('2025-12-31') creates a date at UTC midnight.
            // Adding timeZone:'UTC' to toLocaleDateString prevents off-by-one day errors.
            const date = new Date(item.expiryDate);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            }
        }

        return (
            <TableRow key={item.productId + (item.batch || index)} className={`border-b print:even:bg-gray-50 text-xs ${index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}`}>
                <TableCell className="font-medium py-1 px-2">{item.name}</TableCell>
                <TableCell className="text-center py-1 px-2">{item.presentation || "--"}</TableCell>
                <TableCell className="text-center py-1 px-2">{item.batch || "--"}</TableCell>
                <TableCell className="text-center py-1 px-2">{formattedDate}</TableCell>
                <TableCell className="text-right py-1 px-2">{item.quantity.toLocaleString('pt-BR')}</TableCell>
            </TableRow>
        );
    });
}

const ReceiptCopy = ({ order, showSignature, isFirstCopy }: { order: Order, showSignature: boolean, isFirstCopy: boolean }) => {
    const groupedItems = order.items.reduce((acc, item) => {
        const category = item.category;
        (acc[category] = acc[category] || []).push(item);
        return acc;
    }, {} as Record<string, OrderItem[]>);

    const categoryOrder: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)'];
    
  return (
    <div className={`max-w-4xl mx-auto bg-white text-black my-4 print:my-0 flex flex-col justify-between min-h-screen ${isFirstCopy ? 'shadow-lg print:shadow-none page-break-after' : 'shadow-lg print:shadow-none'}`}>
      <div className="p-4 sm:p-6">
        <header className="mb-4">
          <div className="grid grid-cols-3 items-center text-center border-b pb-2 border-gray-400">
              <div className="flex flex-col items-center justify-center">
                  <Image src="/SMS-PREF.png" alt="Logo Prefeitura" width={80} height={80} data-ai-hint="city hall government" />
                  <p className="text-[6px] font-bold mt-1 max-w-32">PREFEITURA MUNICIPAL DE IGARAPÉ-AÇU</p>
              </div>

              <div className="flex flex-col items-center justify-center">
                   <h1 className="text-sm font-bold">GUIA DE ENTREGA</h1>
                   <div className="text-xs space-y-0.5 mt-2 text-center">
                        <p><span className="font-bold">ID do Pedido:</span> {order.id}</p>
                        <p><span className="font-bold">Data:</span> {new Date(order.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                        <p><span className="font-bold">Tipo:</span> {order.orderType}</p>
                   </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                    <Image src="/CAF.png" alt="Logo CAF" width={80} height={80} data-ai-hint="pharmacy cross" />
                    <p className="text-[6px] font-bold mt-1">CAF - CENTRO DE ABASTÊCIMENTO FARMACÊUTICO</p>
              </div>
          </div>
          <div className="text-center mt-2">
                <p className="text-xs font-bold">Unidade de Destino: {order.unitName}</p>
          </div>
           {order.notes && (
            <div className="mt-2 text-xs border-t border-b py-1">
                <p><span className="font-bold">Justificativa:</span> {order.notes}</p>
            </div>
        )}
        </header>
        
        <div className="space-y-4">
          {categoryOrder.map(category => {
            const items = groupedItems[category];
            if (!items || items.length === 0) return null;
            return (
              <div key={category}>
                 <h3 className="font-bold text-sm text-slate-600 tracking-wide uppercase mb-1">{category}</h3>
                 <Table className="border-collapse border border-gray-300">
                  <TableHeader>
                    <TableRow className="bg-gray-200 hover:bg-gray-200 print:bg-gray-200 text-xs">
                      <TableHead className="w-[40%] font-semibold text-slate-700 border border-gray-300 py-1 px-2">Item</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700 border border-gray-300 py-1 px-2">Apresentação</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700 border border-gray-300 py-1 px-2">Lote</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700 border border-gray-300 py-1 px-2">Validade</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700 border border-gray-300 py-1 px-2">Qtd.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="border border-gray-300">
                    {renderItemRows(items)}
                  </TableBody>
                </Table>
              </div>
            )
          })}
        </div>
        
        {showSignature && (
          <div className="mt-16">
             <div className="w-1/2 mx-auto">
                <div className="border-t border-black"></div>
                <p className="text-center mt-2 text-sm">Assinatura do Recebedor</p>
            </div>
          </div>
        )}
      </div>
      <footer className="p-4 sm:p-6 pt-2">
          <div className="border-t border-gray-300 pt-2 text-center text-[8px] leading-tight text-gray-600">
              <p className="font-bold">CAF – CENTRO DE ABASTÊCIMENTO FARMACÊUTICO</p>
              <p>Av. Marechal Deodoro – Centro – IGARAPÉ-AÇU/PA - CEP 68.725-000</p>
              <p>email: caf.igarape18@gmail.com | CNPJ: 11.718.379/0001-96</p>
              <p className="font-semibold mt-1">PEDIDOS E DEMAIS DEMANDAS PODEM SER ENVIADAS POR EMAIL!</p>
              {order.creatorName && <p className="mt-1">Documento gerado por: {order.creatorName}</p>}
          </div>
          <div className="flex justify-between text-[8px] text-gray-500 mt-2">
            <span>NexusFarma - Sistema de Gestão Farmacêutica</span>
            <span>{isFirstCopy ? "1ª VIA - CAF" : "2ª VIA - UNIDADE"}</span>
          </div>
      </footer>
    </div>
  );
};


export default async function ReceiptPage({ params }: { params: { id: string } }) {
    const orderData = await getOrder(params.id);

    if (!orderData) {
        notFound();
    }
  
    return (
        <>
            <div className="print-container">
                <ReceiptCopy order={orderData} showSignature={true} isFirstCopy={true} />
                <ReceiptCopy order={orderData} showSignature={false} isFirstCopy={false} />
            </div>

            <PrintActions />
        </>
    );
}
