import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'
import { useTarefas } from '../hooks/useTarefas'
import { dataPorExtenso, saudacao } from '../lib/dates'
import { Logo } from '../components/Logo'
import { ProgressRing } from '../components/ProgressRing'
import { QuickAdd } from '../components/QuickAdd'
import { TarefaItem } from '../components/TarefaItem'
import { ConcluirSheet } from '../components/ConcluirSheet'
import { Celebracao } from '../components/Celebracao'

function fraseDoAnel(feitas: number, total: number): string {
  if (total === 0) return 'Que tal começar com uma tarefa pequena?'
  if (feitas === 0) return 'Um passo pequeno já é um começo.'
  if (feitas === total) return 'Tudo feito por hoje. Aproveite o descanso!'
  return 'Você já está em movimento. Continue no seu ritmo.'
}

export default function Hoje() {
  const { user, profile, sair } = useAuth()
  const { tema, alternar } = useTema()
  const { doDia, total, feitas, carregando, erro, criar, concluir, alternarPasso, remarcarParaAmanha, tirarDaLista } = useTarefas(user!.id)
  const [concluindoId, setConcluindoId] = useState<string | null>(null)
  const [celebrando, setCelebrando] = useState<string | null>(null)
  const [menuConta, setMenuConta] = useState(false)

  const emConclusao = doDia.find((t) => t.id === concluindoId)
  const nome = profile?.display_name?.split(' ')[0]

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 pb-24 pt-5">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="relative flex gap-1">
          <button className="h-11 w-11 rounded-full text-xl" onClick={alternar} aria-label={tema === 'escuro' ? 'Usar modo claro' : 'Usar modo escuro'}>
            {tema === 'escuro' ? '☀️' : '🌙'}
          </button>
          <button className="h-11 w-11 rounded-full text-xl" onClick={() => setMenuConta((m) => !m)} aria-label="Conta" aria-expanded={menuConta}>👤</button>
          {menuConta && (
            <div className="absolute right-0 top-12 z-10 w-48 rounded-2xl border border-line bg-card p-2 shadow-lg animate-fade">
              <button className="btn-ghost w-full !justify-start" onClick={sair}>Sair</button>
            </div>
          )}
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
            const ok = await concluir(emConclusao.id, dados)
            if (ok) {
              setConcluindoId(null)
              setCelebrando(emConclusao.title)
            }
            return ok
          }}
        />
      )}
      {celebrando && <Celebracao titulo={celebrando} onFim={() => setCelebrando(null)} />}
    </div>
  )
}
