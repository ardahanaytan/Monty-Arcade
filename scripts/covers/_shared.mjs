// Kapak betiklerinin ortak parçaları: Monty kaskı, desenler ve PNG'ye çevirme.
import sharp from 'sharp';

export const W = 1280;
export const H = 800;

/** Monty kaskı (site maskotu). (x, y): sol üst, s: ölçek (1 = 240 birim genişlik). */
export function helmet(x, y, s, { eyes = 'open', rotate = 0 } = {}) {
  const eyeSvg =
    eyes === 'x'
      ? `<g stroke="#ffc23d" stroke-width="8" stroke-linecap="round"><path d="M85 114 L107 142 M107 114 L85 142"/><path d="M147 114 L169 142 M169 114 L147 142"/></g>`
      : `<rect x="84" y="112" width="24" height="32" rx="5" fill="#ffc23d"/><rect x="146" y="112" width="24" height="32" rx="5" fill="#ffc23d"/>
         <rect x="80" y="108" width="32" height="40" rx="8" fill="#ffc23d" opacity=".18"/><rect x="142" y="108" width="32" height="40" rx="8" fill="#ffc23d" opacity=".18"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${rotate} 125 105)">
  <path d="M30 130 C30 62 78 22 130 22 C188 22 220 70 220 130 L220 158 C220 176 206 188 188 188 L62 188 C44 188 30 176 30 158 Z" fill="#f3ead8" stroke="#0d1328" stroke-width="5"/>
  <path d="M112 23 C102 58 100 92 102 120 L136 120 C136 92 140 58 152 26 Z" fill="#ff6b2c"/>
  <path d="M104 23 C94 58 92 92 94 120 L100 120 C98 92 100 58 110 23 Z" fill="#0d1328"/>
  <path d="M156 26 C144 58 140 92 142 120 L148 120 C146 92 150 58 162 30 Z" fill="#0d1328"/>
  <path d="M44 72 C60 44 86 30 108 27" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7"/>
  <rect x="46" y="94" width="164" height="68" rx="30" fill="#0d1328"/>
  ${eyeSvg}
  <path d="M96 176 L154 176" stroke="#0d1328" stroke-width="5" stroke-linecap="round"/>
</g>`;
}

export const DEFS = `
  <pattern id="speed" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><rect width="34" height="100" fill="#ff6b2c" opacity=".08"/></pattern>
  <pattern id="check" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#f3ead8"/><rect x="20" y="20" width="20" height="20" fill="#f3ead8"/></pattern>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="20" stdDeviation="18" flood-color="#000" flood-opacity=".5"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>`;

/** Yazı yerine kullanılan LED rakamlar (7 segment; sistem fontuna bağımlı olmasın). */
export function ledDigits(str, x, y, h, color = '#ffc23d') {
  const segs = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  const w = h * 0.55;
  const t = h * 0.13;
  let out = '';
  let cx = x;
  for (const ch of str) {
    if (ch === '.') {
      out += `<rect x="${cx + t * 0.2}" y="${y + h - t}" width="${t}" height="${t}" rx="${t / 4}" fill="${color}"/>`;
      cx += t * 2;
      continue;
    }
    const on = segs[ch] || '';
    const r = (sx, sy, sw, sh) => `<rect x="${cx + sx}" y="${y + sy}" width="${sw}" height="${sh}" rx="${t / 3}" fill="${color}"/>`;
    const half = h / 2;
    if (on.includes('a')) out += r(t, 0, w - 2 * t, t);
    if (on.includes('b')) out += r(w - t, t * 0.6, t, half - t * 0.8);
    if (on.includes('c')) out += r(w - t, half + t * 0.2, t, half - t * 0.8);
    if (on.includes('d')) out += r(t, h - t, w - 2 * t, t);
    if (on.includes('e')) out += r(0, half + t * 0.2, t, half - t * 0.8);
    if (on.includes('f')) out += r(0, t * 0.6, t, half - t * 0.8);
    if (on.includes('g')) out += r(t, half - t / 2, w - 2 * t, t);
    cx += w + t * 1.2;
  }
  return out;
}

export async function render(svg, slug) {
  const out = new URL(`../../src/content/games/covers/${slug}.png`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`src/content/games/covers/${slug}.png yazıldı`);
}
