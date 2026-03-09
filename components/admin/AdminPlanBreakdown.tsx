"use client"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AdminPlanBreakdownProps {
  data: { plan: string; count: number }[]
  total: number
}

const COLORS: Record<string, string> = {
  free: '#6b7280',
  starter: '#3b82f6',
  pro: '#8b5cf6',
  business: '#f97316',
}

const LABELS: Record<string, string> = {
  free: 'Gratuit',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
}

export default function AdminPlanBreakdown({ data, total }: AdminPlanBreakdownProps) {
  const paying = data.filter(d => d.plan !== 'free').reduce((acc, d) => acc + d.count, 0)
  const conversionRate = total > 0 ? Math.round((paying / total) * 100) : 0

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-lg">Répartition des plans</CardTitle>
        <p className="text-xs text-gray-500">Taux de conversion : <span className="text-green-400 font-bold">{conversionRate}%</span></p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="count" nameKey="plan">
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[entry.plan] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
              formatter={(v: number, _: string, props: { payload?: { plan?: string } }) => [v, LABELS[props.payload?.plan || ''] || props.payload?.plan || '']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 mt-2">
          {data.map((item) => (
            <div key={item.plan} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[item.plan] }} />
                <span className="text-xs text-gray-400">{LABELS[item.plan] || item.plan}</span>
              </div>
              <span className="text-xs font-bold text-white">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
