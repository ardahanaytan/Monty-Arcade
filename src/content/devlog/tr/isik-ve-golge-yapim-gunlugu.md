---
title: "Işık ve Gölge"
description: "İki kişilik, tek klavyeli, 20 bölümlük Işık ve Gölge'nin hikâyesi: fikir nereden çıktı, neleri değiştirdik, nasıl test ettik, nerede hata yaptık?"
date: 2026-10-16T12:00:00
game: isik-ve-golge
---

Işık ve Gölge'yi yaparken en çok şunu öğrendim: **iyi bir bulmaca oyunu yazmak, kodu yazmaktan çok "bu bölüm gerçekten çözülebiliyor mu?" sorusunu cevaplamakmış.** Bu yazıda fikrin nereden çıktığını, oyunun kurallarını, benim ne istediğimi, ne zaman fikir değiştirdiğimi, hataları ve oyunu nasıl test ettiğimizi anlatıyorum. Oyunu Claude ile birlikte, bölüm bölüm yaptım; yazıdaki "biz" bu ikili.

## Fikir: iki karakter, birbirini yok eden iki doğa

İlk fikrim bambaşkaydı: **Tutulma**. Güneş ve Ay adlı iki karakter, tek klavyede iki kişi, 10 bölüm. Planı yazdık, bir ara kod bile yazılmaya başlandı. Sonra vazgeçtim ve her şeyi sildim; siteyi o oyunun öncesindeki sürüme geri aldım. Sebebi basitti: fikrin ana oyun mekaniği yoktu. "İki karakter yan yana durunca bir şey açılıyor" yeterince ilginç değildi.

Yerine kendim bir tasarım belgesi yazdım. Merkezinde tek bir cümle vardı:

> Işık gölgeyi yok eder. Birbirine çekilen iki karakter, doğaları gereği dokunamıyor.

Bu cümle bütün kuralları getirdi:

- **Işık** karanlık suya düşünce söner. **Gölge** ışık huzmesine girince yok olur.
- Gölge suda yüzebilir; Işık huzmeden etkilenmez.
- Işık "ışık perdesinden" geçer, Gölge "karanlık perdeden". Yani biri öbürünün yolunu açmadan kimse çıkışa varamaz.
- İkisi birbirine fazla yaklaşırsa **kıvılcım** çıkar ve birbirlerini geri savururlar. Doğru zamanda koşarak çarpışırlarsa bu bir silaha, hatta bir fırlatma aracına dönüşür: biri öbürünü, tek başına geçemeyeceği bir boşluğun ötesine fırlatabilir.
- Hikâye: **Sis Kralı**, ışığın da gölgenin de olmadığı gri bir dünya istiyor; iki sevgilinin çekimini "kontrast" sayıp ikisini zindana atıyor.

Oyun içinde tek kelime diyalog yok. Hikâye yalnızca başta ve sonda, sözsüz sahnelerle anlatılıyor.

## Hareket hissi: "zıplarken ivmeye bu kadar bağlı olmasın"

İlk oynanabilir sürümde yerdeki ivmelenme gayet iyiydi ama havada çok yavaş kontrol edebiliyordunuz; zıpladıktan sonra karakter neredeyse ağırlığıyla savruluyordu. Bunu söyleyince hava kontrolünü belirgin biçimde artırdık, ama momentumu koruduk: hâlâ koşarken zıplayınca uzağa gidiyorsun, ama istersen havada yön düzeltebiliyorsun. Bu dengeyi bulmak, bölüm tasarlamaktan önemli çıktı, çünkü "5 karoluk boşluk" tasarlamak için karakterin tam olarak ne kadar zıplayabildiğini bilmek zorundasın. Bu sayılar (zıplama ≈ 3,3 karo, en uzun tek başına atlayış 5 karo) sonraki 20 bölümün cetveli oldu.

## "Hepsini ilk bölümlerde öğretelim"

Başta bölümleri her biri bir yeni fikir getirecek şekilde yavaş ilerletmeyi planlıyordum. Sonra şunu fark ettim: 20 bölümlük bir oyunda her şeyi tek tek tanıtırsan, ilk yarı fazla yavaş olur. O yüzden planı değiştirdik:

- **Bölüm 1:** hareket, perdeler, karanlık su, ışık huzmesi (eski 1. ve 2. bölümü birleştirdik).
- **Bölüm 2:** kaldıraç, taş kapı, basınç plakası.
- **Bölüm 3:** itilebilir kutu ve kıvılcım fırlatması.
- **Bölüm 4:** kandil (Işık yakar, Gölge söndürür) ve kutunun gölgesi.
- **Bölüm 5:** zindan bölgesinin sınavı.

Sonraki her bölüm bir ya da iki **yeni** şey getirip eskileri **birleştiriyor**: asansör, sis havuzu (ikisi için de ölümcül), zamanlı düğme, ayna, kutu gölgesi, kaldıraçla dönen ayna, ışık kristali, terazi, itilebilir ayna... Son beş bölüm (Özgürlük) neredeyse yalnızca birleşim.

## 20 bölüm, 4 bölge

| Bölge | Bölümler | Ağırlık |
|---|---|---|
| Zindan | 1–5 | temel kurallar, kutu, kandil |
| Avlu | 6–10 | asansör, sis, zamanlı düğme, ayna |
| Sur | 11–15 | dönen ayna, kristal, terazi, itilebilir ayna |
| Özgürlük | 16–20 | birleşimler, uzun fırlatma, son sınav, buluşma |

Son bölümde (Buluşma) iki karakter uzun bir salonun iki ucundan başlıyor. Her biri kendi tarafının engellerini aşıp bir kaldıraç çevirerek **öbürünün kapısını** açıyor, sonra ikisi de ortadaki odaya varıyor. Orada Işık'ın ve Gölge'nin kapıları **yan yana** duruyor: ortak bir odada, ama her birinin kendi kapısı. Oyunun adı olan zorluğun, yani birbirine ulaşma çabasının sonu.

## Zorluk: "bölümler çok kolay"

Bu kısım yazının en önemli dersi. İlk bölümlerde her şey fazla kolaydı ve bunu açıkça söyledim. Özellikle şunları istedim:

- Düz bir platform oyunu değil, **bulmaca/platform** olsun.
- **Ölüm yerleri bol olsun, biraz kafa karıştırıcı olsun.**
- Bölümler hep en altta başlayıp "z" çizerek yukarı çıkmasın; **labirent gibi**, çok katlı olsun.
- Üç ayrı yönde zorlasın: **bulmaca derinliği**, **beceri ve hassasiyet**, **ölüm ve ceza**.

Sonuçta ne yaptık?

- Zamanlı ışık huzmeleri (açılıp kapanıyor, açılmadan hemen önce titriyor) ve "huzme geçidi" denen, ancak doğru pencerede geçilen bölümler.
- Daha geniş su ve sis boşlukları, alçak tavanlı geçitler.
- **VE kapıları**: bir kapının açılması için iki plakanın birden basılı olması, ya da bir plaka ile kaldıracın birlikte kullanılması. Kutu plakayı tutarken karakter kapıya yetişemiyor, bu da iş birliğini zorunlu kılıyor.
- Her yeni bölümde **farklı bir düzen**: ben 3. ve 4. bölümün aynı kalıpta olduğunu söyleyince, bir "düzen havuzu" çıkardık (merkez ve dört oda, dikey kule, halka, ayna simetrik, artı biçimli, iki katlı salon, basamaklar, ikiz kule, U biçimi...) ve art arda aynı kalıbı kullanmamayı kural yaptık.

Bir bölümü beğenmediğimde de somut söyledim: "Bu bölümde kutuya gerek yok, kutuyu plakaya koymadan da geçiyoruz; değiştir." Kutuyu zorunlu yapmak için plakayı kapıdan uzağa taşıdık: plakayı basılı tutan karakter kapıya yetişemiyor, kutu şart oluyor.

## Nasıl test ettik: "çözülebiliyor mu" sorusu

Bir bulmaca oyununda en kötü hata, **çözülemeyen bölüm**. Bunu insan gözüyle yakalamak zor, o yüzden test araçları yazdık:

