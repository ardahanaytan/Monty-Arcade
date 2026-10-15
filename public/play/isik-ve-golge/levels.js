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
    const boxes = [];
    const lanterns = [];
    const lifts = [];
    const rmirrors = [];
    const crystals = [];
    let exclusive = false;
    let dependent = [];
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
      beam: (c, r, dir, o = {}) => (beams.push({ c, r, dir, ...o }), b),
      /** Bu bölümde kapılar birbirinden ayrılmıştır (karşı karakter diğerinin kapısına ulaşamaz); testte kanıtlanır. */
      exclusive: () => ((exclusive = true), b),
      /** Kaldıraç (c, r: ayakta durulan satır); group bağlı taş kapı grubu; who: kullanması amaçlanan karakter (test için). */
      lever: (c, r, group, who = 'any', o = {}) => (levers.push({ c, r, group, who, ...o }), b),
      /** Düğme: üstünden geçilince asansörü öbür durağa gönderir. btnDir 'left'|'right': yalnız o yöne (batıya/doğuya) geçilince; boş: her iki yöne. Uç noktadaki düğmeye basıp geri dönmek tekrar tetiklemesin diye uçlarda yön verilir. */
      button: (c, r, lift, btnDir = null, who = 'any') => (levers.push({ c, r, group: 'lift' + lift, who, button: true, lift, btnDir }), b),
      /** Asansör: c sütunundan wc karo, rLow/rHigh durak satırları (ayakta durulan satır). */
      lift: (c, wc, rLow, rHigh, o = {}) => (lifts.push({ c, wc, rLow, rHigh, ...o }), b),
      /** Basınç plakası (c, r: üstüne basılan zemin satırı). */
      plate: (c, r, group, who = 'any') => (plates.push({ c, r, group, who }), b),
      /** Kaldıraçla dönen ayna: `type` başlangıç yönü (m: /, n: \); grubundaki kaldıraç sağdayken tersine döner. */
      rmirror: (c, r, type, group) => (b.put(c, r, type), rmirrors.push({ c, r, group }), b),
      /** Işık kristali: duvar karosuna gömülü (c, r); üstüne/bitişiğine huzme düştüğü sürece grubu aktif eder (plaka gibi). */
      crystal: (c, r, group) => (crystals.push({ c, r, group }), b),
      /** İtilebilir ayna kutusu (c, r: durduğu zemin satırı); type: m (/) ya da n (\). Üstüne gelen huzmeyi 90° çevirir. */
      mbox: (c, r, type) => (boxes.push({ c, r, mirror: type }), b),
      /** Terazi: iki pan; c1 (başta yüksek) ve c2 (başta alçak). Yük (kutu 2, karakter 1) fazla olan pan iner, öteki çıkar. */
      scale: (c1, c2, wc, rLow, rHigh) => (lifts.push({ c: c1, wc, rLow, rHigh, start: 'high', pair: lifts.length + 1 }), lifts.push({ c: c2, wc, rLow, rHigh, start: 'low', pair: lifts.length - 1 }), b),
      /** Zamanlı düğme: plaka gibi ama basıldıktan sonra `secs` sn aktif kalır (geri sayım çubuğu görünür). */
      timed: (c, r, group, secs, who = 'any') => (plates.push({ c, r, group, who, hold: secs }), b),
      /** Taş kapı: c sütunu, r0..r1 satırları (yukarı kayarak açılır). */
      /** Taş kapı. o: { inv: kandil sönükken açık, all: gruptaki TÜM plakalar basılı (ve tüm kandiller yanık) olmalı; kaldıraç sağdaysa kalıcı açar, strict: kaldıraçlar da VE'ye katılır (mandal yok) }. */
      sdoor: (c, r0, r1, group, o = {}) => (sdoors.push({ c, r0, r1, group, ...o }), b),
      /** Yardım almadan şu karakterler kapısına varamaz (varsayılan: ikisi); testte kanıtlanır. */
      dependent: (...kinds) => ((dependent = kinds.length ? kinds : ['light', 'shadow']), b),
      /** İtilebilir kutu (c, r: üzerinde durduğu zemin satırı). */
      box: (c, r) => (boxes.push({ c, r }), b),
      /** Kandil (c, r): Işık yakar, Gölge söndürür. dir: huzme yönü (u|d|l|r). o: { lit (başta yanık), group (bağlı taş kapı) }. Duvara gömülü olabilir. */
      lantern: (c, r, dir, o = {}) => (lanterns.push({ c, r, dir, ...o }), b),
      /**
       * Huzme geçidi: doğuda 2 karo yüksek yayıcı blok (c, r-1..r), batıya karakter boyunda ZAMANLI huzme, n karo uzunlukta; batı ucunda 1 karo engel.
       * Gölge bölgeyi huzme kapalıyken geçmelidir (açık pencere `on` sn, döngü `period` sn). Işık'a etkisiz. Engel ve bloğun üstünden zıplanır.
       */
      gauntlet: (c, r, n, o = {}) => {
        b.fill(c, r - 1, c, r);
        b.fill(c - n - 1, r, c - n - 1, r);
        return b.beam(c, r, 'l', { low: true, period: o.period || 2.4, on: o.on || 1.0, phase: o.phase || 0 });
      },
      star: (c, r) => (items.push({ kind: 'star', c, r }), b),
      feather: (c, r) => (items.push({ kind: 'feather', c, r }), b),
    };
    fn(b);
    return { id, name, region, cols, rows, tiles: g.map((r) => r.join('')), starts, doors, items, beams, levers, plates, sdoors, boxes, lanterns, lifts, rmirrors, crystals, exclusive, dependent };
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 3 · Zindan Labirenti — Zindan. Kutu (itme, plakayı tutma) + kıvılcım fırlatması; üç kat, zikzak labirent.
  //   ALT KAT (A, soldan sağa): 6 karoluk su (Işık atlayamaz). Gölge dipten yüzer, kutuyu sarı plakaya iter (plaka kapıdan uzak:
  //     basılı tutan karakter kapıya yetişemez, kutu şart). Işık için tek yol kıvılcım fırlatması: Gölge arkada, ikisi zıplarken çarpar.
  //     Sarı kapı, ikinci su (2 karo), taş basamaklar ve boşluklu platform: ORTA KATA çıkış.
  //   ORTA KAT (B, sağdan sola): baş hizasında huzme koridoru (Gölge yürür), kırmızı plaka + kırmızı taş kapı + kırmızı kaldıraç:
  //     biri plakayı tutarken öbürü kapıdan geçip en batıdaki kaldıracı (geri dönerek) çeker → kapı kalıcı açılır. Sonra batıda basamaklarla ÜST KATA.
  //   ÜST KAT (C, soldan sağa): alttaki delik, ikinci huzme koridoru; çıkışlar sağ uçta.
  //   Ölüm yerleri: iki su, iki huzme koridoru, kutunun ve fırlatmanın hatası (Işık suya düşer). Yan çıkmazlar: doğu cep (B) ve C'deki boşluk.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('zindan-labirenti', { tr: 'Zindan Labirenti', en: 'Dungeon Maze' }, 'dungeon', (b) => {
      b.frame();
      b.dependent('light'); // Gölge tek başına kapısına varabilir (plaka/kaldıraç zinciri hariç: ikisi de zorunlu), Işık varamaz
      // --- döşemeler: B katı (satır 14) ve C katı (satır 8); açıklıklar: B'de 31-36 (doğu), C'de 3-7 (batı)
      b.fill(1, 14, 30, 14).fill(37, 14, 38, 14);
      b.fill(1, 8, 2, 8).fill(8, 8, 38, 8);
      // --- ALT KAT ---
      b.fill(10, 20, 15, 20, 'w'); // büyük su (6 karo): Işık yalnız fırlatmayla geçer
      b.box(17, 19);
      b.plate(19, 19, 'amber');
      b.fill(20, 19, 20, 19); // engel: kutu burada durur (plakanın üstünde), karakterler üstünden zıplar
      b.sdoor(27, 15, 19, 'amber'); // plakadan 8 karo uzakta
      b.fill(29, 20, 30, 20, 'w'); // ikinci su
      b.fill(32, 18, 33, 19); // basamak (31. sütun zemin: Gölge suyun dibinden buraya çıkar)
      b.fill(34, 16, 36, 16); // boşluğun altındaki ince platform
      // --- ORTA KAT ---
      b.beam(39, 10, 'l'); // doğu duvardan batıya, 25. sütundaki sütuna kadar (başın ~75 px üstü)
      b.fill(25, 9, 25, 10); // tavandan sarkan sütun: huzmeyi keser, altı (3 karo) geçit
      b.plate(24, 13, 'red');
      b.sdoor(17, 9, 13, 'red');
      b.lever(2, 13, 'red'); // en batıda, çıkış basamaklarının ötesinde: oraya gidip geri dönerek (doğuya geçerek) sağa yatırılır; basamakları kullananlar ona bir daha dokunmaz
      b.fill(6, 12, 7, 13); // batı basamağı
      b.fill(3, 10, 4, 10); // üst kata açıklığın altındaki ince platform (5. sütun boş: basamaktan batıya inilebilir)
      // --- ÜST KAT ---
      b.fill(20, 2, 20, 5); // sütun
      b.gauntlet(30, 7, 5, { period: 2.4, on: 1.2 }); // huzme geçidi (25-29): Gölge huzme kapalıyken geçmeli
      // çıkış odası kapısı (33): iki plakanın İKİSİ de basılı olmalı (biri kutu, biri karakter); kapının ardındaki kaldıraç mandal: sonra herkes geçer
      b.box(12, 7);
      b.plate(14, 7, 'green');
      b.fill(15, 7, 15, 7); // engel: kutu burada durur (14. plakada)
      b.plate(17, 7, 'green');
      b.sdoor(33, 2, 7, 'green', { all: true });
      b.lever(34, 7, 'green');
      // toplanabilirler
      b.star(13, 16); // fırlatma yayının üstünde
      b.star(22, 19);
      b.star(38, 13); // doğu cep (orta kat)
      b.star(22, 6);
      b.feather(13, 20); // suyun dibi
      b.feather(29, 20); // ikinci suyun dibi
      b.feather(29, 12); // huzme koridorunda
      b.feather(9, 13);
      b.feather(32, 6); // geçit bloğundan sonra, kapıdan önce
      b.doorShadow(35, 7);
      b.doorLight(37, 7);
      b.fill(1, 17, 3, 17); // Işık'ın başladığı ince platform (altı açık)
      b.light(2, 16);
      b.shadow(5, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 4 · Kandil Labirenti — Zindan. KANDİL (Işık yakar, Gölge söndürür; huzmesi Gölge'yi yok eder) ve KUTUNUN GÖLGESİ (kutu huzmeyi keser,
  //   arkası güvenli). Aynı üç katlı zikzak; her kat farklı bir kandil bulmacası.
  //   ALT KAT: Batıda alçak bir tünel; ucundaki duvara gömülü bekçi kandili (başta yanık) tüneli ölümcül yapar. Tünelin ağzında kutu, ucunda plaka.
  //     Alçak tavan yüzünden kutunun önüne geçilemez: Gölge kutuyu tünelin ucuna iter, kutunun arkasında gölgelik içinde yürür. Kutu kandile bitişik
  //     plakaya oturunca taş kapı (plakadan 25 karo uzakta) kalıcı açılır. Kutu şart: plakayı elle tutan karakter kapıya yetişemez.
  //   ORTA KAT (sağdan sola): huzme koridoru; kırmızı taş kapı İKİ plakanın birlikte basılmasını ister (kutu + karakter); en batıdaki kaldıraç mandal; sonra huzme geçidi ve basamaklarla üst kata.
  //   ÜST KAT (soldan sağa): sonda bekçi kandili (başta yanık, doğu duvara gömülü, batıya bakar) çıkışları kaplar. Önce kaldıraç yeşil taş kapıyı açar
  //     (kapı kutuyla korunur); Gölge kutuyu 22 karo doğuya, kandile bitişene dek iter (arkası gölgelik) ve kandile yaklaşıp söndürür; sonra çıkışlar.
  //   Yalnız Gölge'nin yürüyeceği her yer ölümcül olabilir: ışık huzmeleri karakter boyunda, zıplayarak aşılamaz.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('kandil-labirenti', { tr: 'Kandil Labirenti', en: 'Lantern Maze' }, 'dungeon', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      b.fill(1, 14, 30, 14).fill(37, 14, 38, 14); // B katı (açıklık 31-36)
      b.fill(1, 8, 2, 8).fill(8, 8, 38, 8); // C katı (açıklık 3-7)
      // --- ALT KAT ---
      // Batıda alçak tünel (iç yükseklik 2 karo): ucundaki duvara gömülü bekçi kandili (başta yanık) doğuya bakar, tüneli ölümcül yapar.
      // Kutu tünelin ağzında: kutu ile alçak tavan yüzünden kimse kutunun önüne geçemez (zıplanamaz); kutu huzmeyi keser (ardı güvenli).
      b.fill(1, 15, 12, 17); // tünel tavanı
      b.lantern(0, 19, 'r', { lit: true });
      b.plate(1, 19, 'amber'); // tünelin en ucunda: kutu kandile bitişik durunca plakaya oturur
      b.box(12, 19);
      b.sdoor(26, 15, 19, 'amber'); // ana yol: plakadan 25 karo uzakta, yalnız kutu açık tutar
      b.fill(28, 20, 29, 20, 'w'); // su (2 karo)
      b.fill(32, 18, 33, 19); // basamak
      b.fill(34, 16, 36, 16); // boşluğun altındaki ince platform
      // --- ORTA KAT --- (L3'tekiyle aynı kurgu)
      b.beam(39, 10, 'l');
      b.fill(25, 9, 25, 10);
      b.plate(24, 13, 'red'); // doğudaki plaka: Işık durur
      b.plate(22, 13, 'red'); // batıdaki plaka: kutu durur (engel kutuyu burada tutar)
      b.fill(21, 13, 21, 13);
      b.box(26, 13); // orta kattaki kutu: batıya itilir (Gölge)
      b.sdoor(17, 9, 13, 'red', { all: true }); // iki plaka birlikte basılı olmalı; en batıdaki kaldıraç mandal
      b.lever(2, 13, 'red');
      b.fill(6, 12, 7, 13);
      b.fill(3, 10, 4, 10);
      b.gauntlet(14, 13, 5, { period: 2.4, on: 1.2, phase: 0.6 }); // huzme geçidi (9-13): kaldıracın yolunda, gidiş ve dönüşte geçilir
      // --- ÜST KAT ---
      b.lever(10, 7, 'green');
      b.box(16, 7);
      b.sdoor(17, 2, 7, 'green');
      b.lantern(39, 7, 'l', { lit: true }); // bekçi kandili: doğu duvara gömülü, batıya bakar
      // toplanabilirler
      b.star(28, 16); // suyun üstü
      b.star(38, 12); // doğu cep (orta kat)
      b.star(30, 6);
      b.star(20, 19);
      b.feather(28, 20); // suyun dibi
      b.feather(29, 12); // huzme koridorunda (kısa sıçrayış)
      b.feather(9, 13);
      b.feather(25, 6);
      b.doorShadow(35, 7);
      b.doorLight(37, 7);
      b.light(17, 19);
      b.shadow(19, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 5 · Zindan Sınavı — Zindan bölge sınavı. FARKLI DÜZEN: dört odalı merkez (2×2); hepsi İLERİ/AŞAĞI akar (tırmanış yok).
  //   Başlangıç sol üstte (SÜ). Çıkışlar sağ altta (SA). İki yol var; ikisi de diğerinin yardımına bağlı (çapraz bağımlılık):
  //   • Gölge: SÜ'deki kutuyu delikten aşağı iter, kendisi de iner (SA'ya değil SOL ALT'a: SolA). SolA'da kutuyu basamak yapıp ince bir rafa, KARANLIK
  //     perdenin ardından (yalnız Gölge geçer) çıkar ve kaldıracı çeker → SÜ→SağÜ kapısı (sarı) açılır.
  //   • Işık: kapıdan SağÜ'ye geçer, deliği atlayıp en sağdaki KANDİLİ yakar → SolA→SA kapısı (mavi) açılır; sonra deliğe atlayıp SA'ya iner.
  //   • SA: Gölge kapıdan gelir, Işık delikten düşer. 6 karoluk su (Işık için KIVILCIM FIRLATMASI), sonra huzmeli alçak tünel ve çıkışlar.
  //   Kullanılanlar: su, huzme, perdeler, taş kapı, kaldıraç, kutu, fırlatma, kandil.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('zindan-sinavi', { tr: 'Zindan Sınavı', en: 'Dungeon Trial' }, 'dungeon', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      // orta döşeme (satır 10-11): delikler SÜ'de 3-5, SağÜ'de 20-23
      b.fill(1, 10, 2, 11).fill(6, 10, 19, 11).fill(24, 10, 38, 11);
      // dikey bölme (sütun 16): üstte sarı kapı (satır 6-9), altta mavi kapı (satır 16-19)
      b.fill(16, 2, 16, 5).fill(16, 10, 16, 11).fill(16, 12, 16, 15);
      b.sdoor(16, 6, 9, 'amber', { all: true, strict: true });
      b.sdoor(16, 16, 19, 'blue');
      // --- SOL ÜST ---
      b.beam(0, 7, 'r'); // batı duvardan doğuya; sütun huzmeyi keser (deliği kapsar)
      b.fill(7, 2, 7, 7);
      b.box(8, 9); // delikten aşağı itilecek kutu (Gölge)
      b.box(13, 9); // üst kapının plakasına itilecek kutu (Işık)
      b.plate(15, 9, 'amber'); // sarı kapı: bu plaka (kutu) VE alttaki kaldıraç birlikte
      // --- SOL ALT ---
      b.fill(8, 19, 8, 19); // engel: kutu burada durur (basamak)
      b.fill(9, 16, 11, 16); // ince raf (kaldıraç)
      b.fill(8, 14, 8, 15, 'd'); // karanlık perde: yalnız Gölge geçer
      b.lever(11, 15, 'amber');
      b.fill(13, 20, 14, 20, 'w'); // su (2 karo)
      // --- SAĞ ÜST ---
      b.lantern(39, 9, 'l', { group: 'blue' }); // doğu duvara gömülü, batıya bakar; Işık yakar
      // --- SAĞ ALT ---
      b.fill(25, 20, 31, 20, 'w'); // büyük su (7 karo): Işık için fırlatma
      b.fill(24, 12, 33, 15); // alçak tavan (fırlatma yayını kısaltır: zıplama ~3 karo altına iner)
      b.fill(34, 12, 34, 17); // tünel girişi (2+1 karolu açıklık)
      b.fill(35, 12, 38, 16); // tünel tavanı
      b.beam(39, 17, 'l');
      // toplanabilirler
      b.star(12, 8);
      b.star(36, 8);
      b.star(22, 18);
      b.star(37, 19);
      b.feather(13, 20);
      b.feather(10, 15);
      b.feather(27, 20);
      b.feather(37, 18);
      b.star(3, 6); // sol üst: huzmenin hemen üstünde (Işık için)
      b.doorShadow(36, 19);
      b.doorLight(38, 19);
      b.light(11, 9);
      b.shadow(10, 9);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 6 · Asansör Kuyusu — Avlu. YENİ: ASANSÖR (hareketli platform) ve DÜĞME. Düzen: dikey kule, iki kat + ortada asansör kuyusu; Işık üstte (sol), Gölge altta (sağ).
  //   Çıkışlar: Işık sağ üst, Gölge sol alt. Her çıkış taş kapının ardında; iki kapıyı da ÜSTTEKİ iki plaka (kuyunun iki yanında, biri doğuda biri batıda) açar ve plakaları yalnız KUTU tutabilir
  //   (tutan karakter çıkışa yetişemez). Ama iki kutu ALTTA: yalnız asansör taşır. Gölge kutuyu asansöre yükler, uzak uçtaki düğmeye basar (asansör çıkar);
  //   Işık üstte kutuyu plakaya iter ve kendi uçtaki düğmeyle asansörü geri yollar; ikinci kutu için tekrar. Alt katta doğuda baş hizasında huzme (Gölge yürür).
  //   Ters bağımlılık: kutuların sırası (batıdaki önce) ve plakaların sırası kutuların birbirini engellemesinden çıkar; sıçrama değil mantık sınanır.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('asansor-kuyusu', { tr: 'Asansör Kuyusu', en: 'Lift Shaft' }, 'courtyard', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      // üst kat zemini (satır 8-9); asansör kuyusu 17-20 açık
      b.fill(1, 8, 16, 9).fill(21, 8, 38, 9);
      b.lift(17, 4, 19, 7); // alt durak: satır 19 (zemin), üst durak: satır 7 (üst kat)
      // --- ÜST KAT (Işık) ---
      b.button(2, 7, 0, 'left'); // en batıda (batıya geçince): üstten alta gönderir
      b.plate(26, 7, 'blue'); // doğuda: D_U'yu (Işık'ın kapısı) açar
      b.fill(27, 7, 27, 7); // engel: doğuya itilen kutu burada durur
      b.plate(12, 7, 'amber'); // batıda: D_L'yi (Gölge'nin kapısı) açar
      b.fill(11, 7, 11, 7); // engel: batıya itilen kutu burada durur
      b.fill(29, 8, 31, 8, 'w'); // su (3 karo)
      b.sdoor(33, 2, 7, 'blue'); // Işık'ın kapısı
      // --- ALT KAT (Gölge) ---
      b.box(24, 19);
      b.box(26, 19);
      b.box(21, 19); // en batıdaki kutu: kuyuyu geçip alt kattaki plakaya gider (kapıya VE: üst plaka + bu plaka)
      b.plate(13, 19, 'amber');
      b.fill(12, 19, 12, 19); // engel: kutu 13'te durur
      b.button(38, 19, 0, 'right'); // en doğuda (doğuya geçince): alttan üste gönderir
      b.gauntlet(37, 19, 5, { period: 2.4, on: 1.0 }); // huzme geçidi (32-36): düğmeye giderken ve dönerken Gölge huzme kapalıyken geçmeli
      b.sdoor(8, 10, 19, 'amber', { all: true }); // Gölge'nin kapısı: batıdaki üst plaka VE alt plaka birlikte
      // toplanabilirler
      b.star(6, 6);
      b.star(14, 6);
      b.star(24, 6);
      b.star(35, 6);
      b.feather(6, 18);
      b.feather(14, 18);
      b.feather(33, 18);
      b.feather(36, 18);
      b.doorLight(36, 7);
      b.doorShadow(4, 19);
      b.light(4, 7);
      b.shadow(30, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 7 · Sis Çemberi — Avlu. YENİ: SİS HAVUZU (ikisi için de ölümcül). Düzen: halka; ortada dolu blok, etrafında alt koridor, iki kule (batı: Işık, doğu: Gölge) ve üst koridor.
  //   Alt koridor ortasında sis: iki kule birbirinden ayrı. Her kule 3 basamaklı tırmanış (su/sis/zamanlı huzme tuzakları) ve üstte bir oda:
  //   batı odada kutu+kırmızı plaka ve mavi kaldıraç (su havuzu üstünden), doğu odada kutu+mavi plaka ve kırmızı kaldıraç (zamanlı huzme koridoru).
  //   Üst koridorda iki taş kapı (kırmızı=Işık'ın yolu, mavi=Gölge'nin yolu) SIKI VE: kendi tarafındaki plaka KUTUYLA tutulu + karşı tarafın kaldıracı. Çıkışlar ortadaki odada.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('sis-cemberi', { tr: 'Sis Çemberi', en: 'Ring of Fog' }, 'courtyard', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      b.fill(10, 8, 29, 14); // orta blok
      // alt koridor
      b.fill(17, 18, 22, 19, 'f'); // ortada sis: kuleler ayrı
      // --- BATI KULE (Işık) ---
      b.fill(5, 17, 9, 17).fill(1, 14, 4, 14).fill(5, 11, 9, 11);
      b.fill(5, 19, 8, 19, 'w'); // zemin suyu (basamak 1'in altı)
      b.fill(2, 13, 3, 13, 'w'); // basamak 2 üstünde havuz
      b.fill(6, 10, 6, 10, 'f'); // basamak 3'ün giriş ucunda sis
      b.fill(1, 7, 6, 7); // üst oda zemini (koridordan 1 karo yüksek; 7-9 giriş boşluğu)
      b.fill(2, 6, 3, 6, 'w'); // üst odada su havuzu
      b.plate(4, 6, 'red');
      b.box(5, 6);
      b.lever(1, 6, 'blue', 'light');
      // --- DOĞU KULE (Gölge) ---
      b.fill(30, 17, 34, 17).fill(35, 14, 38, 14).fill(30, 11, 34, 11);
      b.fill(31, 19, 34, 19, 'f');
      b.fill(37, 13, 37, 13, 'f');
      b.fill(33, 10, 33, 10, 'f');
      b.beam(29, 9, 'r', { period: 2.4, on: 1.2, phase: 0.4 }); // basamak 3'ten üst odaya çıkış boşluğunda zamanlı huzme
      b.fill(33, 7, 38, 7);
      b.gauntlet(38, 6, 4, { period: 2.4, on: 1.0, phase: 1.0 }); // engel 33, huzme 34-37
      b.plate(34, 6, 'blue');
      b.box(35, 6);
      b.lever(36, 6, 'red', 'shadow');
      // --- ÜST KORİDOR ---
      b.sdoor(14, 2, 7, 'red', { all: true, strict: true });
      b.sdoor(25, 2, 7, 'blue', { all: true, strict: true });
      b.star(1, 13);
      b.star(38, 12);
      b.star(14, 19);
      b.star(25, 19);
      b.feather(12, 7);
      b.feather(27, 7);
      b.feather(8, 10);
      b.feather(31, 10);
      b.doorLight(17, 7);
      b.doorShadow(22, 7);
      b.light(2, 19);
      b.shadow(37, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 8 · Geri Sayım — Avlu. YENİ: ZAMANLI DÜĞME (basılınca süre boyunca aktif). Düzen: artı (+); ortada dikey merdiven kuyusu, dört kanat (üst-batı, üst-doğu, alt-batı, alt-doğu).
  //   Başlangıç: Işık üst-batıda, Gölge alt-doğuda. İkisi de önce ötekinin kapısını kaldıraçla açar (Işık: su havuzunun ötesinde 'd' kaldıracı = Gölge'nin alt kapısı;
  //   Gölge: zamanlı huzme geçidinin ardında 'c' kaldıracı = Işık'ın üst kapısı). Sonra: Işık üst-batıdaki zamanlı düğmeye basar (7 sn), Gölge alt-doğudaki düğmenin üstünde bekler;
  //   VE kapısı (üst-doğu) ikisi birlikte aktifken açık: Işık kuyuyu geçip kapıdan girer, odadaki zamanlı düğmeye basar (7 sn) → alt-batı kapısı açılır:
  //   Gölge kuyunun altından, kapıdan, zamanlı huzme geçidinden ve sisten geçip çıkışa YETİŞMELİ. Işık sağ uçtaki su ve sisi aşıp çıkışa varır.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('geri-sayim', { tr: 'Geri Sayım', en: 'Countdown' }, 'courtyard', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      b.fill(1, 9, 16, 10).fill(23, 9, 38, 10); // üst zemin (kuyu 17-22 açık)
      b.fill(1, 11, 16, 14).fill(23, 11, 38, 14); // orta bant
      b.fill(17, 17, 20, 17).fill(19, 14, 22, 14).fill(17, 11, 20, 11); // merdiven basamakları
      // --- ÜST-BATI (Işık) ---
      b.fill(4, 8, 6, 8, 'w'); // su (3 karo)
      b.lever(2, 8, 'd', 'light'); // Gölge'nin alt kapısını açar
      b.timed(14, 8, 'a', 7.0); // VE kapısının Işık'ın düğmesi
      b.sdoor(15, 2, 8, 'c'); // Işık'ın kuyuya çıkış kapısı (Gölge'nin kaldıracı)
      // --- ALT-DOĞU (Gölge) ---
      b.gauntlet(33, 19, 5, { period: 2.4, on: 1.0 }); // huzme 28-32, engel 27
      b.timed(26, 19, 'a', 5.0); // VE kapısının Gölge'nin düğmesi
      b.lever(25, 19, 'c', 'shadow'); // Işık'ın üst kapısını açar
      b.sdoor(23, 15, 19, 'd'); // Gölge'nin kuyuya çıkış kapısı (Işık'ın kaldıracı)
      // --- ÜST-DOĞU (Işık'ın çıkışı) ---
      b.sdoor(24, 2, 8, 'a', { all: true }); // iki zamanlı düğme birlikte
      b.timed(26, 8, 'b', 7.0); // alt-batı kapısını açar
      b.fill(28, 8, 30, 8, 'w'); // su (3 karo)
      b.fill(33, 8, 33, 8, 'f'); // sis
      // --- ALT-BATI (Gölge'nin çıkışı) ---
      b.sdoor(15, 15, 19, 'b');
      b.gauntlet(13, 19, 4, { period: 2.4, on: 1.0, phase: 0.6 }); // huzme 9-12, engel 8
      b.fill(5, 19, 5, 19, 'f'); // sis
      // toplanabilirler
      b.star(10, 8);
      b.star(18, 10);
      b.star(21, 13);
      b.star(34, 8);
      b.feather(38, 19);
      b.feather(18, 16);
      b.feather(12, 19);
      b.feather(4, 19);
      b.doorLight(36, 8);
      b.doorShadow(3, 19);
      b.light(9, 8);
      b.shadow(36, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 9 · Aynalı Salon — Avlu. YENİ: SABİT AYNA (m: /, n: \) ve KUTU GÖLGESİ (shade). Düzen: iki katlı uzun salon (alt: Gölge'nin koridoru, üst: ara kat) + batıda merdiven, ortada asansör kuyusu.
  //   Doğu duvardaki yayıcı, ara katta batıya doğru huzme gönderir; batı ucundaki ayna onu AŞAĞI çevirir ve alt koridorun batısını dikey huzmeyle kapatır (Gölge geçemez).
  //   Kutu huzmenin yoluna girerse ARKASI kesilir (ayna beslenmez). Kutu alt katta; yalnız asansör ara kata çıkarır: Işık (huzmeye dayanıklı) kutuyu asansöre iter,
  //   merdivenden ara kata çıkıp ara kattaki düğmeyle asansörü gönderir → kutu huzmeyi keser. Gölge geçer: zamanlı huzme geçidi, sis, taş kapı (Işık'ın ara kattaki kaldıracı).
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('aynali-salon', { tr: 'Aynalı Salon', en: 'Hall of Mirrors' }, 'courtyard', (b) => {
      b.frame();
      b.dependent('shadow');
      b.fill(8, 13, 28, 14).fill(33, 13, 38, 14); // ara kat zemini (asansör kuyusu 29-32)
      b.lift(29, 4, 19, 12);
      b.fill(1, 17, 4, 17).fill(3, 14, 6, 14); // merdiven basamakları (Işık)
      b.put(7, 12, 'm'); // ayna '/': batıya giden huzmeyi aşağı çevirir
      b.beam(39, 12, 'l', { shade: true }); // ara katta batıya
      b.box(26, 19); // alt kat: asansöre itilecek (geçidin doğusunda)
      b.button(27, 12, 0, 'right'); // ara kat: asansörü gönderir
      b.lever(34, 12, 'g', 'light'); // Gölge'nin kapısı
      // --- ALT KAT (Gölge) ---
      b.gauntlet(24, 19, 4, { period: 2.4, on: 1.0 }); // huzme 20-23, engel 19
      b.fill(34, 19, 34, 19, 'f'); // sis
      b.sdoor(36, 15, 19, 'g');
      // toplanabilirler
      b.star(3, 16);
      b.star(16, 12);
      b.star(24, 12);
      b.star(30, 19);
      b.feather(10, 19);
      b.feather(15, 19);
      b.feather(22, 19);
      b.feather(35, 18);
      b.doorLight(10, 12);
      b.doorShadow(37, 19);
      b.light(4, 19);
      b.shadow(2, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 10 · Avlu Sınavı — Avlu. Bölge sınavı: kandil + zamanlı düğme + ayna + kutu gölgesi. Düzen: uzun koridor + aşağı sarkan oda (üç kapıyla dört bölüme ayrılmış).
  //   S0: Işık kandili yakar → 1. kapı açılır. S1: iki zamanlı düğme BİRLİKTE (VE) 2. kapıyı açar; biri koridorda (Gölge bekler), öteki aşağıdaki odada (Işık: iner, düğmeye basar, 2 basamakla çıkar, kapıya yetişir).
  //   S2: zamanlı huzme geçidi. 3. geçit: koridora gömülü ayna bloğu doğu duvardaki yayıcının huzmesini YUKARI çevirir (Gölge geçemez); kutu raftan huzmenin yoluna düşerse huzme kesilir.
  //   Işık (huzmeye dayanıklı) aynanın ötesine geçer, rafa çıkıp kutuyu doğuya iter; Gölge ayna bloğunu aşıp çıkışa varır.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('avlu-sinavi', { tr: 'Avlu Sınavı', en: 'Courtyard Trial' }, 'courtyard', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      b.fill(1, 2, 38, 5); // tavan
      b.fill(1, 12, 38, 19); // zemin + alt blok
      b.fill(12, 14, 17, 19, '.').fill(13, 12, 16, 13, '.'); // aşağıdaki oda ve girişi
      b.fill(12, 17, 14, 17).fill(15, 14, 17, 14); // odanın basamakları
      // S0
      b.lantern(5, 12, 'u', { group: 'p' }); // zemine gömülü, yukarı bakar; Işık yakar
      b.sdoor(10, 6, 11, 'p');
      // S1
      b.timed(16, 19, 'b', 10.0); // odada
      b.timed(18, 11, 'b', 7.0); // koridorda
      b.sdoor(20, 6, 11, 'b', { all: true });
      // S2
      b.gauntlet(28, 11, 5, { period: 2.4, on: 1.0 }); // huzme 23-27, engel 22
      // S3: ayna geçidi
      b.put(31, 11, 'n');
      b.beam(39, 11, 'l', { shade: true });
      b.fill(34, 9, 37, 9); // raf
      b.box(36, 8);
      // toplanabilirler
      b.star(3, 11);
      b.star(13, 19);
      b.star(25, 11);
      b.star(35, 8);
      b.feather(8, 11);
      b.feather(15, 11);
      b.feather(24, 11);
      b.feather(32, 11);
      b.doorLight(34, 8);
      b.doorShadow(33, 11);
      b.light(2, 11);
      b.shadow(8, 11);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 11 · Dönen Aynalar — Sur. YENİ: KALDIRAÇLA DÖNEN AYNA. Düzen: uzun alt koridor + kuzey-batıda gizli kaldıraç odası (Işık), doğu uçta Gölge'nin çıkışı.
  //   Koridorun tavanından asılı üç yayıcı üç aynaya huzme yollar; her ayna ya aşağı (koridoru kapatan dikey huzme) ya yukarı (zararsız) çevirir.
  //   TEK kaldıraç üçünü birden çevirir ve ikincisi ötekilerin tersidir: kapı 1 ve 3 aynı anda açıkken kapı 2 kapanır. Gölge kapıları sırayla geçer:
  //   Işık kaldıracı sağa, sola, sağa çevirerek onu bekleyen Gölge'yi ilerletir (Gölge kapılar arasında güvenli hücrelerde durur).
  //   Gölge doğuda zamanlı huzme geçidini geçip kaldıracı çeker → Işık'ın çıkış kapısı açılır.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('donen-aynalar', { tr: 'Dönen Aynalar', en: 'Turning Mirrors' }, 'sur', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      b.fill(1, 2, 38, 15); // tavan bloğu
      b.fill(1, 3, 6, 15, '.'); // kule boşluğu
      b.fill(7, 3, 15, 9, '.'); // kaldıraç odası
      b.fill(1, 17, 4, 17).fill(3, 14, 6, 14).fill(1, 11, 4, 11); // kule basamakları
      // --- KALDIRAÇ ODASI (Işık) ---
      b.fill(8, 9, 9, 9, 'w'); // su (2 karo)
      b.lever(11, 9, 'x', 'light');
      b.sdoor(13, 3, 9, 'e');
      // --- KORİDOR (Gölge) ---
      b.fill(10, 16, 10, 16).fill(16, 16, 16, 16).fill(22, 16, 22, 16); // asılı yayıcı blokları
      b.beam(10, 16, 'r').beam(16, 16, 'r').beam(22, 16, 'r');
      b.rmirror(14, 16, 'n', 'x').rmirror(20, 16, 'm', 'x').rmirror(26, 16, 'n', 'x');
      b.fill(12, 19, 12, 19, 'f'); // sis
      b.gauntlet(34, 19, 4, { period: 2.4, on: 1.0 }); // huzme 30-33, engel 29
      b.lever(36, 19, 'e', 'shadow'); // Işık'ın çıkış kapısı
      // toplanabilirler
      b.star(5, 13);
      b.star(3, 10);
      b.star(10, 9);
      b.star(14, 9);
      b.feather(7, 19);
      b.feather(18, 19);
      b.feather(24, 19);
      b.feather(31, 19);
      b.doorLight(15, 9);
      b.doorShadow(37, 19);
      b.light(6, 19);
      b.shadow(8, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 12 · Kristal Odası — Sur. YENİ: IŞIK KRİSTALİ (huzme düşünce aktif). Düzen: iki büyük oda (batı: kristal odası, doğu: çıkış odası), ortada bölme duvarı ve kapı.
  //   Batı oda: duvara gömülü kristal, batı duvardaki yayıcının huzmesi rafın üzerinden ona gider; raftaki KUTU huzmeyi keser (kristal sönük).
  //   Işık (huzmeye dayanıklı) merdivenle rafa çıkar, kutuyu rafın batı ucundan aşağı iter → huzme kristale ulaşır. Kutu zemine düşer; Gölge onu zamanlı geçidin batısındaki plakaya iter.
  //   Bölme kapısı VE kapısı: kristal + plaka. Doğu odada Işık kaldıraç rafına çıkıp kaldıracı çeker → çıkış odasının kapısı açılır.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('kristal-odasi', { tr: 'Kristal Odası', en: 'Crystal Chamber' }, 'sur', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      b.fill(19, 2, 19, 14); // bölme duvarı (altta kapı)
      // --- BATI ODA ---
      b.fill(1, 17, 4, 17); // basamak
      b.fill(7, 15, 17, 15); // raf
      b.beam(0, 14, 'r', { shade: true }); // raf hizasında doğuya
      b.crystal(19, 14, 'a');
      b.box(13, 14);
      b.plate(9, 19, 'a');
      b.gauntlet(16, 19, 4, { period: 2.4, on: 1.0 }); // huzme 12-15, engel 11
      b.sdoor(19, 15, 19, 'a', { all: true });
      // --- DOĞU ODA ---
      b.fill(23, 17, 25, 17); // basamak
      b.fill(27, 15, 33, 15); // kaldıraç rafı
      b.lever(30, 14, 'x', 'light');
      b.fill(25, 19, 26, 19, 'f'); // sis (2 karo)
      b.fill(29, 19, 31, 19, 'w'); // su (3 karo)
      b.sdoor(35, 15, 19, 'x');
      // toplanabilirler
      b.star(3, 16);
      b.star(16, 14);
      b.star(24, 16);
      b.star(32, 14);
      b.feather(3, 19);
      b.feather(13, 19);
      b.feather(22, 19);
      b.feather(33, 19);
      b.doorLight(37, 19);
      b.doorShadow(38, 19);
      b.light(3, 19);
      b.shadow(2, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 13 · Terazi Sarayı — Sur. YENİ: TERAZİ (ağır pan iner, öteki çıkar; kutu 2, karakter 1). Düzen: ayna simetrik; ortada terazi odası, yanlarda iki katlı galeriler (üst: kuzey, alt: güney).
  //   Işık üst-batıda, Gölge alt-doğuda başlar; çıkışlar çaprazdır (Işık alt-batı, Gölge üst-doğu). Pan A başta yukarıda (Işık tarafı), pan B aşağıda (Gölge tarafı).
  //   Işık: su havuzunun ötesinde kapı (Gölge'nin plakası); kutuyu A'ya itip kendi de A'ya çıkar (3 > 1). Gölge: zamanlı geçidi geçip ikinci kutuyu plakaya iter (üst kapı açılır), sonra B'ye çıkar.
  //   İkisi de aynı anda panlarda olunca A iner, B çıkar: Işık alt galeriye, Gölge üst galeriye taşınır. Sonra her biri kendi tehlikeleriyle çıkışa.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('terazi-sarayi', { tr: 'Terazi Sarayı', en: 'Hall of Scales' }, 'sur', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      b.fill(1, 12, 14, 13).fill(25, 12, 38, 13); // ara tavan/zemin (üst galeriler: satır 11)
      b.scale(15, 21, 4, 19, 11); // A (15-18) yukarıda, B (21-24) aşağıda
      // --- ÜST-BATI (Işık) ---
      b.fill(4, 11, 6, 11, 'w'); // su (3 karo)
      b.sdoor(9, 6, 11, 'a'); // Gölge'nin plakası açar
      b.box(11, 11);
      // --- ALT-DOĞU (Gölge) ---
      b.gauntlet(36, 19, 4, { period: 2.4, on: 1.0 }); // huzme 32-35, engel 31
      b.box(29, 19);
      b.plate(27, 19, 'a');
      // --- ALT-BATI (Işık'ın çıkışı) ---
      b.fill(5, 19, 6, 19, 'w'); // su (2 karo)
      b.fill(11, 19, 11, 19, 'f'); // sis
      // --- ÜST-DOĞU (Gölge'nin çıkışı) ---
      b.fill(26, 11, 26, 11, 'f'); // sis
      b.gauntlet(34, 11, 4, { period: 2.4, on: 1.0, phase: 1.0 }); // huzme 30-33, engel 29
      // toplanabilirler
      b.star(2, 11);
      b.star(8, 11);
      b.star(16, 10);
      b.star(12, 19);
      b.feather(37, 19);
      b.feather(25, 19);
      b.feather(27, 10);
      b.feather(32, 10);
      b.doorLight(2, 19);
      b.doorShadow(37, 11);
      b.light(2, 11);
      b.shadow(38, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 14 · Yansıma Odası — Sur. YENİ: İTİLEBİLİR AYNA (ayna kutusu). Düzen: iki oda (batı: yansıma odası, doğu: çıkışlar); batıda iki ayrı yayıcı, iki ayna kutusu, iki sabit ayna, iki kristal.
  //   Kristaller bölme duvarındadır; ikisi de yanınca VE kapısı açılır. Huzmeler ayna kutularının olduğu hücreden yukarı çıkar, tavandaki sabit aynada doğuya döner, kristale varır.
  //   Işık (huzmeye dayanıklı) alt kattaki kutuyu engele, rafın üstündeki kutuyu rafın engeline iter (kutu tam doğru sütunda durur). Gölge bölme kapısının batısında bekler (zemin huzmesi yalnız batı yarıyı kaplar).
  //   Doğuda Gölge'yi zamanlı huzme geçidi, sis ve su, Işık'ı su ve sis bekler.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('yansima-odasi', { tr: 'Yansıma Odası', en: 'Reflection Chamber' }, 'sur', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      b.fill(19, 2, 19, 14); // bölme duvarı (altta kapı)
      // --- BATI ODA ---
      b.fill(1, 17, 3, 17).fill(5, 15, 7, 15); // basamaklar (Işık)
      b.fill(8, 13, 12, 13); // raf
      b.beam(0, 19, 'r'); // zemin huzmesi
      b.beam(0, 12, 'r'); // raf huzmesi
      b.mbox(6, 19, 'm'); // zemin ayna kutusu
      b.mbox(9, 12, 'm'); // raf ayna kutusu
      b.fill(14, 19, 14, 19); // engel: zemin kutusu 13. sütunda durur
      b.fill(12, 12, 12, 12); // engel: raf kutusu 11. sütunda durur
      b.put(13, 4, 'm'); // sabit aynalar (tavan hizası)
      b.put(11, 8, 'm');
      b.crystal(19, 4, 'a');
      b.crystal(19, 8, 'a');
      b.sdoor(19, 15, 19, 'a', { all: true });
      // --- DOĞU ODA ---
      b.fill(23, 19, 23, 19, 'f'); // sis
      b.gauntlet(31, 19, 5, { period: 2.4, on: 1.0 }); // huzme 26-30, engel 25
      b.fill(33, 19, 34, 19, 'w'); // su (2 karo)
      // toplanabilirler
      b.star(2, 16);
      b.star(8, 12);
      b.star(11, 12);
      b.star(21, 19);
      b.feather(17, 19);
      b.feather(22, 19);
      b.feather(28, 19);
      b.feather(35, 19);
      b.doorLight(36, 19);
      b.doorShadow(37, 19);
      b.light(2, 19);
      b.shadow(16, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 15 · Sur Sınavı — Sur. Bölge sınavı: terazi + kandil + ayna kutusu + kristal. Düzen: üst köprü + alt tünel (iki uzun kat), batıda terazi kuyusu.
  //   Işık üst-batıdaki sahanlıktan, Gölge alttaki panda başlar. Işık kutuyu pan A'ya itip kendi de çıkar (3 > 1): A iner, B çıkar; Işık alt tünele, Gölge üst köprüye taşınır.
  //   Alt tünel (Işık): su, sis; ayna kutusunu doğudan batıya engele (kandilin gömülü olduğu blok) iter; kandili yakar → doğu kapı açılır → doğu duvardaki yayıcının huzmesi ayna kutusuna varır,
  //   yukarı çıkıp üst köprünün tabanındaki kristale ulaşır. Üst köprü (Gölge): sis, kaldıraç, zamanlı geçit; çıkış kapısı SIKI VE (kristal + kaldıraç).
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('sur-sinavi', { tr: 'Sur Sınavı', en: 'Rampart Trial' }, 'sur', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      b.fill(13, 9, 38, 10).fill(1, 9, 2, 10); // üst köprü zemini + batı sahanlık
      b.scale(3, 9, 4, 19, 8); // A (3-6) yukarıda, B (9-12) aşağıda
      b.box(2, 8); // Işık'ın itecegi kutu
      // --- ALT TÜNEL (Işık) ---
      b.fill(16, 19, 18, 19, 'w'); // su (3 karo)
      b.fill(22, 19, 22, 19, 'f'); // sis
      b.fill(29, 19, 29, 19); // engel + kandil bloğu
      b.lantern(29, 19, 'r', { group: 'h' });
      b.mbox(33, 19, 'n');
      b.beam(39, 19, 'l');
      b.sdoor(35, 11, 19, 'h');
      b.crystal(30, 10, 'g');
      // --- ÜST KÖPRÜ (Gölge) ---
      b.fill(15, 8, 15, 8, 'f'); // sis
      b.lever(18, 8, 'g', 'shadow');
      b.gauntlet(29, 8, 5, { period: 2.4, on: 1.0 }); // huzme 24-28, engel 23
      b.sdoor(34, 2, 8, 'g', { all: true, strict: true });
      // toplanabilirler
      b.star(1, 8);
      b.star(14, 19);
      b.star(25, 19);
      b.star(32, 19);
      b.feather(16, 8);
      b.feather(20, 8);
      b.feather(26, 8);
      b.feather(36, 8);
      b.doorLight(37, 19);
      b.doorShadow(37, 8);
      b.light(1, 8);
      b.shadow(10, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 16 · Basamaklı Sur — Özgürlük. Birleşim: kandil + dönen ayna + kristal + sis. Düzen: çapraz merdiven (dört teras, her biri 3 karo yüksek; sağ üst çıkış).
  //   T0: Işık kandili yakar (kandil riser bloğuna gömülü) → T1 girişindeki kapı açılır; huzmesi T0'ı kaplar (Gölge önce T1 girişine çıkmış olmalı).
  //   T1: doğu risere gömülü yayıcı batıya huzme gönderir; asılı DÖNEN ayna onu yukarı (zararsız) ya da aşağı (kristal) çevirir. Işık kaldıracı çevirir → kristal yanar → T2 kapısı açılır.
  //   Gölge kaldıraç çevrilmeden T1'in doğu ucuna geçmiş olmalı (huzme dikey çizgiyle T1'i böler). T2'de zamanlı huzme geçidi, T3'te sis ve su.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('basamakli-sur', { tr: 'Basamaklı Sur', en: 'Stepped Rampart' }, 'ozgurluk', (b) => {
      b.frame();
      b.dependent('shadow');
      b.fill(11, 17, 18, 19).fill(19, 14, 26, 19).fill(27, 11, 38, 19); // teraslar
      // --- T0 (başlangıç) ---
      b.fill(6, 19, 7, 19, 'w'); // su (2 karo)
      b.lantern(11, 19, 'l', { group: 'p' }); // riser bloğuna gömülü, batıya bakar
      b.sdoor(13, 2, 16, 'p');
      // --- T1 ---
      b.rmirror(15, 11, 'n', 'r'); // asılı dönen ayna: başta yukarı çevirir
      b.fill(19, 2, 19, 11); b.beam(19, 11, 'l'); // T2 girişinin üstündeki duvardan batıya (tırmanış yayından yüksekte)
      b.crystal(15, 17, 'b'); // T1 zemininde, ayna aşağı çevirince yanar
      b.lever(12, 16, 'r', 'light');
      b.fill(16, 16, 16, 16, 'f'); // sis
      b.sdoor(21, 2, 13, 'b');
      // --- T2 ---
      b.gauntlet(25, 13, 2, { period: 2.4, on: 1.0 }); // huzme 23-24, engel 22
      // --- T3 ---
      b.fill(30, 10, 30, 10, 'f'); // sis
      b.fill(32, 10, 33, 10, 'w'); // su (2 karo)
      // toplanabilirler
      b.star(3, 19);
      b.star(14, 16);
      b.star(20, 13);
      b.star(29, 10);
      b.feather(9, 19);
      b.feather(18, 16);
      b.feather(24, 13);
      b.feather(35, 10);
      b.doorLight(36, 10);
      b.doorShadow(37, 10);
      b.light(2, 19);
      b.shadow(4, 19);
    }),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 17 · Makara Kulesi — Özgürlük. Birleşim: terazi + zamanlı düğme + kristal-benzeri baskı (lever) + sis. Düzen: ikiz kuleler: ortada dolu blok, üstte köprü, altta koridor, iki yanda terazi kuyusu (makara).
  //   Işık sol alttaki panda (A, aşağıda), Gölge üst köprünün sağ ucunda (kutu yanında) başlar; B sağ kuyuda YUKARIDA. Gölge kutuyu B'ye itip çıkar (3 > 1): B iner, A çıkar → yer değiştirirler.
  //   Köprü (Işık): su havuzu, kaldıraç → alt koridordaki kapıyı açar. Koridor (Gölge): zamanlı huzme geçidi, zamanlı düğme (üst köprüdeki Işık kapısını 8 sn açar), sis, kaldıraçla açılan kapı.
  // ─────────────────────────────────────────────────────────────────────────────
  LEVELS.push(
    build('makara-kulesi', { tr: 'Makara Kulesi', en: 'Pulley Tower' }, 'ozgurluk', (b) => {
      b.frame();
      b.dependent('light', 'shadow');
      b.fill(9, 6, 30, 14); // orta blok
      b.scale(31, 5, 4, 19, 5); // B (31-34) yukarıda, A (5-8) aşağıda
      b.box(28, 5); // Gölge'nin B'ye itecegi kutu
      // --- ÜST KÖPRÜ (Işık, takaslandıktan sonra) ---
      b.fill(13, 5, 14, 5, 'w'); // su (2 karo)
      b.lever(20, 5, 'x', 'light'); // alt koridorun kapısı
      b.fill(23, 5, 23, 5, 'f'); // sis
      b.sdoor(26, 2, 5, 'y'); // Işık'ın kapısı: Gölge'nin zamanlı düğmesi
      // --- ALT KORİDOR (Gölge) ---
      b.gauntlet(28, 19, 4, { period: 2.4, on: 1.0 }); // huzme 24-27, engel 23
      b.timed(22, 19, 'y', 8.0);
      b.sdoor(17, 15, 19, 'x');
      b.fill(13, 19, 13, 19, 'f'); // sis
      // toplanabilirler
      b.star(10, 5);
      b.star(16, 5);
      b.star(21, 5);
      b.star(27, 5);
      b.feather(20, 19);
      b.feather(15, 19);
      b.feather(11, 19);
      b.feather(26, 19);
      b.doorLight(28, 5);
      b.doorShadow(10, 19);
      b.light(6, 19);
      b.shadow(29, 5);
    }),
  );

  const api = { LEVELS, build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IVGLevels = api;
})(typeof self !== 'undefined' ? self : this);
