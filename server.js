const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://campus_user:campus_pass123@localhost:5432/campus_impact_db';
const DATA_DIR = path.join(__dirname, 'data');
const SQLITE_DB_FILE = path.join(DATA_DIR, 'campus_impact.db');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'campus_db.json');
const INIT_SQL_FILE = path.join(__dirname, 'db', 'init.sql');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================================
// DEFAULT SEED DATA
// ============================================================================
const DEFAULT_USERS = [
  {
    id: 'U-MHS-001',
    name: 'Budi Santoso',
    email: 'mahasiswa@kampus.ac.id',
    identityNumber: '13523001',
    password: 'password123',
    role: 'student',
    majorOrUnit: 'S1 Teknik Informatika — PBSB',
    faculty: 'Fakultas Ilmu Komputer & Teknologi Informasi',
    status: 'Mahasiswa Aktif',
    impactScore: 85,
    leadershipScore: 30,
    projectsCompleted: 1,
    umkmHelped: 1,
    beneficiariesReached: 120,
    contributionHours: 12,
    bio: 'Mahasiswa santri berprestasi yang berfokus pada kolaborasi rekayasa perangkat lunak dan solusi teknologi tepat guna untuk pemberdayaan masyarakat, UMKM, dan digitalisasi organisasi kampus.',
    interests: ['Teknologi Tepat Guna', 'Pengembangan Komunitas', 'Pemberdayaan Santri'],
    skills: ['Full-Stack Web', 'UI/UX Design', 'Database Architecture']
  },
  {
    id: 'U-DSN-002',
    name: 'Dr. Ir. Hendra Wijaya, M.T.',
    email: 'dosen@kampus.ac.id',
    identityNumber: 'NIP 198501152010121002',
    password: 'password123',
    role: 'admin',
    majorOrUnit: 'Direktorat Kemahasiswaan & Riset',
    faculty: 'Direktorat Kemahasiswaan & Pengabdian Masyarakat',
    status: 'Dosen Pembina & Admin',
    impactScore: 0,
    leadershipScore: 0,
    projectsCompleted: 0,
    umkmHelped: 0,
    beneficiariesReached: 0,
    contributionHours: 0,
    bio: 'Dosen pembina dan pengelola ekosistem kemahasiswaan dan pengabdian MBKM kampus.',
    interests: ['Riset Pengabdian', 'Supervisi MBKM', 'Tata Kelola Kampus'],
    skills: ['Supervisi Proyek', 'Audit Kurikulum', 'Kemitraan Industri']
  },
  {
    id: 'U-BEM-003',
    name: 'Rizky Pratama',
    email: 'bem@kampus.ac.id',
    identityNumber: '13522045',
    password: 'password123',
    role: 'organization',
    majorOrUnit: 'Presiden Mahasiswa BEM',
    faculty: 'Badan Eksekutif Mahasiswa Universitas',
    status: 'Pengurus Organisasi Resmi',
    impactScore: 60,
    leadershipScore: 60,
    projectsCompleted: 1,
    umkmHelped: 1,
    beneficiariesReached: 80,
    contributionHours: 16,
    bio: 'Pengurus BEM yang mengkoordinasikan kegiatan, advokasi mahasiswa, dan kolaborasi organisasi se-universitas.',
    interests: ['Advokasi Mahasiswa', 'Manajemen Event', 'Kepemimpinan'],
    skills: ['Public Speaking', 'Event Organizing', 'Team Coordination']
  },
  {
    id: 'U-MTR-004',
    name: 'UMKM Maju Jaya',
    email: 'umkm@kampus.ac.id',
    identityNumber: 'UMKM-2026-08',
    password: 'password123',
    role: 'partner',
    majorOrUnit: 'Pelaku Usaha Mikro, Kecil & Menengah (UMKM)',
    faculty: 'Jaringan Mitra UMKM Kampus Berdampak',
    status: 'UMKM Terverifikasi',
    impactScore: 0,
    leadershipScore: 0,
    projectsCompleted: 0,
    umkmHelped: 2,
    beneficiariesReached: 470,
    contributionHours: 0,
    bio: 'Pelaku UMKM binaan yang berkolaborasi dengan mahasiswa untuk digitalisasi pembukuan kasir, manajemen stok, dan pemasaran produk lokal.',
    interests: ['Digitalisasi UMKM', 'Pemasaran Produk Lokal', 'Manajemen Usaha'],
    skills: ['Manajemen Toko', 'Produksi Kuliner & Ritel', 'Kemitraan Usaha']
  }
];

