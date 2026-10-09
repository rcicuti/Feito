-- Feito! — Etapa 3: grupos, feed, desafios, "estou começando agora" e moderação
-- Rode no SQL Editor do Supabase DEPOIS da 0001, 0002 e 0003. Uma vez só.
--
-- QUEM VÊ O QUÊ (resumo):
--  • Tudo continua PRIVADO por padrão. Nada vai para um grupo sem a pessoa escolher o grupo
--    a cada conclusão (nenhum vem marcado) e ela pode descompartilhar depois.
--  • O grupo vê: título da tarefa, legenda e (se a pessoa deixar) a foto. Só quem é MEMBRO do grupo.
--  • Placar e meta de desafio contam SÓ o que foi compartilhado com aquele grupo.
--  • Menores de 18 entram por convite e podem reagir com emojis, mas não comentam nem criam grupos.
--  • Bloquear esconde as duas pessoas uma da outra. Silenciar esconde só para quem silenciou.
--  • Quem desativa rankings no perfil não vê placares e não aparece neles.

-- ========== Perfil: desativar rankings ==========
alter table public.profiles add column hide_rankings boolean not null default false;
grant update (hide_rankings) on public.profiles to authenticated;

-- ========== Tabelas ==========
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  description text check (description is null or char_length(description) <= 200),
  mode text not null default 'feed_only' check (mode in ('competitive', 'cooperative', 'feed_only')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

-- O código de convite fica separado: só quem criou o grupo consegue ler.
create table public.group_invites (
  group_id uuid primary key references public.groups(id) on delete cascade,
  code text not null unique,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  description text check (description is null or char_length(description) <= 200),
  starts_on date not null,
  ends_on date not null,
  goal_points integer check (goal_points is null or goal_points > 0),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on and ends_on - starts_on <= 90)
);
create index challenges_group_idx on public.challenges (group_id, starts_on);

-- Compartilhamento: uma linha por (conclusão, grupo). Apagar a linha = descompartilhar.
create table public.completion_shares (
  completion_id uuid not null references public.completions(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_photo boolean not null default true,
  shared_at timestamptz not null default now(),
  primary key (completion_id, group_id)
);
create index completion_shares_group_idx on public.completion_shares (group_id, shared_at desc);

-- Reações com um conjunto fixo de emojis (guardados como códigos)
create table public.reactions (
  completion_id uuid not null,
  group_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('palmas', 'coracao', 'forca', 'festa', 'estrela')),
  created_at timestamptz not null default now(),
  primary key (completion_id, group_id, user_id, emoji),
  foreign key (completion_id, group_id) references public.completion_shares(completion_id, group_id) on delete cascade
);

-- Comentários curtos (só adultos escrevem)
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  completion_id uuid not null,
  group_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 200),
  created_at timestamptz not null default now(),
  foreign key (completion_id, group_id) references public.completion_shares(completion_id, group_id) on delete cascade
);
create index comments_share_idx on public.comments (completion_id, group_id, created_at);

create table public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.mutes (
  muter_id uuid not null references auth.users(id) on delete cascade,
  muted_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id),
  check (muter_id <> muted_id)
);

-- Denúncias: ficam guardadas para você revisar no painel do Supabase (Table Editor > reports).
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid,
  group_id uuid,
  completion_id uuid,
  comment_id uuid,
  reason text not null check (reason in ('desrespeito', 'spam', 'conteudo_inadequado', 'outro')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'aberta',
  created_at timestamptz not null default now()
);

-- "Estou começando agora": uma linha por pessoa, some sozinha depois de 45 minutos
create table public.starting_now (
  user_id uuid primary key references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  task_title text not null,
  group_ids uuid[] not null default '{}',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '45 minutes'
);

-- ========== Funções auxiliares (usadas pelas regras de acesso) ==========
create or replace function public.is_adult(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.birth_date <= (current_date - interval '18 years')::date from profiles p where p.id = p_user), false)
$$;

create or replace function public.is_member(p_group uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members m where m.group_id = p_group and m.user_id = p_user)
$$;

create or replace function public.is_group_owner(p_group uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members m where m.group_id = p_group and m.user_id = p_user and m.role = 'owner')
$$;

