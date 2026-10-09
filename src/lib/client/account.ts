/**
 * Oturum ve profil durumu (tarayıcı). Header, giriş penceresi, oynatıcı ve profil sayfası buradan dinler.
 * Kalıcı başarımlar yalnızca üyelerde; ayrıntı MONTY_ARCADE.md §11.2.
 */
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  showcase: string[];
  created_at: string;
}

export interface AccountState {
  /** İlk oturum kontrolü bitti mi? */
  ready: boolean;
  user: User | null;
  profile: Profile | null;
}

export type Provider = 'github' | 'google' | 'discord';

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

let state: AccountState = { ready: false, user: null, profile: null };
const listeners = new Set<(s: AccountState) => void>();
let readyResolve: () => void;
const readyPromise = new Promise<void>((r) => (readyResolve = r));

function set(next: Partial<AccountState>) {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn(state));
}

/** Durumu dinle; hazırsa hemen bir kez çağrılır. Aboneliği bırakan fonksiyon döner. */
export function onAccount(fn: (s: AccountState) => void): () => void {
  listeners.add(fn);
  if (state.ready) fn(state);
  return () => listeners.delete(fn);
}

export function getAccount(): AccountState {
  return state;
}

export function whenAccountReady(): Promise<void> {
  return readyPromise;
}

export const accountsEnabled = supabase !== null;

async function loadProfile(user: User): Promise<Profile | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function refreshProfile(): Promise<void> {
  if (state.user) set({ profile: await loadProfile(state.user) });
}

if (supabase) {
  const client = supabase;
  let lastUserId: string | null | undefined;
  client.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    // Supabase uyarısı: bu geri çağrının içinde başka Supabase çağrısını beklemek kilitlenebilir.
    setTimeout(async () => {
      if (user?.id === lastUserId && state.ready) {
        set({ user }); // jeton yenilendi; profil aynı
        return;
      }
      lastUserId = user?.id ?? null;
      const profile = user ? await loadProfile(user) : null;
      set({ ready: true, user, profile });
      readyResolve();
    }, 0);
  });
} else {
  set({ ready: true });
  readyResolve!();
}

/** Giriş sonrası aynı sayfaya dön (adres çubuğundaki ?code vb. hariç). */
function returnUrl(): string {
  const url = new URL(location.href);
  url.search = '';
  return url.href;
}

export async function signInWithProvider(provider: Provider): Promise<string | null> {
  if (!supabase) return 'disabled';
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: returnUrl() } });
  return error?.message ?? null;
}

export async function signInWithEmail(email: string): Promise<string | null> {
  if (!supabase) return 'disabled';
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: returnUrl() } });
  return error?.message ?? null;
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}

/** Kullanıcı adını bir kez seç. Hata kodu: 'invalid' | 'taken' | 'locked' | diğer mesaj. */
export async function claimUsername(name: string): Promise<string | null> {
  if (!supabase || !state.user) return 'disabled';
  if (!USERNAME_RE.test(name)) return 'invalid';
  const { error } = await supabase.from('profiles').update({ username: name }).eq('id', state.user.id);
  if (error) {
    if (error.code === '23505') return 'taken';
    if (error.message.includes('username_locked')) return 'locked';
    return error.message;
  }
  await refreshProfile();
  return null;
}

export async function saveShowcase(items: string[]): Promise<string | null> {
  if (!supabase || !state.user) return 'disabled';
  const { error } = await supabase.from('profiles').update({ showcase: items }).eq('id', state.user.id);
  if (error) return error.message;
  await refreshProfile();
  return null;
}

export async function deleteAccount(): Promise<string | null> {
  if (!supabase) return 'disabled';
  const { error } = await supabase.rpc('delete_my_account');
  if (error) return error.message;
  await supabase.auth.signOut({ scope: 'local' });
  return null;
}

/** Profil adresi. Geliştirmede Vercel yeniden yazma kuralı çalışmadığı için sorgu parametresi kullanılır. */
export function profileUrl(lang: string, username: string): string {
  return import.meta.env.DEV ? `/${lang}/u/?u=${encodeURIComponent(username)}` : `/${lang}/u/${username}`;
}
