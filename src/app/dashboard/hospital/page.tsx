
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Box, Activity, FlaskConical, BarChartHorizontal } from "lucide-react";
import { getProducts, getSectorDispensations } from "@/lib/data";
import { Product, SectorDispensation } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { unstable_noStore as noStore } from "next/cache";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function HospitalDashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <div className="grid gap-6 lg:grid-cols-5">
                <Skeleton className="h-96 lg:col-span-3" />
                <Skeleton className="h-96 lg:col-span-2" />
            </div>
        </div>
    )
}

function ConsumptionBySectorChart({ dispensations }: { dispensations: SectorDispensation[] }) {
    const dataMap = new Map<string, number>();

    dispensations.forEach(disp => {
        const totalItems = disp.items.reduce((sum, item) => sum + item.quantity, 0);
        dataMap.set(disp.sector, (dataMap.get(disp.sector) || 0) + totalItems);
    });

    const chartData = Array.from(dataMap.entries()).map(([sector, total]) => ({ name: sector, total }));
    
    return (
        <ChartContainer config={{ total: { label: "Itens", color: "hsl(var(--chart-1))" } }} className="h-full w-full">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={80} />
                    <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={5} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}

function HospitalDashboardData({ products, dispensations }: { products: Product[], dispensations: SectorDispensation[] }) {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiredItems = products.filter(p => p.expiryDate && new Date(p.expiryDate) < now).length;
    const expiringSoonItems = products.filter(p => {
        if (!p.expiryDate) return false;
        const expiry = new Date(p.expiryDate);
        return expiry >= now && expiry <= thirtyDaysFromNow;
    }).length;
    const outOfStockItems = products.filter(p => p.quantity === 0).length;

    const recentDispensations = dispensations.slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-destructive">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Itens Vencidos</CardTitle>
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-destructive">{expiredItems}</div>
                        <p className="text-xs text-muted-foreground">Lotes que já passaram da validade.</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-accent">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vencendo em 30 Dias</CardTitle>
                        <Clock className="h-5 w-5 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-accent-foreground">{expiringSoonItems}</div>
                        <p className="text-xs text-muted-foreground">Lotes que precisam de atenção imediata.</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estoque Zerado</CardTitle>
                        <Box className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{outOfStockItems}</div>
                        <p className="text-xs text-muted-foreground">Produtos que precisam de reposição urgente.</p>
                    </CardContent>
                </Card>
            </div>
             <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3 hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChartHorizontal className="h-5 w-5" />
                            Consumo por Setor
                        </CardTitle>
                        <CardDescription>
                            Total de itens dispensados para cada setor do hospital.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                            <ConsumptionBySectorChart dispensations={dispensations} />
                        </Suspense>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Dispensações Recentes (Setores)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentDispensations.length > 0 ? recentDispensations.map(d => (
                             <div key={d.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar className="bg-muted">
                                        <AvatarFallback>
                                            <FlaskConical className="h-4 w-4 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium leading-none">{d.sector}</p>
                                        <p className="text-sm text-muted-foreground">{new Date(d.date).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} por {d.dispensedBy.split(' ')[0]}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">{d.items.reduce((sum, i) => sum + i.quantity, 0)}</p>
                                    <p className="text-xs text-muted-foreground">Itens</p>
                                </div>
                            </div>
                        )) : <p className="text-sm text-center text-muted-foreground pt-10">Nenhuma dispensação para setores ainda.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// This is the main page component. It's a server component.
// It fetches data and then passes it to the client component.
export default async function HospitalDashboardPage() {
    noStore(); // Ensures fresh data on every request
    const [products, dispensations] = await Promise.all([
        getProducts(),
        getSectorDispensations(),
    ]);

    return (
        <>
            <DashboardHeader />
            <Suspense fallback={<HospitalDashboardSkeleton />}>
                <HospitalDashboardData products={products} dispensations={dispensations} />
            </Suspense>
        </>
    );
}
