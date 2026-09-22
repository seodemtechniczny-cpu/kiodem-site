/* KIODEM — pole kafelkow w perspektywie, loader z powitaniami, panele sekcji.
   Bez frameworka: jeden plik, dane na gorze, zachowanie ponizej. */
(function () {
  'use strict';

  /* ─── dane ─────────────────────────────────────────────────────────────── */
  const D = window.KIODEM_DATA;
  const LANGS = D.LANGS, I18N = D.I18N, WORK = D.WORK, SERVICES = D.SERVICES, CHARTS = D.CHARTS;
  const GREETINGS = D.GREETINGS, GREETING_BY_LANG = D.GREETING_BY_LANG, LOCALES = D.LOCALES;

  /* ─── stan ─────────────────────────────────────────────────────────────── */
  const $ = (s) => document.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  let lang = (function () {
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
      return (w.img ? '<img src="assets/work/' + w.img + '-bw.webp" alt="" loading="lazy" onload="this.classList.add(\'is-loaded\')" onerror="this.remove()">' : '') +
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
      const block = (title, items) => items && items[lang] && items[lang].length
        ? '<h4 class="case__h">' + esc(title) + '</h4><ul class="list list--tight">' + items[lang].map((d) => '<li>' + esc(d) + '</li>').join('') + '</ul>' : '';
      return '<p class="lead">' + L.workLead + '</p>' + WORK.map((w) =>
        '<article class="case" id="case-' + w.id + '">' +
        (w.img ? '<img class="case__thumb" src="assets/work/' + w.img + '.webp" alt="" loading="lazy" onload="this.classList.add(\'is-loaded\')" onerror="this.remove()">' : '') +
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
  const langBox = $('.lang');
  langBox.innerHTML = LANGS.map((l) => '<button class="lang__btn" type="button" data-lang="' + l + '" aria-pressed="false">' + l.toUpperCase() + '</button>')
    .join('<span class="lang__sep" aria-hidden="true"></span>');
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

    const last = GREETING_BY_LANG[lang] || 'Welcome';
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
