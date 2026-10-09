// Regras de pontos, níveis, conquistas e mensagens de reforço.
// Os PONTOS em si são calculados pelo banco (supabase/migrations/0002). Aqui ficam só
// os textos e a leitura do nível.

export const PONTOS = { foto: 10, semFoto: 7, dificil: 5, constanciaMax: 7 }

// ---------- Níveis ----------
// Pontos para começar o nível n: 15·n·(n−1) → 2: 30, 3: 90, 4: 180, 5: 300, 6: 450…
// Os primeiros níveis chegam rápido (reforço frequente) e depois espaçam.
const limiarNivel = (n: number) => 15 * n * (n - 1)
const NOMES_NIVEL = ['Semente', 'Broto', 'Muda', 'Folhas', 'Botão', 'Flor', 'Árvore', 'Floresta']

export interface InfoNivel {
  nivel: number
  nome: string
  faltam: number
  proporcao: number // 0 a 1 dentro do nível atual
}

export function infoNivel(pontos: number): InfoNivel {
  let n = 1
  while (pontos >= limiarNivel(n + 1)) n++
  const ini = limiarNivel(n)
  const fim = limiarNivel(n + 1)
  return {
    nivel: n,
    nome: NOMES_NIVEL[Math.min(n - 1, NOMES_NIVEL.length - 1)],
    faltam: fim - pontos,
    proporcao: (pontos - ini) / (fim - ini),
  }
}

// ---------- Conquistas ----------
export interface Conquista {
  codigo: string
  emoji: string
  titulo: string
  descricao: string
}

export const CONQUISTAS: Conquista[] = [
  { codigo: 'first_task', emoji: '🌱', titulo: 'Primeiro passo', descricao: 'Concluiu a primeira tarefa.' },
  { codigo: 'first_photo', emoji: '📸', titulo: 'Prova feita', descricao: 'Registrou uma tarefa com foto.' },
  { codigo: 'first_hard', emoji: '💪', titulo: 'Enfrentou uma difícil', descricao: 'Concluiu uma tarefa que era difícil para você.' },
  { codigo: 'comeback', emoji: '🔄', titulo: 'Recomeço', descricao: 'Voltou depois de uns dias e fez uma tarefa.' },
  { codigo: 'tasks_10', emoji: '🔟', titulo: '10 tarefas', descricao: 'Concluiu 10 tarefas.' },
  { codigo: 'tasks_50', emoji: '🌿', titulo: '50 tarefas', descricao: 'Concluiu 50 tarefas.' },
  { codigo: 'tasks_100', emoji: '🌳', titulo: '100 tarefas', descricao: 'Concluiu 100 tarefas.' },
  { codigo: 'days_3', emoji: '☀️', titulo: '3 dias ativos', descricao: 'Esteve presente em 3 dias (não precisam ser seguidos).' },
  { codigo: 'days_7', emoji: '🌤️', titulo: '7 dias ativos', descricao: 'Esteve presente em 7 dias.' },
  { codigo: 'days_30', emoji: '🌞', titulo: '30 dias ativos', descricao: 'Esteve presente em 30 dias.' },
  { codigo: 'streak_3', emoji: '✨', titulo: 'Sequência de 3', descricao: '3 dias ativos em sequência (descanso mantém a sequência).' },
  { codigo: 'streak_7', emoji: '🌟', titulo: 'Sequência de 7', descricao: '7 dias ativos em sequência.' },
  { codigo: 'streak_14', emoji: '💫', titulo: 'Sequência de 14', descricao: '14 dias ativos em sequência.' },
]

export const conquistaPorCodigo = (codigo: string) => CONQUISTAS.find((c) => c.codigo === codigo)

