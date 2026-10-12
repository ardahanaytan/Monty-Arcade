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
    weeklyBox: true, // ana sayfa yan sütunu: "YAKINDA — Her cuma yeni oyun" kutusu
  },
  newBadgeDays: 30, // "YENİ" etiketi kaç gün görünür
};

export type Site = typeof site;
