import type { EstadoAgora } from '../../hooks/useComecandoAgora'
import { tempoRelativo } from '../../lib/grupos'

// Mostra quem mais está fazendo tarefas agora (e o meu próprio aviso, com botão de parar)
export function QuemEstaFazendo({ agora, compacto = false }: { agora: EstadoAgora; compacto?: boolean }) {
  const { meu, outros } = agora
  if (!meu && outros.length === 0) {
    return compacto ? null : (
      <p className="rounded-2xl bg-card p-4 text-sm text-soft">Ninguém avisou que está começando agora. Que tal ser a primeira pessoa? Toque em “⋯” numa tarefa e escolha “Estou começando agora”.</p>
    )
  }
  return (
    <section aria-label="Quem está fazendo tarefas agora" className="flex flex-col gap-2 rounded-3xl border border-brand/40 bg-brand/10 p-4">
      <h2 className="font-extrabold">🔥 Fazendo agora</h2>
      {meu && (
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 break-words text-sm">Você avisou: <strong>{meu.task_title}</strong></p>
          <button className="btn-outline !min-h-[44px] !py-2 text-sm shrink-0" onClick={() => void agora.parar()}>Parar</button>
        </div>
      )}
      <ul className="flex flex-col gap-1">
        {outros.map((o) => (
          <li key={o.user_id} className="break-words text-sm">
            <strong>{o.nome}</strong> está fazendo “{o.titulo}” <span className="text-soft">· {tempoRelativo(o.desde)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
