/* =====================================================================
   SESSION — sesi login DEMO (disimpan di localStorage browser ini saja).
   Belum ada backend: siapa pun yang mengisi email + kata sandi valid
   dianggap masuk. Ganti dengan panggilan API auth saat backend siap.
   ===================================================================== */
(function () {
  'use strict';
  const KEY = 'tokora-session';

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  };
  const write = (s) => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
  };

  // "sari.rahma@..." → "Sari Rahma"
  const nameFromEmail = (email) => (email || '').split('@')[0].split(/[._-]+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Seller';

  window.TokoraSession = {
    get: read,
    /** Login: pakai data toko dari sesi sebelumnya bila email sama. */
    login(email) {
      const prev = read();
      const same = prev && prev.email === email;
      return write({
        name: same ? prev.name : nameFromEmail(email),
        email,
        store: same ? prev.store : 'Toko ' + nameFromEmail(email).split(' ')[0],
        category: same ? prev.category : 'Lainnya',
        city: same ? prev.city : 'Jakarta',
        role: same ? prev.role : 'seller',
        mode: same ? prev.mode : undefined,
        since: same ? prev.since : new Date().toISOString(),
      });
    },
    register(data) {
      return write({
        name: data.name || nameFromEmail(data.email),
        email: data.email,
        role: data.role || 'seller',
        mode: data.role === 'mitra' ? 'mitra' : 'seller',
        partnerType: data.partnerType || null,
        partnerChannel: data.partnerChannel || null,
        store: data.store || 'Toko Baru',
        category: data.category || 'Lainnya',
        city: data.city || 'Jakarta',
        since: new Date().toISOString(),
      });
    },
    update(patch) { const s = read(); if (s) write(Object.assign(s, patch)); },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };
})();
