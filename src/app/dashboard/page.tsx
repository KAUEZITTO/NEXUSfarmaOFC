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
  CalendarClock
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
import { getProducts, getOrders } from "@/lib/actions"
import type { Product, Order, Unit } from "@/lib/types"
import { AnalyticsChat } from "@/components/dashboard/analytics-chat"


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

export default async function Dashboard() {

  const [products, orders] = await Promise.all([
    getProducts(),
    getOrders()
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
           <AnalyticsChat />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unidades Mais Atendidas</CardTitle>
            <CardDescription>
              Unidades que mais receberam itens este mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Itens Recebidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitsServed.map(unit => (
                    <TableRow key={unit.name}>
                        <TableCell>
                            <div className="font-medium">{unit.name}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                            {unit.type}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">{unit.itemCount.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                ))}
                {unitsServed.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center h-24">
                            Nenhum pedido registrado este mês.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="xl:col-span-3">
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
      </div>
    </div>
  )
}
