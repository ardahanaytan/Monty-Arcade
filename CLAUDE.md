# Monty Arcade — Claude Code notları

Kendi yaptığım küçük HTML5 oyunlarının yayınlandığı statik Astro sitesi + devlog. TR/EN. Canlı: https://monty-arcade.vercel.app

- **Oyun yapma / ekleme işi için önce [`GAMES.md`](GAMES.md) dosyasını oku.**
- **Üyelik, giriş, profil, başarım ya da Supabase işi için önce [`ACCOUNTS.md`](ACCOUNTS.md) dosyasını oku.**
- Site yapısı, komutlar, içerik şemaları: [`README.tr.md`](README.tr.md).
- İlk planlama ve tasarım spesifikasyonu: `../MONTY_ARCADE.md` (repo dışında; kod yazılmadan önce yazıldı, bazı yerleri eski).

## Şu anki durum (2026-10-12)

- **Canlıda v2.0.0** (2026-10-12): 4 oyun + üyelik, kalıcı başarımlar, sürücü profilleri (`features.accounts = true`).
  Ana sayfada "Yakında — Her cuma yeni oyun" kutusu (`weeklyBox`).
- Supabase, Brevo SMTP ve Vercel ortam değişkenleri kuruldu; kullanıcı kayıt → doğrulama → giriş akışını kendi
  mailiyle denedi, çalışıyor. Ayrıntılar ve panel ayarları: [`ACCOUNTS.md`](ACCOUNTS.md) §5.
- **Sürüm çıkarma kalıbı:** `npm run check` + `npm run build` temiz → `npm version X.Y.Z --no-git-tag-version` → belgelerdeki
  durum notları → commit → `git tag -a vX.Y.Z` → `main` + etiketi push → canlıda kontrol.
- Proje bir öğrenme / hobi projesi: **sadece ücretsiz servisler** (alan adı, ücretli plan önerme; gerekirse ödünleşimi bir kez söyle).

## Kurallar

- Kullanıcıya görünen her metin `src/i18n/ui.ts` sözlüğünden gelir (TR + EN). Bileşenlere sabit metin yazma.
- Renk, yarıçap, gölge: `src/styles/tokens.css` token'ları. Tek vurgu rengi `--accent` (#ff6b2c); yeni "eğlenceli" renk ekleme.
- Kod tanımlayıcıları İngilizce, yorumlar ve commit mesajları Türkçe.
- Her değişiklikten sonra `npm run build` ve `npm run check` hatasız olmalı.
- Uydurma içerik (sahte istatistik, yorum, oyuncu sayısı) ekleme.
- Maskot Monty özgün kalır; telifli karakterlere benzeyen hiçbir şey ekleme.
- Başarımlar **yalnızca üyelerde kalıcı** (Supabase); misafir başarımları sadece sekme oturumunda tutulur. Bu bilinçli bir
  üyelik teşviki: misafir başarımlarını `localStorage`'a kalıcı yazma (`../MONTY_ARCADE.md` §11.2).

## Git

- Remote: https://github.com/ardahanaytan/Monty-Arcade.git, dal `main`.
- Commit serbest. **Push sadece sürüm çıkışında veya oyun eklendiğinde**; push ederken sürüm etiketi de koy (`vX.Y.Z`) ve
  `package.json` sürümünü eşitle. Emin değilsen sor.
- `main`'e her push Vercel'de otomatik yayına çıkar.

## Supabase (v2) — kısa özet (ayrıntı: ACCOUNTS.md)

- Proje ref `ducvcbfbjmthorqglxqt` (Frankfurt, ücretsiz). Claude Code'da Supabase MCP ile erişilir.
- Şema değişikliği: `supabase/migrations/<zaman>_<ad>.sql` yaz → MCP `apply_migration` → `get_advisors`.
  "Automatically expose new tables" kapalı: yeni tabloya `grant` + RLS'yi açıkça yaz. Tablolara istemciden yazma yok, RPC var.
- Giriş sadece e-posta + şifre (OAuth yok); kullanıcı adı kayıtta, sonra değişmez. Şifre kuralı hem `PASSWORD_RULES`
  hem Supabase panelinde. Mailler Brevo SMTP ile.
- Oyun eklenince / başarım listesi değişince: `npm run sync:achievements` çıktısını veritabanında çalıştır.
- Canlı veritabanında test verisi bırakma; SQL testlerinden sonra sahte kullanıcıyı sil.
- `.env` (git'te yok): iki `PUBLIC_SUPABASE_*` değeri + `SUPABASE_DB_PASSWORD` (gizli; okuma). `PUBLIC_` değerleri
  Vercel'de de tanımlı.

## Komutlar

`npm run dev` (2705, taslaklar görünür) · `npm run build` · `npm run preview` (2607) · `npm run check` · `npm run og` ·
`npm run sync:achievements`

Geliştirmede profil adresi `/tr/u/?u=<ad>` (Vercel'deki `/tr/u/<ad>` yeniden yazma kuralı dev sunucusunda çalışmaz).
