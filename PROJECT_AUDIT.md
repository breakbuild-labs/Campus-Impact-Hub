# PROJECT AUDIT — CAMPUS IMPACT HUB
**Phase:** PHASE 1 & PHASE 2 — Repository Audit, Scratch Identification & Foundation Refactoring  
**Tanggal Audit:** 19 November 2026  
**Status:** Audit Selesai & Diperbarui sesuai Arahan Evaluasi (Belum Ada File Scratch yang Dihapus)

---

## 1. Pemeriksaan Struktur Folder dan Identifikasi 21 File Scratch/Helper

Sesuai instruksi evaluasi (**Poin 1**), **tidak ada satu pun file scratch yang dihapus secara langsung**. Seluruh 21 file scratch/helper di root direktori telah dianalisis fungsi, isi, ukuran, serta ketergantungannya terhadap file produksi (`index.html`, `server.js`, `package.json`, `Dockerfile`, `docker-compose.yml`, `css/styles.css`, `js/app.js`, `js/repository.js`, `js/models.js`, `js/icons.js`).

### 1.1 Tabel Identifikasi Lengkap 21 File Scratch & Helper di Root Direktori

| No | Nama File | Ukuran | Fungsi & Isi File | Referensi dari File Produksi | Referensi dari File Scratch Lain | Status Rekomendasi |
| :-: | :--- | :---: | :--- | :---: | :---: | :--- |
| 1 | `build_app.js` | 21.3 KB | Script Node.js one-off yang membaca `scratch_prev_app_134.js` dan mengganti fungsi `renderAuthScreen()` untuk menghasilkan `js/app.js`. | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (script generator lama) |
| 2 | `patch_app.js` | 3.3 KB | Script Node.js one-off yang menyisipkan `render_auth_snippet.txt` ke `scratch_prev_app_134.js` dan menambahkan tombol logout header. | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (script patcher lama) |
| 3 | `render_auth_snippet.txt` | 19.0 KB | Potongan teks kode fungsi `renderAuthScreen()` (versi "Tentang Kamu") yang digunakan oleh `patch_app.js`. | **Tidak Ada (`[]`)** | `patch_app.js` | Aman dihapus setelah disetujui (snippet teks lama) |
| 4 | `scratch_prev_app_61.js` | 92.2 KB | Snapshot backup `js/app.js` generasi awal (10 layar MVP sebelum pembaruan enterprise UI). | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 5 | `scratch_prev_app_96.js` | 94.5 KB | Snapshot backup `js/app.js` generasi kedua (migrasi ikon SVG bebas emoji). | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 6 | `scratch_prev_app_134.js` | 102.5 KB | Snapshot backup `js/app.js` generasi ketiga (dengan Auth Gate & input data). Dibaca oleh `build_app.js` & `patch_app.js`. | **Tidak Ada (`[]`)** | `build_app.js`, `patch_app.js` | Aman dihapus bersama `build_app.js` & `patch_app.js` |
| 7 | `scratch_prev_app_179.js` | 24.9 KB | Snapshot controller khusus ketika aplikasi sempat dijadikan "Dedicated Login Portal" saja. | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 8 | `scratch_prev_css_59.css` | 18.2 KB | Snapshot backup `css/styles.css` generasi pertama (Material 3 Web). | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 9 | `scratch_prev_css_92.css` | 20.4 KB | Snapshot backup `css/styles.css` generasi kedua (Enterprise UI awal). | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 10 | `scratch_prev_css_132.css` | 20.5 KB | Snapshot backup `css/styles.css` generasi ketiga. | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 11 | `scratch_prev_css_177.css` | 16.2 KB | Snapshot backup `css/styles.css` versi Dedicated Login Portal. | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 12 | `scratch_prev_styles.css` | 16.2 KB | Duplikat identik dari `scratch_prev_css_177.css` (16.240 bytes). | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (duplikat snapshot) |
| 13 | `scratch_prev_index.html` | 2.8 KB | Snapshot `index.html` versi Dedicated Login Portal (identik dengan `scratch_prev_index_175.html`). | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 14 | `scratch_prev_index_63.html` | 5.4 KB | Snapshot `index.html` generasi pertama. | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 15 | `scratch_prev_index_94.html` | 10.1 KB | Snapshot `index.html` generasi kedua. | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 16 | `scratch_prev_index_130.html` | 10.4 KB | Snapshot `index.html` generasi ketiga. | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 17 | `scratch_prev_index_175.html` | 2.8 KB | Snapshot `index.html` versi Dedicated Login Portal. | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 18 | `scratch_prev_repo_57.js` | 39.3 KB | Snapshot `js/repository.js` generasi pertama (dengan mock data statis penuh). | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 19 | `scratch_prev_repo_128.js` | 24.8 KB | Snapshot `js/repository.js` generasi ketiga (`localStorage` only sebelum PostgreSQL). | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 20 | `scratch_prev_repo_173.js` | 7.6 KB | Snapshot `js/repository.js` versi Dedicated Login Portal. | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (snapshot historis) |
| 21 | `scratch_prev_repository.js` | 7.6 KB | Duplikat identik dari `scratch_prev_repo_173.js` (7.614 bytes). | **Tidak Ada (`[]`)** | Tidak Ada | Aman dihapus setelah disetujui (duplikat snapshot) |

