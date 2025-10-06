
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Unit, Order } from "@/lib/types" 
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Eye, CalendarClock } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const columns = (lastOrderMap: Map<string, Order>): ColumnDef<Unit>[] => [
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
]
