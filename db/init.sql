-- ============================================================================
-- Campus Impact Hub - PostgreSQL Database Schema & Initial Seed
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    identity_number VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    major_or_unit VARCHAR(255),
    faculty VARCHAR(255),
    status VARCHAR(100),
    impact_score INTEGER DEFAULT 0,
    leadership_score INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    umkm_helped INTEGER DEFAULT 0,
    beneficiaries_reached INTEGER DEFAULT 0,
    contribution_hours INTEGER DEFAULT 0,
    bio TEXT,
    interests JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    organization_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    location VARCHAR(255),
    photo_caption VARCHAR(255),
    impact_score INTEGER DEFAULT 85,
    requirements JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'OPEN',
    verified_by_admin BOOLEAN DEFAULT false,
    applicant_count INTEGER DEFAULT 0,
    user_application_state VARCHAR(50) DEFAULT 'NONE',
    user_role_in_project VARCHAR(255),
    impact_report JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    full_name VARCHAR(255),
    category VARCHAR(100),
    logo_initials VARCHAR(10),
    sk_number VARCHAR(150),
    advisor_name VARCHAR(255),
    contact VARCHAR(255),
    description TEXT,
    member_count INTEGER DEFAULT 1,
    verification_status VARCHAR(50) DEFAULT 'PENDING',
    is_user_joined BOOLEAN DEFAULT false,
    is_user_officer BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS open_recruitments (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64),
    organization_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    positions JSONB DEFAULT '[]'::jsonb,
    deadline VARCHAR(100),
    status VARCHAR(50) DEFAULT 'open',
    current_stage VARCHAR(50) DEFAULT 'PENDAFTARAN',
    selected_position VARCHAR(255),
    applicant_status VARCHAR(50) DEFAULT 'NONE',
    total_applicants INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    organizer_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'WORKSHOP',
    description TEXT,
    date VARCHAR(150),
    location VARCHAR(255),
    quota INTEGER DEFAULT 100,
    registered_count INTEGER DEFAULT 0,
    points_reward INTEGER DEFAULT 10,
    committee_points_reward INTEGER DEFAULT 20,
    poster_summary TEXT,
    verified_by_admin BOOLEAN DEFAULT true,
    is_registered BOOLEAN DEFAULT false,
    is_attended BOOLEAN DEFAULT false,
    qr_ticket_code VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolio_entries (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    organization_or_partner VARCHAR(255),
    category VARCHAR(100),
    date VARCHAR(100),
    impact_points INTEGER DEFAULT 0,
    leadership_points INTEGER DEFAULT 0,
    outcome_summary TEXT,
    credential_code VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_session (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Accounts
INSERT INTO users (id, name, email, identity_number, password, role, major_or_unit, faculty, status, impact_score, leadership_score, bio, interests, skills)
VALUES
  (
    'U-MHS-001',
    'Budi Santoso',
    'mahasiswa@kampus.ac.id',
    '13523001',
    'password123',
    'student',
    'S1 Teknik Informatika — PBSB',
    'Fakultas Ilmu Komputer & Teknologi Informasi',
    'Mahasiswa Aktif',
    85,
    30,
    'Mahasiswa santri berprestasi yang berfokus pada kolaborasi rekayasa perangkat lunak dan solusi teknologi tepat guna untuk pemberdayaan masyarakat, UMKM, dan digitalisasi organisasi kampus.',
    '["Teknologi Tepat Guna", "Pengembangan Komunitas", "Pemberdayaan Santri"]'::jsonb,
    '["Full-Stack Web", "UI/UX Design", "Database Architecture"]'::jsonb
  ),
  (
    'U-DSN-002',
    'Dr. Ir. Hendra Wijaya, M.T.',
    'dosen@kampus.ac.id',
    'NIP 198501152010121002',
    'password123',
    'admin',
    'Direktorat Kemahasiswaan & Riset',
    'Direktorat Kemahasiswaan & Pengabdian Masyarakat',
    'Dosen Pembina & Admin',
    0,
    0,
    'Dosen pembina dan pengelola ekosistem kemahasiswaan dan pengabdian MBKM kampus.',
    '["Riset Pengabdian", "Supervisi MBKM", "Tata Kelola Kampus"]'::jsonb,
    '["Supervisi Proyek", "Audit Kurikulum", "Kemitraan Industri"]'::jsonb
  ),
  (
    'U-BEM-003',
    'Rizky Pratama',
    'bem@kampus.ac.id',
    '13522045',
    'password123',
    'organization',
    'Presiden Mahasiswa BEM',
    'Badan Eksekutif Mahasiswa Universitas',
    'Pengurus Organisasi Resmi',
    60,
    60,
    'Pengurus BEM yang mengkoordinasikan kegiatan, advokasi mahasiswa, dan kolaborasi organisasi se-universitas.',
    '["Advokasi Mahasiswa", "Manajemen Event", "Kepemimpinan"]'::jsonb,
    '["Public Speaking", "Event Organizing", "Team Coordination"]'::jsonb
  ),
  (
    'U-MTR-004',
    'UMKM Maju Jaya',
    'umkm@kampus.ac.id',
    'UMKM-2026-08',
    'password123',
    'partner',
    'Pelaku Usaha Mikro, Kecil & Menengah (UMKM)',
    'Jaringan Mitra UMKM Kampus Berdampak',
    'UMKM Terverifikasi',
    0,
    0,
    'Pelaku UMKM binaan yang berkolaborasi dengan mahasiswa untuk digitalisasi pembukuan kasir, manajemen stok, dan pemasaran produk lokal.',
    '["Digitalisasi UMKM", "Pemasaran Produk Lokal", "Manajemen Usaha"]'::jsonb,
    '["Manajemen Toko", "Produksi Kuliner & Ritel", "Kemitraan Usaha"]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Sample Data so the Database has Rich Records out of the box
INSERT INTO projects (id, organization_name, title, description, category, location, photo_caption, impact_score, requirements, status, verified_by_admin, applicant_count, user_application_state, user_role_in_project, impact_report)
VALUES
  (
    'P001',
    'UMKM Maju Jaya',
    'Digitalisasi Sistem Pembukuan & Kasir UMKM',
    'Pencatatan harian masih manual menggunakan buku tulis. Membutuhkan sistem kasir digital dan identitas visual terpadu.',
    'Teknologi',
    'Kec. Coblong, Kota Bandung',
    'Dokumentasi Toko & Produksi UMKM Maju Jaya',
    85,
    '["2 Informatika", "1 Desain Komunikasi Visual"]'::jsonb,
    'OPEN',
    true,
    3,
    'NONE',
    'Anggota Proyek Sosial (+50 Poin)',
    '{"id": "I001", "projectId": "P001", "beforeCondition": "Manual (Pembukuan kertas rawan selisih)", "afterCondition": "Digital (Aplikasi POS Terintegrasi)", "beneficiaries": 120, "sdgCategory": "SDG 8: Pertumbuhan Ekonomi & Pekerjaan Layak", "partnerFeedback": "Sangat membantu efisiensi pembukuan dan meminimalisir kesalahan stok."}'::jsonb
  ),
  (
    'P002',
    'Desa Mandiri Sejahtera',
    'Sistem Informasi Bank Sampah & Smart Village',
    'Pengelolaan tabungan sampah warga desa dan administrasi surat pengantar RT/RW masih belum terkomputerisasi.',
    'Lingkungan',
    'Kab. Bandung Barat',
    'Kegiatan Penimbangan Bank Sampah Warga Desa',
    90,
    '["2 Informatika", "1 Teknik Lingkungan"]'::jsonb,
    'ON_GOING',
    true,
    5,
    'NONE',
    'Anggota Proyek Sosial (+50 Poin)',
    '{"id": "I002", "projectId": "P002", "beforeCondition": "Pencatatan tabungan sampah warga tercecer", "afterCondition": "Dashboard Bank Sampah Digital & Rekap Otomatis", "beneficiaries": 350, "sdgCategory": "SDG 11: Kota & Pemukiman Berkelanjutan", "partnerFeedback": "Warga sangat terbantu dengan transparansi saldo tabungan sampah."}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO organizations (id, name, full_name, category, logo_initials, sk_number, advisor_name, contact, description, member_count, verification_status, is_user_joined, is_user_officer)
VALUES
  (
    'ORG001',
    'HIMATIF',
    'Himpunan Mahasiswa Teknik Informatika',
    'Teknologi',
    'HT',
    'SK/REKTOR/ORG-001/2026',
    'Dr. Ir. Hendra Wijaya, M.T.',
    'himatif@kampus.ac.id',
    'Organisasi kemahasiswaan jurusan Teknik Informatika yang berfokus pada software engineering dan pengabdian teknologi.',
    120,
    'VERIFIED',
    true,
    false
  ),
  (
    'ORG002',
    'BEM UNIVERSITAS',
    'Badan Eksekutif Mahasiswa Universitas',
    'Kepemimpinan & Sosial',
    'BEM',
    'SK/REKTOR/BEM-002/2026',
    'Dr. Ir. Hendra Wijaya, M.T.',
    'bem@kampus.ac.id',
    'Lembaga eksekutif mahasiswa tingkat universitas yang menggerakkan advokasi, kolaborasi organisasi, dan pengabdian masyarakat.',
    85,
    'VERIFIED',
    false,
    false
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO open_recruitments (id, organization_id, organization_name, title, positions, deadline, status, current_stage, selected_position, applicant_status, total_applicants)
VALUES
  (
    'REC001',
    'ORG001',
    'HIMATIF',
    'Open Recruitment Staf & Riset Pengabdian 2026/2027',
    '["Pengabdian Masyarakat", "Software Engineering", "UI/UX Design"]'::jsonb,
    '20 Desember 2026',
    'open',
    'PENDAFTARAN',
    NULL,
    'NONE',
    18
  ),
  (
    'REC002',
    'ORG002',
    'BEM UNIVERSITAS',
    'Perekrutan Kementerian Sosial Masyarakat & Inovasi',
    '["Kementerian Sosmas", "Riset & Data", "Media Kreatif"]'::jsonb,
    '30 Desember 2026',
    'open',
    'PENDAFTARAN',
    NULL,
    'NONE',
    24
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO events (id, title, organizer_name, type, description, date, location, quota, registered_count, points_reward, committee_points_reward, poster_summary, verified_by_admin, is_registered, is_attended, qr_ticket_code)
VALUES
  (
    'EV001',
    'Workshop Desain Solusi Digital untuk Dampak Sosial',
    'HIMATIF',
    'WORKSHOP',
    'Pelatihan intensif perancangan solusi teknologi tepat guna bagi mitra UMKM dan desa binaan.',
    '28 November 2026 • 09:00 WIB',
    'Auditorium Gedung Utama',
    150,
    42,
    10,
    20,
    'Publikasi Resmi: E-Sertifikat Terakreditasi MBKM & +10 Impact Score',
    true,
    false,
    false,
    'CIH-EV001-U-MHS-001'
  ),
  (
    'EV002',
    'Seminar Nasional Kolaborasi Kampus & UMKM Berdaya',
    'BEM UNIVERSITAS',
    'SEMINAR',
    'Forum kolaborasi antara mahasiswa, dosen pembina, dan mitra UMKM untuk akselerasi ekonomi lokal.',
    '05 Desember 2026 • 13:00 WIB',
    'Aula Barat Kampus Utama',
    250,
    98,
    10,
    20,
    'Terbuka untuk Mahasiswa, Pengurus UKM, Dosen & Mitra Masyarakat',
    true,
    false,
    false,
    'CIH-EV002-U-MHS-001'
  )
ON CONFLICT (id) DO NOTHING;
