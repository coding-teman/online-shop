# Tokora — Landing Page Platform

Adaptasi dari template "Poweris" untuk platform toko online Tokora (lihat PRD).

- Palet: **navy + lime** — semua warna di `css/tokens.css` (`--c-navy-*`, `--c-lime-*`). Nama token lama (`--c-teal-*`, `--c-yellow-*`, dst.) tetap ada sebagai alias.
- Hero: malam hari dengan deretan toko, pin lokasi, rumah pembeli, dan rute pengiriman (bukan turbin lagi).
- Harga paket dalam Rupiah (`data-monthly` / `data-yearly`, diformat oleh `main.js`).
- Testimoni di `index.html` masih **contoh** — ganti dengan testimoni seller asli sebelum rilis.
- "Tokora", email, dan nomor WhatsApp adalah placeholder.
- Jalankan: `python -m http.server 5211` dari folder ini, lalu buka http://localhost:5211
- **Dasbor (demo)**: `dashboard.html`, dua mode (tombol Seller/Mitra di sidebar):
  - **Seller** — Ringkasan, Pesanan (dengan sumber: toko/LP/kreator/closer/iklan), Produk (+ komisi affiliate per produk), Landing Page, Domain, Mitra, Iklan, Saldo, Pengaturan.
  - **Mitra** — Katalog Affiliate, Landing Page Saya (LP kreator), Buat Pesanan (closer: COD/transfer + rincian tagihan WhatsApp), Pesanan Mitra, Komisi.
  - Daftar sebagai seller atau mitra di `register.html` (`?role=mitra` memilih mitra otomatis).
  - Masuk/daftar dengan email format valid + kata sandi ≥ 8 karakter (belum ada backend; sesi disimpan di `localStorage`, lihat `js/session.js`).
  - Data contoh dibuat per akun di `js/dashboard.js` (`seedData`) dan tersimpan di browser; "Reset data demo" ada di Pengaturan.
  - Angka komisi, biaya Midtrans, dan harga domain di demo adalah **angka contoh**.

Dokumentasi template asli (animasi, atribut `data-*`) ada di bawah.

---

# Poweris — Landing Page Template (Full Scroll Animation)

> **Start energy revolution from your community.**
> Landing page bergaya ilustratif (langit, turbin angin berputar, rumah panel surya, bunga bergoyang) dengan animasi di **setiap** scroll, dibangun dengan HTML + CSS + GSAP ScrollTrigger — tanpa build tool, tanpa file gambar.
> Dirancang agar **siap pakai dan mudah diadaptasi** ke brand/project lain.

- `index.html` → landing page lengkap (hero ilustrasi, about, stats, how it works, apps, plans, testimoni, FAQ, kontak, footer)
- `styleguide.html` → style guide + demo live semua animasi + referensi atribut
- `login.html` / `register.html` → halaman masuk & daftar (split layout: ilustrasi turbin | form animasi)
- `?noanim` di URL → mode statis (tanpa animasi) untuk memeriksa layout

---

## Struktur Folder

```
10/
├── index.html            ← landing page
├── styleguide.html       ← style guide + demo animasi + referensi
├── login.html            ← halaman login
├── register.html         ← halaman daftar (2 langkah: akun → komunitas)
├── README.md
├── .claude/launch.json   ← config server lokal (python http.server :5210)
├── css/
│   ├── tokens.css        ← ★ SATU-SATUNYA FILE UNTUK GANTI BRAND (warna, font, spasi, radius, motion) + tema light
│   ├── base.css          ← reset, tipografi, utilitas layout (.container, .grid, .section)
│   ├── components.css    ← tombol, badge, kartu, nav, kontrol melayang, modal, form, marquee, preloader, cursor
│   ├── sections.css      ← layout khusus tiap section Poweris (boleh dibuang/diganti)
│   ├── auth.css          ← layout login/register + komponen form lanjutan (ikon input, toggle password, checkbox, strength, langkah)
│   └── animations.css    ← state awal reveal, keyframes idle (float/spin/sway…), reduced-motion
└── js/
    ├── animations.js     ← ★ ENGINE ANIMASI berbasis atribut data-* (generik, salin apa adanya)
    ├── main.js           ← interaksi khusus landing page (preloader, intro hero, turbin, kartu fitur, harga, FAQ, modal, tema, suara, form, cursor)
    └── auth.js           ← interaksi login/register (intro, turbin, toggle password, kekuatan password, validasi, langkah, sukses, tema)
```

## Cara Menjalankan

Buka `index.html` langsung, atau jalankan server lokal agar font CDN & modul termuat konsisten:

```bash
python -m http.server 5210
```

lalu buka <http://localhost:5210>. Dependensi eksternal hanya Google Fonts (Outfit, Rubik) dan GSAP 3.12 + ScrollTrigger dari cdnjs. Jika GSAP gagal dimuat, halaman tetap tampil utuh (class `no-js` menonaktifkan state tersembunyi).

---

## Daftar Animasi yang Ada

