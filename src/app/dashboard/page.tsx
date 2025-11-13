import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, UserRoundCheck, Activity, AlertTriangle, BarChartHorizontal } from "lucide-react";
import { getProducts, getAllDispensations, getAllUsers, getPatients, getOrders, getSectorDispensations } from "@/lib/data";
import type { Product, Dispensation, Patient, Order, User, SectorDispensation } from "@/lib/types";
import { MonthlyConsumptionChart } from "@/components/dashboard/monthly-consumption-chart";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { unstable_noStore as noStore } from "next/cache";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { ShoppingCart } from "lucide-react";

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

function DashboardDataWrapper({ products, dispensations, users, activePatients, orders, sectorDispensations }: {
    products: Product[],
    dispensations: Dispensation[],
    users: User[],
    activePatients: Patient[],
    orders: Order[],
    sectorDispensations: SectorDispensation[]
}) {
    const now = new Date();
    const oneHundredTwentyDaysFromNow = new Date();
    oneHundredTwentyDaysFromNow.setDate(now.getDate() + 120);

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
        return expiry > now && expiry <= oneHundredTwentyDaysFromNow;
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

    const recentPatientDispensations = [...dispensations]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime())
        .slice(0, 5);
    
    const recentSectorDispensations = [...sectorDispensations]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return (
         <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Baixo Estoque (Global)</CardTitle>
                        <Package className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{lowStockCount}</div>
                        <p className="text-xs text-muted-foreground">Grupos de itens que precisam de reposição.</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Próximos do Vencimento (Global)</CardTitle>
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-destructive">{expiringSoonItems}</div>
                        <p className="text-xs text-muted-foreground">Lotes vencendo nos próximos 120 dias.</p>
                    </CardContent>
                </Card>
                 <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pacientes Ativos (CAF)</CardTitle>
                        <Users className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{activePatients.length}</div>
                        <p className="text-xs text-muted-foreground">Total de pacientes com status ativo.</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
                        <UserRoundCheck className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{onlineUsersCount}</div>
                        <p className="text-xs text-muted-foreground">Usuários ativos nos últimos 5 minutos.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3 hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChartHorizontal className="h-5 w-5" />
                            Consumo Mensal de Itens (CAF)
                        </CardTitle>
                        <CardDescription>
                            Visualize a quantidade total de itens dispensados a pacientes nos últimos 6 meses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Suspense fallback={<Skeleton className="h-[350px] w-full" />}>
                            <MonthlyConsumptionChart dispensations={dispensations} />
                        </Suspense>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Atividades Recentes (Global)
                        </CardTitle>
                        <CardDescription>
                            Últimas movimentações registradas no sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="dispensations">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="dispensations">Dispensações</TabsTrigger>
                                <TabsTrigger value="orders">Remessas</TabsTrigger>
                                <TabsTrigger value="sectors">Setores</TabsTrigger>
                            </TabsList>
                            <TabsContent value="dispensations" className="space-y-4 pt-4">
                                {recentPatientDispensations.length > 0 ? (
                                    recentPatientDispensations.map(d => (
                                        <div key={d.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
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
                                        <div key={o.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
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
                             <TabsContent value="sectors" className="space-y-4 pt-4">
                                {recentSectorDispensations.length > 0 ? (
                                    recentSectorDispensations.map(d => (
                                        <div key={d.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="bg-muted">
                                                    <AvatarFallback>
                                                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">{d.sector}</p>
                                                    <p className="text-sm text-muted-foreground">{new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
                                                </div>
                                            </div>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href="/dashboard/hospital/dispense">Ver Disp. de Setores</Link>
                                            </Button>
                                        </div>
                                    ))
                                ) : <p className="text-sm text-center text-muted-foreground pt-10">Nenhuma disp. para setores.</p>}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// This is now a fully dynamic component
export default async function DashboardPage() {
    noStore(); 
    
    const [products, dispensations, users, activePatients, orders, sectorDispensations] = await Promise.all([
        getProducts(),
        getAllDispensations(),
        getAllUsers(),
        getPatients('active'),
        getOrders(),
        getSectorDispensations(),
    ]);

    return (
        <>
            <DashboardHeader />
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardDataWrapper 
                    products={products}
                    dispensations={dispensations}
                    users={users}
                    activePatients={activePatients as Patient[]}
                    orders={orders}
                    sectorDispensations={sectorDispensations}
                />
            </Suspense>
        </>
    );
}
