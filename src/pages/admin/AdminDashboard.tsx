import { useEffect, useState } from 'react'
import { getAdminOverview } from '../../lib/supabase'
import { Building2, Users, Calendar, TrendingUp } from 'lucide-react'

interface Row { company_id: string; company_name: string; total_appointments: number; total_clients: number; total_revenue: number; plan: string }

export default function AdminDashboard() {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => { getAdminOverview().then(({ data }) => setRows(data ?? [])) }, [])

  const totals = rows.reduce((acc, r) => ({
    companies: acc.companies + 1,
    appointments: acc.appointments + (r.total_appointments ?? 0),
    clients: acc.clients + (r.total_clients ?? 0),
    revenue: acc.revenue + (r.total_revenue ?? 0),
  }), { companies: 0, appointments: 0, clients: 0, revenue: 0 })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Painel Super Admin</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Empresas', value: totals.companies, icon: Building2, color: 'text-violet-600 bg-violet-50' },
          { label: 'Agendamentos', value: totals.appointments, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
          { label: 'Clientes', value: totals.clients, icon: Users, color: 'text-green-600 bg-green-50' },
          { label: 'Receita total', value: `€${totals.revenue.toFixed(0)}`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}><Icon size={18} /></div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Empresa', 'Plano', 'Agendamentos', 'Clientes', 'Receita'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(r => (
              <tr key={r.company_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.company_name}</td>
                <td className="px-4 py-3"><span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full capitalize">{r.plan}</span></td>
                <td className="px-4 py-3 text-gray-500">{r.total_appointments ?? 0}</td>
                <td className="px-4 py-3 text-gray-500">{r.total_clients ?? 0}</td>
                <td className="px-4 py-3 text-gray-500">€{(r.total_revenue ?? 0).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-center text-gray-400 py-12">Sem empresas registadas</p>}
      </div>
    </div>
  )
}
