
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer, X } from 'lucide-react';
import type { Product } from '@/lib/types';
import Link from 'next/link';

interface ProductSavedDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

export function ProductSavedDialog({ isOpen, onOpenChange, product }: ProductSavedDialogProps) {
  
  const handlePrint = () => {
      window.open(`/labels/${product.id}`, '_blank');
      onOpenChange(false);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
            <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          <DialogTitle className="text-center text-xl mt-4">Produto Salvo com Sucesso!</DialogTitle>
          <DialogDescription className="text-center">
            O produto <strong>{product.name}</strong> foi salvo. Deseja imprimir as etiquetas de código de barras para as <strong>{product.quantity}</strong> unidades cadastradas?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Não, obrigado
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Sim, Imprimir Etiquetas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
