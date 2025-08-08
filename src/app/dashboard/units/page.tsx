import { units } from "@/lib/data";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UnitsPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Unidades de Destino</CardTitle>
            <CardDescription>
              Cadastre e gerencie as unidades que recebem os produtos.
            </CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Unidade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={units} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
