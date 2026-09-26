// CHOREA — static site generator (Node 22, no dependencies)
// node build.mjs            → dist/ for production (clean URLs)
// PREVIEW=1 node build.mjs  → dist/ with explicit index.html links (for file previews)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DIST = path.join(ROOT, 'dist');
const PREVIEW = !!process.env.PREVIEW;
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const site = read('data/site.json');
const ui = read('data/ui.json');
const archive = read('data/archive.json');
const marquee = read('data/marquee.json');
const VERSION = Date.now().toString(36);

const LANGS = site.languages;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const t = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.sk ?? v.en) : v);
const plural = (n, forms) => (n === 1 ? forms[0] : n >= 2 && n <= 4 ? forms[1] : forms[2]);
const ord = n => (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');
const editionLabel = (n, lang) => ui.editionOrd[lang].replace('{n}', n).replace('{suffix}', ord(n));
const titleCase = s => (s === s.toUpperCase() && /[A-ZÁ-Ž]{4}/.test(s) ? s.toLowerCase().replace(/(^|[\s\-–(/’'])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Di|Du|Of|The|And|Des|La|Le|Y)\b/g, w => w.toLowerCase()).replace(/^./, c => c.toUpperCase()) : s);

// ---------- routing ----------
const P = {
  home: { sk: '', en: 'en/' },
  archive: { sk: 'archiv/', en: 'en/archive/' },
  year: (y) => ({ sk: `archiv/${y}/`, en: `en/archive/${y}/` }),
};
const years = archive.years.slice().sort((a, b) => b.year - a.year);

function relPrefix(route) { const depth = route.split('/').filter(Boolean).length; return depth ? '../'.repeat(depth) : './'; }
function link(from, to) {
  const r = relPrefix(from) + to;
  const clean = r === './' ? './' : r;
  return PREVIEW ? (clean.endsWith('/') ? clean + 'index.html' : clean) : clean;
}
const asset = (from, p) => relPrefix(from) + 'static/' + p + (p.match(/\.(css|js)$/) ? `?v=${VERSION}` : '');

// ---------- icons ----------
const I = {
  ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 0 0 5V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.5a2.5 2.5 0 0 0 0-5Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M14.5 6v2M14.5 11v2M14.5 16v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowL: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H7.9v3h2.6V21h3Z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4.2-2 1.4a12 12 0 0 0 6.3 6.3l1.4-2 4.2 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="9.8" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};
// flowing brush strokes echoing the logo's arms
const swoosh = (cls = '') => `<svg class="swoosh ${cls}" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true"><path d="M-20 260 C 260 250, 520 170, 760 110 S 1120 30, 1230 18" /><path d="M-20 280 C 300 262, 560 196, 800 140 S 1140 64, 1230 50" /><path d="M-20 296 C 320 282, 600 222, 830 172 S 1150 100, 1230 88" /></svg>`;

// ---------- layout ----------
function head({ lang, route, title, desc, alt, image }) {
  const url = site.url + '/' + route;
  const alts = Object.entries(alt).map(([l, r]) => `<link rel="alternate" hreflang="${l}" href="${site.url}/${r}">`).join('\n');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${alts}
<link rel="alternate" hreflang="x-default" href="${site.url}/${alt.sk}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CHOREA">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.url}/static/${image || 'brand/og-image.jpg'}">
<meta property="og:locale" content="${lang === 'sk' ? 'sk_SK' : 'en_GB'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0a0c">
<link rel="icon" type="image/png" sizes="32x32" href="${asset(route, 'brand/favicon-32.png')}">
<link rel="icon" type="image/png" sizes="48x48" href="${asset(route, 'brand/favicon-48.png')}">
<link rel="apple-touch-icon" href="${asset(route, 'brand/apple-touch-icon.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${asset(route, 'styles.css')}">
</head>`;
}

function header({ lang, route, alt, home }) {
  const h = (id) => home ? `#${id}` : `${link(route, P.home[lang])}#${id}`;
  const items = [['festival', 'festival'], ['venue', 'miesto'], ['videos', 'videa'], ['archive', null], ['contact', 'kontakt']];
  const nav = items.map(([k, id]) => {
    const href = id ? h(id) : link(route, P.archive[lang]);
    const cur = !id && route.startsWith(P.archive[lang]) ? ' aria-current="page"' : '';
    return `<li><a href="${href}"${cur}>${esc(ui.nav[k][lang])}</a></li>`;
  }).join('');
  const langs = LANGS.map(l => l === lang ? `<span aria-current="true">${l.toUpperCase()}</span>` : `<a href="${link(route, alt[l])}" hreflang="${l}" lang="${l}" title="${esc(ui.langName[l])}">${l.toUpperCase()}</a>`).join('<i aria-hidden="true">/</i>');
  return `<a class="skip" href="#main">${esc(ui.skip[lang])}</a>
<header class="site-header${home ? ' is-home' : ''}" data-header>
  <div class="bar">
    <a class="brand" href="${link(route, P.home[lang])}" aria-label="CHOREA 2027 — ${esc(ui.backHome[lang])}"><img src="${asset(route, 'brand/chorea-2027-sm.webp')}" alt="CHOREA 2027" width="709" height="499"></a>
    <nav class="main-nav" aria-label="Menu"><ul>${nav}</ul></nav>
    <div class="bar-end">
      <div class="lang">${langs}</div>
      <a class="btn btn-yellow btn-sm" href="${site.tickets}" target="_blank" rel="noopener" data-tickets>${I.ticket}<span>${esc(ui.tickets[lang])}</span></a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu" data-menu-open><span class="sr">${esc(ui.menu[lang])}</span>${I.menu}</button>
    </div>
  </div>
  <div class="mobile-menu" id="mobile-menu" hidden>
    <button class="menu-close" type="button" data-menu-close><span class="sr">${esc(ui.close[lang])}</span>${I.close}</button>
    <ul>${nav}</ul>
    <div class="mm-foot">
      <div class="lang">${langs}</div>
      <div class="socials">${socials(lang)}</div>
    </div>
  </div>
</header>`;
}

const socials = (lang) => `<a href="${site.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${I.fb}</a><a href="${site.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${I.ig}</a>`;

function footer({ lang, route }) {
  const c = site.credit;
  return `<footer class="site-footer">
  <div class="wrap foot-grid">
    <div class="foot-brand">
      <img src="${asset(route, 'brand/chorea-2027-sm.webp')}" alt="CHOREA 2027" width="709" height="499" loading="lazy">
      <p>${esc(t(site.hero.tagline, lang))}</p>
    </div>
    <div class="foot-col">
      <p class="foot-h">${esc(ui.organizer[lang])}</p>
      <p>${esc(site.contact.name)}<br><a href="mailto:${site.contact.email}">${esc(site.contact.email)}</a><br><a href="tel:${site.contact.phone.replace(/\s/g, '')}">${esc(site.contact.phone)}</a></p>
    </div>
    <div class="foot-col">
      <p class="foot-h">${esc(ui.follow[lang])}</p>
      <div class="socials">${socials(lang)}</div>
      <p class="foot-tickets">${I.ticket}<span>${esc(ui.tickets[lang])}: ${site.ticketOptions.map(o => `<a href="${o.url}" target="_blank" rel="noopener">${esc(o.name)}</a>`).join(' · ')}</span></p>
    </div>
    <div class="foot-col">
      <p class="foot-h">${esc(ui.ourSites[lang])}</p>
      <ul class="foot-links">${site.footerLinks.map(l => `<li><a href="${l.url}" target="_blank" rel="noopener">${esc(l.name)}${I.arrow}</a></li>`).join('')}</ul>
    </div>
  </div>
  <div class="wrap foot-bottom">
    <p>© ${site.year} CHOREA · ${esc(ui.rights[lang])}</p>
    <a class="credit" href="${c.url}" target="_blank" rel="noopener"><span>${esc(ui.credit[lang])}</span><img src="${asset(route, c.icon)}" alt="" width="24" height="17" loading="lazy"><b>${esc(c.name)}</b></a>
  </div>
</footer>
<a class="fab" href="${site.tickets}" target="_blank" rel="noopener" data-tickets aria-label="${esc(ui.tickets[lang])}">${I.ticket}<span>${esc(ui.tickets[lang])}</span></a>`;
}

function page({ lang, route, alt, title, desc, body, home = false, image }) {
  return `${head({ lang, route, title, desc, alt, image })}
<body class="${home ? 'page-home' : 'page-inner'}">
${header({ lang, route, alt, home })}
<main id="main">
${body}
</main>
${footer({ lang, route })}
<div class="tix" data-tix hidden role="dialog" aria-modal="true" aria-labelledby="tix-title">
  <div class="tix-panel">
    <button class="tix-close" type="button" data-tix-close aria-label="${esc(ui.close[lang])}">${I.close}</button>
    <p class="eyebrow">${esc(ui.tickets[lang])} · CHOREA</p>
    <h2 id="tix-title" class="tix-title">${esc(ui.tixTitle[lang])}</h2>
    <div class="tix-options">${site.ticketOptions.map(o => `<a class="tix-opt" href="${o.url}" target="_blank" rel="noopener"><span><b>${esc(o.name)}</b><small>${esc(t(o.note, lang))}</small></span>${I.arrow}</a>`).join('')}</div>
  </div>
</div>
<div class="lightbox" data-lightbox hidden role="dialog" aria-modal="true" aria-label="${esc(ui.gallery[lang])}">
  <button class="lb-close" type="button" data-lb-close aria-label="${esc(ui.close2[lang])}">${I.close}</button>
  <button class="lb-prev" type="button" data-lb-prev aria-label="${esc(ui.prev[lang])}">${I.arrowL}</button>
  <figure><img alt="" data-lb-img><figcaption data-lb-cap></figcaption></figure>
  <button class="lb-next" type="button" data-lb-next aria-label="${esc(ui.next[lang])}">${I.arrow}</button>
</div>
${PREVIEW ? '<script>window.CHOREA_PREVIEW=1</script>' : ''}<script src="${asset(route, 'app.js')}" defer></script>
</body>
</html>`;
}

// ---------- home ----------
function home(lang) {
  const route = P.home[lang];
  const A = s => asset(route, s);
  const a = site.about, f = site.features, l = site.lineup, v = site.venue, vd = site.videos, ar = site.archive, pt = site.partners;
  const last = years[0];

  const hero = `<section class="hero" aria-label="CHOREA 2027">
  <div class="hero-media">
    <video class="hero-video" muted loop playsinline preload="none" poster="${A('video/hero-wide.jpg')}" data-wide="${A('video/hero-wide')}" data-square="${A('video/hero-square')}" data-poster-square="${A('video/hero-square.jpg')}" aria-hidden="true"></video>
  </div>
  <div class="hero-veil" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>
  <div class="hero-inner">
    <p class="kicker reveal">${esc(t(site.hero.kicker, lang))}</p>
    <h1 class="hero-logo reveal"><img src="${A('brand/chorea-2027.webp')}" alt="CHOREA 2027 — International Dance Festival" width="1419" height="999" fetchpriority="high"></h1>
    <p class="hero-tagline reveal">${esc(t(site.hero.tagline, lang))}</p>
    <p class="hero-place reveal">${esc(t(site.hero.place, lang))}</p>
    <div class="hero-cta reveal">
      <a class="btn btn-yellow" href="${site.tickets}" target="_blank" rel="noopener" data-tickets>${I.ticket}<span>${esc(ui.tickets[lang])}</span></a>
      <a class="btn btn-ghost" href="#festival"><span>${esc(ui.discover[lang])}</span>${I.arrow}</a>
    </div>
    <p class="hero-date reveal"><span class="dot" aria-hidden="true"></span>${esc(t(site.hero.date, lang))}</p>
  </div>
  <a class="scroll-cue" href="#festival" aria-label="${esc(ui.scroll[lang])}"><span></span></a>
</section>`;

  const about = `<section class="about" id="festival">
  ${swoosh('swoosh-about')}
  <div class="wrap about-grid">
    <div class="about-head">
      <p class="eyebrow">${esc(t(a.eyebrow, lang))}</p>
      <h2 class="display-serif">${esc(t(a.title, lang))}</h2>
    </div>
    <div class="about-body">
      <p class="lead">${esc(t(a.lead, lang))}</p>
      ${t(a.body, lang).map(p => `<p>${esc(p)}</p>`).join('')}
    </div>
  </div>
  <div class="wrap">
    <ul class="stats">${a.stats.map(s => `<li><b>${esc(s.n)}</b><span>${esc(t(s.label, lang))}</span></li>`).join('')}</ul>
  </div>
  <div class="wrap trio" aria-hidden="true">${site.showcase.trio.map(p => `<figure><img src="${A(p.src)}" alt="" loading="lazy" decoding="async"></figure>`).join('')}</div>
</section>`;

  const features = `<section class="features" aria-labelledby="features-title">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">${esc(t(f.eyebrow, lang))}</p>
      <h2 id="features-title" class="display">${esc(t(f.title, lang))}</h2>
    </div>
    <ol class="feature-grid">${f.items.map((it, i) => `
      <li class="feature">
        <div class="feature-img"><img src="${A(it.photo)}" alt="" loading="lazy" decoding="async"></div>
        <div class="feature-txt"><span class="num">0${i + 1}</span><h3>${esc(t(it.title, lang))}</h3><p>${esc(t(it.text, lang))}</p></div>
      </li>`).join('')}
    </ol>
  </div>
</section>`;

  const sc = site.showcase.band;
  const showcase = `<section class="showcase" aria-label="${esc(t(site.showcase.eyebrow, lang))}">
  <figure class="sc-band">
    <img src="${A(sc.src)}" alt="${esc(t(sc.caption, lang))}" loading="lazy" decoding="async">
    <figcaption class="wrap">
      <p class="eyebrow">${esc(t(site.showcase.eyebrow, lang))}</p>
      <p class="sc-quote">${esc(t(sc.quote, lang))}</p>
      <span class="sc-cap">${esc(t(sc.caption, lang))} · ${esc(sc.credit)}</span>
    </figcaption>
  </figure>
</section>`;

  const mq = marquee;
  const wm = m => m.wordmark ? `<span class="wordmark" role="img" aria-label="${esc(m.name)}"><small>${esc(m.wordmark[0])}</small><b>${esc(m.wordmark[1])}</b><small>${esc(m.wordmark[2])}</small></span>` : `<span class="mq-word">${esc(m.name)}</span>`;
  const mItem = m => `<li class="mq-item">${m.logo ? `<img src="${A(m.logo)}" alt="${esc(m.name)}" width="${m.w}" height="${m.h}" loading="lazy" decoding="async">` : wm(m)}<span class="mq-city">${esc(t(m.city, lang))}<small>${esc(t(m.country, lang))}</small></span></li>`;
  const half = Math.ceil(mq.length / 2);
  const rowA = mq.slice(0, half), rowB = mq.slice(half);
  const mrow = (arr, dir) => `<div class="mq-row mq-${dir}"><ul class="mq-track">${arr.map(mItem).join('')}</ul><ul class="mq-track" aria-hidden="true">${arr.map(mItem).join('')}</ul></div>`;
  const lineup = `<section class="lineup" id="subory">
  <div class="lineup-band">
    <div class="wrap lineup-band-inner">
      <p class="eyebrow eyebrow-dark">${esc(t(l.eyebrow, lang))}</p>
      <h2 class="display display-xl">${esc(t(l.title, lang))}</h2>
      <div class="lineup-row">
        <p>${esc(t(l.text, lang))}</p>
        <div class="lineup-actions">
          <span class="badge">${esc(t(l.badge, lang))}</span>
          <div class="socials socials-dark">${socials(lang)}</div>
        </div>
      </div>
    </div>
    <svg class="band-edge" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 80V46C360 84 900 4 1440 40V80Z"/></svg>
  </div>
  <div class="marquee" aria-labelledby="mq-title">
    <h3 id="mq-title" class="mq-title"><span>${esc(t(l.marqueeTitle, lang))}</span></h3>
    ${mrow(rowA, 'left')}
    ${mrow(rowB, 'right')}
  </div>
</section>`;

  const venue = `<section class="venue" id="miesto">
  <div class="wrap">
    <div class="venue-head">
      <div><p class="eyebrow">${esc(t(v.eyebrow, lang))}</p><h2 class="display-serif">${esc(t(v.title, lang))}</h2></div>
      <div class="venue-info">
        <p class="muted">${esc(t(v.text, lang))}</p>
        <address>${I.pin}<span><b>${esc(v.name)}</b><br>${esc(v.address)}</span></address>
        <a class="btn btn-line" href="${v.map}" target="_blank" rel="noopener"><span>${esc(ui.openMap[lang])}</span>${I.arrow}</a>
      </div>
    </div>
    <figure class="venue-pano"><img src="${A(v.photo)}" alt="${esc(v.name)} — ${lang === 'sk' ? 'nábrežie Dunaja' : 'Danube riverbank'}" width="1919" height="691" loading="lazy" decoding="async"></figure>
    <div class="venue-grid">${v.photos.map((p, i) => `<figure class="vg vg-${i + 1}"><img src="${A(p.src)}" alt="${esc(t(p.alt, lang))}" loading="lazy" decoding="async"></figure>`).join('')}</div>
  </div>
</section>`;

  const vItem = (it, big) => `<li class="video${big ? ' video-big' : ''}">
    <a class="video-btn" href="https://www.youtube.com/watch?v=${it.id}" target="_blank" rel="noopener" data-yt="${it.id}" aria-label="${esc(ui.playVideo[lang])}: ${esc(t(it.title, lang))}">
      <img src="${A(it.poster)}" alt="" loading="lazy" decoding="async">
      <span class="video-play">${I.play}</span>
      <span class="video-cap"><b>${it.year}</b>${esc(t(it.title, lang))}</span>
    </a></li>`;
  const videos = `<section class="videos" id="videa">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">${esc(t(vd.eyebrow, lang))}</p>
      <h2 class="display">${esc(t(vd.title, lang))}</h2>
    </div>
    <ul class="video-grid">${vd.items.map((it, i) => vItem(it, i === 0)).join('')}</ul>
    <p class="fine">${esc(ui.videoNote[lang])}</p>
  </div>
</section>`;

  const archiveTeaser = `<section class="archive-teaser" id="archiv">
  <div class="wrap">
    <div class="section-head section-head-row">
      <div><p class="eyebrow">${esc(t(ar.eyebrow, lang))}</p><h2 class="display">${esc(t(ar.title, lang))}</h2><p class="muted max60">${esc(t(ar.text, lang))}</p></div>
      <a class="btn btn-line" href="${link(route, P.archive[lang])}"><span>${esc(ui.allEditions[lang])}</span>${I.arrow}</a>
    </div>
  </div>
  <div class="year-rail" data-rail>
    <ul>${years.map(y => yearCard(y, lang, route)).join('')}</ul>
  </div>
</section>`;

  const partners = partnersBlock(lang, route);
  const contact = `<section class="contact" id="kontakt">
  ${swoosh('swoosh-contact')}
  <div class="wrap contact-grid">
    <div>
      <p class="eyebrow">${esc(ui.organizer[lang])}</p>
      <h2 class="display">${esc(ui.contactTitle[lang])}</h2>
      <p class="muted">${esc(ui.contactLead[lang])}</p>
      <div class="person">
        <p class="person-name">${esc(site.contact.name)}</p>
        <p class="person-role">${esc(t(site.contact.role, lang))}</p>
        <a class="big-link" href="mailto:${site.contact.email}">${I.mail}<span>${esc(site.contact.email)}</span></a>
        <a class="big-link" href="tel:${site.contact.phone.replace(/\s/g, '')}">${I.phone}<span>${esc(site.contact.phone)}</span></a>
      </div>
      <div class="socials socials-lg">${socials(lang)}</div>
    </div>
    <aside class="ticket-card">
      <img class="ticket-logo" src="${A('brand/chorea-2027-sm.webp')}" alt="" loading="lazy">
      <h3>${esc(ui.ticketsCardTitle[lang])}</h3>
      <p>${esc(ui.ticketsCardText[lang])}</p>
      <a class="btn btn-yellow" href="${site.tickets}" target="_blank" rel="noopener" data-tickets>${I.ticket}<span>${esc(ui.ticketsLong[lang])}</span></a>
    </aside>
  </div>
</section>`;

  const alt = Object.fromEntries(LANGS.map(x => [x, P.home[x]]));
  return page({ lang, route, alt, home: true, title: t(site.meta.title, lang), desc: t(site.meta.description, lang), body: hero + about + features + showcase + lineup + venue + videos + archiveTeaser + partners + contact });
}

function yearCard(y, lang, route) {
  const meta = site.archive.years[y.year] || {};
  const n = y.ensembles.length;
  return `<li><a class="year-card" href="${link(route, P.year(y.year)[lang])}">
    <span class="yc-img">${meta.cover ? `<img src="${asset(route, meta.cover)}" alt="" loading="lazy" decoding="async">` : `<span class="no-cover" aria-hidden="true"></span>`}</span>
    <span class="yc-year">${y.year}</span>
    <span class="yc-meta"><b>${esc(editionLabel(y.edition, lang))}</b>${meta.date ? `<span>${esc(t(meta.date, lang))}</span>` : ''}<span>${n} ${esc(plural(n, ui.companiesN[lang]))}</span></span>
    <span class="yc-go">${I.arrow}</span>
  </a></li>`;
}

function partnersBlock(lang, route) {
  const pt = site.partners;
  return `<section class="partners" id="partneri">
  <div class="wrap">
    <div class="section-head center">
      <p class="eyebrow eyebrow-dark">${esc(t(pt.eyebrow, lang))}</p>
      <h2 class="display">${esc(t(pt.title, lang))}</h2>
    </div>
    ${pt.groups.map(g => `<div class="pgroup pgroup-${g.size}">
      <h3>${esc(t(g.title, lang))}</h3>
      <ul>${g.items.map(p => `<li><a href="${p.url}" target="_blank" rel="noopener" title="${esc(p.name)}"><img src="${asset(route, p.logo)}" alt="${esc(p.name)}" loading="lazy" decoding="async"></a></li>`).join('')}</ul>
    </div>`).join('')}
  </div>
</section>`;
}

// ---------- archive index ----------
function archiveIndex(lang) {
  const route = P.archive[lang];
  const ar = site.archive;
  const rows = years.map(y => {
    const meta = ar.years[y.year] || {};
    const names = y.ensembles.map(e => esc(titleCase(t(e.name, lang)).replace(/\s*[–:].*$/, ''))).join(' · ');
    return `<li><a class="arch-row" href="${link(route, P.year(y.year)[lang])}">
      <span class="ar-year">${y.year}</span>
      <span class="ar-body"><span class="ar-meta"><b>${esc(editionLabel(y.edition, lang))}</b>${meta.date ? ` · ${esc(t(meta.date, lang))}` : ''} · ${y.ensembles.length} ${esc(plural(y.ensembles.length, ui.companiesN[lang]))}</span><span class="ar-names">${names}</span></span>
      <span class="ar-img">${meta.cover ? `<img src="${asset(route, meta.cover)}" alt="" loading="lazy" decoding="async">` : `<span class="no-cover" aria-hidden="true"></span>`}</span>
      <span class="ar-go">${I.arrow}</span>
    </a></li>`;
  }).join('');
  const body = `<section class="page-hero">
  ${swoosh('swoosh-hero')}
  <div class="wrap">
    <p class="eyebrow">CHOREA 2017 — ${years[0].year}</p>
    <h1 class="display display-xl">${esc(ui.archiveTitle[lang])}</h1>
    <p class="lead max60">${esc(ui.archiveIntro[lang])}</p>
  </div>
</section>
<section class="archive-list"><div class="wrap"><ul>${rows}</ul></div></section>
${ctaStrip(lang, route)}`;
  const alt = Object.fromEntries(LANGS.map(x => [x, P.archive[x]]));
  return page({ lang, route, alt, title: `${ui.archiveTitle[lang]} — CHOREA`, desc: ui.archiveIntro[lang], body });
}

function ctaStrip(lang, route) {
  return `<section class="cta-strip"><div class="wrap cta-inner">
  <img src="${asset(route, 'brand/chorea-2027-sm.webp')}" alt="CHOREA 2027" loading="lazy">
  <div><p class="eyebrow">${esc(t(site.hero.kicker, lang))}</p><p class="cta-title">${esc(t(site.lineup.title, lang))}</p><p class="muted">${esc(t(site.hero.date, lang))}</p></div>
  <a class="btn btn-yellow" href="${site.tickets}" target="_blank" rel="noopener" data-tickets>${I.ticket}<span>${esc(ui.tickets[lang])}</span></a>
</div></section>`;
}

// ---------- year page ----------
function yearPage(y, lang) {
  const route = P.year(y.year)[lang];
  const meta = site.archive.years[y.year] || {};
  const idx = years.findIndex(x => x.year === y.year);
  const newer = years[idx - 1], older = years[idx + 1];
  const n = y.ensembles.length;
  const nLabel = `${n} ${plural(n, ui.companiesN[lang])}`;
  const chips = y.ensembles.map(e => `<li><a href="#${e.id}">${esc(titleCase(t(e.name, lang)).replace(/\s*[–:].*$/, ''))}</a></li>`).join('');
  const ens = y.ensembles.map((e, i) => {
    const text = e.text[lang] || e.text.en || e.text.sk || '';
    const m = marquee.find(x => x.id === e.id);
    const gal = e.gallery.length ? `<div class="gallery" data-gallery>
        <p class="gal-h">${esc(ui.gallery[lang])} <span>${e.gallery.length} ${esc(plural(e.gallery.length, ui.photosN[lang]))}</span></p>
        <ul>${e.gallery.map((g, gi) => `<li><a href="${asset(route, g.src)}" data-w="${g.w}" data-h="${g.h}" aria-label="${esc(ui.gallery[lang])} ${gi + 1}"><img src="${asset(route, g.src)}" alt="${esc(titleCase(t(e.name, lang)))} — ${gi + 1}" width="${g.w}" height="${g.h}" loading="lazy" decoding="async"></a></li>`).join('')}</ul>
      </div>` : '';
    return `<article class="ensemble" id="${e.id}">
    <div class="ens-side">
      ${e.logo ? `<div class="ens-logo"><img src="${asset(route, e.logo)}" alt="${esc(t(e.name, lang))}" loading="lazy" decoding="async"></div>` : ''}
      <span class="ens-num">${String(i + 1).padStart(2, '0')}</span>
    </div>
    <div class="ens-main">
      <h2 class="ens-name">${esc(titleCase(t(e.name, lang)))}</h2>
      ${m ? `<p class="ens-city">${I.pin}${esc(t(m.city, lang))} · ${esc(t(m.country, lang))}</p>` : ''}
      <div class="ens-text" data-clamp>${text}</div>
      <button class="more-btn" type="button" data-more hidden data-more-label="${esc(ui.readMore[lang])}" data-less-label="${esc(ui.readLess[lang])}">${esc(ui.readMore[lang])}</button>
      ${gal}
    </div>
  </article>`;
  }).join('');
  const nav = `<nav class="year-nav wrap" aria-label="${esc(ui.archiveTitle[lang])}">
    ${older ? `<a class="yn yn-prev" href="${link(route, P.year(older.year)[lang])}">${I.arrowL}<span><small>${esc(ui.prevYear[lang])}</small><b>${older.year}</b></span></a>` : '<span></span>'}
    <a class="yn yn-all" href="${link(route, P.archive[lang])}">${esc(ui.allEditions[lang])}</a>
    ${newer ? `<a class="yn yn-next" href="${link(route, P.year(newer.year)[lang])}"><span><small>${esc(ui.nextYear[lang])}</small><b>${newer.year}</b></span>${I.arrow}</a>` : '<span></span>'}
  </nav>`;
  const body = `<section class="year-hero">
  <div class="yh-media">${meta.cover ? `<img src="${asset(route, meta.cover)}" alt="" fetchpriority="high">` : `<span class="no-cover" aria-hidden="true"></span>${swoosh('swoosh-yh')}`}</div>
  <div class="yh-veil" aria-hidden="true"></div>
  <div class="wrap yh-inner">
    <p class="crumbs"><a href="${link(route, P.archive[lang])}">${esc(ui.nav.archive[lang])}</a> / <span>${y.year}</span></p>
    <h1><span class="yh-chorea">CHOREA</span><span class="yh-year">${y.year}</span></h1>
    <p class="yh-meta"><b>${esc(editionLabel(y.edition, lang))}</b>${meta.date ? `<span>${esc(t(meta.date, lang))}</span>` : ''}</p>
    <p class="lead">${esc(ui.yearIntro[lang].replace('{n}', nLabel.charAt(0).toUpperCase() + nLabel.slice(1)))}</p>
  </div>
</section>
<div class="chips-wrap"><div class="wrap"><p class="chips-h">${esc(ui.onStage[lang])}</p><ul class="chips">${chips}</ul></div></div>
<section class="ensembles"><div class="wrap">${ens}</div></section>
${nav}
${ctaStrip(lang, route)}`;
  const alt = Object.fromEntries(LANGS.map(x => [x, P.year(y.year)[x]]));
  const desc = `CHOREA ${y.year} — ${editionLabel(y.edition, lang)}. ${y.ensembles.map(e => titleCase(t(e.name, lang)).replace(/\s*[–:].*$/, '')).join(', ')}.`;
  return page({ lang, route, alt, title: `CHOREA ${y.year} — ${ui.nav.archive[lang]}`, desc, body });
}

function notFound() {
  const lang = 'sk', route = '';
  const body = `<section class="page-hero nf"><div class="wrap"><p class="eyebrow">404</p><h1 class="display display-xl">${ui.notFoundTitle.sk}</h1><p class="lead">${ui.notFoundText.sk}</p><p class="lead muted" lang="en">${ui.notFoundTitle.en} — ${ui.notFoundText.en}</p><a class="btn btn-yellow" href="/">${ui.backHome.sk}</a></div></section>`;
  return page({ lang, route, alt: { sk: '', en: 'en/' }, title: '404 — CHOREA', desc: ui.notFoundText.sk, body }).replace(/(href|src)="\.\//g, '$1="/');
}

// ---------- write ----------
fs.rmSync(DIST, { recursive: true, force: true });
const out = (route, html) => { const f = path.join(DIST, route, 'index.html'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const urls = [];
for (const lang of LANGS) {
  out(P.home[lang], home(lang)); urls.push(P.home[lang]);
  out(P.archive[lang], archiveIndex(lang)); urls.push(P.archive[lang]);
  for (const y of years) { out(P.year(y.year)[lang], yearPage(y, lang)); urls.push(P.year(y.year)[lang]); }
}
fs.writeFileSync(path.join(DIST, '404.html'), notFound());
fs.cpSync(path.join(ROOT, 'static'), path.join(DIST, 'static'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src/styles.css'), path.join(DIST, 'static/styles.css'));
fs.copyFileSync(path.join(ROOT, 'src/app.js'), path.join(DIST, 'static/app.js'));
fs.copyFileSync(path.join(ROOT, 'static/brand/favicon-48.png'), path.join(DIST, 'favicon.ico'));
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${site.url}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, '_headers'), `/static/*\n  Cache-Control: public, max-age=604800\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);
fs.writeFileSync(path.join(DIST, '_redirects'), `/sk/* /:splat 301\n/archive/* /archiv/:splat 301\n`);
console.log(`Built ${urls.length} pages${PREVIEW ? ' (preview links)' : ''} → dist/`);
