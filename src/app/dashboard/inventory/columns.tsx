"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GroupedProduct } from "./page";

// The columns definition is now a pure function, with no client-side hooks or state.
// The interactive part (clicking to open a dialog) will be handled by the parent DataTable/ClientComponent.
export const columns: ColumnDef<GroupedProduct>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nome
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="capitalize font-medium text-primary hover:underline cursor-pointer">
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "presentation",
      header: "Apresentação",
      cell: ({ row }) => <div className="capitalize">{row.getValue("presentation") || "N/A"}</div>
    },
    {
      accessorKey: "therapeuticClass",
      header: "Classe",
      cell: ({ row }) => <div className="capitalize">{row.getValue("therapeuticClass") || "N/A"}</div>
    },
    {
      accessorKey: "mainFunction",
      header: "Função",
      cell: ({ row }) => <div className="capitalize">{row.getValue("mainFunction") || "N/A"}</div>
    },
    {
      accessorKey: "quantity",
      header: () => <div className="text-right">Quantidade Total</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("quantity"))
        return <div className="text-right font-medium">{amount.toLocaleString('pt-BR')}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status: string = row.getValue("status");
        const variantMap: { [key: string]: "destructive" | "secondary" | "default" } = {
          'Sem Estoque': 'destructive',
          'Baixo Estoque': 'secondary',
          'Em Estoque': 'default'
        };
        
        return <Badge 
          variant={variantMap[status] ?? 'default'}
          className={cn(status === 'Baixo Estoque' && 'bg-accent text-accent-foreground')}
        >
          {status}
        </Badge>
      },
    },
  ]
