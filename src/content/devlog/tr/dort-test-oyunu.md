---
title: "İlk dört oyun: aslında birer test pisti"
description: "Monty Satranç, Kask Kaçışı, Işıklar Söndü ve Pit Stop neden yapıldı, hangisi sistemin neresini denedi?"
date: 2026-10-12T10:00:00
---

Sitede şu an dört oyun var: **Monty Satranç**, **Kask Kaçışı**, **Işıklar Söndü** ve **Pit Stop**. Hepsi oynanabilir, hepsinin kendi başarımları var. Ama dürüst olayım: bu oyunların asıl görevi eğlendirmek değildi. Asıl görevleri, sitenin altyapısının gerçekten çalışıp çalışmadığını göstermekti.

Bir yarış arabası yapınca onu ilk gün yarışa sokmazsın, önce test pistine çıkarırsın. Bu dört oyun da benim test pistim oldu.

## Neyi test ediyordum?

Siteyi kurarken oyunlar için bir sürü kural koydum: oyun bir `iframe` içinde açılacak, sadece "Oynamak için tıkla"ya basınca yüklenecek, dili adresten (`?lang=tr` ya da `?lang=en`) okuyacak, siteye "hazırım" diyecek, site "sessize al" dediğinde susacak, bir başarım açıldığında siteye haber verecek. Kâğıt üstünde hepsi güzeldi. Ama gerçek bir oyun bu kurallara uymaya çalışmadan, kuralların doğru olup olmadığını bilemezdim.

O yüzden her oyunu sistemin farklı bir köşesini zorlayacak şekilde seçtim.

## Monty Satranç: en ağır yük

İlk oyun bilerek en zorlusu oldu. Satrançta bütün kurallar var: rok, geçerken alma, terfi, pat, üç kez tekrar, 50 hamle kuralı. Monty'nin üç seviyesi var; Zor seviyede derin bir arama yapıyor.

Test ettiği şeyler:

- **Ağır hesaplama:** Monty düşünürken sayfa donmasın diye yapay zekâ ayrı bir iş parçacığında (Web Worker) çalışıyor. Oynatıcının içinde bunun sorunsuz çalıştığını görmek istedim.
- **Her türlü kontrol:** fare, dokunma, sürükle-bırak ve klavye. Oynatıcının odak ve klavye ayarlarının gerçek bir oyunda işe yarayıp yaramadığını burada gördüm.
- **Kayıt:** oyunu yarıda bırakıp sonra kaldığın yerden devam edebiliyorsun.
- **İlk başarım mesajları:** site ile oyun arasındaki "başarım açıldı" mesajını ilk kez burada kullandım.

## Kask Kaçışı: gerçek zamanlı aksiyon

Kask Kaçışı, site için başta yaptığım deneme oyununun yerini aldı. Monty gün batımında pistte koşuyor; konilerin üstünden zıplıyor, tabelaların altından eğiliyor. Her 500 metrede damalı bir kapı var, 800 metreden sonra pist geceye dönüyor.

Test ettiği şeyler:

- **Akıcılık:** saniyede onlarca kez çizilen, sürekli hızlanan bir oyunun oynatıcıda takılmadan çalışması.
- **Telefonda oynanış:** dokununca zıpla, sol kenara dokununca eğil. Mobil uyumlu bir aksiyon oyununun dokunmatik ekranda gerçekten oynanabilir olup olmadığı.
- **Tam ekran:** ekran boyutu değişince oyunun kendini doğru ayarlaması.

## Işıklar Söndü: tek tuş, milisaniye hassasiyeti

Beş kırmızı ışık sırayla yanıyor, rastgele bir anda sönüyor ve o an basıyorsun. Tepki süren milisaniye cinsinden ölçülüyor.

Bu oyun sistemin en basit hâlini test etti: tek tuş, tek ekran, neredeyse hiç grafik yok. Hem klavyede hem dokunmatik ekranda zamanlamanın güvenilir olması gerekiyordu, yoksa ölçtüğü sürenin bir anlamı kalmazdı. Ayrıca "erken çıkış" gibi gizli başarımları denemek için de iyi bir yerdi.

## Pit Stop: ses ve zamanlama

Ekip sensin: krikolar, dört tekerlek ve yeşil ışıkta çıkış. Her adımda dönen bir ibreyi sarı bölgede yakalaman gerekiyor.

Pit Stop daha çok **ses** tarafını zorladı. Sesin oyunun önemli bir parçası olduğu bir oyunda, oynatıcıdaki "Ses" butonunun gerçekten işe yarayıp yaramadığını görmek istedim.

## Test pistinde neler patladı?

Testin amacı bir şeylerin bozulmasıydı ve bozuldu da:

- **Ses butonu:** Oyunu "Yeniden başlat" ile açınca, sessize almış olsan bile oyun sesli başlıyordu. Artık oyun her açılışında sessiz durumunu siteden tekrar alıyor. Butonun kendisi de durumu gösteriyor: sessizken ikonu değişiyor, yazısı "Ses kapalı" oluyor ve tercihin tarayıcıda hatırlanıyor.
- **iPhone'da tam ekran:** iPhone'daki tarayıcılar, bir sayfanın içindeki bir alanı tam ekran yapmaya izin vermiyor. Buton hiçbir şey yapmıyordu. Şimdi bu durumda oynatıcı ekranı kendisi kaplıyor; üstte oyunun adı ve "Tam ekrandan çık" çubuğu çıkıyor, telefonun geri hareketi de çıkarıyor.
- **Ortak bir kit:** Kask Kaçışı, Işıklar Söndü ve Pit Stop'u yaparken aynı şeyleri (dil seçimi, kayıt, site mesajları, duraklatma, sesler) tekrar tekrar yazdığımı fark ettim. Hepsini ortak küçük bir kitte topladım. Bundan sonraki oyunlar bu temelden başlayacak.

Dört oyunun her biri yarım megabayt ya da daha küçük. "Oyunları küçük tut" kuralı da böylece test edilmiş oldu.

## Başarımlar

Her oyunda altı ya da yedi başarım var; bazıları gizli, açılana kadar ne olduğu görünmüyor. Bu başarımlar oyunların içine baştan yazıldı, ama asıl anlamlarını üyelik sistemiyle kazanıyorlar. Onu ayrı bir yazıda anlatacağım.

## Sırada ne var?

Test pisti işini yaptı: altyapı ayakta, oynatıcı sağlam, oyun yapmanın bir düzeni var. Bundan sonraki oyunlar test için değil, sırf oynanmak için yapılacak.

Bu dört oyunu yine de oynamanı isterim. Bir hata bulursan ya da bir fikrin olursa bana yazmaktan çekinme. 🏁
