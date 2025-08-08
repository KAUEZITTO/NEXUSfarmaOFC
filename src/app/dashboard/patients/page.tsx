
'use client';

import { useState, useEffect, useTransition } from "react";
import { getPatients } from "@/lib/actions";
import { columns } from "./columns";
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
import { cn } from "@/lib/utils";
import type { Patient, PatientFilter } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [activeFilter, setActiveFilter] = useState<PatientFilter>('active');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchPatients = (filter: PatientFilter) => {
    setLoading(true);
    startTransition(async () => {
        const fetchedPatients = await getPatients(filter);
        setPatients(fetchedPatients);
        setLoading(false);
    });
  };

  useEffect(() => {
    fetchPatients(activeFilter);
  }, [activeFilter]);


  const dataTableColumns = columns({ onPatientStatusChanged: () => fetchPatients(activeFilter) });

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
            <AttendPatientDialog onDispensationSaved={() => fetchPatients(activeFilter)} />
            <AddPatientDialog onPatientSaved={() => fetchPatients(activeFilter)} trigger={
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
                    onClick={() => setActiveFilter(filter.value)}
                    className="rounded-full flex-shrink-0"
                >
                    {filter.label}
                </Button>
            ))}
        </div>
      </CardHeader>
      <CardContent>
         {loading || isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <DataTable columns={dataTableColumns} data={patients} filterColumn="name" />
        )}
      </CardContent>
    </Card>
  );
}
