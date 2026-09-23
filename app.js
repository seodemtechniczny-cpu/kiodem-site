/* KIODEM — pole kafelkow w perspektywie, loader z powitaniami, panele sekcji.
   Bez frameworka: jeden plik, dane na gorze, zachowanie ponizej. */
(function () {
  'use strict';

  /* ─── dane ─────────────────────────────────────────────────────────────── */
  const D = window.KIODEM_DATA;
  const LANGS = D.LANGS, I18N = D.I18N, WORK = D.WORK, SERVICES = D.SERVICES, AREAS = D.AREAS, CHARTS = D.CHARTS;
  const GREETINGS = D.GREETINGS, GREETING_BY_LANG = D.GREETING_BY_LANG, LOCALES = D.LOCALES;
  const PROCESS = D.PROCESS, LIVE = D.LIVE, CURSOR = D.CURSOR, GREETING_TIME = D.GREETING_TIME, META = D.META;
  // katalog strony (obrazy i dane sa wzgledem app.js, nie wzgledem /pl/ czy /de/)
  const ROOT = (function () { const el = document.querySelector('script[src*="app.js"]'); try { return el ? new URL('.', el.src).href : './'; } catch (e) { return './'; } })();

  /* ─── stan ─────────────────────────────────────────────────────────────── */
  const $ = (s) => document.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  let lang = (function () {
    const fixed = document.documentElement.dataset.lang;          // /pl/, /de/...: strona w tym jezyku
    if (LANGS.includes(fixed)) return fixed;
    try { const s = localStorage.getItem('kiodem-lang'); if (LANGS.includes(s)) return s; } catch (e) {}
    for (const l of (navigator.languages || [navigator.language || 'en'])) {
      const k = String(l).slice(0, 2).toLowerCase(); if (LANGS.includes(k)) return k;
    }
    return 'en';
  })();
  const t = (k) => I18N[lang][k];

  const viewport = $('#viewport'), field = $('#field'), hero = $('#hero'), hint = $('#hint');
  const panel = $('#panel'), panelBody = $('#panel-body'), panelTitle = $('#panel-title');

  /* ─── pole: siatka, ktora zawija sie w kazda strone ────────────────────── */
  const F = { ox: 0, oy: 0, tx: 0, ty: 0, vx: 0, vy: 0, rx: 0, ry: 0, prx: 0, pry: 0,
              cw: 224, ch: 168, cols: 0, rows: 0, W: 0, H: 0, tiles: [], dragging: false, moved: false,
              lastX: 0, lastY: 0, lastT: 0, idle: 0, entering: false, dirty: true,
              paused: false, dock: 0, docked: false,
              zoom: 0, focus: null, zooming: false,           // najazd kamery na klikniety kafelek
              map: 0, lastInput: 0 };                         // tryb mapy (odjazd kamery), ostatni ruch uzytkownika

  const hash = (a, b) => { let h = (a * 73856093) ^ (b * 19349663); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const wrap = (v, size) => ((v % size) + size) % size - size / 2;

  /* Pole = mapa pracy: cztery sekcje i dziesiec obszarow. Zadnych powtorzen realizacji
     i uslug obok siebie - kazdy kafelek mowi, co da sie u mnie zamowic. */
  function pool() {
    const L = I18N[lang];
    const items = [];
    ['work', 'about', 'contact', 'brief'].forEach((id) =>
      items.push({ kind: 'section', w: 240, h: 150, to: id, text: L['nav.' + id], sub: L.sections[id] }));
    items.push({ kind: 'section', w: 240, h: 150, to: 'process', text: PROCESS.title[lang], sub: PROCESS.tile[lang] });
    AREAS.forEach((a) => items.push({ kind: 'area', w: 232, h: 138, data: a }));
    items.push({ kind: 'live', w: 232, h: 138, live: 'now' }, { kind: 'live', w: 232, h: 138, live: 'site' });
    // deterministyczne przetasowanie - te same pozycje przy kazdym wejsciu
    let seed = 7;
    for (let i = items.length - 1; i > 0; i--) { seed = (seed * 9301 + 49297) % 233280; const j = Math.floor(seed / 233280 * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    return items;
  }

  function tileHTML(it) {
    if (it.kind === 'work') {
      const w = it.data;
      return (w.img ? '<img src="assets/work/' + w.img + '-bw.webp" alt="" loading="lazy" onload="this.classList.add(\'is-loaded\')" onerror="this.remove()">' : '') +
             '<div class="tile__cap"><div class="tile__t">' + w.name + '</div><div class="tile__s">' + w.sector[lang] + '</div></div>';
    }
    if (it.kind === 'area') return '<div class="tile__t">' + it.data.title[lang] + '</div><div class="tile__s">' + it.data.line[lang] + '</div>';
    if (it.kind === 'live') {
      const V = LIVE[it.live];
      if (it.live === 'now') return '<div class="tile__t"><i class="tile__dot" aria-hidden="true"></i>' + esc(V.title[lang]) + '</div>' +
        '<div class="tile__s" data-live="time">' + esc(V.time[lang].replace('{time}', clock())) + '</div>' +
        '<div class="tile__s">' + esc(V.reply[lang]) + (V.available ? ' · ' + esc(V.available[lang]) : '') + '</div>';
      return '<div class="tile__t">' + esc(V.title[lang]) + '</div>' +
        '<div class="tile__s">' + esc(V.facts[lang].replace('{files}', V.files)) + '</div>' +
        '<div class="tile__s" data-live="psi">' + esc(psiLine()) + '</div>';
    }
    // sekcja Realizacje: trzy miniatury wysuwaja sie po najechaniu
    const peek = it.to === 'work' ? '<div class="tile__peek" aria-hidden="true">' + WORK.filter((w) => w.img).slice(0, 3).map((w) =>
      '<img src="' + ROOT + 'assets/work/' + w.img + '.webp" alt="" loading="lazy">').join('') + '</div>' : '';
    return peek + '<div class="tile__t">' + it.text + '</div><div class="tile__s">' + it.sub + '</div>';
  }

  /* Kafelki na zywo: zegar w Gliwicach i wynik PageSpeed mierzony co tydzien (assets/psi.json,
     zapisuje go GitHub Action). Bez pliku linia z wynikiem zostaje pusta - nie zmyslamy liczb. */
  const clock = () => { try { return new Intl.DateTimeFormat(LOCALES[lang] || 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' }).format(new Date()); } catch (e) { return ''; } };
  let psi = null;
  const psiLine = () => psi && psi.mobile != null ? LIVE.site.psi[lang].replace('{m}', psi.mobile).replace('{d}', psi.desktop).replace('{date}', psi.date) : '';
  function tickLive() {
    document.querySelectorAll('[data-live="time"]').forEach((el) => { el.textContent = LIVE.now.time[lang].replace('{time}', clock()); });
    document.querySelectorAll('[data-live="psi"]').forEach((el) => { el.textContent = psiLine(); });
  }
  setInterval(tickLive, 30000);
  fetch(ROOT + 'assets/psi.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) { psi = j; tickLive(); } }).catch(() => {});

  function build() {
    const mobile = innerWidth <= 820;
    F.cw = mobile ? 214 : 340; F.ch = mobile ? 164 : 250;
    F.cols = Math.ceil(innerWidth / F.cw) + 3; F.rows = Math.ceil(innerHeight / F.ch) + 3;
    if (F.cols % 2 === 0) F.cols++; if (F.rows % 2 === 0) F.rows++;
    F.W = F.cols * F.cw; F.H = F.rows * F.ch;
    const items = pool();
    const scale = mobile ? 0.78 : 1;
    field.innerHTML = '';
    F.tiles = [];
    let k = 0;
    for (let r = 0; r < F.rows; r++) for (let c = 0; c < F.cols; c++) {
      if (hash(c * 7 + 2, r * 11 + 5) > 0.66) continue;          // co trzecia komorka pusta: pole oddycha
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
      el.addEventListener('click', (e) => { if (F.moved) { e.preventDefault(); return; } zoomToTile(tile); });
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
    const mob = F.cw < 300;                              // telefon: znak jest mniejszy, wiec i ciemna strefa mniejsza
    const lo = F.cw * (mob ? 0.5 : 0.7), hi = F.cw * (mob ? 0.85 : 1.1);
    const k = clamp((r - lo) / (hi - lo), 0, 1);
    return Math.max(d, F.map, k * k * (3 - 2 * k));      // logo zadokowane u gory albo tryb mapy = zadnego ciemnego srodka
  }
  function renderTile(tl) {
    const wx = wrap(tl.px + F.ox, F.W) + tl.jx, wy = wrap(tl.py + F.oy, F.H) + tl.jy;
    // start lotu: ten sam kierunek co miejsce docelowe, ale poza krawedzia ekranu i glebiej
    const e = tl.enter;
    const sx = wx * 1.6 + Math.sign(wx || 1) * innerWidth * 0.6;
    const sy = wy * 1.6 + Math.sign(wy || 1) * innerHeight * 0.6;
    const x = lerp(wx, sx, e) - tl.w / 2, y = lerp(wy, sy, e) - tl.h / 2;
    const zk = F.zoom, focused = F.focus === tl;
    const z = tl.z + (tl.hover ? 46 : 0) - 520 * e + (focused ? 160 * zk : 0);
    const s = tl.hover ? 1.04 : 1;
    const rot = focused ? tl.rot * (1 - zk) : tl.rot;                 // klikniety kafelek prostuje sie do kamery
    tl.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateZ(' + rot.toFixed(2) + 'deg) scale(' + s + ')';
    let fade = (0.03 + 0.97 * centreFade(wx, wy)) * tl.base * (1 - tl.enter);
    if (zk > 0) fade = focused ? lerp(fade, 1, Math.min(1, zk * 3)) : fade * (1 - zk);   // fokus jasny mimo srodka, reszta gasnie
    fade = Math.round(fade * 100) / 100;
    if (fade !== tl.lastFade) {                          // zapis stylu tylko gdy wartosc sie zmienia
      tl.el.style.opacity = fade;
      const pe = fade < 0.15 ? 'none' : '';                // tylko naprawde zgaszone kafelki nie lapia klikniec
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
      // bezczynnosc: pole powoli sunie, zeby bylo widac, ze jest wieksze niz ekran; kazdy ruch je zatrzymuje
      if (!reduced && !coarse && !current && !F.zooming && !F.map && now - F.lastInput > 9000) { F.tx -= 0.32; F.ty -= 0.12; }
    }
    // przechyl pola od ruchu (kamera plynie za przeciaganiem) + lekki oddech w spoczynku
    const tRx = clamp(-dy * 0.06, -9, 9), tRy = clamp(dx * 0.06, -9, 9);
    F.rx = lerp(F.rx, tRx, 0.08); F.ry = lerp(F.ry, tRy, 0.08);
    const breath = reduced ? 0 : Math.sin(now / 2600) * 1.2;
    field.style.transform = 'translateZ(' + (F.zoom * 560 - F.map * 700).toFixed(1) + 'px) rotateX(' + ((F.rx + F.prx + breath) * (1 - F.zoom)).toFixed(3) + 'deg) rotateY(' + ((F.ry + F.pry) * (1 - F.zoom)).toFixed(3) + 'deg)';
    if (moving || F.dirty || F.entering) { for (const tl of F.tiles) renderTile(tl); F.dirty = false; drawNavi(); }
    requestAnimationFrame(frame);
  }

  /* wejscie: przeciaganie, kolko, dotyk, klawiatura */
  const touches = new Map();                             // aktywne palce (pinch = tryb mapy)
  viewport.addEventListener('pointerdown', (e) => {
    F.lastInput = performance.now();
    if (e.pointerType === 'touch') { touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (touches.size === 2) { pinch0 = pinchDist(); } }
    if (e.button !== 0 || F.zooming) return;
    F.dragging = true; F.moved = false; F.vx = F.vy = 0;
    F.lastX = e.clientX; F.lastY = e.clientY; F.lastT = performance.now();
    viewport.classList.add('is-dragging');
    // wskaznik przechwytujemy dopiero gdy zaczyna sie przeciaganie: przechwycony od razu
    // przekierowuje click na viewport i kafelki przestaja byc klikalne
  });
  let pinch0 = 0;
  const pinchDist = () => { const p = [...touches.values()]; return p.length === 2 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0; };
  viewport.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2 && pinch0) {                  // dwa palce: zblizenie = mapa, rozsuniecie = powrot
        const d = pinchDist();
        if (d < pinch0 * 0.72) { setMap(true); pinch0 = d; } else if (d > pinch0 * 1.38) { setMap(false); pinch0 = d; }
        return;
      }
    }
    if (F.dragging) {
      const dx = e.clientX - F.lastX, dy = e.clientY - F.lastY, now = performance.now();
      const dt = Math.max(1, now - F.lastT);
      F.tx += dx; F.ty += dy;
      F.vx = lerp(F.vx, dx / dt * 14, 0.5); F.vy = lerp(F.vy, dy / dt * 14, 0.5);
      if (Math.abs(dx) + Math.abs(dy) > 2 && !F.moved) { F.moved = true; hideHint(); dock(true); try { viewport.setPointerCapture(e.pointerId); } catch (x) {} }
      F.lastX = e.clientX; F.lastY = e.clientY; F.lastT = now;
    } else if (!coarse) {                                 // kamera lekko za kursorem
      F.pry = (e.clientX / innerWidth - .5) * 5; F.prx = -(e.clientY / innerHeight - .5) * 5;
    }
  });
  const endDrag = (e) => { if (e && e.pointerType === 'touch') { touches.delete(e.pointerId); pinch0 = 0; } if (!F.dragging) return; F.dragging = false; viewport.classList.remove('is-dragging'); setTimeout(() => { F.moved = false; }, 0); };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  let wheelMapT = 0;
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    F.lastInput = performance.now();
    if (e.ctrlKey || e.metaKey) {                          // pinch na gladziku / ctrl+kolko: tryb mapy
      const now = performance.now();
      if (now - wheelMapT > 400) { wheelMapT = now; setMap(e.deltaY > 0); }
      return;
    }
    const m = e.deltaMode === 1 ? 16 : 1;
    F.tx -= e.deltaX * m * 0.9; F.ty -= e.deltaY * m * 0.9;
    hideHint(); dock(true);
  }, { passive: false });

  /* Tryb mapy: kamera odjezdza (translateZ pola), widac cala mape pracy, klik w kafelek wjezdza. */
  function setMap(on) {
    const target = on ? 1 : 0;
    if (F.map === target || F.zooming) return;
    if (on) { hideHint(); dock(true); }
    document.body.classList.toggle('is-map', on);
    if (reduced || !window.gsap) { F.map = target; F.dirty = true; return; }
    gsap.to(F, { map: target, duration: .85, ease: 'expo.inOut', overwrite: 'auto', onUpdate: () => { F.dirty = true; } });
  }

  /* Nawigator: mala mapa pola w rogu - kropki kafelkow, prostokat widoku, klik przenosi. */
  const navi = document.createElement('div');
  navi.className = 'navi'; navi.innerHTML = '<canvas class="navi__map" width="132" height="98" aria-hidden="true"></canvas><button class="navi__btn" type="button"></button>';
  document.body.appendChild(navi);
  const naviCv = navi.querySelector('canvas'), naviBtn = navi.querySelector('button');
  naviBtn.addEventListener('click', () => setMap(!F.map));
  naviCv.addEventListener('click', (e) => {
    const r = naviCv.getBoundingClientRect(), sc = naviCv.width / F.W;
    const wx = (e.clientX - r.left - naviCv.width / 2) / sc, wy = (e.clientY - r.top - naviCv.height / 2) / sc;
    F.tx = F.ox - wx; F.ty = F.oy - wy; F.vx = F.vy = 0; F.lastInput = performance.now(); hideHint(); dock(true);
  });
  function drawNavi() {
    if (coarse || !F.W) return;
    const ctx = naviCv.getContext('2d'), Wc = naviCv.width, Hc = Math.round(Wc * F.H / F.W);
    if (naviCv.height !== Hc) naviCv.height = Hc;
    const sc = Wc / F.W;
    ctx.clearRect(0, 0, Wc, Hc);
    for (const tl of F.tiles) {
      const wx = wrap(tl.px + F.ox, F.W) + tl.jx, wy = wrap(tl.py + F.oy, F.H) + tl.jy;
      ctx.fillStyle = tl === F.focus ? '#F1EEE7' : 'rgba(241,238,231,' + (0.22 + 0.5 * tl.base) + ')';
      ctx.fillRect(Wc / 2 + (wx - tl.w / 2) * sc, Hc / 2 + (wy - tl.h / 2) * sc, Math.max(2, tl.w * sc), Math.max(1.5, tl.h * sc));
    }
    const z = 1100 / (1100 - (F.zoom * 560 - F.map * 700));   // ile pola widac przy obecnej glebi kamery
    const vw = innerWidth / z * sc, vh = innerHeight / z * sc;
    ctx.strokeStyle = 'rgba(241,238,231,.85)'; ctx.lineWidth = 1;
    ctx.strokeRect(Wc / 2 - vw / 2 + .5, Hc / 2 - vh / 2 + .5, vw, vh);
  }
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
    F.lastInput = performance.now();
    if (e.key === 'm' || e.key === 'M') { setMap(!F.map); return; }
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
      const block = (title, items) => items && items[lang] && items[lang].length
        ? '<h4 class="case__h">' + esc(title) + '</h4><ul class="list list--tight">' + items[lang].map((d) => '<li>' + esc(d) + '</li>').join('') + '</ul>' : '';
      return '<p class="lead">' + L.workLead + '</p>' + WORK.map((w) =>
        '<article class="case" id="case-' + w.id + '">' +
        (w.img ? '<img class="case__thumb" src="' + ROOT + 'assets/work/' + w.img + '.webp" alt="" loading="lazy" onload="this.classList.add(\'is-loaded\')" onerror="this.remove()">' : '') +
        '<h3 class="display">' + esc(w.name) + '</h3><p class="case__meta">' + esc(w.sector[lang]) + '</p>' +
        '<p class="case__what">' + esc(w.what[lang]) + '</p>' +
        block(L.caseTech, w.tech) + block(L.caseResult, w.result) + block(L.caseAdvice, w.advice) +
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
    if (name === 'process') {
      panelTitle.textContent = PROCESS.title[lang];
      return '<p class="lead">' + esc(PROCESS.lead[lang]) + '</p><ol class="steps">' + PROCESS.steps.map((st) =>
        '<li class="step"><h3 class="display">' + esc(st.t[lang]) + '</h3><p>' + esc(st.d[lang]) + '</p></li>').join('') + '</ol>' +
        '<p class="contact__note">' + L.contactBrief + ' <button type="button" class="link" data-open="brief">' + L['nav.brief'] + '</button></p>';
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
  const fmt = (n) => n.toLocaleString(LOCALES[lang] || 'en-GB');
  function renderChart(fig) {
    const kind = fig.dataset.chart, C = CHARTS[kind], grouped = kind === 'ads';
    const narrow = (fig.clientWidth || panelBody.clientWidth || innerWidth) < 480;
    const W = 640, LBL = narrow ? 0 : 214, VAL = narrow ? 96 : 70, AREA = W - LBL - VAL;
    const rh = narrow ? (grouped ? 70 : 58) : (grouped ? 44 : 34), top = 8, H = top + C.rows.length * rh + 6;
    const max = grouped ? Math.max(...C.rows.map((r) => Math.max(r.a, r.b))) : Math.max(...C.rows.map((r) => r.imp));
    const bx = (v) => (v / max) * AREA;
    const dec = (n) => n.toFixed(1).replace('.', lang === 'en' ? '.' : ',');
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
        info = r.label[lang] + ': ' + r.a + '% ' + C.words[lang][0] + ', ' + r.b + '% ' + C.words[lang][1];
        svg += '<g class="row' + (i === 0 ? ' is-on' : '') + '" tabindex="0" data-i="' + i + '" aria-label="' + esc(info) + '">' +
          '<text class="lbl" x="0" y="' + ly + '">' + lab + '</text>' +
          '<rect class="bar bar-a" x="' + LBL + '" y="' + by + '" width="' + bx(r.a).toFixed(1) + '" height="10"/>' +
          '<rect class="bar bar-b" x="' + LBL + '" y="' + (by + 12) + '" width="' + bx(r.b).toFixed(1) + '" height="10"/>' +
          '<text class="val" x="' + (LBL + bx(r.a) + 8).toFixed(1) + '" y="' + (by + 9) + '">' + r.a + '%</text>' +
          '<text class="val" x="' + (LBL + bx(r.b) + 8).toFixed(1) + '" y="' + (by + 21) + '">' + r.b + '%</text></g>';
        table += '<tr><td>' + lab + '</td><td>' + r.a + '%</td><td>' + r.b + '%</td></tr>';
      } else {
        const ctr = r.clicks / r.imp * 100, weak = ctr < 1.5;
        info = r.label[lang] + ': ' + fmt(r.imp) + ' ' + C.words[lang][0] + ', ' + fmt(r.clicks) + ' ' + C.words[lang][1] +
               ', CTR ' + dec(ctr) + '%, ' + C.words[lang][2] + ' ' + dec(r.pos);
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
    panelBody.classList.toggle('is-calm', name !== 'work');
    panelBody.querySelectorAll('figure.chart').forEach(renderChart);
    if (name === 'brief') Brief.start();
    F.paused = true; viewport.classList.add('is-blurred');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    hero.classList.add('is-quiet');
    document.querySelectorAll('.dock__btn').forEach((b) => b.setAttribute('aria-current', b.dataset.panel === name ? 'true' : 'false'));
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
    zoomOut();
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    hero.classList.remove('is-quiet');
    document.querySelectorAll('.dock__btn').forEach((b) => b.setAttribute('aria-current', 'false'));
    history.replaceState(null, '', location.pathname);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  /* Klik w kafelek: pole najpierw dojezdza tak, zeby kafelek stanal na srodku, kamera najezdza
     na niego (translateZ pola + kafelek do przodu), reszta pola gasnie - i dopiero wtedy otwiera sie
     sekcja. Zamkniecie panelu odjezdza kamera z powrotem. */
  function zoomToTile(tile) {
    if (F.zooming || current) return;
    const wx = wrap(tile.px + F.ox, F.W) + tile.jx, wy = wrap(tile.py + F.oy, F.H) + tile.jy;
    F.tx = F.ox - wx; F.ty = F.oy - wy; F.vx = F.vy = 0;
    F.focus = tile; F.zooming = true; hideHint(); dock(true);      // logo do gory: po powrocie kafelek zostaje na srodku, nie pod znakiem
    hero.classList.add('is-quiet');
    if (reduced || !window.gsap) { F.zoom = 1; F.map = 0; F.dirty = true; F.zooming = false; openFromTile(tile.it); return; }
    document.body.classList.remove('is-map');
    gsap.to(F, { zoom: 1, map: 0, duration: .9, ease: 'power3.inOut', overwrite: 'auto',
      onUpdate: () => { F.dirty = true; },
      onComplete: () => { F.zooming = false; openFromTile(tile.it); } });
  }
  function zoomOut() {
    if (!F.focus) return;
    if (reduced || !window.gsap) { F.zoom = 0; F.focus = null; F.dirty = true; return; }
    F.zooming = true;
    gsap.to(F, { zoom: 0, duration: .8, ease: 'power3.inOut', overwrite: 'auto',
      onUpdate: () => { F.dirty = true; },
      onComplete: () => { F.focus = null; F.zooming = false; F.dirty = true; } });
  }
  function openFromTile(it) {
    if (it.kind === 'live') { if (it.live === 'now') openPanel('contact'); else openPanel('work', 'case-kiodem'); return; }
    if (it.kind === 'work') openPanel('work', 'case-' + it.data.id);
    else if (it.kind === 'area') openPanel(it.data.to, it.data.anchor || null);
    else openPanel(it.to || 'about');
  }
  document.querySelectorAll('.dock__btn').forEach((b) => b.addEventListener('click', () => (current === b.dataset.panel ? closePanel() : openPanel(b.dataset.panel))));

  /* Menu sklada sie z kawalkow: kazda litera przylatuje z innego miejsca i innego kata,
     w losowej kolejnosci, i trafia na swoje miejsce. Powtarza sie przy zmianie jezyka. */
  let dockShown = false;
  function assembleDock(animate) {
    const btns = [...document.querySelectorAll('.dock__btn')];
    btns.forEach((b, wi) => {
      const label = t(b.dataset.i18n);
      b.setAttribute('aria-label', label);
      b.innerHTML = [...label].map((ch, i) => '<span class="dock__ch" style="--i:' + i + '" aria-hidden="true">' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</span>').join('');
      if (!animate || reduced || !window.gsap) return;
      const chars = b.querySelectorAll('.dock__ch');
      gsap.fromTo(chars,
        { opacity: 0, x: () => gsap.utils.random(-90, 90), y: () => gsap.utils.random(-70, 30), rotation: () => gsap.utils.random(-70, 70), scale: () => gsap.utils.random(1.3, 2.1) },
        { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 1.15, ease: 'expo.out', overwrite: 'auto',
          stagger: { each: 0.028, from: 'random' }, delay: 0.1 + wi * 0.1 });
    });
  }
  $('#panel-close').addEventListener('click', closePanel);
  panelBody.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) openPanel(b.dataset.open); });
  panel.addEventListener('click', (e) => { if (e.target === panel) closePanel(); });
  $('#home').addEventListener('click', () => { closePanel(); F.tx = F.ty = 0; dock(false); });
  function route() {
    const m = location.hash.match(/^#(work|services|about|contact|brief|process)(?:\/([\w-]+))?/);
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
      if (st.type === 'text') h += '<div class="brief__field"><input class="input" type="text" inputmode="url" id="brief-site" placeholder="' + esc(st.placeholder) + '" value="' + esc(S.a.site || '') + '" autocomplete="url"></div>';
      if (st.type === 'contact') h += st.fields.map(([k, l]) => '<div class="brief__field"><label for="brief-' + k + '">' + esc(l) + '</label>' +
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
    function text() { return B().subject + '\n\n' + lines().map((l) => l[0] + ': ' + l[1]).join('\n'); }
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
        location.href = 'mailto:' + mail + '?subject=' + encodeURIComponent(B().subject) + '&body=' + encodeURIComponent(text());
        note.hidden = false; note.textContent = b.mailNote + ' ' + mail + '.';
      });
      flowIn([...stage.children], { decode: false });
      decode(stage.querySelector('.brief__q'), 120);
    }
    return { start, pick, next, back };
  })();

  /* ─── jezyk ────────────────────────────────────────────────────────────── */
  const langBox = $('.lang');
  langBox.innerHTML = LANGS.map((l) => '<button class="lang__btn" type="button" data-lang="' + l + '" aria-pressed="false">' + l.toUpperCase() + '</button>')
    .join('<span class="lang__sep" aria-hidden="true"></span>');
  function applyLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    try { localStorage.setItem('kiodem-lang', lang); } catch (e) {}
    document.querySelectorAll('[data-i18n]:not(.dock__btn)').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    assembleDock(dockShown);
    document.querySelectorAll('.lang__btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'));
    $('#panel-close').setAttribute('aria-label', t('close'));
    if (META[lang]) { document.title = META[lang].title; const md = document.querySelector('meta[name="description"]'); if (md) md.content = META[lang].description; }
    naviBtn.textContent = CURSOR.map[lang]; naviBtn.setAttribute('aria-label', CURSOR.map[lang]);
    build();
    if (current) { panelBody.innerHTML = renderPanel(current); panelBody.querySelectorAll('figure.chart').forEach(renderChart); if (current === 'brief') Brief.start(); flowIn([...panelBody.children]); }
  }
  document.querySelectorAll('.lang__btn').forEach((b) => b.addEventListener('click', () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang); }));

  /* ─── loader: powitania, pierscien, znak, logotyp, wejscie pola ────────── */
  function loader() {
    const root = $('#loader'), word = $('#loader-word'), strip = $('#loader-strip'), mark = $('#loader-mark'), wm = $('#loader-wordmark');
    const lineBox = root.querySelector('.loader__line'), line = $('#loader-line');
    const finish = () => { root.classList.add('is-done'); hero.style.opacity = ''; };
    const showDock = () => { if (dockShown) return; dockShown = true; assembleDock(true); };
    hero.style.opacity = '0';

    if (reduced || !window.gsap || /noloader/.test(location.search)) {
      word.style.display = 'none'; lineBox.style.display = 'none';
      wm.style.opacity = '1'; wm.style.filter = 'none'; wm.style.transform = 'none';
      setTimeout(() => { root.style.transition = 'opacity .5s'; root.style.opacity = '0'; setTimeout(() => { finish(); dockShown = true; assembleDock(false); }, 520); }, 700);
      return;
    }

    const plain = GREETING_BY_LANG[lang] || 'Welcome';
    const hour = new Date().getHours(), tod = hour < 5 || hour >= 18 ? 'evening' : hour < 12 ? 'morning' : 'afternoon';
    const last = (GREETING_TIME[lang] && GREETING_TIME[lang][tod]) || plain;      // ostatnie powitanie wg pory dnia odbiorcy
    const seq = GREETINGS.filter((g) => g !== plain && g !== last).concat([last]);   // zawsze pelna lista, jezyk uzytkownika na koncu
    const STEP = 0.3, ROLL = 0.18;                                      // sekundy na slowo i na przewiniecie rolki (23 IX: wolniej na prosbe Michala)
    strip.innerHTML = seq.map((g) => '<span>' + esc(g) + '</span>').join('');
    const rowH = strip.firstElementChild.getBoundingClientRect().height;
    const flyIn = () => {
      F.entering = true; build(); F.tiles.forEach((x) => { x.enter = 1; });
      const far = Math.max(...F.tiles.map((x) => x.d0)) || 1;
      let left = F.tiles.length;
      F.tiles.forEach((x) => gsap.to(x, { enter: 0, duration: 1.35, ease: 'expo.out', delay: (x.d0 / far) * 0.75,
        onComplete: () => { if (--left === 0) { F.entering = false; F.dirty = true; } } }));
    };
    const tl = gsap.timeline();
    window.__kiodemLoader = tl;                         // do podgladu klatek w narzedziach deweloperskich
    const sweep = { v: 0 };

    // cienka linia rosnie od lewej do prawej w rytmie powitan; gdy dochodzi do konca, powitania gasna
    const span = seq.length * STEP + 0.45;
    tl.to(line, { scaleX: 1, duration: span, ease: 'power1.inOut' }, 0);
    // rolka: pasek slow przewija sie o jeden wiersz w gore, jak licznik; kazde slowo chwile stoi
    for (let i = 1; i < seq.length; i++) tl.to(strip, { y: -i * rowH, duration: ROLL, ease: 'power2.inOut' }, i * STEP - ROLL);
    tl.to(word, { opacity: 0, y: -10, duration: .35, ease: 'power2.in' }, span);
    // znak odslania sie od lewej do prawej, jakby linia go rysowala, a sama linia gasnie
    tl.add('mark', span + 0.1);
    tl.set(mark, { opacity: 1 }, 'mark');
    tl.to(sweep, { v: 100, duration: .8, ease: 'power2.inOut', onUpdate: () => mark.style.setProperty('--sweep', sweep.v + '%') }, 'mark');
    tl.to(lineBox, { opacity: 0, duration: .5, ease: 'power2.out' }, 'mark+=.5');
    // obrot znaku jak monety
    tl.to(mark, { rotationY: 360, duration: 1.05, ease: 'power3.inOut', transformPerspective: 800 }, 'mark+=.75');
    // po obrocie znak jedzie na miejsce litery D w logotypie, a z niego rozwijaja sie K, I, O i M
    const L = (n) => wm.querySelector('.wm-' + n);
    tl.add('name', 'mark+=1.85');
    tl.set(wm, { opacity: 1, filter: 'none', scale: 1 }, 'name');
    tl.set([L('k'), L('i'), L('o'), L('m'), L('de')], { opacity: 0 }, 'name');
    tl.set(mark, { transformOrigin: '0 0', rotationY: 0 }, 'name');
    // cel mierzony w chwili startu (funkcje), bo zalezy od rozmiaru okna: prostokat litery D w logotypie
    const geo = () => { const r = L('de').getBoundingClientRect(), m = mark.getBoundingClientRect(); return { r, m }; };
    tl.to(mark, { x: () => { const g = geo(); return g.r.left - g.m.left; }, y: () => { const g = geo(); return g.r.top - g.m.top; },
                  scaleX: () => { const g = geo(); return g.r.height / g.m.height; }, scaleY: () => { const g = geo(); return g.r.height / g.m.height; },
                  duration: .75, ease: 'expo.inOut', immediateRender: false }, 'name');
    tl.to(L('de'), { opacity: 1, duration: .25 }, 'name+=.6');
    tl.to(mark, { opacity: 0, duration: .3 }, 'name+=.7');
    // litery wysuwaja sie spod D: O, I, K w lewo, M w prawo (jednostki viewBoxu logotypu)
    tl.fromTo(L('o'), { x: 250, opacity: 0 }, { x: 0, opacity: 1, duration: .9, ease: 'expo.out' }, 'name+=.8');
    tl.fromTo(L('i'), { x: 320, opacity: 0 }, { x: 0, opacity: 1, duration: .9, ease: 'expo.out' }, 'name+=.88');
    tl.fromTo(L('k'), { x: 560, opacity: 0 }, { x: 0, opacity: 1, duration: .95, ease: 'expo.out' }, 'name+=.96');
    tl.fromTo(L('m'), { x: -420, opacity: 0 }, { x: 0, opacity: 1, duration: .9, ease: 'expo.out' }, 'name+=.84');
    // kafelki przylatuja spoza ekranu na swoje miejsca, kurtyna znika
    tl.add('field', 'name+=1.5');
    tl.call(flyIn, null, 'field');
    tl.to(root, { backgroundColor: 'rgba(8,10,15,0)', duration: .8 }, 'field');
    tl.set(hero, { opacity: 1 }, 'field+=.6');
    tl.call(() => decode($('.hero__line')), null, 'field+=.6');
    tl.to(wm, { opacity: 0, duration: .3 }, 'field+=.6');
    tl.call(showDock, null, 'field+=.8');
    tl.call(finish, null, 'field+=1');
  }

  /* ─── kursor z etykieta i magnetyczne przyciski (tylko wskaznik precyzyjny) ── */
  if (!coarse && !reduced && window.gsap) {
    const cur = document.createElement('div');
    cur.className = 'cursor'; cur.innerHTML = '<span class="cursor__dot"></span><span class="cursor__label"></span>';
    document.body.appendChild(cur);
    document.body.classList.add('has-cursor');
    const lab = cur.querySelector('.cursor__label');
    const cx = gsap.quickTo(cur, 'x', { duration: .18, ease: 'power3.out' }), cy = gsap.quickTo(cur, 'y', { duration: .18, ease: 'power3.out' });
    let state = '', labText = '';
    const setState = (s, text) => {
      if (s === state) return; state = s; cur.dataset.state = s;
      if (text && text !== labText) { labText = text; lab.innerHTML = [...text].map((ch) => '<span>' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</span>').join(''); }
    };
    /* Kolor kursora liczony osobno dla kropki i kazdej litery, w kazdej klatce: co lezy pod danym
       punktem (kafelek jasny, przygaszony, ciemny, puste tlo), jego kolor tla zmieszany z tlem strony
       wg przezroczystosci, jasnosc powyzej progu = ciemna litera. Napis na styku dwoch kafelkow
       dostaje wiec dwa kolory, a pole dryfujace pod nieruchomym kursorem tez przelicza sie samo. */
    const dot = cur.querySelector('.cursor__dot');
    const lumCache = new Map();
    const lightUnder = (x, y) => {
      const el = document.elementFromPoint(x, y), tile = el && el.closest ? el.closest('.tile') : null;
      if (!tile) return false;
      const key = tile.style.opacity;
      let L = lumCache.get(tile);
      if (!L || L.k !== key) {
        const m = getComputedStyle(tile).backgroundColor.match(/\d+(?:\.\d+)?/g), op = parseFloat(key || 1);
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        const mix = (a, b) => a * op + b * (1 - op);
        L = { k: key, v: m ? 0.2126 * lin(mix(+m[0], 8)) + 0.7152 * lin(mix(+m[1], 10)) + 0.0722 * lin(mix(+m[2], 15)) : 0 };
        lumCache.set(tile, L);
      }
      return L.v > 0.14;
    };
    gsap.ticker.add(() => {
      if (state === 'off' || state === 'ui' || !state) return;
      const d = dot.getBoundingClientRect();
      dot.classList.toggle('is-dark', lightUnder(d.left + d.width / 2, d.top + d.height / 2));
      for (const sp of lab.children) { const r = sp.getBoundingClientRect(); if (r.width) sp.classList.toggle('is-dark', lightUnder(r.left + r.width / 2, r.top + r.height / 2)); }
    });
    const magnets = [...document.querySelectorAll('.dock__btn'), $('#home')];
    document.addEventListener('pointermove', (e) => {
      cx(e.clientX); cy(e.clientY);
      const t = e.target;
      const tile = t.closest('.tile');
      if (panel.classList.contains('is-open')) setState('off');
      else if (tile) setState('open', CURSOR.open[lang]);
      else if (t.closest('.top, .dock, .navi')) setState('ui');
      else if (t.closest('.viewport')) setState(F.dragging ? 'grab' : 'drag', CURSOR.drag[lang]);
      else setState('off');
      // magnes: przycisk w promieniu 56 px lekko idzie za kursorem
      for (const b of magnets) {
        const r = b.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const near = Math.hypot(dx, dy) < 56;
        gsap.to(b, { x: near ? dx * 0.32 : 0, y: near ? dy * 0.32 : 0, duration: near ? .25 : .5, ease: 'power3.out', overwrite: 'auto' });
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => setState('off'));
    viewport.addEventListener('pointerdown', () => { if (state === 'drag') setState('grab'); });
    viewport.addEventListener('pointerup', () => { if (state === 'grab') setState('drag', CURSOR.drag[lang]); });
  }

  /* ─── start ────────────────────────────────────────────────────────────── */
  F.lastInput = performance.now();
  applyLang(lang);
  requestAnimationFrame(frame);
  loader();
  route();
})();