create or replace function public.bloqueado_entre(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks x where (x.blocker_id = a and x.blocked_id = b) or (x.blocker_id = b and x.blocked_id = a))
$$;

-- Pode reagir/comentar neste compartilhamento? (é membro do grupo e não há bloqueio com quem compartilhou)
-- Fica em função própria porque as regras de acesso escondem as postagens de quem foi bloqueado.
create or replace function public.pode_interagir(p_completion uuid, p_group uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from completion_shares s
     where s.completion_id = p_completion and s.group_id = p_group
       and is_member(p_group) and not bloqueado_entre(auth.uid(), s.user_id)
  )
$$;

-- Pode ver este arquivo de foto? (foto compartilhada COM foto, em grupo do qual é membro, sem bloqueio)
create or replace function public.pode_ver_foto(p_nome text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from completion_shares s
      join completions c on c.id = s.completion_id
     where s.share_photo and c.photo_path = p_nome
       and is_member(s.group_id) and not bloqueado_entre(auth.uid(), s.user_id)
  )
$$;

create or replace function public._novo_codigo()
returns text language sql volatile as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
$$;

-- ========== Row Level Security ==========
alter table public.groups             enable row level security;
alter table public.group_members      enable row level security;
alter table public.group_invites      enable row level security;
alter table public.challenges         enable row level security;
alter table public.completion_shares  enable row level security;
alter table public.reactions          enable row level security;
alter table public.comments           enable row level security;
alter table public.blocks             enable row level security;
alter table public.mutes              enable row level security;
alter table public.reports            enable row level security;
alter table public.starting_now       enable row level security;

-- Grupos: só membros veem. Criar é só pela função criar_grupo(). Dono edita nome, descrição e modo.
create policy "grupos: membros veem" on public.groups for select using (public.is_member(id));
create policy "grupos: dono edita"   on public.groups for update using (public.is_group_owner(id)) with check (public.is_group_owner(id));
create policy "grupos: dono apaga"   on public.groups for delete using (public.is_group_owner(id));
revoke update on public.groups from authenticated, anon;
grant  update (name, description, mode) on public.groups to authenticated;

-- Membros: membros veem a lista. Sair: a própria pessoa (menos o dono). Remover: o dono (menos ele mesmo).
create policy "membros: ver do meu grupo" on public.group_members for select using (public.is_member(group_id));
create policy "membros: sair ou remover" on public.group_members for delete
  using (role <> 'owner' and (user_id = auth.uid() or public.is_group_owner(group_id)));

-- Convite: só o dono vê e liga/desliga
create policy "convite: dono ve"     on public.group_invites for select using (public.is_group_owner(group_id));
create policy "convite: dono edita"  on public.group_invites for update using (public.is_group_owner(group_id)) with check (public.is_group_owner(group_id));
revoke update on public.group_invites from authenticated, anon;
grant  update (enabled) on public.group_invites to authenticated;

-- Desafios: membros veem, dono cria e edita
create policy "desafios: membros veem" on public.challenges for select using (public.is_member(group_id));
create policy "desafios: dono cria"    on public.challenges for insert
  with check (public.is_group_owner(group_id) and created_by = auth.uid());
create policy "desafios: dono edita"   on public.challenges for update using (public.is_group_owner(group_id)) with check (public.is_group_owner(group_id));
create policy "desafios: dono apaga"   on public.challenges for delete using (public.is_group_owner(group_id));

-- Compartilhamentos
create policy "shares: ver" on public.completion_shares for select
  using (user_id = auth.uid() or (public.is_member(group_id) and not public.bloqueado_entre(auth.uid(), user_id)));
create policy "shares: compartilhar as proprias" on public.completion_shares for insert
  with check (user_id = auth.uid() and public.is_member(group_id)
              and exists (select 1 from public.completions c where c.id = completion_id and c.user_id = auth.uid()));
create policy "shares: editar as proprias" on public.completion_shares for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "shares: descompartilhar ou moderar" on public.completion_shares for delete
  using (user_id = auth.uid() or public.is_group_owner(group_id));
revoke update on public.completion_shares from authenticated, anon;
grant  update (share_photo) on public.completion_shares to authenticated;

-- Reações
create policy "reacoes: ver" on public.reactions for select
  using (public.is_member(group_id) and not public.bloqueado_entre(auth.uid(), user_id));
