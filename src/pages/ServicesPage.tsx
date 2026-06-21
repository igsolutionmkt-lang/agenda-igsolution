import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getServices, upsertService, deleteService } from '../lib/supabase'
import { Plus, Trash2, X, Clock } from 'lucide-react'
import ImageUpload from '../components/ui/image-upload'

interface Service { id?: string; name: string; description?: string; duration: number; price: number; is_active: boolean; image_url?: string }

export default function ServicesPage() {
  const { companyId } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Service>({ name: '', duration: 30, price: 0, is_active: true })

  useEffect(() => { if (companyId) getServices(companyId).then(({ data }) => setServices(data ?? [])) }, [companyId])

  function openCreate() { setForm({ name: '', duration: 30, price: 0, is_active: true }); setModal(true) }
  function openEdit(s: Service) { setForm(s); setModal(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const { data } = await upsertService({ ...form, company_id: companyId })
    if (data) setServices(prev => form.id ? prev.map(s => s.id === form.id ? data : s) : [data, ...prev])
    setModal(false)
  }

  async function handleDelete(id: string) {
    await deleteService(id)
    setServices(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-700">
          <Plus size={16} /> Novo Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {s.image_url && <img src={s.image_url} alt={s.name} className="w-full h-32 object-cover" />}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Clock size={13} /> {s.duration} min</span>
                <span className="font-medium text-violet-700">€{s.price}</span>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                <button onClick={() => openEdit(s)} className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Editar</button>
                <button onClick={() => s.id && handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {services.length === 0 && <p className="col-span-3 text-center text-gray-400 py-12">Nenhum serviço criado</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">{form.id ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <ImageUpload label="Foto do serviço" value={form.image_url} folder="services" shape="wide" onChange={url => setForm(f => ({ ...f, image_url: url }))} />
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do serviço *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Duração (min)</label>
                  <input type="number" required value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Preço (€)</label>
                  <input type="number" step="0.01" required value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                Serviço ativo
              </label>
              <button type="submit" className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
