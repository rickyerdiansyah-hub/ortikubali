# ORTIBALI — Paket Perbaikan

## Isi paket
- Beranda ORTIBALI dan enam modul: MONSTER RB, DIANA, Kelembagaan, Pelayanan Publik, Tatalaksana, dan Perpustakaan Arsip.
- Data sumber RB 2026, SAKIP, DIANA, dan arsip kelembagaan yang tersedia di paket.
- Backend bersama untuk autentikasi dan alur verifikasi enam bidang.
- Pemutar musik dan autoplay dihapus sesuai permintaan.

## Menjalankan backend di Windows / VS Code
1. Buka folder `ortibali_autoplay/backend` di terminal VS Code.
2. Jalankan `& "C:\Program Files\nodejs\npm.cmd" install` (atau `npm.cmd install` jika npm.cmd sudah ada di PATH).
3. Salin `.env.example` menjadi `.env`.
4. Isi `SESSION_SECRET` dengan string acak panjang dan ganti password bootstrap dengan password kuat milik Anda. Jangan membagikan `.env`.
5. Jalankan `& "C:\Program Files\nodejs\npm.cmd" start`.
6. API health check: `http://localhost:3000/api/health`.

## Menampilkan website
Jalankan server frontend lokal dari folder `ortibali_autoplay` (misalnya ekstensi Live Server) dan buka `index.html`. Jika frontend memanggil backend, sesuaikan konfigurasi origin dengan alamat lokal yang dipakai.

## Penting tentang data
- Jangan menghapus folder `data-sumber-rb-2026`, `data-kelembagaan-2026`, file JSON sumber, maupun folder modul.
- Paket ini tidak menyertakan file `.env` karena berisi rahasia. Buat `.env` lokal dari `.env.example`.
- Database lokal yang sudah ada di komputer Anda tidak boleh ditimpa sebelum dicadangkan.
- Isi yang tidak memiliki sumber data tidak boleh dianggap sebagai data resmi.

## Catatan pemeriksaan
Paket telah diperbarui untuk menghapus musik/autoplay dan menjaga file data sumber. Lakukan uji fungsi akhir pada komputer tujuan: klik setiap menu sidebar, buka enam modul, cek tabel/grafik, login, upload, persetujuan/revisi, serta akses publik. Status final operasional backend tetap bergantung pada konfigurasi `.env`, instalasi dependensi, dan data lokal di komputer Anda.


## Pembaruan akses Kelembagaan
- Setelah login Admin, menu **Input & Pembaruan Data** akan muncul. Data yang dikirim Admin masuk status **Menunggu**.
- Setelah login Master Admin, menu **Verifikasi Pengajuan** akan muncul dengan tombol Setujui atau Tolak/Revisi (catatan revisi wajib).
- Catatan penting: alur ini pada paket ini masih memakai `localStorage` browser untuk demonstrasi. Data pengajuan dan keputusan belum tersinkron antarperangkat atau antar browser. Backend/database bersama belum disertakan dalam ZIP ini; jangan anggap login demo sebagai keamanan produksi.