> **Kesimpulan Pemeriksaan Ketergantungan File Scratch**:
> Seluruh 21 file di atas memiliki **`0` ketergantungan dari kode produksi aktif**. Seluruhnya merupakan riwayat backup manual dari sesi-sesi eksperimen sebelumnya. Sesuai instruksi Anda, **ke-21 file ini tetap dipertahankan (tidak dihapus)** sampai Anda memberikan instruksi penghapusan.

---

## 2. Evaluasi Mekanisme Full-State Dump (`PUT /api/state`) & Keamanan Database

1. **Temuan Risiko Data Loss**:
   * Sebelumnya, `saveFullStateToDb()` di `server.js` melakukan `DELETE FROM projects`, `DELETE FROM organizations`, `DELETE FROM open_recruitments`, `DELETE FROM events`, dan `DELETE FROM portfolio_entries` sebelum melakukan `INSERT` ulang dari payload client.
   * Demikian pula `syncToSqlite()` melakukan `DELETE FROM ${table}` pada seluruh tabel SQLite.
2. **Solusi Arsitektur Non-Destruktif (Diimplementasikan pada Tahap Ini)**:
   * **Backup Otomatis**: Seluruh data eksisting (`data/campus_db.json` dan `data/campus_impact.db`) telah dibackup ke `data/backups/`.
   * **Upsert Non-Destruktif (`INSERT ... ON CONFLICT (id) DO UPDATE`)**: Seluruh operasi penyimpanan ke PostgreSQL, SQLite, dan JSON diubah dari `DELETE FROM` menjadi **Upsert per ID record** serta penggabungan (*merge by ID*) agar data yang sudah ada di database **tidak pernah terhapus** oleh sinkronisasi client.
   * **Granular & Protected Endpoints**: Menambahkan validasi autentikasi dan RBAC server-side pada setiap mutasi state.

---

## 3. Evaluasi Sistem Autentikasi, Password Hashing & RBAC Server-Side

