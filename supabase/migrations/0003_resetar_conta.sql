-- Feito! — Zerar os dados da própria conta (útil para testes)
-- Apaga tarefas, passos, conclusões, descansos, conquistas e pontos DE QUEM CHAMAR.
-- A conta, o login e o perfil (nome e nascimento) continuam.
-- As fotos no Storage são removidas pelo app logo depois.

create or replace function public.resetar_minha_conta()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Você precisa estar logado.';
  end if;

  delete from completions      where user_id = v_user;
  delete from tasks            where user_id = v_user;   -- apaga também os passos
  delete from rest_days        where user_id = v_user;
  delete from user_achievements where user_id = v_user;
  update profiles set total_points = 0 where id = v_user;
end $$;

-- Só quem está logado pode chamar
revoke all on function public.resetar_minha_conta() from public, anon;
grant execute on function public.resetar_minha_conta() to authenticated;
