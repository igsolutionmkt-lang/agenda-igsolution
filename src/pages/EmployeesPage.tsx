import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getEmployees, upsertEmployee, deleteEmployee } from '../lib/supabase'
import { Plus, Trash2, Edit2, X } from 'lucide-react'
import ImageUpload from '../components/ui/image-upload'
import { WEEKDAYS, DEFAULT_WORKING_HOURS, type WorkingHours } from '../lib/slots'

interface Employee { id?: string; name: string; email?: string; phone?: string; role?: string; is_active: boolean; avatar_url?: string; working_hours?: WorkingHours }

export default function EmployeesPage() {
  const { companyId } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Employee>({ name: '', role: '', is_active: true })

  useEffect(() => { if (companyId) getEmployees(companyId).then(({ data }) => setEmployees(data ?? [])) }, [companyId])

  function openCreate() { setForm({ name: '', role: '', is_active: true, working_hours: DEFAULT_WORKING_HOURS }); setModal(true) }
  function openEdit(e: Employee) { setForm({ ...e, working_hours: e.working_hours ?? DEFAULT_WORKING_HOURS }); setModal(true) }

  function setDay(day: string, patch: Partial<{ active: boolean; start: string; end: string }>) {
    setForm(f => {
      const wh: WorkingHours = { ...(f.working_hours ?? DEFAULT_WORKING_HOURS) }
      wh[day] = { ...(wh[day] ?? { active: false }), ...patch }
      return { ...f, working_hours: wh }
    })
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault()
    const { data } = await upsertEmployee({ ...form, company_id: companyId })
    if (data) setEmployees(prev => form.id ? prev.map(e => e.id === form.id ? data : e) : [data, ...prev])
    setModal(false)
  }

  async function handleDelete(id: string) {
    await deleteEmployee(id)
    setEmployees(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipa</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-700">
          <Plus size={16} /> Novo Membro
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(e => (
          <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              {e.avatar_url
                ? <img src={e.avatar_url} alt={e.name} className="w-12 h-12 rounded-full object-cover" />
                : <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg">{e.name[0]}</div>
              }
              <div>
                <p className="font-semibold text-gray-900">{e.name}</p>
                {e.role && <p className="text-xs text-gray-500">{e.role}</p>}
              </div>
            </div>
            {e.email && <p className="text-xs text-gray-500 mb-1">✉ {e.email}</p>}
            {e.phone && <p className="text-xs text-gray-500 mb-3">📞 {e.phone}</p>}
            <div className="flex gap-2 pt-3 border-t border-gray-50">
              <button onClick={() => openEdit(e)} className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1"><Edit2 size={12} /> Editar</button>
              <button onClick={() => e.id && handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {employees.length === 0 && <p className="col-span-3 text-center text-gray-400 py-12">Nenhum membro na equipa</p>}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">{form.id ? 'Editar Membro' : 'Novo Membro'}</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <ImageUpload label="Foto" value={form.avatar_url} folder="avatars" shape="circle" onChange={url => setForm(f => ({ ...f, avatar_url: url }))} />
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Cargo / especialidade" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Telefone" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                Ativo
              </label>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Horário de trabalho</p>
                <div className="space-y-1.5">
                  {WEEKDAYS.map((dayName, i) => {
                    const wh = form.working_hours ?? DEFAULT_WORKING_HOURS
                    const d = wh[String(i)] ?? { active: false }
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
                        ) : (
                          <span className="text-xs text-gray-300 flex-1">Folga</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <button type="submit" className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
