import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatarCodigo, linkConvite, mensagemDeErro } from '../../lib/grupos'

export function ConviteCard({ grupoId, grupoNome }: { grupoId: string; grupoNome: string }) {
  const [codigo, setCodigo] = useState<string | null>(null)
  const [ativo, setAtivo] = useState(true)
  const [aviso, setAviso] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('group_invites').select('code, enabled').eq('group_id', grupoId).maybeSingle()
    if (data) { setCodigo(data.code as string); setAtivo(data.enabled as boolean) }
  }, [grupoId])

  useEffect(() => { void carregar() }, [carregar])

  async function copiar(texto: string, msg: string) {
    try { await navigator.clipboard.writeText(texto); setAviso(msg) } catch { setAviso('Não consegui copiar. Selecione e copie manualmente.') }
  }

  async function compartilhar() {
    if (!codigo) return
    const texto = `Venha fazer tarefas comigo no grupo “${grupoNome}” do Feito! ${linkConvite(codigo)}`
    if (navigator.share) {
      try { await navigator.share({ text: texto }) } catch { /* pessoa cancelou */ }
    } else {
      await copiar(texto, 'Convite copiado!')
    }
  }

  async function alternar() {
    const novo = !ativo
    const { error } = await supabase.from('group_invites').update({ enabled: novo }).eq('group_id', grupoId)
    if (error) return setAviso('Não consegui mudar agora.')
    setAtivo(novo)
    setAviso(novo ? 'Convite ligado.' : 'Convite desligado. Ninguém novo consegue entrar.')
  }

  async function renovar() {
    const { data, error } = await supabase.rpc('renovar_convite', { p_group: grupoId })
    if (error) return setAviso(mensagemDeErro(error))
    setCodigo(data as string)
    setAtivo(true)
    setAviso('Código novo criado. O antigo deixou de funcionar.')
  }

  if (!codigo) return null
  return (
    <section aria-label="Convite" className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5">
      <h2 className="text-lg font-extrabold">Convidar pessoas</h2>
      <p className="select-all text-center text-3xl font-extrabold tracking-widest">{formatarCodigo(codigo)}</p>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary flex-1" disabled={!ativo} onClick={compartilhar}>📤 Enviar convite</button>
        <button className="btn-outline" disabled={!ativo} onClick={() => void copiar(codigo, 'Código copiado!')}>Copiar código</button>
      </div>
      {aviso && <p role="status" className="text-sm text-soft">{aviso}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost !min-h-[44px] !py-2 text-sm" onClick={alternar}>{ativo ? 'Desligar convite' : 'Ligar convite'}</button>
        <button className="btn-ghost !min-h-[44px] !py-2 text-sm" onClick={renovar}>Trocar código</button>
      </div>
    </section>
  )
}
