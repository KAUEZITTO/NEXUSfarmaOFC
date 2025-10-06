
'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { Order, OrderItem } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderHistoryClientProps {
  orders: Order[];
}

export function OrderHistoryClient({ orders }: OrderHistoryClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const renderItemRows = (items: OrderItem[]) => {
    if (!items || items.length === 0) return null;
    return items.map((item, index) => (
        <TableRow key={item.productId + item.batch} >
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="text-center">{item.presentation || "--"}</TableCell>
            <TableCell className="text-center">{item.batch || "--"}</TableCell>
            <TableCell className="text-center">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : "--"}</TableCell>
            <TableCell className="text-right">{item.quantity.toLocaleString('pt-BR')}</TableCell>
        </TableRow>
    ));
  }

  return (
    <>
      <DataTable columns={columns(handleViewOrder)} data={orders} filterColumn="id" />

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualizar Pedido: {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Itens enviados para {selectedOrder?.unitName} em {selectedOrder?.sentDate ? new Date(selectedOrder.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Item</TableHead>
                        <TableHead>Apresentação</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead className="text-right">Qtd.</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {selectedOrder?.items ? renderItemRows(selectedOrder.items) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">Nenhum item encontrado.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
