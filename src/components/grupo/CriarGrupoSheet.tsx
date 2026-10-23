import { useState } from 'react'
import { MODOS, type ModoGrupo } from '../../lib/grupos'
import { Folha } from './Folha'

interface Props {
  inicial?: { nome: string; descricao: string; modo: ModoGrupo } // quando existe, a folha vira "Editar grupo"
  onFechar: () => void
  onCriar: (nome: string, descricao: string, modo: ModoGrupo) => Promise<string | null> // devolve mensagem de erro
}

export function CriarGrupoSheet({ inicial, onFechar, onCriar }: Props) {
  const editando = Boolean(inicial)
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '')
  const [modo, setModo] = useState<ModoGrupo>(inicial?.modo ?? 'feed_only')
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
    <Folha titulo={editando ? 'Editar grupo' : 'Criar grupo'} onFechar={onFechar}>
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
      {editando && modo !== inicial?.modo ? (
        <p className="rounded-2xl bg-card p-3 text-sm text-soft">Mudar o modo vale para todo mundo do grupo, na hora. Nada se perde: pontos e tarefas compartilhadas continuam, só muda o que o grupo mostra (placar, meta ou só o feed).</p>
      ) : (
        <p className="text-sm text-soft">{editando ? 'Quem já está no grupo vê as mudanças na hora.' : 'Só entra no grupo quem tiver o seu convite. Você pode mudar o convite depois.'}</p>
      )}
      {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}
      <button className="btn-primary" disabled={!valido || enviando} onClick={criar}>{enviando ? (editando ? 'Salvando…' : 'Criando…') : editando ? 'Salvar' : 'Criar grupo'}</button>
    </Folha>
  )
}
