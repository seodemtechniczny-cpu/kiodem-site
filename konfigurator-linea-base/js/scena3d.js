// Scena 3D lady Linea Base. Wymiary i opcje z parametry.json; bryła składana z pudeł skalowanych na żywo.
import * as T from '../vendor/three.min.js';

const KOLOR_TLA_GORA = 0xf4f2ef, KOLOR_PODLOGI = 0xe9e6e2;

// Układ tyłu odczytany z 20 renderów klientki: do 70 cm sama szuflada i wnęka,
// 80–200 cm po jednych drzwiach z boku, od 210 cm po dwoje.
export function uklad(W, w) {
	const wew = W - 2 * w.plyta;
	if (W < 0.75) return { drzwi: 0, srodek: wew, bok: 0, szerDrzwi: 0 };
	const srodek = Math.min(w.szerSrodka, wew - 2 * w.plyta - 2 * w.minDrzwi);
	const bok = (wew - srodek - 2 * w.plyta) / 2;
	const drzwi = W >= 2.05 ? 2 : 1;
	return { drzwi, srodek, bok, szerDrzwi: bok / drzwi };
}

const tlumik = (b, c, dt, k = 9) => b + (c - b) * (1 - Math.exp(-dt * k));

export async function utworzScene(plotno, par, zasoby = 'zasoby/') {
	const w = par.wymiary;
	const renderer = new T.WebGLRenderer({ canvas: plotno, antialias: true, powerPreference: 'high-performance' });
	renderer.toneMapping = T.NeutralToneMapping; // wierny kolor produktu (Khronos PBR Neutral)
	renderer.toneMappingExposure = 1.0;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = T.VSMShadowMap; // miękkie półcienie; PCFSoft usunięto w r186
	const scena = new T.Scene();
	const kamera = new T.PerspectiveCamera(26, 1, 0.1, 80);
	const cel0 = new T.Vector3(0, 0.56, 0);

	// ——— tekstury ———
	const ladowacz = new T.TextureLoader();
	const maxAniz = renderer.capabilities.getMaxAnisotropy();
	const tekstura = (plik, srgb = true) => new Promise((ok) => {
		ladowacz.load(zasoby + 'tekstury/' + plik, (t) => {
			t.wrapS = t.wrapT = T.MirroredRepeatWrapping;
			t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
			t.anisotropy = Math.min(8, maxAniz);
			ok(t);
		}, undefined, () => ok(null));
	});
	const jednolita = (r, g, b, srgb) => {
		const t = new T.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1);
		t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace; t.needsUpdate = true; return t;
	};
	const BIALA = jednolita(255, 255, 255, true), PLASKA = jednolita(128, 128, 255, false);
	const mapy = {}; // id wykończenia -> { map, nor } ; doładowywane przy pierwszym użyciu
	const wezMapy = async (wyk) => {
		if (!mapy[wyk.id]) mapy[wyk.id] = {
			map: wyk.tekstura ? (await tekstura(wyk.tekstura)) || BIALA : BIALA,
			nor: wyk.normalna ? (await tekstura(wyk.normalna, false)) || PLASKA : PLASKA,
		};
		return mapy[wyk.id];
	};

	// ——— oświetlenie: studio złożone z jasnej kopuły i paneli świetlnych (równe światło jak na renderach
	// klientki, czyste odbicia w szkle i złocie, bez pobierania pliku HDR) + światło kierunkowe dla cieni ———
	const studio = new T.Scene();
	const swiatlo = (moc, kolor = 0xffffff) => { const m = new T.MeshBasicMaterial({ side: T.DoubleSide, toneMapped: false }); m.color.set(kolor).multiplyScalar(moc); return m; };
	// kopuła: jasna posadzka pod horyzontem (to ją odbija złoty cokół), ściana ciemniejsza przy horyzoncie, jasny sufit
	studio.add(new T.Mesh(new T.SphereGeometry(20, 32, 16), new T.ShaderMaterial({
		side: T.BackSide,
		vertexShader: 'varying vec3 vK; void main(){ vK = normalize( position ); gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
		fragmentShader: `varying vec3 vK; void main(){
			float y = vK.y;
			float sciana = mix( 0.42, 0.95, smoothstep( 0.0, 0.85, y ) );
			float podl = mix( 0.78, 1.0, smoothstep( 0.0, -0.5, y ) );
			float v = mix( podl, sciana, smoothstep( -0.012, 0.012, y ) );
			gl_FragColor = vec4( vec3( v ) * vec3( 1.0, 0.985, 0.965 ), 1.0 ); }`,
	})));
	const panel = (szer, wys, moc, kat, y = 3.4, r = 9) => { // pionowy panel świetlny na okręgu, kąt 0 = przed frontem
		const m = new T.Mesh(new T.PlaneGeometry(szer, wys), swiatlo(moc)); const a = T.MathUtils.degToRad(kat);
		m.position.set(Math.sin(a) * r, y, Math.cos(a) * r); m.lookAt(0, y, 0); studio.add(m);
	};
	// szerokie panele dają miękkie światło, wąskie pasy („okna”) rysują ostre bliki na szkle i złocie
	for (const [kat, szer, moc] of [[-70, 2.4, 4], [-41, 0.45, 15], [-34, 0.45, 15], [-27, 0.45, 15], [6, 0.5, 9], [15, 0.5, 9], [38, 0.5, 14], [46, 0.5, 14], [80, 2.4, 4], [118, 0.6, 13], [128, 0.6, 13], [162, 2.0, 4.5], [-150, 0.5, 14], [-141, 0.5, 14], [-110, 1.8, 4.5]]) panel(szer, 15, moc, kat); // wysokie ponad kadr odbicia: bliki są pasami bez uciętych końców
	const sufit = new T.Mesh(new T.PlaneGeometry(7, 7), swiatlo(3.4)); sufit.position.set(0, 9.5, 0.5); sufit.rotation.x = Math.PI / 2; studio.add(sufit);
	const pmrem = new T.PMREMGenerator(renderer);
	scena.environment = pmrem.fromScene(studio, 0.008, 0.1, 50).texture;
	scena.environmentIntensity = 0.38;
	pmrem.dispose();
	// dwa światła z cieniami: główne od frontu i dopełniające od strony recepcji (wnęka i szafki dostają głębię)
	function lampa(x, y, z, moc, kolor) {
		const l = new T.DirectionalLight(kolor, moc); l.position.set(x, y, z); l.target.position.set(0, 0.55, 0);
		l.castShadow = true; l.shadow.mapSize.set(2048, 2048); l.shadow.radius = 9; l.shadow.blurSamples = 20; l.shadow.bias = -0.0004; l.shadow.normalBias = 0.004;
		Object.assign(l.shadow.camera, { left: -2.3, right: 2.3, top: 1.7, bottom: -1.7, near: 1, far: 13 });
		scena.add(l, l.target); return l;
	}
	const slonce = lampa(-3.3, 4.6, 2.5, 1.55, 0xfff4e6);
	const tylne = lampa(1.3, 5.2, -2.6, 1.15, 0xf2f4ff); tylne.shadow.radius = 14; tylne.shadow.intensity = 0.7; // stromo z góry: krótki, miękki cień od strony frontu

	// ——— materiały ———
	const przejscie = { // płynna zmiana wykończenia: nowe „przeciąga się” po bryle wzdłuż X
		uMapB: { value: BIALA }, uKolorB: { value: new T.Color(1, 1, 1) }, uSkalaB: { value: new T.Vector2(1, 1) },
		uPostep: { value: 1 }, uZakres: { value: new T.Vector2(-1, 1) },
	};
	const matWyk = new T.MeshPhysicalMaterial({ map: BIALA, normalMap: PLASKA, roughness: 0.55, clearcoat: 0.0001, clearcoatRoughness: 0.03 });
	matWyk.onBeforeCompile = (s) => {
		Object.assign(s.uniforms, przejscie);
		s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying float vPrzeX;')
			.replace('#include <project_vertex>', '#include <project_vertex>\nvPrzeX = ( modelMatrix * vec4( transformed, 1.0 ) ).x;');
		s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPrzeX;\nuniform sampler2D uMapB; uniform vec3 uKolorB; uniform vec2 uSkalaB; uniform float uPostep; uniform vec2 uZakres;')
			.replace('#include <map_fragment>', `#include <map_fragment>
			{
				float czolo = mix( uZakres.x - 0.2, uZakres.y + 0.2, uPostep );
				float stare = smoothstep( -0.14, 0.14, vPrzeX - czolo );
				vec3 kolB = texture2D( uMapB, ( vMapUv - 0.5 ) * uSkalaB + 0.5 ).rgb * uKolorB;
				diffuseColor.rgb = mix( diffuseColor.rgb, kolB, stare );
			}`);
	};
	const matWn = new T.MeshStandardMaterial({ color: par.kolory.wnetrze, roughness: 0.62 });
	const matZloto = new T.MeshStandardMaterial({ color: par.kolory.zloto, metalness: 1, roughness: 0.13, envMapIntensity: 2.3 });
	// matZloto = metal akcentu (cokół, listwa, gałki): kolor ustawia zastosuj() wg wyboru złoty / srebrny / biały
	const AKCENTY = { zloto: [par.kolory.zloto, 1, 0.13, 2.3], srebro: ['#e6e8ea', 1, 0.12, 2.0], bialy: ['#f4f3f0', 0, 0.3, 1.0] };
	const matLogoZloto = new T.MeshStandardMaterial({ color: par.kolory.zloto, metalness: 1, roughness: 0.13, envMapIntensity: 2.3 });
	const matLogoSrebro = new T.MeshStandardMaterial({ color: '#e6e8ea', metalness: 1, roughness: 0.12, envMapIntensity: 2.0 });
	const matLogoKolor = new T.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.08 });
	const matBlat = new T.MeshPhysicalMaterial({ map: BIALA, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.06 });
	const matPoswiata = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false });
	const matLed = new T.MeshBasicMaterial({ color: '#ffd9a0', toneMapped: false }); // paski LED pod korpusem
	const matGniazdoDno = new T.MeshStandardMaterial({ color: '#e4e4e1', roughness: 0.5 }); // wnętrze gniazda: o ton inne niż ramka, żeby było czytelne
	const matGniazdoJasne = new T.MeshStandardMaterial({ color: '#d9d9d6', roughness: 0.5 });
	const matGniazdo = new T.MeshStandardMaterial({ color: '#f1f1ef', roughness: 0.42 }), matOtwor = new T.MeshStandardMaterial({ color: '#1b1b1b', roughness: 0.6 });
	const matNadruk = new T.MeshStandardMaterial({ roughness: 0.5, transparent: true, alphaTest: 0.02 });
	const matNadrukZloty = new T.MeshStandardMaterial({ color: par.kolory.zloto, metalness: 1, roughness: 0.2, envMapIntensity: 2.3, transparent: true, alphaTest: 0.5 }); // nadruk w jednym kolorze: złoto, srebro albo własny
	const matCienLogo = [0.34, 0.18, 0.13].map((o) => new T.MeshBasicMaterial({ color: 0x1a140d, transparent: true, opacity: o, depthWrite: false, toneMapped: false }));

	// ——— bryła ———
	const geoPudla = new T.BoxGeometry(1, 1, 1);
	const geoKrawedzi = new T.EdgesGeometry(geoPudla), matSzczeliny = new T.LineBasicMaterial({ color: 0x5f574e, transparent: true, opacity: 0.5 });
	const geoGalki = new T.CylinderGeometry(0.011, 0.011, 0.022, 20).rotateX(Math.PI / 2);
	const UV0 = geoPudla.attributes.uv.array.slice();
	function pudlo(rodzic, mat, uvFiz = false, cien = true, odb = true) {
		const m = new T.Mesh(uvFiz ? geoPudla.clone() : geoPudla, mat);
		m.castShadow = cien; m.receiveShadow = odb; m.userData.uvFiz = uvFiz;
		rodzic.add(m); return m;
	}
	// rozmiar i środek pudła + UV w skali fizycznej (tekstura nie rozciąga się z szerokością)
	function ustaw(m, sx, sy, sz, x, y, z, kafel) {
		m.scale.set(Math.max(sx, 1e-5), Math.max(sy, 1e-5), Math.max(sz, 1e-5)); m.position.set(x, y, z);
		if (!m.userData.uvFiz) return;
		const uv = m.geometry.attributes.uv, a = uv.array;
		const wym = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
		for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
			const k = (f * 4 + i) * 2;
			a[k] = 0.5 + (UV0[k] - 0.5) * wym[f][0] / kafel[0];
			a[k + 1] = 0.5 + (UV0[k + 1] - 0.5) * wym[f][1] / kafel[1];
		}
		uv.needsUpdate = true;
	}

	function zbudujLade(lustro) {
		const g = new T.Group();
		const cien = !lustro, O = !lustro;
		const W6 = (a, b, c, d, e, f) => [a, b, c, d, e, f]; // +x −x +y −y +z −z
		const wn = []; // siatki wnętrza: materiał zależy od wykończenia
		const c = {
			cokol: pudlo(g, matWyk, true, cien, O),
			front: pudlo(g, W6(matWyk, matWyk, matBlat, matWyk, matWyk, matWn), true, cien, O),
			bokL: pudlo(g, W6(matWn, matWyk, matBlat, matWn, matWyk, matWn), true, cien, O),
			bokP: pudlo(g, W6(matWyk, matWn, matBlat, matWn, matWyk, matWn), true, cien, O),
			nadstawka: pudlo(g, matBlat, true, cien, O),
			blat: pudlo(g, matWn, true, cien, O), dno: pudlo(g, matWn, true, cien, O),
			przegL: pudlo(g, matWn, true, cien, O), przegP: pudlo(g, matWn, true, cien, O),
			polkaL: pudlo(g, matWn, false, false, O), polkaP: pudlo(g, matWn, false, false, O),
			listwaF: pudlo(g, matZloto, false, false, O), listwaL: pudlo(g, matZloto, false, false, O), listwaP: pudlo(g, matZloto, false, false, O),
			ryfle: new T.Mesh(new T.BufferGeometry(), matWyk),
			szuflada: new T.Group(), drzwi: [], logo: new T.Group(),
		};
		c.ryfle.castShadow = cien; c.ryfle.receiveShadow = O; g.add(c.ryfle, c.szuflada, c.logo);
		c.szufFront = pudlo(c.szuflada, matWn, true, cien, O); c.szufDno = pudlo(c.szuflada, matWn, false, false, O);
		c.szufL = pudlo(c.szuflada, matWn, false, false, O); c.szufP = pudlo(c.szuflada, matWn, false, false, O); c.szufT = pudlo(c.szuflada, matWn, false, false, O);
		for (let i = 0; i < 4; i++) { // zawias = grupa, skrzydło przesunięte o pół szerokości
			const zaw = new T.Group(); const skrz = pudlo(zaw, matWn, true, cien, O);
			skrz.userData.klik = true; skrz.add(new T.LineSegments(geoKrawedzi, matSzczeliny));
			const galka = new T.Mesh(geoGalki, matZloto); zaw.add(galka);
			g.add(zaw); c.drzwi.push({ zaw, skrz, galka });
		}
		c.szufFront.userData.klik = true; c.szufFront.add(new T.LineSegments(geoKrawedzi, matSzczeliny));
		c.szufGalka = new T.Mesh(geoGalki, matZloto); c.szuflada.add(c.szufGalka);
		wn.push(c.dno, c.przegL, c.przegP, c.szufFront, ...c.drzwi.map((x) => x.skrz));
		c.wn = wn; c.wielo = [c.front, c.bokL, c.bokP]; for (const m of c.wielo) m.userData.szablon = m.material;
		c.gniazda = []; c.przepust = null; c.ladowarka = null;
		c.led = [0, 1, 2, 3].map(() => pudlo(g, matLed, false, false, false));
		if (!lustro) { // wyposażenie widać tylko od strony recepcji, w odbiciu go nie ma
			for (let i = 0; i < 2; i++) {
				const mod = new T.Group(); const pl = pudlo(mod, matGniazdo, false, false, true); pl.scale.set(0.24, 0.085, 0.006);
				for (const x of [-0.07, 0.0]) { // dwa gniazda z bolcami
					const wn_ = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.004, 28).rotateX(Math.PI / 2), matOtwor); wn_.position.set(x, 0, -0.003); mod.add(wn_);
					const dno_ = new T.Mesh(new T.CylinderGeometry(0.0175, 0.0175, 0.005, 28).rotateX(Math.PI / 2), matGniazdoDno); dno_.position.set(x, 0, -0.0028); mod.add(dno_);
					for (const dx of [-0.0095, 0.0095]) { const o = new T.Mesh(new T.CylinderGeometry(0.0024, 0.0024, 0.006, 10).rotateX(Math.PI / 2), matOtwor); o.position.set(x + dx, 0, -0.003); mod.add(o); }
				}
				for (const y of [0.011, -0.011]) { const usb = pudlo(mod, matOtwor, false, false, false); usb.scale.set(0.014, 0.006, 0.004); usb.position.set(0.075, y, -0.0025); }
				g.add(mod); c.gniazda.push(mod);
			}
			c.ladowarka = new T.Group();
			c.ladowarka.add(new T.Mesh(new T.CylinderGeometry(0.052, 0.052, 0.003, 44), matZloto), new T.Mesh(new T.CylinderGeometry(0.046, 0.046, 0.0045, 44), matOtwor), new T.Mesh(new T.TorusGeometry(0.02, 0.0012, 8, 36).rotateX(Math.PI / 2).translate(0, 0.0026, 0), matGniazdoJasne));
			g.add(c.ladowarka);
			c.przepust = new T.Group();
			const ring = new T.Mesh(new T.CylinderGeometry(0.032, 0.032, 0.005, 36), matZloto), otw = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.006, 36), matOtwor);
			c.przepust.add(ring, otw); g.add(c.przepust);
		}
		if (lustro) g.scale.y = -1;
		return { g, c };
	}
	const lada = zbudujLade(false), odbicie = zbudujLade(true);
	scena.add(lada.g, odbicie.g);

	function geometriaRyfli(W, hKorp, kafel) {
		const n = Math.max(4, Math.round(W / 0.03)), p = W / n, K = 6, h = 0.011;
		const poz = [], uv = [], idx = [];
		for (let i = 0; i < n; i++) for (let k = 0; k <= K; k++) {
			const t = k / K, x = -W / 2 + (i + t) * p, z = h * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2));
			const b = poz.length / 3;
			poz.push(x, 0, z, x, hKorp, z);
			uv.push(0.5 + x / kafel[0], 0.5 - 0.5 * hKorp / kafel[1], 0.5 + x / kafel[0], 0.5 + 0.5 * hKorp / kafel[1]);
			if (k < K) idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
		}
		const g = new T.BufferGeometry();
		g.setAttribute('position', new T.Float32BufferAttribute(poz, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
		g.setIndex(idx); g.computeVertexNormals(); return g;
	}

	// ——— logo ———
	let logo = null; // { typ: 'svg'|'png', geometry | texture, proporcja (wys/szer) }
	let logoStan = '';
	function odswiezLogo(b, s, kafel) {
		const klucz = [logo && logo.id, s.logo, s.kolorLogo, s.kolorLed, b.W.toFixed(3), b.D.toFixed(3), b.H.toFixed(3), s.str, s.wyk].join('|');
		if (klucz === logoStan) return; logoStan = klucz;
		const led = s.logo === 'led';
		matLogoKolor.color.set(s.kolorLogo || '#ffffff'); matPoswiata.color.set(s.kolorLed || '#ffd9a0');
		for (const L of [lada, odbicie]) {
			const gr = L.c.logo; gr.clear();
			if (!logo || s.logo === 'brak') continue;
			const hKorp = b.H - w.hCokolu, maxW = Math.min(w.logoA + w.logoB * b.W, b.W * w.logoUdzial), maxH = hKorp * 0.5;
			const szer = Math.min(maxW, maxH / logo.proporcja);
			const yS = w.hCokolu + hKorp * 0.5, zF = b.D / 2 + (s.str === 'ryfle' ? 0.011 : 0);
			const odst = led ? 0.012 : 0; // litery podświetlane stoją na dystansach, światło wychodzi zza nich
			let m;
			if (logo.typ === 'svg') {
				const geo = logo.geometry.clone();
				// UV planarne w tej samej skali co front: litery „w kolorze frontu” niosą dalej jego rysunek
				const p = geo.attributes.position, uv = new Float32Array(p.count * 2);
				for (let i = 0; i < p.count; i++) { uv[i * 2] = 0.5 + p.getX(i) * szer / kafel[0]; uv[i * 2 + 1] = 0.5 - p.getY(i) * szer / kafel[1]; }
				geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
				const mat = { zloto: matLogoZloto, srebro: matLogoSrebro, kolor: matLogoKolor, led: matZloto, front: matWyk }[s.logo] || matLogoZloto;
				m = new T.Mesh(geo, mat);
				m.scale.set(szer, -szer, w.logoGrubosc); m.position.set(0, yS, zF + odst);
				m.castShadow = L === lada && !led; m.receiveShadow = L === lada;
				if (L === lada && !led) for (const [i, [dx, dy]] of [[0.0024, -0.0036], [0.0055, -0.0085], [-0.0016, 0.0016]].entries()) { // cień pod literą, jego miękki zasięg i obwódka od strony światła
					const c = new T.Mesh(logo.plaski, matCienLogo[i]); c.scale.set(szer, -szer, 1); c.position.set(dx, yS + dy, zF + 0.0006 + i * 0.0002); c.renderOrder = 2; gr.add(c);
				}
			} else {
				const jednokolor = s.logo !== 'front' && s.logo !== 'led';
				const mat = jednokolor ? matNadrukZloty : matNadruk;
				if (jednokolor) {
					mat.alphaMap = logo.alfa; const metal = s.logo !== 'kolor';
					mat.color.set(s.logo === 'srebro' ? '#e6e8ea' : s.logo === 'kolor' ? (s.kolorLogo || '#ffffff') : par.kolory.zloto); mat.metalness = metal ? 1 : 0; mat.roughness = metal ? 0.2 : 0.4;
				} else mat.map = logo.texture;
				mat.needsUpdate = true;
				m = new T.Mesh(new T.PlaneGeometry(1, 1), mat);
				m.scale.set(szer, szer * logo.proporcja, 1); m.position.set(0, yS, zF + 0.0012 + odst);
			}
			gr.add(m);
			if (led && logo.poswiata && L === lada) { // miękka łuna na froncie za literami
				matPoswiata.map = logo.poswiata.texture; matPoswiata.needsUpdate = true;
				const mg = logo.poswiata.margines, pl = new T.Mesh(new T.PlaneGeometry(1, 1), matPoswiata);
				pl.scale.set(szer * (1 + 2 * mg), szer * (logo.proporcja + 2 * mg), 1); pl.position.set(0, yS, zF + 0.0008); pl.renderOrder = 3; gr.add(pl);
			}
		}
	}

	// ——— stan bieżący (animowany) i docelowy ———
	const b = { W: par.domyslne.szer / 100, D: par.domyslne.gleb / 100, H: par.domyslne.wys / 100, otw: 0 };
	const d = { ...b };
	let stan = null, wyk = null, kafel = [1, 1];
	const wlasn = { r: 0.55, cc: 0.0001, ccr: 0.03, ns: 0, ior: 1.5 }; const wlasnCel = { ...wlasn };

	function ulozBryle() {
		const { W, D, H } = b, t = w.plyta, hc = w.hCokolu, cof = w.cofniecieCokolu, hK = H - hc, sz = w.szczelina;
		const hB = Math.min(w.hBlatu, H - 0.26); // blat roboczy: przy niskiej ladzie schodzi, żeby została wnęka pod nadstawką
		const mB = stan.blat && stan.blat !== 'lada' ? matBlat : null;
		const u = uklad(W, w), wew = W - 2 * t, zT = -D / 2; // zT = płaszczyzna tyłu
		const ryfle = stan.str === 'ryfle';
		for (const L of [lada, odbicie]) {
			const c = L.c;
			c.cokol.material = stan.cokol === 'zloto' ? matZloto : matWyk;
			const mW = wyk.wnetrze === 'front' ? matWyk : matWn;
			for (const m of c.wn) m.material = mW;
			for (const m of c.wielo) m.material = m.userData.szablon.map((x) => (x === matWn ? mW : x === matBlat ? (mB || matWyk) : x));
			c.nadstawka.material = mB || matWyk; c.blat.material = mB || mW;
			ustaw(c.cokol, W - 2 * cof, hc, D - 2 * cof, 0, hc / 2, 0, kafel);
			ustaw(c.front, W, hK, t, 0, hc + hK / 2, D / 2 - t / 2, kafel);
			ustaw(c.bokL, t, hK, D - t, -W / 2 + t / 2, hc + hK / 2, -t / 2, kafel);
			ustaw(c.bokP, t, hK, D - t, W / 2 - t / 2, hc + hK / 2, -t / 2, kafel);
			ustaw(c.nadstawka, wew, t, w.glebNadstawki, 0, H - t / 2, D / 2 - t - w.glebNadstawki / 2, kafel);
			ustaw(c.blat, wew, t, D - t, 0, hB - t / 2, -t / 2, kafel);
			ustaw(c.dno, wew, t, D - t, 0, hc + t / 2, -t / 2, kafel);
			const hPrz = hB - t - hc - t, yPrz = hc + t + hPrz / 2, xPrz = u.srodek / 2 + t / 2;
			for (const [m, zn] of [[c.przegL, -1], [c.przegP, 1]]) { m.visible = u.drzwi > 0; ustaw(m, t, hPrz, D - t, zn * xPrz, yPrz, -t / 2, kafel); }
			for (const [m, zn] of [[c.polkaL, -1], [c.polkaP, 1]]) { m.visible = u.drzwi > 0; ustaw(m, u.bok, t, D - t - 0.04, zn * (xPrz + t / 2 + u.bok / 2), yPrz, 0.01); }
			// szuflada: front licuje z tyłem, skrzynia chowa się pod blatem
			const hS = w.hSzuflady, yS = hB - t - sz - hS / 2, gS = Math.min(0.42, D - 0.12), wS = u.srodek - 2 * sz;
			c.szuflada.position.set(0, yS, zT - b.otw * (gS - 0.06));
			ustaw(c.szufFront, wS, hS, t, 0, 0, t / 2, kafel);
			c.szufGalka.visible = !!wyk.szklo; c.szufGalka.position.set(0, 0, -0.011);
			ustaw(c.szufDno, wS - 0.03, 0.012, gS, 0, -hS / 2 + 0.02, t + gS / 2);
			ustaw(c.szufL, 0.012, hS - 0.03, gS, -wS / 2 + 0.021, 0, t + gS / 2);
			ustaw(c.szufP, 0.012, hS - 0.03, gS, wS / 2 - 0.021, 0, t + gS / 2);
			ustaw(c.szufT, wS - 0.03, hS - 0.03, 0.012, 0, 0, t + gS);
			// drzwi: zawias przy boku lady, a przy czworgu drzwi także przy przegrodzie wnęki
			const hD = hPrz - 2 * sz, yD = yPrz, kat = b.otw * 1.75;
			c.drzwi.forEach((dr, i) => {
				const strona = i < 2 ? -1 : 1, wewn = i % 2 === 1; // wewn = skrzydło bliżej wnęki
				dr.zaw.visible = u.drzwi === 2 || (u.drzwi === 1 && !wewn);
				if (!dr.zaw.visible) return;
				const szer = u.szerDrzwi - 2 * sz, xZew = strona * (W / 2 - t), xWew = strona * (u.srodek / 2 + t);
				const xZaw = wewn ? xWew + strona * sz : xZew - strona * sz;
				const kier = wewn ? strona : -strona; // w którą stronę od zawiasu leży skrzydło
				dr.zaw.position.set(xZaw, yD, zT + t / 2);
				dr.zaw.rotation.y = kier * kat; // skrzydło wychyla się na zewnątrz, w stronę recepcjonistki
				ustaw(dr.skrz, szer, hD, t, kier * szer / 2, 0, 0, kafel);
				dr.galka.visible = !!wyk.szklo; dr.galka.position.set(kier * (szer - 0.035), hD / 2 - 0.05, -t / 2 - 0.011);
			});
			// złota listwa tylko przy szkle
			const yL = H - w.listwaOdGory, lh = w.listwaH;
			c.listwaF.visible = c.listwaL.visible = c.listwaP.visible = !!wyk.szklo;
			ustaw(c.listwaF, W + 0.002, lh, 0.002, 0, yL, D / 2 + (ryfle ? 0.0112 : 0)); // przy ryflach listwa leży na ich grzbietach
			ustaw(c.listwaL, 0.002, lh, D, -W / 2, yL, 0); ustaw(c.listwaP, 0.002, lh, D, W / 2, yL, 0);
			c.ryfle.visible = ryfle;
			// gniazda na wewnętrznej stronie frontu, we wnęce nad blatem roboczym; przepust w blacie
			c.gniazda.forEach((mod, i) => {
				mod.visible = (stan.gniazda | 0) > i && (i === 0 || W >= 0.9);
				mod.position.set(W < 0.9 ? 0 : (i === 0 ? 1 : -1) * (wew / 2 - 0.2), hB + Math.min(0.12, (H - t - hB) / 2), D / 2 - t - 0.003);
			});
			if (c.ladowarka) { c.ladowarka.visible = stan.ladowarka === 'tak'; c.ladowarka.position.set(Math.min(W / 2 - 0.2, W * 0.3), H + 0.0016, D / 2 - t - w.glebNadstawki / 2 + 0.02); }
			const ledWl = stan.led === 'tak', yLed = hc - 0.004; // paski LED tuż pod korpusem, przy krawędzi nawisu
			c.led.forEach((m) => { m.visible = ledWl; });
			ustaw(c.led[0], W - 0.04, 0.005, 0.01, 0, yLed, D / 2 - 0.02); ustaw(c.led[1], W - 0.04, 0.005, 0.01, 0, yLed, -D / 2 + 0.02);
			ustaw(c.led[2], 0.01, 0.005, D - 0.04, -W / 2 + 0.02, yLed, 0); ustaw(c.led[3], 0.01, 0.005, D - 0.04, W / 2 - 0.02, yLed, 0);
			if (c.przepust) { c.przepust.visible = stan.przepust === 'tak'; c.przepust.position.set(-(wew / 2 - 0.13), hB + 0.0025, -D / 2 + Math.min(0.11, D / 2 - 0.05)); }
		}
		if (ryfle) {
			const geo = geometriaRyfli(W, hK, kafel);
			for (const L of [lada, odbicie]) { L.c.ryfle.geometry.dispose(); L.c.ryfle.geometry = geo; L.c.ryfle.position.set(0, hc, D / 2); }
		}
		odswiezLogo(b, stan, kafel);
		cienU.uPol.value.set(W / 2, D / 2); cienU.uCok.value.set(W / 2 - cof, D / 2 - cof);
		przejscie.uZakres.value.set(-W / 2, W / 2);
		ulozWymiary();
	}

	// ——— podłoga: lustrzana kopia lady pod półprzezroczystą posadzką + analityczny cień kontaktowy ———
	const podlogaU = { uKolor: { value: new T.Color(KOLOR_PODLOGI) }, uKrycie: { value: 0.66 }, uMapa: { value: BIALA }, uMapaMoc: { value: 0 }, uKafel: { value: 1 }, uPlyta: { value: 0 }, uFuga: { value: 0 }, uFugaSzer: { value: 0.0015 }, uBarwa: { value: new T.Color(1, 1, 1) }, uJasnosc: { value: 1 } };
	const podloga = new T.Mesh(new T.CircleGeometry(16, 64), new T.ShaderMaterial({
		uniforms: podlogaU, transparent: true, depthWrite: false,
		vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
		fragmentShader: `uniform vec3 uKolor, uBarwa; uniform float uKrycie, uMapaMoc, uKafel, uPlyta, uFuga, uFugaSzer, uJasnosc; uniform sampler2D uMapa; varying vec2 vP;
			void main(){
				vec3 k = uKolor;
				if ( uMapaMoc > 0.0 ) {
					float fuga = 0.0;
					if ( uPlyta > 0.0 ) { vec2 f = abs( fract( vP / uPlyta ) - 0.5 ); fuga = smoothstep( 0.5 - uFugaSzer, 0.5, max( f.x, f.y ) ); }
					k = texture2D( uMapa, vP / uKafel ).rgb * uBarwa * ( 1.0 - uFuga * fuga );
				}
				float a = uKrycie * ( 1.0 - smoothstep( 5.0, 15.0, length( vP ) ) );
				gl_FragColor = vec4( k * uJasnosc, a );
				#include <colorspace_fragment>
			}`,
	}));
	podloga.rotation.x = -Math.PI / 2; podloga.renderOrder = 8; scena.add(podloga);
	const mgly = []; // materiały płaszczyzn gaszących odbicie: kolor idzie za posadzką i porą dnia
	for (const [i, y] of [-0.75, -0.5, -0.3, -0.14].entries()) { // im głębiej odbicie, tym bledsze
		const mg = new T.Mesh(new T.CircleGeometry(16, 32), new T.MeshBasicMaterial({ color: KOLOR_PODLOGI, transparent: true, opacity: 0.27, depthWrite: false, toneMapped: false }));
		mg.rotation.x = -Math.PI / 2; mg.position.y = y; mg.renderOrder = 1 + i; scena.add(mg); mgly.push(mg.material);
	}
	const cienU = { uPol: { value: new T.Vector2(0.7, 0.3) }, uCok: { value: new T.Vector2(0.64, 0.24) } };
	const cien = new T.Mesh(new T.PlaneGeometry(8, 8), new T.ShaderMaterial({
		uniforms: cienU, transparent: true, depthWrite: false,
		vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
		fragmentShader: `uniform vec2 uPol, uCok; varying vec2 vP;
			float pud( vec2 p, vec2 h ){ vec2 q = abs( p ) - h; return length( max( q, 0.0 ) ) + min( max( q.x, q.y ), 0.0 ); }
			void main(){
				float dK = pud( vP, uPol ), dC = pud( vP, uCok );
				float miekki = 0.17 * exp( -max( dK, 0.0 ) * 4.2 );
				float nawis = 0.52 * smoothstep( 0.025, -0.045, dK );
				float styk = 0.38 * exp( -max( dC, 0.0 ) * 42.0 );
				gl_FragColor = vec4( 0.07, 0.06, 0.055, clamp( max( miekki, nawis ) + styk, 0.0, 0.86 ) );
			}`,
	}));
	cien.rotation.x = -Math.PI / 2; cien.position.y = 0.0015; cien.renderOrder = 9; scena.add(cien);
	const ledU = { uPol: cienU.uPol, uCok: cienU.uCok, uLed: { value: new T.Color('#ffd9a0') }, uMoc: { value: 0 } };
	const luna = new T.Mesh(new T.PlaneGeometry(8, 8), new T.ShaderMaterial({
		uniforms: ledU, transparent: true, depthWrite: false,
		vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
		fragmentShader: `uniform vec2 uPol, uCok; uniform vec3 uLed; uniform float uMoc; varying vec2 vP;
			float pud( vec2 p, vec2 h ){ vec2 q = abs( p ) - h; return length( max( q, 0.0 ) ) + min( max( q.x, q.y ), 0.0 ); }
			void main(){
				float dK = pud( vP, uPol ), dC = pud( vP, uCok );
				float pod = smoothstep( 0.0, -0.035, dK ) * step( 0.0, dC );   // pas pod nawisem, wokół cokołu
				float luna = exp( -max( dK, 0.0 ) * 5.0 ) * step( 0.0, dC );
				gl_FragColor = vec4( uLed, uMoc * clamp( 0.9 * pod + 0.62 * luna, 0.0, 0.92 ) );
				#include <colorspace_fragment>
			}`,
	}));
	luna.rotation.x = -Math.PI / 2; luna.position.y = 0.0028; luna.renderOrder = 11; scena.add(luna);

	// prawdziwy cień obu świateł na posadzce (kierunkowy, miękki) ponad analitycznym cieniem styku
	const cienPodlogi = new T.Mesh(new T.PlaneGeometry(9, 9), new T.ShadowMaterial({ opacity: 0.2, depthWrite: false }));
	cienPodlogi.rotation.x = -Math.PI / 2; cienPodlogi.position.y = 0.002; cienPodlogi.receiveShadow = true; cienPodlogi.renderOrder = 10; scena.add(cienPodlogi);

	// okluzja otoczenia (GTAO): zaciemnia styki płyt, wnękę, cokół i litery tak, jak robi to światło rozproszone
	const kompozytor = new T.EffectComposer(renderer, new T.WebGLRenderTarget(4, 4, { samples: 4, type: T.HalfFloatType }));
	kompozytor.addPass(new T.RenderPass(scena, kamera));
	const ao = new T.GTAOPass(scena, kamera, 4, 4);
	ao.blendIntensity = 1.0;
	ao.updateGtaoMaterial({ radius: 0.32, distanceExponent: 1.4, thickness: 1.4, scale: 1.15, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
	ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, radiusExponent: 1, rings: 2, samples: 16 });
	kompozytor.addPass(ao); kompozytor.addPass(new T.OutputPass());

	// tło: kopuła z gradientem; posadzka kończy się na horyzoncie, wyżej jest już ściana studia
	const tloU = { uGora: { value: new T.Color(KOLOR_TLA_GORA) }, uDol: { value: new T.Color(KOLOR_PODLOGI) } };
	scena.add(new T.Mesh(new T.SphereGeometry(40, 32, 16), new T.ShaderMaterial({
		uniforms: tloU, side: T.BackSide, depthWrite: false,
		vertexShader: 'varying vec3 vK; void main(){ vK = normalize( position ); gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
		fragmentShader: 'uniform vec3 uGora, uDol; varying vec3 vK; void main(){ float t = smoothstep( -0.012, 0.09, vK.y ); gl_FragColor = vec4( mix( uDol, uGora, t ), 1.0 );\n#include <colorspace_fragment>\n}',
	})));

	// otoczenie „ściana z marmuru”: ściana za stanowiskiem recepcji, widoczna tylko od frontu
	const sciana = new T.Group(); sciana.visible = false; scena.add(sciana);
	let marmur = null;
	async function wlaczMarmur(tak) {
		if (tak && !marmur) {
			marmur = await tekstura('marmur.webp');
			const mat = new T.MeshPhysicalMaterial({ map: marmur, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.08 });
			const geo = new T.PlaneGeometry(1.2, 3.0);
			for (let i = -4; i <= 4; i++) for (const lus of [1, -1]) { // płyty 120 cm z fugą + ich odbicie
				const m = new T.Mesh(geo, mat); m.position.set(i * 1.204, lus * 1.5, -1.5); m.scale.y = lus;
				m.geometry = geo.clone(); const uv = m.geometry.attributes.uv;
				for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 0.5 + (i * 0.37 % 1), uv.getY(k) * 1.25);
				m.receiveShadow = lus > 0; sciana.add(m);
			}
		}
		sciana.visible = tak;
	}
	// ściana gładka w dowolnym kolorze: farba, suchy beton albo mikrocement (szara tekstura × kolor z palety)
	const scianaGladka = new T.Group(); scianaGladka.visible = false; scena.add(scianaGladka);
	const matSciany = new T.MeshStandardMaterial({ color: '#d9d4cc', roughness: 0.9 });
	for (const lus of [1, -1]) { const m = new T.Mesh(new T.PlaneGeometry(10.8, 3.0), matSciany); m.position.set(0, lus * 1.5, -1.5); m.scale.y = lus; m.receiveShadow = lus > 0; scianaGladka.add(m); }
	const scianyTekstury = {};
	async function ustawSciane(ids, kolor) {
		await wlaczMarmur(ids === 'marmur');
		const sc = par.otoczenia.find((x) => x.id === ids);
		scianaGladka.visible = !!(sc && sc.tekstura);
		if (!scianaGladka.visible) return;
		if (!scianyTekstury[ids]) { const t = await tekstura(sc.tekstura); if (t) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(10.8 / sc.kafel, 3.0 / sc.kafel); scianyTekstury[ids] = t; } }
		if (matSciany.map !== (scianyTekstury[ids] || null)) { matSciany.map = scianyTekstury[ids] || null; matSciany.needsUpdate = true; }
		matSciany.color.set(kolor); matSciany.roughness = sc.szorstkosc;
	}
	const posTekstury = {}; let posadzka = null, jasnosc = 1, jasnoscCel = 1, ledCel = 0;
	const sredniPos = new T.Color(KOLOR_PODLOGI); // średni kolor posadzki: horyzont i gaszenie odbicia
	async function ustawPosadzke(idp, kolor) {
		const p = par.posadzki.find((x) => x.id === idp) || par.posadzki[0];
		if (p.tekstura && !posTekstury[p.id]) { const t = await tekstura(p.tekstura); if (t) { t.wrapS = t.wrapT = T.RepeatWrapping; posTekstury[p.id] = t; } }
		posadzka = p; const t = posTekstury[p.id];
		podlogaU.uMapa.value = t || BIALA; podlogaU.uMapaMoc.value = (t || p.plyta) ? 1 : 0; podlogaU.uKafel.value = p.kafel || 1;
		podlogaU.uPlyta.value = p.plyta || 0; podlogaU.uFuga.value = p.fuga || 0; podlogaU.uFugaSzer.value = p.fugaSzer || 0.0015; podlogaU.uKrycie.value = p.krycie;
		podlogaU.uBarwa.value.set(p.barwiona ? kolor : (p.barwa || '#ffffff')); // mikrocement: szara tekstura × kolor z palety
		sredniPos.set(p.wlasny || p.barwiona ? kolor : p.sredni); if (p.barwiona) sredniPos.multiplyScalar(p.jasnosc || 0.8);
		podlogaU.uKolor.value.copy(sredniPos);
		ustawJasnosc(jasnosc);
	}
	const kolorPos = new T.Color();
	function ustawJasnosc(j) { // 1 = dzień, 0 = wieczór: przygaszone studio, w którym widać światło LED
		jasnosc = j; const f = 0.2 + 0.8 * j, g = 0.26 + 0.74 * j;
		scena.environmentIntensity = 0.38 * f; slonce.intensity = 1.55 * f; tylne.intensity = 1.15 * f;
		podlogaU.uJasnosc.value = g;
		kolorPos.copy(sredniPos).multiplyScalar(g);
		for (const m of mgly) m.color.copy(kolorPos);
		tloU.uDol.value.copy(kolorPos); tloU.uGora.value.set(KOLOR_TLA_GORA).multiplyScalar(g * (0.2 + 0.8 * j)); // wieczorem ściana gaśnie mocniej niż posadzka
	}

	// ——— kreska wymiarowa (motyw marki): linie na posadzce + etykiety w DOM ———
	const matKreski = new T.MeshBasicMaterial({ color: 0x856a34, toneMapped: false });
	const kreski = new T.Group(); scena.add(kreski);
	const paski = Array.from({ length: 9 }, () => { const m = new T.Mesh(geoPudla, matKreski); kreski.add(m); return m; });
	const etykiety = { szer: document.getElementById('wymiar-szer'), gleb: document.getElementById('wymiar-gleb'), wys: document.getElementById('wymiar-wys') };
	const kotwice = { szer: new T.Vector3(), gleb: new T.Vector3(), wys: new T.Vector3() };
	function ulozWymiary() {
		const { W, D, H } = b, o = 0.22, z = D / 2 + o, x = W / 2 + o, y = 0.004, k = 0.09, g = 0.0035;
		const P = (m, sx, sz, px, pz) => { m.scale.set(sx, 0.001, sz); m.position.set(px, y, pz); };
		P(paski[0], W, g, 0, z); P(paski[1], g, k, -W / 2, z); P(paski[2], g, k, W / 2, z);
		P(paski[3], g, D, x, 0); P(paski[4], k, g, x, -D / 2); P(paski[5], k, g, x, D / 2);
		const xw = -W / 2 - 0.16, zw = D / 2 + 0.02; // wysokość: pion przy lewym narożniku frontu
		paski[6].scale.set(g, H, g); paski[6].position.set(xw, H / 2, zw);
		for (const [i, yy] of [[7, 0.002], [8, H]]) { paski[i].scale.set(k, g, g); paski[i].position.set(xw, yy, zw); }
		kotwice.szer.set(0, y, z + 0.12); kotwice.gleb.set(x + 0.14, y, 0); kotwice.wys.set(xw - 0.13, H / 2, zw);
		if (etykiety.wys) etykiety.wys.textContent = Math.round(H * 100) + ' cm';
		if (etykiety.szer) etykiety.szer.textContent = Math.round(W * 100) + ' cm';
		if (etykiety.gleb) etykiety.gleb.textContent = Math.round(D * 100) + ' cm';
	}
	const v3 = new T.Vector3();
	function ulozEtykiety() {
		const r = plotno.getBoundingClientRect();
		for (const n of ['szer', 'gleb', 'wys']) {
			const e = etykiety[n]; if (!e) continue;
			v3.copy(kotwice[n]).project(kamera);
			const widac = kreski.visible && v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05;
			e.style.opacity = widac ? 1 : 0;
			e.style.transform = `translate(-50%,-50%) translate(${((v3.x + 1) / 2 * r.width).toFixed(1)}px,${((1 - v3.y) / 2 * r.height).toFixed(1)}px)`;
		}
	}

	// ——— kamera ———
	const ster = new T.OrbitControls(kamera, plotno);
	Object.assign(ster, { enableDamping: true, dampingFactor: 0.07, enablePan: false, rotateSpeed: 0.75, zoomSpeed: 0.7, minPolarAngle: 0.55, maxPolarAngle: Math.PI / 2 - 0.035 });
	ster.target.copy(cel0);
	const dystans = (zapas = 1) => {
		const tg = Math.tan(T.MathUtils.degToRad(kamera.fov / 2));
		const pol = Math.hypot(d.W, d.D) / 2 + 0.5; // półszerokość z zapasem na obrót i kreskę wymiarową
		return Math.max((d.H * 0.74) / tg, pol / (tg * kamera.aspect)) * zapas + 0.3;
	};
	const WIDOKI = {
		trzy: { az: -0.56, el: 0.13, zoom: 1.0 },
		przod: { az: 0, el: 0.07, zoom: 0.97 },
		recepcja: { az: Math.PI - 0.5, el: 0.3, zoom: 1.02 },
		logo: { az: -0.3, el: 0.05, zoom: 0.74, y: 0.55 },
		cokol: { az: -0.62, el: 0.1, zoom: 0.6, y: 0.27 },
		wyposazenie: { az: Math.PI - 0.35, el: 0.42, zoom: 0.7, y: 0.75 },
		blat: { az: -0.5, el: 0.52, zoom: 0.72, y: 0.9 },
	};
	let lot = null; // docelowa pozycja kamery; ruch użytkownika go przerywa
	let zamrozona = false; // pomiary: kamera ustawiona wprost, bez ograniczeń sterowania
	const sfer = new T.Spherical();
	function widok(nazwa, natychmiast = false) {
		const v = WIDOKI[nazwa] || WIDOKI.trzy;
		lot = { theta: v.az, phi: Math.PI / 2 - v.el, r: dystans(v.zoom), y: (v.y ?? 0.51) * d.H };
		if (natychmiast) { krokKamery(1e3); }
		obudz();
	}
	function krokKamery(dt) {
		if (!lot) return false;
		sfer.setFromVector3(v3.copy(kamera.position).sub(ster.target));
		let dth = lot.theta - sfer.theta; dth = Math.atan2(Math.sin(dth), Math.cos(dth)); // najkrótszą drogą
		const k = dt > 100 ? 1 : 1 - Math.exp(-dt * 3.4);
		sfer.theta += dth * k; sfer.phi += (lot.phi - sfer.phi) * k; sfer.radius += (lot.r - sfer.radius) * k;
		ster.target.y += (lot.y - ster.target.y) * k;
		kamera.position.setFromSpherical(sfer).add(ster.target);
		if (Math.abs(dth) < 2e-3 && Math.abs(lot.r - sfer.radius) < 2e-3 && Math.abs(lot.phi - sfer.phi) < 2e-3) lot = null;
		return true;
	}
	ster.addEventListener('start', () => { lot = null; plotno.dispatchEvent(new CustomEvent('lada:ruch')); });
	const granice = () => { ster.minDistance = dystans(0.42); ster.maxDistance = dystans(1.5); };

	// ——— pętla: rysujemy tylko wtedy, gdy coś się zmienia ———
	let klatka = 0, spokoj = 0, tPop = 0, ruchZredukowany = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const czasy = []; // czasy klatek do pomiaru (ms)
	let aoWRuchu = true, wolne = 0;
	function rysuj(pelna = true) { if (pelna) kompozytor.render(); else renderer.render(scena, kamera); }
	function obudz() { spokoj = 0; if (!klatka) { tPop = performance.now(); klatka = requestAnimationFrame(petla); } }
	function petla(t) {
		const dt = Math.min(0.05, (t - tPop) / 1000); czasy.push(t - tPop); if (czasy.length > 2000) czasy.shift(); tPop = t;
		let zmiana = false;
		const kr = ruchZredukowany ? 1e3 : dt;
		if (['W', 'D', 'H', 'otw'].some((n) => Math.abs(d[n] - b[n]) > 2e-4)) {
			for (const n of ['W', 'D', 'H', 'otw']) { b[n] = tlumik(b[n], d[n], kr, n === 'otw' ? 4.5 : 7); if (Math.abs(d[n] - b[n]) < 3e-4) b[n] = d[n]; }
			ulozBryle(); granice(); zmiana = true;
		}
		if (przejscie.uPostep.value < 1) {
			const p = Math.min(1, przejscie.uPostep.value + (ruchZredukowany ? 1 : dt / 0.95)); przejscie.uPostep.value = p;
			const e = p * p * (3 - 2 * p);
			matWyk.roughness = wlasn.r + (wlasnCel.r - wlasn.r) * e; matWyk.clearcoat = wlasn.cc + (wlasnCel.cc - wlasn.cc) * e;
			matWyk.clearcoatRoughness = wlasn.ccr + (wlasnCel.ccr - wlasn.ccr) * e; matWyk.normalScale.setScalar(wlasn.ns + (wlasnCel.ns - wlasn.ns) * e); matWyk.ior = wlasn.ior + (wlasnCel.ior - wlasn.ior) * e;
			if (p === 1) Object.assign(wlasn, wlasnCel);
			zmiana = true;
		}
		if (Math.abs(jasnoscCel - jasnosc) > 1e-3) { const j = tlumik(jasnosc, jasnoscCel, kr, 2.6); ustawJasnosc(Math.abs(jasnoscCel - j) < 4e-3 ? jasnoscCel : j); zmiana = true; }
		if (Math.abs(ledCel - ledU.uMoc.value) > 1e-3) { const v = tlumik(ledU.uMoc.value, ledCel, kr, 4); ledU.uMoc.value = Math.abs(ledCel - v) < 4e-3 ? ledCel : v; zmiana = true; }
		if (krokKamery(kr)) zmiana = true;
		if (!zamrozona && ster.update()) zmiana = true;
		if (dt * 1000 > 26 && zmiana) { if (++wolne > 10) aoWRuchu = false; } else if (wolne > 0) wolne -= 0.25;
		if (zmiana || spokoj === 0) { rysuj(aoWRuchu || !zmiana); ulozEtykiety(); }
		else if (spokoj === 2 && !aoWRuchu) rysuj(true); // po zatrzymaniu: jedna klatka w pełnej jakości
		spokoj = zmiana ? 1 : spokoj + 1;
		klatka = spokoj < 20 ? requestAnimationFrame(petla) : 0;
	}
	ster.addEventListener('change', obudz);

	function rozmiar() {
		const r = plotno.parentElement.getBoundingClientRect();
		const pr = Math.min(devicePixelRatio, 2); renderer.setPixelRatio(pr); renderer.setSize(r.width, r.height, false);
		kompozytor.setPixelRatio(pr); kompozytor.setSize(r.width, r.height);
		kamera.aspect = r.width / Math.max(1, r.height); kamera.updateProjectionMatrix(); granice(); obudz();
	}
	new ResizeObserver(rozmiar).observe(plotno.parentElement);

	// klik w drzwi albo szufladę otwiera i zamyka szafki (klik, nie przeciągnięcie)
	const promien = new T.Raycaster(), mysz = new T.Vector2(); let wcisk = null;
	plotno.addEventListener('pointerdown', (e) => { wcisk = [e.clientX, e.clientY]; });
	plotno.addEventListener('pointerup', (e) => {
		if (!wcisk || Math.hypot(e.clientX - wcisk[0], e.clientY - wcisk[1]) > 5) return;
		const r = plotno.getBoundingClientRect();
		mysz.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
		promien.setFromCamera(mysz, kamera);
		const traf = promien.intersectObject(lada.g, true)[0];
		if (traf && traf.object.userData.klik) plotno.dispatchEvent(new CustomEvent('lada:szafki'));
	});

	// ——— API ———
	async function zastosuj(nowy, natychmiast = false) {
		const popWyk = wyk, popKafel = kafel, pierwszy = !stan;
		const nWyk = par.wykonczenia.find((x) => x.id === nowy.wyk) || par.wykonczenia[0];
		const m = await wezMapy(nWyk);
		stan = { ...nowy }; wyk = nWyk; kafel = nWyk.kafel;
		d.W = nowy.szer / 100; d.D = nowy.gleb / 100; d.H = (nowy.wys || par.domyslne.wys) / 100; d.otw = nowy.otwarte ? 1 : 0;
		const [ak, akMetal, akR, akEnv] = AKCENTY[nowy.akcent] || AKCENTY.zloto;
		matZloto.color.set(ak); matZloto.metalness = akMetal; matZloto.roughness = akR; matZloto.envMapIntensity = akEnv;
		if (nowy.blat === 'marmur' && !mapy._blat) { const t = await tekstura('marmur.webp'); if (t) { t.center.set(0.5, 0.5); mapy._blat = t; } }
		const B = { bialy: ['#f3f2ef', 0.28, 0.7], czarny: ['#141414', 0.18, 1], marmur: ['#ffffff', 0.16, 1], kolor: [nowy.kolorBlatu || '#1a1a1a', 0.3, 0.7] }[nowy.blat];
		if (B) {
			matBlat.color.set(B[0]); matBlat.roughness = B[1]; matBlat.clearcoat = B[2];
			matBlat.map = nowy.blat === 'marmur' && mapy._blat ? mapy._blat : BIALA;
			if (matBlat.map !== BIALA) matBlat.map.repeat.set(nWyk.kafel[0] / 1.2, nWyk.kafel[1] / 1.2); // UV są w skali kafla wykończenia
		}
		const szklo = !!nWyk.szklo, mat = nowy.str === 'mat', pol = !mat && (szklo || nowy.str === 'polysk'); // szkło: połysk, satyna (mat) albo ryflowane z połyskiem
		Object.assign(wlasnCel, { r: szklo ? (mat ? 0.42 : 0.07) : pol ? 0.3 : 0.56, cc: pol ? 1 : 0.0001, ccr: szklo ? 0.02 : 0.06, ns: nWyk.normalna ? (pol ? 0.35 : 0.8) : 0, ior: szklo && !mat ? 2.1 : 1.5 });
		if (popWyk !== nWyk) {
			przejscie.uMapB.value = matWyk.map; przejscie.uKolorB.value.copy(matWyk.color);
			przejscie.uSkalaB.value.set(kafel[0] / popKafel[0], kafel[1] / popKafel[1]);
			matWyk.map = m.map; matWyk.normalMap = m.nor; matWyk.color.set(nWyk.wlasny ? nowy.kolorLady : nWyk.kolor);
			przejscie.uPostep.value = pierwszy || natychmiast ? 1 : 0;
		} else if (przejscie.uPostep.value >= 1 && ['r', 'cc', 'ccr', 'ns', 'ior'].some((k) => Math.abs(wlasnCel[k] - wlasn[k]) > 1e-6)) {
			// sama zmiana powierzchni (mat/połysk): ten sam rysunek po obu stronach czoła, płynnie zmieniają się tylko własności
			przejscie.uMapB.value = matWyk.map; przejscie.uKolorB.value.copy(matWyk.color); przejscie.uSkalaB.value.set(1, 1);
			przejscie.uPostep.value = natychmiast ? 1 : 0.4;
		}
		if (popWyk === nWyk && nWyk.wlasny) matWyk.color.set(nowy.kolorLady); // przeciąganie po palecie: kolor od razu, bez przejścia
		if (pierwszy || natychmiast) {
			Object.assign(b, d); Object.assign(wlasn, wlasnCel); przejscie.uPostep.value = 1;
			matWyk.roughness = wlasn.r; matWyk.clearcoat = wlasn.cc; matWyk.clearcoatRoughness = wlasn.ccr; matWyk.normalScale.setScalar(wlasn.ns); matWyk.ior = wlasn.ior;
		}
		await ustawSciane(nowy.otoczenie, nowy.kolorSciany || '#d9d4cc');
		await ustawPosadzke(nowy.posadzka, nowy.kolorPosadzki || '#b9b4ac');
		jasnoscCel = nowy.pora === 'wieczor' ? 0 : 1; ledCel = nowy.led === 'tak' ? 1 : 0;
		ledU.uLed.value.set(nowy.kolorLed || '#ffd9a0'); matLed.color.copy(ledU.uLed.value);
		if (pierwszy || natychmiast) { ustawJasnosc(jasnoscCel); ledU.uMoc.value = ledCel; }
		if (nowy.gniazdaKolor === 'akcent') { matGniazdo.color.copy(matZloto.color); matGniazdo.metalness = matZloto.metalness; matGniazdo.roughness = Math.max(0.22, matZloto.roughness); matGniazdo.envMapIntensity = matZloto.envMapIntensity; }
		else { matGniazdo.color.set(nowy.gniazdaKolor === 'czarny' ? '#1d1d1d' : '#f1f1ef'); matGniazdo.metalness = 0; matGniazdo.roughness = 0.42; matGniazdo.envMapIntensity = 1; }
		matGniazdoDno.color.set({ czarny: '#3a3a3a', akcent: '#2a2a2a' }[nowy.gniazdaKolor] || '#e4e4e1');
		kreski.visible = nowy.wymiary !== false;
		logoStan = ''; ulozBryle(); granice();
		if (lot) lot.r = Math.min(Math.max(lot.r, ster.minDistance), ster.maxDistance);
		else { // przy zmianie szerokości utrzymaj kadr: ta sama proporcja oddalenia
			sfer.setFromVector3(v3.copy(kamera.position).sub(ster.target));
			if (!pierwszy && Math.abs(d.W - b.W) + Math.abs(d.H - b.H) > 1e-3) lot = { theta: sfer.theta, phi: sfer.phi, r: dystans(1), y: ster.target.y };
		}
		obudz();
	}
	function ustawLogo(nowe) { if (logo && logo.geometry) logo.geometry.dispose(); logo = nowe; logoStan = ''; if (stan) { ulozBryle(); obudz(); } }

	rozmiar();
	kamera.position.set(0, 1, 6);
	return {
		zastosuj, ustawLogo, widok, obudz, czasy, T, renderer, jakosc: () => ({ aoWRuchu }),
		// do nagrań i pomiarów: ustaw kamerę wprost i narysuj jedną klatkę
		kadr(az, el, zoom = 1, y = 0.51 * d.H) { lot = null; ster.target.set(0, y, 0); kamera.position.setFromSpherical(sfer.set(dystans(zoom), Math.PI / 2 - el, az)).add(ster.target); ster.update(); rysuj(true); ulozEtykiety(); },
		kameraWprost(pozycja, cel, fov) { lot = null; zamrozona = true; ster.enabled = false; kamera.fov = fov; kamera.updateProjectionMatrix(); kamera.position.fromArray(pozycja); ster.target.fromArray(cel); kamera.lookAt(ster.target); rysuj(true); },
		obraz: (typ = 'image/png', q) => plotno.toDataURL(typ, q),
		zdjecie: () => { rysuj(true); return plotno.toDataURL('image/jpeg', 0.92); }, // bieżący kadr do pobrania
		gotowe: () => ['W', 'D', 'H', 'otw'].every((n) => Math.abs(d[n] - b[n]) < 2e-4) && przejscie.uPostep.value >= 1 && !lot,
	};
}
