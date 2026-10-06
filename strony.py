#!/usr/bin/env python3
"""Statyczne podstrony z data.js: uslugi, realizacje, o mnie, FAQ, kontakt w pieciu jezykach,
polityka prywatnosci i regulamin (PL, EN), 404, sitemap.xml. Strona glowna (pole 3D) zostaje,
a jej menu linkuje tutaj, wiec wyszukiwarka dostaje tresc w HTML bez klikania w panele.
Uruchamia build.py; recznie: python3 strony.py"""
import datetime, html, json, os, re, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://kiodem.com"
LANGS = ["en", "pl", "de", "fr", "es"]
OG_LOCALE = {"en": "en_GB", "pl": "pl_PL", "de": "de_DE", "fr": "fr_FR", "es": "es_ES"}
TODAY = datetime.date.today().isoformat()

D = json.loads(subprocess.check_output(["node", "-e",
    "global.window={};require('./data.js');process.stdout.write(JSON.stringify(window.KIODEM_DATA))"], cwd=ROOT))
I18N, WORK, SERVICES, PROCESS, META = D["I18N"], D["WORK"], D["SERVICES"], D["PROCESS"], D["META"]

SLUG = D["PAGES"]["slug"]
LEGAL = ("privacy", "terms")

# Teksty interfejsu podstron, ktorych nie ma w data.js.
UI = {
 "en": {"home": "Home", "faq": "Questions", "privacy": "Privacy policy", "terms": "Terms of service", "skip": "Skip to content",
        "crumbs": "Breadcrumbs", "gallery": "See 3D work samples", "start": "Answer six questions", "updated": "Last updated",
        "faqTitle": "Questions before we start", "faqLead": "Short answers to what people usually ask before the first email.",
        "lang": "Language", "menu": "Pages", "nf": "This page does not exist", "nfText": "The address may have changed when the site moved. Everything is still here:",
        "address": "Address", "legal": "Service provider"},
 "pl": {"home": "Start", "faq": "Pytania", "privacy": "Polityka prywatności", "terms": "Regulamin", "skip": "Przejdź do treści",
        "crumbs": "Ścieżka", "gallery": "Zobacz realizacje 3D", "start": "Odpowiedz na sześć pytań", "updated": "Ostatnia aktualizacja",
        "faqTitle": "Pytania przed startem", "faqLead": "Krótkie odpowiedzi na to, o co zwykle pytają przed pierwszym mailem.",
        "lang": "Język", "menu": "Strony", "nf": "Tej strony nie ma", "nfText": "Adres mógł się zmienić przy przenosinach strony. Wszystko nadal jest tutaj:",
        "address": "Adres", "legal": "Usługodawca"},
 "de": {"home": "Start", "faq": "Fragen", "privacy": "Privacy policy (EN)", "terms": "Terms of service (EN)", "skip": "Zum Inhalt springen",
        "crumbs": "Brotkrumen", "gallery": "3D-Arbeitsbeispiele ansehen", "start": "Sechs Fragen beantworten", "updated": "Zuletzt aktualisiert",
        "faqTitle": "Fragen vor dem Start", "faqLead": "Kurze Antworten auf das, was vor der ersten E-Mail meist gefragt wird.",
        "lang": "Sprache", "menu": "Seiten", "nf": "Diese Seite gibt es nicht", "nfText": "", "address": "Adresse", "legal": "Anbieter"},
 "fr": {"home": "Accueil", "faq": "Questions", "privacy": "Privacy policy (EN)", "terms": "Terms of service (EN)", "skip": "Aller au contenu",
        "crumbs": "Fil d'Ariane", "gallery": "Voir les exemples 3D", "start": "Répondre à six questions", "updated": "Dernière mise à jour",
        "faqTitle": "Questions avant de commencer", "faqLead": "Des réponses courtes à ce qu'on demande souvent avant le premier e-mail.",
        "lang": "Langue", "menu": "Pages", "nf": "Cette page n'existe pas", "nfText": "", "address": "Adresse", "legal": "Prestataire"},
 "es": {"home": "Inicio", "faq": "Preguntas", "privacy": "Privacy policy (EN)", "terms": "Terms of service (EN)", "skip": "Ir al contenido",
        "crumbs": "Ruta", "gallery": "Ver ejemplos 3D", "start": "Responder seis preguntas", "updated": "Última actualización",
        "faqTitle": "Preguntas antes de empezar", "faqLead": "Respuestas cortas a lo que suelen preguntar antes del primer correo.",
        "lang": "Idioma", "menu": "Páginas", "nf": "Esta página no existe", "nfText": "", "address": "Dirección", "legal": "Prestador"},
}

