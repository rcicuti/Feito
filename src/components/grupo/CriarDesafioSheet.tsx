import { useState } from 'react'
import { hojeISO } from '../../lib/dates'
import type { ModoGrupo } from '../../lib/grupos'
import { Folha } from './Folha'

interface Dados { title: string; description: string; starts_on: string; ends_on: string; goal_points: number | null }

function maisDias(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return hojeISO(d)
}

export function CriarDesafioSheet({ modo, onFechar, onCriar }: { modo: ModoGrupo; onFechar: () => void; onCriar: (d: Dados) => Promise<string | null> }) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [inicio, setInicio] = useState(hojeISO())
  const [fim, setFim] = useState(maisDias(hojeISO(), 6))
  const [meta, setMeta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const dias = Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 86400000)
  const periodoOk = fim >= inicio && dias <= 90
  const valido = titulo.trim().length >= 2 && periodoOk

  async function criar() {
    setEnviando(true)
    const n = parseInt(meta, 10)
    const e = await onCriar({ title: titulo.trim(), description: descricao.trim(), starts_on: inicio, ends_on: fim, goal_points: modo === 'cooperative' && n > 0 ? n : null })
    if (e) { setErro(e); setEnviando(false) }
  }

  return (
    <Folha titulo="Novo desafio" onFechar={onFechar}>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Nome do desafio</span>
        <input className="field" maxLength={80} placeholder="Ex.: Semana da casa em ordem" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Descrição <span className="font-normal text-soft">(opcional)</span></span>
        <input className="field" maxLength={200} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Começa em</span>
          <input type="date" className="field" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Termina em</span>
          <input type="date" className="field" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} />
        </label>
      </div>
      {!periodoOk && <p className="text-sm text-soft">O fim precisa ser depois do começo, com no máximo 90 dias.</p>}
      {modo === 'cooperative' && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Meta do grupo em pontos <span className="font-normal text-soft">(opcional)</span></span>
          <input className="field" inputMode="numeric" placeholder="Ex.: 300" value={meta} onChange={(e) => setMeta(e.target.value.replace(/\D/g, '').slice(0, 6))} />
        </label>
      )}
      <p className="text-sm text-soft">Só contam as tarefas que as pessoas compartilharem com este grupo durante o período.</p>
      {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}
      <button className="btn-primary" disabled={!valido || enviando} onClick={criar}>{enviando ? 'Criando…' : 'Criar desafio'}</button>
    </Folha>
  )
}
