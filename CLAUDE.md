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
- v2 alanları (`features.accounts`) kapalı kalır; üyelik/başarım altyapısı istenmeden kodlanmaz.

## Git

- Remote: https://github.com/ardahanaytan/Monty-Arcade.git, dal `main`.
- Commit serbest. **Push sadece sürüm çıkışında veya oyun eklendiğinde**; push ederken sürüm etiketi de koy (`vX.Y.Z`) ve
  `package.json` sürümünü eşitle. Emin değilsen sor.
- `main`'e her push Vercel'de otomatik yayına çıkar.

## Komutlar

`npm run dev` (2705, taslaklar görünür) · `npm run build` · `npm run preview` (2607) · `npm run check` · `npm run og`