# FAQ: kazda odpowiedz pochodzi z tresci, ktora juz jest na stronie (O mnie, Kontakt, Uslugi).
FAQ = {
 "en": [
  ("Do you work with clients outside Poland?", "Yes. Clients are in Poland, the United Kingdom and Germany. I work in English and Polish, and calls in English happen on weekdays from 9 to 17 UK time."),
  ("How does a project start?", "Usually with a short written check of one journey on your site: how a customer gets from a search to an enquiry and where that route breaks. It costs nothing and it tells both of us whether there is a project."),
  ("How is the price set?", "Scope and price are fixed and written in plain terms before anything starts, so there are no surprises between the steps."),
  ("Who owns the website, the accounts and the code?", "You do. Accounts, domains and tracking are set up in your name, so nothing depends on me later. Configurators run on your own site with no monthly licence, and the code stays with you."),
  ("Which platforms do you work with?", "WordPress, WooCommerce, Shopify, Shoper, Shopware and hand-written HTML, CSS and JavaScript. For measurement: GA4, Tag Manager, Search Console and Merchant Center."),
  ("Does a 3D configurator work on phones and older computers?", "Yes. Next to the live 3D scene there is a fallback built from the same scene, so it also works without a graphics card and on older phones."),
  ("How fast do you reply?", "Within one working day. One email is enough to start."),
 ],
 "pl": [
  ("Czy pracujesz z firmami spoza Polski?", "Tak. Klienci są w Polsce, Wielkiej Brytanii i Niemczech. Pracuję po polsku i po angielsku."),
  ("Od czego zaczyna się projekt?", "Zwykle od krótkiego, pisemnego sprawdzenia jednej ścieżki na Twojej stronie: jak klient dochodzi od wyszukiwania do zapytania i gdzie ta droga się urywa. Nic nie kosztuje, a obu stronom mówi, czy jest projekt."),
  ("Jak ustalana jest cena?", "Zakres i cena są ustalone i spisane prostym językiem, zanim cokolwiek ruszy, więc między krokami nie ma niespodzianek."),
  ("Do kogo należą strona, konta i kod?", "Do Ciebie. Konta, domeny i pomiar zakładam na Ciebie, więc nic później nie zależy ode mnie. Konfigurator działa na Twojej stronie, bez miesięcznej licencji, a kod zostaje u Ciebie."),
  ("Na jakich platformach pracujesz?", "WordPress, WooCommerce, Shopify, Shoper, Shopware oraz ręcznie pisany HTML, CSS i JavaScript. Pomiar: GA4, Tag Manager, Search Console i Merchant Center."),
  ("Czy konfigurator 3D działa na telefonie i starszym komputerze?", "Tak. Obok sceny 3D na żywo jest tryb zapasowy z tej samej sceny, więc działa też bez karty graficznej i na starszych telefonach."),
  ("Jak szybko odpowiadasz?", "W ciągu jednego dnia roboczego. Wystarczy jeden mail."),
 ],
 "de": [
  ("Arbeiten Sie mit Kunden außerhalb Polens?", "Ja. Kunden sind in Polen, Großbritannien und Deutschland. Ich arbeite auf Englisch und Polnisch."),
  ("Wie beginnt ein Projekt?", "Meist mit einer kurzen schriftlichen Prüfung eines Wegs auf Ihrer Website: wie ein Kunde von der Suche zur Anfrage kommt und wo dieser Weg abbricht. Sie kostet nichts und zeigt beiden Seiten, ob es ein Projekt gibt."),
  ("Wie wird der Preis festgelegt?", "Umfang und Preis werden vor dem Start in klaren Worten festgelegt und schriftlich vereinbart, damit es zwischen den Schritten keine Überraschungen gibt."),
  ("Wem gehören Website, Konten und Code?", "Ihnen. Konten, Domains und Tracking werden auf Ihren Namen angelegt, damit später nichts von mir abhängt. Konfiguratoren laufen auf Ihrer Website ohne Monatslizenz, und der Code bleibt bei Ihnen."),
  ("Mit welchen Plattformen arbeiten Sie?", "WordPress, WooCommerce, Shopify, Shoper, Shopware und handgeschriebenes HTML, CSS und JavaScript. Für Messung: GA4, Tag Manager, Search Console und Merchant Center."),
  ("Läuft ein 3D-Konfigurator auf Smartphones und älteren Rechnern?", "Ja. Neben der Live-Szene gibt es einen Ersatzmodus aus derselben Szene, der auch ohne Grafikkarte und auf älteren Smartphones läuft."),
  ("Wie schnell antworten Sie?", "Innerhalb eines Werktags. Eine E-Mail genügt."),
 ],
 "fr": [
  ("Travaillez-vous avec des clients hors de Pologne ?", "Oui. Les clients sont en Pologne, au Royaume-Uni et en Allemagne. Je travaille en anglais et en polonais."),
  ("Comment commence un projet ?", "En général par une courte vérification écrite d'un parcours sur votre site : comment un client passe d'une recherche à une demande et où ce chemin se casse. Elle ne coûte rien et dit aux deux parties s'il y a un projet."),
  ("Comment le prix est-il fixé ?", "Le périmètre et le prix sont fixés et écrits clairement avant le début, sans surprise entre les étapes."),
  ("À qui appartiennent le site, les comptes et le code ?", "À vous. Comptes, domaines et suivi sont créés à votre nom, pour que rien ne dépende de moi ensuite. Les configurateurs tournent sur votre site sans licence mensuelle, et le code reste chez vous."),
  ("Avec quelles plateformes travaillez-vous ?", "WordPress, WooCommerce, Shopify, Shoper, Shopware et du HTML, CSS et JavaScript écrits à la main. Pour la mesure : GA4, Tag Manager, Search Console et Merchant Center."),
  ("Un configurateur 3D fonctionne-t-il sur mobile et sur un ancien ordinateur ?", "Oui. À côté de la scène 3D en temps réel, un mode de secours tiré de la même scène fonctionne sans carte graphique et sur les téléphones plus anciens."),
  ("En combien de temps répondez-vous ?", "Sous un jour ouvré. Un seul e-mail suffit."),
 ],
 "es": [
  ("¿Trabajas con clientes fuera de Polonia?", "Sí. Hay clientes en Polonia, Reino Unido y Alemania. Trabajo en inglés y en polaco."),
  ("¿Cómo empieza un proyecto?", "Normalmente con una revisión breve y por escrito de un recorrido de tu web: cómo pasa un cliente de una búsqueda a una consulta y dónde se rompe ese camino. No cuesta nada y nos dice a los dos si hay proyecto."),
  ("¿Cómo se fija el precio?", "El alcance y el precio se fijan y se escriben con claridad antes de empezar, sin sorpresas entre los pasos."),
  ("¿De quién son la web, las cuentas y el código?", "Tuyos. Las cuentas, los dominios y la medición se crean a tu nombre, para que nada dependa de mí después. Los configuradores funcionan en tu web sin licencia mensual, y el código se queda contigo."),
  ("¿Con qué plataformas trabajas?", "WordPress, WooCommerce, Shopify, Shoper, Shopware y HTML, CSS y JavaScript escritos a mano. Para medición: GA4, Tag Manager, Search Console y Merchant Center."),
  ("¿Un configurador 3D funciona en móviles y ordenadores antiguos?", "Sí. Junto a la escena 3D en tiempo real hay un modo de respaldo hecho con la misma escena, que funciona sin tarjeta gráfica y en móviles antiguos."),
  ("¿Cuánto tardas en responder?", "Un día laborable como máximo. Basta con un correo."),
 ],
}

