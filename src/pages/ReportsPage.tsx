import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getRevenueByMonth } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function ReportsPage() {
  const { companyId } = useAuth()
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; count: number }[]>([])

  useEffect(() => {
    if (!companyId) return
    getRevenueByMonth(companyId).then(raw => {
      const map: Record<string, { revenue: number; count: number }> = {}
      raw.forEach((r: { date: string; price: number }) => {
        const m = r.date.slice(0, 7)
        if (!map[m]) map[m] = { revenue: 0, count: 0 }
        map[m].revenue += r.price ?? 0
        map[m].count += 1
      })
      setRevenueData(Object.entries(map).map(([month, v]) => ({ month: month.slice(5), ...v })))
    })
  }, [companyId])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Receita por mês (€)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `€${Number(v).toFixed(0)}`} />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Agendamentos por mês</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {revenueData.length === 0 && <p className="text-center text-gray-400 py-12">Sem dados suficientes para gerar relatórios</p>}
    </div>
  )
}
