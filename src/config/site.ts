export const site = {
  name: 'Monty Arcade', // ← isim değişirse SADECE burası (+ favicon / og-default.png)
  wordmark: { top: 'MONTY', bottom: 'ARCADE' },
  author: 'Ardahan Aytan',
  url: 'https://monty-arcade.vercel.app', // yayın adresi (canonical, hreflang, sitemap, robots, OG buradan)
  // Boşsa gizlenir. github/linkedin: geliştirici profilleri (header, footer, Sürücü kartı, Hakkında).
  links: {
    github: 'https://github.com/ardahanaytan',
    linkedin: 'https://www.linkedin.com/in/ardahan-aytan',
    itch: '',
    kofi: '',
    email: '',
  },
  features: {
    accounts: true, // v2: giriş butonu, başarım paneli, kart rozet sayısı
    achievementsTeaser: false, // v1: "Yakında: Profil & başarımlar" kutusu
  },
  // Giriş yöntemleri (Supabase Auth panelinde de açık olmalı). E-posta sihirli link her zaman var.
  authProviders: ['github'] as ('github' | 'google' | 'discord')[],
  newBadgeDays: 30, // "YENİ" etiketi kaç gün görünür
};

export type Site = typeof site;
