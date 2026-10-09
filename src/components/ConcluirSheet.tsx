import { useEffect, useRef, useState } from 'react'
import { comprimirImagem } from '../lib/image'
import type { Visibilidade } from '../lib/types'
import type { DadosConclusao } from '../hooks/useTarefas'
import type { Grupo } from '../lib/grupos'

const OPCOES: { valor: Visibilidade; rotulo: string }[] = [
  { valor: 'private', rotulo: 'Só eu' },
  { valor: 'therapist', rotulo: 'Meu(minha) terapeuta' },
  { valor: 'group', rotulo: 'Com outras pessoas' },
]

interface Props {
  titulo: string
  grupos: Grupo[]
  onCancelar: () => void
  onConfirmar: (d: DadosConclusao) => Promise<boolean>
}

export function ConcluirSheet({ titulo, grupos, onCancelar, onConfirmar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [foto, setFoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [legenda, setLegenda] = useState('')
  const [visibilidade, setVisibilidade] = useState<Visibilidade>('private')
  const [escolhidos, setEscolhidos] = useState<string[]>([]) // nenhum grupo vem marcado
  const [mostrarFoto, setMostrarFoto] = useState(true)
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

  const semGrupo = visibilidade === 'group' && escolhidos.length === 0
  const alternarGrupo = (id: string) => setEscolhidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]))

  async function concluir(comFoto: boolean) {
    setEnviando(true)
    setErro(null)
    const ok = await onConfirmar({ foto: comFoto ? foto : null, legenda, visibilidade, compartilhar: visibilidade === 'group' ? { grupos: escolhidos, mostrarFoto } : undefined })
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
          {OPCOES.map((o) => {
            const ativo = o.valor === 'private' || (o.valor === 'group' && grupos.length > 0)
            return (
              <label key={o.valor} className={`flex min-h-[48px] items-center gap-3 rounded-2xl border px-4 ${visibilidade === o.valor ? 'border-brand bg-brand/10' : 'border-line bg-card'} ${ativo ? '' : 'opacity-50'}`}>
                <input type="radio" name="visibilidade" className="accent-[rgb(var(--brand))]" disabled={!ativo} checked={visibilidade === o.valor} onChange={() => setVisibilidade(o.valor)} />
                <span className="flex-1 font-semibold">{o.rotulo}</span>
                {!ativo && <span className="text-xs text-soft">{o.valor === 'group' ? 'entre em um grupo' : 'em breve'}</span>}
              </label>
            )
          })}
        </fieldset>

        {visibilidade === 'group' && (
          <fieldset className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
            <legend className="px-1 text-sm font-semibold">Quais grupos podem ver?</legend>
            {grupos.map((g) => (
              <label key={g.id} className="flex min-h-[44px] items-center gap-3">
                <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--brand))]" checked={escolhidos.includes(g.id)} onChange={() => alternarGrupo(g.id)} />
                <span className="font-semibold">{g.nome}</span>
              </label>
            ))}
            <p className="text-xs text-soft">Os grupos escolhidos vão ver o título, a legenda e (se você deixar) a foto. Você pode parar de compartilhar depois.</p>
            {foto && (
              <label className="flex min-h-[44px] items-center gap-3 border-t border-line pt-2">
                <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--brand))]" checked={mostrarFoto} onChange={(e) => setMostrarFoto(e.target.checked)} />
                <span className="font-semibold">Mostrar a foto</span>
              </label>
            )}
            {semGrupo && <p className="text-sm text-soft">Escolha pelo menos um grupo, ou volte para “Só eu”.</p>}
          </fieldset>
        )}

        {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}

        <div className="flex flex-col gap-2">
          <button className="btn-primary" disabled={enviando || processando || semGrupo} onClick={() => concluir(true)}>
            {enviando ? 'Salvando…' : foto ? 'Feito!' : 'Concluir sem foto'}
          </button>
          {foto && (
            <button className="btn-ghost" disabled={enviando || semGrupo} onClick={() => concluir(false)}>Pular a foto</button>
          )}
        </div>
      </div>
    </div>
  )
}
