// src/content/games/covers/monty-satranc.png (1280x800) üretir. Taşlar oyundaki (game.js) çizimlerin SVG karşılığı.
// Çalıştırma: node scripts/covers/monty-satranc.mjs
import sharp from 'sharp';

const rect = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const circle = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const path = (d) => `<path d="${d}"/>`;

const QUEEN_BODY = path('M35 74 Q41 64 40 56 L60 56 Q59 64 65 74 Z');
const SHAPES = {
  p: [path('M36 74 Q40 56 44 47 L56 47 Q60 56 64 74 Z'), rect(37, 42, 26, 6, 3), circle(50, 31, 12)],
  r: [
    path('M33 74 L36 42 L64 42 L67 74 Z'),
    path('M28 42 L28 18 L37 18 L37 25 L45 25 L45 18 L55 18 L55 25 L63 25 L63 18 L72 18 L72 42 Z'),
  ],
  n: [
    path(
      'M30 74 C30 62 36 55 44 50 C38 52 32 54 27 55 C21 56 17 52 18 47 C19 42 24 38 29 34 C33 30 36 24 40 20 L42 9 L50 17 C64 20 74 32 74 48 C74 60 71 68 70 74 Z',
    ),
  ],
  b: [
    path('M38 74 Q42 64 42 56 L58 56 Q58 64 62 74 Z'),
    rect(36, 51, 28, 6, 3),
    path('M50 16 C64 26 66 40 59 51 L41 51 C34 40 36 26 50 16 Z'),
    circle(50, 12, 5),
  ],
  q: [
    QUEEN_BODY,
    path('M33 51 L24 25 L36 39 L40 20 L46 36 L50 14 L54 36 L60 20 L64 39 L76 25 L67 51 Z'),
    rect(33, 50, 34, 7, 3),
    [
      [24, 25],
      [40, 20],
      [50, 14],
      [60, 20],
      [76, 25],
    ]
      .map(([x, y]) => circle(x, y, 3.8))
      .join(''),
  ],
  k: [
    QUEEN_BODY,
    path('M32 51 C22 36 30 24 42 28 C46 29 49 33 50 36 C51 33 54 29 58 28 C70 24 78 36 68 51 Z'),
    rect(33, 50, 34, 7, 3),
  ],
};
const CROSS = 'M47 7 L53 7 L53 12 L59 12 L59 18 L53 18 L53 28 L47 28 L47 18 L41 18 L41 12 L47 12 Z';

function piece(ch, x, y, size) {
  const white = ch === ch.toUpperCase();
  const t = ch.toLowerCase();
  const ink = white ? '#141a33' : '#05070f';
  const grad = white ? 'url(#pw)' : 'url(#pb)';
  const parts = SHAPES[t].map((s) => `<g fill="${grad}">${s}</g>`).join('');
  let detail = '';
  if (t === 'k') detail += `<path d="${CROSS}" fill="#ff6b2c"/>`;
  detail += `<g fill="${grad}">${rect(28, 73, 44, 8, 3)}${rect(22, 80, 56, 10, 4)}</g>`;
  if (t === 'n') {
    detail += `<g fill="${ink}" stroke="none">${circle(37, 31, 2.8)}${circle(23, 46, 1.6)}</g>`;
    detail += `<path d="M53 21 C62 27 67 38 67 52" fill="none" stroke-width="2.4"/>`;
  }
  if (t === 'b') detail += `<path d="M55 27 L47 37" fill="none" stroke-width="3"/>`;
  const shine = white ? 'rgba(255,255,255,.75)' : 'rgba(243,234,216,.22)';
  return `<g transform="translate(${x} ${y}) scale(${size / 100})">
    <ellipse cx="50" cy="91" rx="30" ry="4" fill="rgba(0,0,0,.25)"/>
    <g stroke="${ink}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">${parts}${detail}</g>
    <path d="M26 84 L40 84" stroke="${shine}" stroke-width="2.2" stroke-linecap="round"/>
  </g>`;
}

