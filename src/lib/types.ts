export type Visibilidade = 'private' | 'therapist' | 'group'
export type Repeticao = 'none' | 'daily' | 'weekly'

export interface Profile {
  id: string
  display_name: string | null
  birth_date: string | null
  onboarding_done: boolean
}

export interface Passo {
  id: string
  task_id: string
  title: string
  position: number
}

export interface Tarefa {
  id: string
  user_id: string
  title: string
  scheduled_time: string | null // "HH:MM:SS"
  repeat_type: Repeticao
  repeat_days: number[] // 0 = domingo ... 6 = sábado
  start_date: string // YYYY-MM-DD
  archived_at: string | null
  is_hard: boolean
  task_steps: Passo[]
}

export interface Conclusao {
  id: string
  task_id: string
  completed_on: string
  photo_path: string | null
  caption: string | null
  visibility: Visibilidade
}

export interface Resumo {
  total_points: number
  tarefas_concluidas: number
  dias_ativos: number
  sequencia_atual: number
  melhor_sequencia: number
  ultimo_dia_coberto: string | null
}
