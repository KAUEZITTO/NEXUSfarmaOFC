
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

const drawHeaderAndFooter = async (doc: jsPDFWithAutoTable, data: any, title: string, subtitle: string | undefined, isHospitalReport: boolean) => {
    const [prefLogo, nexusLogo, cafLogo] = await Promise.all([
        getImageAsBase64('/SMS-PREF.png'),
        getImageAsBase64('/NEXUSnv.png'),
        getImageAsBase64('/CAF.png')
    ]);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const pageNumber = data.pageNumber;
    const totalPages = (doc.internal as any).getNumberOfPages();

    // Header
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    if (isHospitalReport) {
        // --- HOSPITAL HEADER ---
        // Left Block (Pref)
        if (prefLogo) doc.addImage(prefLogo, 'PNG', margin, 15, 20, 20);
        doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text('PREFEITURA MUNICIPAL DE IGARAPÉ-AÇU', margin + 23, 19);
        doc.text('SECRETARIA MUNICIPAL DE SAÚDE', margin + 23, 24);
        doc.setFontSize(8);
        doc.text('Hospital e Maternidade Municipal José Bernardo da Silveira', margin + 23, 29);

        // Right Block (NexusFarma)
        if (nexusLogo) doc.addImage(nexusLogo, 'PNG', pageWidth - margin - 40, 15, 40, 15);
        
    } else {
        // --- CAF HEADER ---
        // Left Block (Pref)
        if (prefLogo) doc.addImage(prefLogo, 'PNG', margin, 15, 20, 20);
        doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text('PREFEITURA MUNICIPAL DE IGARAPÉ-AÇU', margin, 38);
        doc.text('SECRETARIA MUNICIPAL DE SAÚDE', margin, 42);

        // Center Block (NexusFarma)
        if (nexusLogo) doc.addImage(nexusLogo, 'PNG', pageWidth / 2 - 20, 15, 40, 12);
        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text('NEXUS FARMA', pageWidth / 2, 32, { align: 'center' });

        // Right Block (CAF)
        if (cafLogo) doc.addImage(cafLogo, 'PNG', pageWidth - margin - 20, 15, 20, 20);
        doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text('CAF - CENTRO DE ABASTECIMENTO', pageWidth - margin, 38, { align: 'right' });
        doc.text('FARMACÊUTICO', pageWidth - margin, 42, { align: 'right' });
    }
    
    // --- COMMON HEADER ELEMENTS ---
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 50, { align: 'center' });
    
    doc.setFontSize(9); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
    const generatedDate = `Relatório Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    if (subtitle) {
        doc.text(generatedDate, pageWidth / 2, 56, { align: 'center' });
        doc.text(`Período: ${subtitle}`, pageWidth / 2, 60, { align: 'center' });
    } else {
        doc.text(generatedDate, pageWidth / 2, 58, { align: 'center' });
    }
    doc.setLineWidth(0.5);
    doc.line(margin, 68, pageWidth - margin, 68);

    // --- FOOTER ---
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.text('NexusFarma - Sistema de Gestão Farmacêutica', margin, pageHeight - 10);
};

// Overload signature for the main function
export async function generatePdf(
    title: string,
    subtitle: string | undefined,
    bodyOrTableOptions: ((doc: jsPDFWithAutoTable) => void) | object,
    isLandscape?: boolean,
    isHospitalReport?: boolean,
): Promise<{ success: boolean; data?: string; error?: string }>

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

        // Custom function to draw multiple tables or complex layouts
        if (typeof bodyOrTableOptions === 'function') {
             const bodyFn = bodyOrTableOptions;
             // The function itself is responsible for calling doc.autoTable and doc.addPage
             // We use a wrapper to ensure header/footer are drawn on each page.
             // This is complex and requires careful implementation in the calling function.
             // For now, let's assume `autoTable` with `didDrawPage` is the primary method.
             // This path is left as-is, but the standard `autoTable` approach is preferred.
             
             // A better approach for multi-table reports:
             // The bodyFn would just call doc.autoTable multiple times.
             // The `didDrawPage` hook inside each `autoTable` call would handle headers/footers.
             // This is implicitly handled if we *only* use the object-based approach.
             // Let's unify the logic. We will call the function, which will in turn call autoTable with the hook.
             bodyFn(doc);

        } else {
             // Standard path for a single table report
             const tableOptions = bodyOrTableOptions;
             doc.autoTable({
                ...tableOptions,
                startY: startY,
                theme: 'grid',
                pageBreak: 'auto',
                headStyles: {
                    fillColor: tableOptions.headStyles?.fillColor || [41, 128, 185],
                    textColor: 255,
                    fontStyle: 'bold',
                },
                styles: {
                    cellPadding: 2,
                    fontSize: 8,
                    ...tableOptions.styles
                },
                margin: { top: 75 },
                didDrawPage: (data: any) => {
                    drawHeaderAndFooter(doc, data, title, subtitle, isHospitalReport);
                },
             });
        }
        
        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error(`Error generating PDF for "${title}":`, error);
        return { success: false, error: `Falha ao gerar o relatório: ${title}.` };
    }
}
