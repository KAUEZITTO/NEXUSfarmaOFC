
'use client';

import Link from "next/link";
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
import { useEffect, useState } from "react";
import type { Unit } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUnits() {
      setLoading(true);
      const fetchedUnits = await getUnits();
      setUnits(fetchedUnits);
      setLoading(false);
    }
    loadUnits();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Unidades Atendidas</CardTitle>
            <CardDescription>
              Selecione uma unidade para ver o histórico de pedidos ou crie uma nova remessa.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/orders/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Remessa
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
         {loading ? (
             <div className="space-y-2">
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
