
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Filter } from "lucide-react";
import { generateHospitalStockReportPDF, generateHospitalEntriesAndExitsReportPDF, generateHospitalSectorDispensationReportPDF } from "@/lib/actions";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { addDays, format } from "date-fns";
import { useSession } from "next-auth/react";

type GeneratingState = {
    stock: boolean;
    entriesAndExits: boolean;
    sectorDispensation: boolean;
}

export default function HospitalReportsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<GeneratingState>({ stock: false, entriesAndExits: false, sectorDispensation: false });

  // Filter states
  const [filterType, setFilterType] = useState('month');
  const [date, setDate] = useState<DateRange | undefined>({ from: new Date(), to: addDays(new Date(), 0) });
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const getPeriod = (): { startDate: Date, endDate: Date, periodString: string } => {
    let startDate: Date;
    let endDate: Date;
    let periodString: string;

    if (filterType === 'year') {
        const y = parseInt(year);
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59);
        periodString = `Ano de ${year}`;
    } else if (filterType === 'range' && date?.from && date?.to) {
        startDate = date.from;
        endDate = date.to;
        endDate.setHours(23, 59, 59, 999);
        periodString = `de ${format(date.from, "dd/MM/yy")} a ${format(date.to, "dd/MM/yy")}`;
    } else { // month
        const y = parseInt(year);
        const m = parseInt(month) - 1;
        startDate = new Date(y, m, 1);
        endDate = new Date(y, m + 1, 0, 23, 59, 59);
        const dateForMonth = new Date(y, m);
        periodString = dateForMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    }
    return { startDate, endDate, periodString };
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

  const handlePdfAction = async (type: keyof GeneratingState, action: () => Promise<{success: boolean; data?: string; error?: string}>) => {
    setIsGenerating(prev => ({ ...prev, [type]: true }));
    try {
        const result = await action();
        if (result.success && result.data) {
          openPdfInNewTab(result.data);
        } else {
          throw new Error(result.error || 'A resposta da Server Action não continha dados.');
        }
    } catch (e) {
        console.error(`Failed to generate ${type} PDF`, e);
        toast({ variant: 'destructive', title: 'Erro ao Gerar Relatório', description: (e as Error).message });
    } finally {
        setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  const { startDate, endDate, periodString } = getPeriod();
  
  const reportHandlers = [
    { name: "Estoque do Hospital", handler: () => handlePdfAction('stock', () => generateHospitalStockReportPDF()), key: 'stock' },
    { name: "Entradas e Saídas do Hospital", handler: () => handlePdfAction('entriesAndExits', () => generateHospitalEntriesAndExitsReportPDF({ startDate, endDate, period: periodString })), key: 'entriesAndExits' },
    { name: "Dispensação por Setor", handler: () => handlePdfAction('sectorDispensation', () => generateHospitalSectorDispensationReportPDF({ startDate, endDate, period: periodString })), key: 'sectorDispensation' },
  ];

  // Acesso permitido se a localização for 'Hospital' OU se o usuário for Coordenador
  if (session?.user?.location !== 'Hospital' && session?.user?.subRole !== 'Coordenador') {
      return null;
  }

  return (
     <div className="space-y-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
            <div>
            <h1 className="text-2xl font-bold tracking-tight">Relatórios da Farmácia Hospitalar</h1>
            <p className="text-muted-foreground">
                Gere relatórios de estoque, movimentações e dispensações internas.
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
            </div>
        </div>

        <Card>
            <CardHeader>
            <CardTitle>Gerar Relatórios Específicos</CardTitle>
            <CardDescription>
                Selecione um tipo de relatório para gerar um documento PDF em formato paisagem.
            </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
                {reportHandlers.map(({ name, handler, key }) => {
                    const isGen = isGenerating[key as keyof GeneratingState];
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
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    </div>
  )
}

    