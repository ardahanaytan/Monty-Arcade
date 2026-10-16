---
# YAPIM AŞAMASINDA: oyun bitene kadar draft kalır (production build'e girmez). Tasarım: ../oyunlar/isik-ve-golge/TASARIM.md
title: { tr: "Işık ve Gölge", en: "Light & Shadow" }
tagline: { tr: "Birbirine dokunamayan iki yürek, tek bir çıkış.", en: "Two hearts that cannot touch, one way out." }
description:
  tr: "Işık ile Gölge birbirine çekiliyor ama doğaları gereği dokunamıyorlar: ışık gölgeyi yok eder. Sis Kralı bu çekimi kontrast sayıp ikisini zindana attı.\n\nAynı klavyede iki kişi oynayın. Işık ışık kapılarından, Gölge karanlık perdelerden geçer. Biri öbürünün yolunu açmadan kimse çıkışa varamaz."
  en: "Light and Shadow are drawn to each other, but by nature they cannot touch: light destroys shadow. The Fog King saw their pull as contrast and threw them into a dungeon.\n\nPlay together on one keyboard. Light passes through light gates, Shadow through dark curtains. Neither can reach the exit unless the other opens the way."
controls:
  - keys: ["A", "D"]
    action: { tr: "Işık: yürü", en: "Light: walk" }
  - keys: ["W"]
    action: { tr: "Işık: zıpla", en: "Light: jump" }
  - keys: ["←", "→"]
    action: { tr: "Gölge: yürü", en: "Shadow: walk" }
  - keys: ["↑"]
    action: { tr: "Gölge: zıpla", en: "Shadow: jump" }
  - keys: ["R"]
    action: { tr: "Bölümü yeniden başlat", en: "Restart level" }
  - keys: ["B"]
    action: { tr: "Bölüm seçimi", en: "Level select" }
  - keys: ["P"]
    action: { tr: "Duraklat", en: "Pause" }
cover: ./covers/isik-ve-golge.png
tags: [puzzle, platformer, co-op]
releaseDate: 2026-10-14
featured: true
aspectRatio: "16/9"
sizeMB: 0.5
mobile: false
achievements:
  - id: first-light
    title: { tr: "İlk Işık", en: "First Light" }
    description: { tr: "1. bölümü bitir.", en: "Finish level 1." }
    icon: flag
    tier: common
  - id: dungeon-out
    title: { tr: "Zindandan Çıkış", en: "Out of the Dungeon" }
    description: { tr: "5. bölümü bitir.", en: "Finish level 5." }
    icon: flag
    tier: common
  - id: courtyard-beyond
    title: { tr: "Avlunun Ötesi", en: "Beyond the Courtyard" }
    description: { tr: "10. bölümü bitir.", en: "Finish level 10." }
    icon: flag
    tier: rare
  - id: on-ramparts
    title: { tr: "Surların Üstünde", en: "On the Ramparts" }
    description: { tr: "15. bölümü bitir.", en: "Finish level 15." }
    icon: flag
    tier: rare
  - id: freedom
    title: { tr: "Özgürlük", en: "Freedom" }
    description: { tr: "20. bölümü bitir ve finali izle.", en: "Finish level 20 and watch the ending." }
    icon: crown
    tier: legendary
  - id: stardust-hunter
    title: { tr: "Yıldız Tozu Avcısı", en: "Stardust Hunter" }
    description: { tr: "Bir bölümdeki tüm yıldız tozlarını topla.", en: "Collect all the stardust in a level." }
    icon: star
    tier: common
  - id: feather-hunter
    title: { tr: "Gece Tüyü Avcısı", en: "Night Feather Hunter" }
    description: { tr: "Bir bölümdeki tüm gece tüylerini topla.", en: "Collect all the night feathers in a level." }
    icon: star
    tier: common
  - id: perfect
    title: { tr: "Eksiksiz", en: "Complete Haul" }
    description: { tr: "Bir bölümdeki yıldız tozlarının ve gece tüylerinin hepsini topla.", en: "Collect every stardust and night feather in a level." }
    icon: heart
    tier: rare
  - id: no-death
    title: { tr: "Tek Seferde", en: "First Try" }
    description: { tr: "Bir bölümü hiç ölmeden bitir.", en: "Finish a level without dying." }
    icon: target
    tier: common
  - id: spark-master
    title: { tr: "Kıvılcım Ustası", en: "Spark Master" }
    description: { tr: "Kıvılcım fırlatması gerektiren bölümleri (5 ve 18) bitir.", en: "Finish both levels that need a spark launch (5 and 18)." }
    icon: bolt
    tier: rare
  - id: fog-kings-guest
    title: { tr: "Sis Kralı'nın Misafiri", en: "The Fog King's Guest" }
    description: { tr: "Toplam 50 kez öl. Sis Kralı seni ağırlamaktan memnun.", en: "Die 50 times in total. The Fog King is delighted to host you." }
    icon: clock
    tier: common
    hidden: true
  - id: collector
    title: { tr: "Koleksiyoncu", en: "Collector" }
    description: { tr: "20 bölümün hepsinde bütün yıldız tozlarını ve gece tüylerini topla.", en: "Collect every stardust and night feather in all 20 levels." }
    icon: trophy
    tier: legendary
draft: true
---
