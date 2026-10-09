import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { mensagemTerapia } from '../../lib/terapia'
import { Folha } from '../grupo/Folha'
import { Chaves } from './Chaves'

interface Previa { terapeuta_id: string; nome: string; crp: string | null; ja_vinculado: boolean }

interface Props {
  onFechar: () => void
  onVincular: (codigo: string, tarefas: boolean, resumo: boolean) => Promise<{ erro?: string }>
}

// Paciente digita o código do terapeuta, vê quem é e escolhe o que compartilhar ANTES de confirmar
export function VincularSheet({ onFechar, onVincular }: Props) {
  const [codigo, setCodigo] = useState('')
  const [previa, setPrevia] = useState<Previa | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [tarefas, setTarefas] = useState(false)
  const [resumo, setResumo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => { setPrevia(null) }, [codigo])

  async function procurar() {
    setBuscando(true)
    setErro(null)
    const { data, error } = await supabase.rpc('ver_terapeuta_por_codigo', { p_codigo: codigo })
    setBuscando(false)
    if (error) return setErro(mensagemTerapia(error, 'Não consegui verificar agora.'))
    const p = ((data ?? []) as Previa[])[0]
    if (!p) return setErro('Não encontrei esse código. Confira com o(a) terapeuta ou peça um novo.')
    setPrevia(p)
  }

  async function confirmar() {
    setEnviando(true)
    const r = await onVincular(codigo, tarefas, resumo)
    setEnviando(false)
    if (r.erro) setErro(r.erro)
    else setPronto(true)
  }

  return (
    <Folha titulo="Vincular a um(a) terapeuta" onFechar={onFechar}>
      {pronto ? (
        <>
          <p className="rounded-2xl bg-brand/10 p-4">Vínculo criado. Você pode mudar o que compartilha, ou encerrar o vínculo, quando quiser.</p>
          <button className="btn-primary" onClick={onFechar}>Fechar</button>
        </>
      ) : (
        <>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (codigo.trim()) void procurar() }}>
            <input className="field" placeholder="Código do(a) terapeuta" autoCapitalize="characters" autoComplete="off" aria-label="Código do terapeuta" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            <button className="btn-outline shrink-0" type="submit" disabled={buscando || !codigo.trim()}>{buscando ? '…' : 'Ver'}</button>
          </form>
          {erro && <p role="alert" className="rounded-2xl bg-card p-4 text-soft">{erro}</p>}
          {previa && (
            <div className="flex flex-col gap-3">
              <div className="rounded-3xl border border-line bg-card p-5">
                <p className="text-xl font-extrabold">{previa.nome}</p>
                {previa.crp && <p className="text-sm text-soft">CRP informado: {previa.crp} (não verificado pelo app)</p>}
              </div>
              <p className="text-soft">Escolha o que {previa.nome.split(' ')[0]} poderá ver. Por padrão, nada. Você muda isso quando quiser.</p>
              <Chaves tarefas={tarefas} resumo={resumo} onTarefas={setTarefas} onResumo={setResumo} />
              <button className="btn-primary" disabled={enviando || previa.ja_vinculado} onClick={confirmar}>
                {previa.ja_vinculado ? 'Você já tem vínculo com essa pessoa' : enviando ? 'Vinculando…' : 'Aceitar vínculo'}
              </button>
            </div>
          )}
        </>
      )}
    </Folha>
  )
}
