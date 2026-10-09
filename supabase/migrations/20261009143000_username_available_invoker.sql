-- Profiller zaten herkese açık okunabildiği için ek yetkiye gerek yok (güvenlik denetimi uyarısı).
alter function public.username_available(text) security invoker;
