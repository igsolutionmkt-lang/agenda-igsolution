import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getAppointments, updateAppointment, deleteAppointment, getClients, getServices, getEmployees, createAppointment } from '../lib/supabase'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'

interface Apt { id: string; scheduled_at: string; status: string; price?: number; notes?: string; agenda_clients?: { name: string }; agenda_services?: { name: string; duration: number }; agenda_employees?: { name: string } }
interface Client { id: string; name: string }
interface Service { id: string; name: string; duration: number; price: number }
interface Employee { id: string; name: string }

export default function CalendarPage() {
  const { companyId } = useAuth()
  const [week, setWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [apts, setApts] = useState<Apt[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ client_id: '', service_id: '', employee_id: '', scheduled_at: '', notes: '', price: '' })

  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i))

  useEffect(() => {
    if (!companyId) return
    const from = week.toISOString()
    const to = addDays(week, 6).toISOString()
    getAppointments(companyId, from, to).then(({ data }) => setApts(data ?? []))
    getClients(companyId).then(({ data }) => setClients(data ?? []))
    getServices(companyId).then(({ data }) => setServices(data ?? []))
    getEmployees(companyId).then(({ data }) => setEmployees(data ?? []))
  }, [companyId, week])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const svc = services.find(s => s.id === form.service_id)
    await createAppointment({ ...form, company_id: companyId, price: form.price ? +form.price : svc?.price, status: 'scheduled' })
    setShowModal(false)
    const { data } = await getAppointments(companyId!, week.toISOString(), addDays(week, 6).toISOString())
    setApts(data ?? [])
  }

  async function handleStatus(id: string, status: string) {
    await updateAppointment(id, { status })
    setApts(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  async function handleDelete(id: string) {
    await deleteAppointment(id)
    setApts(prev => prev.filter(a => a.id !== id))
  }

  const statusColor: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeek(w => addDays(w, -7))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium text-gray-600">
            {format(week, 'd MMM', { locale: pt })} – {format(addDays(week, 6), 'd MMM yyyy', { locale: pt })}
          </span>
          <button onClick={() => setWeek(w => addDays(w, 7))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-700">
            <Plus size={16} /> Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayApts = apts.filter(a => isSameDay(parseISO(a.scheduled_at), day))
          const isToday = isSameDay(day, new Date())
          return (
            <div key={day.toISOString()} className="bg-white rounded-xl border border-gray-100 shadow-sm min-h-32">
              <div className={`p-2 text-center border-b border-gray-50 ${isToday ? 'bg-violet-600 text-white rounded-t-xl' : ''}`}>
                <p className={`text-xs ${isToday ? 'text-violet-200' : 'text-gray-400'}`}>{format(day, 'EEE', { locale: pt })}</p>
                <p className={`font-bold text-sm ${isToday ? 'text-white' : 'text-gray-800'}`}>{format(day, 'd')}</p>
              </div>
              <div className="p-1.5 space-y-1">
                {dayApts.map(a => (
                  <div key={a.id} className={`rounded p-1.5 text-xs ${statusColor[a.status] ?? 'bg-gray-100'} group relative`}>
                    <p className="font-medium truncate">{a.agenda_clients?.name}</p>
                    <p className="truncate opacity-75">{a.agenda_services?.name}</p>
                    <p className="text-[10px] opacity-60">{format(parseISO(a.scheduled_at), 'HH:mm')}</p>
                    <div className="hidden group-hover:flex gap-1 mt-1">
                      {a.status === 'scheduled' && (
                        <button onClick={() => handleStatus(a.id, 'completed')} className="text-[10px] bg-green-600 text-white px-1 rounded">✓</button>
                      )}
                      <button onClick={() => handleDelete(a.id)} className="text-[10px] bg-red-500 text-white px-1 rounded">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Novo Agendamento</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <select required value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Selecionar cliente…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select required value={form.service_id} onChange={e => { const s = services.find(x => x.id === e.target.value); setForm(f => ({ ...f, service_id: e.target.value, price: s?.price?.toString() ?? '' })) }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Selecionar serviço…</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} – €{s.price}</option>)}
              </select>
              <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Funcionário (opcional)</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <input type="datetime-local" required value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input type="number" placeholder="Preço (€)" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <textarea placeholder="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={2} />
              <button type="submit" className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700">Criar Agendamento</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
