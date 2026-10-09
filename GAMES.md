# Monty Arcade — Oyun Geliştirme Rehberi

Bu dosya, Monty Arcade'de yayınlanacak bir oyunu **yapmak** ve siteye **eklemek** için gereken her şeyi anlatır.
Yeni bir oyun oturumuna başlarken önce bunu oku. Sitenin genel yapısı için [`README.tr.md`](README.tr.md),
ilk planlama belgesi için `../MONTY_ARCADE.md` (repo dışında; kısmen eski) var.

> **Durum (v1.1.0):** Site yayında (https://monty-arcade.vercel.app). Dört oyun yayında:
> `monty-satranc`, `kask-kacisi`, `isiklar-sondu`, `pit-stop`. Oyunlar `unlock` mesajlarını gönderiyor ama sitede
> başarım bildirimi (Monty SDK'nın site tarafı) henüz yazılmadı.

---

## 1. Oyun nedir, nerede yaşar?

- Her oyun **kendi başına çalışan bir HTML5 sayfasıdır** (`index.html` + JS/CSS/görsel/ses dosyaları).
- Site, oyunu oyun sayfasındaki **Monty Player** içinde bir `<iframe>` ile açar. Iframe sadece oyuncu
  "Oynamak için tıkla"ya bastığında oluşturulur; sayfayı açan herkes oyunu indirmez.
- Oyun dosyaları sitede `public/play/<slug>/` altında durur ve `https://monty-arcade.vercel.app/play/<slug>/index.html`
  adresinden servis edilir. Site ile **aynı origin**'dedir.
- Oyunlar sadece benim yaptığım oyunlardır. Her oyun özgün olmalı; telifli karakter, isim, müzik ya da görsel kullanılmaz.

### Kaynak kod nerede durmalı?

Önerilen düzen: oyunun **kaynak kodu site reposunun dışında**, örneğin `MontyGames/oyunlar/<slug>/` (istersen ayrı
bir git reposu). Siteye sadece oyunun **build çıktısı** kopyalanır:

```
MontyGames/
├─ monty-arcade/            ← site (bu repo)
│  └─ public/play/<slug>/   ← SADECE build çıktısı
└─ oyunlar/<slug>/          ← oyunun kaynak kodu, asset'leri, build ayarları
```

Çok küçük, tek dosyalık (build gerektirmeyen) bir oyun doğrudan `public/play/<slug>/` içinde yazılabilir.

### Slug

Oyunun kalıcı kimliği: küçük harf, rakam ve tire (`kask-kacisi`, `pit-stop`). Klasör adı, bilgi dosyası adı,
kapak adı ve URL'de aynı slug kullanılır. **Yayınlandıktan sonra değiştirme** (linkler ve gelecekteki başarım kayıtları kırılır).

---

## 2. Teknik gereksinimler (oyunun uyması gerekenler)

| Konu | Kural |
|---|---|
| **Giriş dosyası** | `public/play/<slug>/index.html` |
| **Yollar** | Hepsi **göreli** olmalı (`./assets/x.png`, `/assets/x.png` değil). Vite kullanıyorsan `base: './'`. |
| **Boyut** | Toplam mümkünse **< 10 MB**. Küçük oyun = hızlı açılış + düşük barındırma maliyeti. Ölçüp `sizeMB` alanına yaz. |
| **Ekran / boyutlandırma** | Oyun iframe'in tamamını kaplamalı (`html, body { margin:0; height:100%; overflow:hidden }`, canvas %100) ve `resize` olayını dinlemeli. Oynatıcı oranı `aspectRatio` alanından gelir (varsayılan `16/9`); tam ekranda farklı oranlar da olabilir, oyun buna dayanıklı olmalı. |
| **Dil** | Site iframe'i `?lang=tr` veya `?lang=en` ile açar. Oyun metinleri bu parametreye göre seçilmeli; parametre yoksa İngilizce. |
| **Klavye** | Oyun yüklenince oynatıcı iframe'e odaklanır. Tuşları `window` üzerinde dinle; Boşluk/ok tuşlarında `preventDefault()` çağır (yoksa üstteki sayfa kayar). |
| **Mobil** | `mobile: true` olacaksa dokunmatik kontrol şart (`pointerdown`/`touch` olayları, `touch-action: manipulation`). Değilse `mobile: false` bırak. |
| **Ses** | Tarayıcılar kullanıcı etkileşimi olmadan sesi engeller: sesi oyuncunun ilk tıklaması/tuşuyla başlat. Sessize alma için §3'teki `mute` mesajını dinle. |
| **Gamepad** | İzinli (`allow="gamepad"`), istersen destekle. |
| **Site dışında çalışma** | Oyun tek başına da (itch.io, portallar, doğrudan URL) sorunsuz çalışmalı. Site iletişimi (§3) sadece iframe içindeyken yapılır ve hata vermemeli. |
| **Bağımlılık** | Dışarıdan CDN'e bağımlı olma; tüm dosyalar oyun klasöründe olsun. |
| **Kayıt** | Oyun kendi verisini `localStorage`'a yazabilir; anahtarları `monty:<slug>:...` önekiyle yaz (`monty:ach:` öneki SDK'ya ayrıldı). |

### Motor / araç seçimi

Her şey olur, yeter ki HTML5 çıktısı versin ve küçük kalsın:

- **Saf JS + Canvas** veya **Phaser** gibi hafif kütüphaneler: en küçük ve en hızlı seçenek, önerilen.
- **Godot 4 web export:** çok iş parçacıklı export ek sunucu başlıkları (COOP/COEP) ister; **"Thread Support" kapalı**
  export al. Boyut genelde birkaç MB ve üzeri olur.
- **Unity WebGL:** çok ağır (onlarca MB); bu site için önerilmez.

---

## 3. Site ↔ oyun iletişimi (şu anki protokol)

İletişim `window.postMessage` ile, her zaman `location.origin` hedefiyle yapılır. Oynatıcı gelen mesajlarda
`event.origin === location.origin` ve `event.source === iframe.contentWindow` kontrolü yapar.

**Oyun → site** (`source: 'monty-sdk'`):

```js
// Oyun oynanabilir hale gelince bir kez gönder: yükleme katmanı kapanır, "Ses" butonu görünür.
if (window.parent !== window) {
  window.parent.postMessage({ source: 'monty-sdk', v: 1, type: 'ready' }, location.origin);
}
```

**Site → oyun** (`source: 'monty-site'`):

```js
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return;
  const d = e.data;
  if (d?.source === 'monty-site' && d.type === 'mute') setMuted(d.muted); // true = sessiz
});
```

Bugün oynatıcının anladığı mesajlar sadece bunlar (`ready` ve `mute`). Uygulaması: `src/components/Player.astro`.

### Oyun kiti (`kit.js`)

Kask Kaçışı, Işıklar Söndü ve Pit Stop aynı küçük kiti kullanıyor: `public/play/<slug>/kit.js`. Her oyunun klasöründe
aynı dosyanın bir kopyası var (oyunlar dışarıya bağımlı olmasın diye). Kit şunları yapar:
dil (`kit.lang`), `monty:<slug>:` önekli kayıt (`kit.store`), `ready` / `unlock` mesajları, sitenin `mute` mesajı,
sekme gizlenince `pause` olayı ve WebAudio ile dosyasız sesler (`kit.sound.tone` / `kit.sound.noise`).
Yeni bir oyuna başlarken `kit.js` ve `fonts.css` + `fonts/` klasörünü bu oyunlardan birinden kopyala.
Kiti değiştirirsen değişikliği diğer kopyalara da uygula.

### Gelecek: Monty SDK (site tarafı v2'de — henüz YOK)

İlk oyunlarla birlikte `public/sdk/monty.js` yazılacak. Oyunlar `<script src="/sdk/monty.js"></script>` ile ekleyip şunları kullanacak:

```js
Monty.ready();                      // yükleme bitti
Monty.unlock('first-lap');          // başarım aç
Monty.progress('laps', 7, 10);      // (opsiyonel) ilerlemeli başarım
Monty.on('mute', (muted) => {});    // site ses butonu
Monty.on('pause' | 'resume', fn);   // sekme gizlenince vb.
Monty.lang;                         // 'tr' | 'en'
```

Mesaj biçimi: `{ source: 'monty-sdk', v: 1, type: 'unlock', gameId, achievementId }`. Site tarafında yapılacaklar:
`achievementId` oyunun bilgi dosyasındaki listede yoksa yok say; daha önce açıldıysa tekrar bildirme; açıldıysa sağ altta
"Başarım açıldı!" bildirimi (toast) göster. Başarımlar **yalnızca üyelerde kalıcıdır** (Supabase); misafirin başarımları
sadece o oturumda tutulur ve toast'ta "Kaydedilmedi — üye ol, kaybolmasın" yazar. Bu bilinçli bir üyelik teşviki;
misafir başarımlarını `localStorage`'a kalıcı yazma. Ayrıntı: `../MONTY_ARCADE.md` §11.2. SDK site dışında sessizce hiçbir şey yapmamalı.

**İlk oyunu yaparken:** SDK'yı yazmak ilk oyunun işinin bir parçası. O zamana kadar oyunda başarımları
`Monty.unlock(...)` çağrılarıyla tasarlamak ve SDK'yı bu dosyadaki tasarıma göre yazmak yeterli.

---

## 4. Siteye ekleme (3 dosya)

1. **Build çıktısı** → `public/play/<slug>/` (giriş `index.html`).
2. **Kapak** → `src/content/games/covers/<slug>.png` — 16:10, en az **1280×800**. PNG/JPG; site otomatik WebP'ye çevirir.
   Kapak, oynatıcıda bulanık arka plan olarak da kullanılır.
3. **Bilgi dosyası** → `src/content/games/<slug>.md` (sadece frontmatter):

```yaml
---
title: { tr: "Oyunun Adı", en: "Game Name" }
tagline: { tr: "Kartta görünen tek cümle.", en: "One sentence shown on the card." }
description:
  tr: "Oyun sayfasındaki ilk paragraf.\n\nİkinci paragraf."
  en: "First paragraph on the game page.\n\nSecond paragraph."
controls:
  - keys: ["←", "→"]
    action: { tr: "Hareket", en: "Move" }
  - keys: ["BOŞLUK"]          # İngilizce sayfada da aynı tuş etiketi görünür
    action: { tr: "Zıpla", en: "Jump" }
cover: ./covers/<slug>.png
tags: [arcade, one-button, mobile]
releaseDate: 2026-11-01       # sıralama ve 30 günlük "YENİ" etiketi
featured: true                 # ana sayfada "Haftanın oyunu" (yoksa en yeni oyun)
aspectRatio: "16/9"
sizeMB: 2.4
mobile: true
achievements:                  # SDK gelince kullanılacak; şimdiden yazılabilir
  - id: first-lap              # sadece a-z, 0-9, tire; yayından sonra değiştirme
    title: { tr: "İlk Tur", en: "First Lap" }
    description: { tr: "İlk turu tamamla.", en: "Finish your first lap." }
    icon: flag                 # star | flag | bolt | clock | trophy | crown | heart | target
    tier: common               # common | rare | legendary
    hidden: false
draft: true                    # test bitene kadar açık bırak
---
```

Kullanılabilir etiketler (`src/i18n/ui.ts` → `tagLabels`): `arcade`, `puzzle`, `racing`, `action`, `casual`,
`platformer`, `one-button`, `mobile`. Yeni bir etiket gerekirse oraya TR/EN çevirisini ekle (yoksa etiket olduğu gibi görünür).

Ekleyince her şey otomatik güncellenir: ana sayfa grid'i, etiket filtreleri, LED ticker, hero, "YENİ" etiketi,
oyun sayfası, "Diğer oyunlar", sitemap ve oyun sayfasının `VideoGame` JSON-LD'si.

---

## 5. Test

1. `draft: true` ile ekle, `npm run dev` → `http://localhost:2705/tr/games/<slug>/`.
2. Kontrol listesi:
   - [ ] "Oynamak için tıkla" → oyun açılıyor, yükleme katmanı kapanıyor (oyun `ready` gönderiyorsa)
   - [ ] Tam ekran ve "Yeniden başlat" çalışıyor; tam ekranda oyun doğru boyutlanıyor
   - [ ] Klavye: Boşluk/ok tuşları sayfayı kaydırmıyor
   - [ ] `?lang=tr` ve `?lang=en` ile metinler doğru dilde
   - [ ] Telefonda (ya da tarayıcının mobil görünümünde) oynanabiliyor (`mobile: true` ise)
   - [ ] Oyun doğrudan `/play/<slug>/index.html` adresinde de tek başına çalışıyor
   - [ ] Toplam boyut ölçüldü ve `sizeMB` dolduruldu
3. Hazır olunca `draft: true` satırını sil, `npm run build` + `npm run preview` (`http://localhost:2607`) ile son kontrol.
   `npm run check` (tip kontrolü) de hatasız olmalı.

Kapak görselleri `scripts/covers/<slug>.mjs` betikleriyle SVG'den üretilir (`node scripts/covers/<slug>.mjs`).

---

## 6. Yayına alma

1. Oyun için bir devlog yazısı yaz (`src/content/devlog/{tr,en}/<slug>.md`, frontmatter'da `game: <slug>`): fikir nereden çıktı,
   nerede takıldın, ne öğrendin. Yazının sonunda oyunun kartı otomatik görünür.
2. Commit at. **Oyun eklemek push sebebidir**: `main`'e push et, sürüm etiketi koy (ör. `v1.1.0`) ve etiketi de push et.
   Vercel birkaç dakika içinde yayınlar.
3. Oyunu sonradan güncellersen: `/play/` dosyaları tarayıcı ve CDN'de **1 gün** önbellekte kalır. Hemen yansıması
   gerekiyorsa build'i yeni bir alt klasöre koy (`public/play/<slug>/v2/`) ve bilgi dosyasında `playUrl: /play/<slug>/v2/index.html` yaz.

---

## 7. Tasarım notları (opsiyonel ama önerilen)

Oyunların sitenin görsel dilinden kopuk durmaması iyi olur ama zorunlu değil. Uyum istersen site paleti:

| Renk | Hex |
|---|---|
| Zemin (lacivert) | `#0d1328` |
| Krem | `#f3ead8` |
| Yarış turuncusu (vurgu) | `#ff6b2c` |
| LED sarısı | `#ffc23d` |

Yarış/arcade teması, damalı bayrak, hız çizgileri, LED yazılar sitenin ruhuna uyar. Maskot **Monty** (LED gözlü krem
yarış kaskı) oyunlarda kullanılabilir; çizimi `src/components/MontyHelmet.astro` içinde SVG olarak var. Monty özgün
kalmalı: hiçbir film/çizgi film karakterine, özellikle yüzlü araba karakterlerine benzetilmemeli.
