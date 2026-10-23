-- Feito! — Excluir a própria conta e TODOS os dados (LGPD)
-- Rode no SQL Editor do Supabase DEPOIS da 0001 a 0005. Uma vez só.
--
-- O que acontece quando a pessoa exclui a conta:
--  • O login é apagado e, junto, em cascata: perfil, tarefas, passos, conclusões, pontos, conquistas,
--    dias de descanso, participações e comentários em grupos, reações, bloqueios, silenciados,
--    vínculos com terapeutas (e tudo que foi compartilhado com eles), sugestões e códigos.
--  • Grupos que a pessoa CRIOU são apagados para todos os membros (o app avisa antes).
--  • As FOTOS são arquivos do Storage: o app as apaga antes, pela API do Storage.
--  • Denúncias que a pessoa fez saem; denúncias feitas CONTRA ela ficam só como um código interno
--    (sem nome nem dados), para a moderação não perder o histórico.

create or replace function public.excluir_minha_conta()
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Você precisa estar logado.';
  end if;
  delete from auth.users where id = v_user;
end $$;

revoke all on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
