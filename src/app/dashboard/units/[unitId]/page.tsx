
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Pill, Stethoscope, ArrowLeft, FileText, CheckCircle, XCircle } from "lucide-react";
import { getUnit, getPatients, getOrdersForUnit } from "@/lib/data";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { OrderItem } from "@/lib/types";

// This function now uses real order data
const calculateItemTotals = (orders: { items: OrderItem[] }[]) => {
    let medCount = 0;
    let materialCount = 0;

    orders.forEach(order => {
        order.items.forEach(item => {
            if (item.category === 'Medicamento') {
                medCount += item.quantity;
            } else if (item.category === 'Material Técnico') {
                materialCount += item.quantity;
            }
        });
    });

    return { medCount, materialCount };
};

export default async function UnitDetailsPage({ params }: { params: { unitId: string } }) {
  const unit = await getUnit(params.unitId);

  if (!unit) {
    notFound();
  }
  
  const [allPatients, unitOrders] = await Promise.all([
    getPatients(),
    getOrdersForUnit(unit.id)
  ]);
  
  const patientCount = allPatients.filter(p => p.unitId === unit.id).length;
  
  const { medCount: totalMedicationsSent, materialCount: totalMaterialsSent } = calculateItemTotals(unitOrders);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard/units">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Building2 className="h-6 w-6" />
                    {unit.name}
                </h1>
                <p className="text-muted-foreground">{unit.address}</p>
            </div>
        </div>
         <div className="flex gap-2">
            <p className="flex items-center text-sm text-muted-foreground gap-2">
                {unit.hasPharmacy ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                Farmácia
            </p>
             <p className="flex items-center text-sm text-muted-foreground gap-2">
                {unit.hasDentalOffice ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                Odontologia
            </p>
         </div>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Vinculados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientCount}</div>
            <p className="text-xs text-muted-foreground">Total de pacientes cadastrados nesta unidade</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medicamentos Enviados</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMedicationsSent}</div>
             <p className="text-xs text-muted-foreground">Total de itens (todo o período)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materiais Enviados</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMaterialsSent}</div>
            <p className="text-xs text-muted-foreground">Total de itens (todo o período)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pedidos Recentes</CardTitle>
          <CardDescription>
            Últimos pedidos e remessas para esta unidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pedido</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Data de Entrega</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitOrders.length > 0 ? unitOrders.slice(0, 10).map((order) => (
                   <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.id.substring(0, 8)}...</TableCell>
                      <TableCell>{new Date(order.sentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                      <TableCell>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : <span className="text-muted-foreground">Pendente</span>}</TableCell>
                      <TableCell>{order.itemCount}</TableCell>
                      <TableCell>
                         <Badge 
                            variant={order.status === 'Cancelado' ? 'destructive' : order.status === 'Pendente' ? 'secondary' : 'default'} 
                            className={cn({
                                'bg-orange-500 text-white': order.status === 'Pendente',
                                'bg-blue-500 text-white': order.status === 'Em Trânsito',
                                'bg-green-600 text-white': order.status === 'Entregue'
                            })}
                         >
                            {order.status}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/receipt/${order.id}`} target="_blank">
                                <FileText className="mr-2 h-4 w-4" />
                                Recibo
                            </Link>
                          </Button>
                      </TableCell>
                   </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">Nenhum pedido encontrado para esta unidade.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
