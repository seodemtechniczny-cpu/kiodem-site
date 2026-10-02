// Tryb zastępczy bez akceleracji grafiki: obrót 360° z gotowych ujęć (klatki/<wykończenie>-<szerokość>/NN.webp).
// Canvas ma rozmiar klatki i rysuje 1:1 (bez GPU każde przeskalowanie przy drawImage jest programowe);
// kadrowanie robi CSS. Klatki dekodują się z wyprzedzeniem przez fetch → blob → createImageBitmap.
export async function utworzKlatki(plotno, par) {
	const N = par.zastepczy.klatek, k = plotno.getContext('2d');
	let zestaw = '', bitmapy = [], nr = N - 3, zadanie = 0;
	const widoki = { trzy: N - 3, przod: 0, recepcja: Math.round(N * 0.42) }; // klatka i = obrót o i·(360°/N)

	function rysuj() {
		const b = bitmapy[((nr % N) + N) % N]; if (!b) return;
		if (plotno.width !== b.width) { plotno.width = b.width; plotno.height = b.height; }
		k.drawImage(b, 0, 0);
	}
	async function wczytaj(nazwa) {
		const moje = ++zadanie, nowe = new Array(N);
		const jedna = async (i) => {
			const odp = await fetch(`klatki/${nazwa}/${String(i + 1).padStart(2, '0')}.webp`);
			if (!odp.ok) throw new Error('brak klatki');
			nowe[i] = await createImageBitmap(await odp.blob());
		};
		const biez = ((nr % N) + N) % N;
		await jedna(biez); // najpierw bieżące ujęcie, reszta w tle
		if (moje !== zadanie) return;
		const stare = bitmapy; bitmapy = nowe; zestaw = nazwa; rysuj(); tloZKlatki(nowe[biez]);
		stare.forEach((b) => b && b.close && b.close());
		await Promise.all([...Array(N).keys()].filter((i) => i !== biez).map((i) => jedna(i).then(() => { if (moje === zadanie && i === ((nr % N) + N) % N) rysuj(); })));
	}
	// tło sceny = skrajna kolumna klatki rozciągnięta na boki, a nad i pod klatką jej pierwszy i ostatni wiersz;
	// dzięki temu kadr „contain” nie ma widocznych krawędzi przy żadnych proporcjach okna
	let kolumna = null;
	function tloZKlatki(b) {
		const c = document.createElement('canvas'); c.width = 1; c.height = 16;
		const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(b, 0, 0, 2, b.height, 0, 0, 1, 16);
		kolumna = { d: x.getImageData(0, 0, 1, 16).data, prop: b.width / b.height }; ulozTlo();
	}
	function ulozTlo() {
		if (!kolumna) return;
		const r = plotno.parentElement.getBoundingClientRect(), h = Math.min(r.height, r.width / kolumna.prop), gora = (r.height - h) / 2, d = kolumna.d;
		const st = []; for (let i = 0; i < 16; i++) st.push(`rgb(${d[i * 4]},${d[i * 4 + 1]},${d[i * 4 + 2]}) ${(gora + (i + 0.5) / 16 * h).toFixed(1)}px`);
		plotno.parentElement.style.background = `linear-gradient(${st.join(',')})`;
	}
	new ResizeObserver(ulozTlo).observe(plotno.parentElement);

	// obrót: przeciąganie i strzałki
	let start = null;
	plotno.addEventListener('pointerdown', (e) => { start = { x: e.clientX, nr }; plotno.setPointerCapture(e.pointerId); });
	plotno.addEventListener('pointermove', (e) => {
		if (!start) return;
		const nowy = start.nr - Math.round((e.clientX - start.x) / (plotno.clientWidth / N * 0.9));
		if (nowy !== nr) { nr = nowy; rysuj(); }
	});
	plotno.addEventListener('pointerup', () => { start = null; });
	plotno.addEventListener('pointercancel', () => { start = null; });
	plotno.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowLeft') nr++; else if (e.key === 'ArrowRight') nr--; else return;
		e.preventDefault(); rysuj();
	});

	return {
		async zastosuj(stan) { const nazwa = `${stan.wyk}-${stan.szer}`; if (nazwa !== zestaw) await wczytaj(nazwa).catch(() => {}); },
		widok(nazwa) { if (nazwa in widoki) { nr = widoki[nazwa]; rysuj(); } },
		ustawLogo() {},
	};
}
