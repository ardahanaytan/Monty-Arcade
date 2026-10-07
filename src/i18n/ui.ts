export const languages = ['tr', 'en'] as const;
export type Lang = (typeof languages)[number];
export const defaultLang: Lang = 'en';

export const locales: Record<Lang, string> = { tr: 'tr-TR', en: 'en-US' };

const tr = {
  'meta.tagline': 'Bağımsız, küçük, tarayıcıda anında oynanan oyunlar.',
  'a11y.skip': 'İçeriğe atla',
  'a11y.home': 'Monty Arcade ana sayfa',
  'a11y.mainNav': 'Ana menü',
  'a11y.breadcrumb': 'Konum',
  'a11y.highlights': 'Öne çıkanlar',
  'a11y.game': 'Oyun',
  'nav.games': 'Oyunlar',
  'nav.devlog': 'Devlog',
  'nav.about': 'Hakkında',
  'nav.login': 'Giriş yap',
  'nav.profile': 'Profil',
  'nav.logout': 'Çıkış yap',
  'lang.label': 'Dil',
  'lang.name': 'Türkçe',
  'ticker.label': 'CANLI',
  'ticker.1': 'MONTY ARCADE KAPILARINI AÇTI',
  'ticker.2': 'İLK OYUNLAR PİTTE HAZIRLANIYOR',
  'ticker.3': 'DEVLOG: NEDEN FLASH TARZI BİR SİTE?',
  'ticker.4': 'YAKINDA: PROFİL VE BAŞARIMLAR',
  'ticker.newGame': 'YENİ OYUN',
  'ticker.newPost': 'DEVLOG',
  'hero.badge': '● KAPILAR AÇILDI',
  'hero.title1': 'Küçük oyunlar.',
  'hero.title2': 'Büyük nostalji.',
  'hero.lead':
    'Kendi yaptığım tarayıcı oyunları burada tek tek yayınlanacak. Kurulum yok, bekleme yok. Tıkla ve oyna.',
  'hero.ctaDevlog': "Devlog'u oku",
  'hero.ctaAbout': 'Monty kim?',
  'hero.featuredBadge': '● HAFTANIN OYUNU',
  'hero.play': 'Hemen oyna',
  'hero.details': 'Detaylar',
  'monty.alt': 'Monty, LED gözlü yarış kaskı maskotu',
  'spec.freeValue': '%100',
  'spec.free': 'ÜCRETSİZ',
  'spec.install': 'KURULUM',
  'spec.langs': 'İKİ DİL',
  'spec.games': 'OYUN',
  'games.eyebrow': '01 / OYUNLAR',
  'games.title': 'Tüm oyunlar',
  'games.search': 'Oyun ara…',
  'games.searchLabel': 'Oyun ara',
  'games.tagsLabel': 'Etiketler',
  'games.all': 'Hepsi',
  'games.noResults': 'Bu filtreyle oyun bulunamadı.',
  'card.play': 'OYNA',
  'card.new': 'YENİ',
  'card.achievements': 'Bu oyundaki başarımlar',
  'card.cover': '[OYUN KAPAĞI]',
  'soon.slot': 'SLOT',
  'soon.title': 'Pitte hazırlanıyor',
  'soon.text': 'Yeni oyun yolda…',
  'devlog.eyebrow': '02 / DEVLOG',
  'devlog.pageEyebrow': 'DEVLOG',
  'devlog.latest': 'Son yazılar',
  'devlog.title': 'Devlog',
  'devlog.intro': 'Oyunların arkasındaki notlar, denemeler ve hikâyeler.',
  'devlog.empty': 'Henüz yazı yok.',
  'devlog.back': '← Tüm yazılar',
  'devlog.prev': 'Önceki yazı',
  'devlog.next': 'Sonraki yazı',
  'devlog.readTime': '{n} dk okuma',
  'devlog.relatedGame': 'Bu yazının oyunu',
  'driver.eyebrow': 'SÜRÜCÜ KARTI',
  'driver.title': 'Monty kim?',
  'driver.text':
    'Adını bir yarış efsanesinden alan bu kask, sitenin maskotu. Arkasında ise boş zamanlarında küçük web oyunları yapan Ardahan var.',
  'driver.link': 'Hakkında →',
  'teaser.badge': 'YAKINDA',
  'teaser.title': 'Profil & başarım rozetleri',
  'teaser.text': 'Her oyunun kendine özel başarımları olacak. Topla, profilinde sergile.',
  'game.breadcrumb': 'OYUNLAR',
  'game.player': 'MONTY PLAYER',
  'game.start': 'Oyunu başlat',
  'game.clickToPlay': 'Oynamak için tıkla',
  'game.loadNote': 'OYUN SADECE TIKLAYINCA YÜKLENİR · {size} MB',
  'game.loadNoteNoSize': 'OYUN SADECE TIKLAYINCA YÜKLENİR',
  'game.loading': 'YÜKLENİYOR',
  'game.fullscreen': 'Tam ekran',
  'game.restart': 'Yeniden başlat',
  'game.sound': 'Ses',
  'game.soundOn': 'Ses açık',
  'game.soundOff': 'Ses kapalı',
  'game.released': 'ÇIKIŞ',
  'game.briefing': 'BRİFİNG',
  'game.about': 'Oyun hakkında',
  'game.controls': 'Kontroller',
  'game.related': 'Bu oyunla ilgili yazılar',
  'game.tech': 'TEKNİK KART',
  'game.tech.release': 'Çıkış',
  'game.tech.genre': 'Tür',
  'game.tech.size': 'Boyut',
  'game.tech.mobile': 'Mobil',
  'game.yes': 'Evet',
  'game.no': 'Hayır',
  'game.moreEyebrow': 'SIRADAKİ YARIŞ',
  'game.more': 'Diğer oyunlar',
  'ach.title': 'Başarımlar',
  'ach.progress': 'Başarım ilerlemesi',
  'ach.common': 'YAYGIN',
  'ach.rare': 'NADİR',
  'ach.legendary': 'EFSANEVİ',
  'ach.hidden': 'Gizli başarım',
  'ach.hiddenText': 'Açılana kadar gizli kalır',
  'ach.all': 'Tüm başarımlar →',
  'ach.guestNote': 'Giriş yaparsan ilerlemen kaydedilir',
  'ach.toast': 'Başarım açıldı!',
  'ach.rarity': "Oyuncuların %{p}'i açtı",
  'footer.tagline': 'Bağımsız, küçük, tarayıcıda anında oynanan oyunlar.',
  'footer.support': 'Destek ol',
  'footer.menu': 'Alt menü',
  'social.label': 'Sosyal bağlantılar',
  'social.github': 'GitHub profilim',
  'social.linkedin': 'LinkedIn profilim',
  'social.newTab': '(yeni sekmede açılır)',
  '404.code': 'DNF',
  '404.title': 'Pistten çıktın!',
  '404.text': 'Aradığın sayfa bulunamadı.',
  '404.back': 'Pite dön',
  'about.title': 'Hakkında',
  'about.eyebrow': 'GARAJ',
  'about.montyTitle': 'Monty kim?',
  'about.montyText':
    "Monty, sitenin maskotu olan retro bir yarış kaskı. Adını bir yarış efsanesinin gerçek adı olan \"Montgomery\"den alıyor.",
  'about.devTitle': 'Geliştirici',
  'about.devText': 'Merhaba, ben Ardahan. Oyun oynamayı seviyorum, oyun yapmayı da en az o kadar seviyorum. Monty Arcade benim için bir oyun sitesinden fazlası. Asıl amacım baştan sona kendi ürünümü çıkarmak ve bu yolda gerçek bir tecrübe kazanmak. Bir web sitesini sıfırdan kurmak, yayına almak, büyütmek ve ayakta tutmak, yani işin sadece eğlenceli kısmını değil, tamamını öğrenmek istiyorum. Bunu yaparken de en iyi bildiğim yerden başlamak istedim. Bir zamanlar bütün boş vaktimi geçirdiğim flash oyun siteleri, internetle ilk gerçek bağımı kurduğum yerlerdi. O yüzden ilk ürünüm, o sitelerin bugüne uyarlanmış hali oldu. Burada yaptığım oyunları yayınlayacak, devlog\'da da bu süreçte öğrendiklerimi, hatalarımı ve küçük zaferlerimi paylaşacağım. Yolda düzelteceğim çok şey olacağından eminim, ama olay da bu zaten. Bir fikrin, önerin ya da bulduğun bir hata varsa yazmaktan çekinme. Pit ekibine her zaman yer var.',
  'about.siteTitle': 'Site nasıl yapıldı?',
  'about.siteText':
    'Site Astro ile üretilen statik sayfalardan oluşuyor; sunucu yok, veritabanı yok. Sayfalar hafif ve hızlı, oyunlar ise sadece sen "Oyna"ya bastığında yükleniyor.',
  'about.contactTitle': 'İletişim',
  'about.email': 'E-posta',
  'root.choose': 'Dil seç / Choose your language',
};

