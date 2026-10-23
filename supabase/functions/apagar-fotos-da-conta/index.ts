// Feito! — Rede de segurança: apaga as FOTOS de uma conta quando o usuário é excluído por qualquer caminho
// (pelo painel do Supabase, por SQL ou pelo app). Quem chama é um gatilho do banco (veja supabase/opcional/).
//
// O banco apaga tarefas, conclusões etc. em cascata, mas o Storage só aceita exclusão pela API
// (apagar por SQL deixaria o arquivo órfão). Por isso esta função usa a API com a chave de serviço,
// que o Supabase já entrega a ela sozinho (a chave nunca fica no app nem no gatilho).
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  // Só aceita quem sabe o segredo combinado (guardado em Edge Functions → Secrets → SEGREDO_WEBHOOK)
  const segredo = Deno.env.get('SEGREDO_WEBHOOK')
  if (!segredo || req.headers.get('x-feito-segredo') !== segredo) return json({ erro: 'não autorizado' }, 401)

  const corpo = await req.json().catch(() => null)
  const id = corpo?.old_record?.id
  if (corpo?.type !== 'DELETE' || typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) {
    return json({ erro: 'pedido inválido' }, 400)
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  let apagados = 0
  for (let i = 0; i < 100; i++) {
    const { data, error } = await admin.storage.from('provas').list(id, { limit: 100 })
    if (error) return json({ erro: 'não consegui listar', apagados }, 500)
    if (!data || data.length === 0) return json({ ok: true, apagados })
    const { data: removidos, error: e2 } = await admin.storage.from('provas').remove(data.map((f) => `${id}/${f.name}`))
    if (e2 || !removidos || removidos.length === 0) return json({ erro: 'não consegui apagar', apagados }, 500)
    apagados += removidos.length
  }
  return json({ erro: 'muitas fotos; tente de novo', apagados }, 500)
})
