import { useEffect, useRef } from 'react'
import { emojiDoNivel, mensagemNivel, type Conquista } from '../lib/progresso'

export interface DadosNivelPopup {
  nivel: number
  nome: string
  faltam: number // pontos para o próximo nível
  mensagem: string // reforço da tarefa que acabou de ser feita
  pontos: number
  conquistas: Conquista[]
}

const CORES = ['#2f9e7a', '#f4b740', '#e07a5f', '#6c8ebf', '#b07cc6']

// Popup de subida de nível. Não fecha sozinho: só fecha quando a pessoa toca em "Continuar".
export function NivelPopup({ dados, onFechar }: { dados: DadosNivelPopup; onFechar: () => void }) {
  const botao = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    botao.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-6 animate-fade">
      <div
        role="dialog" aria-modal="true" aria-labelledby="nivel-titulo"
        className="relative my-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border border-line bg-card p-8 text-center shadow-2xl animate-pop"
      >
        <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-2.5 w-2.5 rounded-sm animate-confetti"
              style={{ left: `${6 + i * 5.2}%`, top: '30%', background: CORES[i % CORES.length], animationDelay: `${(i % 6) * 70}ms` }}
            />
          ))}
        </div>
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand/15 text-7xl" aria-hidden>
          {emojiDoNivel(dados.nivel)}
        </div>
        <h2 id="nivel-titulo" className="text-2xl font-extrabold">Você subiu de nível!</h2>
        <p className="rounded-full bg-brand px-5 py-1.5 text-lg font-extrabold text-brand-ink">
          Nível {dados.nivel} · {dados.nome}
        </p>
        <p className="text-lg leading-snug">{mensagemNivel(dados.nivel)}</p>

        <div className="mt-1 flex w-full flex-col gap-2 rounded-2xl bg-bg p-4 text-left">
          <p className="text-sm leading-snug text-soft">{dados.mensagem}</p>
          <p className="font-extrabold text-brand">+{dados.pontos} pontos</p>
          {dados.conquistas.map((c) => (
            <p key={c.codigo} className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>{c.emoji}</span>
              <span><span className="block text-xs font-semibold text-soft">Nova conquista</span><span className="font-bold">{c.titulo}</span></span>
            </p>
          ))}
        </div>

        <p className="text-sm text-soft">Faltam {dados.faltam} pontos para o nível {dados.nivel + 1}.</p>
        <button ref={botao} className="btn-primary mt-1 w-full" onClick={onFechar}>Continuar</button>
      </div>
    </div>
  )
}
