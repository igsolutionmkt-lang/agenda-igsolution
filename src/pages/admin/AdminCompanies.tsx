import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminCompanies, createCompanyAdmin } from '../../lib/supabase'
import { Plus, ExternalLink, X, ChevronRight } from 'lucide-react'

interface Company { id: string; name: string; slug: string; plan: string; created_at: string; brand_color?: string }

const industries = ['barbearia', 'cabeleireiro', 'estetica', 'unhas', 'outro']

export default function AdminCompanies() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<Company[]>([])
  const [wizard, setWizard] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ name: string; email: string; password: string; slug: string } | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', industry: 'outro', adminName: '', adminEmail: '', plan: 'starter', color: '#7c3aed' })

  useEffect(() => { getAdminCompanies().then(({ data }) => setCompanies(data ?? [])) }, [])

  async function handleCreate() {
    setLoading(true)
    const { data, error } = await createCompanyAdmin({ ...form })
    setLoading(false)
    if (error) { alert('Erro: ' + error.message); return }
    setResult(data)
    setStep(4)
    getAdminCompanies().then(({ data: d }) => setCompanies(d ?? []))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
        <button onClick={() => { setWizard(true); setStep(1); setResult(null) }} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-700">
          <Plus size={16} /> Nova Empresa
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Empresa', 'Slug', 'Plano', 'Criada em', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {companies.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/companies/${c.id}`)}>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.slug}</td>
                <td className="px-4 py-3"><span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full capitalize">{c.plan}</span></td>
                <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString('pt')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <a href={`/book/${c.slug}`} target="_blank" onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-violet-600"><ExternalLink size={14} /></a>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies.length === 0 && <p className="text-center text-gray-400 py-12">Nenhuma empresa</p>}
      </div>

      {wizard && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Nova Empresa {step < 4 && `— Passo ${step}/3`}</h2>
              <button onClick={() => setWizard(false)}><X size={20} /></button>
            </div>
            {step === 1 && (
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} placeholder="Nome da empresa *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="Slug (URL) *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <select value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <button disabled={!form.name || !form.slug} onClick={() => setStep(2)} className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">Próximo →</button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-3">
                <input value={form.adminName} onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))} placeholder="Nome do responsável *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <input type="email" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} placeholder="Email do responsável *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 py-2.5 rounded-lg text-sm">← Voltar</button>
                  <button disabled={!form.adminName || !form.adminEmail} onClick={() => setStep(3)} className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">Próximo →</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Plano</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['starter', 'pro', 'enterprise'].map(p => <button key={p} onClick={() => setForm(f => ({ ...f, plan: p }))} className={`py-2 rounded-lg text-sm border capitalize ${form.plan === p ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200'}`}>{p}</button>)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500">Cor</label>
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded cursor-pointer" />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 space-y-1">
                  <p><strong>{form.name}</strong> ({form.slug})</p>
                  <p>Admin: {form.adminName} — {form.adminEmail}</p>
                  <p>Plano: {form.plan} | Indústria: {form.industry}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 py-2.5 rounded-lg text-sm">← Voltar</button>
                  <button onClick={handleCreate} disabled={loading} className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">{loading ? 'A criar…' : 'Criar Empresa'}</button>
                </div>
              </div>
            )}
            {step === 4 && result && (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="font-semibold text-green-800">Empresa criada com sucesso!</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <p><strong>Email:</strong> {result.email}</p>
                  <p><strong>Password temp.:</strong> <code className="bg-white px-1 rounded">{result.password}</code></p>
                  <p><strong>Booking:</strong> /book/{result.slug ?? form.slug}</p>
                </div>
                <button onClick={() => { setWizard(false); setStep(1) }} className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium">Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
