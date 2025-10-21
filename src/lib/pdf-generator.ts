
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
        const fullPath = path.join(process.cwd(), 'public', imagePath);
        const file = await fs.readFile(fullPath);
        return `data:image/png;base64,${file.toString('base64')}`;
    } catch (error) {
        console.error(`Failed to read image at ${imagePath}:`, error);
        return null;
    }
};

const addHeader = async (doc: jsPDFWithAutoTable, title: string, subtitle?: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const prefLogoBase64 = await getImageAsBase64('SMS-PREF.png');
    const nexusLogoBase64 = await getImageAsBase64('NEXUSnv.png');
    const cafLogoBase64 = await getImageAsBase64('CAF.png');
    const margin = 15;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    if (prefLogoBase64) doc.addImage(prefLogoBase64, 'PNG', margin, 12, 25, 25);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PREFEITURA MUNICIPAL DE IGARAPÉ-AÇU', margin, 40);
    doc.text('SECRETARIA MUNICIPAL DE SAÚDE', margin, 44);

    if (nexusLogoBase64) doc.addImage(nexusLogoBase64, 'PNG', pageWidth / 2 - 20, 12, 40, 15);

    if (cafLogoBase64) doc.addImage(cafLogoBase64, 'PNG', pageWidth - margin - 25, 12, 25, 25);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CAF - CENTRO DE ABASTECIMENTO', pageWidth - margin, 40, { align: 'right' });
    doc.text('FARMACÊUTICO', pageWidth - margin, 44, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 58, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    const generatedDate = `Relatório Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    const period = subtitle || '';
    
    if (period) {
        doc.text(generatedDate, pageWidth / 2, 64, { align: 'center' });
        doc.text(`Período: ${period}`, pageWidth / 2, 68, { align: 'center' });
    } else {
        doc.text(generatedDate, pageWidth / 2, 65, { align: 'center' });
    }

    doc.setLineWidth(0.5);
    doc.line(margin, 75, pageWidth - margin, 75);
};

const addFooter = (doc: jsPDFWithAutoTable) => {
    const pageCount = (doc.internal as any).getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
        doc.text('NexusFarma - Sistema de Gestão Farmacêutica', 15, pageHeight - 10);
    }
};

export async function generatePdf(
    title: string,
    subtitle: string | undefined,
    bodyFn: (doc: jsPDFWithAutoTable) => void,
    isLandscape: boolean = false
): Promise<{ success: boolean, data?: string, error?: string }> {
    try {
        const doc = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait' }) as jsPDFWithAutoTable;
        
        // This is a proxy for didDrawPage in autoTable, to add headers to every page
        const originalAddPage = doc.addPage;
        doc.addPage = function (...args) {
            const result = originalAddPage.apply(this, args);
            addHeader(doc, title, subtitle);
            return result;
        };
        
        await addHeader(doc, title, subtitle);
        bodyFn(doc);
        addFooter(doc);

        // Restore original addPage function
        doc.addPage = originalAddPage;

        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error(`Error generating PDF for "${title}":`, error);
        return { success: false, error: `Falha ao gerar o relatório: ${title}.` };
    }
}
