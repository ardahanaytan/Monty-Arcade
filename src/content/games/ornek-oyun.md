---
# TASLAK: Oyun kartı ve oyun sayfası şablonunu test etmek için. Sadece `npm run dev`'de görünür,
# production build'e girmez (oyun dosyaları da dist/'ten silinir). Gerçek ilk oyun gelince silinebilir.
title: { tr: "Örnek Oyun", en: "Sample Game" }
tagline: { tr: "Şablonu test etmek için tek tuşlu deneme oyunu.", en: "A one-button test game for the page template." }
description:
  tr: "Bu bir taslak test oyunudur; Monty Player'ın tıkla-yükle, tam ekran ve yeniden başlat özelliklerini denemek için var.\n\nBoşluk tuşuyla ya da ekrana dokunarak zıpla, koni engellerinin üzerinden geç."
  en: "This is a draft test game that exists to try out the Monty Player's click-to-load, fullscreen and restart features.\n\nPress space or tap the screen to jump over the cones."
controls:
  - keys: ["BOŞLUK"]
    action: { tr: "Zıpla", en: "Jump" }
  - keys: ["R"]
    action: { tr: "Yeniden başla", en: "Restart" }
cover: ./covers/ornek-oyun.png
tags: [arcade, one-button, mobile]
releaseDate: 2026-10-06
featured: false
sizeMB: 0.01
mobile: true
achievements:
  - id: first-jump
    title: { tr: "İlk Zıplama", en: "First Jump" }
    description: { tr: "İlk koninin üzerinden atla.", en: "Jump over your first cone." }
    icon: flag
    tier: common
  - id: ten-cones
    title: { tr: "Koni Ustası", en: "Cone Master" }
    description: { tr: "Tek seferde 10 koni geç.", en: "Clear 10 cones in one run." }
    icon: bolt
    tier: rare
  - id: secret-lap
    title: { tr: "Gizli Tur", en: "Secret Lap" }
    description: { tr: "Gizli.", en: "Secret." }
    icon: crown
    tier: legendary
    hidden: true
draft: true
---
