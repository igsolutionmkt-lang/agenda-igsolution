import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getMembershipPlans, upsertMembershipPlan, deleteMembershipPlan, getClientMemberships } from '../lib/supabase'
import { Plus, Trash2, Edit2, X, Crown, Users, TrendingUp } from 'lucide-react'

interface Plan {
  id?: string; name: string; description?: string; price: number
  billing_period: 'monthly' | 'quarterly'; services_per_month: number
  stripe_price_id?: string; is_active: boolean
}
interface ClientMembership {
  id: string; status: 'active' | 'cancelled' | 'expired'
  current_period_end?: string; services_used: number
  agenda_clients?: { name: string; email?: string; phone?: string }
  agenda_membership_plans?: { name: string; price: number; services_per_month: number }
}
const EMPTY: Plan = { name: '', price: 0, billing_period: 'monthly', services_per_month: 2, is_active: true }

export default function MembershipsPage() {
  const { companyId } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [memberships, setMemberships] = useState<ClientMembership[]>([])
  const [tab, setTab] = useState<'plans' | 'clients'>('plans')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Plan>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!companyId) return
    getMembershipPlans(companyId).then(({ data }) => setPlans(data ?? []))
    getClientMemberships(companyId).then(({ data }) => setMemberships((data ?? []) as ClientMembership[]))
  }, [companyId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data } = await upsertMembershipPlan({ ...form, company_id: companyId })
    if (data) setPlans(prev => form.id ? prev.map(p => p.id === form.id ? data as Plan : p) : [data as Plan, ...prev])
    setModal(false); setSaving(false)
  }

  const activeMemberships = memberships.filter(m => m.status === 'active')
  const mrr = activeMemberships.reduce((sum, m) => sum + (m.agenda_membership_plans?.price ?? 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Memberships</h1><p className="text-sm text-gray-500 mt-0.5">Planos de assinatura mensal</p></div>
        <button onClick={() => { setForm(EMPTY); setModal(true) }} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-700"><Plus size={16} /> Novo Plano</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={16} className="text-green-500" /><p className="text-xs text-gray-500">MRR</p></div>
          <p className="text-2xl font-bold text-gray-900">€{mrr.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1"><Users size={16} className="text-violet-500" /><p className="text-xs text-gray-500">Subscritores</p></div>
          <p className="text-2xl font-bold text-gray-900">{activeMemberships.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1"><Crown size={16} className="text-amber-500" /><p className="text-xs text-gray-500">Planos</p></div>
          <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['plans', 'clients'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'plans' ? `Planos (${plans.length})` : `Subscritores (${activeMemberships.length})`}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        plans.length === 0
          ? <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <Crown size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 font-medium">Sem planos criados</p>
              <p className="text-sm text-gray-300 mt-1 mb-4">Cria um plano mensal para estabilizar a tua receita</p>
              <button onClick={() => { setForm(EMPTY); setModal(true) }} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm">Criar primeiro plano</button>
            </div>
          : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div><p className="font-semibold text-gray-900">{p.name}</p><p className="text-xs text-gray-400">{p.billing_period === 'monthly' ? 'Mensal' : 'Trimestral'}</p></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.is_active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                  {p.description && <p className="text-sm text-gray-500 mb-3 flex-1">{p.description}</p>}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Preço</span><span className="font-bold text-gray-900">€{p.price}<span className="text-xs font-normal text-gray-400">/mês</span></span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Serviços incluídos</span><span className="font-medium text-gray-700">{p.services_per_month}×/mês</span></div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-50">
                    <button onClick={() => { setForm(p); setModal(true) }} className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1"><Edit2 size={12} /> Editar</button>
                    <button onClick={() => p.id && deleteMembershipPlan(p.id).then(() => setPlans(prev => prev.filter(x => x.id !== p.id)))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {tab === 'clients' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {memberships.length === 0
            ? <div className="p-12 text-center text-gray-400">Sem subscritores ainda</div>
            : <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Cliente', 'Plano', 'Status', 'Serviços usados', 'Renova em'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {memberships.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><p className="font-medium text-gray-900">{m.agenda_clients?.name ?? '—'}</p><p className="text-xs text-gray-400">{m.agenda_clients?.phone ?? ''}</p></td>
                      <td className="px-4 py-3 text-gray-600">{m.agenda_membership_plans?.name ?? '—'}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.status === 'active' ? 'Ativo' : 'Cancelado'}</span></td>
                      <td className="px-4 py-3 text-gray-500">{m.services_used} / {m.agenda_membership_plans?.services_per_month ?? '?'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{m.current_period_end ? new Date(m.current_period_end).toLocaleDateString('pt-PT') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-lg">{form.id ? 'Editar Plano' : 'Novo Plano'}</h2><button onClick={() => setModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSave} className="space-y-3">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do plano *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="O que inclui este plano?" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Preço €/mês</label><input type="number" required min={1} value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Serviços/mês</label><input type="number" required min={1} value={form.services_per_month} onChange={e => setForm(f => ({ ...f, services_per_month: +e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <select value={form.billing_period} onChange={e => setForm(f => ({ ...f, billing_period: e.target.value as Plan['billing_period'] }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
              </select>
              <div><label className="text-xs text-gray-500 mb-1 block">Stripe Price ID (opcional)</label><input value={form.stripe_price_id ?? ''} onChange={e => setForm(f => ({ ...f, stripe_price_id: e.target.value }))} placeholder="price_xxx" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> Plano activo</label>
              <button type="submit" disabled={saving} className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">{saving ? 'A guardar…' : 'Guardar'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
