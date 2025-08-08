"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Patient, PatientStatus } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Eye, Edit, UserCheck, UserX, CheckCircle, XCircle, HeartPulse } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const updatePatientStatus = (patientId: string, status: PatientStatus) => {
  // This is a mock implementation. In a real app, you'd call a server action.
  console.log(`Updating patient ${patientId} to status ${status}`);
  // You might want to trigger a re-render or a toast message here.
  alert(`Status do paciente ${patientId} atualizado para ${status}. Recarregue a página para ver a alteração.`);
};

export const columns: ColumnDef<Patient>[] = [
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
    accessorKey: "cpf",
    header: "CPF",
  },
  {
    accessorKey: "mandateType",
    header: "Tipo de Mandado",
    cell: ({ row }) => <div className="capitalize">{row.getValue("mandateType")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status: PatientStatus = row.getValue("status");
      if (status === 'Ativo') return null;

      const variantMap: { [key in PatientStatus]: "default" | "secondary" | "destructive" } = {
        'Ativo': 'default',
        'Tratamento Concluído': 'default',
        'Tratamento Interrompido': 'secondary',
        'Óbito': 'destructive'
      };

      return <Badge 
        variant={variantMap[status]} 
        className={cn({
          'bg-green-600 text-white': status === 'Tratamento Concluído',
          'bg-orange-500 text-white': status === 'Tratamento Interrompido',
        })}
      >
        {status}
      </Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const patient = row.original

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
              <Link href={`/dashboard/patients/${patient.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Histórico
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Editar Cadastro
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <HeartPulse className="mr-2 h-4 w-4" />
                    <span>Alterar Status</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                         <DropdownMenuItem onClick={() => updatePatientStatus(patient.id, 'Ativo')}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            <span>Ativo</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updatePatientStatus(patient.id, 'Tratamento Concluído')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Tratamento Concluído</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updatePatientStatus(patient.id, 'Tratamento Interrompido')}>
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Tratamento Interrompido</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updatePatientStatus(patient.id, 'Óbito')}>
                            <UserX className="mr-2 h-4 w-4" />
                            <span>Óbito</span>
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
