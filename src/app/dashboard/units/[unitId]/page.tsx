
'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
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
import type { Order, OrderItem, Unit as UnitType, Patient } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';


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

export default function UnitDetailsPage({ params }: { params: { unitId: string } }) {
  const [unit, setUnit] = useState<UnitType | null>(null);
  const [patientCount, setPatientCount] = useState(0);
  const [unitOrders, setUnitOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const unitData = await getUnit(params.unitId);
            if (!unitData) {
                notFound();
                return;
            }
            setUnit(unitData);

            const [allPatientsData, unitOrdersData] = await Promise.all([
                getPatients(),
                getOrdersForUnit(params.unitId),
            ]);

            setPatientCount(allPatientsData.filter(p => p.unitId === params.unitId).length);
            setUnitOrders(unitOrdersData);

        } catch (error) {
            console.error("Failed to fetch unit details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, [params.unitId]);

  const { medCount: totalMedicationsSent, materialCount: totalMaterialsSent } = calculateItemTotals(unitOrders);

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-5 w-72" />
                </div>
            </div>
             <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-8 w-12" /></CardHeader></Card>
                <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-8 w-12" /></CardHeader></Card>
                <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-8 w-12" /></CardHeader></Card>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-4 w-80 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!unit) {
    return null; // Or a more specific not-found component
  }

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

    