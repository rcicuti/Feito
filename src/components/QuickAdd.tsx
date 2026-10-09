import { useState, type FormEvent } from 'react'
import { DIAS_CURTOS, DIAS_NOMES } from '../lib/dates'
import type { Repeticao } from '../lib/types'
import type { NovaTarefa } from '../hooks/useTarefas'

export function QuickAdd({ onCriar }: { onCriar: (t: NovaTarefa) => Promise<boolean> }) {
  const [titulo, setTitulo] = useState('')
  const [aberto, setAberto] = useState(false)
  const [hora, setHora] = useState('')
  const [repeticao, setRepeticao] = useState<Repeticao>('none')
  const [dias, setDias] = useState<number[]>([])
  const [passos, setPassos] = useState<string[]>([])
  const [novoPasso, setNovoPasso] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function adicionarPasso() {
    const p = novoPasso.trim()
    if (!p) return
    setPassos((l) => [...l, p])
    setNovoPasso('')
  }

  function limpar() {
    setTitulo(''); setHora(''); setRepeticao('none'); setDias([]); setPassos([]); setNovoPasso(''); setAberto(false); setErro(null)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const t = titulo.trim()
    if (!t) return
    if (repeticao === 'weekly' && dias.length === 0) {
      setErro('Escolha pelo menos um dia da semana.')
      return
    }
    const todosPassos = novoPasso.trim() ? [...passos, novoPasso.trim()] : passos
    setSalvando(true)
    const ok = await onCriar({
      title: t,
      scheduled_time: hora || null,
      repeat_type: repeticao,
      repeat_days: dias,
      passos: todosPassos,
    })
    setSalvando(false)
    if (ok) limpar()
    else setErro('Não consegui salvar agora. Tente de novo.')
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-3 shadow-sm">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="nova-tarefa">Nova tarefa</label>
        <input
          id="nova-tarefa"
          className="field flex-1 border-0 bg-transparent"
          placeholder="O que você vai fazer?"
          value={titulo}
          maxLength={200}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <button type="submit" disabled={!titulo.trim() || salvando} className="btn-primary !px-5 disabled:opacity-40" aria-label="Adicionar tarefa">
          +
        </button>
      </div>

      <button type="button" className="self-start px-2 text-sm font-semibold text-soft" aria-expanded={aberto} onClick={() => setAberto((a) => !a)}>
        {aberto ? 'Menos opções' : 'Horário, repetir, passos…'}
      </button>

      {aberto && (
        <div className="flex flex-col gap-4 px-1 pb-1 animate-fade">
          <label className="flex items-center gap-3">
            <span className="w-20 text-sm font-semibold">Horário</span>
            <input type="time" className="field !min-h-[44px] !py-2" value={hora} onChange={(e) => setHora(e.target.value)} />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Repetir</span>
            <div className="flex gap-2" role="radiogroup" aria-label="Repetição">
              {([['none', 'Não'], ['daily', 'Todo dia'], ['weekly', 'Dias da semana']] as const).map(([v, rotulo]) => (
                <button
                  key={v} type="button" role="radio" aria-checked={repeticao === v}
                  onClick={() => setRepeticao(v)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold min-h-[44px] ${repeticao === v ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-bg'}`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
            {repeticao === 'weekly' && (
              <div className="flex justify-between gap-1" role="group" aria-label="Dias da semana">
                {DIAS_CURTOS.map((d, i) => {
                  const ativo = dias.includes(i)
                  return (
                    <button
                      key={i} type="button" aria-pressed={ativo} aria-label={DIAS_NOMES[i]}
                      onClick={() => setDias((l) => (ativo ? l.filter((x) => x !== i) : [...l, i]))}
                      className={`h-11 w-11 rounded-full border text-sm font-bold ${ativo ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-bg'}`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Dividir em passos pequenos</span>
            {passos.length > 0 && (
              <ol className="flex flex-col gap-1.5">
                {passos.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-xl bg-bg px-3 py-2 text-sm">
                    <span>{i + 1}. {p}</span>
                    <button type="button" className="px-2 text-soft" aria-label={`Remover passo ${p}`} onClick={() => setPassos((l) => l.filter((_, j) => j !== i))}>✕</button>
                  </li>
                ))}
              </ol>
            )}
            <div className="flex gap-2">
              <input
                className="field !min-h-[44px] !py-2 flex-1" placeholder="Ex.: separar a roupa"
                value={novoPasso} maxLength={200}
                onChange={(e) => setNovoPasso(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarPasso() } }}
              />
              <button type="button" className="btn-outline !min-h-[44px] !py-2" onClick={adicionarPasso}>Passo</button>
            </div>
          </div>
        </div>
      )}
      {erro && <p role="alert" className="px-2 text-sm text-soft">{erro}</p>}
    </form>
  )
}