const DEMO_PROJECTS = [
  {
    id: 'P001',
    organizationName: 'UMKM Maju Jaya',
    title: 'Digitalisasi Sistem Pembukuan & Kasir UMKM',
    description: 'Pencatatan harian masih manual menggunakan buku tulis. Membutuhkan sistem kasir digital dan identitas visual terpadu.',
    category: 'Teknologi',
    location: 'Kec. Coblong, Kota Bandung',
    photoCaption: 'Dokumentasi Toko & Produksi UMKM Maju Jaya',
    impactScore: 85,
    requirements: ['2 Informatika', '1 Desain Komunikasi Visual'],
    status: 'OPEN',
    verifiedByAdmin: true,
    applicantCount: 3,
    userApplicationState: 'NONE',
    userRoleInProject: 'Anggota Proyek Sosial (+50 Poin)',
    impactReport: {
      id: 'I001',
      projectId: 'P001',
      beforeCondition: 'Manual (Pembukuan kertas rawan selisih)',
      afterCondition: 'Digital (Aplikasi POS Terintegrasi)',
      beneficiaries: 120,
      sdgCategory: 'SDG 8: Pertumbuhan Ekonomi & Pekerjaan Layak',
      partnerFeedback: 'Sangat membantu efisiensi pembukuan dan meminimalisir kesalahan stok.'
    }
  },
  {
    id: 'P002',
    organizationName: 'Desa Mandiri Sejahtera',
    title: 'Sistem Informasi Bank Sampah & Smart Village',
    description: 'Pengelolaan tabungan sampah warga desa dan administrasi surat pengantar RT/RW masih belum terkomputerisasi.',
    category: 'Lingkungan',
    location: 'Kab. Bandung Barat',
    photoCaption: 'Kegiatan Penimbangan Bank Sampah Warga Desa',
    impactScore: 90,
    requirements: ['2 Informatika', '1 Teknik Lingkungan'],
    status: 'ON_GOING',
    verifiedByAdmin: true,
    applicantCount: 5,
    userApplicationState: 'NONE',
    userRoleInProject: 'Anggota Proyek Sosial (+50 Poin)',
    impactReport: {
      id: 'I002',
      projectId: 'P002',
      beforeCondition: 'Pencatatan tabungan sampah warga tercecer',
      afterCondition: 'Dashboard Bank Sampah Digital & Rekap Otomatis',
      beneficiaries: 350,
      sdgCategory: 'SDG 11: Kota & Pemukiman Berkelanjutan',
      partnerFeedback: 'Warga sangat terbantu dengan transparansi saldo tabungan sampah.'
    }
  }
];

