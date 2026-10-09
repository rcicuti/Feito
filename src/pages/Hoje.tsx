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
import { EditarTarefaSheet } from '../components/EditarTarefaSheet'
import { Celebracao, type DadosCelebracao } from '../components/Celebracao'
import { CartaoRetomada } from '../components/CartaoRetomada'
import { NivelPopup, type DadosNivelPopup } from '../components/NivelPopup'
import type { Grupo } from '../lib/grupos'
import type { VinculoTerapeuta } from '../lib/terapia'
import type { EstadoAgora } from '../hooks/useComecandoAgora'
import { ComecarAgoraSheet } from '../components/grupo/ComecarAgoraSheet'
import { QuemEstaFazendo } from '../components/grupo/QuemEstaFazendo'

function fraseDoAnel(feitas: number, total: number): string {
  if (total === 0) return 'Que tal começar com uma tarefa pequena?'
  if (feitas === 0) return 'Um passo pequeno já é um começo.'
  if (feitas === total) return 'Tudo feito por hoje. Aproveite o descanso!'
  return 'Você já está em movimento. Continue no seu ritmo.'
}

const chaveDispensa = () => `feito-retomada-${hojeISO()}`

export default function Hoje({ progresso, grupos, terapeutas, agora, onPerfil }: { progresso: Progresso; grupos: Grupo[]; terapeutas: VinculoTerapeuta[]; agora: EstadoAgora; onPerfil: () => void }) {
  const { user, profile } = useAuth()
  const { tema, alternar } = useTema()
  const { doDia, total, feitas, carregando, erro, criar, concluir, alternarPasso, editar, remarcarParaAmanha, tirarDaLista } = useTarefas(user!.id)
  const [concluindoId, setConcluindoId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [comecandoId, setComecandoId] = useState<string | null>(null)
  const [celebrando, setCelebrando] = useState<DadosCelebracao | null>(null)
  const [nivelPopup, setNivelPopup] = useState<DadosNivelPopup | null>(null)
  const [dispensado, setDispensado] = useState(() => {
    try { return localStorage.getItem(chaveDispensa()) === '1' } catch { return false }
  })

  const emConclusao = doDia.find((t) => t.id === concluindoId)
  const emEdicao = doDia.find((t) => t.id === editandoId)
  const emComeco = doDia.find((t) => t.id === comecandoId)
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

      <QuemEstaFazendo agora={agora} compacto />

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
                onEditar={() => setEditandoId(t.id)}
                onAmanha={() => void remarcarParaAmanha(t.id)}
                onTirar={() => void tirarDaLista(t.id)}
                onComecarAgora={grupos.length > 0 ? () => setComecandoId(t.id) : undefined}
              />
            ))}
          </ul>
        )}
      </main>

      {emEdicao && (
        <EditarTarefaSheet
          tarefa={emEdicao}
          onCancelar={() => setEditandoId(null)}
          onSalvar={async (dados) => {
            const ok = await editar(emEdicao.id, dados)
            if (ok) setEditandoId(null)
            return ok
          }}
        />
      )}

      {emConclusao && (
        <ConcluirSheet
          titulo={emConclusao.title}
          grupos={grupos}
          terapeutas={terapeutas}
          onCancelar={() => setConcluindoId(null)}
          onConfirmar={async (dados) => {
            const nivelAntes = infoNivel(resumo?.total_points ?? 0).nivel
            const retomada = progresso.diasEmBranco.length >= 2
            const res = await concluir(emConclusao.id, dados)
            if (!res) return false
            const novoResumo = await progresso.recarregar()
            const nivelDepois = infoNivel(novoResumo?.total_points ?? (resumo?.total_points ?? 0) + res.pontos)
            setConcluindoId(null)
            void agora.pararSeForEssaTarefa(emConclusao.id)
            const base = mensagemReforco({
              titulo: emConclusao.title,
              adiada: emConclusao.repeat_type === 'none' && emConclusao.start_date < hojeISO(),
              dificil: emConclusao.is_hard,
              totalPassos: emConclusao.task_steps.length,
              primeiraDoDia: feitas === 0,
              retomada,
            })
            const mensagem = res.falhouCompartilhar
              ? `${base} (Não consegui compartilhar com o grupo agora, mas sua tarefa está salva.)`
              : res.compartilhadoEm > 0
                ? `${base} Compartilhado com ${res.compartilhadoEm === 1 ? '1 grupo' : `${res.compartilhadoEm} grupos`}.`
                : res.terapeutasEm > 0
                  ? `${base} Compartilhado com ${res.terapeutasEm === 1 ? 'seu(sua) terapeuta' : 'seus terapeutas'}.`
                  : base
            const conquistas = res.conquistas.map(conquistaPorCodigo).filter((c): c is Conquista => Boolean(c))
            if (nivelDepois.nivel > nivelAntes) {
              // subiu de nível: um único popup, que só fecha quando a pessoa toca em "Continuar"
              setNivelPopup({ nivel: nivelDepois.nivel, nome: nivelDepois.nome, faltam: nivelDepois.faltam, mensagem, pontos: res.pontos, conquistas })
            } else {
              setCelebrando({ mensagem, pontos: res.pontos, conquistas })
            }
            return true
          }}
        />
      )}
      {emComeco && (
        <ComecarAgoraSheet
          titulo={emComeco.title}
          grupos={grupos}
          onFechar={() => setComecandoId(null)}
          onConfirmar={async (ids) => {
            const e = await agora.comecar(emComeco.id, ids)
            if (!e) setComecandoId(null)
            return e
          }}
        />
      )}
      {celebrando && <Celebracao dados={celebrando} onFim={() => setCelebrando(null)} />}
      {nivelPopup && <NivelPopup dados={nivelPopup} onFechar={() => setNivelPopup(null)} />}
    </div>
  )
}
