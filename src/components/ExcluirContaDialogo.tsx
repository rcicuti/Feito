import { useState } from 'react'
import { excluirMinhaConta } from '../lib/conta'

interface Props {
  userId: string
  gruposCriados: number
  ehTerapeuta: boolean
  onCancelar: () => void
  onExcluida: () => void
}

const PALAVRA = 'EXCLUIR'

export function ExcluirContaDialogo({ userId, gruposCriados, ehTerapeuta, onCancelar, onExcluida }: Props) {
  const [texto, setTexto] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const ok = texto.trim().toUpperCase() === PALAVRA

  async function excluir() {
    setExcluindo(true)
    setErro(null)
    const r = await excluirMinhaConta(userId)
    if (!r.ok) { setErro(r.erro ?? 'Não consegui excluir agora.'); setExcluindo(false); return }
    onExcluida()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-6 animate-fade" onClick={() => !excluindo && onCancelar()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="exc-titulo" className="my-auto flex w-full max-w-sm flex-col gap-3 rounded-3xl border border-line bg-card p-6 animate-pop" onClick={(e) => e.stopPropagation()}>
        <h2 id="exc-titulo" className="text-xl font-extrabold">Excluir sua conta?</h2>
        <p className="text-soft">Vamos apagar para sempre o seu login e todos os seus dados: tarefas, fotos, pontos, conquistas, participações em grupos, comentários e vínculos com terapeutas. <strong>Isso não tem volta.</strong></p>
        {gruposCriados > 0 && (
          <p className="rounded-2xl bg-bg p-3 text-sm">
            Você criou {gruposCriados === 1 ? '1 grupo' : `${gruposCriados} grupos`}. {gruposCriados === 1 ? 'Ele será apagado' : 'Eles serão apagados'} para todos os membros. Se preferir, avise o grupo antes.
          </p>
        )}
        {ehTerapeuta && <p className="rounded-2xl bg-bg p-3 text-sm">Os vínculos com seus pacientes serão encerrados. Os dados deles continuam só com eles.</p>}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Para confirmar, digite {PALAVRA}</span>
          <input className="field" autoCapitalize="characters" autoComplete="off" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </label>
        {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}
        <button className="btn-primary" disabled={!ok || excluindo} onClick={excluir}>{excluindo ? 'Excluindo…' : 'Excluir minha conta'}</button>
        <button className="btn-ghost" disabled={excluindo} onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  )
}
