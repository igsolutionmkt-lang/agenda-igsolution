import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, LogOut, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Visão Geral' },
  { to: '/admin/companies', icon: Building2, label: 'Empresas' },
  { to: '/admin/users', icon: Users, label: 'Utilizadores' },
]

export default function AdminSidebar() {
  const navigate = useNavigate()
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen shrink-0">
      <div className="p-5 border-b border-gray-700">
        <h1 className="text-lg font-bold">IGSolution Admin</h1>
        <p className="text-xs text-gray-400 mt-0.5">Painel de controlo</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
            <Icon size={16} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-700 space-y-1">
        <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
          <ArrowLeft size={16} /> Área empresa
        </button>
        <button onClick={() => { supabase.auth.signOut(); navigate('/login') }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
          <LogOut size={16} /> Sair
        </button>
      </div>
    </aside>
  )
}
