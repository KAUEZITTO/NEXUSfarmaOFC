
'use client';

import { useMemo } from 'react';
import type { SectorDispensation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DispensationsLogClientPageProps {
    initialDispensations: SectorDispensation[];
}

export function DispensationsLogClientPage({ initialDispensations }: DispensationsLogClientPageProps) {
    
    const groupedByDate = useMemo(() => {
        return initialDispensations.reduce((acc, d) => {
            const date = new Date(d.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(d);
            return acc;
        }, {} as Record<string, SectorDispensation[]>);
    }, [initialDispensations]);

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('-')).getTime();
        const dateB = new Date(b.split('/').reverse().join('-')).getTime();
        return dateB - dateA;
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History /> Registro de Dispensações (Setores)</CardTitle>
                <CardDescription>Visualize o histórico de todas as dispensações realizadas para os setores do hospital.</CardDescription>
            </CardHeader>
            <CardContent>
                {sortedDates.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {sortedDates.map(date => (
                            <AccordionItem key={date} value={date}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-4">
                                        <Calendar className="h-5 w-5"/>
                                        <span className="font-semibold text-lg">{date}</span>
                                        <Badge>{groupedByDate[date].length} dispensações</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 pl-4">
                                        {groupedByDate[date].map(dispensation => (
                                            <Accordion key={dispensation.id} type="single" collapsible>
                                                <AccordionItem value={dispensation.id} className="border-b-0">
                                                    <AccordionTrigger className="p-3 rounded-md bg-muted/50 hover:bg-muted">
                                                        <div className="flex justify-between items-center w-full">
                                                            <div>
                                                                <p className="font-medium">{dispensation.sector}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    às {new Date(dispensation.date).toLocaleTimeString('pt-BR', {timeStyle: 'short'})} por {dispensation.dispensedBy}
                                                                </p>
                                                            </div>
                                                            <Badge variant="secondary">{dispensation.items.reduce((sum, i) => sum + i.quantity, 0)} itens</Badge>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="p-4 border rounded-md mt-2">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Produto</TableHead>
                                                                    <TableHead>Lote</TableHead>
                                                                    <TableHead className="text-right">Qtd.</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {dispensation.items.map(item => (
                                                                    <TableRow key={item.productId}>
                                                                        <TableCell>{item.name}</TableCell>
                                                                        <TableCell>{item.batch}</TableCell>
                                                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center text-muted-foreground py-10">Nenhuma dispensação para setores encontrada.</div>
                )}
            </CardContent>
        </Card>
    );
}
