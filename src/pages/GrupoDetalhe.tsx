import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { EstadoGrupos } from '../hooks/useGrupos'
import type { EstadoAgora } from '../hooks/useComecandoAgora'
import { MODOS, ehMenor, type ModoGrupo } from '../lib/grupos'
import { FeedGrupo } from '../components/grupo/FeedGrupo'
import { DesafiosGrupo } from '../components/grupo/DesafiosGrupo'
import { MembrosGrupo } from '../components/grupo/MembrosGrupo'
import { ConviteCard } from '../components/grupo/ConviteCard'
import { QuemEstaFazendo } from '../components/grupo/QuemEstaFazendo'
import { Confirmar } from '../components/grupo/Confirmar'

type Sub = 'feed' | 'desafios' | 'pessoas'

export default function GrupoDetalhe({ grupoId, estado, agora, onVoltar }: { grupoId: string; estado: EstadoGrupos; agora: EstadoAgora; onVoltar: () => void }) {
  const { user, profile } = useAuth()
  const [sub, setSub] = useState<Sub>('feed')
  const [confirmando, setConfirmando] = useState<'sair' | 'apagar' | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const g = estado.grupos.find((x) => x.id === grupoId)
  const menor = ehMenor(profile)

  if (!g) {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 pb-28 pt-5">
        <button className="btn-ghost self-start" onClick={onVoltar}>← Voltar</button>
        <p className="text-soft">{estado.carregando ? 'Carregando…' : 'Não encontrei este grupo. Talvez você tenha saído dele.'}</p>
      </div>
    )
  }
  const souDono = g.papel === 'owner'
  const modo = g.modo as ModoGrupo
  const abas: { id: Sub; rotulo: string }[] = [{ id: 'feed', rotulo: 'Feed' }, { id: 'desafios', rotulo: 'Desafios' }, { id: 'pessoas', rotulo: 'Pessoas' }]

  async function executar() {
    const ok = confirmando === 'apagar' ? await estado.apagar(g!.id) : await estado.sair(g!.id, user!.id)
    setConfirmando(null)
    if (ok) onVoltar()
    else setErro('Não consegui agora. Tente de novo.')
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 pb-28 pt-5">
      <button className="btn-ghost self-start !px-2" onClick={onVoltar}>← Grupos</button>
      <header className="flex flex-col gap-1">
        <h1 className="break-words text-2xl font-extrabold">{g.nome}</h1>
        {g.descricao && <p className="break-words text-soft">{g.descricao}</p>}
        <p className="text-sm text-soft">{MODOS[modo].emoji} {MODOS[modo].rotulo} · {g.membros} {g.membros === 1 ? 'pessoa' : 'pessoas'}</p>
      </header>
      {erro && <p role="alert" className="rounded-2xl bg-card p-4 text-soft">{erro}</p>}

      <QuemEstaFazendo agora={agora} compacto />

      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl bg-card p-1">
        {abas.map((a) => (
          <button key={a.id} role="tab" aria-selected={sub === a.id} onClick={() => setSub(a.id)}
            className={`min-h-[44px] rounded-xl text-sm font-bold ${sub === a.id ? 'bg-brand text-brand-ink' : 'text-soft'}`}>{a.rotulo}</button>
        ))}
      </div>

      {sub === 'feed' && <FeedGrupo grupoId={g.id} meuId={user!.id} souDono={souDono} menor={menor} />}
      {sub === 'desafios' && <DesafiosGrupo grupoId={g.id} modo={modo} souDono={souDono} meuId={user!.id} />}
      {sub === 'pessoas' && (
        <div className="flex flex-col gap-4">
          {souDono && <ConviteCard grupoId={g.id} grupoNome={g.nome} />}
          <MembrosGrupo grupoId={g.id} meuId={user!.id} souDono={souDono} onMudou={() => void estado.recarregar()} />
          {souDono ? (
            <button className="btn-outline" onClick={() => setConfirmando('apagar')}>Apagar o grupo</button>
          ) : (
            <button className="btn-outline" onClick={() => setConfirmando('sair')}>Sair do grupo</button>
          )}
        </div>
      )}

      {confirmando === 'sair' && (
        <Confirmar titulo="Sair do grupo?" texto="O que você compartilhou aqui deixa de aparecer para o grupo. Para voltar, você precisa de um convite." confirmar="Sair do grupo" onConfirmar={executar} onCancelar={() => setConfirmando(null)} />
      )}
      {confirmando === 'apagar' && (
        <Confirmar titulo="Apagar o grupo?" texto="O grupo, o feed e os desafios somem para todo mundo. As tarefas de cada pessoa continuam com ela. Isso não tem volta." confirmar="Apagar o grupo" onConfirmar={executar} onCancelar={() => setConfirmando(null)} />
      )}
    </div>
  )
}
