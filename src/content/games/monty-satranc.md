---
title: { tr: "Monty Satranç", en: "Monty Chess" }
tagline: { tr: "Monty'ye karşı satranç: kolay, orta ya da zor.", en: "Chess against Monty: easy, medium or hard." }
description:
  tr: "Sitenin ilk oyunu: Monty'ye karşı klasik satranç. Üç seviye var. Kolay'da Monty acemi gibi oynar ve sık sık hata yapar; Orta'da birkaç hamle ilerisini hesaplar; Zor'da ise tüm gücüyle, derin bir aramayla oynar.\n\nRok, geçerken alma, terfi, pat, üç kez tekrar ve 50 hamle kuralı dahil tüm kurallar var. Hamleni geri alabilir, oyunu yarıda bırakıp sonra kaldığın yerden devam edebilirsin. Fareyle, dokunarak ya da klavyeyle oynanır."
  en: "The site's first game: classic chess against Monty. There are three levels. On Easy, Monty plays like a beginner and makes plenty of mistakes; on Medium it calculates a few moves ahead; on Hard it plays at full strength with a deep search.\n\nAll the rules are in: castling, en passant, promotion, stalemate, threefold repetition and the 50-move rule. You can take back moves, and leave a game to continue it later. Play with the mouse, touch or the keyboard."
controls:
  - keys: ["🖱", "👆"]
    action: { tr: "Taşı seç ve oyna (tıkla ya da sürükle)", en: "Select and move a piece (click or drag)" }
  - keys: ["←", "↑", "→", "↓"]
    action: { tr: "Klavyeyle kare seç", en: "Pick a square with the keyboard" }
  - keys: ["ENTER"]
    action: { tr: "Seç / oyna", en: "Select / move" }
  - keys: ["U"]
    action: { tr: "Hamleyi geri al", en: "Undo move" }
  - keys: ["M"]
    action: { tr: "Sesi aç / kapat", en: "Sound on / off" }
cover: ./covers/monty-satranc.png
tags: [board, casual, mobile]
releaseDate: 2026-10-07
featured: true
aspectRatio: "16/9"
sizeMB: 0.5
mobile: true
achievements:
  - id: easy-win
    title: { tr: "İlk Galibiyet", en: "First Win" }
    description: { tr: "Monty'yi Kolay seviyede yen.", en: "Beat Monty on Easy." }
    icon: flag
    tier: common
  - id: medium-win
    title: { tr: "Pist Ustası", en: "Track Master" }
    description: { tr: "Monty'yi Orta seviyede yen.", en: "Beat Monty on Medium." }
    icon: star
    tier: rare
  - id: hard-win
    title: { tr: "Şampiyon", en: "Champion" }
    description: { tr: "Monty'yi Zor seviyede yen.", en: "Beat Monty on Hard." }
    icon: crown
    tier: legendary
  - id: promotion
    title: { tr: "Terfi", en: "Promotion" }
    description: { tr: "Bir piyonu son sıraya ulaştır.", en: "Get a pawn to the last rank." }
    icon: bolt
    tier: common
  - id: quick-mate
    title: { tr: "Hızlı Tur", en: "Fast Lap" }
    description: { tr: "20 hamle ya da daha kısa sürede kazan.", en: "Win in 20 moves or fewer." }
    icon: clock
    tier: rare
  - id: en-passant
    title: { tr: "Geçerken", en: "In Passing" }
    description: { tr: "Geçerken alma hamlesi yap.", en: "Capture en passant." }
    icon: target
    tier: rare
    hidden: true
draft: false
---
