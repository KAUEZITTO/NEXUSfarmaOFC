
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Pill, Stethoscope, ArrowLeft, FileText, CheckCircle, XCircle, Home, Truck, FlaskConical, Ambulance, Hourglass, ShoppingCart, Send } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Order, Unit as UnitType, OrderStatus } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const calculateItemTotals = (orders: Order[]) => {
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

interface UnitDetailsClientPageProps {
    initialUnit: UnitType;
    initialPatientCount: number;
    initialOrders: Order[];
}

const ServiceIndicator = ({ name, available, icon: Icon }: { name: string, available?: boolean, icon: React.ElementType }) => (
    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
        <Icon className={cn("h-5 w-5", available ? 'text-primary' : 'text-muted-foreground/60')} />
        <span className="flex-1 text-sm font-medium">{name}</span>
        {available ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive/50" />}
    </div>
)

const sentOrderColumns: ColumnDef<Order>[] = [
    { accessorKey: "sentDate", header: "Data Envio", cell: ({ row }) => new Date(row.getValue("sentDate")).toLocaleDateString('pt-BR', { timeZone: 'UTC' })},
    { accessorKey: "orderType", header: "Tipo" },
    { accessorKey: "itemCount", header: "Nº Itens" },
    { 
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as OrderStatus;
            const statusIcons = { 'Em análise': <Hourglass className="mr-2 h-4 w-4" />, 'Atendido': <CheckCircle className="mr-2 h-4 w-4" />, 'Não atendido': <XCircle className="mr-2 h-4 w-4" /> };
            return <Badge variant={status === 'Atendido' ? 'default' : status === 'Não atendido' ? 'destructive' : 'secondary'} className={cn('flex items-center w-fit', { 'bg-green-600': status === 'Atendido' })}>{statusIcons[status]} {status}</Badge>;
        }
    },
];

const receivedOrderColumns: ColumnDef<Order>[] = [
    { accessorKey: "sentDate", header: "Data Envio", cell: ({ row }) => new Date(row.getValue("sentDate")).toLocaleDateString('pt-BR', { timeZone: 'UTC' })},
    { accessorKey: "deliveryDate", header: "Data Entrega", cell: ({ row }) => row.getValue("deliveryDate") ? new Date(row.getValue("deliveryDate") as string).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : <span className="text-muted-foreground">Pendente</span>},
    { accessorKey: "itemCount", header: "Nº Itens" },
    { id: "actions", cell: ({ row }) => <Button asChild variant="outline" size="sm"><Link href={`/receipt/${row.original.id}`} target="_blank"><FileText className="mr-2 h-4 w-4" />Recibo</Link></Button> },
];


export function UnitDetailsClientPage({ initialUnit, initialPatientCount, initialOrders }: UnitDetailsClientPageProps) {
  
  const { medCount: totalMedicationsSent, materialCount: totalMaterialsSent } = calculateItemTotals(initialOrders);

  const isHospital = initialUnit.name.toLowerCase().includes('hospital');

  const hospitalSentOrders = isHospital ? initialOrders.filter(o => o.creatorName !== 'Sistema') : [];
  const unitReceivedOrders = initialOrders.filter(o => o.creatorName === 'Sistema');

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
                    {initialUnit.name}
                </h1>
                <p className="text-muted-foreground">{initialUnit.address}</p>
            </div>
        </div>
      </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Vinculados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialPatientCount}</div>
            <p className="text-xs text-muted-foreground">Total de pacientes cadastrados</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medicamentos Enviados</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMedicationsSent.toLocaleString('pt-BR')}</div>
             <p className="text-xs text-muted-foreground">Total de itens (todo o período)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materiais Enviados</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMaterialsSent.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Total de itens (todo o período)</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Serviços Oferecidos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
                <ServiceIndicator name="Farmácia" available={initialUnit.hasPharmacy} icon={Pill} />
                <ServiceIndicator name="Odonto" available={initialUnit.hasDentalOffice} icon={Stethoscope} />
                <ServiceIndicator name="Un. Móvel" available={initialUnit.isMobileUnit} icon={Truck} />
                <ServiceIndicator name="Domiciliar" available={initialUnit.isHomeCare} icon={Home} />
                <ServiceIndicator name="Laboratório" available={initialUnit.hasLaboratory} icon={FlaskConical} />
                <ServiceIndicator name="Resgate" available={initialUnit.isRescueVehicle} icon={Ambulance} />
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
           <div className="flex justify-between items-center">
              <CardDescription>
                Acompanhe as movimentações de entrada e saída de itens.
              </CardDescription>
              <Button asChild variant="outline">
                  <Link href={`/dashboard/orders`}>Ver Histórico Completo</Link>
              </Button>
           </div>
        </CardHeader>
        <CardContent>
           {isHospital ? (
                <Tabs defaultValue="received">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="received">
                            <ShoppingCart className="mr-2 h-4 w-4"/> Remessas Recebidas do CAF
                        </TabsTrigger>
                        <TabsTrigger value="sent">
                            <Send className="mr-2 h-4 w-4"/> Pedidos Enviados ao CAF
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="received" className="mt-4">
                        <DataTable columns={receivedOrderColumns} data={unitReceivedOrders} />
                    </TabsContent>
                    <TabsContent value="sent" className="mt-4">
                        <DataTable columns={sentOrderColumns} data={hospitalSentOrders} />
                    </TabsContent>
                </Tabs>
           ) : (
                <DataTable columns={receivedOrderColumns} data={unitReceivedOrders} />
           )}
        </CardContent>
      </Card>
    </div>
  );
}

