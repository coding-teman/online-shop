/* =====================================================================
   MAIN — interaksi khusus halaman Tokora
   (preloader, intro hero, turbin, nav, kartu fitur, harga, FAQ, modal,
    tema, suara ambient, form, cursor). Engine generik ada di animations.js.
   ===================================================================== */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const hasGsap = typeof gsap !== 'undefined';
  const reduced = window.Anim ? Anim.reduced : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = hasGsap && !reduced;

  /* 1. Engine animasi berbasis atribut */
  if (window.Anim) Anim.init();

  /* ---------- 2. TURBIN: bilah berputar (GSAP, agar bisa dipercepat saat scroll) ---------- */
  const spins = [];
  if (animate) {
    $$('[data-turbine]').forEach((blades) => {
      const dur = parseFloat(blades.getAttribute('data-turbine')) || 7;
      const t = gsap.to(blades, { rotation: '+=360', duration: dur, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
      t.timeScale(0);
      spins.push(t);
    });
    // percepat saat scroll cepat
    ScrollTrigger.create({
      onUpdate: (self) => {
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 1200, 3);
        spins.forEach((t) => gsap.to(t, { timeScale: boost, duration: 0.3, overwrite: true, onComplete: () => gsap.to(t, { timeScale: 1, duration: 1.2 }) }));
      },
    });
  }

  /* ---------- 3. HERO: intro timeline + scroll scrub ---------- */
  function heroIntro() {
    const introEls = $$('[data-intro]');
    if (!animate) { introEls.forEach((el) => { el.style.opacity = 1; }); return; }
    const layers = $$('[data-hero-layer]');
    const title = $('[data-intro="title"]');
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.from(layers, { yPercent: 14, opacity: 0, duration: 1.5, stagger: { each: 0.08, from: 'end' } }, 0);
    if (title) {
      const units = Anim.split(title, 'words');
      gsap.set(title, { opacity: 1 });
      tl.fromTo(units, { yPercent: 110, opacity: 0, rotation: 2 }, { yPercent: 0, opacity: 1, rotation: 0, duration: 1.1, stagger: 0.07 }, 0.55);
    }
    tl.fromTo('[data-intro="nav"]', { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.06 }, 0.7);
    tl.fromTo('[data-intro="lead"]', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 1.15);
    tl.fromTo('[data-intro="cta"]', { scale: 0.82, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'back.out(1.7)', clearProps: 'scale' }, 1.35);
    tl.fromTo('[data-intro="scroll"]', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 1.9);
    // turbin mulai berputar perlahan
    spins.forEach((t, i) => tl.to(t, { timeScale: 1, duration: 2.4, ease: 'power2.in' }, 0.4 + i * 0.12));

    // scrub: lapisan bergerak dengan kecepatan berbeda, konten memudar
    const hero = $('[data-hero]');
    const st = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    layers.forEach((l) => st.to(l, { y: () => (parseFloat(l.getAttribute('data-hero-layer')) || 0) * hero.offsetHeight * 0.6, ease: 'none' }, 0));
    st.to('[data-hero-content]', { y: -120, opacity: 0, ease: 'none' }, 0);
    st.to('.hero__scroll', { opacity: 0, ease: 'none' }, 0);
    st.to('.hero__sun', { y: 160, ease: 'none' }, 0);
  }

  /* ---------- 4. PRELOADER ---------- */
  function preloader(done) {
    const pre = $('#preloader');
    if (!pre) return done();
    if (!animate) { pre.remove(); document.documentElement.classList.add('is-loaded'); return done(); }
    document.body.classList.add('is-locked');
    const strokes = $$('[data-preloader-mark] circle, [data-preloader-mark] path');
    strokes.forEach((p) => { const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });
    const letters = $$('[data-preloader-word] span');
    let started = false;
    const start = () => { if (started) return; started = true; document.body.classList.remove('is-locked'); done(); };
    gsap.timeline({ onComplete: () => { pre.remove(); document.documentElement.classList.add('is-loaded'); start(); } })
      .to(strokes, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.18 }, 0)
      .from(letters, { yPercent: 110, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'expo.out' }, 0.5)
      .to('[data-preloader-bar]', { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0)
      .to(pre, { yPercent: -100, duration: 0.9, ease: 'expo.inOut', onStart: start }, '+=0.15');
  }
  preloader(heroIntro);

  /* ---------- 5. NAV: compact saat scroll, sembunyi saat scroll turun cepat, menu mobile ---------- */
  (function nav() {
    const nav = $('[data-nav]'); if (!nav) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > 400 && y > last + 4 && !$('[data-nav-links]').classList.contains('is-open'));
      last = y;
      $('[data-to-top]')?.classList.toggle('is-visible', y > 700);
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    const toggle = $('[data-nav-toggle]'); const links = $('[data-nav-links]');
    if (toggle && links) {
      const setOpen = (open) => { toggle.setAttribute('aria-expanded', String(open)); links.classList.toggle('is-open', open); document.body.classList.toggle('is-locked', open); if (open) nav.classList.add('is-scrolled'); };
      toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
      $$('a', links).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    }
    $('[data-to-top]')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  })();

  /* ---------- 6. FEATURE CARDS: klik / panah / autoplay ---------- */
  (function features() {
    const cards = $$('[data-feature]'); if (!cards.length) return;
    let idx = cards.findIndex((c) => c.classList.contains('is-active')); if (idx < 0) idx = 0;
    const activate = (i) => {
      idx = (i + cards.length) % cards.length;
      cards.forEach((c, k) => { c.classList.toggle('is-active', k === idx); c.setAttribute('aria-pressed', String(k === idx)); });
      if (animate) gsap.fromTo(cards[idx].querySelector('.icon-circle svg'), { rotation: -20, scale: 0.7 }, { rotation: 0, scale: 1, duration: 0.7, ease: 'back.out(2)' });
    };
    cards.forEach((c, i) => {
      c.addEventListener('click', () => activate(i));
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(i); } });
    });
    $('[data-feature-prev]')?.addEventListener('click', () => activate(idx - 1));
    $('[data-feature-next]')?.addEventListener('click', () => activate(idx + 1));

    // autoplay hanya saat terlihat & tidak di-hover
    const grid = cards[0].parentElement; let hover = false, timer = null;
    grid.addEventListener('mouseenter', () => { hover = true; }); grid.addEventListener('mouseleave', () => { hover = false; });
    const play = () => { stop(); timer = setInterval(() => { if (!hover && !document.hidden) activate(idx + 1); }, 5000); };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };
    if (hasGsap && !reduced) ScrollTrigger.create({ trigger: grid, start: 'top 90%', end: 'bottom 10%', onEnter: play, onEnterBack: play, onLeave: stop, onLeaveBack: stop });
  })();

  /* ---------- 7. BILLING TOGGLE + animasi harga ---------- */
  (function billing() {
    const wrap = $('[data-billing]'); if (!wrap) return;
    const btns = $$('[data-billing-btn]', wrap); const thumb = $('[data-billing-thumb]', wrap);
    const prices = $$('[data-price]');
    const rupiah = (v) => 'Rp ' + Math.round(v).toLocaleString('id-ID');
    const moveThumb = () => { const a = $('.is-active', wrap); if (!a || !thumb) return; thumb.style.width = a.offsetWidth + 'px'; thumb.style.transform = `translateX(${a.offsetLeft - 6}px)`; };
    const setMode = (mode) => {
      btns.forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-billing-btn') === mode));
      moveThumb();
      prices.forEach((p) => {
        const target = parseFloat(p.getAttribute('data-' + mode)) || 0;
        const current = parseFloat(p.textContent.replace(/[^\d]/g, '')) || 0;
        if (!animate) { p.textContent = rupiah(target); return; }
        const o = { v: current };
        gsap.to(o, { v: target, duration: 0.7, ease: 'power3.out', onUpdate: () => { p.textContent = rupiah(o.v); } });
        gsap.fromTo(p, { y: -6, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
      });
    };
    btns.forEach((b) => b.addEventListener('click', () => setMode(b.getAttribute('data-billing-btn'))));
    window.addEventListener('resize', moveThumb); window.addEventListener('load', moveThumb); moveThumb();
  })();

  /* ---------- 8. ACCORDION ---------- */
  (function accordion() {
    const acc = $('[data-accordion]'); if (!acc) return;
    const items = $$('.acc__item', acc);
    const setOpen = (item, open) => {
      const panel = $('.acc__panel', item); const btn = $('.acc__btn', item);
      item.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open));
      if (animate) gsap.to(panel, { height: open ? 'auto' : 0, duration: 0.55, ease: 'expo.out', onComplete: () => Anim.refresh() });
      else panel.style.height = open ? 'auto' : '0px';
    };
    items.forEach((item) => {
      const panel = $('.acc__panel', item);
      if (item.classList.contains('is-open')) panel.style.height = 'auto';
      $('.acc__btn', item).addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        items.forEach((o) => { if (o !== item && o.classList.contains('is-open')) setOpen(o, false); });
        setOpen(item, open);
      });
    });
  })();

  /* ---------- 9. VIDEO MODAL ---------- */
  (function modal() {
    const modal = $('[data-modal]'); if (!modal) return;
    const body = $('[data-modal-body]', modal); const dialog = $('.modal__dialog', modal);
    let iframe = null; let opener = null;
    const open = (url) => {
      opener = document.activeElement;
      if (url) { iframe = document.createElement('iframe'); iframe.src = url; iframe.allow = 'autoplay; fullscreen; picture-in-picture'; iframe.setAttribute('allowfullscreen', ''); body.hidden = true; dialog.appendChild(iframe); }
      modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('is-locked');
      $('.modal__close', modal).focus();
    };
    const close = () => {
      modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('is-locked');
      if (iframe) { iframe.remove(); iframe = null; body.hidden = false; }
      opener?.focus();
    };
    $$('[data-video]').forEach((b) => b.addEventListener('click', () => open(b.getAttribute('data-video'))));
    $$('[data-modal-close]', modal).forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });
  })();

  /* ---------- 10. THEME TOGGLE (dark ↔ light) ---------- */
  (function theme() {
    const btn = $('[data-theme-toggle]'); if (!btn) return;
    const html = document.documentElement;
    const apply = (t) => { html.setAttribute('data-theme', t); btn.setAttribute('aria-pressed', String(t === 'light')); try { localStorage.setItem('tokora-theme', t); } catch (e) {} };
    btn.setAttribute('aria-pressed', String(html.getAttribute('data-theme') === 'light'));
    btn.addEventListener('click', () => {
      apply(html.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
      if (animate) gsap.fromTo(btn, { rotation: -180, scale: 0.7 }, { rotation: 0, scale: 1, duration: 0.7, ease: 'back.out(2)' });
    });
  })();

  /* ---------- 11. AMBIENT SOUND (WebAudio, tanpa file audio: "angin" dari brown noise) ---------- */
  (function sound() {
    const btn = $('[data-sound-toggle]'); if (!btn || !(window.AudioContext || window.webkitAudioContext)) return;
    let ctx, gain, playing = false;
    const build = () => {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const size = ctx.sampleRate * 3, buffer = ctx.createBuffer(1, size, ctx.sampleRate), d = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < size; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      const src = ctx.createBufferSource(); src.buffer = buffer; src.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = 0.8;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12; const lfoGain = ctx.createGain(); lfoGain.gain.value = 260;
      lfo.connect(lfoGain).connect(filter.frequency);
      gain = ctx.createGain(); gain.gain.value = 0;
      src.connect(filter).connect(gain).connect(ctx.destination); src.start(); lfo.start();
    };
    btn.addEventListener('click', async () => {
      if (!ctx) build();
      if (ctx.state === 'suspended') await ctx.resume();
      playing = !playing;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.linearRampToValueAtTime(playing ? 0.32 : 0, ctx.currentTime + 1.2);
      btn.setAttribute('aria-pressed', String(playing)); btn.classList.toggle('is-playing', playing);
    });
  })();

  /* ---------- 12. FORM (demo: tanpa backend) ---------- */
  (function form() {
    const form = $('[data-form]'); if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const required = $$('[required]', form); let ok = true;
      required.forEach((f) => { const valid = f.checkValidity(); f.style.borderColor = valid ? '' : 'var(--c-orange-400)'; if (!valid) { ok = false; if (animate) gsap.fromTo(f, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, .3)' }); } });
      if (!ok) return;
      const btn = $('button[type="submit"]', form); const label = $('[data-form-label]', form);
      btn.disabled = true; label.textContent = 'Mengirim…';
      setTimeout(() => {
        form.classList.add('is-sent'); label.textContent = 'Terkirim!'; form.reset();
        if (animate) gsap.fromTo('.form__success', { x: -12, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
        setTimeout(() => { btn.disabled = false; label.textContent = 'Kirim pesan'; form.classList.remove('is-sent'); }, 4000);
      }, 900);
    });
  })();

  /* ---------- 13. CURSOR GLOW (hanya pointer presisi) ---------- */
  (function cursor() {
    const c = $('[data-cursor]');
    if (!c || !animate || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.body.classList.add('has-cursor');
    const x = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3.out' }), y = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('mousemove', (e) => { x(e.clientX); y(e.clientY); });
    document.addEventListener('mouseover', (e) => c.classList.toggle('is-hover', !!e.target.closest('a, button, [data-feature], .acc__btn')));
  })();
})();
