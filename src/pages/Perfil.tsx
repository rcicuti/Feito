import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'
import type { Progresso } from '../hooks/useProgresso'
import { CONQUISTAS, emojiDoNivel, infoNivel } from '../lib/progresso'
import { Logo } from '../components/Logo'

export default function Perfil({ progresso }: { progresso: Progresso }) {
  const { profile, sair } = useAuth()
  const { tema, alternar } = useTema()
  const { resumo, desbloqueadas, carregando } = progresso

  const pontos = resumo?.total_points ?? 0
  const nivel = infoNivel(pontos)
  const total = CONQUISTAS.length
  const qtd = CONQUISTAS.filter((c) => desbloqueadas[c.codigo]).length
  const atual = resumo?.sequencia_atual ?? 0

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 pb-28 pt-5">
      <header className="flex items-center justify-between">
        <Logo />
        <button className="h-11 w-11 rounded-full text-xl" onClick={alternar} aria-label={tema === 'escuro' ? 'Usar modo claro' : 'Usar modo escuro'}>
          {tema === 'escuro' ? '☀️' : '🌙'}
        </button>
      </header>

      <h1 className="text-2xl font-extrabold">{profile?.display_name ? `Olá, ${profile.display_name.split(' ')[0]}` : 'Seu perfil'}</h1>

      {carregando ? (
        <p className="py-8 text-center text-soft">Preparando seu espaço…</p>
      ) : (
        <>
          <section className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5" aria-label="Nível e pontos">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand/15 text-4xl" aria-hidden>
                {emojiDoNivel(nivel.nivel)}
              </div>
              <div>
                <p className="text-sm font-semibold text-soft">Nível {nivel.nivel}</p>
                <p className="text-2xl font-extrabold leading-tight">{nivel.nome}</p>
                <p className="font-semibold text-brand">{pontos} pontos</p>
              </div>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-line"
              role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(nivel.proporcao * 100)}
              aria-label="Progresso até o próximo nível"
            >
              <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${Math.round(nivel.proporcao * 100)}%` }} />
            </div>
            <p className="text-sm text-soft">Faltam {nivel.faltam} pontos para o nível {nivel.nivel + 1}.</p>
          </section>

          <section className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5" aria-label="Sequência">
            <p className="text-sm font-semibold text-soft">Sequência atual</p>
            {atual > 0 ? (
              <p className="text-3xl font-extrabold">{atual} {atual === 1 ? 'dia' : 'dias'}</p>
            ) : (
              <p className="text-xl font-extrabold">Hoje é um bom dia para recomeçar 🌱</p>
            )}
            <p className="text-sm text-soft">Dias de descanso mantêm a sequência. Nada do que você já conquistou diminui.</p>
            <dl className="mt-1 grid grid-cols-3 gap-2 text-center">
              {[
                ['Melhor sequência', resumo?.melhor_sequencia ?? 0],
                ['Dias ativos', resumo?.dias_ativos ?? 0],
                ['Tarefas feitas', resumo?.tarefas_concluidas ?? 0],
              ].map(([rotulo, valor]) => (
                <div key={rotulo as string} className="rounded-2xl bg-bg p-3">
                  <dd className="text-2xl font-extrabold">{valor}</dd>
                  <dt className="text-xs font-semibold text-soft">{rotulo}</dt>
                </div>
              ))}
            </dl>
          </section>

          <section className="flex flex-col gap-3" aria-label="Conquistas">
            <h2 className="text-lg font-extrabold">Conquistas <span className="font-semibold text-soft">· {qtd} de {total}</span></h2>
            <ul className="grid grid-cols-2 gap-3">
              {CONQUISTAS.map((c) => {
                const ok = Boolean(desbloqueadas[c.codigo])
                return (
                  <li key={c.codigo} className={`flex flex-col gap-1 rounded-3xl border p-4 ${ok ? 'border-brand/50 bg-card' : 'border-line bg-card/50'}`}>
                    <span className={`text-3xl ${ok ? '' : 'opacity-40 grayscale'}`} aria-hidden>{ok ? c.emoji : '🔒'}</span>
                    <p className={`font-bold leading-tight ${ok ? '' : 'text-soft'}`}>{c.titulo}</p>
                    <p className="text-xs text-soft">{c.descricao}</p>
                    <span className="sr-only">{ok ? 'Desbloqueada' : 'Ainda não desbloqueada'}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}

      <button className="btn-outline mt-2" onClick={sair}>Sair</button>
      <p className="text-center text-xs text-soft">O Feito! não substitui acompanhamento profissional e não faz diagnóstico.</p>
    </div>
  )
}
