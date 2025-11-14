
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
import { Input } from "@/components/ui/input";
import { AddPatientDialog } from "@/components/dashboard/add-patient-dialog";
import { Button } from "@/components/ui/button";
import type { Patient, PatientFilter, PatientStatus, Unit, Dispensation } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, Loader2, Eye, Edit, UserCheck, UserX, CheckCircle, XCircle, HeartPulse, MoreHorizontal, ArrowUpDown, Search, Trash2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updatePatientStatus, deletePatient } from "@/lib/actions";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useDebounce } from 'use-debounce';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const filterCategories: { label: string, value: PatientFilter }[] = [
    { label: 'Ativos', value: 'active' },
    { label: 'Inativos', value: 'inactive' },
    { label: 'Insulinas', value: 'insulin' },
    { label: 'Fraldas', value: 'diapers' },
    { label: 'Acamados', value: 'bedridden' },
    { label: 'Judicial', value: 'legal' },
    { label: 'Municipal', value: 'municipal' },
    { label: 'Tiras de Glicemia', value: 'strips'},
    { label: 'Fórmulas', value: 'formulas'},
    { label: 'Imunoglobulina', value: 'immunoglobulin'},
    { label: 'Todos', value: 'all' },
];

const dispensationColumns: ColumnDef<Dispensation>[] = [
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    },
    {
      accessorKey: "patient.name",
      header: "Paciente",
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
      accessorKey: "creatorName",
      header: "Dispensado por",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button asChild variant="outline" size="sm">
          <Link href={`/dispensation-receipt/${row.original.id}`} target="_blank">
            <Eye className="mr-2 h-4 w-4" />
            Ver Recibo
          </Link>
        </Button>
      )
    }
];

export function PatientsClientPage({
  initialPatients,
  initialUnits,
  initialDispensations,
  searchParams
}: {
  initialPatients: Patient[],
  initialUnits: Unit[],
  initialDispensations: Dispensation[],
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const router = useRouter();
  const { toast } = useToast();
  
  const activeFilter = (searchParams?.filter as PatientFilter) || 'active';
  const initialSearchTerm = (searchParams?.q as string) || '';

  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const handleUrlChange = (key: 'filter' | 'q', value: string) => {
    startTransition(() => {
        const params = new URLSearchParams(window.location.search);
        if (value && (key === 'filter' && value !== 'active')) {
            params.set(key, value);
        } else if (value && key === 'q') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/dashboard/patients?${params.toString()}`);
    });
  };

  useEffect(() => {
      handleUrlChange('q', debouncedSearchTerm);
  }, [debouncedSearchTerm]);
  
  const filteredPatients = initialPatients; // Data is already filtered by the server based on URL params

  const handlePatientSaved = () => {
    router.refresh(); 
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
  
  const handleDeletePatient = async (patientId: string, patientName: string) => {
    const result = await deletePatient(patientId);
    if(result.success) {
      toast({ title: 'Paciente Excluído', description: `O paciente ${patientName} foi removido.`});
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: result.message});
    }
  }

  const handlePrintRecord = (patientId: string) => {
    window.open(`/patient-record/${patientId}`, '_blank');
  };


  const getColumns = (onUpdateStatus: (patientId: string, status: PatientStatus) => void): ColumnDef<Patient>[] => {
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
        
        const variantMap: { [key in PatientStatus]?: "default" | "secondary" | "destructive" } = {
          'Ativo': 'default',
          'Tratamento Concluído': 'secondary',
          'Tratamento Interrompido': 'destructive',
          'Óbito': 'destructive'
        };

        return <Badge 
          variant={variantMap[status] ?? 'default'} 
          className={cn({
            'bg-green-600 text-white': status === 'Ativo',
            'bg-blue-500 text-white': status === 'Tratamento Concluído',
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
          <div className="flex items-center gap-2 justify-end">
            <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações do Paciente</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/patients/${patient.id}`} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Histórico
                        </Link>
                    </DropdownMenuItem>
                    <AddPatientDialog 
                        patientToEdit={patient} 
                        onPatientSaved={handlePatientSaved}
                        units={initialUnits}
                        trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Editar Cadastro</span>
                            </DropdownMenuItem>
                        } 
                    />
                    <DropdownMenuItem onClick={() => handlePrintRecord(patient.id)}>
                        <Printer className="mr-2 h-4 w-4" />
                        <span>Imprimir Cadastro</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <HeartPulse className="mr-2 h-4 w-4" />
                            <span>Alterar Status</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'Ativo')} disabled={isPending}>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    <span>Ativo</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'Tratamento Concluído')} disabled={isPending}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    <span>Tratamento Concluído</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'Tratamento Interrompido')} disabled={isPending}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    <span>Tratamento Interrompido</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'Óbito')} disabled={isPending}>
                                    <UserX className="mr-2 h-4 w-4" />
                                    <span>Óbito</span>
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                     <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Excluir Paciente</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Paciente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o paciente <strong>{patient.name}</strong> e todo o seu histórico de dispensação.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeletePatient(patient.id, patient.name)} className="bg-destructive hover:bg-destructive/90">
                      Sim, excluir paciente
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]
  }

  const columns = getColumns(handleUpdateStatus);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Gerenciamento de Pacientes e Dispensações</CardTitle>
            <CardDescription>
              Visualize pacientes e o histórico completo de dispensações.
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild>
              <Link href="/dashboard/dispense/new">
                <UserCheck className="mr-2 h-4 w-4" />
                Nova Dispensação
              </Link>
            </Button>
            <AddPatientDialog 
              onPatientSaved={handlePatientSaved}
              units={initialUnits} 
              trigger={
                <Button variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Paciente
                </Button>
              } 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="patients">
          <TabsList>
            <TabsTrigger value="patients">Pacientes</TabsTrigger>
            <TabsTrigger value="dispensations">Histórico de Dispensações</TabsTrigger>
          </TabsList>
          <TabsContent value="patients" className="mt-4">
            <div className="flex items-center space-x-2 pt-4 overflow-x-auto pb-2">
                {filterCategories.map(filter => (
                    <Button 
                        key={filter.value}
                        variant={activeFilter === filter.value ? "default" : "outline"}
                        onClick={() => handleUrlChange('filter', filter.value)}
                        className="rounded-full flex-shrink-0"
                        disabled={isPending}
                    >
                        {isPending && activeFilter === filter.value ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : filter.label}
                    </Button>
                ))}
            </div>
            <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filtrar por nome, CPF ou CNS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 max-w-sm"
                />
                {isPending && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            </div>
            <div className="mt-4">
              {isPending ? (
                  <div className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                      <p className="mt-2 text-muted-foreground">Carregando pacientes...</p>
                  </div>
              ) : (
                <DataTable columns={columns} data={filteredPatients} />
              )}
            </div>
          </TabsContent>
          <TabsContent value="dispensations" className="mt-4">
             <DataTable columns={dispensationColumns} data={initialDispensations} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
