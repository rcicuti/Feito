import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTema, PALETAS, type Paleta } from '../context/ThemeContext'
import { usePreferencias } from '../context/PreferenciasContext'
import type { Progresso } from '../hooks/useProgresso'
import { tocarConclusao } from '../lib/sons'
import { zerarMeusDados } from '../lib/conta'
import { Logo } from '../components/Logo'
import { PrivacidadePerfil } from '../components/grupo/PrivacidadePerfil'
import { PapelTerapeuta } from '../components/terapia/PapelTerapeuta'
import { Confirmar } from '../components/grupo/Confirmar'
import { ExcluirContaDialogo } from '../components/ExcluirContaDialogo'

function Interruptor({ titulo, texto, ligado, onMudar }: { titulo: string; texto: string; ligado: boolean; onMudar: (v: boolean) => void }) {
  return (
    <label className="flex min-h-[48px] items-start gap-3">
      <input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--brand))]" checked={ligado} onChange={(e) => onMudar(e.target.checked)} />
      <span>
        <span className="block font-semibold">{titulo}</span>
        <span className="block text-sm text-soft">{texto}</span>
      </span>
    </label>
  )
}

interface Props {
  progresso: Progresso
  gruposCriados: number
  onVoltar: () => void
  onTerapia: () => void
}

export default function Configuracoes({ progresso, gruposCriados, onVoltar, onTerapia }: Props) {
  const { user, profile, sair } = useAuth()
  const { tema, alternar, paleta, escolherPaleta } = useTema()
  const { prefs, mudar } = usePreferencias()
  const [zerando, setZerando] = useState(false)
  const [confirmandoZerar, setConfirmandoZerar] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  async function zerar() {
    setZerando(true)
    const ok = await zerarMeusDados(user!.id)
    setZerando(false)
    setConfirmandoZerar(false)
    if (ok) {
      await progresso.recarregar()
      setAviso('Pronto! Sua conta está zerada. Você começa do início, com o mesmo login.')
    } else {
      setAviso('Não consegui zerar agora. Confira se rodou os SQLs no Supabase e tente de novo.')
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 pb-28 pt-5">
      <header className="flex items-center justify-between"><Logo /></header>
      <button className="btn-ghost self-start !px-2" onClick={onVoltar}>← Perfil</button>
      <h1 className="text-2xl font-extrabold">Configurações</h1>

      <section className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5" aria-label="Aparência e sons">
        <h2 className="text-lg font-extrabold">Aparência e sons</h2>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-semibold">Tema de cores</legend>
          {(Object.keys(PALETAS) as Paleta[]).map((id) => (
            <label key={id} className={`flex items-center gap-3 rounded-2xl border p-3 ${paleta === id ? 'border-brand bg-brand/10' : 'border-line bg-bg'}`}>
              <input type="radio" name="paleta" className="h-5 w-5 accent-[rgb(var(--brand))]" checked={paleta === id} onChange={() => escolherPaleta(id)} />
              <span className="flex shrink-0 overflow-hidden rounded-lg border border-line" aria-hidden>
                {PALETAS[id].cores[tema].map((c) => <span key={c} className="h-8 w-6" style={{ background: c }} />)}
              </span>
              <span>
                <span className="block font-semibold">{PALETAS[id].nome}</span>
                <span className="block text-sm text-soft">{PALETAS[id].descricao}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <Interruptor titulo="Modo escuro" texto="Cada tema tem o seu modo claro e o seu modo escuro." ligado={tema === 'escuro'} onMudar={() => alternar()} />
        <Interruptor
          titulo="Reduzir animações"
          texto="Tira confetes, movimentos e transições. Se o seu aparelho já pede menos movimento, o app também respeita."
          ligado={prefs.animacoes === 'reduzidas'}
          onMudar={(v) => mudar({ animacoes: v ? 'reduzidas' : 'auto' })}
        />
        <Interruptor titulo="Sons" texto="Um som curtinho e suave ao concluir uma tarefa. Fica desligado até você ligar." ligado={prefs.sons} onMudar={(v) => { mudar({ sons: v }); if (v) tocarConclusao() }} />
      </section>

      <section className="flex flex-col gap-2 rounded-3xl border border-line bg-card p-5" aria-label="Lembretes">
        <h2 className="text-lg font-extrabold">Lembretes</h2>
        <p className="text-soft">Em breve: lembretes gentis, com limite diário e opção de silenciar. Por enquanto o app não envia notificações.</p>
      </section>

      <PrivacidadePerfil />
      <PapelTerapeuta onAbrirTerapia={onTerapia} />

      <section className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5" aria-label="Seus dados">
        <h2 className="text-lg font-extrabold">Seus dados</h2>
        {aviso && <p role="status" className="rounded-2xl bg-brand/10 p-3 text-sm">{aviso}</p>}
        <p className="text-sm text-soft"><strong>Zerar:</strong> apaga tarefas, fotos, pontos e conquistas, mas mantém seu login.</p>
        <button className="btn-outline" onClick={() => { setAviso(null); setConfirmandoZerar(true) }}>Zerar meus dados</button>
        <p className="mt-2 text-sm text-soft"><strong>Excluir conta:</strong> apaga seu login e tudo o que é seu, de vez.</p>
        <button className="btn-outline" onClick={() => setExcluindo(true)}>Excluir minha conta</button>
      </section>

      <button className="btn-outline" onClick={sair}>Sair</button>
      <p className="text-center text-xs text-soft">O Feito! não substitui acompanhamento profissional e não faz diagnóstico.</p>

      {confirmandoZerar && (
        <Confirmar
          titulo="Zerar todos os seus dados?"
          texto="Vamos apagar todas as suas tarefas, fotos, pontos, níveis, conquistas e dias de descanso. Isso não tem volta. Seu login e seu nome continuam."
          confirmar={zerando ? 'Apagando…' : 'Sim, zerar tudo'}
          onConfirmar={zerar}
          onCancelar={() => setConfirmandoZerar(false)}
        />
      )}
      {excluindo && (
        <ExcluirContaDialogo
          userId={user!.id}
          gruposCriados={gruposCriados}
          ehTerapeuta={Boolean(profile?.is_therapist)}
          onCancelar={() => setExcluindo(false)}
          onExcluida={() => { void sair() }}
        />
      )}
    </div>
  )
}
