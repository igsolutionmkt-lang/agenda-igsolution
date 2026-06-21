import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getClients, upsertClient, deleteClient } from '../lib/supabase'
import { Plus, Search, Trash2, Edit2, X } from 'lucide-react'

interface Client { id?: string; name: string; email?: string; phone?: string; notes?: string; total_visits?: number; total_spent?: number; last_visit?: string }

type Lifecycle = 'novo' | 'ativo' | 'em_risco' | 'perdido' | 'recuperado'

const DAY = 24 * 60 * 60 * 1000

function lifecycleOf(c: Client): Lifecycle {
  const visits = c.total_visits ?? 0
  if (visits === 0) return 'novo'
  const days = c.last_visit ? (Date.now() - new Date(c.last_visit).getTime()) / DAY : Infinity
  if (days <= 30) return visits === 1 ? 'novo' : 'ativo'
  if (days <= 90) return 'em_risco'
  return 'perdido'
}

const LIFECYCLE_META: Record<Lifecycle, { label: string; cls: string }> = {
  novo: { label: 'Novo', cls: 'bg-blue-100 text-blue-700' },
  ativo: { label: 'Ativo', cls: 'bg-green-100 text-green-700' },
  em_risco: { label: 'Em risco', cls: 'bg-amber-100 text-amber-700' },
  perdido: { label: 'Perdido', cls: 'bg-red-100 text-red-700' },
  recuperado: { label: 'Recuperado', cls: 'bg-violet-100 text-violet-700' },
}

export default function ClientsPage() {
  const { companyId } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Lifecycle | 'todos'>('todos')
  const [modal, setModal] = useState<Client | null>(null)
  const [form, setForm] = useState<Client>({ name: '', email: '', phone: '', notes: '' })

  useEffect(() => {
    if (!companyId) return
    getClients(companyId).then(({ data }) => setClients(data ?? []))
  }, [companyId])

  const counts = clients.reduce((acc, c) => { const l = lifecycleOf(c); acc[l] = (acc[l] ?? 0) + 1; return acc }, {} as Record<Lifecycle, number>)

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'todos' || lifecycleOf(c) === filter
    return matchSearch && matchFilter
  })

  function openCreate() { setForm({ name: '', email: '', phone: '', notes: '' }); setModal({ name: '' }) }
  function openEdit(c: Client) { setForm(c); setModal(c) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const { data } = await upsertClient({ ...form, company_id: companyId })
    if (data) {
      setClients(prev => form.id ? prev.map(c => c.id === form.id ? data : c) : [data, ...prev])
    }
    setModal(null)
  }

  async function handleDelete(id: string) {
    await deleteClient(id)
    setClients(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-700">
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar clientes…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter('todos')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === 'todos' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
          Todos ({clients.length})
        </button>
        {(Object.keys(LIFECYCLE_META) as Lifecycle[]).map(l => (
          <button key={l} onClick={() => setFilter(l)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === l ? LIFECYCLE_META[l].cls + ' border-transparent font-medium' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {LIFECYCLE_META[l].label} ({counts[l] ?? 0})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Nome', 'Estado', 'Email', 'Telefone', 'Visitas', 'Gasto', 'Ações'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${LIFECYCLE_META[lifecycleOf(c)].cls}`}>{LIFECYCLE_META[lifecycleOf(c)].label}</span></td>
                <td className="px-4 py-3 text-gray-500">{c.email ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.total_visits ?? 0}</td>
                <td className="px-4 py-3 text-gray-500">€{(c.total_spent ?? 0).toFixed(0)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded"><Edit2 size={14} /></button>
                    <button onClick={() => c.id && handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-12">Nenhum cliente encontrado</p>}
      </div>

      {modal !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">{form.id ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Telefone" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas" rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <button type="submit" className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
