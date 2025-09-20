'use server';

/**
 * @fileOverview An AI flow for analyzing inventory and order data.
 *
 * - analyzeData - A function that takes a natural language query and returns an analysis.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
    getProducts,
    getOrders,
    getAllDispensations,
    getAllPatients,
    getUnits,
    getStockMovements
} from '@/lib/actions';

const DataAnalysisInputSchema = z.string();
const DataAnalysisOutputSchema = z.string();

export async function analyzeData(query: string): Promise<string> {
  return dataAnalysisFlow(query);
}

const dataAnalysisFlow = ai.defineFlow(
  {
    name: 'dataAnalysisFlow',
    inputSchema: DataAnalysisInputSchema,
    outputSchema: DataAnalysisOutputSchema,
  },
  async (query) => {
    const [products, orders, dispensations, patients, units, stockMovements] = await Promise.all([
        getProducts(),
        getOrders(),
        getAllDispensations(),
        getAllPatients(),
        getUnits(),
        getStockMovements(),
    ]);

    const systemPrompt = `Você é um assistente de análise de dados para um sistema de gerenciamento de farmácia chamado NexusFarma.
    Sua função é responder a perguntas do usuário com base nos dados fornecidos do sistema. Seja conciso, amigável e direto.
    Use os dados JSON a seguir como sua única fonte de verdade. Não invente informações.
    Seja claro sobre os dados que você está usando para formular sua resposta.
    Use markdown para formatar sua resposta (negrito, listas, etc.) quando apropriado.

    Dados disponíveis:
    - Produtos em estoque: ${JSON.stringify(products.slice(0, 50))} (amostra)
    - Pedidos para unidades: ${JSON.stringify(orders.slice(0, 50))} (amostra)
    - Dispensações para pacientes: ${JSON.stringify(dispensations.slice(0, 50))} (amostra)
    - Pacientes: ${JSON.stringify(patients.slice(0, 50))} (amostra)
    - Unidades de Saúde: ${JSON.stringify(units.slice(0, 20))} (amostra)
    - Movimentações de Estoque: ${JSON.stringify(stockMovements.slice(0, 50))} (amostra)
    `;

    const { output } = await ai.generate({
      prompt: query,
      system: systemPrompt,
      model: 'googleai/gemini-1.5-flash-preview',
    });

    return output ?? "Não foi possível analisar os dados.";
  }
);