const DEMO_ORGANIZATIONS = [
  {
    id: 'ORG001',
    name: 'HIMATIF',
    fullName: 'Himpunan Mahasiswa Teknik Informatika',
    category: 'Teknologi',
    logoInitials: 'HT',
    skNumber: 'SK/REKTOR/ORG-001/2026',
    advisorName: 'Dr. Ir. Hendra Wijaya, M.T.',
    contact: 'himatif@kampus.ac.id',
    description: 'Organisasi kemahasiswaan jurusan Teknik Informatika yang berfokus pada software engineering dan pengabdian teknologi.',
    memberCount: 120,
    verificationStatus: 'VERIFIED',
    isUserJoined: true,
    isUserOfficer: false
  },
  {
    id: 'ORG002',
    name: 'BEM UNIVERSITAS',
    fullName: 'Badan Eksekutif Mahasiswa Universitas',
    category: 'Kepemimpinan & Sosial',
    logoInitials: 'BEM',
    skNumber: 'SK/REKTOR/BEM-002/2026',
    advisorName: 'Dr. Ir. Hendra Wijaya, M.T.',
    contact: 'bem@kampus.ac.id',
    description: 'Lembaga eksekutif mahasiswa tingkat universitas yang menggerakkan advokasi, kolaborasi organisasi, dan pengabdian masyarakat.',
    memberCount: 85,
    verificationStatus: 'VERIFIED',
    isUserJoined: false,
    isUserOfficer: false
  }
];

const DEMO_RECRUITMENTS = [
  {
    id: 'REC001',
    organizationId: 'ORG001',
    organizationName: 'HIMATIF',
    title: 'Open Recruitment Staf & Riset Pengabdian 2026/2027',
    positions: ['Pengabdian Masyarakat', 'Software Engineering', 'UI/UX Design'],
    deadline: '20 Desember 2026',
    status: 'open',
    currentStage: 'PENDAFTARAN',
    selectedPosition: null,
    applicantStatus: 'NONE',
    totalApplicants: 18
  },
  {
    id: 'REC002',
    organizationId: 'ORG002',
    organizationName: 'BEM UNIVERSITAS',
    title: 'Perekrutan Kementerian Sosial Masyarakat & Inovasi',
    positions: ['Kementerian Sosmas', 'Riset & Data', 'Media Kreatif'],
    deadline: '30 Desember 2026',
    status: 'open',
    currentStage: 'PENDAFTARAN',
    selectedPosition: null,
    applicantStatus: 'NONE',
    totalApplicants: 24
  }
];

const DEMO_EVENTS = [
  {
    id: 'EV001',
    title: 'Workshop Desain Solusi Digital untuk Dampak Sosial',
    organizerName: 'HIMATIF',
    type: 'WORKSHOP',
    description: 'Pelatihan intensif perancangan solusi teknologi tepat guna bagi mitra UMKM dan desa binaan.',
    date: '28 November 2026 • 09:00 WIB',
    location: 'Auditorium Gedung Utama',
    quota: 150,
    registeredCount: 42,
    pointsReward: 10,
    committeePointsReward: 20,
    posterSummary: 'Publikasi Resmi: E-Sertifikat Terakreditasi MBKM & +10 Impact Score',
    verifiedByAdmin: true,
    isRegistered: false,
    isAttended: false,
    qrTicketCode: 'CIH-EV001-U-MHS-001'
  },
  {
    id: 'EV002',
    title: 'Seminar Nasional Kolaborasi Kampus & UMKM Berdaya',
    organizerName: 'BEM UNIVERSITAS',
    type: 'SEMINAR',
    description: 'Forum kolaborasi antara mahasiswa, dosen pembina, dan mitra UMKM untuk akselerasi ekonomi lokal.',
    date: '05 Desember 2026 • 13:00 WIB',
    location: 'Aula Barat Kampus Utama',
    quota: 250,
    registeredCount: 98,
    pointsReward: 10,
    committeePointsReward: 20,
    posterSummary: 'Terbuka untuk Mahasiswa, Pengurus UKM, Dosen & Mitra Masyarakat',
    verifiedByAdmin: true,
    isRegistered: false,
    isAttended: false,
    qrTicketCode: 'CIH-EV002-U-MHS-001'
  }
];

// ============================================================================
// DATABASE ENGINE (PostgreSQL 16 Docker Primary + SQLite Relational Fallback)
// ============================================================================
let pgPool = null;
let isPgConnected = false;
let sqliteDb = null;

