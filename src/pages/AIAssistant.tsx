import { useState, useEffect } from 'react'
import { Bot, Send } from 'lucide-react'
import { askAI, getDashboardStats, getGrowthStats, getServices, getEmployees } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Msg { role: 'user' | 'assistant'; content: string }

const suggestions = [
  'Que serviços posso promover esta semana?',
  'Como posso aumentar a taxa de retorno dos clientes?',
  'Quais são os melhores horários para agendar?',
  'Como criar uma campanha de fidelização?',
]

export default function AIAssistant() {
  const { companyId } = useAuth()
  const [context, setContext] = useState<string>('')
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Olá! Sou o seu assistente de IA para o negócio. Posso ajudar com estratégias de crescimento, análise de clientes, sugestões de promoções e muito mais. O que pretende saber?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!companyId) return
    Promise.all([
      getDashboardStats(companyId),
      getGrowthStats(companyId),
      getServices(companyId),
      getEmployees(companyId),
    ]).then(([stats, growth, { data: svcs }, { data: emps }]) => {
      setContext(`
Negócio: agenda local portuguesa
Funcionários: ${(emps ?? []).map((e: { name: string }) => e.name).join(', ')}
Serviços: ${(svcs ?? []).map((s: { name: string; price: number }) => `${s.name} (€${s.price})`).join(', ')}
Marcações hoje: ${stats.todayAppointments}
Marcações este mês: ${stats.monthAppointments}
Receita este mês: €${stats.monthRevenue.toFixed(0)}
Total clientes: ${stats.totalClients}
Taxa de retorno: ${growth.returnRate}%
Clientes activos (30d): ${growth.active}
Clientes em risco: ${growth.atRisk.map((c: { name?: string }) => c.name).join(', ')}
Clientes perdidos: ${growth.lost}
Novos este mês: ${growth.newThisMonth}
      `.trim())
    })
  }, [companyId])

  async function handleSend(text?: string) {
    const msg = text ?? input
    if (!msg.trim() || loading) return
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setInput('')
    setLoading(true)
    const answer = await askAI(msg, history, context)
    setMessages(prev => [...prev, { role: 'assistant', content: answer }])
    setLoading(false)
  }

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-0px)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">IA Assistente</h1>
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center shrink-0"><Bot size={16} className="text-violet-600" /></div>}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center"><Bot size={16} className="text-violet-600" /></div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                <span className="inline-flex gap-1">{[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-gray-100">
          <div className="flex gap-2 mb-2 flex-wrap">
            {suggestions.map(s => <button key={s} onClick={() => handleSend(s)} className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full hover:bg-violet-100">{s}</button>)}
          </div>
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Escreva a sua pergunta…" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            <button onClick={() => handleSend()} className="bg-violet-600 text-white p-2.5 rounded-lg hover:bg-violet-700"><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
