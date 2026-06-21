import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getAutomations, toggleAutomation } from '../lib/supabase'
import { Zap, Shield, RotateCcw, Heart } from 'lucide-react'

interface Automation { id: string; name: string; description?: string; trigger_type: string; is_active: boolean }

type Goal = 'proteger' | 'voltar' | 'fidelizar'

// Mapeia o trigger_type da automação para um objetivo de negócio
function goalOf(trigger: string): Goal {
  const t = trigger.toLowerCase()
  if (t.includes('reminder') || t.includes('lembrete') || t.includes('confirm') || t.includes('no_show')) return 'proteger'
  if (t.includes('winback') || t.includes('followup') || t.includes('follow_up') || t.includes('risco') || t.includes('lost')) return 'voltar'
  return 'fidelizar'
}

const GOAL_META: Record<Goal, { label: string; desc: string; icon: typeof Zap; cls: string; impact: string }> = {
  proteger: { label: 'Proteger receita', desc: 'Reduzir faltas e cancelamentos', icon: Shield, cls: 'text-blue-600 bg-blue-50', impact: 'Cada falta evitada ≈ valor do serviço recuperado' },
  voltar: { label: 'Fazer voltar', desc: 'Recuperar clientes inativos', icon: RotateCcw, cls: 'text-amber-600 bg-amber-50', impact: 'Reativar 1 cliente custa 5× menos que angariar' },
  fidelizar: { label: 'Fidelizar', desc: 'Aumentar a frequência e o valor', icon: Heart, cls: 'text-violet-600 bg-violet-50', impact: '+5% de retenção pode subir o lucro 25–95%' },
}

const GOAL_ORDER: Goal[] = ['proteger', 'voltar', 'fidelizar']

export default function AutomationsPage() {
  const { companyId } = useAuth()
  const [automations, setAutomations] = useState<Automation[]>([])

  useEffect(() => { if (companyId) getAutomations(companyId).then(({ data }) => setAutomations(data ?? [])) }, [companyId])

  async function handleToggle(id: string, current: boolean) {
    await toggleAutomation(id, !current)
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a))
  }

  const grouped = GOAL_ORDER.map(goal => ({ goal, items: automations.filter(a => goalOf(a.trigger_type) === goal) }))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Automações</h1>
      <p className="text-sm text-gray-500 mb-6">Organizadas pelo objetivo de negócio que ajudam a atingir</p>

      {automations.length === 0 && <p className="text-center text-gray-400 py-12">Nenhuma automação configurada</p>}

      <div className="space-y-8">
        {grouped.map(({ goal, items }) => {
          if (items.length === 0) return null
          const meta = GOAL_META[goal]
          const activeCount = items.filter(a => a.is_active).length
          const Icon = meta.icon
          return (
            <section key={goal}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${meta.cls}`}><Icon size={18} /></div>
                <div>
                  <h2 className="font-semibold text-gray-900">{meta.label}</h2>
                  <p className="text-xs text-gray-500">{meta.desc} · {activeCount}/{items.length} ativas</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3 ml-1">💡 {meta.impact}</p>
              <div className="space-y-3">
                {items.map(a => (
                  <div key={a.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${a.is_active ? 'bg-violet-100' : 'bg-gray-100'}`}>
                        <Zap size={16} className={a.is_active ? 'text-violet-600' : 'text-gray-400'} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{a.name}</p>
                        {a.description && <p className="text-sm text-gray-500">{a.description}</p>}
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">{a.trigger_type}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(a.id, a.is_active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${a.is_active ? 'bg-violet-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${a.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
