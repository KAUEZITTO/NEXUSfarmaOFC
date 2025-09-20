

'use server';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, BarChart2, AlertTriangle, Package, Users } from "lucide-react";
import { MonthlyConsumptionChart } from "@/components/dashboard/monthly-consumption-chart";
import { getProducts, getAllPatients, getAllDispensations, getUnits, getOrders, getStockMovements } from "@/lib/actions";
import { ReportsClient } from "./reports-client";


export default async function ReportsPage() {
    const [products, patients, dispensations, units, orders, stockMovements] = await Promise.all([
        getProducts(),
        getAllPatients(),
        getAllDispensations(),
        getUnits(),
        getOrders(),
        getStockMovements(),
    ]);

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const lowStockItems = products.filter(p => p.status === 'Baixo Estoque').length;
  const expiringSoonItems = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    return expiry > now && expiry <= thirtyDaysFromNow;
  }).length;
  
  const totalStockAlerts = lowStockItems + expiringSoonItems;

  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const itemsDispensedThisMonth = dispensations
    .filter(d => new Date(d.date) >= firstDayOfMonth)
    .reduce((total, d) => total + d.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const firstDayOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const itemsDispensedLastMonth = dispensations
    .filter(d => {
        const dDate = new Date(d.date);
        return dDate >= firstDayOfLastMonth && dDate <= lastDayOfLastMonth;
    })
    .reduce((total, d) => total + d.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  
  let monthlyChangePercentage = 0;
  if (itemsDispensedLastMonth > 0) {
    monthlyChangePercentage = ((itemsDispensedThisMonth - itemsDispensedLastMonth) / itemsDispensedLastMonth) * 100;
  } else if (itemsDispensedThisMonth > 0) {
    monthlyChangePercentage = 100;
  }
  
  const judicialPatients = patients.filter(p => p.mandateType === 'Legal' || p.mandateType === 'Municipal').length;


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">
            Gere e visualize relatórios de dispensação, estoque e mais.
          </p>
        </div>
        <ReportsClient
            products={products}
            patients={patients}
            dispensations={dispensations}
            units={units}
            orders={orders}
            stockMovements={stockMovements}
        >
             <Button>
                <Download className="mr-2 h-4 w-4" />
                Exportar Relatório Completo
            </Button>
        </ReportsClient>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Dispensados (Mês)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemsDispensedThisMonth.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
                 {monthlyChangePercentage >= 0 ? `+${monthlyChangePercentage.toFixed(1)}%` : `${monthlyChangePercentage.toFixed(1)}%`} em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{judicialPatients}</div>
            <p className="text-xs text-muted-foreground">Pacientes com mandado judicial/municipal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStockAlerts}</div>
            <p className="text-xs text-muted-foreground">{lowStockItems} baixo estoque, {expiringSoonItems} perto do vencimento</p>
          </CardContent>
        </Card>
      </div>

       <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Consumo Mensal de Itens
            </CardTitle>
            <CardDescription>
              Visualize a quantidade de itens dispensados nos últimos 6 meses.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <MonthlyConsumptionChart dispensations={dispensations} />
          </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatórios Específicos</CardTitle>
          <CardDescription>
            Selecione um tipo de relatório para gerar um documento PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
             <ReportsClient
                products={products}
                patients={patients}
                dispensations={dispensations}
                units={units}
                orders={orders}
                stockMovements={stockMovements}
            >
                <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Dispensação por Unidade
                </Button>
                <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Estoque Atual
                </Button>
                <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Produtos a Vencer
                </Button>
                <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Atendimento de Pacientes
                </Button>
                <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Entradas e Saídas
                </Button>
                <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Relatório de Lotes
                </Button>
            </ReportsClient>
        </CardContent>
      </Card>
    </div>
  );
}
