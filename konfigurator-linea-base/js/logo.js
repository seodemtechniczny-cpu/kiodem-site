// Logo na froncie: SVG → litery przestrzenne, PNG/JPG → płaski nadruk. Plik nie opuszcza przeglądarki.
// SVG czytamy jako tekst i parsujemy do ścieżek; nigdy nie trafia do DOM, więc skrypty w nim nie mają jak się wykonać.

const MAX_BAJTOW = 2 * 1024 * 1024, MAX_PUNKTOW = 60000;

// Łuna dla logo podświetlanego: rozmyty biały ślad kształtu (sam cień canvasu, kształt rysowany poza kadrem),
// barwiony potem kolorem LED. maluj(ctx, S, ox, oy) rysuje logo o szerokości S ze środkiem w (ox, oy).
function luna(maluj, proporcja, T) {
	const mg = 0.24, S = 420, c = document.createElement('canvas');
	c.width = Math.round(S * (1 + 2 * mg)); c.height = Math.round(S * (proporcja + 2 * mg));
	const k = c.getContext('2d');
	k.shadowColor = '#ffffff'; k.shadowBlur = S * 0.12; k.shadowOffsetX = c.width * 2; k.fillStyle = '#ffffff';
	for (let i = 0; i < 5; i++) maluj(k, S, S * mg + S / 2 - c.width * 2, S * mg + S * proporcja / 2);
	const texture = new T.CanvasTexture(c); texture.colorSpace = T.SRGBColorSpace;
	return { texture, margines: mg };
}

export function logoZSvg(tekst, T, id = 'svg') {
	const dane = new T.SVGLoader().parse(tekst);
	const ksztalty = [];
	for (const sciezka of dane.paths) {
		const styl = sciezka.userData?.style || {};
		if (styl.fill === 'none' || styl.fillOpacity === 0) continue; // same obrysy pomijamy: nie da się z nich zrobić bryły
		ksztalty.push(...sciezka.toShapes());
	}
	if (!ksztalty.length) throw new Error('W tym pliku nie ma wypełnionych kształtów. Zapisz logo jako krzywe z wypełnieniem.');
	// rozmiar w jednostkach SVG, żeby dobrać głębokość i fazę proporcjonalnie
	const ramka = new T.Box2();
	let punktow = 0;
	for (const k of ksztalty) for (const p of k.getPoints(6)) { ramka.expandByPoint(p); punktow++; }
	if (punktow > MAX_PUNKTOW) throw new Error('To logo jest zbyt złożone na litery przestrzenne. Uprość krzywe albo wgraj PNG.');
	const szer = ramka.max.x - ramka.min.x, wys = ramka.max.y - ramka.min.y;
	if (!(szer > 0 && wys > 0)) throw new Error('Nie udało się odczytać rozmiaru logo.');
	const glebia = szer * 0.02;
	const geo = new T.ExtrudeGeometry(ksztalty, { depth: glebia, curveSegments: 10, bevelEnabled: true, bevelThickness: glebia * 0.12, bevelSize: szer * 0.0012, bevelSegments: 2 });
	// środek w zerze, szerokość = 1, głębokość 0..1 (oś Y zostaje „w dół” jak w SVG; scena odwraca ją skalą).
	// Wymiary bierzemy z gotowej bryły, nie z punktów kształtów: to ona decyduje o tym, co widać.
	geo.computeBoundingBox();
	const r = geo.boundingBox, sx = r.max.x - r.min.x, sy = r.max.y - r.min.y, cx = (r.min.x + r.max.x) / 2, cy = (r.min.y + r.max.y) / 2;
	geo.translate(-cx, -cy, -r.min.z); geo.scale(1 / sx, 1 / sx, 1 / (r.max.z - r.min.z));
	geo.computeVertexNormals();
	const plaski = new T.ShapeGeometry(ksztalty, 10); // płaski obrys pod cień kontaktowy liter
	plaski.translate(-cx, -cy, 0); plaski.scale(1 / sx, 1 / sx, 1);
	const poswiata = luna((k, S, ox, oy) => {
		for (const ks of ksztalty) {
			k.beginPath();
			for (const kontur of [ks.getPoints(10), ...ks.holes.map((h) => h.getPoints(10))]) {
				kontur.forEach((pt, i) => k[i ? 'lineTo' : 'moveTo']((pt.x - cx) / sx * S + ox, (pt.y - cy) / sx * S + oy)); k.closePath();
			}
			k.fill('evenodd');
		}
	}, sy / sx, T);
	return { typ: 'svg', id, geometry: geo, plaski, poswiata, proporcja: sy / sx };
}