create policy "reacoes: reagir" on public.reactions for insert
  with check (user_id = auth.uid() and public.pode_interagir(completion_id, group_id));
create policy "reacoes: tirar a propria" on public.reactions for delete using (user_id = auth.uid());

-- Comentários: só adultos escrevem
create policy "comentarios: ver" on public.comments for select
  using (public.is_member(group_id) and not public.bloqueado_entre(auth.uid(), user_id));
create policy "comentarios: escrever (adultos)" on public.comments for insert
  with check (user_id = auth.uid() and public.is_adult() and public.pode_interagir(completion_id, group_id));
create policy "comentarios: apagar" on public.comments for delete
  using (user_id = auth.uid()
         or public.is_group_owner(group_id)
         or exists (select 1 from public.completion_shares s
                     where s.completion_id = comments.completion_id and s.group_id = comments.group_id and s.user_id = auth.uid()));

-- Bloqueios, silenciados e denúncias: cada pessoa só mexe nos próprios
create policy "bloqueios: ver os proprios"   on public.blocks for select using (blocker_id = auth.uid());
create policy "bloqueios: criar"             on public.blocks for insert with check (blocker_id = auth.uid());
create policy "bloqueios: desfazer"          on public.blocks for delete using (blocker_id = auth.uid());
create policy "silenciados: ver os proprios" on public.mutes  for select using (muter_id = auth.uid());
create policy "silenciados: criar"           on public.mutes  for insert with check (muter_id = auth.uid());
create policy "silenciados: desfazer"        on public.mutes  for delete using (muter_id = auth.uid());
create policy "denuncias: ver as proprias"   on public.reports for select using (reporter_id = auth.uid());
create policy "denuncias: criar"             on public.reports for insert with check (reporter_id = auth.uid());

-- "Começando agora": a pessoa vê e apaga o próprio; criar é pela função comecando_agora()
create policy "agora: ver o proprio"   on public.starting_now for select using (user_id = auth.uid());
create policy "agora: apagar o proprio" on public.starting_now for delete using (user_id = auth.uid());

-- ========== Fotos compartilhadas: membros do grupo podem VER (nunca enviar ou apagar) ==========
create policy "fotos: ver as compartilhadas no meu grupo" on storage.objects for select
  using (bucket_id = 'provas' and public.pode_ver_foto(name));

-- ========== Gatilhos ==========
-- Mantém completions.visibility coerente: 'group' enquanto existir compartilhamento
create or replace function public.shares_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update completions set visibility = 'group' where id = new.completion_id and visibility = 'private';
  return new;
end $$;
create trigger shares_after_insert after insert on public.completion_shares
  for each row execute function public.shares_after_insert();

create or replace function public.shares_after_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from completion_shares s where s.completion_id = old.completion_id) then
    update completions set visibility = 'private' where id = old.completion_id and visibility = 'group';
  end if;
  return old;
end $$;
create trigger shares_after_delete after delete on public.completion_shares
  for each row execute function public.shares_after_delete();

-- Quem sai (ou é removido) do grupo leva junto o que compartilhou e comentou ali
create or replace function public.members_after_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from completion_shares where user_id = old.user_id and group_id = old.group_id;
  delete from comments  where user_id = old.user_id and group_id = old.group_id;
  delete from reactions where user_id = old.user_id and group_id = old.group_id;
  update starting_now set group_ids = array_remove(group_ids, old.group_id) where user_id = old.user_id;
  delete from starting_now where user_id = old.user_id and cardinality(group_ids) = 0;
  return old;
end $$;
create trigger members_after_delete after delete on public.group_members
  for each row execute function public.members_after_delete();

-- ========== Funções chamadas pelo app ==========

