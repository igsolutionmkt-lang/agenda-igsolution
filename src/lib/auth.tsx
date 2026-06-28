import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthCtx {
  session: Session | null
  user: User | null
  role: string | null
  loading: boolean
  companyId: string | null
}

const Ctx = createContext<AuthCtx>({ session: null, user: null, role: null, loading: true, companyId: null })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    async function loadCompany() {
      const { data } = await supabase.rpc('agenda_get_my_company_id')
      setCompanyId(data ?? null)
      setLoading(false)
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadCompany()
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) loadCompany()
      else { setCompanyId(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const role = (session?.user?.app_metadata?.role as string) ?? null

  return <Ctx.Provider value={{ session, user: session?.user ?? null, role, loading, companyId }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
