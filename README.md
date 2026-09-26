# CHOREA — web festivalu (chorea.sk)

Statický dvojjazyčný web (SK na koreni, EN pod `/en/`). Rovnaký princíp ako SDT web:
generátor bez závislostí `build.mjs` (Node 22) → výstup `dist/`.

## Štruktúra

```
data/site.json      texty úvodnej stránky, kontakt, vstupenky, partneri, videá, obálky ročníkov
data/archive.json   ročníky 2017–2026: súbory, texty SK/EN, logá, fotogalérie
data/marquee.json   rotujúce logá súborov + mestá a krajiny
data/ui.json        texty rozhrania SK/EN
src/styles.css      jeden zdieľaný štýl
src/app.js          jeden zdieľaný skript (video, menu, galéria, videá z YouTube)
static/             logá, fotky, video, favicony
build.mjs           generátor
```

Každý text je buď reťazec (rovnaký v oboch jazykoch), alebo `{ "sk": …, "en": … }`.

## Build

```
node build.mjs            # produkcia → dist/
./preview.sh              # náhľad s odkazmi na index.html (pre prehliadanie mimo servera)
```

Výstup: úvod, archív a 7 ročníkov × 2 jazyky = 18 stránok, plus `404.html`, `sitemap.xml`,
`robots.txt`, `_headers`, `_redirects`.

## Nasadenie na Cloudflare Pages

Rovnako ako SDT (Git, nie Direct Upload):

| Nastavenie | Hodnota |
|---|---|
| Framework preset | None |
| Build command | `node build.mjs` |
| Build output directory | `dist` |
| Env var | `NODE_VERSION` = `22` |

Pred ostrým spustením nastaviť `"url"` v `data/site.json` na ostrú doménu (bez lomky na konci).

## Bežné úpravy

- **Oznámenie súborov 2027:** texty v `data/site.json` → `lineup`, dátum v `hero.date`.
- **Nový link na vstupenky:** `data/site.json` → `tickets`.
- **Presun ročníka 2027 do archívu:** pridať rok do `data/archive.json` (+ obálku do `site.json` → `archive.years`).
- **Hero video:** `static/video/hero-16x9.(webm|mp4|jpg)` pre široké obrazovky, `hero-1x1.*` pre mobil.