1. **Password Hashing (`crypto.scryptSync`)**:
   * Password yang sebelumnya disimpan dan dikirim dalam bentuk plaintext kini di-hash menggunakan `scrypt` + random salt 16-byte (`scrypt$<salt>$<hash>`) dengan verifikasi `crypto.timingSafeEqual`.
   * Migrasi non-destruktif otomatis mengubah password plaintext lama menjadi hash `scrypt` saat server memuat database.
   * Seluruh response API (`GET /api/state`, `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `GET /api/seed-accounts`) menghapus atribut `password` sebelum dikirim ke client (`sanitizeUser`).
2. **Autentikasi Server-Side & Session Token**:
   * Login dan registrasi wajib melewati validasi server (`POST /api/auth/login` dan `POST /api/auth/register`) yang menerbitkan **Session Bearer Token** (`Authorization: Bearer <token>`).
   * Celah *Auto-Create User* saat email/NIM tidak ditemukan telah **dihapus sepenuhnya**.
   * Mutasi role saat login dan registrasi mandiri sebagai `admin` telah **diblokir di sisi server (`403 Forbidden`)**.
3. **Penegakan RBAC Server-Side & Client-Side**:
   * Server memvalidasi Bearer Token dan role pengguna pada setiap request mutasi (`PUT /api/state`, `POST /api/demo`, `POST /api/reset`, dll.).
   * Jika pengguna dengan role yang tidak berwenang mencoba memodifikasi entitas (misalnya `student` mencoba membuat event, membuat proyek, membuka oprec, memverifikasi SK organisasi, mengubah status proyek, atau memvalidasi kehadiran event), **server menolak request tersebut dengan HTTP `403 Forbidden`**.

---

## 4. Penghapusan Alur Presensi QR & Penggantian dengan Validasi Manual (Nama / NIM)

Sesuai instruksi evaluasi (**Poin 4 & 5**):
1. **Seluruh Alur Presensi QR Dihapus**:
   * Pembuatan kode tiket QR, modal tampilan QR Code, serta tombol *Simulasi Scan QR Peserta / Panitia* oleh mahasiswa telah dihapus dari alur aplikasi.
2. **Digantikan dengan Validasi Kehadiran Manual oleh Organisasi (Berdasarkan Nama atau NIM)**:
   * Mahasiswa yang mendaftar event tercatat sebagai peserta terdaftar dengan identitas Nama & NIM.
   * Hanya akun ber-role **Organisasi (`organization`)** (dan **Admin (`admin`)**) yang dapat membuka panel **Validasi Kehadiran Manual Peserta** pada event untuk mencari/memasukkan **Nama atau NIM Mahasiswa** dan mengonfirmasi kehadiran peserta (+10 Impact Score) atau panitia (+20 Impact & +20 Leadership Score).

---

## 5. Daftar Fitur Terlarang yang Telah Diidentifikasi & Dihapus Secara Terkontrol

| No | Fitur Terlarang | Lokasi Sebelumnya | Tindakan Kontrol |
| :-: | :--- | :--- | :--- |
| 1 | **Instant Role Switcher** (Ganti role tanpa login) | Header (`#btnRoleSwitcher`), Sidebar (`#sidebarRoleSwitcher`), Profil (`#btnProfileSwitchRole`), `repository.switchRole()` | Dihapus; diganti dengan indikator badge role *read-only* sesuai sesi autentikasi server. |
| 2 | **Alur Presensi & Tiket QR Code** | Event Hub (`renderEventsHub`, `showQrTicketModal`, `confirmEventAttendanceByQr`) | Dihapus; diganti dengan **Validasi Kehadiran Manual oleh Organisasi berdasarkan Nama atau NIM**. |
| 3 | **Auto-Create User saat Login Gagal** | `CampusRepository.login()` | Dihapus; login dengan akun tidak terdaftar ditolak oleh server (`401 Unauthorized`). |
| 4 | **Dropdown Pilihan Role pada Form Login** | `renderAuthScreen()` (`#authRoleSelect` saat mode Login) | Dihapus dari mode Login (hanya tampil pada mode Registrasi untuk memilih `student`, `organization`, atau `partner`). |
| 5 | **Tombol SSO Bypass & Duplikasi Panel "Tentang Kami"** | `renderAuthScreen()` (`#btnAuthSso` & `.about-you-panel`) | Tombol SSO palsu (yang otomatis login sebagai Budi Santoso) dan blok HTML duplikat dihapus. |
| 6 | **Aksi Lintas Role Tanpa Izin (Self-Approval)** | Mahasiswa verifikasi SK, mahasiswa luluskan Oprec sendiri, mahasiswa ubah status proyek, mahasiswa buat UKM/Event | Diblokir di UI (`js/app.js`), di Repository (`js/repository.js`), dan di Server (`server.js`). |
| 7 | **Panel Debug & Reset Database untuk Non-Admin** | `renderProfileScreen()` (`#btnResetData`, `#btnLoadDemoData`, `#btnViewDbJson`) | Disembunyikan dari seluruh role non-admin dan diproteksi middleware `requireRole(['admin'])` di server. |
