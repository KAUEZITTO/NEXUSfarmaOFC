import { patients } from "@/lib/data";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
            <Button>
              <UserCheck className="mr-2 h-4 w-4" />
              Atender Paciente
            </Button>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Paciente
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={patients} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
