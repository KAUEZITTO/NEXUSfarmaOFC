
import { getUnits } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrdersClient } from "./orders-client";

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const units = await getUnits();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unidades Atendidas</CardTitle>
        <CardDescription>
          Selecione uma unidade para ver o histórico de pedidos ou crie uma nova remessa.
        </CardDescription>
      </CardHeader>
      <CardContent>
          <OrdersClient units={units} />
      </CardContent>
    </Card>
  );
}
