-- Feito! — "Difícil" só vale com 3 passos ou mais (a regra mora no banco)
-- Rode no SQL Editor do Supabase DEPOIS da 0007. Pode rodar uma vez só.
--
-- Regra: uma tarefa só conta como difícil (+5 pontos e a conquista "Enfrentou uma difícil")
-- se, NA HORA DE CONCLUIR, ela estiver marcada como difícil E tiver pelo menos 3 passos.
-- Por que na hora de concluir? Porque o app cria a tarefa e depois os passos, e a pessoa
-- pode editar os passos depois. Os pontos só são decididos quando a conclusão é gravada.
-- Conclusões antigas não mudam: nada que a pessoa já ganhou é tirado.

create or replace function public.tarefa_conta_como_dificil(p_task uuid)
returns boolean language sql stable set search_path = public as $$
  select coalesce((select t.is_hard from tasks t where t.id = p_task), false)
     and (select count(*) from task_steps s where s.task_id = p_task) >= 3
$$;

-- Pontos: calculados antes de salvar a conclusão
create or replace function public.completions_set_points()
returns trigger language plpgsql set search_path = public as $$
declare
  v_dificil boolean;
  v_pontos int;
begin
  v_dificil := tarefa_conta_como_dificil(new.task_id);
  v_pontos := case when new.photo_path is not null then 10 else 7 end;
  if coalesce(v_dificil, false) then
    v_pontos := v_pontos + 5;
  end if;
  -- bônus de constância: só na primeira tarefa do dia
  if not exists (select 1 from completions c where c.user_id = new.user_id and c.completed_on = new.completed_on) then
    v_pontos := v_pontos + least(coalesce(streak_before(new.user_id, new.completed_on), 0), 7);
  end if;
  new.points := v_pontos;
  return new;
end $$;

-- Conquistas e total de pontos: depois de salvar a conclusão
create or replace function public.completions_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_total int;
  v_dias int;
  v_seq int;
  v_antes int;
  v_prev date;
begin
  update profiles set total_points = total_points + new.points where id = new.user_id;

  select count(*), count(distinct completed_on) into v_total, v_dias
    from completions where user_id = new.user_id;
  v_antes := coalesce(streak_before(new.user_id, new.completed_on), 0);
  v_seq := v_antes + 1;

  if v_total >= 1   then perform _unlock(new.user_id, 'first_task'); end if;
  if v_total >= 10  then perform _unlock(new.user_id, 'tasks_10');   end if;
  if v_total >= 50  then perform _unlock(new.user_id, 'tasks_50');   end if;
  if v_total >= 100 then perform _unlock(new.user_id, 'tasks_100');  end if;

  if v_dias >= 3  then perform _unlock(new.user_id, 'days_3');  end if;
  if v_dias >= 7  then perform _unlock(new.user_id, 'days_7');  end if;
  if v_dias >= 30 then perform _unlock(new.user_id, 'days_30'); end if;

  if v_seq >= 3  then perform _unlock(new.user_id, 'streak_3');  end if;
  if v_seq >= 7  then perform _unlock(new.user_id, 'streak_7');  end if;
  if v_seq >= 14 then perform _unlock(new.user_id, 'streak_14'); end if;

  if new.photo_path is not null then
    perform _unlock(new.user_id, 'first_photo');
  end if;

  if tarefa_conta_como_dificil(new.task_id) then
    perform _unlock(new.user_id, 'first_hard');
  end if;

  -- recomeço: voltou depois de pelo menos 2 dias em branco, sem descanso marcado
  select max(c.completed_on) into v_prev
    from completions c where c.user_id = new.user_id and c.completed_on < new.completed_on;
  if v_prev is not null and new.completed_on - v_prev >= 3 and v_antes = 0 then
    perform _unlock(new.user_id, 'comeback');
  end if;

  return new;
end $$;
