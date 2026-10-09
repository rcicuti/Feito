import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { tempoRelativo } from '../../lib/grupos'

interface Linha { id: string; title: string; note: string | null; status: 'pending' | 'accepted'; created_at: string }

export function SugerirTarefa({ linkId, pacienteId, meuId, nomePaciente }: { linkId: string; pacienteId: string; meuId: string; nomePaciente: string }) {
  const [titulo, setTitulo] = useState('')
  const [nota, setNota] = useState('')
  const [lista, setLista] = useState<Linha[]>([])
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('suggested_tasks').select('id, title, note, status, created_at').eq('link_id', linkId).order('created_at', { ascending: false }).limit(30)
    setLista((data ?? []) as Linha[])
  }, [linkId])
  useEffect(() => { void carregar() }, [carregar])

  async function enviar() {
    setEnviando(true)
    const { error } = await supabase.from('suggested_tasks').insert({
      link_id: linkId, therapist_id: meuId, patient_id: pacienteId, title: titulo.trim(), note: nota.trim() || null,
    })
    setEnviando(false)
    if (error) return setAviso('Não consegui enviar. Pode haver 10 sugestões esperando resposta; aguarde ou retire alguma.')
    setTitulo(''); setNota(''); setAviso('Sugestão enviada. Ela só entra na lista se a pessoa aceitar.')
    await carregar()
  }

  async function retirar(id: string) {
    await supabase.from('suggested_tasks').delete().eq('id', id)
    await carregar()
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-soft">Sugira uma tarefa pequena e clara. {nomePaciente.split(' ')[0]} decide se coloca na lista; nada entra sozinho.</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Tarefa</span>
        <input className="field" maxLength={120} placeholder="Ex.: Arrumar só a mesa de trabalho" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Recado <span className="font-normal text-soft">(opcional)</span></span>
        <input className="field" maxLength={200} placeholder="Uma frase gentil" value={nota} onChange={(e) => setNota(e.target.value)} />
      </label>
      <button className="btn-primary" disabled={titulo.trim().length < 2 || enviando} onClick={enviar}>{enviando ? 'Enviando…' : 'Enviar sugestão'}</button>
      {aviso && <p role="status" className="text-sm text-soft">{aviso}</p>}
      {lista.length > 0 && (
        <ul className="flex flex-col gap-2">
          {lista.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-card px-4 py-3">
              <div className="min-w-0">
                <p className="break-words font-bold">{s.title}</p>
                <p className="text-xs text-soft">{s.status === 'accepted' ? '✓ entrou na lista da pessoa' : `aguardando · ${tempoRelativo(s.created_at)}`}</p>
              </div>
              {s.status === 'pending' && <button className="btn-ghost !min-h-[44px] !py-2 text-sm shrink-0" onClick={() => void retirar(s.id)}>Retirar</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
