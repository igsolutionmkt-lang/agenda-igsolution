import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getDashboardStats, getRevenueByMonth, getGrowthStats, sendWinbackEmail } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, Calendar, DollarSign, AlertTriangle } from 'lucide-react'

interface Stats { todayAppointments: number; monthAppointments: number; totalClients: number; monthRevenue: number }
interface Growth { returnRate: number; active: number; atRisk: { id: string; name?: string; email?: string; total_spent?: number }[]; lost: number; newThisMonth: number }

export default function Dashboard() {
  const { companyId } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<{ month: string; revenue: number }[]>([])
  const [growth, setGrowth] = useState<Growth | null>(null)

  useEffect(() => {
    if (!companyId) return
    getDashboardStats(companyId).then(setStats)
    getGrowthStats(companyId).then(setGrowth)
    getRevenueByMonth(companyId).then(raw => {
      const map: Record<string, number> = {}
      raw.forEach((r: { scheduled_at: string; price: number }) => {
        const m = r.scheduled_at.slice(0, 7)
        map[m] = (map[m] ?? 0) + (r.price ?? 0)
      })
      setChartData(Object.entries(map).map(([month, revenue]) => ({ month: month.slice(5), revenue })))
    })
  }, [companyId])

  const kpis = [
    { label: 'Hoje', value: stats?.todayAppointments ?? '…', icon: Calendar, color: 'text-violet-600 bg-violet-50' },
    { label: 'Este mês', value: stats?.monthAppointments ?? '…', icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'Clientes', value: stats?.totalClients ?? '…', icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Receita mês', value: stats ? `€${stats.monthRevenue.toFixed(0)}` : '…', icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}><Icon size={18} /></div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Receita por mês (€)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `€${Number(v).toFixed(0)}`} />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {growth && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">Motor de Crescimento</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{growth.returnRate}%</p>
                <p className="text-xs text-green-600">Taxa retorno</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{growth.active}</p>
                <p className="text-xs text-blue-600">Ativos (30d)</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">{growth.newThisMonth}</p>
                <p className="text-xs text-amber-600">Novos mês</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{growth.lost}</p>
                <p className="text-xs text-red-600">Perdidos</p>
              </div>
            </div>
            {growth.atRisk.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500" /> Em risco</p>
                {growth.atRisk.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-1.5 border-t border-gray-50">
                    <span className="text-sm text-gray-700">{c.name ?? 'Cliente'}</span>
                    {c.email && (
                      <button onClick={() => sendWinbackEmail(c.name ?? '', c.email ?? '', 'IGSolution')} className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded hover:bg-violet-200">
                        Recuperar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
