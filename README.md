# CAMPUS IMPACT HUB
### *Platform Ekosistem Kampus & Dampak Sosial (Full-Stack PostgreSQL & Docker Edition)*

> **"Satu Platform Terintegrasi untuk Mahasiswa, Pengurus Organisasi, Dosen/Admin, dan Mitra Masyarakat."**

![Platform](https://img.shields.io/badge/Platform-Web%20Application-3B82F6?logo=googlechrome&logoColor=white)
![Database](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Container-Docker%20Compose-2496ED?logo=docker&logoColor=white)
![Server](https://img.shields.io/badge/Backend-Node.js%20REST%20API-339933?logo=nodedotjs&logoColor=white)

---

## 1. Menjalankan Aplikasi via Docker (Direkomendasikan)

Aplikasi sudah dikonfigurasi penuh menggunakan **Docker Compose** yang menjalankan **2 container**:
1. **`campus-impact-db`** — Database relasional **PostgreSQL 16 Alpine** (Port `5432`) dengan inisialisasi skema & data otomatis dari `db/init.sql`.
2. **`campus-impact-web`** — Backend REST API & Web Server **Node.js 20 Alpine** (Port `3000`).

```bash
# Menjalankan aplikasi & database PostgreSQL di Docker
docker compose up -d --build

# Melihat status container
docker compose ps

# Menghentikan container
docker compose down
```

Setelah container berjalan, akses:
* **Web Application**: `http://localhost:3000`
* **Database Health API**: `http://localhost:3000/api/health`
* **Database State API**: `http://localhost:3000/api/state`

---

## 2. Navigasi Sidebar Kiri Berdasarkan Role (Role-Based Sidebar)

Sidebar bagian kiri otomatis menyesuaikan **menu navigasi, label seksi, tombol aksi cepat, indikator badge, dan warna aksen** sesuai peran pengguna yang sedang aktif:

| Role | Menu Sidebar Kiri Khusus | Tombol Aksi Cepat Sidebar |
| :--- | :--- | :--- |
| **Mahasiswa (`student`)** | Dashboard Mahasiswa, Cari Proyek Sosial, Direktori UKM & BEM, Open Recruitment, Event & Tiket QR, Portofolio & SKPI, Profil & Akun | `Eksplorasi Proyek Sosial` |
| **Dosen / Admin (`admin`)** | Dashboard Supervisi, Verifikasi SK Organisasi, Supervisi Proyek MBKM, Validasi Agenda Event, Analitik Dampak Kampus, Database & Sistem Server | `Verifikasi SK / Tambah Proyek` |
| **Pengurus BEM / UKM (`organization`)** | Dashboard Pengurus, Profil & Legalitas UKM, Kelola Open Recruitment, Manajemen Event & QR, Kolaborasi Proyek Sosial, Rekam Dampak Organisasi, Profil Pengurus | `Terbitkan Event Organisasi` |
| **UMKM (`partner`)** | Dashboard UMKM, Proyek & Masalah UMKM, Laporan Dampak Usaha, Workshop & Pelatihan UMKM, Mitra UKM Pelaksana, Profil Usaha UMKM | `Ajukan Kebutuhan UMKM Baru` |

---

## 3. Skema Database PostgreSQL (`db/init.sql`)

Seluruh data tersimpan secara persisten di dalam tabel-tabel PostgreSQL:
* `users` — Data akun pengguna (Mahasiswa, Dosen/Admin, Pengurus BEM/UKM, UMKM) beserta *Impact Score* & *Leadership Score*.
* `projects` — Data proyek pengabdian masyarakat, status (`OPEN`, `ON_GOING`, `COMPLETED`), dan laporan dampak JSONB.
* `organizations` — Data UKM/Himpunan/BEM beserta nomor SK dan status verifikasi (`PENDING`, `VERIFIED`, `REJECTED`).
* `open_recruitments` — Data pembukaan rekrutmen pengurus organisasi dan tahapan seleksi 4 langkah.
* `events` — Data agenda kampus, kuota peserta, kode tiket QR, dan status presensi.
* `portfolio_entries` — Rekam jejak capaian mahasiswa untuk pencetakan dokumen SKPI.
* `app_session` — Penyimpanan sesi aktif lintas perangkat.

---

## 4. Akun Demo Pengujian Cepat

| Peran | Identitas / Email | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Mahasiswa** | `mahasiswa@kampus.ac.id` | `password123` | Budi Santoso (S1 Teknik Informatika) |
| **Dosen / Admin** | `dosen@kampus.ac.id` | `password123` | Dr. Ir. Hendra Wijaya, M.T. |
| **Pengurus BEM** | `bem@kampus.ac.id` | `password123` | Rizky Pratama (Presiden Mahasiswa BEM) |
| **UMKM** | `umkm@kampus.ac.id` | `password123` | UMKM Maju Jaya (Pelaku UMKM Terverifikasi) |
