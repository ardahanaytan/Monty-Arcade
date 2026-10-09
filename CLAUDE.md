# Monty Arcade — Claude Code notları

Kendi yaptığım küçük HTML5 oyunlarının yayınlandığı statik Astro sitesi + devlog. TR/EN. Canlı: https://monty-arcade.vercel.app

- **Oyun yapma / ekleme işi için önce [`GAMES.md`](GAMES.md) dosyasını oku.**
- Site yapısı, komutlar, içerik şemaları: [`README.tr.md`](README.tr.md).
- İlk planlama ve tasarım spesifikasyonu: `../MONTY_ARCADE.md` (repo dışında; kod yazılmadan önce yazıldı, bazı yerleri eski).

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

## Supabase (v2)

- Proje: `Monty-Arcade` (ref `ducvcbfbjmthorqglxqt`, Frankfurt), org "Monty Arcade". Claude Code'da Supabase MCP ile erişilir.
- Şema değişikliği: önce `supabase/migrations/<zaman>_<ad>.sql` dosyasını yaz, sonra aynı SQL'i MCP `apply_migration` ile uygula,
  ardından `get_advisors` (security + performance) çalıştır.
- Tablolara istemciden doğrudan yazma yok; yazma RPC'lerle (`unlock_achievement`, `merge_guest_achievements`, `delete_my_account`).
  "Automatically expose new tables" kapalı: yeni tabloya `grant` ve RLS kuralını açıkça yaz.
- Oyun eklenince / başarım listesi değişince: `npm run sync:achievements` çıktısını veritabanında çalıştır.
- Giriş: sadece e-posta + şifre (OAuth yok). Kayıtta kullanıcı adı `signUp` metadata'sıyla gelir; profil tetikleyicisi
  (`private.handle_new_user`) geçersiz/alınmış adda kaydı reddeder. Şifre kuralı (8+, büyük/küçük harf, rakam, özel karakter)
  hem `PASSWORD_RULES` (`src/lib/client/account.ts`) hem Supabase paneli "Password requirements" ayarında olmalı.
  Doğrulama ve şifre sıfırlama mailleri özel SMTP ile gider.
- `.env` (git'te yok): `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (herkese açık değerler) ve
  `SUPABASE_DB_PASSWORD` (gizli; site kullanmaz, okuma). Aynı iki `PUBLIC_` değeri Vercel ortam değişkenlerinde de olmalı.

## Komutlar

`npm run dev` (2705, taslaklar görünür) · `npm run build` · `npm run preview` (2607) · `npm run check` · `npm run og` ·
`npm run sync:achievements`

Geliştirmede profil adresi `/tr/u/?u=<ad>` (Vercel'deki `/tr/u/<ad>` yeniden yazma kuralı dev sunucusunda çalışmaz).
