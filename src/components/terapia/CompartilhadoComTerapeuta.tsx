import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { tempoRelativo } from '../../lib/grupos'
import { mensagemTerapia, type ComentarioTerapeuta, type ConclusaoCompartilhada } from '../../lib/terapia'

// Paciente: o que eu compartilhei com este(a) terapeuta, os comentários, e como parar de compartilhar cada item
export function CompartilhadoComTerapeuta({ linkId }: { linkId: string }) {
  const [itens, setItens] = useState<ConclusaoCompartilhada[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState<string | null>(null)
  const [comentarios, setComentarios] = useState<ComentarioTerapeuta[]>([])
  const [aviso, setAviso] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.rpc('compartilhado_com_terapeuta', { p_link: linkId })
    if (error) setAviso(mensagemTerapia(error, 'Não consegui carregar agora.'))
    else setItens((data ?? []) as ConclusaoCompartilhada[])
    setCarregando(false)
  }, [linkId])
  useEffect(() => { void carregar() }, [carregar])

  async function abrir(id: string) {
    if (aberto === id) return setAberto(null)
    setAberto(id)
    const { data } = await supabase.rpc('comentarios_do_terapeuta', { p_completion: id, p_link: linkId })
    setComentarios((data ?? []) as ComentarioTerapeuta[])
  }

  async function apagarComentario(id: string, completion: string) {
    await supabase.from('therapist_comments').delete().eq('id', id)
    const { data } = await supabase.rpc('comentarios_do_terapeuta', { p_completion: completion, p_link: linkId })
    setComentarios((data ?? []) as ComentarioTerapeuta[])
    await carregar()
  }

  async function pararDeCompartilhar(id: string) {
    const { error } = await supabase.from('therapist_shares').delete().eq('completion_id', id).eq('link_id', linkId)
    if (error) return setAviso('Não consegui agora.')
    setAberto(null)
    await carregar()
  }

  if (carregando) return <p className="text-sm text-soft">Carregando…</p>
  if (itens.length === 0) return <p className="text-sm text-soft">Você ainda não compartilhou nenhuma tarefa. Ao concluir uma, escolha “Meu(minha) terapeuta”.</p>
  return (
    <div className="flex flex-col gap-2">
      {aviso && <p role="status" className="text-sm text-soft">{aviso}</p>}
      <ul className="flex flex-col gap-2">
        {itens.map((i) => (
          <li key={i.completion_id} className="rounded-2xl bg-bg p-3">
            <button className="flex w-full items-center justify-between gap-2 text-left min-h-[44px]" onClick={() => void abrir(i.completion_id)} aria-expanded={aberto === i.completion_id}>
              <span className="min-w-0 break-words font-semibold">✓ {i.titulo}</span>
              <span className="shrink-0 text-xs text-soft">{i.comentarios > 0 ? `💬 ${i.comentarios}` : tempoRelativo(i.compartilhada_em)}</span>
            </button>
            {aberto === i.completion_id && (
              <div className="mt-2 flex flex-col gap-2 animate-fade">
                {i.legenda && <p className="break-words text-sm text-soft">“{i.legenda}”</p>}
                <p className="text-xs text-soft">{i.foto ? 'A foto está visível para o(a) terapeuta.' : 'Sem foto compartilhada.'}</p>
                {comentarios.map((c) => (
                  <div key={c.id} className="rounded-xl bg-card px-3 py-2">
                    <p className="text-xs font-bold text-soft">{c.nome} · {tempoRelativo(c.criado_em)}</p>
                    <p className="break-words">{c.texto}</p>
                    {c.posso_apagar && <button className="min-h-[32px] text-xs text-soft underline" onClick={() => void apagarComentario(c.id, i.completion_id)}>Apagar comentário</button>}
                  </div>
                ))}
                <button className="btn-outline !min-h-[44px] !py-2 self-start text-sm" onClick={() => void pararDeCompartilhar(i.completion_id)}>Parar de compartilhar esta tarefa</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
