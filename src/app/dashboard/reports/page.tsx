
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, BarChart2, Package, Users, AlertTriangle, Sparkles, Calendar, Filter } from "lucide-react";
import { generateCompleteReportPDF, generateStockReportPDF, generateExpiryReportPDF, generatePatientReportPDF, generateUnitDispensationReportPDF, generateBatchReportPDF, generateEntriesAndExitsReportPDF } from "@/lib/pdf-generator";
import { useState, useEffect } from "react";
import type { Product, Patient, Dispensation, Unit, Order, StockMovement } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { MonthlyConsumptionChart } from "@/components/dashboard/monthly-consumption-chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { addDays, format } from "date-fns";
import { getProducts, getAllPatients, getAllDispensations, getUnits, getOrders, getStockMovements } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";

type GeneratingState = {
    complete: boolean;
    stock: boolean;
    expiry: boolean;
    patient: boolean;
    unitDispensation: boolean;
    entriesAndExits: boolean;
    batch: boolean;
}

interface ReportStats {
    itemsDispensedThisMonth: number;
    monthlyChangePercentage: number;
    judicialPatients: number;
    totalStockAlerts: number;
    lowStockItems: number;
    expiringSoonItems: number;
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<GeneratingState>({
    complete: false, stock: false, expiry: false, patient: false, 
    unitDispensation: false, entriesAndExits: false, batch: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dispensations, setDispensations] = useState<Dispensation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);

  // Filter states
  const [filterType, setFilterType] = useState('month');
  const [date, setDate] = useState<DateRange | undefined>({ from: new Date(), to: addDays(new Date(), 0) });
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const [productsData, patientsData, dispensationsData, unitsData, ordersData, stockMovementsData] = await Promise.all([
                getProducts(),
                getAllPatients(),
                getAllDispensations(),
                getUnits(),
                getOrders(),
                getStockMovements(),
            ]);

            setProducts(productsData);
            setPatients(patientsData);
            setDispensations(dispensationsData);
            setUnits(unitsData);
            setOrders(ordersData);
            setStockMovements(stockMovementsData);

