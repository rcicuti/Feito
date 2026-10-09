export function ProgressRing({ feitas, total }: { feitas: number; total: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const pct = total === 0 ? 0 : feitas / total
  return (
    <div
      className="relative h-36 w-36 shrink-0"
      role="img"
      aria-label={total === 0 ? 'Nenhuma tarefa por hoje ainda' : `${feitas} de ${total} tarefas feitas hoje`}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="12" className="stroke-line" />
        <circle
          cx="60" cy="60" r={r} fill="none" strokeWidth="12" strokeLinecap="round"
          className="stroke-brand transition-all duration-700"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold leading-none">{feitas}<span className="text-soft">/{total}</span></span>
        <span className="mt-1 text-xs font-semibold text-soft">feitas hoje</span>
      </div>
    </div>
  )
}
