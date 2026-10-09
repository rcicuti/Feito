-- Feito! — Etapa 1: perfis, tarefas, passos, conclusões e fotos (tudo privado por padrão)
-- Rode no SQL Editor do Supabase (ou com `supabase db push`).

-- ========== Perfis ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birth_date date,
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Cria o perfil automaticamente quando a pessoa cria a conta
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== Tarefas ==========
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  scheduled_time time,
  repeat_type text not null default 'none' check (repeat_type in ('none','daily','weekly')),
  repeat_days smallint[] not null default '{}',  -- 0 = domingo ... 6 = sábado
  start_date date not null default current_date,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index tasks_user_idx on public.tasks (user_id, start_date);

create table public.task_steps (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  position smallint not null default 0
);
create index task_steps_task_idx on public.task_steps (task_id);

-- ========== Conclusões (a "prova") ==========
-- Visibilidade padrão é SEMPRE privada. Nesta etapa só 'private' é aceito;
-- 'therapist' e 'group' entram nas Etapas 3 e 4, com suas próprias regras.
create table public.completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  completed_on date not null,
  photo_path text,
  caption text check (caption is null or char_length(caption) <= 280),
  visibility text not null default 'private' check (visibility in ('private','therapist','group')),
  created_at timestamptz not null default now(),
  unique (task_id, completed_on)
);
create index completions_user_idx on public.completions (user_id, completed_on);

create table public.step_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  step_id uuid not null references public.task_steps(id) on delete cascade,
  completed_on date not null,
  unique (step_id, completed_on)
);

-- ========== Row Level Security ==========
alter table public.profiles         enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_steps       enable row level security;
alter table public.completions      enable row level security;
alter table public.step_completions enable row level security;

-- Perfis: cada pessoa vê e edita só o próprio
create policy "perfil: ver o proprio"    on public.profiles for select using (id = auth.uid());
create policy "perfil: editar o proprio" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Tarefas e passos: só quem criou
create policy "tarefas: ver as proprias"    on public.tasks for select using (user_id = auth.uid());
create policy "tarefas: criar as proprias"  on public.tasks for insert with check (user_id = auth.uid());
create policy "tarefas: editar as proprias" on public.tasks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tarefas: apagar as proprias" on public.tasks for delete using (user_id = auth.uid());

create policy "passos: ver os proprios"    on public.task_steps for select using (user_id = auth.uid());
create policy "passos: criar os proprios"  on public.task_steps for insert
  with check (user_id = auth.uid() and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
create policy "passos: editar os proprios" on public.task_steps for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "passos: apagar os proprios" on public.task_steps for delete using (user_id = auth.uid());

-- Conclusões: só quem concluiu; por enquanto só podem ser privadas
create policy "conclusoes: ver as proprias"   on public.completions for select using (user_id = auth.uid());
create policy "conclusoes: criar as proprias" on public.completions for insert
  with check (user_id = auth.uid() and visibility = 'private'
              and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
create policy "conclusoes: editar as proprias" on public.completions for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and visibility = 'private');
create policy "conclusoes: apagar as proprias" on public.completions for delete using (user_id = auth.uid());

create policy "passos feitos: ver"    on public.step_completions for select using (user_id = auth.uid());
create policy "passos feitos: criar"  on public.step_completions for insert
  with check (user_id = auth.uid() and exists (select 1 from public.task_steps s where s.id = step_id and s.user_id = auth.uid()));
create policy "passos feitos: apagar" on public.step_completions for delete using (user_id = auth.uid());

-- ========== Fotos: bucket PRIVADO, uma pasta por pessoa ==========
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('provas', 'provas', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "fotos: ver as proprias" on storage.objects for select
  using (bucket_id = 'provas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: enviar nas proprias" on storage.objects for insert
  with check (bucket_id = 'provas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: apagar as proprias" on storage.objects for delete
  using (bucket_id = 'provas' and (storage.foldername(name))[1] = auth.uid()::text);

-- ========== Excluir conta e todos os dados ==========
-- Apagar o usuário em auth.users remove em cascata perfil, tarefas, passos e conclusões.
-- As fotos no Storage precisam ser removidas pelo app antes (ver Etapa 5, "excluir conta").
