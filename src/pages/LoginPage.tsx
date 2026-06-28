import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUpCompany } from '../lib/supabase'

type Mode = 'select' | 'admin' | 'company' | 'register'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('select')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setInfo('')

    if (mode === 'register') {
      if (!name.trim() || !company.trim()) { setLoading(false); setError('Preencha o nome e o nome da empresa.'); return }
      const { error: err, needsConfirmation } = await signUpCompany(email, password, name.trim(), company.trim())
      setLoading(false)
      if (err) { setError(err.message); return }
      if (needsConfirmation) { setInfo('Conta criada! Confirme o seu email para entrar.'); return }
      navigate('/dashboard')
      return
    }

    const { data, error: err } = await signIn(email, password)
    setLoading(false)
    if (err) { setError(err.message); return }
    const role = data.user?.app_metadata?.role
    navigate(role === 'super_admin' ? '/admin' : '/dashboard')
  }

  if (mode === 'select') return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 to-violet-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <span className="text-3xl">⚡</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Agenda IGSolution</h1>
          <p className="text-violet-300 mt-2">A plataforma que transforma contactos em clientes recorrentes</p>
        </div>
        <div className="space-y-3">
          <button onClick={() => setMode('admin')} className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-medium transition-colors border border-white/20">
            🔐 Super Admin
          </button>
          <button onClick={() => setMode('company')} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-4 rounded-xl font-medium transition-colors">
            🏢 Entrar como Empresa
          </button>
          <button onClick={() => setMode('register')} className="w-full bg-white text-violet-900 py-4 rounded-xl font-medium hover:bg-violet-50 transition-colors">
            ✨ Criar Conta Grátis
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 to-violet-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl">
        <button onClick={() => setMode('select')} className="text-sm text-gray-500 hover:text-gray-700 mb-4">← Voltar</button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {mode === 'admin' ? 'Acesso Super Admin' : mode === 'register' ? 'Criar Conta' : 'Entrar'}
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          {mode === 'register' && (
            <>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Nome da empresa" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </>
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {info && <p className="text-green-600 text-sm">{info}</p>}
          <button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
            {loading ? 'A entrar…' : mode === 'register' ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>
        {mode === 'admin' && (
          <p className="text-xs text-gray-400 mt-4 text-center">admin@igsolution.pt / admin2024!</p>
        )}
        {mode === 'company' && (
          <p className="text-xs text-gray-400 mt-4 text-center">demo@igsolution.pt / demo1234</p>
        )}
      </div>
    </div>
  )
}
