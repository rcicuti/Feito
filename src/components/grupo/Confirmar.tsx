import { useState } from 'react'

interface Props {
  titulo: string
  texto: string
  confirmar: string
  onConfirmar: () => Promise<void> | void
  onCancelar: () => void
}

export function Confirmar({ titulo, texto, confirmar, onConfirmar, onCancelar }: Props) {
  const [ocupado, setOcupado] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 animate-fade" onClick={() => !ocupado && onCancelar()}>
      <div role="alertdialog" aria-modal="true" aria-label={titulo} className="flex w-full max-w-sm flex-col gap-3 rounded-3xl border border-line bg-card p-6 animate-pop" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-extrabold">{titulo}</h2>
        <p className="text-soft">{texto}</p>
        <button className="btn-primary" disabled={ocupado} onClick={async () => { setOcupado(true); await onConfirmar(); setOcupado(false) }}>{ocupado ? 'Um instante…' : confirmar}</button>
        <button className="btn-ghost" disabled={ocupado} onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  )
}
