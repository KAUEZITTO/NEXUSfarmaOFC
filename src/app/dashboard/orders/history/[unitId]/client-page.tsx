

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Order, OrderItem, Unit, OrderStatus } from '@/lib/types';
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
import { MoreHorizontal, Eye, Printer, Trash2, Edit, CheckCircle, XCircle, Hourglass } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteOrder, updateOrderStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

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

interface OrderHistoryClientPageProps {
  initialUnit: Unit;
  initialOrders: Order[];
}

export function OrderHistoryClientPage({ initialUnit, initialOrders }: OrderHistoryClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };
  
  const handleDeleteOrder = async (order: Order) => {
    const result = await deleteOrder(order.id);
    if (result.success) {
      toast({
        title: 'Pedido Excluído!',
        description: `O pedido ${order.id} foi excluído e os itens foram estornados para o inventário.`,
      });
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao Excluir',
        description: result.message || 'Não foi possível excluir o pedido.',
      });
    }
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
      try {
        await updateOrderStatus(orderId, status);
        toast({
          title: "Status do Pedido Atualizado!",
          description: `O status do pedido foi alterado para ${status}.`,
        });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar status",
          description: "Não foi possível alterar o status do pedido.",
        });
      }
  };

  const columns = (onViewOrder: (order: Order) => void, onDeleteOrder: (order: Order) => void): ColumnDef<Order>[] => [
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
        const status: OrderStatus = row.getValue("status");
         const variantMap: { [key in OrderStatus]: "destructive" | "secondary" | "default" } = {
          'Não atendido': "destructive",
          'Em análise': "secondary",
          'Atendido': "default",
        };
  
        return <Badge 
          variant={variantMap[status] || "secondary"} 
          className={cn({
              'bg-accent text-accent-foreground': status === 'Em análise',
              'bg-green-600 text-white': status === 'Atendido',
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
          <AlertDialog>
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
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Alterar Status</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'Em análise')}>
                                <Hourglass className="mr-2 h-4 w-4" />
                                <span>Em análise</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'Atendido')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>Atendido</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'Não atendido')}>
                                <XCircle className="mr-2 h-4 w-4" />
                                <span>Não atendido</span>
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                 <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Excluir Pedido</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá excluir permanentemente o pedido <strong>{order.id}</strong> e estornar todos os seus itens de volta para o inventário.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteOrder(order)}>
                      Sim, excluir pedido
                  </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ]

  const tableColumns = columns(handleViewOrder, handleDeleteOrder);

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pedidos: {initialUnit?.name}</CardTitle>
        <CardDescription>
          Acompanhe todos os pedidos e remessas para esta unidade.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={tableColumns} data={initialOrders} />
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
