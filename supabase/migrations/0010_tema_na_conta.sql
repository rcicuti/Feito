-- Feito! — O tema escolhido passa a ficar salvo na conta (vale em todos os aparelhos)
-- Rode no SQL Editor do Supabase DEPOIS da 0009. Pode rodar uma vez só.
--
-- Antes, o tema ficava só guardado no aparelho (celular e computador podiam ficar diferentes).
-- Agora a escolha (tema de cores e claro/escuro) fica no perfil da pessoa.
-- Só a própria pessoa lê e altera, como o resto do perfil.

alter table public.profiles add column theme_palette text check (theme_palette is null or theme_palette in ('sol', 'limao'));
alter table public.profiles add column theme_mode    text check (theme_mode    is null or theme_mode    in ('claro', 'escuro'));

grant update (theme_palette, theme_mode) on public.profiles to authenticated;