| Area | Animasi |
|---|---|
| Preloader | Logo daun digambar (stroke draw), huruf POWERIS naik satu per satu, progress bar, slide ke atas |
| Hero | 7 lapisan ilustrasi masuk dari bawah bergantian; judul muncul per kata; nav, lead, CTA menyusul; turbin spin-up |
| Hero (idle) | Bilah turbin berputar (dipercepat saat scroll cepat), awan melayang, bunga bergoyang, serbuk/partikel naik, matahari bernapas |
| Hero (scroll) | Parallax 7 lapisan dengan kecepatan berbeda (scrub), konten memudar & naik |
| Hero (kursor) | Parallax mengikuti mouse per lapisan (`data-depth`) |
| Nav | Menjadi kompak & blur saat scroll, sembunyi saat scroll turun cepat, underline link aktif per section, menu mobile clip-circle |
| About | Judul split per kata, blob dekorasi parallax & breathe, kartu fitur stagger; kartu aktif membesar (green) dengan autoplay 5 detik, panah prev/next |
| Stats | Counter angka naik + garis aksen tumbuh saat terlihat |
| How it works | Garis penghubung SVG digambar mengikuti scroll (scrub), langkah fade-up berurutan |
| Apps | Mockup ponsel zoom-in + tilt 3D, bar chart tumbuh (grow-up), kartu melayang float, ring berputar |
| Plans | Toggle bulanan/tahunan dengan thumb meluncur & angka harga beranimasi, kartu stagger, kartu unggulan tilt |
| Testimoni | Dua marquee berlawanan arah, dipercepat saat scroll, melambat saat hover |
| FAQ | Accordion height auto (GSAP), ikon + berputar jadi × |
| Kontak | Form fade-left, ikon sosial pop, tombol magnetik, validasi goyang, sukses animasi |
| Footer | Kata POWERIS raksasa clip-up, link bergeser saat hover |
| Login / Register | Panel ilustrasi versi portrait (5 lapisan, turbin berputar, bunga bergoyang, parallax kursor), pill info melayang, intro form bertahap, ikon input berubah warna saat fokus, toggle lihat password, meter kekuatan password, checkbox dengan centang "digambar", validasi goyang + pesan error, register 2 langkah dengan transisi geser & indikator progres, layar sukses dengan centang digambar lalu redirect |
| Global | Progress bar scroll, cursor glow (pointer presisi), tombol back-to-top, toggle tema dark/light (tersimpan), suara ambient angin (WebAudio, tanpa file audio), modal video |

Semua otomatis nonaktif pada `prefers-reduced-motion` dan pada URL `?noanim`.

---

## Mengganti Brand (5 menit)

1. **Warna & font** → edit `css/tokens.css` bagian `BRAND COLORS`, `SEMANTIC COLORS`, `TYPOGRAPHY`. Ganti juga link Google Fonts di `<head>`.
2. **Tema light** → blok `html[data-theme="light"]` di file yang sama (hanya semantic token yang ditimpa).
3. **Logo** → ganti SVG `.brand__mark` (muncul 3× di `index.html`: nav, footer, preloader).
4. **Teks & konten** → langsung di `index.html`. Struktur section bebas dihapus/diurutkan ulang.
5. **Ilustrasi hero** → lihat bagian berikut.

Tidak ada nilai warna/ukuran hard-coded di `components.css` atau `animations.css`; semua merujuk ke token.

## Mengganti Ilustrasi Hero

Hero terdiri dari 7 `<div class="hero__layer" data-hero-layer="kecepatan">` yang masing-masing berisi satu `<svg data-depth="…" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">`:

| # | Lapisan | data-hero-layer | data-depth |
|---|---|---|---|
| 1 | Siluet kota | 0.55 (paling lambat) | 0.005 |
| 2 | Gunung jauh | 0.42 | 0.009 |
| 3 | Gunung dekat | 0.3 | 0.013 |
| 4 | Turbin angin (`[data-turbine="durasi"]` = bilah) | 0.24 | 0.015 |
| 5 | Perbukitan teal | 0.18 | 0.018 |
| 6 | Ladang, tiang listrik, rumah (`<use href="#house">`) | 0.1 | 0.022 |
| 7 | Semak & bunga latar depan (`data-sway`) | −0.12 (berlawanan) | 0.03 |

- Untuk memakai **gambar PNG/SVG sendiri**: ganti isi `<svg>` dengan `<img src="…" data-depth="0.01" style="width:100%;height:100%;object-fit:cover;object-position:bottom">`. Simpan atribut `data-hero-layer` di pembungkusnya.
- Lapisan boleh dikurangi/ditambah; `main.js` membaca semua `[data-hero-layer]` secara otomatis.
- Warna langit dari token `--hero-sky-top` / `--hero-sky-bottom`.

---

## Menambah Animasi ke Elemen Apa Pun

Cukup tambahkan atribut — tidak perlu menulis JavaScript:

```html
<h2 data-split="words">Judul muncul per kata</h2>
<p  data-anim="fade-up" data-anim-delay="0.2">Paragraf</p>
<ul data-stagger="0.1" data-anim="zoom-in"><li>…</li><li>…</li></ul>
<span data-counter="1200" data-counter-suffix="+">0</span>
<img data-parallax="0.3" src="…">
<a  class="btn btn--primary" data-magnetic>Tombol magnet</a>
<div class="card" data-tilt="8">Kartu tilt 3D</div>
<svg data-draw>…</svg>
<div class="reveal-mask"><img src="…"></div>
<div data-float>Melayang (CSS)</div>
```

**Preset `data-anim`:** fade, fade-up, fade-down, fade-left, fade-right, slide-up, zoom-in, zoom-out, pop, flip-up, flip-left, rotate-in, skew-up, blur-in, clip-up, clip-left, clip-right, grow-up, grow-x.

**Modifier:** `data-anim-delay`, `data-anim-duration`, `data-anim-distance`, `data-anim-ease`, `data-anim-once="false"`, `data-anim-start="top 70%"`, `data-anim-end`, `data-anim-scrub`, `data-anim-trigger="#sel"`.

Referensi lengkap (dengan demo live) ada di `styleguide.html` bagian 06–09.

### API JavaScript

```js
Anim.init();                // jalankan semua modul (sekali setelah DOM siap); scope opsional
Anim.preview(el);           // mainkan ulang reveal sebuah elemen sekarang (konten dinamis / demo)
Anim.refresh();             // hitung ulang posisi setelah konten berubah (accordion, tab, fetch)
Anim.presets['swing'] = {   // tambah preset sendiri sebelum init; 'D' = kelipatan --anim-distance
  from: { opacity: 0, rotation: -12, y: '+=D', transformOrigin: '0% 0%' }, ease: 'back.out(1.6)'
};
```

### Pakai di React / Vue / Next / Astro

1. Muat GSAP + ScrollTrigger + `animations.js` (atau ubah IIFE-nya menjadi modul `export`).
2. Panggil `Anim.init(rootEl)` di `useEffect` / `onMounted` setelah render.
3. Saat unmount / ganti route: `ScrollTrigger.getAll().forEach(t => t.kill())`.
4. Konten yang masuk belakangan (fetch): `Anim.init(containerBaru)` lalu `Anim.refresh()`.

---

## Catatan Teknis

- **Anti-flash:** elemen `[data-anim]`, `[data-stagger] > *`, `[data-split] .split-unit`, `[data-intro]` disembunyikan oleh CSS sebelum GSAP mengambil alih. Jika GSAP tidak ada → `html.no-js` menampilkan semuanya.
- **Jangan** gabungkan animasi CSS transform (`data-float`, `data-spin`, …) dengan `data-anim`/`data-parallax` pada elemen yang sama — CSS animation akan menimpa transform GSAP. Bungkus salah satunya dengan `<div>`.
- **Turbin:** bilah dibuat simetris terhadap titik (0,0) dengan lingkaran tak terlihat agar `transformOrigin: 50% 50%` tepat di poros; kecepatan per turbin lewat `data-turbine="detik/putaran"`.
- **Suara ambient** dibangkitkan dari brown noise + lowpass + LFO (WebAudio) — tidak perlu file audio, hanya aktif setelah klik pengguna.
- **Modal video:** isi `data-video` pada tombol "Watch video" dengan URL embed (mis. `https://www.youtube-nocookie.com/embed/ID?autoplay=1`). Kosong → menampilkan placeholder.
- **Form** hanya demo (tanpa backend). Ganti handler di `main.js` bagian 12 dengan `fetch()` ke endpoint Anda.
- **Login/Register** juga demo: handler submit di `auth.js` bagian "submit" menunggu 1 detik, menampilkan layar sukses, lalu redirect ke `data-redirect` (default `index.html`). Ganti dengan `fetch()` ke API auth Anda; tombol Google/Apple hanya placeholder.
- **Komponen form lanjutan** (`.input-wrap`, `.check`, `.strength`, `.steps-ind`, `.field__error`) ada di `css/auth.css` dan bisa dipakai di halaman lain dengan memuat file itu.
- **Aksesibilitas:** skip link, `aria-expanded`/`aria-pressed`, fokus dikelola pada modal, kontras memenuhi AA pada teks utama, `prefers-reduced-motion` dihormati.

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Elemen tidak pernah muncul | Elemen punya `data-anim` tetapi GSAP diblokir → cek console; pastikan urutan script GSAP → ScrollTrigger → animations.js |
| Reveal terlambat/terlalu awal | Ubah `data-anim-start="top 90%"` (lebih awal) atau `"top 60%"` (lebih lambat) |
| Posisi trigger meleset setelah konten berubah | Panggil `Anim.refresh()` |
| Animasi hover CSS tidak jalan pada elemen `data-anim` | Setelah reveal GSAP menyisakan inline transform; hover CSS pada transform akan kalah → animasikan pseudo-element atau anak elemen |
| Ingin melihat layout tanpa animasi | Tambahkan `?noanim` ke URL |
