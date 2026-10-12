# Monty Arcade — Üyelik, profil ve başarımlar (v2)

Bu dosya v2'nin **nasıl çalıştığını** ve **nasıl kurulduğunu** anlatır. Üyelik, başarım, profil, Supabase ya da giriş
ekranıyla ilgili bir işe başlamadan önce oku. Genel kurallar [`CLAUDE.md`](CLAUDE.md), oyun ekleme [`GAMES.md`](GAMES.md).

---

## 1. Temel karar: başarımlar yalnızca üyelerde kalıcı

- Oyun oynamak için üyelik **gerekmez**.
- Misafir de başarım açar ve bildirimini (toast) görür, ama başarım **sadece o tarayıcı sekmesinin oturumunda**
  (`sessionStorage`) tutulur. Sekme kapanınca gider. Bildirimde "Kaydedilmedi. Üye ol, kaybolmasın!" yazar, header'da
  "N kaydedilmemiş başarım" rozeti çıkar.
- Misafir **aynı sekmede** üye olur / giriş yaparsa o sekmedeki başarımlar hesabına aktarılır.
- Bu **bilinçli bir üyelik teşviki** (eski flash portallarındaki "üye olmadığın için ilerlemen gitti" hissi). Misafir
  başarımlarını `localStorage`'a kalıcı yazmak bu kararı bozar; yapma.

## 2. Mimari

Site hâlâ **tamamen statik** (Astro → `dist/`, Vercel). Üyelik tarayıcıda çalışır: `@supabase/supabase-js` istemcisi
doğrudan Supabase'e (Auth + Postgres REST) bağlanır. Sunucu kodu / API route'u yok.

| Dosya | Görevi |
|---|---|
| `src/lib/client/supabase.ts` | Tek Supabase istemcisi. `PUBLIC_SUPABASE_*` yoksa `null` → site misafir modunda çalışır, giriş arayüzü gizlenir. |
| `src/lib/client/account.ts` | Oturum + profil durumu (`onAccount`, `getAccount`, `whenAccountReady`), `signUp`, `signIn`, `requestPasswordReset`, `updatePassword`, `isUsernameAvailable`, `saveShowcase`, `deleteAccount`, `signOut`, `profileUrl`, `PASSWORD_RULES`, hata kodu eşlemesi (`AuthErrorCode`). |
| `src/lib/client/achievements.ts` | Başarım deposu: `unlock(gameId, id)` → `'saved' \| 'guest' \| 'duplicate'`, `unlockedIds(gameId)`, `unsavedCount()`, `onAchievementsChange`. Girişte misafir kayıtlarını `merge_guest_achievements` ile aktarır, sonra üyenin açtıklarını yükler. |
| `src/lib/client/toast.ts` + `src/components/AchievementToast.astro` | Sağ alttaki başarım bildirimi. Tam ekrandaki oyunun üstünde de görünür (kapsayıcı `fullscreenElement` içine taşınır). |
| `src/components/LoginDialog.astro` | Giriş / Üye ol sekmeleri, şifremi unuttum, sıfırlama bağlantısıyla yeni şifre, "mailini kontrol et". `[data-login-open]` öğeleri açar; `data-login-open="signup"` doğrudan kayıt sekmesini açar. |
| `src/components/Header.astro` | Giriş butonu, profil linki (kullanıcı adı), "N kaydedilmemiş başarım" rozeti. Supabase istemcisi burada dinamik içe aktarılır. |
| `src/components/Player.astro` | Oyundan gelen `unlock` mesajını doğrular (origin, iframe kaynağı, bilgi dosyasındaki liste) → `unlock()` → toast. |
| `src/components/AchievementsPanel.astro` | Oyun sayfasındaki panel: açılanlar, gizli başarımların açılınca görünmesi, sayaç, nadirlik yüzdesi (`achievement_rarity`). |
| `src/pages/[lang]/u/index.astro` | Sürücü profili (statik kabuk + istemcide veri). |
| `src/pages/[lang]/[legal].astro` + `src/content/legal/{tr,en}/{privacy,terms}.md` | Gizlilik politikası ve kullanım koşulları. |
| `src/config/site.ts` | `features.accounts: true` (v2 açık), `achievementsTeaser: false`. |
| `vercel.json` | `rewrites`: `/:lang(tr\|en)/u/:name` → `/:lang/u/` (profil adresleri). |
| `supabase/migrations/*.sql` | Veritabanının tek doğru kaynağı (sıralı). |
| `scripts/sync-achievements.mjs` | Oyun bilgi dosyalarından `achievements` tablosu için SQL üretir (`npm run sync:achievements`). |

Metinler `src/i18n/ui.ts` içinde: `ach.*`, `login.*`, `login.err.*`, `login.rule.*`, `profile.*`, `footer.privacy/terms`, `legal.updated`.

