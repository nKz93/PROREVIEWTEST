"use client"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AdminRevenueChartProps {
  data: { month: string; revenue: number }[]
}

export default function AdminRevenueChart({ data }: AdminRevenueChartProps) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-lg">Revenus mensuels (€)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `${v}€`} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }}
              formatter={(v: number) => [`${v.toFixed(2)}€`, 'Revenus']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
