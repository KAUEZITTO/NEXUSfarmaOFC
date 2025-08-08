

'use server';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Product, Patient, Dispensation } from './types';
import { Logo } from '@/components/logo';
import { NEXUS_LOGO_B64, PREF_LOGO_B64, CAF_LOGO_B64 } from './logo-base64';


// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const addHeader = (doc: jsPDFWithAutoTable, title: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add logos
    doc.addImage(PREF_LOGO_B64, 'PNG', 20, 10, 25, 25);
    doc.addImage(NEXUS_LOGO_B64, 'PNG', (pageWidth / 2) - 12.5, 10, 25, 25);
    doc.addImage(CAF_LOGO_B64, 'PNG', pageWidth - 45, 10, 25, 25);
    
    // Add title
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 45, { align: 'center' });

    // Add subtitle/date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Relatório Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 52, { align: 'center' });

    // Add separator line
    doc.setLineWidth(0.5);
    doc.line(20, 60, pageWidth - 20, 60);
};

const addFooter = (doc: jsPDFWithAutoTable) => {
    const pageCount = doc.internal.pages.length - 1; 
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        doc.text('NexusFarma - Sistema de Gestão Farmacêutica', 20, pageHeight - 10);
    }
};

export const generateCompleteReportPDF = async (
    products: Product[],
    patients: Patient[],
    dispensations: Dispensation[]
): Promise<string> => {
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // --- Summary Page ---
  addHeader(doc, 'Relatório Gerencial Completo');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Geral', 20, 75);

  const summaryData = [
    ['Total de Produtos em Inventário:', products.length.toString()],
    ['Total de Itens em Estoque:', products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString('pt-BR')],
    ['Produtos com Baixo Estoque:', products.filter(p => p.status === 'Baixo Estoque').length.toString()],
    ['Produtos Próximos ao Vencimento (30d):', products.filter(p => p.expiryDate && new Date(p.expiryDate) <= new Date(new Date().setDate(new Date().getDate() + 30))).length.toString()],
    ['Total de Pacientes Ativos:', patients.filter(p => p.status === 'Ativo').length.toString()],
    ['Total de Dispensações Registradas:', dispensations.length.toString()],
  ];

  doc.autoTable({
    startY: 80,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74] },
  });


  // --- Inventory Section ---
  doc.addPage();
  addHeader(doc, 'Relatório de Inventário');
  
  const inventoryBody = products.map(p => [
    p.name,
    p.category,
    p.quantity.toString(),
    p.status,
    p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR') : 'N/A',
    p.batch || 'N/A'
  ]);
  
  doc.autoTable({
    startY: 65,
    head: [['Nome', 'Categoria', 'Qtd', 'Status', 'Validade', 'Lote']],
    body: inventoryBody,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  });

  // --- Patients Section ---
  doc.addPage();
  addHeader(doc, 'Relatório de Pacientes Ativos');
  
  const patientsBody = patients
    .filter(p => p.status === 'Ativo')
    .map(p => [
        p.name,
        p.cpf,
        p.cns,
        p.unitName || 'N/A',
        p.mandateType
  ]);
  
  doc.autoTable({
    startY: 65,
    head: [['Nome', 'CPF', 'CNS', 'Unidade', 'Mandado']],
    body: patientsBody,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  });

  addFooter(doc);

  // Return the PDF as a base64 encoded string (data URI)
  return doc.output('datauristring');
};
