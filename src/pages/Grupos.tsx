import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { EstadoGrupos } from '../hooks/useGrupos'
import type { EstadoAgora } from '../hooks/useComecandoAgora'
import { MODOS, ehMenor, type ModoGrupo } from '../lib/grupos'
import { Logo } from '../components/Logo'
import { CriarGrupoSheet } from '../components/grupo/CriarGrupoSheet'
import { EntrarGrupoSheet } from '../components/grupo/EntrarGrupoSheet'
import { QuemEstaFazendo } from '../components/grupo/QuemEstaFazendo'

interface Props {
  estado: EstadoGrupos
  agora: EstadoAgora
  conviteInicial: string | null
  onConviteTratado: () => void
  onAbrir: (id: string) => void
}

export default function Grupos({ estado, agora, conviteInicial, onConviteTratado, onAbrir }: Props) {
  const { profile } = useAuth()
  const menor = ehMenor(profile)
  const [criando, setCriando] = useState(false)
  const [entrando, setEntrando] = useState(Boolean(conviteInicial))
  const { grupos, carregando, erro } = estado

  function fecharEntrar() {
    setEntrando(false)
    onConviteTratado()
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 pb-28 pt-5">
      <header className="flex items-center justify-between"><Logo /></header>
      <h1 className="text-2xl font-extrabold">Grupos</h1>
      <p className="text-soft">Um espaço para fazer junto. Você escolhe o que cada grupo vê, sempre.</p>

      <QuemEstaFazendo agora={agora} />

      <div className="flex flex-col gap-2">
        <button className="btn-primary" onClick={() => setEntrando(true)}>🔑 Entrar com um código</button>
        {!menor && <button className="btn-outline" onClick={() => setCriando(true)}>➕ Criar um grupo</button>}
        {menor && <p className="text-sm text-soft">Por segurança, grupos só podem ser criados por maiores de 18 anos. Você pode entrar nos grupos para os quais for convidado.</p>}
      </div>

      {erro && <p role="alert" className="rounded-2xl bg-card p-4 text-soft">{erro}</p>}

      {carregando ? (
        <p className="py-6 text-center text-soft">Carregando…</p>
      ) : grupos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-soft">
          <span className="text-5xl" aria-hidden>👥</span>
          <p className="text-lg font-semibold text-ink">Você ainda não está em nenhum grupo.</p>
          <p>Entre com o código de um convite{menor ? '.' : ' ou crie o seu.'}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {grupos.map((g) => (
            <li key={g.id}>
              <button className="flex w-full flex-col gap-1 rounded-3xl border border-line bg-card p-4 text-left active:scale-[.99]" onClick={() => onAbrir(g.id)}>
                <span className="text-lg font-extrabold">{g.nome}</span>
                <span className="text-sm text-soft">{MODOS[g.modo as ModoGrupo].emoji} {MODOS[g.modo as ModoGrupo].rotulo} · {g.membros} {g.membros === 1 ? 'pessoa' : 'pessoas'}{g.papel === 'owner' ? ' · você criou' : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {criando && (
        <CriarGrupoSheet
          onFechar={() => setCriando(false)}
          onCriar={async (n, d, m) => {
            const r = await estado.criar(n, d, m)
            if (r.erro || !r.id) return r.erro ?? 'Não consegui criar agora.'
            setCriando(false)
            onAbrir(r.id)
            return null
          }}
        />
      )}
      {entrando && (
        <EntrarGrupoSheet
          codigoInicial={conviteInicial ?? ''}
          menor={menor}
          onFechar={fecharEntrar}
          onEntrar={estado.entrar}
          onAbrirGrupo={(id) => { fecharEntrar(); onAbrir(id) }}
        />
      )}
    </div>
  )
}
