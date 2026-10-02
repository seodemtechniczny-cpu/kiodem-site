// Interfejs konfiguratora: stan, kod konfiguracji w adresie, wybór trybu (scena 3D albo gotowe ujęcia).
const $ = (s) => document.querySelector(s);
const par = await (await fetch('parametry.json')).json();
const q = new URLSearchParams(location.search);

// ——— tryb: bez sprzętowego WebGL nie pobieramy biblioteki 3D ———
function maGpu() {
	if (q.get('gpu') === '0') return false;
	try { return !!document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true }); } catch { return false; }
}
const tryb3d = maGpu();
document.documentElement.classList.toggle('tryb-klatki', !tryb3d);
$('#uwaga-trybu').hidden = tryb3d;

// ——— stan i kod w adresie: jeden znak na grupę, w stałej kolejności. Nowe grupy dopisuj NA KOŃCU:
// krótszy (starszy) kod dalej się czyta, brakujące pola biorą wartości domyślne ———
const id = (lista) => lista.map((x) => x.id);
const POLA = [
	['szer', par.szerokosci], ['gleb', par.glebokosci], ['wyk', id(par.wykonczenia)], ['str', id(par.struktury)],
	['cokol', id(par.cokoly)], ['logo', id(par.loga)], ['otoczenie', id(par.otoczenia)],
	['wys', par.wysokosci], ['akcent', id(par.akcenty)], ['blat', id(par.blaty)], ['gniazda', id(par.gniazda)], ['przepust', id(par.przepusty)],
	['posadzka', id(par.posadzki)], ['pora', id(par.pory)], ['gniazdaKolor', id(par.gniazdaKolory)], ['ladowarka', id(par.ladowarki)], ['led', id(par.ledy)],
];
const KOLORY = ['kolorLady', 'kolorBlatu', 'kolorLogo', 'kolorLed', 'kolorSciany', 'kolorPosadzki']; // nowe kolory dopisuj na końcu
const koduj = (s) => POLA.map(([n, lista]) => lista.indexOf(s[n]).toString(36)).join('');
function dekoduj(kod) {
	if (!kod || kod.length > POLA.length) return null;
	const s = {};
	for (const [i, znak] of [...kod].entries()) { const [n, lista] = POLA[i], v = lista[parseInt(znak, 36)]; if (v === undefined) return null; s[n] = v; }
	return s;
}
function kolory(tekst) { // &kolory=24403a-1a1a1a-ffffff-ffd9a0
	const cz = (tekst || '').split('-'), s = {};
	if (cz.length <= KOLORY.length && cz.every((c) => /^[0-9a-f]{6}$/i.test(c))) cz.forEach((c, i) => { s[KOLORY[i]] = '#' + c.toLowerCase(); }); // starszy, krótszy zapis też się czyta
	return s;
}
const zKodu = dekoduj(q.get('lada')) || {};
if (zKodu.otoczenie === 'marmur' && !('posadzka' in zKodu)) zKodu.posadzka = 'marmur'; // starsze linki: „ściana z marmuru” miała też marmurową posadzkę
const stan = { ...par.domyslne, ...zKodu, ...kolory(q.get('kolory')), otwarte: false, wymiary: true }; // błędny kod cicho wraca do domyślnej
let logoWlasne = false;
const wykonczenie = () => par.wykonczenia.find((x) => x.id === stan.wyk);
function uporzadkuj(zmienioneWyk) { // reguły zależne od materiału i logo
	const wk = wykonczenie();
	if (wk.szklo) { if (zmienioneWyk) { stan.str = 'polysk'; stan.cokol = 'zloto'; } } // połysk to tylko punkt startu: szkło bywa też satynowe i ryflowane
	else if (zmienioneWyk) { stan.cokol = 'material'; if (stan.str === 'polysk' && wk.grupa !== 'kamien' && !wk.wlasny) stan.str = 'mat'; }
	if (!tryb3d) {
		if (!wk.klatki) stan.wyk = 'trawertyn';
		stan.szer = par.zastepczy.szerokosci.reduce((a, b) => (Math.abs(b - stan.szer) < Math.abs(a - stan.szer) ? b : a));
	}
}
uporzadkuj(false);

