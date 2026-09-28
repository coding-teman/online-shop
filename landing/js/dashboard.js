/* =====================================================================
   DASHBOARD — dasbor Tokora (DEMO, tanpa backend), dua mode:
   - SELLER : ringkasan, pesanan, produk (+ komisi affiliate), landing page,
              domain, mitra, iklan, saldo, pengaturan.
   - MITRA  : kreator landing page & closer (bantu checkout): katalog
              affiliate, LP saya, buat pesanan + rincian tagihan WhatsApp,
              pesanan mitra, komisi.
   Data contoh dibuat sekali per akun lalu disimpan di localStorage, jadi
   perubahan tetap ada setelah reload. "Reset data demo" ada di Pengaturan.
   Semua angka biaya (komisi, Midtrans, domain, iklan, ongkir) adalah
   ANGKA CONTOH — ganti dengan data backend / tarif asli.
   ===================================================================== */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const session = window.TokoraSession && TokoraSession.get();
  if (!session) { location.replace('login.html'); return; }

  /* ---------------------------------------------------------------
     UTIL
     --------------------------------------------------------------- */
  const rp = (v) => (v < 0 ? '−' : '') + 'Rp ' + Math.round(Math.abs(v)).toLocaleString('id-ID');
  const rpShort = (v) => {
    const a = Math.abs(v), s = v < 0 ? '−' : '';
    if (a >= 1e6) return s + 'Rp ' + (a / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
    if (a >= 1e3) return s + 'Rp ' + Math.round(a / 1e3).toLocaleString('id-ID') + 'rb';
    return s + 'Rp ' + Math.round(a);
  };
  const pct = (v, d = 1) => (v * 100).toLocaleString('id-ID', { maximumFractionDigits: d }) + '%';
  const num = (v) => Math.round(v).toLocaleString('id-ID');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAY = 864e5;
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDateTime = (iso) => new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const dayKey = (d) => { d = new Date(d); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const slugify = (s, max = 30) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max);
  const initials = (s) => String(s).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'T';
  const firstName = (s) => String(s).split(/\s+/)[0] || 'Seller';
  const shortName = (s) => { const p = String(s).split(/\s+/); return p.length > 1 ? p[0] + ' ' + p[1][0] + '.' : p[0]; };
  const uid = (p) => p + Math.random().toString(36).slice(2, 8);
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const svg = (paths, extra = '') => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + extra + '>' + paths + '</svg>';
  const ICON = {
    check: svg('<path d="M5 12l5 5L20 7"/>', ' stroke-width="2.4"'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>', ' stroke-width="2.2"'),
    edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    trash: svg('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>', ' class="btn__icon" stroke-width="2"'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', ' stroke-width="2"'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>', ' stroke-width="2"'),
    cart: svg('<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/>'),
    wallet: svg('<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
    trend: svg('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
    box: svg('<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/>'),
    link: svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>', ' class="btn__icon"'),
    users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16 14c3 0 5.5 2.4 5.5 5.5"/>'),
    megaphone: svg('<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14"/>'),
    chat: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
    shield: svg('<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/>'),
  };
  const NAV_ICON = {
    ringkasan: svg('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
    pesanan: svg('<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>'),
    produk: svg('<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>'),
    landing: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h18M7 12h6M7 16h4"/>'),
    domain: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    mitra: ICON.users, iklan: ICON.megaphone,
    saldo: svg('<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M16 15h2"/><path d="M6 6V4h12v2"/>'),
    pengaturan: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'),
    katalog: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    buat: ICON.chat,
    komisi: svg('<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.6-.6-3-1.6M12 6v2M12 16v2"/>'),
  };

  /* ---------------------------------------------------------------
     KONSTANTA BISNIS (sesuai PRD)
     --------------------------------------------------------------- */
  const CHANNELS = {
    marketplace: { label: 'Marketplace', color: 'var(--ch-marketplace)' },
    landing: { label: 'Landing page', color: 'var(--ch-landing)' },
    domain: { label: 'Domain sendiri', color: 'var(--ch-domain)' },
    closer: { label: 'Bantu CO', color: 'var(--ch-closer)' },
  };
  const CH_ORDER = ['marketplace', 'landing', 'domain', 'closer'];
  const SOURCES = { toko: 'Toko', lp_seller: 'LP sendiri', kreator: 'Kreator', closer: 'Closer', iklan: 'Iklan' };
  const STATUS = { menunggu: 'Menunggu bayar', dibayar: 'Perlu diproses', diproses: 'Diproses', dikirim: 'Dikirim', selesai: 'Selesai', dibatalkan: 'Dibatalkan', gagal: 'Gagal kirim' };
  const COUNTS_AS_SALE = (o) => !['menunggu', 'dibatalkan', 'gagal'].includes(o.status);
  const COMMISSION = 0.03; // komisi platform, paket Pro
  // ANGKA CONTOH — sesuaikan dengan tarif di akun merchant Midtrans
  const GATEWAY_FEE = { QRIS: { pct: 0.007 }, 'VA BCA': { flat: 4000 }, 'VA Mandiri': { flat: 4000 }, GoPay: { pct: 0.02 }, ShopeePay: { pct: 0.02 }, 'Kartu kredit': { pct: 0.029, flat: 2000 }, COD: {} };
  const gatewayFee = (o) => { const f = GATEWAY_FEE[o.payment] || {}; return Math.round((f.pct || 0) * o.total + (f.flat || 0)); };
  const DOMAIN_EXT = [
    { ext: '.com', price: 175000, renew: 185000 }, { ext: '.id', price: 250000, renew: 250000 },
    { ext: '.co.id', price: 300000, renew: 300000, note: 'Perlu dokumen badan usaha' }, { ext: '.my.id', price: 25000, renew: 25000 },
    { ext: '.store', price: 95000, renew: 650000 },
  ];
  const TEMPLATES = ['Umum', 'Fashion', 'Makanan', 'Kecantikan', 'Produk digital', 'Jasa'];
  const DOMAIN_STEPS = ['Diproses', 'DNS aktif', 'SSL aktif', 'Live'];
  const AD_MIN_BID = 300, AD_MIN_DAILY = 10000; // ANGKA CONTOH
  const COURIERS = ['JNE REG', 'J&T EZ', 'SiCepat REG', 'AnterAja Reguler'];
  const shippingFor = (city) => 9000 + (hash(String(city).toLowerCase()) % 8) * 2500; // ongkir contoh

  /* ---------------------------------------------------------------
     DATA CONTOH
     --------------------------------------------------------------- */
  const CATALOG = {
    Kecantikan: [['Serum Niacinamide 20ml', 89000], ['Sunscreen SPF 50 50ml', 75000], ['Facial Wash Gentle 100ml', 55000], ['Toner Hydrating 150ml', 69000], ['Moisturizer Gel 50g', 79000], ['Lip Tint Rose', 35000], ['Masker Clay 100g', 65000], ['Paket Glow 3in1', 199000]],
    'Makanan dan minuman': [['Keripik Pedas Level 5', 25000], ['Kopi Susu Botol 1L', 85000], ['Sambal Bawang 150g', 35000], ['Nastar Premium 500g', 95000], ['Granola Madu 250g', 59000], ['Teh Rempah 20 sachet', 45000], ['Brownies Panggang', 70000], ['Paket Hampers', 249000]],
    Fashion: [['Kaos Oversize Hitam', 119000], ['Kemeja Linen', 189000], ['Celana Chino', 229000], ['Hijab Voal', 69000], ['Totebag Kanvas', 79000], ['Topi Baseball', 89000], ['Hoodie Zip', 259000], ['Kaus Kaki 3 Pasang', 45000]],
    _: [['Tumbler 750ml', 99000], ['Totebag Kanvas', 79000], ['Lampu Tidur LED', 129000], ['Casing HP Bening', 59000], ['Kabel USB-C 1m', 45000], ['Notebook A5', 39000], ['Powerbank 10.000mAh', 229000], ['Stiker Pack', 25000]],
  };
  const BUYERS = ['Rina Wulandari', 'Andi Hakim', 'Dewi Lestari', 'Yoga Kurniawan', 'Maya Fitri', 'Budi Santoso', 'Sinta Maharani', 'Rizky Ramadhan', 'Fajar Nugroho', 'Lestari Wijaya', 'Hendra Saputra', 'Ayu Kartika', 'Bayu Aditya', 'Citra Dewi'];
  const CITIES = ['Jakarta Selatan', 'Bandung', 'Surabaya', 'Yogyakarta', 'Medan', 'Makassar', 'Semarang', 'Depok', 'Bekasi', 'Malang', 'Denpasar', 'Palembang'];
  const PAYMENTS = ['QRIS', 'QRIS', 'QRIS', 'VA BCA', 'VA Mandiri', 'GoPay', 'ShopeePay', 'Kartu kredit', 'COD'];
  const SELLER_PARTNERS = [
    { id: 'pt1', name: 'Dimas Pratama', type: 'kreator' }, { id: 'pt2', name: 'Intan Permata', type: 'kreator' },
    { id: 'pt3', name: 'Nur Aini', type: 'closer' }, { id: 'pt4', name: 'Galih Prakoso', type: 'closer' },
    { id: 'pt5', name: 'Putri Ayu', type: 'keduanya' },
  ];
  const OTHER_SELLERS = [
    { id: 's1', name: 'Glow Lab Official', city: 'Bandung', rating: 4.8 }, { id: 's2', name: 'Kopi Nusantara', city: 'Malang', rating: 4.9 },
    { id: 's3', name: 'Kaos Lokal ID', city: 'Yogyakarta', rating: 4.7 }, { id: 's4', name: 'Dapur Bunda', city: 'Surabaya', rating: 4.8 },
  ];
  const OTHER_PRODUCTS = [
    ['s1', 'Serum Brightening 30ml', 129000, 12, 10, 'Kecantikan'], ['s1', 'Sunscreen Aqua SPF 50', 89000, 10, 8, 'Kecantikan'], ['s1', 'Paket Skincare Pemula', 249000, 15, 12, 'Kecantikan'],
    ['s2', 'Kopi Susu Gula Aren 1L', 85000, 10, 8, 'Makanan dan minuman'], ['s2', 'Biji Kopi Arabika Gayo 250g', 110000, 8, 6, 'Makanan dan minuman'],
    ['s3', 'Kaos Oversize Premium', 129000, 12, 10, 'Fashion'], ['s3', 'Hoodie Basic Unisex', 239000, 10, 8, 'Fashion'],
    ['s4', 'Sambal Cumi Pedas 200g', 45000, 15, 12, 'Makanan dan minuman'], ['s4', 'Nastar Wisman 500g', 115000, 12, 10, 'Makanan dan minuman'], ['s4', 'Paket Hampers Lebaran', 289000, 10, 8, 'Makanan dan minuman'],
  ];

  function seedData() {
    const r = rng(hash(session.email || 'demo'));
    const pick = (a) => a[Math.floor(r() * a.length)];
    const now = Date.now();
    const host = (slugify(session.store || 'tokoku', 24) || 'tokoku') + '.tokora.id';
    const partnerCode = (slugify(firstName(session.name), 8).replace(/-/g, '') || 'mitra').toUpperCase() + (10 + Math.floor(r() * 89));

    // ---------- sisi SELLER ----------
    const products = (CATALOG[session.category] || CATALOG._).map(([name, price], i) => ({
      id: 'prd' + (i + 1), name, sku: 'SKU-' + String(101 + i), price,
      stock: i === 2 ? 3 : i === 5 ? 0 : 8 + Math.floor(r() * 110),
      weight: 100 + Math.floor(r() * 9) * 50, visibility: i === 7 ? 'landing' : i === 6 ? 'marketplace' : 'semua',
      active: i !== 5, sold: 0, createdAt: new Date(now - (40 + i) * DAY).toISOString(),
      aff: i < 5 || i === 7 ? { on: true, creator: [10, 12, 8, 10, 12, 0, 0, 15][i], closer: [8, 10, 6, 8, 10, 0, 0, 12][i] } : { on: false, creator: 10, closer: 8 },
    }));
    const pages = [
      { id: 'pg1', title: 'Beranda toko', path: '/', template: 'Umum', status: 'terbit', visits: 2140 + Math.floor(r() * 400), updatedAt: new Date(now - 6 * DAY).toISOString() },
      { id: 'pg2', title: 'Promo akhir bulan', path: '/promo', template: 'Umum', status: 'terbit', visits: 1310 + Math.floor(r() * 300), updatedAt: new Date(now - 3 * DAY).toISOString() },
      { id: 'pg3', title: 'Tentang kami', path: '/tentang', template: 'Umum', status: 'draf', visits: 0, updatedAt: new Date(now - 1 * DAY).toISOString() },
    ];
    const partners = SELLER_PARTNERS.map((p, i) => Object.assign({}, p, { status: p.id === 'pt4' ? 'dibatasi' : 'aktif', joinedAt: new Date(now - (60 - i * 8) * DAY).toISOString() }));
    const campaigns = [
      { id: 'ad1', name: 'Produk terlaris', productIds: ['prd1', 'prd2'], daily: 50000, bid: 900, status: 'aktif', createdAt: new Date(now - 20 * DAY).toISOString() },
      { id: 'ad2', name: 'Promo akhir bulan', productIds: ['prd4'], daily: 30000, bid: 700, status: 'dijeda', createdAt: new Date(now - 14 * DAY).toISOString() },
    ];
    const adStats = [];
    for (let d = 20; d >= 0; d--) campaigns.forEach((c) => {
      if (c.status === 'dijeda' && d < 5) return;
      const imp = 700 + Math.floor(r() * 1300); const clk = Math.round(imp * (0.014 + r() * 0.018));
      adStats.push({ campaignId: c.id, day: dayKey(now - d * DAY), imp, clk, spend: Math.min(c.daily, Math.round(clk * c.bid * (0.7 + r() * 0.3))) });
    });

    const orders = []; let seq = 0;
    const affRate = (p, role) => (p && p.aff && p.aff.on ? p.aff[role] / 100 : 0);
    for (let d = 20; d >= 0; d--) {
      const day = new Date(now - d * DAY); const weekend = day.getDay() === 0 || day.getDay() === 6;
      const n = d === 0 ? 5 : 1 + Math.floor(r() * (weekend ? 6 : 5));
      for (let k = 0; k < n; k++) {
        const created = new Date(day); created.setHours(8 + Math.floor(r() * 13), Math.floor(r() * 60), 0, 0);
        if (created.getTime() > now) created.setTime(now - (k + 1) * 17 * 60000);
        const cr = r(); const channel = cr < 0.4 ? 'marketplace' : cr < 0.68 ? 'landing' : cr < 0.84 ? 'domain' : 'closer';
        let source = channel === 'marketplace' ? (r() < 0.28 ? 'iklan' : 'toko') : channel === 'closer' ? 'closer' : channel === 'landing' && r() < 0.45 ? 'kreator' : 'lp_seller';
        const pool = products.filter((x) => (source === 'kreator' || source === 'closer' ? x.aff.on : true) && (x.visibility === 'semua' || x.visibility === (channel === 'marketplace' ? 'marketplace' : 'landing')));
        const items = []; const nItems = 1 + Math.floor(r() * 2.2);
        for (let j = 0; j < nItems; j++) {
          const p = pick(pool); const ex = items.find((it) => it.productId === p.id);
          if (ex) ex.qty++; else items.push({ productId: p.id, name: p.name, price: p.price, qty: 1 + (r() < 0.2 ? 1 : 0) });
        }
        const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
        const shipping = 9000 + Math.floor(r() * 5) * 3000;
        let status;
        if (d >= 4) status = r() < 0.05 ? 'dibatalkan' : 'selesai';
        else if (d >= 2) status = 'dikirim';
        else if (d === 1) status = r() < 0.5 ? 'dikirim' : 'diproses';
        else status = ['dibayar', 'dibayar', 'menunggu', 'diproses', 'dibayar'][k % 5];
        let partnerId = null, partnerFee = 0, adId = null;
        if (source === 'kreator') { partnerId = pick(['pt1', 'pt2', 'pt5']); partnerFee = Math.round(items.reduce((s, it) => s + it.price * it.qty * affRate(productById(it.productId, products), 'creator'), 0)); }
        if (source === 'closer') { partnerId = pick(['pt3', 'pt3', 'pt4', 'pt5']); partnerFee = Math.round(items.reduce((s, it) => s + it.price * it.qty * affRate(productById(it.productId, products), 'closer'), 0)); }
        if (source === 'iklan') adId = d < 5 ? 'ad1' : pick(['ad1', 'ad2']);
        const payment = channel === 'closer' ? (r() < 0.5 ? 'COD' : pick(['QRIS', 'VA BCA', 'VA Mandiri'])) : pick(PAYMENTS);
        if (payment === 'COD' && status === 'menunggu') status = 'dibayar';
        if (payment === 'COD' && status === 'dibatalkan' && channel === 'closer') status = 'gagal';
        const o = {
          id: 'TKR' + dayKey(created).slice(2).replace(/-/g, '') + '-' + String(++seq).padStart(3, '0'),
          createdAt: created.toISOString(), buyer: pick(BUYERS), city: pick(CITIES), phone: '08xx-xxxx-' + String(1000 + Math.floor(r() * 8999)),
          channel, source, partnerId, partnerFee, adId, pageId: source === 'lp_seller' ? (r() < 0.6 ? 'pg2' : 'pg1') : null,
          items, subtotal, shipping, total: subtotal + shipping, payment, status,
          courier: status === 'dikirim' || status === 'selesai' ? pick(COURIERS) : '',
          resi: status === 'dikirim' || status === 'selesai' ? 'RESI' + Math.floor(1e9 + r() * 8e9) : '',
        };
        orders.push(o);
        if (COUNTS_AS_SALE(o)) items.forEach((it) => { const p = productById(it.productId, products); if (p) p.sold += it.qty; });
      }
    }
    orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const ledger = [];
    orders.filter((o) => o.status === 'selesai').forEach((o) => ledger.push(...saleEntries(o, new Date(new Date(o.createdAt).getTime() + 3 * DAY).toISOString(), partners)));
    const earned = ledger.reduce((s, e) => s + e.amount, 0);
    [[0.35, 12], [0.25, 5]].forEach(([f, dd]) => { const w = Math.floor((earned * f) / 100000) * 100000; if (w > 0) ledger.push({ id: uid('l'), at: new Date(now - dd * DAY).toISOString(), type: 'penarikan', label: 'Tarik saldo ke BCA', amount: -w, status: 'berhasil' }); });
    ledger.sort((a, b) => b.at.localeCompare(a.at));

    // ---------- sisi MITRA (akun ini sebagai kreator / closer untuk seller lain) ----------
    const catalog = OTHER_PRODUCTS.map(([sellerId, name, price, creator, closer, category], i) => ({ id: 'cp' + (i + 1), sellerId, name, price, creator, closer, category, stock: 40 + Math.floor(r() * 300), sold30: 30 + Math.floor(r() * 400) }));
    const myPages = [
      { id: 'mp1', productId: 'cp1', title: 'Serum Brightening untuk kulit kusam', slug: 'serum-brightening', template: 'Kecantikan', status: 'terbit', visits: 1180 + Math.floor(r() * 300), createdAt: new Date(now - 18 * DAY).toISOString() },
      { id: 'mp2', productId: 'cp4', title: 'Kopi Susu Gula Aren 1 liter', slug: 'kopi-susu-aren', template: 'Makanan', status: 'terbit', visits: 640 + Math.floor(r() * 200), createdAt: new Date(now - 9 * DAY).toISOString() },
    ];
    const myOrders = []; let mseq = 0;
    for (let d = 16; d >= 0; d--) {
      const n = r() < 0.35 ? 0 : 1 + Math.floor(r() * 2);
      for (let k = 0; k < n; k++) {
        const via = r() < 0.5 ? 'lp' : 'closer';
        const page = via === 'lp' ? pick(myPages) : null;
        const cp = page ? catalog.find((c) => c.id === page.productId) : pick(catalog);
        const qty = 1 + (r() < 0.25 ? 1 : 0); const city = pick(CITIES); const shipping = shippingFor(city);
        const payment = via === 'lp' ? pick(['QRIS', 'VA BCA', 'GoPay']) : (r() < 0.55 ? 'COD' : 'Transfer');
        let status = d >= 5 ? 'selesai' : d >= 2 ? 'dikirim' : d === 1 ? 'diproses' : (payment === 'Transfer' ? 'menunggu' : 'diproses');
        if (d >= 5 && payment === 'COD' && r() < 0.12) status = 'gagal';
        const created = new Date(now - d * DAY); created.setHours(9 + Math.floor(r() * 11), Math.floor(r() * 60));
        if (created.getTime() > now) created.setTime(now - (k + 1) * 23 * 60000);
        const subtotal = cp.price * qty;
        myOrders.push({
          id: 'MTR' + dayKey(created).slice(2).replace(/-/g, '') + '-' + String(++mseq).padStart(3, '0'), createdAt: created.toISOString(),
          via, pageId: page ? page.id : null, productId: cp.id, name: cp.name, sellerId: cp.sellerId, qty, price: cp.price,
          buyer: pick(BUYERS), phone: '08' + String(1100000000 + Math.floor(r() * 8e8)), city, address: 'Jl. Contoh No. ' + (1 + Math.floor(r() * 120)) + ', ' + city,
          courier: pick(COURIERS), shipping, subtotal, total: subtotal + shipping, payment,
          commission: Math.round(subtotal * (via === 'lp' ? cp.creator : cp.closer) / 100), status,
          payCode: via === 'closer' && payment === 'Transfer' ? Math.random().toString(36).slice(2, 8).toUpperCase() : null,
        });
      }
    }
    myOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pLedger = myOrders.filter((o) => o.status === 'selesai').map((o) => ({ id: uid('pl'), at: new Date(new Date(o.createdAt).getTime() + 4 * DAY).toISOString(), type: 'komisi', label: 'Komisi ' + o.id + ' · ' + o.name, amount: o.commission, status: 'berhasil' }));
    const pEarned = pLedger.reduce((s, e) => s + e.amount, 0);
    if (pEarned > 100000) pLedger.push({ id: uid('pl'), at: new Date(now - 6 * DAY).toISOString(), type: 'penarikan', label: 'Tarik komisi ke BCA', amount: -Math.floor((pEarned * 0.5) / 50000) * 50000, status: 'berhasil' });
    pLedger.sort((a, b) => b.at.localeCompare(a.at));

    return {
      v: 2, products, orders, pages, ledger, partners,
      ads: { wallet: 285000, campaigns, stats: adStats, topups: [] },
      domains: [{ id: 'dm1', host, type: 'subdomain', step: 3, primary: true, createdAt: session.since || new Date(now - 60 * DAY).toISOString() }],
      settings: { desc: 'Produk pilihan dengan pengiriman cepat ke seluruh Indonesia.', wa: '0812-0000-0000', pay: { qris: true, va: true, ewallet: true, card: false, cod: true }, bank: { name: 'BCA', number: '1234567890', holder: session.name } },
      mitra: { code: partnerCode, level: 'Terverifikasi', codLimit: 10, catalog, pages: myPages, orders: myOrders, ledger: pLedger },
    };
  }
  function productById(id, list) { return (list || db.products).find((p) => p.id === id); }
  function saleEntries(o, at, partnerList) {
    const partner = o.partnerId && (partnerList || db.partners).find((p) => p.id === o.partnerId);
    return [
      { id: uid('l'), at, type: 'penjualan', label: 'Penjualan ' + o.id, amount: o.total, ref: o.id, status: 'berhasil' },
      { id: uid('l'), at, type: 'komisi', label: 'Komisi platform 3% · ' + o.id, amount: -Math.round(o.subtotal * COMMISSION), ref: o.id, status: 'berhasil' },
      ...(o.partnerFee ? [{ id: uid('l'), at, type: 'mitra', label: 'Komisi ' + (o.source === 'closer' ? 'closer' : 'kreator') + (partner ? ' ' + partner.name : '') + ' · ' + o.id, amount: -o.partnerFee, ref: o.id, status: 'berhasil' }] : []),
      ...(gatewayFee(o) ? [{ id: uid('l'), at, type: 'gateway', label: 'Biaya Midtrans (' + o.payment + ') · ' + o.id, amount: -gatewayFee(o), ref: o.id, status: 'berhasil' }] : []),
    ];
  }

  /* ---------------------------------------------------------------
     STATE
     --------------------------------------------------------------- */
  const DATA_KEY = 'tokora-demo-data:' + (session.email || 'demo');
  let db;
  try { db = JSON.parse(localStorage.getItem(DATA_KEY) || 'null'); } catch (e) { db = null; }
  if (!db || db.v !== 2) db = seedData();
  const save = () => { try { localStorage.setItem(DATA_KEY, JSON.stringify(db)); } catch (e) {} };
  save();
  let mode = session.mode || (session.role === 'mitra' ? 'mitra' : 'seller');

  const balance = () => db.ledger.filter((e) => e.status !== 'gagal').reduce((s, e) => s + e.amount, 0);
  const onHold = () => db.orders.filter((o) => ['dibayar', 'diproses', 'dikirim'].includes(o.status)).reduce((s, o) => s + o.total, 0);
  const primaryHost = () => (db.domains.find((d) => d.primary) || db.domains[0]).host;
  const partnerById = (id) => db.partners.find((p) => p.id === id);
  const thumbColor = (s) => ['#A3E635', '#BEF264', '#DCE3F2', '#8FA6D9', '#D9F99D', '#FBCFE8'][hash(s) % 6];
  const M = () => db.mitra;
  const catById = (id) => M().catalog.find((c) => c.id === id);
  const sellerOf = (id) => OTHER_SELLERS.find((s) => s.id === id) || { name: '—' };
  const mBalance = () => M().ledger.reduce((s, e) => s + e.amount, 0);
  const mHeld = () => M().orders.filter((o) => ['diproses', 'dikirim'].includes(o.status)).reduce((s, o) => s + o.commission, 0);
  const refLink = (cp) => 'tokora.id/p/' + cp.id + '?ref=' + M().code;
  const pageLink = (p) => 'tokora.id/k/' + M().code.toLowerCase() + '/' + p.slug;

  /* ---------------------------------------------------------------
     UI HELPERS
     --------------------------------------------------------------- */
  function toast(msg) {
    const box = $('[data-toasts]'); const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = ICON.check + '<span>' + esc(msg) + '</span>';
    box.appendChild(t); setTimeout(() => t.remove(), 3400);
  }
  const dlg = $('[data-dlg]'); const dlgBox = $('[data-dlg-box]'); let lastFocus = null;
  function openDialog(html, onMount, wide) {
    lastFocus = document.activeElement;
    dlgBox.classList.toggle('dlg__box--wide', !!wide);
    dlgBox.innerHTML = '<button class="icon-btn dlg__close" type="button" data-dlg-close aria-label="Tutup">' + ICON.close + '</button>' + html;
    dlg.classList.add('is-open'); dlg.setAttribute('aria-hidden', 'false');
    if (onMount) onMount(dlgBox);
    const first = $('input:not([type=radio]), select, textarea', dlgBox) || $('[data-dlg-close]', dlgBox);
    first && first.focus();
  }
  function closeDialog() { dlg.classList.remove('is-open'); dlg.setAttribute('aria-hidden', 'true'); dlgBox.innerHTML = ''; lastFocus && lastFocus.focus && lastFocus.focus(); }
  dlg.addEventListener('click', (e) => { if (e.target.closest('[data-dlg-close]')) closeDialog(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dlg.classList.contains('is-open')) closeDialog(); });
  function confirmDialog(title, text, okLabel, onOk, danger) {
    openDialog('<h3>' + esc(title) + '</h3><p>' + text + '</p><div class="dlg__actions"><button class="btn btn--outline btn--sm" type="button" data-dlg-close>Batal</button><button class="btn btn--sm ' + (danger ? 'btn--danger' : 'btn--primary') + '" type="button" data-ok>' + esc(okLabel) + '</button></div>',
      (box) => $('[data-ok]', box).addEventListener('click', () => { closeDialog(); onOk(); }));
  }
  const stBadge = (s, label) => '<span class="st st--' + s + '">' + esc(label || STATUS[s] || s) + '</span>';
  const chanBadge = (c) => '<span class="chan"><i style="background:' + CHANNELS[c].color + '"></i>' + CHANNELS[c].label + '</span>';
  const srcBadge = (o) => { const p = o.partnerId && partnerById(o.partnerId); return '<span class="src src--' + o.source + '">' + SOURCES[o.source] + (p ? ' · ' + esc(shortName(p.name)) : '') + '</span>'; };
  const field = (id, label, input, hint, err) => '<div class="field" data-field="' + id + '"><label for="' + id + '">' + label + '</label>' + input + (hint ? '<span class="field__hint">' + hint + '</span>' : '') + (err ? '<span class="field__error">' + err + '</span>' : '') + '</div>';
  const tile = (icon, label, value, note) => `<div class="tile"><span class="tile__label">${icon} ${label}</span><span class="tile__value">${value}</span><span class="tile__note">${note}</span></div>`;
  const copyText = (text, okMsg) => (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(okMsg), () => toast(text));

  /* ---------------------------------------------------------------
     SHELL
     --------------------------------------------------------------- */
  const NAV = {
    seller: [['ringkasan', 'Ringkasan'], ['pesanan', 'Pesanan'], ['produk', 'Produk'], ['landing', 'Landing Page'], ['domain', 'Domain'], ['mitra', 'Mitra'], ['iklan', 'Iklan'], ['saldo', 'Saldo'], ['pengaturan', 'Pengaturan']],
    mitra: [['m-ringkasan', 'Ringkasan'], ['m-katalog', 'Katalog Affiliate'], ['m-lp', 'Landing Page Saya'], ['m-buat', 'Buat Pesanan'], ['m-pesanan', 'Pesanan Mitra'], ['m-komisi', 'Komisi'], ['pengaturan', 'Pengaturan']],
  };
  const TITLES = Object.fromEntries([...NAV.seller, ...NAV.mitra]);
  TITLES['m-ringkasan'] = 'Ringkasan Mitra';
  const iconFor = (key) => NAV_ICON[key.replace('m-', '')] || NAV_ICON.ringkasan;

  function renderShell() {
    const nav = $('[data-nav-list]');
    nav.innerHTML = NAV[mode].map(([k, l]) => `<a class="side__link" href="#${k}" data-nav="${k}">${iconFor(k)}${l}${k === 'pesanan' ? '<span class="side__count" data-count-orders hidden>0</span>' : ''}${k === 'm-pesanan' ? '<span class="side__count" data-count-morders hidden>0</span>' : ''}</a>`).join('');
    $$('[data-mode]').forEach((b) => { b.classList.toggle('is-active', b.dataset.mode === mode); b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
    if (mode === 'seller') {
      $('[data-store-name]').textContent = session.store; $('[data-store-host]').textContent = primaryHost(); $('[data-store-initial]').textContent = initials(session.store);
      $('[data-plan]').innerHTML = '<b>Paket Pro</b>Komisi 3% · 5 landing page · custom domain';
    } else {
      $('[data-store-name]').textContent = session.name; $('[data-store-host]').textContent = 'Kode mitra ' + M().code; $('[data-store-initial]').textContent = initials(session.name);
      $('[data-plan]').innerHTML = '<b>Mitra ' + esc(M().level) + '</b>Kreator LP dan closer · limit COD ' + M().codLimit + '/hari';
    }
    $('[data-user-name]').textContent = firstName(session.name);
    $('[data-user-initial]').textContent = initials(session.name);
    $('[data-user-email]').textContent = session.email;
    const pending = db.orders.filter((o) => o.status === 'dibayar').length;
    const c = $('[data-count-orders]'); if (c) { c.textContent = pending; c.hidden = pending === 0; }
    const waiting = M().orders.filter((o) => o.status === 'menunggu').length;
    const c2 = $('[data-count-morders]'); if (c2) { c2.textContent = waiting; c2.hidden = waiting === 0; }
    $$('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.getAttribute('data-nav') === current));
  }
  const side = $('[data-side]'); const sideBd = $('[data-side-backdrop]');
  const setSide = (open) => { side.classList.toggle('is-open', open); sideBd.classList.toggle('is-open', open); };
  $('[data-menu]').addEventListener('click', () => setSide(true));
  sideBd.addEventListener('click', () => setSide(false));
  const userBtn = $('[data-user-btn]'); const userMenu = $('[data-user-menu]');
  userBtn.addEventListener('click', (e) => { e.stopPropagation(); const o = !userMenu.classList.contains('is-open'); userMenu.classList.toggle('is-open', o); userBtn.setAttribute('aria-expanded', String(o)); });
  document.addEventListener('click', () => { userMenu.classList.remove('is-open'); userBtn.setAttribute('aria-expanded', 'false'); });
  $$('[data-logout]').forEach((b) => b.addEventListener('click', () => { TokoraSession.clear(); location.href = 'login.html'; }));
  $('[data-theme-toggle]').addEventListener('click', () => {
    const t = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('tokora-theme', t); } catch (e) {}
    if (current === 'ringkasan' || current === 'm-ringkasan') VIEWS[current]();
  });
  function setMode(m, go) {
    mode = m; session.mode = m; TokoraSession.update({ mode: m });
    if (go !== false) location.hash = m === 'mitra' ? 'm-ringkasan' : 'ringkasan';
  }
  $$('[data-mode]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.mode !== mode) setMode(b.dataset.mode); }));

  /* ---------------------------------------------------------------
     ROUTER
     --------------------------------------------------------------- */
  const view = $('[data-view]');
  let current = null; let cleanup = null;
  function route() {
    const name = location.hash.replace('#', '');
    const key = TITLES[name] ? name : (mode === 'mitra' ? 'm-ringkasan' : 'ringkasan');
    if (key.startsWith('m-') && mode !== 'mitra') { mode = 'mitra'; TokoraSession.update({ mode }); }
    if (!key.startsWith('m-') && key !== 'pengaturan' && mode !== 'seller') { mode = 'seller'; TokoraSession.update({ mode }); }
    if (cleanup) { cleanup(); cleanup = null; }
    current = key;
    $('[data-title]').textContent = TITLES[key];
    document.title = TITLES[key] + ' — Dasbor Tokora';
    setSide(false); renderShell(); VIEWS[key](); window.scrollTo(0, 0);
  }
  const rerender = () => { renderShell(); VIEWS[current](); };
  window.addEventListener('hashchange', route);

  /* ---------------------------------------------------------------
     GRAFIK BATANG (bertumpuk) — dipakai seller & mitra
     2px celah antar segmen, ujung data membulat 4px, tooltip per kolom
     --------------------------------------------------------------- */
  function drawBars(box, rows, series, opts = {}) {
    const W = Math.max(box.clientWidth, 280), H = opts.height || 250;
    const m = { t: 10, r: 8, b: 30, l: 62 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const maxV = Math.max(1, ...rows.map((r) => series.reduce((s, x) => s + (r[x.key] || 0), 0)));
    const step = (() => { const raw = maxV / 4; const p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; })();
    const top = step * 4; const y = (v) => m.t + ih - (v / top) * ih;
    const band = iw / rows.length; const bw = Math.min(30, band * 0.62); const every = band < 44 ? 2 : 1;
    let s = `<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="${esc(opts.label || 'Grafik batang')}">`;
    for (let i = 0; i <= 4; i++) { const v = step * i; const yy = y(v); s += `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${m.l - 10}" y="${yy + 4}" text-anchor="end">${i === 0 ? '0' : rpShort(v).replace('Rp ', '')}</text>`; }
    rows.forEach((r, i) => {
      const cx = m.l + band * i + band / 2; const x = cx - bw / 2; const total = series.reduce((a, sr) => a + (r[sr.key] || 0), 0);
      s += `<rect class="hit" data-i="${i}" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}" rx="6" tabindex="0" aria-label="${r.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}: ${rp(total)}"/>`;
      let base = y(0); const segs = series.filter((sr) => r[sr.key] > 0);
      segs.forEach((sr, k) => {
        const h = (r[sr.key] / top) * ih; const gap = k > 0 ? 2 : 0; const y1 = base - h; const hh = Math.max(h - gap, 0.5);
        if (k === segs.length - 1) { const rr = Math.min(4, hh, bw / 2); s += `<path pointer-events="none" style="fill:${sr.color}" d="M${x} ${y1 + hh}V${y1 + rr}Q${x} ${y1} ${x + rr} ${y1}H${x + bw - rr}Q${x + bw} ${y1} ${x + bw} ${y1 + rr}V${y1 + hh}Z"/>`; }
        else s += `<rect pointer-events="none" x="${x}" y="${y1}" width="${bw}" height="${hh}" style="fill:${sr.color}"/>`;
        base = y1;
      });
      if (i % every === (rows.length - 1) % every) s += `<text class="axis-label" x="${cx}" y="${H - 8}" text-anchor="middle">${r.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</text>`;
    });
    s += '</svg><div class="tip" data-tip></div>';
    box.innerHTML = s;
    const tip = $('[data-tip]', box);
    const show = (el) => {
      const r = rows[+el.dataset.i]; const total = series.reduce((a, sr) => a + (r[sr.key] || 0), 0);
      tip.innerHTML = `<div class="tip__title">${r.date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</div>` +
        (series.length > 1 ? series.slice().reverse().map((sr) => `<div class="tip__row"><span><i style="background:${sr.color}"></i>${sr.label}</span><b>${rp(r[sr.key] || 0)}</b></div>`).join('') + `<div class="tip__row tip__total"><span>Total</span><b>${rp(total)}</b></div>`
          : `<div class="tip__row"><span>${series[0].label}</span><b>${rp(total)}</b></div>`);
      tip.classList.add('is-on');
      const bx = box.getBoundingClientRect(); const ex = el.getBoundingClientRect();
      let left = ex.left - bx.left + ex.width / 2 + 12; if (left + tip.offsetWidth > bx.width) left = ex.left - bx.left + ex.width / 2 - tip.offsetWidth - 12;
      tip.style.left = Math.max(0, left) + 'px'; tip.style.top = '8px';
      $$('.hit', box).forEach((h) => h.classList.toggle('is-hover', h === el));
    };
    const hide = () => { tip.classList.remove('is-on'); $$('.hit', box).forEach((h) => h.classList.remove('is-hover')); };
    $$('.hit', box).forEach((h) => { h.addEventListener('mouseenter', () => show(h)); h.addEventListener('focus', () => show(h)); h.addEventListener('mouseleave', hide); h.addEventListener('blur', hide); });
  }
  function barsAsTable(box, rows, series) {
    box.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr><th>Tanggal</th>${series.map((s) => `<th class="num">${s.label}</th>`).join('')}${series.length > 1 ? '<th class="num">Total</th>' : ''}</tr></thead><tbody>
      ${rows.slice().reverse().map((r) => `<tr><td>${r.date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</td>${series.map((s) => `<td class="num">${r[s.key] ? rp(r[s.key]) : '—'}</td>`).join('')}${series.length > 1 ? `<td class="num strong">${rp(series.reduce((a, s) => a + (r[s.key] || 0), 0))}</td>` : ''}</tr>`).join('')}</tbody></table></div>`;
  }
  function daysRows(days, fill) {
    const rows = []; const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) { const d = new Date(today.getTime() - i * DAY); const row = { key: dayKey(d), date: d }; fill(row); rows.push(row); }
    return rows;
  }
  function mountChart(box, rowsFn, series, opts, asTable) {
    const draw = () => (asTable ? barsAsTable(box, rowsFn(), series) : drawBars(box, rowsFn(), series, opts));
    draw(); let t = null; const onResize = () => { clearTimeout(t); t = setTimeout(draw, 150); };
    window.addEventListener('resize', onResize);
    cleanup = () => window.removeEventListener('resize', onResize);
  }

  /* =================================================================
     SELLER
     ================================================================= */
  let chartDays = 14; let chartTable = false;
  const sumRange = (from, to, pred) => db.orders.filter((o) => COUNTS_AS_SALE(o) && new Date(o.createdAt) >= from && new Date(o.createdAt) < to && (!pred || pred(o))).reduce((s, o) => s + o.total, 0);

  function viewRingkasan() {
    const today0 = new Date(); today0.setHours(0, 0, 0, 0); const tomorrow = new Date(today0.getTime() + DAY);
    const last7 = sumRange(new Date(tomorrow.getTime() - 7 * DAY), tomorrow);
    const prev7 = sumRange(new Date(tomorrow.getTime() - 14 * DAY), new Date(tomorrow.getTime() - 7 * DAY));
    const delta = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;
    const pending = db.orders.filter((o) => o.status === 'dibayar');
    const low = db.products.filter((p) => p.active && p.stock <= 5);
    const recent = db.orders.slice(0, 6);
    const pages = db.pages.filter((p) => p.status === 'terbit');
    const from30 = new Date(tomorrow.getTime() - 30 * DAY);
    const bySource = [['Toko dan LP sendiri', (o) => o.source === 'toko' || o.source === 'lp_seller'], ['Kreator LP', (o) => o.source === 'kreator'], ['Closer (bantu CO)', (o) => o.source === 'closer'], ['Iklan', (o) => o.source === 'iklan']].map(([l, f]) => [l, sumRange(from30, tomorrow, f)]);
    const srcTotal = bySource.reduce((s, x) => s + x[1], 0) || 1;
    const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    view.innerHTML = `
      <div class="view__head"><div><h1>Halo, ${esc(firstName(session.name))}</h1><p>Ringkasan ${esc(session.store)} · ${todayStr}</p></div>
        <button class="btn btn--primary btn--sm" type="button" data-new-product>${ICON.plus} Tambah produk</button></div>
      <div class="demo-note">${ICON.info}<span>Ini dasbor demo. Data contoh dibuat otomatis dan tersimpan di browser ini. Ganti ke mode <b>Mitra</b> di sidebar untuk melihat sisi kreator dan closer.</span></div>
      <div class="stats-row">
        ${tile(ICON.trend, 'Penjualan 7 hari', rpShort(last7), (delta >= 0 ? '▲ ' : '▼ ') + Math.abs(delta) + '% dari 7 hari sebelumnya')}
        ${tile(ICON.cart, 'Perlu diproses', pending.length + ' pesanan', pending.length ? 'Proses dalam 1×24 jam' : 'Semua pesanan sudah diproses')}
        ${tile(ICON.wallet, 'Saldo tersedia', rpShort(balance()), rpShort(onHold()) + ' masih tertahan')}
        ${tile(ICON.box, 'Stok menipis', low.length + ' produk', 'Stok 5 atau kurang')}
      </div>
      <div class="grid-2">
        <section class="card" aria-labelledby="ch-title">
          <div class="card__head"><div><h2 id="ch-title">Penjualan per kanal</h2><p>Nilai pesanan dibayar (termasuk ongkir), per hari</p></div>
            <div class="toolbar"><div class="seg" role="group" aria-label="Rentang waktu"><button type="button" data-days="7">7 hari</button><button type="button" data-days="14">14 hari</button></div>
            <button class="link-btn" type="button" data-chart-table>${chartTable ? 'Lihat grafik' : 'Lihat tabel'}</button></div></div>
          <div class="legend" data-legend></div><div class="chart" data-chart></div>
        </section>
        <section class="card">
          <div class="card__head"><h2>Pesanan terbaru</h2><a class="link-btn" href="#pesanan">Semua pesanan</a></div>
          <div class="mini-list">${recent.map((o) => `
            <a class="mini-item" href="#pesanan" data-open-order="${o.id}"><div class="mini-item__main"><b>${esc(o.buyer)}</b><small>${o.id} · ${SOURCES[o.source]}</small></div>
              <div class="mini-item__end"><div>${rp(o.total)}</div>${stBadge(o.status)}</div></a>`).join('')}</div>
        </section>
      </div>
      <div class="grid-2">
        <section class="card">
          <div class="card__head"><div><h2>Sumber pesanan</h2><p>Nilai pesanan 30 hari terakhir, per sumber</p></div><a class="link-btn" href="#mitra">Lihat mitra</a></div>
          <div class="share">${bySource.map(([l, v]) => `<div class="share__row"><div class="share__top"><span>${l}</span><b>${rpShort(v)} · ${pct(v / srcTotal, 0)}</b></div><div class="share__bar"><i style="width:${(v / srcTotal) * 100}%;background:var(--c-navy-600)"></i></div></div>`).join('')}</div>
        </section>
        <section class="card">
          <div class="card__head"><h2>Stok menipis</h2><a class="link-btn" href="#produk">Semua produk</a></div>
          <div class="mini-list">${low.length ? low.map((p) => `<div class="mini-item"><span class="thumb" style="background:${thumbColor(p.name)}">${esc(initials(p.name))}</span><div class="mini-item__main"><b>${esc(p.name)}</b><small>${esc(p.sku)}</small></div><div class="mini-item__end"><span class="stock-low">${p.stock ? 'Sisa ' + p.stock : 'Habis'}</span><div><button class="link-btn" type="button" data-edit-product="${p.id}">Ubah stok</button></div></div></div>`).join('') : '<p class="empty">Semua stok aman.</p>'}</div>
        </section>
      </div>
      <section class="card">
        <div class="card__head"><div><h2>Landing page</h2><p>Kunjungan dan pesanan per halaman yang terbit</p></div><a class="link-btn" href="#landing">Kelola</a></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Halaman</th><th class="num">Kunjungan</th><th class="num">Pesanan</th><th class="num">Konversi</th></tr></thead><tbody>
        ${pages.map((p) => { const n = db.orders.filter((o) => o.pageId === p.id && COUNTS_AS_SALE(o)).length; return `<tr><td><span class="strong">${esc(p.title)}</span><div class="muted">${esc(primaryHost() + p.path)}</div></td><td class="num">${num(p.visits)}</td><td class="num">${n}</td><td class="num">${p.visits ? pct(n / p.visits) : '—'}</td></tr>`; }).join('') || '<tr><td colspan="4" class="empty">Belum ada halaman yang terbit.</td></tr>'}
        </tbody></table></div>
      </section>`;

    $$('[data-days]', view).forEach((b) => { b.classList.toggle('is-active', +b.dataset.days === chartDays); b.addEventListener('click', () => { chartDays = +b.dataset.days; viewRingkasan(); }); });
    $('[data-chart-table]', view).addEventListener('click', () => { chartTable = !chartTable; viewRingkasan(); });
    $$('[data-open-order]', view).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); orderDetail(a.dataset.openOrder); }));
    $$('[data-edit-product]', view).forEach((b) => b.addEventListener('click', () => productForm(b.dataset.editProduct)));
    $('[data-new-product]', view).addEventListener('click', () => productForm(null));

    const series = CH_ORDER.map((c) => ({ key: c, label: CHANNELS[c].label, color: CHANNELS[c].color }));
    const rowsFn = () => daysRows(chartDays, (row) => { CH_ORDER.forEach((c) => { row[c] = 0; }); db.orders.forEach((o) => { if (COUNTS_AS_SALE(o) && dayKey(o.createdAt) === row.key) row[o.channel] += o.total; }); });
    const rows = rowsFn();
    $('[data-legend]', view).innerHTML = series.map((s) => `<span class="legend__item"><i style="background:${s.color}"></i>${s.label} <b>${rpShort(rows.reduce((a, r) => a + r[s.key], 0))}</b></span>`).join('');
    mountChart($('[data-chart]', view), rowsFn, series, { label: 'Grafik batang penjualan per kanal, ' + chartDays + ' hari terakhir' }, chartTable);
  }

  /* ---------- PESANAN (seller) ---------- */
  const orderFilter = { status: 'semua', source: 'semua', q: '' };
  function viewPesanan() {
    const counts = Object.keys(STATUS).reduce((a, k) => { a[k] = db.orders.filter((o) => o.status === k).length; return a; }, {});
    const chips = [['semua', 'Semua', db.orders.length], ...Object.keys(STATUS).filter((k) => counts[k]).map((k) => [k, STATUS[k], counts[k]])];
    view.innerHTML = `
      <div class="view__head"><div><h1>Pesanan</h1><p>${db.orders.length} pesanan dari semua kanal dan mitra · klik baris untuk detail</p></div></div>
      <div class="chips" role="group" aria-label="Filter status">${chips.map(([k, l, n]) => `<button type="button" class="chip${orderFilter.status === k ? ' is-active' : ''}" data-status="${k}">${l}<b>${n}</b></button>`).join('')}</div>
      <div class="toolbar">
        <label class="search">${ICON.search}<input class="input" type="search" placeholder="Cari nomor pesanan atau nama pembeli" value="${esc(orderFilter.q)}" data-q aria-label="Cari pesanan"></label>
        <select class="input" data-source aria-label="Filter sumber"><option value="semua">Semua sumber</option>${Object.keys(SOURCES).map((k) => `<option value="${k}"${orderFilter.source === k ? ' selected' : ''}>${SOURCES[k]}</option>`).join('')}</select>
      </div>
      <section class="card card--flush"><div class="table-wrap"><table class="table"><thead><tr><th>Pesanan</th><th>Pembeli</th><th>Kanal</th><th>Sumber</th><th class="num">Total</th><th>Status</th><th class="num">Aksi</th></tr></thead><tbody data-rows></tbody></table></div></section>`;
    const drawRows = () => {
      const q = orderFilter.q.toLowerCase();
      const list = db.orders.filter((o) => (orderFilter.status === 'semua' || o.status === orderFilter.status) && (orderFilter.source === 'semua' || o.source === orderFilter.source) && (!q || o.id.toLowerCase().includes(q) || o.buyer.toLowerCase().includes(q)));
      $('[data-rows]', view).innerHTML = list.length ? list.map((o) => `
        <tr class="is-click" data-order="${o.id}"><td><span class="strong">${o.id}</span><div class="muted">${fmtDateTime(o.createdAt)}</div></td>
        <td>${esc(o.buyer)}<div class="muted">${esc(o.city)}</div></td><td>${chanBadge(o.channel)}</td><td>${srcBadge(o)}</td><td class="num">${rp(o.total)}${o.partnerFee ? `<div class="muted">komisi ${rp(o.partnerFee)}</div>` : ''}</td><td>${stBadge(o.status)}</td>
        <td class="num">${orderAction(o)}</td></tr>`).join('') : '<tr><td colspan="7" class="empty">Tidak ada pesanan yang cocok dengan filter.</td></tr>';
    };
    drawRows();
    $$('[data-status]', view).forEach((b) => b.addEventListener('click', () => { orderFilter.status = b.dataset.status; viewPesanan(); }));
    $('[data-source]', view).addEventListener('change', (e) => { orderFilter.source = e.target.value; drawRows(); });
    $('[data-q]', view).addEventListener('input', (e) => { orderFilter.q = e.target.value; drawRows(); });
    $('[data-rows]', view).addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]'); const row = e.target.closest('[data-order]'); if (!row) return;
      if (act) { e.stopPropagation(); runOrderAction(row.dataset.order, act.dataset.act); } else orderDetail(row.dataset.order);
    });
  }
  function orderAction(o) {
    const b = (act, label, primary) => `<button type="button" class="btn btn--xs ${primary ? 'btn--primary' : 'btn--outline'}" data-act="${act}">${label}</button>`;
    return { dibayar: b('proses', 'Proses', true), diproses: b('kirim', 'Kirim', true), dikirim: b('selesai', 'Tandai selesai'), menunggu: b('batal', 'Batalkan') }[o.status] || '<span class="muted">—</span>';
  }
  function runOrderAction(id, act) {
    const o = db.orders.find((x) => x.id === id); if (!o) return;
    if (act === 'proses') { o.status = 'diproses'; save(); toast('Pesanan ' + o.id + ' sedang diproses'); rerender(); }
    else if (act === 'kirim') shipDialog(o);
    else if (act === 'selesai') confirmDialog('Tandai pesanan selesai?', 'Di aplikasi asli status ini berubah otomatis saat pembeli menerima paket. Dana <b>' + rp(o.total) + '</b> masuk ke saldo setelah dipotong komisi platform' + (o.partnerFee ? ', komisi mitra ' + rp(o.partnerFee) : '') + ', dan biaya Midtrans.', 'Tandai selesai', () => {
      o.status = 'selesai'; db.ledger.unshift(...saleEntries(o, new Date().toISOString())); save(); toast('Dana pesanan ' + o.id + ' masuk ke saldo'); rerender();
    });
    else if (act === 'batal') confirmDialog('Batalkan pesanan?', 'Pesanan <b>' + o.id + '</b> belum dibayar. Pembeli akan menerima notifikasi pembatalan.', 'Batalkan pesanan', () => { o.status = 'dibatalkan'; save(); toast('Pesanan ' + o.id + ' dibatalkan'); rerender(); }, true);
  }
  function shipDialog(o) {
    openDialog(`<h3>Kirim pesanan</h3><p>${o.id} · ${esc(o.buyer)}, ${esc(o.city)}</p>
      <form class="form-grid" data-ship novalidate>
        ${field('s-courier', 'Kurir', `<select class="input" id="s-courier">${COURIERS.map((c) => `<option>${c}</option>`).join('')}</select>`)}
        ${field('s-resi', 'Nomor resi', '<input class="input" id="s-resi" required minlength="6" placeholder="Contoh: JP1234567890">', null, 'Isi nomor resi (minimal 6 karakter).')}
        <div class="dlg__actions"><button class="btn btn--outline btn--sm" type="button" data-dlg-close>Batal</button><button class="btn btn--primary btn--sm" type="submit">Simpan dan kirim</button></div>
      </form>`, (box) => $('[data-ship]', box).addEventListener('submit', (e) => {
      e.preventDefault(); const inp = $('#s-resi', box); const ok = inp.value.trim().length >= 6;
      inp.closest('.field').classList.toggle('is-invalid', !ok); if (!ok) return;
      o.courier = $('#s-courier', box).value; o.resi = inp.value.trim().toUpperCase(); o.status = 'dikirim';
      save(); closeDialog(); toast('Resi tersimpan, pembeli sudah diberi tahu'); rerender();
    }));
  }
  function orderDetail(id) {
    const o = db.orders.find((x) => x.id === id); if (!o) return;
    const page = o.pageId && db.pages.find((p) => p.id === o.pageId); const partner = o.partnerId && partnerById(o.partnerId);
    const camp = o.adId && db.ads.campaigns.find((c) => c.id === o.adId);
    openDialog(`<h3>${o.id}</h3><div>${stBadge(o.status)}</div>
      <dl class="kv"><dt>Tanggal</dt><dd>${fmtDateTime(o.createdAt)}</dd><dt>Kanal</dt><dd>${CHANNELS[o.channel].label}${page ? ' · ' + esc(page.title) : ''}</dd>
      <dt>Sumber</dt><dd>${SOURCES[o.source]}${partner ? ' · ' + esc(partner.name) : ''}${camp ? ' · kampanye "' + esc(camp.name) + '"' : ''}</dd>
      <dt>Pembeli</dt><dd>${esc(o.buyer)} · ${esc(o.phone)}</dd><dt>Kota tujuan</dt><dd>${esc(o.city)}</dd><dt>Pembayaran</dt><dd>${esc(o.payment)}${o.payment === 'COD' ? '' : ' (Midtrans)'}</dd>
      ${o.resi ? `<dt>Pengiriman</dt><dd>${esc(o.courier)} · ${esc(o.resi)}</dd>` : ''}</dl>
      <div class="table-wrap"><table class="table"><thead><tr><th>Produk</th><th class="num">Jumlah</th><th class="num">Harga</th></tr></thead><tbody>
      ${o.items.map((it) => `<tr><td>${esc(it.name)}</td><td class="num">${it.qty}</td><td class="num">${rp(it.price * it.qty)}</td></tr>`).join('')}
      <tr><td colspan="2" class="muted">Ongkir</td><td class="num">${rp(o.shipping)}</td></tr><tr><td colspan="2" class="strong">Total</td><td class="num strong">${rp(o.total)}</td></tr>
      ${o.partnerFee ? `<tr><td colspan="2" class="muted">Komisi ${o.source === 'closer' ? 'closer' : 'kreator'} (dipotong dari hasil penjualan)</td><td class="num">−${rp(o.partnerFee)}</td></tr>` : ''}</tbody></table></div>
      <div class="dlg__actions"><button class="btn btn--outline btn--sm" type="button" data-dlg-close>Tutup</button>${orderAction(o).includes('data-act') ? orderAction(o).replace('btn--xs', 'btn--sm') : ''}</div>`,
    (box) => { const a = $('[data-act]', box); if (a) a.addEventListener('click', () => { closeDialog(); runOrderAction(o.id, a.dataset.act); }); });
  }

  /* ---------- PRODUK (seller) ---------- */
  const VIS = { semua: 'Semua kanal', marketplace: 'Marketplace saja', landing: 'Landing page & domain' };
  const prodFilter = { q: '', vis: 'semua-filter' };
  function viewProduk() {
    view.innerHTML = `
      <div class="view__head"><div><h1>Produk</h1><p>${db.products.length} produk · stok dipakai bersama oleh semua kanal dan mitra</p></div>
        <button class="btn btn--primary btn--sm" type="button" data-add>${ICON.plus} Tambah produk</button></div>
      <div class="toolbar"><label class="search">${ICON.search}<input class="input" type="search" placeholder="Cari nama atau SKU" value="${esc(prodFilter.q)}" data-q aria-label="Cari produk"></label>
        <select class="input" data-vis aria-label="Filter"><option value="semua-filter">Semua produk</option><option value="aff"${prodFilter.vis === 'aff' ? ' selected' : ''}>Ditawarkan ke mitra</option>${Object.keys(VIS).map((k) => `<option value="${k}"${prodFilter.vis === k ? ' selected' : ''}>${VIS[k]}</option>`).join('')}</select></div>
      <section class="card card--flush"><div class="table-wrap"><table class="table"><thead><tr><th>Produk</th><th class="num">Harga</th><th class="num">Stok</th><th class="num">Terjual</th><th>Komisi mitra</th><th>Aktif</th><th class="num">Aksi</th></tr></thead><tbody data-rows></tbody></table></div></section>`;
    const drawRows = () => {
      const q = prodFilter.q.toLowerCase();
      const list = db.products.filter((p) => (prodFilter.vis === 'semua-filter' || (prodFilter.vis === 'aff' ? p.aff.on : p.visibility === prodFilter.vis)) && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)));
      $('[data-rows]', view).innerHTML = list.length ? list.map((p) => `<tr data-id="${p.id}">
        <td><div class="prod"><span class="thumb" style="background:${thumbColor(p.name)}">${esc(initials(p.name))}</span><div><span class="strong">${esc(p.name)}</span><div class="muted">${esc(p.sku)} · ${VIS[p.visibility]}</div></div></div></td>
        <td class="num">${rp(p.price)}</td><td class="num${p.stock <= 5 ? ' stock-low' : ''}">${p.stock ? p.stock : 'Habis'}</td><td class="num">${p.sold}</td>
        <td>${p.aff.on ? `<span class="src src--kreator">Kreator ${p.aff.creator}%</span> <span class="src src--closer">Closer ${p.aff.closer}%</span>` : '<span class="muted">Tidak ditawarkan</span>'}</td>
        <td><button type="button" class="switch" role="switch" aria-checked="${p.active}" aria-label="Aktifkan ${esc(p.name)}" data-toggle></button></td>
        <td class="num"><div class="row-actions"><button class="icon-btn" type="button" data-edit aria-label="Ubah ${esc(p.name)}">${ICON.edit}</button><button class="icon-btn" type="button" data-del aria-label="Hapus ${esc(p.name)}">${ICON.trash}</button></div></td></tr>`).join('')
        : '<tr><td colspan="7" class="empty">Tidak ada produk yang cocok.</td></tr>';
    };
    drawRows();
    $('[data-add]', view).addEventListener('click', () => productForm(null));
    $('[data-q]', view).addEventListener('input', (e) => { prodFilter.q = e.target.value; drawRows(); });
    $('[data-vis]', view).addEventListener('change', (e) => { prodFilter.vis = e.target.value; drawRows(); });
    $('[data-rows]', view).addEventListener('click', (e) => {
      const row = e.target.closest('[data-id]'); if (!row) return; const p = productById(row.dataset.id);
      if (e.target.closest('[data-toggle]')) { p.active = !p.active; save(); toast(p.name + (p.active ? ' diaktifkan' : ' disembunyikan dari toko')); drawRows(); }
      else if (e.target.closest('[data-edit]')) productForm(p.id);
      else if (e.target.closest('[data-del]')) confirmDialog('Hapus produk?', '<b>' + esc(p.name) + '</b> akan hilang dari semua kanal, termasuk Katalog Affiliate dan landing page mitra. Riwayat pesanan tetap tersimpan.', 'Hapus produk', () => { db.products = db.products.filter((x) => x.id !== p.id); save(); toast('Produk dihapus'); rerender(); }, true);
    });
  }
  function productForm(id) {
    const p = id ? productById(id) : null; const aff = p ? p.aff : { on: false, creator: 10, closer: 8 };
    openDialog(`<h3>${p ? 'Ubah produk' : 'Tambah produk'}</h3>
      <form class="form-grid" data-pf novalidate>
        ${field('p-name', 'Nama produk', `<input class="input" id="p-name" required minlength="3" maxlength="80" value="${esc(p ? p.name : '')}" placeholder="Contoh: Serum Niacinamide 20ml">`, null, 'Nama minimal 3 karakter.')}
        <div class="form__row">
          ${field('p-price', 'Harga (Rp)', `<input class="input" id="p-price" type="number" min="1000" step="500" required value="${p ? p.price : ''}" placeholder="89000">`, null, 'Harga minimal Rp 1.000.')}
          ${field('p-stock', 'Stok', `<input class="input" id="p-stock" type="number" min="0" step="1" required value="${p ? p.stock : ''}" placeholder="50">`, null, 'Stok tidak boleh negatif.')}
        </div>
        <div class="form__row">
          ${field('p-sku', 'SKU', `<input class="input" id="p-sku" maxlength="30" value="${esc(p ? p.sku : 'SKU-' + (101 + db.products.length))}">`)}
          ${field('p-weight', 'Berat (gram)', `<input class="input" id="p-weight" type="number" min="1" step="1" value="${p ? p.weight : 250}">`, 'Dipakai untuk hitung ongkir')}
        </div>
        ${field('p-vis', 'Tampil di', `<select class="input" id="p-vis">${Object.keys(VIS).map((k) => `<option value="${k}"${p && p.visibility === k ? ' selected' : ''}>${VIS[k]}</option>`).join('')}</select>`)}
        <fieldset class="aff-box"><legend>Program affiliate</legend>
          <div class="toggle-row"><span>Tawarkan ke mitra<small>Produk tampil di Katalog Affiliate untuk kreator dan closer</small></span><button type="button" class="switch" role="switch" aria-checked="${aff.on}" aria-label="Tawarkan ke mitra" data-aff-on></button></div>
          <div class="form__row" data-aff-fields${aff.on ? '' : ' hidden'}>
            ${field('p-creator', 'Komisi kreator LP (%)', `<input class="input" id="p-creator" type="number" min="1" max="50" step="0.5" value="${aff.creator}">`, null, 'Isi 1–50%.')}
            ${field('p-closer', 'Komisi closer (%)', `<input class="input" id="p-closer" type="number" min="1" max="50" step="0.5" value="${aff.closer}">`, null, 'Isi 1–50%.')}
          </div>
          <p class="field__hint" data-aff-hint${aff.on ? '' : ' hidden'}></p>
        </fieldset>
        <div class="dlg__actions"><button class="btn btn--outline btn--sm" type="button" data-dlg-close>Batal</button><button class="btn btn--primary btn--sm" type="submit">${p ? 'Simpan perubahan' : 'Tambah produk'}</button></div>
      </form>`, (box) => {
      const sw = $('[data-aff-on]', box); const hint = $('[data-aff-hint]', box);
      const upd = () => { const price = +$('#p-price', box).value || 0; hint.textContent = price ? 'Per unit: kreator dapat ' + rp(price * (+$('#p-creator', box).value || 0) / 100) + ', closer dapat ' + rp(price * (+$('#p-closer', box).value || 0) / 100) + '. Dipotong dari hasil penjualanmu.' : 'Isi harga untuk melihat nominal komisi.'; };
      sw.addEventListener('click', () => { const on = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', String(on)); $('[data-aff-fields]', box).hidden = !on; hint.hidden = !on; });
      ['#p-price', '#p-creator', '#p-closer'].forEach((s) => $(s, box).addEventListener('input', upd)); upd();
      $('[data-pf]', box).addEventListener('submit', (e) => {
        e.preventDefault();
        const v = (sel) => $(sel, box).value.trim(); const affOn = sw.getAttribute('aria-checked') === 'true';
        const inRange = (x) => +x >= 1 && +x <= 50;
        const checks = [['p-name', v('#p-name').length >= 3], ['p-price', +v('#p-price') >= 1000], ['p-stock', v('#p-stock') !== '' && +v('#p-stock') >= 0 && Number.isInteger(+v('#p-stock'))], ['p-creator', !affOn || inRange(v('#p-creator'))], ['p-closer', !affOn || inRange(v('#p-closer'))]];
        let ok = true; checks.forEach(([fid, good]) => { $('[data-field="' + fid + '"]', box).classList.toggle('is-invalid', !good); if (!good) ok = false; });
        if (!ok) return;
        const data = { name: v('#p-name'), price: Math.round(+v('#p-price')), stock: +v('#p-stock'), sku: v('#p-sku') || 'SKU-' + Date.now().toString().slice(-4), weight: Math.max(1, +v('#p-weight') || 250), visibility: v('#p-vis'), aff: { on: affOn, creator: +v('#p-creator') || 10, closer: +v('#p-closer') || 8 } };
        if (p) Object.assign(p, data); else db.products.unshift(Object.assign({ id: uid('prd'), active: true, sold: 0, createdAt: new Date().toISOString() }, data));
        save(); closeDialog(); toast(p ? 'Produk diperbarui' : 'Produk ditambahkan ke semua kanal'); rerender();
      });
    });
  }

  /* ---------- LANDING PAGE (seller) ---------- */
  function viewLanding() {
    view.innerHTML = `
      <div class="view__head"><div><h1>Landing Page</h1><p>Halaman tokomu di ${esc(primaryHost())} · pembeli bisa checkout langsung di halaman</p></div>
        <button class="btn btn--primary btn--sm" type="button" data-add>${ICON.plus} Buat halaman</button></div>
      <div class="demo-note">${ICON.info}<span>Editor visual (page builder drag-and-drop) belum termasuk di demo ini. Di sini kamu bisa membuat, menerbitkan, dan mengelola halaman.</span></div>
      <div class="pages">${db.pages.map((p) => { const n = db.orders.filter((o) => o.pageId === p.id && COUNTS_AS_SALE(o)).length; return `
        <article class="card page-card" data-id="${p.id}">
          <div class="page-card__preview" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="page-card__title"><b>${esc(p.title)}</b>${stBadge(p.status, p.status === 'terbit' ? 'Terbit' : 'Draf')}</div>
          <div class="page-card__url">${esc(primaryHost() + p.path)} · template ${esc(p.template)}</div>
          <div class="page-card__stats"><span><b>${num(p.visits)}</b>Kunjungan</span><span><b>${n}</b>Pesanan</span><span><b>${p.visits ? pct(n / p.visits) : '—'}</b>Konversi</span></div>
          <div class="page-card__actions">
            <button class="btn btn--xs ${p.status === 'terbit' ? 'btn--outline' : 'btn--primary'}" type="button" data-pub>${p.status === 'terbit' ? 'Jadikan draf' : 'Terbitkan'}</button>
            <button class="btn btn--xs btn--outline" type="button" data-copy>${ICON.link} Salin tautan</button>
            ${p.path !== '/' ? '<button class="btn btn--xs btn--outline" type="button" data-del>Hapus</button>' : ''}
          </div></article>`; }).join('')}</div>`;
    $('[data-add]', view).addEventListener('click', () => pageForm('seller'));
    $('.pages', view).addEventListener('click', (e) => {
      const card = e.target.closest('[data-id]'); if (!card) return; const p = db.pages.find((x) => x.id === card.dataset.id);
      if (e.target.closest('[data-pub]')) { p.status = p.status === 'terbit' ? 'draf' : 'terbit'; p.updatedAt = new Date().toISOString(); save(); toast(p.status === 'terbit' ? 'Halaman terbit di ' + primaryHost() + p.path : 'Halaman dijadikan draf'); viewLanding(); }
      else if (e.target.closest('[data-copy]')) copyText('https://' + primaryHost() + p.path, 'Tautan disalin');
      else if (e.target.closest('[data-del]')) confirmDialog('Hapus halaman?', '<b>' + esc(p.title) + '</b> akan dihapus dan tautannya tidak bisa dibuka lagi.', 'Hapus halaman', () => { db.pages = db.pages.filter((x) => x.id !== p.id); save(); toast('Halaman dihapus'); viewLanding(); }, true);
    });
  }
  // dipakai seller (LP toko) dan mitra (LP kreator untuk produk seller lain)
  function pageForm(who, presetProduct) {
    const isMitra = who === 'mitra'; const offers = M().catalog;
    openDialog(`<h3>${isMitra ? 'Buat landing page kreator' : 'Buat landing page'}</h3><p>${isMitra ? 'Halaman dibuat untuk produk seller dari Katalog Affiliate. Harga dan stok selalu mengikuti data seller.' : 'Halaman baru disimpan sebagai draf. Terbitkan kapan saja.'}</p>
      <form class="form-grid" data-pgf novalidate>
        ${isMitra ? field('g-prod', 'Produk', `<select class="input" id="g-prod">${offers.map((c) => `<option value="${c.id}"${c.id === presetProduct ? ' selected' : ''}>${esc(c.name)} · ${esc(sellerOf(c.sellerId).name)} · komisi ${c.creator}%</option>`).join('')}</select>`) : ''}
        ${field('g-title', 'Judul halaman', '<input class="input" id="g-title" required minlength="3" maxlength="60" placeholder="Contoh: Promo Ramadan">', null, 'Judul minimal 3 karakter.')}
        ${field('g-path', 'Alamat halaman', `<input class="input" id="g-path" maxlength="40" placeholder="${isMitra ? 'serum-brightening' : '/promo-ramadan'}">`, isMitra ? 'Tautan: tokora.id/k/' + esc(M().code.toLowerCase()) + '/…' : 'Dibuat otomatis dari judul', 'Alamat sudah dipakai halaman lain.')}
        ${field('g-tpl', 'Template', `<select class="input" id="g-tpl">${TEMPLATES.map((t) => `<option${t === session.category ? ' selected' : ''}>${t}</option>`).join('')}</select>`)}
        ${isMitra ? '<p class="field__hint">Hindari klaim berlebihan (misalnya klaim kesehatan). Seller bisa menurunkan halaman yang tidak sesuai produk.</p>' : ''}
        <div class="dlg__actions"><button class="btn btn--outline btn--sm" type="button" data-dlg-close>Batal</button><button class="btn btn--primary btn--sm" type="submit">Buat halaman</button></div>
      </form>`, (box) => {
      const title = $('#g-title', box), path = $('#g-path', box); let touched = false;
      if (isMitra) { const setT = () => { if (!title.value || title.dataset.auto) { title.value = catById($('#g-prod', box).value).name; title.dataset.auto = '1'; if (!touched) path.value = slugify(title.value, 36); } }; setT(); $('#g-prod', box).addEventListener('change', () => { title.dataset.auto = '1'; title.value = ''; setT(); }); title.addEventListener('input', () => { delete title.dataset.auto; }); }
      title.addEventListener('input', () => { if (!touched) path.value = (isMitra ? '' : '/') + slugify(title.value, 36); });
      path.addEventListener('input', () => { touched = true; });
      $('[data-pgf]', box).addEventListener('submit', (e) => {
        e.preventDefault();
        const t = title.value.trim(); const slug = slugify(path.value || t, 36); const okT = t.length >= 3;
        const okP = !!slug && (isMitra ? !M().pages.some((p) => p.slug === slug) : !db.pages.some((p) => p.path === '/' + slug));
        $('[data-field="g-title"]', box).classList.toggle('is-invalid', !okT); $('[data-field="g-path"]', box).classList.toggle('is-invalid', okT && !okP);
        if (!okT || !okP) return;
        if (isMitra) M().pages.unshift({ id: uid('mp'), productId: $('#g-prod', box).value, title: t, slug, template: $('#g-tpl', box).value, status: 'draf', visits: 0, createdAt: new Date().toISOString() });
        else db.pages.push({ id: uid('pg'), title: t, path: '/' + slug, template: $('#g-tpl', box).value, status: 'draf', visits: 0, updatedAt: new Date().toISOString() });
        save(); closeDialog(); toast('Draf "' + t + '" dibuat');
        if (isMitra) { if (current !== 'm-lp') location.hash = 'm-lp'; else viewMLp(); } else viewLanding();
      });
    });
  }

  /* ---------- DOMAIN (seller) ---------- */
  const domainTimers = {};
  function advanceDomains() {
    db.domains.filter((d) => d.step < 3 && !domainTimers[d.id]).forEach((d) => {
      domainTimers[d.id] = setInterval(() => {
        d.step++; save();
        if (d.step >= 3) { clearInterval(domainTimers[d.id]); delete domainTimers[d.id]; toast(d.host + ' sudah live dengan SSL'); }
        if (current === 'domain') viewDomain();
      }, 2500);
    });
  }
  let domainQuery = '';
  function viewDomain() {
    const custom = db.domains.filter((d) => d.type !== 'subdomain');
    view.innerHTML = `
      <div class="view__head"><div><h1>Domain</h1><p>Domain utama dipakai untuk landing page dan checkout. Hosting dan SSL tetap dari Tokora.</p></div></div>
      <div class="grid-2">
        <section class="card">
          <div class="card__head"><h2>Beli domain baru</h2><p>Harga sewa per tahun (angka contoh)</p></div>
          <form class="dom-search" data-dsearch><input class="input" data-dq placeholder="namatoko" value="${esc(domainQuery)}" maxlength="40" aria-label="Nama domain" autocomplete="off"><button class="btn btn--primary btn--sm" type="submit">Cek</button></form>
          <div class="dom-results" data-dres></div>
        </section>
        <section class="card">
          <div class="card__head"><h2>Domain tokomu</h2></div>
          <div class="mini-list">${db.domains.map((d) => `
            <div class="mini-item" data-id="${d.id}"><div class="mini-item__main"><b>${esc(d.host)}</b><small>${d.type === 'subdomain' ? 'Subdomain gratis dari Tokora' : 'Dibeli lewat Tokora · berlaku s.d. ' + fmtDate(d.expiresAt)}</small>
              ${d.type !== 'subdomain' ? `<div class="steps-line">${DOMAIN_STEPS.map((s, i) => `<span class="${i <= d.step ? 'is-done' : ''}">${s}</span>`).join('<em>›</em>')}</div>` : ''}</div>
              <div class="mini-item__end">${d.primary ? stBadge('live', 'Utama') : d.step >= 3 ? '<button class="btn btn--xs btn--outline" type="button" data-primary>Jadikan utama</button>' : stBadge('proses', 'Menyiapkan…')}</div></div>`).join('')}</div>
          <p class="field__hint" style="margin-top:12px">${custom.length ? 'Alamat lain otomatis dialihkan (redirect 301) ke domain utama.' : 'Domain yang kamu beli terdaftar atas namamu. DNS dan SSL diatur otomatis.'}</p>
        </section>
      </div>`;
    const drawResults = () => {
      const name = slugify(domainQuery, 40); const box = $('[data-dres]', view);
      if (!name) { box.innerHTML = '<p class="field__hint">Ketik nama tokomu untuk melihat domain yang tersedia.</p>'; return; }
      box.innerHTML = DOMAIN_EXT.map((x) => {
        const host = name + x.ext; const owned = db.domains.some((d) => d.host === host);
        const taken = !owned && hash(host) % (x.ext === '.com' ? 2 : 7) === 0; // simulasi
        return `<div class="dom-row"><div><b>${esc(host)}</b>${x.note ? `<div class="field__hint">${x.note}</div>` : ''}</div>
          <div class="price">${owned ? 'Sudah milikmu' : taken ? '<span class="muted">Sudah dipakai</span>' : rp(x.price) + '<small>perpanjang ' + rp(x.renew) + '/thn</small>'}</div>
          ${!owned && !taken ? `<button class="btn btn--xs btn--primary" type="button" data-buy="${esc(host)}" data-price="${x.price}" data-renew="${x.renew}">Beli</button>` : ''}</div>`;
      }).join('');
    };
    drawResults();
    $('[data-dsearch]', view).addEventListener('submit', (e) => { e.preventDefault(); domainQuery = $('[data-dq]', view).value; drawResults(); });
    $('[data-dres]', view).addEventListener('click', (e) => { const b = e.target.closest('[data-buy]'); if (b) buyDomain(b.dataset.buy, +b.dataset.price, +b.dataset.renew); });
    $$('[data-primary]', view).forEach((b) => b.addEventListener('click', () => {
      const d = db.domains.find((x) => x.id === b.closest('[data-id]').dataset.id);
      db.domains.forEach((x) => { x.primary = x === d; }); save(); toast(d.host + ' sekarang jadi domain utama'); rerender();
    }));
  }
  function buyDomain(host, price, renew) {
    const bal = balance(); const enough = bal >= price;
    openDialog(`<h3>Beli ${esc(host)}</h3>
      <dl class="kv"><dt>Sewa tahun pertama</dt><dd>${rp(price)}</dd><dt>Perpanjangan</dt><dd>${rp(renew)} / tahun (otomatis)</dd><dt>Dibayar dari</dt><dd>Saldo toko (${rp(bal)})</dd><dt>Terdaftar atas nama</dt><dd>${esc(session.name)}</dd></dl>
      <p>Setelah dibayar, DNS diarahkan ke Tokora dan SSL diterbitkan otomatis.${enough ? '' : ' <b style="color:var(--st-cancel)">Saldo tidak cukup.</b>'}</p>
      <div class="dlg__actions"><button class="btn btn--outline btn--sm" type="button" data-dlg-close>Batal</button><button class="btn btn--primary btn--sm" type="button" data-ok${enough ? '' : ' disabled'}>Bayar ${rp(price)}</button></div>`,
    (box) => $('[data-ok]', box).addEventListener('click', () => {
      const now = new Date();
      db.domains.push({ id: uid('dm'), host, type: 'dibeli', step: 0, primary: false, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 365 * DAY).toISOString(), renew });
      db.ledger.unshift({ id: uid('l'), at: now.toISOString(), type: 'domain', label: 'Sewa domain ' + host + ' (1 tahun)', amount: -price, status: 'berhasil' });
      save(); closeDialog(); toast('Pembayaran berhasil, ' + host + ' sedang disiapkan'); advanceDomains(); viewDomain();
    }));
  }

  /* ---------- MITRA (sisi seller: siapa yang menjualkan produkmu) ---------- */
  function partnerStats(p, from) {
    const list = db.orders.filter((o) => o.partnerId === p.id && new Date(o.createdAt) >= from);
    const sale = list.filter(COUNTS_AS_SALE);
    const cod = list.filter((o) => o.payment === 'COD' && ['selesai', 'gagal'].includes(o.status));
    return { n: sale.length, gmv: sale.reduce((s, o) => s + o.total, 0), fee: sale.reduce((s, o) => s + o.partnerFee, 0), cod: cod.length ? cod.filter((o) => o.status === 'selesai').length / cod.length : null };
  }
  function viewMitra() {
    const from = new Date(Date.now() - 30 * DAY);
    const stats = db.partners.map((p) => Object.assign({ p }, partnerStats(p, from)));
    const gmvPartner = stats.reduce((s, x) => s + x.gmv, 0); const fee = stats.reduce((s, x) => s + x.fee, 0);
    const gmvAll = db.orders.filter((o) => COUNTS_AS_SALE(o) && new Date(o.createdAt) >= from).reduce((s, o) => s + o.total, 0) || 1;
    const affCount = db.products.filter((p) => p.aff.on).length;
    const TYPE = { kreator: 'Kreator LP', closer: 'Closer', keduanya: 'Kreator dan closer' };
    view.innerHTML = `
      <div class="view__head"><div><h1>Mitra</h1><p>Kreator dan closer yang menjualkan produkmu · ${affCount} produk ditawarkan di Katalog Affiliate</p></div>
        <a class="btn btn--outline btn--sm" href="#produk">Atur komisi produk</a></div>
      <div class="stats-row">
        ${tile(ICON.users, 'Mitra aktif', db.partners.filter((p) => p.status === 'aktif').length + ' orang', db.partners.length + ' mitra terdaftar')}
        ${tile(ICON.trend, 'Penjualan lewat mitra', rpShort(gmvPartner), '30 hari terakhir')}
        ${tile(ICON.wallet, 'Komisi mitra', rpShort(fee), 'Dipotong dari hasil penjualan')}
        ${tile(ICON.cart, 'Porsi dari mitra', pct(gmvPartner / gmvAll, 0), 'dari total penjualan 30 hari')}
      </div>
      <section class="card card--flush"><div class="card__head"><div><h2>Daftar mitra</h2><p>Rapor COD = % pesanan COD yang diterima pembeli</p></div></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Mitra</th><th>Peran</th><th class="num">Pesanan</th><th class="num">Penjualan</th><th class="num">Komisi</th><th class="num">Rapor COD</th><th>Status</th><th class="num">Aksi</th></tr></thead><tbody>
        ${stats.map(({ p, n, gmv, fee: f, cod }) => `<tr data-id="${p.id}"><td><div class="prod"><span class="ava">${esc(initials(p.name))}</span><div><span class="strong">${esc(p.name)}</span><div class="muted">bergabung ${fmtDate(p.joinedAt)}</div></div></div></td>
          <td class="muted">${TYPE[p.type]}</td><td class="num">${n}</td><td class="num">${rp(gmv)}</td><td class="num">${rp(f)}</td>
          <td class="num">${cod == null ? '—' : `<span class="${cod < 0.8 ? 'stock-low' : ''}">${pct(cod, 0)}</span>`}</td>
          <td>${stBadge(p.status === 'aktif' ? 'selesai' : p.status === 'dibatasi' ? 'dibayar' : 'dibatalkan', p.status === 'aktif' ? 'Aktif' : p.status === 'dibatasi' ? 'Dibatasi' : 'Dihentikan')}</td>
          <td class="num"><button class="btn btn--xs btn--outline" type="button" data-pact="${p.status === 'aktif' ? 'batasi' : 'aktifkan'}">${p.status === 'aktif' ? 'Batasi' : 'Aktifkan'}</button></td></tr>`).join('')}
        </tbody></table></div></section>
      <p class="field__hint">Mitra yang dibatasi tidak bisa membuat pesanan COD baru untuk produkmu. Landing page kreator yang klaimnya tidak sesuai bisa kamu turunkan dari detail mitra (segera).</p>`;
    $$('[data-pact]', view).forEach((b) => b.addEventListener('click', () => {
      const p = partnerById(b.closest('[data-id]').dataset.id);
      if (b.dataset.pact === 'batasi') confirmDialog('Batasi mitra?', '<b>' + esc(p.name) + '</b> tidak bisa membuat pesanan COD baru untuk produkmu sampai kamu mengaktifkannya lagi. Pesanan yang sudah berjalan tidak terpengaruh.', 'Batasi', () => { p.status = 'dibatasi'; save(); toast(p.name + ' dibatasi'); viewMitra(); }, true);
      else { p.status = 'aktif'; save(); toast(p.name + ' aktif kembali'); viewMitra(); }
    }));
  }

  /* ---------- IKLAN (seller) ---------- */
  function adTotals(c, days) {
    const from = dayKey(Date.now() - (days - 1) * DAY);
    const st = db.ads.stats.filter((s) => (!c || s.campaignId === c.id) && s.day >= from);
    const orders = db.orders.filter((o) => o.source === 'iklan' && (!c || o.adId === c.id) && COUNTS_AS_SALE(o) && dayKey(o.createdAt) >= from);
    const imp = st.reduce((s, x) => s + x.imp, 0), clk = st.reduce((s, x) => s + x.clk, 0), spend = st.reduce((s, x) => s + x.spend, 0), rev = orders.reduce((s, o) => s + o.total, 0);
    return { imp, clk, spend, rev, n: orders.length, ctr: imp ? clk / imp : 0, roas: spend ? rev / spend : 0 };
  }
  const AD_ST = { aktif: ['selesai', 'Aktif'], dijeda: ['menunggu', 'Dijeda'], ditinjau: ['dibayar', 'Ditinjau'], habis: ['dibatalkan', 'Saldo habis'] };
  function viewIklan() {
    const t7 = adTotals(null, 7);
    view.innerHTML = `
      <div class="view__head"><div><h1>Iklan</h1><p>Produk tampil berlabel "Iklan" di pencarian, kategori, dan beranda marketplace · bayar per klik</p></div>
        <div class="toolbar"><button class="btn btn--outline btn--sm" type="button" data-topup>Isi saldo iklan</button><button class="btn btn--primary btn--sm" type="button" data-new>${ICON.plus} Buat kampanye</button></div></div>
      <div class="stats-row">
        ${tile(ICON.wallet, 'Saldo iklan', rpShort(db.ads.wallet), 'Iklan berhenti otomatis saat habis')}
        ${tile(ICON.megaphone, 'Biaya 7 hari', rpShort(t7.spend), num(t7.clk) + ' klik · CTR ' + pct(t7.ctr))}
        ${tile(ICON.cart, 'Pesanan dari iklan', t7.n + ' pesanan', rpShort(t7.rev) + ' penjualan, 7 hari')}
        ${tile(ICON.trend, 'ROAS 7 hari', t7.roas.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '×', 'Penjualan ÷ biaya iklan')}
      </div>
      <section class="card card--flush"><div class="card__head"><div><h2>Kampanye</h2><p>Statistik 14 hari terakhir · harga per klik adalah angka contoh</p></div></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Kampanye</th><th class="num">Anggaran/hari</th><th class="num">Tawaran/klik</th><th class="num">Tayang</th><th class="num">Klik</th><th class="num">Pesanan</th><th class="num">Biaya</th><th class="num">ROAS</th><th>Status</th><th class="num">Aksi</th></tr></thead><tbody>
        ${db.ads.campaigns.map((c) => { const t = adTotals(c, 14); const [cls, lbl] = AD_ST[c.status]; return `<tr data-id="${c.id}"><td><span class="strong">${esc(c.name)}</span><div class="muted">${c.productIds.map((id) => esc((productById(id) || { name: '—' }).name)).join(', ')}</div></td>
          <td class="num">${rp(c.daily)}</td><td class="num">${rp(c.bid)}</td><td class="num">${num(t.imp)}</td><td class="num">${num(t.clk)}</td><td class="num">${t.n}</td><td class="num">${rp(t.spend)}</td><td class="num">${t.spend ? t.roas.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '×' : '—'}</td>
          <td>${stBadge(cls, lbl)}</td><td class="num">${c.status === 'ditinjau' ? '<span class="muted">—</span>' : `<button class="btn btn--xs btn--outline" type="button" data-toggle>${c.status === 'aktif' ? 'Jeda' : 'Aktifkan'}</button>`}</td></tr>`; }).join('') || '<tr><td colspan="10" class="empty">Belum ada kampanye.</td></tr>'}
        </tbody></table></div></section>
      <p class="field__hint">Klik tidak valid (bot, klik berulang dari perangkat yang sama) tidak ditagih. Iklan baru ditinjau tim Tokora sebelum tayang.</p>`;
    $('[data-new]', view).addEventListener('click', campaignForm);
    $('[data-topup]', view).addEventListener('click', topupDialog);
    $$('[data-toggle]', view).forEach((b) => b.addEventListener('click', () => {
      const c = db.ads.campaigns.find((x) => x.id === b.closest('[data-id]').dataset.id);
      if (c.status !== 'aktif' && db.ads.wallet < c.bid) { toast('Saldo iklan tidak cukup, isi saldo dulu'); return; }
      c.status = c.status === 'aktif' ? 'dijeda' : 'aktif'; save(); toast('Kampanye "' + c.name + '" ' + (c.status === 'aktif' ? 'aktif' : 'dijeda')); viewIklan();
    }));
  }
  function campaignForm() {
    const list = db.products.filter((p) => p.active && p.visibility !== 'landing');
    openDialog(`<h3>Buat kampanye iklan</h3><p>Produk tampil di posisi "Iklan" pada marketplace. Kamu hanya membayar saat iklan diklik.</p>
      <form class="form-grid" data-cf novalidate>
        ${field('c-name', 'Nama kampanye', '<input class="input" id="c-name" required minlength="3" maxlength="40" placeholder="Contoh: Promo gajian">', null, 'Nama minimal 3 karakter.')}
        <div class="field" data-field="c-prod"><span class="field__label">Produk yang diiklankan</span><div class="check-list">${list.map((p) => `<label class="check-item"><input type="checkbox" value="${p.id}"> <span>${esc(p.name)}</span><span class="muted">${rp(p.price)}</span></label>`).join('')}</div><span class="field__error">Pilih minimal 1 produk.</span></div>
        <div class="form__row">
          ${field('c-daily', 'Anggaran harian (Rp)', `<input class="input" id="c-daily" type="number" min="${AD_MIN_DAILY}" step="5000" value="30000">`, 'Minimal ' + rp(AD_MIN_DAILY), 'Minimal ' + rp(AD_MIN_DAILY) + '.')}
          ${field('c-bid', 'Tawaran per klik (Rp)', `<input class="input" id="c-bid" type="number" min="${AD_MIN_BID}" step="50" value="700">`, 'Minimal ' + rp(AD_MIN_BID), 'Minimal ' + rp(AD_MIN_BID) + '.')}
        </div>
        <p class="field__hint" data-est></p>
        <div class="dlg__actions"><button class="btn btn--outline btn--sm" type="button" data-dlg-close>Batal</button><button class="btn btn--primary btn--sm" type="submit">Ajukan kampanye</button></div>
      </form>`, (box) => {
      const est = () => { const d = +$('#c-daily', box).value || 0, b = +$('#c-bid', box).value || 1; $('[data-est]', box).textContent = 'Perkiraan maksimal ' + num(Math.floor(d / b)) + ' klik per hari.'; };
      ['#c-daily', '#c-bid'].forEach((s) => $(s, box).addEventListener('input', est)); est();
      $('[data-cf]', box).addEventListener('submit', (e) => {
        e.preventDefault();
        const ids = $$('.check-list input:checked', box).map((i) => i.value); const name = $('#c-name', box).value.trim(); const daily = +$('#c-daily', box).value; const bid = +$('#c-bid', box).value;
        const checks = [['c-name', name.length >= 3], ['c-prod', ids.length > 0], ['c-daily', daily >= AD_MIN_DAILY], ['c-bid', bid >= AD_MIN_BID]];
        let ok = true; checks.forEach(([f, g]) => { $('[data-field="' + f + '"]', box).classList.toggle('is-invalid', !g); if (!g) ok = false; }); if (!ok) return;
        const c = { id: uid('ad'), name, productIds: ids, daily: Math.round(daily), bid: Math.round(bid), status: 'ditinjau', createdAt: new Date().toISOString() };
        db.ads.campaigns.unshift(c); save(); closeDialog(); toast('Kampanye diajukan, sedang ditinjau'); viewIklan();
        setTimeout(() => { c.status = db.ads.wallet >= c.bid ? 'aktif' : 'habis'; save(); toast('Kampanye "' + c.name + '" ' + (c.status === 'aktif' ? 'disetujui dan tayang' : 'disetujui, tapi saldo iklan habis')); if (current === 'iklan') viewIklan(); }, 3500);
      });
    });
  }
  function topupDialog() {
    openDialog(`<h3>Isi saldo iklan</h3><p>Saldo iklan saat ini <b>${rp(db.ads.wallet)}</b>.</p>
      <form class="form-grid" data-tf novalidate>
        ${field('t-amt', 'Jumlah (Rp)', '<input class="input" id="t-amt" type="number" min="50000" step="10000" value="100000">', 'Minimal Rp 50.000', 'Minimal Rp 50.000.')}
        ${field('t-src', 'Bayar dengan', `<select class="input" id="t-src"><option value="midtrans">Midtrans (QRIS, VA, e-wallet)</option><option value="saldo">Potong saldo toko (${rp(balance())})</option></select>`, null, 'Saldo toko tidak cukup.')}
        <div class="dlg__actions"><button class="btn btn--outline btn--sm" type="button" data-dlg-close>Batal</button><button class="btn btn--primary btn--sm" type="submit">Isi saldo</button></div>
      </form>`, (box) => $('[data-tf]', box).addEventListener('submit', (e) => {
      e.preventDefault(); const amt = Math.round(+$('#t-amt', box).value); const src = $('#t-src', box).value;
      const okA = amt >= 50000; const okS = src !== 'saldo' || amt <= balance();
      $('[data-field="t-amt"]', box).classList.toggle('is-invalid', !okA); $('[data-field="t-src"]', box).classList.toggle('is-invalid', okA && !okS); if (!okA || !okS) return;
      db.ads.wallet += amt; db.ads.topups.push({ at: new Date().toISOString(), amount: amt, src });
      if (src === 'saldo') db.ledger.unshift({ id: uid('l'), at: new Date().toISOString(), type: 'iklan', label: 'Isi saldo iklan', amount: -amt, status: 'berhasil' });
      db.ads.campaigns.forEach((c) => { if (c.status === 'habis') c.status = 'aktif'; });
      save(); closeDialog(); toast('Saldo iklan bertambah ' + rp(amt) + (src === 'midtrans' ? ' (simulasi pembayaran)' : '')); rerender();
    }));
  }

  /* ---------- SALDO (seller) ---------- */
  const LEDGER_TYPE = { penjualan: 'Penjualan', komisi: 'Komisi platform', mitra: 'Komisi mitra', gateway: 'Midtrans', penarikan: 'Penarikan', domain: 'Domain', iklan: 'Iklan' };
  function ledgerTable(entries, types) {
    return `<div class="table-wrap"><table class="table"><thead><tr><th>Tanggal</th><th>Keterangan</th><th>Jenis</th><th>Status</th><th class="num">Jumlah</th></tr></thead><tbody>
      ${entries.slice(0, 80).map((e) => `<tr><td class="muted">${fmtDateTime(e.at)}</td><td>${esc(e.label)}</td><td class="muted">${types[e.type] || e.type}</td><td>${stBadge(e.status === 'berhasil' ? 'selesai' : 'diproses', e.status === 'berhasil' ? 'Berhasil' : 'Diproses')}</td><td class="num ${e.amount >= 0 ? 'strong' : ''}">${e.amount >= 0 ? '+' : ''}${rp(e.amount)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Belum ada transaksi.</td></tr>'}
      </tbody></table></div>`;
  }
  function viewSaldo() {
    const since = Date.now() - 30 * DAY;
    const withdrawn = -db.ledger.filter((e) => e.type === 'penarikan' && new Date(e.at).getTime() >= since).reduce((s, e) => s + e.amount, 0);
    view.innerHTML = `
      <div class="view__head"><div><h1>Saldo</h1><p>Dana pesanan masuk setelah pesanan selesai, dipotong komisi platform, komisi mitra (bila ada), dan biaya Midtrans.</p></div>
        <button class="btn btn--primary btn--sm" type="button" data-withdraw>Tarik saldo</button></div>
      <div class="stats-row stats-row--3">
        ${tile(ICON.wallet, 'Saldo tersedia', rp(balance()), 'Bisa ditarik ke rekening')}
        ${tile(ICON.cart, 'Dana tertahan', rp(onHold()), 'Pesanan yang belum selesai')}
        ${tile(ICON.trend, 'Ditarik 30 hari', rp(withdrawn), 'Ke ' + esc(db.settings.bank.name) + ' ····' + esc(db.settings.bank.number.slice(-4)))}
      </div>
      <section class="card card--flush"><div class="card__head"><h2>Riwayat saldo</h2><p>Biaya Midtrans di demo ini memakai angka contoh</p></div>${ledgerTable(db.ledger, LEDGER_TYPE)}</section>`;
    $('[data-withdraw]', view).addEventListener('click', () => withdrawDialog(balance(), db.settings.bank, (amt, entry) => { db.ledger.unshift(entry); }, 'Tarik saldo ke '));
  }
  function withdrawDialog(bal, b, onAdd, labelPrefix) {
    openDialog(`<h3>Tarik saldo</h3><p>Saldo tersedia <b>${rp(bal)}</b>. Dana dikirim ke ${esc(b.name)} ····${esc(b.number.slice(-4))} a.n. ${esc(b.holder)}, maksimal 1 hari kerja.</p>
      <form class="form-grid" data-wf novalidate>
        ${field('w-amt', 'Jumlah (Rp)', `<input class="input" id="w-amt" type="number" min="10000" max="${Math.floor(bal)}" step="1000" value="${Math.max(0, Math.floor(bal / 1000) * 1000)}">`, 'Minimal Rp 10.000', 'Jumlah harus antara Rp 10.000 dan saldo tersedia.')}
        <div class="dlg__actions"><button class="btn btn--outline btn--sm" type="button" data-dlg-close>Batal</button><button class="btn btn--primary btn--sm" type="submit"${bal < 10000 ? ' disabled' : ''}>Tarik saldo</button></div>
      </form>`, (box) => $('[data-wf]', box).addEventListener('submit', (e) => {
      e.preventDefault(); const amt = Math.round(+$('#w-amt', box).value);
      const ok = amt >= 10000 && amt <= bal; $('[data-field="w-amt"]', box).classList.toggle('is-invalid', !ok); if (!ok) return;
      const entry = { id: uid('l'), at: new Date().toISOString(), type: 'penarikan', label: labelPrefix + b.name, amount: -amt, status: 'diproses' };
      onAdd(amt, entry); save(); closeDialog(); toast('Penarikan ' + rp(amt) + ' diproses'); rerender();
      setTimeout(() => { entry.status = 'berhasil'; save(); if (current === 'saldo' || current === 'm-komisi') VIEWS[current](); }, 4000);
    }));
  }

  /* ---------- PENGATURAN ---------- */
  function viewPengaturan() {
    const s = db.settings; const pay = s.pay;
    const payRows = [['qris', 'QRIS', 'Semua e-wallet dan m-banking'], ['va', 'Virtual account', 'BCA, Mandiri, BNI, BRI, Permata'], ['ewallet', 'E-wallet', 'GoPay, ShopeePay'], ['card', 'Kartu kredit', 'Visa, Mastercard, JCB'], ['cod', 'COD (bayar di tempat)', 'Hanya untuk kurir yang mendukung']];
    view.innerHTML = `
      <div class="view__head"><div><h1>Pengaturan</h1><p>Profil toko, metode pembayaran, dan rekening pencairan (dipakai juga untuk komisi mitra)</p></div></div>
      <div class="settings">
        <section class="card"><div class="card__head"><h2>Profil toko</h2></div>
          <form class="form-grid" data-profile novalidate>
            ${field('st-name', 'Nama toko', `<input class="input" id="st-name" required minlength="2" maxlength="40" value="${esc(session.store)}">`, null, 'Nama toko minimal 2 karakter.')}
            ${field('st-desc', 'Deskripsi singkat', `<textarea class="input" id="st-desc" rows="3" maxlength="160">${esc(s.desc)}</textarea>`)}
            <div class="form__row">
              ${field('st-city', 'Kota asal pengiriman', `<input class="input" id="st-city" maxlength="40" value="${esc(session.city)}">`)}
              ${field('st-wa', 'WhatsApp toko', `<input class="input" id="st-wa" maxlength="20" value="${esc(s.wa)}">`)}
            </div>
            <div><button class="btn btn--primary btn--sm" type="submit">Simpan profil</button></div>
          </form></section>
        <section class="card"><div class="card__head"><div><h2>Metode pembayaran</h2><p>Diproses lewat Midtrans · biaya mengikuti tarif Midtrans</p></div></div>
          ${payRows.map(([k, l, d]) => `<div class="toggle-row"><span>${l}<small>${d}</small></span><button type="button" class="switch" role="switch" aria-checked="${!!pay[k]}" aria-label="${l}" data-pay="${k}"></button></div>`).join('')}
        </section>
        <section class="card"><div class="card__head"><h2>Rekening pencairan</h2></div>
          <form class="form-grid" data-bank novalidate>
            ${field('b-name', 'Bank', `<select class="input" id="b-name">${['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Permata'].map((x) => `<option${x === s.bank.name ? ' selected' : ''}>${x}</option>`).join('')}</select>`)}
            ${field('b-no', 'Nomor rekening', `<input class="input" id="b-no" inputmode="numeric" maxlength="20" value="${esc(s.bank.number)}">`, 'Data contoh untuk demo', 'Nomor rekening 6–20 digit.')}
            ${field('b-holder', 'Atas nama', `<input class="input" id="b-holder" maxlength="60" value="${esc(s.bank.holder)}">`)}
            <div><button class="btn btn--primary btn--sm" type="submit">Simpan rekening</button></div>
          </form></section>
        <section class="card"><div class="card__head"><h2>Akun dan data demo</h2></div>
          <dl class="kv"><dt>Paket toko</dt><dd>Pro · Rp 99.000/bulan</dd><dt>Komisi platform</dt><dd>3% per transaksi</dd><dt>Kode mitra</dt><dd>${esc(M().code)}</dd><dt>Akun</dt><dd>${esc(session.email)}</dd></dl>
          <div class="dlg__actions" style="justify-content:flex-start;margin-top:16px">
            <button class="btn btn--outline btn--sm" type="button" data-reset>Reset data demo</button>
            <button class="btn btn--outline btn--sm" type="button" data-logout-2>Keluar</button></div>
        </section>
      </div>`;
    $('[data-profile]', view).addEventListener('submit', (e) => {
      e.preventDefault(); const name = $('#st-name', view).value.trim(); const ok = name.length >= 2;
      $('[data-field="st-name"]', view).classList.toggle('is-invalid', !ok); if (!ok) return;
      s.desc = $('#st-desc', view).value.trim(); s.wa = $('#st-wa', view).value.trim();
      session.store = name; session.city = $('#st-city', view).value.trim() || session.city;
      TokoraSession.update({ store: session.store, city: session.city }); save(); renderShell(); toast('Profil toko disimpan');
    });
    $$('[data-pay]', view).forEach((b) => b.addEventListener('click', () => { const k = b.dataset.pay; pay[k] = !pay[k]; b.setAttribute('aria-checked', String(pay[k])); save(); toast((pay[k] ? 'Diaktifkan: ' : 'Dinonaktifkan: ') + b.getAttribute('aria-label')); }));
    $('[data-bank]', view).addEventListener('submit', (e) => {
      e.preventDefault(); const no = $('#b-no', view).value.replace(/\D/g, ''); const ok = no.length >= 6 && no.length <= 20;
      $('[data-field="b-no"]', view).classList.toggle('is-invalid', !ok); if (!ok) return;
      s.bank = { name: $('#b-name', view).value, number: no, holder: $('#b-holder', view).value.trim() || session.name }; save(); toast('Rekening pencairan disimpan');
    });
    $('[data-reset]', view).addEventListener('click', () => confirmDialog('Reset data demo?', 'Semua pesanan, produk, halaman, domain, mitra, iklan, dan saldo contoh akan dibuat ulang dari awal.', 'Reset data', () => {
      Object.keys(domainTimers).forEach((k) => { clearInterval(domainTimers[k]); delete domainTimers[k]; });
      db = seedData(); save(); toast('Data demo dibuat ulang'); rerender();
    }, true));
    $('[data-logout-2]', view).addEventListener('click', () => { TokoraSession.clear(); location.href = 'login.html'; });
  }

  /* =================================================================
     MITRA (akun ini sebagai kreator LP / closer)
     ================================================================= */
  const MSTATUS = { menunggu: 'Menunggu bayar', diproses: 'Diproses seller', dikirim: 'Dikirim', selesai: 'Selesai', dibatalkan: 'Dibatalkan', gagal: 'Gagal kirim' };
  const commState = (o) => (o.status === 'selesai' ? ['selesai', 'Tersedia'] : ['dibatalkan', 'gagal'].includes(o.status) ? ['dibatalkan', 'Batal'] : o.status === 'menunggu' ? ['menunggu', 'Belum dibayar'] : ['dibayar', 'Tertahan']);
  const codToday = () => M().orders.filter((o) => o.via === 'closer' && o.payment === 'COD' && dayKey(o.createdAt) === dayKey(Date.now())).length;
  const codScore = () => { const c = M().orders.filter((o) => o.payment === 'COD' && ['selesai', 'gagal'].includes(o.status)); return c.length ? c.filter((o) => o.status === 'selesai').length / c.length : 1; };
  let mChartTable = false;

  function viewMRingkasan() {
    const from30 = Date.now() - 30 * DAY; const o30 = M().orders.filter((o) => new Date(o.createdAt).getTime() >= from30 && !['dibatalkan', 'gagal', 'menunggu'].includes(o.status));
    const byVia = (v) => o30.filter((o) => o.via === v);
    view.innerHTML = `
      <div class="view__head"><div><h1>Halo, ${esc(firstName(session.name))}</h1><p>Mode mitra · kode ${esc(M().code)} · jualkan produk seller lain dan dapatkan komisi</p></div>
        <div class="toolbar"><a class="btn btn--outline btn--sm" href="#m-katalog">Cari produk</a><a class="btn btn--primary btn--sm" href="#m-buat">${ICON.plus} Buat pesanan</a></div></div>
      <div class="demo-note">${ICON.info}<span>Data mitra ini contoh. Komisi tertahan sampai pesanan selesai, dan pesanan batal atau COD gagal kirim tidak mendapat komisi.</span></div>
      <div class="stats-row">
        ${tile(ICON.wallet, 'Komisi tersedia', rpShort(mBalance()), 'Bisa ditarik ke rekening')}
        ${tile(ICON.trend, 'Komisi tertahan', rpShort(mHeld()), 'Cair setelah pesanan selesai')}
        ${tile(ICON.cart, 'Pesanan 30 hari', o30.length + ' pesanan', byVia('lp').length + ' dari LP · ' + byVia('closer').length + ' bantu CO')}
        ${tile(ICON.shield, 'Rapor COD', pct(codScore(), 0), 'Limit COD ' + codToday() + '/' + M().codLimit + ' hari ini')}
      </div>
      <div class="grid-2">
        <section class="card"><div class="card__head"><div><h2>Komisi per hari</h2><p>Komisi dari pesanan yang dibayar, 14 hari terakhir</p></div><button class="link-btn" type="button" data-mtable>${mChartTable ? 'Lihat grafik' : 'Lihat tabel'}</button></div>
          <div class="chart" data-mchart></div></section>
        <section class="card"><div class="card__head"><h2>Pesanan terbaru</h2><a class="link-btn" href="#m-pesanan">Semua</a></div>
          <div class="mini-list">${M().orders.slice(0, 6).map((o) => { const [cs, cl] = commState(o); return `<div class="mini-item"><div class="mini-item__main"><b>${esc(o.buyer)}</b><small>${o.via === 'lp' ? 'Dari LP' : 'Bantu CO'} · ${esc(o.name)}</small></div><div class="mini-item__end"><div>+${rp(o.commission)}</div>${stBadge(cs, cl)}</div></div>`; }).join('') || '<p class="empty">Belum ada pesanan.</p>'}</div></section>
      </div>`;
    $('[data-mtable]', view).addEventListener('click', () => { mChartTable = !mChartTable; viewMRingkasan(); });
    const series = [{ key: 'komisi', label: 'Komisi', color: 'var(--ch-landing)' }];
    const rowsFn = () => daysRows(14, (row) => { row.komisi = M().orders.filter((o) => !['menunggu', 'dibatalkan', 'gagal'].includes(o.status) && dayKey(o.createdAt) === row.key).reduce((s, o) => s + o.commission, 0); });
    mountChart($('[data-mchart]', view), rowsFn, series, { label: 'Grafik komisi per hari, 14 hari terakhir', height: 220 }, mChartTable);
  }

  const catFilter = { q: '', cat: 'semua' };
  function viewMKatalog() {
    const cats = [...new Set(M().catalog.map((c) => c.category))];
    view.innerHTML = `
      <div class="view__head"><div><h1>Katalog Affiliate</h1><p>Produk yang dibuka seller untuk mitra. Komisi dihitung dari harga produk (tanpa ongkir).</p></div></div>
      <div class="toolbar"><label class="search">${ICON.search}<input class="input" type="search" placeholder="Cari produk atau seller" value="${esc(catFilter.q)}" data-q aria-label="Cari katalog"></label>
        <select class="input" data-cat aria-label="Kategori"><option value="semua">Semua kategori</option>${cats.map((c) => `<option${catFilter.cat === c ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="catalog" data-grid></div>`;
    const draw = () => {
      const q = catFilter.q.toLowerCase();
      const list = M().catalog.filter((c) => (catFilter.cat === 'semua' || c.category === catFilter.cat) && (!q || c.name.toLowerCase().includes(q) || sellerOf(c.sellerId).name.toLowerCase().includes(q)));
      $('[data-grid]', view).innerHTML = list.map((c) => { const s = sellerOf(c.sellerId); return `
        <article class="card cat-card" data-id="${c.id}">
          <div class="cat-card__top"><span class="thumb thumb--lg" style="background:${thumbColor(c.name)}">${esc(initials(c.name))}</span><div><b>${esc(c.name)}</b><small>${esc(s.name)} · ${esc(s.city)} · ★ ${s.rating}</small></div></div>
          <div class="cat-card__price">${rp(c.price)}<small>stok ${num(c.stock)} · terjual ${num(c.sold30)} / 30 hari</small></div>
          <div class="cat-card__comm"><span>Kreator LP<b>${rp(c.price * c.creator / 100)}</b><small>${c.creator}%</small></span><span>Closer<b>${rp(c.price * c.closer / 100)}</b><small>${c.closer}%</small></span></div>
          <div class="page-card__actions"><button class="btn btn--xs btn--primary" type="button" data-lp>Buat LP</button><button class="btn btn--xs btn--outline" type="button" data-order>Buat pesanan</button><button class="btn btn--xs btn--outline" type="button" data-ref>${ICON.link} Tautan</button></div>
        </article>`; }).join('') || '<p class="empty">Tidak ada produk yang cocok.</p>';
    };
    draw();
    $('[data-q]', view).addEventListener('input', (e) => { catFilter.q = e.target.value; draw(); });
    $('[data-cat]', view).addEventListener('change', (e) => { catFilter.cat = e.target.value; draw(); });
    $('[data-grid]', view).addEventListener('click', (e) => {
      const card = e.target.closest('[data-id]'); if (!card) return; const c = catById(card.dataset.id);
      if (e.target.closest('[data-lp]')) pageForm('mitra', c.id);
      else if (e.target.closest('[data-order]')) { buatPreset = c.id; location.hash = 'm-buat'; }
      else if (e.target.closest('[data-ref]')) copyText('https://' + refLink(c), 'Tautan referral disalin (atribusi 7 hari)');
    });
  }

  function viewMLp() {
    view.innerHTML = `
      <div class="view__head"><div><h1>Landing Page Saya</h1><p>Halaman yang kamu buat untuk produk seller. Pembeli checkout di halamanmu, dan komisinya tercatat otomatis.</p></div>
        <button class="btn btn--primary btn--sm" type="button" data-add>${ICON.plus} Buat LP</button></div>
      <div class="pages">${M().pages.map((p) => { const c = catById(p.productId) || { name: '—', creator: 0, sellerId: '' }; const os = M().orders.filter((o) => o.pageId === p.id && !['dibatalkan', 'gagal', 'menunggu'].includes(o.status)); const comm = os.reduce((s, o) => s + o.commission, 0); return `
        <article class="card page-card" data-id="${p.id}">
          <div class="page-card__preview" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="page-card__title"><b>${esc(p.title)}</b>${stBadge(p.status, p.status === 'terbit' ? 'Terbit' : 'Draf')}</div>
          <div class="page-card__url">${esc(pageLink(p))}<br>${esc(c.name)} · ${esc(sellerOf(c.sellerId).name)} · komisi ${c.creator}%</div>
          <div class="page-card__stats"><span><b>${num(p.visits)}</b>Kunjungan</span><span><b>${os.length}</b>Pesanan</span><span><b>${rpShort(comm)}</b>Komisi</span></div>
          <div class="page-card__actions">
            <button class="btn btn--xs ${p.status === 'terbit' ? 'btn--outline' : 'btn--primary'}" type="button" data-pub>${p.status === 'terbit' ? 'Jadikan draf' : 'Terbitkan'}</button>
            <button class="btn btn--xs btn--outline" type="button" data-copy>${ICON.link} Salin tautan</button>
            <button class="btn btn--xs btn--outline" type="button" data-del>Hapus</button>
          </div></article>`; }).join('') || '<p class="empty">Belum ada landing page. Pilih produk di Katalog Affiliate lalu klik "Buat LP".</p>'}</div>`;
    $('[data-add]', view).addEventListener('click', () => pageForm('mitra'));
    $('.pages', view).addEventListener('click', (e) => {
      const card = e.target.closest('[data-id]'); if (!card) return; const p = M().pages.find((x) => x.id === card.dataset.id);
      if (e.target.closest('[data-pub]')) { p.status = p.status === 'terbit' ? 'draf' : 'terbit'; save(); toast(p.status === 'terbit' ? 'Terbit di ' + pageLink(p) : 'Halaman dijadikan draf'); viewMLp(); }
      else if (e.target.closest('[data-copy]')) copyText('https://' + pageLink(p), 'Tautan disalin');
      else if (e.target.closest('[data-del]')) confirmDialog('Hapus landing page?', '<b>' + esc(p.title) + '</b> akan dihapus. Komisi dari pesanan yang sudah masuk tetap tercatat.', 'Hapus', () => { M().pages = M().pages.filter((x) => x.id !== p.id); save(); toast('Landing page dihapus'); viewMLp(); }, true);
    });
  }

  /* ---------- BUAT PESANAN (closer) ---------- */
  let buatPreset = null;
  const normPhone = (s) => { let d = String(s).replace(/\D/g, ''); if (d.startsWith('0')) d = '62' + d.slice(1); else if (d.startsWith('8')) d = '62' + d; return d; };
  function invoiceText(o) {
    const deadline = new Date(new Date(o.createdAt).getTime() + DAY).toLocaleString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    const lines = [
      'Halo Kak ' + firstName(o.buyer) + ', berikut rincian pesanannya ya:', '',
      '*No. pesanan:* ' + o.id, '*Penjual:* ' + sellerOf(o.sellerId).name, '',
      o.qty + 'x ' + o.name + ' — ' + rp(o.subtotal), 'Ongkir (' + o.courier + '): ' + rp(o.shipping), '*Total: ' + rp(o.total) + '*', '',
      '*Dikirim ke:* ' + o.buyer + ', ' + o.address, '',
    ];
    if (o.payment === 'COD') lines.push('*Pembayaran:* COD, bayar tunai ke kurir saat paket diterima.', 'Mohon siapkan uang pas ya, Kak.');
    else lines.push('*Pembayaran:* transfer lewat link resmi (VA, QRIS, atau e-wallet) sebelum ' + deadline + ':', 'https://pay.tokora.id/i/' + o.payCode, '', 'Penting: bayar hanya lewat link di atas. Jangan transfer ke rekening pribadi siapa pun.');
    lines.push('', 'Terima kasih sudah berbelanja!');
    return lines.join('\n');
  }
  function invoiceDialog(o) {
    const text = invoiceText(o);
    openDialog(`<h3>Rincian tagihan siap dikirim</h3>
      <p>${o.payment === 'COD' ? 'Pesanan COD sudah diteruskan ke seller untuk dikirim.' : 'Link bayar dibuat otomatis. Pembayaran akan terkonfirmasi sendiri tanpa perlu bukti transfer.'} <span class="muted">(Link bayar di demo ini contoh; di aplikasi asli dibuat oleh Midtrans.)</span></p>
      <pre class="invoice" data-inv>${esc(text)}</pre>
      <div class="dlg__actions">
        <button class="btn btn--outline btn--sm" type="button" data-copy-inv>Salin rincian</button>
        <a class="btn btn--primary btn--sm" target="_blank" rel="noopener" href="https://wa.me/${normPhone(o.phone)}?text=${encodeURIComponent(text)}">${ICON.chat.replace('<svg', '<svg class="btn__icon"')} Kirim ke WhatsApp</a>
      </div>`, (box) => $('[data-copy-inv]', box).addEventListener('click', () => copyText(text, 'Rincian tagihan disalin')), true);
  }
  function viewMBuat() {
    const offers = M().catalog; const preset = buatPreset || offers[0].id; buatPreset = null;
    const limitHit = codToday() >= M().codLimit;
    view.innerHTML = `
      <div class="view__head"><div><h1>Buat Pesanan</h1><p>Bantu pembeli dari WhatsApp, Instagram, atau TikTok checkout, lalu kirim rincian tagihannya.</p></div></div>
      <div class="grid-2">
        <section class="card">
          <form class="form-grid" data-bf novalidate>
            <div class="form__row">
              ${field('o-prod', 'Produk', `<select class="input" id="o-prod">${offers.map((c) => `<option value="${c.id}"${c.id === preset ? ' selected' : ''}>${esc(c.name)} · ${rp(c.price)}</option>`).join('')}</select>`)}
              ${field('o-qty', 'Jumlah', '<input class="input" id="o-qty" type="number" min="1" max="99" step="1" value="1">', null, 'Jumlah 1–99.')}
            </div>
            <div class="form__row">
              ${field('o-name', 'Nama pembeli', '<input class="input" id="o-name" required minlength="2" maxlength="60" placeholder="Nama sesuai alamat">', null, 'Isi nama pembeli.')}
              ${field('o-phone', 'No. WhatsApp pembeli', '<input class="input" id="o-phone" inputmode="tel" maxlength="16" placeholder="0812xxxxxxxx">', null, 'Nomor 10–15 digit.')}
            </div>
            <div class="form__row">
              ${field('o-city', 'Kota / kecamatan', `<input class="input" id="o-city" list="o-cities" maxlength="40" placeholder="Bandung"><datalist id="o-cities">${CITIES.map((c) => `<option value="${c}">`).join('')}</datalist>`, null, 'Isi kota tujuan.')}
              ${field('o-courier', 'Kurir', `<select class="input" id="o-courier">${COURIERS.map((c) => `<option>${c}</option>`).join('')}</select>`)}
            </div>
            ${field('o-addr', 'Alamat lengkap', '<textarea class="input" id="o-addr" rows="2" maxlength="200" placeholder="Jalan, nomor rumah, RT/RW, kelurahan"></textarea>', null, 'Isi alamat lengkap (minimal 10 karakter).')}
            <div class="field" data-field="o-pay"><span class="field__label">Metode bayar</span>
              <div class="radio-cards">
                <label class="radio-card"><input type="radio" name="o-pay" value="Transfer" checked><span><b>Transfer / QRIS</b><small>Link bayar Midtrans dibuat otomatis</small></span></label>
                <label class="radio-card"><input type="radio" name="o-pay" value="COD"${limitHit ? ' disabled' : ''}><span><b>COD</b><small>${limitHit ? 'Limit COD hari ini habis' : 'Sisa limit ' + (M().codLimit - codToday()) + ' pesanan hari ini'}</small></span></label>
              </div></div>
            <div><button class="btn btn--primary btn--sm" type="submit">Buat pesanan dan rincian tagihan</button></div>
          </form>
        </section>
        <section class="card summary" aria-live="polite">
          <div class="card__head"><h2>Ringkasan</h2></div>
          <dl class="kv" data-sum></dl>
          <div class="commission-box" data-comm></div>
          <p class="field__hint">Harga mengikuti seller. Ongkir di demo ini angka contoh. Komisi cair setelah pesanan selesai; COD gagal kirim tidak mendapat komisi.</p>
        </section>
      </div>`;
    const form = $('[data-bf]', view);
    const calc = () => {
      const c = catById($('#o-prod', form).value); const qty = Math.max(1, Math.min(99, parseInt($('#o-qty', form).value, 10) || 1));
      const city = $('#o-city', form).value.trim(); const ship = city ? shippingFor(city) : 0; const sub = c.price * qty;
      $('[data-sum]', view).innerHTML = `<dt>Penjual</dt><dd>${esc(sellerOf(c.sellerId).name)}</dd><dt>Produk</dt><dd>${qty}× ${esc(c.name)}</dd><dt>Subtotal</dt><dd>${rp(sub)}</dd><dt>Ongkir</dt><dd>${city ? rp(ship) : 'isi kota tujuan'}</dd><dt><b>Total pembeli</b></dt><dd><b>${rp(sub + ship)}</b></dd>`;
      $('[data-comm]', view).innerHTML = `<span>Komisi kamu</span><b>${rp(sub * c.closer / 100)}</b><small>${c.closer}% dari harga produk</small>`;
      return { c, qty, city, ship, sub };
    };
    form.addEventListener('input', calc); form.addEventListener('change', calc); calc();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const { c, qty, city, ship, sub } = calc(); const v = (s) => $(s, form).value.trim(); const phone = v('#o-phone').replace(/\D/g, '');
      const pay = ($('input[name="o-pay"]:checked', form) || {}).value;
      const checks = [['o-qty', +v('#o-qty') >= 1 && +v('#o-qty') <= 99], ['o-name', v('#o-name').length >= 2], ['o-phone', phone.length >= 10 && phone.length <= 15], ['o-city', city.length >= 3], ['o-addr', v('#o-addr').length >= 10], ['o-pay', !!pay]];
      let ok = true; checks.forEach(([f, g]) => { $('[data-field="' + f + '"]', form).classList.toggle('is-invalid', !g); if (!g) ok = false; }); if (!ok) return;
      if (pay === 'COD' && codToday() >= M().codLimit) { toast('Limit COD harian sudah habis'); return; }
      const now = new Date();
      const o = { id: 'MTR' + dayKey(now).slice(2).replace(/-/g, '') + '-' + String(M().orders.length + 1).padStart(3, '0'), createdAt: now.toISOString(), via: 'closer', pageId: null, productId: c.id, name: c.name, sellerId: c.sellerId, qty, price: c.price,
        buyer: v('#o-name'), phone, city, address: v('#o-addr') + ', ' + city, courier: v('#o-courier'), shipping: ship, subtotal: sub, total: sub + ship, payment: pay,
        commission: Math.round(sub * c.closer / 100), status: pay === 'COD' ? 'diproses' : 'menunggu', payCode: pay === 'COD' ? null : Math.random().toString(36).slice(2, 8).toUpperCase() };
      M().orders.unshift(o); save(); renderShell(); invoiceDialog(o);
      form.reset(); calc();
    });
  }

  /* ---------- PESANAN MITRA ---------- */
  const mFilter = { status: 'semua', via: 'semua' };
  function viewMPesanan() {
    const os = M().orders;
    const counts = Object.keys(MSTATUS).reduce((a, k) => { a[k] = os.filter((o) => o.status === k).length; return a; }, {});
    view.innerHTML = `
      <div class="view__head"><div><h1>Pesanan Mitra</h1><p>Pesanan dari landing page-mu dan pesanan yang kamu buat untuk pembeli</p></div><a class="btn btn--primary btn--sm" href="#m-buat">${ICON.plus} Buat pesanan</a></div>
      <div class="chips" role="group" aria-label="Filter status">${[['semua', 'Semua', os.length], ...Object.keys(MSTATUS).filter((k) => counts[k]).map((k) => [k, MSTATUS[k], counts[k]])].map(([k, l, n]) => `<button type="button" class="chip${mFilter.status === k ? ' is-active' : ''}" data-status="${k}">${l}<b>${n}</b></button>`).join('')}</div>
      <div class="toolbar"><select class="input" data-via aria-label="Sumber"><option value="semua">Semua sumber</option><option value="lp"${mFilter.via === 'lp' ? ' selected' : ''}>Dari landing page</option><option value="closer"${mFilter.via === 'closer' ? ' selected' : ''}>Bantu CO</option></select></div>
      <section class="card card--flush"><div class="table-wrap"><table class="table"><thead><tr><th>Pesanan</th><th>Pembeli</th><th>Produk</th><th>Bayar</th><th class="num">Total</th><th class="num">Komisi</th><th>Status</th><th class="num">Aksi</th></tr></thead><tbody data-rows></tbody></table></div></section>
      <p class="field__hint">Tombol "Simulasikan" hanya ada di demo, untuk meniru pembayaran dari Midtrans dan status dari kurir.</p>`;
    const draw = () => {
      const list = os.filter((o) => (mFilter.status === 'semua' || o.status === mFilter.status) && (mFilter.via === 'semua' || o.via === mFilter.via));
      $('[data-rows]', view).innerHTML = list.map((o) => { const [cs, cl] = commState(o); return `<tr data-id="${o.id}">
        <td><span class="strong">${o.id}</span><div class="muted">${fmtDateTime(o.createdAt)} · ${o.via === 'lp' ? 'dari LP' : 'bantu CO'}</div></td>
        <td>${esc(o.buyer)}<div class="muted">${esc(o.city)}</div></td><td>${o.qty}× ${esc(o.name)}<div class="muted">${esc(sellerOf(o.sellerId).name)}</div></td>
        <td class="muted">${esc(o.payment)}</td><td class="num">${rp(o.total)}</td><td class="num">${rp(o.commission)}<div>${stBadge(cs, cl)}</div></td><td>${stBadge(o.status === 'diproses' ? 'diproses' : o.status, MSTATUS[o.status])}</td>
        <td class="num"><div class="row-actions">${mActions(o)}</div></td></tr>`; }).join('') || '<tr><td colspan="8" class="empty">Tidak ada pesanan.</td></tr>';
    };
    draw();
    $$('[data-status]', view).forEach((b) => b.addEventListener('click', () => { mFilter.status = b.dataset.status; viewMPesanan(); }));
    $('[data-via]', view).addEventListener('change', (e) => { mFilter.via = e.target.value; draw(); });
    $('[data-rows]', view).addEventListener('click', (e) => {
      const b = e.target.closest('[data-mact]'); if (!b) return; const o = os.find((x) => x.id === b.closest('[data-id]').dataset.id);
      const act = b.dataset.mact;
      if (act === 'tagihan') invoiceDialog(o);
      else if (act === 'bayar') { o.status = 'diproses'; save(); toast('Pembayaran ' + o.id + ' terkonfirmasi otomatis'); rerender(); }
      else if (act === 'kirim') { o.status = 'dikirim'; save(); toast('Seller mengirim ' + o.id); rerender(); }
      else if (act === 'selesai') { o.status = 'selesai'; M().ledger.unshift({ id: uid('pl'), at: new Date().toISOString(), type: 'komisi', label: 'Komisi ' + o.id + ' · ' + o.name, amount: o.commission, status: 'berhasil' }); save(); toast('Komisi ' + rp(o.commission) + ' masuk ke saldo'); rerender(); }
      else if (act === 'gagal') confirmDialog('Simulasikan COD gagal kirim?', 'Paket ditolak pembeli. Pesanan <b>' + o.id + '</b> tidak mendapat komisi dan tercatat di rapor COD-mu.', 'Gagal kirim', () => { o.status = 'gagal'; save(); toast('Pesanan ' + o.id + ' gagal kirim'); rerender(); }, true);
    });
  }
  function mActions(o) {
    const b = (act, label, primary) => `<button type="button" class="btn btn--xs ${primary ? 'btn--primary' : 'btn--outline'}" data-mact="${act}">${label}</button>`;
    const out = [];
    if (o.via === 'closer' && ['menunggu', 'diproses'].includes(o.status)) out.push(b('tagihan', 'Tagihan'));
    if (o.status === 'menunggu') out.push(b('bayar', 'Simulasikan bayar', true));
    if (o.status === 'diproses') out.push(b('kirim', 'Simulasikan kirim'));
    if (o.status === 'dikirim') { out.push(b('selesai', 'Simulasikan selesai', true)); if (o.payment === 'COD') out.push(b('gagal', 'Gagal kirim')); }
    return out.join('') || '<span class="muted">—</span>';
  }

  /* ---------- KOMISI (mitra) ---------- */
  const MLEDGER = { komisi: 'Komisi', penarikan: 'Penarikan' };
  function viewMKomisi() {
    const from30 = Date.now() - 30 * DAY;
    const earned30 = M().ledger.filter((e) => e.type === 'komisi' && new Date(e.at).getTime() >= from30).reduce((s, e) => s + e.amount, 0);
    view.innerHTML = `
      <div class="view__head"><div><h1>Komisi</h1><p>Komisi masuk ke saldo setelah pesanan selesai. Ditarik ke rekening yang sama dengan pengaturan toko.</p></div>
        <button class="btn btn--primary btn--sm" type="button" data-withdraw>Tarik komisi</button></div>
      <div class="stats-row stats-row--3">
        ${tile(ICON.wallet, 'Komisi tersedia', rp(mBalance()), 'Bisa ditarik ke rekening')}
        ${tile(ICON.trend, 'Komisi tertahan', rp(mHeld()), 'Menunggu pesanan selesai')}
        ${tile(ICON.cart, 'Komisi 30 hari', rp(earned30), 'Sudah cair')}
      </div>
      <section class="card card--flush"><div class="card__head"><h2>Riwayat komisi</h2></div>${ledgerTable(M().ledger, MLEDGER)}</section>`;
    $('[data-withdraw]', view).addEventListener('click', () => withdrawDialog(mBalance(), db.settings.bank, (amt, entry) => { M().ledger.unshift(entry); }, 'Tarik komisi ke '));
  }

  /* ---------------------------------------------------------------
     START
     --------------------------------------------------------------- */
  const VIEWS = {
    ringkasan: viewRingkasan, pesanan: viewPesanan, produk: viewProduk, landing: viewLanding, domain: viewDomain, mitra: viewMitra, iklan: viewIklan, saldo: viewSaldo, pengaturan: viewPengaturan,
    'm-ringkasan': viewMRingkasan, 'm-katalog': viewMKatalog, 'm-lp': viewMLp, 'm-buat': viewMBuat, 'm-pesanan': viewMPesanan, 'm-komisi': viewMKomisi,
  };
  advanceDomains();
  route();
})();
