
'use client';

import React, { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import type { Order, OrderItem, Product } from "@/lib/types";
import { getOrder } from "@/lib/data";

const renderItemRows = (items: OrderItem[]) => {
    if (!items || items.length === 0) return null;
    return items.map((item, index) => (
        <TableRow key={item.productId + (item.batch || index)} className={`border-b print:even:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}`}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="text-center">{item.presentation || "--"}</TableCell>
            <TableCell className="text-center">{item.batch || "--"}</TableCell>
            <TableCell className="text-center">{item.expiryDate ? item.expiryDate : "--"}</TableCell>
            <TableCell className="text-right">{item.quantity.toLocaleString('pt-BR')}</TableCell>
        </TableRow>
    ));
}

const ReceiptCopy = ({ order, showSignature, isFirstCopy }: { order: Order, showSignature: boolean, isFirstCopy: boolean }) => {
    const groupedItems = order.items.reduce((acc, item) => {
        const category = item.category;
        (acc[category] = acc[category] || []).push(item);
        return acc;
    }, {} as Record<string, OrderItem[]>);

    const categoryOrder: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Não Padronizado (Compra)'];

  return (
    <div className={`max-w-4xl mx-auto bg-white text-black my-8 print:my-0 flex flex-col justify-between min-h-screen ${isFirstCopy ? 'shadow-lg print:shadow-none page-break-after' : 'shadow-lg print:shadow-none'}`}>
      <div className="p-8">
        <header className="mb-4">
          <div className="grid grid-cols-3 items-center text-center border-b pb-4 border-gray-400">
              <div className="flex flex-col items-center justify-center">
                  <Image src="/SMS-PREF.png" alt="Logo Prefeitura" width={80} height={80} data-ai-hint="city hall government" />
                  <p className="text-xs font-bold mt-1 max-w-40">PREFEITURA MUNICIPAL DE IGARAPÉ-AÇU</p>
              </div>

              <div className="flex flex-col items-center justify-center">
                  <Logo />
                  <p className="text-sm mt-1 font-semibold">GUIA DE ENTREGA</p>
              </div>

              <div className="flex flex-col items-center justify-center">
                    <Image src="/CAF.png" alt="Logo CAF" width={80} height={80} data-ai-hint="pharmacy cross" />
                    <p className="text-xs font-bold mt-1">CAF - CENTRO DE ABASTÊCIMENTO FARMACÊUTICO</p>
              </div>
          </div>
        </header>
        
        <div className="grid grid-cols-3 gap-4 my-6 text-sm">
          <div>
            <p className="font-bold">Unidade de Destino:</p>
            <p>{order.unitName}</p>
          </div>
          <div>
            <p className="font-bold">Data do Pedido:</p>
            <p>{new Date(order.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
          </div>
          <div>
            <p className="font-bold">ID do Pedido:</p>
            <p>{order.id}</p>
          </div>
        </div>

        <div className="space-y-6">
          {categoryOrder.map(category => {
            const items = groupedItems[category];
            if (!items || items.length === 0) return null;
            return (
              <div key={category}>
                 <h3 className="font-bold text-md text-slate-600 tracking-wide uppercase mb-2">{category}</h3>
                 <Table className="border-collapse border border-gray-300">
                  <TableHeader>
                    <TableRow className="bg-gray-200 hover:bg-gray-200 print:bg-gray-200">
                      <TableHead className="w-[40%] font-semibold text-slate-700 border border-gray-300">Item</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700 border border-gray-300">Apresentação</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700 border border-gray-300">Lote</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700 border border-gray-300">Validade</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700 border border-gray-300">Quantidade</TableHead>
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
          <div className="mt-20">
             <div className="w-1/2 mx-auto">
                <div className="border-t border-black"></div>
                <p className="text-center mt-2 text-sm">Assinatura do Recebedor</p>
            </div>
          </div>
        )}
      </div>
      <footer className="p-8 pt-4">
          <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-600">
              <p className="font-bold">CAF – CENTRO DE ABASTÊCIMENTO FARMACÊUTICO</p>
              <p>Av. Marechal Deodoro – Centro – IGARAPÉ-AÇU/PA - CEP 68.725-000</p>
              <p>email: caf.igarape18@gmail.com | CNPJ: 11.718.379/0001-96</p>
              <p className="font-semibold mt-2">PEDIDOS E DEMAIS DEMANDAS PODEM SER ENVIADAS POR EMAIL!</p>
          </div>
         <p className="text-xs text-center mt-4 text-gray-500">
          {isFirstCopy ? "1ª VIA - CAF" : "2ª VIA - UNIDADE"}
        </p>
      </footer>
    </div>
  );
};


function ReceiptPageContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrderData() {
        setLoading(true);
        const order = await getOrder(params.id);
        setOrderData(order);
        setLoading(false);
    }
    if (params.id) {
        fetchOrderData();
    }
  }, [params.id]);


  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4">Carregando recibo...</p>
        </div>
    );
  }

  if (!orderData) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Recibo não encontrado.</p>
        </div>
    );
  }

  return (
    <>
      <div className="print-container">
        <ReceiptCopy order={orderData} showSignature={true} isFirstCopy={true} />
        <ReceiptCopy order={orderData} showSignature={false} isFirstCopy={false} />
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

export default function ReceiptPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-4">Carregando...</p></div>}>
            <ReceiptPageContent params={params} />
        </Suspense>
    )
}
