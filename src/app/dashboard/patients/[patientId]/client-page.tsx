
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, MoreHorizontal, Eye } from "lucide-react";
import { Dispensation } from "@/lib/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { Patient } from "@/lib/types";

const getColumns = (): ColumnDef<Dispensation>[] => [
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
              <Link href={`/dispensation-receipt/${dispensation.id}`} target="_blank" className="w-full h-full flex items-center cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Recibo
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];

interface PatientHistoryClientPageProps {
  initialPatient: Patient;
  initialDispensations: Dispensation[];
}

export function PatientHistoryClientPage({ initialPatient, initialDispensations }: PatientHistoryClientPageProps) {
  
  const columns = getColumns();

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-6 w-6" />
                    Detalhes do Paciente
                </CardTitle>
                <CardDescription>
                    Informações cadastrais do paciente.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><span className="font-semibold">Nome:</span> {initialPatient.name}</div>
                <div><span className="font-semibold">CPF:</span> {initialPatient.cpf}</div>
                <div><span className="font-semibold">CNS:</span> {initialPatient.cns}</div>
                {initialPatient.unitName && <div><span className="font-semibold">Unidade:</span> {initialPatient.unitName}</div>}
                <div><span className="font-semibold">Demandas:</span> {initialPatient.demandItems?.join(', ') || 'N/A'}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Dispensação</CardTitle>
                <CardDescription>
                Acompanhe todas as dispensações de itens para este paciente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={initialDispensations} />
            </CardContent>
        </Card>
    </div>
  );
}
