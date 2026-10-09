/** Başarım bildirimi ekler (`AchievementToast.astro` şablonunu kullanır). */
import type { UnlockResult } from './achievements';

const TIER_COLOR = { common: 'var(--text-3)', rare: 'var(--accent)', legendary: 'var(--led)' } as const;
const SHOW_MS = 4000;
const GUEST_SHOW_MS = 7000; // misafir "Üye ol" butonuna basabilsin

export function showAchievementToast(opts: {
  name: string;
  tier: keyof typeof TIER_COLOR;
  result: Exclude<UnlockResult, 'duplicate'>;
}) {
  const root = document.querySelector<HTMLElement>('[data-ach-toasts]');
  const tpl = document.querySelector<HTMLTemplateElement>('[data-ach-toast-tpl]');
  if (!root || !tpl) return;
  // Tam ekrandaki oyunun üstünde de görünsün: kapsayıcıyı tam ekran öğesinin içine taşı.
  const host = document.fullscreenElement ?? document.body;
  if (root.parentElement !== host) host.append(root);
  const card = (tpl.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
  card.style.setProperty('--tier', TIER_COLOR[opts.tier]);
  card.querySelector('[data-name]')!.textContent = opts.name;
  card.querySelector(opts.result === 'saved' ? '[data-guest]' : '[data-saved]')?.remove();
  root.append(card);

  let timer = window.setTimeout(leave, opts.result === 'guest' ? GUEST_SHOW_MS : SHOW_MS);
  // Üzerine gelince ya da odaklanınca beklesin.
  card.addEventListener('pointerenter', () => clearTimeout(timer));
  card.addEventListener('pointerleave', () => (timer = window.setTimeout(leave, 1500)));
  card.addEventListener('focusin', () => clearTimeout(timer));

  function leave() {
    card.classList.add('is-leaving');
    card.addEventListener('animationend', () => card.remove(), { once: true });
  }
}
