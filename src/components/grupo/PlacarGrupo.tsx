import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { mensagemDeErro } from '../../lib/grupos'

interface Linha { user_id: string; nome: string; pontos: number; tarefas: number; eh_meu: boolean }
type Periodo = 'semana' | 'mes' | 'sempre'

const PERIODOS: { id: Periodo; rotulo: string }[] = [
  { id: 'semana', rotulo: 'Esta semana' },
  { id: 'mes', rotulo: 'Este mês' },
  { id: 'sempre', rotulo: 'Sempre' },
]

// Placar do grupo competitivo: pontos de cada pessoa, contando só o que foi compartilhado com este grupo
export function PlacarGrupo({ grupoId }: { grupoId: string }) {
  const { profile } = useAuth()
  const [periodo, setPeriodo] = useState<Periodo>('semana')
  const [linhas, setLinhas] = useState<Linha[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const escondendo = Boolean(profile?.hide_rankings)

  useEffect(() => {
    if (escondendo) return
    setLinhas(null)
    void supabase.rpc('placar_do_grupo', { p_group: grupoId, p_periodo: periodo }).then(({ data, error }) => {
      if (error) setErro(mensagemDeErro(error, 'Não consegui carregar o placar.'))
      else { setErro(null); setLinhas((data ?? []) as Linha[]) }
    })
  }, [grupoId, periodo, escondendo])

  if (escondendo) {
    return <p className="rounded-2xl bg-card p-4 text-soft">Você escolheu esconder rankings no seu perfil, então o placar não aparece para você (e você também não aparece nele). Dá para mudar em Perfil → Configurações.</p>
  }

  return (
    <section aria-label="Placar do grupo" className="flex flex-col gap-3">
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl bg-card p-1">
        {PERIODOS.map((p) => (
          <button key={p.id} role="tab" aria-selected={periodo === p.id} onClick={() => setPeriodo(p.id)}
            className={`min-h-[44px] rounded-xl text-sm font-bold ${periodo === p.id ? 'bg-brand text-brand-ink' : 'text-soft'}`}>{p.rotulo}</button>
        ))}
      </div>
      {erro && <p role="alert" className="rounded-2xl bg-card p-4 text-soft">{erro}</p>}
      {!erro && linhas === null && <p className="py-6 text-center text-soft">Carregando…</p>}
      {linhas && linhas.length > 0 && (
        <ol className="flex flex-col gap-2">
          {linhas.map((l, i) => (
            <li key={l.user_id} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${l.eh_meu ? 'border-brand bg-brand/10' : 'border-line bg-card'}`}>
              <span className="w-6 text-center text-lg font-extrabold text-soft">{l.pontos > 0 ? i + 1 : '–'}</span>
              <span className="min-w-0 flex-1">
                <span className="block break-words font-bold">{l.eh_meu ? 'Você' : l.nome}</span>
                <span className="block text-xs text-soft">{l.tarefas} {l.tarefas === 1 ? 'tarefa compartilhada' : 'tarefas compartilhadas'}</span>
              </span>
              <span className="text-lg font-extrabold">{l.pontos} <span className="text-sm font-semibold text-soft">pts</span></span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-soft">O placar conta só as tarefas que cada pessoa escolheu compartilhar com este grupo. Tarefas privadas não entram. Quem esconde rankings no perfil não aparece aqui.</p>
    </section>
  )
}
