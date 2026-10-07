// src/content/games/covers/kask-kacisi.png (1280x800) üretir. Çalıştırma: node scripts/covers/kask-kacisi.mjs
import { W, H, DEFS, helmet, render } from './_shared.mjs';

const GY = 610; // zemin çizgisi
const bolt = (x, y, r = 22) => {
  const pts = Array.from({ length: 6 }, (_, i) => `${x + Math.cos((i / 6) * Math.PI * 2 + 0.3) * r},${y + Math.sin((i / 6) * Math.PI * 2 + 0.3) * r}`).join(' ');
  return `<circle cx="${x}" cy="${y}" r="${r * 1.7}" fill="#ffc23d" opacity=".18"/><polygon points="${pts}" fill="#ffc23d"/><circle cx="${x}" cy="${y}" r="${r * 0.36}" fill="#0d1328"/>`;
};
const cone = (x, s = 1) => `<g transform="translate(${x} ${GY}) scale(${s})">
  <rect x="-42" y="-12" width="84" height="12" rx="4" fill="#0d1328"/>
  <path d="M0 -112 L36 -10 L-36 -10 Z" fill="#ff6b2c"/>
  <path d="M-14 -76 L14 -76 L20 -56 L-20 -56 Z" fill="#f3ead8"/></g>`;
let curb = '';
for (let x = 0; x < W; x += 40) {
  const even = (x / 40) % 2 === 0;
  curb += `<rect x="${x}" y="${GY}" width="40" height="16" fill="${even ? '#f3ead8' : '#0d1328'}"/><rect x="${x}" y="${GY + 16}" width="40" height="16" fill="${even ? '#0d1328' : '#f3ead8'}"/>`;
}
let fence = '';
for (let x = 20; x < W; x += 110) fence += `<rect x="${x}" y="${GY - 230}" width="4" height="220" fill="#0d1328" opacity=".35"/>`;
let lanes = '';
for (let x = -40; x < W; x += 300) lanes += `<rect x="${x}" y="${GY + 120}" width="150" height="10" fill="#f3ead8" opacity=".35"/>`;
let speed = '';
[[150, 300, 260], [80, 360, 330], [170, 420, 230], [60, 230, 200]].forEach(([x, y, w]) => (speed += `<rect x="${x}" y="${y}" width="${w}" height="8" rx="4" fill="#f3ead8" opacity=".55"/>`));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${DEFS}
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2754"/><stop offset="1" stop-color="#f08a4b"/></linearGradient>
  <linearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3152"/><stop offset="1" stop-color="#141a33"/></linearGradient>
</defs>
<rect width="${W}" height="${GY}" fill="url(#sky)"/>
<circle cx="960" cy="400" r="210" fill="#ffc23d" opacity=".14"/>
<circle cx="960" cy="400" r="135" fill="#ffc23d" opacity=".92"/>
<path d="M0 ${GY - 60} L40 ${GY - 200} L560 ${GY - 250} L590 ${GY - 60} Z" fill="#2b2550"/>
<path d="M700 ${GY - 60} L740 ${GY - 180} L1220 ${GY - 220} L1260 ${GY - 60} Z" fill="#2b2550"/>
<rect x="0" y="${GY - 70}" width="${W}" height="70" fill="#2b2550"/>
<rect x="640" y="${GY - 380}" width="10" height="320" fill="#2b2550"/><rect x="612" y="${GY - 400}" width="66" height="26" fill="#2b2550"/>
${fence}
<rect x="0" y="${GY - 222}" width="${W}" height="4" fill="#0d1328" opacity=".35"/>
<rect x="40" y="${GY - 96}" width="420" height="72" fill="#1a2147"/><rect x="48" y="${GY - 88}" width="404" height="56" fill="#ff6b2c" opacity=".85"/>
${Array.from({ length: 8 }, (_, i) => `<rect x="${78 + i * 48}" y="${GY - 76}" width="30" height="32" fill="#f3ead8"/>`).join('')}
<rect x="760" y="${GY - 96}" width="460" height="72" fill="#1a2147"/><rect x="768" y="${GY - 88}" width="444" height="56" fill="#f3ead8" opacity=".85"/>
<circle cx="820" cy="${GY - 60}" r="18" fill="#0d1328"/><rect x="860" y="${GY - 68}" width="300" height="14" fill="#0d1328"/>
<rect y="${GY}" width="${W}" height="${H - GY}" fill="url(#asphalt)"/>
${curb}
${lanes}
<rect width="${W}" height="${H}" fill="url(#speed)"/>
${cone(820, 1.25)}${cone(1120, 1.1)}
${bolt(560, 330)}${bolt(660, 290)}${bolt(760, 300)}${bolt(860, 350)}
<ellipse cx="420" cy="${GY + 8}" rx="120" ry="14" fill="#000" opacity=".35"/>
${speed}
<g filter="url(#shadow)">${helmet(250, 175, 1.65, { rotate: -12 })}</g>
</svg>`;

await render(svg, 'kask-kacisi');
