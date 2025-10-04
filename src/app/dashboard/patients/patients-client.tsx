
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
import type { Patient, PatientFilter, PatientStatus } from "@/lib/types";
import { PlusCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getColumns } from "./columns";
import { useToast } from "@/hooks/use-toast";
import { updatePatientStatus } from "@/lib/actions";

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

interface PatientsClientProps {
    initialPatients: Patient[];
    initialFilter: PatientFilter;
}

export function PatientsClient({ initialPatients, initialFilter }: PatientsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

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
        router.refresh(); // Pede ao servidor para revalidar os dados
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar status",
          description: "Não foi possível alterar o status do paciente.",
        });
      }
    });
  };

  const columns = getColumns(handlePatientSaved, handleUpdateStatus);


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Registro de Pacientes</CardTitle>
            <CardDescription>
              Visualize e gerencie as informações dos pacientes.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {/* O componente de atendimento agora busca seus próprios dados */}
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
                    variant={initialFilter === filter.value ? "default" : "outline"}
                    onClick={() => handleFilterChange(filter.value)}
                    className="rounded-full flex-shrink-0"
                    disabled={isPending}
                >
                    {isPending && initialFilter === filter.value ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : filter.label}
                </Button>
            ))}
        </div>
      </CardHeader>
      <CardContent>
         {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <DataTable columns={columns} data={initialPatients} filterColumn="name" />
        )}
      </CardContent>
    </Card>
  );
}
