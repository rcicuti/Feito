import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigurado = Boolean(url && key)

// Se as variáveis não existirem, usamos valores de mentira só para o app abrir
// e mostrar uma tela explicando o que falta configurar.
export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'sem-chave', {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const BUCKET_PROVAS = 'provas'
