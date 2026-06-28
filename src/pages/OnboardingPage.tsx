import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { completeOnboarding } from '../lib/supabase'
import { WEEKDAYS, DEFAULT_WORKING_HOURS, type WorkingHours } from '../lib/slots'
import { Scissors, Sparkles, Hand, Stethoscope, Store, Check, Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react'

interface SvcDraft { name: string; duration: number; price: number }

const INDUSTRIES: { key: string; label: string; icon: typeof Scissors; services: SvcDraft[] }[] = [
  { key: 'barbearia', label: 'Barbearia', icon: Scissors, services: [
    { name: 'Corte de Cabelo', duration: 30, price: 15 },
    { name: 'Corte + Barba', duration: 60, price: 25 },
    { name: 'Barba', duration: 30, price: 12 },
  ] },
  { key: 'cabeleireiro', label: 'Cabeleireiro', icon: Sparkles, services: [
    { name: 'Corte Senhora', duration: 45, price: 25 },
    { name: 'Coloração', duration: 90, price: 60 },
    { name: 'Brushing', duration: 30, price: 18 },
  ] },
  { key: 'estetica', label: 'Estética', icon: Stethoscope, services: [
    { name: 'Limpeza de Pele', duration: 60, price: 45 },
    { name: 'Massagem', duration: 50, price: 40 },
    { name: 'Depilação', duration: 30, price: 20 },
  ] },
  { key: 'unhas', label: 'Unhas', icon: Hand, services: [
    { name: 'Manicure', duration: 45, price: 18 },
    { name: 'Pedicure', duration: 60, price: 25 },
    { name: 'Verniz Gel', duration: 60, price: 30 },
  ] },
  { key: 'outro', label: 'Outro', icon: Store, services: [
    { name: 'Serviço 30 min', duration: 30, price: 20 },
    { name: 'Serviço 60 min', duration: 60, price: 35 },
  ] },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { companyId, refreshCompany } = useAuth()
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState('')
  const [services, setServices] = useState<SvcDraft[]>([])
  const [hours, setHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS)
  const [saving, setSaving] = useState(false)

  function pickIndustry(key: string) {
    setCategory(key)
    setServices(INDUSTRIES.find(i => i.key === key)?.services.map(s => ({ ...s })) ?? [])
    setStep(2)
  }

  function setDay(day: string, patch: Partial<{ active: boolean; start: string; end: string }>) {
    setHours(h => ({ ...h, [day]: { ...(h[day] ?? { active: false }), ...patch } }))
  }

  async function finish() {
    if (!companyId) return
    setSaving(true)
    await completeOnboarding(companyId, { category, services, workingHours: hours })
    await refreshCompany()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 to-violet-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-violet-600 px-6 py-4 text-white">
          <p className="text-xs text-violet-200">Configuração inicial · passo {step} de 3</p>
          <h1 className="text-lg font-bold">
            {step === 1 ? 'Que tipo de negócio tem?' : step === 2 ? 'Os seus serviços' : 'Horário de funcionamento'}
          </h1>
          <div className="flex gap-1.5 mt-3">
            {[1, 2, 3].map(s => <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-white' : 'bg-white/30'}`} />)}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {INDUSTRIES.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => pickIndustry(key)}
                  className="flex flex-col items-center gap-2 border border-gray-200 rounded-xl p-5 hover:border-violet-400 hover:bg-violet-50 transition-colors">
                  <Icon size={28} className="text-violet-600" />
                  <span className="font-medium text-gray-800 text-sm">{label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Pré-preenchemos serviços comuns — edite, remova ou adicione.</p>
              {services.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={s.name} onChange={e => setServices(arr => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Nome" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <input type="number" value={s.duration} onChange={e => setServices(arr => arr.map((x, j) => j === i ? { ...x, duration: +e.target.value } : x))} className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm" title="minutos" />
                  <span className="text-xs text-gray-400">min</span>
                  <input type="number" value={s.price} onChange={e => setServices(arr => arr.map((x, j) => j === i ? { ...x, price: +e.target.value } : x))} className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm" title="preço" />
                  <span className="text-xs text-gray-400">€</span>
                  <button onClick={() => setServices(arr => arr.filter((_, j) => j !== i))} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => setServices(arr => [...arr, { name: '', duration: 30, price: 20 }])} className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700">
                <Plus size={14} /> Adicionar serviço
              </button>
              <div className="flex justify-between pt-3">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={14} /> Voltar</button>
                <button onClick={() => setStep(3)} className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700">Continuar <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Defina os dias e horas em que atende.</p>
              <div className="space-y-1.5">
                {WEEKDAYS.map((dayName, i) => {
                  const d = hours[String(i)] ?? { active: false }
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 w-24 text-xs text-gray-600">
                        <input type="checkbox" checked={!!d.active} onChange={e => setDay(String(i), { active: e.target.checked, start: d.start ?? '09:00', end: d.end ?? '18:00' })} />
                        {dayName}
                      </label>
                      {d.active ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input type="time" value={d.start ?? '09:00'} onChange={e => setDay(String(i), { start: e.target.value })} className="border border-gray-200 rounded px-2 py-1 text-xs flex-1" />
                          <span className="text-gray-300 text-xs">–</span>
                          <input type="time" value={d.end ?? '18:00'} onChange={e => setDay(String(i), { end: e.target.value })} className="border border-gray-200 rounded px-2 py-1 text-xs flex-1" />
                        </div>
                      ) : <span className="text-xs text-gray-300 flex-1">Folga</span>}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between pt-3">
                <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={14} /> Voltar</button>
                <button onClick={finish} disabled={saving} className="flex items-center gap-1.5 bg-violet-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                  {saving ? 'A configurar…' : <>Concluir <Check size={14} /></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
