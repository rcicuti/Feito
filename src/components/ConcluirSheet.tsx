import { useEffect, useRef, useState } from 'react'
import { comprimirImagem } from '../lib/image'
import type { Visibilidade } from '../lib/types'
import type { DadosConclusao } from '../hooks/useTarefas'

const OPCOES: { valor: Visibilidade; rotulo: string; ativo: boolean }[] = [
  { valor: 'private', rotulo: 'Só eu', ativo: true },
  { valor: 'therapist', rotulo: 'Meu(minha) terapeuta', ativo: false },
  { valor: 'group', rotulo: 'Outras pessoas', ativo: false },
]

interface Props {
  titulo: string
  onCancelar: () => void
  onConfirmar: (d: DadosConclusao) => Promise<boolean>
}

export function ConcluirSheet({ titulo, onCancelar, onConfirmar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [foto, setFoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [legenda, setLegenda] = useState('')
  const [visibilidade, setVisibilidade] = useState<Visibilidade>('private')
  const [processando, setProcessando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  async function escolheuFoto(arquivo: File | undefined) {
    if (!arquivo) return
    setProcessando(true)
    setErro(null)
    try {
      const comprimida = await comprimirImagem(arquivo)
      if (preview) URL.revokeObjectURL(preview)
      setFoto(comprimida)
      setPreview(URL.createObjectURL(comprimida))
    } catch {
      setErro('Não consegui usar essa foto. Você pode tentar outra ou concluir sem foto.')
    }
    setProcessando(false)
  }

  async function concluir(comFoto: boolean) {
    setEnviando(true)
    setErro(null)
    const ok = await onConfirmar({ foto: comFoto ? foto : null, legenda, visibilidade })
    if (!ok) {
      setEnviando(false)
      setErro('Não consegui salvar agora. Sua tarefa continua aqui, tente de novo.')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40 animate-fade" onClick={onCancelar}>
      <div
        role="dialog" aria-modal="true" aria-label={`Concluir ${titulo}`}
        className="mx-auto flex max-h-[92%] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl bg-bg p-5 pb-8 animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-extrabold">{titulo}</h2>
          <button className="h-11 w-11 shrink-0 text-xl text-soft" aria-label="Fechar" onClick={onCancelar}>✕</button>
        </div>

        <input
          ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => { void escolheuFoto(e.target.files?.[0]); e.target.value = '' }}
        />

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Prévia da foto da tarefa feita" className="max-h-64 w-full rounded-2xl object-cover" />
            <button className="btn-outline absolute bottom-2 right-2 !min-h-[44px] !py-2 text-sm" onClick={() => inputRef.current?.click()}>Tirar outra</button>
          </div>
        ) : (
          <button className="btn-primary !min-h-[64px] text-lg" disabled={processando} onClick={() => inputRef.current?.click()}>
            {processando ? 'Preparando a foto…' : '📸 Tirar foto da tarefa feita'}
          </button>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Legenda <span className="font-normal text-soft">(opcional)</span></span>
          <input className="field" maxLength={280} placeholder="Como foi?" value={legenda} onChange={(e) => setLegenda(e.target.value)} />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">Quem pode ver?</legend>
          {OPCOES.map((o) => (
            <label key={o.valor} className={`flex min-h-[48px] items-center gap-3 rounded-2xl border px-4 ${visibilidade === o.valor ? 'border-brand bg-brand/10' : 'border-line bg-card'} ${o.ativo ? '' : 'opacity-50'}`}>
              <input type="radio" name="visibilidade" className="accent-[rgb(var(--brand))]" disabled={!o.ativo} checked={visibilidade === o.valor} onChange={() => setVisibilidade(o.valor)} />
              <span className="flex-1 font-semibold">{o.rotulo}</span>
              {!o.ativo && <span className="text-xs text-soft">em breve</span>}
            </label>
          ))}
        </fieldset>

        {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}

        <div className="flex flex-col gap-2">
          <button className="btn-primary" disabled={enviando || processando} onClick={() => concluir(true)}>
            {enviando ? 'Salvando…' : foto ? 'Feito!' : 'Concluir sem foto'}
          </button>
          {foto && (
            <button className="btn-ghost" disabled={enviando} onClick={() => concluir(false)}>Pular a foto</button>
          )}
        </div>
      </div>
    </div>
  )
}
