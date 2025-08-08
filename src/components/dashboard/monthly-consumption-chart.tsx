"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

const data = [
  { month: "Jan", total: Math.floor(Math.random() * 2000) + 500 },
  { month: "Fev", total: Math.floor(Math.random() * 2000) + 500 },
  { month: "Mar", total: Math.floor(Math.random() * 2000) + 500 },
  { month: "Abr", total: Math.floor(Math.random() * 2000) + 500 },
  { month: "Mai", total: Math.floor(Math.random() * 2000) + 500 },
  { month: "Jun", total: Math.floor(Math.random() * 2000) + 500 },
]

export function MonthlyConsumptionChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
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