PROVIDER = {
 "pl": "Magdalena Ociepa-Smolińska, prowadząca działalność gospodarczą (marka KIODEM), ul. Rybnicka 146, 44-100 Gliwice, NIP 6311230797, REGON 273490573",
 "en": "Magdalena Ociepa-Smolińska, sole trader operating as KIODEM, ul. Rybnicka 146, 44-100 Gliwice, Poland, tax ID (NIP) 6311230797, REGON 273490573",
}
ADDRESS = "ul. Rybnicka 146, 44-100 Gliwice"
PHONE, PHONE_TEL = "+48 789 350 367", "+48789350367"

DOCS = {
 ("privacy", "pl"): ("Polityka prywatności", "Jak strona kiodem.com i korespondencja z KIODEM przetwarzają dane osobowe.", [
  ("Administrator", ["Administratorem danych jest {P}. Kontakt w sprawach danych: <a href=\"mailto:contact@kiodem.com\">contact@kiodem.com</a>, tel. {T}."]),
  ("Jakie dane i po co", [
   "<strong>Korespondencja.</strong> Gdy piszesz e-mail, dzwonisz albo wysyłasz odpowiedzi z formularza „Zacznij” (formularz otwiera Twój program pocztowy i nic nie wysyła sam), przetwarzam podane przez Ciebie dane, żeby odpowiedzieć i przygotować ofertę (art. 6 ust. 1 lit. b RODO), a po zawarciu umowy także, żeby ją wykonać i rozliczyć (art. 6 ust. 1 lit. b i c RODO).",
   "<strong>Kontakt handlowy z firmami.</strong> Do firm piszę na służbowe adresy opublikowane na ich stronach albo w publicznych rejestrach. Podstawą jest prawnie uzasadniony interes, czyli informowanie o usługach (art. 6 ust. 1 lit. f RODO). Wystarczy odpowiedzieć „nie”, a nie napiszę ponownie i oznaczę adres jako wyłączony.",
   "<strong>Statystyka strony.</strong> Liczę odwiedziny narzędziem Cloudflare Web Analytics, które nie używa ciasteczek i nie śledzi osób między stronami. Dane są zbiorcze (prawnie uzasadniony interes, art. 6 ust. 1 lit. f RODO).",
   "<strong>Logi i bezpieczeństwo.</strong> Serwer (Cloudflare) zapisuje techniczne dane zapytań, takie jak adres IP i typ przeglądarki, żeby dostarczyć stronę i chronić ją przed atakami (art. 6 ust. 1 lit. f RODO)."]),
  ("Ciasteczka i pamięć przeglądarki", [
   "Strona nie ustawia ciasteczek reklamowych ani analitycznych. Cloudflare może zapisać techniczne ciasteczko ochrony przed botami (np. <code>__cf_bm</code>), niezbędne do działania strony.",
   "W pamięci Twojej przeglądarki (localStorage) zostają tylko wybrany język i nieskończone odpowiedzi z formularza „Zacznij”, żeby nie zginęły. Nie trafiają do mnie, dopóki sam ich nie wyślesz. Usuniesz je, czyszcząc dane witryny w przeglądarce."]),
  ("Komu przekazuję dane", [
   "Dostawcom, bez których usługa nie działa: Cloudflare, Inc. (hosting i ochrona strony) oraz Google (poczta Google Workspace). Obaj mogą przetwarzać dane w USA na podstawie EU-US Data Privacy Framework. Przy realizacji umowy także biuru rachunkowemu i organom, gdy wymaga tego prawo."]),
  ("Jak długo", [
   "Korespondencję bez umowy przechowuję do zakończenia sprawy, nie dłużej niż 2 lata. Dokumenty umowy i rozliczeń przez okres wymagany przepisami podatkowymi (5 lat od końca roku) i do przedawnienia roszczeń. Adres wyłączony z kontaktu handlowego zostaje na liście wyłączeń, żeby nie napisać ponownie."]),
  ("Twoje prawa", [
   "Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia oraz sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie. Możesz złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa). Podanie danych jest dobrowolne, ale bez adresu nie odpowiem. Nie podejmuję decyzji automatycznie i nie profiluję."]),
 ]),
 ("privacy", "en"): ("Privacy policy", "How kiodem.com and correspondence with KIODEM handle personal data.", [
  ("Controller", ["The data controller is {P}. Contact for data matters: <a href=\"mailto:michal@kiodem.com\">michal@kiodem.com</a>, phone {T}."]),
  ("What data and why", [
   "<strong>Correspondence.</strong> When you email, call or send the answers from the Start form (the form opens your own email program and sends nothing by itself), I process what you give me to reply and prepare an offer (Art. 6(1)(b) GDPR), and after a contract also to perform and invoice it (Art. 6(1)(b) and (c) GDPR).",
   "<strong>Business outreach.</strong> I write to companies at business addresses published on their own websites or in public registers. The basis is legitimate interest in informing them about my services (Art. 6(1)(f) GDPR; in the UK, PECR rules for corporate subscribers). Reply \"no\" and I will not write again and will mark the address as excluded.",
   "<strong>Site statistics.</strong> Visits are counted with Cloudflare Web Analytics, which uses no cookies and does not track people across sites. The data is aggregate (legitimate interest, Art. 6(1)(f) GDPR).",
   "<strong>Logs and security.</strong> The server (Cloudflare) records technical request data such as IP address and browser type to deliver the site and protect it from attacks (Art. 6(1)(f) GDPR)."]),
  ("Cookies and browser storage", [
   "The site sets no advertising or analytics cookies. Cloudflare may set a technical bot-protection cookie (for example <code>__cf_bm</code>) that the site needs to work.",
   "Your browser's local storage keeps only the language you chose and unfinished answers from the Start form, so they are not lost. They do not reach me unless you send them. Clearing site data in your browser removes them."]),
  ("Who receives data", [
   "Providers the service cannot run without: Cloudflare, Inc. (hosting and protection) and Google (Google Workspace email). Both may process data in the USA under the EU-US Data Privacy Framework. For a contract, also the accounting office and authorities where the law requires it."]),
  ("How long", [
   "Correspondence without a contract is kept until the matter is closed, no longer than 2 years. Contract and invoicing documents are kept for the period required by Polish tax law (5 years from the end of the year) and until claims expire. An address excluded from outreach stays on the exclusion list so it is not contacted again."]),
  ("Your rights", [
   "You have the right to access, rectify and erase your data, to restrict processing, to data portability and to object to processing based on legitimate interest. You can complain to the Polish supervisory authority (Prezes Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warsaw) or the authority in your country. Giving data is voluntary, but without an address I cannot reply. There is no automated decision-making or profiling."]),
 ]),
 ("terms", "pl"): ("Regulamin", "Zasady korzystania ze strony kiodem.com (usługi świadczone drogą elektroniczną).", [
  ("Usługodawca", ["Usługodawcą jest {P}. Kontakt: <a href=\"mailto:contact@kiodem.com\">contact@kiodem.com</a>, tel. {T}."]),
  ("Co strona udostępnia", ["Bezpłatnie: przeglądanie treści o usługach i realizacjach oraz formularz „Zacznij”, który zbiera odpowiedzi na sześć pytań i otwiera Twój program pocztowy z gotową wiadomością. Umowy na usługi (strony, pomiar, reklamy, konfiguratory) zawieramy osobno, na piśmie lub mailowo, z ustalonym zakresem i ceną."]),
  ("Wymagania techniczne", ["Aktualna przeglądarka z włączonym JavaScriptem dla części interaktywnej (podstrony z treścią działają bez niego) oraz program pocztowy do wysłania odpowiedzi z formularza."]),
  ("Zasady korzystania", ["Nie wolno przesyłać treści bezprawnych ani zakłócać działania strony. Treści, zrzuty ekranu i kod strony są chronione prawem autorskim; kopiowanie bez zgody jest zabronione. Logotypy klientów i nazwy marek należą do ich właścicieli."]),
  ("Reklamacje", ["Uwagi i reklamacje dotyczące strony przyjmuję mailowo. Odpowiadam w ciągu 14 dni."]),
  ("Postanowienia końcowe", ["Dane osobowe opisuje <a href=\"/pl/polityka-prywatnosci/\">polityka prywatności</a>. Regulamin może się zmienić; obowiązuje wersja opublikowana na stronie. Prawem właściwym jest prawo polskie; nie ogranicza to praw konsumenta wynikających z przepisów jego kraju."]),
 ]),
 ("terms", "en"): ("Terms of service", "Rules for using kiodem.com.", [
  ("Service provider", ["The service provider is {P}. Contact: <a href=\"mailto:michal@kiodem.com\">michal@kiodem.com</a>, phone {T}."]),
  ("What the site offers", ["Free of charge: reading about services and work, and the Start form, which collects answers to six questions and opens your own email program with a ready message. Contracts for services (websites, measurement, ads, configurators) are agreed separately, in writing or by email, with a fixed scope and price."]),
  ("Technical requirements", ["A current browser with JavaScript for the interactive part (the content pages work without it) and an email program to send the form answers."]),
  ("Use of the site", ["Do not send unlawful content or disrupt the site. The texts, screenshots and code of the site are protected by copyright; copying without permission is not allowed. Client logos and brand names belong to their owners."]),
  ("Complaints", ["Comments and complaints about the site are accepted by email and answered within 14 days."]),
  ("Final provisions", ["Personal data is covered by the <a href=\"/privacy/\">privacy policy</a>. These terms may change; the version published on the site applies. Polish law governs, without limiting consumer rights under the law of the consumer's country."]),
 ]),
}

