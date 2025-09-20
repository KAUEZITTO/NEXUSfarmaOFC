
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
import { AddPatientDialog } from "@/components/dashboard/add-patient-dialog"
import { updatePatientStatus } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type ColumnsProps = {
  onPatientSaved: () => void;
  onUpdateStatus: (patientId: string, status: PatientStatus) => void;
}

export const getColumns = ({ onPatientSaved, onUpdateStatus }: ColumnsProps): ColumnDef<Patient>[] => {
  return [
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
      // Don't show badge for 'Ativo' to reduce visual clutter
      if (status === 'Ativo') return null;

      const variantMap: { [key in PatientStatus]?: "default" | "secondary" | "destructive" } = {
        'Tratamento Concluído': 'default',
        'Tratamento Interrompido': 'secondary',
        'Óbito': 'destructive'
      };

      return <Badge 
        variant={variantMap[status] ?? 'default'} 
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
             <DropdownMenuItem onSelect={e => e.preventDefault()} asChild>
                <AddPatientDialog patientToEdit={patient} onPatientSaved={onPatientSaved} trigger={
                    <button className="w-full h-full relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar Cadastro</span>
                    </button>
                } />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <HeartPulse className="mr-2 h-4 w-4" />
                    <span>Alterar Status</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                         <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'Ativo')}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            <span>Ativo</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'Tratamento Concluído')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Tratamento Concluído</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'Tratamento Interrompido')}>
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Tratamento Interrompido</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'Óbito')}>
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
}
