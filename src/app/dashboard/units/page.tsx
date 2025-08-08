
'use client';

import { useState, useEffect } from 'react';
import { getUnits } from "@/lib/actions";
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
import { AddUnitDialog } from "@/components/dashboard/add-unit-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import type { Unit } from '@/lib/types';


export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnits = async () => {
    setLoading(true);
    const fetchedUnits = await getUnits();
    setUnits(fetchedUnits);
    setLoading(false);
  };

  useEffect(() => {
    fetchUnits();
  }, []);

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
            onUnitSaved={fetchUnits}
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
        {loading ? (
             <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        ) : (
          <DataTable columns={columns} data={units} filterColumn="name" />
        )}
      </CardContent>
    </Card>
  );
}
