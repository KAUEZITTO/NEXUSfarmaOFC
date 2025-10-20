
'use server';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Product, Patient, Dispensation, Order, Unit, StockMovement, OrderStatus } from './types';
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
    
    // Get logos as base64 strings
    const prefLogoBase64 = await getImageAsBase64('SMS-PREF.png');
    const nexusLogoBase64 = await getImageAsBase64('NEXUSnv.png');
    const cafLogoBase64 = await getImageAsBase64('CAF.png');

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const margin = 15;

    // Left Column: Prefeitura
    if (prefLogoBase64) {
        doc.addImage(prefLogoBase64, 'PNG', margin, 12, 25, 25);
    }
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PREFEITURA MUNICIPAL DE IGARAPÉ-AÇU', margin, 40);
    doc.text('SECRETARIA MUNICIPAL DE SAÚDE', margin, 44);

     // Center Column: NexusFarma
    if (nexusLogoBase64) {
        doc.addImage(nexusLogoBase64, 'PNG', pageWidth / 2 - 20, 12, 40, 15);
    }

    // Right Column: CAF
    if (cafLogoBase64) {
        doc.addImage(cafLogoBase64, 'PNG', pageWidth - margin - 25, 12, 25, 25);
    }
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CAF - CENTRO DE ABASTECIMENTO', pageWidth - margin, 40, { align: 'right' });
    doc.text('FARMACÊUTICO', pageWidth - margin, 44, { align: 'right' });
    
    // Add title & subtitle
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


    // Add separator line
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

type PdfActionResult = Promise<{ success: boolean; data?: string; error?: string }>;

export async function generateCompleteReportPDF(
    { products, patients, dispensations, orders, period }: { products: Product[], patients: Patient[], dispensations: Dispensation[], orders: Order[], period: string }
): PdfActionResult {
  try {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const startY = 85;

    await addHeader(doc, 'Relatório Gerencial Completo', period);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Período', 15, 80);

    const summaryData = [
      ['Total de Produtos em Inventário (Geral):', products.length.toString()],
      ['Total de Itens em Estoque (Geral):', products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString('pt-BR')],
      ['Produtos com Baixo Estoque (Geral):', products.filter(p => p.status === 'Baixo Estoque').length.toString()],
      ['Total de Pacientes Ativos (Geral):', patients.filter(p => p.status === 'Ativo').length.toString()],
      ['Total de Dispensações no Período:', dispensations.length.toLocaleString('pt-BR')],
      ['Total de Pedidos para Unidades no Período:', orders.length.toLocaleString('pt-BR')],
    ];

    doc.autoTable({
      startY: 85,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] },
      didDrawPage: (data) => {}
    });

    const drawTableOrEmpty = async (title: string, head: any[], body: any[][], options: any) => {
      doc.addPage();
      await addHeader(doc, title, period);
      if (body.length > 0) {
          doc.autoTable({
              startY: startY,
              head: head,
              body: body,
              ...options
          });
      } else {
          doc.text('Nenhum dado para exibir neste período.', 15, startY);
      }
    }

    await drawTableOrEmpty(
      'Relatório de Inventário (Estoque Atual)',
      [['Nome', 'Categoria', 'Qtd', 'Status', 'Validade', 'Lote']],
      products.map(p => [
          p.name,
          p.category,
          p.quantity.toString(),
          p.status,
          p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR') : 'N/A',
          p.batch || 'N/A'
      ]),
      { theme: 'grid', headStyles: { fillColor: [37, 99, 235] } }
    );

    await drawTableOrEmpty(
      'Relatório de Dispensações no Período',
      [['Data', 'Paciente', 'CPF', 'Nº de Itens']],
       dispensations.map(d => [
          new Date(d.date).toLocaleDateString('pt-BR', { timeZone: 'UTC'}),
          d.patient.name,
          d.patient.cpf,
          d.items.reduce((sum, item) => sum + item.quantity, 0).toString()
      ]),
      { theme: 'grid', headStyles: { fillColor: [107, 33, 168] } }
    );

    await drawTableOrEmpty(
      'Relatório de Pedidos no Período',
      [['Data', 'Unidade', 'Tipo', 'Nº de Itens', 'Status']],
       orders.map(o => [
          new Date(o.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}),
          o.unitName,
          o.orderType,
          o.itemCount.toString(),
          o.status
      ]),
      { theme: 'grid', headStyles: { fillColor: [13, 148, 136] } }
    );
    
    await drawTableOrEmpty(
      'Relatório de Pacientes Ativos (Geral)',
      [['Nome', 'CPF', 'CNS', 'Unidade', 'Demandas']],
      patients.filter(p => p.status === 'Ativo').map(p => [
          p.name,
          p.cpf,
          p.cns,
          p.unitName || 'N/A',
          p.demandItems?.join(', ') || 'N/A'
      ]),
      { theme: 'grid', headStyles: { fillColor: [192, 38, 211] } }
    );

    addFooter(doc);

    return { success: true, data: doc.output('datauristring') };
  } catch (error) {
    console.error('Error generating complete PDF report:', error);
    return { success: false, error: 'Falha ao gerar relatório completo.' };
  }
};

