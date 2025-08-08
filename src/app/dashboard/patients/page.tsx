
'use client';

import { useState, useEffect } from "react";
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
import type { Patient } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type FilterCategory = 'Todos' | 'Insulinas' | 'Fraldas' | 'Acamados' | 'Judicial' | 'Municipal';

const filterCategories: FilterCategory[] = ['Todos', 'Insulinas', 'Fraldas', 'Acamados', 'Judicial', 'Municipal'];

const filterPatients = (patients: Patient[], filter: FilterCategory): Patient[] => {
    switch(filter) {
        case 'Insulinas':
            return patients.filter(p => p.isAnalogInsulinUser);
        case 'Fraldas':
            return patients.filter(p => p.municipalItems?.includes('Fraldas'));
        case 'Acamados':
            return patients.filter(p => p.isBedridden);
        case 'Judicial':
            return patients.filter(p => p.mandateType === 'Legal');
        case 'Municipal':
            return patients.filter(p => p.mandateType === 'Municipal');
        case 'Todos':
        default:
            return patients;
    }
}


export default function PatientsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('Todos');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    setLoading(true);
    const fetchedPatients = await getPatients();
    setPatients(fetchedPatients);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);


  const filteredPatients = filterPatients(patients, activeFilter);

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
          <DataTable columns={columns({ onPatientStatusChanged: fetchPatients })} data={filteredPatients} filterColumn="name" />
        )}
      </CardContent>
    </Card>
  );
}
