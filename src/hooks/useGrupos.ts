import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { mensagemDeErro, type Grupo, type ModoGrupo } from '../lib/grupos'

export type EstadoGrupos = ReturnType<typeof useGrupos>

export function useGrupos() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    const { data, error } = await supabase.rpc('meus_grupos')
    if (error) setErro(mensagemDeErro(error, 'Não consegui carregar seus grupos.'))
    else {
      setGrupos((data ?? []) as Grupo[])
      setErro(null)
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  async function criar(nome: string, descricao: string, modo: ModoGrupo): Promise<{ id?: string; erro?: string }> {
    const { data, error } = await supabase.rpc('criar_grupo', { p_nome: nome, p_descricao: descricao, p_modo: modo })
    if (error) return { erro: mensagemDeErro(error, 'Não consegui criar o grupo agora.') }
    await recarregar()
    return { id: data as string }
  }

  async function entrar(codigo: string): Promise<{ id?: string; erro?: string }> {
    const { data, error } = await supabase.rpc('entrar_no_grupo', { p_codigo: codigo })
    if (error) return { erro: mensagemDeErro(error, 'Não consegui entrar agora.') }
    await recarregar()
    return { id: data as string }
  }

  async function sair(grupoId: string, userId: string): Promise<boolean> {
    const { error } = await supabase.from('group_members').delete().eq('group_id', grupoId).eq('user_id', userId)
    if (error) return false
    await recarregar()
    return true
  }

  async function apagar(grupoId: string): Promise<boolean> {
    const { error } = await supabase.from('groups').delete().eq('id', grupoId)
    if (error) return false
    await recarregar()
    return true
  }

  return { grupos, carregando, erro, recarregar, criar, entrar, sair, apagar }
}
