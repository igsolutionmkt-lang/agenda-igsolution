import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  return supabase.auth.getSession()
}

// ─── Company ─────────────────────────────────────────────────────────────────

export async function getMyCompanyId(): Promise<string | null> {
  const { data } = await supabase.rpc('agenda_get_my_company_id')
  return data ?? null
}

export async function getCompany(companyId: string) {
  return supabase.from('agenda_companies').select('*').eq('id', companyId).single()
}

export async function updateCompany(companyId: string, updates: Record<string, unknown>) {
  return supabase.from('agenda_companies').update(updates).eq('id', companyId)
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardStats(companyId: string) {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [todayApts, monthApts, clients, revenue] = await Promise.all([
    supabase.from('agenda_appointments').select('id', { count: 'exact' })
      .eq('company_id', companyId).eq('date', today),
    supabase.from('agenda_appointments').select('id', { count: 'exact' })
      .eq('company_id', companyId).gte('date', monthStart),
    supabase.from('agenda_clients').select('id', { count: 'exact' }).eq('company_id', companyId),
    supabase.from('agenda_appointments').select('price').eq('company_id', companyId)
      .eq('status', 'completed').gte('date', monthStart),
  ])

  const totalRevenue = (revenue.data ?? []).reduce((s: number, r: { price: number }) => s + (r.price ?? 0), 0)

  return {
    todayAppointments: todayApts.count ?? 0,
    monthAppointments: monthApts.count ?? 0,
    totalClients: clients.count ?? 0,
    monthRevenue: totalRevenue,
  }
}

export async function getRevenueByMonth(companyId: string) {
  const { data } = await supabase.from('agenda_appointments')
    .select('date, price')
    .eq('company_id', companyId)
    .eq('status', 'completed')
    .gte('date', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  return data ?? []
}

// ─── Appointments ────────────────────────────────────────────────────────────

export async function getAppointments(companyId: string, from?: string, to?: string) {
  let q = supabase.from('agenda_appointments')
    .select('*, agenda_clients(name,phone), agenda_services(name,duration,price), agenda_employees(name)')
    .eq('company_id', companyId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
  if (from) q = q.gte('date', from)
  if (to) q = q.lte('date', to)
  return q
}

export async function createAppointment(data: Record<string, unknown>) {
  return supabase.from('agenda_appointments').insert(data).select().single()
}

export async function updateAppointment(id: string, updates: Record<string, unknown>) {
  return supabase.from('agenda_appointments').update(updates).eq('id', id)
}

export async function deleteAppointment(id: string) {
  return supabase.from('agenda_appointments').delete().eq('id', id)
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function getClients(companyId: string) {
  return supabase.from('agenda_clients').select('*').eq('company_id', companyId).order('name')
}

export async function upsertClient(data: Record<string, unknown>) {
  return supabase.from('agenda_clients').upsert(data).select().single()
}

export async function deleteClient(id: string) {
  return supabase.from('agenda_clients').delete().eq('id', id)
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function getServices(companyId: string) {
  return supabase.from('agenda_services').select('*').eq('company_id', companyId).order('name')
}

export async function upsertService(data: Record<string, unknown>) {
  return supabase.from('agenda_services').upsert(data).select().single()
}

export async function deleteService(id: string) {
  return supabase.from('agenda_services').delete().eq('id', id)
}

// ─── Employees ───────────────────────────────────────────────────────────────

export async function getEmployees(companyId: string) {
  return supabase.from('agenda_employees').select('*').eq('company_id', companyId).order('name')
}

export async function upsertEmployee(data: Record<string, unknown>) {
  return supabase.from('agenda_employees').upsert(data).select().single()
}

export async function deleteEmployee(id: string) {
  return supabase.from('agenda_employees').delete().eq('id', id)
}

// ─── Automations ─────────────────────────────────────────────────────────────

export async function getAutomations(companyId: string) {
  return supabase.from('agenda_automations').select('*').eq('company_id', companyId)
}

export async function toggleAutomation(id: string, isActive: boolean) {
  return supabase.from('agenda_automations').update({ is_active: isActive }).eq('id', id)
}

// ─── Loyalty ─────────────────────────────────────────────────────────────────

export async function getLoyaltyRewards(companyId: string) {
  return supabase.from('agenda_loyalty_rewards').select('*').eq('company_id', companyId)
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getAdminOverview() {
  return supabase.from('agenda_admin_overview').select('*').order('appointments_total', { ascending: false })
}

export async function getAdminCompanies() {
  return supabase.from('agenda_companies').select('*').order('created_at', { ascending: false })
}

export async function getAdminUsers() {
  return supabase.from('agenda_profiles').select('*').order('created_at', { ascending: false })
}

// ─── Growth ──────────────────────────────────────────────────────────────────

export async function getGrowthStats(companyId: string) {
  const now = new Date()
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data: all } = await supabase.from('agenda_clients').select('id,total_visits,last_visit,total_spent').eq('company_id', companyId)
  const clients = all ?? []

  const returning = clients.filter(c => (c.total_visits ?? 0) >= 2).length
  const active = clients.filter(c => c.last_visit && c.last_visit > d30).length
  const atRisk = clients.filter(c => c.last_visit && c.last_visit < d30 && c.last_visit > d90)
    .sort((a, b) => (b.total_spent ?? 0) - (a.total_spent ?? 0)).slice(0, 5)
  const lost = clients.filter(c => c.last_visit && c.last_visit < d90).length
  const newThisMonth = clients.filter(c => c.last_visit && c.last_visit > d30 && (c.total_visits ?? 0) === 1).length

  return { returnRate: clients.length ? Math.round((returning / clients.length) * 100) : 0, active, atRisk, lost, newThisMonth }
}

export async function sendWinbackEmail(clientName: string, clientEmail: string, companyName: string) {
  return supabase.functions.invoke('send-email', {
    body: {
      to: clientEmail,
      subject: `${companyName} sente a sua falta, ${clientName}!`,
      html: `<p>Olá ${clientName}, há algum tempo que não nos visita. Gostaríamos de vê-lo de volta!</p>`,
    },
  })
}

// ─── Public Booking ───────────────────────────────────────────────────────────

export async function getCompanyBySlug(slug: string) {
  return supabase.from('agenda_companies').select('*').eq('slug', slug).single()
}

export async function getPublicServices(companyId: string) {
  return supabase.from('agenda_services').select('*').eq('company_id', companyId).eq('is_active', true)
}

export async function getPublicEmployees(companyId: string) {
  return supabase.from('agenda_employees').select('*').eq('company_id', companyId).eq('is_active', true)
}

// ─── Stripe ──────────────────────────────────────────────────────────────────

export async function createStripeCheckout(priceId: string, companyId: string) {
  return supabase.functions.invoke('stripe-checkout', { body: { priceId, companyId } })
}

export async function createStripePortal(companyId: string) {
  return supabase.functions.invoke('stripe-portal', { body: { companyId } })
}

// ─── Admin create company ────────────────────────────────────────────────────

export async function createCompanyAdmin(payload: Record<string, unknown>) {
  return supabase.functions.invoke('admin-create-company', { body: payload })
}

// ─── Image upload ─────────────────────────────────────────────────────────────

export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('agenda-media').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('agenda-media').getPublicUrl(path)
  return data.publicUrl
}
