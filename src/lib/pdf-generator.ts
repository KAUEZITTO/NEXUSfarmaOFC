
'use server';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Product, Patient, Dispensation, Order, Unit, StockMovement } from './types';

// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const addHeader = (doc: jsPDFWithAutoTable, title: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add title
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'bold');
    doc.text('NexusFarma', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(title, pageWidth / 2, 30, { align: 'center' });

    // Add subtitle/date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Relatório Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 37, { align: 'center' });

    // Add separator line
    doc.setLineWidth(0.5);
    doc.line(20, 45, pageWidth - 20, 45);
};

const addFooter = (doc: jsPDFWithAutoTable) => {
    const pageCount = (doc.internal as any).getNumberOfPages();
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
  doc.text('Resumo Geral', 20, 60);

  const summaryData = [
    ['Total de Produtos em Inventário:', products.length.toString()],
    ['Total de Itens em Estoque:', products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString('pt-BR')],
    ['Produtos com Baixo Estoque:', products.filter(p => p.status === 'Baixo Estoque').length.toString()],
    ['Produtos Próximos ao Vencimento (30d):', products.filter(p => p.expiryDate && new Date(p.expiryDate) <= new Date(new Date().setDate(new Date().getDate() + 30))).length.toString()],
    ['Total de Pacientes Ativos:', patients.filter(p => p.status === 'Ativo').length.toString()],
    ['Total de Dispensações Registradas:', dispensations.length.toString()],
  ];

  doc.autoTable({
    startY: 65,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74] },
    didDrawPage: (data) => {
      // Don't add footer on the first pass
    }
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
    startY: 50,
    head: [['Nome', 'Categoria', 'Qtd', 'Status', 'Validade', 'Lote']],
    body: inventoryBody,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    didDrawPage: (data) => {
       addHeader(doc, 'Relatório de Inventário');
    }
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
        p.demandItems?.join(', ') || 'N/A'
  ]);
  
  doc.autoTable({
    startY: 50,
    head: [['Nome', 'CPF', 'CNS', 'Unidade', 'Demandas']],
    body: patientsBody,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    didDrawPage: (data) => {
       addHeader(doc, 'Relatório de Pacientes Ativos');
    }
  });

  addFooter(doc);

  // Return the PDF as a base64 encoded string (data URI)
  return doc.output('datauristring');
};

export const generateStockReportPDF = async (products: Product[]): Promise<string> => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    addHeader(doc, 'Relatório de Estoque Atual');

    const inventoryBody = products.map(p => [
        p.name,
        p.category,
        p.quantity.toString(),
        p.status,
        p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A',
        p.batch || 'N/A'
    ]);

    doc.autoTable({
        startY: 50,
        head: [['Nome', 'Categoria', 'Qtd', 'Status', 'Validade', 'Lote']],
        body: inventoryBody,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                addHeader(doc, 'Relatório de Estoque Atual');
            }
        }
    });

    addFooter(doc);
    return doc.output('datauristring');
};

export const generateExpiryReportPDF = async (products: Product[]): Promise<string> => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    addHeader(doc, 'Relatório de Produtos a Vencer');

    const expiringProducts = products
        .filter(p => p.expiryDate) // Only products with an expiry date
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()); // Sort by soonest to expire

    const body = expiringProducts.map(p => [
        p.name,
        p.batch || 'N/A',
        new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}),
        p.quantity.toString(),
    ]);

    doc.autoTable({
        startY: 50,
        head: [['Nome do Produto', 'Lote', 'Data de Validade', 'Quantidade']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [217, 119, 6] }, // Orange color for warning
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                addHeader(doc, 'Relatório de Produtos a Vencer');
            }
        }
    });

    addFooter(doc);
    return doc.output('datauristring');
};

export const generatePatientReportPDF = async (dispensations: Dispensation[]): Promise<string> => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    addHeader(doc, 'Relatório de Atendimento de Pacientes');

    const body = dispensations.map(d => {
        const totalItems = d.items.reduce((sum, item) => sum + item.quantity, 0);
        return [
            d.patient.name,
            d.patient.cpf,
            new Date(d.date).toLocaleDateString('pt-BR', { timeZone: 'UTC'}),
            totalItems.toString()
        ]
    });

    doc.autoTable({
        startY: 50,
        head: [['Paciente', 'CPF', 'Data da Dispensação', 'Nº de Itens']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [107, 33, 168] }, // Purple color for patients
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                addHeader(doc, 'Relatório de Atendimento de Pacientes');
            }
        }
    });

    addFooter(doc);
    return doc.output('datauristring');
};

export const generateUnitDispensationReportPDF = async (orders: Order[], units: Unit[]): Promise<string> => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    addHeader(doc, 'Relatório de Dispensação por Unidade');

    const unitDataMap = new Map<string, { totalItems: number, orderCount: number, type: string, name: string }>();

    units.forEach(u => {
        unitDataMap.set(u.id, { totalItems: 0, orderCount: 0, type: u.type, name: u.name });
    });

    orders.forEach(order => {
        const unit = unitDataMap.get(order.unitId);
        if (unit) {
            unit.totalItems += order.itemCount;
            unit.orderCount += 1;
        }
    });

    const body = Array.from(unitDataMap.values()).map(u => [
        u.name,
        u.type,
        u.orderCount.toString(),
        u.totalItems.toLocaleString('pt-BR')
    ]);

    doc.autoTable({
        startY: 50,
        head: [['Nome da Unidade', 'Tipo', 'Total de Pedidos', 'Total de Itens Recebidos']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [13, 148, 136] }, // Teal color for units
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                addHeader(doc, 'Relatório de Dispensação por Unidade');
            }
        }
    });
    
    addFooter(doc);
    return doc.output('datauristring');
};

export const generateBatchReportPDF = async (products: Product[]): Promise<string> => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    addHeader(doc, 'Relatório de Lotes');

    const body = products.map(p => [
        p.name,
        p.batch || 'N/A',
        p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A',
        p.quantity.toString()
    ]);
    
    doc.autoTable({
        startY: 50,
        head: [['Nome do Produto', 'Lote', 'Validade', 'Quantidade']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [19, 78, 74] }, // Dark Teal
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                addHeader(doc, 'Relatório de Lotes');
            }
        }
    });

    addFooter(doc);
    return doc.output('datauristring');
};


export const generateEntriesAndExitsReportPDF = async (movements: StockMovement[]): Promise<string> => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    addHeader(doc, 'Relatório de Entradas e Saídas');

    const body = movements.map(m => [
        new Date(m.date).toLocaleString('pt-BR', { timeZone: 'UTC'}),
        m.productName,
        m.type,
        m.reason,
        m.quantityChange.toString(),
        m.quantityAfter.toString(),
        m.user,
    ]);

    doc.autoTable({
        startY: 50,
        head: [['Data', 'Produto', 'Tipo', 'Motivo', 'Alteração', 'Estoque Final', 'Usuário']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [107, 114, 128] }, // Gray
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                addHeader(doc, 'Relatório de Entradas e Saídas');
            }
        }
    });

    addFooter(doc);
    return doc.output('datauristring');
};
