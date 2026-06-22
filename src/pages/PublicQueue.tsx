import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCompanyBySlug, getPublicServices, joinQueue, getQueuePublic } from '../lib/supabase'
import { Clock, Users, CheckCircle } from 'lucide-react'

interface Company { id: string; name: string; logo_url?: string; primary_color?: string; slug: string; address?: string }
interface Service { id: string; name: string; duration: number; price: number }
interface QueueEntry { id: string; name: string; service_name?: string; status: string; position: number; joined_at: string }
type ViewState = 'join' | 'waiting' | 'called'

function hex2rgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export default function PublicQueue() {
  const { slug } = useParams<{ slug: string }>()
  const [company, setCompany] = useState<Company | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [view, setView] = useState<ViewState>('join')
  const [myEntry, setMyEntry] = useState<QueueEntry | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', service_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const color = company?.primary_color ?? '#7c3aed'

  useEffect(() => {
    if (!slug) return
    getCompanyBySlug(slug).then(({ data }) => {
      setCompany(data)
      if (data) {
        getPublicServices(data.id).then(({ data: s }) => setServices(s ?? []))
        loadQueue(data.id)
      }
    })
  }, [slug])

  useEffect(() => {
    if (!company || view === 'join') return
    const iv = setInterval(() => loadQueue(company.id), 20000)
    return () => clearInterval(iv)
  }, [company, view])

  useEffect(() => {
    if (!myEntry) return
    const updated = queue.find(q => q.id === myEntry.id)
    if (updated?.status === 'called') setView('called')
    if (updated) setMyEntry(updated)
  }, [queue, myEntry])

  function loadQueue(companyId: string) {
    getQueuePublic(companyId).then(data => setQueue(data as QueueEntry[]))
  }

  const myPosition = myEntry ? queue.findIndex(q => q.id === myEntry.id) + 1 : 0
  const peopleAhead = Math.max(0, myPosition - 1)
  const estMinutes = peopleAhead * 20

  async function handleJoin() {
    if (!company || !form.name.trim()) return
    setLoading(true); setError('')
    const selectedService = services.find(s => s.id === form.service_id)
    const { data, error: err } = await joinQueue({
      company_id: company.id, name: form.name.trim(),
      phone: form.phone.trim() || null, service_id: form.service_id || null,
      service_name: selectedService?.name ?? null, position: queue.length + 1, status: 'waiting',
    })
    if (err || !data) { setError('Erro ao entrar na fila. Tente novamente.'); setLoading(false); return }
    setMyEntry(data as QueueEntry)
    loadQueue(company.id)
    setView('waiting')
    setLoading(false)
  }

  if (!company) return <div className="min-h-screen flex items-center justify-center text-gray-400">A carregar…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="py-6 px-4 text-center" style={{ background: `linear-gradient(135deg, ${color} 0%, ${hex2rgba(color, 0.8)} 100%)` }}>
        {company.logo_url
          ? <img src={company.logo_url} alt={company.name} className="h-14 w-14 mx-auto mb-2 rounded-xl object-cover bg-white/20" />
          : <div className="h-14 w-14 mx-auto mb-2 rounded-xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">{company.name[0]}</div>}
        <h1 className="text-xl font-bold text-white">{company.name}</h1>
        <p className="text-white/75 text-sm mt-0.5">Fila virtual · sem espera à porta</p>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        {view === 'join' && (
          <div className="space-y-5">
            {queue.length > 0
              ? <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2"><Users size={16} style={{ color }} /><p className="text-sm font-semibold text-gray-700">{queue.length} {queue.length === 1 ? 'pessoa' : 'pessoas'} em espera</p></div>
                  <div className="flex items-center gap-2 text-sm text-gray-500"><Clock size={14} /><span>Tempo estimado: ~{queue.length * 20} min</span></div>
                </div>
              : <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-center">
                  <p className="text-green-700 font-semibold">Sem fila agora! 🎉</p>
                  <p className="text-green-600 text-sm mt-0.5">Atendimento imediato</p>
                </div>
            }
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Entrar na fila</h2>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="O seu nome *" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Telefone (para ser avisado)" type="tel" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              {services.length > 0 && (
                <select value={form.service_id} onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">Serviço (opcional)</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} · {s.duration}min · €{s.price}</option>)}
                </select>
              )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button onClick={handleJoin} disabled={!form.name.trim() || loading} className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: color }}>
                {loading ? 'A entrar…' : 'Entrar na fila'}
              </button>
            </div>
          </div>
        )}

        {view === 'waiting' && myEntry && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white" style={{ backgroundColor: color }}>{myPosition}</div>
              <p className="text-lg font-bold text-gray-900 mb-1">Está na fila, {myEntry.name}!</p>
              <p className="text-sm text-gray-500">A sua posição actual</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Pessoas à sua frente</span><span className="font-semibold text-gray-800">{peopleAhead}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tempo estimado</span><span className="font-semibold text-gray-800">~{estMinutes} min</span></div>
              {myEntry.service_name && <div className="flex justify-between text-sm"><span className="text-gray-500">Serviço</span><span className="font-semibold text-gray-800">{myEntry.service_name}</span></div>}
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-center">
              <Clock size={20} className="mx-auto text-amber-500 mb-2" />
              <p className="text-sm text-amber-700 font-medium">Pode esperar onde quiser</p>
              <p className="text-xs text-amber-600 mt-0.5">Esta página actualiza automaticamente a cada 20 segundos.</p>
            </div>
            {queue.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fila actual</p></div>
                {queue.map((q, i) => (
                  <div key={q.id} className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${q.id === myEntry.id ? 'bg-violet-50' : ''}`}>
                    <span className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold text-white shrink-0" style={{ backgroundColor: q.id === myEntry.id ? color : '#d1d5db' }}>{i + 1}</span>
                    <span className="text-sm text-gray-700 flex-1 truncate">{q.id === myEntry.id ? `${q.name} (você)` : q.name}</span>
                    {q.service_name && <span className="text-xs text-gray-400 truncate max-w-24">{q.service_name}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'called' && (
          <div className="text-center space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: hex2rgba(color, 0.12) }}>
                <CheckCircle size={40} style={{ color }} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">É a sua vez!</h2>
              <p className="text-gray-500">Por favor dirija-se ao balcão.</p>
              {company.address && <p className="text-sm text-gray-400 mt-3">{company.address}</p>}
            </div>
            <button onClick={() => { setView('join'); setMyEntry(null); setForm({ name: '', phone: '', service_id: '' }) }} className="text-sm text-gray-400 hover:text-gray-600">Sair da fila</button>
          </div>
        )}
      </main>
      <footer className="text-center text-xs text-gray-300 py-6">powered by <span className="font-medium" style={{ color }}>Agenda IGSolution</span></footer>
    </div>
  )
}
