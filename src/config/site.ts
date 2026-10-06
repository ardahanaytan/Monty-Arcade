export const site = {
  name: 'Monty Arcade', // ← isim değişirse SADECE burası (+ favicon / og-default.png)
  wordmark: { top: 'MONTY', bottom: 'ARCADE' },
  author: 'ay',
  url: 'https://example.com', // yayın alan adı belli olunca
  links: { itch: '', github: '', kofi: '', email: '' }, // boşsa gizlenir
  features: {
    accounts: false, // v2: giriş butonu, başarım paneli, kart rozet sayısı
    achievementsTeaser: true, // v1: "Yakında: Profil & başarımlar" kutusu
  },
  newBadgeDays: 30, // "YENİ" etiketi kaç gün görünür
};

export type Site = typeof site;
