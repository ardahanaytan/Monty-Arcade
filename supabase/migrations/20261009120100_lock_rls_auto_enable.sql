-- Supabase'in "Enable automatic RLS" ayarıyla gelen olay tetikleyici fonksiyonu API'den çağrılmamalı.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
