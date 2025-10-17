

'use client';

import React, { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import type { Dispensation, DispensationItem, Product } from "@/lib/types";
import { getDispensation } from "@/lib/data";
import { PrintActions } from "@/app/receipt/[id]/print-actions";


const renderItemRows = (items: DispensationItem[]) => {
    if (!items || items.length === 0) return null;
    return items.map((item, index) => {
        let formattedDate = "N/A";
        if (item.expiryDate) {
            const date = new Date(item.expiryDate);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            }
        }
        return (
            <TableRow key={item.productId + (item.batch || index)} className={`border-b print:even:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}`}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-center">{item.presentation || "--"}</TableCell>
                <TableCell className="text-center">{item.batch || "--"}</TableCell>
                <TableCell className="text-center">{formattedDate}</TableCell>
                <TableCell className="text-right">{item.quantity.toLocaleString('pt-BR')}</TableCell>
            </TableRow>
        );
    });
}

const getReturnDate = (dispensationDate: string) => {
    const date = new Date(dispensationDate);
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};


const ReceiptCopy = ({ dispensation, showSignature, isFirstCopy }: { dispensation: Dispensation, showSignature: boolean, isFirstCopy: boolean }) => {
    const groupedItems = dispensation.items.reduce((acc, item) => {
        const category = item.category;
        (acc[category] = acc[category] || []).push(item);
        return acc;
    }, {} as Record<string, DispensationItem[]>);
    
    const returnDate = getReturnDate(dispensation.date);
    const formattedDispensationDate = new Date(dispensation.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const categoryOrder: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)'];

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
                    <p className="text-sm mt-1 font-semibold">GUIA DE DISPENSAÇÃO</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <Image src="/CAF.png" alt="Logo CAF" width={80} height={80} data-ai-hint="pharmacy cross" />
                    <p className="text-xs font-bold mt-1">CAF - CENTRO DE ABASTÊCIMENTO FARMACÊUTICO</p>
                </div>
            </div>
        </header>
        
        <div className="my-6 text-sm">
            <div className="font-bold text-lg mb-4">Recibo do Paciente</div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 p-3 border rounded-md">
                <div><span className="font-semibold">Nome:</span> {dispensation.patient.name}</div>
                <div><span className="font-semibold">CPF:</span> {dispensation.patient.cpf}</div>
                <div><span className="font-semibold">CNS:</span> {dispensation.patient.cns}</div>
                {dispensation.patient.unitName && <div><span className="font-semibold">Unidade:</span> {dispensation.patient.unitName}</div>}
                <div><span className="font-semibold">Mandado:</span> {dispensation.patient.mandateType || 'N/A'}</div>
                <div><span className="font-semibold">Data:</span> {formattedDispensationDate}</div>
                <div className="font-bold"><span className="font-semibold">Retorno:</span> {returnDate}</div>
                <div><span className="font-semibold">ID da Dispensa:</span> {dispensation.id}</div>
            </div>
        </div>

        <div className="space-y-6">
          {categoryOrder.map(category => {
              if (!groupedItems[category] || groupedItems[category].length === 0) return null;
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
                      {renderItemRows(groupedItems[category])}
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
                <p className="text-center mt-2 text-sm">Assinatura do Paciente/Responsável</p>
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
              {dispensation.creatorName && <p className="mt-2">Documento gerado por: {dispensation.creatorName}</p>}
          </div>
        <p className="text-xs text-center mt-4 text-gray-500">
          {isFirstCopy ? "1ª VIA - CAF" : "2ª VIA - PACIENTE"}
        </p>
      </footer>
    </div>
  );
};


export default function DispensationReceiptPage({ params }: { params: { id: string } }) {
  const [dispensationData, setDispensationData] = useState<Dispensation | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
        setIsNew(true);
        // Clean the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }
    
    async function fetchDispensation() {
        setLoading(true);
        try {
          const data = await getDispensation(params.id);
          if (data) {
              setDispensationData(data);
          }
        } catch (error) {
          console.error("Failed to fetch dispensation", error);
        } finally {
          setLoading(false);
        }
    }
    fetchDispensation();
  }, [params.id]);

  useEffect(() => {
      if (dispensationData && isNew) {
          window.print();
          setIsNew(false);
      }
  }, [dispensationData, isNew]);


  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4">Carregando recibo...</p>
        </div>
    );
  }

  if (!dispensationData) {
      return (
        <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
            <p>Recibo não encontrado.</p>
            <p className="text-sm text-muted-foreground">O ID pode estar incorreto ou o recibo foi excluído.</p>
            <PrintActions backOnly={true} />
        </div>
    );
  }

  return (
    <>
      <div className="print-container">
        <ReceiptCopy dispensation={dispensationData} showSignature={true} isFirstCopy={true} />
        <ReceiptCopy dispensation={dispensationData} showSignature={false} isFirstCopy={false} />
      </div>

      <PrintActions />
    </>
  );
}
