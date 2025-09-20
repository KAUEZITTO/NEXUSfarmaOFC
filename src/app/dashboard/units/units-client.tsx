
'use client';

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
import { AddUnitDialog } from "@/components/dashboard/add-unit-dialog";
import type { Unit } from '@/lib/types';
import { getColumns } from "./columns";
import { useRouter } from "next/navigation";


interface UnitsClientProps {
    initialUnits: Unit[];
}

export function UnitsClient({ initialUnits }: UnitsClientProps) {
  const router = useRouter();

  const handleUnitSaved = () => {
    router.refresh();
  }

  const columns = getColumns({ onUnitSaved: handleUnitSaved });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Unidades</CardTitle>
            <CardDescription>
              Cadastre e gerencie as unidades que recebem os produtos.
            </CardDescription>
          </div>
          <AddUnitDialog 
            onUnitSaved={handleUnitSaved}
            trigger={
              <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Unidade
              </Button>
            } 
          />
        </div>
      </CardHeader>
      <CardContent>
          <DataTable columns={columns} data={initialUnits} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
