import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCompanyBySlug, getPublicServices, getPublicEmployees, createAppointment, upsertClient } from '../lib/supabase'
import { Calendar, Clock, User, Check } from 'lucide-react'

interface Company { id: string; name: string; logo_url?: string; primary_color?: string; slug: string }
interface Service { id: string; name: string; duration: number; price: number; image_url?: string; description?: string }
interface Employee { id: string; name: string; avatar_url?: string }

type Step = 'service' | 'employee' | 'datetime' | 'info' | 'done'

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

  async function handleBook() {
    if (!company || !sel.service || !sel.date || !sel.time || !info.name) return
    setLoading(true); setError('')
    try {
      const [h, m] = sel.time.split(':').map(Number)
      const endMin = h * 60 + m + sel.service.duration
      const end_time = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
      const { data: client } = await upsertClient({ name: info.name, email: info.email, phone: info.phone, company_id: company.id })
      await createAppointment({ company_id: company.id, client_id: client?.id, service_id: sel.service.id, employee_id: sel.employee?.id ?? null, date: sel.date, start_time: sel.time, end_time, price: sel.service.price, status: 'scheduled' })
      setStep('done')
    } catch { setError('Erro ao criar agendamento. Tente novamente.') }
    setLoading(false)
  }

  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']

  if (!company) return <div className="min-h-screen flex items-center justify-center text-gray-400">A carregar…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          {company.logo_url && <img src={company.logo_url} alt={company.name} className="h-16 mx-auto mb-3 object-contain" />}
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-500 text-sm mt-1">A plataforma que transforma contactos em clientes recorrentes</p>
        </div>

        {step === 'done' ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: color + '20' }}>
              <Check size={32} style={{ color }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Agendamento confirmado!</h2>
            <p className="text-gray-500">Receberá uma confirmação por email. Obrigado, {info.name}!</p>
            <button onClick={() => { setStep('service'); setSel({}); setInfo({ name: '', email: '', phone: '' }) }} className="mt-6 text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Novo agendamento</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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
                  <h2 className="font-semibold text-gray-800 mb-4">Escolha o serviço</h2>
                  {services.map(s => (
                    <button key={s.id} onClick={() => { setSel({ service: s }); setStep('employee') }} className="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                      {s.image_url && <img src={s.image_url} alt={s.name} className="w-full h-28 object-cover rounded-lg mb-3" />}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={11} /> {s.duration} min</p>
                        </div>
                        <span className="font-bold text-gray-900">€{s.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {step === 'employee' && (
                <div className="space-y-3">
                  <h2 className="font-semibold text-gray-800 mb-4">Escolha o profissional</h2>
                  <button onClick={() => setStep('datetime')} className="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50">
                    <p className="font-medium text-gray-700">Sem preferência</p>
                    <p className="text-xs text-gray-400">Qualquer profissional disponível</p>
                  </button>
                  {employees.map(e => (
                    <button key={e.id} onClick={() => { setSel(s => ({ ...s, employee: e })); setStep('datetime') }} className="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50 flex items-center gap-3">
                      {e.avatar_url ? <img src={e.avatar_url} alt={e.name} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">{e.name[0]}</div>}
                      <p className="font-medium text-gray-900">{e.name}</p>
                    </button>
                  ))}
                </div>
              )}
              {step === 'datetime' && (
                <div>
                  <h2 className="font-semibold text-gray-800 mb-4">Escolha a data e hora</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={16} className="text-gray-400" />
                    <input type="date" min={new Date().toISOString().split('T')[0]} value={sel.date ?? ''} onChange={e => setSel(s => ({ ...s, date: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  {sel.date && (
                    <div className="grid grid-cols-4 gap-2">
                      {times.map(t => (
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
                  <h2 className="font-semibold text-gray-800">Os seus dados</h2>
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
                    {loading ? 'A agendar…' : 'Confirmar Agendamento'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
