import { dataCurta } from '../../lib/grupos'
import type { SemanaResumo } from '../../lib/terapia'

// Gráfico simples: uma barra por semana (tarefas feitas) com os dias ativos escritos embaixo
export function GraficoSemanas({ semanas }: { semanas: SemanaResumo[] }) {
  const max = Math.max(1, ...semanas.map((s) => s.tarefas))
  const total = semanas.reduce((a, s) => a + s.tarefas, 0)
  return (
    <figure className="flex flex-col gap-3" aria-label="Adesão por semana">
      <div className="flex h-40 items-end gap-2" role="img" aria-label={`Tarefas feitas por semana: ${semanas.map((s) => `semana de ${dataCurta(s.semana)}, ${s.tarefas} tarefas em ${s.dias_ativos} dias`).join('; ')}`}>
        {semanas.map((s) => (
          <div key={s.semana} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs font-bold">{s.tarefas}</span>
            <div className="w-full rounded-t-lg bg-brand" style={{ height: `${Math.max(s.tarefas > 0 ? 6 : 2, (s.tarefas / max) * 100)}%`, opacity: s.tarefas > 0 ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 text-center text-[11px] text-soft" aria-hidden>
        {semanas.map((s) => (
          <div key={s.semana} className="flex-1">
            <div>{dataCurta(s.semana)}</div>
            <div className="font-semibold text-ink">{s.dias_ativos}/7 dias</div>
          </div>
        ))}
      </div>
      <figcaption className="text-sm text-soft">Barras: tarefas feitas na semana (começando na segunda). Embaixo: dias em que houve alguma tarefa. {total === 0 ? 'Ainda sem tarefas nesse período.' : ''}</figcaption>
    </figure>
  )
}
