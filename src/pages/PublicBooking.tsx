import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCompanyBySlug, getPublicServices, getPublicEmployees, createAppointment, upsertClient, sendConfirmation, getBookedSlots } from '../lib/supabase'
import { generateSlots, unionSlots, WEEKDAYS, type WorkingHours } from '../lib/slots'
import { Calendar, Clock, User, Check, MapPin, Phone, Star, ChevronRight, Scissors, ArrowLeft } from 'lucide-react'

interface Company { id: string; name: string; logo_url?: string; primary_color?: string; slug: string; phone?: string; email?: string; address?: string }
interface Service { id: string; name: string; duration: number; price: number; image_url?: string; description?: string }
interface Employee { id: string; name: string; avatar_url?: string; working_hours?: WorkingHours; specialties?: string }

type Step = 'service' | 'employee' | 'datetime' | 'info' | 'done'

function hex2rgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>()
  const [company, setCompany] = useState<Company | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [step, setStep] = useState<Step>('service')
  const [sel, setSel] = useState<{ service?: Service; employee?: Employee; date?: string; time?: string }>({})
  const [info, setInfo] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const bookRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!slug) return
    getCompanyBySlug(slug).then(({ data }) => {
      setCompany(data)
      if (data) {
        getPublicServices(data.id).then(({ data: s }) => setServices(s ?? []))
        getPublicEmployees(data.id).then(({ data: e }) => setEmployees(e ?? []))
      }
    })
  }, [slug])

  const color = company?.primary_color ?? '#7c3aed'

  useEffect(() => {
    if (!company || !sel.date || !sel.service) { setSlots([]); return }
    setLoadingSlots(true)
    const duration = sel.service.duration
    const candidate = sel.employee
      ? generateSlots(sel.employee.working_hours, sel.date, duration)
      : unionSlots(employees.map(e => e.working_hours), sel.date, duration)
    getBookedSlots(company.id, sel.date, sel.employee?.id).then(booked => {
      let available: string[]
      if (sel.employee) {
        const taken = new Set(booked.map(b => b.start_time?.slice(0, 5)))
        available = candidate.filter(s => !taken.has(s))
      } else {
        const day = new Date(sel.date! + 'T00:00:00').getDay()
        const activeCount = employees.filter(e => e.working_hours?.[String(day)]?.active).length || 1
        const counts: Record<string, number> = {}
        booked.forEach(b => { const t = b.start_time?.slice(0, 5); if (t) counts[t] = (counts[t] ?? 0) + 1 })
        available = candidate.filter(s => (counts[s] ?? 0) < activeCount)
      }
      setSlots(available)
      setSel(s => s.time && !available.includes(s.time) ? { ...s, time: undefined } : s)
      setLoadingSlots(false)
    })
  }, [company, sel.date, sel.employee, sel.service, employees])

  // Horário semanal agregado (união dos funcionários ativos)
  const weeklyHours = WEEKDAYS.map((name, i) => {
    const active = employees.map(e => e.working_hours?.[String(i)]).filter(d => d?.active && d.start && d.end) as { start: string; end: string }[]
    if (active.length === 0) return { name, label: 'Fechado', open: false }
    const start = active.reduce((m, d) => d.start < m ? d.start : m, active[0].start)
    const end = active.reduce((m, d) => d.end > m ? d.end : m, active[0].end)
    return { name, label: `${start} – ${end}`, open: true }
  })
  const todayIdx = new Date().getDay()

  function scrollToBook() { bookRef.current?.scrollIntoView({ behavior: 'smooth' }) }
  function pickService(s: Service) { setSel({ service: s }); setStep('employee'); setTimeout(scrollToBook, 50) }

  async function handleBook() {
    if (!company || !sel.service || !sel.date || !sel.time || !info.name) return
    setLoading(true); setError('')
    try {
      const [h, m] = sel.time.split(':').map(Number)
      const endMin = h * 60 + m + sel.service.duration
      const end_time = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
      const { data: client } = await upsertClient({ name: info.name, email: info.email, phone: info.phone, company_id: company.id })
      const { data: created } = await createAppointment({ company_id: company.id, client_id: client?.id, service_id: sel.service.id, employee_id: sel.employee?.id ?? null, date: sel.date, start_time: sel.time, end_time, price: sel.service.price, status: 'scheduled' })
      if (created?.id) sendConfirmation(created.id)
      setStep('done')
    } catch { setError('Erro ao criar agendamento. Tente novamente.') }
    setLoading(false)
  }

  if (!company) return <div className="min-h-screen flex items-center justify-center text-gray-400">A carregar…</div>

  const initials = company.name.split(' ').slice(0, 2).map(w => w[0]).join('')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── HERO ─── */}
      <header className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color} 0%, ${hex2rgba(color, 0.82)} 100%)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #fff 0, transparent 40%), radial-gradient(circle at 80% 70%, #fff 0, transparent 35%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-14 text-center text-white">
          {company.logo_url
            ? <img src={company.logo_url} alt={company.name} className="h-20 w-20 mx-auto mb-4 object-cover rounded-2xl bg-white/10 ring-4 ring-white/20" />
            : <div className="h-20 w-20 mx-auto mb-4 rounded-2xl bg-white/15 ring-4 ring-white/20 flex items-center justify-center text-3xl font-bold">{initials}</div>}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{company.name}</h1>
          <div className="flex items-center justify-center gap-1 mt-2 text-white/90">
            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" className="text-amber-300" />)}
            <span className="text-sm ml-1.5 text-white/80">Reserva online · resposta imediata</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-4 text-sm text-white/85">
            {company.address && <span className="flex items-center gap-1.5"><MapPin size={14} /> {company.address}</span>}
            {company.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {company.phone}</span>}
          </div>
          <button onClick={scrollToBook} className="mt-7 inline-flex items-center gap-2 bg-white px-7 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow" style={{ color }}>
            <Calendar size={18} /> Marcar agora
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-6 relative pb-16">
        {/* ─── HORÁRIO + INFO ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 grid sm:grid-cols-2 gap-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5"><Clock size={13} /> Horário</h3>
            <ul className="space-y-1">
              {weeklyHours.map((d, i) => (
                <li key={i} className={`flex justify-between text-sm ${i === todayIdx ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                  <span>{d.name}{i === todayIdx && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: hex2rgba(color, 0.12), color }}>hoje</span>}</span>
                  <span className={d.open ? '' : 'text-gray-300'}>{d.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5"><MapPin size={13} /> Localização</h3>
            {company.address && <p className="text-sm text-gray-600 mb-2">{company.address}</p>}
            {company.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(company.address)}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium inline-flex items-center gap-1" style={{ color }}>Ver no mapa <ChevronRight size={14} /></a>}
            {company.phone && <a href={`tel:${company.phone}`} className="block mt-3 text-sm text-gray-600"><Phone size={13} className="inline mr-1.5" />{company.phone}</a>}
          </div>
        </div>

        {/* ─── SERVIÇOS ─── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Os nossos serviços</h2>
          <p className="text-sm text-gray-500 mb-5">Escolha um serviço para marcar</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {services.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="h-32 w-full relative" style={{ backgroundColor: hex2rgba(color, 0.08) }}>
                  {s.image_url
                    ? <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center"><Scissors size={32} style={{ color: hex2rgba(color, 0.4) }} /></div>}
                  <span className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-sm font-bold shadow-sm" style={{ color }}>€{s.price}</span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Clock size={12} /> {s.duration} min</p>
                  <button onClick={() => pickService(s)} className="mt-3 w-full py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: color }}>Marcar este serviço</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── EQUIPA ─── */}
        {employees.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-1">A nossa equipa</h2>
            <p className="text-sm text-gray-500 mb-5">Profissionais ao seu dispor</p>
            <div className="flex flex-wrap gap-5">
              {employees.map(e => (
                <div key={e.id} className="flex flex-col items-center w-24 text-center">
                  {e.avatar_url
                    ? <img src={e.avatar_url} alt={e.name} className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-100" />
                    : <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ring-2 ring-gray-100" style={{ backgroundColor: hex2rgba(color, 0.12), color }}>{e.name[0]}</div>}
                  <p className="text-sm font-medium text-gray-800 mt-2 leading-tight">{e.name}</p>
                  {e.specialties && <p className="text-[11px] text-gray-400 leading-tight">{e.specialties}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── AGENDAMENTO ─── */}
        <section ref={bookRef} className="scroll-mt-4">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Fazer marcação</h2>

          {step === 'done' ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center border border-gray-100">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: hex2rgba(color, 0.12) }}>
                <Check size={32} style={{ color }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Marcação confirmada!</h3>
              <p className="text-gray-500">Receberá uma confirmação por email. Obrigado, {info.name}!</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mt-4 inline-block text-left">
                <p><strong>{sel.service?.name}</strong> · {sel.date} às {sel.time}</p>
                {sel.employee && <p className="text-gray-500">com {sel.employee.name}</p>}
              </div>
              <div><button onClick={() => { setStep('service'); setSel({}); setInfo({ name: '', email: '', phone: '' }) }} className="mt-6 text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Nova marcação</button></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="flex border-b border-gray-100">
                {(['service', 'employee', 'datetime', 'info'] as Step[]).map((s, i) => (
                  <div key={s} className={`flex-1 py-3 text-center text-xs font-medium ${step === s ? 'text-white' : 'text-gray-400'}`} style={step === s ? { backgroundColor: color } : {}}>
                    {i + 1}. {s === 'service' ? 'Serviço' : s === 'employee' ? 'Profissional' : s === 'datetime' ? 'Data/Hora' : 'Dados'}
                  </div>
                ))}
              </div>
              <div className="p-6">
                {step === 'service' && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800 mb-4">Escolha o serviço</h3>
                    {services.map(s => (
                      <button key={s.id} onClick={() => pickService(s)} className="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={11} /> {s.duration} min</p>
                        </div>
                        <span className="font-bold text-gray-900">€{s.price}</span>
                      </button>
                    ))}
                  </div>
                )}
                {step === 'employee' && (
                  <div className="space-y-3">
                    <button onClick={() => setStep('service')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2"><ArrowLeft size={12} /> Voltar</button>
                    <h3 className="font-semibold text-gray-800 mb-4">Escolha o profissional</h3>
                    <button onClick={() => setStep('datetime')} className="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50">
                      <p className="font-medium text-gray-700">Sem preferência</p>
                      <p className="text-xs text-gray-400">Qualquer profissional disponível</p>
                    </button>
                    {employees.map(e => (
                      <button key={e.id} onClick={() => { setSel(s => ({ ...s, employee: e })); setStep('datetime') }} className="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50 flex items-center gap-3">
                        {e.avatar_url ? <img src={e.avatar_url} alt={e.name} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: hex2rgba(color, 0.12), color }}>{e.name[0]}</div>}
                        <p className="font-medium text-gray-900">{e.name}</p>
                      </button>
                    ))}
                  </div>
                )}
                {step === 'datetime' && (
                  <div>
                    <button onClick={() => setStep('employee')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2"><ArrowLeft size={12} /> Voltar</button>
                    <h3 className="font-semibold text-gray-800 mb-4">Escolha a data e hora</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar size={16} className="text-gray-400" />
                      <input type="date" min={new Date().toISOString().split('T')[0]} value={sel.date ?? ''} onChange={e => setSel(s => ({ ...s, date: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    {sel.date && loadingSlots && <p className="text-sm text-gray-400 text-center py-4">A verificar disponibilidade…</p>}
                    {sel.date && !loadingSlots && slots.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sem horários disponíveis neste dia. Escolha outra data.</p>}
                    {sel.date && !loadingSlots && slots.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.map(t => (
                          <button key={t} onClick={() => setSel(s => ({ ...s, time: t }))} className={`py-2 rounded-lg text-sm border transition-colors ${sel.time === t ? 'text-white' : 'border-gray-200 hover:bg-gray-50'}`} style={sel.time === t ? { backgroundColor: color, borderColor: color } : {}}>
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                    {sel.date && sel.time && (
                      <button onClick={() => setStep('info')} className="w-full mt-4 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: color }}>Continuar →</button>
                    )}
                  </div>
                )}
                {step === 'info' && (
                  <div className="space-y-4">
                    <button onClick={() => setStep('datetime')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><ArrowLeft size={12} /> Voltar</button>
                    <h3 className="font-semibold text-gray-800">Os seus dados</h3>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 space-y-1">
                      <p><strong>{sel.service?.name}</strong> — €{sel.service?.price} | {sel.service?.duration} min</p>
                      {sel.employee && <p><User size={12} className="inline mr-1" />{sel.employee.name}</p>}
                      <p><Calendar size={12} className="inline mr-1" />{sel.date} às {sel.time}</p>
                    </div>
                    <input required value={info.name} onChange={e => setInfo(i => ({ ...i, name: e.target.value }))} placeholder="Nome completo *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <input type="email" value={info.email} onChange={e => setInfo(i => ({ ...i, email: e.target.value }))} placeholder="Email (para confirmação)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <input value={info.phone} onChange={e => setInfo(i => ({ ...i, phone: e.target.value }))} placeholder="Telefone" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button onClick={handleBook} disabled={!info.name || loading} className="w-full py-3 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: color }}>
                      {loading ? 'A agendar…' : 'Confirmar marcação'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-400">
        {company.name} · Marcações online
        <span className="mx-2">·</span>
        powered by <span className="font-medium" style={{ color }}>Agenda IGSolution</span>
      </footer>
    </div>
  )
}
