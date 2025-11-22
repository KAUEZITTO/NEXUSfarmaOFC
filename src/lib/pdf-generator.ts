
'use server';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const drawHeaderAndFooter = async (doc: jsPDFWithAutoTable, pageNumber: number, totalPages: number, title: string, subtitle: string | undefined, isHospitalReport: boolean) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // --- TEXT-ONLY, CENTERED HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PREFEITURA MUNICIPAL DE IGARAPÉ-AÇU', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('SECRETARIA MUNICIPAL DE SAÚDE', pageWidth / 2, 26, { align: 'center' });

    doc.setFontSize(8);
    if (isHospitalReport) {
        doc.text('Hospital e Maternidade Municipal José Bernardo da Silveira', pageWidth / 2, 31, { align: 'center' });
    } else {
        doc.text('CAF - Centro de Abastecimento Farmacêutico', pageWidth / 2, 31, { align: 'center' });
    }
    
    // --- REPORT TITLE ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 50, { align: 'center' });
    
    // --- SUBTITLE & DATE ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const generatedDate = `Relatório Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    if (subtitle) {
        doc.text(`Período: ${subtitle}`, pageWidth / 2, 56, { align: 'center' });
        doc.text(generatedDate, pageWidth / 2, 60, { align: 'center' });
    } else {
        doc.text(generatedDate, pageWidth / 2, 58, { align: 'center' });
    }
    doc.setLineWidth(0.5);
    doc.line(margin, 68, pageWidth - margin, 68);

    // --- FOOTER ---
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.text('NexusFarma - Sistema de Gestão Farmacêutica', margin, pageHeight - 10);
};

// Overload signature for the main function
export async function generatePdf(
    title: string,
    subtitle: string | undefined,
    bodyOrTableOptions: ((doc: jsPDFWithAutoTable) => void) | any, // Simplified for internal use
    isLandscape?: boolean,
    isHospitalReport?: boolean,
): PdfActionResult

export async function generatePdf(
    title: string,
    subtitle: string | undefined,
    bodyOrTableOptions: any,
    isLandscape: boolean = false,
    isHospitalReport: boolean = false,
): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const doc = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait' }) as jsPDFWithAutoTable;
        const startY = 85;
        
        // Render the body first to know the total number of pages
        if (typeof bodyOrTableOptions === 'function') {
             const bodyFn = bodyOrTableOptions;
             bodyFn(doc);
        } else {
             doc.autoTable({
                ...bodyOrTableOptions,
                startY: startY,
                theme: 'grid',
                pageBreak: 'auto',
                headStyles: {
                    fillColor: bodyOrTableOptions.headStyles?.fillColor || [41, 128, 185],
                    textColor: 255,
                    fontStyle: 'bold',
                },
                styles: {
                    cellPadding: 2,
                    fontSize: 8,
                    ...bodyOrTableOptions.styles
                },
                margin: { top: 75 },
             });
        }
        
        const pageCount = (doc.internal as any).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            await drawHeaderAndFooter(doc, i, pageCount, title, subtitle, isHospitalReport);
        }
        
        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error(`Error generating PDF for "${title}":`, error);
        return { success: false, error: `Falha ao gerar o relatório: ${title}.` };
    }
}

type PdfActionResult = Promise<{ success: boolean; data?: string; error?: string }>;
