# Feito! — Etapas 1 a 3 (base, pontos, grupos)

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
2. No **SQL Editor**, rode **na ordem**: primeiro `supabase/migrations/0001_etapa1_base.sql`, depois `0002_etapa2_pontos.sql`, `0003_resetar_conta.sql` e `0004_etapa3_grupos.sql` (cada uma uma vez só).
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

## Etapa 2: pontos, níveis, conquistas e sequência gentil
- **Pontos** (calculados no banco, não dá para editar): foto 10, sem foto 7, tarefa "Difícil pra mim" +5, e bônus de constância na 1ª tarefa do dia (+1 por dia de sequência anterior, máximo +7).
- **Níveis** a partir de 30, 90, 180, 300, 450… pontos (os primeiros chegam rápido): Semente, Broto, Muda, Folhas, Botão, Flor, Árvore, Floresta.
- **13 conquistas** (primeira tarefa, foto, tarefa difícil, recomeço, 10/50/100 tarefas, 3/7/30 dias ativos, sequências de 3/7/14).
- **Sequência gentil**: se passarem dias em branco, o app oferece "Foi descanso" (sem limite; a sequência continua de onde parou) ou "Vou retomar hoje". Pontos, dias ativos e melhor sequência nunca diminuem. Nunca aparece "0 dias".
- **Mensagem de reforço específica**: "Você lavou a louça, uma tarefa que estava adiada." (sem conseguir conjugar o verbo, usa "Você concluiu …").
- Nova tela **Perfil** (nível, sequência, conquistas) e barra de navegação inferior.

## Privacidade (resumo)
- Tudo é privado por padrão; a política de INSERT só aceita `visibility = 'private'` nesta etapa.
- Cada tabela tem RLS: a pessoa só lê/escreve o que é dela.
- Fotos ficam no bucket privado `provas`, em pasta `<id-da-pessoa>/...`, com política por pasta. Para exibir foto no futuro, use URL assinada (`createSignedUrl`).

## Ainda não está nesta etapa (de propósito)
Terapeuta (4); notificações, configurações e excluir conta (5).

## Etapa 3: grupos, feed, desafios e "começando agora"

- **Grupos** por convite (código ou link `?convite=CÓDIGO`). Maiores de 18 criam; menores só entram por convite, reagem com emojis e não escrevem comentários.
- **Modos**: sem ranking (só feed), cooperativo (meta coletiva) ou competitivo (placar).
- **Compartilhar** é sempre escolha da pessoa, tarefa por tarefa: nenhum grupo vem marcado, a foto pode ser escondida e dá para parar de compartilhar depois.
- **Placar e meta** contam só o que foi compartilhado com aquele grupo, dentro do período do desafio.
- **Estou começando agora**: mostra nome + título da tarefa aos grupos escolhidos por 45 minutos.
- **Segurança**: denunciar, silenciar, bloquear; "esconder rankings" no perfil. Denúncias ficam em Supabase > Table Editor > `reports`.