export async function generateStockReportPDF({ products, categoryFilter }: { products: Product[], categoryFilter?: string }): PdfActionResult {
    try {
        const doc = new jsPDF('l') as jsPDFWithAutoTable;
        const title = categoryFilter && categoryFilter !== 'all' ? `Relatório de Estoque - ${categoryFilter}` : 'Relatório de Estoque Geral';
        await addHeader(doc, title);

        const productsToDisplay = categoryFilter && categoryFilter !== 'all' ? products.filter(p => p.category === categoryFilter) : products;

        doc.autoTable({
            startY: 85,
            head: [['Princípio Ativo', 'Nome Comercial', 'Apresentação', 'Categoria', 'Qtd', 'Status', 'Validade', 'Lote', 'Fabricante', 'Fornecedor']],
            body: productsToDisplay.map(p => [p.name, p.commercialName || 'N/A', p.presentation || 'N/A', p.category, p.quantity.toLocaleString('pt-BR'), p.status, p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A', p.batch || 'N/A', p.manufacturer || 'N/A', p.supplier || 'N/A']),
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
            styles: { fontSize: 8 },
            didDrawPage: async (data) => {
                if (data.pageNumber > 1) {
                    await addHeader(doc, title);
                }
            }
        });

        addFooter(doc);
        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error('Error generating stock PDF report:', error);
        return { success: false, error: 'Falha ao gerar relatório de estoque.' };
    }
}

export async function generateExpiryReportPDF({ products }: { products: Product[] }): PdfActionResult {
    try {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        await addHeader(doc, 'Relatório de Produtos a Vencer');

        const expiringProducts = products
            .filter(p => p.expiryDate)
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        doc.autoTable({
            startY: 85,
            head: [['Nome do Produto', 'Lote', 'Data de Validade', 'Quantidade']],
            body: expiringProducts.map(p => [
                p.name,
                p.batch || 'N/A',
                new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}),
                p.quantity.toString(),
            ]),
            theme: 'grid',
            headStyles: { fillColor: [217, 119, 6] },
            didDrawPage: async (data) => {
                if (data.pageNumber > 1) {
                    await addHeader(doc, 'Relatório de Produtos a Vencer');
                }
            }
        });

        addFooter(doc);
        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error('Error generating expiry PDF report:', error);
        return { success: false, error: 'Falha ao gerar relatório de validade.' };
    }
}

