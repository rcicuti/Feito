import { useState } from 'react'
import { MODOS, type ModoGrupo } from '../../lib/grupos'
import { Folha } from './Folha'

interface Props {
  onFechar: () => void
  onCriar: (nome: string, descricao: string, modo: ModoGrupo) => Promise<string | null> // devolve mensagem de erro
}

export function CriarGrupoSheet({ onFechar, onCriar }: Props) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [modo, setModo] = useState<ModoGrupo>('feed_only')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const valido = nome.trim().length >= 2

  async function criar() {
    setEnviando(true)
    setErro(null)
    const e = await onCriar(nome.trim(), descricao.trim(), modo)
    if (e) { setErro(e); setEnviando(false) }
  }

  return (
    <Folha titulo="Criar grupo" onFechar={onFechar}>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Nome do grupo</span>
        <input className="field" maxLength={60} placeholder="Ex.: Casa em ordem" value={nome} onChange={(e) => setNome(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Descrição <span className="font-normal text-soft">(opcional)</span></span>
        <input className="field" maxLength={200} placeholder="Para que serve o grupo?" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Como o grupo funciona?</legend>
        {(Object.keys(MODOS) as ModoGrupo[]).map((m) => (
          <label key={m} className={`flex items-start gap-3 rounded-2xl border p-4 ${modo === m ? 'border-brand bg-brand/10' : 'border-line bg-card'}`}>
            <input type="radio" name="modo" className="mt-1 accent-[rgb(var(--brand))]" checked={modo === m} onChange={() => setModo(m)} />
            <span>
              <span className="block font-bold">{MODOS[m].emoji} {MODOS[m].rotulo}</span>
              <span className="block text-sm text-soft">{MODOS[m].descricao}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="text-sm text-soft">Só entra no grupo quem tiver o seu convite. Você pode mudar o convite depois.</p>
      {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}
      <button className="btn-primary" disabled={!valido || enviando} onClick={criar}>{enviando ? 'Criando…' : 'Criar grupo'}</button>
    </Folha>
  )
}