            // Calculate stats after fetching
            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);

            const groupedProductsMap = new Map<string, { quantity: number }>();
            productsData.forEach(p => {
                const key = `${p.name}|${p.presentation}`;
                if (!groupedProductsMap.has(key)) {
                    groupedProductsMap.set(key, { quantity: 0 });
                }
                groupedProductsMap.get(key)!.quantity += p.quantity;
            });

            let lowStockItemsCount = 0;
            groupedProductsMap.forEach(group => {
                if (group.quantity > 0 && group.quantity < 20) {
                    lowStockItemsCount++;
                }
            });

            const expiringSoonItemsCount = productsData.filter(p => {
                if (!p.expiryDate) return false;
                const expiry = new Date(p.expiryDate);
                return expiry > now && expiry <= thirtyDaysFromNow;
            }).length;

            const totalStockAlerts = lowStockItemsCount + expiringSoonItemsCount;

            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const itemsDispensedThisMonth = dispensationsData
                .filter(d => new Date(d.date) >= firstDayOfMonth)
                .reduce((total, d) => total + d.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
            
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const firstDayOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
            const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            const itemsDispensedLastMonth = dispensationsData
                .filter(d => new Date(d.date) >= firstDayOfLastMonth && new Date(d.date) <= lastDayOfLastMonth)
                .reduce((total, d) => total + d.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
            
            let monthlyChangePercentage = 0;
            if (itemsDispensedLastMonth > 0) {
                monthlyChangePercentage = ((itemsDispensedThisMonth - itemsDispensedLastMonth) / itemsDispensedLastMonth) * 100;
            } else if (itemsDispensedThisMonth > 0) {
                monthlyChangePercentage = 100;
            }

            const judicialPatients = patientsData.filter(p => p.demandItems?.includes('Itens Judiciais')).length;

            setReportStats({
                itemsDispensedThisMonth,
                monthlyChangePercentage,
                judicialPatients,
                totalStockAlerts,
                lowStockItems: lowStockItemsCount,
                expiringSoonItems: expiringSoonItemsCount,
            });

        } catch (error) {
            console.error("Failed to fetch reports data:", error);
            toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: 'Não foi possível buscar os dados para os relatórios.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);


  const getFilteredData = () => {
    let startDate: Date;
    let endDate: Date;

    if (filterType === 'year') {
        const y = parseInt(year);
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59);
    } else if (filterType === 'range' && date?.from && date?.to) {
        startDate = date.from;
        endDate = date.to;
        endDate.setHours(23, 59, 59, 999);
    } else { // month
        const y = parseInt(year);
        const m = parseInt(month) - 1;
        startDate = new Date(y, m, 1);
        endDate = new Date(y, m + 1, 0, 23, 59, 59);
    }

    const filteredMovements = stockMovements.filter(m => {
        const mDate = new Date(m.date);
        return mDate >= startDate && mDate <= endDate;
    });

    const filteredDispensations = dispensations.filter(d => {
        const dDate = new Date(d.date);
        return dDate >= startDate && dDate <= endDate;
    });

    const filteredOrders = orders.filter(o => {
        const oDate = new Date(o.sentDate);
        return oDate >= startDate && oDate <= endDate;
    });

    return { filteredMovements, filteredDispensations, filteredOrders };
  }

  const openPdfInNewTab = (pdfDataUri: string) => {
    const byteCharacters = atob(pdfDataUri.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  }

  const generatePdf = async (type: keyof GeneratingState, generatorFn: () => Promise<string>) => {
    setIsGenerating(prev => ({ ...prev, [type]: true }));
    try {
        const pdfDataUri = await generatorFn();
        openPdfInNewTab(pdfDataUri);
    } catch (e) {
        console.error(`Failed to generate ${type} PDF`, e);
        toast({ variant: 'destructive', title: 'Erro ao Gerar Relatório', description: 'Não foi possível gerar o PDF.' });
    } finally {
        setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };
  
  const { filteredMovements, filteredDispensations, filteredOrders } = getFilteredData();


  const handleExportComplete = () => generatePdf('complete', () => generateCompleteReportPDF(products, patients, dispensations));
  const handleExportStock = () => generatePdf('stock', () => generateStockReportPDF(products));
  const handleExportExpiry = () => generatePdf('expiry', () => generateExpiryReportPDF(products));
  const handleExportPatient = () => generatePdf('patient', () => generatePatientReportPDF(filteredDispensations));
  const handleExportUnitDispensation = () => generatePdf('unitDispensation', () => generateUnitDispensationReportPDF(filteredOrders, units));
  const handleExportBatch = () => generatePdf('batch', () => generateBatchReportPDF(products));
  const handleExportEntriesAndExits = () => generatePdf('entriesAndExits', () => generateEntriesAndExitsReportPDF(filteredMovements));
  
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

  if (isLoading || !reportStats) {
      return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="w-1/3">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-40" />
                </div>
            </div>
             <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
      )
  }

  return (
     <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div>
                    <h1 className="text-2xl font-bold tracking-tight">Relatórios Gerenciais</h1>
                    <p className="text-muted-foreground">
                        Gere e visualize relatórios de dispensação, estoque e mais.
                    </p>
                    </div>
                     <div className="flex gap-2 flex-wrap">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filtrar por Data
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Filtro de Data</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Selecione o período para os relatórios.
                                        </p>
                                    </div>
                                    <Select value={filterType} onValueChange={setFilterType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="month">Mês/Ano</SelectItem>
                                            <SelectItem value="year">Ano Completo</SelectItem>
                                            <SelectItem value="range">Intervalo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {filterType === 'month' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input type="number" placeholder="Mês" value={month} onChange={e => setMonth(e.target.value)} min="1" max="12" />
                                            <Input type="number" placeholder="Ano" value={year} onChange={e => setYear(e.target.value)} />
                                        </div>
                                    )}
                                    {filterType === 'year' && (
                                        <Input type="number" placeholder="Ano" value={year} onChange={e => setYear(e.target.value)} />
                                    )}
                                    {filterType === 'range' && (
                                        <CalendarPicker
                                            mode="range"
                                            selected={date}
                                            onSelect={setDate}
                                            numberOfMonths={1}
                                        />
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button onClick={handleExportComplete} disabled={isGenerating.complete}>
                            {isGenerating.complete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {isGenerating.complete ? 'Gerando...' : 'Relatório Completo'}
                        </Button>
                    </div>
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
                        <CardTitle className="text-sm font-medium">Pacientes com Demanda Judicial</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportStats.judicialPatients}</div>
                        <p className="text-xs text-muted-foreground">Pacientes recebendo via processo judicial</p>
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
                        Selecione um tipo de relatório para gerar um documento PDF. Relatórios de movimentação serão baseados no filtro de data selecionado.
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
                <CardContent className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/50 rounded-b-lg">
                    {/* <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-4" /> */}
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

    