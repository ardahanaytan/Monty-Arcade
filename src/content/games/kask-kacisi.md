---
title: { tr: "Kask Kaçışı", en: "Helmet Dash" }
tagline: { tr: "Monty pistte: zıpla, eğil, gece yarışına kadar dayan.", en: "Monty on the track: jump, duck, and last until the night race." }
description:
  tr: "Monty gün batımında pistte koşuyor ve hız durmadan artıyor. Konilerin üstünden zıpla, lastik duvarlarını aşmak için tuşu daha uzun basılı tut, yağ birikintilerinden kaç ve tabelaların altından eğilerek geç.\n\nHer 500 metrede bir damalı bayrak kapısından geçiyorsun. 800 metreden sonra pist geceye dönüyor. Yol boyunca LED civataları topla ve kendi rekorunu kır."
  en: "Monty is racing down the track at sunset, and the speed keeps climbing. Jump over cones, hold longer to clear tire walls, avoid oil slicks and duck under the signs.\n\nEvery 500 meters you pass a checkered checkpoint gate. After 800 meters the track turns to night. Collect LED bolts along the way and beat your own record."
controls:
  - keys: ["BOŞLUK", "↑"]
    action: { tr: "Zıpla (basılı tut: daha yüksek)", en: "Jump (hold: higher)" }
  - keys: ["↓"]
    action: { tr: "Eğil / havadayken hızlı in", en: "Duck / fast fall in the air" }
  - keys: ["👆"]
    action: { tr: "Dokun: zıpla · Sol kenar: eğil", en: "Tap: jump · Left edge: duck" }
  - keys: ["P"]
    action: { tr: "Duraklat", en: "Pause" }
  - keys: ["M"]
    action: { tr: "Sesi aç / kapat", en: "Sound on / off" }
cover: ./covers/kask-kacisi.png
tags: [arcade, one-button, racing, mobile]
releaseDate: 2026-10-07
featured: false
aspectRatio: "16/9"
sizeMB: 0.3
mobile: true
achievements:
  - id: first-100
    title: { tr: "Isınma Turu", en: "Warm-up Lap" }
    description: { tr: "100 metreye ulaş.", en: "Reach 100 meters." }
    icon: flag
    tier: common
  - id: checkpoint
    title: { tr: "Checkpoint", en: "Checkpoint" }
    description: { tr: "İlk damalı bayrak kapısından geç (500 m).", en: "Pass the first checkered gate (500 m)." }
    icon: target
    tier: common
  - id: night-race
    title: { tr: "Gece Yarışı", en: "Night Race" }
    description: { tr: "Pistin geceye döndüğü 800 metreyi gör.", en: "See the track turn to night at 800 m." }
    icon: star
    tier: rare
    hidden: true
  - id: one-km
    title: { tr: "Bir Kilometre", en: "One Kilometer" }
    description: { tr: "Tek koşuda 1000 metreye ulaş.", en: "Reach 1000 meters in one run." }
    icon: trophy
    tier: rare
  - id: two-km
    title: { tr: "Dayanıklılık", en: "Endurance" }
    description: { tr: "Tek koşuda 2000 metreye ulaş.", en: "Reach 2000 meters in one run." }
    icon: crown
    tier: legendary
  - id: bolt-50
    title: { tr: "Civata Avcısı", en: "Bolt Hunter" }
    description: { tr: "Tek koşuda 50 LED civata topla.", en: "Collect 50 LED bolts in one run." }
    icon: bolt
    tier: rare
draft: false
---
