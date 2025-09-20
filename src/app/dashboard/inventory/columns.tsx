
"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Edit, MoreHorizontal, Printer } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { AddProductDialog } from "@/components/dashboard/add-product-dialog"
import Link from "next/link"
import type { GroupedProduct } from "./page";
import { BatchDetailsDialog } from "./batch-details-dialog";

type ColumnsProps = {
  onProductSaved: () => void;
};

// Componente de Célula dedicado para encapsular o estado
const NameCell = ({ row, onProductSaved }: { row: any, onProductSaved: () => void; }) => {
    const product = row.original as GroupedProduct;
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsDialogOpen(true)}
                className="capitalize font-medium text-primary hover:underline text-left"
            >
                {row.getValue("name")}
            </button>
            <BatchDetailsDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                product={product}
                onProductSaved={onProductSaved}
            />
        </>
    );
};


export const getColumns = ({ onProductSaved }: ColumnsProps): ColumnDef<GroupedProduct>[] => {

  return [
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
      cell: ({ row }) => <NameCell row={row} onProductSaved={onProductSaved} />,
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
}
