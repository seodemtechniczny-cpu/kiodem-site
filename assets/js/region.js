/* Jezyk wedlug regionu. Dziala tylko na stronach angielskich (x-default) i tylko wtedy, gdy
   odwiedzajacy sam nie wybral jezyka (localStorage 'kiodem-lang' ustawia klikniecie w jezyk).
   Kraj z /cdn-cgi/trace (Cloudflare), cel z <link rel="alternate" hreflang>, wiec 404 i strony
   bez wersji jezykowej nigdzie nie przenosza. Roboty zostaja na EN. */
(function () {
  var KEY = 'kiodem-lang';
  var BY_COUNTRY = { PL: 'pl', DE: 'de', AT: 'de', LI: 'de', FR: 'fr', MC: 'fr' };
  'ES MX AR CO CL PE VE EC GT CU BO DO HN PY SV NI CR PA UY'.split(' ').forEach(function (c) { BY_COUNTRY[c] = 'es'; });
  var MIXED = { CH: ['de', 'fr'], BE: ['fr'], LU: ['fr', 'de'] };   // kraje wielojezyczne: decyduje przegladarka

  function langFor(country) {
    if (MIXED[country]) {
      var nav = (navigator.languages || [navigator.language || '']).map(function (l) { return String(l).slice(0, 2).toLowerCase(); });
      for (var i = 0; i < nav.length; i++) if (MIXED[country].indexOf(nav[i]) > -1) return nav[i];
      return MIXED[country][0];
    }
    return BY_COUNTRY[country] || null;
  }

  // reczny wybor jezyka (linki jezykow na podstronach) wygrywa z regionem
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[hreflang]');
    if (a) try { localStorage.setItem(KEY, a.getAttribute('hreflang')); } catch (x) {}
  });

  if (document.documentElement.lang !== 'en') return;
  try { if (localStorage.getItem(KEY)) return; } catch (x) { return; }
  if (/bot|crawl|spider|slurp|lighthouse|headless/i.test(navigator.userAgent)) return;

  fetch('/cdn-cgi/trace', { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (txt) {
    var m = /(?:^|\n)loc=([A-Z]{2})/.exec(txt), l = m && langFor(m[1]);
    if (!l || l === 'en') return;
    var alt = document.querySelector('link[rel="alternate"][hreflang="' + l + '"]');
    if (alt && alt.href !== location.href.split('#')[0].split('?')[0]) location.replace(alt.href + location.search + location.hash);
  }).catch(function () {});
})();
