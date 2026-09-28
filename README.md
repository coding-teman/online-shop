# Tokora — Platform Toko Online Multi-Toko

Platform tempat seller membuka toko, menjual lewat marketplace, landing page, dan domain sendiri,
dengan program mitra (kreator landing page & closer/bantu checkout) serta iklan produk.

> "Tokora" adalah nama kerja sementara.

## Isi repo

| Folder | Isi |
| --- | --- |
| [`landing/`](landing/) | Landing page platform, halaman Masuk/Daftar, dan **dasbor demo** (seller & mitra). HTML + CSS + JS murni, tanpa build tool. Detail di [`landing/README.md`](landing/README.md). |

Dasbor saat ini masih **demo tanpa backend**: login dan data tersimpan di `localStorage` browser.
Backend sungguhan (akun, database, integrasi Midtrans) adalah langkah berikutnya.

## Menjalankan secara lokal

```bash
python -m http.server 5211 --directory landing
```

Lalu buka http://localhost:5211. Untuk masuk ke dasbor, daftar atau masuk dengan email berformat valid
dan kata sandi minimal 8 karakter.
