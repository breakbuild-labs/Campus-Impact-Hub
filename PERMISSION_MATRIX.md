# PERMISSION MATRIX (RBAC & DATA OWNERSHIP SPECIFICATION) — CAMPUS IMPACT HUB
**Versi:** 2.2.0 (Centralized Server-Side & Client-Side RBAC + Ownership Enforcement)

---

## 1. Navigasi & Modul per Peran (Sesuai Spesifikasi Master Instruction)

| Peran (`role`) | Daftar Menu Navigasi Resmi | Fitur Lama yang Dihapus dari Peran Ini |
| :--- | :--- | :--- |
| **Mahasiswa (`student`)** | 1. Dashboard<br>2. Proyek Sosial<br>3. Organisasi<br>4. Event Kampus<br>5. Portofolio<br>6. Profil | Open Recruitment, Tiket/Scan QR, Role Switcher, Pembuatan Proyek/Organisasi/Event |
| **BEM / UKM (`organization`)** | 1. Dashboard<br>2. Pendaftaran Organisasi<br>3. Profil Organisasi<br>4. Manajemen Event<br>5. Daftar Peserta | Open Recruitment, Kolaborasi Proyek Sosial, Rekam Dampak Organisasi, QR Scanner |
| **Mitra UMKM (`partner`)** | 1. Dashboard<br>2. Pengajuan Masalah<br>3. Proyek Saya<br>4. Penilaian Mahasiswa | Workshop & Pelatihan UMKM, Mitra UKM Pelaksana, Persetujuan Proyek Mandiri |
| **Admin / Dosen (`admin`)** | 1. Dashboard<br>2. Mahasiswa<br>3. Organisasi<br>4. Verifikasi Organisasi<br>5. Event Kampus<br>6. Proyek Sosial<br>7. Database & Sistem | Modul terpisah Impact Analytics, Role Switcher |

---

## 2. Matriks Hak Akses & Validasi Kepemilikan Data (Server-Side Enforced)

| Modul & Operasi | `student` | `organization` | `partner` | `admin` | Validasi Kepemilikan Data (Ownership) & Aturan Server |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Autentikasi & Akun** | | | | | |
| Login (`POST /api/auth/login`) | ✅ | ✅ | ✅ | ✅ | Verifikasi `scrypt` + wajib `accountStatus === 'Active'` |
| Registrasi Publik (`POST /api/auth/register`) | ✅ | ✅ | ✅ | ❌ (`403`) | Role permanen; validasi keunikan Email & NIM (`409`) |
| Edit Profil & Ganti Sandi (`/api/profile`) | ✅ (Sendiri) | ✅ (Sendiri) | ✅ (Sendiri) | ✅ | Hanya dapat mengubah data milik `auth.user.id` sendiri |
| **Organisasi & Verifikasi SK** | | | | | |
| Melihat Organisasi Terverifikasi | ✅ | ✅ | ❌ | ✅ (Semua) | Mahasiswa hanya melihat organisasi berstatus `VERIFIED` |
| Pendaftaran & Upload SK (`POST /api/organizations`) | ❌ (`403`) | ✅ (Miliknya) | ❌ (`403`) | ✅ | `isOrganizationOwnedByUser`: hanya pemilik organisasi yang dapat mengedit/mengajukan ulang SK |
| Verifikasi / Tolak SK (`POST /api/organizations/verify`) | ❌ (`403`) | ❌ (`403`) | ❌ (`403`) | ✅ | Khusus `admin`; penolakan wajib menyertakan `rejectionReason` |
| **Event Kampus & Presensi Manual** | | | | | |
| Melihat Event Published | ✅ | ✅ (Miliknya) | ❌ | ✅ (Semua) | Publikasi event resmi hanya untuk organisasi `VERIFIED` |
| Buat / Edit Event (`POST`/`PUT /api/events`) | ❌ (`403`) | ✅ (Miliknya & Verified) | ❌ (`403`) | ✅ | Organisasi `PENDING`/`REJECTED` ditolak (`403`); edit event milik organisasi lain ditolak (`403`) |
| Daftar / Batal Event (`POST /api/events/register`) | ✅ (Sendiri) | ❌ (`403`) | ❌ (`403`) | ❌ (`403`) | Cek kapasitas & duplikasi (`409`); poin tidak diberikan saat baru mendaftar |
| Validasi Kehadiran Manual (`POST /api/events/validate-attendance`) | ❌ (`403`) | ✅ (Event Miliknya) | ❌ (`403`) | ✅ | `isEventOwnedByUser`: organisasi dilarang memvalidasi kehadiran pada event organisasi lain (`403`) |
| **Proyek Sosial & Evaluasi Mahasiswa** | | | | | |
| Mengajukan Masalah (`POST /api/projects`) | ❌ (`403`) | ❌ (`403`) | ✅ (`SUBMITTED`) | ✅ (`OPEN`) | Pengajuan UMKM wajib masuk status `SUBMITTED` untuk direview Admin |
| Menyetujui Proyek ke `OPEN` / Menolak | ❌ (`403`) | ❌ (`403`) | ❌ (`403`) | ✅ | Mitra UMKM dilarang menyetujui proyeknya sendiri ke `OPEN` (`403`) |
| Update Progress Proyek (`ON_GOING` / `COMPLETED`) | ❌ (`403`) | ❌ (`403`) | ✅ (Proyek Miliknya) | ✅ | `isProjectOwnedByUser`: UMKM hanya dapat memperbarui proyek miliknya sendiri |
| Mendaftar Proyek Sosial (`POST /api/projects/apply`) | ✅ | ❌ (`403`) | ❌ (`403`) | ❌ (`403`) | Hanya untuk proyek `OPEN`; cegah pendaftaran ganda (`409`) |
| Evaluasi Kinerja Mahasiswa (`POST /api/evaluations`) | ❌ (`403`) | ❌ (`403`) | ✅ (Proyek Miliknya) | ✅ | Hanya untuk mahasiswa yang terdaftar pada proyek milik UMKM tersebut; cegah duplikasi (`409`) |
| **Administrasi Sistem & Database** | | | | | |
| Kelola Status Akun Mahasiswa (`Active`/`Inactive`/`Suspended`) | ❌ (`403`) | ❌ (`403`) | ❌ (`403`) | ✅ | Khusus `admin` (`PUT /api/admin/users`) |
| Inspeksi Database, Integrity Check, Audit Log, Export CSV/JSON | ❌ (`403`) | ❌ (`403`) | ❌ (`403`) | ✅ | Seluruh ekspor data membersihkan field `password` dan `passwordHash` |