1. **Birim testleri:** fizik ve kurallar (zıplama yüksekliği, su ve sis, ışık huzmesi, kapılar, kaldıraç yönü, ayna, kristal, terazi...). Hepsi saniyeler içinde bitiyor.
2. **Çözücü (BFS):** oyunu gerçek fizikle ve gerçek tuş girdileriyle sınıyor; bir karakter için "bu bölümde kapısına ulaşabilir mi?" diye arıyor. Aramaya kutu, kaldıraç, kandil, asansör ve diğer karakterin konumu da dahil.
3. **Senaryolu yürüyüş:** iki karakterli bölümlerde kimin ne zaman ne yapacağını adım adım yazıyoruz (mesela "Işık kaldıracı çeker, Gölge kapıdan geçer, Işık kutuyu iter"). Her adımda arama, oyunun o anki durumundan başlıyor ve bitince **iki karakterin de gerçekten kapısında durması** gerekiyor.
4. **Olumsuz kanıtlar:** "bu karakter tek başına bitiremez" de bir test. Yoksa iş birliği gereken bölüm, aslında tek kişiyle geçilebilir olabilir.
5. **Fırlatma parametre taraması:** kıvılcım fırlatması zamanlama işi. Işık ve Gölge'nin tam konumunu ve zıplama anlarını tarayan bir araç, hangi değerlerin işe yaradığını buluyor ve **ne kadar toleranslı** olduğunu ölçüyor. Bölüm 5'te başarı oranı bilerek düşük tutuldu (yaklaşık yüzde 1,5): kasıtlı olarak sert.

Bir ders: üçüncü bölümün tam testi bir ara **70 dakika** sürdü ve ben beklemiştim. O günden sonra ağır testleri arka planda çalıştırıyoruz ve sonucu kısa bildiriyoruz.

## Test ederken yakaladığımız (ve benim oynarken yakaladığım) hatalar

- **Duvarla doldurulmuş kapı:** bir bölmenin kapı hücrelerini yanlışlıkla duvarla doldurmuşuz; kapı açılsa bile geçit kapalıydı. Yürüyüş testi anında yakaladı.
- **Kaldıraç yönü:** kaldıraç, içinden geçen karakterin yönüne yatıyor, **kim geçerse**. Gölge'nin dönüş yolu kaldıracın üzerinden geçince kolu geri çekiyor ve kapı kapanıyordu. Çözüm: kaldıracı karakterin yolunun dışına koymak ya da dönüşte üstünden zıplamayı bulmacanın parçası yapmak.
- **Alçak asılı blok:** ayna bloğunu koridorun tavanından o kadar alçak astık ki karakter altından geçemiyordu. Karakter 34 piksel, karo 32 piksel; 1 karo yüksekliğinde geçit yapılamaz.
- **Kıvılcım kazası:** Işık doğuya yürürken Gölge'ye çarpıp onu ışık çizgisine savuruyordu. Başlangıç konumları ayrıldı.
- **Atlanabilen kapı (benim bulduğum):** 12. bölümde doğudaki kapı yalnızca alt beş satırı kapatıyordu ve kaldıraç rafı kapının tepesiyle aynı yükseklikteydi; kapıyı açmadan üstünden yürünebiliyordu. Kapıyı tavana uzattık ve **bütün bölümlerdeki kapıları tarayıp** aynı açığı 13. ve 20. bölümde de buldum.
- **Duvara sıkışma (yine benim bulduğum):** 19. bölümde asansörle inince karakterler sağ alttaki duvarın içine ışınlanıyordu. Sebep ince bir ayrıntıydı: platformla aynı hizada duran karakter yürürken, motor onu "yandan çarptı" sayıp platformun öbür ucuna taşıyordu. O uç da duvardı. Rastgele tuşlara basan bir test yazıp bulduk.

Bu iki hatadan sonra şunu öğrendim: **otomatik testler "çözülebilir" olduğunu söyler, "hileli geçilemez" olduğunu söylemez.** Oynayan insan her zaman yeni bir yol bulur.

## Performans

15. bölümlere doğru oyunun yavaşladığını fark ettim. İlk şüphem, eski bölümlerin arkada açık kalmasıydı. Baktık: her bölüm yeni bir dünya kuruyor ve eskisi çöpe gidiyor; bellek yirmi bölüm boyunca sabit kaldı. Asıl yük her karede bütün sahnenin baştan çizilmesiydi. Yaptıklarımız:

