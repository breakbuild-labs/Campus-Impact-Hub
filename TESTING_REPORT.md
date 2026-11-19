# TESTING REPORT — CAMPUS IMPACT HUB
**Tanggal Pengujian:** 19 November 2026  
**Versi Aplikasi:** 2.2.0  
**Status Pengujian:** 🟢 **25 / 25 Skenario Lulus (`100% PASS`)**

---

## 1. Ringkasan Eksekusi Pengujian Otomatis

Pengujian integrasi menyeluruh dilakukan terhadap backend REST API (`server.js`), repository layer (`js/repository.js`), dan skema data (`db/init.sql`) mencakup keempat peran pengguna (`student`, `organization`, `partner`, `admin`), validasi kriptografi `scrypt`, perlindungan non-destructive database, serta **percobaan akses ilegal (RBAC & Data Ownership violations)**.

| No | Skenario Pengujian | Peran / Aktor | Ekspektasi | Hasil Aktual | Status |
| :-: | :--- | :---: | :--- | :--- | :---: |
| 1 | `GET /api/health` memeriksa konfigurasi keamanan | System | Melaporkan `scrypt`, `server-side + client-side + data-ownership`, `non-destructive-upsert` | HTTP `200 OK` | ✅ PASS |
| 2 | `GET /api/state` memeriksa sanitasi password | Public | Seluruh objek user di `users[]` dan `currentUser` memiliki `password === undefined` | `true` (0 password bocor) | ✅ PASS |
| 3 | Login dengan email tidak terdaftar (`ghost@kampus.ac.id`) | Guest | Ditolak tanpa membuat akun baru (*No Auto-Create*) | HTTP `401 Unauthorized` | ✅ PASS |
| 4 | Registrasi publik memilih `role: 'admin'` | Guest (Illegal) | Ditolak oleh server | HTTP `403 Forbidden` | ✅ PASS |
| 5 | Mutasi `PUT /api/state` tanpa Bearer Token | Guest (Illegal) | Ditolak oleh server | HTTP `401 Unauthorized` | ✅ PASS |
| 6 | Registrasi mahasiswa baru dengan NIM duplikat (`13523001`) | Guest | Ditolak karena NIM sudah terdaftar | HTTP `409 Conflict` | ✅ PASS |
| 7 | Login Mahasiswa menggunakan NIM `13523001` & `password123` | `student` | Verifikasi hash `scrypt` berhasil, menerima Bearer Token & role `student` | HTTP `200 OK` | ✅ PASS |
| 8 | Mahasiswa mendaftar pada Event `EV002` | `student` | Membuat record `eventRegistrations` berstatus `Registered` | HTTP `200 OK` | ✅ PASS |
| 9 | Pemeriksaan poin mahasiswa setelah baru mendaftar event | `student` | Poin **tidak** bertambah sebelum kehadiran divalidasi panitia | `impactScore` tetap (`85`) | ✅ PASS |
| 10 | **Percobaan Akses Ilegal Mahasiswa**: membuat event, membuat proyek, memverifikasi SK organisasi, & memvalidasi kehadiran sendiri | `student` (Illegal) | Seluruh 4 percobaan ditolak oleh Server-Side RBAC | HTTP `403 Forbidden` (x4) | ✅ PASS |
| 11 | Registrasi dinamis akun BEM/UKM baru beserta metadata dokumen SK | `organization` | Akun dibuat & otomatis membuat entitas organisasi berstatus `PENDING` | HTTP `201 Created` | ✅ PASS |
| 12 | **Percobaan Akses Ilegal Organisasi Belum Terverifikasi**: mencoba mempublikasikan event resmi | `organization` (Unverified) | Ditolak karena status organisasi masih `PENDING` | HTTP `403 Forbidden` | ✅ PASS |
| 13 | **Percobaan Pelanggaran Kepemilikan Data (Ownership)**: organisasi lain mencoba memvalidasi peserta pada event `EV001` milik BEM | `organization` (Illegal Ownership) | Ditolak oleh Server-Side Ownership Guard | HTTP `403 Forbidden` | ✅ PASS |
| 14 | Login Pengurus Organisasi Terverifikasi (`bem@kampus.ac.id`) | `organization` | Berhasil login dengan hash `scrypt` sebagai `organization` | HTTP `200 OK` | ✅ PASS |
| 15 | **Percobaan Pelanggaran Kepemilikan Data (Ownership)**: BEM mencoba mengedit event `EV002` milik HIMATIF | `organization` (Illegal Ownership) | Ditolak oleh Server-Side Ownership Guard | HTTP `403 Forbidden` | ✅ PASS |
| 16 | BEM memvalidasi kehadiran manual mahasiswa via NIM `13523001` pada event miliknya (`EV001`) | `organization` | Status menjadi `Attended`, `checkInTimestamp` tercatat, mahasiswa menerima `+10 Impact Score` & transaksi portofolio | HTTP `200 OK` (`impactScore: 95`) | ✅ PASS |
| 17 | Percobaan validasi kehadiran ganda pada mahasiswa & event yang sama | `organization` | Ditolak untuk mencegah duplikasi poin | HTTP `409 Conflict` | ✅ PASS |
| 18 | Login Mitra UMKM (`umkm@kampus.ac.id`) | `partner` | Berhasil login dengan hash `scrypt` sebagai `partner` | HTTP `200 OK` | ✅ PASS |
| 19 | Mitra UMKM mengajukan permasalahan usaha baru | `partner` | Proyek dibuat dengan status `SUBMITTED` (masuk review Admin, tidak langsung `OPEN`) | HTTP `201 Created` (`status: SUBMITTED`) | ✅ PASS |
| 20 | **Percobaan Akses Ilegal Mitra UMKM**: mencoba menyetujui proyeknya sendiri dari `SUBMITTED` menjadi `OPEN` | `partner` (Illegal) | Ditolak oleh Server-Side RBAC | HTTP `403 Forbidden` | ✅ PASS |
| 21 | Mitra UMKM mengirim evaluasi kinerja 5 kriteria untuk mahasiswa pelaksana pada proyek `P001` | `partner` | Evaluasi tersimpan dengan skor rata-rata `4.80 / 5.00` | HTTP `201 Created` | ✅ PASS |
| 22 | Percobaan pengiriman evaluasi ganda untuk mahasiswa & proyek yang sama | `partner` | Ditolak untuk mencegah duplikasi evaluasi | HTTP `409 Conflict` | ✅ PASS |
| 23 | Login Admin Kampus (`dosen@kampus.ac.id`) | `admin` | Berhasil login dengan hash `scrypt` sebagai `admin` | HTTP `200 OK` | ✅ PASS |
| 24 | Admin menolak SK organisasi tanpa alasan (`400`), menolak dengan alasan tertulis (`200 REJECTED`), lalu menyetujui (`200 VERIFIED`) | `admin` | Status verifikasi dan alasan penolakan tercatat akurat serta masuk ke `auditLogs` | HTTP `400` &rarr; `200` &rarr; `200` | ✅ PASS |
| 25 | Uji ketahanan **Non-Destructive Upsert**: `PUT /api/state` dengan array kosong `{ projects: [], organizations: [], events: [] }` | `admin` | Seluruh record yang sudah ada di database tetap utuh (0 data hilang) | HTTP `200 OK` (Data Utuh) | ✅ PASS |

---

## 2. Verifikasi Penghapusan Fitur Usang (Static Code Audit)

Pemeriksaan menggunakan pencarian pola (`Select-String`) pada seluruh file aktif (`index.html`, `server.js`, `js/*.js`, `css/*.css`, `db/*.sql`):
* `DELETE FROM`: **0 kemunculan**
* `qrCode` / `qrTicket` / `qr_ticket` / `js/qr.js`: **0 kemunculan** (`js/qr.js` telah dihapus)
* `open_recruitments` / `openRecruitments` / `oprec`: **0 kemunculan**
* `switchRole`: **0 kemunculan**
