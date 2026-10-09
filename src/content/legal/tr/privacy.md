---
title: Gizlilik politikası
description: Monty Arcade hangi verileri, neden ve nerede tutar.
updated: 2026-10-09
---

Monty Arcade, Ardahan Aytan'ın kişisel olarak geliştirdiği bağımsız bir oyun sitesidir. Bu sayfa, siteyi kullanırken
hangi verilerin tutulduğunu sade bir dille anlatır. Mümkün olan en az veriyi topluyoruz.

## Üye olmadan oynarken

- Oyun oynamak için üyelik gerekmez ve sunucuya senin hakkında hiçbir şey kaydedilmez.
- Bu oturumda açtığın başarımlar sadece tarayıcı sekmende (`sessionStorage`) durur. Sekmeyi kapatınca silinir.
- Dil ve ses tercihin ile oyunların kendi kayıtları (ör. en iyi skor) tarayıcında (`localStorage`) tutulur. Bunlar
  cihazından hiç çıkmaz; tarayıcı verilerini silerek temizleyebilirsin.

## Üye olunca

Giriş yaptığında şu bilgiler tutulur:

- **Hesap:** e-posta adresin ve şifren. E-posta adresin hiçbir yerde gösterilmez. Şifren Supabase'te geri
  çözülemeyecek şekilde şifrelenmiş (hash) olarak tutulur; ben dahil kimse göremez.
- **Profil:** seçtiğin kullanıcı adı ve katılma tarihi.
- **Başarımlar:** hangi oyunda hangi başarımı ne zaman açtığın, oynadığın oyunlar ve vitrine koyduğun rozetler.

**Profilin ve başarımların herkese açıktır.** Profil sayfan (`/u/kullanıcıadı`) giriş yapmayan ziyaretçiler dahil
herkes tarafından görülebilir. Başarımların nadirlik yüzdeleri tüm oyuncuların verisinden hesaplanır.

Oturumunun açık kalması için gerekli giriş anahtarı tarayıcında (`localStorage`) saklanır.

## Verilerin nerede?

- **Supabase** (veritabanı ve giriş): veriler Avrupa Birliği'nde, Frankfurt'taki sunucularda tutulur.
- **Vercel** (barındırma): site Vercel üzerinden sunulur; Vercel, hizmeti çalıştırmak için standart erişim kayıtları tutabilir.
- **E-posta servisi:** hesap doğrulama ve şifre sıfırlama mailleri bir e-posta gönderim servisi üzerinden gönderilir;
  bu servis sadece e-posta adresini ve mailin içeriğini görür.

Sitede reklam, analitik ya da takip çerezi yok. Verilerin satılmaz ve kimseyle paylaşılmaz.

## Haklarını kullanmak

- **Hesabını silmek:** profil sayfandaki "Hesabımı sil" butonu hesabını, profilini ve tüm başarımlarını kalıcı
  olarak siler.
- Verilerinle ilgili bir sorun ya da isteğin varsa (KVKK ve GDPR kapsamındaki erişim, düzeltme, silme hakları dahil)
  bana [GitHub](https://github.com/ardahanaytan) ya da [LinkedIn](https://www.linkedin.com/in/ardahan-aytan) üzerinden ulaşabilirsin.

## Çocuklar

Site her yaştan oyuncuya açık, ama profiller herkese açık olduğu için küçük yaştaki oyuncuların üye olurken bir
yetişkinle birlikte karar vermesini öneririz. Kullanıcı adında gerçek adını ya da kişisel bilgilerini kullanma.

## Değişiklikler

Bu politika değişirse güncel hali bu sayfada yayınlanır ve üstteki tarih güncellenir.