function initSqliteFallback() {
  try {
    const { DatabaseSync } = require('node:sqlite');
    sqliteDb = new DatabaseSync(SQLITE_DB_FILE);
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS open_recruitments (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS portfolio_entries (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS app_session (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  } catch (e) {
    sqliteDb = null;
  }
}

function syncToSqlite(state) {
  if (!sqliteDb) return;
  try {
    sqliteDb.exec('BEGIN');
    const tables = [
      ['users', state.users || []],
      ['projects', state.projects || []],
      ['organizations', state.organizations || []],
      ['open_recruitments', state.openRecruitments || []],
      ['events', state.events || []],
      ['portfolio_entries', state.portfolioEntries || []]
    ];
    for (const [table, items] of tables) {
      sqliteDb.exec(`DELETE FROM ${table}`);
      const stmt = sqliteDb.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
      for (const item of items) {
        stmt.run(String(item.id), JSON.stringify(item));
      }
    }
    const sessStmt = sqliteDb.prepare(`INSERT OR REPLACE INTO app_session (key, value) VALUES ('current_session', ?)`);
    sessStmt.run(JSON.stringify({ isLoggedIn: Boolean(state.isLoggedIn), currentUser: state.currentUser }));
    sqliteDb.exec('COMMIT');
  } catch (e) {
    try { sqliteDb.exec('ROLLBACK'); } catch (_) {}
  }
}

async function initDatabase() {
  initSqliteFallback();
  try {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      connectionTimeoutMillis: 3000
    });

    const client = await pgPool.connect();
    try {
      if (fs.existsSync(INIT_SQL_FILE)) {
        const sql = fs.readFileSync(INIT_SQL_FILE, 'utf8');
        await client.query(sql);
      }
      isPgConnected = true;
      console.log('[DB] Terhubung ke PostgreSQL Database (' + DATABASE_URL.replace(/:[^:@]+@/, ':***@') + ')');
    } finally {
      client.release();
    }
  } catch (err) {
    isPgConnected = false;
    ensureLocalDbInitialized();
    const initial = readLocalDb();
    syncToSqlite(initial);
    console.log('[DB] Menggunakan SQLite & JSON Database (' + SQLITE_DB_FILE + '). Siap beralih ke PostgreSQL saat Docker berjalan.');
  }
}

function getInitialFallbackState() {
  return {
    isLoggedIn: false,
    currentUser: JSON.parse(JSON.stringify(DEFAULT_USERS[0])),
    users: JSON.parse(JSON.stringify(DEFAULT_USERS)),
    projects: JSON.parse(JSON.stringify(DEMO_PROJECTS)),
    organizations: JSON.parse(JSON.stringify(DEMO_ORGANIZATIONS)),
    openRecruitments: JSON.parse(JSON.stringify(DEMO_RECRUITMENTS)),
    events: JSON.parse(JSON.stringify(DEMO_EVENTS)),
    portfolioEntries: []
  };
}

function ensureLocalDbInitialized() {
  if (!fs.existsSync(LOCAL_DB_FILE)) {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(getInitialFallbackState(), null, 2), 'utf8');
  }
}

function readLocalDb() {
  ensureLocalDbInitialized();
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
  } catch (e) {
    return getInitialFallbackState();
  }
}

function writeLocalDb(state) {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(state, null, 2), 'utf8');
    syncToSqlite(state);
  } catch (e) {
    console.error('[DB] Gagal menulis file database lokal:', e.message);
  }
}

