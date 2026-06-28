import { NavLink, useNavigate } from 'react-router-dom'
import { Calendar, Users, Scissors, UserCheck, BarChart2, Bot, Zap, Gift, CreditCard, Settings, LogOut, LayoutDashboard, Building2, Crown, ListOrdered } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calendar', icon: Calendar, label: 'Calendário' },
  { to: '/queue', icon: ListOrdered, label: 'Fila Virtual' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/services', icon: Scissors, label: 'Serviços' },
  { to: '/employees', icon: UserCheck, label: 'Equipa' },
  { to: '/reports', icon: BarChart2, label: 'Relatórios' },
  { to: '/ai', icon: Bot, label: 'IA Assistente' },
  { to: '/automations', icon: Zap, label: 'Automações' },
  { to: '/loyalty', icon: Gift, label: 'Fidelização' },
  { to: '/memberships', icon: Crown, label: 'Memberships' },
  { to: '/payments', icon: CreditCard, label: 'Pagamentos' },
  { to: '/settings', icon: Settings, label: 'Definições' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { role } = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-violet-900 text-white flex flex-col min-h-screen shrink-0">
      <div className="p-5 border-b border-violet-700">
        <h1 className="text-lg font-bold">Agenda IGSolution</h1>
        <p className="text-xs text-violet-300 mt-0.5">A plataforma de crescimento</p>
      </div>

      {role === 'super_admin' && (
        <NavLink to="/admin" className="flex items-center gap-3 px-4 py-2 mt-2 text-sm bg-violet-700 mx-2 rounded-lg">
          <Building2 size={16} /> Painel Admin
        </NavLink>
      )}

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-violet-700 text-white' : 'text-violet-200 hover:bg-violet-800 hover:text-white'}`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 text-sm text-violet-300 hover:text-white hover:bg-violet-800 transition-colors border-t border-violet-700"
      >
        <LogOut size={16} /> Sair
      </button>
    </aside>
  )
}
