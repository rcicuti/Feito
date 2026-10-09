import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { mensagemDeErro, type QuemFazendo } from '../lib/grupos'

interface Meu {
  task_id: string | null
  task_title: string
  group_ids: string[]
  expires_at: string
}

export type EstadoAgora = ReturnType<typeof useComecandoAgora>

// "Estou começando agora": o que EU avisei e quem mais está fazendo tarefas neste momento.
export function useComecandoAgora(userId: string, temGrupos: boolean) {
  const [meu, setMeu] = useState<Meu | null>(null)
  const [outros, setOutros] = useState<QuemFazendo[]>([])

  const recarregar = useCallback(async () => {
    if (!temGrupos) {
      setMeu(null)
      setOutros([])
      return
    }
    const [m, q] = await Promise.all([
      supabase.from('starting_now').select('task_id, task_title, group_ids, expires_at').eq('user_id', userId).gt('expires_at', new Date().toISOString()).maybeSingle(),
      supabase.rpc('quem_esta_fazendo'),
    ])
    setMeu((m.data as Meu | null) ?? null)
    setOutros(((q.data ?? []) as QuemFazendo[]).filter((x) => !x.eh_eu))
  }, [temGrupos, userId])

  // Atualiza ao abrir e a cada 20 segundos enquanto a tela está visível
  useEffect(() => {
    void recarregar()
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') void recarregar()
    }, 20000)
    return () => clearInterval(t)
  }, [recarregar])

  async function comecar(taskId: string, grupos: string[]): Promise<string | null> {
    const { error } = await supabase.rpc('comecando_agora', { p_task: taskId, p_grupos: grupos })
    if (error) return mensagemDeErro(error, 'Não consegui avisar agora.')
    await recarregar()
    return null
  }

  async function parar(): Promise<void> {
    await supabase.from('starting_now').delete().eq('user_id', userId)
    setMeu(null)
  }

  // Ao concluir a tarefa que eu tinha avisado, o aviso sai sozinho
  async function pararSeForEssaTarefa(taskId: string): Promise<void> {
    if (meu?.task_id === taskId) await parar()
  }

  return { meu, outros, recarregar, comecar, parar, pararSeForEssaTarefa }
}
