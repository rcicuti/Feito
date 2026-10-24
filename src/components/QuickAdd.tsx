import { useState, type FormEvent } from 'react'
import { DIAS_CURTOS, DIAS_NOMES, horaParaISO } from '../lib/dates'
import { CampoHorario } from './CampoHorario'
import type { Repeticao } from '../lib/types'
import type { NovaTarefa } from '../hooks/useTarefas'

const MIN_PASSOS_DIFICIL = 3

export function QuickAdd({ onCriar }: { onCriar: (t: NovaTarefa) => Promise<boolean> }) {
  const [titulo, setTitulo] = useState('')
  const [aberto, setAberto] = useState(false)
  const [hora, setHora] = useState('')
  const [repeticao, setRepeticao] = useState<Repeticao>('none')
  const [dias, setDias] = useState<number[]>([])
  const [dificil, setDificil] = useState(false)
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

  const passosContados = passos.length + (novoPasso.trim() ? 1 : 0)
  const podeDificil = passosContados >= MIN_PASSOS_DIFICIL
  const dificilAtivo = dificil && podeDificil
  const faltam = MIN_PASSOS_DIFICIL - passosContados

  function limpar() {
    setTitulo(''); setHora(''); setRepeticao('none'); setDias([]); setDificil(false); setPassos([]); setNovoPasso(''); setAberto(false); setErro(null)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const t = titulo.trim()
    if (!t) return
    const horaISO = horaParaISO(hora)
    if (horaISO === null) {
      setErro('Digite o horário assim: 08:30 (ou deixe em branco).')
      return
    }
    if (repeticao === 'weekly' && dias.length === 0) {
      setErro('Escolha pelo menos um dia da semana.')
      return
    }
    const todosPassos = novoPasso.trim() ? [...passos, novoPasso.trim()] : passos
    setSalvando(true)
    const ok = await onCriar({
      title: t,
      scheduled_time: horaISO || null,
      repeat_type: repeticao,
      repeat_days: dias,
      is_hard: dificilAtivo,
      passos: todosPassos,
    })
    setSalvando(false)
    if (ok) limpar()
    else setErro('Não consegui salvar agora. Tente de novo.')
  }

  if (!aberto) {
    return (
      <button
        type="button"
        className="btn-primary flex w-full items-center justify-center gap-2"
        aria-expanded={false}
        onClick={() => setAberto(true)}
      >
        <span aria-hidden className="text-xl leading-none">＋</span> Adicionar tarefa
      </button>
    )
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4 rounded-3xl border border-line bg-card p-4 shadow-sm animate-fade">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Nova tarefa</h2>
        <button type="button" className="h-11 w-11 shrink-0 text-xl text-soft" aria-label="Fechar sem salvar" onClick={limpar}>✕</button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">O que você vai fazer?</span>
        <input
          id="nova-tarefa"
          autoFocus
          className="field"
          placeholder="Ex.: arrumar a mochila"
          value={titulo}
          maxLength={200}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </label>

      <div className="flex flex-col gap-4">
          <label className="flex items-start gap-3">
            <span className="w-20 pt-2.5 shrink-0 text-sm font-semibold">Horário</span>
            <CampoHorario className="!min-h-[44px] !py-2" valor={hora} onChange={setHora} />
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

          <div className="flex flex-col gap-1.5">
            <button
              type="button" role="switch" aria-checked={dificilAtivo} aria-disabled={!podeDificil}
              disabled={!podeDificil}
              onClick={() => setDificil((d) => !d)}
              className={`flex min-h-[48px] items-center justify-between gap-3 rounded-2xl border px-4 text-left disabled:opacity-50 ${dificilAtivo ? 'border-brand bg-brand/10' : 'border-line bg-bg'}`}
            >
              <span><span className="font-semibold">💪 Difícil pra mim</span><span className="block text-sm text-soft">Vale pontos extras ao concluir</span></span>
              <span className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${dificilAtivo ? 'bg-brand' : 'bg-line'}`} aria-hidden><span className={`block h-5 w-5 rounded-full bg-card transition ${dificilAtivo ? 'translate-x-5' : ''}`} /></span>
            </button>
            {!podeDificil && (
              <p className="px-2 text-sm text-soft">
                Para marcar como difícil, divida em {MIN_PASSOS_DIFICIL} passos ou mais. {faltam === 1 ? 'Falta 1 passo.' : `Faltam ${faltam} passos.`}
              </p>
            )}
          </div>

      </div>

      {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}

      <div className="flex gap-2">
        <button type="button" className="btn-outline" onClick={limpar}>Cancelar</button>
        <button type="submit" disabled={!titulo.trim() || salvando} className="btn-primary flex-1 disabled:opacity-40">
          {salvando ? 'Salvando…' : 'Adicionar tarefa'}
        </button>
      </div>
    </form>
  )
}
