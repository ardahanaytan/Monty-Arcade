<div align="center">

<img src="public/og-default.png" alt="Monty Arcade — Bağımsız, küçük, tarayıcıda anında oynanan oyunlar." width="100%">

# Monty Arcade

**Küçük oyunlar. Büyük nostalji.**

Kendi yaptığım küçük tarayıcı oyunlarının evi ve onları yaparken tuttuğum bir devlog.<br>
2000'lerin flash oyun portalları, bugünün web'i için yeniden.

[![Astro](https://img.shields.io/badge/Astro-7-ff6b2c?style=flat-square&logo=astro&logoColor=white&labelColor=0d1328)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-ff6b2c?style=flat-square&logo=typescript&logoColor=white&labelColor=0d1328)](https://www.typescriptlang.org)
[![Statik](https://img.shields.io/badge/%C3%A7%C4%B1kt%C4%B1-%25100%20statik-ffc23d?style=flat-square&labelColor=0d1328)](vercel.json)
[![i18n](https://img.shields.io/badge/i18n-TR%20%2F%20EN-ffc23d?style=flat-square&labelColor=0d1328)](src/i18n/ui.ts)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-97%E2%80%93100-f3ead8?style=flat-square&logo=lighthouse&logoColor=white&labelColor=0d1328)](https://developer.chrome.com/docs/lighthouse)

### [▶ monty-arcade.vercel.app adresinde oyna](https://monty-arcade.vercel.app/tr/)

[English](README.md) · **Türkçe**

</div>

---

## 🏁 Proje hakkında

Monty Arcade, baştan sona kendi ürünümü çıkarmayı öğrenmek için yaptığım kişisel bir proje: tasarlamak, kodlamak,
yayına almak, büyütmek ve ayakta tutmak. Yani işin sadece eğlenceli kısmını değil, tamamını.

İşe en iyi bildiğim yerden başlamak istedim. Çocukken bütün boş vaktimi geçirdiğim flash oyun siteleri, internetle
ilk gerçek bağımı kurduğum yerlerdi: kurulum yok, hesap yok, bir oyuna tıkla ve oyna. Monty Arcade o ruhu alıp
hızlı, telefonda da çalışan modern bir web'le birleştiriyor.

- **Sadece kendi oyunlarım.** Buradaki her oyunu ben yaptım.
- **Bir devlog.** Fikirler, çıkmaz sokaklar, küçük zaferler ve yol boyunca öğrendiklerim.
- **Monty**, maskot: LED gözlü, özgün bir retro yarış kaskı. Adı, bir yarış efsanesinin gerçek adı olan *Montgomery*'den geliyor.

> İlk oyunlar pitte hazırlanıyor. 🏎️

## 📸 Ekran görüntüleri

<p align="center">
  <img src="docs/screenshots/home-en.png" alt="Ana sayfa (masaüstü): Monty'li hero, öne çıkanlar, oyun grid'i" width="49%">
  <img src="docs/screenshots/game-page.png" alt="Oyun sayfası şablonu (masaüstü): Monty Player ve brifing" width="49%">
</p>
<p align="center">
  <img src="docs/screenshots/mobile-strip.png" alt="Mobil: ana sayfa (TR), Monty Player'da çalışan oyun, devlog yazısı, 404 sayfası" width="100%">
</p>

<sub>Oyun sayfasında şablonu test etmek için kullanılan taslak bir örnek oyun var. Taslaklar sadece geliştirme modunda görünür.</sub>

## ✨ Özellikler

| | |
|---|---|
| 🎮 **Monty Player** | Tam ekran ve yeniden başlatma özellikli tıkla-yükle oynatıcı. Oyun sadece "Oyna"ya basınca indirilir. |
| 🗂️ **İçerik odaklı** | Üç dosyayla oyun eklenir: oyunun build'i, kapak görseli ve bir Markdown bilgi dosyası. Grid, filtreler, ticker, hero ve sitemap kendiliğinden güncellenir. |
| 🔎 **Arama ve etiketler** | İki dilde birden anında çalışan arama ve etiket filtreleri. |
| 🌍 **TR / EN** | Her sayfa iki dilde; tarayıcı diline göre yönlendirme, aynı sayfada kalan dil değiştirici, her yerde `hreflang`. |
| 📰 **Devlog** | Okuma süresi, önceki/sonraki yazı linkleri ve ilgili oyun kartı olan Markdown yazılar. |
| 📺 **Flash dönemi detayları** | LED ticker, damalı bayraklar, hız çizgileri, parlak butonlar, 88×31 rozetler ve "DNF" 404 sayfası. Hepsi ölçülü. |
| ♿ **Erişilebilir** | "İçeriğe atla" linki, görünür odak, 44 px dokunma hedefleri, `prefers-reduced-motion`, anlamsal HTML, ekran okuyucu etiketleri. |
| 🏆 **v2'ye hazır** | Başarım şeması, başarım paneli ve giriş alanları şimdiden yazıldı; bir özellik bayrağının arkasında gizli. |

## 🧰 Teknolojiler

- **[Astro 7](https://astro.build)**: statik çıktı, içerik koleksiyonları, `astro:assets` görsel işleme (WebP)
- **TypeScript** (strict), `astro check` ile kontrol
- **Saf CSS**, tasarım token'ları CSS değişkeni olarak. UI framework'ü yok.
- **Saf JS**, sadece gereken yerlerde (filtre/arama, oynatıcı, dil hafızası): ana sayfada yaklaşık 3 KB
- **Siteyle birlikte barındırılan fontlar** (Fontsource): Archivo (değişken, `wdth` + `wght`) ve Space Mono
- **@astrojs/sitemap**; `robots.txt` ve Open Graph etiketleri tek bir ayar dosyasından üretiliyor

## 🚀 Başlarken

**Node.js 22.18+** gerekir (Node 24 ile geliştirildi).

```bash
git clone https://github.com/ardahanaytan/Monty-Arcade.git
cd Monty-Arcade
npm install
npm run dev
```

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu: `http://localhost:2705`. Taslaklar burada görünür. |
| `npm run build` | Production çıktısını `dist/` klasörüne üretir. Taslaklar dahil edilmez. |
| `npm run preview` | `dist/` çıktısını `http://localhost:2607` adresinde sunar |
| `npm run check` | Tip kontrolü (`astro check`) |
| `npm run og` | Paylaşım görselini (`public/og-default.png`) yeniden üretir |

## 🗺️ Klasör yapısı

```text
src/
├─ config/site.ts          site adı, linkler, özellik bayrakları (çoğu ayar burada)
├─ i18n/ui.ts              tüm arayüz metinleri (TR/EN) ve etiket çevirileri
├─ content.config.ts       içerik şemaları: oyunlar, devlog
├─ content/
│  ├─ games/<slug>.md      oyun bilgi dosyaları (+ covers/)
│  └─ devlog/{tr,en}/      devlog yazıları
├─ components/             Header, Ticker, GameGrid, GameCard, Player, MontyHelmet…
├─ layouts/                Base (sayfa iskeleti), Prose (uzun metin düzeni)
├─ pages/                  /, /[lang]/, /[lang]/games/[slug]/, /[lang]/devlog/…, /[lang]/about/, 404
└─ styles/                 tokens.css, global.css, fonts.css
public/
└─ play/<slug>/            oyun build'leri (iframe içinde açılır)
```

## 🕹️ Oyun ekleme

1. Oyunun build çıktısını `public/play/<slug>/` klasörüne koy. Giriş dosyası `index.html` olmalı ve oyun **göreli yollarla** çalışmalı.
2. Kapak görselini ekle: `src/content/games/covers/<slug>.png` (16:10, en az 1280×800; otomatik WebP'ye çevrilir).
3. `src/content/games/<slug>.md` dosyasını oluştur:

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
cover: ./covers/ornek-oyun.png
tags: [arcade, one-button, mobile]
releaseDate: 2026-11-01
featured: true       # ana sayfada "Haftanın oyunu"
sizeMB: 2.4
mobile: true
---
```

Bu kadar. Oyun kartı, etiket filtreleri, LED ticker, "YENİ" etiketi (30 gün), oyun sayfası, "Diğer oyunlar",
ana sayfa hero'su ve sitemap bir sonraki build'de güncellenir. Oyun dilini `?lang=tr|en` URL parametresinden okuyabilir.

<details>
<summary><b>Tüm oyun alanları</b></summary>

| Alan | Tip | Not |
|---|---|---|
| `title`, `tagline`, `description` | `{ tr, en }` | `description` paragrafları `\n\n` ile ayrılır |
| `controls` | `{ keys, action }` listesi | Klavye tuşu görselleriyle gösterilir |
| `cover` | görsel | 16:10, ≥ 1280×800 |
| `tags` | metin listesi | Çeviriler `src/i18n/ui.ts` → `tagLabels` |
| `releaseDate` | tarih | Sıralamayı ve "YENİ" etiketini belirler |
| `featured` | boolean | Hero oyunu (yoksa en yeni oyun) |
| `aspectRatio` | metin | Oynatıcı oranı, varsayılan `16/9` |
| `sizeMB`, `mobile` | sayı, boolean | Teknik kartta gösterilir |
| `playUrl` | metin | Varsayılan `/play/<slug>/index.html` |
| `relatedPosts` | metin listesi | Devlog slug'ları (ya da yazıda `game: <slug>`) |
| `achievements` | liste | v1.5/v2 için hazır: `id`, `title`, `description`, `icon`, `tier`, `hidden` |
| `draft` | boolean | Sadece `npm run dev`'de görünür; dosyaları `dist/`'ten silinir |

</details>

**Taslak örnek oyun:** `src/content/games/ornek-oyun.md` ve `public/play/ornek-oyun/` oynatıcıyı ve oyun sayfası
şablonunu test etmek için var (`draft: true`). Production build'e girmez: dosyaları build sonunda `dist/`'ten silinir
(`astro.config.mjs` → `stripDraftGames`). İlk gerçek oyun gelince silinebilir.

## ✍️ Devlog yazısı

`src/content/devlog/tr/<slug>.md` ve/veya `src/content/devlog/en/<slug>.md` oluştur. Dil değiştiricinin iki dili
eşleştirebilmesi için **aynı slug**'ı kullan. Sadece tek dilde olan bir yazıda dil değiştirici, diğer dilin devlog listesine gider.

```yaml
---
title: "Yazı başlığı"
description: "Listede görünen kısa özet."
date: 2026-10-06
game: ornek-oyun     # opsiyonel: yazının sonunda oyunun kartı görünür
---
```

## 🌍 Çoklu dil

- Rotalar `/tr/…` ve `/en/…` altında. Kök (`/`) tarayıcı diline göre yönlendirir ve son seçilen dili hatırlar.
- Kullanıcıya görünen her metin `src/i18n/ui.ts` dosyasından geliyor. Bileşenlerde sabit metin yok.
- Türkçe büyük harf dönüşümünde `toLocaleUpperCase('tr')` kullanılıyor (i → İ).
- 404 sayfası iki dili birden içerir; URL önekine ya da tarayıcı diline göre doğru olanı gösterir.

## 🎨 Tasarım sistemi

"Modern retro yarış / arcade": gece yarışı pisti hissi. Koyu lacivert, krem metin, **tek** vurgu rengi.

| Token | Değer | Kullanım |
|---|---|---|
| `--bg` | `#0d1328` | Sayfa zemini |
| `--surface` | `#131a36` | Kartlar, paneller |
| `--text` | `#f3ead8` | Krem metin ve başlıklar |
| `--accent` | `#ff6b2c` | Yarış turuncusu, tek vurgu |
| `--led` | `#ffc23d` | LED sarısı: ticker, Monty'nin gözleri, linkler |

**Tipografi:** Başlıklarda Archivo (%125 genişlik, italik, 900); etiketlerde Space Mono.
Tüm token'lar [`src/styles/tokens.css`](src/styles/tokens.css) dosyasında. `--accent`'i değiştirmek bütün sitenin rengini değiştirir.

## ⚙️ Ayarlar

Çoğu ayar [`src/config/site.ts`](src/config/site.ts) dosyasında:

```ts
export const site = {
  name: 'Monty Arcade',
  url: 'https://monty-arcade.vercel.app',   // canonical, hreflang, sitemap ve robots buna göre üretilir
  links: { github, linkedin, itch, kofi, email },   // boş olanlar gizlenir
  features: {
    accounts: false,            // v2: giriş butonu, başarım paneli, kart rozet sayısı
    achievementsTeaser: true,   // "Yakında: Profil & başarımlar" kutusu
  },
  newBadgeDays: 30,
};
```

- **Site adı değişirse:** `name` ve `wordmark`, ardından `npm run og` (ve gerekirse `public/favicon.svg`).
- **Vurgu rengi:** `src/styles/tokens.css` → `--accent`. Favicon ve paylaşım görselinde `#ff6b2c` sabit yazılı.
- **Profil linkleri:** `github` ve `linkedin` logolu olarak header'da (≥900px), footer'da, ana sayfadaki Sürücü kartında
  ve Hakkında sayfasında görünür (`components/SocialLinks.astro`). `kofi` doluysa footer'da "Destek ol" butonu çıkar.

## ☁️ Yayına alma

Çıktı tamamen statik (`dist/`). Build komutu `npm run build`, çıktı klasörü `dist`.

- **Vercel:** önbellek başlıkları [`vercel.json`](vercel.json) dosyasından gelir.
- **Cloudflare Pages:** önbellek başlıkları [`public/_headers`](public/_headers) dosyasından gelir.

Hash'li dosyalar bir yıl (`immutable`), oyun dosyaları bir gün (`stale-while-revalidate` ile) önbellekte tutulur.

## ⚡ Performans

- Ziyaretçi sadece açtığı oyunu indirir. Iframe sayfa yüklenirken değil, tıklayınca oluşturulur.
- CSS her sayfaya satır içi verilir (yaklaşık 20 KB), render'ı bloklayan stil dosyası isteği yok.
- Fontlar siteyle birlikte barındırılıp önceden yüklenir. Türkçe harfler (Ğ ğ İ ı Ş ş) 90 KB'lık latin-ext dosyası yerine 11 KB'lık ek bir alt kümeden gelir.
- Kapaklar duyarlı `srcset` ve WebP kullanır. Sadece ilk sıradaki kartlar hemen yüklenir.

Lighthouse (mobil, yerel ölçüm): **Performance 97–99 · Accessibility 100 · Best Practices 100 · SEO 100**.

## 🛣️ Yol haritası

- [x] **v1: sitenin kendisi.** Tasarım sistemi, TR/EN, oyun ve devlog koleksiyonları, oynatıcı, SEO, erişilebilirlik
- [ ] **v1.5: ilk oyunlar.** İlk 2–3 oyun, "Haftanın oyunu" hero'su, Monty SDK (başarımlar tarayıcıda saklanır)
- [ ] **v2: üyelik ve başarımlar.** Giriş (Supabase), herkese açık profiller, nadirlik yüzdeli Steam tarzı başarımlar, rozet vitrini

## 👤 Geliştirici

**Ardahan Aytan** tarafından yapıldı.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-ardahan--aytan-0d1328?style=for-the-badge&logo=linkedin&logoColor=f3ead8)](https://www.linkedin.com/in/ardahan-aytan)
[![GitHub](https://img.shields.io/badge/GitHub-ardahanaytan-0d1328?style=for-the-badge&logo=github&logoColor=f3ead8)](https://github.com/ardahanaytan)

Bir fikrin, önerin ya da bulduğun bir hata mı var? Bir [issue](https://github.com/ardahanaytan/Monty-Arcade/issues) aç. Pit ekibine her zaman yer var.

## 📄 Lisans ve teşekkürler

© 2026 Ardahan Aytan. Tüm hakları saklıdır. Kaynak kod okumak ve öğrenmek için herkese açık; oyunlar, Monty
maskotu ve yazılı içerik geliştiriciye aittir.

- [Archivo](https://fonts.google.com/specimen/Archivo) ve [Space Mono](https://fonts.google.com/specimen/Space+Mono): SIL Open Font License 1.1
- Marka ikonları [Simple Icons](https://simpleicons.org)'tan (CC0)
