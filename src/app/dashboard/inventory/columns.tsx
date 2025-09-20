
"use client"

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

type ColumnsProps = {
  onProductSaved: () => void;
};

export const getColumns = ({ onProductSaved }: ColumnsProps): ColumnDef<Product>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    cell: ({ row }) => <div className="capitalize font-medium">{row.getValue("name")}</div>,
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
    header: () => <div className="text-right">Quantidade</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("quantity"))
      return <div className="text-right font-medium">{amount}</div>
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
  {
    accessorKey: "expiryDate",
    header: "Vencimento",
    cell: ({ row }) => {
      const dateString = row.getValue("expiryDate") as string;
      if (!dateString) return null;
      const [year, month, day] = dateString.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return <div>{date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
    }
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const product = row.original

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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(product.id)}
            >
              Copiar ID do Produto
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href={`/labels/${product.id}`} target="_blank" className="w-full h-full flex items-center cursor-pointer">
                    <Printer className="mr-2 h-4 w-4" />
                    <span>Imprimir Etiquetas</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AddProductDialog productToEdit={product} onProductSaved={onProductSaved} trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Editar</span>
                </DropdownMenuItem>
            } />
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
