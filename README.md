# Monty Arcade

Kendi yaptığım küçük web/HTML5 oyunlarının yayınlandığı site ve devlog. 2000'lerin flash portallarının modern hali.
Astro ile üretilen **statik** bir site; TR + EN.

Planlama ve tasarım spesifikasyonu: [`../MONTY_ARCADE.md`](../MONTY_ARCADE.md)

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm install` | Bağımlılıkları kurar |
| `npm run dev` | Geliştirme sunucusu (`http://localhost:4321`). **Taslaklar (`draft: true`) burada görünür.** |
| `npm run build` | Production çıktısını `dist/` klasörüne üretir. Taslaklar dahil edilmez. |
| `npm run preview` | `dist/` çıktısını yerelde sunar |
| `npm run og` | `public/og-default.png` paylaşım görselini yeniden üretir (site adı değişince) |

Node 22.18+ gerekir (`npm run og` `.ts` dosyalarını doğrudan içe aktarır). Geliştirmede Node 24 kullanıldı.

## Klasör yapısı (özet)

```
src/
  config/site.ts         site adı, linkler, özellik bayrakları  ← çoğu ayar burada
  i18n/ui.ts             TÜM arayüz metinleri (TR/EN) + etiket çevirileri
  content.config.ts      içerik şemaları (oyunlar, devlog)
  content/games/         oyun bilgi dosyaları (<slug>.md) + covers/
  content/devlog/{tr,en} devlog yazıları
  components/            arayüz bileşenleri
  layouts/               Base (sayfa iskeleti), Prose (metin düzeni)
  pages/                 rotalar: /, /[lang]/, /[lang]/games/[slug]/, /[lang]/devlog/..., /[lang]/about/, 404
  styles/                tokens.css (renkler vb.), global.css, fonts.css
public/
  play/<slug>/           oyun dosyaları (build çıktısı)
  favicon.svg, og-default.png, _headers
```

## Oyun ekleme

1. Oyunun build çıktısını `public/play/<slug>/` klasörüne koy. Giriş dosyası `index.html` olmalı ve oyun
   **göreli yollarla** çalışmalı (alt klasörde servis edilecek).
2. Kapak görselini `src/content/games/covers/<slug>.png` olarak ekle (16:10, en az 1280x800; otomatik WebP'ye çevrilir).
3. `src/content/games/<slug>.md` bilgi dosyasını oluştur:

```yaml
---
title: { tr: "Örnek Oyun", en: "Sample Game" }
tagline: { tr: "Tek cümlelik açıklama.", en: "One-line description." }
description:
  tr: "İlk paragraf.\n\nİkinci paragraf."
  en: "First paragraph.\n\nSecond paragraph."
controls:
  - keys: ["←", "→"]
    action: { tr: "Hareket", en: "Move" }
  - keys: ["BOŞLUK"]
    action: { tr: "Zıpla", en: "Jump" }
cover: ./covers/ornek-oyun.png
tags: [arcade, one-button, mobile]
releaseDate: 2026-11-01
featured: true        # ana sayfa "Haftanın oyunu" (yoksa en yeni oyun)
sizeMB: 2.4
mobile: true
aspectRatio: "16/9"   # oynatıcı oranı (varsayılan 16/9)
# playUrl: /play/ornek-oyun/index.html   # varsayılan budur
# relatedPosts: [hos-geldin]             # devlog slug'ları (ya da yazıda `game: <slug>`)
achievements:          # v1.5/v2 için şimdiden yazılabilir
  - id: first-lap
    title: { tr: "İlk Tur", en: "First Lap" }
    description: { tr: "İlk turu tamamla.", en: "Finish your first lap." }
    icon: flag          # star | flag | bolt | clock | trophy | crown | heart | target
    tier: common        # common | rare | legendary
    # hidden: true
# draft: true          # sadece `npm run dev`'de görünür
---
```

4. Bitti. Ana sayfa grid'i, etiket filtreleri, ticker, "YENİ" etiketi (çıkıştan sonra 30 gün),
   oyun sayfası, "Diğer oyunlar", hero ve sitemap otomatik güncellenir; "Pitte hazırlanıyor" kartları azalır.

Oyun, dili `?lang=tr|en` URL parametresinden okuyabilir.

**Etiketler:** `src/i18n/ui.ts` → `tagLabels`. Sözlükte olmayan etiket olduğu gibi gösterilir.

**Taslak örnek oyun:** `src/content/games/ornek-oyun.md` + `public/play/ornek-oyun/` oynatıcıyı ve oyun
sayfası şablonunu test etmek içindir (`draft: true`). Production build'e girmez: dosyaları build sonunda
`dist/`'ten silinir (`astro.config.mjs` → `stripDraftGames`). İlk gerçek oyun gelince silinebilir.

## Devlog yazısı

`src/content/devlog/tr/<slug>.md` ve `src/content/devlog/en/<slug>.md`. Aynı yazının iki dili **aynı slug** ile
tutulur, böylece dil değiştirici eşleştirebilir. Yazı tek dilde varsa, dil değiştirici diğer dilin devlog listesine gider.

```yaml
---
title: "Yazı başlığı"
description: "Liste satırında görünen kısa özet."
date: 2026-10-06
game: ornek-oyun     # opsiyonel: ilgili oyun (yazının sonunda kartı görünür)
draft: false
---
Markdown içerik…
```

## Sık değişen ayarlar

- **Site adı:** `src/config/site.ts` → `name` ve `wordmark`. Ardından `npm run og` ve gerekirse `public/favicon.svg`.
- **Vurgu rengi:** `src/styles/tokens.css` → `--accent` (tek satır). Favicon ve OG görselinde `#ff6b2c` sabit yazılı.
- **Alan adı:** `src/config/site.ts` → `url` (canonical, hreflang, sitemap, robots buna göre üretilir).
- **Sosyal linkler:** `src/config/site.ts` → `links` (boş olanlar gizlenir; `kofi` doluysa footer'da "Destek ol" butonu çıkar).
- **Metinler:** `src/i18n/ui.ts`. Bileşenlerde sabit metin yok. Hakkında sayfası ve Sürücü kartındaki
  `[köşeli parantezli]` yer tutucuları buradan değiştir.
- **v2 alanları:** `features.accounts` (giriş butonu, başarım paneli, kart rozet sayısı; şimdilik `false`),
  `features.achievementsTeaser` (ana sayfadaki "Yakında" kutusu).

## Yayına alma

Çıktı tamamen statik (`dist/`). Build komutu `npm run build`, çıktı klasörü `dist`.

- **Cloudflare Pages:** önbellek başlıkları `public/_headers` dosyasından gelir. Ticari kullanıma (reklam) izin verir.
- **Vercel:** önbellek başlıkları `vercel.json` dosyasından gelir. Hobby planı ticari kullanıma izin vermez.

404: kökteki `404.html` her iki dili içerir; URL önekine (`/tr/`) ya da tarayıcı diline göre doğru dil gösterilir.

## Performans notları

- Oyun iframe'i sadece "Oynamak için tıkla"ya basınca oluşturulur; ziyaretçi sadece açtığı oyunu indirir.
- Fontlar siteyle birlikte barındırılır (Fontsource). Türkçe harfler (Ğ ğ İ ı Ş ş) için ~11 KB'lık ek font
  `src/assets/fonts/` içinde (`styles/fonts.css`); 90 KB'lık latin-ext dosyası yüklenmez.
- CSS sayfaya satır içi verilir (`build.inlineStylesheets: 'always'`).
- Ölçüm (Lighthouse mobil, yerel gzip sunucu): Performance 97–99, Accessibility / Best Practices / SEO 100.
