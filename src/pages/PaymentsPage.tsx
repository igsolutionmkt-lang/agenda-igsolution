import { useAuth } from '../lib/auth'
import { createStripeCheckout, createStripePortal } from '../lib/supabase'
import { CreditCard, ExternalLink } from 'lucide-react'

const plans = [
  { id: 'starter', name: 'Starter', price: '29', features: ['Até 100 agendamentos/mês', '1 funcionário', 'Booking público', 'Email automático'], priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER },
  { id: 'pro', name: 'Pro', price: '59', features: ['Agendamentos ilimitados', 'Até 5 funcionários', 'Relatórios avançados', 'Automações + Fidelização'], priceId: import.meta.env.VITE_STRIPE_PRICE_PRO, popular: true },
  { id: 'enterprise', name: 'Enterprise', price: '99', features: ['Tudo do Pro', 'Funcionários ilimitados', 'White-label', 'Suporte prioritário'], priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE },
]

export default function PaymentsPage() {
  const { companyId } = useAuth()

  async function handleCheckout(priceId: string) {
    if (!companyId || !priceId) return
    const { data, error } = await createStripeCheckout(priceId, companyId)
    if (error) { alert('Erro ao criar checkout'); return }
    window.location.href = data.url
  }

  async function handlePortal() {
    if (!companyId) return
    const { data, error } = await createStripePortal(companyId)
    if (error) { alert('Erro ao abrir portal'); return }
    window.location.href = data.url
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <button onClick={handlePortal} className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 border border-violet-200 px-3 py-2 rounded-lg">
          <ExternalLink size={14} /> Gerir subscrição
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(p => (
          <div key={p.id} className={`bg-white rounded-xl p-6 shadow-sm border ${p.popular ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-gray-100'} relative`}>
            {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-violet-600 text-white px-3 py-1 rounded-full">Mais popular</span>}
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={18} className="text-violet-600" />
              <h3 className="font-bold text-gray-900">{p.name}</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-4">€{p.price}<span className="text-sm font-normal text-gray-500">/mês</span></p>
            <ul className="space-y-2 mb-6">
              {p.features.map(f => <li key={f} className="text-sm text-gray-600 flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>)}
            </ul>
            <button onClick={() => handleCheckout(p.priceId)} className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${p.popular ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
              Escolher plano
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
