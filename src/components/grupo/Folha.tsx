import type { ReactNode } from 'react'

// Janela que sobe de baixo da tela (mesmo visual das outras folhas do app)
export function Folha({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40 animate-fade" onClick={onFechar}>
      <div
        role="dialog" aria-modal="true" aria-label={titulo}
        className="mx-auto flex max-h-[92%] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl bg-bg p-5 pb-8 animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-extrabold">{titulo}</h2>
          <button className="h-11 w-11 shrink-0 text-xl text-soft" aria-label="Fechar" onClick={onFechar}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