## 3. Veritabanı (Supabase)

Proje **Monty-Arcade**, ref `ducvcbfbjmthorqglxqt`, bölge Frankfurt (eu-central-1), org "Monty Arcade", ücretsiz plan.
Claude Code'da **Supabase MCP** ile erişilir (`list_tables`, `apply_migration`, `execute_sql`, `get_advisors`).

### Tablolar (`public`)
| Tablo | İçerik | Okuma | Yazma |
|---|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `username` (tekil, `^[a-z0-9_]{3,20}$`), `display_name`, `avatar_url` (şimdilik hep null), `showcase text[]` (≤6, `'gameId:achId'`), `created_at` | herkes | sahibi sadece `display_name`, `showcase` sütunlarını günceller |
| `achievements` | `game_id`, `id`, `tier`, `hidden` — içerikten senkronize | herkes | sadece SQL (MCP / panel) |
| `game_players` | kullanıcı–oyun, nadirlik paydası | herkes | sadece RPC |
| `user_achievements` | `user_id`, `game_id`, `achievement_id`, `unlocked_at` | herkes (profiller herkese açık) | sadece RPC |
| `achievement_rarity` (view, `security_invoker`) | `game_id`, `achievement_id`, `ratio` = açan / o oyunu oynayan | herkes | — |

E-postalar ve şifre hash'leri Supabase'in kendi **`auth.users`** tablosunda. Panelde **Authentication → Users**
sayfasında görünür. Kullanıcı adı + e-posta birlikte görmek için SQL Editor:
`select p.username, u.email, u.email_confirmed_at, p.created_at from public.profiles p join auth.users u on u.id = p.id;`
⚠ E-posta içeren bir view **asla `public` şemasına** konmaz (API'den herkese açılır); gerekirse `private` şemasına.

### Fonksiyonlar
| Ad | Kim çağırır | Ne yapar |
|---|---|---|
| `unlock_achievement(p_game_id, p_achievement_id)` → bool | üye | Başarım var mı, zaten açık mı (false döner), hız sınırı (kullanıcı başına dakikada ≤10), `game_players` kaydı, ekleme. |
| `merge_guest_achievements(items jsonb)` → int | üye | `[{gameId,id,unlockedAt}]` (≤100); bilinmeyenleri atlar, tarihi son 24 saat–şimdi arasına kırpar, en erken tarihi tutar. |
| `delete_my_account()` | üye | `auth.users` satırını siler; profil ve başarımlar cascade ile gider. |
| `username_available(p_name)` → bool | herkes | Kayıt formundaki anlık kontrol (`security invoker`). |
| `private.handle_new_user()` (tetikleyici, `auth.users` insert) | — | `raw_user_meta_data.username`'ı küçük harfe çevirip profili oluşturur; geçersizse `invalid_username`, alınmışsa `username_taken` hatasıyla **kaydı reddeder**. |
| `private.check_profile_update()` (tetikleyici) | — | Kullanıcı adı kilidi; vitrin sadece kullanıcının açtığı, tekrarsız başarımlardan oluşabilir. |
| `public.rls_auto_enable()` | — | Supabase'in "automatic RLS" ayarının fonksiyonu; API'den çağrılması kapatıldı. |

### Kurallar
- **"Automatically expose new tables" kapalı, "automatic RLS" açık.** Yeni tabloya RLS politikası ve `grant`'ları açıkça yaz.
- Şema değişikliği: önce `supabase/migrations/<YYYYMMDDHHMMSS>_<ad>.sql` dosyasını yaz → aynı SQL'i MCP `apply_migration`
  ile uygula → `get_advisors` (security + performance). Kalan bilinçli uyarılar: 3 RPC'nin `authenticated`'a açık olması.
- Yeni oyun / değişen başarım listesi: `npm run sync:achievements` çıktısını `execute_sql` ile çalıştır. Komut silmez
  (silmek oyuncuların rozetlerini de siler).

### SQL ile test kalıbı
Gerçek kullanıcı açmadan RLS/RPC denemek için: sahte UUID ile `auth.users`'a `insert` (metadata'da `username`),
`set local role authenticated;` + `select set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', true);`
ile o kullanıcı gibi çağır, sonuçları geçici tabloya yaz, en sonda `delete from auth.users where id = '<uuid>'`.
Test verisini **mutlaka sil** (canlı veritabanı).

## 4. Akışlar

- **Misafir başarımı:** oyun `postMessage({source:'monty-sdk', type:'unlock', gameId, achievementId})` → Player doğrular →
  `unlock()` oturum yoksa `sessionStorage['monty:ach:guest']`'e yazar → toast (misafir metni + "Üye ol") → header rozeti.
