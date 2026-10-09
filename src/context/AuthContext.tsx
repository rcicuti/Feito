import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthState {
  carregando: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  recuperandoSenha: boolean
  finalizarRecuperacao: () => void
  recarregarPerfil: () => Promise<void>
  sair: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recuperandoSenha, setRecuperandoSenha] = useState(false)

  const buscarPerfil = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, birth_date, onboarding_done')
      .eq('id', userId)
      .maybeSingle()
    setProfile((data as Profile | null) ?? null)
  }, [])

  useEffect(() => {
    if (!supabaseConfigurado) {
      setCarregando(false)
      return
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await buscarPerfil(data.session.user.id)
      setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((evento, nova) => {
      // quem chega pelo link do e-mail "esqueci minha senha" precisa criar uma nova senha
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true)
      setSession(nova)
      if (nova) void buscarPerfil(nova.user.id)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [buscarPerfil])

  const value: AuthState = {
    carregando,
    session,
    user: session?.user ?? null,
    profile,
    recuperandoSenha,
    finalizarRecuperacao: () => setRecuperandoSenha(false),
    recarregarPerfil: async () => {
      if (session) await buscarPerfil(session.user.id)
    },
    sair: async () => {
      await supabase.auth.signOut()
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return c
}
