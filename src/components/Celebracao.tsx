import { useEffect } from 'react'

const MENSAGENS = [
  'Feito! Um passo real, e foi seu.',
  'Boa! Isso conta de verdade.',
  'Você fez. Respira e reconhece isso.',
  'Mais uma concluída. Que bom ver você em ação!',
  'Isso! Um passo de cada vez funciona.',
]
const CORES = ['#2f9e7a', '#f4b740', '#e07a5f', '#6c8ebf', '#b07cc6']

export function Celebracao({ titulo, onFim }: { titulo: string; onFim: () => void }) {
  const msg = MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)]
  useEffect(() => {
    const t = setTimeout(onFim, 2400)
    return () => clearTimeout(t)
  }, [onFim])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm animate-fade" role="status" aria-live="polite" onClick={onFim}>
      <div className="relative mx-6 flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-line bg-card p-8 text-center shadow-xl animate-pop">
        <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-2.5 w-2.5 rounded-sm animate-confetti"
              style={{ left: `${8 + i * 6.3}%`, top: '45%', background: CORES[i % CORES.length], animationDelay: `${(i % 5) * 60}ms` }}
            />
          ))}
        </div>
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-5xl text-brand-ink" aria-hidden>✓</div>
        <p className="text-2xl font-extrabold">{msg}</p>
        <p className="text-soft">“{titulo}”</p>
      </div>
    </div>
  )
}
