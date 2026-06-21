import { useEffect, useState } from 'react'
import { getAdminUsers } from '../../lib/supabase'

interface Profile { id: string; full_name?: string; email?: string; role?: string; company_id?: string; created_at: string }

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([])
  useEffect(() => { getAdminUsers().then(({ data }) => setUsers(data ?? [])) }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Utilizadores</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Nome', 'Email', 'Papel', 'Criado em'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{u.email ?? '—'}</td>
                <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{u.role ?? 'owner'}</span></td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString('pt')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center text-gray-400 py-12">Sem utilizadores</p>}
      </div>
    </div>
  )
}
