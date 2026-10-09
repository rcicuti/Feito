import { useState } from 'react'
import type { VinculoTerapeuta } from '../../lib/terapia'
import { Folha } from '../grupo/Folha'
import { Chaves } from './Chaves'

export function AceitarPedidoSheet({ pedido, onFechar, onAceitar }: {
  pedido: VinculoTerapeuta
  onFechar: () => void
  onAceitar: (tarefas: boolean, resumo: boolean) => Promise<{ erro?: string }>
}) {
  const [tarefas, setTarefas] = useState(false)
  const [resumo, setResumo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aceitar() {
    setEnviando(true)
    const r = await onAceitar(tarefas, resumo)
    if (r.erro) { setErro(r.erro); setEnviando(false) }
  }

  return (
    <Folha titulo="Aceitar vínculo" onFechar={onFechar}>
      <div className="rounded-3xl border border-line bg-card p-5">
        <p className="text-xl font-extrabold">{pedido.nome}</p>
        {pedido.crp && <p className="text-sm text-soft">CRP informado: {pedido.crp} (não verificado pelo app)</p>}
      </div>
      <p className="text-soft">Escolha o que essa pessoa poderá ver. Por padrão, nada. Você muda isso quando quiser.</p>
      <Chaves tarefas={tarefas} resumo={resumo} onTarefas={setTarefas} onResumo={setResumo} />
      {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}
      <button className="btn-primary" disabled={enviando} onClick={aceitar}>{enviando ? 'Aceitando…' : 'Aceitar vínculo'}</button>
    </Folha>
  )
}
