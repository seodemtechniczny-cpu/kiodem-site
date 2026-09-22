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
                  about: 'One person does the work you talk to', contact: 'One email is enough' }
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
                  about: 'Robotę robi ta sama osoba, z którą rozmawiasz', contact: 'Wystarczy jeden mail' }
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
      text: { en: 'WordPress and WooCommerce builds, storefront work on Shopify, Shoper and Shopware, location pages for showrooms, page speed and technical SEO.',
              pl: 'Wdrożenia na WordPressie i WooCommerce, prace w sklepach na Shopify, Shoper i Shopware, strony lokalizacji dla salonów, szybkość i SEO techniczne.' } },
    { id: 'ads', title: { en: 'Google Ads', pl: 'Google Ads' },
      line: { en: 'Campaigns judged by enquiries, not clicks', pl: 'Kampanie oceniane po zapytaniach, nie po kliknięciach' },
      text: { en: 'Search and Shopping campaigns with conversion tracking that tells enquiries apart by location and product. Phone calls are measured too.',
              pl: 'Kampanie w wyszukiwarce i Shopping z pomiarem, który rozróżnia zapytania po lokalizacji i produkcie. Telefony też są liczone.' } },
    { id: 'measurement', title: { en: 'Measurement', pl: 'Pomiar' },
      line: { en: 'Numbers that agree with each other', pl: 'Liczby, które się ze sobą zgadzają' },
      text: { en: 'GA4, Tag Manager and consent mode, Merchant Center and Search Console, set up so the shop, the ads and the reports count the same sale once.',
              pl: 'GA4, Tag Manager i tryb zgody, Merchant Center i Search Console, ustawione tak, żeby sklep, reklamy i raporty liczyły tę samą sprzedaż raz.' } },
    { id: 'automation', title: { en: 'Automation', pl: 'Automatyzacje' },
      line: { en: 'Small programs that run unattended', pl: 'Małe programy, które działają bez nadzoru' },
      text: { en: 'Python integrations: supplier feeds and stock, invoicing and CRM, price checks, monitoring and reports. Written for your setup, left with the code.',
              pl: 'Integracje w Pythonie: feedy i stany hurtowni, faktury i CRM, sprawdzanie cen, monitoring i raporty. Pisane pod Twoje narzędzia, zostają z kodem.' } }
  ];

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
              lastX: 0, lastY: 0, lastT: 0, idle: 0, entering: false, dirty: true };

  const hash = (a, b) => { let h = (a * 73856093) ^ (b * 19349663); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const wrap = (v, size) => ((v % size) + size) % size - size / 2;

  function pool() {
    const L = I18N[lang];
    const items = [];
    ['work', 'services', 'about', 'contact'].forEach((id) =>
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
      return '<img src="assets/work/' + w.img + '.webp" alt="" loading="lazy" onload="this.classList.add(\'is-loaded\')" onerror="this.remove()">' +
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
    const lo = F.cw * 1.15, hi = F.cw * 2.4;
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
    const fade = (0.12 + 0.88 * centreFade(wx, wy)) * tl.base * (1 - tl.enter);
    tl.el.style.opacity = fade.toFixed(3);
    tl.el.style.pointerEvents = fade < 0.35 ? 'none' : '';
  }

  function frame(now) {
    const k = 0.11;
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
      if (Math.abs(dx) + Math.abs(dy) > 2) { F.moved = true; hideHint(); }
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
    hideHint();
  }, { passive: false });
  document.addEventListener('keydown', (e) => {
    if (panel.classList.contains('is-open')) { if (e.key === 'Escape') closePanel(); return; }
    const step = 180;
    if (e.key === 'ArrowLeft') F.tx += step; else if (e.key === 'ArrowRight') F.tx -= step;
    else if (e.key === 'ArrowUp') F.ty += step; else if (e.key === 'ArrowDown') F.ty -= step;
    else if (e.key === 'Home') { F.tx = F.ty = 0; } else return;
    e.preventDefault(); hideHint();
  });
  let resizeT; addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(build, 150); });

  let hintHidden = false;
  function hideHint() { if (hintHidden) return; hintHidden = true; hint.classList.add('is-hidden'); }

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
        '<p><strong style="color:var(--ivory);font-weight:500">' + esc(s.line[lang]) + '.</strong> ' + esc(s.text[lang]) + '</p></article>').join('');
    }
    if (name === 'about') {
      panelTitle.textContent = L.aboutTitle;
      return '<p class="lead">' + L.aboutLead + '</p>' + L.about.map((p) => '<p>' + p + '</p>').join('') +
        '<dl class="facts">' + L.facts.map((f) => '<dt>' + f[0] + '</dt><dd>' + f[1] + '</dd>').join('') + '</dl>';
    }
    panelTitle.textContent = L.contactTitle;
    return '<p class="lead">' + L.contactLead + '</p>' +
      '<a class="contact__mail display" href="mailto:' + L.mail + '">' + L.mail + '</a>' +
      '<div class="contact__rows"><a href="tel:+48789350367">' + L.phone + '</a>' +
      '<a href="https://www.linkedin.com/in/michal-smolinski" target="_blank" rel="noopener">' + L.linkedin + '</a></div>' +
      '<a class="btn" href="mailto:' + L.mail + '?subject=KIODEM">' + L.write + '</a>' +
      '<p class="contact__note">' + L.contactNote + '</p>';
  }

  /* Tekst jak kod: cyfry, ktore znak po znaku staja sie literami. Dziala na wezlach tekstu,
     wiec znaczniki (pogrubienia, linki) zostaja na miejscu. */
  const CODE = '0123456789';
  let decodeRuns = 0;
  function decode(root, hold) {
    if (reduced) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n; (n = walker.nextNode());) if (n.nodeValue.trim()) nodes.push({ n, text: n.nodeValue });
    if (!nodes.length) return;
    const run = ++decodeRuns, t0 = performance.now() + (hold || 0);
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

  function flowIn(items) {
    if (reduced || !window.gsap) return;
    items.forEach((el, i) => {
      const delay = 0.15 + i * 0.1;
      gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', delay });
      setTimeout(() => decode(el), delay * 1000 + 80);
    });
  }

  function openPanel(name, anchor, push) {
    current = name;
    panelBody.innerHTML = renderPanel(name);
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
  panel.addEventListener('click', (e) => { if (e.target === panel || e.target.classList.contains('overlay__inner')) closePanel(); });
  $('#home').addEventListener('click', () => { closePanel(); F.tx = F.ty = 0; });
  function route() {
    const m = location.hash.match(/^#(work|services|about|contact)(?:\/([\w-]+))?/);
    if (!m) return;
    openPanel(m[1], m[2] ? (m[1] === 'work' ? 'case-' : 'service-') + m[2] : null, false);
  }
  addEventListener('hashchange', route);

  /* ─── jezyk ────────────────────────────────────────────────────────────── */
  function applyLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    try { localStorage.setItem('kiodem-lang', lang); } catch (e) {}
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('.lang__btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'));
    $('#panel-close').setAttribute('aria-label', t('close'));
    build();
    if (current) { panelBody.innerHTML = renderPanel(current); flowIn([...panelBody.children]); }
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
