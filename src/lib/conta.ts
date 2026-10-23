import { supabase, BUCKET_PROVAS } from './supabase'

// Remove todas as fotos da pasta da pessoa (em lotes, até esvaziar). Devolve false se algo falhar.
async function apagarFotos(userId: string): Promise<boolean> {
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase.storage.from(BUCKET_PROVAS).list(userId, { limit: 100 })
    if (error) return false
    if (!data || data.length === 0) return true
    const { error: e2 } = await supabase.storage.from(BUCKET_PROVAS).remove(data.map((f) => `${userId}/${f.name}`))
    if (e2) return false
  }
  return false
}

// Apaga os dados da própria conta (tarefas, pontos, conquistas…) e as fotos. A conta continua.
export async function zerarMeusDados(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('resetar_minha_conta')
  if (error) return false
  await apagarFotos(userId)
  return true
}

// Exclui a conta e TODOS os dados. Primeiro as fotos; só então o login (se as fotos falharem, nada é apagado).
export async function excluirMinhaConta(userId: string): Promise<{ ok: boolean; erro?: string }> {
  if (!(await apagarFotos(userId))) return { ok: false, erro: 'Não consegui apagar suas fotos agora. Nada foi excluído; tente de novo.' }
  const { error } = await supabase.rpc('excluir_minha_conta')
  if (error) {
    const falta = /could not find the function|schema cache/i.test(error.message)
    return { ok: false, erro: falta ? 'Falta rodar o SQL 0006 no Supabase (veja o README).' : 'Não consegui excluir a conta agora. Tente de novo.' }
  }
  return { ok: true }
}
