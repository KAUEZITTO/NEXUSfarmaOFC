
"use client"

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import type { Dispensation } from "@/lib/types";

const getChartData = (dispensations: Dispensation[]) => {
  const data: { month: string; total: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');

    const monthlyTotal = dispensations
      .filter(d => {
        const dDate = new Date(d.date);
        return dDate.getMonth() === date.getMonth() && dDate.getFullYear() === date.getFullYear();
      })
      .reduce((sum, d) => sum + d.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    data.push({ month: monthName.charAt(0).toUpperCase() + monthName.slice(1), total: monthlyTotal });
  }
  
  return data;
};

export function MonthlyConsumptionChart({ dispensations }: { dispensations: Dispensation[] }) {
    const [chartData, setChartData] = useState<{ month: string; total: number }[]>([]);

    useEffect(() => {
        // Prevent hydration mismatch by calculating on the client
        setChartData(getChartData(dispensations));
    }, [dispensations]);

    // Render a placeholder or nothing until client-side calculation is done
    if (chartData.length === 0) {
        return <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">Carregando dados do gráfico...</div>;
    }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))'
          }}
        />
        <Legend wrapperStyle={{fontSize: "12px"}}/>
        <Bar dataKey="total" name="Itens Dispensados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
