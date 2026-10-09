export interface VinculoTerapeuta {
  link_id: string
  terapeuta_id: string
  nome: string
  crp: string | null
  status: 'pending' | 'active'
  share_tasks: boolean
  share_summary: boolean
  criado_em: string
}

export interface VinculoPaciente {
  link_id: string
  paciente_id: string
  nome: string
  status: 'pending' | 'active'
  share_tasks: boolean
  share_summary: boolean
  criado_em: string
}

export interface Sugestao {
  id: string
  titulo: string
  nota: string | null
  terapeuta: string
  criada_em: string
}

export interface ConclusaoCompartilhada {
  completion_id: string
  titulo: string
  legenda: string | null
  foto: string | null
  pontos?: number
  concluida_em: string
  compartilhada_em: string
  comentarios: number
}

export interface ComentarioTerapeuta {
  id: string
  nome: string
  texto: string
  criado_em: string
  eh_meu: boolean
  posso_apagar: boolean
}

export interface SemanaResumo {
  semana: string
  dias_ativos: number
  tarefas: number
}

export const formatarCodigoTerapia = (c: string) => (c.length === 10 ? `${c.slice(0, 5)}-${c.slice(5)}` : c)

export function mensagemTerapia(e: { message?: string } | null | undefined, padrao = 'Não consegui agora. Tente de novo.'): string {
  const m = e?.message ?? ''
  if (/could not find the function|schema cache/i.test(m)) return 'Falta rodar o SQL 0005 no Supabase (veja o README).'
  if (!m || /row-level|permission|violates|does not exist|function|relation|jwt|fetch|network/i.test(m)) return padrao
  return m
}
