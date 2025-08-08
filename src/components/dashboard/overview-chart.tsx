"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  {
    name: "Medicamentos",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Material Técnico",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Odontológico",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Laboratório",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Outros",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
]

export function OverviewChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
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
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
