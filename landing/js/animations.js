/* =====================================================================
   ANIM — engine animasi scroll berbasis atribut data-* (reusable)
   ---------------------------------------------------------------------
   Dependensi: GSAP 3 + ScrollTrigger (dimuat via CDN sebelum file ini).
   Tidak ada yang spesifik brand di file ini → salin apa adanya ke project lain.

   CARA PAKAI (cukup tambahkan atribut HTML, tanpa menulis JS):

   <div data-anim="fade-up">                         reveal saat masuk viewport
   <div data-anim="fade-up" data-anim-delay="0.2" data-anim-duration="1">
   <div data-anim="fade-up" data-anim-once="false">  ulang setiap masuk viewport
   <div data-anim="fade-up" data-anim-start="top 70%"> custom titik trigger
   <div data-anim="fade-up" data-anim-scrub>         progres mengikuti scroll (scrub)
   <ul  data-stagger="0.1">  <li>…</li>  </ul>        anak muncul bergantian
   <ul  data-stagger="0.1" data-anim="zoom-in" data-stagger-from="center">
   <h2  data-split="words|chars|lines">Judul</h2>    teks muncul per unit
   <img data-parallax="0.3">                          bergerak lebih lambat/cepat dari scroll
   <div data-mouse-parallax> <i data-depth="0.04"> </div>  ikut gerakan kursor
   <span data-counter="1200" data-counter-suffix="+">0</span>
   <div class="marquee" data-marquee data-marquee-speed="40"><div class="marquee__track">…</div></div>
   <a   data-magnetic>                                tombol "menempel" ke kursor
   <div data-tilt="8">                                efek 3D tilt saat hover
   <svg data-draw>                                    stroke path digambar saat scroll
   <div class="reveal-mask"><img></div>               gambar dibuka dengan tirai warna
   <div data-progress>                                scaleX 0→1 sesuai progres scroll halaman
   <div data-scroll-class="is-inview">                toggle class saat masuk viewport
   <section data-nav-section="about">                 untuk highlight link nav aktif

   Preset: fade, fade-up, fade-down, fade-left, fade-right, slide-up,
           zoom-in, zoom-out, pop, flip-up, flip-left, rotate-in,
           blur-in, clip-up, clip-left, clip-right, skew-up, grow-up, grow-x

   API JS:
   Anim.init(scope?)      jalankan semua modul (default: document)
   Anim.preview(el)       mainkan ulang reveal sebuah elemen sekarang (untuk demo/style guide)
   Anim.refresh()         hitung ulang posisi ScrollTrigger (setelah konten berubah)
   Anim.presets           objek preset (bisa ditambah sendiri sebelum init)
   ===================================================================== */

