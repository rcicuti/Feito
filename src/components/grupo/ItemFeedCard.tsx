import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { REACOES, mensagemDeErro, tempoRelativo, type Comentario, type ItemFeed } from '../../lib/grupos'
import { DenunciarSheet } from './DenunciarSheet'
import { Confirmar } from './Confirmar'

interface Props {
  item: ItemFeed
  fotoUrl: string | null
  grupoId: string
  meuId: string
  souDono: boolean
  menor: boolean
  onMudou: () => void // recarrega o feed
}

export function ItemFeedCard({ item, fotoUrl, grupoId, meuId, souDono, menor, onMudou }: Props) {
  const [reacoes, setReacoes] = useState(item.reacoes ?? {})
  const [minhas, setMinhas] = useState<string[]>(item.minhas_reacoes ?? [])
  const [menu, setMenu] = useState(false)
  const [comentariosAbertos, setComentariosAbertos] = useState(false)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [qtd, setQtd] = useState(item.comentarios)
  const [texto, setTexto] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [denunciando, setDenunciando] = useState(false)
  const [confirmando, setConfirmando] = useState<'bloquear' | 'descompartilhar' | 'remover' | null>(null)

  useEffect(() => {
    setReacoes(item.reacoes ?? {})
    setMinhas(item.minhas_reacoes ?? [])
    setQtd(item.comentarios)
  }, [item])

  async function reagir(codigo: string) {
    const tinha = minhas.includes(codigo)
    // atualiza na hora; desfaz se der erro
    setMinhas((m) => (tinha ? m.filter((x) => x !== codigo) : [...m, codigo]))
    setReacoes((r) => ({ ...r, [codigo]: Math.max(0, (r[codigo] ?? 0) + (tinha ? -1 : 1)) }))
    const { error } = tinha
      ? await supabase.from('reactions').delete().match({ completion_id: item.completion_id, group_id: grupoId, user_id: meuId, emoji: codigo })
      : await supabase.from('reactions').insert({ completion_id: item.completion_id, group_id: grupoId, user_id: meuId, emoji: codigo })
    if (error) {
      setAviso('Não consegui reagir agora.')
      onMudou()
    }
  }

  async function carregarComentarios() {
    const { data, error } = await supabase.rpc('comentarios_da_conclusao', { p_completion: item.completion_id, p_group: grupoId })
    if (error) return setAviso(mensagemDeErro(error, 'Não consegui carregar os comentários.'))
    const lista = (data ?? []) as Comentario[]
    setComentarios(lista)
    setQtd(lista.length)
  }

  async function alternarComentarios() {
    const abrir = !comentariosAbertos
    setComentariosAbertos(abrir)
    if (abrir) await carregarComentarios()
  }

  async function comentar() {
    const t = texto.trim()
    if (!t) return
    const { error } = await supabase.from('comments').insert({ completion_id: item.completion_id, group_id: grupoId, user_id: meuId, body: t })
    if (error) return setAviso('Não consegui comentar agora.')
    setTexto('')
    await carregarComentarios()
  }

  async function apagarComentario(id: string) {
    await supabase.from('comments').delete().eq('id', id)
    await carregarComentarios()
  }

  async function silenciar() {
    setMenu(false)
    const { error } = await supabase.from('mutes').insert({ muter_id: meuId, muted_id: item.user_id })
    if (error) return setAviso('Não consegui silenciar agora.')
    onMudou()
  }

  async function bloquear() {
    const { error } = await supabase.from('blocks').insert({ blocker_id: meuId, blocked_id: item.user_id })
    setConfirmando(null)
    if (error) return setAviso('Não consegui bloquear agora.')
    onMudou()
  }

  async function descompartilhar() {
    const { error } = await supabase.from('completion_shares').delete().eq('completion_id', item.completion_id).eq('group_id', grupoId)
    setConfirmando(null)
    if (error) return setAviso('Não consegui tirar do grupo agora.')
    onMudou()
  }

  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-extrabold">{item.eh_meu ? 'Você' : item.nome}</p>
          <p className="text-xs text-soft">{tempoRelativo(item.compartilhada_em)} · +{item.pontos} pontos</p>
        </div>
        <button className="h-11 w-11 shrink-0 rounded-full text-xl text-soft" aria-label="Mais opções" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>⋯</button>
      </div>

      {menu && (
        <div className="flex flex-wrap gap-2 animate-fade">
          {item.eh_meu ? (
            <button className="btn-outline !min-h-[44px] !py-2 text-sm" onClick={() => { setMenu(false); setConfirmando('descompartilhar') }}>Parar de compartilhar com este grupo</button>
          ) : (
            <>
              <button className="btn-outline !min-h-[44px] !py-2 text-sm" onClick={() => { setMenu(false); setDenunciando(true) }}>Denunciar</button>
              <button className="btn-outline !min-h-[44px] !py-2 text-sm" onClick={() => void silenciar()}>Silenciar</button>
              <button className="btn-outline !min-h-[44px] !py-2 text-sm" onClick={() => { setMenu(false); setConfirmando('bloquear') }}>Bloquear</button>
              {souDono && <button className="btn-outline !min-h-[44px] !py-2 text-sm" onClick={() => { setMenu(false); setConfirmando('remover') }}>Tirar do grupo</button>}
            </>
          )}
        </div>
      )}

      <div>
        <p className="break-words text-lg font-bold leading-snug">✓ {item.titulo}</p>
        {item.legenda && <p className="mt-1 break-words text-soft">{item.legenda}</p>}
      </div>

      {fotoUrl && <img src={fotoUrl} alt={`Foto de ${item.eh_meu ? 'você' : item.nome} concluindo: ${item.titulo}`} loading="lazy" className="max-h-80 w-full rounded-2xl object-cover" />}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Reações">
        {REACOES.map((r) => {
          const n = reacoes[r.codigo] ?? 0
          const eu = minhas.includes(r.codigo)
          return (
            <button key={r.codigo} aria-pressed={eu} aria-label={`${r.nome}${n ? `, ${n}` : ''}`} onClick={() => void reagir(r.codigo)}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full border px-3 text-lg active:scale-95 ${eu ? 'border-brand bg-brand/15' : 'border-line bg-bg'}`}>
              <span aria-hidden>{r.emoji}</span>{n > 0 && <span className="text-sm font-bold">{n}</span>}
            </button>
          )
        })}
      </div>

      <button className="self-start text-sm font-semibold text-soft underline-offset-2 hover:underline min-h-[44px]" onClick={() => void alternarComentarios()}>
        {comentariosAbertos ? 'Esconder comentários' : qtd > 0 ? `💬 ${qtd} ${qtd === 1 ? 'comentário' : 'comentários'}` : menor ? 'Ver comentários' : '💬 Comentar'}
      </button>

      {comentariosAbertos && (
        <div className="flex flex-col gap-2 animate-fade">
          {comentarios.map((c) => (
            <div key={c.id} className="rounded-2xl bg-bg px-3 py-2">
              <p className="text-xs font-bold text-soft">{c.eh_meu ? 'Você' : c.nome} · {tempoRelativo(c.criado_em)}</p>
              <p className="break-words">{c.texto}</p>
              {c.posso_apagar && <button className="text-xs text-soft underline min-h-[32px]" onClick={() => void apagarComentario(c.id)}>Apagar</button>}
            </div>
          ))}
          {!menor ? (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void comentar() }}>
              <input className="field" maxLength={200} placeholder="Escreva algo gentil…" aria-label="Escrever comentário" value={texto} onChange={(e) => setTexto(e.target.value)} />
              <button className="btn-primary shrink-0" type="submit" disabled={!texto.trim()}>Enviar</button>
            </form>
          ) : (
            <p className="text-xs text-soft">Por segurança, menores de idade reagem com emojis e não escrevem comentários.</p>
          )}
        </div>
      )}

      {aviso && <p role="status" className="text-sm text-soft">{aviso}</p>}

      {denunciando && <DenunciarSheet meuId={meuId} alvo={{ userId: item.user_id, grupoId, completionId: item.completion_id }} onFechar={() => setDenunciando(false)} />}
      {confirmando === 'bloquear' && (
        <Confirmar titulo={`Bloquear ${item.nome}?`} texto="Vocês deixam de ver o que o outro compartilha e de interagir. Você pode desbloquear no seu perfil." confirmar="Bloquear" onConfirmar={bloquear} onCancelar={() => setConfirmando(null)} />
      )}
      {confirmando === 'descompartilhar' && (
        <Confirmar titulo="Parar de compartilhar?" texto="Esta tarefa deixa de aparecer neste grupo, junto com reações e comentários. Ela continua com você." confirmar="Parar de compartilhar" onConfirmar={descompartilhar} onCancelar={() => setConfirmando(null)} />
      )}
      {confirmando === 'remover' && (
        <Confirmar titulo="Tirar do grupo?" texto="Esta publicação deixa de aparecer no grupo. A pessoa não é removida." confirmar="Tirar" onConfirmar={descompartilhar} onCancelar={() => setConfirmando(null)} />
      )}
    </li>
  )
}
