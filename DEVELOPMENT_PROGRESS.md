# DEVELOPMENT PROGRESS — CAMPUS IMPACT HUB
**Terakhir Diperbarui:** 19 November 2026  
**Versi:** 2.2.0 (Master Development Plan Implementation & Verification)

---

## 1. Status Fase Pengembangan

| Fase | Nama Fase | Status | Persentase | Keterangan |
| :---: | :--- | :---: | :---: | :--- |
| **PHASE 1** | **Repository Audit & Refactoring** | 🟢 **Selesai** | **100%** | Audit penuh kode web & identifikasi 21 file scratch di `PROJECT_AUDIT.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `PERMISSION_MATRIX.md`. |
| **PHASE 2** | **Authentication, `scrypt` & Role Management** | 🟢 **Selesai** | **100%** | Registrasi dinamis 3 kategori (`student`, `organization` + upload SK, `partner`), login berbasis akun (`scrypt`), penghapusan role switcher & dropdown role login, Session Bearer Token. |
| **PHASE 3** | **Core Role Modules (4 Roles)** | 🟢 **Selesai** | **100%** | Navigasi & modul spesifik untuk `student` (6 menu), `organization` (5 menu), `partner` (4 menu + Evaluasi 5 Kriteria), dan `admin` (7 menu). Seluruh 10 fitur usang (`Open Recruitment`, `QR`, dll.) dihapus. |
| **PHASE 4** | **Administration, Ownership RBAC & Integration** | 🟢 **Selesai** | **100%** | Manajemen mahasiswa (`Active`/`Inactive`/`Suspended`), Verifikasi SK Organisasi (Pratinjau/Unduh SK + Reject Reason), Persetujuan Proyek UMKM, Inspeksi Database, Integrity Check, Audit Logs, Export CSV/JSON. |
| **PHASE 5** | **Functional Testing & Illegal Access QA** | 🟢 **Selesai** | **100%** | 25/25 skenario pengujian integrasi otomatis lulus (`TESTING_REPORT.md`), mencakup keempat role serta percobaan akses ilegal & pelanggaran kepemilikan data (`401`/`403`/`409`). |
| **PHASE 6** | **Finalization & Documentation** | 🟢 **Selesai** | **100%** | Seluruh dokumentasi teknis (`PROJECT_AUDIT.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `PERMISSION_MATRIX.md`, `DEVELOPMENT_PROGRESS.md`, `TESTING_REPORT.md`, `CHANGELOG.md`) telah disinkronkan. |

---

## 2. Daftar Lengkap File yang Dibuat, Diubah, Ditambahkan, dan Dihapus

