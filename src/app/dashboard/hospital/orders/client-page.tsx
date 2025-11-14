'use client';

import { useState } from "react";
import type { Order, Product } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Eye, ArrowUpDown, MoreHorizontal, CheckCircle, PlusCircle } from 'lucide-react';
import { updateOrderStatus } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateOrderDialog } from "./create-order-dialog";

interface HospitalOrdersClientPageProps {
    initialOrders: Order[];
    cafInventory: Product[];
    hospitalUnitId: string;
}

export function HospitalOrdersClientPage({ initialOrders, cafInventory, hospitalUnitId }: HospitalOrdersClientPageProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    const handleConfirmReceipt = async (orderId: string) => {
        try {
            await updateOrderStatus(orderId, 'Atendido'); // Or a new status like 'Recebido'
            toast({ title: "Recebimento Confirmado", description: "O status do pedido foi atualizado." });
            router.refresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível confirmar o recebimento." });
        }
    };
    
    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsViewOpen(true);
    };

    const handleOrderCreated = () => {
        toast({ title: "Pedido Enviado!", description: "Seu pedido foi enviado para o CAF."});
        router.refresh();
    }
    
    const columns: ColumnDef<Order>[] = [
        {
            accessorKey: "sentDate",
            header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Data Envio <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
            cell: ({ row }) => new Date(row.getValue("sentDate")).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        },
        { accessorKey: "orderType", header: "Tipo" },
        { accessorKey: "itemCount", header: "Nº de Itens" },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as Order['status'];
                return <Badge className={cn({
                    'bg-yellow-500': status === 'Em análise',
                    'bg-green-600': status === 'Atendido',
                    'bg-red-500': status === 'Não atendido'
                })}>{status}</Badge>;
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const order = row.original;
                return (
                    <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}><Eye className="mr-2 h-4 w-4" /> Ver Itens</Button>
                        {order.status === 'Em análise' && (
                             <Button size="sm" onClick={() => handleConfirmReceipt(order.id)}><CheckCircle className="mr-2 h-4 w-4" /> Confirmar Recebimento</Button>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap gap-4 justify-between items-center">
                        <div>
                            <CardTitle>Pedidos e Recebimentos</CardTitle>
                            <CardDescription>Visualize remessas do CAF e crie novos pedidos de reposição.</CardDescription>
                        </div>
                        <CreateOrderDialog 
                            cafInventory={cafInventory}
                            hospitalUnitId={hospitalUnitId}
                            onOrderCreated={handleOrderCreated}
                            trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Fazer Pedido ao CAF</Button>} 
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={initialOrders} />
                </CardContent>
            </Card>
            
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Visualizar Pedido: {selectedOrder?.id}</DialogTitle>
                        <DialogDescription>
                        Itens enviados pelo CAF em {selectedOrder?.sentDate ? new Date(selectedOrder.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] p-4">
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
                                {selectedOrder?.items.map(item => (
                                    <TableRow key={item.productId + item.batch}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.presentation}</TableCell>
                                        <TableCell>{item.batch}</TableCell>
                                        <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Fechar</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
