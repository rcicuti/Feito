import { useState } from 'react'
import { horaCurta } from '../lib/dates'
import type { TarefaDoDia } from '../hooks/useTarefas'

interface Props {
  tarefa: TarefaDoDia
  onConcluir: () => void
  onPasso: (stepId: string) => void
  onEditar: () => void
  onAmanha: () => void
  onTirar: () => void
}

export function TarefaItem({ tarefa: t, onConcluir, onPasso, onEditar, onAmanha, onTirar }: Props) {
  const [menu, setMenu] = useState(false)
  const hora = horaCurta(t.scheduled_time)
  const passos = t.task_steps
  const feitos = passos.filter((p) => t.passosFeitos.has(p.id)).length

  return (
    <li className={`rounded-3xl border border-line bg-card p-4 transition ${t.feita ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onConcluir}
          disabled={t.feita}
          aria-label={t.feita ? `${t.title}, feita` : `Concluir ${t.title}`}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold transition active:scale-95 ${
            t.feita ? 'border-brand bg-brand text-brand-ink' : 'border-brand/60 text-transparent hover:text-brand/40'
          }`}
        >
          ✓
        </button>
        <div className="min-w-0 flex-1">
          <p className={`break-words text-lg font-bold leading-snug ${t.feita ? 'line-through decoration-soft/50' : ''}`}>{t.title}</p>
          <p className="flex flex-wrap gap-x-2 text-sm text-soft">
            {t.is_hard && <span>💪 difícil</span>}
            {hora && <span>🕐 {hora}</span>}
            {t.repeat_type === 'daily' && <span>🔁 todo dia</span>}
            {t.repeat_type === 'weekly' && <span>🔁 semanal</span>}
            {passos.length > 0 && <span>{feitos}/{passos.length} passos</span>}
          </p>
        </div>
        {!t.feita && (
          <button type="button" className="h-11 w-11 shrink-0 rounded-full text-xl text-soft" aria-label={`Mais opções para ${t.title}`} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            ⋯
          </button>
        )}
      </div>

      {!t.feita && passos.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 pl-1">
          {passos.map((p) => {
            const ok = t.passosFeitos.has(p.id)
            return (
              <li key={p.id}>
                <button type="button" onClick={() => onPasso(p.id)} aria-pressed={ok} className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-2 text-left">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm ${ok ? 'border-brand bg-brand text-brand-ink' : 'border-line'}`} aria-hidden>{ok ? '✓' : ''}</span>
                  <span className={ok ? 'text-soft line-through' : ''}>{p.title}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {menu && !t.feita && (
        <div className="mt-3 flex flex-wrap gap-2 animate-fade">
          <button type="button" className="btn-outline !min-h-[44px] !py-2 text-sm" onClick={() => { setMenu(false); onEditar() }}>Editar</button>
          <button type="button" className="btn-outline !min-h-[44px] !py-2 text-sm" onClick={() => { setMenu(false); onAmanha() }}>Deixar para amanhã</button>
          <button type="button" className="btn-ghost !min-h-[44px] !py-2 text-sm" onClick={() => { setMenu(false); onTirar() }}>Tirar da lista</button>
        </div>
      )}
    </li>
  )
}
