/* =====================================================================
   AUTH — interaksi halaman login & register
   (intro timeline, turbin, toggle password, kekuatan password, validasi,
    langkah register, sukses, tema). Engine generik: animations.js.
   ===================================================================== */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const hasGsap = typeof gsap !== 'undefined';
  const reduced = window.Anim ? Anim.reduced : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = hasGsap && !reduced;

  if (window.Anim) Anim.init();

  /* ---------- turbin ---------- */
  const spins = [];
  if (animate) $$('[data-turbine]').forEach((b) => {
    const t = gsap.to(b, { rotation: '+=360', duration: parseFloat(b.getAttribute('data-turbine')) || 7, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
    t.timeScale(0); spins.push(t);
  });

  /* ---------- intro ---------- */
  (function intro() {
    const introEls = $$('[data-intro]');
    if (!animate) { introEls.forEach((el) => { el.style.opacity = 1; }); return; }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('[data-auth-layer]', { yPercent: 12, opacity: 0, duration: 1.4, stagger: { each: 0.08, from: 'end' } }, 0);
    const title = $('[data-intro="title"]');
    if (title) { const units = Anim.split(title, 'words'); gsap.set(title, { opacity: 1 }); tl.fromTo(units, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.06 }, 0.5); }
    const visualEls = introEls.filter((el) => el.closest('.auth__visual') && el !== title);
    const cardEls = introEls.filter((el) => !el.closest('.auth__visual'));
    tl.fromTo(visualEls, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1 }, 0.8);
    tl.fromTo(cardEls, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.07 }, 0.4);
    spins.forEach((t, i) => tl.to(t, { timeScale: 1, duration: 2.2, ease: 'power2.in' }, 0.3 + i * 0.15));
  })();

  /* ---------- toggle lihat password ---------- */
  $$('[data-eye]').forEach((btn) => btn.addEventListener('click', () => {
    const input = btn.parentElement.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(show)); btn.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
    if (animate) gsap.fromTo(btn, { scale: 0.7 }, { scale: 1, duration: 0.5, ease: 'back.out(2.5)' });
  }));

  /* ---------- kekuatan password ---------- */
  $$('[data-strength-for]').forEach((meter) => {
    const input = document.getElementById(meter.getAttribute('data-strength-for'));
    const label = meter.nextElementSibling;
    const words = ['', 'Lemah', 'Cukup', 'Bagus', 'Kuat'];
    input?.addEventListener('input', () => {
      const v = input.value; let s = 0;
      if (v.length >= 8) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
      if (v.length < 8) s = Math.min(s, 1);
      meter.setAttribute('data-level', v ? s : 0); if (label) label.textContent = v ? words[s] : '';
    });
  });

  /* ---------- validasi ---------- */
  function validate(scope) {
    let ok = true;
    $$('.field', scope).forEach((field) => {
      const input = $('input, select, textarea', field); if (!input) return;
      const match = input.getAttribute('data-match');
      let valid = input.checkValidity();
      if (valid && match) valid = input.value === document.getElementById(match)?.value;
      if (input.type === 'checkbox') valid = input.checked || !input.required;
      field.classList.toggle('is-invalid', !valid);
      if (!valid) { ok = false; if (animate) gsap.fromTo(field, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, .3)' }); }
    });
    return ok;
  }
  $$('.field input, .field select').forEach((i) => i.addEventListener('input', () => i.closest('.field').classList.remove('is-invalid')));

  /* ---------- langkah register ---------- */
  (function steps() {
    const form = $('[data-auth-form="register"]'); if (!form) return;
    const panels = $$('.auth__step', form); const ind = $('[data-steps]'); const items = ind ? $$('.steps-ind__item', ind) : [];
    let cur = 0;
    const go = (n) => {
      const dir = n > cur ? 1 : -1;
      const from = panels[cur], to = panels[n];
      cur = n;
      items.forEach((it, i) => { it.classList.toggle('is-active', i === n); it.classList.toggle('is-done', i < n); });
      ind?.classList.toggle('is-step-2', n === 1);
      if (!animate) { panels.forEach((p, i) => p.classList.toggle('is-active', i === n)); return; }
      gsap.to(from, { x: -40 * dir, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => {
        from.classList.remove('is-active'); gsap.set(from, { clearProps: 'all' });
        to.classList.add('is-active');
        gsap.fromTo(to, { x: 40 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
        gsap.fromTo($$('.field, .auth__actions, .check', to), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'expo.out', delay: 0.1 });
        $('input, select', to)?.focus({ preventScroll: true });
      } });
    };
    $$('[data-step-next]', form).forEach((b) => b.addEventListener('click', () => { if (validate(panels[cur])) go(cur + 1); }));
    $$('[data-step-back]', form).forEach((b) => b.addEventListener('click', () => go(cur - 1)));
    form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && cur < panels.length - 1) { e.preventDefault(); $('[data-step-next]', panels[cur])?.click(); } });
  })();

  /* ---------- daftar sebagai seller / mitra ---------- */
  (function rolePick() {
    const radios = $$('input[name="role"]'); if (!radios.length) return;
    const apply = () => {
      const role = ($('input[name="role"]:checked') || {}).value || 'seller';
      $$('[data-role-group]').forEach((g) => {
        const on = g.getAttribute('data-role-group') === role; g.hidden = !on;
        $$('input, select, textarea', g).forEach((i) => { i.disabled = !on; });
      });
      const lbl = $('[data-step2-label]'); if (lbl) lbl.textContent = role === 'mitra' ? 'Profil mitra' : 'Toko';
      const lead = $('[data-reg-lead]'); if (lead) lead.textContent = role === 'mitra' ? 'Dua langkah singkat: buat akun, lalu lengkapi profil mitra.' : 'Dua langkah singkat: buat akun, lalu siapkan tokomu.';
    };
    const pre = new URLSearchParams(location.search).get('role');
    if (pre === 'mitra' || pre === 'seller') { const r = radios.find((x) => x.value === pre); if (r) r.checked = true; }
    radios.forEach((r) => r.addEventListener('change', apply)); apply();
  })();

  /* ---------- submit (demo tanpa backend) ---------- */
  $$('[data-auth-form]').forEach((form) => form.addEventListener('submit', (e) => {
    e.preventDefault();
    const active = $('.auth__step.is-active', form) || form;
    if (!validate(active)) return;
    const btn = $('button[type="submit"]', form); const label = $('[data-submit-label]', form);
    // simpan sesi demo (lihat js/session.js) sebelum diarahkan ke dasbor
    if (window.TokoraSession) {
      const val = (n) => (form.elements[n] ? form.elements[n].value.trim() : '');
      if (form.getAttribute('data-auth-form') === 'register') {
        const role = (form.querySelector('input[name="role"]:checked') || {}).value || 'seller';
        TokoraSession.register(role === 'mitra'
          ? { role, name: val('name'), email: val('email'), store: 'Toko ' + val('name').split(' ')[0], city: val('pcity'), partnerType: val('ptype'), partnerChannel: val('pchannel') }
          : { role, name: val('name'), email: val('email'), store: val('store'), category: val('category'), city: val('city') });
      }
      else TokoraSession.login(val('email'));
    }
    btn.disabled = true; if (label) label.textContent = 'Tunggu sebentar…';
    setTimeout(() => {
      const card = $('[data-auth-card]');
      if (animate) gsap.to(card.children, { y: -10, opacity: 0, duration: 0.35, stagger: 0.03, ease: 'power2.in', onComplete: () => { card.classList.add('is-success'); gsap.set(card.children, { clearProps: 'all' }); gsap.fromTo('.auth__success > *', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'expo.out' }); } });
      else card.classList.add('is-success');
      setTimeout(() => { window.location.href = form.getAttribute('data-redirect') || 'index.html'; }, 2600);
    }, 1000);
  }));

  /* ---------- tema ---------- */
  (function theme() {
    const btn = $('[data-theme-toggle]'); if (!btn) return;
    const html = document.documentElement;
    btn.setAttribute('aria-pressed', String(html.getAttribute('data-theme') === 'light'));
    btn.addEventListener('click', () => {
      const t = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', t); btn.setAttribute('aria-pressed', String(t === 'light'));
      try { localStorage.setItem('tokora-theme', t); } catch (e) {}
      if (animate) gsap.fromTo(btn, { rotation: -180, scale: 0.7 }, { rotation: 0, scale: 1, duration: 0.7, ease: 'back.out(2)' });
    });
  })();

  /* ---------- cursor glow ---------- */
  (function cursor() {
    const c = $('[data-cursor]');
    if (!c || !animate || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.body.classList.add('has-cursor');
    const x = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3.out' }), y = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('mousemove', (e) => { x(e.clientX); y(e.clientY); });
    document.addEventListener('mouseover', (e) => c.classList.toggle('is-hover', !!e.target.closest('a, button, .check')));
  })();
})();
