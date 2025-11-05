

'use server';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { promises as fs } from 'fs';
import path from 'path';

// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

// Helper function to get image as base64
const getImageAsBase64 = async (imagePath: string): Promise<string | null> => {
    try {
        const fullPath = path.resolve(process.cwd(), 'public', imagePath.startsWith('/') ? imagePath.substring(1) : imagePath);
        const file = await fs.readFile(fullPath);
        return `data:image/png;base64,${file.toString('base64')}`;
    } catch (error) {
        console.error(`Failed to read image at ${imagePath}:`, error);
        return null;
    }
};

const addFooter = (doc: jsPDFWithAutoTable, pageNumber: number, totalPages: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    doc.text('NexusFarma - Sistema de Gestão Farmacêutica', 15, pageHeight - 10);
};

// Overload signature for the main function
export async function generatePdf(
    title: string,
    subtitle: string | undefined,
    bodyOrTableOptions: ((doc: jsPDFWithAutoTable) => void) | object,
    isLandscape?: boolean
): PdfActionResult;


export async function generatePdf(
    title: string,
    subtitle: string | undefined,
    bodyOrTableOptions: any,
    isLandscape: boolean = false
): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const doc = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait' }) as jsPDFWithAutoTable;
        
        const [prefLogo, nexusLogo, cafLogo] = await Promise.all([
            getImageAsBase64('/SMS-PREF.png'),
            getImageAsBase64('/NEXUSnv.png'),
            getImageAsBase64('/CAF.png')
        ]);

        const drawHeader = () => {
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);

            if (prefLogo) doc.addImage(prefLogo, 'PNG', margin, 12, 25, 25);
            doc.setFontSize(7); doc.setFont('helvetica', 'bold');
            doc.text('PREFEITURA MUNICIPAL DE IGARAPÉ-AÇU', margin, 40);
            doc.text('SECRETARIA MUNICIPAL DE SAÚDE', margin, 44);

            doc.setFontSize(10);
            if (nexusLogo) doc.addImage(nexusLogo, 'PNG', pageWidth / 2 - 20, 12, 40, 15);
            doc.text('NexusFarma', pageWidth / 2, 32, { align: 'center' });

            if (cafLogo) doc.addImage(cafLogo, 'PNG', pageWidth - margin - 25, 12, 25, 25);
            doc.setFontSize(7);
            doc.text('CAF - CENTRO DE ABASTECIMENTO', pageWidth - margin, 40, { align: 'right' });
            doc.text('FARMACÊUTICO', pageWidth - margin, 44, { align: 'right' });
            
            doc.setFontSize(14); doc.setFont('helvetica', 'bold');
            doc.text(title, pageWidth / 2, 58, { align: 'center' });
            
            doc.setFontSize(9); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
            const generatedDate = `Relatório Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
            if (subtitle) {
                doc.text(generatedDate, pageWidth / 2, 64, { align: 'center' });
                doc.text(`Período: ${subtitle}`, pageWidth / 2, 68, { align: 'center' });
            } else {
                doc.text(generatedDate, pageWidth / 2, 65, { align: 'center' });
            }
            doc.setLineWidth(0.5);
            doc.line(margin, 75, pageWidth - margin, 75);
        }

        if (typeof bodyOrTableOptions === 'function') {
            const bodyFn = bodyOrTableOptions;
            bodyFn(doc); // Generate all content and pages first

            const pageCount = (doc.internal as any).getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                drawHeader();
                addFooter(doc, i, pageCount);
            }
        } else {
            const tableOptions = bodyOrTableOptions;
            doc.autoTable({
                ...tableOptions,
                startY: 85,
                theme: 'grid',
                didDrawPage: (data: any) => {
                    drawHeader();
                    const pageCount = (doc.internal as any).getNumberOfPages();
                    addFooter(doc, data.pageNumber, pageCount);
                },
            });
        }

        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error(`Error generating PDF for "${title}":`, error);
        return { success: false, error: `Falha ao gerar o relatório: ${title}.` };
    }
}
