import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CalendarDays, Clock, BarChart2, Users, UserRoundCheck, ShoppingCart, Activity, AlertTriangle } from "lucide-react";
import { getProducts, getAllDispensations, getAllUsers, getPatients, getOrders } from "@/lib/data";
import type { Product, Dispensation, Patient, Order, User } from "@/lib/types";
import { MonthlyConsumptionChart } from "@/components/dashboard/monthly-consumption-chart";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { unstable_noStore as noStore } from "next/cache";
import DashboardHeader from "@/components/dashboard/dashboard-header";


type UpcomingReturn = {
    patientId: string;
    patientName: string;
    returnDate: string; // Formatted date string
};

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><Skeleton className="h-8 w-1/4" /></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Próximos do Vencimento</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent><Skeleton className="h-8 w-1/4" /></CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Retornos Próximos</CardTitle>
                        <UserRoundCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                </Card>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card><CardHeader><CardTitle>Consumo Mensal de Itens</CardTitle></CardHeader><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
                <Card><CardHeader><CardTitle>Atividades Recentes</CardTitle></CardHeader><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
            </div>
        </div>
    )
}

function DashboardDataWrapper({ products, dispensations, users, activePatients, orders }: {
    products: Product[],
    dispensations: Dispensation[],
    users: User[],
    activePatients: Patient[],
    orders: Order[]
}) {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const groupedProductsMap = new Map<string, { totalQuantity: number }>();

    products.forEach(product => {
        const key = `${product.name}|${product.presentation}`;
        if (!groupedProductsMap.has(key)) {
            groupedProductsMap.set(key, { totalQuantity: 0 });
        }
        groupedProductsMap.get(key)!.totalQuantity += product.quantity;
    });

    let lowStockCount = 0;
    groupedProductsMap.forEach(group => {
        if (group.totalQuantity > 0 && group.totalQuantity < 20) {
            lowStockCount++;
        }
    });

    const expiringSoonItems = products.filter(p => {
        if (!p.expiryDate) return false;
        const expiry = new Date(p.expiryDate);
        return expiry > now && expiry <= thirtyDaysFromNow;
    }).length;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsersCount = users.filter(u => u.lastSeen && new Date(u.lastSeen) > fiveMinutesAgo).length;

    const lastDispensationMap = new Map<string, string>();
    for (const disp of dispensations) {
        if (!lastDispensationMap.has(disp.patientId) || new Date(disp.date) > new Date(lastDispensationMap.get(disp.patientId)!)) {
            lastDispensationMap.set(disp.patientId, disp.date);
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcomingReturns: UpcomingReturn[] = [];
    const activePatientIds = new Set(activePatients.map(p => p.id));

    for (const [patientId, lastDateStr] of lastDispensationMap.entries()) {
        if (!activePatientIds.has(patientId)) continue;

        const lastDate = new Date(lastDateStr);
        let returnDate = new Date(lastDate);
        returnDate.setDate(returnDate.getDate() + 30);

        const dayOfWeek = returnDate.getDay();
        if (dayOfWeek === 6) {
            returnDate.setDate(returnDate.getDate() + 2);
        } else if (dayOfWeek === 0) {
            returnDate.setDate(returnDate.getDate() + 1);
        }

        if (returnDate >= today && returnDate <= sevenDaysFromNow) {
            const patient = activePatients.find(p => p.id === patientId);
            if (patient) {
                upcomingReturns.push({
                    patientId: patient.id,
                    patientName: patient.name,
                    returnDate: returnDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                });
            }
        }
    }

    const sortedReturns = upcomingReturns.sort((a,b) => new Date(a.returnDate.split('/').reverse().join('-')).getTime() - new Date(b.returnDate.split('/').reverse().join('-')).getTime());

    const recentDispensations = [...dispensations]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime())
        .slice(0, 5);

    return (
         <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lowStockCount}</div>
                        <p className="text-xs text-muted-foreground">Grupos de itens que precisam de reposição.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Próximos do Vencimento</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{expiringSoonItems}</div>
                        <p className="text-xs text-muted-foreground">Lotes vencendo nos próximos 30 dias.</p>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Retornos Próximos</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="h-4 w-4 mr-1" />
                                {onlineUsersCount} Online
                            </div>
                            <UserRoundCheck className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {sortedReturns.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                                {sortedReturns.map(r => (
                                    <Button key={r.patientId} variant="secondary" size="sm" asChild className="h-auto py-1 px-2 font-normal justify-start">
                                        <Link href={`/dashboard/patients/${r.patientId}`} className="flex flex-col items-start">
                                            <span className="font-semibold truncate">{r.patientName.split(' ')[0]}</span>
                                            <span className="text-xs text-muted-foreground">Retorno: {r.returnDate}</span>
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground py-2.5">Nenhum retorno agendado para os próximos 7 dias.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart2 className="h-5 w-5" />
                            Consumo Mensal de Itens
                        </CardTitle>
                        <CardDescription>
                            Visualize a quantidade total de itens dispensados nos últimos 6 meses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <MonthlyConsumptionChart dispensations={dispensations} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Atividades Recentes
                        </CardTitle>
                        <CardDescription>
                            Últimas dispensações e remessas registradas no sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="dispensations">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="dispensations">Dispensações</TabsTrigger>
                                <TabsTrigger value="orders">Remessas</TabsTrigger>
                            </TabsList>
                            <TabsContent value="dispensations" className="space-y-4 pt-4">
                                {recentDispensations.length > 0 ? (
                                    recentDispensations.map(d => (
                                        <div key={d.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{d.patient.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">{d.patient.name}</p>
                                                    <p className="text-sm text-muted-foreground">{new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
                                                </div>
                                            </div>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/dispensation-receipt/${d.id}`} target="_blank">Ver Recibo</Link>
                                            </Button>
                                        </div>
                                    ))
                                ) : <p className="text-sm text-center text-muted-foreground pt-10">Nenhuma dispensação recente.</p>}
                            </TabsContent>
                            <TabsContent value="orders" className="space-y-4 pt-4">
                                {recentOrders.length > 0 ? (
                                    recentOrders.map(o => (
                                        <div key={o.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="bg-muted">
                                                    <AvatarFallback>
                                                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">{o.unitName}</p>
                                                    <p className="text-sm text-muted-foreground">{new Date(o.sentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
                                                </div>
                                            </div>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href="/dashboard/orders">Ver Pedidos</Link>
                                            </Button>
                                        </div>
                                    ))
                                ) : <p className="text-sm text-center text-muted-foreground pt-10">Nenhuma remessa recente.</p>}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

async function DashboardData() {
    noStore(); // Garante que os dados são sempre frescos
    const [products, dispensations, users, activePatients, orders] = await Promise.all([
        getProducts(),
        getAllDispensations(),
        getAllUsers(),
        getPatients('active'),
        getOrders(),
    ]);

    return <DashboardDataWrapper 
        products={products}
        dispensations={dispensations}
        users={users}
        activePatients={activePatients}
        orders={orders}
    />
}

export default async function DashboardPage() {
    return (
        <>
            <DashboardHeader />
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardData />
            </Suspense>
        </>
    );
}