### A. File Kode & Database yang Diubah (`Modified`)
1. `server.js`:
   * Menghapus seluruh query `DELETE FROM` pada PostgreSQL & SQLite, diganti dengan **Non-Destructive Upsert** (`INSERT ... ON CONFLICT (id) DO UPDATE`, `INSERT OR REPLACE INTO`, `mergeRecordsById`) dan backup otomatis di `data/backups/`.
   * Mengimplementasikan hashing kata sandi `crypto.scryptSync` + 16-byte salt + `crypto.timingSafeEqual` serta sanitasi `password` (`sanitizeUser`).
   * Menambahkan endpoint granular yang memvalidasi **Role (RBAC)** dan **Kepemilikan Data (Data Ownership)**: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/change-password`, `/api/profile`, `/api/organizations`, `/api/organizations/verify`, `/api/events`, `/api/events/register`, `/api/events/validate-attendance`, `/api/projects`, `/api/projects/apply`, `/api/evaluations`, `/api/admin/users`, `/api/admin/system-config`.
2. `db/init.sql`:
   * Memperbarui skema PostgreSQL non-destruktif mencakup tabel `users`, `organizations`, `projects`, `events`, `event_registrations`, `project_registrations`, `partner_evaluations`, `portfolio_entries`, `audit_logs`, `system_config`, dan `app_session`.
   * Menghapus tabel `open_recruitments` dan kolom `qr_ticket_code`.
3. `js/models.js`:
   * Menambahkan definisi model `AccountStatus`, `VerificationStatus` (`DRAFT`, `PENDING`, `VERIFIED`, `REJECTED`), `ProjectStatus` (`SUBMITTED`, `UNDER_REVIEW`, `OPEN`, `ON_GOING`, `COMPLETED`, `REJECTED`), `EventPublicationStatus`, `RegistrationStatus`, `AttendanceStatus`, dan `EvaluationCriteria` (5 kriteria penilaian mahasiswa).
   * Menghapus enum `SelectionStage` dan `ApplicantStatus` (Open Recruitment).
4. `js/repository.js`:
   * Menghapus `openRecruitments`, `qrTicketCode`, dan `switchRole()`.
   * Mengimplementasikan helper kepemilikan data (`isOwnOrganization`, `isOwnEvent`, `isOwnProject`), pemeriksaan integritas data (`getDataIntegrityReport`), ekspor data aman (`exportCollectionToJson`, `exportCollectionToCsv`), dan integrasi penuh ke endpoint REST API backend.
5. `js/app.js`:
   * Mengimplementasikan **Registrasi Multi-Role Dinamis** (Mahasiswa, BEM/UKM dengan upload SK, Mitra UMKM) dan **Login Berbasis Akun** tanpa dropdown role.
   * Mengimplementasikan navigasi dan modul terpisah untuk keempat role sesuai spesifikasi, termasuk **Daftar Peserta & Validasi Kehadiran Manual (Nama/NIM)**, **Penilaian Kinerja Mahasiswa 5 Kriteria**, **Verifikasi SK Organisasi dengan Pratinjau/Unduh Dokumen**, dan **Panel Database & Sistem Admin**.
6. `js/icons.js`:
   * Menghapus ikon `qrCode` dan menambahkan ikon вектор `download`, `edit`, `xCircle`, `star`, serta `settings`.
7. `index.html`:
   * Menghapus tombol *Instant Role Switcher* di header dan menggantinya dengan badge peran terautentikasi *read-only* (`#headerRoleBadge`) serta tombol keluar (`#btnHeaderLogout`).

### B. File Dokumentasi & Backup yang Dibuat / Ditambahkan (`Created / Added`)
1. `PROJECT_AUDIT.md` — Laporan audit menyeluruh repositori dan tabel identifikasi 21 file scratch.
2. `ARCHITECTURE.md` — Dokumentasi arsitektur 4-layer, alur `scrypt` & Session Bearer Token, RBAC + Ownership, dan Non-Destructive Upsert.
3. `DATA_MODEL.md` — Spesifikasi ERD dan skema relasional 11 tabel/koleksi.
4. `PERMISSION_MATRIX.md` — Matriks hak akses dan aturan kepemilikan data untuk keempat role.
5. `DEVELOPMENT_PROGRESS.md` — Pelacakan kemajuan fase pengembangan dan daftar perubahan file.
6. `TESTING_REPORT.md` — Laporan hasil pengujian otomatis 25 skenario lintas role & percobaan akses ilegal (`100% PASS`).
7. `CHANGELOG.md` — Catatan riwayat perubahan versi aplikasi.
8. `data/backups/campus_db.backup_phase2.json`, `data/backups/campus_impact.backup_phase2.db`, dan `data/backups/campus_db.latest.bak.json` — Backup database non-destruktif otomatis.

### C. File Usang yang Dihapus (`Removed`)
1. `js/qr.js` — Modul generator matriks QR Code dihapus sepenuhnya sesuai spesifikasi penghapusan fitur QR. *(Catatan: 21 file `scratch_prev_*` di root direktori tetap dibiarkan utuh sesuai instruksi audit awal dan telah didokumentasikan di `PROJECT_AUDIT.md`).*
