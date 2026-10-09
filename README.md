# Feito! — Etapa 1 (base e tela Hoje)

Web app mobile-first (PWA) em React + TypeScript + Tailwind, com Supabase.

## O que já funciona
- Login com e-mail/senha e com Google
- Onboarding curto e pulável (nome opcional + data de nascimento para proteger menores)
- Tela **Hoje**: anel de progresso, criação rápida de tarefa (título; horário, repetição diária/dias da semana e passos pequenos como opção)
- Concluir: câmera do celular (foto comprimida no aparelho), legenda opcional, escolha de visibilidade (só "Só eu" ativa) e feedback positivo
- Tarefa não feita: "Deixar para amanhã" com um toque; sem contador de atrasadas, sem punição
- Modo escuro, respeita "reduzir movimento" do sistema, instalável como PWA
- Banco com RLS em todas as tabelas e bucket de fotos privado

## Como configurar

1. **Supabase**: crie um projeto em supabase.com.
2. No **SQL Editor**, cole e rode `supabase/migrations/0001_etapa1_base.sql`.
3. Em **Project Settings → API**, copie a *Project URL* e a chave *anon public*.
4. Copie `.env.example` para `.env` e preencha as duas variáveis.
5. **Login com e-mail**: em *Authentication → URL Configuration*, ponha a URL do app em *Site URL* e em *Redirect URLs* (ex.: `http://localhost:5173` e a URL publicada).
6. **Login com Google** (*Authentication → Providers → Google*):
   - No Google Cloud Console, crie credenciais OAuth (tipo "Aplicativo da Web").
   - Em *URIs de redirecionamento autorizados*, cole a *Callback URL* que o Supabase mostra na tela do provedor Google.
   - Cole o Client ID e o Client Secret no Supabase e ative o provedor.
7. Rode:
   ```bash
   npm install
   npm run dev      # desenvolvimento
   npm run build    # produção (gera dist/, instalável como PWA)
   ```
   Para testar a câmera no celular é preciso HTTPS (use o deploy ou um túnel).

## Privacidade (resumo)
- Tudo é privado por padrão; a política de INSERT só aceita `visibility = 'private'` nesta etapa.
- Cada tabela tem RLS: a pessoa só lê/escreve o que é dela.
- Fotos ficam no bucket privado `provas`, em pasta `<id-da-pessoa>/...`, com política por pasta. Para exibir foto no futuro, use URL assinada (`createSignedUrl`).

## Ainda não está nesta etapa (de propósito)
Pontos, níveis e conquistas (Etapa 2); grupos e feed (3); terapeuta (4); notificações, configurações e excluir conta (5).
