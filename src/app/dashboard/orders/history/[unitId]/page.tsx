
import { getOrdersForUnit, getUnit } from "@/lib/data";
import { OrderHistoryClient } from "./history-client";
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
        <OrderHistoryClient orders={orders} />
      </CardContent>
    </Card>
  );
}
