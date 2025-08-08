
'use server';

import { orders as allOrders } from "@/lib/data";
import { getUnits } from "@/lib/actions";
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
  const units = await getUnits();
  const unit = units.find(u => u.id === params.unitId);
  
  // TODO: Fetch orders from Firestore once migrated
  const orders = allOrders.filter(o => o.unitId === params.unitId);

  if (!unit) {
    notFound();
  }

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