// ---------- Mensagem de reforço específica ----------
// Transforma "Lavar a louça" em "lavou a louça". Só conjuga quando tem certeza; senão usa "concluiu".
const IRREGULARES: Record<string, string> = {
  fazer: 'fez', ir: 'foi', ver: 'viu', ler: 'leu', dar: 'deu', ter: 'teve', pôr: 'pôs',
  trazer: 'trouxe', dizer: 'disse', sair: 'saiu', pedir: 'pediu', vir: 'veio',
}
const VERBOS_ER_IR = new Set([
  'correr', 'varrer', 'responder', 'escrever', 'resolver', 'receber', 'beber', 'comer', 'vender',
  'aprender', 'entender', 'abrir', 'assistir', 'partir', 'decidir', 'cumprir', 'dividir',
  'sentir', 'construir', 'dormir', 'cozer', 'perder', 'escolher', 'oferecer', 'esquecer',
])
const SUBSTANTIVOS_AR = new Set(['lugar', 'azar', 'pilar', 'altar', 'avatar', 'militar', 'familiar', 'particular', 'regular', 'popular', 'vulgar', 'solar', 'polar', 'exemplar'])

function conjugar(verbo: string): string | null {
  const v = verbo.toLowerCase()
  if (IRREGULARES[v]) return IRREGULARES[v]
  if (VERBOS_ER_IR.has(v)) return v.slice(0, -2) + (v.endsWith('er') ? 'eu' : 'iu')
  if (v.length >= 5 && v.endsWith('ar') && !SUBSTANTIVOS_AR.has(v)) return v.slice(0, -2) + 'ou'
  return null
}

function fraseFeita(titulo: string): string {
  const limpo = titulo.trim()
  const [primeira, ...resto] = limpo.split(/\s+/)
  const passado = conjugar(primeira.replace(/[^\p{L}]/gu, ''))
  if (passado) return `${passado}${resto.length ? ' ' + resto.join(' ') : ''}`
  return `concluiu “${limpo}”`
}

export interface ContextoReforco {
  titulo: string
  adiada: boolean // tarefa avulsa que já estava na lista de dias anteriores
  dificil: boolean
  totalPassos: number
  primeiraDoDia: boolean
  retomada: boolean // voltou depois de uns dias
}

export function mensagemReforco(c: ContextoReforco): string {
  const feito = fraseFeita(c.titulo)
  const sujeito = 'Você '
  if (c.retomada) return `${sujeito}voltou e ${feito}. Cada recomeço também é um passo.`
  if (c.adiada) return `${sujeito}${feito}, uma tarefa que estava adiada. Isso tira um peso.`
  if (c.dificil) return `${sujeito}${feito}, e era uma tarefa difícil para você. Que esforço!`
  if (c.totalPassos > 0) return `${sujeito}${feito}, passo a passo. Dividir em partes pequenas funcionou.`
  if (c.primeiraDoDia) return `Primeira do dia: ${sujeito.toLowerCase()}${feito}. Começar é a parte mais difícil.`
  return `${sujeito}${feito}. Um passo real, e foi seu.`
}

// ---------- Subida de nível ----------
export const EMOJI_NIVEL = ['🌱', '🌿', '🪴', '🍃', '🌷', '🌸', '🌳', '🌲']
export const emojiDoNivel = (nivel: number) => EMOJI_NIVEL[Math.min(nivel - 1, EMOJI_NIVEL.length - 1)]

const MENSAGENS_NIVEL: Record<number, string> = {
  2: 'Seu primeiro broto apareceu! Começar era a parte mais difícil, e você começou.',
  3: 'Você está criando raízes. A constância é feita desses passos pequenos.',
  4: 'Olha como você está crescendo! Cada tarefa feita alimenta esse caminho.',
  5: 'Algo bonito está se formando. Siga no seu ritmo, sem pressa.',
  6: 'Você floresceu! Tudo o que fez até aqui teve valor.',
  7: 'Raízes fortes, galhos firmes. Você construiu isso passo a passo.',
  8: 'Você já é uma floresta inteira. Orgulhe-se de cada passo da jornada.',
}

export function mensagemNivel(nivel: number): string {
  return MENSAGENS_NIVEL[nivel] ?? 'Mais um nível! Sua constância é admirável e vale a pena comemorar.'
}
