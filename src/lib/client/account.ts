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

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

let state: AccountState = { ready: false, user: null, profile: null };
const listeners = new Set<(s: AccountState) => void>();
const recoveryListeners = new Set<() => void>();
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
  client.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null;
    // Supabase uyarısı: bu geri çağrının içinde başka Supabase çağrısını beklemek kilitlenebilir.
    setTimeout(async () => {
      if (event === 'PASSWORD_RECOVERY') recoveryListeners.forEach((fn) => fn());
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

/** Şifre sıfırlama bağlantısıyla gelindiğinde (yeni şifre adımı). */
export function onPasswordRecovery(fn: () => void): void {
  recoveryListeners.add(fn);
}

/** Şifre kuralları; Supabase panelindeki "Password requirements" ile aynı olmalı. */
export const PASSWORD_RULES = [
  { id: 'length', test: (s: string) => s.length >= 8 },
  { id: 'upper', test: (s: string) => /[A-Z]/.test(s) },
  { id: 'lower', test: (s: string) => /[a-z]/.test(s) },
  { id: 'digit', test: (s: string) => /[0-9]/.test(s) },
  { id: 'symbol', test: (s: string) => /[^A-Za-z0-9]/.test(s) },
] as const;

export const isStrongPassword = (s: string) => PASSWORD_RULES.every((r) => r.test(s));

export type AuthErrorCode =
  | 'email_taken'
  | 'username_taken'
  | 'invalid_username'
  | 'weak_password'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'rate_limited'
  | 'same_password'
  | 'other';

function authError(error: { code?: string; message?: string } | null): AuthErrorCode | null {
  if (!error) return null;
  switch (error.code) {
    case 'user_already_exists':
    case 'email_exists':
      return 'email_taken';
    case 'weak_password':
      return 'weak_password';
    case 'invalid_credentials':
      return 'invalid_credentials';
    case 'email_not_confirmed':
      return 'email_not_confirmed';
    case 'same_password':
      return 'same_password';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'rate_limited';
  }
  // Profil tetikleyicisinin hataları Supabase Auth'tan "Database error saving new user" olarak döner.
  if (/database error/i.test(error.message ?? '')) return 'username_taken';
  return 'other';
}

/** Doğrulama / sıfırlama bağlantısı aynı sayfaya dönsün (adres çubuğundaki ?code vb. hariç). */
function returnUrl(): string {
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  return url.href;
}

export async function isUsernameAvailable(name: string): Promise<boolean> {
  if (!supabase || !USERNAME_RE.test(name)) return false;
  const { data } = await supabase.rpc('username_available', { p_name: name });
  return data === true;
}

/** Kayıt. Başarılıysa `confirm: true` → doğrulama maili gönderildi; false → oturum hemen açıldı. */
export async function signUp(
  username: string,
  email: string,
  password: string,
): Promise<{ error: AuthErrorCode | null; confirm: boolean }> {
  if (!supabase) return { error: 'other', confirm: false };
  if (!USERNAME_RE.test(username)) return { error: 'invalid_username', confirm: false };
  if (!isStrongPassword(password)) return { error: 'weak_password', confirm: false };
  if (!(await isUsernameAvailable(username))) return { error: 'username_taken', confirm: false };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username }, emailRedirectTo: returnUrl() },
  });
  if (error) return { error: authError(error), confirm: false };
  // E-posta doğrulaması açıkken kayıtlı bir adres hata vermez, kimliksiz bir kullanıcı döner.
  if (data.user && data.user.identities?.length === 0) return { error: 'email_taken', confirm: false };
  return { error: null, confirm: !data.session };
}

export async function signIn(email: string, password: string): Promise<AuthErrorCode | null> {
  if (!supabase) return 'other';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return authError(error);
}

export async function requestPasswordReset(email: string): Promise<AuthErrorCode | null> {
  if (!supabase) return 'other';
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: returnUrl() });
  return authError(error);
}

export async function updatePassword(password: string): Promise<AuthErrorCode | null> {
  if (!supabase) return 'other';
  if (!isStrongPassword(password)) return 'weak_password';
  const { error } = await supabase.auth.updateUser({ password });
  return authError(error);
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
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
