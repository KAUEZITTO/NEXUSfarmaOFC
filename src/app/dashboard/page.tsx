
import {
  Activity,
  ArrowUpRight,
  CircleUser,
  CreditCard,
  DollarSign,
  Menu,
  Package2,
  Search,
  Users,
  AlertTriangle,
  Package,
  Building2,
  CalendarClock,
  Truck,
  FileText
} from "lucide-react"
import Link from "next/link"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { getProducts, getOrders, getAllDispensations } from "@/lib/actions"
import type { Product, Order, Unit, Dispensation } from "@/lib/types"
import { MonthlyConsumptionChart } from "@/components/dashboard/monthly-consumption-chart"

export const dynamic = 'force-dynamic';

const getUnitsServed = (orders: Order[]) => {
    const unitsMap = new Map<string, { name: string, itemCount: number, type: string }>();

    orders.forEach(order => {
        const existingUnit = unitsMap.get(order.unitId);
        if (existingUnit) {
            existingUnit.itemCount += order.itemCount;
        } else {
            // This is a simplified version; in a real app, you'd fetch unit details
            // to get the correct type. For now, we'll mock it.
            unitsMap.set(order.unitId, {
                name: order.unitName,
                itemCount: order.itemCount,
                type: 'Hospital' // Mock type
            });
        }
    });

    return Array.from(unitsMap.values()).sort((a, b) => b.itemCount - a.itemCount).slice(0, 5);
}

const getChartData = (products: Product[]) => {
    const categoryMap = new Map<string, number>();

    products.forEach(product => {
        const currentTotal = categoryMap.get(product.category) || 0;
        categoryMap.set(product.category, currentTotal + product.quantity);
    });

    return Array.from(categoryMap.entries()).map(([name, total]) => ({ name, total }));
}

const getDailyDepartures = (orders: Order[], dispensations: Dispensation[]) => {
    const today = new Date().toISOString().slice(0, 10);

    const orderDepartures = orders
        .filter(o => o.sentDate.slice(0, 10) === today)
        .map(o => ({
            id: o.id,
            destination: o.unitName,
            type: 'Remessa' as const,
            itemCount: o.itemCount,
            receiptUrl: `/receipt/${o.id}`
        }));

    const dispensationDepartures = dispensations
        .filter(d => d.date.slice(0, 10) === today)
        .map(d => ({
            id: d.id,
            destination: d.patient.name,
            type: 'Dispensação' as const,
            itemCount: d.items.reduce((sum, item) => sum + item.quantity, 0),
            receiptUrl: `/dispensation-receipt/${d.id}`
        }));

    return [...orderDepartures, ...dispensationDepartures].sort((a,b) => a.destination.localeCompare(b.destination));
}

export default async function Dashboard() {

  const [products, orders, dispensations] = await Promise.all([
    getProducts(),
    getOrders(),
    getAllDispensations(),
  ]);

  const lowStockItems = products.filter(p => p.status === 'Baixo Estoque').length;
  const totalStockItems = products.reduce((sum, p) => sum + p.quantity, 0);
  
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const expiringSoonItems = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    return expiry > now && expiry <= thirtyDaysFromNow;
  }).length;
  
  const currentMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.sentDate);
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  }).length;

  const lastMonth = new Date();
  lastMonth.setMonth(now.getMonth() - 1);
  const previousMonthOrders = orders.filter(o => {
        const orderDate = new Date(o.sentDate);
        return orderDate.getMonth() === lastMonth.getMonth() && orderDate.getFullYear() === lastMonth.getFullYear();
    }).length;

    let orderPercentageChange = 0;
    if (previousMonthOrders > 0) {
        orderPercentageChange = ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100;
    } else if (currentMonthOrders > 0) {
        orderPercentageChange = 100; // If last month had 0 and this month has orders, it's a big increase.
    }

  const unitsServed = getUnitsServed(orders);
  const chartData = getChartData(products);
  const dailyDepartures = getDailyDepartures(orders, dispensations);


  return (
    <div className="flex flex-col w-full">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Itens em Baixo Estoque
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Itens que precisam de reposição
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos ao Vencimento
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringSoonItems}</div>
            <p className="text-xs text-muted-foreground">
              Itens vencendo nos próximos 30 dias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos no Mês</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{currentMonthOrders}</div>
            <p className="text-xs text-muted-foreground">
                {orderPercentageChange >= 0 ? `+${orderPercentageChange.toFixed(0)}%` : `${orderPercentageChange.toFixed(0)}%`} em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStockItems.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Total de unidades de produtos
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-6">
        <Card className="xl:col-span-2">
           <CardHeader>
            <CardTitle>Níveis de Estoque por Categoria</CardTitle>
            <CardDescription>
              Distribuição de itens de estoque nas principais categorias.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Saídas do Dia
              </CardTitle>
              <CardDescription>
                Remessas e dispensações de hoje.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destino</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Itens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyDepartures.length > 0 ? (
                    dailyDepartures.map(departure => (
                      <TableRow key={departure.id}>
                        <TableCell>
                          <Link href={departure.receiptUrl} target="_blank" className="cursor-pointer hover:underline font-medium text-primary">
                            {departure.destination}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={departure.type === 'Remessa' ? 'secondary' : 'default'} className={departure.type === 'Remessa' ? 'bg-blue-100 text-blue-800' : ''}>
                              {departure.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{departure.itemCount}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">
                            Nenhuma saída registrada hoje.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
        </Card>
      </div>
       <div className="grid gap-4 md:gap-8 mt-6">
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
       </div>
    </div>
  )
}