export type UIKey = keyof typeof tr;

const en: Record<UIKey, string> = {
  'meta.tagline': 'Small indie games you can play instantly in your browser.',
  'a11y.skip': 'Skip to content',
  'a11y.home': 'Monty Arcade home',
  'a11y.mainNav': 'Main menu',
  'a11y.breadcrumb': 'Breadcrumb',
  'a11y.highlights': 'Highlights',
  'a11y.game': 'Game',
  'nav.games': 'Games',
  'nav.devlog': 'Devlog',
  'nav.about': 'About',
  'nav.login': 'Sign in',
  'nav.profile': 'Profile',
  'nav.logout': 'Sign out',
  'lang.label': 'Language',
  'lang.name': 'English',
  'ticker.label': 'LIVE',
  'ticker.1': 'MONTY ARCADE IS OPEN',
  'ticker.2': 'FIRST GAMES ARE IN THE PITS',
  'ticker.3': 'DEVLOG: WHY A FLASH-STYLE SITE?',
  'ticker.4': 'COMING SOON: PROFILES & ACHIEVEMENTS',
  'ticker.newGame': 'NEW GAME',
  'ticker.newPost': 'DEVLOG',
  'hero.badge': '● NOW OPEN',
  'hero.title1': 'Small games.',
  'hero.title2': 'Big nostalgia.',
  'hero.lead':
    'The browser games I make will be released here one by one. No installs, no waiting. Just click and play.',
  'hero.ctaDevlog': 'Read the devlog',
  'hero.ctaAbout': "Who's Monty?",
  'hero.featuredBadge': '● GAME OF THE WEEK',
  'hero.play': 'Play now',
  'hero.details': 'Details',
  'monty.alt': 'Monty, the racing-helmet mascot with LED eyes',
  'spec.freeValue': '100%',
  'spec.free': 'FREE',
  'spec.install': 'INSTALL',
  'spec.langs': 'TWO LANGUAGES',
  'spec.games': 'GAMES',
  'games.eyebrow': '01 / GAMES',
  'games.title': 'All games',
  'games.search': 'Search games…',
  'games.searchLabel': 'Search games',
  'games.tagsLabel': 'Tags',
  'games.all': 'All',
  'games.noResults': 'No games match this filter.',
  'card.play': 'PLAY',
  'card.new': 'NEW',
  'card.achievements': 'Achievements in this game',
  'card.cover': '[GAME COVER]',
  'soon.slot': 'SLOT',
  'soon.title': 'In the pits',
  'soon.text': 'A new game is on the way…',
  'devlog.eyebrow': '02 / DEVLOG',
  'devlog.pageEyebrow': 'DEVLOG',
  'devlog.latest': 'Latest posts',
  'devlog.title': 'Devlog',
  'devlog.intro': 'Notes, experiments and stories behind the games.',
  'devlog.empty': 'No posts yet.',
  'devlog.back': '← All posts',
  'devlog.prev': 'Previous post',
  'devlog.next': 'Next post',
  'devlog.readTime': '{n} min read',
  'devlog.relatedGame': 'The game behind this post',
  'driver.eyebrow': 'DRIVER CARD',
  'driver.title': "Who's Monty?",
  'driver.text':
    "This helmet, named after a racing legend, is the site's mascot. Behind it is Ardahan, who makes small web games in their free time.",
  'driver.link': 'About →',
  'teaser.badge': 'COMING SOON',
  'teaser.title': 'Profiles & achievement badges',
  'teaser.text': 'Every game will have its own achievements. Collect them and show them off on your profile.',
  'game.breadcrumb': 'GAMES',
  'game.player': 'MONTY PLAYER',
  'game.start': 'Start game',
  'game.clickToPlay': 'Click to play',
  'game.loadNote': 'THE GAME ONLY LOADS WHEN YOU CLICK · {size} MB',
  'game.loadNoteNoSize': 'THE GAME ONLY LOADS WHEN YOU CLICK',
  'game.loading': 'LOADING',
  'game.fullscreen': 'Fullscreen',
  'game.restart': 'Restart',
  'game.sound': 'Sound',
  'game.soundOn': 'Sound on',
  'game.soundOff': 'Sound off',
  'game.released': 'RELEASED',
  'game.briefing': 'BRIEFING',
  'game.about': 'About this game',
  'game.controls': 'Controls',
  'game.related': 'Posts about this game',
  'game.tech': 'SPEC SHEET',
  'game.tech.release': 'Released',
  'game.tech.genre': 'Genre',
  'game.tech.size': 'Size',
  'game.tech.mobile': 'Mobile',
  'game.yes': 'Yes',
  'game.no': 'No',
  'game.moreEyebrow': 'NEXT RACE',
  'game.more': 'More games',
  'ach.title': 'Achievements',
  'ach.progress': 'Achievement progress',
  'ach.common': 'COMMON',
  'ach.rare': 'RARE',
  'ach.legendary': 'LEGENDARY',
  'ach.hidden': 'Hidden achievement',
  'ach.hiddenText': 'Stays hidden until unlocked',
  'ach.all': 'All achievements →',
  'ach.guestNote': 'Sign in to save your progress',
  'ach.toast': 'Achievement unlocked!',
  'ach.rarity': 'Unlocked by {p}% of players',
  'footer.tagline': 'Small indie games you can play instantly in your browser.',
  'footer.support': 'Support',
  'footer.menu': 'Footer menu',
  'social.label': 'Social links',
  'social.github': 'My GitHub profile',
  'social.linkedin': 'My LinkedIn profile',
  'social.newTab': '(opens in a new tab)',
  '404.code': 'DNF',
  '404.title': 'You went off track!',
  '404.text': "The page you're looking for doesn't exist.",
  '404.back': 'Back to the pits',
  'about.title': 'About',
  'about.eyebrow': 'GARAGE',
  'about.montyTitle': "Who's Monty?",
  'about.montyText':
    'Monty is a retro racing helmet and the mascot of this site. Its name comes from "Montgomery", the real name of a racing legend.',
  'about.devTitle': 'The developer',
  'about.devText': 'Hi, I\'m Ardahan. I love playing games, and I love making them just as much. Monty Arcade is more than a game site to me. My real goal is to ship a product of my own from start to finish and gain real experience along the way. Building a website from scratch, launching it, growing it and keeping it running: I want to learn the whole thing, not just the fun parts. And I wanted to start from the place I know best. The flash game sites where I used to spend all my free time were where I first truly connected with the internet. So my first product became a modern take on those sites. I\'ll be releasing my games here, and in the devlog I\'ll share what I learn, the mistakes I make and the small wins along the way. I\'m sure there\'ll be plenty to fix on the road, but that\'s kind of the point. If you have an idea, a suggestion or found a bug, don\'t hesitate to reach out. There\'s always room on the pit crew.',
  'about.siteTitle': 'How the site is built',
  'about.siteText':
    'The site is made of static pages generated with Astro; no server, no database. Pages are light and fast, and games only load when you press "Play".',
  'about.contactTitle': 'Contact',
  'about.email': 'Email',
  'root.choose': 'Dil seç / Choose your language',
};

