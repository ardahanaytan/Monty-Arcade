-- Giriş: e-posta + kullanıcı adı + şifre. Kullanıcı adı kayıtta (signUp metadata) gelir ve sonra değişmez.

-- Yeni kullanıcının profili kayıttaki kullanıcı adıyla oluşur; adı geçersiz ya da alınmışsa kayıt da olmaz.
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  name text := lower(trim(new.raw_user_meta_data ->> 'username'));
begin
  if name is null or name !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'invalid_username';
  end if;
  begin
    insert into public.profiles (id, username) values (new.id, name);
  exception when unique_violation then
    raise exception 'username_taken';
  end;
  return new;
end $$;

-- Kayıt formunda anlık kontrol. Kullanıcı adları zaten herkese açık; e-posta bilgisi sızdırmaz.
create function public.username_available(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_name ~ '^[a-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles where username = p_name);
$$;

revoke execute on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- Kullanıcı adı sadece kayıtta belirlenir.
revoke update (username) on public.profiles from authenticated;
