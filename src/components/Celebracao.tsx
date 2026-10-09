import { useEffect } from 'react'
import type { Conquista } from '../lib/progresso'

const CORES = ['#2f9e7a', '#f4b740', '#e07a5f', '#6c8ebf', '#b07cc6']

export interface DadosCelebracao {
  mensagem: string
  pontos: number
  nivelNovo: { nivel: number; nome: string } | null
  conquistas: Conquista[]
}

export function Celebracao({ dados, onFim }: { dados: DadosCelebracao; onFim: () => void }) {
  const extras = dados.conquistas.length > 0 || dados.nivelNovo !== null
  useEffect(() => {
    const t = setTimeout(onFim, extras ? 5000 : 3000)
    return () => clearTimeout(t)
  }, [onFim, extras])

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
        <p className="text-xl font-extrabold leading-snug">{dados.mensagem}</p>
        <p className="rounded-full bg-brand/15 px-4 py-1.5 text-lg font-extrabold text-brand">+{dados.pontos} pontos</p>

        {dados.nivelNovo && (
          <p className="font-bold">🎉 Você chegou ao nível {dados.nivelNovo.nivel}: {dados.nivelNovo.nome}</p>
        )}
        {dados.conquistas.map((c) => (
          <p key={c.codigo} className="flex items-center gap-2 rounded-2xl bg-bg px-4 py-2 text-left">
            <span className="text-2xl" aria-hidden>{c.emoji}</span>
            <span><span className="block text-xs font-semibold text-soft">Nova conquista</span><span className="font-bold">{c.titulo}</span></span>
          </p>
        ))}
      </div>
    </div>
  )
}
