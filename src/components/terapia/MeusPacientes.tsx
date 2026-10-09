import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { EstadoAcompanhamento } from '../../hooks/useAcompanhamento'
import { formatarCodigoTerapia, mensagemTerapia } from '../../lib/terapia'
import { PacienteDetalhe } from './PacienteDetalhe'

export function MeusPacientes({ est, meuId }: { est: EstadoAcompanhamento; meuId: string }) {
  const [codigo, setCodigo] = useState<string | null>(null)
  const [digitado, setDigitado] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)

  useEffect(() => {
    void supabase.from('therapist_codes').select('code').eq('therapist_id', meuId).maybeSingle().then(({ data }) => setCodigo((data?.code as string) ?? null))
  }, [meuId])

  async function copiar() {
    if (!codigo) return
    try { await navigator.clipboard.writeText(codigo); setAviso('Código copiado!') } catch { setAviso('Não consegui copiar. Selecione o código e copie.') }
  }

  async function renovar() {
    const { data, error } = await supabase.rpc('renovar_codigo_terapeuta')
    if (error) return setAviso(mensagemTerapia(error))
    setCodigo(data as string)
    setAviso('Código novo criado. O antigo deixou de funcionar.')
  }

  async function pedir() {
    const r = await est.pedirVinculo(digitado)
    if (r.erro) setAviso(r.erro)
    else { setDigitado(''); setAviso('Pedido enviado. Ele só vale quando a pessoa aceitar.') }
  }

  const v = est.pacientes.find((p) => p.link_id === aberto)
  if (v) return <PacienteDetalhe v={v} est={est} meuId={meuId} onVoltar={() => setAberto(null)} />

  return (
    <section className="flex flex-col gap-4" aria-label="Meus pacientes">
      <div className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5">
        <h2 className="text-lg font-extrabold">Seu código</h2>
        {codigo ? <p className="select-all text-center text-3xl font-extrabold tracking-widest">{formatarCodigoTerapia(codigo)}</p> : <p className="text-soft">Carregando…</p>}
        <p className="text-sm text-soft">Entregue ao(à) paciente. Ele(a) digita no app, vê quem você é e escolhe o que compartilha. Nada é compartilhado sem a pessoa aceitar.</p>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={!codigo} onClick={() => void copiar()}>Copiar código</button>
          <button className="btn-outline" onClick={() => void renovar()}>Trocar</button>
        </div>
      </div>

      <form className="flex flex-col gap-2 rounded-3xl border border-line bg-card p-5" onSubmit={(e) => { e.preventDefault(); if (digitado.trim()) void pedir() }}>
        <h2 className="text-lg font-extrabold">Tenho o código de um(a) paciente</h2>
        <div className="flex gap-2">
          <input className="field" placeholder="Código do(a) paciente" autoCapitalize="characters" autoComplete="off" aria-label="Código do paciente" value={digitado} onChange={(e) => setDigitado(e.target.value)} />
          <button className="btn-outline shrink-0" type="submit" disabled={!digitado.trim()}>Enviar</button>
        </div>
      </form>
      {aviso && <p role="status" className="rounded-2xl bg-brand/10 p-3 text-sm">{aviso}</p>}

      {est.pacientes.length === 0 ? (
        <p className="rounded-2xl bg-card p-4 text-soft">Nenhum paciente vinculado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {est.pacientes.map((p) => (
            <li key={p.link_id}>
              <button className="flex w-full items-center justify-between gap-2 rounded-3xl border border-line bg-card p-4 text-left" onClick={() => setAberto(p.link_id)}>
                <span className="min-w-0">
                  <span className="block break-words text-lg font-extrabold">{p.nome}</span>
                  <span className="block text-sm text-soft">
                    {p.status === 'pending' ? 'aguardando a pessoa aceitar' : [p.share_tasks && 'tarefas', p.share_summary && 'resumo'].filter(Boolean).join(' e ') || 'nada compartilhado ainda'}
                  </span>
                </span>
                <span aria-hidden className="text-soft">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
