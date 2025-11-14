'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Eye, Printer, Trash2, Edit, MoreHorizontal, ArrowUpDown, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import type { Order, OrderItem, OrderStatus, Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteOrder, updateOrderStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface OrdersClientPageProps {
  initialOrders: Order[];
  cafInventory: Product[];
}

export function OrdersClientPage({ initialOrders, cafInventory }: OrdersClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const cafInventoryMap = new Map(cafInventory.map(p => [p.id, p.quantity]));

  const filteredOrders = initialOrders.filter(
    (order) =>
      order.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getColumns = (): ColumnDef<Order>[] => [
    {
      accessorKey: "sentDate",
      header: ({ column }) => {
        return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Data
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("sentDate"))
        return <div>{date.toLocaleDateString('pt-BR', { timeZone: 'UTC'})}</div>
      },
    },
    {
      accessorKey: 'unitName',
      header: 'Unidade',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{order.unitName}</span>
            <span className="text-xs text-muted-foreground font-mono">ID: {order.id}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "orderType",
      header: "Tipo de Pedido",
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
                <DropdownMenuItem onClick={() => handleViewOrder(order)} className="cursor-pointer">
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
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={(e) => e.preventDefault()}>
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
                  <AlertDialogAction onClick={() => handleDeleteOrder(order)} className="bg-destructive hover:bg-destructive/90">
                      Sim, excluir pedido
                  </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ];

  const tableColumns = getColumns();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
          <CardDescription>
            Visualize todos os pedidos enviados para as unidades de saúde.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <Input
              placeholder="Filtrar por nome da unidade ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button asChild>
              <Link href="/dashboard/orders/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Remessa
              </Link>
            </Button>
          </div>

          <DataTable columns={tableColumns} data={filteredOrders} />
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualizar Pedido: {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Pedido de {selectedOrder?.unitName} em {selectedOrder?.sentDate ? new Date(selectedOrder.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50%]">Item</TableHead>
                        <TableHead>Qtd. Pedida</TableHead>
                        <TableHead>Qtd. em Estoque (CAF)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {selectedOrder?.items.map((item) => {
                       const stockQuantity = cafInventoryMap.get(item.productId) ?? 0;
                       const hasEnoughStock = stockQuantity >= item.quantity;
                       return (
                         <TableRow key={item.productId + (item.batch || '')}>
                            <TableCell className="font-medium">{item.name} <span className="text-muted-foreground text-xs">({item.presentation})</span></TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell className={cn(hasEnoughStock ? 'text-green-600' : 'text-destructive font-bold')}>
                                {stockQuantity}
                            </TableCell>
                         </TableRow>
                       )
                    })}
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
