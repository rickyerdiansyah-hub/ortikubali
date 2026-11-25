AUDIT DATA ORTIBALI — BERDASARKAN ZIP YANG DIKIRIM
Tanggal pemeriksaan: 5 November 2026

Perbaikan tampilan dan pembacaan data yang dilakukan:
1. MONSTER RB
   - 9 dataset sumber pada rb-data-2026.json, total 197 baris.
   - Tabel data resmi tetap menampilkan seluruh baris per dataset.
   - Contoh realisasi/angka grafik yang sebelumnya ditulis statis di dashboard dihilangkan karena tidak berasal dari berkas sumber yang tersedia.
   - Data rencana aksi resmi tetap dapat dilihat pada menu Data Resmi RB 2026.

2. DIANA
   - 4.196 baris data jabatan, 30 Perangkat Daerah, 255 unit kerja, dan 633 nomenklatur tersedia di diana-data.json.
   - Ringkasan grafik per Perangkat Daerah sebelumnya hanya memakai 8 PD. Kini agregat dibentuk dari seluruh baris sumber sehingga mencakup 30 PD.
   - Tabel menampilkan seluruh baris hasil filter, dan ekspor CSV mengambil seluruh hasil filter, bukan hanya baris yang sedang tampak di layar.

3. TATALAKSANA
   - ZIP memuat 5 entri SOP pada daftar awal.
   - Angka total dan grafik contoh yang sebelumnya menambahkan 1.243 data dan memakai angka tetap diubah agar dihitung dari 5 entri yang benar-benar ada.
   - Daftar SOP resmi tambahan belum dapat dilengkapi tanpa file sumber SOP yang belum disertakan.

4. PERPUSTAKAAN
   - Katalog awal memuat 10 dokumen yang ditautkan ke 10 PDF sumber.
   - ZIP memuat PDF lain di folder dokumen, tetapi sebagian merupakan arsip bidang Kelembagaan dan tidak otomatis dimasukkan ke katalog Perpustakaan agar kategori dan hak akses tidak berubah tanpa arahan.

5. KELEMBAGAAN
   - data.json memuat 131 entri dokumen dan 30 perangkat daerah.
   - Audit fisik menemukan 62 dari 131 file yang dirujuk tidak ada di ZIP ini. Status entri tersebut ditandai available=false agar antarmuka tidak memberikan tautan seolah-olah file tersedia.
   - Dokumen yang tersedia tetap dipertahankan. File yang hilang hanya dapat dipulihkan dari arsip sumber aslinya.

6. PELAYANAN PUBLIK
   - Data yang tersedia mencakup IKM 2023–2025, IPP 2023–2025, 3 nilai unit pada penilaian Ombudsman 2025, nilai akhir 82,57, dan realisasi fasilitasi 95%.
   - Rincian per unsur IKM, nilai lokus Dinas Sosial pada PEKPPP, daftar lengkap unit layanan, dan bukti dukung rinci tidak tersedia di sumber yang disertakan. Tidak ditambahkan angka perkiraan.

DATA SAKIP PADA MENU UTAMA
- Tersedia 37 skor Perangkat Daerah, 3 data historis, dan metadata 29 kelompok arsip.
- Daftar metadata menyebut 657 file dokumen, tetapi berkas arsip sumbernya tidak seluruhnya disertakan sebagai file fisik di ZIP ini.

BATASAN PENTING
- Tidak ada angka atau dokumen resmi yang dibuat-buat untuk mengisi kekosongan.
- Agar data yang hilang dapat dilengkapi secara akurat, perlu mengunggah arsip sumber asli untuk dokumen Kelembagaan yang hilang, kumpulan SOP Tatalaksana, dan bukti dukung/rincian Pelayanan Publik.
- Fungsi login, input, pengajuan, persetujuan, penolakan, notifikasi revisi, dan penyimpanan tidak diubah dalam perbaikan ini.