// ——— budowa pól ———
function radia(kontener, nazwa, opcje) {
	for (const o of opcje) {
		const l = document.createElement('label'), i = document.createElement('input'), sp = document.createElement('span');
		i.type = 'radio'; i.name = nazwa; i.value = o.id; sp.className = 'opcja'; sp.textContent = o.nazwa;
		l.append(i, sp); kontener.append(l);
	}
}
const cm = (lista) => lista.map((g) => ({ id: g, nazwa: g + ' cm' }));
radia($('#gleb'), 'gleb', cm(par.glebokosci));
radia($('#szer-klatki'), 'szerK', cm(par.zastepczy.szerokosci));
for (const [n, lista] of Object.entries({ str: 'struktury', cokol: 'cokoly', akcent: 'akcenty', blat: 'blaty', logo: 'loga', gniazda: 'gniazda', przepust: 'przepusty', otoczenie: 'otoczenia', posadzka: 'posadzki', pora: 'pory', gniazdaKolor: 'gniazdaKolory', ladowarka: 'ladowarki', led: 'ledy' })) radia($('#' + n), n, par[lista]);
for (const wk of par.wykonczenia) {
	const l = document.createElement('label'), i = document.createElement('input'), pl = document.createElement('span'), pod = document.createElement('span'), rodz = document.createElement('span');
	i.type = 'radio'; i.name = 'wyk'; i.value = wk.id;
	pl.className = 'plytka' + (wk.szklo ? ' szklo' : '') + (wk.wlasny ? ' kolor' : '');
	if (wk.tekstura) pl.style.backgroundImage = `url(zasoby/miniatury/${wk.id}.webp)`; else if (!wk.wlasny) pl.style.backgroundColor = wk.kolor;
	pod.className = 'podpis'; pod.textContent = wk.nazwa; rodz.className = 'rodzaj'; rodz.textContent = wk.rodzaj; pod.append(rodz);
	l.append(i, pl, pod); $('#wyk-' + (wk.grupa || 'oferta')).append(l);
}

// ——— silnik obrazu ———
const plotno = $('#plotno');
let silnik;
const etykietaFrontu = (svg) => { document.querySelector('input[name="logo"][value="front"] + .opcja').textContent = svg ? 'W kolorze frontu' : 'Nadruk w kolorach pliku'; };
if (tryb3d) {
	const { utworzScene } = await import('./scena3d.js');
	const { logoZSvg, logoZPliku } = await import('./logo.js');
	silnik = await utworzScene(plotno, par);
	const svgMeume = await (await fetch('zasoby/logo/meume.svg')).text();
	const logoMeume = () => silnik.ustawLogo(logoZSvg(svgMeume, silnik.T, 'meume'));
	logoMeume();
	$('#plik-logo').addEventListener('change', async (e) => {
		const plik = e.target.files[0], pole = $('#logo-stan'); if (!plik) return;
		try {
			const logo = await logoZPliku(plik, silnik.T);
			silnik.ustawLogo(logo); logoWlasne = true; $('#logo-meume').hidden = false;
			if (stan.logo === 'brak') stan.logo = 'zloto';
			etykietaFrontu(logo.typ === 'svg'); pole.classList.remove('blad');
			pole.textContent = logo.typ === 'svg' ? `Wczytane: ${plik.name}. Litery przestrzenne z krzywych pliku; wybierz wykonanie powyżej.` : `Wczytane: ${plik.name}. Płaski nadruk; wybierz wykonanie powyżej.`;
			odswiez(); silnik.widok('logo'); oznaczWidok('logo');
		} catch (blad) { pole.classList.add('blad'); pole.textContent = blad.message || 'Nie udało się wczytać tego pliku.'; }
		e.target.value = '';
	});
	$('#logo-meume').addEventListener('click', () => { logoMeume(); logoWlasne = false; $('#logo-meume').hidden = true; etykietaFrontu(true); $('#logo-stan').textContent = 'Wróciło logo MEUME.'; odswiez(); });
	plotno.addEventListener('lada:szafki', () => przelaczSzafki());
	plotno.addEventListener('lada:ruch', () => { $('#podpowiedz').classList.add('zgasla'); oznaczWidok(null); });
	// do pomiarów i nagrań; wlasneLogo: true udaje wgrane logo (odblokowuje wykonania)
	window.__lada = { silnik, stan, ustaw: (zm) => { if ('wlasneLogo' in zm) { logoWlasne = zm.wlasneLogo; delete zm.wlasneLogo; } const zmWyk = 'wyk' in zm && zm.wyk !== stan.wyk && !('str' in zm); Object.assign(stan, zm); uporzadkuj(zmWyk); return odswiez(); } };
} else {
	const { utworzKlatki } = await import('./zastepczy.js');
	silnik = await utworzKlatki(plotno, par);
}