e = lambda s: html.escape(str(s), quote=True)


def base(l):
    return "/" if l == "en" else "/%s/" % l


def url(page, l):
    if page == "home":
        return base(l)
    if page in LEGAL and l not in SLUG[page]:
        l = "en"
    return base(l) + SLUG[page][l] + "/"


def langs_of(page):
    return [l for l in LANGS if page not in LEGAL or l in SLUG[page]]


WORDMARK = re.search(r'<symbol id="sym-wordmark" viewBox="([^"]+)">(.*?)</symbol>',
                     open(os.path.join(ROOT, "index.html"), encoding="utf-8").read(), re.S)
LOGO = '<svg viewBox="%s" aria-hidden="true" focusable="false">%s</svg>' % (WORDMARK.group(1), WORDMARK.group(2).strip())
GH = ("<script>if(/github\\.io$/.test(location.hostname))location.replace('https://kiodem.com'"
      "+location.pathname.replace(/^\\/kiodem-site/,'')+location.search+location.hash)</script>")
ORG = {"@id": SITE + "/#org"}


def head(l, page, title, desc, ld, noindex=False):
    alts = "".join('<link rel="alternate" hreflang="%s" href="%s%s">' % (x, SITE, url(page, x)) for x in langs_of(page))
    alts += '<link rel="alternate" hreflang="x-default" href="%s%s">' % (SITE, url(page, "en"))
    return f"""<!doctype html>
<html lang="{l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{GH}
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
{'<meta name="robots" content="noindex">' if noindex else ''}
{'' if noindex else '<link rel="canonical" href="%s%s">' % (SITE, url(page, l))}
{'' if noindex else alts}
<meta name="theme-color" content="#080A0F">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="KIODEM">
<meta property="og:url" content="{SITE}{url(page, l)}">
<meta property="og:image" content="{SITE}/assets/brand/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="{OG_LOCALE[l]}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/page.css?v=1">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<a class="skip" href="#tresc">{e(UI[l]['skip'])}</a>
"""


