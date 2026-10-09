import { useAuth } from './context/AuthContext'
import { supabaseConfigurado } from './lib/supabase'
import ConfigurarSupabase from './pages/ConfigurarSupabase'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Hoje from './pages/Hoje'
import NovaSenha from './pages/NovaSenha'

export default function App() {
  const { carregando, user, profile, recuperandoSenha } = useAuth()

  if (!supabaseConfigurado) return <ConfigurarSupabase />
  if (carregando) {
    return <div className="flex h-full items-center justify-center text-soft">Preparando seu espaço…</div>
  }
  if (recuperandoSenha) return <NovaSenha />
  if (!user) return <Login />
  if (profile && !profile.onboarding_done) return <Onboarding />
  if (!profile) return <div className="flex h-full items-center justify-center text-soft">Preparando seu espaço…</div>
  return <Hoje />
}
