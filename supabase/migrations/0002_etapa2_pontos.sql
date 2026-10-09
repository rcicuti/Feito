-- Feito! — Etapa 2: pontos, níveis, conquistas e sequência gentil
-- Rode no SQL Editor do Supabase DEPOIS da 0001. Pode rodar uma vez só.
--
-- Regras de pontuação (calculadas no banco, para ninguém precisar confiar no app):
--   foto = 10 pontos | sem foto = 7 pontos
--   tarefa marcada como difícil = +5
--   bônus de constância na 1ª tarefa do dia = +1 por dia de sequência anterior (máximo +7)
-- Nada diminui: pontos, dias ativos e melhor sequência só crescem.

-- ========== Novas colunas ==========
alter table public.tasks       add column is_hard boolean not null default false;
alter table public.profiles    add column total_points integer not null default 0;
alter table public.completions add column points smallint not null default 0;

-- Pontos de conclusões que já existiam (da Etapa 1)
update public.completions set points = case when photo_path is not null then 10 else 7 end;
update public.profiles p
   set total_points = coalesce((select sum(c.points) from public.completions c where c.user_id = p.id), 0);

-- ========== Ninguém edita os próprios pontos ==========
-- A pessoa continua podendo editar nome, nascimento e onboarding, mas não os pontos.
revoke update on public.profiles from authenticated, anon;
grant  update (display_name, birth_date, onboarding_done) on public.profiles to authenticated;

-- Em conclusões, por enquanto só a legenda pode ser editada
revoke update on public.completions from authenticated, anon;
grant  update (caption) on public.completions to authenticated;

-- Só aceita conclusões de datas próximas de hoje (evita "fabricar" dias antigos)
drop policy "conclusoes: criar as proprias" on public.completions;
create policy "conclusoes: criar as proprias" on public.completions for insert
  with check (user_id = auth.uid() and visibility = 'private'
              and completed_on between current_date - 3 and current_date + 1
              and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));

-- ========== Dias de descanso ==========
create table public.rest_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, dia)
);
alter table public.rest_days enable row level security;
create policy "descanso: ver os proprios"   on public.rest_days for select using (user_id = auth.uid());
create policy "descanso: criar os proprios" on public.rest_days for insert
  with check (user_id = auth.uid() and dia between current_date - 30 and current_date + 1);
create policy "descanso: apagar os proprios" on public.rest_days for delete using (user_id = auth.uid());

-- ========== Conquistas desbloqueadas ==========
-- Só o banco grava aqui (pelos gatilhos abaixo). A pessoa só consegue ler as próprias.
create table public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, code)
);
alter table public.user_achievements enable row level security;
create policy "conquistas: ver as proprias" on public.user_achievements for select using (user_id = auth.uid());

-- ========== Funções ==========

-- Quantos dias ativos seguidos terminam no dia anterior a p_dia.
-- Dia de descanso mantém a sequência viva, mas não conta como dia ativo.
create or replace function public.streak_before(p_user uuid, p_dia date)
returns int language sql stable set search_path = public as $$
  with recursive d(dia, n) as (
    select p_dia - 1, 0
    union all
    select d.dia - 1,
           d.n + (case when exists (select 1 from completions c where c.user_id = p_user and c.completed_on = d.dia) then 1 else 0 end)
      from d
     where exists (select 1 from completions c where c.user_id = p_user and c.completed_on = d.dia)
        or exists (select 1 from rest_days r where r.user_id = p_user and r.dia = d.dia)
  )
  select max(n) from d
$$;

-- Marca uma conquista como desbloqueada (só o banco chama; a pessoa não consegue)
create or replace function public._unlock(p_user uuid, p_code text)
returns void language sql security definer set search_path = public as $$
  insert into user_achievements (user_id, code) values (p_user, p_code) on conflict do nothing;
$$;
revoke all on function public._unlock(uuid, text) from public, anon, authenticated;

-- Calcula os pontos ANTES de salvar a conclusão (ignora qualquer valor enviado pelo app)
create or replace function public.completions_set_points()
returns trigger language plpgsql set search_path = public as $$
declare
  v_dificil boolean;
  v_pontos int;
begin
  select t.is_hard into v_dificil from tasks t where t.id = new.task_id;
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

create trigger completions_before_insert
  before insert on public.completions
  for each row execute function public.completions_set_points();

-- Depois de salvar: soma os pontos e desbloqueia conquistas
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

  if exists (select 1 from tasks t where t.id = new.task_id and t.is_hard) then
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

create trigger completions_after_insert
  after insert on public.completions
  for each row execute function public.completions_after_insert();

-- Se uma conclusão for apagada, os pontos dela saem do total (conquistas ficam: nada é tirado de ninguém)
create or replace function public.completions_after_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles set total_points = greatest(total_points - old.points, 0) where id = old.user_id;
  return old;
end $$;

create trigger completions_after_delete
  after delete on public.completions
  for each row execute function public.completions_after_delete();

-- Resumo da pessoa logada para a tela de perfil e a tela Hoje.
-- p_hoje é a data de hoje no fuso da pessoa (o app envia).
create or replace function public.meu_resumo(p_hoje date)
returns table (
  total_points int,
  tarefas_concluidas int,
  dias_ativos int,
  sequencia_atual int,
  melhor_sequencia int,
  ultimo_dia_coberto date
)
language sql stable set search_path = public as $$
  select
    coalesce((select p.total_points from profiles p where p.id = auth.uid()), 0),
    (select count(*)::int from completions c where c.user_id = auth.uid()),
    (select count(distinct c.completed_on)::int from completions c where c.user_id = auth.uid()),
    coalesce(streak_before(auth.uid(), p_hoje), 0)
      + (case when exists (select 1 from completions c where c.user_id = auth.uid() and c.completed_on = p_hoje) then 1 else 0 end),
    coalesce((
      select max(t.cnt) from (
        select count(*) filter (where s.ativo) as cnt
          from (
            select cov.dia, cov.ativo, cov.dia - (row_number() over (order by cov.dia))::int as grp
              from (
                select x.dia, bool_or(x.ativo) as ativo
                  from (
                    select c.completed_on as dia, true as ativo from completions c where c.user_id = auth.uid()
                    union all
                    select r.dia, false from rest_days r where r.user_id = auth.uid()
                  ) x
                 group by x.dia
              ) cov
          ) s
         group by s.grp
      ) t
    ), 0),
    (select max(u.dia) from (
        select c.completed_on as dia from completions c where c.user_id = auth.uid()
        union all
        select r.dia from rest_days r where r.user_id = auth.uid()
     ) u where u.dia <= p_hoje)
$$;