def chrome_top(l, page):
    L, U = I18N[l], UI[l]
    items = [("work", L["nav.work"]), ("services", L["nav.services"]), ("about", L["nav.about"]),
             ("faq", U["faq"]), ("contact", L["nav.contact"])]
    nav = "".join('<a href="%s"%s>%s</a>' % (url(p, l), ' aria-current="page"' if p == page else "", e(t)) for p, t in items)
    langs = "".join('<a href="%s" hreflang="%s" lang="%s"%s>%s</a>' % (url(page, x), x, x, ' aria-current="true"' if x == l else "", x.upper())
                    for x in langs_of(page))
    return f"""<header class="head"><div class="wrap">
<a class="logo" href="{base(l)}" aria-label="KIODEM, {e(U['home'])}">{LOGO}</a>
<nav class="nav" aria-label="{e(U['menu'])}">{nav}</nav>
<nav class="langs" aria-label="{e(U['lang'])}">{langs}</nav>
</div></header>
"""


def crumbs(l, title):
    return f"""<nav class="crumbs" aria-label="{e(UI[l]['crumbs'])}"><ol><li><a href="{base(l)}">{e(UI[l]['home'])}</a></li><li aria-current="page">{e(title)}</li></ol></nav>"""


def crumbs_ld(l, page, title):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": UI[l]["home"], "item": SITE + base(l)},
        {"@type": "ListItem", "position": 2, "name": title, "item": SITE + url(page, l)}]}


