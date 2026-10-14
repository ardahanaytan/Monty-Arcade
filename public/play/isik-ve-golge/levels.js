/*
 * Işık ve Gölge — bölümler. Her bölüm 40×22 karo (1280×704), tek ekran.
 * Karo karakterleri:  '#' duvar · 'l' Işık perdesi (Işık geçer, Gölge'ye katı) · 'd' karanlık perde (Gölge geçer, Işık'a katı)
 * Nesneler: light/shadow (başlangıç, satır = ayakta durulan satır), door (çıkış, satır = alt karo), star (yıldız tozu, sadece Işık),
 *           feather (gece tüyü, sadece Gölge).
 */
(function (root) {
  'use strict';

  function build(id, name, region, fn) {
    const cols = 40;
    const rows = 22;
    const g = Array.from({ length: rows }, () => Array(cols).fill('.'));
    const starts = {};
    const doors = [];
    const items = [];
    const beams = [];
    let exclusive = false;
    const b = {
      put(c, r, ch) {
        if (c >= 0 && c < cols && r >= 0 && r < rows) g[r][c] = ch;
        return b;
      },
      fill(c0, r0, c1, r1, ch = '#') {
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) b.put(c, r, ch);
        return b;
      },
      /** Dış çerçeve: tavan (2 satır), zemin (2 satır) ve yan duvarlar. */
      frame() {
        return b.fill(0, 0, cols - 1, 1).fill(0, rows - 2, cols - 1, rows - 1).fill(0, 0, 0, rows - 1).fill(cols - 1, 0, cols - 1, rows - 1);
      },
      light: (c, r) => ((starts.light = { c, r }), b),
      shadow: (c, r) => ((starts.shadow = { c, r }), b),
      doorLight: (c, r) => (doors.push({ kind: 'light', c, r }), b),
      doorShadow: (c, r) => (doors.push({ kind: 'shadow', c, r }), b),
      /** Sabit ışık huzmesi: yayıcı (c,r) duvar karosundadır; dir: u|d|l|r. Gölge için ölümcül. */
      beam: (c, r, dir) => (beams.push({ c, r, dir }), b),
      /** Bu bölümde kapılar birbirinden ayrılmıştır (karşı karakter diğerinin kapısına ulaşamaz); testte kanıtlanır. */
      exclusive: () => ((exclusive = true), b),
      star: (c, r) => (items.push({ kind: 'star', c, r }), b),
      feather: (c, r) => (items.push({ kind: 'feather', c, r }), b),
    };
    fn(b);
    return { id, name, region, cols, rows, tiles: g.map((r) => r.join('')), starts, doors, items, beams, exclusive };
  }

  const LEVELS = [];

  // ─────────────────────────────────────────────────────────────────────────────
  // 1 · İlk Adımlar — Zindan. Hareket, ivme, zıplama, ayrı çıkış kapıları, toplanabilirler, iki perde.
  //   Sol: ikisi de aynı basamaklardan yukarı çıkar. Sağdaki duvarın iki geçidi var:
  //   alttaki Işık perdesi (yalnız Işık geçer), üstteki karanlık perde (yalnız Gölge geçer).
  //   Işık altta, Gölge üstte kendi koridorunda ilerler; çıkışlar ayrı. Bölüm ikisi de kapısındayken biter.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('ilk-adimlar', { tr: 'İlk Adımlar', en: 'First Steps' }, 'dungeon', (b) => {
      b.frame();
      b.exclusive();
      // sol bölge: basamaklar (hepsi 2 karo yükseklik farkı, zıplama ~3,3 karo)
      b.fill(7, 18, 8, 19); // P1 (zemine kadar dolu: altından geçilemez, 2 karo basamak)
      b.fill(3, 16, 5, 16); // P2
      b.fill(7, 14, 10, 14); // P3a
      b.fill(11, 12, 13, 12); // P3: kapıya çıkış
      // ayıran duvar (sütun 14) ve iki geçit
      b.fill(14, 2, 14, 8); // üst
      b.fill(14, 9, 14, 11, 'd'); // karanlık perde (Gölge geçer)
      b.fill(14, 12, 14, 16); // orta
      b.fill(14, 17, 14, 19, 'l'); // Işık perdesi (Işık geçer)
      // sağ bölge: iki koridor
      b.fill(15, 12, 38, 13); // ara döşeme
      b.fill(15, 2, 38, 5); // üst koridorun tavanı
      // alt koridor (Işık): engeller ve bir sapma
      b.fill(21, 18, 22, 19);
      b.fill(26, 18, 27, 19);
      b.fill(29, 16, 31, 16); // sapma platformu (yıldız tozu)
      b.star(17, 19);
      b.star(21, 16);
      b.star(30, 15);
      // üst koridor (Gölge)
      b.fill(21, 10, 22, 11);
      b.fill(24, 8, 26, 8); // sapma platformu (gece tüyü)
      b.feather(17, 11);
      b.feather(22, 8);
      b.feather(25, 7);
      // çıkışlar
      b.doorLight(36, 19);
      b.doorShadow(36, 11);
      b.light(2, 19);
      b.shadow(5, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 2 · Karanlık Sular — Zindan. Karanlık su (Işık söner, Gölge yüzer) ve sabit ışık huzmesi (Gölge yok olur).
  //   Havuzun üstünde tek tek taşlar: Işık sıçrayarak geçer, Gölge suyun dibinden yürür/yüzer.
  //   Sağdaki alçak tünelde huzme baş hizasına yakın uzanır: Işık'a zarar vermez; Gölge yürüyerek geçer, yüksek zıplarsa yok olur.
  //   Çıkışlar: Işık kapısı havuzdan sonraki kıyıda, Gölge kapısı tünelin sonunda.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('karanlik-sular', { tr: 'Karanlık Sular', en: 'Dark Waters' }, 'dungeon', (b) => {
      b.frame();
      b.fill(13, 19, 23, 20, 'w'); // karanlık su: zemin oyulmuş, dibi 21. satır (2 karo derin)
      b.fill(14, 18, 15, 18); // taş A (altı 2 karo açık: Gölge altından yürür)
      b.fill(19, 18, 20, 18); // taş B
      // tünel: giriş duvarı (2 karolu açıklık), tavan; huzme 17. satırda sağ duvardan sola uzanır ve giriş duvarında biter
      b.fill(29, 14, 29, 17);
      b.fill(30, 14, 38, 16);
      b.beam(39, 17, 'l');
      // yıldız tozu (Işık): taşlar arası sıçrayış hatları, bir de tünelin içi
      b.star(17, 16);
      b.star(22, 16);
      b.star(33, 19);
      // gece tüyü (Gölge): suyun dibi, tünel ve huzmenin hemen altı (kısa sıçrayış ister)
      b.feather(17, 20);
      b.feather(22, 20);
      b.feather(31, 19);
      b.feather(34, 18);
      b.doorLight(25, 19);
      b.doorShadow(37, 19);
      b.light(2, 19);
      b.shadow(4, 19);
    }),
  );

  const api = { LEVELS, build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IVGLevels = api;
})(typeof self !== 'undefined' ? self : this);
