import { idadeEmAnos, hojeISO } from './dates'
import type { Profile } from './types'

export type ModoGrupo = 'competitive' | 'cooperative' | 'feed_only'

export interface Grupo {
  id: string
  nome: string
  descricao: string | null
  modo: ModoGrupo
  papel: 'owner' | 'member'
  membros: number
}

export interface Desafio {
  id: string
  group_id: string
  title: string
  description: string | null
  starts_on: string
  ends_on: string
  goal_points: number | null
}

export interface ItemFeed {
  completion_id: string
  user_id: string
  nome: string
  titulo: string
  legenda: string | null
  foto: string | null
  pontos: number
  concluida_em: string
  compartilhada_em: string
  reacoes: Record<string, number>
  minhas_reacoes: string[]
  comentarios: number
  eh_meu: boolean
}

export interface Comentario {
  id: string
  user_id: string
  nome: string
  texto: string
  criado_em: string
  eh_meu: boolean
  posso_apagar: boolean
}

export interface Membro {
  user_id: string
  nome: string
  papel: 'owner' | 'member'
  entrou_em: string
  eh_eu: boolean
}

export interface QuemFazendo {
  user_id: string
  nome: string
  titulo: string
  desde: string
  eh_eu: boolean
}

export const MODOS: Record<ModoGrupo, { emoji: string; rotulo: string; descricao: string }> = {
  feed_only: { emoji: '💬', rotulo: 'Sem ranking', descricao: 'Só o feed: as pessoas compartilham, reagem e se apoiam. Sem placar.' },
  cooperative: { emoji: '🤝', rotulo: 'Cooperativo', descricao: 'Todo mundo soma para uma meta coletiva. Ninguém compete com ninguém.' },
  competitive: { emoji: '🏆', rotulo: 'Competitivo', descricao: 'Placar com pontos dos desafios. Quem preferir pode esconder rankings no perfil.' },
}

// As reações ficam guardadas como códigos no banco
export const REACOES = [
  { codigo: 'palmas', emoji: '👏', nome: 'Palmas' },
  { codigo: 'coracao', emoji: '❤️', nome: 'Coração' },
  { codigo: 'forca', emoji: '💪', nome: 'Força' },
  { codigo: 'festa', emoji: '🎉', nome: 'Festa' },
  { codigo: 'estrela', emoji: '🌟', nome: 'Estrela' },
]

export const ehMenor = (p: Profile | null): boolean => (p?.birth_date ? idadeEmAnos(p.birth_date) < 18 : true)

export const linkConvite = (codigo: string) => `${window.location.origin}/?convite=${codigo}`

export const formatarCodigo = (c: string) => (c.length === 10 ? `${c.slice(0, 5)}-${c.slice(5)}` : c)

export function statusDesafio(d: Desafio): 'em_breve' | 'ativo' | 'encerrado' {
  const hoje = hojeISO()
  if (hoje < d.starts_on) return 'em_breve'
  if (hoje > d.ends_on) return 'encerrado'
  return 'ativo'
}

export function dataCurta(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export function tempoRelativo(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const dias = Math.round(h / 24)
  return dias === 1 ? 'ontem' : `há ${dias} dias`
}

// Mostra a mensagem do banco quando ela é amigável; esconde mensagens técnicas.
export function mensagemDeErro(e: { message?: string } | null | undefined, padrao = 'Não consegui agora. Tente de novo.'): string {
  const m = e?.message ?? ''
  if (/could not find the function|schema cache/i.test(m)) return 'Falta rodar o SQL 0004 no Supabase (veja o README).'
  if (!m || /row-level|permission|violates|does not exist|function|relation|jwt|fetch|network/i.test(m)) return padrao
  return m
}
