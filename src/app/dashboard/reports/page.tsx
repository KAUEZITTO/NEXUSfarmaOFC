

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, BarChart2, AlertTriangle, Package, Users, Loader2 } from "lucide-react";
import { MonthlyConsumptionChart } from "@/components/dashboard/monthly-consumption-chart";
import { getProducts, getAllPatients, getAllDispensations } from "@/lib/actions";
import { generateCompleteReportPDF, generateStockReportPDF, generateExpiryReportPDF, generatePatientReportPDF } from "@/lib/pdf-generator";
import { useEffect, useState } from "react";
import type { Product, Patient, Dispensation } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type GeneratingState = {
    complete: boolean;
    stock: boolean;
    expiry: boolean;
    patient: boolean;
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dispensations, setDispensations] = useState<Dispensation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<GeneratingState>({
    complete: false,
    stock: false,
    expiry: false,
    patient: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [productsData, patientsData, dispensationsData] = await Promise.all([
        getProducts(),
        getAllPatients(),
        getAllDispensations()
      ]);
      setProducts(productsData);
      setPatients(patientsData);
      setDispensations(dispensationsData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const openPdfPrintDialog = (pdfDataUri: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfDataUri;
    document.body.appendChild(iframe);
    iframe.onload = () => {
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        }, 1);
    };
  }

  const handleExportComplete = async () => {
    setIsGenerating(prev => ({...prev, complete: true}));
    try {
        const pdfDataUri = await generateCompleteReportPDF(products, patients, dispensations);
        openPdfPrintDialog(pdfDataUri);
    } catch(e) {
        console.error("Failed to generate complete PDF", e);
        toast({ variant: 'destructive', title: 'Erro ao Gerar Relatório', description: 'Não foi possível gerar o PDF.' });
    } finally {
        setIsGenerating(prev => ({...prev, complete: false}));
    }
  }

  const handleExportStock = async () => {
    setIsGenerating(prev => ({...prev, stock: true}));
    try {
      const pdfDataUri = await generateStockReportPDF(products);
      openPdfPrintDialog(pdfDataUri);
    } catch(e) {
      console.error("Failed to generate stock PDF", e);
      toast({ variant: 'destructive', title: 'Erro ao Gerar Relatório', description: 'Não foi possível gerar o PDF.' });
    } finally {
      setIsGenerating(prev => ({...prev, stock: false}));
    }
  }

  const handleExportExpiry = async () => {
    setIsGenerating(prev => ({...prev, expiry: true}));
    try {
      const pdfDataUri = await generateExpiryReportPDF(products);
      openPdfPrintDialog(pdfDataUri);
    } catch(e) {
      console.error("Failed to generate expiry PDF", e);
      toast({ variant: 'destructive', title: 'Erro ao Gerar Relatório', description: 'Não foi possível gerar o PDF.' });
    } finally {
      setIsGenerating(prev => ({...prev, expiry: false}));
    }
  }

    const handleExportPatient = async () => {
    setIsGenerating(prev => ({...prev, patient: true}));
    try {
      const pdfDataUri = await generatePatientReportPDF(dispensations);
      openPdfPrintDialog(pdfDataUri);
    } catch(e) {
      console.error("Failed to generate patient PDF", e);
      toast({ variant: 'destructive', title: 'Erro ao Gerar Relatório', description: 'Não foi possível gerar o PDF.' });
    } finally {
      setIsGenerating(prev => ({...prev, patient: false}));
    }
  }


  const handleNotImplemented = () => {
    toast({
        title: 'Funcionalidade em Desenvolvimento',
        description: 'A geração deste relatório específico ainda não foi implementada.',
    });
  };


  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const lowStockItems = products.filter(p => p.status === 'Baixo Estoque').length;
  const expiringSoonItems = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    return expiry > now && expiry <= thirtyDaysFromNow;
  }).length;
  
  const totalStockAlerts = lowStockItems + expiringSoonItems;

  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const itemsDispensedThisMonth = dispensations
    .filter(d => new Date(d.date) >= firstDayOfMonth)
    .reduce((total, d) => total + d.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const firstDayOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const itemsDispensedLastMonth = dispensations
    .filter(d => {
        const dDate = new Date(d.date);
        return dDate >= firstDayOfLastMonth && dDate <= lastDayOfLastMonth;
    })
    .reduce((total, d) => total + d.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  
  let monthlyChangePercentage = 0;
  if (itemsDispensedLastMonth > 0) {
    monthlyChangePercentage = ((itemsDispensedThisMonth - itemsDispensedLastMonth) / itemsDispensedLastMonth) * 100;
  } else if (itemsDispensedThisMonth > 0) {
    monthlyChangePercentage = 100;
  }
  
  const judicialPatients = patients.filter(p => p.mandateType === 'Legal' || p.mandateType === 'Municipal').length;

  if (loading) {
    return (
       <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-4 text-muted-foreground">Carregando dados dos relatórios...</span>
       </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">
            Gere e visualize relatórios de dispensação, estoque e mais.
          </p>
        </div>
        <Button onClick={handleExportComplete} disabled={isGenerating.complete}>
          {isGenerating.complete ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isGenerating.complete ? 'Gerando...' : 'Exportar Relatório Completo'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Dispensados (Mês)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemsDispensedThisMonth.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
                 {monthlyChangePercentage >= 0 ? `+${monthlyChangePercentage.toFixed(1)}%` : `${monthlyChangePercentage.toFixed(1)}%`} em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{judicialPatients}</div>
            <p className="text-xs text-muted-foreground">Pacientes com mandado judicial/municipal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStockAlerts}</div>
            <p className="text-xs text-muted-foreground">{lowStockItems} baixo estoque, {expiringSoonItems} perto do vencimento</p>
          </CardContent>
        </Card>
      </div>

       <Card className="col-span-1 lg:col-span-2">
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

      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatórios Específicos</CardTitle>
          <CardDescription>
            Selecione um tipo de relatório para gerar um documento PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Button variant="outline" className="justify-start" onClick={handleNotImplemented}>
            <FileText className="mr-2 h-4 w-4" />
            Dispensação por Unidade
          </Button>
          <Button variant="outline" className="justify-start" onClick={handleExportStock} disabled={isGenerating.stock}>
             {isGenerating.stock ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
             ) : (
                <FileText className="mr-2 h-4 w-4" />
             )}
            Estoque Atual
          </Button>
           <Button variant="outline" className="justify-start" onClick={handleExportExpiry} disabled={isGenerating.expiry}>
             {isGenerating.expiry ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
             ) : (
                <FileText className="mr-2 h-4 w-4" />
             )}
            Produtos a Vencer
          </Button>
          <Button variant="outline" className="justify-start" onClick={handleExportPatient} disabled={isGenerating.patient}>
            {isGenerating.patient ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <FileText className="mr-2 h-4 w-4" />
                )}
            Atendimento de Pacientes
          </Button>
           <Button variant="outline" className="justify-start" onClick={handleNotImplemented}>
            <FileText className="mr-2 h-4 w-4" />
            Entradas e Saídas
          </Button>
           <Button variant="outline" className="justify-start" onClick={handleNotImplemented}>
            <FileText className="mr-2 h-4 w-4" />
            Relatório de Lotes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    