-- Feito! — Editar o próprio comentário nas publicações do grupo
-- Rode no SQL Editor do Supabase DEPOIS da 0008. Pode rodar uma vez só.
--
-- Quem escreveu pode editar o texto do próprio comentário (e só o texto).
-- O comentário passa a mostrar "editado", para ninguém ser enganado por uma mudança silenciosa.
-- Valem as mesmas regras de quando se escreve: só adultos, 1 a 200 caracteres,
-- e não dá para editar se houver bloqueio entre as pessoas ou se a publicação saiu do grupo.

alter table public.comments add column edited_at timestamptz;

-- Só o texto pode ser alterado (autor, grupo e data ficam fixos)
revoke update on public.comments from authenticated, anon;
grant  update (body) on public.comments to authenticated;

create policy "comentarios: editar o proprio (adultos)" on public.comments for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_adult() and public.pode_interagir(completion_id, group_id));

-- Marca quando foi editado (o app não consegue escolher esse valor)
create or replace function public.comments_marcar_edicao()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.body is distinct from old.body then
    new.edited_at := now();
  end if;
  return new;
end $$;

create trigger comments_before_update
  before update on public.comments
  for each row execute function public.comments_marcar_edicao();

-- A lista de comentários passa a informar se o comentário foi editado
drop function public.comentarios_da_conclusao(uuid, uuid);
create function public.comentarios_da_conclusao(p_completion uuid, p_group uuid)
returns table (id uuid, user_id uuid, nome text, texto text, criado_em timestamptz, eh_meu boolean, posso_apagar boolean, editado boolean)
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
         (cm.user_id = v_me or v_dono_da_conclusao = v_me or is_group_owner(p_group, v_me)),
         (cm.edited_at is not null)
    from comments cm
    left join profiles p on p.id = cm.user_id
   where cm.completion_id = p_completion and cm.group_id = p_group
     and (cm.user_id = v_me or not bloqueado_entre(v_me, cm.user_id))
   order by cm.created_at;
end $$;
revoke all on function public.comentarios_da_conclusao(uuid, uuid) from public, anon;
grant execute on function public.comentarios_da_conclusao(uuid, uuid) to authenticated;
