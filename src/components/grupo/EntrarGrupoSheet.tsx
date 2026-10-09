import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MODOS, mensagemDeErro, type ModoGrupo } from '../../lib/grupos'
import { Folha } from './Folha'

interface Previa { group_id: string; nome: string; descricao: string | null; modo: ModoGrupo; membros: number; ja_membro: boolean }

interface Props {
  codigoInicial?: string
  menor: boolean
  onFechar: () => void
  onEntrar: (codigo: string) => Promise<{ id?: string; erro?: string }>
  onAbrirGrupo: (id: string) => void
}

export function EntrarGrupoSheet({ codigoInicial = '', menor, onFechar, onEntrar, onAbrirGrupo }: Props) {
  const [codigo, setCodigo] = useState(codigoInicial)
  const [previa, setPrevia] = useState<Previa | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function procurar(c: string) {
    setBuscando(true)
    setErro(null)
    setPrevia(null)
    const { data, error } = await supabase.rpc('ver_convite', { p_codigo: c })
    setBuscando(false)
    if (error) return setErro(mensagemDeErro(error, 'Não consegui verificar agora.'))
    const p = ((data ?? []) as Previa[])[0]
    if (!p) return setErro('Esse código não existe ou o convite foi desligado. Peça um novo para quem criou o grupo.')
    setPrevia(p)
  }

  useEffect(() => {
    if (codigoInicial) void procurar(codigoInicial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function entrar() {
    setEntrando(true)
    const r = await onEntrar(codigo)
    if (r.erro || !r.id) { setErro(r.erro ?? 'Não consegui entrar agora.'); setEntrando(false); return }
    onAbrirGrupo(r.id)
  }

  return (
    <Folha titulo="Entrar em um grupo" onFechar={onFechar}>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (codigo.trim()) void procurar(codigo) }}>
        <input className="field" placeholder="Código do convite" autoCapitalize="characters" autoComplete="off" value={codigo} onChange={(e) => setCodigo(e.target.value)} aria-label="Código do convite" />
        <button className="btn-outline shrink-0" type="submit" disabled={buscando || !codigo.trim()}>{buscando ? '…' : 'Ver'}</button>
      </form>

      {erro && <p role="alert" className="rounded-2xl bg-card p-4 text-soft">{erro}</p>}

      {previa && (
        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5">
          <p className="text-xl font-extrabold">{previa.nome}</p>
          {previa.descricao && <p className="text-soft">{previa.descricao}</p>}
          <p className="text-sm text-soft">{MODOS[previa.modo].emoji} {MODOS[previa.modo].rotulo} · {previa.membros} {previa.membros === 1 ? 'pessoa' : 'pessoas'}</p>
          <p className="text-sm text-soft">
            Entrar não compartilha nada automaticamente. Você escolhe, tarefa por tarefa, o que o grupo vai ver.
            {menor && ' Como você é menor de idade, no grupo você pode reagir com emojis, mas não escrever comentários.'}
          </p>
          {previa.ja_membro ? (
            <button className="btn-primary" onClick={() => onAbrirGrupo(previa.group_id)}>Você já está aqui. Abrir grupo</button>
          ) : (
            <button className="btn-primary" disabled={entrando} onClick={entrar}>{entrando ? 'Entrando…' : 'Entrar no grupo'}</button>
          )}
        </div>
      )}
    </Folha>
  )
}
