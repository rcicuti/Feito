-- Feito! — Etapa 4: terapeuta (vínculo, compartilhamento, comentários, sugestões e resumo de adesão)
-- Rode no SQL Editor do Supabase DEPOIS da 0001 a 0004. Uma vez só.
--
-- QUEM VÊ O QUÊ (resumo):
--  • O vínculo só vale depois que a PESSOA (paciente) aceita. Terapeuta nunca se vincula sozinho(a).
--  • Duas chaves, separadas, que o paciente liga e desliga a qualquer momento (por terapeuta):
--      1) "tarefas": o terapeuta vê SÓ as conclusões que o paciente marcou "Meu(minha) terapeuta"
--         (título, legenda e, se o paciente deixar, a foto). Desligar a chave apaga esses compartilhamentos.
--      2) "resumo": o terapeuta vê números por semana (dias ativos e tarefas feitas). Nada de títulos ou fotos.
--  • Terapeuta pode comentar nas conclusões compartilhadas e sugerir tarefas. Sugestão NUNCA entra sozinha
--    na lista: chega como convite e o paciente aceita ou dispensa. O terapeuta não vê as dispensadas.
--  • Terapeuta NÃO vê: tarefas privadas, tarefas de grupo, pontos, conquistas, grupos, perfil completo.
--  • Menores de 18 anos não se vinculam nem viram terapeuta (fluxo de responsável fica para o futuro).
--  • Qualquer um dos dois pode encerrar o vínculo quando quiser.

-- ========== Perfil: papel de terapeuta ==========
alter table public.profiles add column is_therapist boolean not null default false;
alter table public.profiles add column crp text check (crp is null or char_length(crp) <= 30);
-- (sem GRANT de update: o papel só muda pela função definir_papel_terapeuta abaixo)

-- ========== Tabelas ==========
create table public.therapist_links (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  initiated_by text not null check (initiated_by in ('patient', 'therapist')),
  status text not null default 'pending' check (status in ('pending', 'active')),
  share_tasks boolean not null default false,
  share_summary boolean not null default false,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (therapist_id, patient_id),
  check (therapist_id <> patient_id)
);
create index therapist_links_patient_idx on public.therapist_links (patient_id);

-- Código fixo do(a) terapeuta (o paciente digita para pedir vínculo; o paciente decide tudo na tela de confirmação)
create table public.therapist_codes (
  therapist_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  enabled boolean not null default true
);

-- Código do paciente (vale 48 horas, uso único; o terapeuta digita e o paciente precisa aceitar)
create table public.patient_invites (
  patient_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null default now() + interval '48 hours'
);

-- Conclusões que o paciente escolheu mostrar a ESTE vínculo
create table public.therapist_shares (
  completion_id uuid not null references public.completions(id) on delete cascade,
  link_id uuid not null references public.therapist_links(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_photo boolean not null default true,
  shared_at timestamptz not null default now(),
  primary key (completion_id, link_id)
);
create index therapist_shares_link_idx on public.therapist_shares (link_id, shared_at desc);

create table public.therapist_comments (
  id uuid primary key default gen_random_uuid(),
  completion_id uuid not null,
  link_id uuid not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 300),
  created_at timestamptz not null default now(),
  foreign key (completion_id, link_id) references public.therapist_shares(completion_id, link_id) on delete cascade
);
create index therapist_comments_idx on public.therapist_comments (completion_id, link_id, created_at);

create table public.suggested_tasks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.therapist_links(id) on delete cascade,
  therapist_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 120),
  note text check (note is null or char_length(note) <= 200),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index suggested_tasks_patient_idx on public.suggested_tasks (patient_id, status);
create index suggested_tasks_link_idx on public.suggested_tasks (link_id);

-- ========== Funções auxiliares (SECURITY DEFINER para não esbarrar nas regras de acesso) ==========
-- Sou o(a) terapeuta deste vínculo ATIVO?
create or replace function public.sou_terapeuta_do_vinculo(p_link uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from therapist_links l
                  where l.id = p_link and l.therapist_id = auth.uid() and l.status = 'active')
