// src/content/games/covers/pit-stop.png (1280x800) üretir. Araç, oyundaki (game.js) çizimin SVG karşılığı.
// Çalıştırma: node scripts/covers/pit-stop.mjs
import { W, H, DEFS, ledDigits, render } from './_shared.mjs';

const CX = 520;
const CY = 470;
const S = 1.55;
const wheel = (x, y, changed) =>
  `<rect x="${x - 30}" y="${y - 17}" width="60" height="34" rx="8" fill="#0b0f1f"/><rect x="${x - 22}" y="${y - 10}" width="44" height="20" rx="5" fill="none" stroke="${changed ? '#ff6b2c' : '#3a4266'}" stroke-width="4"/>`;
const crew = (x, y, active) =>
  (active ? `<circle cx="${x}" cy="${y}" r="25" fill="none" stroke="#ff6b2c" stroke-width="4"/>` : '') +
  `<circle cx="${x}" cy="${y}" r="14" fill="#ff6b2c"/><circle cx="${x}" cy="${y}" r="7" fill="#f3ead8"/>`;
const body = 'M170 0 L150 -11 L100 -17 L70 -44 L-40 -52 L-118 -42 L-130 -24 L-130 24 L-118 42 L-40 52 L70 44 L100 17 L150 11 Z';

const car = `<g transform="translate(${CX} ${CY}) scale(${S})">
  <path d="${body}" transform="translate(8 10)" fill="#000" opacity=".3"/>
  ${wheel(104, -70, true)}${wheel(104, 70, true)}${wheel(-88, -70, true)}${wheel(-88, 70, false)}
  <rect x="-152" y="-72" width="24" height="144" rx="4" fill="#0d1328"/><rect x="-152" y="-72" width="24" height="8" fill="#ff6b2c"/><rect x="-152" y="64" width="24" height="8" fill="#ff6b2c"/>
  <path d="${body}" fill="#f3ead8" stroke="#0d1328" stroke-width="4"/>
  <rect x="-118" y="-7" width="272" height="14" fill="#ff6b2c"/><rect x="-118" y="-10" width="272" height="3" fill="#0d1328"/><rect x="-118" y="7" width="272" height="3" fill="#0d1328"/>
  <rect x="146" y="-80" width="20" height="160" rx="4" fill="#0d1328"/><rect x="146" y="-80" width="20" height="8" fill="#ff6b2c"/><rect x="146" y="72" width="20" height="8" fill="#ff6b2c"/>
  <ellipse cx="8" cy="0" rx="36" ry="22" fill="#0d1328"/><circle cx="2" cy="0" r="14" fill="#f3ead8"/><rect x="-12" y="-4" width="28" height="8" fill="#ff6b2c"/>
  <rect x="13" y="-6" width="3" height="4" fill="#ffc23d"/><rect x="13" y="2" width="3" height="4" fill="#ffc23d"/>
  ${crew(214, 0, false)}${crew(-186, 0, false)}${crew(104, -118, false)}${crew(104, 118, false)}${crew(-88, -118, false)}${crew(-88, 118, true)}
</g>`;

// gösterge: sarı bölge, ibre bölgenin içinde
const GX = 1070;
const GYc = 470;
const R = 110;
const arcPath = (f0, f1) => {
  const a0 = -Math.PI / 2 + f0 * Math.PI * 2;
  const a1 = -Math.PI / 2 + f1 * Math.PI * 2;
  const large = f1 - f0 > 0.5 ? 1 : 0;
  return `M${GX + Math.cos(a0) * R} ${GYc + Math.sin(a0) * R} A${R} ${R} 0 ${large} 1 ${GX + Math.cos(a1) * R} ${GYc + Math.sin(a1) * R}`;
};
const needleA = -Math.PI / 2 + 0.43 * Math.PI * 2;
const gauge = `<circle cx="${GX}" cy="${GYc}" r="${R + 24}" fill="#070b18"/>
  <circle cx="${GX}" cy="${GYc}" r="${R}" fill="none" stroke="#1d2749" stroke-width="24"/>
  <path d="${arcPath(0.32, 0.54)}" fill="none" stroke="rgba(243,234,216,.35)" stroke-width="24"/>
  <path d="${arcPath(0.39, 0.475)}" fill="none" stroke="#ffc23d" stroke-width="24"/>
  <line x1="${GX}" y1="${GYc}" x2="${GX + Math.cos(needleA) * (R + 14)}" y2="${GYc + Math.sin(needleA) * (R + 14)}" stroke="#f3ead8" stroke-width="9" stroke-linecap="round"/>
  <circle cx="${GX}" cy="${GYc}" r="14" fill="#ff6b2c"/>`;

let lane = '';
for (let x = 0; x < W; x += 48) lane += `<rect x="${x}" y="${H - 50}" width="48" height="14" fill="${(x / 48) % 2 ? '#f3ead8' : '#ff6b2c'}"/>`;
let garages = '';
for (let x = 0; x < W; x += 260) garages += `<rect x="${x + 12}" y="0" width="236" height="110" fill="#141b38"/><rect x="${x + 12}" y="98" width="236" height="12" fill="#ffc23d" opacity=".14"/>`;
const time = '2.34';
const dh = 110;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${DEFS}</defs>
<rect width="${W}" height="${H}" fill="#262d4d"/>
<rect width="${W}" height="120" fill="#0d1328"/>
${garages}
<rect y="${H - 50}" width="${W}" height="50" fill="#0a0e1e"/>
${lane}
<rect x="${CX - 200 * S}" y="${CY - 125 * S}" width="${400 * S}" height="${250 * S}" fill="none" stroke="rgba(243,234,216,.5)" stroke-width="6" stroke-dasharray="26 18"/>
<rect x="${CX + 170 * S}" y="${CY - 125 * S}" width="9" height="${250 * S}" fill="#ffc23d"/>
<rect width="${W}" height="${H}" fill="url(#speed)"/>
<g filter="url(#shadow)">${car}</g>
<g filter="url(#shadow)">${gauge}</g>
<rect x="${GX - 150}" y="150" width="300" height="${dh + 50}" rx="20" fill="#070b18"/>
${ledDigits(time, GX - 112, 175, dh)}
<g opacity=".35" filter="url(#glow)">${ledDigits(time, GX - 112, 175, dh)}</g>
</svg>`;

await render(svg, 'pit-stop');
