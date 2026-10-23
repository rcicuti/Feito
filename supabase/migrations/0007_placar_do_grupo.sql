-- Feito! — Placar do grupo (modo competitivo), sem precisar de um desafio
-- Rode no SQL Editor do Supabase DEPOIS da 0001 a 0006. Uma vez só.
--
-- Regras (as mesmas do placar dos desafios):
--  • Só grupos no modo COMPETITIVO têm placar.
--  • Conta SÓ o que cada pessoa compartilhou com aquele grupo (as tarefas privadas não entram).
--  • Todas as pessoas do grupo aparecem (quem ainda não compartilhou aparece com 0).
--  • Quem desativou rankings no perfil não vê o placar e não aparece nele.
--  • Quem você bloqueou (ou quem bloqueou você) não aparece.
--  • Períodos: 'semana' (desde segunda-feira), 'mes' (desde o dia 1) ou 'sempre'.

create or replace function public.placar_do_grupo(p_group uuid, p_periodo text default 'semana')
returns table (user_id uuid, nome text, pontos int, tarefas int, eh_meu boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_me uuid := auth.uid();
  v_modo text;
  v_ini date;
begin
  if not is_member(p_group, v_me) then raise exception 'Você não faz parte deste grupo.'; end if;
  select g.mode into v_modo from groups g where g.id = p_group;
  if v_modo <> 'competitive' then return; end if;
  if coalesce((select pr.hide_rankings from profiles pr where pr.id = v_me), false) then return; end if;

  v_ini := case p_periodo
             when 'mes' then date_trunc('month', current_date)::date
             when 'sempre' then date '1900-01-01'
             else date_trunc('week', current_date)::date
           end;

  return query
  select m.user_id,
         coalesce(p.display_name, 'Alguém'),
         coalesce(sum(c.points), 0)::int,
         count(c.id)::int,
         (m.user_id = v_me)
    from group_members m
    left join profiles p on p.id = m.user_id
    left join completion_shares s on s.group_id = m.group_id and s.user_id = m.user_id
    left join completions c on c.id = s.completion_id and c.completed_on >= v_ini
   where m.group_id = p_group
     and not coalesce(p.hide_rankings, false)
     and (m.user_id = v_me or not bloqueado_entre(v_me, m.user_id))
   group by m.user_id, p.display_name
   order by coalesce(sum(c.points), 0) desc, count(c.id) desc, p.display_name;
end $$;

revoke all on function public.placar_do_grupo(uuid, text) from public, anon;
grant execute on function public.placar_do_grupo(uuid, text) to authenticated;
