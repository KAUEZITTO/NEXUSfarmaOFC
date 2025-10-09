
import { getProduct } from '@/lib/data';
import { notFound } from 'next/navigation';
import { LabelPageClient } from './label-page-client';
import type { Product } from '@/lib/types';

// Força a renderização dinâmica da página no momento da requisição.
// Isso é crucial porque a página busca dados do Vercel KV, que não
// está disponível durante o processo de build estático.
export const dynamic = 'force-dynamic';

export default async function LabelsPage({ params }: { params: { productId: string } }) {
  const product = await getProduct(params.productId);

  if (!product) {
    notFound();
  }
  
  // Determine if the presentation is considered a "box" or a single "unit"
  const isBox = ['Caixa c/ 100', 'Caixa c/ 50', 'Pacote', 'Bolsa'].includes(product.presentation || '');

  return <LabelPageClient product={product} isBox={isBox} />;
}