export async function generatePatientReportPDF({ dispensations, period }: { dispensations: Dispensation[], period: string }): PdfActionResult {
    try {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        await addHeader(doc, 'Relatório de Atendimento de Pacientes', period);

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
            startY: 85,
            head: [['Paciente', 'CPF', 'Data da Dispensação', 'Nº de Itens']],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [107, 33, 168] },
            didDrawPage: async (data) => {
                if (data.pageNumber > 1) {
                    await addHeader(doc, 'Relatório de Atendimento de Pacientes', period);
                }
            }
        });

        addFooter(doc);
        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error('Error generating patient PDF report:', error);
        return { success: false, error: 'Falha ao gerar relatório de pacientes.' };
    }
}

export async function generatePatientListReportPDF({ patients }: { patients: Patient[] }): PdfActionResult {
    try {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        await addHeader(doc, 'Relatório de Pacientes Cadastrados');

        const body = patients.map(p => [
            p.name,
            p.cpf,
            p.cns,
            p.status,
            p.demandItems?.join(', ') || 'Nenhuma'
        ]);
        
        doc.autoTable({
            startY: 85,
            head: [['Nome do Paciente', 'CPF', 'CNS', 'Status', 'Demandas']],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [107, 33, 168] },
            columnStyles: {
                4: { cellWidth: 50 }
            },
            didDrawPage: async (data) => {
                if (data.pageNumber > 1) {
                    await addHeader(doc, 'Relatório de Pacientes Cadastrados');
                }
            }
        });

        addFooter(doc);
        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error('Error generating patient list PDF report:', error);
        return { success: false, error: 'Falha ao gerar lista de pacientes.' };
    }
}

export async function generateUnitDispensationReportPDF({ orders, units, period }: { orders: Order[], units: Unit[], period: string }): PdfActionResult {
    try {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        await addHeader(doc, 'Relatório de Dispensação por Unidade', period);

        const unitDataMap = new Map<string, { totalItems: number, orderCount: number, type: string, name: string }>();
        units.forEach(u => unitDataMap.set(u.id, { totalItems: 0, orderCount: 0, type: u.type, name: u.name }));
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
            startY: 85,
            head: [['Nome da Unidade', 'Tipo', 'Total de Pedidos', 'Total de Itens Recebidos']],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [13, 148, 136] },
            didDrawPage: async (data) => {
                if (data.pageNumber > 1) {
                    await addHeader(doc, 'Relatório de Dispensação por Unidade', period);
                }
            }
        });
        
        addFooter(doc);
        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error('Error generating unit dispensation PDF report:', error);
        return { success: false, error: 'Falha ao gerar relatório por unidade.' };
    }
}

export async function generateBatchReportPDF({ products }: { products: Product[] }): PdfActionResult {
    try {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        await addHeader(doc, 'Relatório de Lotes');

        const body = products.map(p => [
            p.name,
            p.batch || 'N/A',
            p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A',
            p.quantity.toString()
        ]);
        
        doc.autoTable({
            startY: 85,
            head: [['Nome do Produto', 'Lote', 'Validade', 'Quantidade']],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [19, 78, 74] },
            didDrawPage: async (data) => {
                if (data.pageNumber > 1) {
                    await addHeader(doc, 'Relatório de Lotes');
                }
            }
        });

        addFooter(doc);
        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error('Error generating batch PDF report:', error);
        return { success: false, error: 'Falha ao gerar relatório de lotes.' };
    }
}


