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
      // toplanabilirler
      b.star(13, 16); // fırlatma yayının üstünde
      b.star(22, 19);
      b.star(38, 12); // doğu cep (orta kat)
      b.star(30, 6);
      b.feather(13, 20); // suyun dibi
      b.feather(29, 20); // ikinci suyun dibi
      b.feather(29, 12); // huzme koridorunda
      b.feather(9, 13);
      b.feather(33, 6); // huzmenin hemen altı (kısa sıçrayış)
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
  //   ORTA KAT (sağdan sola): L3'teki gibi huzme koridoru, kırmızı plaka + taş kapı + en batıdaki kaldıraç; sonra batıdaki basamaklarla üst kata.
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
      b.plate(24, 13, 'red');
      b.sdoor(17, 9, 13, 'red');
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
      b.sdoor(16, 6, 9, 'amber');
      b.sdoor(16, 16, 19, 'blue');
      // --- SOL ÜST ---
      b.beam(0, 7, 'r'); // batı duvardan doğuya; sütun huzmeyi keser (deliği kapsar)
      b.fill(7, 2, 7, 7);
      b.box(9, 9);
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
      b.doorShadow(36, 19);
      b.doorLight(38, 19);
      b.light(11, 9);
      b.shadow(13, 9);
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
      b.button(38, 19, 0, 'right'); // en doğuda (doğuya geçince): alttan üste gönderir
      b.gauntlet(37, 19, 5, { period: 2.4, on: 1.0 }); // huzme geçidi (32-36): düğmeye giderken ve dönerken Gölge huzme kapalıyken geçmeli
      b.sdoor(8, 10, 19, 'amber'); // Gölge'nin kapısı
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

  const api = { LEVELS, build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IVGLevels = api;
})(typeof self !== 'undefined' ? self : this);
