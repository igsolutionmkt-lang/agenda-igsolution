import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getLoyaltyRewards, upsertLoyaltyReward, deleteLoyaltyReward } from '../lib/supabase'
import { Gift, Plus, Trash2, Edit2, X } from 'lucide-react'

interface Reward { id?: string; name: string; description?: string; points_cost: number; is_active: boolean }

export default function LoyaltyPage() {
  const { companyId } = useAuth()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Reward>({ name: '', points_cost: 100, is_active: true })

  useEffect(() => { if (companyId) getLoyaltyRewards(companyId).then(({ data }) => setRewards(data ?? [])) }, [companyId])

  function openCreate() { setForm({ name: '', points_cost: 100, is_active: true }); setModal(true) }
  function openEdit(r: Reward) { setForm(r); setModal(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const { data } = await upsertLoyaltyReward({ ...form, company_id: companyId })
    if (data) setRewards(prev => form.id ? prev.map(r => r.id === form.id ? data : r) : [data, ...prev])
    setModal(false)
  }

  async function handleDelete(id: string) {
    await deleteLoyaltyReward(id)
    setRewards(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fidelização</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-700">
          <Plus size={16} /> Nova Recompensa
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-lg"><Gift size={16} className="text-amber-600" /></div>
              <div>
                <p className="font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-amber-600">{r.points_cost} pontos</p>
              </div>
            </div>
            {r.description && <p className="text-sm text-gray-500 mb-3">{r.description}</p>}
            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {r.is_active ? 'Ativo' : 'Inativo'}
              </span>
              <div className="flex gap-2">
                <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded"><Edit2 size={14} /></button>
                <button onClick={() => r.id && handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {rewards.length === 0 && <p className="col-span-3 text-center text-gray-400 py-12">Nenhuma recompensa configurada</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">{form.id ? 'Editar Recompensa' : 'Nova Recompensa'}</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da recompensa *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Pontos necessários</label>
                <input type="number" required value={form.points_cost} onChange={e => setForm(f => ({ ...f, points_cost: +e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                Recompensa ativa
              </label>
              <button type="submit" className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
