import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'
import { useTarefas } from '../hooks/useTarefas'
import type { Progresso } from '../hooks/useProgresso'
import { dataPorExtenso, hojeISO, saudacao } from '../lib/dates'
import { conquistaPorCodigo, infoNivel, mensagemReforco, type Conquista } from '../lib/progresso'
import { Logo } from '../components/Logo'
import { ProgressRing } from '../components/ProgressRing'
import { QuickAdd } from '../components/QuickAdd'
import { TarefaItem } from '../components/TarefaItem'
import { ConcluirSheet } from '../components/ConcluirSheet'
import { Celebracao, type DadosCelebracao } from '../components/Celebracao'
import { CartaoRetomada } from '../components/CartaoRetomada'
import { NivelPopup, type DadosNivel } from '../components/NivelPopup'

function fraseDoAnel(feitas: number, total: number): string {
  if (total === 0) return 'Que tal começar com uma tarefa pequena?'
  if (feitas === 0) return 'Um passo pequeno já é um começo.'
  if (feitas === total) return 'Tudo feito por hoje. Aproveite o descanso!'
  return 'Você já está em movimento. Continue no seu ritmo.'
}

const chaveDispensa = () => `feito-retomada-${hojeISO()}`

export default function Hoje({ progresso, onPerfil }: { progresso: Progresso; onPerfil: () => void }) {
  const { user, profile } = useAuth()
  const { tema, alternar } = useTema()
  const { doDia, total, feitas, carregando, erro, criar, concluir, alternarPasso, remarcarParaAmanha, tirarDaLista } = useTarefas(user!.id)
  const [concluindoId, setConcluindoId] = useState<string | null>(null)
  const [celebrando, setCelebrando] = useState<DadosCelebracao | null>(null)
  const [nivelPendente, setNivelPendente] = useState<DadosNivel | null>(null)
  const [nivelPopup, setNivelPopup] = useState<DadosNivel | null>(null)
  const [dispensado, setDispensado] = useState(() => {
    try { return localStorage.getItem(chaveDispensa()) === '1' } catch { return false }
  })

  const emConclusao = doDia.find((t) => t.id === concluindoId)
  const nome = profile?.display_name?.split(' ')[0]
  const resumo = progresso.resumo
  const nivel = resumo ? infoNivel(resumo.total_points) : null
  const emBranco = progresso.diasEmBranco.length
  const mostrarRetomada = emBranco > 0 && !dispensado

  function dispensar() {
    setDispensado(true)
    try { localStorage.setItem(chaveDispensa(), '1') } catch { /* tudo bem */ }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 pb-28 pt-5">
      <header className="flex items-center justify-between gap-2">
        <Logo />
        <div className="flex items-center gap-1">
          {nivel && (
            <button className="min-h-[44px] rounded-full bg-brand/15 px-3 text-sm font-bold text-brand" onClick={onPerfil} aria-label={`Nível ${nivel.nivel}, ${nivel.nome}. Abrir perfil`}>
              🌱 Nível {nivel.nivel}
            </button>
          )}
          <button className="h-11 w-11 rounded-full text-xl" onClick={alternar} aria-label={tema === 'escuro' ? 'Usar modo claro' : 'Usar modo escuro'}>
            {tema === 'escuro' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <section className="flex items-center gap-4">
        <ProgressRing feitas={feitas} total={total} />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold leading-tight">{saudacao()}{nome ? `, ${nome}` : ''}!</h1>
          <p className="text-sm capitalize text-soft">{dataPorExtenso()}</p>
          <p className="mt-1 text-soft">{fraseDoAnel(feitas, total)}</p>
        </div>
      </section>

      {mostrarRetomada && (
        <CartaoRetomada
          dias={emBranco}
          onDescanso={async () => { if (await progresso.marcarDescanso()) dispensar() }}
          onRetomar={dispensar}
        />
      )}

      <QuickAdd onCriar={criar} />

      {erro && <p role="alert" className="rounded-2xl bg-card p-4 text-soft">{erro}</p>}

      <main>
        {carregando ? (
          <p className="py-8 text-center text-soft">Preparando seu espaço…</p>
        ) : doDia.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-soft">
            <span className="text-5xl" aria-hidden>🌿</span>
            <p className="text-lg font-semibold text-ink">Nada por aqui ainda.</p>
            <p>Escreva uma tarefa acima. Pode ser pequenininha.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {doDia.map((t) => (
              <TarefaItem
                key={t.id}
                tarefa={t}
                onConcluir={() => setConcluindoId(t.id)}
                onPasso={(id) => {
                  void alternarPasso(id)
                  // ao marcar o último passo, convida a concluir a tarefa
                  const faltam = t.task_steps.filter((p) => !t.passosFeitos.has(p.id) && p.id !== id).length
                  const estavaFeito = t.passosFeitos.has(id)
                  if (!estavaFeito && faltam === 0 && t.task_steps.length > 0) setConcluindoId(t.id)
                }}
                onAmanha={() => void remarcarParaAmanha(t.id)}
                onTirar={() => void tirarDaLista(t.id)}
              />
            ))}
          </ul>
        )}
      </main>

      {emConclusao && (
        <ConcluirSheet
          titulo={emConclusao.title}
          onCancelar={() => setConcluindoId(null)}
          onConfirmar={async (dados) => {
            const nivelAntes = infoNivel(resumo?.total_points ?? 0).nivel
            const retomada = progresso.diasEmBranco.length >= 2
            const res = await concluir(emConclusao.id, dados)
            if (!res) return false
            const novoResumo = await progresso.recarregar()
            const nivelDepois = infoNivel(novoResumo?.total_points ?? (resumo?.total_points ?? 0) + res.pontos)
            setConcluindoId(null)
            setCelebrando({
              mensagem: mensagemReforco({
                titulo: emConclusao.title,
                adiada: emConclusao.repeat_type === 'none' && emConclusao.start_date < hojeISO(),
                dificil: emConclusao.is_hard,
                totalPassos: emConclusao.task_steps.length,
                primeiraDoDia: feitas === 0,
                retomada,
              }),
              pontos: res.pontos,
              conquistas: res.conquistas.map(conquistaPorCodigo).filter((c): c is Conquista => Boolean(c)),
            })
            // subiu de nível: o popup aparece depois da celebração
            setNivelPendente(nivelDepois.nivel > nivelAntes ? { nivel: nivelDepois.nivel, nome: nivelDepois.nome, faltam: nivelDepois.faltam } : null)
            return true
          }}
        />
      )}
      {celebrando && (
        <Celebracao
          dados={celebrando}
          onFim={() => {
            setCelebrando(null)
            if (nivelPendente) {
              setNivelPopup(nivelPendente)
              setNivelPendente(null)
            }
          }}
        />
      )}
      {nivelPopup && <NivelPopup dados={nivelPopup} onFechar={() => setNivelPopup(null)} />}
    </div>
  )
}
