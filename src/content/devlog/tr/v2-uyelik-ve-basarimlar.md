---
title: "v2: Sürücü lisansın hazır"
description: "Üyelik, kalıcı başarımlar ve sürücü profilleri geldi. v2'de neler eklendi, neler değişti?"
date: 2026-10-12T18:00:00
---

Hoş geldin yazısında "ileride bir de üyelik ve profil sistemi gelecek" demiştim. O gün geldi: Monty Arcade'in ikinci büyük sürümü yayında. Kısaca: artık üye olabiliyorsun, açtığın başarımlar hesabına kaydediliyor ve herkesin kendi **sürücü profili** var.

Ama önce en önemlisi: **oyun oynamak için hâlâ üye olman gerekmiyor.** Site eskisi gibi açık; tıkla ve oyna.

## Üyelik

Sağ üstte artık bir **Giriş yap** butonu var. Üye olmak için üç şey yeterli:

- **Kullanıcı adı:** profil adresin bu olacak. Yazarken müsait olup olmadığını anında görüyorsun. Bir kez seçince değişmiyor, o yüzden iyi düşün.
- **E-posta:** sadece giriş ve şifre sıfırlama için. Profilinde hiçbir yerde görünmüyor.
- **Şifre:** en az 8 karakter; büyük harf, küçük harf, rakam ve sembol içermesi gerekiyor. Yazarken hangi kuralı karşıladığını listede görüyorsun.

Kayıttan sonra e-postana bir doğrulama bağlantısı geliyor; ona tıklayınca hesabın açılıyor. Şifreni unutursan **Şifremi unuttum** ile sıfırlayabiliyorsun.

> Mailler ücretsiz bir servisten gidiyor ve sitenin kendi alan adı yok. Bu yüzden doğrulama maili **spam klasörüne** düşebilir. Gelmediyse oraya bir bak.

Şimdilik giriş sadece e-posta ve şifreyle; Google ya da GitHub ile giriş yok.

## Başarımlar artık senin

İlk dört oyunun içinde baştan beri başarımlar vardı ama bir yere kaydedilmiyorlardı. Artık bir başarım açtığında sağ altta bir bildirim çıkıyor ve:

- **Üyeysen:** başarım "Profiline kaydedildi" notuyla hesabına yazılıyor. Hangi cihazdan girersen gir, orada.
- **Misafirsen:** başarım yine açılıyor ve bildirimini görüyorsun, ama sadece o sekme açık kaldığı sürece duruyor. Sekmeyi kapatınca gidiyor. Sağ üstte kaç başarımın kaydedilmediğini gösteren küçük bir rozet çıkıyor.

Bu ikincisi bilinçli bir karar. Eski flash sitelerinde "üye değilsen ilerlemen kaydedilmez" diye bir his vardı; biraz da ondan ilham aldım. Ama misafiri cezalandırmak istemedim: **aynı sekmede üye olursan ya da giriş yaparsan, o ana kadar açtığın başarımlar hesabına aktarılıyor.** Yani önce oynayıp sonra üye olmaya karar verebilirsin, hiçbir şey kaybetmeden.

Oyun sayfasındaki **Başarımlar** paneli de canlandı:

- Hangi başarımları açtığını ve kaç tane kaldığını görüyorsun.
- Her başarımın yanında, o oyunu oynayan üyelerin yüzde kaçının onu açtığı yazıyor. Hangisinin gerçekten zor olduğunu böyle anlayabilirsin.
- Gizli başarımlar açılana kadar "???" olarak duruyor. Açınca ne olduğu ortaya çıkıyor.

## Sürücü profili

Her üyenin herkese açık bir profili var: `/tr/u/kullanıcıadın`. Profil bir **sürücü lisansı** gibi tasarlandı:

- **Lisans:** katılma tarihin, toplam rozet sayın, nadir rozet sayın ve oynadığın oyun sayısı.
- **Vitrin:** en sevdiğin en fazla 6 rozeti seçip profilinin en üstüne koyabiliyorsun.
- **İlerleme:** her oyunda kaç başarımdan kaçını açtığın.
- **Son açılanlar:** en son kazandığın rozetler.

Profilini istediğin kişiyle paylaşabilirsin. Kendi profilinden çıkış yapabilir ya da hesabını silebilirsin.

## Verilerin

Üyelikle birlikte sitenin tuttuğu veriler de değişti, bu yüzden bir **Gizlilik politikası** ve **Kullanım koşulları** sayfası ekledim. İkisine de sayfanın en altından ulaşabilirsin. Kısaca:

- Sadece gerekenleri tutuyorum: kullanıcı adın, e-postan ve açtığın başarımlar.
- E-postan kimseye gösterilmiyor; profilinde sadece kullanıcı adın ve rozetlerin görünüyor.
- **Hesabımı sil** butonuna basınca hesabın, profilin ve bütün başarımların kalıcı olarak siliniyor.

## Neler değişti?

- Sağ üstte **Giriş yap** butonu var; giriş yapınca yerinde kullanıcı adın duruyor ve profiline gidiyor.
- Ana sayfadaki "Yakında" kutusu artık profil ve rozetleri değil (onlar geldi), bir sonraki oyunu müjdeliyor: **her cuma yeni bir oyun** çıkıyor ve kutu sıradaki cumanın tarihini gösteriyor.
- Oyun kartlarında her oyunun kaç başarımı olduğu görünüyor.
- Site hâlâ hızlı. Üyelik kısmı sayfa açılışını bekletmiyor; arka planda yükleniyor.

## Bilinen eksikler

v2 bir başlangıç; bazı şeyler henüz yok:

- Profil fotoğrafı yükleyemiyorsun.
- E-postanı ya da kullanıcı adını değiştiremiyorsun. Şifreni sadece "Şifremi unuttum" ile değiştirebiliyorsun.
- Doğrulama ve şifre sıfırlama mailleri şimdilik İngilizce.
- Başarımlar tarayıcıda açıldığı için teorik olarak hileyle açılabilir. Bariz hileleri engelledim; ama bunlar sadece prestij rozetleri, ödüllü bir yarış yok. Lütfen adil oyna. 🙂

## Kısaca teknik taraf

Site hâlâ tamamen statik; yani sunucu tarafında çalışan bir kod yok. Üyelik ve başarımlar için ücretsiz bir veritabanı ve kimlik doğrulama servisi kullanıyorum ve tarayıcı doğrudan ona bağlanıyor. Her kullanıcı sadece kendi verisini değiştirebiliyor; başarımlar da doğrudan yazılamıyor, kontrollerden geçen özel fonksiyonlarla kaydediliyor. Bunu kurmak bu projede en çok şey öğrendiğim kısım oldu.

## Sırada ne var?

Artık altyapı tamam: oyunlar, başarımlar, profiller. Bundan sonrası daha çok oyun demek. Her yeni oyun kendi başarımlarıyla gelecek ve profilindeki vitrin büyümeye devam edecek.

Lisansını al, pite gel. İlk rozetin seni bekliyor. 🏁
