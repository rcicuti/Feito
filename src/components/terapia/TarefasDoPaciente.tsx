import { useCallback, useEffect, useState } from 'react'
import { supabase, BUCKET_PROVAS } from '../../lib/supabase'
import { tempoRelativo } from '../../lib/grupos'
import { mensagemTerapia, type ComentarioTerapeuta, type ConclusaoCompartilhada } from '../../lib/terapia'

function Item({ i, fotoUrl, linkId, onMudou }: { i: ConclusaoCompartilhada; fotoUrl: string | null; linkId: string; onMudou: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [comentarios, setComentarios] = useState<ComentarioTerapeuta[]>([])
  const [texto, setTexto] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)

  async function carregar() {
    const { data } = await supabase.rpc('comentarios_do_terapeuta', { p_completion: i.completion_id, p_link: linkId })
    setComentarios((data ?? []) as ComentarioTerapeuta[])
  }

  async function alternar() {
    const abrir = !aberto
    setAberto(abrir)
    if (abrir) await carregar()
  }

  async function comentar() {
    const t = texto.trim()
    if (!t) return
    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase.from('therapist_comments').insert({ completion_id: i.completion_id, link_id: linkId, author_id: u.user!.id, body: t })
    if (error) return setAviso('Não consegui comentar agora.')
    setTexto('')
    setAviso(null)
    await carregar()
    onMudou()
  }

  async function apagar(id: string) {
    await supabase.from('therapist_comments').delete().eq('id', id)
    await carregar()
    onMudou()
  }

  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-4">
      <div>
        <p className="break-words text-lg font-bold leading-snug">✓ {i.titulo}</p>
        <p className="text-xs text-soft">feito em {i.concluida_em.split('-').reverse().slice(0, 2).join('/')} · compartilhado {tempoRelativo(i.compartilhada_em)}</p>
        {i.legenda && <p className="mt-1 break-words text-soft">“{i.legenda}”</p>}
      </div>
      {fotoUrl && <img src={fotoUrl} alt={`Foto da tarefa: ${i.titulo}`} loading="lazy" className="max-h-80 w-full rounded-2xl object-cover" />}
      <button className="min-h-[44px] self-start text-sm font-semibold text-soft underline-offset-2 hover:underline" onClick={() => void alternar()}>
        {aberto ? 'Esconder comentários' : i.comentarios > 0 ? `💬 ${i.comentarios} ${i.comentarios === 1 ? 'comentário' : 'comentários'}` : '💬 Comentar'}
      </button>
      {aberto && (
        <div className="flex flex-col gap-2 animate-fade">
          {comentarios.map((c) => (
            <div key={c.id} className="rounded-2xl bg-bg px-3 py-2">
              <p className="text-xs font-bold text-soft">{c.eh_meu ? 'Você' : c.nome} · {tempoRelativo(c.criado_em)}</p>
              <p className="break-words">{c.texto}</p>
              {c.eh_meu && <button className="min-h-[32px] text-xs text-soft underline" onClick={() => void apagar(c.id)}>Apagar</button>}
            </div>
          ))}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void comentar() }}>
            <input className="field" maxLength={300} placeholder="Escreva um comentário acolhedor…" aria-label="Escrever comentário" value={texto} onChange={(e) => setTexto(e.target.value)} />
            <button className="btn-primary shrink-0" type="submit" disabled={!texto.trim()}>Enviar</button>
          </form>
          {aviso && <p role="status" className="text-sm text-soft">{aviso}</p>}
        </div>
      )}
    </li>
  )
}

export function TarefasDoPaciente({ linkId, compartilhaTarefas }: { linkId: string; compartilhaTarefas: boolean }) {
  const [itens, setItens] = useState<ConclusaoCompartilhada[]>([])
  const [fotos, setFotos] = useState<Record<string, string>>({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.rpc('conclusoes_do_paciente', { p_link: linkId })
    if (error) { setErro(mensagemTerapia(error, 'Não consegui carregar agora.')); setCarregando(false); return }
    const lista = (data ?? []) as ConclusaoCompartilhada[]
    const caminhos = lista.map((i) => i.foto).filter((f): f is string => Boolean(f))
    if (caminhos.length) {
      const { data: urls } = await supabase.storage.from(BUCKET_PROVAS).createSignedUrls(caminhos, 3600)
      const mapa: Record<string, string> = {}
      for (const u of urls ?? []) if (u.path && u.signedUrl) mapa[u.path] = u.signedUrl
      setFotos(mapa)
    }
    setItens(lista)
    setErro(null)
    setCarregando(false)
  }, [linkId])
  useEffect(() => { void carregar() }, [carregar])

  if (!compartilhaTarefas) {
    return <p className="rounded-2xl bg-card p-4 text-soft">Esta pessoa não liberou o compartilhamento de tarefas. Se ela quiser, pode ligar essa chave no app dela.</p>
  }
  if (carregando) return <p className="py-6 text-center text-soft">Carregando…</p>
  return (
    <div className="flex flex-col gap-3">
      {erro && <p role="alert" className="rounded-2xl bg-card p-4 text-soft">{erro}</p>}
      {!erro && itens.length === 0 && <p className="rounded-2xl bg-card p-4 text-soft">Ainda não há tarefas compartilhadas com você. Elas aparecem aqui quando a pessoa escolher mostrar.</p>}
      <ul className="flex flex-col gap-3">
        {itens.map((i) => <Item key={i.completion_id} i={i} fotoUrl={i.foto ? fotos[i.foto] ?? null : null} linkId={linkId} onMudou={() => void carregar()} />)}
      </ul>
    </div>
  )
}
