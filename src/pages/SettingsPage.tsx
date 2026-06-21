import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getCompany, updateCompany } from '../lib/supabase'

interface Company { id: string; name: string; slug: string; phone?: string; email?: string; address?: string; brand_color?: string; logo_url?: string; plan?: string }

export default function SettingsPage() {
  const { companyId } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { if (companyId) getCompany(companyId).then(({ data }) => setCompany(data)) }, [companyId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!company || !companyId) return
    setSaving(true)
    await updateCompany(companyId, { name: company.name, phone: company.phone, email: company.email, address: company.address, brand_color: company.brand_color })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!company) return <div className="p-6 text-gray-400">A carregar…</div>

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Definições</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-800">Informações da Empresa</h2>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nome da empresa</label>
            <input value={company.name} onChange={e => setCompany(c => c ? { ...c, name: e.target.value } : c)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Slug (URL booking)</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-2 rounded-l-lg border border-r-0 border-gray-200">/book/</span>
              <input value={company.slug} readOnly className="flex-1 border border-gray-200 rounded-r-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Telefone</label>
              <input value={company.phone ?? ''} onChange={e => setCompany(c => c ? { ...c, phone: e.target.value } : c)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input type="email" value={company.email ?? ''} onChange={e => setCompany(c => c ? { ...c, email: e.target.value } : c)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Morada</label>
            <input value={company.address ?? ''} onChange={e => setCompany(c => c ? { ...c, address: e.target.value } : c)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-800">Aparência</h2>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500">Cor da marca</label>
            <input type="color" value={company.brand_color ?? '#7c3aed'} onChange={e => setCompany(c => c ? { ...c, brand_color: e.target.value } : c)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
            <span className="text-sm text-gray-600">{company.brand_color ?? '#7c3aed'}</span>
          </div>
          {company.logo_url && <img src={company.logo_url} alt="Logo" className="h-12 object-contain" />}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-2">Plano atual</h2>
          <span className="text-sm bg-violet-100 text-violet-700 px-3 py-1 rounded-full capitalize">{company.plan ?? 'starter'}</span>
        </div>

        <button type="submit" disabled={saving} className="bg-violet-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
          {saving ? 'A guardar…' : saved ? '✓ Guardado!' : 'Guardar alterações'}
        </button>
      </form>
    </div>
  )
}
