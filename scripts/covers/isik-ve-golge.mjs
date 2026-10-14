// src/content/games/covers/isik-ve-golge.png (1280x800) üretir. Işık ve Gölge: ortada bir perde, iki yanda iki figür.
// Çalıştırma: node scripts/covers/isik-ve-golge.mjs
import { W, H, DEFS, render } from './_shared.mjs';

const light = (x, y) => `<g transform="translate(${x} ${y}) scale(3.2)">
  <circle cx="0" cy="-17" r="60" fill="#ffc86a" opacity=".22" filter="url(#glow)"/>
  <rect x="-9" y="-20" width="18" height="14" rx="8" fill="#ffb347"/><rect x="-9" y="-34" width="18" height="28" rx="8" fill="#ffd98a"/>
  <circle cx="0" cy="-25" r="9" fill="#fff6dc"/><rect x="2" y="-27" width="2" height="4" fill="#7a4a10"/><rect x="6" y="-27" width="2" height="4" fill="#7a4a10"/>
  <path d="M-4 -26 Q-18 -20 -20 -8" fill="none" stroke="#ffd682" stroke-width="3" stroke-linecap="round"/>
</g>`;
const shadow = (x, y) => `<g transform="translate(${x} ${y}) scale(3.2)">
  <circle cx="0" cy="-17" r="60" fill="#8a5cff" opacity=".28" filter="url(#glow)"/>
  <rect x="-9" y="-34" width="18" height="28" rx="8" fill="#1a1040" stroke="#7a52e8" stroke-width="1.2"/>
  <circle cx="0" cy="-25" r="9" fill="#1b1040" stroke="#7a52e8" stroke-width="1.2"/>
  <rect x="-6" y="-27" width="2" height="4" fill="#d9c8ff"/><rect x="-2" y="-27" width="2" height="4" fill="#d9c8ff"/>
  <path d="M5 -24 Q18 -20 22 -10" fill="none" stroke="#7a52e8" stroke-width="3" stroke-linecap="round"/>
</g>`;

let bricks = '';
for (let y = 0; y < H; y += 64) for (let x = (y / 64) % 2 ? -64 : 0; x < W; x += 128) bricks += `<rect x="${x + 3}" y="${y + 3}" width="122" height="58" rx="4" fill="#1c2346" opacity=".7"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${DEFS}
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a1a"/><stop offset="1" stop-color="#151a37"/></linearGradient>
  <linearGradient id="cl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd682" stop-opacity="0"/><stop offset=".5" stop-color="#ffd682" stop-opacity=".75"/><stop offset="1" stop-color="#ffd682" stop-opacity="0"/></linearGradient>
  <linearGradient id="cd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9664ff" stop-opacity="0"/><stop offset=".5" stop-color="#9664ff" stop-opacity=".75"/><stop offset="1" stop-color="#9664ff" stop-opacity="0"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${bricks}
<rect width="${W}" height="${H}" fill="#070a1a" opacity=".55"/>
<rect x="540" y="0" width="200" height="${H}" fill="#0a0d22"/>
<rect x="540" y="0" width="200" height="${H}" fill="#fff" opacity=".02"/>
<rect x="560" y="120" width="60" height="560" fill="url(#cl)"/>
<rect x="660" y="120" width="60" height="560" fill="url(#cd)"/>
<circle cx="590" cy="150" r="14" fill="#ffd682"/><circle cx="690" cy="150" r="16" fill="#9664ff"/><circle cx="698" cy="144" r="14" fill="#0a0d22"/>
<rect x="0" y="690" width="${W}" height="110" fill="#10152e"/><rect x="0" y="690" width="${W}" height="6" fill="#3a4580"/>
${light(250, 690)}
${shadow(1030, 690)}
</svg>`;

await render(svg, 'isik-ve-golge');
