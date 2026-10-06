import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../config/site';
import type { Lang } from '../i18n/ui';

export type Game = CollectionEntry<'games'>;
export type Post = CollectionEntry<'devlog'>;

/** Taslaklar sadece dev modunda görünür. */
const visible = (draft: boolean) => import.meta.env.DEV || !draft;

export async function getGames(): Promise<Game[]> {
  const games = await getCollection('games', ({ data }) => visible(data.draft));
  return games.sort((a, b) => b.data.releaseDate.valueOf() - a.data.releaseDate.valueOf());
}

export async function getPosts(lang: Lang): Promise<Post[]> {
  const posts = await getCollection('devlog', ({ id, data }) => id.startsWith(`${lang}/`) && visible(data.draft));
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** `tr/hos-geldin` → `hos-geldin` */
export function postSlug(post: Post): string {
  return post.id.split('/').slice(1).join('/');
}

export function postUrl(post: Post): string {
  const [lang] = post.id.split('/');
  return `/${lang}/devlog/${postSlug(post)}/`;
}

export function gameUrl(game: Game, lang: Lang): string {
  return `/${lang}/games/${game.id}/`;
}

export function playUrl(game: Game): string {
  return game.data.playUrl ?? `/play/${game.id}/index.html`;
}

export function isNew(game: Game, now = new Date()): boolean {
  const age = now.valueOf() - game.data.releaseDate.valueOf();
  return age >= 0 && age <= site.newBadgeDays * 24 * 60 * 60 * 1000;
}

export function getFeatured(games: Game[]): Game | undefined {
  return games.find((g) => g.data.featured) ?? games[0];
}

/** Oyun sayısı 12'den azsa grid'i 4'ün katına tamamla; 0 oyunda 4 kart. */
export function placeholderCount(n: number): number {
  return n === 0 ? 4 : n < 12 ? (4 - (n % 4)) % 4 : 0;
}

/** Oyunlarda kullanılan etiketler, en çok kullanılan önce. */
export function collectTags(games: Game[]): string[] {
  const counts = new Map<string, number>();
  for (const g of games) for (const tag of g.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
}

export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
