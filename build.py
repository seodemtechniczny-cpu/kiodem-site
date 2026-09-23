#!/usr/bin/env python3
"""Generuje /pl/, /de/, /fr/, /es/ z index.html (root = en, x-default).
Kazda kopia ma wlasny <html lang>, data-lang (app.js honoruje go przed localStorage),
tytul, opis, og:locale, canonical i statyczne teksty nawigacji w swoim jezyku.
Sciezki do zasobow dostaja przedrostek ../. Uruchom po kazdej zmianie index.html lub tekstow."""
import json, os, re, subprocess
ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://kiodem.com/"
LANGS = ["pl", "de", "fr", "es"]
OG_LOCALE = {"en": "en_GB", "pl": "pl_PL", "de": "de_DE", "fr": "fr_FR", "es": "es_ES"}
data = json.loads(subprocess.check_output(["node", "-e",
    "global.window={};require('./data.js');const D=window.KIODEM_DATA;"
    "process.stdout.write(JSON.stringify({META:D.META,I18N:D.I18N}))"], cwd=ROOT))
src = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
assert '<html lang="en">' in src and "<!-- i18n:start -->" in src

def localize(html, lang):
    M, L = data["META"][lang], data["I18N"][lang]
    html = html.replace('<html lang="en">', '<html lang="%s" data-lang="%s">' % (lang, lang))
    html = re.sub(r"<title>.*?</title>", "<title>%s</title>" % M["title"], html, count=1)
    html = re.sub(r'(<meta name="description" content=")[^"]*', r"\g<1>" + M["description"], html, count=1)
    html = re.sub(r'(<meta property="og:title" content=")[^"]*', r"\g<1>" + M["title"], html, count=1)
    html = re.sub(r'(<meta property="og:description" content=")[^"]*', r"\g<1>" + M["description"], html, count=1)
    html = html.replace('<meta property="og:locale" content="en_GB">', '<meta property="og:locale" content="%s">' % OG_LOCALE[lang])
    html = html.replace('<meta property="og:url" content="%s">' % SITE, '<meta property="og:url" content="%s%s/">' % (SITE, lang))
    html = html.replace('<link rel="canonical" href="%s">' % SITE, '<link rel="canonical" href="%s%s/">' % (SITE, lang))
    # statyczne teksty z data-i18n (crawler widzi je bez JS)
    def sub_i18n(m):
        key = m.group(1); val = L.get(key)
        return m.group(0) if not isinstance(val, str) else m.group(0).rsplit(">", 1)[0] + ">" + val
    html = re.sub(r'<([a-z]+) class="[^"]*" [^>]*data-i18n="([^"]+)"[^>]*>[^<]*', lambda m: re.sub(r">[^<]*$", ">" + L[m.group(2)], m.group(0)) if isinstance(L.get(m.group(2)), str) else m.group(0), html)
    html = re.sub(r'(<button class="dock__btn"[^>]*data-i18n="([^"]+)"[^>]*aria-label=")[^"]*', lambda m: m.group(1) + L[m.group(2)], html)
    # zasoby o poziom wyzej
    for pat in ('href="assets/', 'href="styles.css', 'src="data.js', 'src="app.js'):
        html = html.replace(pat, pat.replace('="', '="../'))
    return html

for lang in LANGS:
    d = os.path.join(ROOT, lang); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(localize(src, lang))
    print("ok", lang)
