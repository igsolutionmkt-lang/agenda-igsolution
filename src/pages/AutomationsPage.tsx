import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getAutomations, toggleAutomation } from '../lib/supabase'
import { Zap } from 'lucide-react'

interface Automation { id: string; name: string; description?: string; trigger_type: string; is_active: boolean }

export default function AutomationsPage() {
  const { companyId } = useAuth()
  const [automations, setAutomations] = useState<Automation[]>([])

  useEffect(() => { if (companyId) getAutomations(companyId).then(({ data }) => setAutomations(data ?? [])) }, [companyId])

  async function handleToggle(id: string, current: boolean) {
    await toggleAutomation(id, !current)
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a))
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Automações</h1>
      <div className="space-y-3">
        {automations.map(a => (
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
        {automations.length === 0 && <p className="text-center text-gray-400 py-12">Nenhuma automação configurada</p>}
      </div>
    </div>
  )
}
