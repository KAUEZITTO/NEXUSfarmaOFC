
import { getUnits } from "@/lib/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrdersClient } from "./orders-client";

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
