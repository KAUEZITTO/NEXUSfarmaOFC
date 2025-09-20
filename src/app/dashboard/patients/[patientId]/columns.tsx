"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Dispensation } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

export const columns: ColumnDef<Dispensation>[] = [
  {
    accessorKey: "id",
    header: "ID da Dispensação",
  },
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return <div>{date.toLocaleDateString('pt-BR')}</div>
    }
  },
  {
    accessorKey: "items",
    header: "Nº de Itens",
    cell: ({ row }) => {
      const items = row.getValue("items") as any[];
      return <div className="text-center">{items.length}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const dispensation = row.original

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
              {/* Target _blank opens the receipt in a new tab */}
              <Link href={`/dispensation-receipt/${dispensation.id}`} target="_blank" className="w-full h-full flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Recibo
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