- Duvar karolarını bölüm başına bir kez ekran dışı bir tuvale çizip her karede tek resim olarak basmak.
- Çok büyük ekranlarda çizim çözünürlüğünü sınırlamak.
- `?fps=1` ile ekranın köşesinde kare hızını gösteren bir teşhis katmanı.

Sonuç: iyileşti, artık yavaşlama yok.

## Başlangıç ve final sahneleri

Oyunun başında **Sis Kralı** iki sevgilinin birbirine dokunmaya çalıştığını görüyor; kıvılcım ikisini geri savuruyor, sis çöküyor, kral asasını kaldırıyor ve ikisi yerden açılan bir kuyuya düşüp demir parmaklıklı zindan hücresine kapanıyor. Ekran kararıyor ve 1. bölüm başlıyor.

Finalde ise **tam tutulma**: ay güneşin önünden geçer, gökyüzü kararır ve ufukta turuncu halka yanar. Işığın gölgeyi yok etmediği tek an bu alacakaranlıktır. Işık ve Gölge sur üzerinde birbirine yürür ve ilk kez **el ele tutuşur**; bu kez kıvılcım onları geri savurmaz. Sis dağılır. Ekranda tek bir kelime kalır: "SON".

İkisi de tamamen kodla çizildi (resim dosyası yok), diyalog içermiyor, ENTER ile geçilebiliyor.

## Küçük ama önemli: bölüm seçimi ve kilitler

Oyuncunun kaçıncı bölümde olduğunu hep görmesi gerekiyordu; ekranın üstünde artık "BÖLÜM 12 / 20" yazıyor. Başlıkta ya da duraklatma menüsünde **B** tuşu 20 kartlık bir bölüm seçim ekranını açıyor. Biten bölümlerde süre, yıldız tozu ve gece tüyü sayıları görünüyor. Bölümler **sırayla açılıyor**: sıradakini oynamak için öncekini bitirmek gerekiyor. Test etmek isteyenler için `?unlock=1` hepsini açıyor.

## Başarımlar

Oyunda 12 başarım var: ilerleme (1., 5., 10., 15. bölümü bitirmek ve finali izlemek), toplama (bir bölümün tüm yıldız tozları, tüm gece tüyleri, ikisi birden, 20 bölümün hepsinde hepsi), beceri (bir bölümü hiç ölmeden bitirmek, kıvılcım fırlatması gereken iki bölümü bitirmek) ve **bir tane gizli**. Gizli olanın adını söylemeyeceğim; yalnız şunu ekleyeyim: Sis Kralı misafirperver biridir. Başarımlar bölümü linkle atlayarak (`?level=` gibi) açan oyunlarda verilmiyor, çünkü hile sayılıyor. Sitenin diğer oyunlarındaki gibi, kalıcı olarak yalnızca üyelerde kaydediliyor.

## Sayılarla

- 20 bölüm, 4 bölge, 2 oyuncu, 1 klavye.
- Yaklaşık 5.800 satır JavaScript (oyun kodu ve testler birlikte), hepsi saf JS ve Canvas; bağımlılık yok. Oyun (yazı tipleriyle birlikte) yarım megabayttan küçük.
- Her bölüm için en az bir senaryolu, doğrulanmış çözüm ve çoğunda "tek başına bitiremez" kanıtı.
- Beş kalıcı test aracı (birim testleri, çözücü, senaryolu yürüyüş, fırlatma taraması, hata ayıklama) ve bir de tek seferlik, rastgele tuşlarla duvara sıkışma arayan test.

## Bilinen eksikler

- Terazili bölümlerde (15 ve 17) bir panın kenarında yarı yarıya duran kutu ya da karakter, pan inerken 2–3 piksel zemine gömülebiliyor. Kendiliğinden düzeliyor ama kusurlu; düzeltmeyi denedim, terazi bölümlerini bozdu, geri aldım.
- Ses şimdilik basit akorlar ve gürültü patlamaları. Sahnelerin müziği ayrıca elden geçmeli.

İki kişi bulun, bir klavyeyi paylaşın. Biriniz ışık, biriniz gölge olacak. İyi şanslar.