// Obraz rastrowy: jeśli nie ma przezroczystości, zdejmujemy jednolite tło wzięte z narożników.
export function logoZObrazu(obraz, T, id = 'png') {
	const maks = 1024, skala = Math.min(1, maks / Math.max(obraz.width, obraz.height));
	const c = document.createElement('canvas'); c.width = Math.round(obraz.width * skala); c.height = Math.round(obraz.height * skala);
	const k = c.getContext('2d', { willReadFrequently: true }); k.drawImage(obraz, 0, 0, c.width, c.height);
	const px = k.getImageData(0, 0, c.width, c.height), a = px.data;
	let przezroczyste = 0; for (let i = 3; i < a.length; i += 4 * 97) if (a[i] < 250) przezroczyste++;
	if (!przezroczyste) {
		const rog = (x, y) => { const i = (y * c.width + x) * 4; return [a[i], a[i + 1], a[i + 2]]; };
		const rogi = [rog(0, 0), rog(c.width - 1, 0), rog(0, c.height - 1), rog(c.width - 1, c.height - 1)];
		const tlo = [0, 1, 2].map((n) => rogi.reduce((s, r) => s + r[n], 0) / 4);
		const jednolite = rogi.every((r) => Math.hypot(r[0] - tlo[0], r[1] - tlo[1], r[2] - tlo[2]) < 24);
		if (!jednolite) throw new Error('To zdjęcie nie ma jednolitego tła. Wgraj logo jako PNG z przezroczystością albo SVG.');
		for (let i = 0; i < a.length; i += 4) {
			const o = Math.hypot(a[i] - tlo[0], a[i + 1] - tlo[1], a[i + 2] - tlo[2]);
			a[i + 3] = o < 28 ? 0 : o < 70 ? Math.round((o - 28) / 42 * 255) : 255;
		}
	}
	// przycięcie do treści
	let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
	for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (a[(y * c.width + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
	if (x1 < x0) throw new Error('Po usunięciu tła nic nie zostało. Wgraj logo w innym kolorze niż tło.');
	k.putImageData(px, 0, 0);
	const sw = x1 - x0 + 1, sh = y1 - y0 + 1;
	const wyc = document.createElement('canvas'); wyc.width = sw; wyc.height = sh; wyc.getContext('2d').drawImage(c, x0, y0, sw, sh, 0, 0, sw, sh);
	const alfaC = document.createElement('canvas'); alfaC.width = sw; alfaC.height = sh;
	const ak = alfaC.getContext('2d'), ap = ak.createImageData(sw, sh), zr = wyc.getContext('2d').getImageData(0, 0, sw, sh).data;
	for (let i = 0; i < zr.length; i += 4) { ap.data[i] = ap.data[i + 1] = ap.data[i + 2] = zr[i + 3]; ap.data[i + 3] = 255; }
	ak.putImageData(ap, 0, 0);
	const texture = new T.CanvasTexture(wyc); texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 8;
	const alfa = new T.CanvasTexture(alfaC); alfa.anisotropy = 8;
	const poswiata = luna((k, S, ox, oy) => k.drawImage(wyc, ox - S / 2, oy - S * (sh / sw) / 2, S, S * (sh / sw)), sh / sw, T);
	return { typ: 'png', id, texture, alfa, poswiata, proporcja: sh / sw };
}

export async function logoZPliku(plik, T) {
	if (plik.size > MAX_BAJTOW) throw new Error('Plik jest większy niż 2 MB. Zmniejsz logo i spróbuj ponownie.');
	const id = plik.name + ':' + plik.size + ':' + plik.lastModified;
	const svg = plik.type === 'image/svg+xml' || /\.svg$/i.test(plik.name);
	if (svg) return logoZSvg(await plik.text(), T, id);
	if (!/^image\/(png|jpeg|webp)$/.test(plik.type)) throw new Error('Obsługiwane formaty: SVG, PNG, JPG, WebP.');
	const obraz = await createImageBitmap(plik);
	return logoZObrazu(obraz, T, id);
}
