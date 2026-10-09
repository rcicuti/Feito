import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, BUCKET_PROVAS } from '../lib/supabase'
import { amanhaISO, hojeISO } from '../lib/dates'
import type { Conclusao, Repeticao, Tarefa, Visibilidade } from '../lib/types'

export interface NovaTarefa {
  title: string
  scheduled_time: string | null
  repeat_type: Repeticao
  repeat_days: number[]
  is_hard: boolean
  passos: string[]
}

export interface ResultadoConclusao {
  pontos: number
  conquistas: string[] // códigos desbloqueados agora
}

export interface DadosConclusao {
  foto: Blob | null
  legenda: string
  visibilidade: Visibilidade
}

export interface TarefaDoDia extends Tarefa {
  feita: boolean
  passosFeitos: Set<string>
}

function venceHoje(t: Tarefa, hoje: string): boolean {
  if (t.start_date > hoje) return false
  if (t.repeat_type === 'weekly') return t.repeat_days.includes(new Date(hoje + 'T00:00:00').getDay())
  return true // 'none' (acumula até ser feita, sem culpa) e 'daily'
}

export function useTarefas(userId: string) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [conclusoesHoje, setConclusoesHoje] = useState<Conclusao[]>([])
  const [avulsasFeitas, setAvulsasFeitas] = useState<Set<string>>(new Set())
  const [passosHoje, setPassosHoje] = useState<Set<string>>(new Set())
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const hoje = hojeISO()

  const carregar = useCallback(async () => {
    const dia = hojeISO()
    const { data: ts, error: e1 } = await supabase
      .from('tasks')
      .select('*, task_steps(*)')
      .is('archived_at', null)
      .lte('start_date', dia)
      .order('created_at', { ascending: true })
    if (e1) {
      setErro('Não consegui carregar suas tarefas agora.')
      setCarregando(false)
      return
    }
    const lista = ((ts ?? []) as Tarefa[]).map((t) => ({
      ...t,
      task_steps: [...(t.task_steps ?? [])].sort((a, b) => a.position - b.position),
    }))
    const avulsasIds = lista.filter((t) => t.repeat_type === 'none').map((t) => t.id)

    const [hojeRes, avulsasRes, passosRes] = await Promise.all([
      supabase.from('completions').select('*').eq('completed_on', dia),
      avulsasIds.length
        ? supabase.from('completions').select('task_id').in('task_id', avulsasIds)
        : Promise.resolve({ data: [] as { task_id: string }[] }),
      supabase.from('step_completions').select('step_id').eq('completed_on', dia),
    ])
    setTarefas(lista)
    setConclusoesHoje((hojeRes.data ?? []) as Conclusao[])
    setAvulsasFeitas(new Set((avulsasRes.data ?? []).map((c) => c.task_id)))
    setPassosHoje(new Set((passosRes.data ?? []).map((p) => p.step_id)))
    setErro(null)
    setCarregando(false)
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const doDia: TarefaDoDia[] = useMemo(() => {
    const feitasHoje = new Set(conclusoesHoje.map((c) => c.task_id))
    return tarefas
      .filter((t) => venceHoje(t, hoje))
      .map((t) => {
        const feita = feitasHoje.has(t.id)
        return { ...t, feita, passosFeitos: passosHoje }
      })
      // avulsa já concluída em outro dia não volta para a lista
      .filter((t) => t.feita || !(t.repeat_type === 'none' && avulsasFeitas.has(t.id)))
      .sort((a, b) => {
        if (a.feita !== b.feita) return a.feita ? 1 : -1
        return (a.scheduled_time ?? '99:99').localeCompare(b.scheduled_time ?? '99:99')
      })
  }, [tarefas, conclusoesHoje, avulsasFeitas, passosHoje, hoje])

  const total = doDia.length
  const feitas = doDia.filter((t) => t.feita).length

  async function criar(nova: NovaTarefa): Promise<boolean> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: nova.title,
        scheduled_time: nova.scheduled_time,
        repeat_type: nova.repeat_type,
        repeat_days: nova.repeat_type === 'weekly' ? nova.repeat_days : [],
        is_hard: nova.is_hard,
        start_date: hojeISO(),
      })
      .select('id')
      .single()
    if (error || !data) return false
    if (nova.passos.length) {
      const { error: e2 } = await supabase.from('task_steps').insert(
        nova.passos.map((title, i) => ({ task_id: data.id, user_id: userId, title, position: i })),
      )
      if (e2) return false
    }
    await carregar()
    return true
  }

  async function concluir(tarefaId: string, dados: DadosConclusao): Promise<ResultadoConclusao | null> {
    let photo_path: string | null = null
    if (dados.foto) {
      const caminho = `${userId}/${hojeISO()}-${tarefaId}-${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from(BUCKET_PROVAS)
        .upload(caminho, dados.foto, { contentType: 'image/jpeg', upsert: false })
      if (error) return null
      photo_path = caminho
    }
    const { data: nova, error } = await supabase.from('completions').insert({
      user_id: userId,
      task_id: tarefaId,
      completed_on: hojeISO(),
      photo_path,
      caption: dados.legenda.trim() || null,
      visibility: 'private', // nesta etapa só "só eu" funciona
    }).select('points, created_at').single()
    if (error || !nova) {
      if (photo_path) await supabase.storage.from(BUCKET_PROVAS).remove([photo_path])
      return null
    }
    // conquistas desbloqueadas por esta conclusão (mesma transação = mesmo instante)
    const { data: conq } = await supabase.from('user_achievements').select('code').gte('unlocked_at', nova.created_at)
    await carregar()
    return { pontos: nova.points as number, conquistas: (conq ?? []).map((c) => c.code as string) }
  }

  async function alternarPasso(stepId: string) {
    const dia = hojeISO()
    if (passosHoje.has(stepId)) {
      setPassosHoje((s) => { const n = new Set(s); n.delete(stepId); return n })
      await supabase.from('step_completions').delete().eq('step_id', stepId).eq('completed_on', dia)
    } else {
      setPassosHoje((s) => new Set(s).add(stepId))
      await supabase.from('step_completions').insert({ user_id: userId, step_id: stepId, completed_on: dia })
    }
  }

  async function remarcarParaAmanha(tarefaId: string) {
    await supabase.from('tasks').update({ start_date: amanhaISO() }).eq('id', tarefaId)
    await carregar()
  }

  async function tirarDaLista(tarefaId: string) {
    await supabase.from('tasks').update({ archived_at: new Date().toISOString() }).eq('id', tarefaId)
    await carregar()
  }

  return { doDia, total, feitas, carregando, erro, criar, concluir, alternarPasso, remarcarParaAmanha, tirarDaLista }
}
