import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/CalendarPage'
import ClientsPage from './pages/ClientsPage'
import ServicesPage from './pages/ServicesPage'
import EmployeesPage from './pages/EmployeesPage'
import ReportsPage from './pages/ReportsPage'
import AIAssistant from './pages/AIAssistant'
import AutomationsPage from './pages/AutomationsPage'
import LoyaltyPage from './pages/LoyaltyPage'
import PaymentsPage from './pages/PaymentsPage'
import SettingsPage from './pages/SettingsPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCompanies from './pages/admin/AdminCompanies'
import AdminUsers from './pages/admin/AdminUsers'
import PublicBooking from './pages/PublicBooking'
import QueuePage from './pages/QueuePage'
import PublicQueue from './pages/PublicQueue'
import MembershipsPage from './pages/MembershipsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">A carregar…</div>
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">A carregar…</div>
  if (role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/book/:slug" element={<PublicBooking />} />
      <Route path="/queue/:slug" element={<PublicQueue />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<RequireAuth><RequireAdmin><AdminLayout /></RequireAdmin></RequireAuth>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/companies" element={<AdminCompanies />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/automations" element={<AutomationsPage />} />
        <Route path="/loyalty" element={<LoyaltyPage />} />
        <Route path="/memberships" element={<MembershipsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
