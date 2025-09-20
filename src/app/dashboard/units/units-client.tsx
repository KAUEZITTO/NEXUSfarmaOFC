
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
import { columns } from "./columns";

interface UnitsClientProps {
    initialUnits: Unit[];
}

export function UnitsClient({ initialUnits }: UnitsClientProps) {

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
