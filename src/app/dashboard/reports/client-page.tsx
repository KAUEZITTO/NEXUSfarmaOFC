
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, BarChart2, Package, Users, AlertTriangle, Sparkles, Filter } from "lucide-react";
import { generateCompleteReportPDF, generateStockReportPDF, generateExpiryReportPDF, generatePatientReportPDF, generateUnitDispensationReportPDF, generateBatchReportPDF, generateEntriesAndExitsReportPDF, generatePatientListReportPDF, generateOrderStatusReportPDF } from "@/lib/pdf-generator";
import { useState } from "react";
import type { Product, Patient, Dispensation, Unit, Order, StockMovement, PatientDemandItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { MonthlyConsumptionChart } from "@/components/dashboard/monthly-consumption-chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { addDays, format } from "date-fns";

type GeneratingState = {
    complete: boolean;
    stock: boolean;
    expiry: boolean;
    patient: boolean;
    patientList: boolean;
    unitDispensation: boolean;
    entriesAndExits: boolean;
    batch: boolean;
    orderStatusAttended: boolean;
    orderStatusNotAttended: boolean;
    orderStatusInAnalysis: boolean;
}

interface ReportStats {
    itemsDispensedThisMonth: number;
    monthlyChangePercentage: number;
    judicialPatients: number;
    totalStockAlerts: number;
    lowStockItems: number;
    expiringSoonItems: number;
}

interface ReportsClientPageProps {
    initialProducts: Product[];
    initialPatients: Patient[];
    initialDispensations: Dispensation[];
    initialUnits: Unit[];
    initialOrders: Order[];
    initialStockMovements: StockMovement[];
}

const productCategories: Product['category'][] = ['Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)'];

const patientDemandItems: PatientDemandItem[] = ['Fraldas', 'Insulinas Análogas', 'Tiras de Glicemia', 'Itens Judiciais', 'Imunoglobulina', 'Fórmulas', 'Medicamentos/Materiais Comprados', 'Materiais Técnicos (Acamados)'];


function calculateStats(products: Product[], patients: Patient[], dispensations: Dispensation[]): ReportStats {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const groupedProductsMap = new Map<string, { quantity: number }>();
    products.forEach(p => {
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

    const expiringSoonItemsCount = products.filter(p => {
        if (!p.expiryDate) return false;
        const expiry = new Date(p.expiryDate);
        return expiry > now && expiry <= thirtyDaysFromNow;
    }).length;

    const totalStockAlerts = lowStockItemsCount + expiringSoonItemsCount;

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const itemsDispensedThisMonth = dispensations
        .filter(d => new Date(d.date) >= firstDayOfMonth)
        .reduce((total, d) => total + d.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0), 0);
    
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const itemsDispensedLastMonth = dispensations
        .filter(d => new Date(d.date) >= firstDayOfLastMonth && new Date(d.date) <= lastDayOfLastMonth)
        .reduce((total, d) => total + d.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0), 0);
    
    let monthlyChangePercentage = 0;
    if (itemsDispensedLastMonth > 0) {
        monthlyChangePercentage = ((itemsDispensedThisMonth - itemsDispensedLastMonth) / itemsDispensedLastMonth) * 100;
    } else if (itemsDispensedThisMonth > 0) {
        monthlyChangePercentage = 100;
    }

    const judicialPatients = patients.filter(p => p.demandItems?.includes('Itens Judiciais')).length;

    return {
        itemsDispensedThisMonth,
        monthlyChangePercentage,
        judicialPatients,
        totalStockAlerts,
        lowStockItems: lowStockItemsCount,
        expiringSoonItems: expiringSoonItemsCount,
    };
}


export function ReportsClientPage({
    initialProducts,
    initialPatients,
    initialDispensations,
    initialUnits,
    initialOrders,
    initialStockMovements,
}: ReportsClientPageProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<GeneratingState>({
    complete: false, stock: false, expiry: false, patient: false, 
    patientList: false, unitDispensation: false, entriesAndExits: false, batch: false,
    orderStatusAttended: false, orderStatusNotAttended: false, orderStatusInAnalysis: false
  });

  const reportStats = calculateStats(initialProducts, initialPatients, initialDispensations);

  // Filter states
  const [filterType, setFilterType] = useState('month');
  const [date, setDate] = useState<DateRange | undefined>({ from: new Date(), to: addDays(new Date(), 0) });
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [stockCategoryFilter, setStockCategoryFilter] = useState('all');
  const [patientCategoryFilter, setPatientCategoryFilter] = useState('all');


  const getPeriodString = (): string => {
    if (filterType === 'year') {
        return `Ano de ${year}`;
    } else if (filterType === 'range' && date?.from && date?.to) {
        return `de ${format(date.from, "dd/MM/yy")} a ${format(date.to, "dd/MM/yy")}`;
    } else { // month
        const y = parseInt(year);
        const m = parseInt(month) - 1;
        const dateForMonth = new Date(y, m);
        return dateForMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    }
  }

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

    const filteredMovements = initialStockMovements.filter(m => {
        const mDate = new Date(m.date);
        return mDate >= startDate && mDate <= endDate;
    });

    const filteredDispensations = initialDispensations.filter(d => {
        const dDate = new Date(d.date);
        return dDate >= startDate && dDate <= endDate;
    });

    const filteredOrders = initialOrders.filter(o => {
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
  const periodString = getPeriodString();
  
  const lastOrdersMap = new Map<string, Order>();
  initialOrders.forEach(order => {
      if (!lastOrdersMap.has(order.unitId) || new Date(order.sentDate) > new Date(lastOrdersMap.get(order.unitId)!.sentDate)) {
        lastOrdersMap.set(order.unitId, order);
      }
  });


  const handleExportComplete = () => generatePdf('complete', () => generateCompleteReportPDF(initialProducts, initialPatients, filteredDispensations, filteredOrders, periodString));
  const handleExportStock = () => generatePdf('stock', () => generateStockReportPDF(initialProducts, stockCategoryFilter));
  const handleExportExpiry = () => generatePdf('expiry', () => generateExpiryReportPDF(initialProducts));
  const handleExportPatient = () => {
    const dispensationsForReport = patientCategoryFilter === 'all'
        ? filteredDispensations
        : filteredDispensations.filter(d => d.patient.demandItems?.includes(patientCategoryFilter as PatientDemandItem));
    
    generatePdf('patient', () => generatePatientReportPDF(dispensationsForReport, periodString));
  };
  const handleExportPatientList = () => generatePdf('patientList', () => generatePatientListReportPDF(initialPatients));
  const handleExportUnitDispensation = () => generatePdf('unitDispensation', () => generateUnitDispensationReportPDF(filteredOrders, initialUnits, periodString));
  const handleExportBatch = () => generatePdf('batch', () => generateBatchReportPDF(initialProducts));
  const handleExportEntriesAndExits = () => generatePdf('entriesAndExits', () => generateEntriesAndExitsReportPDF(filteredMovements, initialProducts, periodString));
  const handleExportOrderStatusAttended = () => generatePdf('orderStatusAttended', () => generateOrderStatusReportPDF(initialUnits, lastOrdersMap, 'Atendido'));
  const handleExportOrderStatusNotAttended = () => generatePdf('orderStatusNotAttended', () => generateOrderStatusReportPDF(initialUnits, lastOrdersMap, 'Não atendido'));
  const handleExportOrderStatusInAnalysis = () => generatePdf('orderStatusInAnalysis', () => generateOrderStatusReportPDF(initialUnits, lastOrdersMap, 'Em análise'));
  
  const reportHandlers: { name: string; handler: () => void; key: keyof GeneratingState, filter?: React.ReactNode, colSpan?: 'sm:col-span-2' | 'sm:col-span-3' }[] = [
    { name: "Dispensação por Unidade", handler: handleExportUnitDispensation, key: 'unitDispensation' },
    { name: "Estoque Atual", handler: handleExportStock, key: 'stock', filter: (
        <Select value={stockCategoryFilter} onValueChange={setStockCategoryFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {productCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
        </Select>
    ) },
    { name: "Produtos a Vencer", handler: handleExportExpiry, key: 'expiry' },
    { name: "Atendimento de Pacientes", handler: handleExportPatient, key: 'patient', filter: (
        <Select value={patientCategoryFilter} onValueChange={setPatientCategoryFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos os Pacientes</SelectItem>
                {patientDemandItems.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
        </Select>
    )},
    { name: "Entradas e Saídas", handler: handleExportEntriesAndExits, key: 'entriesAndExits' },
    { name: "Relatório de Lotes", handler: handleExportBatch, key: 'batch' },
    { name: "Lista de Pacientes", handler: handleExportPatientList, key: 'patientList' },
    { name: "Unidades Atendidas", handler: handleExportOrderStatusAttended, key: 'orderStatusAttended' },
    { name: "Unidades Não Atendidas", handler: handleExportOrderStatusNotAttended, key: 'orderStatusNotAttended' },
    { name: "Unidades em Análise", handler: handleExportOrderStatusInAnalysis, key: 'orderStatusInAnalysis' },
  ];

  return (
     <div className="space-y-6">
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
                Selecione um tipo de relatório para gerar um documento PDF. Alguns relatórios são afetados pelo filtro de data.
            </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
                {reportHandlers.map(({ name, handler, key, filter }) => {
                    const isGen = isGenerating[key];
                    return (
                        <div key={name} className="space-y-2">
                             <Button 
                                variant="outline" 
                                className="justify-start w-full"
                                onClick={handler}
                                disabled={isGen}
                            >
                                {isGen ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                {isGen ? 'Gerando...' : name}
                            </Button>
                            {filter && <div className="px-1">{filter}</div>}
                        </div>
                    )
                })}
            </CardContent>
        </Card>
           
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
             <MonthlyConsumptionChart dispensations={initialDispensations} />
          </CardContent>
        </Card>
    </div>
  )
}
    

    

    