# CHANGELOG — CAMPUS IMPACT HUB

---

## [2.2.0] — 19 November 2026 (Complete Master Development Specification)

### Added
* **Dynamic Multi-Role Registration (`js/app.js`, `server.js`)**: Formulir pendaftaran dinamis berdasarkan pilihan kategori akun (`Mahasiswa`, `BEM / UKM`, `Mitra UMKM`) lengkap dengan validasi konfirmasi kata sandi, keunikan NIM & Email, serta unggah dokumen SK (`PDF`/`JPG`/`JPEG`/`PNG`) dengan pratinjau dokumen.
* **Relational Event Registration & Participant Management (`event_registrations`)**: Pencatatan registrasi peserta per mahasiswa dengan atribut Nama, NIM, Fakultas, Program Studi, Waktu Registrasi, Status Registrasi (`Registered`/`Cancelled`), Status Kehadiran (`Registered`/`Attended`/`No Show`), dan `checkInTimestamp`.
* **Partner Student Performance Evaluation (`partner_evaluations`)**: Modul penilaian kinerja mahasiswa oleh Mitra UMKM dengan 5 kriteria standar (*Work Quality*, *Timeliness*, *Communication*, *Responsibility*, *Achievement of Project Objectives*), perhitungan rata-rata otomatis, ulasan tertulis, dan pencegahan duplikasi penilaian.
* **Dedicated Admin Verification, Audit Log, Data Integrity & Export (`js/app.js`, `js/repository.js`, `server.js`)**:
  * Modul khusus **Verifikasi Organisasi** dengan pratinjau & unduh dokumen SK serta persetujuan (`Verified`) atau penolakan wajib disertai alasan tertulis (`Rejected`).
  * Modul **Manajemen Mahasiswa** dengan fitur *Activate*, *Deactivate*, dan *Suspend* akun.
  * Modul **Database & Sistem** dengan 4 sub-panel: *Data Management & Inspection*, *Data Integrity Inspector*, *Activity & Audit Logs*, serta *System Configuration & Export JSON/CSV* (tanpa eksposur password/hash).
* **Documentation Suite**: Menambahkan `TESTING_REPORT.md` dan `CHANGELOG.md`, serta memperbarui `PROJECT_AUDIT.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `PERMISSION_MATRIX.md`, `DEVELOPMENT_PROGRESS.md`, dan `README.md`.

### Changed
* **Non-Destructive Database Persistence (`server.js`, `db/init.sql`)**: Menghapus seluruh perintah `DELETE FROM` pada PostgreSQL dan SQLite; menggantinya dengan `INSERT ... ON CONFLICT (id) DO UPDATE`, `INSERT OR REPLACE INTO`, dan `mergeRecordsById` disertai backup otomatis di `data/backups/`.
* **Server-Side Authentication & `scrypt` Password Hashing (`server.js`)**: Mengimplementasikan `crypto.scryptSync` + 16-byte random salt + `crypto.timingSafeEqual` serta Session Bearer Token.
* **Strict RBAC & Data Ownership Enforcement (`server.js`, `js/repository.js`, `js/app.js`)**: Setiap endpoint API kini memvalidasi role sekaligus kepemilikan data (`ownerUserId`, `organizationId`, `studentId`).
* **Verified Contribution Points System**: Poin kontribusi (`+10` peserta event, `+20` panitia, `+50` anggota proyek, `+75` ketua proyek) tidak lagi diberikan saat mahasiswa baru mendaftar, melainkan hanya setelah kehadiran/penyelesaian aktivitas divalidasi secara resmi.

### Removed
* Menghapus file `js/qr.js` dan seluruh fitur tiket/pemindaian QR Code dari aplikasi.
* Menghapus seluruh modul dan tabel **Open Recruitment** (`open_recruitments`, `SelectionStage`, `ApplicantStatus`).
* Menghapus fitur **Instant Role Switcher**, dropdown pemilihan role pada layar login, **Kolaborasi Proyek Sosial Organisasi**, **Rekam Dampak Organisasi**, **Workshop & Pelatihan UMKM**, **Mitra UKM Pelaksana**, dan modul terpisah **Impact Analytics**.
