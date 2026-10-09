import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'
import type { Progresso } from '../hooks/useProgresso'
import { CONQUISTAS, emojiDoNivel, infoNivel } from '../lib/progresso'
import { Logo } from '../components/Logo'
import { zerarMeusDados } from '../lib/conta'
import { PrivacidadePerfil } from '../components/grupo/PrivacidadePerfil'
import { PapelTerapeuta } from '../components/terapia/PapelTerapeuta'

export default function Perfil({ progresso, onTerapia }: { progresso: Progresso; onTerapia: () => void }) {
  const { user, profile, sair } = useAuth()
  const { tema, alternar } = useTema()
  const { resumo, desbloqueadas, carregando } = progresso

  const pontos = resumo?.total_points ?? 0
  const nivel = infoNivel(pontos)
  const total = CONQUISTAS.length
  const qtd = CONQUISTAS.filter((c) => desbloqueadas[c.codigo]).length
  const atual = resumo?.sequencia_atual ?? 0
  const [confirmando, setConfirmando] = useState(false)
  const [zerando, setZerando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  async function zerar() {
    setZerando(true)
    const ok = await zerarMeusDados(user!.id)
    setZerando(false)
    setConfirmando(false)
    if (ok) {
      await progresso.recarregar()
      setAviso('Pronto! Sua conta está zerada. Você começa do início, com o mesmo login.')
    } else {
      setAviso('Não consegui zerar agora. Confira se rodou o SQL 0003 no Supabase e tente de novo.')
    }
  }

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

      <PrivacidadePerfil />

      <PapelTerapeuta onAbrirTerapia={onTerapia} />

      <section className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5" aria-label="Dados da conta">
        <h2 className="text-lg font-extrabold">Dados da conta</h2>
        <p className="text-sm text-soft">Quer recomeçar do zero? Isso apaga suas tarefas, fotos, pontos e conquistas. Seu login continua o mesmo.</p>
        {aviso && <p role="status" className="rounded-2xl bg-brand/10 p-3 text-sm">{aviso}</p>}
        <button className="btn-outline" onClick={() => { setAviso(null); setConfirmando(true) }}>Zerar meus dados</button>
      </section>

      <button className="btn-outline mt-2" onClick={sair}>Sair</button>
      <p className="text-center text-xs text-soft">O Feito! não substitui acompanhamento profissional e não faz diagnóstico.</p>

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 animate-fade" onClick={() => !zerando && setConfirmando(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="zerar-titulo" aria-describedby="zerar-texto" className="flex w-full max-w-sm flex-col gap-3 rounded-3xl border border-line bg-card p-6 animate-pop" onClick={(e) => e.stopPropagation()}>
            <h2 id="zerar-titulo" className="text-xl font-extrabold">Zerar todos os seus dados?</h2>
            <p id="zerar-texto" className="text-soft">
              Vamos apagar todas as suas tarefas, fotos, pontos, níveis, conquistas e dias de descanso. Isso não tem volta. Seu login e seu nome continuam.
            </p>
            <button className="btn-primary" disabled={zerando} onClick={zerar}>{zerando ? 'Apagando…' : 'Sim, zerar tudo'}</button>
            <button className="btn-ghost" disabled={zerando} onClick={() => setConfirmando(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
