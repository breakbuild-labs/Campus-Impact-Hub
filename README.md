# CAMPUS IMPACT HUB
### *Portal Autentikasi & Masuk Terpadu (Dedicated Login Web Edition)*

> **"Portal Akses Terintegrasi Civitas Akademika, Pengurus Organisasi, Dosen, dan Mitra Kampus."**

![Platform](https://img.shields.io/badge/Platform-Web%20Application-3B82F6?logo=googlechrome&logoColor=white)
![Stack](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20ES6%20Modules-F7DF1E?logo=javascript&logoColor=black)
![Design](https://img.shields.io/badge/UI-Clean%20Enterprise%20Login-334155)
![Server](https://img.shields.io/badge/Runtime-Node.js%20(Zero--Dependency)-339933?logo=nodedotjs&logoColor=white)

---

## Panduan Menjalankan Portal Login

Aplikasi web difokuskan secara khusus sebagai **Portal Masuk / Login & Autentikasi Mandiri**, bersih dari elemen yang tidak relevan, zero-dependency, dan dapat langsung dijalankan:

### Metode 1: Menggunakan Node.js Web Server (Direkomendasikan)
```bash
# Menjalankan server lokal
node server.js
# atau
npm start
```
Buka browser dan akses alamat berikut:
**`http://localhost:3000`**

### Metode 2: Langsung Menggunakan Web Browser
Buka berkas [index.html](file:///d:/Documents/Zamy%20Documets/D%20PBSB/CAMPUS-IMPACT-HUB/index.html) langsung pada peramban Google Chrome, Microsoft Edge, atau Mozilla Firefox.

---

## Akun Pengujian Demo (Sekali Klik)

Tersedia tombol pintas (*quick-fill chips*) pada formulir login untuk pengujian instan:

| Peran | Identitas / Email | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Mahasiswa** | `mahasiswa@kampus.ac.id` (NIM 13523001) | `password123` | Budi Santoso (S1 Teknik Informatika) |
| **Dosen / Admin** | `dosen@kampus.ac.id` (NIP 198501152010121002) | `password123` | Dr. Ir. Hendra Wijaya, M.T. (Direktorat Kemahasiswaan) |
| **Pengurus BEM** | `bem@kampus.ac.id` (NIM 13522045) | `password123` | Rizky Pratama (Presiden Mahasiswa BEM) |
| **Mitra Lembaga** | `mitra@kampus.ac.id` | `password123` | Yayasan Inovasi Berdaya (Mitra Pengabdian) |

Pengguna juga dapat memasukkan email/NIM dan kata sandi baru atau mendaftarkan akun baru melalui tab **Daftar Akun Baru**.

---

## Fitur Portal Login

1. **Masuk ke Akun (Login Form)**:
   * Input Email Kampus / NIM / NIP.
   * Input Kata Sandi dengan tombol *Show / Hide Password*.
   * Pilihan Peran Kampus (Mahasiswa, Dosen/Admin, Pengurus BEM/UKM, Mitra).
   * Checkbox *Ingat sesi masuk*.
   * Tautan *Lupa Sandi* dengan dialog interaktif.
   * Tombol *Single Sign-On (SSO) Kampus*.
2. **Pendaftaran Baru (Register Form)**:
   * Nama Lengkap, Email Kampus, Nomor Induk, Peran, dan Konfirmasi Sandi.
   * Tersimpan otomatis ke `localStorage` peramban.
3. **Sesi Terverifikasi (Authenticated Session View)**:
   * Menampilkan kartu status sesi aktif, ID token keamanan, rincian data pengguna, dan tombol **Keluar (Logout)** untuk kembali ke form login.
   * Mengikuti agenda kampus dan memperoleh **Tiket QR**.
   * Memantau akumulasi skor dampak (*Impact & Leadership Score*) serta mencetak Surat Keterangan Pendamping Ijazah (SKPI).
2. **Mitra Masyarakat (`partner`)**
   * Mengajukan kendala nyata masyarakat (*Submit Problem*) dilengkapi estimasi penerima manfaat.
   * Memantau progres penyelesaian inisiatif (*Open* &rarr; *On Going* &rarr; *Completed*).
   * Meninjau laporan dampak (*Impact Report*) sebelum dan sesudah implementasi.
3. **Pengurus Organisasi / UKM (`organization`)**
   * Mengajukan pendaftaran legalitas organisasi beserta nomor SK dan dosen pembina.
   * Membuka dan mengelola tahapan seleksi *Open Recruitment*.
   * Mempublikasikan event dan memvalidasi presensi peserta via pemindaian tiket QR.
4. **Admin Kampus (`admin`)**
   * Memverifikasi keabsahan dokumen SK organisasi (*Pending* &rarr; *Verified* atau *Rejected*).
   * Memvalidasi inisiatif proyek sosial dan agenda kampus.
   * Memantau analitik capaian dampak sosial dan integrasi MBKM secara menyeluruh.

---

## 4. Standar Konversi Poin Aktivitas (Activity Point System)

Setiap kontribusi mahasiswa yang tervalidasi otomatis menambah nilai skor:

| Aktivitas Terverifikasi | Nilai Poin | Alokasi Skor |
| :--- | :---: | :--- |
| **Mengikuti Event Kampus** (via Validasi QR) | **+10** | *Impact Score* |
| **Panitia Pelaksana Event** | **+20** | *Impact Score* & *Leadership Score* |
| **Pengurus Aktif Organisasi** (*Verified Organization*) | **+30** | *Impact Score* & *Leadership Score* |
| **Anggota Pelaksana Proyek Sosial** | **+50** | *Impact Score* |
| **Ketua Tim Proyek Sosial** | **+75** | *Impact Score* & *Leadership Score* |

---

## 5. Ringkasan 10 Layar Sistem (MVP)

1. **Screen 1 — Autentikasi & Pemilihan Peran**: Login, registrasi akun baru, dan pemilihan 4 role ekosistem.
2. **Screen 2 — Dashboard Utama**: Indikator analitik kampus, tautan aksi cepat, sorotan total dampak, dan integrasi AI Recommendation.
3. **Screen 3 — Katalog Proyek Sosial**: Direktori inisiatif dengan filter kategori, status, dan rincian kebutuhan tim.
4. **Screen 4 — Modal Detail Proyek**: Rincian kendala mitra, alur pendaftaran, dan laporan dampak kuantitatif.
5. **Screen 5 — Direktori Organisasi**: Daftar UKM dan lembaga kampus beserta status verifikasi legalitas SK.
6. **Screen 6 — Open Recruitment**: Pelacakan 4 tahapan seleksi pendaftaran pengurus (*Pendaftaran &rarr; Administrasi &rarr; Interview &rarr; Pengumuman*).
7. **Screen 7 — Event Hub & Tiket QR**: Pendaftaran agenda kegiatan kampus, render kode QR tiket, dan simulasi validasi presensi.
8. **Screen 8 — Formulir Pengajuan Masalah**: Input data kendala mitra masyarakat terintegrasi analisis AI Problem Matching otomatis.
9. **Screen 9 — Portofolio & SKPI**: Analisis skor dampak, tabel konversi aktivitas, dan fitur cetak dokumen SKPI resmi.
10. **Screen 10 — Profil Pengguna & Arsitektur**: Profil personal, pengubah peran instan, inspeksi snapshot database JSON, dan peta jalan sistem.

---

## 6. Struktur Direktori

```text
CAMPUS-IMPACT-HUB/
├── index.html            # Halaman utama aplikasi web (SPA)
├── server.js             # HTTP static server bawaan Node.js
├── package.json          # Konfigurasi proyek dan skrip npm start
├── css/
│   └── styles.css        # Desain enterprise, palet warna elegan, responsif
├── js/
│   ├── icons.js          # Library ikon vektor SVG (bebas emoji)
│   ├── models.js         # Entitas data, status, dan role ekosistem
│   ├── qr.js             # Generator kode QR tiket deterministik
│   ├── repository.js     # State management dan sinkronisasi localStorage
│   └── app.js            # Controller 10 layar, modal, filter, dan interaksi
└── README.md             # Dokumentasi teknis proyek
```
