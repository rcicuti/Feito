import { useState } from 'react'
import type { EstadoAcompanhamento } from '../../hooks/useAcompanhamento'
import { formatarCodigoTerapia, type VinculoTerapeuta } from '../../lib/terapia'
import { Confirmar } from '../grupo/Confirmar'
import { Chaves } from './Chaves'
import { VincularSheet } from './VincularSheet'
import { AceitarPedidoSheet } from './AceitarPedidoSheet'
import { CompartilhadoComTerapeuta } from './CompartilhadoComTerapeuta'

function CartaoVinculo({ v, est }: { v: VinculoTerapeuta; est: EstadoAcompanhamento }) {
  const [verItens, setVerItens] = useState(false)
  const [encerrando, setEncerrando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  async function mudar(tarefas: boolean, resumo: boolean) {
    const r = await est.ajustarChaves(v.link_id, tarefas, resumo)
    setAviso(r.erro ?? (tarefas !== v.share_tasks && !tarefas ? 'Chave desligada. O que estava compartilhado foi apagado para essa pessoa.' : 'Pronto.'))
  }

  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5">
      <div>
        <p className="break-words text-lg font-extrabold">{v.nome}</p>
        {v.crp && <p className="text-sm text-soft">CRP informado: {v.crp}</p>}
      </div>
      <Chaves tarefas={v.share_tasks} resumo={v.share_summary} onTarefas={(t) => void mudar(t, v.share_summary)} onResumo={(r) => void mudar(v.share_tasks, r)} />
      {aviso && <p role="status" className="text-sm text-soft">{aviso}</p>}
      {v.share_tasks && (
        <>
          <button className="btn-outline !min-h-[44px] !py-2 text-sm" onClick={() => setVerItens((x) => !x)}>{verItens ? 'Esconder' : 'Ver o que compartilhei e os comentários'}</button>
          {verItens && <CompartilhadoComTerapeuta linkId={v.link_id} />}
        </>
      )}
      <button className="btn-ghost !min-h-[44px] !py-2 text-sm self-start" onClick={() => setEncerrando(true)}>Encerrar vínculo</button>
      {encerrando && (
        <Confirmar
          titulo={`Encerrar vínculo com ${v.nome}?`}
          texto="A pessoa deixa de ver qualquer coisa sua: tarefas compartilhadas, comentários e resumo. Você pode vincular de novo depois, se quiser."
          confirmar="Encerrar vínculo"
          onConfirmar={async () => { await est.encerrar(v.link_id); setEncerrando(false) }}
          onCancelar={() => setEncerrando(false)}
        />
      )}
    </li>
  )
}

export function MeuAcompanhamento({ est, menor }: { est: EstadoAcompanhamento; menor: boolean }) {
  const [vinculando, setVinculando] = useState(false)
  const [aceitando, setAceitando] = useState<VinculoTerapeuta | null>(null)
  const [recusando, setRecusando] = useState<VinculoTerapeuta | null>(null)
  const [codigo, setCodigo] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  if (menor) {
    return (
      <section className="rounded-3xl border border-line bg-card p-5 text-soft">
        Por enquanto, o vínculo com terapeuta é só para maiores de 18 anos. Quando o fluxo com responsável existir, ele chega aqui.
      </section>
    )
  }

  async function gerar() {
    setErro(null)
    const r = await est.gerarCodigoPaciente()
    if (r.erro) setErro(r.erro)
    else setCodigo(r.codigo ?? null)
  }

  return (
    <section className="flex flex-col gap-4" aria-label="Meu acompanhamento">
      {est.pedidos.map((p) => (
        <div key={p.link_id} className="flex flex-col gap-2 rounded-3xl border border-brand/40 bg-brand/10 p-5">
          <p className="font-extrabold">{p.nome} quer se vincular a você</p>
          <p className="text-sm text-soft">Nada é compartilhado até você aceitar e escolher o que mostrar.</p>
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={() => setAceitando(p)}>Ver e aceitar</button>
            <button className="btn-outline" onClick={() => setRecusando(p)}>Recusar</button>
          </div>
        </div>
      ))}

      {est.sugestoes.length > 0 && (
        <div className="flex flex-col gap-2 rounded-3xl border border-line bg-card p-5">
          <h2 className="text-lg font-extrabold">Sugestões de tarefa</h2>
          <p className="text-sm text-soft">Só entram na sua lista se você quiser. Dispensar não gera nenhum aviso de culpa.</p>
          <ul className="flex flex-col gap-2">
            {est.sugestoes.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 rounded-2xl bg-bg p-3">
                <p className="break-words font-bold">{s.titulo}</p>
                {s.nota && <p className="break-words text-sm text-soft">{s.nota}</p>}
                <p className="text-xs text-soft">de {s.terapeuta}</p>
                <div className="flex gap-2">
                  <button className="btn-primary !min-h-[44px] !py-2 flex-1 text-sm" onClick={() => void est.responderSugestao(s.id, true)}>Colocar na minha lista</button>
                  <button className="btn-outline !min-h-[44px] !py-2 text-sm" onClick={() => void est.responderSugestao(s.id, false)}>Agora não</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {est.ativos.length === 0 ? (
        <p className="rounded-2xl bg-card p-4 text-soft">Você não tem nenhum vínculo. Você escolhe o que cada profissional vê, e pode encerrar a qualquer momento.</p>
      ) : (
        <ul className="flex flex-col gap-3">{est.ativos.map((v) => <CartaoVinculo key={v.link_id} v={v} est={est} />)}</ul>
      )}

      <div className="flex flex-col gap-2">
        <button className="btn-primary" onClick={() => setVinculando(true)}>🔑 Tenho o código de um(a) terapeuta</button>
        <button className="btn-outline" onClick={() => void gerar()}>Gerar um código para entregar ao(à) terapeuta</button>
      </div>
      {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}
      {codigo && (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-line bg-card p-5 text-center">
          <p className="select-all text-3xl font-extrabold tracking-widest">{formatarCodigoTerapia(codigo)}</p>
          <p className="text-sm text-soft">Entregue ao(à) terapeuta. Vale por 48 horas e só pode ser usado uma vez. Mesmo com o código, o vínculo só começa depois que você aceitar aqui.</p>
        </div>
      )}

      {vinculando && <VincularSheet onFechar={() => setVinculando(false)} onVincular={est.vincular} />}
      {aceitando && (
        <AceitarPedidoSheet
          pedido={aceitando}
          onFechar={() => setAceitando(null)}
          onAceitar={async (t, r) => {
            const res = await est.responderVinculo(aceitando.link_id, true, t, r)
            if (!res.erro) setAceitando(null)
            return res
          }}
        />
      )}
      {recusando && (
        <Confirmar
          titulo="Recusar este pedido?"
          texto={`${recusando.nome} não vê nada seu. O pedido some.`}
          confirmar="Recusar"
          onConfirmar={async () => { await est.responderVinculo(recusando.link_id, false, false, false); setRecusando(null) }}
          onCancelar={() => setRecusando(null)}
        />
      )}
    </section>
  )
}
