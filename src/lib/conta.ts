import { supabase, BUCKET_PROVAS } from './supabase'

// Apaga os dados da própria conta (tarefas, pontos, conquistas…) e as fotos. A conta continua.
export async function zerarMeusDados(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('resetar_minha_conta')
  if (error) return false

  // Fotos: remove tudo da pasta da pessoa (em lotes, até esvaziar)
  for (let i = 0; i < 20; i++) {
    const { data, error: e2 } = await supabase.storage.from(BUCKET_PROVAS).list(userId, { limit: 100 })
    if (e2 || !data || data.length === 0) break
    const { error: e3 } = await supabase.storage.from(BUCKET_PROVAS).remove(data.map((f) => `${userId}/${f.name}`))
    if (e3) break
  }
  return true
}
