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
    const levers = [];
    const plates = [];
    const sdoors = [];
    let exclusive = false;
    let dependent = false;
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
      /** Kaldıraç (c, r: ayakta durulan satır); group bağlı taş kapı grubu; who: kullanması amaçlanan karakter (test için). */
      lever: (c, r, group, who = 'any') => (levers.push({ c, r, group, who }), b),
      /** Basınç plakası (c, r: üstüne basılan zemin satırı). */
      plate: (c, r, group, who = 'any') => (plates.push({ c, r, group, who }), b),
      /** Taş kapı: c sütunu, r0..r1 satırları (yukarı kayarak açılır). */
      sdoor: (c, r0, r1, group) => (sdoors.push({ c, r0, r1, group }), b),
      /** İş birliği zorunlu: yardım almadan kimse kapısına varamaz; testte kanıtlanır. */
      dependent: () => ((dependent = true), b),
      star: (c, r) => (items.push({ kind: 'star', c, r }), b),
      feather: (c, r) => (items.push({ kind: 'feather', c, r }), b),
    };
    fn(b);
    return { id, name, region, cols, rows, tiles: g.map((r) => r.join('')), starts, doors, items, beams, levers, plates, sdoors, exclusive, dependent };
  }

  const LEVELS = [];

  // ─────────────────────────────────────────────────────────────────────────────
  // 1 · İlk Adımlar — Zindan. Hareket, zıplama, ayrı kapılar, toplanabilirler, iki perde, karanlık su ve sabit huzme.
  //   Sol: ikisi de aynı basamaklardan yukarı çıkar. Sağdaki duvarın iki geçidi var:
  //   alttaki Işık perdesi (yalnız Işık geçer), üstteki karanlık perde (yalnız Gölge geçer).
  //   Işık'ın alt koridorunda karanlık su (taşlardan sıçrar), Gölge'nin üst koridorunda baş hizasında huzme (yürür, yüksek zıplamaz).
  //   Çıkışlar ayrı; bölüm ikisi de kapısındayken biter.
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
      // alt koridor (Işık): karanlık su (zemin oyulmuş, 2 karo derin), iki taş, engel ve sapma platformu
      b.fill(21, 19, 27, 20, 'w');
      b.fill(22, 18, 23, 18);
      b.fill(26, 18, 27, 18);
      b.fill(30, 18, 31, 19);
      b.fill(33, 16, 35, 16);
      b.star(17, 19);
      b.star(25, 16);
      b.star(34, 15);
      // üst koridor (Gölge): 8. satırda huzme (başın ~70 px üstü); 1 karo engel (kısa sıçrayış)
      b.beam(39, 8, 'l');
      b.fill(21, 11, 22, 11);
      b.feather(17, 11);
      b.feather(21, 10);
      b.feather(28, 9); // risk/ödül: kısa-orta sıçrayış ister, tam zıplarsa huzmeye değer
      // çıkışlar
      b.doorLight(36, 19);
      b.doorShadow(36, 11);
      b.light(2, 19);
      b.shadow(5, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 2 · Karşılıklı Yardım — Zindan. Kaldıraç + taş kapı + basınç plakası. Biri öbürüne yol açar.
  //   Aynı çatal. Işık alt koridorda plakaya basıp durur: üstteki kırmızı taş kapı Gölge için açılır.
  //   Gölge geçip kaldıracı çeker: alt koridordaki mavi taş kapı Işık için açılır. Sonra Işık plakadan iner, kapısına gider.
  //   Plaka tutulurken Işık'ın alt koridorda beklemesi, kaldıraç sırası ve ezme koruması (kapı biri altındayken kapanmaz) öğretilir.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('karsilikli-yardim', { tr: 'Karşılıklı Yardım', en: 'Helping Hands' }, 'dungeon', (b) => {
      b.frame();
      b.exclusive();
      b.dependent();
      b.fill(7, 18, 8, 19);
      b.fill(3, 16, 5, 16);
      b.fill(7, 14, 10, 14);
      b.fill(11, 12, 13, 12);
      b.fill(14, 2, 14, 8);
      b.fill(14, 9, 14, 11, 'd');
      b.fill(14, 12, 14, 16);
      b.fill(14, 17, 14, 19, 'l');
      b.fill(15, 12, 38, 13);
      b.fill(15, 2, 38, 5);
      // alt koridor (Işık): plaka, mavi taş kapı
      b.plate(18, 19, 'red', 'light');
      b.sdoor(28, 14, 19, 'blue');
      // üst koridor (Gölge): kırmızı taş kapı, mavi kaldıraç
      b.sdoor(22, 6, 11, 'red');
      b.lever(26, 11, 'blue', 'shadow');
      b.star(16, 19);
      b.star(24, 19);
      b.star(32, 19);
      b.feather(17, 11);
      b.feather(24, 11);
      b.feather(31, 11);
      b.doorLight(36, 19);
      b.doorShadow(36, 11);
      b.light(2, 19);
      b.shadow(5, 19);
    }),
  );

  const api = { LEVELS, build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IVGLevels = api;
})(typeof self !== 'undefined' ? self : this);
