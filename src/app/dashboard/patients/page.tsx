
'use client';

import { useState, useEffect } from "react";
import { getAllPatients } from "@/lib/actions";
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
import type { Patient } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type FilterCategory = 'Ativos' | 'Inativos' | 'Insulinas' | 'Fraldas' | 'Acamados' | 'Judicial' | 'Municipal' | 'Todos';

const filterCategories: FilterCategory[] = ['Ativos', 'Inativos', 'Insulinas', 'Fraldas', 'Acamados', 'Judicial', 'Municipal', 'Todos'];

const filterPatients = (patients: Patient[], filter: FilterCategory): Patient[] => {
    switch(filter) {
        case 'Ativos':
             return patients.filter(p => p.status === 'Ativo');
        case 'Inativos':
            return patients.filter(p => p.status !== 'Ativo');
        case 'Insulinas':
            return patients.filter(p => p.isAnalogInsulinUser && p.status === 'Ativo');
        case 'Fraldas':
            return patients.filter(p => p.municipalItems?.includes('Fraldas') && p.status === 'Ativo');
        case 'Acamados':
            return patients.filter(p => p.isBedridden && p.status === 'Ativo');
        case 'Judicial':
            return patients.filter(p => p.mandateType === 'Legal' && p.status === 'Ativo');
        case 'Municipal':
            return patients.filter(p => p.mandateType === 'Municipal' && p.status === 'Ativo');
        case 'Todos':
        default:
            return patients;
    }
}


export default function PatientsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('Ativos');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    setLoading(true);
    // Fetch all patients to allow for filtering on the client-side
    const fetchedPatients = await getAllPatients();
    setPatients(fetchedPatients);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);


  const filteredPatients = filterPatients(patients, activeFilter);
  const dataTableColumns = columns({ onPatientStatusChanged: fetchPatients });

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
            <AttendPatientDialog onDispensationSaved={fetchPatients} />
            <AddPatientDialog onPatientSaved={fetchPatients} trigger={
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
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    onClick={() => setActiveFilter(filter)}
                    className="rounded-full flex-shrink-0"
                >
                    {filter}
                </Button>
            ))}
        </div>
      </CardHeader>
      <CardContent>
         {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <DataTable columns={dataTableColumns} data={filteredPatients} filterColumn="name" />
        )}
      </CardContent>
    </Card>
  );
}
