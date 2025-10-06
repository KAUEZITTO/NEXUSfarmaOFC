
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Order } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Printer } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const columns = (onViewOrder: (order: Order) => void): ColumnDef<Order>[] => [
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
