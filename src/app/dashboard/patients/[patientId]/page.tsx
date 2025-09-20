
import { getPatient, getDispensationsForPatient } from "@/lib/actions";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notFound } from "next/navigation";
import { User } from "lucide-react";

export default async function PatientHistoryPage({ params }: { params: { patientId: string } }) {
  const patient = await getPatient(params.patientId);

  if (!patient) {
    notFound();
  }

  const dispensations = await getDispensationsForPatient(params.patientId);


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
                <div><span className="font-semibold">Nome:</span> {patient.name}</div>
                <div><span className="font-semibold">CPF:</span> {patient.cpf}</div>
                <div><span className="font-semibold">CNS:</span> {patient.cns}</div>
                {patient.unitName && <div><span className="font-semibold">Unidade:</span> {patient.unitName}</div>}
                <div><span className="font-semibold">Tipo de Mandado:</span> {patient.mandateType}</div>
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
                <DataTable columns={columns} data={dispensations} filterColumn="id" />
            </CardContent>
        </Card>
    </div>
  );
}
