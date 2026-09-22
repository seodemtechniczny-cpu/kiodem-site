/* KIODEM — pole kafelkow w perspektywie, loader z powitaniami, panele sekcji.
   Bez frameworka: jeden plik, dane na gorze, zachowanie ponizej. */
(function () {
  'use strict';

  /* ─── dane ─────────────────────────────────────────────────────────────── */
  const I18N = {
    en: {
      tagline: 'Websites, automation and Google Ads for independent businesses.',
      hint: 'Drag or scroll in any direction',
      'nav.work': 'Work', 'nav.services': 'Services', 'nav.about': 'About', 'nav.contact': 'Contact',
      open: 'Open', visit: 'Visit the site', close: 'Close',
      workLead: 'Shops, clinics, schools and showrooms. Each one runs on its own numbers, so the work is judged by enquiries and sales, not by a launch.',
      servicesLead: 'Four things, done by one person who also answers the phone.',
      aboutTitle: 'About', aboutLead: 'KIODEM is Michał Smoliński, working from Gliwice in southern Poland with clients in Poland, the United Kingdom and Germany.',
      about: [
        'The person you write to is the person who does the work. There is no account manager and no hand-off: the brief, the build and the numbers afterwards stay with one pair of hands.',
        'Scope is fixed and written in plain terms before anything starts. Accounts, domains and tracking are set up in your name, so nothing depends on me later.',
        'Most projects begin with a short written check of one journey on your site: how a customer gets from a search to an enquiry, and where that route breaks. It costs nothing and it tells both of us whether there is a project.'
      ],
      facts: [['Based in', 'Gliwice, Poland'], ['Working in', 'English and Polish'], ['Clients in', 'Poland, UK, Germany'], ['Platforms', 'WordPress, WooCommerce, Shopify, Shoper, Shopware'], ['Measurement', 'GA4, Tag Manager, Search Console, Merchant Center']],
      contactTitle: 'Contact', contactLead: 'One email is enough. I reply within one working day.',
      mail: 'michal@kiodem.com', phone: '+48 789 350 367', linkedin: 'LinkedIn', write: 'Write to me',
      contactNote: 'Calls in English on weekdays 9 to 17 UK time. Or send the address of your site and I will come back with the short written check first.',
      sections: { work: 'Nine sites and shops, judged by enquiries', services: 'Websites, ads, measurement, automation',
                  about: 'One person does the work you talk to', contact: 'One email is enough',
                  brief: 'Six questions, two minutes, an answer from me' },
      'nav.brief': 'Brief',
      contactBrief: 'Or answer six questions and I will come back with a first take:',
      brief: {
        intro: 'Six questions, two minutes. The answer comes from me, not from a system.',
        steps: [
          { k: 'who', type: 'single', q: 'What kind of business is it?',
            opts: ['Showroom or store', 'Online shop', 'Clinic or practice', 'School or courses', 'Services', 'Something else'] },
          { k: 'what', type: 'multi', q: 'What do you need?', hint: 'Pick everything that applies.',
            opts: ['A website', 'SEO and local search', 'Google Ads', 'Measurement', 'Automation', 'Not sure yet'] },
          { k: 'state', type: 'single', q: 'Where are you now?',
            opts: ['Nothing online yet', 'A site, but few enquiries', 'Ads running, results unclear', 'Growing, it has to hold'] },
          { k: 'when', type: 'single', q: 'When?', opts: ['This month', 'This quarter', 'Just looking'] },
          { k: 'site', type: 'text', q: 'Your website, if there is one', placeholder: 'www.example.co.uk' },
          { k: 'contact', type: 'contact', q: 'Where do I reply?',
            fields: [['name', 'Name'], ['email', 'Email'], ['company', 'Company (optional)'], ['note', 'Anything else (optional)']] }
        ],
        labels: { who: 'Business', what: 'Needs', state: 'Situation', when: 'When', site: 'Website', name: 'Name', email: 'Email', company: 'Company', note: 'Note' },
        next: 'Next', back: 'Back', review: 'Review', send: 'Send the brief', copy: 'Copy the brief', copied: 'Copied', edit: 'Change answers',
        summaryTitle: 'Your brief', sent: 'Sent. I reply within one working day.',
        mailNote: 'Your mail app opens with the brief filled in. If it does not, copy the brief and paste it into an email to',
        keyHint: 'Number keys pick an answer, Enter continues.', emailError: 'An email address is needed for the reply.', skip: 'Skip'
      }
    },
    pl: {
      tagline: 'Strony, automatyzacje i Google Ads dla niezależnych firm.',
      hint: 'Przeciągnij albo przewiń w dowolną stronę',
      'nav.work': 'Realizacje', 'nav.services': 'Usługi', 'nav.about': 'O mnie', 'nav.contact': 'Kontakt',
      open: 'Otwórz', visit: 'Zobacz stronę', close: 'Zamknij',
      workLead: 'Sklepy, kliniki, szkoły i salony. Każda z tych firm działa na własnych liczbach, więc pracę ocenia się po zapytaniach i sprzedaży, nie po samym wdrożeniu.',
      servicesLead: 'Cztery rzeczy, które robi jedna osoba. Ta sama, która odbiera telefon.',
      aboutTitle: 'O mnie', aboutLead: 'KIODEM to Michał Smoliński. Pracuję z Gliwic z klientami w Polsce, Wielkiej Brytanii i Niemczech.',
      about: [
        'Osoba, do której piszesz, jest osobą, która robi robotę. Bez opiekuna klienta i bez przekazywania dalej: brief, wdrożenie i liczby po wdrożeniu zostają w jednych rękach.',
        'Zakres jest ustalony i spisany zwykłym językiem, zanim cokolwiek się zacznie. Konta, domeny i pomiar zakładam na Ciebie, więc nic nie zależy ode mnie później.',
        'Większość projektów zaczyna się od krótkiego, pisemnego sprawdzenia jednej ścieżki na Twojej stronie: jak klient przechodzi od wyszukiwania do zapytania i gdzie ta droga się urywa. To nic nie kosztuje i mówi nam obojgu, czy jest tu projekt.'
      ],
      facts: [['Siedziba', 'Gliwice'], ['Języki', 'polski i angielski'], ['Klienci', 'Polska, Wielka Brytania, Niemcy'], ['Platformy', 'WordPress, WooCommerce, Shopify, Shoper, Shopware'], ['Pomiar', 'GA4, Tag Manager, Search Console, Merchant Center']],
      contactTitle: 'Kontakt', contactLead: 'Wystarczy jeden mail. Odpisuję w ciągu jednego dnia roboczego.',
      mail: 'contact@kiodem.com', phone: '+48 789 350 367', linkedin: 'LinkedIn', write: 'Napisz do mnie',
      contactNote: 'Rozmowy w dni robocze 9–17. Albo wyślij adres swojej strony, a najpierw odeślę krótkie pisemne sprawdzenie.',
      sections: { work: 'Dziewięć stron i sklepów, ocenianych po zapytaniach', services: 'Strony, reklamy, pomiar, automatyzacje',
                  about: 'Robotę robi ta sama osoba, z którą rozmawiasz', contact: 'Wystarczy jeden mail',
                  brief: 'Sześć pytań, dwie minuty, odpowiedź ode mnie' },
      'nav.brief': 'Brief',
      contactBrief: 'Albo odpowiedz na sześć pytań, a wrócę z pierwszą oceną:',
      brief: {
        intro: 'Sześć pytań, dwie minuty. Odpowiedź przychodzi ode mnie, nie z systemu.',
        steps: [
          { k: 'who', type: 'single', q: 'Jaka to firma?',
            opts: ['Salon lub sklep stacjonarny', 'Sklep internetowy', 'Klinika lub gabinet', 'Szkoła lub kursy', 'Usługi', 'Coś innego'] },
          { k: 'what', type: 'multi', q: 'Czego potrzebujesz?', hint: 'Zaznacz wszystko, co pasuje.',
            opts: ['Strony', 'SEO i wyszukiwania lokalnego', 'Google Ads', 'Pomiaru', 'Automatyzacji', 'Jeszcze nie wiem'] },
          { k: 'state', type: 'single', q: 'Na jakim etapie jesteś?',
            opts: ['Nic jeszcze nie ma w sieci', 'Jest strona, mało zapytań', 'Reklamy działają, wyniki niejasne', 'Rośniemy, ma to wytrzymać'] },
          { k: 'when', type: 'single', q: 'Kiedy?', opts: ['W tym miesiącu', 'W tym kwartale', 'Na razie się rozglądam'] },
          { k: 'site', type: 'text', q: 'Twoja strona, jeśli jest', placeholder: 'www.przyklad.pl' },
          { k: 'contact', type: 'contact', q: 'Gdzie mam odpisać?',
            fields: [['name', 'Imię i nazwisko'], ['email', 'E-mail'], ['company', 'Firma (opcjonalnie)'], ['note', 'Coś jeszcze (opcjonalnie)']] }
        ],
        labels: { who: 'Firma', what: 'Potrzeby', state: 'Etap', when: 'Kiedy', site: 'Strona', name: 'Imię i nazwisko', email: 'E-mail', company: 'Firma', note: 'Uwagi' },
        next: 'Dalej', back: 'Wstecz', review: 'Podsumowanie', send: 'Wyślij brief', copy: 'Skopiuj brief', copied: 'Skopiowane', edit: 'Zmień odpowiedzi',
        summaryTitle: 'Twój brief', sent: 'Wysłane. Odpisuję w ciągu jednego dnia roboczego.',
        mailNote: 'Otworzy się Twój program pocztowy z wypełnionym briefem. Jeśli nie, skopiuj brief i wklej go do maila na',
        keyHint: 'Klawisze z cyframi wybierają odpowiedź, Enter idzie dalej.', emailError: 'Do odpowiedzi potrzebny jest adres e-mail.', skip: 'Pomiń'
      }
    }
  };

  const WORK = [
    { id: 'electric-studio', name: 'Electric Studio', url: 'https://sklepelectricstudio.pl/', img: 'electric-studio',
      sector: { en: 'E-bike and e-moto shop, Poland', pl: 'Sklep z e-rowerami i e-moto' },
      what: { en: 'Shop theme on Shoper, product data and purchase tracking, Google Ads with Merchant Center, supplier integrations.',
              pl: 'Szablon sklepu na Shoper, dane produktów i pomiar zakupów, Google Ads z Merchant Center, integracje z hurtowniami.' } },
    { id: 'rehamedica', name: 'RehaMedica', url: 'https://wprehamedica.com/', img: 'rehamedica',
      sector: { en: 'Physiotherapy clinic', pl: 'Klinika fizjoterapii' },
      what: { en: 'WordPress website and hosting, technical SEO, measurement and the Google Business Profile.',
              pl: 'Strona na WordPressie i hosting, SEO techniczne, pomiar i wizytówka Google.' } },
    { id: 'porto-alegre', name: 'Porto Alegre', url: 'https://portoalegre-gliwice.pl/', img: 'porto-alegre',
      sector: { en: 'Language school, Gliwice', pl: 'Szkoła językowa, Gliwice' },
      what: { en: 'SEO and Google Ads with call measurement, so enquiries by phone count like enquiries by form.',
              pl: 'SEO i Google Ads z pomiarem rozmów, żeby telefon liczył się tak samo jak formularz.' } },
    { id: 'level', name: 'LEVEL', url: 'https://www.level.edu.pl/', img: 'level',
      sector: { en: 'Language school, three locations', pl: 'Szkoła językowa, trzy filie' },
      what: { en: 'Google Ads rebuilt around enquiries rather than clicks, SEO on Squarespace.',
              pl: 'Google Ads przebudowane pod zapytania zamiast kliknięć, SEO na Squarespace.' } },
    { id: 'lepimy', name: 'Lepimy', url: 'https://pierogarnialepimy.pl/', img: 'lepimy',
      sector: { en: 'Pierogi restaurant', pl: 'Pierogarnia' },
      what: { en: 'Search review, page speed and the Google Business Profile.',
              pl: 'Przegląd widoczności, szybkość strony i wizytówka Google.' } },
    { id: 'meume', name: 'MEUME', url: 'https://meumedesign.com/', img: 'meume',
      sector: { en: 'Design studio', pl: 'Studio projektowe' },
      what: { en: 'WordPress website designed and built, with the animated scene on the home page.',
              pl: 'Strona na WordPressie od projektu po wdrożenie, z animowaną sceną na stronie głównej.' } },
    { id: 'gartendekor', name: 'Gartendekor Lippstadt', url: 'https://www.gartendekor-lippstadt.de/', img: 'gartendekor',
      sector: { en: 'Garden décor shop and showroom, Germany', pl: 'Sklep i salon z dekoracjami ogrodowymi, Niemcy' },
      what: { en: 'Google Ads for a Shopware shop with a showroom, plus competitor price research for the German market.',
              pl: 'Google Ads dla sklepu na Shopware z salonem, plus badanie cen konkurencji na rynku niemieckim.' } },
    { id: 'voltgo', name: 'VoltGo', url: 'https://voltgo.pl/', img: 'voltgo',
      sector: { en: 'E-mobility shop', pl: 'Sklep z e-mobilnością' },
      what: { en: 'Storefront work on a custom CMS: cart logic and product pages.',
              pl: 'Prace na froncie sklepu na autorskim CMS: logika koszyka i karty produktów.' } },
    { id: 'kiokuya', name: 'KIOKUYA', url: 'https://kiokuya.com/', img: 'kiokuya',
      sector: { en: 'Own product: CRM for vehicle dealers', pl: 'Własny produkt: CRM dla dealerów pojazdów' },
      what: { en: 'Customer records, invoicing and fleet documents in one place, built in Python.',
              pl: 'Klienci, faktury i dokumenty floty w jednym miejscu, napisane w Pythonie.' } }
  ];

  const SERVICES = [
    { id: 'websites', title: { en: 'Websites', pl: 'Strony' },
      line: { en: 'Built to be found and to take an enquiry', pl: 'Zbudowane, żeby dało się je znaleźć i zapytać' },
      text: { en: 'WordPress and WooCommerce builds, storefront work on Shopify, Shoper and Shopware, location pages for showrooms, page speed and clean code that a shop owner can keep running.',
              pl: 'Wdrożenia na WordPressie i WooCommerce, prace w sklepach na Shopify, Shoper i Shopware, strony lokalizacji dla salonów, szybkość i czysty kod, który właściciel sklepu utrzyma sam.' } },
    { id: 'seo', title: { en: 'SEO and local search', pl: 'SEO i wyszukiwanie lokalne' }, chart: 'seo',
      line: { en: 'Found for what people actually type', pl: 'Widoczne pod to, co ludzie naprawdę wpisują' },
      text: { en: 'Search is where a showroom, a clinic or a school gets most of its new enquiries. The work is unglamorous and it compounds: fix what stops Google from reading the site, write the pages people are looking for, keep the Business Profile alive.',
              pl: 'Wyszukiwarka daje salonowi, klinice czy szkole większość nowych zapytań. Ta praca nie jest efektowna, ale się sumuje: usunąć to, co przeszkadza Google czytać stronę, napisać strony, których ludzie szukają, utrzymać wizytówkę przy życiu.' },
      details: {
        en: ['Technical base first: indexing, sitemap, speed and Core Web Vitals, structured data, hreflang on two-language sites.',
             'One page per service and per location, with the address, hours, directions and real photos. No town pages that only swap the name.',
             'Google Business Profile kept current: categories, services, photos, posts, and an answer to every review.',
             'Search Console read every month. Queries with many impressions and few clicks are the pages to fix next.',
             'No promised positions and no bought links. The report shows queries, clicks and enquiries, not a ranking score.'],
        pl: ['Najpierw podstawa techniczna: indeksowanie, mapa strony, szybkość i Core Web Vitals, dane strukturalne, hreflang przy dwóch językach.',
             'Osobna strona dla każdej usługi i lokalizacji, z adresem, godzinami, dojazdem i prawdziwymi zdjęciami. Bez podstron miast, które różnią się tylko nazwą.',
             'Wizytówka Google na bieżąco: kategorie, usługi, zdjęcia, wpisy i odpowiedź na każdą opinię.',
             'Search Console czytana co miesiąc. Zapytania z wieloma wyświetleniami i małą liczbą kliknięć to strony do poprawy w pierwszej kolejności.',
             'Bez obiecywania pozycji i bez kupowania linków. Raport pokazuje zapytania, kliknięcia i zapytania ofertowe, nie „wynik SEO”.'] } },
    { id: 'ads', title: { en: 'Google Ads', pl: 'Google Ads' }, chart: 'ads',
      line: { en: 'Campaigns judged by enquiries, not clicks', pl: 'Kampanie oceniane po zapytaniach, nie po kliknięciach' },
      text: { en: 'A click is a cost. An enquiry is the point. Every account is set up so that the two can be told apart, by campaign, by location and by product, and the budget follows the enquiries.',
              pl: 'Kliknięcie to koszt. Zapytanie to cel. Każde konto jest ustawione tak, żeby dało się je rozróżnić po kampanii, lokalizacji i produkcie, a budżet szedł za zapytaniami.' },
      details: {
        en: ['Campaigns split by intent: brand, service plus town, generic. Each group gets its own budget and its own numbers.',
             'Search terms reviewed weekly. Irrelevant ones are excluded before they eat the budget.',
             'Conversions are enquiries: forms, calls, WhatsApp clicks and directions, counted once and by location.',
             'Budget follows impression share and enquiries per group, never clicks.',
             'Shopping and Merchant Center for shops: feed health, disapprovals, prices in step with the shop.',
             'A monthly note in plain words: what changed, what it did, what happens next.'],
        pl: ['Kampanie podzielone według intencji: marka, usługa plus miasto, ogólne. Każda grupa ma własny budżet i własne liczby.',
             'Wyszukiwane frazy przeglądane co tydzień. Nietrafione wykluczane, zanim zjedzą budżet.',
             'Konwersje to zapytania: formularze, telefony, kliknięcia w WhatsApp i dojazd, liczone raz i po lokalizacji.',
             'Budżet idzie za udziałem w wyświetleniach i zapytaniami w grupie, nigdy za kliknięciami.',
             'Shopping i Merchant Center dla sklepów: kondycja feedu, odrzucenia, ceny zgodne ze sklepem.',
             'Co miesiąc notatka zwykłym językiem: co się zmieniło, co to dało, co dalej.'] } },
    { id: 'measurement', title: { en: 'Measurement', pl: 'Pomiar' },
      line: { en: 'Numbers that agree with each other', pl: 'Liczby, które się ze sobą zgadzają' },
      text: { en: 'GA4, Tag Manager and consent mode, Merchant Center and Search Console, set up so the shop, the ads and the reports count the same sale once.',
              pl: 'GA4, Tag Manager i tryb zgody, Merchant Center i Search Console, ustawione tak, żeby sklep, reklamy i raporty liczyły tę samą sprzedaż raz.' } },
    { id: 'automation', title: { en: 'Automation', pl: 'Automatyzacje' },
      line: { en: 'Small programs that run unattended', pl: 'Małe programy, które działają bez nadzoru' },
      text: { en: 'Python integrations: supplier feeds and stock, invoicing and CRM, price checks, monitoring and reports. Written for your setup, left with the code.',
              pl: 'Integracje w Pythonie: feedy i stany hurtowni, faktury i CRM, sprawdzanie cen, monitoring i raporty. Pisane pod Twoje narzędzia, zostają z kodem.' } }
  ];

  // Wykresy: przyklady, nie wyniki klientow - podpis mowi to wprost. Jedna skala na wykres,
  // dwie serie roznia sie jasnoscia i sa nazwane w legendzie; wiersz z "duzo wyswietlen,
  // malo klikniec" dostaje kreskowanie, nie kolor.
  const CHARTS = {
    ads: {
      title: { en: 'Example account, one month: share of spend against share of enquiries',
               pl: 'Przykładowe konto, jeden miesiąc: udział w wydatkach i udział w zapytaniach' },
      legend: { en: ['Share of spend', 'Share of enquiries'], pl: ['Udział w wydatkach', 'Udział w zapytaniach'] },
      caption: { en: 'The two bars should look alike. Where spend outruns enquiries, budget moves to the rows above.',
                 pl: 'Oba słupki powinny wyglądać podobnie. Tam, gdzie wydatki wyprzedzają zapytania, budżet przechodzi do wierszy wyżej.' },
      rows: [
        { label: { en: 'Service + town', pl: 'Usługa + miasto' }, a: 22, b: 46 },
        { label: { en: 'Brand', pl: 'Marka' }, a: 8, b: 24 },
        { label: { en: 'Generic', pl: 'Ogólne' }, a: 31, b: 22 },
        { label: { en: 'Competitor names', pl: 'Nazwy konkurencji' }, a: 14, b: 5 },
        { label: { en: 'Irrelevant', pl: 'Nietrafione' }, a: 25, b: 3 }
      ]
    },
    seo: {
      title: { en: 'Example Search Console, one month: impressions per query',
               pl: 'Przykładowa Search Console, jeden miesiąc: wyświetlenia na zapytanie' },
      legend: { en: ['Impressions', 'Many impressions, few clicks: fix this page next'],
                pl: ['Wyświetlenia', 'Dużo wyświetleń, mało kliknięć: ta strona do poprawy'] },
      caption: { en: 'Hover a row for clicks, click-through rate and average position.',
                 pl: 'Najedź na wiersz, żeby zobaczyć kliknięcia, CTR i średnią pozycję.' },
      rows: [
        { label: { en: 'kitchens gliwice', pl: 'kuchnie gliwice' }, imp: 1240, clicks: 61, pos: 3.1 },
        { label: { en: 'kitchen showroom silesia', pl: 'salon kuchni śląsk' }, imp: 980, clicks: 9, pos: 8.4 },
        { label: { en: 'fitted kitchens price', pl: 'kuchnie na wymiar cena' }, imp: 860, clicks: 38, pos: 4.0 },
        { label: { en: 'german kitchens', pl: 'kuchnie niemieckie' }, imp: 720, clicks: 5, pos: 9.1 },
        { label: { en: 'kitchen design consultation', pl: 'projekt kuchni konsultacja' }, imp: 410, clicks: 27, pos: 2.6 },
        { label: { en: 'kitchen showroom opening hours', pl: 'salon kuchni godziny otwarcia' }, imp: 300, clicks: 2, pos: 6.8 }
      ]
    }
  };

  const GREETINGS = ['Welcome', 'Witamy', 'Willkommen', 'Bienvenue', 'Bienvenido', 'Benvenuti', 'Välkommen',
    'Welkom', 'Bem-vindo', 'Vítejte', 'Tervetuloa', 'ようこそ', '환영합니다', 'Καλώς ήρθατε', 'Ласкаво просимо'];

  /* ─── stan ─────────────────────────────────────────────────────────────── */
  const $ = (s) => document.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  let lang = (function () {
    try { const s = localStorage.getItem('kiodem-lang'); if (s === 'en' || s === 'pl') return s; } catch (e) {}
    return /^pl/i.test(navigator.language || '') ? 'pl' : 'en';
  })();
  const t = (k) => I18N[lang][k];

  const viewport = $('#viewport'), field = $('#field'), hero = $('#hero'), hint = $('#hint');
  const panel = $('#panel'), panelBody = $('#panel-body'), panelTitle = $('#panel-title');

  /* ─── pole: siatka, ktora zawija sie w kazda strone ────────────────────── */
  const F = { ox: 0, oy: 0, tx: 0, ty: 0, vx: 0, vy: 0, rx: 0, ry: 0, prx: 0, pry: 0,
              cw: 224, ch: 168, cols: 0, rows: 0, W: 0, H: 0, tiles: [], dragging: false, moved: false,
              lastX: 0, lastY: 0, lastT: 0, idle: 0, entering: false, dirty: true,
              paused: false, dock: 0, docked: false };

  const hash = (a, b) => { let h = (a * 73856093) ^ (b * 19349663); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const wrap = (v, size) => ((v % size) + size) % size - size / 2;

  function pool() {
    const L = I18N[lang];
    const items = [];
    ['work', 'services', 'about', 'contact', 'brief'].forEach((id) =>
      items.push({ kind: 'section', w: 236, h: 150, to: id, text: L['nav.' + id], sub: L.sections[id] }));
    WORK.forEach((w) => items.push({ kind: 'work', w: 196, h: 130, data: w }));
    SERVICES.forEach((s) => items.push({ kind: 'service', w: 186, h: 124, data: s }));
    // deterministyczne przetasowanie - te same pozycje przy kazdym wejsciu
    let seed = 7;
    for (let i = items.length - 1; i > 0; i--) { seed = (seed * 9301 + 49297) % 233280; const j = Math.floor(seed / 233280 * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    return items;
  }

  function tileHTML(it) {
    if (it.kind === 'work') {
      const w = it.data;
      return '<img src="assets/work/' + w.img + '-bw.webp" alt="" loading="lazy" onload="this.classList.add(\'is-loaded\')" onerror="this.remove()">' +
             '<div class="tile__cap"><div class="tile__t">' + w.name + '</div><div class="tile__s">' + w.sector[lang] + '</div></div>';
    }
    if (it.kind === 'service') return '<div class="tile__t">' + it.data.title[lang] + '</div><div class="tile__s">' + it.data.line[lang] + '</div>';
    return '<div class="tile__t">' + it.text + '</div><div class="tile__s">' + it.sub + '</div>';
  }

  function build() {
    const mobile = innerWidth <= 820;
    F.cw = mobile ? 200 : 300; F.ch = mobile ? 156 : 230;
    F.cols = Math.ceil(innerWidth / F.cw) + 3; F.rows = Math.ceil(innerHeight / F.ch) + 3;
    if (F.cols % 2 === 0) F.cols++; if (F.rows % 2 === 0) F.rows++;
    F.W = F.cols * F.cw; F.H = F.rows * F.ch;
    const items = pool();
    const scale = mobile ? 0.78 : 1;
    field.innerHTML = '';
    F.tiles = [];
    let k = 0;
    for (let r = 0; r < F.rows; r++) for (let c = 0; c < F.cols; c++) {
      const it = items[k % items.length]; k++;
      const h1 = hash(c + 1, r + 1), h2 = hash(r + 7, c + 3), h3 = hash(c * 3 + 1, r * 5 + 2);
      const w = Math.round(it.w * scale), h = Math.round(it.h * scale);
      const jx = (h1 - .5) * (F.cw - w - 10), jy = (h2 - .5) * (F.ch - h - 10);
      const band = h3 < .34 ? -260 : h3 < .72 ? -90 : 40;          // trzy plany glebi
      const el = document.createElement('button');
      el.className = 'tile tile--' + it.kind;
      el.type = 'button'; el.innerHTML = tileHTML(it);
      el.style.width = w + 'px'; el.style.height = h + 'px';
      const tile = { el, it, px: c * F.cw + F.cw / 2, py: r * F.ch + F.ch / 2, jx, jy, w, h,
                     z: band + (h1 - .5) * 40, rot: (h2 - .5) * 3, hover: 0, enter: F.entering ? 1 : 0 };
      tile.base = band === -260 ? .55 : band === -90 ? .82 : 1;
      // odleglosc od srodka przy starcie: blizsze laduja pierwsze, dalsze dolatuja pozniej
      tile.d0 = Math.hypot(wrap(tile.px, F.W) + jx, wrap(tile.py, F.H) + jy);
      el.addEventListener('pointerenter', () => { tile.hover = 1; renderTile(tile); });
      el.addEventListener('pointerleave', () => { tile.hover = 0; renderTile(tile); });
      el.addEventListener('click', (e) => { if (F.moved) { e.preventDefault(); return; } openFromTile(it); });
      field.appendChild(el);
      F.tiles.push(tile);
    }
    F.dirty = true;
  }

  // Kafelki blisko srodka gasna: logotyp i jedno zdanie pod nim maja miec spokoj,
  // a pole wyglada, jakby mialo glebie ostrosci wokol znaku.
  function centreFade(cx, cy) {
    const r = Math.hypot(cx / (F.W > 1200 ? 1.35 : 1.1), cy);
    const d = F.dock;                                   // 0 = logo w srodku, 1 = logo u gory
    const lo = F.cw * (1.15 - 0.95 * d), hi = F.cw * (2.4 - 1.7 * d);
    const k = clamp((r - lo) / (hi - lo), 0, 1);
    return k * k * (3 - 2 * k);
  }
  function renderTile(tl) {
    const wx = wrap(tl.px + F.ox, F.W) + tl.jx, wy = wrap(tl.py + F.oy, F.H) + tl.jy;
    // start lotu: ten sam kierunek co miejsce docelowe, ale poza krawedzia ekranu i glebiej
    const e = tl.enter;
    const sx = wx * 1.6 + Math.sign(wx || 1) * innerWidth * 0.6;
    const sy = wy * 1.6 + Math.sign(wy || 1) * innerHeight * 0.6;
    const x = lerp(wx, sx, e) - tl.w / 2, y = lerp(wy, sy, e) - tl.h / 2;
    const z = tl.z + (tl.hover ? 46 : 0) - 520 * e;
    const s = tl.hover ? 1.04 : 1;
    tl.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateZ(' + tl.rot.toFixed(2) + 'deg) scale(' + s + ')';
    const fade = Math.round((0.12 + 0.88 * centreFade(wx, wy)) * tl.base * (1 - tl.enter) * 100) / 100;
    if (fade !== tl.lastFade) {                          // zapis stylu tylko gdy wartosc sie zmienia
      tl.el.style.opacity = fade;
      const pe = fade < 0.35 ? 'none' : '';
      if (pe !== tl.lastPe) { tl.el.style.pointerEvents = pe; tl.lastPe = pe; }
      tl.lastFade = fade;
    }
  }

  function frame(now) {
    if (F.paused) { requestAnimationFrame(frame); return; }
    const k = 0.11;
    const dockT = F.docked ? 1 : 0;
    if (Math.abs(F.dock - dockT) > 0.001) { F.dock = lerp(F.dock, dockT, 0.06); F.dirty = true; }
    F.ox = lerp(F.ox, F.tx, k); F.oy = lerp(F.oy, F.ty, k);
    const dx = F.tx - F.ox, dy = F.ty - F.oy;
    const moving = Math.abs(dx) + Math.abs(dy) > 0.05;
    if (!F.dragging) {                                   // bezwladnosc po puszczeniu
      F.tx += F.vx; F.ty += F.vy; F.vx *= 0.94; F.vy *= 0.94;
      if (Math.abs(F.vx) < 0.02) F.vx = 0; if (Math.abs(F.vy) < 0.02) F.vy = 0;
    }
    // przechyl pola od ruchu (kamera plynie za przeciaganiem) + lekki oddech w spoczynku
    const tRx = clamp(-dy * 0.06, -9, 9), tRy = clamp(dx * 0.06, -9, 9);
    F.rx = lerp(F.rx, tRx, 0.08); F.ry = lerp(F.ry, tRy, 0.08);
    const breath = reduced ? 0 : Math.sin(now / 2600) * 1.2;
    field.style.transform = 'rotateX(' + (F.rx + F.prx + breath).toFixed(3) + 'deg) rotateY(' + (F.ry + F.pry).toFixed(3) + 'deg)';
    if (moving || F.dirty || F.entering) { for (const tl of F.tiles) renderTile(tl); F.dirty = false; }
    requestAnimationFrame(frame);
  }

  /* wejscie: przeciaganie, kolko, dotyk, klawiatura */
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('.tile') && false) return;
    F.dragging = true; F.moved = false; F.vx = F.vy = 0;
    F.lastX = e.clientX; F.lastY = e.clientY; F.lastT = performance.now();
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', (e) => {
    if (F.dragging) {
      const dx = e.clientX - F.lastX, dy = e.clientY - F.lastY, now = performance.now();
      const dt = Math.max(1, now - F.lastT);
      F.tx += dx; F.ty += dy;
      F.vx = lerp(F.vx, dx / dt * 14, 0.5); F.vy = lerp(F.vy, dy / dt * 14, 0.5);
      if (Math.abs(dx) + Math.abs(dy) > 2) { F.moved = true; hideHint(); dock(true); }
      F.lastX = e.clientX; F.lastY = e.clientY; F.lastT = now;
    } else if (!coarse) {                                 // kamera lekko za kursorem
      F.pry = (e.clientX / innerWidth - .5) * 5; F.prx = -(e.clientY / innerHeight - .5) * 5;
    }
  });
  const endDrag = () => { if (!F.dragging) return; F.dragging = false; viewport.classList.remove('is-dragging'); setTimeout(() => { F.moved = false; }, 0); };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const m = e.deltaMode === 1 ? 16 : 1;
    F.tx -= e.deltaX * m * 0.9; F.ty -= e.deltaY * m * 0.9;
    hideHint(); dock(true);
  }, { passive: false });
  document.addEventListener('keydown', (e) => {
    if (panel.classList.contains('is-open')) {
      if (e.key === 'Escape') { closePanel(); return; }
      const typing = /^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '');
      if (current === 'brief' && !typing) {
        if (/^[1-9]$/.test(e.key)) { Brief.pick(+e.key - 1); e.preventDefault(); }
        else if (e.key === 'Enter') { Brief.next(); e.preventDefault(); }
      } else if (current === 'brief' && e.key === 'Enter' && document.activeElement.tagName === 'INPUT') { Brief.next(); e.preventDefault(); }
      return;
    }
    const step = 180;
    if (e.key === 'ArrowLeft') F.tx += step; else if (e.key === 'ArrowRight') F.tx -= step;
    else if (e.key === 'ArrowUp') F.ty += step; else if (e.key === 'ArrowDown') F.ty -= step;
    else if (e.key === 'Home') { F.tx = F.ty = 0; dock(false); e.preventDefault(); return; } else return;
    e.preventDefault(); hideHint(); dock(true);
  });
  let resizeT; addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(build, 150); });

  let hintHidden = false;
  function hideHint() { if (hintHidden) return; hintHidden = true; hint.classList.add('is-hidden'); }

  /* Logo: w srodku na start, po pierwszym ruchu pola wedruje do gory i maleje - pole dostaje
     caly ekran. Klik w znak (albo Home) sprowadza je z powrotem. */
  function dock(on) {
    if (F.docked === on) return;
    F.docked = on;
    if (reduced || !window.gsap) { hero.classList.toggle('is-docked', on); return; }
    const top = parseFloat(getComputedStyle($('.top')).paddingTop) || 18;
    gsap.to(hero, { top: on ? top + 'px' : '50%', yPercent: on ? 0 : -50, scale: on ? 0.28 : 1,
                    duration: 1, ease: 'expo.out', overwrite: 'auto' });
    gsap.to([$('.hero__line'), hint], { opacity: on ? 0 : 1, duration: .35, overwrite: 'auto' });
  }

  /* ─── panele ───────────────────────────────────────────────────────────── */
  let current = null, lastFocus = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function renderPanel(name) {
    const L = I18N[lang];
    if (name === 'work') {
      panelTitle.textContent = L['nav.work'];
      return '<p class="lead">' + L.workLead + '</p>' + WORK.map((w) =>
        '<article class="case" id="case-' + w.id + '">' +
        '<img class="case__thumb" src="assets/work/' + w.img + '.webp" alt="" loading="lazy" onload="this.classList.add(\'is-loaded\')" onerror="this.remove()">' +
        '<h3 class="display">' + esc(w.name) + '</h3><p class="case__meta">' + esc(w.sector[lang]) + '</p>' +
        '<p class="case__what">' + esc(w.what[lang]) + '</p>' +
        '<a class="case__link" href="' + w.url + '" target="_blank" rel="noopener">' + L.visit + '</a></article>').join('');
    }
    if (name === 'services') {
      panelTitle.textContent = L['nav.services'];
      return '<p class="lead">' + L.servicesLead + '</p>' + SERVICES.map((s) =>
        '<article class="service" id="service-' + s.id + '"><h3 class="display">' + esc(s.title[lang]) + '</h3>' +
        '<p><strong style="color:var(--ivory);font-weight:500">' + esc(s.line[lang]) + '.</strong> ' + esc(s.text[lang]) + '</p>' +
        (s.details ? '<ul class="list">' + s.details[lang].map((d) => '<li>' + esc(d) + '</li>').join('') + '</ul>' : '') +
        (s.chart ? '<figure class="chart" data-chart="' + s.chart + '"></figure>' : '') + '</article>').join('');
    }
    if (name === 'about') {
      panelTitle.textContent = L.aboutTitle;
      return '<p class="lead">' + L.aboutLead + '</p>' + L.about.map((p) => '<p>' + p + '</p>').join('') +
        '<dl class="facts">' + L.facts.map((f) => '<dt>' + f[0] + '</dt><dd>' + f[1] + '</dd>').join('') + '</dl>';
    }
    if (name === 'brief') {
      panelTitle.textContent = L['nav.brief'];
      return '<p class="lead">' + L.brief.intro + '</p><div class="brief" id="brief" data-nodecode><div class="brief__progress"></div><div class="brief__stage"></div></div>';
    }
    panelTitle.textContent = L.contactTitle;
    return '<p class="lead">' + L.contactLead + '</p>' +
      '<a class="contact__mail display" href="mailto:' + L.mail + '">' + L.mail + '</a>' +
      '<div class="contact__rows"><a href="tel:+48789350367">' + L.phone + '</a>' +
      '<a href="https://www.linkedin.com/in/michal-smolinski" target="_blank" rel="noopener">' + L.linkedin + '</a></div>' +
      '<a class="btn" href="mailto:' + L.mail + '?subject=KIODEM">' + L.write + '</a>' +
      '<p class="contact__note">' + L.contactNote + '</p>' +
      '<p class="contact__note">' + L.contactBrief + ' <button type="button" class="link" data-open="brief">' + L['nav.brief'] + '</button></p>';
  }

  /* Tekst jak kod: cyfry, ktore znak po znaku staja sie literami. Dziala na wezlach tekstu,
     wiec znaczniki (pogrubienia, linki) zostaja na miejscu. */
  const CODE = '0123456789';
  let decodeRuns = 0;
  function decode(root, hold) {
    if (reduced || !root || root.hasAttribute('data-nodecode')) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n; (n = walker.nextNode());) if (n.nodeValue.trim() && !n.parentElement.closest('svg, table, [data-nodecode]')) nodes.push({ n, text: n.nodeValue });
    if (!nodes.length) return;
    const run = ++decodeRuns, t0 = performance.now() + (hold || 0);
    // gdy klatki nie przychodza (karta w tle, slaba maszyna), tekst i tak wraca do liter
    setTimeout(() => { if (root.dataset.decodeRun === String(run)) for (const it of nodes) it.n.nodeValue = it.text; }, (hold || 0) + 1600);
    let lastTick = 0;
    const step = (now) => {
      if (root.dataset.decodeRun !== String(run)) return;
      if (now - lastTick < 40) { requestAnimationFrame(step); return; }
      lastTick = now;
      let done = true;
      for (const it of nodes) {
        const dur = 420 + Math.min(900, it.text.length * 7);
        const k = clamp((now - t0) / dur, 0, 1);
        if (k < 1) done = false;
        const cut = Math.floor(k * it.text.length);
        let out = '';
        for (let i = 0; i < it.text.length; i++) {
          const ch = it.text[i];
          out += (i < cut || /\s/.test(ch)) ? ch : CODE[(Math.random() * CODE.length) | 0];
        }
        it.n.nodeValue = out;
      }
      if (!done) requestAnimationFrame(step);
    };
    root.dataset.decodeRun = String(run);
    for (const it of nodes) it.n.nodeValue = it.text.replace(/\S/g, () => CODE[(Math.random() * CODE.length) | 0]);
    requestAnimationFrame(step);
  }

  /* Wykresy: cienkie poziome slupki w SVG, rysuja sie od zera, wiersz pod kursorem pokazuje
     wartosci, reszta przygasa. Tabela dla czytnikow ekranu obok. */
  const fmt = (n) => n.toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-GB');
  function renderChart(fig) {
    const kind = fig.dataset.chart, C = CHARTS[kind], grouped = kind === 'ads';
    const narrow = (fig.clientWidth || panelBody.clientWidth || innerWidth) < 480;
    const W = 640, LBL = narrow ? 0 : 214, VAL = narrow ? 96 : 70, AREA = W - LBL - VAL;
    const rh = narrow ? (grouped ? 70 : 58) : (grouped ? 44 : 34), top = 8, H = top + C.rows.length * rh + 6;
    const max = grouped ? Math.max(...C.rows.map((r) => Math.max(r.a, r.b))) : Math.max(...C.rows.map((r) => r.imp));
    const bx = (v) => (v / max) * AREA;
    const dec = (n) => n.toFixed(1).replace('.', lang === 'pl' ? ',' : '.');
    let svg = '<svg class="' + (narrow ? 'is-narrow' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<defs><pattern id="hatch-' + kind + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<line x1="0" y1="0" x2="0" y2="6" class="hatch"/></pattern></defs>';
    let table = '<table class="sr-only"><thead><tr><th>' + esc(C.legend[lang][0]) + '</th>' +
      (grouped ? '<th>' + esc(C.legend[lang][1]) + '</th>' : '<th>clicks</th><th>CTR</th><th>pos.</th>') + '</tr></thead><tbody>';
    const infos = [];
    C.rows.forEach((r, i) => {
      const y = top + i * rh, lab = esc(r.label[lang]);
      const ly = narrow ? y + 20 : y + (grouped ? 26 : 21);      // etykieta: nad slupkiem albo w kolumnie
      const by = narrow ? y + 30 : y + (grouped ? 10 : 12);      // pierwszy slupek
      let info;
      if (grouped) {
        info = r.label[lang] + ': ' + r.a + '% ' + (lang === 'pl' ? 'wydatków' : 'of spend') + ', ' + r.b + '% ' + (lang === 'pl' ? 'zapytań' : 'of enquiries');
        svg += '<g class="row' + (i === 0 ? ' is-on' : '') + '" tabindex="0" data-i="' + i + '" aria-label="' + esc(info) + '">' +
          '<text class="lbl" x="0" y="' + ly + '">' + lab + '</text>' +
          '<rect class="bar bar-a" x="' + LBL + '" y="' + by + '" width="' + bx(r.a).toFixed(1) + '" height="10"/>' +
          '<rect class="bar bar-b" x="' + LBL + '" y="' + (by + 12) + '" width="' + bx(r.b).toFixed(1) + '" height="10"/>' +
          '<text class="val" x="' + (LBL + bx(r.a) + 8).toFixed(1) + '" y="' + (by + 9) + '">' + r.a + '%</text>' +
          '<text class="val" x="' + (LBL + bx(r.b) + 8).toFixed(1) + '" y="' + (by + 21) + '">' + r.b + '%</text></g>';
        table += '<tr><td>' + lab + '</td><td>' + r.a + '%</td><td>' + r.b + '%</td></tr>';
      } else {
        const ctr = r.clicks / r.imp * 100, weak = ctr < 1.5;
        info = r.label[lang] + ': ' + fmt(r.imp) + (lang === 'pl' ? ' wyświetleń, ' : ' impressions, ') + fmt(r.clicks) +
               (lang === 'pl' ? ' kliknięć, CTR ' : ' clicks, CTR ') + dec(ctr) + '%, ' + (lang === 'pl' ? 'pozycja ' : 'position ') + dec(r.pos);
        svg += '<g class="row' + (weak ? ' is-weak' : '') + (i === 0 ? ' is-on' : '') + '" tabindex="0" data-i="' + i + '" aria-label="' + esc(info) + '">' +
          '<text class="lbl" x="0" y="' + ly + '">' + lab + '</text>' +
          '<rect class="bar bar-b' + (weak ? ' bar-h' : '') + '" x="' + LBL + '" y="' + by + '" width="' + bx(r.imp).toFixed(1) + '" height="12"' + (weak ? ' fill="url(#hatch-' + kind + ')"' : '') + '/>' +
          '<text class="val" x="' + (LBL + bx(r.imp) + 8).toFixed(1) + '" y="' + (by + 10) + '">' + fmt(r.imp) + '</text></g>';
        table += '<tr><td>' + lab + '</td><td>' + r.imp + '</td><td>' + r.clicks + '</td><td>' + ctr.toFixed(1) + '%</td><td>' + r.pos + '</td></tr>';
      }
      infos.push(info);
    });
    svg += '<line class="base" x1="' + LBL + '" y1="' + top + '" x2="' + LBL + '" y2="' + (H - 6) + '"/></svg>';
    table += '</tbody></table>';
    const legend = '<div class="chart__legend"><span><i class="sw ' + (grouped ? 'sw-a' : 'sw-b') + '"></i>' + esc(C.legend[lang][0]) + '</span>' +
      '<span><i class="sw ' + (grouped ? 'sw-b' : 'sw-h') + '"></i>' + esc(C.legend[lang][1]) + '</span></div>';
    fig.innerHTML = '<p class="chart__title">' + esc(C.title[lang]) + '</p>' + svg +
      '<p class="chart__readout" aria-live="polite">' + esc(infos[0]) + '</p>' + legend +
      '<figcaption>' + esc(C.caption[lang]) + '</figcaption>' + table;
    const readout = fig.querySelector('.chart__readout');
    fig.querySelectorAll('.row').forEach((g) => {
      const show = () => { readout.textContent = infos[+g.dataset.i]; fig.querySelectorAll('.row.is-on').forEach((x) => x.classList.remove('is-on')); g.classList.add('is-on'); };
      g.addEventListener('pointerenter', show); g.addEventListener('focus', show); g.addEventListener('click', show);
    });
    if (!reduced && window.gsap) gsap.set(fig.querySelectorAll('.bar'), { scaleX: 0, transformOrigin: '0% 50%' });
  }
  function drawChart(fig) {
    if (reduced || !window.gsap) return;
    gsap.to(fig.querySelectorAll('.bar'), { scaleX: 1, duration: 1.1, ease: 'expo.out', stagger: .07 });
  }

  /* Tresc naplywa partiami: po dwa-trzy bloki naraz, kolejna partia po chwili. */
  function flowIn(items, opts) {
    if (reduced || !window.gsap) return;
    const o = opts || {}, batch = innerWidth >= 900 ? 3 : 2;
    items.forEach((el, i) => {
      const delay = 0.12 + Math.floor(i / batch) * 0.34 + (i % batch) * 0.09;
      gsap.fromTo(el, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: .85, ease: 'power3.out', delay, overwrite: 'auto' });
      if (o.decode !== false) setTimeout(() => decode(el), delay * 1000 + 80);
      const fig = el.querySelector('figure.chart');
      if (fig) setTimeout(() => drawChart(fig), delay * 1000 + 350);
    });
  }

  function openPanel(name, anchor, push) {
    current = name;
    panelBody.innerHTML = renderPanel(name);
    panelBody.querySelectorAll('figure.chart').forEach(renderChart);
    if (name === 'brief') Brief.start();
    F.paused = true; viewport.classList.add('is-blurred');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    hero.classList.add('is-quiet');
    document.querySelectorAll('.pill__btn').forEach((b) => b.setAttribute('aria-current', b.dataset.panel === name ? 'true' : 'false'));
    lastFocus = document.activeElement;
    $('#panel-close').focus({ preventScroll: true });
    panel.scrollTop = 0;
    decode(panelTitle, 60);
    flowIn([...panelBody.children]);
    if (anchor) {
      const el = document.getElementById(anchor);
      if (el) { el.classList.add('is-target'); setTimeout(() => el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 900); }
    }
    if (push !== false) history.replaceState(null, '', '#' + name + (anchor ? '/' + anchor.replace(/^(case|service)-/, '') : ''));
  }
  function closePanel() {
    if (!current) return;
    current = null;
    F.paused = false; F.dirty = true; viewport.classList.remove('is-blurred');
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    hero.classList.remove('is-quiet');
    document.querySelectorAll('.pill__btn').forEach((b) => b.setAttribute('aria-current', 'false'));
    history.replaceState(null, '', location.pathname);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function openFromTile(it) {
    if (it.kind === 'work') openPanel('work', 'case-' + it.data.id);
    else if (it.kind === 'service') openPanel('services', 'service-' + it.data.id);
    else openPanel(it.to || 'about');
  }
  document.querySelectorAll('.pill__btn').forEach((b) => b.addEventListener('click', () => (current === b.dataset.panel ? closePanel() : openPanel(b.dataset.panel))));
  $('#panel-close').addEventListener('click', closePanel);
  panelBody.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) openPanel(b.dataset.open); });
  panel.addEventListener('click', (e) => { if (e.target === panel) closePanel(); });
  $('#home').addEventListener('click', () => { closePanel(); F.tx = F.ty = 0; dock(false); });
  function route() {
    const m = location.hash.match(/^#(work|services|about|contact|brief)(?:\/([\w-]+))?/);
    if (!m) return;
    openPanel(m[1], m[2] ? (m[1] === 'work' ? 'case-' : 'service-') + m[2] : null, false);
  }
  addEventListener('hashchange', route);

  /* ─── brief: szesc pytan, po jednym na ekran, odpowiedzi jako kafelki ──────
     Bez serwera: gotowy brief idzie mailem (mailto) albo, gdy FORM_ENDPOINT jest ustawiony,
     POST-em JSON do wskazanego adresu (np. formularzowy webhook). */
  const FORM_ENDPOINT = '';
  const Brief = (() => {
    const S = { step: 0, a: {} };
    let stage, prog;
    const B = () => I18N[lang].brief;
    const stepsN = () => B().steps.length;
    function save() { try { localStorage.setItem('kiodem-brief', JSON.stringify(S.a)); } catch (e) {} }
    function start() {
      stage = $('#brief .brief__stage'); prog = $('#brief .brief__progress');
      try { const d = JSON.parse(localStorage.getItem('kiodem-brief') || 'null'); if (d && typeof d === 'object') S.a = d; } catch (e) {}
      S.step = 0; render();
    }
    function readInputs() {
      const st = B().steps[S.step];
      if (!st) return;
      if (st.type === 'text') S.a.site = ($('#brief-site') || {}).value || '';
      if (st.type === 'contact') st.fields.forEach(([k]) => { S.a[k] = ($('#brief-' + k) || {}).value || ''; });
      save();
    }
    function valid() {
      const st = B().steps[S.step];
      if (!st || st.type !== 'contact') return true;
      const ok = compose_email_ok(S.a.email);
      const err = $('#brief-err');
      if (err) { err.hidden = ok; err.textContent = ok ? '' : B().emailError; }
      if (!ok) { const f = $('#brief-email'); if (f) f.focus(); }
      return ok;
    }
    function compose_email_ok(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim()); }
    function pick(i) {
      const st = B().steps[S.step];
      if (!st || !st.opts || i >= st.opts.length) return;
      if (st.type === 'single') { S.a[st.k] = i; save(); mark(st); setTimeout(next, 300); }
      else { const arr = Array.isArray(S.a[st.k]) ? S.a[st.k].slice() : []; const j = arr.indexOf(i); j >= 0 ? arr.splice(j, 1) : arr.push(i); S.a[st.k] = arr; save(); mark(st); }
    }
    function next() { readInputs(); if (!valid()) return; if (S.step < stepsN()) { S.step++; render(); } }
    function back() { readInputs(); if (S.step > 0) { S.step--; render(); } }
    function picked(st, i) { const v = S.a[st.k]; return Array.isArray(v) ? v.includes(i) : v === i; }
    function mark(st) { stage.querySelectorAll('.opt').forEach((o) => o.classList.toggle('is-on', picked(st, +o.dataset.i))); }
    function render(quiet) {
      const b = B(), n = stepsN();
      prog.innerHTML = b.steps.map((_, i) => '<i class="' + (i < S.step ? 'is-done' : i === S.step ? 'is-now' : '') + '"></i>').join('') +
        '<i class="' + (S.step >= n ? 'is-now' : '') + '"></i>';
      if (S.step >= n) return summary();
      const st = b.steps[S.step];
      let h = '<p class="brief__q display">' + esc(st.q) + '</p>' + (st.hint ? '<p class="brief__hint">' + esc(st.hint) + '</p>' : '');
      if (st.opts) h += '<div class="opts">' + st.opts.map((o, i) => '<button type="button" class="opt' + (picked(st, i) ? ' is-on' : '') + '" data-i="' + i + '">' +
        '<span class="opt__n">' + (i + 1) + '</span><span class="opt__t">' + esc(o) + '</span></button>').join('') + '</div>';
      if (st.type === 'text') h += '<div class="field"><input class="input" type="text" inputmode="url" id="brief-site" placeholder="' + esc(st.placeholder) + '" value="' + esc(S.a.site || '') + '" autocomplete="url"></div>';
      if (st.type === 'contact') h += st.fields.map(([k, l]) => '<div class="field"><label for="brief-' + k + '">' + esc(l) + '</label>' +
        (k === 'note' ? '<textarea class="input" id="brief-note" rows="3">' + esc(S.a.note || '') + '</textarea>'
                      : '<input class="input" type="' + (k === 'email' ? 'email' : 'text') + '" id="brief-' + k + '" value="' + esc(S.a[k] || '') + '" autocomplete="' + ({ name: 'name', email: 'email', company: 'organization' })[k] + '">') +
        '</div>').join('') + '<p class="brief__err" id="brief-err" hidden></p>';
      const nextLabel = st.type === 'text' && !(S.a.site || '').trim() ? b.skip : (S.step === n - 1 ? b.review : b.next);
      h += '<div class="brief__nav">' + (S.step > 0 ? '<button type="button" class="link" data-act="back">' + esc(b.back) + '</button>' : '<span></span>') +
        (st.type === 'single' ? '<span></span>' : '<button type="button" class="btn" data-act="next">' + esc(nextLabel) + '</button>') + '</div>' +
        '<p class="brief__key">' + esc(b.keyHint) + '</p>';
      stage.innerHTML = h;
      stage.querySelectorAll('.opt').forEach((o) => o.addEventListener('click', () => pick(+o.dataset.i)));
      stage.querySelectorAll('[data-act]').forEach((x) => x.addEventListener('click', () => (x.dataset.act === 'next' ? next() : back())));
      if (!quiet) {
        flowIn([...stage.children], { decode: false });
        decode(stage.querySelector('.brief__q'), 120);
        const f = stage.querySelector('input'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 500);
      }
    }
    function lines() {
      const b = B(), out = [];
      b.steps.forEach((st) => {
        const v = S.a[st.k];
        if (st.opts) { const idx = Array.isArray(v) ? v : (v === undefined ? [] : [v]); if (idx.length) out.push([b.labels[st.k], idx.map((i) => st.opts[i]).join(', ')]); }
        else if (st.type === 'text' && (v || '').trim()) out.push([b.labels.site, v.trim()]);
        else if (st.type === 'contact') st.fields.forEach(([k]) => { if ((S.a[k] || '').trim()) out.push([b.labels[k], S.a[k].trim()]); });
      });
      return out;
    }
    function text() { return 'Brief KIODEM\n\n' + lines().map((l) => l[0] + ': ' + l[1]).join('\n'); }
    function summary() {
      const b = B();
      stage.innerHTML = '<p class="brief__q display">' + esc(b.summaryTitle) + '</p><div class="summary"><dl>' +
        lines().map((l) => '<dt>' + esc(l[0]) + '</dt><dd>' + esc(l[1]) + '</dd>').join('') + '</dl>' +
        '<div class="brief__actions"><button type="button" class="btn" data-act="send">' + esc(b.send) + '</button>' +
        '<button type="button" class="link" data-act="copy">' + esc(b.copy) + '</button>' +
        '<button type="button" class="link" data-act="edit">' + esc(b.edit) + '</button></div>' +
        '<p class="brief__note" id="brief-note-out" hidden></p></div>';
      const note = $('#brief-note-out');
      stage.querySelector('[data-act=edit]').addEventListener('click', () => { S.step = 0; render(); });
      stage.querySelector('[data-act=copy]').addEventListener('click', (e) => {
        const done = () => { e.target.textContent = b.copied; };
        if (navigator.clipboard) navigator.clipboard.writeText(text()).then(done, done); else done();
      });
      stage.querySelector('[data-act=send]').addEventListener('click', async () => {
        const mail = I18N[lang].mail;
        if (FORM_ENDPOINT) {
          try {
            const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang, answers: S.a, text: text() }) });
            if (r.ok) { note.hidden = false; note.textContent = b.sent; try { localStorage.removeItem('kiodem-brief'); } catch (x) {} return; }
          } catch (x) {}
        }
        location.href = 'mailto:' + mail + '?subject=' + encodeURIComponent('Brief KIODEM') + '&body=' + encodeURIComponent(text());
        note.hidden = false; note.textContent = b.mailNote + ' ' + mail + '.';
      });
      flowIn([...stage.children], { decode: false });
      decode(stage.querySelector('.brief__q'), 120);
    }
    return { start, pick, next, back };
  })();

  /* ─── jezyk ────────────────────────────────────────────────────────────── */
  function applyLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    try { localStorage.setItem('kiodem-lang', lang); } catch (e) {}
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('.lang__btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'));
    $('#panel-close').setAttribute('aria-label', t('close'));
    build();
    if (current) { panelBody.innerHTML = renderPanel(current); panelBody.querySelectorAll('figure.chart').forEach(renderChart); if (current === 'brief') Brief.start(); flowIn([...panelBody.children]); }
  }
  document.querySelectorAll('.lang__btn').forEach((b) => b.addEventListener('click', () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang); }));

  /* ─── loader: powitania, pierscien, znak, logotyp, wejscie pola ────────── */
  function loader() {
    const root = $('#loader'), word = $('#loader-word'), mark = $('#loader-mark'), wm = $('#loader-wordmark');
    const ring = root.querySelector('.loader__ring'), arc = root.querySelector('.loader__ring-arc');
    let seen = false; try { seen = sessionStorage.getItem('kiodem-seen') === '1'; sessionStorage.setItem('kiodem-seen', '1'); } catch (e) {}
    const finish = () => { root.classList.add('is-done'); hero.style.opacity = ''; };
    hero.style.opacity = '0';

    if (reduced || !window.gsap || /noloader/.test(location.search)) {
      word.style.display = 'none'; ring.style.display = 'none';
      wm.style.opacity = '1'; wm.style.filter = 'none'; wm.style.transform = 'none';
      setTimeout(() => { root.style.transition = 'opacity .5s'; root.style.opacity = '0'; setTimeout(finish, 520); }, 700);
      return;
    }

    const last = lang === 'pl' ? 'Witamy' : 'Welcome';
    const seq = seen ? [] : GREETINGS.filter((g) => g !== last).concat([last]);
    const flyIn = () => {
      F.entering = true; build(); F.tiles.forEach((x) => { x.enter = 1; });
      const far = Math.max(...F.tiles.map((x) => x.d0)) || 1;
      let left = F.tiles.length;
      F.tiles.forEach((x) => gsap.to(x, { enter: 0, duration: 1.35, ease: 'expo.out', delay: (x.d0 / far) * 0.75,
        onComplete: () => { if (--left === 0) { F.entering = false; F.dirty = true; } } }));
    };
    const tl = gsap.timeline();
    const sweep = { v: 0 };

    if (seq.length) {
      seq.forEach((g, i) => tl.call(() => { word.textContent = g; }, null, i * 0.13));
      tl.to(word, { opacity: 0, y: -10, duration: .35, ease: 'power2.in' }, seq.length * 0.13 + 0.45);
    } else {
      tl.set(word, { opacity: 0 });
    }
    // pierscien zamyka sie i znak wylania sie w slad za jego obrotem: spinner staje sie logo
    tl.add('mark');
    tl.set(mark, { opacity: 1 }, 'mark');
    tl.to(arc, { strokeDashoffset: 0, duration: .8, ease: 'power2.inOut' }, 'mark');
    tl.to(sweep, { v: 360, duration: .8, ease: 'power2.inOut', onUpdate: () => mark.style.setProperty('--sweep', sweep.v + 'deg') }, 'mark');
    tl.to(ring, { opacity: 0, scale: 1.12, duration: .5, ease: 'power2.out' }, 'mark+=.7');
    // obrot znaku jak monety
    tl.to(mark, { rotationY: 360, duration: 1.05, ease: 'power3.inOut', transformPerspective: 800 }, 'mark+=.75');
    // znak rozmywa sie, a z rozmycia wyostrza sie logotyp: przeciagniecie ostrosci, nie wytarcie
    tl.add('name', 'mark+=1.55');
    tl.to(mark, { opacity: 0, scale: 1.18, filter: 'blur(14px)', duration: .55, ease: 'power2.in' }, 'name');
    tl.to(wm, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 1.2, ease: 'power3.out' }, 'name+=.15');
    // kafelki przylatuja spoza ekranu na swoje miejsca, kurtyna znika
    tl.add('field', 'name+=.7');
    tl.call(flyIn, null, 'field');
    tl.to(root, { backgroundColor: 'rgba(8,10,15,0)', duration: .8 }, 'field');
    tl.set(hero, { opacity: 1 }, 'field+=.6');
    tl.call(() => decode($('.hero__line')), null, 'field+=.6');
    tl.to(wm, { opacity: 0, duration: .3 }, 'field+=.6');
    tl.call(finish, null, 'field+=1');
  }

  /* ─── start ────────────────────────────────────────────────────────────── */
  applyLang(lang);
  requestAnimationFrame(frame);
  loader();
  route();
})();
