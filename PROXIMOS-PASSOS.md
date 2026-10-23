# Feito! — Próximos passos (para evoluir depois)

## Etapa 5 — o que ainda falta
1. **Lembretes e notificações** (a tela de Configurações já tem o espaço "Lembretes"):
   - lembretes configuráveis (horários, dias), tom gentil, **limite diário** e opção de **silenciar**;
   - decidir o canal: notificação push da PWA (exige o app instalado e permissão; no iPhone só funciona com o app adicionado à tela de início) ou e-mail;
   - nada de linguagem de culpa nem contador de atrasadas.
2. **Revisão de acessibilidade**: contraste em todas as telas, tamanhos de toque (mínimo 44px), leitor de tela (rótulos, ordem de foco, anúncios), teste com zoom de 200%.
3. **Desempenho**: carregamento mais rápido (dividir o código por tela), imagens, cache offline do PWA.
4. **Revisão geral**: percorrer todos os fluxos, testar com várias contas e listar o que ficou faltando.

## Sugestões ainda não aprovadas (não implementadas)
- Verificação manual do **CRP** antes de liberar a área de terapeuta.
- **Ícone do app instalado** atualizado para a nova marca.
- Escolher a idade mínima / fluxo de **responsável legal** para adolescentes (hoje menores não se vinculam a terapeuta, não criam grupos e não comentam).
- Transferir a propriedade de um grupo antes de excluir a conta (hoje o grupo é apagado).
- Exportar os próprios dados (portabilidade, LGPD).
- Painel simples para ver e tratar as **denúncias** (hoje só no Supabase → Table Editor → `reports`).

- Regra do manual "cor de ação em um único ponto por tela": revisar telas com mais de um botão principal.
- Ícone do app instalado que acompanhe o tema escolhido (hoje é fixo, amarelo sol).

## Fora do escopo por enquanto
Chat em tempo real, videochamada, integração com agenda, relatórios clínicos exportáveis, monetização, loja de recompensas, app nativo nas lojas.

## Lembrete de configuração (Vercel/Supabase)
- Endereço de produção público no Vercel (Deployment Protection só nos previews) e o mesmo endereço em Supabase → Authentication → URL Configuration; variável opcional `VITE_SITE_URL` no Vercel.
