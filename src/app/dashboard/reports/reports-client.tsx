
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, BarChart2, Package, Users, AlertTriangle, Sparkles } from "lucide-react";
import { generateCompleteReportPDF, generateStockReportPDF, generateExpiryReportPDF, generatePatientReportPDF, generateUnitDispensationReportPDF, generateBatchReportPDF, generateEntriesAndExitsReportPDF } from "@/lib/pdf-generator";
import { useState } from "react";
import type { Product, Patient, Dispensation, Unit, Order, StockMovement } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { MonthlyConsumptionChart } from "@/components/dashboard/monthly-consumption-chart";

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
    reportStats: {
        itemsDispensedThisMonth: number;
        monthlyChangePercentage: number;
        judicialPatients: number;
        totalStockAlerts: number;
        lowStockItems: number;
        expiringSoonItems: number;
    }
}


export function ReportsClient({ 
    products, 
    patients, 
    dispensations,
    units,
    orders,
    stockMovements,
    reportStats,
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
  
  const reportHandlers: Record<string, () => void> = {
    "Dispensação por Unidade": handleExportUnitDispensation,
    "Estoque Atual": handleExportStock,
    "Produtos a Vencer": handleExportExpiry,
    "Atendimento de Pacientes": handleExportPatient,
    "Entradas e Saídas": handleExportEntriesAndExits,
    "Relatório de Lotes": handleExportBatch,
  };

  const buttonKeys: Record<string, keyof GeneratingState> = {
    "Dispensação por Unidade": 'unitDispensation',
    "Estoque Atual": 'stock',
    "Produtos a Vencer": 'expiry',
    "Atendimento de Pacientes": 'patient',
    "Entradas e Saídas": 'entriesAndExits',
    "Relatório de Lotes": 'batch',
  };

  return (
     <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                    <h1 className="text-2xl font-bold tracking-tight">Relatórios Gerenciais</h1>
                    <p className="text-muted-foreground">
                        Gere e visualize relatórios de dispensação, estoque e mais.
                    </p>
                    </div>
                    <Button onClick={handleExportComplete} disabled={isGenerating.complete}>
                        {isGenerating.complete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {isGenerating.complete ? 'Gerando...' : 'Relatório Completo'}
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Itens Dispensados (Mês)</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportStats.itemsDispensedThisMonth.toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-muted-foreground">
                            {reportStats.monthlyChangePercentage >= 0 ? `+${reportStats.monthlyChangePercentage.toFixed(1)}%` : `${reportStats.monthlyChangePercentage.toFixed(1)}%`} em relação ao mês anterior
                        </p>
                    </CardContent>
                    </Card>
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pacientes Atendidos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportStats.judicialPatients}</div>
                        <p className="text-xs text-muted-foreground">Pacientes com mandado judicial/municipal</p>
                    </CardContent>
                    </Card>
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportStats.totalStockAlerts}</div>
                        <p className="text-xs text-muted-foreground">{reportStats.lowStockItems} baixo estoque, {reportStats.expiringSoonItems} perto do vencimento</p>
                    </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                    <CardTitle>Gerar Relatórios Específicos</CardTitle>
                    <CardDescription>
                        Selecione um tipo de relatório para gerar um documento PDF.
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {Object.keys(reportHandlers).map((reportName) => {
                            const key = buttonKeys[reportName];
                            const isGen = isGenerating[key];
                            return (
                                <Button 
                                    key={reportName}
                                    variant="outline" 
                                    className="justify-start"
                                    onClick={reportHandlers[reportName]}
                                    disabled={isGen}
                                >
                                    {isGen ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                    {isGen ? 'Gerando...' : reportName}
                                </Button>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
            
            <Card className="lg:col-span-1 h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Análise com IA
                    </CardTitle>
                    <CardDescription>
                        Funcionalidade temporariamente desativada.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p>O assistente de IA está em manutenção.</p>
                    <p className="text-xs">Esta funcionalidade será reativada em breve.</p>
                </CardContent>
            </Card>

        </div>

       <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Consumo Mensal de Itens
            </CardTitle>
            <CardDescription>
              Visualize a quantidade de itens dispensados nos últimos 6 meses.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <MonthlyConsumptionChart dispensations={dispensations} />
          </CardContent>
        </Card>
    </div>
  )
}
