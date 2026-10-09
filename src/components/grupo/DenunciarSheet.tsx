import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Folha } from './Folha'

const MOTIVOS = [
  { codigo: 'desrespeito', rotulo: 'Desrespeito ou agressão' },
  { codigo: 'conteudo_inadequado', rotulo: 'Conteúdo inadequado' },
  { codigo: 'spam', rotulo: 'Spam' },
  { codigo: 'outro', rotulo: 'Outro motivo' },
]

interface Alvo { userId: string; grupoId: string; completionId?: string; commentId?: string }

export function DenunciarSheet({ meuId, alvo, onFechar }: { meuId: string; alvo: Alvo; onFechar: () => void }) {
  const [motivo, setMotivo] = useState('desrespeito')
  const [detalhes, setDetalhes] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar() {
    setEnviando(true)
    const { error } = await supabase.from('reports').insert({
      reporter_id: meuId,
      reported_user_id: alvo.userId,
      group_id: alvo.grupoId,
      completion_id: alvo.completionId ?? null,
      comment_id: alvo.commentId ?? null,
      reason: motivo,
      details: detalhes.trim() || null,
    })
    setEnviando(false)
    if (error) setErro('Não consegui enviar agora. Tente de novo em instantes.')
    else setPronto(true)
  }

  return (
    <Folha titulo="Denunciar" onFechar={onFechar}>
      {pronto ? (
        <>
          <p className="rounded-2xl bg-brand/10 p-4">Obrigado por avisar. Recebemos a denúncia e vamos olhar com cuidado. Se quiser, você também pode silenciar ou bloquear essa pessoa.</p>
          <button className="btn-primary" onClick={onFechar}>Fechar</button>
        </>
      ) : (
        <>
          <p className="text-soft">A pessoa não fica sabendo que você denunciou.</p>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Motivo</legend>
            {MOTIVOS.map((m) => (
              <label key={m.codigo} className={`flex min-h-[48px] items-center gap-3 rounded-2xl border px-4 ${motivo === m.codigo ? 'border-brand bg-brand/10' : 'border-line bg-card'}`}>
                <input type="radio" name="motivo" className="accent-[rgb(var(--brand))]" checked={motivo === m.codigo} onChange={() => setMotivo(m.codigo)} />
                <span className="font-semibold">{m.rotulo}</span>
              </label>
            ))}
          </fieldset>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Quer contar mais? <span className="font-normal text-soft">(opcional)</span></span>
            <textarea className="field min-h-[96px]" maxLength={500} value={detalhes} onChange={(e) => setDetalhes(e.target.value)} />
          </label>
          {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}
          <button className="btn-primary" disabled={enviando} onClick={enviar}>{enviando ? 'Enviando…' : 'Enviar denúncia'}</button>
        </>
      )}
    </Folha>
  )
}
