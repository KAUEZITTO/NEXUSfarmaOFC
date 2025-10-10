
'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { getOrdersForUnit, getUnit } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Order, OrderItem, Unit } from '@/lib/types';
import { DataTable } from '@/components/ui/data-table';
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
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Printer } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

export default function OrderHistoryPage({ params }: { params: { unitId: string } }) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [unitData, ordersData] = await Promise.all([
          getUnit(params.unitId),
          getOrdersForUnit(params.unitId)
        ]);

        if (!unitData) {
          notFound();
        }

        setUnit(unitData);
        setOrders(ordersData);
      } catch (error) {
        console.error("Failed to fetch order history data", error);
        // Optionally, handle error state in the UI
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [params.unitId]);
  
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const columns = (onViewOrder: (order: Order) => void): ColumnDef<Order>[] => [
    {
      accessorKey: "id",
      header: "ID do Pedido",
    },
    {
      accessorKey: "sentDate",
      header: "Data de Envio",
      cell: ({ row }) => {
        const date = new Date(row.getValue("sentDate"))
        return <div>{date.toLocaleDateString('pt-BR', { timeZone: 'UTC'})}</div>
      }
    },
     {
      accessorKey: "orderType",
      header: "Tipo",
      cell: ({ row }) => {
          const type = row.getValue("orderType") as string;
          if (!type) return <Badge variant="outline">N/A</Badge>;
          return <Badge 
              className={cn({
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': type === 'Pedido Mensal',
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': type === 'Pedido Extra',
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': type === 'Pedido Urgente',
              })}
          >{type}</Badge>
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status: string = row.getValue("status");
         const variantMap: { [key: string]: "destructive" | "secondary" | "default" } = {
          Cancelado: "destructive",
          Pendente: "secondary",
          Entregue: "default",
          "Em Trânsito": "default"
        };
  
        return <Badge 
          variant={variantMap[status] || "default"} 
          className={cn({
              'bg-accent text-accent-foreground': status === 'Pendente',
              'bg-blue-500 text-white': status === 'Em Trânsito',
              'bg-secondary text-secondary-foreground': status === 'Entregue'
          })}
        >
          {status}
        </Badge>
      },
    },
    {
      accessorKey: "itemCount",
      header: () => <div className="text-right">Nº de Itens</div>,
      cell: ({ row }) => {
        return <div className="text-right font-medium">{row.getValue("itemCount")}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original
  
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onViewOrder(order)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Itens
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                  <Link href={`/receipt/${order.id}`} target="_blank" className="w-full h-full flex items-center cursor-pointer">
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir Recibo
                  </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const tableColumns = columns(handleViewOrder);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pedidos: {unit?.name}</CardTitle>
        <CardDescription>
          Acompanhe todos os pedidos e remessas para esta unidade.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={tableColumns} data={orders} />
      </CardContent>
    </Card>

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

    