import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'

// Mantém o tema igual em todos os aparelhos da pessoa:
// ao entrar, usa o tema salvo na conta; se mudar o tema, salva na conta.
export function SincronizarTema() {
  const { profile } = useAuth()
  const { tema, paleta, definirTema, escolherPaleta } = useTema()
  const usuario = useRef<string | null>(null)
  const salvo = useRef<{ tema: string; paleta: string } | null>(null)
  const aplicando = useRef<{ tema: string; paleta: string } | null>(null) // tema da conta ainda sendo aplicado na tela

  // 1) ao carregar o perfil: o que está na conta manda; se a conta ainda não tem, guarda o deste aparelho
  useEffect(() => {
    if (!profile || usuario.current === profile.id) return
    if (!('theme_mode' in profile)) return // SQL 0010 ainda não rodado: segue só com o aparelho
    usuario.current = profile.id
    if (profile.theme_mode && profile.theme_palette) {
      salvo.current = { tema: profile.theme_mode, paleta: profile.theme_palette }
      aplicando.current = salvo.current
      definirTema(profile.theme_mode)
      escolherPaleta(profile.theme_palette)
    } else {
      salvo.current = null
    }
  }, [profile, definirTema, escolherPaleta])

  // 2) quando a pessoa muda o tema: salva na conta
  useEffect(() => {
    if (!profile || usuario.current !== profile.id) return
    if (aplicando.current) {
      // espera a tela receber o tema da conta antes de começar a observar mudanças
      if (aplicando.current.tema !== tema || aplicando.current.paleta !== paleta) return
      aplicando.current = null
    }
    if (salvo.current?.tema === tema && salvo.current?.paleta === paleta) return
    salvo.current = { tema, paleta }
    // (a consulta só é enviada quando alguém "espera" o resultado, por isso o .then)
    supabase.from('profiles').update({ theme_mode: tema, theme_palette: paleta }).eq('id', profile.id).then(({ error }) => {
      if (error) salvo.current = null // não gravou: tenta de novo na próxima mudança
    })
  }, [tema, paleta, profile])

  return null
}
