
'use server';

/**
 * @fileOverview An analytics AI flow that can answer questions about inventory and consumption.
 *
 * - analyzeData - A function that handles the data analysis process.
 * - getInventoryAnalysis - A Genkit tool to get a summary of the current inventory status.
 * - getConsumptionAnalysis - A Genkit tool to get a summary of product consumption over a period.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getProducts, getOrders, getAllDispensations } from '@/lib/actions';

// Define tools for the AI to use

const getInventoryAnalysis = ai.defineTool(
  {
    name: 'getInventoryAnalysis',
    description: 'Retorna um resumo do status atual do inventário, incluindo itens com baixo estoque, sem estoque e próximos ao vencimento.',
    inputSchema: z.object({
        daysUntilExpiry: z.number().default(30).describe("O número de dias para considerar um item como 'próximo ao vencimento'."),
    }),
    outputSchema: z.object({
        lowStockCount: z.number(),
        outOfStockCount: z.number(),
        expiringSoonCount: z.number(),
        lowStockItems: z.array(z.string()),
        expiringSoonItems: z.array(z.string()),
    }),
  },
  async ({ daysUntilExpiry }) => {
    const products = await getProducts();
    const now = new Date();
    const expiryLimitDate = new Date();
    expiryLimitDate.setDate(now.getDate() + daysUntilExpiry);

    const lowStockItems = products.filter(p => p.status === 'Baixo Estoque');
    const outOfStockItems = products.filter(p => p.status === 'Sem Estoque');
    const expiringSoonItems = products.filter(p => {
        if (!p.expiryDate) return false;
        const expiry = new Date(p.expiryDate);
        return expiry > now && expiry <= expiryLimitDate;
    });

    return {
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        expiringSoonCount: expiringSoonItems.length,
        lowStockItems: lowStockItems.map(p => `${p.name} (Qtd: ${p.quantity})`),
        expiringSoonItems: expiringSoonItems.map(p => `${p.name} (Vence em: ${new Date(p.expiryDate).toLocaleDateString('pt-BR')})`),
    };
  }
);


const getConsumptionAnalysis = ai.defineTool(
    {
        name: 'getConsumptionAnalysis',
        description: 'Analisa o consumo (dispensação e pedidos) de itens em um determinado período de tempo em dias.',
        inputSchema: z.object({
            periodInDays: z.number().default(30).describe("O período em dias para analisar o consumo."),
        }),
        outputSchema: z.object({
            totalItemsDispensed: z.number(),
            totalItemsOrdered: z.number(),
            topDispensedProducts: z.array(z.object({ name: z.string(), quantity: z.number() })),
            topOrderedProducts: z.array(z.object({ name: z.string(), quantity: z.number() })),
        }),
    },
    async ({ periodInDays }) => {
        const dispensations = await getAllDispensations();
        const orders = await getOrders();
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - periodInDays);

        const relevantDispensations = dispensations.filter(d => new Date(d.date) >= startDate);
        const relevantOrders = orders.filter(o => new Date(o.sentDate) >= startDate);

        const dispensedProductMap = new Map<string, number>();
        relevantDispensations.forEach(d => {
            d.items.forEach(item => {
                dispensedProductMap.set(item.name, (dispensedProductMap.get(item.name) || 0) + item.quantity);
            });
        });

        const orderedProductMap = new Map<string, number>();
        relevantOrders.forEach(o => {
            o.items.forEach(item => {
                orderedProductMap.set(item.name, (orderedProductMap.get(item.name) || 0) + item.quantity);
            });
        });
        
        const topDispensed = Array.from(dispensedProductMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, quantity]) => ({ name, quantity }));
        const topOrdered = Array.from(orderedProductMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, quantity]) => ({ name, quantity }));

        return {
            totalItemsDispensed: Array.from(dispensedProductMap.values()).reduce((a,b) => a+b, 0),
            totalItemsOrdered: Array.from(orderedProductMap.values()).reduce((a,b) => a+b, 0),
            topDispensedProducts: topDispensed,
            topOrderedProducts: topOrdered,
        }
    }
);


const analyticsPrompt = ai.definePrompt({
    name: 'analyticsPrompt',
    tools: [getInventoryAnalysis, getConsumptionAnalysis],
    system: `Você é um assistente especialista em análise de dados para o sistema NexusFarma, um sistema de gestão de estoque farmacêutico.
    Sua tarefa é responder às perguntas do usuário sobre o estado do inventário, consumo de itens, e outras métricas relevantes.
    Use as ferramentas disponíveis para obter os dados necessários e, em seguida, formate a resposta de forma clara, concisa e útil para um gestor.
    Use Markdown para formatar sua resposta (negrito, listas, etc.) para melhor legibilidade.
    Se a pergunta for ambígua, peça esclarecimentos. Responda sempre em português do Brasil.`,
});

const analyticsFlow = ai.defineFlow(
  {
    name: 'analyticsFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (query) => {
    const { output } = await analyticsPrompt(query);
    return output?.content.parts.map(p => p.text).join('') ?? "Não foi possível gerar uma resposta.";
  }
);


export async function analyzeData(query: string): Promise<string> {
    return analyticsFlow(query);
}