export const ui: Record<Lang, Record<UIKey, string>> = { tr, en };

/** Etiket çevirileri. Sözlükte olmayan etiket olduğu gibi gösterilir. */
export const tagLabels: Record<string, Record<Lang, string>> = {
  arcade: { tr: 'Arcade', en: 'Arcade' },
  puzzle: { tr: 'Bulmaca', en: 'Puzzle' },
  racing: { tr: 'Yarış', en: 'Racing' },
  action: { tr: 'Aksiyon', en: 'Action' },
  casual: { tr: 'Rahat', en: 'Casual' },
  platformer: { tr: 'Platform', en: 'Platformer' },
  'one-button': { tr: 'Tek tuş', en: 'One button' },
  board: { tr: 'Masa oyunu', en: 'Board game' },
  mobile: { tr: 'Mobil uyumlu', en: 'Mobile friendly' },
};

/** Oyun yokken gösterilen örnek etiket chip'leri (§8.7). */
export const placeholderTags = ['arcade', 'puzzle', 'racing', 'mobile'];

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (languages as readonly string[]).includes(value);
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey, vars?: Record<string, string | number>): string {
    let str = ui[lang][key] ?? ui[defaultLang][key];
    if (vars) {
      for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, String(v));
    }
    return str;
  };
}

export function tagLabel(tag: string, lang: Lang): string {
  return tagLabels[tag]?.[lang] ?? tag;
}

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(locales[lang], { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function upper(text: string, lang: Lang): string {
  return text.toLocaleUpperCase(lang);
}

export function otherLang(lang: Lang): Lang {
  return lang === 'tr' ? 'en' : 'tr';
}

/** `/tr/devlog/x` → `/en/devlog/x` */
export function switchLangPath(pathname: string, to: Lang): string {
  const parts = pathname.split('/');
  if (isLang(parts[1])) parts[1] = to;
  else return `/${to}/`;
  return parts.join('/') || `/${to}/`;
}

/** Her dil için bu sayfanın karşılığı: verilen yollar, yoksa yolun ilk parçası değiştirilir. */
export function resolveLangPaths(
  pathname: string,
  lang: Lang,
  overrides: Partial<Record<Lang, string>> = {},
): Record<Lang, string> {
  return Object.fromEntries(
    languages.map((l) => [l, overrides[l] ?? (l === lang ? pathname : switchLangPath(pathname, l))]),
  ) as Record<Lang, string>;
}

export function getStaticLangPaths() {
  return languages.map((lang) => ({ params: { lang } }));
}