// ——— odświeżanie ———
const zaznacz = (nazwa, v) => { const e = document.querySelector(`input[name="${nazwa}"][value="${v}"]`); if (e) e.checked = true; };
const nazwa = (lista, i) => lista.find((x) => x.id === i)?.nazwa;
async function odswiez(natychmiast = false) {
	for (const n of ['szer', 'wys']) { $('#' + n).value = stan[n]; $(`#${n}-wynik`).textContent = stan[n] + ' cm'; }
	for (const [n] of POLA.slice(1)) if (n !== 'wys') zaznacz(n, stan[n]);
	zaznacz('szerK', stan.szer); $('#wymiary').checked = stan.wymiary;
	for (const e of document.querySelectorAll('input[type="color"]')) e.value = stan[e.dataset.pole || e.id]; // kolor światła ma dwa pola: przy logo i przy LED pod ladą
	const wk = wykonczenie();
	for (const e of document.querySelectorAll('[data-gdy]')) e.hidden = !e.dataset.gdy.split('|').some((w) => { const [n, v] = w.split('='); return stan[n] === v; });
	document.querySelector('.plytka.kolor')?.style.setProperty('--wybrany', stan.kolorLady);
	const hex = (k) => stan[k].toUpperCase();
	const logoOpis = stan.logo === 'brak' ? 'Bez logo' : (logoWlasne ? 'Własne, ' : 'MEUME, ') + nazwa(par.loga, stan.logo).toLowerCase() + (stan.logo === 'kolor' ? ' ' + hex('kolorLogo') : stan.logo === 'led' ? ', światło ' + hex('kolorLed') : '');
	const gn = stan.gniazda === '0' ? '' : (stan.gniazda === '1' ? 'jeden moduł gniazd' : 'dwa moduły gniazd') + ', ' + nazwa(par.gniazdaKolory, stan.gniazdaKolor).toLowerCase();
	const wyposazenie = [gn, stan.ladowarka === 'tak' ? 'ładowarka indukcyjna' : '', stan.przepust === 'tak' ? 'przepust kablowy' : '', stan.led === 'tak' ? 'LED pod ladą ' + hex('kolorLed') : ''].filter(Boolean).join('; ') || 'Brak';
	const wiersze = tryb3d ? [
		['Szerokość', stan.szer + ' cm'], ['Głębokość', stan.gleb + ' cm'], ['Wysokość', stan.wys + ' cm'],
		['Wykończenie', wk.nazwa + (wk.wlasny ? ' ' + hex('kolorLady') : '')], ['Powierzchnia', nazwa(par.struktury, stan.str)],
		['Cokół', nazwa(par.cokoly, stan.cokol)], ['Akcenty', nazwa(par.akcenty, stan.akcent)],
		['Blat', nazwa(par.blaty, stan.blat) + (stan.blat === 'kolor' ? ' ' + hex('kolorBlatu') : '')], ['Logo', logoOpis], ['Wyposażenie', wyposazenie],
	] : [['Szerokość', stan.szer + ' cm'], ['Wykończenie', wk.nazwa]];
	$('#lista').replaceChildren(...wiersze.flatMap(([a, b]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = a; dd.textContent = b; return [dt, dd]; }));
	const kod = koduj(stan), adres = new URL(location.href); adres.searchParams.set('lada', kod);
	adres.searchParams.set('kolory', KOLORY.map((n) => stan[n].slice(1)).join('-'));
	history.replaceState(null, '', adres); // pasek adresu zawsze da się skopiować
	const wyc = new URL(par.adresWyceny); wyc.searchParams.set('konfiguracja', kod); $('#wycena').href = wyc;
	$('#szafki').setAttribute('aria-pressed', stan.otwarte); $('#szafki').textContent = stan.otwarte ? 'Zamknij szafki' : 'Otwórz szafki';
	// podpisy na scenie: jasne, gdy tło pod nimi jest ciemne (wieczór u góry, ciemna posadzka na dole)
	const scenaEl = $('.scena'); const ciemny = (hex, prog = 150) => { const n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < prog; };
	const scianaBarwiona = ['farba', 'beton', 'mikrocement'].includes(stan.otoczenie), posBarwiona = ['mikrocement', 'kolor'].includes(stan.posadzka);
	scenaEl.classList.toggle('wieczor', tryb3d && (stan.pora === 'wieczor' || (scianaBarwiona && ciemny(stan.kolorSciany, 175))));
	scenaEl.classList.toggle('ciemny-dol', tryb3d && (stan.pora === 'wieczor' || ['ciemna', 'beton', 'jodelka'].includes(stan.posadzka) || (posBarwiona && ciemny(stan.kolorPosadzki))));
	await silnik.zastosuj(stan, natychmiast);
}
function oznaczWidok(n) { for (const p of document.querySelectorAll('[data-widok]')) p.classList.toggle('biezacy', p.dataset.widok === n); }
function przelaczSzafki(wartosc = !stan.otwarte) {
	stan.otwarte = wartosc; odswiez();
	if (wartosc) { silnik.widok('recepcja'); oznaczWidok('recepcja'); }
}

