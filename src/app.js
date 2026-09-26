/* CHOREA 2027 — shared script */
(() => {
  /* ---- always open a new page at the top (unless a #section is targeted) ---- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const toTop = () => { if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); };
  toTop();
  addEventListener('DOMContentLoaded', toTop, { once: true });
  addEventListener('pageshow', e => { if (e.persisted) toTop(); });

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- hero video: pick crop by viewport shape, load after first paint ---- */
  const v = $('.hero-video');
  if (v) {
    const saveData = navigator.connection && navigator.connection.saveData;
    const square = matchMedia('(max-aspect-ratio: 1/1)').matches;
    if (square) v.poster = v.dataset.posterSquare;
    if (!reduce && !saveData) {
      const start = () => {
        const ext = v.canPlayType('video/webm; codecs="vp9"') ? '.webm' : '.mp4';
        v.src = (square ? v.dataset.square : v.dataset.wide) + ext;
        v.addEventListener('canplay', () => { v.classList.add('is-ready'); v.play().catch(() => {}); }, { once: true });
        v.load();
      };
      if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
    } else {
      v.classList.add('is-ready');
    }
    // pause when off-screen to save battery
    new IntersectionObserver(([e]) => { if (!v.src) return; e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }).observe(v);
  }

  /* ---- header: solid after hero, hide on scroll down ---- */
  const header = $('[data-header]');
  const fab = $('.fab');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    const threshold = header.classList.contains('is-home') ? innerHeight * 0.55 : 10;
    header.classList.toggle('is-solid', y > threshold);
    header.classList.toggle('is-hidden', y > 400 && y > lastY + 4 && !document.body.classList.contains('menu-open'));
    if (y < lastY - 4) header.classList.remove('is-hidden');
    if (fab) {
      const nearEnd = y + innerHeight > document.documentElement.scrollHeight - 260;
      const inHero = header.classList.contains('is-home') && y < innerHeight * 0.6;
      fab.classList.toggle('is-off', nearEnd || inHero);
    }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu ---- */
  const menu = $('#mobile-menu');
  const openBtn = $('[data-menu-open]');
  const setMenu = (open) => {
    menu.hidden = !open;
    openBtn.setAttribute('aria-expanded', open);
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('a', menu).focus(); else openBtn.focus({ preventScroll: true });
  };
  openBtn?.addEventListener('click', () => setMenu(true));
  $('[data-menu-close]')?.addEventListener('click', () => setMenu(false));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---- reveal on scroll ---- */
  const targets = $$('.section-head, .about-body, .stats li, .feature, .last-grid li, .venue-card, .video, .pgroup, .person, .ticket-card, .arch-row, .ensemble');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el, i) => { el.setAttribute('data-inview', ''); el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });
  }

  /* ---- venue parallax ---- */
  const vimg = $('.venue-media img');
  if (vimg && !reduce) {
    const sec = $('.venue');
    const par = () => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      vimg.style.transform = `scale(1.12) translateY(${p * -40}px)`;
    };
    addEventListener('scroll', par, { passive: true }); par();
  }

  /* ---- YouTube click-to-load ---- */
  if (!window.CHOREA_PREVIEW) $$('[data-yt]').forEach(btn => btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0&modestbranding=1`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.title = btn.getAttribute('aria-label');
    btn.replaceWith(f);
  }));

  /* ---- year rail drag-to-scroll ---- */
  const rail = $('[data-rail]');
  if (rail) {
    let down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.style.scrollSnapType = 'none'; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; rail.style.scrollSnapType = ''; });
    rail.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
  }

  /* ---- read more ---- */
  $$('[data-clamp]').forEach(el => {
    const btn = el.nextElementSibling;
    el.classList.add('is-clamped');
    requestAnimationFrame(() => {
      if (el.scrollHeight <= el.clientHeight + 40) { el.classList.remove('is-clamped'); return; }
      btn.hidden = false;
      btn.addEventListener('click', () => {
        const open = el.classList.toggle('is-clamped') === false;
        btn.textContent = open ? btn.dataset.lessLabel : btn.dataset.moreLabel;
        if (!open) el.closest('.ensemble').scrollIntoView({ block: 'start' });
      });
    });
  });

  /* ---- active chip ---- */
  const chips = $$('.chips a');
  if (chips.length) {
    const map = new Map(chips.map(a => [a.getAttribute('href').slice(1), a]));
    const io2 = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      chips.forEach(c => c.classList.remove('is-active'));
      const a = map.get(e.target.id); a?.classList.add('is-active');
      a?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }), { rootMargin: '-40% 0px -55% 0px' });
    $$('.ensemble').forEach(s => io2.observe(s));
  }

  /* ---- ticket chooser (Ticketportal / Predpredaj) ---- */
  const tix = $('[data-tix]');
  if (tix) {
    let from = null;
    const openT = (a) => { from = a; tix.hidden = false; document.body.style.overflow = 'hidden'; $('.tix-opt', tix).focus(); };
    const closeT = () => { tix.hidden = true; document.body.style.overflow = ''; from?.focus({ preventScroll: true }); };
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-tickets]');
      if (!a) return;
      e.preventDefault();
      if (!menu.hidden) setMenu(false);
      openT(a);
    });
    $('[data-tix-close]', tix).addEventListener('click', closeT);
    tix.addEventListener('click', e => { if (e.target === tix) closeT(); });
    $$('.tix-opt', tix).forEach(o => o.addEventListener('click', () => setTimeout(closeT, 150)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && !tix.hidden) closeT(); });
  }

  /* ---- lightbox ---- */
  const lb = $('[data-lightbox]');
  if (lb) {
    const img = $('[data-lb-img]', lb), cap = $('[data-lb-cap]', lb);
    let list = [], i = 0, lastFocus = null;
    const show = n => { i = (n + list.length) % list.length; const a = list[i]; img.src = a.href; img.alt = a.querySelector('img').alt; cap.textContent = `${i + 1} / ${list.length}`; };
    const open = (a) => { list = $$('a', a.closest('[data-gallery]')); lastFocus = a; show(list.indexOf(a)); lb.hidden = false; document.body.style.overflow = 'hidden'; $('[data-lb-close]', lb).focus(); };
    const close = () => { lb.hidden = true; img.removeAttribute('src'); document.body.style.overflow = ''; lastFocus?.focus(); };
    $$('[data-gallery] a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); open(a); }));
    $('[data-lb-close]', lb).addEventListener('click', close);
    $('[data-lb-prev]', lb).addEventListener('click', () => show(i - 1));
    $('[data-lb-next]', lb).addEventListener('click', () => show(i + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
    let tx = 0;
    lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); });
  }
})();
