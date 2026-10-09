import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

interface Restricao { user_id: string; nome: string; tipo: 'bloqueado' | 'silenciado' }

// Perfil: esconder rankings + pessoas bloqueadas/silenciadas
export function PrivacidadePerfil() {
  const { user, profile, recarregarPerfil } = useAuth()
  const [restricoes, setRestricoes] = useState<Restricao[]>([])
  const [aviso, setAviso] = useState<string | null>(null)
  const escondendo = Boolean(profile?.hide_rankings)

  const carregar = useCallback(async () => {
    const { data } = await supabase.rpc('minhas_restricoes')
    setRestricoes((data ?? []) as Restricao[])
  }, [])
  useEffect(() => { void carregar() }, [carregar])

  async function alternarRankings() {
    const { error } = await supabase.from('profiles').update({ hide_rankings: !escondendo }).eq('id', user!.id)
    if (error) return setAviso('Não consegui mudar agora. Confira se rodou o SQL 0004 no Supabase.')
    await recarregarPerfil()
    setAviso(!escondendo ? 'Pronto. Você não vê rankings e não aparece neles.' : 'Rankings ligados de novo.')
  }

  async function desfazer(r: Restricao) {
    const q = r.tipo === 'bloqueado'
      ? supabase.from('blocks').delete().match({ blocker_id: user!.id, blocked_id: r.user_id })
      : supabase.from('mutes').delete().match({ muter_id: user!.id, muted_id: r.user_id })
    const { error } = await q
    if (error) return setAviso('Não consegui desfazer agora.')
    await carregar()
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5" aria-label="Privacidade em grupos">
      <h2 className="text-lg font-extrabold">Grupos e privacidade</h2>
      <label className="flex min-h-[48px] items-start gap-3">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--brand))]" checked={escondendo} onChange={() => void alternarRankings()} />
        <span>
          <span className="block font-semibold">Esconder rankings</span>
          <span className="block text-sm text-soft">Você não vê placares de competição e também não aparece neles. Metas em conjunto e feed continuam normais.</span>
        </span>
      </label>
      {aviso && <p role="status" className="rounded-2xl bg-brand/10 p-3 text-sm">{aviso}</p>}
      {restricoes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Pessoas silenciadas e bloqueadas</p>
          <ul className="flex flex-col gap-2">
            {restricoes.map((r) => (
              <li key={`${r.tipo}-${r.user_id}`} className="flex items-center justify-between gap-2 rounded-2xl bg-bg px-3 py-2">
                <span className="min-w-0 break-words"><strong>{r.nome}</strong> <span className="text-sm text-soft">· {r.tipo}</span></span>
                <button className="btn-outline !min-h-[44px] !py-2 text-sm shrink-0" onClick={() => void desfazer(r)}>Desfazer</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
