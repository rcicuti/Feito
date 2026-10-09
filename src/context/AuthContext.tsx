import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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
  const usuarioAtual = useRef<string | null>(null)

  const buscarPerfil = useCallback(async (userId: string) => {
    let { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, birth_date, onboarding_done, hide_rankings')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      // o SQL 0004 ainda não foi rodado (coluna hide_rankings não existe): abre o app mesmo assim
      const r = await supabase.from('profiles').select('id, display_name, birth_date, onboarding_done').eq('id', userId).maybeSingle()
      data = r.data ? { ...r.data, hide_rankings: false } : null
    }
    // se a busca falhar por um instante, mantém o perfil que já temos (evita a tela piscar)
    if (data) setProfile(data as Profile)
  }, [])

  useEffect(() => {
    if (!supabaseConfigurado) {
      setCarregando(false)
      return
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) {
        usuarioAtual.current = data.session.user.id
        await buscarPerfil(data.session.user.id)
      }
      setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((evento, nova) => {
      // quem chega pelo link do e-mail "esqueci minha senha" precisa criar uma nova senha
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true)
      setSession(nova)
      if (!nova) {
        usuarioAtual.current = null
        setProfile(null)
      } else if (usuarioAtual.current !== nova.user.id) {
        // só busca o perfil quando é outra pessoa (voltar para a aba também dispara este evento)
        usuarioAtual.current = nova.user.id
        setProfile(null)
        void buscarPerfil(nova.user.id)
      }
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