def cta(l):
    L = I18N[l]
    return f"""<section class="cta" aria-label="{e(L['contactTitle'])}">
<p style="margin:0;flex-basis:100%;color:var(--ivory)">{e(L['contactLead'])}</p>
<a class="btn" href="mailto:{L['mail']}?subject=KIODEM">{e(L['write'])}</a>
<a href="{base(l)}#brief">{e(UI[l]['start'])}</a>
</section>"""


def foot(l):
    U, L = UI[l], I18N[l]
    lk = "pl" if l == "pl" else "en"
    return f"""<footer class="foot"><div class="wrap">
<p>KIODEM · Michał Smoliński · {ADDRESS}, {'Polska' if l == 'pl' else 'Poland'} · <a href="mailto:{L['mail']}">{L['mail']}</a> · <a href="tel:{PHONE_TEL}">{PHONE}</a></p>
<nav aria-label="{e(U['legal'])}"><a href="{url('faq', l)}">{e(U['faq'])}</a><a href="{url('privacy', lk)}">{e(UI[lk]['privacy'] if lk == l else U['privacy'])}</a><a href="{url('terms', lk)}">{e(UI[lk]['terms'] if lk == l else U['terms'])}</a><a href="/realizacje-3d/">{e(U['gallery'])}</a></nav>
</div></footer>
</body>
</html>
"""


