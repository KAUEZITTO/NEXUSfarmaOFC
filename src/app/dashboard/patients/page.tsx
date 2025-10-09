
'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttendPatientDialog } from "@/components/dashboard/attend-patient-dialog";
import { AddPatientDialog } from "@/components/dashboard/add-patient-dialog";
import { Button } from "@/components/ui/button";
import type { Patient, PatientFilter, PatientStatus, ColumnDef } from "@/lib/types";
import { PlusCircle, Loader2, Eye, Edit, UserCheck, UserX, CheckCircle, XCircle, HeartPulse, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { updatePatientStatus } from "@/lib/actions";
import { getPatients } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"


const filterCategories: { label: string, value: PatientFilter }[] = [
    { label: 'Ativos', value: 'active' },
    { label: 'Inativos', value: 'inactive' },
    { label: 'Insulinas', value: 'insulin' },
    { label: 'Fraldas', value: 'diapers' },
    { label: 'Acamados', value: 'bedridden' },
    { label: 'Judicial', value: 'legal' },
    { label: 'Municipal', value: 'municipal' },
    { label: 'Todos', value: 'all' },
];

export default function PatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const initialFilter = (searchParams.get('filter') as PatientFilter) || 'active';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeFilter, setActiveFilter] = useState<PatientFilter>(initialFilter);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const newFilter = (searchParams.get('filter') as PatientFilter) || 'active';
    setActiveFilter(newFilter);
    
    setIsLoading(true);
    startTransition(async () => {
      const fetchedPatients = await getPatients(newFilter);
      setPatients(fetchedPatients);
      setIsLoading(false);
    });

  }, [searchParams]);


  const handleFilterChange = (filter: PatientFilter) => {
    startTransition(() => {
        router.push(`/dashboard/patients?filter=${filter}`);
    });
  }

  const handlePatientSaved = () => {
    startTransition(() => {
      router.refresh();
    });
  }
  
  const handleUpdateStatus = async (patientId: string, status: PatientStatus) => {
    startTransition(async () => {
      try {
        await updatePatientStatus(patientId, status);
        toast({
          title: "Status Atualizado!",
          description: `O status do paciente foi alterado para ${status}.`,
        });
        router.refresh(); 
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar status",
          description: "Não foi possível alterar o status do paciente.",
        });
      }
    });
  };

  const getColumns = (onPatientSaved: () => void, onUpdateStatus: (patientId: string, status: PatientStatus) => void): ColumnDef<Patient>[] => {
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
      accessorKey: "demandItems",
      header: "Demandas",
      cell: ({ row }) => {
          const demands = row.getValue("demandItems") as string[] | undefined;
          if (!demands || demands.length === 0) return 'N/A';
          return <div className="flex flex-wrap gap-1">
              {demands.map(d => <Badge key={d} variant="secondary" className="font-normal">{d}</Badge>)}
          </div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status: PatientStatus = row.getValue("status");
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
                <Link href={`/dashboard/patients/${patient.id}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Histórico
                </Link>
              </DropdownMenuItem>
               <AddPatientDialog patientToEdit={patient} onPatientSaved={onPatientSaved} trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Editar Cadastro</span>
                  </DropdownMenuItem>
              } />
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

  const columns = getColumns(handlePatientSaved, handleUpdateStatus);


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <CardTitle>Registro de Pacientes</CardTitle>
            <CardDescription>
              Visualize e gerencie as informações dos pacientes.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <AttendPatientDialog onDispensationSaved={handlePatientSaved} />
            <AddPatientDialog onPatientSaved={handlePatientSaved} trigger={
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Paciente
              </Button>
            } />
          </div>
        </div>
         <div className="flex items-center space-x-2 pt-4 overflow-x-auto pb-2">
            {filterCategories.map(filter => (
                 <Button 
                    key={filter.value}
                    variant={activeFilter === filter.value ? "default" : "outline"}
                    onClick={() => handleFilterChange(filter.value)}
                    className="rounded-full flex-shrink-0"
                    disabled={isPending}
                >
                    {isPending && activeFilter === filter.value ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : filter.label}
                </Button>
            ))}
        </div>
      </CardHeader>
      <CardContent>
         {isLoading || isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <DataTable columns={columns} data={patients} filterColumn="name" />
        )}
      </CardContent>
    </Card>
  );
}