// ——— zdarzenia ———
$('#formularz').addEventListener('input', (e) => {
	const { name, value } = e.target, pole = e.target.dataset.pole || e.target.id;
	if (name === 'szer' || name === 'szerK') stan.szer = +value;
	else if (name === 'gleb' || name === 'wys') stan[name] = +value;
	else if (KOLORY.includes(pole)) stan[pole] = value;
	else if (name in stan) stan[name] = value;
	else if (pole === 'wymiary') stan.wymiary = e.target.checked;
	else return;
	uporzadkuj(name === 'wyk'); odswiez();
	// kamera podjeżdża do elementu, który właśnie się zmienia
	if ((name === 'logo' && value !== 'brak') || pole === 'kolorLogo' || pole === 'kolorLed') { silnik.widok('logo'); oznaczWidok('logo'); }
	if (name === 'cokol' || name === 'akcent' || name === 'led') { silnik.widok('cokol'); oznaczWidok(null); }
	if (name === 'ladowarka' || name === 'blat' || pole === 'kolorBlatu') { silnik.widok('blat'); oznaczWidok(null); }
	if (name === 'gniazda' || name === 'przepust' || name === 'gniazdaKolor') { silnik.widok('wyposazenie'); oznaczWidok(null); }
});
$('#formularz').addEventListener('submit', (e) => e.preventDefault());
$('#pobierz').addEventListener('click', () => { // obraz bieżącego kadru: scena 3D albo klatka trybu zastępczego
	const a = document.createElement('a'); a.href = silnik.zdjecie ? silnik.zdjecie() : plotno.toDataURL('image/jpeg', 0.92);
	a.download = `linea-base-${stan.szer}x${stan.gleb}x${stan.wys}-${stan.wyk}.jpg`; a.click();
});
for (const p of document.querySelectorAll('[data-widok]')) p.addEventListener('click', () => { silnik.widok(p.dataset.widok); oznaczWidok(p.dataset.widok); });
$('#szafki').addEventListener('click', () => przelaczSzafki());
$('#kopiuj').addEventListener('click', async () => {
	const pole = $('#kopiuj-stan');
	try { await navigator.clipboard.writeText(location.href); }
	catch { // schowek bywa zablokowany poza https
		const t = document.createElement('textarea'); t.value = location.href; document.body.append(t); t.select();
		try { document.execCommand('copy'); } finally { t.remove(); }
	}
	pole.textContent = 'Link skopiowany.'; setTimeout(() => { pole.textContent = ''; }, 2500);
});

await odswiez(true);
$('#ladowanie').remove();
if (tryb3d) {
	$('#podpowiedz').hidden = false;
	const bezRuchu = matchMedia('(prefers-reduced-motion: reduce)').matches || q.has('bezruchu');
	silnik.widok('przod', true);                     // jedyny ruch samoistny: dojazd z frontu do trzech czwartych
	silnik.widok('trzy', bezRuchu); oznaczWidok('trzy');
	setTimeout(() => $('#podpowiedz').classList.add('zgasla'), 9000);
}
document.documentElement.dataset.gotowe = '1';