async function getFullStateFromDb() {
  if (isPgConnected && pgPool) {
    try {
      const [usersRes, projRes, orgRes, recRes, evRes, pfRes, sessRes] = await Promise.all([
        pgPool.query('SELECT * FROM users ORDER BY created_at ASC'),
        pgPool.query('SELECT * FROM projects ORDER BY created_at DESC'),
        pgPool.query('SELECT * FROM organizations ORDER BY created_at DESC'),
        pgPool.query('SELECT * FROM open_recruitments ORDER BY created_at DESC'),
        pgPool.query('SELECT * FROM events ORDER BY created_at DESC'),
        pgPool.query('SELECT * FROM portfolio_entries ORDER BY created_at DESC'),
        pgPool.query("SELECT value FROM app_session WHERE key = 'current_session'")
      ]);

      const users = usersRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        identityNumber: r.identity_number,
        password: r.password,
        role: r.role,
        majorOrUnit: r.major_or_unit,
        faculty: r.faculty,
        status: r.status,
        impactScore: r.impact_score || 0,
        leadershipScore: r.leadership_score || 0,
        projectsCompleted: r.projects_completed || 0,
        umkmHelped: r.umkm_helped || 0,
        beneficiariesReached: r.beneficiaries_reached || 0,
        contributionHours: r.contribution_hours || 0,
        bio: r.bio || '',
        interests: Array.isArray(r.interests) ? r.interests : [],
        skills: Array.isArray(r.skills) ? r.skills : []
      }));

      const projects = projRes.rows.map(r => ({
        id: r.id,
        organizationName: r.organization_name,
        title: r.title,
        description: r.description,
        category: r.category,
        location: r.location,
        photoCaption: r.photo_caption,
        impactScore: r.impact_score || 85,
        requirements: Array.isArray(r.requirements) ? r.requirements : [],
        status: r.status || 'OPEN',
        verifiedByAdmin: Boolean(r.verified_by_admin),
        applicantCount: r.applicant_count || 0,
        userApplicationState: r.user_application_state || 'NONE',
        userRoleInProject: r.user_role_in_project || 'Anggota Proyek Sosial (+50 Poin)',
        impactReport: r.impact_report || {}
      }));

      const organizations = orgRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        category: r.category,
        logoInitials: r.logo_initials,
        skNumber: r.sk_number,
        advisorName: r.advisor_name,
        contact: r.contact,
        description: r.description,
        memberCount: r.member_count || 1,
        verificationStatus: r.verification_status || 'PENDING',
        isUserJoined: Boolean(r.is_user_joined),
        isUserOfficer: Boolean(r.is_user_officer)
      }));

      const openRecruitments = recRes.rows.map(r => ({
        id: r.id,
        organizationId: r.organization_id,
        organizationName: r.organization_name,
        title: r.title,
        positions: Array.isArray(r.positions) ? r.positions : [],
        deadline: r.deadline,
        status: r.status || 'open',
        currentStage: r.current_stage || 'PENDAFTARAN',
        selectedPosition: r.selected_position,
        applicantStatus: r.applicant_status || 'NONE',
        totalApplicants: r.total_applicants || 0
      }));

      const events = evRes.rows.map(r => ({
        id: r.id,
        title: r.title,
        organizerName: r.organizer_name,
        type: r.type || 'WORKSHOP',
        description: r.description,
        date: r.date,
        location: r.location,
        quota: r.quota || 100,
        registeredCount: r.registered_count || 0,
        pointsReward: r.points_reward || 10,
        committeePointsReward: r.committee_points_reward || 20,
        posterSummary: r.poster_summary,
        verifiedByAdmin: Boolean(r.verified_by_admin),
        isRegistered: Boolean(r.is_registered),
        isAttended: Boolean(r.is_attended),
        qrTicketCode: r.qr_ticket_code
      }));

      const portfolioEntries = pfRes.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        organizationOrPartner: r.organization_or_partner,
        category: r.category,
        date: r.date,
        impactPoints: r.impact_points || 0,
        leadershipPoints: r.leadership_points || 0,
        outcomeSummary: r.outcome_summary,
        credentialCode: r.credential_code
      }));

      const sessData = sessRes.rows[0]?.value || {};
      const state = {
        dbEngine: 'PostgreSQL 16 (Docker)',
        isLoggedIn: Boolean(sessData.isLoggedIn),
        currentUser: sessData.currentUser || users[0] || DEFAULT_USERS[0],
        users: users.length ? users : DEFAULT_USERS,
        projects,
        organizations,
        openRecruitments,
        events,
        portfolioEntries
      };

      writeLocalDb(state);
      return state;
    } catch (err) {
      console.error('[DB] Error query PostgreSQL:', err.message);
    }
  }

  const local = readLocalDb();
  local.dbEngine = isPgConnected ? 'PostgreSQL 16 (Docker)' : (sqliteDb ? 'SQLite + PostgreSQL Ready' : 'Local Persistent DB');
  return local;
}

