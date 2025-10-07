export const dynamic = 'force-dynamic';
'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Package, CalendarDays, Clock, BarChart2, Users } from "lucide-react";
import { getProducts, getAllDispensations, getAllUsers } from "@/lib/data";
import type { Product, Dispensation, User } from "@/lib/types";
import { MonthlyConsumptionChart } from "@/components/dashboard/monthly-consumption-chart";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [stats, setStats] = useState({ lowStock: 0, expiringSoon: 0, onlineUsers: 0 });
  const [dispensations, setDispensations] = useState<Dispensation[]>([]);
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
      setLoadingStats(true);
      try {
        const [products, dispensationsData, users] = await Promise.all([
          getProducts(),
          getAllDispensations(),
          getAllUsers(),
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

        setStats({
          lowStock: lowStockCount,
          expiringSoon: expiringSoonItems,
          onlineUsers: onlineUsersCount,
        });
        setDispensations(dispensationsData);

      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoadingStats(false);
      }
    }

    if (status === 'authenticated') {
      fetchStats();
      const statsInterval = setInterval(fetchStats, 30000); // Refresh stats every 30 seconds
      return () => clearInterval(statsInterval);
    }
  }, [status]);


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

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}, {session?.user?.name?.split(' ')[0] || 'Usuário'}!</h1>
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
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.onlineUsers}</div>}
              <p className="text-xs text-muted-foreground">Usuários ativos nos últimos 5 minutos.</p>
            </CardContent>
          </Card>
      </div>

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
    </div>
  );
}
