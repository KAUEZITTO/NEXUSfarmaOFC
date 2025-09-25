"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { User } from "@/lib/types" 
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu"

// Note: The 'Alterar Nível de Acesso' functionality is currently disabled in the UI
// because the corresponding server action has not been implemented yet.
// To enable it, you would need to create an action to update the user's accessLevel
// and then re-enable the DropdownMenuSub component below and pass the handler function.

export const getColumns = (): ColumnDef<User>[] => [
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "role",
    header: "Cargo",
    cell: ({ row }) => {
        const user = row.original;
        const subRole = user.subRole ? `(${user.subRole})` : '';
        return (
            <div className="capitalize">{user.role} {subRole}</div>
        )
    }
  },
  {
    accessorKey: "accessLevel",
    header: "Nível de Acesso",
    cell: ({ row }) => {
        const level: string = row.getValue("accessLevel");
        return <Badge variant={level === 'Admin' ? 'destructive' : 'secondary'}>{level}</Badge>
    }
  },
    {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            {/* 
              This functionality is disabled until the server action is implemented.
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Alterar Nível de Acesso</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                         <DropdownMenuItem>
                            <span>Admin</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <span>User</span>
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            */}
             <DropdownMenuItem disabled>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Alterar Acesso (Em breve)</span>
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