def page_doc(l, page, h1, desc, body, ld_extra=None):
    title = "%s | KIODEM" % h1
    graph = [{"@type": "WebPage", "@id": SITE + url(page, l), "url": SITE + url(page, l), "name": title,
              "inLanguage": l, "isPartOf": {"@id": SITE + "/#site"}, "publisher": ORG}, crumbs_ld(l, page, h1)]
    if ld_extra:
        graph += ld_extra
    out = head(l, page, title, desc, {"@context": "https://schema.org", "@graph": graph})
    out += chrome_top(l, page) + '<main id="tresc"><div class="wrap">' + crumbs(l, h1) + "<h1>%s</h1>" % e(h1) + body + "</div></main>" + foot(l)
    path = os.path.join(ROOT, url(page, l).strip("/"), "index.html")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf-8").write(out)


def clip(s, n=158):
    s = re.sub(r"<[^>]+>", "", s)
    return s if len(s) <= n else s[:n - 1].rsplit(" ", 1)[0] + "…"


def build_lang(l):
    L, U = I18N[l], UI[l]
    # uslugi
    body = '<p class="lead">%s</p>' % e(L["servicesLead"])
    svc_ld = []
    for s in SERVICES:
        body += '<section class="item" id="service-%s"><h2>%s</h2><p><span class="line">%s.</span> %s</p>' % (s["id"], e(s["title"][l]), e(s["line"][l]), e(s["text"][l]))
        if s.get("details"):
            body += "<ul>" + "".join("<li>%s</li>" % e(d) for d in s["details"][l]) + "</ul>"
        if s["id"] == "configurators":
            body += '<p><a href="/realizacje-3d/">%s</a></p>' % e(U["gallery"])
        body += "</section>"
        svc_ld.append({"@type": "Service", "name": s["title"][l], "description": s["text"][l], "provider": ORG, "areaServed": ["PL", "GB", "DE"]})
    page_doc(l, "services", L["nav.services"], clip(L["servicesLead"] + " " + L["sections"]["services"] + "."), body + cta(l), svc_ld)
    # realizacje
    body = '<p class="lead">%s</p>' % e(L["workLead"])
    for i, w in enumerate(WORK):
        body += '<article class="item" id="case-%s"><h2>%s</h2><p class="meta">%s</p>' % (w["id"], e(w["name"]), e(w["sector"][l]))
        if w.get("img"):
            body += '<img src="/assets/work/%s.webp" alt="%s" width="720" height="540"%s>' % (w["img"], e(w["name"]), "" if i == 0 else ' loading="lazy" decoding="async"')
        body += "<p>%s</p>" % e(w["what"][l])
        for key, lab in (("tech", L["caseTech"]), ("result", L["caseResult"]), ("advice", L["caseAdvice"])):
            if w.get(key) and w[key].get(l):
                body += "<h3>%s</h3><ul>%s</ul>" % (e(lab), "".join("<li>%s</li>" % e(x) for x in w[key][l]))
        if w.get("url"):
            body += '<p><a href="%s" rel="noopener" target="_blank">%s</a></p>' % (e(w["url"]), e(L["visit"]))
        body += "</article>"
    page_doc(l, "work", L["nav.work"], clip(L["workLead"]), body + cta(l))
    # o mnie + jak pracuje
    body = '<p class="lead">%s</p>' % e(L["aboutLead"]) + "".join("<p>%s</p>" % p for p in L["about"])
    body += '<dl class="facts">' + "".join("<dt>%s</dt><dd>%s</dd>" % (f[0], f[1]) for f in L["facts"]) + "</dl>"
    body += "<h2>%s</h2><p>%s</p><ol class=\"steps\">" % (e(PROCESS["title"][l]), e(PROCESS["lead"][l]))
    body += "".join("<li><h3>%s</h3><p>%s</p></li>" % (e(st["t"][l]), e(st["d"][l])) for st in PROCESS["steps"]) + "</ol>"
    person = {"@type": "Person", "@id": SITE + "/#person", "name": "Michał Smoliński", "worksFor": ORG}
    page_doc(l, "about", L["aboutTitle"], clip(L["aboutLead"]), body + cta(l), [person])
    # FAQ
    qa = FAQ[l]
    body = '<p class="lead">%s</p>' % e(U["faqLead"]) + "".join("<details><summary>%s</summary><p>%s</p></details>" % (e(q), e(a)) for q, a in qa)
    faq_ld = {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qa]}
    page_doc(l, "faq", U["faqTitle"], clip(U["faqLead"] + " " + qa[0][0] + " " + qa[2][0]), body + cta(l), [faq_ld])
    # kontakt
    body = '<p class="lead">%s</p><p><a class="mail" href="mailto:%s?subject=KIODEM">%s</a></p>' % (e(L["contactLead"]), L["mail"], L["mail"])
    body += '<dl class="facts"><dt>Tel.</dt><dd><a href="tel:%s">%s</a></dd><dt>LinkedIn</dt><dd><a href="https://www.linkedin.com/in/michal-smolinski" rel="noopener" target="_blank">michal-smolinski</a></dd>' % (PHONE_TEL, PHONE)
    body += "<dt>%s</dt><dd><address style=\"font-style:normal\">KIODEM · Michał Smoliński<br>%s<br>%s</address></dd></dl>" % (e(U["address"]), ADDRESS, "Polska" if l == "pl" else "Poland")
    body += "<p>%s</p><p>%s <a href=\"%s#brief\">%s</a></p>" % (e(L["contactNote"]), e(L["contactBrief"]), base(l), e(L["nav.brief"]))
    contact_ld = {"@type": "ContactPage", "about": ORG}
    page_doc(l, "contact", L["contactTitle"], clip(L["contactLead"] + " " + L["contactNote"]), body, [contact_ld])