async function saveFullStateToDb(state) {
  writeLocalDb(state);

  if (!isPgConnected || !pgPool) return;

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO app_session (key, value, updated_at)
       VALUES ('current_session', $1::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify({ isLoggedIn: Boolean(state.isLoggedIn), currentUser: state.currentUser || DEFAULT_USERS[0] })]
    );

    if (Array.isArray(state.users)) {
      for (const u of state.users) {
        await client.query(
          `INSERT INTO users (id, name, email, identity_number, password, role, major_or_unit, faculty, status, impact_score, leadership_score, projects_completed, umkm_helped, beneficiaries_reached, contribution_hours, bio, interests, skills)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18::jsonb)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             identity_number = EXCLUDED.identity_number,
             password = EXCLUDED.password,
             role = EXCLUDED.role,
             major_or_unit = EXCLUDED.major_or_unit,
             faculty = EXCLUDED.faculty,
             status = EXCLUDED.status,
             impact_score = EXCLUDED.impact_score,
             leadership_score = EXCLUDED.leadership_score,
             projects_completed = EXCLUDED.projects_completed,
             umkm_helped = EXCLUDED.umkm_helped,
             beneficiaries_reached = EXCLUDED.beneficiaries_reached,
             contribution_hours = EXCLUDED.contribution_hours,
             bio = EXCLUDED.bio,
             interests = EXCLUDED.interests,
             skills = EXCLUDED.skills`,
          [
            u.id,
            u.name || 'Pengguna',
            u.email || `${u.id}@kampus.ac.id`,
            u.identityNumber || '',
            u.password || 'password123',
            u.role || 'student',
            u.majorOrUnit || '',
            u.faculty || '',
            u.status || 'Aktif',
            u.impactScore || 0,
            u.leadershipScore || 0,
            u.projectsCompleted || 0,
            u.umkmHelped || 0,
            u.beneficiariesReached || 0,
            u.contributionHours || 0,
            u.bio || '',
            JSON.stringify(u.interests || []),
            JSON.stringify(u.skills || [])
          ]
        );
      }
    }

    if (state.currentUser && state.currentUser.id) {
      const cu = state.currentUser;
      await client.query(
        `UPDATE users SET
           name = $2,
           role = $3,
           major_or_unit = $4,
           identity_number = $5,
           impact_score = $6,
           leadership_score = $7,
           projects_completed = $8,
           umkm_helped = $9,
           beneficiaries_reached = $10,
           contribution_hours = $11
         WHERE id = $1`,
        [
          cu.id,
          cu.name || 'Pengguna',
          cu.role || 'student',
          cu.majorOrUnit || '',
          cu.identityNumber || '',
          cu.impactScore || 0,
          cu.leadershipScore || 0,
          cu.projectsCompleted || 0,
          cu.umkmHelped || 0,
          cu.beneficiariesReached || 0,
          cu.contributionHours || 0
        ]
      );
    }

    await client.query('DELETE FROM projects');
    if (Array.isArray(state.projects)) {
      for (const p of state.projects) {
        await client.query(
          `INSERT INTO projects (id, organization_name, title, description, category, location, photo_caption, impact_score, requirements, status, verified_by_admin, applicant_count, user_application_state, user_role_in_project, impact_report)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15::jsonb)`,
          [
            p.id,
            p.organizationName || 'Mitra Masyarakat',
            p.title || 'Proyek Sosial',
            p.description || '',
            p.category || 'Teknologi',
            p.location || 'Bandung',
            p.photoCaption || '',
            p.impactScore || 85,
            JSON.stringify(p.requirements || []),
            p.status || 'OPEN',
            Boolean(p.verifiedByAdmin),
            p.applicantCount || 0,
            p.userApplicationState || 'NONE',
            p.userRoleInProject || 'Anggota Proyek Sosial (+50 Poin)',
            JSON.stringify(p.impactReport || {})
          ]
        );
      }
    }

    await client.query('DELETE FROM organizations');
    if (Array.isArray(state.organizations)) {
      for (const o of state.organizations) {
        await client.query(
          `INSERT INTO organizations (id, name, full_name, category, logo_initials, sk_number, advisor_name, contact, description, member_count, verification_status, is_user_joined, is_user_officer)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            o.id,
            o.name || 'UKM',
            o.fullName || o.name || 'Unit Kegiatan Mahasiswa',
            o.category || 'Teknologi',
            o.logoInitials || 'UKM',
            o.skNumber || '',
            o.advisorName || '',
            o.contact || '',
            o.description || '',
            o.memberCount || 1,
            o.verificationStatus || 'PENDING',
            Boolean(o.isUserJoined),
            Boolean(o.isUserOfficer)
          ]
        );
      }
    }

    await client.query('DELETE FROM open_recruitments');
    if (Array.isArray(state.openRecruitments)) {
      for (const r of state.openRecruitments) {
        await client.query(
          `INSERT INTO open_recruitments (id, organization_id, organization_name, title, positions, deadline, status, current_stage, selected_position, applicant_status, total_applicants)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11)`,
          [
            r.id,
            r.organizationId || 'ORG001',
            r.organizationName || 'Organisasi',
            r.title || 'Open Recruitment',
            JSON.stringify(r.positions || []),
            r.deadline || '',
            r.status || 'open',
            r.currentStage || 'PENDAFTARAN',
            r.selectedPosition || null,
            r.applicantStatus || 'NONE',
            r.totalApplicants || 0
          ]
        );
      }
    }

    await client.query('DELETE FROM events');
    if (Array.isArray(state.events)) {
      for (const e of state.events) {
        await client.query(
          `INSERT INTO events (id, title, organizer_name, type, description, date, location, quota, registered_count, points_reward, committee_points_reward, poster_summary, verified_by_admin, is_registered, is_attended, qr_ticket_code)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [
            e.id,
            e.title || 'Event Kampus',
            e.organizerName || 'Organisasi',
            e.type || 'WORKSHOP',
            e.description || '',
            e.date || '',
            e.location || '',
            e.quota || 100,
            e.registeredCount || 0,
            e.pointsReward || 10,
            e.committeePointsReward || 20,
            e.posterSummary || '',
            Boolean(e.verifiedByAdmin),
            Boolean(e.isRegistered),
            Boolean(e.isAttended),
            e.qrTicketCode || ''
          ]
        );
      }
    }

    await client.query('DELETE FROM portfolio_entries');
    if (Array.isArray(state.portfolioEntries)) {
      for (const pf of state.portfolioEntries) {
        await client.query(
          `INSERT INTO portfolio_entries (id, user_id, title, organization_or_partner, category, date, impact_points, leadership_points, outcome_summary, credential_code)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            pf.id,
            pf.userId || state.currentUser?.id || 'U-MHS-001',
            pf.title || 'Aktivitas',
            pf.organizationOrPartner || '',
            pf.category || 'Project Sosial',
            pf.date || 'Baru Saja',
            pf.impactPoints || 0,
            pf.leadershipPoints || 0,
            pf.outcomeSummary || '',
            pf.credentialCode || ''
          ]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB] Gagal menyimpan transaksi ke PostgreSQL:', err.message);
  } finally {
    client.release();
  }
}

// ============================================================================
// HTTP SERVER & REST API
// ============================================================================
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  // --- API Endpoints ---
  if (pathname === '/api/health' && req.method === 'GET') {
    const state = await getFullStateFromDb();
    return sendJson(res, 200, {
      status: 'healthy',
      database: {
        connected: true,
        engine: state.dbEngine,
        postgresActive: isPgConnected,
        sqliteActive: Boolean(sqliteDb),
        tables: {
          users: (state.users || []).length,
          projects: (state.projects || []).length,
          organizations: (state.organizations || []).length,
          open_recruitments: (state.openRecruitments || []).length,
          events: (state.events || []).length,
          portfolio_entries: (state.portfolioEntries || []).length
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/api/seed-accounts' && req.method === 'GET') {
    return sendJson(res, 200, {
      seedAccounts: DEFAULT_USERS.map(u => ({
        id: u.id,
        role: u.role,
        name: u.name,
        email: u.email,
        identityNumber: u.identityNumber,
        password: u.password,
        majorOrUnit: u.majorOrUnit
      }))
    });
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const { identifier, password } = await parseJsonBody(req);
      const cleanId = (identifier || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();
      const state = await getFullStateFromDb();
      const allUsers = Array.isArray(state.users) && state.users.length ? state.users : DEFAULT_USERS;
      const matched = allUsers.find(u =>
        u.email.toLowerCase() === cleanId ||
        (u.identityNumber && u.identityNumber.toLowerCase().includes(cleanId))
      );
      if (!matched || (matched.password && matched.password !== cleanPass)) {
        return sendJson(res, 401, { success: false, message: 'Email/NIM/NIP atau kata sandi tidak sesuai.' });
      }
      state.isLoggedIn = true;
      state.currentUser = matched;
      await saveFullStateToDb(state);
      return sendJson(res, 200, {
        success: true,
        user: matched,
        role: matched.role
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/state' && req.method === 'GET') {
    const state = await getFullStateFromDb();
    return sendJson(res, 200, state);
  }

  if (pathname === '/api/state' && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const body = await parseJsonBody(req);
      await saveFullStateToDb(body);
      return sendJson(res, 200, {
        success: true,
        dbEngine: isPgConnected ? 'PostgreSQL 16 (Docker)' : (sqliteDb ? 'SQLite + PostgreSQL Ready' : 'Local Persistent DB')
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/demo' && req.method === 'POST') {
    try {
      const current = await getFullStateFromDb();
      const updated = {
        ...current,
        projects: JSON.parse(JSON.stringify(DEMO_PROJECTS)),
        organizations: JSON.parse(JSON.stringify(DEMO_ORGANIZATIONS)),
        openRecruitments: JSON.parse(JSON.stringify(DEMO_RECRUITMENTS)),
        events: JSON.parse(JSON.stringify(DEMO_EVENTS))
      };
      await saveFullStateToDb(updated);
      return sendJson(res, 200, updated);
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/reset' && req.method === 'POST') {
    try {
      const emptyState = {
        isLoggedIn: true,
        currentUser: JSON.parse(JSON.stringify(DEFAULT_USERS[0])),
        users: JSON.parse(JSON.stringify(DEFAULT_USERS)),
        projects: [],
        organizations: [],
        openRecruitments: [],
        events: [],
        portfolioEntries: []
      };
      await saveFullStateToDb(emptyState);
      return sendJson(res, 200, emptyState);
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // --- Static File Serving ---
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache'
        });
        res.end(content);
      }
    });
  });
});

initDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`CAMPUS IMPACT HUB - FULL-STACK WEB & DATABASE SERVER`);
    console.log(`-------------------------------------------------------`);
    console.log(`URL Aplikasi : http://localhost:${PORT}`);
    console.log(`API Health   : http://localhost:${PORT}/api/health`);
    console.log(`API Database : http://localhost:${PORT}/api/state`);
    console.log(`DB Engine    : ${isPgConnected ? 'PostgreSQL 16 (Active)' : 'SQLite + Local DB (PostgreSQL Docker Ready)'}`);
    console.log(`=======================================================`);
  });
});
