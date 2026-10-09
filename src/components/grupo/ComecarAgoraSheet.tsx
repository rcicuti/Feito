import { useState } from 'react'
import type { Grupo } from '../../lib/grupos'
import { Folha } from './Folha'

const CHAVE = 'feito-agora-grupos'

function lembrados(grupos: Grupo[]): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(CHAVE) ?? '[]') as string[]
    return ids.filter((id) => grupos.some((g) => g.id === id))
  } catch { return [] }
}

interface Props {
  titulo: string
  grupos: Grupo[]
  onFechar: () => void
  onConfirmar: (grupos: string[]) => Promise<string | null>
}

export function ComecarAgoraSheet({ titulo, grupos, onFechar, onConfirmar }: Props) {
  const [escolhidos, setEscolhidos] = useState<string[]>(() => lembrados(grupos))
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function alternar(id: string) {
    setEscolhidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]))
  }

  async function avisar() {
    setEnviando(true)
    const e = await onConfirmar(escolhidos)
    if (e) { setErro(e); setEnviando(false); return }
    try { localStorage.setItem(CHAVE, JSON.stringify(escolhidos)) } catch { /* tudo bem */ }
  }

  return (
    <Folha titulo="Estou começando agora" onFechar={onFechar}>
      <p className="text-soft">Avise quem está nos seus grupos e faça junto. Quem estiver nesses grupos vai ver seu <strong>nome</strong> e o <strong>título da tarefa</strong> “{titulo}” por 45 minutos, ou até você concluir ou parar.</p>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Quais grupos podem ver?</legend>
        {grupos.map((g) => (
          <label key={g.id} className={`flex min-h-[48px] items-center gap-3 rounded-2xl border px-4 ${escolhidos.includes(g.id) ? 'border-brand bg-brand/10' : 'border-line bg-card'}`}>
            <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--brand))]" checked={escolhidos.includes(g.id)} onChange={() => alternar(g.id)} />
            <span className="font-semibold">{g.nome}</span>
          </label>
        ))}
      </fieldset>
      {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}
      <button className="btn-primary" disabled={enviando || escolhidos.length === 0} onClick={avisar}>{enviando ? 'Avisando…' : 'Avisar e começar'}</button>
    </Folha>
  )
}
