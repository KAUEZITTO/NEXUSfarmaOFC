'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Download, FileText, Filter, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { generateHospitalStockReportPDF, generateHospitalEntriesAndExitsReportPDF, generateHospitalSectorDispensationReportPDF } from '@/lib/actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type GeneratingState = 'stock' | 'entriesExits' | 'sectorDispensation' | null;

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
};

export function HospitalReportsClientPage() {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState<GeneratingState>(null);
    const [date, setDate] = useState<DateRange | undefined>({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });

    const handleGenerateReport = async (reportType: GeneratingState) => {
        if (!reportType || !date || !date.from || !date.to) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Selecione um período válido.' });
            return;
        }

        setIsGenerating(reportType);

        const period = `${format(date.from, "dd/MM/yyyy")} a ${format(date.to, "dd/MM/yyyy")}`;

        try {
            let result: { success: boolean; data?: string; error?: string; };
            switch (reportType) {
                case 'stock':
                    result = await generateHospitalStockReportPDF();
                    break;
                case 'entriesExits':
                    result = await generateHospitalEntriesAndExitsReportPDF({ startDate: date.from, endDate: date.to, period });
                    break;
                case 'sectorDispensation':
                    result = await generateHospitalSectorDispensationReportPDF({ startDate: date.from, endDate: date.to, period });
                    break;
                default:
                    throw new Error('Tipo de relatório inválido');
            }

            if (result.success && result.data) {
                openPdfInNewTab(result.data);
            } else {
                throw new Error(result.error || 'Falha ao gerar o PDF.');
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erro ao Gerar Relatório', description: (e as Error).message });
        } finally {
            setIsGenerating(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Relatórios da Farmácia Hospitalar</CardTitle>
                        <CardDescription>Gere relatórios específicos do inventário e das operações do hospital.</CardDescription>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Selecione um período</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Button variant="outline" size="lg" className="justify-start h-16" onClick={() => handleGenerateReport('stock')} disabled={!!isGenerating}>
                    {isGenerating === 'stock' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-4 h-5 w-5"/>}
                    <div className="text-left">
                        <p className="font-semibold">Relatório de Estoque</p>
                        <p className="text-xs text-muted-foreground">Posição atual do inventário do hospital.</p>
                    </div>
                </Button>
                 <Button variant="outline" size="lg" className="justify-start h-16" onClick={() => handleGenerateReport('entriesExits')} disabled={!!isGenerating}>
                    {isGenerating === 'entriesExits' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-4 h-5 w-5"/>}
                    <div className="text-left">
                        <p className="font-semibold">Entradas e Saídas</p>
                        <p className="text-xs text-muted-foreground">Movimentações no período selecionado.</p>
                    </div>
                </Button>
                 <Button variant="outline" size="lg" className="justify-start h-16" onClick={() => handleGenerateReport('sectorDispensation')} disabled={!!isGenerating}>
                    {isGenerating === 'sectorDispensation' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-4 h-5 w-5"/>}
                    <div className="text-left">
                        <p className="font-semibold">Dispensação por Setor</p>
                        <p className="text-xs text-muted-foreground">Consumo total de cada setor interno.</p>
                    </div>
                </Button>
            </CardContent>
        </Card>
    );
}
