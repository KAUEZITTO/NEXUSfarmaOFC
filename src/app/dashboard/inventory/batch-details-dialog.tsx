
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, MoreHorizontal, Printer } from 'lucide-react';
import type { GroupedProduct } from './page';
import Link from 'next/link';
import { AddProductDialog } from '@/components/dashboard/add-product-dialog';

interface BatchDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: GroupedProduct;
  onProductSaved: () => void;
}

export function BatchDetailsDialog({ isOpen, onOpenChange, product, onProductSaved }: BatchDetailsDialogProps) {
  if (!product) return null;
  
  const { batches, name, presentation } = product;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes dos Lotes: {name}</DialogTitle>
          <DialogDescription>
            Apresentação: {presentation}. Total em estoque: {product.quantity.toLocaleString('pt-BR')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Nome Comercial</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map(batch => (
                <TableRow key={batch.id}>
                  <TableCell className="font-mono">{batch.batch || 'N/A'}</TableCell>
                  <TableCell>{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}</TableCell>
                  <TableCell>{batch.commercialName || 'N/A'}</TableCell>
                  <TableCell>{batch.manufacturer || 'N/A'}</TableCell>
                  <TableCell className="text-right">{batch.quantity.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <AddProductDialog productToEdit={batch} onProductSaved={onProductSaved} trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Editar Lote</span>
                            </DropdownMenuItem>
                        } />
                        <DropdownMenuItem asChild>
                            <Link href={`/labels/${batch.id}`} target="_blank" className="w-full h-full flex items-center cursor-pointer">
                                <Printer className="mr-2 h-4 w-4" />
                                <span>Imprimir Etiquetas</span>
                            </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                 <Button type="button" variant="outline">Fechar</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
