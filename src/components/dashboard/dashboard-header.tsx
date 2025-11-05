'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock } from "lucide-react";


function DateTimeDisplay() {
    // This is now a client component, so we use state and effect to avoid hydration mismatches
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const currentDate = time.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = time.toLocaleTimeString('pt-BR');

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{currentDate}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{currentTime}</span>
            </div>
        </div>
    )
}


export default function DashboardHeader() {
    const { data: session } = useSession();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}, {session?.user?.name?.split(' ')[0] || 'Usuário'}!</h1>
                <p className="text-muted-foreground">Bem-vindo(a) de volta ao painel NexusFarma.</p>
            </div>
            <Suspense fallback={<Skeleton className="h-10 w-64" />}>
                 <DateTimeDisplay />
            </Suspense>
        </div>
    );
}
