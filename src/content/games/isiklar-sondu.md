---
title: { tr: "Işıklar Söndü", en: "Lights Out" }
tagline: { tr: "Beş kırmızı ışık. Söndükleri an bas.", en: "Five red lights. Go the moment they go out." }
description:
  tr: "Start ışıkları saniyede bir yanıyor. Beşi de yandıktan sonra rastgele bir anda sönüyor ve o an tuşa basman gerekiyor. Tepki süren milisaniye cinsinden ölçülüyor. Erken basarsan erken çıkış, 100 ms'nin altında basarsan tahmin sayılır.\n\nTek Start modunda istediğin kadar dene, Grand Prix modunda 5 startın ortalamasıyla yarış. Grand Prix'te her erken çıkış 1 saniye ceza demek. Son denemelerin ve rekorların ekranda duruyor."
  en: "The start lights come on one per second. Once all five are lit, they go out at a random moment, and that's when you press. Your reaction time is measured in milliseconds. Going early is a jump start, and anything under 100 ms counts as a guess.\n\nPractice as much as you like in Single Start, or race the average of 5 starts in Grand Prix mode, where every jump start costs a 1 second penalty. Your recent attempts and records stay on screen."
controls:
  - keys: ["BOŞLUK", "👆"]
    action: { tr: "Başlat / tepki ver", en: "Start / react" }
  - keys: ["M"]
    action: { tr: "Sesi aç / kapat", en: "Sound on / off" }
cover: ./covers/isiklar-sondu.png
tags: [arcade, one-button, racing, mobile]
releaseDate: 2026-10-07
featured: false
aspectRatio: "16/9"
sizeMB: 0.3
mobile: true
achievements:
  - id: first-start
    title: { tr: "İlk Start", en: "First Start" }
    description: { tr: "Geçerli bir start yap.", en: "Make a clean start." }
    icon: flag
    tier: common
  - id: under-250
    title: { tr: "Hızlı Refleks", en: "Quick Reflexes" }
    description: { tr: "250 ms'nin altında tepki ver.", en: "React in under 250 ms." }
    icon: bolt
    tier: common
  - id: under-200
    title: { tr: "Pole Position", en: "Pole Position" }
    description: { tr: "200 ms'nin altında tepki ver.", en: "React in under 200 ms." }
    icon: star
    tier: rare
  - id: gp-finish
    title: { tr: "Grand Prix", en: "Grand Prix" }
    description: { tr: "5 startlık bir Grand Prix'yi bitir.", en: "Finish a 5-start Grand Prix." }
    icon: trophy
    tier: common
  - id: gp-under-230
    title: { tr: "Şampiyon Startı", en: "Champion's Start" }
    description: { tr: "Erken çıkış yapmadan Grand Prix ortalamanı 230 ms'nin altına indir.", en: "Average under 230 ms in a Grand Prix with no jump starts." }
    icon: crown
    tier: legendary
  - id: jump-start
    title: { tr: "Sabırsız", en: "Impatient" }
    description: { tr: "Erken çıkış yap.", en: "Jump the start." }
    icon: target
    tier: common
    hidden: true
draft: true
---