export async function generateEntriesAndExitsReportPDF({ movements, allProducts, period }: { movements: StockMovement[], allProducts: Product[], period: string }): PdfActionResult {
    try {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        await addHeader(doc, 'Relatório de Entradas e Saídas', period);

        const productMap = new Map(allProducts.map(p => [p.id, p]));

        const summary: Record<string, { entries: number, exits: number }> = {};
        
        movements.forEach(m => {
            const product = productMap.get(m.productId);
            const category = product?.category || 'Desconhecida';
            if (!summary[category]) {
                summary[category] = { entries: 0, exits: 0 };
            }
            if (m.type === 'Entrada') {
                summary[category].entries += m.quantityChange;
            } else if (m.type === 'Saída') {
                summary[category].exits += Math.abs(m.quantityChange);
            }
        });

        const summaryBody = Object.entries(summary).map(([category, data]) => [
            category,
            data.entries.toLocaleString('pt-BR'),
            data.exits.toLocaleString('pt-BR')
        ]);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo de Movimentações por Categoria', 20, 80);
        doc.autoTable({
            startY: 85,
            head: [['Categoria', 'Total de Entradas (Itens)', 'Total de Saídas (Itens)']],
            body: summaryBody,
            theme: 'grid',
            headStyles: { fillColor: [107, 114, 128] }, // Gray
        });

        let finalY = (doc as any).lastAutoTable.finalY || 80;
        
        const checkPageBreak = (yOffset: number) => {
            if (finalY + yOffset > doc.internal.pageSize.height - 30) {
                doc.addPage();
                finalY = 85;
            }
        };
        
        const entries = movements.filter(m => m.type === 'Entrada');
        if (entries.length > 0) {
            checkPageBreak(20);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Detalhes de Entradas', 20, finalY + 15);

            const entriesBody = entries.map(m => [
                new Date(m.date).toLocaleString('pt-BR', { timeZone: 'UTC' }),
                m.productName,
                m.reason,
                m.quantityChange.toLocaleString('pt-BR'),
                m.user,
            ]);

            doc.autoTable({
                startY: finalY + 20,
                head: [['Data', 'Produto', 'Motivo', 'Quantidade', 'Usuário']],
                body: entriesBody,
                theme: 'grid',
                headStyles: { fillColor: [22, 163, 74] },
                didDrawPage: async () => await addHeader(doc, 'Relatório de Entradas e Saídas (Continuação)', period)
            });
            finalY = (doc as any).lastAutoTable.finalY;
        }

        const exits = movements.filter(m => m.type === 'Saída');
        if (exits.length > 0) {
            checkPageBreak(20);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Detalhes de Saídas', 20, finalY + 15);

            const exitsBody = exits.map(m => [
                new Date(m.date).toLocaleString('pt-BR', { timeZone: 'UTC' }),
                m.productName,
                m.reason,
                Math.abs(m.quantityChange).toLocaleString('pt-BR'),
                m.user,
            ]);
            
            doc.autoTable({
                startY: finalY + 20,
                head: [['Data', 'Produto', 'Motivo', 'Quantidade', 'Usuário']],
                body: exitsBody,
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38] },
                didDrawPage: async () => await addHeader(doc, 'Relatório de Entradas e Saídas (Continuação)', period)
            });
        }

        addFooter(doc);
        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error('Error generating entries/exits PDF report:', error);
        return { success: false, error: 'Falha ao gerar relatório de entradas e saídas.' };
    }
}

export async function generateOrderStatusReportPDF({ units, lastOrdersMap, status }: { units: Unit[], lastOrdersMap: Map<string, Order>, status: OrderStatus }): PdfActionResult {
    try {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        const title = `Relatório de Unidades: Status "${status}"`;
        await addHeader(doc, title);

        const filteredUnits = units.filter(unit => {
            const lastOrder = lastOrdersMap.get(unit.id);
            return lastOrder?.status === status;
        });

        doc.autoTable({
            startY: 85,
            head: [['Nome da Unidade', 'Tipo', 'Data do Último Pedido', 'Tipo do Pedido']],
            body: filteredUnits.map(unit => {
                const lastOrder = lastOrdersMap.get(unit.id);
                return [
                    unit.name,
                    unit.type,
                    lastOrder ? new Date(lastOrder.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A',
                    lastOrder?.orderType || 'N/A'
                ];
            }),
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            didDrawPage: async (data) => {
                if (data.pageNumber > 1) {
                    await addHeader(doc, title);
                }
            },
        });

        addFooter(doc);
        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error('Error generating order status PDF report:', error);
        return { success: false, error: 'Falha ao gerar relatório de status de pedidos.' };
    }
}
