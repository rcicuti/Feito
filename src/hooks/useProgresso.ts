import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { hojeISO, somarDias } from '../lib/dates'
import type { Resumo } from '../lib/types'

export type Progresso = ReturnType<typeof useProgresso>

export function useProgresso(userId: string) {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [desbloqueadas, setDesbloqueadas] = useState<Record<string, string>>({}) // código → data
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async (): Promise<Resumo | null> => {
    const [r, a] = await Promise.all([
      supabase.rpc('meu_resumo', { p_hoje: hojeISO() }),
      supabase.from('user_achievements').select('code, unlocked_at'),
    ])
    const novo = ((r.data ?? []) as Resumo[])[0] ?? null
    if (novo) setResumo(novo)
    if (a.data) setDesbloqueadas(Object.fromEntries(a.data.map((x) => [x.code, x.unlocked_at as string])))
    setCarregando(false)
    return novo
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  // Dias em branco entre a última atividade (ou descanso) e ontem
  const diasEmBranco: string[] = []
  if (resumo?.ultimo_dia_coberto) {
    const hoje = hojeISO()
    let d = somarDias(resumo.ultimo_dia_coberto, 1)
    while (d < hoje && diasEmBranco.length < 60) {
      diasEmBranco.push(d)
      d = somarDias(d, 1)
    }
  }

  async function marcarDescanso(): Promise<boolean> {
    if (diasEmBranco.length === 0 || diasEmBranco.length > 7) return false
    const { error } = await supabase
      .from('rest_days')
      .upsert(diasEmBranco.map((dia) => ({ user_id: userId, dia })), { onConflict: 'user_id,dia', ignoreDuplicates: true })
    if (error) return false
    await recarregar()
    return true
  }

  return { resumo, desbloqueadas, carregando, diasEmBranco, recarregar, marcarDescanso }
}
