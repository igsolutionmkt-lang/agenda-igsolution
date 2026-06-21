import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getLoyaltyRewards } from '../lib/supabase'
import { Gift } from 'lucide-react'

interface Reward { id: string; name: string; description?: string; points_required: number; is_active: boolean }

export default function LoyaltyPage() {
  const { companyId } = useAuth()
  const [rewards, setRewards] = useState<Reward[]>([])

  useEffect(() => { if (companyId) getLoyaltyRewards(companyId).then(({ data }) => setRewards(data ?? [])) }, [companyId])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Fidelização</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-lg"><Gift size={16} className="text-amber-600" /></div>
              <div>
                <p className="font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-amber-600">{r.points_required} pontos</p>
              </div>
            </div>
            {r.description && <p className="text-sm text-gray-500">{r.description}</p>}
            <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {r.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        ))}
        {rewards.length === 0 && <p className="col-span-3 text-center text-gray-400 py-12">Nenhuma recompensa configurada</p>}
      </div>
    </div>
  )
}
