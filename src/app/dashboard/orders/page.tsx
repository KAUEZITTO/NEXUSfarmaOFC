
'use server';

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

export default async function OrdersPage() {
  const units = await getUnits();

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
          <DataTable columns={columns} data={units} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
