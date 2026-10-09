import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { mensagemDeErro, type Membro } from '../../lib/grupos'
import { Confirmar } from './Confirmar'
import { DenunciarSheet } from './DenunciarSheet'

interface Props { grupoId: string; meuId: string; souDono: boolean; onMudou: () => void }

export function MembrosGrupo({ grupoId, meuId, souDono, onMudou }: Props) {
  const [membros, setMembros] = useState<Membro[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState<Membro | null>(null)
  const [denunciando, setDenunciando] = useState<Membro | null>(null)

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.rpc('membros_do_grupo', { p_group: grupoId })
    if (error) setErro(mensagemDeErro(error, 'Não consegui carregar as pessoas.'))
    else setMembros((data ?? []) as Membro[])
  }, [grupoId])

  useEffect(() => { void carregar() }, [carregar])

  async function remover(m: Membro) {
    const { error } = await supabase.from('group_members').delete().eq('group_id', grupoId).eq('user_id', m.user_id)
    setRemovendo(null)
    if (error) setErro('Não consegui remover agora.')
    else { await carregar(); onMudou() }
  }

  return (
    <section aria-label="Pessoas do grupo" className="flex flex-col gap-2">
      {erro && <p role="alert" className="rounded-2xl bg-card p-4 text-soft">{erro}</p>}
      <ul className="flex flex-col gap-2">
        {membros.map((m) => (
          <li key={m.user_id} className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="break-words font-bold">{m.nome}{m.eh_eu ? ' (você)' : ''}</p>
              {m.papel === 'owner' && <p className="text-xs text-soft">criou o grupo</p>}
            </div>
            {!m.eh_eu && (
              <div className="flex shrink-0 gap-1">
                <button className="btn-ghost !min-h-[44px] !py-2 text-sm" onClick={() => setDenunciando(m)}>Denunciar</button>
                {souDono && <button className="btn-ghost !min-h-[44px] !py-2 text-sm" onClick={() => setRemovendo(m)}>Remover</button>}
              </div>
            )}
          </li>
        ))}
      </ul>
      {removendo && (
        <Confirmar
          titulo={`Remover ${removendo.nome}?`}
          texto="A pessoa sai do grupo e o que ela compartilhou aqui deixa de aparecer. Ela precisa de um convite para voltar."
          confirmar="Remover"
          onConfirmar={() => remover(removendo)}
          onCancelar={() => setRemovendo(null)}
        />
      )}
      {denunciando && <DenunciarSheet meuId={meuId} alvo={{ userId: denunciando.user_id, grupoId }} onFechar={() => setDenunciando(null)} />}
    </section>
  )
}
