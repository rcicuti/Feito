import { horaCurta } from '../lib/dates'
import type { TarefaMaisTarde } from '../hooks/useTarefas'

interface Props {
  tarefa: TarefaMaisTarde
  onTrazer: () => void
  onEditar: () => void
  onTirar: () => void
}

// Tarefa que ainda não é para hoje: aparece só na visão "Todas"
export function TarefaMaisTardeItem({ tarefa: t, onTrazer, onEditar, onTirar }: Props) {
  const hora = horaCurta(t.scheduled_time)
  const passos = t.task_steps.length
  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-4">
      <div className="min-w-0">
        <p className="break-words text-lg font-bold leading-snug">{t.title}</p>
        <p className="flex flex-wrap gap-x-2 text-sm text-soft">
          <span>📅 {t.quando}</span>
          {hora && <span>às {hora}</span>}
          {t.repeat_type === 'daily' && <span>🔁 todo dia</span>}
          {t.repeat_type === 'weekly' && <span>🔁 semanal</span>}
          {passos > 0 && <span>{passos} {passos === 1 ? 'passo' : 'passos'}</span>}
          {t.is_hard && passos >= 3 && <span>💪 difícil</span>}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {t.repeat_type !== 'weekly' && (
          <button className="btn-outline !min-h-[44px] !py-2 text-sm" onClick={onTrazer}>Fazer hoje</button>
        )}
        <button className="btn-ghost !min-h-[44px] !py-2 text-sm" onClick={onEditar}>Editar</button>
        <button className="btn-ghost !min-h-[44px] !py-2 text-sm" onClick={onTirar}>Tirar da lista</button>
      </div>
    </li>
  )
}