(function (global) {
  'use strict';

  const css = getComputedStyle(document.documentElement);
  const token = (name, fallback) => (css.getPropertyValue(name).trim() || fallback);

  const DEFAULTS = {
    distance: parseFloat(token('--anim-distance', '44')) || 44,
    duration: parseFloat(token('--dur-base', '0.7')) || 0.7,
    stagger: parseFloat(token('--anim-stagger', '0.1')) || 0.1,
    ease: 'expo.out',
    start: 'top 85%',
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]noanim/.test(location.search); // ?noanim = mode statis untuk debug layout
  const noHover = window.matchMedia('(hover: none)').matches;

  /* ---------- PRESET: state awal (from) → state akhir (to) ----------
     'D' pada nilai = kelipatan --anim-distance (contoh '+=D', '-=2D', '+=0.5D') */
  const PRESETS = {
    'fade':       { from: { opacity: 0 } },
    'fade-up':    { from: { opacity: 0, y: '+=D' } },
    'fade-down':  { from: { opacity: 0, y: '-=D' } },
    'fade-left':  { from: { opacity: 0, x: '-=D' } },
    'fade-right': { from: { opacity: 0, x: '+=D' } },
    'slide-up':   { from: { opacity: 0, y: '+=2D' }, ease: 'power4.out' },
    'zoom-in':    { from: { opacity: 0, scale: 0.82 }, ease: 'back.out(1.6)' },
    'zoom-out':   { from: { opacity: 0, scale: 1.18 } },
    'pop':        { from: { opacity: 0, scale: 0.5 }, ease: 'back.out(2.2)' },
    'flip-up':    { from: { opacity: 0, rotationX: -70, transformOrigin: '50% 100%', transformPerspective: 900 } },
    'flip-left':  { from: { opacity: 0, rotationY: 60, transformOrigin: '0% 50%', transformPerspective: 900 } },
    'rotate-in':  { from: { opacity: 0, rotation: -6, y: '+=D', transformOrigin: '0% 100%' }, ease: 'back.out(1.4)' },
    'skew-up':    { from: { opacity: 0, y: '+=D', skewY: 4, transformOrigin: '0% 100%' } },
    'blur-in':    { from: { opacity: 0, filter: 'blur(14px)', y: '+=0.5D' } },
    'grow-up':    { from: { opacity: 1, scaleY: 0, transformOrigin: '50% 100%' }, ease: 'power3.out' },
    'grow-x':     { from: { opacity: 1, scaleX: 0, transformOrigin: '0% 50%' }, ease: 'power3.out' },
    'clip-up':    { from: { opacity: 1, clipPath: 'inset(100% 0 0 0)' }, to: { clipPath: 'inset(0% 0 0 0)' } },
    'clip-left':  { from: { opacity: 1, clipPath: 'inset(0 100% 0 0)' }, to: { clipPath: 'inset(0 0% 0 0)' } },
    'clip-right': { from: { opacity: 1, clipPath: 'inset(0 0 0 100%)' }, to: { clipPath: 'inset(0 0 0 0%)' } },
  };

  function resolve(vars, distance) {
    const out = {};
    for (const k in vars) {
      const v = vars[k];
      if (typeof v === 'string' && /D$/.test(v)) {
        const sign = v.startsWith('-') ? -1 : 1;
        const mult = parseFloat(v.replace(/[+\-=D]/g, '')) || 1;
        out[k] = sign * mult * distance;
      } else out[k] = v;
    }
    return out;
  }

  const IDENTITY = { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, rotationX: 0, rotationY: 0, skewY: 0, scaleX: 1, scaleY: 1, filter: 'blur(0px)' };
  function toFor(from, presetTo) {
    const to = {};
    for (const k in from) if (k in IDENTITY) to[k] = IDENTITY[k];
    return Object.assign(to, presetTo || {});
  }

  function num(el, attr, fallback) {
    const v = el.getAttribute(attr);
    return v === null || v === '' ? fallback : parseFloat(v);
  }
  function readConfig(el) {
    const name = el.getAttribute('data-anim') || 'fade-up';
    const preset = PRESETS[name] || PRESETS['fade-up'];
    const distance = num(el, 'data-anim-distance', DEFAULTS.distance);
    const from = resolve(preset.from, distance);
    return {
      name, preset, from, to: toFor(from, preset.to),
      duration: num(el, 'data-anim-duration', DEFAULTS.duration),
      delay: num(el, 'data-anim-delay', 0),
      ease: el.getAttribute('data-anim-ease') || preset.ease || DEFAULTS.ease,
      once: el.getAttribute('data-anim-once') !== 'false',
      start: el.getAttribute('data-anim-start') || DEFAULTS.start,
      scrub: el.hasAttribute('data-anim-scrub'),
      clear: name.startsWith('clip') ? 'clipPath' : 'filter',
    };
  }
  function triggerFor(el, cfg) {
    const custom = el.getAttribute('data-anim-trigger');
    const trigger = custom ? document.querySelector(custom) || el : el;
    if (cfg.scrub) return { trigger, start: el.getAttribute('data-anim-start') || 'top 90%', end: el.getAttribute('data-anim-end') || 'top 45%', scrub: 0.6 };
    return { trigger, start: cfg.start, toggleActions: cfg.once ? 'play none none none' : 'play none none reverse' };
  }

  /* ---------- 1. REVEAL: [data-anim] ---------- */
  function initReveal(scope) {
    scope.querySelectorAll('[data-anim]').forEach((el) => {
      if (el.hasAttribute('data-stagger')) return;
      if (el.parentElement && el.parentElement.hasAttribute('data-stagger')) return;
      const cfg = readConfig(el);
      gsap.set(el, cfg.from);
      gsap.to(el, { ...cfg.to, duration: cfg.duration, delay: cfg.delay, ease: cfg.ease, clearProps: cfg.clear, scrollTrigger: triggerFor(el, cfg) });
    });
  }

  /* ---------- 2. STAGGER: [data-stagger] pada parent ---------- */
  function initStagger(scope) {
    scope.querySelectorAll('[data-stagger]').forEach((parent) => {
      const children = Array.from(parent.children);
      if (!children.length) return;
      const cfg = readConfig(parent);
      gsap.set(parent, { opacity: 1 });
      gsap.set(children, cfg.from);
      gsap.to(children, {
        ...cfg.to, duration: cfg.duration, delay: cfg.delay, ease: cfg.ease, clearProps: cfg.clear,
        stagger: { each: num(parent, 'data-stagger', DEFAULTS.stagger), from: parent.getAttribute('data-stagger-from') || 'start' },
        scrollTrigger: triggerFor(parent, cfg),
      });
    });
  }

  /* ---------- 3. SPLIT TEXT: [data-split] ---------- */
  function splitElement(el, mode) {
    if (el.dataset.splitDone) return Array.from(el.querySelectorAll('.split-unit'));
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = '';
    const units = [];
    lines.forEach((lineHTML) => {
      const line = document.createElement('span'); line.className = 'split-line';
      const tmp = document.createElement('span'); tmp.innerHTML = lineHTML.trim();
      Array.from(tmp.childNodes).forEach((node) => {
        const text = node.textContent;
        const wrapCls = node.nodeType === 1 ? node.className : '';
        if (mode === 'lines') {
          const u = document.createElement('span'); u.className = 'split-unit ' + wrapCls; u.innerHTML = node.nodeType === 1 ? node.innerHTML : text; line.appendChild(u); units.push(u); return;
        }
        const pieces = mode === 'chars' ? Array.from(text) : text.split(/(\s+)/);
        pieces.forEach((p) => {
          if (p === '') return;
          if (/^\s+$/.test(p)) { line.appendChild(document.createTextNode(' ')); return; }
          const u = document.createElement('span'); u.className = 'split-unit' + (wrapCls ? ' ' + wrapCls : ''); u.textContent = p;
          line.appendChild(u); units.push(u);
        });
      });
      el.appendChild(line);
    });
    el.dataset.splitDone = '1';
    return units;
  }
  function splitVars(el, mode) {
    return {
      each: num(el, 'data-split-stagger', mode === 'chars' ? 0.025 : mode === 'lines' ? 0.14 : 0.05),
      duration: num(el, 'data-anim-duration', 0.9),
      delay: num(el, 'data-anim-delay', 0),
      ease: el.getAttribute('data-anim-ease') || 'expo.out',
      rotation: mode === 'chars' ? 6 : 0,
    };
  }
  function initSplit(scope) {
    scope.querySelectorAll('[data-split]').forEach((el) => {
      if (el.hasAttribute('data-intro')) { splitElement(el, el.getAttribute('data-split') || 'words'); return; } // dianimasikan timeline intro
      const mode = el.getAttribute('data-split') || 'words';
      const units = splitElement(el, mode);
      const v = splitVars(el, mode);
      const once = el.getAttribute('data-anim-once') !== 'false';
      gsap.set(units, { yPercent: 110, opacity: 0, rotation: v.rotation });
      gsap.to(units, {
        yPercent: 0, opacity: 1, rotation: 0, duration: v.duration, delay: v.delay, ease: v.ease, stagger: v.each,
        scrollTrigger: { trigger: el, start: el.getAttribute('data-anim-start') || DEFAULTS.start, toggleActions: once ? 'play none none none' : 'play none none reverse' },
      });
    });
  }

  /* ---------- 4. PARALLAX (scroll): [data-parallax="0.3"] ----------
     Nilai positif = bergerak lebih lambat dari scroll; negatif = lebih cepat/berlawanan. */
  function initParallax(scope) {
    scope.querySelectorAll('[data-parallax]').forEach((el) => {
      const speed = num(el, 'data-parallax', 0.2);
      const container = el.closest('[data-parallax-container]') || el.parentElement;
      gsap.fromTo(el, { yPercent: -speed * 40 }, {
        yPercent: speed * 40, ease: 'none',
        scrollTrigger: { trigger: container, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ---------- 5. MOUSE PARALLAX: [data-mouse-parallax] > [data-depth] ---------- */
  function initMouseParallax(scope) {
    if (noHover) return;
    scope.querySelectorAll('[data-mouse-parallax]').forEach((wrap) => {
      const layers = Array.from(wrap.querySelectorAll('[data-depth]'));
      if (!layers.length) return;
      const strength = num(wrap, 'data-mouse-parallax', 1) || 1;
      const setters = layers.map((l) => ({ depth: num(l, 'data-depth', 0.02) * strength, x: gsap.quickTo(l, 'x', { duration: 0.9, ease: 'power3.out' }), y: gsap.quickTo(l, 'y', { duration: 0.9, ease: 'power3.out' }) }));
      const area = wrap.hasAttribute('data-mouse-parallax-window') ? window : wrap;
      area.addEventListener('mousemove', (e) => {
        const r = wrap.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        setters.forEach((s) => { s.x(dx * s.depth); s.y(dy * s.depth); });
      });
      area.addEventListener('mouseleave', () => setters.forEach((s) => { s.x(0); s.y(0); }));
    });
  }

  /* ---------- 6. COUNTER: [data-counter="1200"] ---------- */
  function formatNumber(v, decimals, sep) {
    const s = v.toFixed(decimals);
    return sep === 'none' ? s : s.replace(/\B(?=(\d{3})+(?!\d))/g, sep || ',');
  }
  function initCounter(scope) {
    scope.querySelectorAll('[data-counter]').forEach((el) => {
      const target = num(el, 'data-counter', 100);
      const suffix = el.getAttribute('data-counter-suffix') || '';
      const prefix = el.getAttribute('data-counter-prefix') || '';
      const decimals = num(el, 'data-counter-decimals', 0);
      const sep = el.getAttribute('data-counter-sep');
      const obj = { v: 0 };
      el.textContent = prefix + formatNumber(0, decimals, sep) + suffix;
      gsap.to(obj, {
        v: target, duration: num(el, 'data-anim-duration', 2), ease: 'power3.out',
        onUpdate: () => { el.textContent = prefix + formatNumber(obj.v, decimals, sep) + suffix; },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }

  /* ---------- 7. MARQUEE: [data-marquee] ---------- */
  function initMarquee(scope) {
    scope.querySelectorAll('[data-marquee]').forEach((el) => {
      const track = el.querySelector('.marquee__track') || el.firstElementChild;
      if (!track) return;
      const speed = num(el, 'data-marquee-speed', 60); // px/detik
      const dir = el.getAttribute('data-marquee-direction') === 'right' ? 1 : -1;
      const original = track.innerHTML;
      let tween = null, builtFor = 0;
      // gandakan isi track sampai cukup mengisi 2× lebar layar, lalu jalankan loop
      const build = () => {
        if (tween) tween.kill();
        gsap.set(track, { x: 0 });
        track.innerHTML = original;
        let guard = 0;
        while (track.scrollWidth < el.clientWidth * 2 + 10 && guard < 10) { track.innerHTML += original; guard++; }
        track.innerHTML += track.innerHTML;
        const half = track.scrollWidth / 2;
        tween = gsap.fromTo(track, { x: dir === -1 ? 0 : -half }, { x: dir === -1 ? -half : 0, duration: half / speed, ease: 'none', repeat: -1 });
        builtFor = el.clientWidth;
      };
      el.classList.add('is-running'); // lepas tampilan grid cadangan dulu agar lebar track terukur benar
      build();
      // layar melebar setelah dimuat (resize / maximize) → isi ulang agar tidak ada ruang kosong
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (el.clientWidth > builtFor) build(); }, 250);
      });
      if (el.hasAttribute('data-marquee-scrub')) {
        let last = window.scrollY;
        ScrollTrigger.create({ onUpdate: () => {
          const delta = Math.abs(window.scrollY - last); last = window.scrollY;
          gsap.to(tween, { timeScale: 1 + Math.min(delta / 8, 4), duration: .2, overwrite: true, onComplete: () => gsap.to(tween, { timeScale: 1, duration: .8 }) });
        } });
      }
      el.addEventListener('mouseenter', () => gsap.to(tween, { timeScale: 0.2, duration: .5 }));
      el.addEventListener('mouseleave', () => gsap.to(tween, { timeScale: 1, duration: .5 }));
    });
  }

  /* ---------- 8. MAGNETIC: [data-magnetic] ---------- */
  function initMagnetic(scope) {
    if (noHover) return;
    scope.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = num(el, 'data-magnetic', 0.3);
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * strength, y: (e.clientY - (r.top + r.height / 2)) * strength, duration: .4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, .4)' }));
    });
  }

  /* ---------- 9. TILT 3D: [data-tilt] ---------- */
  function initTilt(scope) {
    if (noHover) return;
    scope.querySelectorAll('[data-tilt]').forEach((el) => {
      const max = num(el, 'data-tilt', 8);
      el.style.transformStyle = 'preserve-3d';
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        gsap.to(el, { rotationY: px * max, rotationX: -py * max, transformPerspective: 900, duration: .5, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { rotationX: 0, rotationY: 0, duration: .8, ease: 'elastic.out(1, .5)' }));
    });
  }

  /* ---------- 10. SVG DRAW: [data-draw] ---------- */
  function initDraw(scope) {
    scope.querySelectorAll('[data-draw]').forEach((svg) => {
      const paths = svg.querySelectorAll('path, line, polyline, circle');
      paths.forEach((p) => { const len = p.getTotalLength ? p.getTotalLength() : 300; p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });
      const cfg = { duration: num(svg, 'data-anim-duration', 1.6), stagger: num(svg, 'data-draw-stagger', 0.15) };
      const scrub = svg.hasAttribute('data-anim-scrub');
      gsap.to(paths, {
        strokeDashoffset: 0, duration: cfg.duration, ease: scrub ? 'none' : 'power2.inOut', stagger: cfg.stagger,
        scrollTrigger: scrub
          ? { trigger: svg.closest('[data-draw-container]') || svg, start: svg.getAttribute('data-anim-start') || 'top 80%', end: svg.getAttribute('data-anim-end') || 'bottom 60%', scrub: 0.5 }
          : { trigger: svg, start: svg.getAttribute('data-anim-start') || 'top 88%', once: true },
      });
    });
  }

  /* ---------- 11. REVEAL MASK: .reveal-mask ---------- */
  function initMask(scope) {
    scope.querySelectorAll('.reveal-mask').forEach((el) => {
      const media = el.querySelector('img, video, svg, .reveal-mask__inner');
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
      if (media) tl.fromTo(media, { scale: 1.25 }, { scale: 1, duration: 1.4, ease: 'expo.out' }, 0);
      const overlay = document.createElement('span');
      overlay.style.cssText = 'position:absolute;inset:0;background:var(--accent);transform-origin:right;z-index:2;pointer-events:none;';
      el.appendChild(overlay);
      el.classList.add('reveal-mask--js');
      tl.to(overlay, { scaleX: 0, duration: 1, ease: 'expo.inOut' }, 0);
    });
  }

  /* ---------- 12. PAGE PROGRESS: [data-progress] ---------- */
  function initProgress(scope) {
    scope.querySelectorAll('[data-progress]').forEach((el) => {
      gsap.to(el, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
    });
  }

  /* ---------- 13. SCROLL CLASS: [data-scroll-class="is-inview"] ---------- */
  function initScrollClass(scope) {
    scope.querySelectorAll('[data-scroll-class]').forEach((el) => {
      const cls = el.getAttribute('data-scroll-class') || 'is-inview';
      ScrollTrigger.create({
        trigger: el, start: el.getAttribute('data-anim-start') || 'top 80%', end: el.getAttribute('data-anim-end') || 'bottom 20%',
        toggleClass: { targets: el, className: cls },
        once: el.getAttribute('data-anim-once') === 'true',
      });
    });
  }

  /* ---------- 14. NAV HIGHLIGHT: [data-nav-section="id"] ↔ a[href="#id"] ---------- */
  function initNavSections(scope) {
    const sections = scope.querySelectorAll('[data-nav-section]');
    if (!sections.length) return;
    sections.forEach((sec) => {
      const id = sec.getAttribute('data-nav-section') || sec.id;
      const links = document.querySelectorAll(`.nav__link[href="#${id}"]`);
      if (!links.length) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: (self) => links.forEach((l) => l.classList.toggle('is-active', self.isActive)),
      });
    });
  }

  /* ---------- REDUCED MOTION: tampilkan semua tanpa animasi ---------- */
  function showAll(scope) {
    scope.querySelectorAll('[data-anim], [data-stagger] > *, [data-split], [data-intro]').forEach((el) => { el.style.opacity = 1; });
    scope.querySelectorAll('[data-counter]').forEach((el) => {
      el.textContent = (el.getAttribute('data-counter-prefix') || '') + formatNumber(num(el, 'data-counter', 0), num(el, 'data-counter-decimals', 0), el.getAttribute('data-counter-sep')) + (el.getAttribute('data-counter-suffix') || '');
    });
    scope.querySelectorAll('[data-progress]').forEach((el) => { el.style.display = 'none'; });
  }

  const Anim = {
    presets: PRESETS,
    defaults: DEFAULTS,
    reduced,
    init(scope = document) {
      if (typeof gsap === 'undefined') { document.documentElement.classList.add('no-js'); return; }
      gsap.registerPlugin(ScrollTrigger);
      if (reduced) { showAll(scope); initNavSections(scope); return; }
      initSplit(scope);
      initStagger(scope);
      initReveal(scope);
      initParallax(scope);
      initMouseParallax(scope);
      initCounter(scope);
      initMarquee(scope);
      initMagnetic(scope);
      initTilt(scope);
      initDraw(scope);
      initMask(scope);
      initProgress(scope);
      initScrollClass(scope);
      initNavSections(scope);
      window.addEventListener('load', () => ScrollTrigger.refresh());
    },
    /* Mainkan ulang reveal sebuah elemen sekarang (tanpa scroll trigger). */
    preview(el) {
      if (typeof gsap === 'undefined') return;
      if (el.hasAttribute('data-stagger')) {
        const cfg = readConfig(el);
        const kids = Array.from(el.children);
        gsap.killTweensOf(kids);
        gsap.fromTo(kids, cfg.from, { ...cfg.to, duration: cfg.duration, ease: cfg.ease, stagger: num(el, 'data-stagger', DEFAULTS.stagger), clearProps: cfg.clear });
        return;
      }
      if (el.hasAttribute('data-split')) {
        const mode = el.getAttribute('data-split') || 'words';
        const units = splitElement(el, mode); const v = splitVars(el, mode);
        gsap.killTweensOf(units);
        gsap.fromTo(units, { yPercent: 110, opacity: 0, rotation: v.rotation }, { yPercent: 0, opacity: 1, rotation: 0, duration: v.duration, ease: v.ease, stagger: v.each });
        return;
      }
      if (el.hasAttribute('data-counter')) {
        const target = num(el, 'data-counter', 100); const obj = { v: 0 };
        const decimals = num(el, 'data-counter-decimals', 0); const sep = el.getAttribute('data-counter-sep');
        gsap.to(obj, { v: target, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = (el.getAttribute('data-counter-prefix') || '') + formatNumber(obj.v, decimals, sep) + (el.getAttribute('data-counter-suffix') || ''); } });
        return;
      }
      const cfg = readConfig(el);
      gsap.killTweensOf(el);
      gsap.fromTo(el, cfg.from, { ...cfg.to, duration: cfg.duration, ease: cfg.ease, clearProps: cfg.clear });
    },
    /* Ambil konfigurasi mentah sebuah elemen (dipakai style guide). */
    read: readConfig,
    split: splitElement,
    refresh() { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(); },
  };

  global.Anim = Anim;
})(window);
