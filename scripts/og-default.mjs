// public/og-default.png (1200x630) üretir: koyu zemin + Monty + yazı markası.
// Site adı değişince: `npm run og`. (Node 22.18+ .ts dosyasını doğrudan içe aktarabilir.)
import sharp from 'sharp';
import { site } from '../src/config/site.ts';
import { ui } from '../src/i18n/ui.ts';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const { top, bottom } = site.wordmark;
const spaced = [...bottom].join(' ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
  <radialGradient id="glow" cx="50%" cy="-10%" r="80%"><stop offset="0" stop-color="#ff6b2c" stop-opacity=".22"/><stop offset="1" stop-color="#ff6b2c" stop-opacity="0"/></radialGradient>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#f3ead8" stroke-opacity=".05"/></pattern>
  <pattern id="speed" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><rect width="36" height="100" fill="#ff6b2c" opacity=".1"/></pattern>
  <linearGradient id="fade" x1="0" x2="1"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#fff" stop-opacity="1"/></linearGradient>
  <mask id="m"><rect width="1200" height="630" fill="url(#fade)"/></mask>
  <pattern id="check" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#f3ead8"/><rect x="18" y="18" width="18" height="18" fill="#f3ead8"/></pattern>
</defs>
<rect width="1200" height="630" fill="#0d1328"/>
<rect width="1200" height="630" fill="url(#grid)"/>
<rect width="1200" height="630" fill="url(#glow)"/>
<rect width="1200" height="630" fill="url(#speed)" mask="url(#m)"/>
<rect y="594" width="1200" height="36" fill="url(#check)" opacity=".85"/>
<g transform="translate(790 130) scale(1.6)">
  <ellipse cx="125" cy="218" rx="80" ry="8" fill="#000" opacity=".35"/>
  <path d="M30 130 C30 62 78 22 130 22 C188 22 220 70 220 130 L220 158 C220 176 206 188 188 188 L62 188 C44 188 30 176 30 158 Z" fill="#f3ead8" stroke="#0d1328" stroke-width="5"/>
  <path d="M112 23 C102 58 100 92 102 120 L136 120 C136 92 140 58 152 26 Z" fill="#ff6b2c"/>
  <path d="M104 23 C94 58 92 92 94 120 L100 120 C98 92 100 58 110 23 Z" fill="#0d1328"/>
  <path d="M156 26 C144 58 140 92 142 120 L148 120 C146 92 150 58 162 30 Z" fill="#0d1328"/>
  <path d="M44 72 C60 44 86 30 108 27" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7"/>
  <rect x="46" y="94" width="164" height="68" rx="30" fill="#0d1328"/>
  <rect x="84" y="112" width="24" height="32" rx="5" fill="#ffc23d"/><rect x="146" y="112" width="24" height="32" rx="5" fill="#ffc23d"/>
  <rect x="80" y="108" width="32" height="40" rx="8" fill="#ffc23d" opacity=".18"/><rect x="142" y="108" width="32" height="40" rx="8" fill="#ffc23d" opacity=".18"/>
  <path d="M96 176 L154 176" stroke="#0d1328" stroke-width="5" stroke-linecap="round"/>
  <circle cx="206" cy="146" r="17" fill="#0d1328"/>
  <text x="206" y="153" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-style="italic" font-size="20" fill="#f3ead8">M</text>
</g>
<text x="80" y="300" font-family="Arial Black, Arial" font-weight="900" font-style="italic" font-size="124" fill="#f3ead8">${esc(top)}</text>
<text x="86" y="356" font-family="Courier New, monospace" font-weight="700" font-size="40" fill="#ff6b2c">${esc(spaced)}</text>
<text x="86" y="440" font-family="Arial, sans-serif" font-size="28" fill="#c9cbe0">${esc(ui.en['meta.tagline'])}</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(new URL('../public/og-default.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
console.log('public/og-default.png yazıldı');
