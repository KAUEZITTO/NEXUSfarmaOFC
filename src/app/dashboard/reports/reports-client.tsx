
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { generateCompleteReportPDF, generateStockReportPDF, generateExpiryReportPDF, generatePatientReportPDF, generateUnitDispensationReportPDF, generateBatchReportPDF, generateEntriesAndExitsReportPDF } from "@/lib/pdf-generator";
import { useState, Children, cloneElement, isValidElement } from "react";
import type { Product, Patient, Dispensation, Unit, Order, StockMovement } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type GeneratingState = {
    complete: boolean;
    stock: boolean;
    expiry: boolean;
    patient: boolean;
    unitDispensation: boolean;
    entriesAndExits: boolean;
    batch: boolean;
}

interface ReportsClientProps {
    products: Product[];
    patients: Patient[];
    dispensations: Dispensation[];
    units: Unit[];
    orders: Order[];
    stockMovements: StockMovement[];
    children: React.ReactNode;
}


export function ReportsClient({ 
    products, 
    patients, 
    dispensations,
    units,
    orders,
    stockMovements,
    children 
}: ReportsClientProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<GeneratingState>({
    complete: false,
    stock: false,
    expiry: false,
    patient: false,
    unitDispensation: false,
    entriesAndExits: false,
    batch: false,
  });

  const openPdfPrintDialog = (pdfDataUri: string) => {
    const byteCharacters = atob(pdfDataUri.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
            document.body.removeChild(iframe);
            URL.revokeObjectURL(blobUrl);
        }, 1);
    };
  }

  const generatePdf = async (type: keyof GeneratingState, generatorFn: () => Promise<string>) => {
    setIsGenerating(prev => ({ ...prev, [type]: true }));
    try {
        const pdfDataUri = await generatorFn();
        openPdfPrintDialog(pdfDataUri);
    } catch (e) {
        console.error(`Failed to generate ${type} PDF`, e);
        toast({ variant: 'destructive', title: 'Erro ao Gerar Relatório', description: 'Não foi possível gerar o PDF.' });
    } finally {
        setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleExportComplete = () => generatePdf('complete', () => generateCompleteReportPDF(products, patients, dispensations));
  const handleExportStock = () => generatePdf('stock', () => generateStockReportPDF(products));
  const handleExportExpiry = () => generatePdf('expiry', () => generateExpiryReportPDF(products));
  const handleExportPatient = () => generatePdf('patient', () => generatePatientReportPDF(dispensations));
  const handleExportUnitDispensation = () => generatePdf('unitDispensation', () => generateUnitDispensationReportPDF(orders, units));
  const handleExportBatch = () => generatePdf('batch', () => generateBatchReportPDF(products));
  const handleExportEntriesAndExits = () => generatePdf('entriesAndExits', () => generateEntriesAndExitsReportPDF(stockMovements));
  
  const reportHandlers = [
    handleExportUnitDispensation,
    handleExportStock,
    handleExportExpiry,
    handleExportPatient,
    handleExportEntriesAndExits,
    handleExportBatch
  ];

  const buttonKeys: (keyof GeneratingState)[] = [
    'unitDispensation',
    'stock',
    'expiry',
    'patient',
    'entriesAndExits',
    'batch'
  ];
  
  const childrenArray = Children.toArray(children);

  // For the main "Complete Report" button
  if (childrenArray.length === 1) {
    const child = childrenArray[0];
    if (isValidElement(child)) {
        return cloneElement(child as React.ReactElement<any>, {
            onClick: handleExportComplete,
            disabled: isGenerating.complete,
            children: isGenerating.complete ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" /> Exportar Relatório Completo
                </>
            ),
        });
    }
    return null;
  }

  // For the list of specific report buttons
  return (
    <>
      {Children.map(children, (child, index) => {
        if (isValidElement(child)) {
            const handler = reportHandlers[index];
            const key = buttonKeys[index];
            const originalChildren = child.props.children;
            return cloneElement(child as React.ReactElement<any>, {
                onClick: handler,
                disabled: isGenerating[key],
                children: isGenerating[key] ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
                    </>
                ) : (
                   originalChildren
                ),
            });
        }
        return child;
      })}
    </>
  )
}
