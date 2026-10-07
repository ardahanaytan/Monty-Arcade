---
title: { tr: "Pit Stop", en: "Pit Stop" }
tagline: { tr: "Krikolar, dört tekerlek, yeşil ışık. Hepsi 3 saniyenin altında.", en: "Jacks, four wheels, green light. All under 3 seconds." }
description:
  tr: "Monty'nin aracı pite giriyor ve ekip sende. Her aşamada bir ibre dönüyor. İbre sarı bölgedeyken basarsan mükemmel, yakınındaysan iyi sayılıyor. Kaçırırsan somun düşüyor ve zaman kaybediyorsun.\n\nSıra şöyle: ön ve arka kriko, dört tekerlek, sonra yeşil ışıkta çıkış. Işık yanmadan çıkarsan güvensiz çıkış cezası 1 saniye. Bir yarış 5 pit stoptan oluşuyor, ibre her pitte biraz daha hızlı dönüyor."
  en: "Monty's car comes into the pits and you're the crew. At every step a needle sweeps around. Press while it's in the yellow for a perfect, or close to it for a good. Miss, and the wheel nut drops and you lose time.\n\nThe order is front and rear jack, four wheels, then release on green. Going before the light turns green is an unsafe release, a 1 second penalty. A race is 5 pit stops, and the needle gets a little faster at every stop."
controls:
  - keys: ["BOŞLUK", "👆"]
    action: { tr: "Bas (ibre sarı bölgedeyken)", en: "Press (needle in the yellow)" }
  - keys: ["P"]
    action: { tr: "Duraklat", en: "Pause" }
  - keys: ["M"]
    action: { tr: "Sesi aç / kapat", en: "Sound on / off" }
cover: ./covers/pit-stop.png
tags: [arcade, one-button, racing, mobile]
releaseDate: 2026-10-07
featured: false
aspectRatio: "16/9"
sizeMB: 0.3
mobile: true
achievements:
  - id: first-stop
    title: { tr: "İlk Pit", en: "First Stop" }
    description: { tr: "İlk pit stopunu tamamla.", en: "Complete your first pit stop." }
    icon: flag
    tier: common
  - id: sub-3
    title: { tr: "Hızlı Ekip", en: "Quick Crew" }
    description: { tr: "3 saniyenin altında bir pit stop yap.", en: "Make a pit stop under 3 seconds." }
    icon: clock
    tier: common
  - id: sub-2-5
    title: { tr: "Dünya Klasmanı", en: "World Class" }
    description: { tr: "2,5 saniyenin altında bir pit stop yap.", en: "Make a pit stop under 2.5 seconds." }
    icon: bolt
    tier: rare
  - id: sub-2-2
    title: { tr: "Rekor Pit", en: "Record Stop" }
    description: { tr: "2,2 saniyenin altında bir pit stop yap.", en: "Make a pit stop under 2.2 seconds." }
    icon: crown
    tier: legendary
  - id: perfect-stop
    title: { tr: "Kusursuz", en: "Flawless" }
    description: { tr: "Bir pitte 6 adımın hepsini mükemmel yap.", en: "Hit all 6 steps perfectly in one stop." }
    icon: star
    tier: rare
  - id: full-race
    title: { tr: "Yarışı Bitir", en: "Race Finished" }
    description: { tr: "5 pit stopluk bir yarışı tamamla.", en: "Complete a 5-stop race." }
    icon: trophy
    tier: common
  - id: unsafe-release
    title: { tr: "Güvensiz Çıkış", en: "Unsafe Release" }
    description: { tr: "Yeşil ışığı beklemeden çık.", en: "Leave before the green light." }
    icon: target
    tier: common
    hidden: true
draft: true
---
