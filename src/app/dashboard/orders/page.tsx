
'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowUpDown, MoreHorizontal, Eye, CalendarClock, Loader2 } from "lucide-react";
import type { Unit, Order } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import { getUnits, getOrders } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const getColumns = (lastOrderMap: Map<string, Order>): ColumnDef<Unit>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome da Unidade
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="capitalize font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => <div className="capitalize">{row.getValue("type")}</div>,
  },
  {
    accessorKey: "address",
    header: "Endereço",
  },
  {
    id: "lastOrder",
    header: "Último Pedido",
    cell: ({ row }) => {
        const unit = row.original;
        const lastOrder = lastOrderMap.get(unit.id);
        if (!lastOrder) return <div className="text-muted-foreground text-center">—</div>;

        const orderType = lastOrder.orderType || "N/A";
        const orderDate = new Date(lastOrder.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        return (
            <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <div>
                    <Badge 
                        variant="outline"
                        className={cn({
                            'border-blue-400 text-blue-700': orderType === 'Pedido Mensal',
                            'border-yellow-400 text-yellow-700': orderType === 'Pedido Extra',
                            'border-red-400 text-red-700': orderType === 'Pedido Urgente',
                        })}
                    >{orderType}</Badge>
                    <div className="text-xs text-muted-foreground">{orderDate}</div>
                </div>
            </div>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const unit = row.original

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
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/orders/history/${unit.id}`} className="w-full h-full flex items-center cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Histórico de Pedidos
                </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];


export default function OrdersPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const [unitsData, ordersData] = await Promise.all([
                getUnits(),
                getOrders()
            ]);
            setUnits(unitsData);
            setOrders(ordersData);
            setIsLoading(false);
        }
        fetchData();
    }, []);

    const filteredUnits = units.filter(unit => 
        unit.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const unitLastOrderMap = new Map<string, Order>();
    orders.forEach(order => {
        if (!unitLastOrderMap.has(order.unitId) || new Date(order.sentDate) > new Date(unitLastOrderMap.get(order.unitId)!.sentDate)) {
            unitLastOrderMap.set(order.unitId, order);
        }
    });

    const tableColumns = getColumns(unitLast_orderMap);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Unidades Atendidas</CardTitle>
                <CardDescription>
                Selecione uma unidade para ver o histórico de pedidos ou crie uma nova remessa.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <Input
                    placeholder="Filtrar por nome da unidade..."
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

                {isLoading ? (
                    <div className="space-y-2 mt-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <DataTable columns={tableColumns} data={filteredUnits} />
                )}
            </CardContent>
        </Card>
    );
}
