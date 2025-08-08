
'use client';

import { patients } from "@/lib/data";
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

export default function PatientsPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Registro de Pacientes</CardTitle>
            <CardDescription>
              Visualize e gerencie as informações dos pacientes.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <AttendPatientDialog />
            <AddPatientDialog />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={patients} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
