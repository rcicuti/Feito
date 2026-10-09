import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { mensagemTerapia, type SemanaResumo, type VinculoPaciente } from '../../lib/terapia'
import type { EstadoAcompanhamento } from '../../hooks/useAcompanhamento'
import { Confirmar } from '../grupo/Confirmar'
import { GraficoSemanas } from './GraficoSemanas'
import { TarefasDoPaciente } from './TarefasDoPaciente'
import { SugerirTarefa } from './SugerirTarefa'

type Sub = 'resumo' | 'tarefas' | 'sugerir'

export function PacienteDetalhe({ v, est, meuId, onVoltar }: { v: VinculoPaciente; est: EstadoAcompanhamento; meuId: string; onVoltar: () => void }) {
  const [sub, setSub] = useState<Sub>('resumo')
  const [semanas, setSemanas] = useState<SemanaResumo[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [encerrando, setEncerrando] = useState(false)

  useEffect(() => {
    if (!v.share_summary || v.status !== 'active') return
    void supabase.rpc('resumo_do_paciente', { p_link: v.link_id, p_semanas: 8 }).then(({ data, error }) => {
      if (error) setErro(mensagemTerapia(error, 'Não consegui carregar o resumo.'))
      else setSemanas((data ?? []) as SemanaResumo[])
    })
  }, [v.link_id, v.share_summary, v.status])

  const abas: { id: Sub; rotulo: string }[] = [{ id: 'resumo', rotulo: 'Resumo' }, { id: 'tarefas', rotulo: 'Tarefas' }, { id: 'sugerir', rotulo: 'Sugerir' }]
  return (
    <div className="flex flex-col gap-4">
      <button className="btn-ghost self-start !px-2" onClick={onVoltar}>← Pacientes</button>
      <h1 className="break-words text-2xl font-extrabold">{v.nome}</h1>
      {v.status === 'pending' ? (
        <p className="rounded-2xl bg-card p-4 text-soft">Pedido enviado. A pessoa precisa aceitar no app dela, escolhendo o que compartilha. Até lá você não vê nada.</p>
      ) : (
        <>
          <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl bg-card p-1">
            {abas.map((a) => (
              <button key={a.id} role="tab" aria-selected={sub === a.id} onClick={() => setSub(a.id)} className={`min-h-[44px] rounded-xl text-sm font-bold ${sub === a.id ? 'bg-brand text-brand-ink' : 'text-soft'}`}>{a.rotulo}</button>
            ))}
          </div>
          {sub === 'resumo' && (
            v.share_summary ? (
              <>
                {erro && <p role="alert" className="rounded-2xl bg-card p-4 text-soft">{erro}</p>}
                {semanas.length > 0 && <GraficoSemanas semanas={semanas} />}
                <p className="text-xs text-soft">Resumo de números, sem títulos nem fotos. Não é um diagnóstico nem uma avaliação.</p>
              </>
            ) : (
              <p className="rounded-2xl bg-card p-4 text-soft">Esta pessoa não liberou o resumo semanal. Se ela quiser, pode ligar essa chave no app dela.</p>
            )
          )}
          {sub === 'tarefas' && <TarefasDoPaciente linkId={v.link_id} compartilhaTarefas={v.share_tasks} />}
          {sub === 'sugerir' && <SugerirTarefa linkId={v.link_id} pacienteId={v.paciente_id} meuId={meuId} nomePaciente={v.nome} />}
        </>
      )}
      <button className="btn-outline mt-2" onClick={() => setEncerrando(true)}>{v.status === 'pending' ? 'Cancelar pedido' : 'Encerrar vínculo'}</button>
      {encerrando && (
        <Confirmar
          titulo={v.status === 'pending' ? 'Cancelar o pedido?' : `Encerrar vínculo com ${v.nome}?`}
          texto={v.status === 'pending' ? 'O pedido some.' : 'Você deixa de ver tudo dessa pessoa, inclusive tarefas compartilhadas e comentários.'}
          confirmar={v.status === 'pending' ? 'Cancelar pedido' : 'Encerrar vínculo'}
          onConfirmar={async () => { await est.encerrar(v.link_id); setEncerrando(false); onVoltar() }}
          onCancelar={() => setEncerrando(false)}
        />
      )}
    </div>
  )
}
