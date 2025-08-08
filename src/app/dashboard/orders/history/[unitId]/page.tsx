
'use server';

import { getOrdersForUnit, getUnit } from "@/lib/actions";
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

export default async function OrderHistoryPage({ params }: { params: { unitId: string } }) {
  const unit = await getUnit(params.unitId);
  
  if (!unit) {
    notFound();
  }
  
  const orders = await getOrdersForUnit(params.unitId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pedidos: {unit.name}</CardTitle>
        <CardDescription>
          Acompanhe todos os pedidos e remessas para esta unidade.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={orders} filterColumn="id" />
      </CardContent>
    </Card>
  );
}