def build_docs():
    for (page, l), (h1, desc, sections) in DOCS.items():
        body = '<div class="doc"><p class="updated">%s: %s</p><p class="lead">%s</p>' % (e(UI[l]["updated"]), "2026-10-06", e(desc))
        for h, paras in sections:
            body += "<h2>%s</h2>" % e(h) + "".join("<p>%s</p>" % p.replace("{P}", e(PROVIDER[l])).replace("{T}", PHONE) for p in paras)
        page_doc(l, page, h1, desc, body + "</div>")


def build_404():
    out = head("en", "home", "Page not found | KIODEM", "This page does not exist.", {"@context": "https://schema.org", "@type": "WebPage", "name": "404"}, noindex=True)
    links = lambda l: "".join('<li><a href="%s">%s</a></li>' % (url(p, l), e(t)) for p, t in (
        ("home", UI[l]["home"]), ("work", I18N[l]["nav.work"]), ("services", I18N[l]["nav.services"]),
        ("about", I18N[l]["nav.about"]), ("faq", UI[l]["faq"]), ("contact", I18N[l]["nav.contact"])))
    out += chrome_top("en", "home") + '<main id="tresc"><div class="wrap"><h1>%s</h1><p class="lead">%s</p><ul>%s</ul>' % (UI["en"]["nf"], UI["en"]["nfText"], links("en"))
    out += '<h2 lang="pl">%s</h2><p lang="pl">%s</p><ul lang="pl">%s</ul></div></main>' % (UI["pl"]["nf"], UI["pl"]["nfText"], links("pl")) + foot("en")
    open(os.path.join(ROOT, "404.html"), "w", encoding="utf-8").write(out)


def build_sitemap():
    pages = ["home", "work", "services", "about", "faq", "contact", "privacy", "terms"]
    xs = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for p in pages:
        for l in langs_of(p):
            alts = "".join('<xhtml:link rel="alternate" hreflang="%s" href="%s%s"/>' % (x, SITE, url(p, x)) for x in langs_of(p))
            alts += '<xhtml:link rel="alternate" hreflang="x-default" href="%s%s"/>' % (SITE, url(p, "en"))
            xs.append("<url><loc>%s%s</loc><lastmod>%s</lastmod>%s</url>" % (SITE, url(p, l), TODAY, alts))
    xs.append("</urlset>")
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(xs) + "\n")


if __name__ == "__main__":
    for l in LANGS:
        build_lang(l)
    build_docs()
    build_404()
    build_sitemap()
    print("strony: ok")
