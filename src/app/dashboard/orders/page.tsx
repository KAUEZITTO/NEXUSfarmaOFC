import Link from "next/link";
import { orders } from "@/lib/data";
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

export default function OrdersPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Pedidos e Remessas</CardTitle>
            <CardDescription>
              Acompanhe todos os pedidos e crie novas remessas.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/orders/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Pedido
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={orders} filterColumn="unit" />
      </CardContent>
    </Card>
  );
}
