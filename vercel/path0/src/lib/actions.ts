
'use server';

import { revalidatePath } from 'next/cache';
import { readData, writeData, getKnowledgeBase, getAllUsers, getUserByEmailFromDb, getPatients as getPatientsFromDb, getProducts as getProductsFromDb } from './data';
import type { User, Product, Unit, Patient, Order, OrderItem, Dispensation, DispensationItem, StockMovement, PatientStatus, Role, SubRole, AccessLevel, OrderType, PatientFile, OrderStatus } from './types';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { promises as fs } from 'fs';
import path from 'path';

// --- PDF GENERATION LOGIC ---

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

// --- PDF GENERATION SERVER ACTIONS ---

type PdfActionResult = Promise<{ success: boolean; data?: string; error?: string }>;

export async function generateCompleteReportPDF(
    { products, patients, dispensations, orders, period }: { products: Product[], patients: Patient[], dispensations: Dispensation[], orders: Order[], period: string }
): PdfActionResult {
  try {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const startY = 85;

    // --- Summary Page ---
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
    });

    const drawTableOrEmpty = async (title: string, head: any[], body: any[][], options: any) => {
      doc.addPage();
      await addHeader(doc, title, period);
      if (body.length > 0) {
          doc.autoTable({ startY, head, body, ...options });
      } else {
          doc.text('Nenhum dado para exibir neste período.', 15, startY);
      }
    }

    await drawTableOrEmpty('Relatório de Inventário (Estoque Atual)', [['Nome', 'Categoria', 'Qtd', 'Status', 'Validade', 'Lote']], products.map(p => [ p.name, p.category, p.quantity.toString(), p.status, p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR') : 'N/A', p.batch || 'N/A' ]), { theme: 'grid', headStyles: { fillColor: [37, 99, 235] } });
    await drawTableOrEmpty('Relatório de Dispensações no Período', [['Data', 'Paciente', 'CPF', 'Nº de Itens']], dispensations.map(d => [ new Date(d.date).toLocaleDateString('pt-BR', { timeZone: 'UTC'}), d.patient.name, d.patient.cpf, d.items.reduce((sum, item) => sum + item.quantity, 0).toString() ]), { theme: 'grid', headStyles: { fillColor: [107, 33, 168] } });
    await drawTableOrEmpty('Relatório de Pedidos no Período', [['Data', 'Unidade', 'Tipo', 'Nº de Itens', 'Status']], orders.map(o => [ new Date(o.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}), o.unitName, o.orderType, o.itemCount.toString(), o.status ]), { theme: 'grid', headStyles: { fillColor: [13, 148, 136] } });
    await drawTableOrEmpty('Relatório de Pacientes Ativos (Geral)', [['Nome', 'CPF', 'CNS', 'Unidade', 'Demandas']], patients.filter(p => p.status === 'Ativo').map(p => [ p.name, p.cpf, p.cns, p.unitName || 'N/A', p.demandItems?.join(', ') || 'N/A' ]), { theme: 'grid', headStyles: { fillColor: [192, 38, 211] } });
    
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

        const expiringProducts = products.filter(p => p.expiryDate).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        doc.autoTable({
            startY: 85,
            head: [['Nome do Produto', 'Lote', 'Data de Validade', 'Quantidade']],
            body: expiringProducts.map(p => [p.name, p.batch || 'N/A', new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}), p.quantity.toString()]),
            theme: 'grid',
            headStyles: { fillColor: [217, 119, 6] },
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

        doc.autoTable({
            startY: 85,
            head: [['Paciente', 'CPF', 'Data da Dispensação', 'Nº de Itens']],
            body: dispensations.map(d => {
                const totalItems = d.items.reduce((sum, item) => sum + item.quantity, 0);
                return [d.patient.name, d.patient.cpf, new Date(d.date).toLocaleDateString('pt-BR', { timeZone: 'UTC'}), totalItems.toString()]
            }),
            theme: 'grid',
            headStyles: { fillColor: [107, 33, 168] },
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

        doc.autoTable({
            startY: 85,
            head: [['Nome do Paciente', 'CPF', 'CNS', 'Status', 'Demandas']],
            body: patients.map(p => [p.name, p.cpf, p.cns, p.status, p.demandItems?.join(', ') || 'Nenhuma']),
            theme: 'grid',
            headStyles: { fillColor: [107, 33, 168] },
            columnStyles: { 4: { cellWidth: 50 } },
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

        doc.autoTable({
            startY: 85,
            head: [['Nome da Unidade', 'Tipo', 'Total de Pedidos', 'Total de Itens Recebidos']],
            body: Array.from(unitDataMap.values()).map(u => [u.name, u.type, u.orderCount.toString(), u.totalItems.toLocaleString('pt-BR')]),
            theme: 'grid',
            headStyles: { fillColor: [13, 148, 136] },
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

        doc.autoTable({
            startY: 85,
            head: [['Nome do Produto', 'Lote', 'Validade', 'Quantidade']],
            body: products.map(p => [p.name, p.batch || 'N/A', p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A', p.quantity.toString()]),
            theme: 'grid',
            headStyles: { fillColor: [19, 78, 74] },
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

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo de Movimentações por Categoria', 20, 80);
        doc.autoTable({
            startY: 85,
            head: [['Categoria', 'Total de Entradas (Itens)', 'Total de Saídas (Itens)']],
            body: Object.entries(summary).map(([category, data]) => [category, data.entries.toLocaleString('pt-BR'), data.exits.toLocaleString('pt-BR')]),
            theme: 'grid',
            headStyles: { fillColor: [107, 114, 128] },
        });

        let finalY = (doc as any).lastAutoTable.finalY || 80;
        const checkPageBreak = (yOffset: number) => {
            if (finalY + yOffset > doc.internal.pageSize.height - 30) { doc.addPage(); finalY = 85; }
        };

        const entries = movements.filter(m => m.type === 'Entrada');
        if (entries.length > 0) {
            checkPageBreak(20);
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('Detalhes de Entradas', 20, finalY + 15);
            doc.autoTable({ startY: finalY + 20, head: [['Data', 'Produto', 'Motivo', 'Quantidade', 'Usuário']], body: entries.map(m => [ new Date(m.date).toLocaleString('pt-BR', { timeZone: 'UTC' }), m.productName, m.reason, m.quantityChange.toLocaleString('pt-BR'), m.user ]), theme: 'grid', headStyles: { fillColor: [22, 163, 74] } });
            finalY = (doc as any).lastAutoTable.finalY;
        }

        const exits = movements.filter(m => m.type === 'Saída');
        if (exits.length > 0) {
            checkPageBreak(20);
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('Detalhes de Saídas', 20, finalY + 15);
            doc.autoTable({ startY: finalY + 20, head: [['Data', 'Produto', 'Motivo', 'Quantidade', 'Usuário']], body: exits.map(m => [ new Date(m.date).toLocaleString('pt-BR', { timeZone: 'UTC' }), m.productName, m.reason, Math.abs(m.quantityChange).toLocaleString('pt-BR'), m.user ]), theme: 'grid', headStyles: { fillColor: [220, 38, 38] } });
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
                return [unit.name, unit.type, lastOrder ? new Date(lastOrder.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A', lastOrder?.orderType || 'N/A'];
            }),
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
        });

        addFooter(doc);
        return { success: true, data: doc.output('datauristring') };
    } catch (error) {
        console.error('Error generating order status PDF report:', error);
        return { success: false, error: 'Falha ao gerar relatório de status de pedidos.' };
    }
}


// --- ACTIONS EXPOSED TO CLIENT ---

// --- UTILITIES ---
const generateId = (prefix: string) => `${prefix}_${new Date().getTime()}_${Math.random().toString(36).substring(2, 8)}`;
const generateNumericId = (): string => {
    const timestamp = Date.now().toString(); // e.g., "1678886400000"
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return (timestamp.slice(-3) + random).padStart(6, '0').slice(0, 6);
};


const logStockMovement = async (
  productId: string, 
  productName: string, 
  type: StockMovement['type'], 
  reason: StockMovement['reason'], 
  quantityChange: number, 
  quantityBefore: number,
  movementDate: string,
  relatedId?: string
) => {
  const session = await getServerSession(authOptions);
  const movements = await readData<StockMovement>('stockMovements');
  const userEmail = session?.user?.name || 'Sistema';

  const newMovement: StockMovement = {
    id: generateId('mov'),
    productId,
    productName,
    type,
    reason,
    quantityChange,
    quantityBefore,
    quantityAfter: quantityBefore + quantityChange,
    date: movementDate,
    user: userEmail,
    relatedId
  };
  await writeData('stockMovements', [newMovement, ...movements]);
};


// --- PRODUCT ACTIONS ---
export async function addProduct(productData: Omit<Product, 'id' | 'status'>): Promise<Product> {
    const products = await getProductsFromDb();
    const newProduct: Product = {
        ...productData,
        id: generateId('prod'),
        status: productData.quantity === 0 ? 'Sem Estoque' : productData.quantity < 20 ? 'Baixo Estoque' : 'Em Estoque',
    };
    await writeData('products', [newProduct, ...products]);
    await logStockMovement(newProduct.id, newProduct.name, 'Entrada', 'Entrada Inicial', newProduct.quantity, 0, new Date().toISOString());
    revalidatePath('/dashboard/inventory');
    return newProduct;
}

export async function updateProduct(productId: string, productData: Partial<Omit<Product, 'id' | 'status'>>): Promise<Product> {
    const products = await getProductsFromDb();
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) throw new Error('Produto não encontrado.');

    const originalProduct = products[productIndex];
    const updatedProduct = { 
        ...originalProduct, 
        ...productData, 
        status: productData.quantity === 0 ? 'Sem Estoque' : (productData.quantity ?? originalProduct.quantity) < 20 ? 'Baixo Estoque' : 'Em Estoque' 
    } as Product;
    
    if (productData.quantity !== undefined && productData.quantity !== originalProduct.quantity) {
        const quantityChange = productData.quantity - originalProduct.quantity;
        const type = quantityChange > 0 ? 'Entrada' : 'Saída';
        await logStockMovement(productId, updatedProduct.name, type, 'Ajuste de Inventário', quantityChange, originalProduct.quantity, new Date().toISOString());
    }

    products[productIndex] = updatedProduct;
    await writeData('products', products);
    revalidatePath('/dashboard/inventory');
    revalidatePath(`/labels/${productId}`);
    return updatedProduct;
}

export async function zeroStock(category?: Product['category']): Promise<{ success: boolean, message: string }> {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.name || 'Sistema';
    const products = await getProductsFromDb();
    const movements: StockMovement[] = [];
    const movementDate = new Date().toISOString();
    let count = 0;

    const productsToUpdate = category && category !== 'Todos'
        ? products.filter(p => p.category === category)
        : products;
    
    if (productsToUpdate.length === 0) {
        return { success: false, message: 'Nenhum produto encontrado para a categoria selecionada.' };
    }

    productsToUpdate.forEach(p => {
        if (p.quantity !== 0) {
            const originalQuantity = p.quantity;
            p.quantity = 0;
            p.status = 'Sem Estoque';
            count++;
            
            const newMovement: StockMovement = {
                id: generateId('mov'),
                productId: p.id,
                productName: p.name,
                type: 'Saída',
                reason: 'Ajuste de Inventário (Zerar)',
                quantityChange: -originalQuantity,
                quantityBefore: originalQuantity,
                quantityAfter: 0,
                date: movementDate,
                user: userEmail,
                relatedId: `zero_stock_${category || 'all'}`
            };
            movements.push(newMovement);
        }
    });

    if (count > 0) {
        await writeData('products', products);
        const existingMovements = await readData<StockMovement>('stockMovements');
        await writeData('stockMovements', [...movements, ...existingMovements]);
        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/reports');
    }

    const categoryText = category && category !== 'Todos' ? `da categoria "${category}"` : 'completo';
    return { success: true, message: `${count} produto(s) tiveram seu estoque zerado. O zeramento de estoque ${categoryText} foi concluído.` };
}

export async function deleteProducts(productIds: string[]): Promise<{ success: boolean; message: string }> {
    const allProducts = await getProductsFromDb();
    const productsToDelete = allProducts.filter(p => productIds.includes(p.id));
    const remainingProducts = allProducts.filter(p => !productIds.includes(p.id));
    
    if (productsToDelete.length === 0) {
        return { success: false, message: "Nenhum produto encontrado para exclusão." };
    }

    // Opcional: registrar a exclusão como uma movimentação de estoque
    const movements: StockMovement[] = [];
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.name || 'Sistema';
    const movementDate = new Date().toISOString();

    for (const product of productsToDelete) {
        movements.push({
            id: generateId('mov'),
            productId: product.id,
            productName: product.name,
            type: 'Saída',
            reason: 'Exclusão de Produto',
            quantityChange: -product.quantity,
            quantityBefore: product.quantity,
            quantityAfter: 0,
            date: movementDate,
            user: userEmail,
            relatedId: `delete_prod_${product.id}`
        });
    }

    const existingMovements = await readData<StockMovement>('stockMovements');
    await writeData('stockMovements', [...movements, ...existingMovements]);
    await writeData('products', remainingProducts);

    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/reports');

    return { success: true, message: `${productsToDelete.length} produto(s) foram excluídos permanentemente.` };
}


// --- UNIT ACTIONS ---
export async function addUnit(unitData: Omit<Unit, 'id'>) {
    const units = await readData<Unit>('units');
    const newUnit: Unit = {
        ...unitData,
        id: generateId('unit'),
    };
    await writeData('units', [...units, newUnit]);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/orders/new');
}

export async function updateUnit(unitId: string, unitData: Partial<Omit<Unit, 'id'>>) {
    const units = await readData<Unit>('units');
    const unitIndex = units.findIndex(u => u.id === unitId);
    if (unitIndex === -1) throw new Error('Unidade não encontrada.');
    units[unitIndex] = { ...units[unitIndex], ...unitData };
    await writeData('units', units);
    revalidatePath('/dashboard/units');
    revalidatePath(`/dashboard/units/${unitId}`);
}

export async function deleteUnit(unitId: string): Promise<{ success: boolean; message?: string }> {
    const units = await readData<Unit>('units');
    const orders = await readData<Order>('orders');

    if (orders.some(order => order.unitId === unitId)) {
        return { success: false, message: 'Não é possível excluir unidades que possuem pedidos associados.' };
    }

    const updatedUnits = units.filter(u => u.id !== unitId);
    await writeData('units', updatedUnits);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/orders/new');
    return { success: true };
}


// --- PATIENT ACTIONS ---
export async function addPatient(patientData: Omit<Patient, 'id' | 'status' | 'createdAt'>) {
    const patients = await readData<Patient>('patients');
    const newPatient: Patient = {
        ...patientData,
        id: generateId('pat'),
        status: 'Ativo',
        createdAt: new Date().toISOString(),
    };
    await writeData('patients', [newPatient, ...patients]);
    revalidatePath('/dashboard/patients');
}

export async function updatePatient(patientId: string, patientData: Partial<Omit<Patient, 'id'>>): Promise<Patient> {
    const patients = await readData<Patient>('patients');
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) throw new Error('Paciente não encontrado.');
    
    patients[patientIndex] = { 
        ...patients[patientIndex], 
        ...patientData,
    };
    await writeData('patients', patients);
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${patientId}`);
    return patients[patientIndex];
}

export async function updatePatientStatus(patientId: string, status: PatientStatus) {
    const patients = await readData<Patient>('patients');
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) throw new Error('Paciente não encontrado.');
    patients[patientIndex].status = status;
    await writeData('patients', patients);
    revalidatePath('/dashboard/patients');
}

export async function deletePatient(patientId: string): Promise<{ success: boolean; message?: string }> {
    const patients = await readData<Patient>('patients');
    const dispensations = await readData<Dispensation>('dispensations');

    if (dispensations.some(d => d.patientId === patientId)) {
        return { success: false, message: "Não é possível excluir pacientes com histórico de dispensação. Torne-o inativo." };
    }

    const updatedPatients = patients.filter(p => p.id !== patientId);
    await writeData('patients', updatedPatients);
    
    revalidatePath('/dashboard/patients');
    return { success: true };
}


// --- ORDER ACTIONS ---
export async function addOrder(orderData: { unitId: string; unitName: string; orderType: OrderType, items: OrderItem[]; notes?: string; sentDate?: string; }) {
    const session = await getServerSession(authOptions);
    const orders = await readData<Order>('orders');
    const products = await getProductsFromDb();

    const sentDate = orderData.sentDate ? new Date(orderData.sentDate).toISOString() : new Date().toISOString();

    const newOrder: Order = {
        id: generateNumericId(),
        unitId: orderData.unitId,
        unitName: orderData.unitName,
        items: orderData.items,
        orderType: orderData.orderType,
        notes: orderData.notes,
        sentDate: sentDate,
        status: 'Em análise',
        itemCount: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
        creatorName: session?.user?.name || 'Usuário Desconhecido',
    };

    // Update stock for each item
    for (const item of newOrder.items) {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            const originalQuantity = products[productIndex].quantity;
            products[productIndex].quantity -= item.quantity;
            products[productIndex].status = products[productIndex].quantity <= 0 ? 'Sem Estoque' : products[productIndex].quantity < 20 ? 'Baixo Estoque' : 'Em Estoque';
            await logStockMovement(item.productId, item.name, 'Saída', 'Saída por Remessa', -item.quantity, originalQuantity, sentDate, newOrder.id);
        }
    }

    await writeData('products', products);
    await writeData('orders', [newOrder, ...orders].sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime()));

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/reports');
    revalidatePath(`/dashboard/units/${orderData.unitId}`);
}

export async function deleteOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
    const allOrders = await readData<Order>('orders');
    const allProducts = await getProductsFromDb();

    const orderToDelete = allOrders.find(o => o.id === orderId);
    if (!orderToDelete) {
        return { success: false, message: 'Pedido não encontrado.' };
    }

    const reversalDate = new Date().toISOString();

    // Return items to stock
    for (const item of orderToDelete.items) {
        const productIndex = allProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            const originalQuantity = allProducts[productIndex].quantity;
            allProducts[productIndex].quantity += item.quantity;
            allProducts[productIndex].status = allProducts[productIndex].quantity <= 0 ? 'Sem Estoque' : allProducts[productIndex].quantity < 20 ? 'Baixo Estoque' : 'Em Estoque';
            await logStockMovement(item.productId, item.name, 'Entrada', 'Estorno de Remessa', item.quantity, originalQuantity, reversalDate, orderToDelete.id);
        } else {
            // Product does not exist anymore, create it
            console.warn(`Produto com ID ${item.productId} não encontrado durante estorno. Criando novo produto.`);
            const newProduct: Product = {
                id: item.productId,
                name: item.name,
                category: item.category as Product['category'],
                quantity: item.quantity,
                expiryDate: item.expiryDate || '',
                batch: item.batch,
                presentation: item.presentation as Product['presentation'],
                status: item.quantity > 0 ? 'Em Estoque' : 'Sem Estoque',
            };
            allProducts.push(newProduct);
            await logStockMovement(newProduct.id, newProduct.name, 'Entrada', 'Estorno de Remessa', newProduct.quantity, 0, reversalDate, orderToDelete.id);
        }
    }

    // Filter out the deleted order
    const updatedOrders = allOrders.filter(o => o.id !== orderId);

    // Save updated data
    await writeData('products', allProducts);
    await writeData('orders', updatedOrders);

    // Revalidate paths
    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/units/${orderToDelete.unitId}`);
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/reports');

    return { success: true };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const orders = await readData<Order>('orders');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error('Pedido não encontrado.');
    
    orders[orderIndex].status = status;
    if (status === 'Atendido') {
        orders[orderIndex].deliveryDate = new Date().toISOString();
    } else {
        delete orders[orderIndex].deliveryDate;
    }

    await writeData('orders', orders);
    
    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/units/${orders[orderIndex].unitId}`);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/reports');
}


// --- DISPENSATION ACTIONS ---
export async function addDispensation(dispensationData: { patientId: string; patient: Omit<Patient, 'files'>; items: DispensationItem[]; notes?: string; }): Promise<Dispensation> {
    const session = await getServerSession(authOptions);
    const dispensations = await readData<Dispensation>('dispensations');
    const products = await getProductsFromDb();
    const dispensationDate = new Date().toISOString();

    const { files, ...patientForDispensation } = dispensationData.patient;
    
    const newDispensation: Dispensation = {
      id: generateNumericId(),
      patientId: dispensationData.patientId,
      patient: patientForDispensation,
      items: dispensationData.items,
      date: dispensationDate,
      creatorName: session?.user?.name || 'Usuário Desconhecido',
      notes: dispensationData.notes,
    };

    // Update stock for each item
    for (const item of newDispensation.items) {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            const originalQuantity = products[productIndex].quantity;
            products[productIndex].quantity -= item.quantity;
            products[productIndex].status = products[productIndex].quantity <= 0 ? 'Sem Estoque' : products[productIndex].quantity < 20 ? 'Baixo Estoque' : 'Em Estoque';
            await logStockMovement(item.productId, item.name, 'Saída', 'Saída por Dispensação', -item.quantity, originalQuantity, dispensationDate, newDispensation.id);
        }
    }

    await writeData('products', products);
    await writeData('dispensations', [newDispensation, ...dispensations]);
    
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${dispensationData.patientId}`);
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/reports');
    revalidatePath('/dashboard/dispense/new');
    
    return newDispensation;
}

// --- USER PROFILE ACTIONS ---

export async function updateUserProfile(userId: string, data: { name?: string; birthdate?: string; avatarColor?: string }) {
    const users = await readData<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('Usuário não encontrado.');
    }

    // Update the user data in our database (Vercel KV)
    users[userIndex] = { ...users[userIndex], ...data };
    await writeData('users', users);

    // Revalidate the path to ensure the UI updates on navigation
    revalidatePath('/dashboard', 'layout');
    
    // Return the updated user data so the client can update the session
    return { success: true, user: users[userIndex] };
}

// --- USER MANAGEMENT ACTIONS ---
export async function updateUserAccessLevel(userId: string, accessLevel: AccessLevel) {
    const users = await readData<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('Usuário não encontrado.');
    }
    users[userIndex].accessLevel = accessLevel;
    await writeData('users', users);
    revalidatePath('/dashboard/user-management');
}

export async function deleteUser(userId: string) {
    const adminAuth = getAuth(getAdminApp());
    const users = await readData<User>('users');
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
         throw new Error('Usuário não encontrado para exclusão.');
    }

    // Excluir do Firebase Auth
    try {
        await adminAuth.deleteUser(userId);
    } catch (error: any) {
        // Se o usuário não for encontrado no Firebase, podemos continuar para removê-lo do nosso DB
        if (error.code !== 'auth/user-not-found') {
            console.error("Erro ao excluir usuário do Firebase Auth:", error);
            throw new Error('Erro ao excluir usuário do sistema de autenticação.');
        }
    }

    // Excluir do Vercel KV
    const updatedUsers = users.filter(u => u.id !== userId);
    await writeData('users', updatedUsers);

    revalidatePath('/dashboard/user-management');
}


// --- FILE ACTIONS ---
export async function uploadFile(formData: FormData): Promise<{ success: boolean; file?: PatientFile; error?: string; }> {
    const file = formData.get('file') as File | null;
    if (!file) {
        return { success: false, error: 'Nenhum arquivo enviado.' };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return { success: false, error: 'O arquivo é muito grande (limite de 5MB).' };
    }

    // Convert the file to a Base64 data URL to store in KV.
    // This is not ideal for large files but works for a self-contained solution without external storage.
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const newFile: PatientFile = {
        id: generateId('file'),
        name: file.name,
        type: file.type,
        path: dataUrl,
        uploadedAt: new Date().toISOString(),
    };

    return { success: true, file: newFile };
}

export async function uploadImage(formData: FormData): Promise<{ success: boolean; filePath?: string; error?: string }> {
    const file = formData.get('image') as File | null;
    if (!file) {
        return { success: false, error: 'Nenhuma imagem enviada.' };
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for images
        return { success: false, error: 'A imagem é muito grande (limite de 2MB).' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = file.type;
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // In a real app, you'd upload to a service and get a URL.
        // For this self-contained example, the data URL is the "path".
        return { success: true, filePath: dataUrl };
    } catch (e) {
        return { success: false, error: 'Falha ao processar a imagem.' };
    }
}


export async function updateUserLastSeen(userId: string) {
    const users = await readData<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].lastSeen = new Date().toISOString();
        await writeData('users', users);
    }
    // Revalidate the entire dashboard layout to update all sub-pages
    revalidatePath('/dashboard', 'layout');
}
