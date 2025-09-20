
import { getProduct } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { LabelPageClient } from './label-page-client';
import type { Product } from '@/lib/types';


export default async function LabelsPage({ params }: { params: { productId: string } }) {
  const product = await getProduct(params.productId);

  if (!product) {
    notFound();
  }
  
  // Determine if the presentation is considered a "box" or a single "unit"
  const isBox = ['Caixa c/ 100', 'Caixa c/ 50', 'Pacote', 'Bolsa'].includes(product.presentation || '');

  return <LabelPageClient product={product} isBox={isBox} />;
}
