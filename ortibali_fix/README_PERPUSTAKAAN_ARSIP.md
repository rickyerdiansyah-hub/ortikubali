PEMBARUAN PERPUSTAKAAN ORTIBALI

Halaman perpustakaan.html telah diarahkan menjadi Arsip Dokumen Resmi. Kategori yang tersedia: Arsip Pengesahan, PERDA, SK, Surat Rekomendasi, Dokumen Kelembagaan, Dokumen Perangkat Daerah, Dokumen Reformasi Birokrasi, dan Arsip Lainnya.

Integrasi backend menggunakan endpoint yang sudah ada:
- GET /api/public/perpus untuk dokumen yang disetujui.
- GET /api/auth/me untuk membaca sesi login bersama.
- POST /api/upload untuk unggah PDF.
- POST /api/submissions/perpus untuk mengajukan arsip.
- GET /api/manage/perpus/submissions untuk melihat pengajuan milik Admin.
- GET /api/review/pending dan POST /api/review/:id untuk verifikasi Master Admin.

Berkas PDF sumber yang sudah ada di data-kelembagaan-2026 ditampilkan hanya pada panel Admin sebagai berkas sumber. Berkas sumber tersebut belum otomatis menjadi arsip publik. Admin harus mengajukannya melalui alur sistem dan Master Admin menyetujuinya terlebih dahulu.

Catatan keamanan: file .env tidak disertakan dalam ZIP. Siapkan konfigurasi lokal berdasarkan backend/.env.example. Jangan membagikan nilai SESSION_SECRET atau password akun.