$$;

create or replace function public.sou_paciente_do_vinculo(p_link uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from therapist_links l
                  where l.id = p_link and l.patient_id = auth.uid() and l.status = 'active')
$$;

-- Sou terapeuta ativo deste vínculo E a chave "tarefas" está ligada?
create or replace function public.terapeuta_ve_tarefas(p_link uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from therapist_links l
                  where l.id = p_link and l.therapist_id = auth.uid() and l.status = 'active' and l.share_tasks)
$$;

-- O terapeuta pode abrir este arquivo de foto? (conclusão compartilhada COM foto, vínculo ativo, chave ligada)
create or replace function public.terapeuta_pode_ver_foto(p_nome text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from therapist_shares s
      join completions c on c.id = s.completion_id
      join therapist_links l on l.id = s.link_id
     where s.share_photo and c.photo_path = p_nome
       and l.therapist_id = auth.uid() and l.status = 'active' and l.share_tasks
  )
$$;

-- ========== Row Level Security ==========
alter table public.therapist_links    enable row level security;
alter table public.therapist_codes    enable row level security;
alter table public.patient_invites    enable row level security;
alter table public.therapist_shares   enable row level security;
alter table public.therapist_comments enable row level security;
alter table public.suggested_tasks    enable row level security;

-- Vínculos: só as duas pessoas veem. Ninguém cria nem muda status direto (só pelas funções).
create policy "vinculo: ver o meu" on public.therapist_links for select
  using (patient_id = auth.uid() or therapist_id = auth.uid());
create policy "vinculo: encerrar" on public.therapist_links for delete
  using (patient_id = auth.uid() or therapist_id = auth.uid());
create policy "vinculo: paciente ajusta chaves" on public.therapist_links for update
  using (patient_id = auth.uid() and status = 'active') with check (patient_id = auth.uid() and status = 'active');
revoke update on public.therapist_links from authenticated, anon;
grant update (share_tasks, share_summary) on public.therapist_links to authenticated;

create policy "codigo terapeuta: so o dono" on public.therapist_codes for select using (therapist_id = auth.uid());
create policy "codigo terapeuta: dono liga/desliga" on public.therapist_codes for update
  using (therapist_id = auth.uid()) with check (therapist_id = auth.uid());
revoke update on public.therapist_codes from authenticated, anon;
grant update (enabled) on public.therapist_codes to authenticated;

create policy "convite paciente: so o dono" on public.patient_invites for select using (patient_id = auth.uid());
create policy "convite paciente: dono apaga" on public.patient_invites for delete using (patient_id = auth.uid());

-- Compartilhamentos com terapeuta: o paciente vê/cria/apaga os dele; o terapeuta só vê (com a chave ligada)
create policy "tshare: ver" on public.therapist_shares for select
  using (user_id = auth.uid() or public.terapeuta_ve_tarefas(link_id));
create policy "tshare: compartilhar as proprias" on public.therapist_shares for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.completions c where c.id = completion_id and c.user_id = auth.uid())
    and exists (select 1 from public.therapist_links l
                 where l.id = link_id and l.patient_id = auth.uid() and l.status = 'active' and l.share_tasks)
  );
create policy "tshare: descompartilhar" on public.therapist_shares for delete using (user_id = auth.uid());

-- Comentários: paciente e terapeuta do vínculo leem; só o terapeuta escreve; autor ou paciente apaga
create policy "tcomment: ver" on public.therapist_comments for select
  using (public.sou_paciente_do_vinculo(link_id) or public.terapeuta_ve_tarefas(link_id));
create policy "tcomment: terapeuta escreve" on public.therapist_comments for insert
  with check (author_id = auth.uid() and public.terapeuta_ve_tarefas(link_id));
create policy "tcomment: apagar" on public.therapist_comments for delete
  using (author_id = auth.uid() or public.sou_paciente_do_vinculo(link_id));

