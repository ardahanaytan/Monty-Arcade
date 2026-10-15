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
    return { id, name, region, cols, rows, tiles: g.map((r) => r.join('')), starts, doors, items, beams, levers, plates, sdoors, boxes, lanterns, lifts, exclusive, dependent };
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
      b.fill(5, 10, 5, 10, 'f'); // basamak 3'ün giriş ucunda sis
      b.fill(1, 8, 6, 8); // üst oda zemini (7-9 giriş boşluğu)
      b.fill(2, 7, 3, 7, 'w'); // üst odada su havuzu
      b.plate(4, 7, 'red');
      b.box(5, 7);
      b.lever(1, 7, 'blue', 'light');
      // --- DOĞU KULE (Gölge) ---
      b.fill(30, 17, 34, 17).fill(35, 14, 38, 14).fill(30, 11, 34, 11);
      b.fill(31, 19, 34, 19, 'f');
      b.fill(37, 13, 37, 13, 'f');
      b.fill(34, 10, 34, 10, 'f');
      b.beam(29, 9, 'r', { period: 2.4, on: 1.2, phase: 0.4 }); // basamak 3'ten üst odaya çıkış boşluğunda zamanlı huzme
      b.fill(33, 8, 38, 8);
      b.gauntlet(38, 7, 4, { period: 2.4, on: 1.0, phase: 1.0 }); // engel 33, huzme 34-37
      b.plate(34, 7, 'blue');
      b.box(35, 7);
      b.lever(36, 7, 'red', 'shadow');
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

  const api = { LEVELS, build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IVGLevels = api;
})(typeof self !== 'undefined' ? self : this);
