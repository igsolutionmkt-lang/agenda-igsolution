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

// Envia email de confirmação (best-effort — não bloqueia o fluxo se falhar)
export async function sendConfirmation(appointmentId: string) {
  try {
    await supabase.functions.invoke('email-confirm', { body: { appointment_id: appointmentId } })
  } catch (e) {
    console.warn('email-confirm falhou (best-effort):', e)
  }
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

export async function upsertLoyaltyReward(data: Record<string, unknown>) {
  return supabase.from('agenda_loyalty_rewards').upsert(data).select().single()
}

export async function deleteLoyaltyReward(id: string) {
  return supabase.from('agenda_loyalty_rewards').delete().eq('id', id)
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

  const { data: all } = await supabase.from('agenda_clients').select('id,name,email,total_visits,last_visit,total_spent').eq('company_id', companyId)
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

// ─── AI Assistant ─────────────────────────────────────────────────────────────

export async function askAI(prompt: string, history: { role: string; content: string }[], context?: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('agenda-ai', { body: { prompt, history, context } })
  if (error) return 'Desculpe, ocorreu um erro ao contactar o assistente. Tente novamente.'
  return (data as { text?: string })?.text ?? 'Sem resposta.'
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

// Devolve os start_time já ocupados numa data (opcionalmente por funcionário)
export async function getBookedSlots(companyId: string, date: string, employeeId?: string) {
  let q = supabase.from('agenda_appointments')
    .select('start_time, end_time, employee_id')
    .eq('company_id', companyId)
    .eq('date', date)
    .neq('status', 'cancelled')
  if (employeeId) q = q.eq('employee_id', employeeId)
  const { data } = await q
  return data ?? []
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

// ─── Queue (Fila Virtual Walk-in) ────────────────────────────────────────────

export async function joinQueue(data: Record<string, unknown>) {
  // Evita duplicados só quando há telefone (.eq com null seria uma query inválida)
  if (data.phone) {
    const { data: existing } = await supabase.from('agenda_queue')
      .select('id, status, position')
      .eq('company_id', data.company_id as string)
      .eq('phone', data.phone as string)
      .in('status', ['waiting', 'called'])
      .maybeSingle()
    if (existing) return { data: existing, error: null }
  }
  return supabase.from('agenda_queue').insert(data).select().single()
}

export async function getQueue(companyId: string) {
  return supabase.from('agenda_queue')
    .select('*')
    .eq('company_id', companyId)
    .in('status', ['waiting', 'called'])
    .order('position', { ascending: true })
}

export async function callNext(companyId: string) {
  const { data: next } = await supabase.from('agenda_queue')
    .select('id')
    .eq('company_id', companyId)
    .eq('status', 'waiting')
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!next) return null
  await supabase.from('agenda_queue').update({ status: 'called', notified_at: new Date().toISOString() }).eq('id', next.id)
  return next
}

export async function finishQueue(id: string, status: 'done' | 'left' | 'converted') {
  return supabase.from('agenda_queue').update({ status, finished_at: new Date().toISOString() }).eq('id', id)
}

export async function getQueuePublic(companyId: string) {
  const { data } = await supabase.from('agenda_queue')
    .select('id, name, service_name, status, position, joined_at')
    .eq('company_id', companyId)
    .in('status', ['waiting', 'called'])
    .order('position', { ascending: true })
  return data ?? []
}

// ─── Memberships ──────────────────────────────────────────────────────────────

export async function getMembershipPlans(companyId: string) {
  return supabase.from('agenda_membership_plans')
    .select('*')
    .eq('company_id', companyId)
    .order('price', { ascending: true })
}

export async function upsertMembershipPlan(data: Record<string, unknown>) {
  return supabase.from('agenda_membership_plans').upsert(data).select().single()
}

export async function deleteMembershipPlan(id: string) {
  return supabase.from('agenda_membership_plans').delete().eq('id', id)
}

export async function getClientMemberships(companyId: string) {
  return supabase.from('agenda_client_memberships')
    .select('*, agenda_clients(name, email, phone), agenda_membership_plans(name, price, services_per_month)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
}