-- Sugestões: o terapeuta cria e vê (menos as dispensadas); o paciente vê as dele; ninguém edita direto
create policy "sugestao: ver" on public.suggested_tasks for select
  using (patient_id = auth.uid() or (therapist_id = auth.uid() and status <> 'declined'));
create policy "sugestao: terapeuta cria" on public.suggested_tasks for insert
  with check (
    therapist_id = auth.uid() and status = 'pending'
    and exists (select 1 from public.therapist_links l
                 where l.id = link_id and l.therapist_id = auth.uid() and l.patient_id = suggested_tasks.patient_id and l.status = 'active')
    and (select count(*) from public.suggested_tasks s where s.link_id = suggested_tasks.link_id and s.status = 'pending') < 10
  );
create policy "sugestao: terapeuta retira a pendente" on public.suggested_tasks for delete
  using (therapist_id = auth.uid() and status = 'pending');

-- ========== Fotos: o terapeuta pode VER as compartilhadas com ele (nunca enviar ou apagar) ==========
create policy "fotos: terapeuta ve as compartilhadas" on storage.objects for select
  using (bucket_id = 'provas' and public.terapeuta_pode_ver_foto(name));

-- ========== Gatilhos ==========
-- completions.visibility fica coerente: 'therapist' enquanto só há compartilhamento com terapeuta
create or replace function public.tshares_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update completions set visibility = 'therapist' where id = new.completion_id and visibility = 'private';
  return new;
end $$;
create trigger tshares_after_insert after insert on public.therapist_shares
  for each row execute function public.tshares_after_insert();

create or replace function public.tshares_after_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from therapist_shares s where s.completion_id = old.completion_id) then
    update completions set visibility = 'private' where id = old.completion_id and visibility = 'therapist';
  end if;
  return old;
end $$;
create trigger tshares_after_delete after delete on public.therapist_shares
  for each row execute function public.tshares_after_delete();

-- Se o paciente DESLIGA a chave "tarefas", o que estava compartilhado com aquele vínculo é apagado
create or replace function public.link_after_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.share_tasks and not new.share_tasks then
    delete from therapist_shares where link_id = new.id;
  end if;
  return new;
end $$;
create trigger link_after_update after update on public.therapist_links
  for each row execute function public.link_after_update();

-- ========== Funções que o app chama ==========

