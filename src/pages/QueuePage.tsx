import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../lib/auth'
import { getQueue, callNext, finishQueue, getCompany } from '../lib/supabase'
import { Bell, Check, X, Clock, QrCode, RefreshCw, ArrowRight, Users } from 'lucide-react'

interface QueueEntry {
  id: string; name: string; phone?: string; service_name?: string
  status: 'waiting' | 'called' | 'done' | 'left' | 'converted'
  position: number; joined_at: string; notified_at?: string
}
interface Company { slug: string; name: string }

export default function QueuePage() {
  const { companyId } = useAuth()
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(false)
  const [calling, setCalling] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const publicUrl = company ? `${window.location.origin}/queue/${company.slug}` : ''

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    const { data } = await getQueue(companyId)
    setQueue((data ?? []) as QueueEntry[])
    setLoading(false)
  }, [companyId])

  useEffect(() => {
    if (!companyId) return
    load()
    getCompany(companyId).then(({ data }) => setCompany(data))
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [companyId, load])

  const waiting = queue.filter(q => q.status === 'waiting')
  const called = queue.filter(q => q.status === 'called')

  async function handleCallNext() {
    if (!companyId) return
    setCalling(true)
    await callNext(companyId)
    await load()
    setCalling(false)
  }

  async function handleFinish(id: string, status: 'done' | 'left' | 'converted') {
    await finishQueue(id, status)
    await load()
  }

  function minutesWaiting(joined_at: string) {
    return Math.floor((Date.now() - new Date(joined_at).getTime()) / 60000)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fila Virtual</h1>
          <p className="text-sm text-gray-500 mt-0.5">Clientes a aguardar atendimento presencial</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowQR(s => !s)} className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
            <QrCode size={15} /> QR / Link
          </button>
          <button onClick={handleCallNext} disabled={calling || waiting.length === 0}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
            <Bell size={15} /> {calling ? 'A chamar…' : 'Chamar próximo'}
          </button>
        </div>
      </div>

      {showQR && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-5 flex items-center gap-6">
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(publicUrl)}`} alt="QR" className="rounded-lg shadow-sm" />
          <div className="flex-1">
            <p className="font-semibold text-gray-800 mb-1">Link da fila pública</p>
            <p className="text-xs text-gray-500 mb-3">Coloca este QR à entrada. O cliente lê, entra na fila pelo telemóvel e espera onde quiser.</p>
            <div className="flex items-center gap-2">
              <input readOnly value={publicUrl} className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600" />
              <button onClick={() => navigator.clipboard.writeText(publicUrl)} className="text-xs bg-violet-600 text-white px-3 py-2 rounded-lg">Copiar</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-3xl font-bold text-amber-600">{waiting.length}</p>
          <p className="text-sm text-gray-500 mt-1">A aguardar</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-3xl font-bold text-violet-600">{called.length}</p>
          <p className="text-sm text-gray-500 mt-1">Chamados</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-3xl font-bold text-gray-700">{queue.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total hoje</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" /> A aguardar ({waiting.length})
          </h2>
          {waiting.length === 0
            ? <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">Fila vazia</div>
            : <div className="space-y-2">
                {waiting.map((q, idx) => (
                  <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{q.name}</p>
                      {q.service_name && <p className="text-xs text-gray-500 truncate">{q.service_name}</p>}
                      <p className="text-xs text-gray-400">{minutesWaiting(q.joined_at)} min em espera</p>
                    </div>
                    <button onClick={() => handleFinish(q.id, 'left')} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Saiu">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
          }
        </div>

        <div>
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Bell size={16} className="text-violet-500" /> Chamados ({called.length})
          </h2>
          {called.length === 0
            ? <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">Nenhum chamado</div>
            : <div className="space-y-2">
                {called.map(q => (
                  <div key={q.id} className="bg-violet-50 rounded-xl border border-violet-100 p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center shrink-0"><Bell size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{q.name}</p>
                      {q.service_name && <p className="text-xs text-gray-500 truncate">{q.service_name}</p>}
                      {q.phone && <p className="text-xs text-gray-400">{q.phone}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleFinish(q.id, 'converted')} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Convertido em marcação"><ArrowRight size={14} /></button>
                      <button onClick={() => handleFinish(q.id, 'done')} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Atendido"><Check size={14} /></button>
                      <button onClick={() => handleFinish(q.id, 'left')} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Não apareceu"><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {queue.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <Users size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">Fila vazia</p>
          <p className="text-sm text-gray-300 mt-1">Partilha o QR code à entrada para os clientes entrarem na fila</p>
        </div>
      )}
    </div>
  )
}