- **Üye başarımı:** `unlock()` → `unlock_achievement` RPC → toast "Profiline kaydedildi". RPC hata verirse (ağ / hız sınırı)
  kayıt oturumda tutulur, sonraki girişte aktarılır.
- **Kayıt:** kullanıcı adı (yazarken küçük harf + 400 ms sonra `username_available`) + e-posta + şifre (canlı kural
  listesi) → `auth.signUp` (metadata `username`, `emailRedirectTo` = aynı sayfa). Doğrulama açık olduğundan "mailini
  kontrol et" adımı gösterilir. Kayıtlı e-postada Supabase hata vermez, kimliksiz kullanıcı döner → "bu e-posta kayıtlı".
- **Doğrulama:** bağlantı genelde yeni sekmede açılır; Supabase oturumu `localStorage` olayıyla orijinal sekmeye de
  ulaşır, orijinal sekme misafir başarımlarını aktarır ve pencereyi kapatır.
- **Şifremi unuttum:** `resetPasswordForEmail` → bağlantı → `PASSWORD_RECOVERY` olayı → "Yeni şifre" adımı → `updateUser`.
- **Profil:** `/tr/u/<ad>` (geliştirmede `/tr/u/?u=<ad>`). Ad yoksa ve giriş yapılmışsa kendi profiline yönlendirir.
  Sürücü lisansı (istatistikler), vitrin (sahibi düzenler, ≤6), oyun bazında ilerleme, son açılanlar; sahibine çıkış ve
  "Hesabımı sil". Sayfa `noindex`, sitemap dışında.

## 5. Panel ayarları (yapıldı — değiştirirsen burayı güncelle)

**Supabase**
- Data API açık · "Automatically expose new tables" kapalı · "Enable automatic RLS" açık.
- Authentication → Sign In / Providers → **Email** açık, **Confirm email** açık. OAuth sağlayıcısı yok (bilinçli karar).
- **Password requirements:** en az 8, "Lowercase, uppercase letters, digits and symbols". Kod tarafındaki
  `PASSWORD_RULES` ile aynı olmalı.
- **URL Configuration:** Site URL `https://monty-arcade.vercel.app`; Redirect URLs `https://monty-arcade.vercel.app/**`,
  `http://localhost:2705/**`, `http://localhost:2607/**`.
- **SMTP:** Brevo ücretsiz plan (`smtp-relay.brevo.com:587`, günde 300 mail), gönderici kullanıcının kendi doğrulanmış
  e-posta adresi, ad "Monty Arcade". Alan adı yok (proje ücretsiz kalacak), bu yüzden mailler spam'e düşebilir.
- E-posta şablonları Supabase'in varsayılan (İngilizce) metinleri; TR+EN şablon yazılabilir (yapılmadı).

**Vercel** (proje `monty-arcade`): Environment Variables → `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(tip **Config**, ortam Production + Preview). Bu Claude hesabındaki Vercel MCP projeyi göremiyor; Vercel işleri panelden.

**Yerel** `.env` (git'te yok; şablon `.env.example`): iki `PUBLIC_` değeri + `SUPABASE_DB_PASSWORD` (gizli, site
kullanmaz; okuma ve hiçbir yere kopyalama).

## 6. Geliştirme notları

- `npm run dev` → `http://localhost:2705`. Bağımlılık ekledikten sonra tarayıcıda "504 Outdated Optimize Dep" görürsen
  dev sunucusunu durdur, `node_modules/.vite` klasörünü sil, yeniden başlat.
- Supabase paketi gzip'li ~55 KB; Header'da dinamik içe aktarılıyor, sayfa açılışını bloklamıyor.
- Ücretsiz Supabase projesi **1 hafta hiç istek almazsa uykuya geçer**; panelden "Restore" gerekir.

## 7. Bilinen sınırlar / sonraki adaylar

- Başarımlar tarayıcıda açıldığı için hileyle açılabilir; sunucu sadece bariz hileyi (hız sınırı, bilinmeyen id) eler.
  Rozetler sadece prestij için olduğu sürece kabul edildi. `merge_guest_achievements` hız sınırına tabi değil (≤100 kayıt).
- Misafir oturumu **sekme başına**: başka sekmede açılan oyunun başarımları ayrı tutulur.
- Avatar yükleme yok (`avatar_url` hep null, profil ikonu gösteriliyor). E-posta / şifre değiştirme ekranı yok
  (şifre sadece "şifremi unuttum" ile). Kullanıcı adı değiştirilemez.
- Oyun kartlarındaki rozet sayısı oyunun toplam başarımı; kişiselleştirilmedi.
- Moderasyon aracı yok (uygunsuz kullanıcı adı → panelden / SQL ile silme).
- E-posta şablonları İngilizce.