-- Virar terapeuta (ou deixar de ser). Só maiores de 18. Ao deixar de ser, os vínculos como terapeuta são encerrados.
create or replace function public.definir_papel_terapeuta(p_ativo boolean, p_crp text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Você precisa estar logado.'; end if;
  if p_ativo then
    if not is_adult(v_user) then raise exception 'Só maiores de 18 anos podem usar o perfil de terapeuta.'; end if;
    update profiles set is_therapist = true, crp = nullif(btrim(coalesce(p_crp, '')), '') where id = v_user;
    insert into therapist_codes (therapist_id, code) values (v_user, _novo_codigo()) on conflict do nothing;
    update therapist_codes set enabled = true where therapist_id = v_user;
  else
    delete from therapist_links where therapist_id = v_user;
    delete from therapist_codes where therapist_id = v_user;
    update profiles set is_therapist = false where id = v_user;
  end if;
end $$;

create or replace function public.renovar_codigo_terapeuta()
returns text language plpgsql security definer set search_path = public as $$
declare v_code text := _novo_codigo();
begin
  if not coalesce((select is_therapist from profiles where id = auth.uid()), false) then
    raise exception 'Você não está com o perfil de terapeuta.';
  end if;
  update therapist_codes set code = v_code, enabled = true where therapist_id = auth.uid();
  return v_code;
end $$;

-- Paciente: olha quem é o terapeuta de um código (antes de decidir)
create or replace function public.ver_terapeuta_por_codigo(p_codigo text)
returns table (terapeuta_id uuid, nome text, crp text, ja_vinculado boolean)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(p.display_name, 'Profissional'), p.crp,
         exists (select 1 from therapist_links l where l.therapist_id = p.id and l.patient_id = auth.uid())
    from therapist_codes c
    join profiles p on p.id = c.therapist_id and p.is_therapist
   where c.enabled
     and c.code = upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g'))
     and is_adult()
$$;

-- Paciente: aceita o vínculo com o terapeuta do código, já escolhendo as chaves
create or replace function public.vincular_com_terapeuta(p_codigo text, p_tarefas boolean, p_resumo boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_ter uuid;
  v_id uuid;
begin
  if not is_adult(v_me) then raise exception 'Por enquanto, só maiores de 18 anos podem se vincular a um(a) terapeuta.'; end if;
  select c.therapist_id into v_ter
    from therapist_codes c join profiles p on p.id = c.therapist_id and p.is_therapist
   where c.enabled and c.code = upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g'));
  if v_ter is null then raise exception 'Código não encontrado. Peça um novo para o(a) terapeuta.'; end if;
  if v_ter = v_me then raise exception 'Esse é o seu próprio código.'; end if;
  if exists (select 1 from therapist_links l where l.therapist_id = v_ter and l.patient_id = v_me) then
    raise exception 'Você já tem um vínculo (ou pedido) com essa pessoa.';
  end if;
  if (select count(*) from therapist_links l where l.patient_id = v_me) >= 3 then
    raise exception 'Você já tem 3 vínculos. Encerre um para criar outro.';
  end if;
  insert into therapist_links (therapist_id, patient_id, initiated_by, status, share_tasks, share_summary, accepted_at)
  values (v_ter, v_me, 'therapist', 'active', coalesce(p_tarefas, false), coalesce(p_resumo, false), now())
  returning id into v_id;
  return v_id;
end $$;

-- Paciente: gera um código (48 h, uso único) para entregar ao terapeuta
create or replace function public.gerar_codigo_paciente()
returns text language plpgsql security definer set search_path = public as $$
declare v_code text := _novo_codigo();
begin
  if not is_adult() then raise exception 'Por enquanto, só maiores de 18 anos podem se vincular a um(a) terapeuta.'; end if;
  insert into patient_invites (patient_id, code, expires_at) values (auth.uid(), v_code, now() + interval '48 hours')
  on conflict (patient_id) do update set code = excluded.code, expires_at = excluded.expires_at;
  return v_code;
end $$;

-- Terapeuta: digita o código do paciente. Cria um PEDIDO; só vale quando o paciente aceitar.
create or replace function public.pedir_vinculo_com_paciente(p_codigo text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pac uuid;
  v_id uuid;
begin
  if not coalesce((select is_therapist from profiles where id = v_me), false) then
    raise exception 'Ative o perfil de terapeuta primeiro.';
  end if;
  select i.patient_id into v_pac from patient_invites i
   where i.expires_at > now() and i.code = upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g'));
  if v_pac is null then raise exception 'Código não encontrado ou vencido. Peça um novo para a pessoa.'; end if;
  if v_pac = v_me then raise exception 'Esse é o seu próprio código.'; end if;
  if not is_adult(v_pac) then raise exception 'Código não encontrado ou vencido. Peça um novo para a pessoa.'; end if;
  if exists (select 1 from therapist_links l where l.therapist_id = v_me and l.patient_id = v_pac) then
    raise exception 'Já existe um vínculo (ou pedido) com essa pessoa.';
  end if;
  insert into therapist_links (therapist_id, patient_id, initiated_by, status)
  values (v_me, v_pac, 'patient', 'pending') returning id into v_id;
  delete from patient_invites where patient_id = v_pac;  -- uso único
  return v_id;
end $$;

-- Paciente: responde a um pedido (aceitar com as chaves, ou recusar)
create or replace function public.responder_vinculo(p_link uuid, p_aceitar boolean, p_tarefas boolean, p_resumo boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_l therapist_links;
begin
  select * into v_l from therapist_links where id = p_link and patient_id = auth.uid() and status = 'pending';
  if v_l.id is null then raise exception 'Pedido não encontrado.'; end if;
  if p_aceitar then
    if not is_adult() then raise exception 'Por enquanto, só maiores de 18 anos podem se vincular a um(a) terapeuta.'; end if;
    if (select count(*) from therapist_links l where l.patient_id = auth.uid() and l.status = 'active') >= 3 then
      raise exception 'Você já tem 3 vínculos. Encerre um para aceitar outro.';
    end if;
    update therapist_links
       set status = 'active', share_tasks = coalesce(p_tarefas, false), share_summary = coalesce(p_resumo, false), accepted_at = now()
     where id = p_link;
  else
    delete from therapist_links where id = p_link;
  end if;
end $$;

-- Paciente: meus vínculos e pedidos (com o nome do terapeuta)
create or replace function public.meus_terapeutas()
returns table (link_id uuid, terapeuta_id uuid, nome text, crp text, status text, share_tasks boolean, share_summary boolean, criado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.therapist_id, coalesce(p.display_name, 'Profissional'), p.crp, l.status, l.share_tasks, l.share_summary, l.created_at
    from therapist_links l join profiles p on p.id = l.therapist_id
   where l.patient_id = auth.uid()
   order by l.status, l.created_at
$$;

-- Terapeuta: meus pacientes e pedidos enviados (sem expor nada além do nome e das chaves)
create or replace function public.meus_pacientes()
returns table (link_id uuid, paciente_id uuid, nome text, status text, share_tasks boolean, share_summary boolean, criado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.patient_id, coalesce(p.display_name, 'Paciente'), l.status, l.share_tasks, l.share_summary, l.created_at
    from therapist_links l join profiles p on p.id = l.patient_id
   where l.therapist_id = auth.uid()
   order by l.status, l.created_at
$$;

-- Terapeuta: conclusões que o paciente compartilhou com ele(a)
create or replace function public.conclusoes_do_paciente(p_link uuid, p_limite int default 30, p_antes timestamptz default null)
returns table (completion_id uuid, titulo text, legenda text, foto text, pontos int, concluida_em date, compartilhada_em timestamptz, comentarios int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not terapeuta_ve_tarefas(p_link) then return; end if;
  return query
  select s.completion_id, t.title, c.caption,
         case when s.share_photo then c.photo_path else null end,
         c.points::int, c.completed_on, s.shared_at,
         (select count(*)::int from therapist_comments tc where tc.completion_id = s.completion_id and tc.link_id = s.link_id)
    from therapist_shares s
    join completions c on c.id = s.completion_id
    join tasks t on t.id = c.task_id
   where s.link_id = p_link and (p_antes is null or s.shared_at < p_antes)
   order by s.shared_at desc
   limit least(greatest(p_limite, 1), 50);
end $$;

-- Paciente: o que EU compartilhei com um terapeuta, com os comentários
create or replace function public.compartilhado_com_terapeuta(p_link uuid, p_limite int default 30)
returns table (completion_id uuid, titulo text, legenda text, foto text, concluida_em date, compartilhada_em timestamptz, comentarios int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not sou_paciente_do_vinculo(p_link) then return; end if;
  return query
  select s.completion_id, t.title, c.caption,
         case when s.share_photo then c.photo_path else null end,
         c.completed_on, s.shared_at,
         (select count(*)::int from therapist_comments tc where tc.completion_id = s.completion_id and tc.link_id = s.link_id)
    from therapist_shares s
    join completions c on c.id = s.completion_id
    join tasks t on t.id = c.task_id
   where s.link_id = p_link and s.user_id = auth.uid()
   order by s.shared_at desc
   limit least(greatest(p_limite, 1), 50);
end $$;

-- Comentários de uma conclusão compartilhada (paciente ou terapeuta do vínculo)
create or replace function public.comentarios_do_terapeuta(p_completion uuid, p_link uuid)
returns table (id uuid, nome text, texto text, criado_em timestamptz, eh_meu boolean, posso_apagar boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not (sou_paciente_do_vinculo(p_link) or terapeuta_ve_tarefas(p_link)) then return; end if;
  return query
  select c.id, coalesce(p.display_name, 'Terapeuta'), c.body, c.created_at,
         (c.author_id = auth.uid()),
         (c.author_id = auth.uid() or sou_paciente_do_vinculo(p_link))
    from therapist_comments c
    left join profiles p on p.id = c.author_id
   where c.completion_id = p_completion and c.link_id = p_link
   order by c.created_at;
end $$;

-- Terapeuta: resumo semanal de adesão do paciente (SÓ NÚMEROS; exige a chave "resumo")
create or replace function public.resumo_do_paciente(p_link uuid, p_semanas int default 8)
returns table (semana date, dias_ativos int, tarefas int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_pac uuid;
  v_n int := least(greatest(coalesce(p_semanas, 8), 1), 26);
  v_ini date;
begin
  select l.patient_id into v_pac from therapist_links l
   where l.id = p_link and l.therapist_id = auth.uid() and l.status = 'active' and l.share_summary;
  if v_pac is null then return; end if;
  v_ini := date_trunc('week', current_date)::date - (v_n - 1) * 7;
  return query
  select s.semana::date,
         coalesce(x.dias, 0)::int,
         coalesce(x.qtd, 0)::int
    from generate_series(v_ini, date_trunc('week', current_date)::date, interval '7 days') as s(semana)
    left join (
      select date_trunc('week', c.completed_on)::date as semana,
             count(distinct c.completed_on) as dias,
             count(*) as qtd
        from completions c
       where c.user_id = v_pac and c.completed_on >= v_ini
       group by 1
    ) x on x.semana = s.semana::date
   order by s.semana;
end $$;

-- Paciente: sugestões esperando resposta
create or replace function public.minhas_sugestoes()
returns table (id uuid, titulo text, nota text, terapeuta text, criada_em timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.title, s.note, coalesce(p.display_name, 'Terapeuta'), s.created_at
    from suggested_tasks s
    join therapist_links l on l.id = s.link_id and l.status = 'active'
    left join profiles p on p.id = s.therapist_id
   where s.patient_id = auth.uid() and s.status = 'pending'
   order by s.created_at
$$;

-- Paciente: aceita (cria a tarefa na lista) ou dispensa (sem consequência nenhuma)
create or replace function public.responder_sugestao(p_id uuid, p_aceitar boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_s suggested_tasks;
begin
  select * into v_s from suggested_tasks where id = p_id and patient_id = auth.uid() and status = 'pending';
  if v_s.id is null then raise exception 'Sugestão não encontrada.'; end if;
  if p_aceitar then
    insert into tasks (user_id, title, start_date, repeat_type) values (auth.uid(), v_s.title, current_date, 'none');
    update suggested_tasks set status = 'accepted', decided_at = now() where id = p_id;
  else
    update suggested_tasks set status = 'declined', decided_at = now() where id = p_id;
  end if;
end $$;

-- "Zerar meus dados" agora também apaga o que é do acompanhamento (vínculos continuam; é uma relação, não um dado de tarefa)
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
  delete from suggested_tasks   where patient_id = v_user;
  delete from completions       where user_id = v_user;   -- apaga também os compartilhamentos (grupos e terapeuta)
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
    'sou_terapeuta_do_vinculo(uuid)', 'sou_paciente_do_vinculo(uuid)', 'terapeuta_ve_tarefas(uuid)', 'terapeuta_pode_ver_foto(text)',
    'definir_papel_terapeuta(boolean,text)', 'renovar_codigo_terapeuta()', 'ver_terapeuta_por_codigo(text)',
    'vincular_com_terapeuta(text,boolean,boolean)', 'gerar_codigo_paciente()', 'pedir_vinculo_com_paciente(text)',
    'responder_vinculo(uuid,boolean,boolean,boolean)', 'meus_terapeutas()', 'meus_pacientes()',
    'conclusoes_do_paciente(uuid,int,timestamptz)', 'compartilhado_com_terapeuta(uuid,int)',
    'comentarios_do_terapeuta(uuid,uuid)', 'resumo_do_paciente(uuid,int)', 'minhas_sugestoes()',
    'responder_sugestao(uuid,boolean)', 'resetar_minha_conta()'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
