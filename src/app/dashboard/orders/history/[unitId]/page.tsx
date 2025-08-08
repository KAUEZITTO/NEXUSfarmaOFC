import { orders as allOrders, units } from "@/lib/data";
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

export default function OrderHistoryPage({ params }: { params: { unitId: string } }) {
  const unit = units.find(u => u.id === params.unitId);
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
