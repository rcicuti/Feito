import { useState, type FormEvent } from 'react'
import type { TarefaDoDia } from '../hooks/useTarefas'

export interface DadosEdicao {
  title: string
  scheduled_time: string | null
  is_hard: boolean
}

interface Props {
  tarefa: TarefaDoDia
  onCancelar: () => void
  onSalvar: (d: DadosEdicao) => Promise<boolean>
}

export function EditarTarefaSheet({ tarefa, onCancelar, onSalvar }: Props) {
  const [titulo, setTitulo] = useState(tarefa.title)
  const [hora, setHora] = useState(tarefa.scheduled_time ? tarefa.scheduled_time.slice(0, 5) : '')
  const [dificil, setDificil] = useState(tarefa.is_hard)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const t = titulo.trim()
    if (!t) {
      setErro('A tarefa precisa de um nome.')
      return
    }
    setSalvando(true)
    setErro(null)
    const ok = await onSalvar({ title: t, scheduled_time: hora || null, is_hard: dificil })
    if (!ok) {
      setSalvando(false)
      setErro('Não consegui salvar agora. Tente de novo.')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40 animate-fade" onClick={onCancelar}>
      <form
        onSubmit={enviar}
        role="dialog" aria-modal="true" aria-label={`Editar ${tarefa.title}`}
        className="mx-auto flex max-h-[92%] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl bg-bg p-5 pb-8 animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-extrabold">Editar tarefa</h2>
          <button type="button" className="h-11 w-11 shrink-0 text-xl text-soft" aria-label="Fechar" onClick={onCancelar}>✕</button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Nome</span>
          <input className="field" value={titulo} maxLength={200} onChange={(e) => setTitulo(e.target.value)} />
        </label>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="editar-hora" className="text-sm font-semibold">Horário <span className="font-normal text-soft">(opcional)</span></label>
          <div className="flex gap-2">
            <input id="editar-hora" type="time" className="field flex-1" value={hora} onChange={(e) => setHora(e.target.value)} />
            {hora && <button type="button" className="btn-outline !min-h-[52px]" onClick={() => setHora('')}>Limpar</button>}
          </div>
        </div>

        <button
          type="button" role="switch" aria-checked={dificil} onClick={() => setDificil((d) => !d)}
          className={`flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border px-4 text-left ${dificil ? 'border-brand bg-brand/10' : 'border-line bg-card'}`}
        >
          <span><span className="font-semibold">💪 Difícil pra mim</span><span className="block text-sm text-soft">Vale pontos extras ao concluir</span></span>
          <span className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${dificil ? 'bg-brand' : 'bg-line'}`} aria-hidden>
            <span className={`block h-5 w-5 rounded-full bg-card transition ${dificil ? 'translate-x-5' : ''}`} />
          </span>
        </button>

        {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}

        <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
      </form>
    </div>
  )
}
