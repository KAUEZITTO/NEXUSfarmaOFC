
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Unit } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Check, X, Edit, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AddUnitDialog } from "@/components/dashboard/add-unit-dialog"
import Link from "next/link"

export const columns: ColumnDef<Unit>[] = [
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
    cell: ({ row }) => {
        const unit = row.original
        return (
            <Link href={`/dashboard/units/${unit.id}`} className="capitalize font-medium text-primary hover:underline">
                {row.getValue("name")}
            </Link>
        )
    },
  },
  {
    accessorKey: "address",
    header: "Endereço",
  },
   {
    accessorKey: "coordinatorName",
    header: "Coordenador(a)",
    cell: ({ row }) => <div>{row.getValue("coordinatorName") || 'N/A'}</div>,
  },
  {
    accessorKey: "hasPharmacy",
    header: "Farmácia",
    cell: ({ row }) => {
      const hasPharmacy = row.getValue("hasPharmacy")
      return hasPharmacy ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />
    }
  },
  {
    accessorKey: "hasDentalOffice",
    header: "Odonto",
    cell: ({ row }) => {
      const hasOffice = row.getValue("hasDentalOffice")
      return hasOffice ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />
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
                <Link href={`/dashboard/units/${unit.id}`} className="w-full h-full flex items-center">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                </Link>
            </DropdownMenuItem>
             <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                 <AddUnitDialog unitToEdit={unit} trigger={
                    <button className="w-full h-full relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar Unidade</span>
                    </button>
                } />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
