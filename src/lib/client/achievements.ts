/**
 * Başarım deposu (tarayıcı). Üye: Supabase'e yazılır, kalıcıdır. Misafir: sadece bu sekmenin oturumunda
 * (`sessionStorage`) tutulur, sekme kapanınca gider; aynı oturumda giriş yapılırsa hesaba aktarılır.
 * Bu bilinçli bir üyelik teşviki (MONTY_ARCADE.md §11.2) — misafir başarımlarını kalıcı yazma.
 */
import { getAccount, onAccount, whenAccountReady } from './account';
import { supabase } from './supabase';

interface GuestEntry {
  gameId: string;
  id: string;
  unlockedAt: string;
}

/** 'saved': hesaba yazıldı · 'guest': sadece bu oturumda · 'duplicate': zaten açıktı */
export type UnlockResult = 'saved' | 'guest' | 'duplicate';

const GUEST_KEY = 'monty:ach:guest';
const keyOf = (gameId: string, id: string) => `${gameId}:${id}`;

let memoryGuest: GuestEntry[] = []; // sessionStorage kullanılamazsa (gizli mod vb.)

function readGuest(): GuestEntry[] {
  try {
    const raw = sessionStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as GuestEntry[]) : [];
  } catch {
    return memoryGuest;
  }
}

function writeGuest(list: GuestEntry[]) {
  memoryGuest = list;
  try {
    if (list.length) sessionStorage.setItem(GUEST_KEY, JSON.stringify(list));
    else sessionStorage.removeItem(GUEST_KEY);
  } catch {}
}

/** Üyenin açtığı başarımlar ('gameId:id'). */
let member = new Set<string>();
let memberUserId: string | null = null;
let memberLoad: Promise<void> = Promise.resolve();

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((fn) => fn());
}

/** Açılan başarımlar ya da misafir sayısı değişince çağrılır. */
export function onAchievementsChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function syncMember(userId: string) {
  if (!supabase) return;
  // Önce misafir oturumundaki başarımları hesaba aktar.
  const guest = readGuest();
  if (guest.length) {
    const { error } = await supabase.rpc('merge_guest_achievements', { items: guest });
    if (!error) writeGuest([]);
  }
  const { data } = await supabase.from('user_achievements').select('game_id, achievement_id').eq('user_id', userId);
  member = new Set((data ?? []).map((r) => keyOf(r.game_id, r.achievement_id)));
}

onAccount(({ user }) => {
  const id = user?.id ?? null;
  if (id === memberUserId) return;
  memberUserId = id;
  member = new Set();
  memberLoad = id ? syncMember(id) : Promise.resolve();
  memberLoad.then(emit);
});

export async function unlock(gameId: string, id: string): Promise<UnlockResult> {
  await whenAccountReady();
  await memberLoad;
  const key = keyOf(gameId, id);
  const { user } = getAccount();

  if (user && supabase) {
    if (member.has(key)) return 'duplicate';
    const { data, error } = await supabase.rpc('unlock_achievement', { p_game_id: gameId, p_achievement_id: id });
    if (!error) {
      member.add(key);
      emit();
      return data === false ? 'duplicate' : 'saved';
    }
    // Ağ hatası / hız sınırı: oturumda tut, sonraki girişte aktarılır.
  }

  const guest = readGuest();
  if (guest.some((e) => keyOf(e.gameId, e.id) === key)) return 'duplicate';
  writeGuest([...guest, { gameId, id, unlockedAt: new Date().toISOString() }]);
  emit();
  return 'guest';
}

/** Bu oyunda açılmış başarım id'leri (üye + bu oturumdaki misafir kayıtları). */
export function unlockedIds(gameId: string): Set<string> {
  const ids = new Set<string>();
  member.forEach((k) => {
    if (k.startsWith(`${gameId}:`)) ids.add(k.slice(gameId.length + 1));
  });
  readGuest().forEach((e) => e.gameId === gameId && ids.add(e.id));
  return ids;
}

/** Kaydedilmemiş (misafir) başarım sayısı. */
export function unsavedCount(): number {
  return readGuest().length;
}
