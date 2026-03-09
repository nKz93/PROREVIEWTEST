"use client"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ReviewChartProps {
  data: { date: string; avis: number; feedbacks: number }[]
}

export default function ReviewChart({ data }: ReviewChartProps) {
  return (
    <Card className="shadow-sm border border-gray-100 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">Activité des 7 derniers jours</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradAvis" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradFeedbacks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
              itemStyle={{ color: '#374151' }}
            />
            <Area type="monotone" dataKey="avis" name="Avis Google" stroke="#3b82f6" strokeWidth={2} fill="url(#gradAvis)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="feedbacks" name="Feedbacks" stroke="#ef4444" strokeWidth={2} fill="url(#gradFeedbacks)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-500">Avis Google</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-500">Feedbacks privés</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
