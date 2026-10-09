import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { mensagemTerapia, type Sugestao, type VinculoPaciente, type VinculoTerapeuta } from '../lib/terapia'

export type EstadoAcompanhamento = ReturnType<typeof useAcompanhamento>
type Resultado = { erro?: string }

// Tudo do acompanhamento com terapeuta: meus vínculos (como paciente), meus pacientes (se eu for terapeuta) e sugestões.
export function useAcompanhamento(ehTerapeuta: boolean) {
  const [terapeutas, setTerapeutas] = useState<VinculoTerapeuta[]>([])
  const [pacientes, setPacientes] = useState<VinculoPaciente[]>([])
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async () => {
    const [t, p, s] = await Promise.all([
      supabase.rpc('meus_terapeutas'),
      ehTerapeuta ? supabase.rpc('meus_pacientes') : Promise.resolve({ data: [] }),
      supabase.rpc('minhas_sugestoes'),
    ])
    // se o SQL 0005 ainda não foi rodado, as listas ficam vazias e o app segue normal
    setTerapeutas((t.data ?? []) as VinculoTerapeuta[])
    setPacientes((p.data ?? []) as VinculoPaciente[])
    setSugestoes((s.data ?? []) as Sugestao[])
    setCarregando(false)
  }, [ehTerapeuta])

  useEffect(() => { void recarregar() }, [recarregar])

  async function vincular(codigo: string, tarefas: boolean, resumo: boolean): Promise<Resultado> {
    const { error } = await supabase.rpc('vincular_com_terapeuta', { p_codigo: codigo, p_tarefas: tarefas, p_resumo: resumo })
    if (error) return { erro: mensagemTerapia(error, 'Não consegui vincular agora.') }
    await recarregar()
    return {}
  }

  async function responderVinculo(link: string, aceitar: boolean, tarefas: boolean, resumo: boolean): Promise<Resultado> {
    const { error } = await supabase.rpc('responder_vinculo', { p_link: link, p_aceitar: aceitar, p_tarefas: tarefas, p_resumo: resumo })
    if (error) return { erro: mensagemTerapia(error) }
    await recarregar()
    return {}
  }

  async function ajustarChaves(link: string, tarefas: boolean, resumo: boolean): Promise<Resultado> {
    const { error } = await supabase.from('therapist_links').update({ share_tasks: tarefas, share_summary: resumo }).eq('id', link)
    if (error) return { erro: 'Não consegui mudar agora.' }
    await recarregar()
    return {}
  }

  async function encerrar(link: string): Promise<Resultado> {
    const { error } = await supabase.from('therapist_links').delete().eq('id', link)
    if (error) return { erro: 'Não consegui encerrar agora.' }
    await recarregar()
    return {}
  }

  async function gerarCodigoPaciente(): Promise<{ codigo?: string; erro?: string }> {
    const { data, error } = await supabase.rpc('gerar_codigo_paciente')
    if (error) return { erro: mensagemTerapia(error) }
    return { codigo: data as string }
  }

  async function pedirVinculo(codigo: string): Promise<Resultado> {
    const { error } = await supabase.rpc('pedir_vinculo_com_paciente', { p_codigo: codigo })
    if (error) return { erro: mensagemTerapia(error) }
    await recarregar()
    return {}
  }

  async function responderSugestao(id: string, aceitar: boolean): Promise<Resultado> {
    const { error } = await supabase.rpc('responder_sugestao', { p_id: id, p_aceitar: aceitar })
    if (error) return { erro: mensagemTerapia(error) }
    await recarregar()
    return {}
  }

  const ativos = terapeutas.filter((t) => t.status === 'active')
  const pedidos = terapeutas.filter((t) => t.status === 'pending')
  // vínculos para os quais dá para compartilhar uma conclusão (chave "tarefas" ligada)
  const paraCompartilhar = ativos.filter((t) => t.share_tasks)

  return { terapeutas, ativos, pedidos, pacientes, sugestoes, paraCompartilhar, carregando, recarregar, vincular, responderVinculo, ajustarChaves, encerrar, gerarCodigoPaciente, pedirVinculo, responderSugestao }
}
