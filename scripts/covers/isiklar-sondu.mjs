// src/content/games/covers/isiklar-sondu.png (1280x800) üretir. Çalıştırma: node scripts/covers/isiklar-sondu.mjs
import { W, H, DEFS, helmet, ledDigits, render } from './_shared.mjs';

const POD_W = 150;
const GAP = 40;
const LIT = 3;
const gx = (W - (5 * POD_W + 4 * GAP)) / 2;
const gy = 130;
let pods = '';
for (let i = 0; i < 5; i++) {
  const x = gx + i * (POD_W + GAP);
  const on = i < LIT;
  pods += `<rect x="${x}" y="${gy}" width="${POD_W}" height="290" rx="22" fill="#05070f"/>`;
  for (const cy of [gy + 76, gy + 214]) {
    if (on) {
      pods += `<circle cx="${x + POD_W / 2}" cy="${cy}" r="70" fill="#ff3b2f" opacity=".55" filter="url(#glow)"/>`;
      pods += `<circle cx="${x + POD_W / 2}" cy="${cy}" r="54" fill="url(#lampOn)"/>`;
    } else {
      pods += `<circle cx="${x + POD_W / 2}" cy="${cy}" r="54" fill="url(#lampOff)"/>`;
    }
  }
}
const digits = '0.187';
const dh = 150;
const dw = 4 * (dh * 0.55 + dh * 0.13 * 1.2) + dh * 0.13 * 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${DEFS}
  <radialGradient id="lampOn" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffd2c8"/><stop offset=".35" stop-color="#ff3b2f"/><stop offset="1" stop-color="#b3140c"/></radialGradient>
  <radialGradient id="lampOff" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#3a1414"/><stop offset=".8" stop-color="#1a0606"/></radialGradient>
  <radialGradient id="bgGlow" cx="50%" cy="30%" r="60%"><stop offset="0" stop-color="#ff3b2f" stop-opacity=".22"/><stop offset="1" stop-color="#ff3b2f" stop-opacity="0"/></radialGradient>
  <linearGradient id="gantry" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141a33"/><stop offset="1" stop-color="#0a0e1e"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="#0d1328"/>
<rect width="${W}" height="${H}" fill="url(#speed)"/>
<rect width="${W}" height="${H}" fill="url(#bgGlow)"/>
<rect x="${gx + 150}" y="0" width="20" height="${gy}" fill="#0a0e1e"/><rect x="${W - gx - 170}" y="0" width="20" height="${gy}" fill="#0a0e1e"/>
<g filter="url(#shadow)"><rect x="${gx - 34}" y="${gy - 30}" width="${5 * POD_W + 4 * GAP + 68}" height="350" rx="30" fill="url(#gantry)"/></g>
${pods}
<g>${ledDigits(digits, (W - dw) / 2 - 20, 540, dh, '#ffc23d')}</g>
<g opacity=".35" filter="url(#glow)">${ledDigits(digits, (W - dw) / 2 - 20, 540, dh, '#ffc23d')}</g>
${helmet(1010, 560, 0.85)}
</svg>`;

await render(svg, 'isiklar-sondu');
