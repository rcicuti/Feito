import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { dataCurta, mensagemDeErro, statusDesafio, type Desafio, type ModoGrupo } from '../../lib/grupos'
import { CriarDesafioSheet } from './CriarDesafioSheet'
import { Confirmar } from './Confirmar'

interface Linha { user_id: string; nome: string; pontos: number; tarefas: number; eh_meu: boolean }
interface Meta { total_pontos: number; participantes: number; meta: number | null }

function DesafioCard({ d, modo, souDono, onApagar }: { d: Desafio; modo: ModoGrupo; souDono: boolean; onApagar: () => void }) {
  const { profile } = useAuth()
  const status = statusDesafio(d)
  const [linhas, setLinhas] = useState<Linha[] | null>(null)
  const [meta, setMeta] = useState<Meta | null>(null)

  useEffect(() => {
    if (status === 'em_breve') return
    if (modo === 'competitive') {
      void supabase.rpc('placar_do_desafio', { p_desafio: d.id }).then(({ data }) => setLinhas((data ?? []) as Linha[]))
    } else if (modo === 'cooperative') {
      void supabase.rpc('meta_do_desafio', { p_desafio: d.id }).then(({ data }) => setMeta(((data ?? []) as Meta[])[0] ?? null))
    }
  }, [d.id, modo, status])

  const rotulo = status === 'ativo' ? 'em andamento' : status === 'em_breve' ? 'começa em breve' : 'encerrado'
  const pct = meta?.meta ? Math.min(100, Math.round((meta.total_pontos / meta.meta) * 100)) : null

  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-lg font-extrabold">{d.title}</p>
          <p className="text-sm text-soft">{dataCurta(d.starts_on)} a {dataCurta(d.ends_on)} · {rotulo}</p>
        </div>
        {souDono && <button className="btn-ghost !min-h-[44px] !py-2 text-sm shrink-0" onClick={onApagar}>Apagar</button>}
      </div>
      {d.description && <p className="break-words text-soft">{d.description}</p>}

      {modo === 'feed_only' && <p className="text-sm text-soft">Sem placar: é só para fazer junto e se apoiar.</p>}

      {modo === 'competitive' && status !== 'em_breve' && (
        profile?.hide_rankings ? (
          <p className="rounded-2xl bg-bg p-3 text-sm text-soft">Você escolheu esconder rankings no seu perfil, então o placar não aparece para você (e você também não aparece nele).</p>
        ) : linhas && linhas.length > 0 ? (
          <ol className="flex flex-col gap-1.5">
            {linhas.map((l, i) => (
              <li key={l.user_id} className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${l.eh_meu ? 'bg-brand/10' : 'bg-bg'}`}>
                <span className="w-6 text-center font-extrabold text-soft">{i + 1}</span>
                <span className="min-w-0 flex-1 break-words font-semibold">{l.eh_meu ? 'Você' : l.nome}</span>
                <span className="font-bold">{l.pontos} pts</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-soft">Ninguém pontuou ainda. Compartilhe uma tarefa com o grupo para começar.</p>
        )
      )}

      {modo === 'cooperative' && status !== 'em_breve' && meta && (
        <div className="flex flex-col gap-2">
          <p className="font-bold">{meta.total_pontos}{meta.meta ? ` de ${meta.meta}` : ''} pontos juntos · {meta.participantes} {meta.participantes === 1 ? 'pessoa' : 'pessoas'}</p>
          {pct !== null && (
            <div className="h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progresso da meta do grupo">
              <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export function DesafiosGrupo({ grupoId, modo, souDono, meuId }: { grupoId: string; modo: ModoGrupo; souDono: boolean; meuId: string }) {
  const [lista, setLista] = useState<Desafio[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [apagando, setApagando] = useState<Desafio | null>(null)

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('challenges').select('*').eq('group_id', grupoId).order('starts_on', { ascending: false })
    if (error) setErro('Não consegui carregar os desafios.')
    else { setLista((data ?? []) as Desafio[]); setErro(null) }
    setCarregando(false)
  }, [grupoId])

  useEffect(() => { void carregar() }, [carregar])

  return (
    <section aria-label="Desafios" className="flex flex-col gap-3">
      {souDono && <button className="btn-primary" onClick={() => setCriando(true)}>➕ Novo desafio</button>}
      {erro && <p role="alert" className="rounded-2xl bg-card p-4 text-soft">{erro}</p>}
      {carregando ? (
        <p className="py-6 text-center text-soft">Carregando…</p>
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-soft">
          <span className="text-5xl" aria-hidden>🎯</span>
          <p className="text-lg font-semibold text-ink">Nenhum desafio ainda.</p>
          <p>{souDono ? 'Crie um desafio com começo e fim, como “Semana da casa em ordem”.' : 'Quem criou o grupo pode propor um desafio.'}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((d) => <DesafioCard key={d.id} d={d} modo={modo} souDono={souDono} onApagar={() => setApagando(d)} />)}
        </ul>
      )}
      {criando && (
        <CriarDesafioSheet
          modo={modo}
          onFechar={() => setCriando(false)}
          onCriar={async (d) => {
            const { error } = await supabase.from('challenges').insert({ group_id: grupoId, created_by: meuId, title: d.title, description: d.description || null, starts_on: d.starts_on, ends_on: d.ends_on, goal_points: d.goal_points })
            if (error) return mensagemDeErro(error, 'Não consegui criar o desafio agora.')
            setCriando(false)
            await carregar()
            return null
          }}
        />
      )}
      {apagando && (
        <Confirmar
          titulo="Apagar este desafio?"
          texto="O desafio e o placar dele somem. As tarefas compartilhadas continuam no feed."
          confirmar="Apagar"
          onConfirmar={async () => { await supabase.from('challenges').delete().eq('id', apagando.id); setApagando(null); await carregar() }}
          onCancelar={() => setApagando(null)}
        />
      )}
    </section>
  )
}