// Tahta: orta oyundan bir an (FEN satırları, 8. sıra üstte)
const ROWS = ['r3k2r', 'pp1nqppp', '2p1bn2', '3pp3', '2PP4', '1QN1PN2', 'PP1B1PPP', 'R3KB1R'].map((row) =>
  row.replace(/\d/g, (n) => '.'.repeat(Number(n))).padEnd(8, '.'),
);
const SQ = 88;
let board = '';
for (let r = 0; r < 8; r++) {
  for (let f = 0; f < 8; f++) {
    const light = (r + f) % 2 === 0;
    board += `<rect x="${f * SQ}" y="${r * SQ}" width="${SQ}" height="${SQ}" fill="${light ? '#ecdfc4' : '#b9835c'}"/>`;
  }
}
// son hamle vurgusu (e7-d6 gibi) ve şah kareleri
board += `<rect x="${3 * SQ}" y="${3 * SQ}" width="${SQ}" height="${SQ}" fill="rgba(255,194,61,.5)"/>`;
board += `<rect x="${3 * SQ}" y="${4 * SQ}" width="${SQ}" height="${SQ}" fill="rgba(255,194,61,.38)"/>`;
for (let r = 0; r < 8; r++) {
  for (let f = 0; f < 8; f++) {
    const ch = ROWS[r][f];
    if (ch !== '.') board += piece(ch, f * SQ, r * SQ, SQ);
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
<defs>
  <linearGradient id="pw" x1="0" y1="10" x2="0" y2="90" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e2d5b9"/></linearGradient>
  <linearGradient id="pb" x1="0" y1="10" x2="0" y2="90" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#364170"/><stop offset="1" stop-color="#141a33"/></linearGradient>
  <radialGradient id="glow" cx="25%" cy="20%" r="75%"><stop offset="0" stop-color="#ff6b2c" stop-opacity=".28"/><stop offset="1" stop-color="#ff6b2c" stop-opacity="0"/></radialGradient>
  <pattern id="speed" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><rect width="34" height="100" fill="#ff6b2c" opacity=".08"/></pattern>
  <pattern id="check" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#f3ead8"/><rect x="20" y="20" width="20" height="20" fill="#f3ead8"/></pattern>
  <radialGradient id="spot" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<rect width="1280" height="800" fill="#0d1328"/>
<rect width="1280" height="800" fill="url(#speed)"/>
<rect width="1280" height="800" fill="url(#glow)"/>

<g transform="translate(560 -40) rotate(14 352 352)" filter="url(#shadow)">
  <rect x="-14" y="-14" width="${8 * SQ + 28}" height="${8 * SQ + 28}" rx="18" fill="#070b18"/>
  <rect x="-8" y="-8" width="${8 * SQ + 16}" height="${8 * SQ + 16}" rx="12" fill="none" stroke="rgba(243,234,216,.16)" stroke-width="3"/>
  ${board}
</g>

<ellipse cx="330" cy="700" rx="300" ry="34" fill="url(#spot)"/>
<g filter="url(#shadow)">
  ${piece('n', 330, 210, 470)}
  ${piece('K', 40, 150, 560)}
</g>

<g transform="translate(895 555) scale(1.15)" filter="url(#shadow)">
  <path d="M30 130 C30 62 78 22 130 22 C188 22 220 70 220 130 L220 158 C220 176 206 188 188 188 L62 188 C44 188 30 176 30 158 Z" fill="#f3ead8" stroke="#0d1328" stroke-width="5"/>
  <path d="M112 23 C102 58 100 92 102 120 L136 120 C136 92 140 58 152 26 Z" fill="#ff6b2c"/>
  <path d="M104 23 C94 58 92 92 94 120 L100 120 C98 92 100 58 110 23 Z" fill="#0d1328"/>
  <path d="M156 26 C144 58 140 92 142 120 L148 120 C146 92 150 58 162 30 Z" fill="#0d1328"/>
  <path d="M44 72 C60 44 86 30 108 27" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7"/>
  <rect x="46" y="94" width="164" height="68" rx="30" fill="#0d1328"/>
  <rect x="78" y="112" width="24" height="32" rx="5" fill="#ffc23d"/><rect x="140" y="112" width="24" height="32" rx="5" fill="#ffc23d"/>
  <rect x="74" y="108" width="32" height="40" rx="8" fill="#ffc23d" opacity=".18"/><rect x="136" y="108" width="32" height="40" rx="8" fill="#ffc23d" opacity=".18"/>
  <path d="M96 176 L154 176" stroke="#0d1328" stroke-width="5" stroke-linecap="round"/>
</g>

<rect y="760" width="1280" height="40" fill="url(#check)" opacity=".9"/>
</svg>`;

const out = new URL('../../src/content/games/covers/monty-satranc.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('src/content/games/covers/monty-satranc.png yazıldı');