-- Criar grupo (só maiores de 18)
create or replace function public.criar_grupo(p_nome text, p_descricao text, p_modo text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then raise exception 'Você precisa estar logado.'; end if;
  if not is_adult(v_user) then raise exception 'Só maiores de 18 anos podem criar grupos.'; end if;
  if (select count(*) from groups g where g.created_by = v_user) >= 5 then
    raise exception 'Você já criou o máximo de 5 grupos.';
  end if;
  insert into groups (name, description, mode, created_by)
  values (btrim(p_nome), nullif(btrim(coalesce(p_descricao, '')), ''), p_modo, v_user)
  returning id into v_id;
  insert into group_members (group_id, user_id, role) values (v_id, v_user, 'owner');
  insert into group_invites (group_id, code) values (v_id, _novo_codigo());
  return v_id;
end $$;

-- Espiar um convite antes de entrar (mostra só o básico)
create or replace function public.ver_convite(p_codigo text)
returns table (group_id uuid, nome text, descricao text, modo text, membros int, ja_membro boolean)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.description, g.mode,
         (select count(*)::int from group_members x where x.group_id = g.id),
         is_member(g.id)
    from group_invites i
    join groups g on g.id = i.group_id
   where i.enabled
     and i.code = upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

-- Entrar com o código ou link
create or replace function public.entrar_no_grupo(p_codigo text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_group uuid;
begin
  if v_user is null then raise exception 'Você precisa estar logado.'; end if;
  select i.group_id into v_group
    from group_invites i
   where i.enabled and i.code = upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g'));
  if v_group is null then raise exception 'Esse convite não existe ou foi desligado.'; end if;
  if is_member(v_group, v_user) then return v_group; end if;
  if (select count(*) from group_members m where m.group_id = v_group) >= 30 then
    raise exception 'Esse grupo já está cheio (máximo de 30 pessoas).';
  end if;
  if (select count(*) from group_members m where m.user_id = v_user) >= 10 then
    raise exception 'Você já participa de 10 grupos, que é o máximo.';
  end if;
  insert into group_members (group_id, user_id, role) values (v_group, v_user, 'member');
  return v_group;
end $$;

-- Gerar um novo código (o antigo deixa de funcionar)
create or replace function public.renovar_convite(p_group uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text := _novo_codigo();
begin
  if not is_group_owner(p_group) then raise exception 'Só quem criou o grupo pode renovar o convite.'; end if;
  update group_invites set code = v_code, enabled = true where group_id = p_group;
  return v_code;
end $$;

create or replace function public.meus_grupos()
returns table (id uuid, nome text, descricao text, modo text, papel text, membros int)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.description, g.mode, m.role,
         (select count(*)::int from group_members x where x.group_id = g.id)
    from group_members m
    join groups g on g.id = m.group_id
   where m.user_id = auth.uid()
   order by g.created_at
$$;

create or replace function public.membros_do_grupo(p_group uuid)
returns table (user_id uuid, nome text, papel text, entrou_em timestamptz, eh_eu boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not is_member(p_group) then raise exception 'Você não faz parte deste grupo.'; end if;
  return query
  select m.user_id, coalesce(p.display_name, 'Alguém'), m.role, m.joined_at, (m.user_id = auth.uid())
    from group_members m
    left join profiles p on p.id = m.user_id
   where m.group_id = p_group
     and (m.user_id = auth.uid() or not bloqueado_entre(auth.uid(), m.user_id))
   order by (m.role = 'owner') desc, m.joined_at;
end $$;

-- Feed do grupo: só conclusões compartilhadas COM ESTE grupo
create or replace function public.feed_do_grupo(p_group uuid, p_limite int default 30, p_antes timestamptz default null)
returns table (
  completion_id uuid, user_id uuid, nome text, titulo text, legenda text, foto text,
  pontos int, concluida_em date, compartilhada_em timestamptz,
  reacoes jsonb, minhas_reacoes text[], comentarios int, eh_meu boolean
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_me uuid := auth.uid();
begin
  if not is_member(p_group, v_me) then raise exception 'Você não faz parte deste grupo.'; end if;
  return query
  select s.completion_id, s.user_id, coalesce(p.display_name, 'Alguém'), t.title, c.caption,
         case when s.share_photo then c.photo_path else null end,
         c.points::int, c.completed_on, s.shared_at,
         coalesce((select jsonb_object_agg(r.emoji, r.n)
                     from (select rr.emoji, count(*) as n
                             from reactions rr
                            where rr.completion_id = s.completion_id and rr.group_id = s.group_id
                              and not bloqueado_entre(v_me, rr.user_id)
                            group by rr.emoji) r), '{}'::jsonb),
         coalesce((select array_agg(rr.emoji) from reactions rr
                    where rr.completion_id = s.completion_id and rr.group_id = s.group_id and rr.user_id = v_me), '{}'::text[]),
         (select count(*)::int from comments cm
           where cm.completion_id = s.completion_id and cm.group_id = s.group_id
             and not bloqueado_entre(v_me, cm.user_id)),
         (s.user_id = v_me)
    from completion_shares s
    join completions c on c.id = s.completion_id
    join tasks t on t.id = c.task_id
    left join profiles p on p.id = s.user_id
   where s.group_id = p_group
     and (p_antes is null or s.shared_at < p_antes)
     and (s.user_id = v_me
          or (not bloqueado_entre(v_me, s.user_id)
              and not exists (select 1 from mutes mu where mu.muter_id = v_me and mu.muted_id = s.user_id)))
   order by s.shared_at desc
   limit least(greatest(p_limite, 1), 50);
end $$;

create or replace function public.comentarios_da_conclusao(p_completion uuid, p_group uuid)
returns table (id uuid, user_id uuid, nome text, texto text, criado_em timestamptz, eh_meu boolean, posso_apagar boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_me uuid := auth.uid();
  v_dono_da_conclusao uuid;
begin
  if not is_member(p_group, v_me) then raise exception 'Você não faz parte deste grupo.'; end if;
  select s.user_id into v_dono_da_conclusao from completion_shares s where s.completion_id = p_completion and s.group_id = p_group;
  return query
  select cm.id, cm.user_id, coalesce(p.display_name, 'Alguém'), cm.body, cm.created_at,
         (cm.user_id = v_me),
         (cm.user_id = v_me or v_dono_da_conclusao = v_me or is_group_owner(p_group, v_me))
    from comments cm
    left join profiles p on p.id = cm.user_id
   where cm.completion_id = p_completion and cm.group_id = p_group
     and (cm.user_id = v_me or not bloqueado_entre(v_me, cm.user_id))
   order by cm.created_at;
end $$;

-- Placar (só em grupos competitivos). Quem desativou rankings não vê e não aparece.
create or replace function public.placar_do_desafio(p_desafio uuid)
returns table (user_id uuid, nome text, pontos int, tarefas int, eh_meu boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_me uuid := auth.uid();
  v_group uuid; v_ini date; v_fim date; v_modo text;
begin
  select ch.group_id, ch.starts_on, ch.ends_on, g.mode into v_group, v_ini, v_fim, v_modo
    from challenges ch join groups g on g.id = ch.group_id where ch.id = p_desafio;
  if v_group is null or not is_member(v_group, v_me) then raise exception 'Desafio não encontrado.'; end if;
  if v_modo <> 'competitive' then return; end if;
  if coalesce((select pr.hide_rankings from profiles pr where pr.id = v_me), false) then return; end if;
  return query
  select s.user_id, coalesce(p.display_name, 'Alguém'), sum(c.points)::int, count(*)::int, (s.user_id = v_me)
    from completion_shares s
    join completions c on c.id = s.completion_id
    left join profiles p on p.id = s.user_id
   where s.group_id = v_group
     and c.completed_on between v_ini and v_fim
     and not coalesce(p.hide_rankings, false)
     and (s.user_id = v_me or not bloqueado_entre(v_me, s.user_id))
   group by s.user_id, p.display_name
   order by sum(c.points) desc, count(*) desc;
end $$;

-- Meta coletiva (só em grupos cooperativos). Soma de todos, sem nomes.
create or replace function public.meta_do_desafio(p_desafio uuid)
returns table (total_pontos int, participantes int, meta int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_group uuid; v_ini date; v_fim date; v_modo text; v_meta int;
begin
  select ch.group_id, ch.starts_on, ch.ends_on, g.mode, ch.goal_points into v_group, v_ini, v_fim, v_modo, v_meta
    from challenges ch join groups g on g.id = ch.group_id where ch.id = p_desafio;
  if v_group is null or not is_member(v_group) then raise exception 'Desafio não encontrado.'; end if;
  if v_modo <> 'cooperative' then return; end if;
  return query
  select coalesce(sum(c.points), 0)::int, count(distinct s.user_id)::int, v_meta
    from completion_shares s
    join completions c on c.id = s.completion_id
   where s.group_id = v_group and c.completed_on between v_ini and v_fim;
end $$;

-- "Estou começando agora" (mostra nome e título, só para os grupos escolhidos, some em 45 min)
create or replace function public.comecando_agora(p_task uuid, p_grupos uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_titulo text;
  v_grupos uuid[];
begin
  if v_me is null then raise exception 'Você precisa estar logado.'; end if;
  select t.title into v_titulo from tasks t where t.id = p_task and t.user_id = v_me;
  if v_titulo is null then raise exception 'Tarefa não encontrada.'; end if;
  select coalesce(array_agg(distinct g), '{}') into v_grupos from unnest(p_grupos) g where is_member(g, v_me);
  if cardinality(v_grupos) = 0 then raise exception 'Escolha pelo menos um dos seus grupos.'; end if;
  insert into starting_now (user_id, task_id, task_title, group_ids, started_at, expires_at)
  values (v_me, p_task, v_titulo, v_grupos, now(), now() + interval '45 minutes')
  on conflict (user_id) do update
    set task_id = excluded.task_id, task_title = excluded.task_title, group_ids = excluded.group_ids,
        started_at = excluded.started_at, expires_at = excluded.expires_at;
end $$;

create or replace function public.quem_esta_fazendo(p_group uuid default null)
returns table (user_id uuid, nome text, titulo text, desde timestamptz, eh_eu boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_me uuid := auth.uid();
begin
  if p_group is not null and not is_member(p_group, v_me) then raise exception 'Você não faz parte deste grupo.'; end if;
  return query
  select sn.user_id, coalesce(p.display_name, 'Alguém'), sn.task_title, sn.started_at, (sn.user_id = v_me)
    from starting_now sn
    left join profiles p on p.id = sn.user_id
   where sn.expires_at > now()
     and exists (select 1 from unnest(sn.group_ids) g
                  where is_member(g, v_me) and (p_group is null or g = p_group))
     and (sn.user_id = v_me
          or (not bloqueado_entre(v_me, sn.user_id)
              and not exists (select 1 from mutes mu where mu.muter_id = v_me and mu.muted_id = sn.user_id)))
   order by sn.started_at desc;
end $$;

-- Quem eu bloqueei ou silenciei (com nomes, para poder desfazer)
create or replace function public.minhas_restricoes()
returns table (user_id uuid, nome text, tipo text)
language sql stable security definer set search_path = public as $$
  select b.blocked_id, coalesce(p.display_name, 'Alguém'), 'bloqueado'::text
    from blocks b left join profiles p on p.id = b.blocked_id where b.blocker_id = auth.uid()
  union all
  select m.muted_id, coalesce(p.display_name, 'Alguém'), 'silenciado'::text
    from mutes m left join profiles p on p.id = m.muted_id where m.muter_id = auth.uid()
$$;

-- "Zerar meus dados" agora também limpa o que é de grupos
create or replace function public.resetar_minha_conta()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Você precisa estar logado.';
  end if;

  delete from comments          where user_id = v_user;
  delete from reactions         where user_id = v_user;
  delete from starting_now      where user_id = v_user;
  delete from completions       where user_id = v_user;   -- apaga também os compartilhamentos
  delete from tasks             where user_id = v_user;   -- apaga também os passos
  delete from rest_days         where user_id = v_user;
  delete from user_achievements where user_id = v_user;
  update profiles set total_points = 0 where id = v_user;
end $$;

-- ========== Quem pode chamar as funções ==========
do $$
declare f text;
begin
  foreach f in array array[
    'is_adult(uuid)', 'is_member(uuid,uuid)', 'is_group_owner(uuid,uuid)', 'bloqueado_entre(uuid,uuid)',
    'pode_interagir(uuid,uuid)', 'pode_ver_foto(text)',
    'criar_grupo(text,text,text)', 'ver_convite(text)', 'entrar_no_grupo(text)', 'renovar_convite(uuid)',
    'meus_grupos()', 'membros_do_grupo(uuid)', 'feed_do_grupo(uuid,int,timestamptz)',
    'comentarios_da_conclusao(uuid,uuid)', 'placar_do_desafio(uuid)', 'meta_do_desafio(uuid)',
    'comecando_agora(uuid,uuid[])', 'quem_esta_fazendo(uuid)', 'minhas_restricoes()', 'resetar_minha_conta()'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public._novo_codigo() from public, anon, authenticated;
