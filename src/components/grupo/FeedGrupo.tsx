import { useCallback, useEffect, useState } from 'react'
import { supabase, BUCKET_PROVAS } from '../../lib/supabase'
import { mensagemDeErro, type ItemFeed } from '../../lib/grupos'
import { ItemFeedCard } from './ItemFeedCard'

const PAGINA = 20

interface Props { grupoId: string; meuId: string; souDono: boolean; menor: boolean }

export function FeedGrupo({ grupoId, meuId, souDono, menor }: Props) {
  const [itens, setItens] = useState<ItemFeed[]>([])
  const [fotos, setFotos] = useState<Record<string, string>>({})
  const [carregando, setCarregando] = useState(true)
  const [temMais, setTemMais] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const buscar = useCallback(async (antes: string | null) => {
    const { data, error } = await supabase.rpc('feed_do_grupo', { p_group: grupoId, p_limite: PAGINA, p_antes: antes })
    if (error) { setErro(mensagemDeErro(error, 'Não consegui carregar o feed.')); return null }
    const lista = (data ?? []) as ItemFeed[]
    const caminhos = lista.map((i) => i.foto).filter((f): f is string => Boolean(f))
    if (caminhos.length) {
      const { data: urls } = await supabase.storage.from(BUCKET_PROVAS).createSignedUrls(caminhos, 3600)
      const mapa: Record<string, string> = {}
      for (const u of urls ?? []) if (u.path && u.signedUrl) mapa[u.path] = u.signedUrl
      setFotos((f) => ({ ...f, ...mapa }))
    }
    setErro(null)
    return lista
  }, [grupoId])

  const recarregar = useCallback(async () => {
    const lista = await buscar(null)
    if (lista) { setItens(lista); setTemMais(lista.length === PAGINA) }
    setCarregando(false)
  }, [buscar])

  useEffect(() => { void recarregar() }, [recarregar])

  async function maisAntigos() {
    const ultimo = itens[itens.length - 1]
    if (!ultimo) return
    const lista = await buscar(ultimo.compartilhada_em)
    if (lista) { setItens((i) => [...i, ...lista]); setTemMais(lista.length === PAGINA) }
  }

  if (carregando) return <p className="py-6 text-center text-soft">Carregando o feed…</p>
  return (
    <section aria-label="Feed do grupo" className="flex flex-col gap-3">
      {erro && <p role="alert" className="rounded-2xl bg-card p-4 text-soft">{erro}</p>}
      {!erro && itens.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-soft">
          <span className="text-5xl" aria-hidden>🌱</span>
          <p className="text-lg font-semibold text-ink">Ainda não há nada por aqui.</p>
          <p>Ao concluir uma tarefa, escolha “Com outras pessoas” e este grupo para compartilhar.</p>
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {itens.map((i) => (
          <ItemFeedCard key={i.completion_id} item={i} fotoUrl={i.foto ? fotos[i.foto] ?? null : null} grupoId={grupoId} meuId={meuId} souDono={souDono} menor={menor} onMudou={() => void recarregar()} />
        ))}
      </ul>
      {temMais && <button className="btn-outline" onClick={() => void maisAntigos()}>Ver mais antigos</button>}
    </section>
  )
}
