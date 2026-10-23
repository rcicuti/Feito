# Apagar as fotos automaticamente quando um usuário é excluído (opcional, recomendado)

O botão "Excluir minha conta" do app já apaga as fotos. Mas se um usuário for apagado **pelo painel do Supabase ou por SQL**,
o banco apaga tarefas, conclusões etc., e as fotos ficam no Storage (o Supabase não apaga arquivos por SQL).
Esta rede de segurança resolve isso: um gatilho do banco chama uma função que apaga a pasta de fotos da pessoa.

## Passo 1 — criar a função
1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nome: `apagar-fotos-da-conta`. Cole o conteúdo de `supabase/functions/apagar-fotos-da-conta/index.ts`. **Deploy**.
3. Em **Settings** da função, desligue **Verify JWT** (a proteção é o segredo do passo 2).

## Passo 2 — criar o segredo
1. Invente uma senha longa (30+ letras e números aleatórios). Não use a chave do Supabase.
2. Edge Functions → **Secrets** → novo: nome `SEGREDO_WEBHOOK`, valor = a senha inventada.

## Passo 3 — criar o gatilho (SQL Editor)
Troque `SEU-PROJETO` pelo código do seu projeto (o começo do endereço `https://SEU-PROJETO.supabase.co`) e `SUA_SENHA` pelo segredo do passo 2:

```sql
create trigger apagar_fotos_ao_excluir_usuario
after delete on auth.users
for each row execute function supabase_functions.http_request(
  'https://SEU-PROJETO.supabase.co/functions/v1/apagar-fotos-da-conta',
  'POST',
  '{"Content-Type":"application/json","x-feito-segredo":"SUA_SENHA"}',
  '{}',
  '5000'
);
```
Se aparecer erro dizendo que `supabase_functions` não existe, ative antes: **Database → Webhooks → Enable webhooks**.

## Como testar
Crie uma conta de teste, conclua uma tarefa com foto, apague o usuário no painel e veja em **Storage → provas** se a pasta sumiu
(pode levar alguns segundos). Se não sumir, veja **Edge Functions → apagar-fotos-da-conta → Logs**.
