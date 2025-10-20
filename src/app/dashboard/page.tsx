
'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Package, CalendarDays, Clock, BarChart2, Users, UserRoundCheck, ShoppingCart, Activity } from "lucide-react";
import { getProducts, getAllDispensations, getAllUsers, getPatients, getOrders } from "@/lib/data";
import type { Product, Dispensation, User, Patient, Order } from "@/lib/types";
import { MonthlyConsumptionChart } from "@/components/dashboard/monthly-consumption-chart";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UpcomingReturn = {
    patientId: string;
    patientName: string;
    returnDate: string; // Formatted date string
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [stats, setStats] = useState({ lowStock: 0, expiringSoon: 0, onlineUsers: 0 });
  const [dispensations, setDispensations] = useState<Dispensation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [upcomingReturns, setUpcomingReturns] = useState<UpcomingReturn[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // Efeito para data e hora, garantindo execução apenas no cliente
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('pt-BR'));
    };

    updateDateTime(); // Executa imediatamente no cliente
    const intervalId = setInterval(updateDateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    async function fetchStats() {
      // Don't set loading to true here to avoid skeleton on every refresh
      try {
        const [products, dispensationsData, users, activePatients, ordersData] = await Promise.all([
          getProducts(),
          getAllDispensations(),
          getAllUsers(),
          getPatients('active'),
          getOrders(),
        ]);
        
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const groupedProducts = new Map<string, { quantity: number; batches: Product[] }>();
        products.forEach(p => {
            const key = `${p.name}|${p.presentation}`;
            if (!groupedProducts.has(key)) {
                groupedProducts.set(key, { quantity: 0, batches: [] });
            }
            const group = groupedProducts.get(key)!;
            group.quantity += p.quantity;
            group.batches.push(p);
        });

        let lowStockCount = 0;
        groupedProducts.forEach(group => {
            if (group.quantity > 0 && group.quantity < 20) {
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
        
        // Calculate upcoming returns
        const lastDispensationMap = new Map<string, string>();
        for (const disp of dispensationsData) {
            if (!lastDispensationMap.has(disp.patientId) || new Date(disp.date) > new Date(lastDispensationMap.get(disp.patientId)!)) {
                lastDispensationMap.set(disp.patientId, disp.date);
            }
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);
        
        const returns: UpcomingReturn[] = [];
        const activePatientIds = new Set(activePatients.map(p => p.id));

        for (const [patientId, lastDateStr] of lastDispensationMap.entries()) {
            if (!activePatientIds.has(patientId)) continue;

            const lastDate = new Date(lastDateStr);
            let returnDate = new Date(lastDate);
            returnDate.setDate(returnDate.getDate() + 30);
            
            const dayOfWeek = returnDate.getDay();
            if (dayOfWeek === 6) { // Saturday
                returnDate.setDate(returnDate.getDate() + 2);
            } else if (dayOfWeek === 0) { // Sunday
                returnDate.setDate(returnDate.getDate() + 1);
            }

            if (returnDate >= today && returnDate <= sevenDaysFromNow) {
                const patient = activePatients.find(p => p.id === patientId);
                if (patient) {
                     returns.push({
                        patientId: patient.id,
                        patientName: patient.name,
                        returnDate: returnDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    });
                }
            }
        }

        setStats({
          lowStock: lowStockCount,
          expiringSoon: expiringSoonItems,
          onlineUsers: onlineUsersCount,
        });
        setDispensations(dispensationsData);
        setOrders(ordersData);
        setUpcomingReturns(returns.sort((a,b) => new Date(a.returnDate.split('/').reverse().join('-')).getTime() - new Date(b.returnDate.split('/').reverse().join('-')).getTime()));

      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        if (loadingStats) {
            setLoadingStats(false);
        }
      }
    }

    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, loadingStats]);


  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }
  
  const recentDispensations = [...dispensations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime())
    .slice(0, 5);


  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}! {session?.user?.name?.split(' ')[0] || 'Usuário'}</h1>
          <p className="text-muted-foreground">Bem-vindo(a) de volta ao painel NexusFarma.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>{currentDate || <Skeleton className="h-4 w-48" />}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{currentTime || <Skeleton className="h-4 w-20" />}</span>
          </div>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.lowStock}</div>}
              <p className="text-xs text-muted-foreground">Grupos de itens que precisam de reposição.</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos do Vencimento</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.expiringSoon}</div>}
              <p className="text-xs text-muted-foreground">Lotes vencendo nos próximos 30 dias.</p>
            </CardContent>
          </Card>
           <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retornos Próximos</CardTitle>
                <div className="flex items-center gap-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        {stats.onlineUsers} Online
                    </div>
                    <UserRoundCheck className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {loadingStats ? <Skeleton className="h-10 w-full" /> : 
                upcomingReturns.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                    {upcomingReturns.map(r => (
                      <Button key={r.patientId} variant="secondary" size="sm" asChild className="h-auto py-1 px-2 font-normal justify-start">
                         <Link href={`/dashboard/patients/${r.patientId}`} className="flex flex-col items-start">
                            <span className="font-semibold truncate">{r.patientName.split(' ')[0]}</span>
                            <span className="text-xs text-muted-foreground">Retorno: {r.returnDate}</span>
                        </Link>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum retorno agendado para os próximos 7 dias.</p>
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
                {loadingStats ? <Skeleton className="h-[350px] w-full" /> : <MonthlyConsumptionChart dispensations={dispensations} />}
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
                       {loadingStats ? <Skeleton className="h-40 w-full"/> : recentDispensations.length > 0 ? (
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
                       {loadingStats ? <Skeleton className="h-40 w-full"/> : recentOrders.length > 0 ? (
                           recentOrders.map(o => (
                                <div key={o.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="bg-muted">
                                            <AvatarFallback>
                                                <ShoppingCart className="h-4 w-4 text-muted-foreground"/>
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
                       ): <p className="text-sm text-center text-muted-foreground pt-10">Nenhuma remessa recente.</p>}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
       </div>
    </div>
  );
}
