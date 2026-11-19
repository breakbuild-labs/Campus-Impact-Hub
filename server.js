const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://campus_user:campus_pass123@localhost:5432/campus_impact_db';
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const SQLITE_DB_FILE = path.join(DATA_DIR, 'campus_impact.db');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'campus_db.json');
const INIT_SQL_FILE = path.join(__dirname, 'db', 'init.sql');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// ============================================================================
// CRYPTOGRAPHIC PASSWORD HASHING (Node.js Built-in crypto.scryptSync)
// ============================================================================
const HASH_PREFIX = 'scrypt$';

function isPasswordHashed(str) {
  return typeof str === 'string' && str.startsWith(HASH_PREFIX) && str.split('$').length === 3;
}

function hashPassword(plainPassword) {
  const clean = String(plainPassword || '');
  if (isPasswordHashed(clean)) return clean;
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(clean, salt, 64).toString('hex');
  return `${HASH_PREFIX}${salt}$${derivedKey}`;
}

function verifyPassword(plainPassword, storedPassword) {
  if (!plainPassword || !storedPassword) return false;
  if (!isPasswordHashed(storedPassword)) {
    return String(plainPassword) === String(storedPassword);
  }
  const parts = storedPassword.split('$');
  const salt = parts[1];
  const storedHashHex = parts[2];
  if (!salt || !storedHashHex) return false;
  const derivedBuf = crypto.scryptSync(String(plainPassword), salt, 64);
  const storedBuf = Buffer.from(storedHashHex, 'hex');
  if (derivedBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derivedBuf, storedBuf);
}

function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  const copy = { ...user };
  delete copy.password;
  delete copy.passwordHash;
  return copy;
}

const DEFAULT_SYSTEM_CONFIG = {
  appName: 'Campus Impact Hub',
  version: '2.2.0',
  allowedUploadFormats: ['PDF', 'JPG', 'JPEG', 'PNG'],
  maxUploadSizeKb: 2048,
  allowPublicRegistration: true,
  pointRules: {
    eventParticipant: 10,
    eventCommittee: 20,
    activeOrgMember: 30,
    projectMember: 50,
    projectLeader: 75
  }
};

function sanitizeStateForClient(state) {
  const safeUsers = Array.isArray(state.users) ? state.users.map(sanitizeUser) : [];
  const safeCurrentUser = state.currentUser ? sanitizeUser(state.currentUser) : (safeUsers[0] || null);
  return {
    dbEngine: state.dbEngine,
    isLoggedIn: Boolean(state.isLoggedIn),
    currentUser: safeCurrentUser,
    users: safeUsers,
    projects: Array.isArray(state.projects) ? state.projects : [],
    organizations: Array.isArray(state.organizations) ? state.organizations : [],
    events: Array.isArray(state.events) ? state.events : [],
    eventRegistrations: Array.isArray(state.eventRegistrations) ? state.eventRegistrations : [],
    projectRegistrations: Array.isArray(state.projectRegistrations) ? state.projectRegistrations : [],
    partnerEvaluations: Array.isArray(state.partnerEvaluations) ? state.partnerEvaluations : [],
    portfolioEntries: Array.isArray(state.portfolioEntries) ? state.portfolioEntries : [],
    auditLogs: Array.isArray(state.auditLogs) ? state.auditLogs : [],
    systemConfig: state.systemConfig || DEFAULT_SYSTEM_CONFIG
  };
}

// ============================================================================
// SERVER-SIDE SESSION STORE (Bearer Token Authentication)
// ============================================================================
const activeSessions = new Map(); // token -> { userId, role, email, createdAt }

function createSessionToken(user) {
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, {
    userId: user.id,
    role: user.role,
    email: user.email,
    createdAt: Date.now()
  });
  return token;
}

function extractBearerToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

async function getAuthenticatedUser(req) {
  const token = extractBearerToken(req);
  if (!token || !activeSessions.has(token)) return null;
  const session = activeSessions.get(token);
  const state = await getFullStateFromDb();
  const user = (state.users || []).find(u => u.id === session.userId);
  if (!user || (user.accountStatus && user.accountStatus !== 'Active')) {
    activeSessions.delete(token);
    return null;
  }
  return { token, user, state };
}

function appendAuditLog(state, actor, action, targetType, targetId, details) {
  const logEntry = {
    id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
    actorId: actor ? actor.id : 'SYSTEM',
    actorName: actor ? actor.name : 'System',
    actorRole: actor ? actor.role : 'system',
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };
  state.auditLogs = [logEntry, ...(Array.isArray(state.auditLogs) ? state.auditLogs : [])].slice(0, 250);
  return logEntry;
}

// ============================================================================
// DEFAULT SEED DATA (Passwords Automatically Hashed with scrypt)
// ============================================================================
const DEFAULT_USERS = [
  {
    id: 'U-MHS-001',
    name: 'Budi Santoso',
    email: 'mahasiswa@kampus.ac.id',
    identityNumber: '13523001',
    password: hashPassword('password123'),
    role: 'student',
    accountStatus: 'Active',
    majorOrUnit: 'S1 Teknik Informatika — PBSB',
    studyProgram: 'S1 Teknik Informatika',
    faculty: 'Fakultas Ilmu Komputer & Teknologi Informasi',
    phone: '0812-3456-7890',
    status: 'Mahasiswa Aktif',
    impactScore: 85,
    leadershipScore: 30,
    projectsCompleted: 1,
    umkmHelped: 1,
    beneficiariesReached: 120,
    contributionHours: 12,
    bio: 'Mahasiswa santri berprestasi yang berfokus pada kolaborasi rekayasa perangkat lunak dan solusi teknologi tepat guna untuk pemberdayaan masyarakat, UMKM, dan digitalisasi organisasi kampus.',
    interests: ['Teknologi Tepat Guna', 'Pengembangan Komunitas', 'Pemberdayaan Santri'],
    skills: ['Full-Stack Web', 'UI/UX Design', 'Database Architecture'],
    createdAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'U-DSN-002',
    name: 'Dr. Ir. Hendra Wijaya, M.T.',
    email: 'dosen@kampus.ac.id',
    identityNumber: 'NIP 198501152010121002',
    password: hashPassword('password123'),
    role: 'admin',
    accountStatus: 'Active',
    majorOrUnit: 'Direktorat Kemahasiswaan & Riset',
    studyProgram: 'Direktorat Kemahasiswaan',
    faculty: 'Direktorat Kemahasiswaan & Pengabdian Masyarakat',
    phone: '0811-2233-4455',
    status: 'Dosen Pembina & Admin',
    impactScore: 0,
    leadershipScore: 0,
    projectsCompleted: 0,
    umkmHelped: 0,
    beneficiariesReached: 0,
    contributionHours: 0,
    bio: 'Dosen pembina dan pengelola ekosistem kemahasiswaan dan pengabdian MBKM kampus.',
    interests: ['Riset Pengabdian', 'Supervisi MBKM', 'Tata Kelola Kampus'],
    skills: ['Supervisi Proyek', 'Audit Kurikulum', 'Kemitraan Industri'],
    createdAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'U-BEM-003',
    name: 'Rizky Pratama',
    email: 'bem@kampus.ac.id',
    identityNumber: '13522045',
    password: hashPassword('password123'),
    role: 'organization',
    accountStatus: 'Active',
    majorOrUnit: 'BEM UNIVERSITAS',
    studyProgram: 'S1 Sistem Informasi',
    faculty: 'Badan Eksekutif Mahasiswa Universitas',
    phone: '0813-9876-5432',
    status: 'Pengurus Organisasi Resmi',
    impactScore: 60,
    leadershipScore: 60,
    projectsCompleted: 1,
    umkmHelped: 1,
    beneficiariesReached: 80,
    contributionHours: 16,
    bio: 'Pengurus BEM yang mengkoordinasikan kegiatan, advokasi mahasiswa, dan kolaborasi organisasi se-universitas.',
    interests: ['Advokasi Mahasiswa', 'Manajemen Event', 'Kepemimpinan'],
    skills: ['Public Speaking', 'Event Organizing', 'Team Coordination'],
    createdAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'U-MTR-004',
    name: 'UMKM Maju Jaya',
    email: 'umkm@kampus.ac.id',
    identityNumber: 'UMKM-2026-08',
    password: hashPassword('password123'),
    role: 'partner',
    accountStatus: 'Active',
    ownerName: 'H. Ahmad Suryana',
    address: 'Jl. Dago No. 88, Kec. Coblong, Kota Bandung',
    majorOrUnit: 'Pelaku Usaha Mikro, Kecil & Menengah (UMKM)',
    studyProgram: 'Kuliner & Ritel Lokal',
    faculty: 'Jaringan Mitra UMKM Kampus Berdampak',
    phone: '0815-7788-9900',
    status: 'UMKM Terverifikasi',
    impactScore: 0,
    leadershipScore: 0,
    projectsCompleted: 0,
    umkmHelped: 2,
    beneficiariesReached: 470,
    contributionHours: 0,
    bio: 'Pelaku UMKM binaan yang berkolaborasi dengan mahasiswa untuk digitalisasi pembukuan kasir, manajemen stok, dan pemasaran produk lokal.',
    interests: ['Digitalisasi UMKM', 'Pemasaran Produk Lokal', 'Manajemen Usaha'],
    skills: ['Manajemen Toko', 'Produksi Kuliner & Ritel', 'Kemitraan Usaha'],
    createdAt: '2026-10-01T08:00:00.000Z'
  }
];

const DEMO_PROJECTS = [
  {
    id: 'P001',
    ownerUserId: 'U-MTR-004',
    organizationName: 'UMKM Maju Jaya',
    ownerName: 'H. Ahmad Suryana',
    title: 'Digitalisasi Sistem Pembukuan & Kasir UMKM',
    description: 'Pencatatan harian masih manual menggunakan buku tulis. Membutuhkan sistem kasir digital dan identitas visual terpadu.',
    category: 'Teknologi',
    location: 'Kec. Coblong, Kota Bandung',
    photoCaption: 'Dokumentasi Toko & Produksi UMKM Maju Jaya',
    attachmentName: 'Lampiran_Pembukuan_UMKM_Maju_Jaya.pdf',
    expectedOutcomes: 'Aplikasi POS Kasir Web & Standarisasi Laporan Keuangan Bulanan',
    expectedDuration: '8 Minggu',
    impactScore: 85,
    requirements: ['2 Informatika', '1 Desain Komunikasi Visual'],
    status: 'OPEN',
    rejectionReason: '',
    verifiedByAdmin: true,
    applicantCount: 1,
    userApplicationState: 'APPROVED',
    userRoleInProject: 'Anggota Proyek Sosial (+50 Poin)',
    milestones: [
      { id: 'M1', title: 'Analisis Kebutuhan & Observasi Toko', status: 'COMPLETED' },
      { id: 'M2', title: 'Perancangan Sistem Kasir & Database', status: 'ON_GOING' },
      { id: 'M3', title: 'Uji Coba & Pelatihan Mitra UMKM', status: 'PENDING' }
    ],
    assignedStudents: [
      {
        studentId: 'U-MHS-001',
        name: 'Budi Santoso',
        nim: '13523001',
        faculty: 'Fakultas Ilmu Komputer & Teknologi Informasi',
        studyProgram: 'S1 Teknik Informatika',
        roleInProject: 'Ketua Tim Proyek (+75 Poin)',
        status: 'APPROVED'
      }
    ],
    impactReport: {
      id: 'I001',
      projectId: 'P001',
      beforeCondition: 'Manual (Pembukuan kertas rawan selisih)',
      afterCondition: 'Digital (Aplikasi POS Terintegrasi)',
      beneficiaries: 120,
      sdgCategory: 'SDG 8: Pertumbuhan Ekonomi & Pekerjaan Layak',
      partnerFeedback: 'Sangat membantu efisiensi pembukuan dan meminimalisir kesalahan stok.'
    },
    createdAt: '2026-10-15T09:00:00.000Z'
  },
  {
    id: 'P002',
    ownerUserId: 'U-MTR-004',
    organizationName: 'Desa Mandiri Sejahtera & UMKM Mitra',
    ownerName: 'H. Ahmad Suryana',
    title: 'Sistem Informasi Bank Sampah & Smart Village',
    description: 'Pengelolaan tabungan sampah warga desa dan administrasi surat pengantar RT/RW masih belum terkomputerisasi.',
    category: 'Lingkungan',
    location: 'Kab. Bandung Barat',
    photoCaption: 'Kegiatan Penimbangan Bank Sampah Warga Desa',
    attachmentName: 'Proposal_Bank_Sampah_Desa.pdf',
    expectedOutcomes: 'Dashboard Bank Sampah Digital & Rekap Saldo Warga Otomatis',
    expectedDuration: '12 Minggu',
    impactScore: 90,
    requirements: ['2 Informatika', '1 Teknik Lingkungan'],
    status: 'ON_GOING',
    rejectionReason: '',
    verifiedByAdmin: true,
    applicantCount: 1,
    userApplicationState: 'NONE',
    userRoleInProject: 'Anggota Proyek Sosial (+50 Poin)',
    milestones: [
      { id: 'M1', title: 'Survei Alur Bank Sampah Desa', status: 'COMPLETED' },
      { id: 'M2', title: 'Implementasi Modul Timbangan Digital', status: 'ON_GOING' }
    ],
    assignedStudents: [
      {
        studentId: 'U-MHS-001',
        name: 'Budi Santoso',
        nim: '13523001',
        faculty: 'Fakultas Ilmu Komputer & Teknologi Informasi',
        studyProgram: 'S1 Teknik Informatika',
        roleInProject: 'Anggota Proyek Sosial (+50 Poin)',
        status: 'APPROVED'
      }
    ],
    impactReport: {
      id: 'I002',
      projectId: 'P002',
      beforeCondition: 'Pencatatan tabungan sampah warga tercecer',
      afterCondition: 'Dashboard Bank Sampah Digital & Rekap Otomatis',
      beneficiaries: 350,
      sdgCategory: 'SDG 11: Kota & Pemukiman Berkelanjutan',
      partnerFeedback: 'Warga sangat terbantu dengan transparansi saldo tabungan sampah.'
    },
    createdAt: '2026-10-20T09:00:00.000Z'
  }
];

const DEMO_ORGANIZATIONS = [
  {
    id: 'ORG001',
    ownerUserId: 'U-BEM-003',
    name: 'BEM UNIVERSITAS',
    fullName: 'Badan Eksekutif Mahasiswa Universitas',
    category: 'Kepemimpinan & Sosial',
    level: 'Universitas',
    affiliation: 'Universitas / Direktorat Kemahasiswaan',
    chairmanName: 'Rizky Pratama',
    logoInitials: 'BEM',
    skNumber: 'SK/REKTOR/BEM-002/2026',
    skDocumentName: 'SK_Rektor_BEM_Universitas_2026.pdf',
    skDocumentType: 'application/pdf',
    skDocumentSize: 348160,
    skDocumentData: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSA+PgplbmRvYmoKdHJhaWxlcgo8PCAvUm9vdCAxIDAgUiA+PgplbmRvYmoK',
    advisorName: 'Dr. Ir. Hendra Wijaya, M.T.',
    contact: 'bem@kampus.ac.id',
    activityField: 'Advokasi Mahasiswa, Kepemimpinan & Pengabdian Masyarakat',
    description: 'Lembaga eksekutif mahasiswa tingkat universitas yang menggerakkan advokasi, kolaborasi organisasi, dan pengabdian masyarakat.',
    memberCount: 85,
    verificationStatus: 'VERIFIED',
    rejectionReason: '',
    createdAt: '2026-10-05T08:00:00.000Z'
  },
  {
    id: 'ORG002',
    ownerUserId: 'U-DSN-002',
    name: 'HIMATIF',
    fullName: 'Himpunan Mahasiswa Teknik Informatika',
    category: 'Teknologi',
    level: 'Fakultas / Jurusan',
    affiliation: 'Fakultas Ilmu Komputer & Teknologi Informasi',
    chairmanName: 'Fajar Nugraha',
    logoInitials: 'HT',
    skNumber: 'SK/DEKAN/ORG-001/2026',
    skDocumentName: 'SK_Dekan_HIMATIF_2026.pdf',
    skDocumentType: 'application/pdf',
    skDocumentSize: 286720,
    skDocumentData: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSA+PgplbmRvYmoKdHJhaWxlcgo8PCAvUm9vdCAxIDAgUiA+PgplbmRvYmoK',
    advisorName: 'Dr. Ir. Hendra Wijaya, M.T.',
    contact: 'himatif@kampus.ac.id',
    activityField: 'Rekayasa Perangkat Lunak, Riset AI & Pengabdian Teknologi',
    description: 'Organisasi kemahasiswaan jurusan Teknik Informatika yang berfokus pada software engineering dan pengabdian teknologi.',
    memberCount: 120,
    verificationStatus: 'VERIFIED',
    rejectionReason: '',
    createdAt: '2026-10-06T08:00:00.000Z'
  }
];

const DEMO_EVENTS = [
  {
    id: 'EV001',
    organizationId: 'ORG001',
    ownerUserId: 'U-BEM-003',
    title: 'Seminar Nasional Kolaborasi Kampus & UMKM Berdaya',
    organizerName: 'BEM UNIVERSITAS',
    type: 'SEMINAR',
    description: 'Forum kolaborasi antara mahasiswa, dosen pembina, dan mitra UMKM untuk akselerasi ekonomi lokal.',
    date: '05 Desember 2026 • 13:00 WIB',
    registrationDeadline: '04 Desember 2026',
    location: 'Aula Barat Kampus Utama',
    quota: 250,
    registeredCount: 1,
    pointsReward: 10,
    committeePointsReward: 20,
    posterSummary: 'Terbuka untuk Mahasiswa — Validasi Kehadiran Manual oleh Panitia (Nama/NIM)',
    publicationStatus: 'PUBLISHED',
    verifiedByAdmin: true,
    isRegistered: true,
    isAttended: false,
    createdAt: '2026-10-12T08:00:00.000Z'
  },
  {
    id: 'EV002',
    organizationId: 'ORG002',
    ownerUserId: 'U-DSN-002',
    title: 'Workshop Desain Solusi Digital untuk Dampak Sosial',
    organizerName: 'HIMATIF',
    type: 'WORKSHOP',
    description: 'Pelatihan intensif perancangan solusi teknologi tepat guna bagi mitra UMKM dan desa binaan.',
    date: '28 November 2026 • 09:00 WIB',
    registrationDeadline: '27 November 2026',
    location: 'Auditorium Gedung Utama',
    quota: 150,
    registeredCount: 0,
    pointsReward: 10,
    committeePointsReward: 20,
    posterSummary: 'Publikasi Resmi: E-Sertifikat Terakreditasi MBKM & +10 Impact Score',
    publicationStatus: 'PUBLISHED',
    verifiedByAdmin: true,
    isRegistered: false,
    isAttended: false,
    createdAt: '2026-10-14T08:00:00.000Z'
  }
];

const DEMO_EVENT_REGISTRATIONS = [
  {
    id: 'REG-EV001-U-MHS-001',
    eventId: 'EV001',
    eventTitle: 'Seminar Nasional Kolaborasi Kampus & UMKM Berdaya',
    organizerName: 'BEM UNIVERSITAS',
    studentId: 'U-MHS-001',
    studentName: 'Budi Santoso',
    studentNim: '13523001',
    faculty: 'Fakultas Ilmu Komputer & Teknologi Informasi',
    studyProgram: 'S1 Teknik Informatika',
    roleInEvent: 'Participant',
    registrationStatus: 'Registered',
    attendanceStatus: 'Registered',
    registeredAt: '2026-11-10T09:30:00.000Z',
    checkInTimestamp: null,
    validatedBy: null
  }
];

const DEMO_PROJECT_REGISTRATIONS = [
  {
    id: 'PRJ-REG-P001-U-MHS-001',
    projectId: 'P001',
    projectTitle: 'Digitalisasi Sistem Pembukuan & Kasir UMKM',
    studentId: 'U-MHS-001',
    studentName: 'Budi Santoso',
    studentNim: '13523001',
    faculty: 'Fakultas Ilmu Komputer & Teknologi Informasi',
    studyProgram: 'S1 Teknik Informatika',
    roleInProject: 'Ketua Tim Proyek (+75 Poin)',
    status: 'APPROVED',
    pointsAwarded: true,
    registeredAt: '2026-10-18T10:00:00.000Z'
  }
];

const DEMO_PORTFOLIO_ENTRIES = [
  {
    id: 'PF001',
    userId: 'U-MHS-001',
    activityId: 'P001',
    title: 'Ketua Tim Pelaksana: Digitalisasi Sistem Pembukuan & Kasir UMKM',
    organizationOrPartner: 'UMKM Maju Jaya',
    category: 'Project Sosial',
    date: '18 Oktober 2026',
    impactPoints: 75,
    leadershipPoints: 30,
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Dr. Ir. Hendra Wijaya, M.T.',
    outcomeSummary: 'Memimpin implementasi sistem POS kasir digital UMKM Maju Jaya untuk 120 penerima manfaat.',
    credentialCode: 'VERIFIED-P001-U-MHS-001',
    createdAt: '2026-10-18T10:00:00.000Z'
  }
];

// ============================================================================
// NON-DESTRUCTIVE RECORD MERGE & BACKUP HELPERS
// ============================================================================
function mergeRecordsById(existingList = [], incomingList = []) {
  const map = new Map();
  for (const item of existingList) {
    if (item && item.id) {
      map.set(String(item.id), item);
    }
  }
  for (const item of incomingList) {
    if (item && item.id) {
      const prev = map.get(String(item.id)) || {};
      map.set(String(item.id), { ...prev, ...item });
    }
  }
  return Array.from(map.values());
}

function mergeUsersPreservingPasswords(existingUsers = [], incomingUsers = []) {
  const existingMap = new Map();
  for (const u of existingUsers) {
    if (u && u.id) existingMap.set(String(u.id), u);
  }
  for (const seed of DEFAULT_USERS) {
    if (!existingMap.has(seed.id)) {
      existingMap.set(seed.id, JSON.parse(JSON.stringify(seed)));
    }
  }

  for (const inc of incomingUsers) {
    if (!inc || !inc.id) continue;
    const prev = existingMap.get(String(inc.id));
    if (prev) {
      const preservedPassword = isPasswordHashed(prev.password)
        ? prev.password
        : hashPassword(prev.password || inc.password || 'password123');
      const seedMatch = DEFAULT_USERS.find(s => s.id === prev.id);
      const preservedRole = seedMatch ? seedMatch.role : (prev.role || inc.role || 'student');
      existingMap.set(String(inc.id), {
        ...prev,
        ...inc,
        role: preservedRole,
        accountStatus: inc.accountStatus || prev.accountStatus || 'Active',
        password: preservedPassword
      });
    } else {
      existingMap.set(String(inc.id), {
        ...inc,
        accountStatus: inc.accountStatus || 'Active',
        password: hashPassword(inc.password || 'password123')
      });
    }
  }

  return Array.from(existingMap.values()).map(u => ({
    ...u,
    accountStatus: u.accountStatus || 'Active',
    password: isPasswordHashed(u.password) ? u.password : hashPassword(u.password || 'password123')
  }));
}

function createPreWriteBackup(reason = 'auto') {
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const backupPath = path.join(BACKUP_DIR, `campus_db.${reason}.bak.json`);
      fs.copyFileSync(LOCAL_DB_FILE, backupPath);
    }
  } catch (e) {
    console.warn('[Backup] Gagal membuat backup otomatis:', e.message);
  }
}

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
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS event_registrations (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS project_registrations (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS partner_evaluations (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS portfolio_entries (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS app_session (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
  } catch (e) {
    sqliteDb = null;
  }
}

/**
 * Non-Destructive SQLite Upsert by Primary Key
 */
function syncToSqlite(state) {
  if (!sqliteDb) return;
  try {
    sqliteDb.exec('BEGIN');
    const tables = [
      ['users', state.users || []],
      ['projects', state.projects || []],
      ['organizations', state.organizations || []],
      ['events', state.events || []],
      ['event_registrations', state.eventRegistrations || []],
      ['project_registrations', state.projectRegistrations || []],
      ['partner_evaluations', state.partnerEvaluations || []],
      ['portfolio_entries', state.portfolioEntries || []],
      ['audit_logs', state.auditLogs || []]
    ];
    for (const [table, items] of tables) {
      const stmt = sqliteDb.prepare(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`);
      for (const item of items) {
        if (item && item.id) {
          stmt.run(String(item.id), JSON.stringify(item));
        }
      }
    }
    const sessStmt = sqliteDb.prepare(`INSERT OR REPLACE INTO app_session (key, value) VALUES ('current_session', ?)`);
    sessStmt.run(JSON.stringify({
      isLoggedIn: Boolean(state.isLoggedIn),
      currentUser: sanitizeUser(state.currentUser),
      systemConfig: state.systemConfig || DEFAULT_SYSTEM_CONFIG
    }));
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

  const currentState = await getFullStateFromDb();
  let needsSave = false;
  if (Array.isArray(currentState.users)) {
    currentState.users = currentState.users.map(u => {
      if (!isPasswordHashed(u.password)) {
        needsSave = true;
        return { ...u, password: hashPassword(u.password || 'password123') };
      }
      return u;
    });
  }
  if (!Array.isArray(currentState.eventRegistrations) || currentState.eventRegistrations.length === 0) {
    currentState.eventRegistrations = JSON.parse(JSON.stringify(DEMO_EVENT_REGISTRATIONS));
    needsSave = true;
  }
  if (!Array.isArray(currentState.projectRegistrations) || currentState.projectRegistrations.length === 0) {
    currentState.projectRegistrations = JSON.parse(JSON.stringify(DEMO_PROJECT_REGISTRATIONS));
    needsSave = true;
  }
  if (!Array.isArray(currentState.portfolioEntries) || currentState.portfolioEntries.length === 0) {
    currentState.portfolioEntries = JSON.parse(JSON.stringify(DEMO_PORTFOLIO_ENTRIES));
    needsSave = true;
  }
  if (needsSave) {
    await saveFullStateToDb(currentState, { allowSystemBypass: true });
    console.log('[Security] Migrasi hash password (scrypt) & relasi data selesai secara non-destruktif.');
  }
}

function getInitialFallbackState() {
  return {
    isLoggedIn: false,
    currentUser: sanitizeUser(DEFAULT_USERS[0]),
    users: JSON.parse(JSON.stringify(DEFAULT_USERS)),
    projects: JSON.parse(JSON.stringify(DEMO_PROJECTS)),
    organizations: JSON.parse(JSON.stringify(DEMO_ORGANIZATIONS)),
    events: JSON.parse(JSON.stringify(DEMO_EVENTS)),
    eventRegistrations: JSON.parse(JSON.stringify(DEMO_EVENT_REGISTRATIONS)),
    projectRegistrations: JSON.parse(JSON.stringify(DEMO_PROJECT_REGISTRATIONS)),
    partnerEvaluations: [],
    portfolioEntries: JSON.parse(JSON.stringify(DEMO_PORTFOLIO_ENTRIES)),
    auditLogs: [
      {
        id: 'LOG-INIT-001',
        actorId: 'SYSTEM',
        actorName: 'System Initializer',
        actorRole: 'system',
        action: 'SYSTEM_BOOT',
        targetType: 'database',
        targetId: 'campus_impact_db',
        details: 'Inisialisasi sistem Campus Impact Hub dengan scrypt password hashing & non-destructive upsert.',
        createdAt: '2026-11-19T12:00:00.000Z'
      }
    ],
    systemConfig: JSON.parse(JSON.stringify(DEFAULT_SYSTEM_CONFIG))
  };
}

function ensureLocalDbInitialized() {
  if (!fs.existsSync(LOCAL_DB_FILE)) {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(getInitialFallbackState(), null, 2), 'utf8');
  }
}

function normalizeLoadedState(parsed) {
  const fallback = getInitialFallbackState();
  parsed.users = mergeUsersPreservingPasswords(DEFAULT_USERS, parsed.users || []);
  parsed.organizations = mergeRecordsById(DEMO_ORGANIZATIONS, parsed.organizations || []);
  parsed.projects = mergeRecordsById(DEMO_PROJECTS, parsed.projects || []);
  parsed.events = mergeRecordsById(DEMO_EVENTS, parsed.events || []);
  parsed.eventRegistrations = Array.isArray(parsed.eventRegistrations)
    ? parsed.eventRegistrations
    : fallback.eventRegistrations;
  parsed.projectRegistrations = Array.isArray(parsed.projectRegistrations)
    ? parsed.projectRegistrations
    : fallback.projectRegistrations;
  parsed.partnerEvaluations = Array.isArray(parsed.partnerEvaluations) ? parsed.partnerEvaluations : [];
  parsed.portfolioEntries = Array.isArray(parsed.portfolioEntries)
    ? parsed.portfolioEntries
    : fallback.portfolioEntries;
  parsed.auditLogs = Array.isArray(parsed.auditLogs) && parsed.auditLogs.length > 0
    ? parsed.auditLogs
    : fallback.auditLogs;
  parsed.systemConfig = parsed.systemConfig
    ? { ...DEFAULT_SYSTEM_CONFIG, ...parsed.systemConfig }
    : JSON.parse(JSON.stringify(DEFAULT_SYSTEM_CONFIG));
  return parsed;
}

function readLocalDb() {
  ensureLocalDbInitialized();
  try {
    const parsed = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
    return normalizeLoadedState(parsed);
  } catch (e) {
    return getInitialFallbackState();
  }
}

function writeLocalDb(state) {
  try {
    createPreWriteBackup('latest');
    const cleanState = { ...state };
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(cleanState, null, 2), 'utf8');
    syncToSqlite(cleanState);
  } catch (e) {
    console.error('[DB] Gagal menulis file database lokal:', e.message);
  }
}

async function getFullStateFromDb() {
  const local = readLocalDb();
  local.dbEngine = isPgConnected ? 'PostgreSQL 16 (Docker)' : (sqliteDb ? 'SQLite + PostgreSQL Ready' : 'Local Persistent DB');
  return local;
}

/**
 * Non-Destructive Database Save (Upsert by ID, Never Wipes Existing Records)
 */
async function saveFullStateToDb(incomingState, options = {}) {
  const existingState = readLocalDb();
  const mergedUsers = mergeUsersPreservingPasswords(existingState.users || DEFAULT_USERS, incomingState.users || []);

  const mergedState = {
    dbEngine: existingState.dbEngine,
    isLoggedIn: Boolean(incomingState.isLoggedIn),
    currentUser: sanitizeUser(incomingState.currentUser || existingState.currentUser || mergedUsers[0]),
    users: mergedUsers,
    projects: options.replaceCollections
      ? (incomingState.projects || [])
      : mergeRecordsById(existingState.projects, incomingState.projects),
    organizations: options.replaceCollections
      ? (incomingState.organizations || [])
      : mergeRecordsById(existingState.organizations, incomingState.organizations),
    events: options.replaceCollections
      ? (incomingState.events || [])
      : mergeRecordsById(existingState.events, incomingState.events),
    eventRegistrations: options.replaceCollections
      ? (incomingState.eventRegistrations || [])
      : mergeRecordsById(existingState.eventRegistrations, incomingState.eventRegistrations),
    projectRegistrations: options.replaceCollections
      ? (incomingState.projectRegistrations || [])
      : mergeRecordsById(existingState.projectRegistrations, incomingState.projectRegistrations),
    partnerEvaluations: options.replaceCollections
      ? (incomingState.partnerEvaluations || [])
      : mergeRecordsById(existingState.partnerEvaluations, incomingState.partnerEvaluations),
    portfolioEntries: options.replaceCollections
      ? (incomingState.portfolioEntries || [])
      : mergeRecordsById(existingState.portfolioEntries, incomingState.portfolioEntries),
    auditLogs: options.replaceCollections
      ? (incomingState.auditLogs || [])
      : mergeRecordsById(existingState.auditLogs, incomingState.auditLogs),
    systemConfig: incomingState.systemConfig
      ? { ...existingState.systemConfig, ...incomingState.systemConfig }
      : (existingState.systemConfig || DEFAULT_SYSTEM_CONFIG)
  };

  if (mergedState.currentUser && mergedState.currentUser.id) {
    const idx = mergedState.users.findIndex(u => u.id === mergedState.currentUser.id);
    if (idx !== -1) {
      const existingPass = mergedState.users[idx].password;
      const existingRole = mergedState.users[idx].role;
      mergedState.users[idx] = {
        ...mergedState.users[idx],
        ...mergedState.currentUser,
        role: existingRole,
        password: existingPass
      };
    }
  }

  writeLocalDb(mergedState);

  if (!isPgConnected || !pgPool) return mergedState;

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO app_session (key, value, updated_at)
       VALUES ('current_session', $1::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify({ isLoggedIn: Boolean(mergedState.isLoggedIn), currentUser: sanitizeUser(mergedState.currentUser) })]
    );

    for (const u of mergedState.users) {
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
          isPasswordHashed(u.password) ? u.password : hashPassword(u.password || 'password123'),
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

    for (const p of mergedState.projects) {
      await client.query(
        `INSERT INTO projects (id, organization_name, title, description, category, location, photo_caption, impact_score, requirements, status, verified_by_admin, applicant_count, impact_report)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13::jsonb)
         ON CONFLICT (id) DO UPDATE SET
           organization_name = EXCLUDED.organization_name,
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           location = EXCLUDED.location,
           photo_caption = EXCLUDED.photo_caption,
           impact_score = EXCLUDED.impact_score,
           requirements = EXCLUDED.requirements,
           status = EXCLUDED.status,
           verified_by_admin = EXCLUDED.verified_by_admin,
           applicant_count = EXCLUDED.applicant_count,
           impact_report = EXCLUDED.impact_report`,
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
          p.status || 'SUBMITTED',
          Boolean(p.verifiedByAdmin),
          p.applicantCount || 0,
          JSON.stringify(p.impactReport || {})
        ]
      );
    }

    for (const o of mergedState.organizations) {
      await client.query(
        `INSERT INTO organizations (id, name, full_name, category, logo_initials, sk_number, advisor_name, contact, description, member_count, verification_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           full_name = EXCLUDED.full_name,
           category = EXCLUDED.category,
           logo_initials = EXCLUDED.logo_initials,
           sk_number = EXCLUDED.sk_number,
           advisor_name = EXCLUDED.advisor_name,
           contact = EXCLUDED.contact,
           description = EXCLUDED.description,
           member_count = EXCLUDED.member_count,
           verification_status = EXCLUDED.verification_status`,
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
          o.verificationStatus || 'PENDING'
        ]
      );
    }

    for (const e of mergedState.events) {
      await client.query(
        `INSERT INTO events (id, title, organizer_name, type, description, date, location, quota, registered_count, points_reward, committee_points_reward, poster_summary, verified_by_admin)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           organizer_name = EXCLUDED.organizer_name,
           type = EXCLUDED.type,
           description = EXCLUDED.description,
           date = EXCLUDED.date,
           location = EXCLUDED.location,
           quota = EXCLUDED.quota,
           registered_count = EXCLUDED.registered_count,
           points_reward = EXCLUDED.points_reward,
           committee_points_reward = EXCLUDED.committee_points_reward,
           poster_summary = EXCLUDED.poster_summary,
           verified_by_admin = EXCLUDED.verified_by_admin`,
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
          Boolean(e.verifiedByAdmin)
        ]
      );
    }

    for (const pf of mergedState.portfolioEntries) {
      await client.query(
        `INSERT INTO portfolio_entries (id, user_id, title, organization_or_partner, category, date, impact_points, leadership_points, outcome_summary, credential_code)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           title = EXCLUDED.title,
           organization_or_partner = EXCLUDED.organization_or_partner,
           category = EXCLUDED.category,
           date = EXCLUDED.date,
           impact_points = EXCLUDED.impact_points,
           leadership_points = EXCLUDED.leadership_points,
           outcome_summary = EXCLUDED.outcome_summary,
           credential_code = EXCLUDED.credential_code`,
        [
          pf.id,
          pf.userId || mergedState.currentUser?.id || 'U-MHS-001',
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

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB] Gagal menyimpan transaksi ke PostgreSQL:', err.message);
  } finally {
    client.release();
  }

  return mergedState;
}

// ============================================================================
// OWNERSHIP & RBAC HELPERS
// ============================================================================
function isOrganizationOwnedByUser(org, user) {
  if (!org || !user) return false;
  if (user.role === 'admin') return true;
  if (org.ownerUserId && org.ownerUserId === user.id) return true;
  if (org.contact && user.email && org.contact.toLowerCase() === user.email.toLowerCase()) return true;
  if (org.name && user.majorOrUnit && org.name.toLowerCase() === user.majorOrUnit.toLowerCase()) return true;
  return false;
}

function getOrganizationsOwnedByUser(state, user) {
  return (state.organizations || []).filter(o => isOrganizationOwnedByUser(o, user));
}

function isEventOwnedByUser(event, state, user) {
  if (!event || !user) return false;
  if (user.role === 'admin') return true;
  if (event.ownerUserId && event.ownerUserId === user.id) return true;
  const userOrgs = getOrganizationsOwnedByUser(state, user);
  return userOrgs.some(o =>
    (event.organizationId && o.id === event.organizationId) ||
    (event.organizerName && o.name && event.organizerName.toLowerCase() === o.name.toLowerCase())
  );
}

function isProjectOwnedByUser(project, user) {
  if (!project || !user) return false;
  if (user.role === 'admin') return true;
  if (project.ownerUserId && project.ownerUserId === user.id) return true;
  if (project.organizationName && user.name && project.organizationName.toLowerCase().includes(user.name.toLowerCase())) return true;
  return false;
}

// ============================================================================
// SERVER-SIDE RBAC & OWNERSHIP STATE MUTATION VALIDATOR
// ============================================================================
function validateStateMutationRbac(actorUser, currentDbState, incomingState) {
  const role = (actorUser.role || '').toLowerCase();

  // 1. Check Project Additions, Status Changes & Ownership
  const oldProjMap = new Map((currentDbState.projects || []).map(p => [String(p.id), p]));
  for (const incP of (incomingState.projects || [])) {
    if (!incP || !incP.id) continue;
    const oldP = oldProjMap.get(String(incP.id));
    if (!oldP) {
      if (role !== 'partner' && role !== 'admin') {
        return { allowed: false, message: 'RBAC Violation: Hanya Mitra UMKM atau Admin yang dapat mengajukan masalah/proyek baru.' };
      }
    } else {
      if (oldP.status !== incP.status) {
        if (role !== 'partner' && role !== 'admin') {
          return { allowed: false, message: 'RBAC Violation: Hanya Mitra UMKM atau Admin yang dapat mengubah status progress proyek.' };
        }
        if (role === 'partner' && !isProjectOwnedByUser(oldP, actorUser)) {
          return { allowed: false, message: 'Ownership Violation: Mitra UMKM hanya dapat memperbarui proyek miliknya sendiri.' };
        }
        if (role === 'partner' && ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'].includes(oldP.status) && incP.status === 'OPEN') {
          return { allowed: false, message: 'RBAC Violation: Proyek baru harus disetujui Admin Kampus sebelum berstatus Open.' };
        }
      }
      if (oldP.userApplicationState !== incP.userApplicationState && role !== 'student' && role !== 'partner' && role !== 'admin') {
        return { allowed: false, message: 'RBAC Violation: Hanya Mahasiswa yang dapat mendaftar sebagai pelaksana proyek.' };
      }
    }
  }

  // 2. Check Organization Additions, SK Verification & Ownership
  const oldOrgMap = new Map((currentDbState.organizations || []).map(o => [String(o.id), o]));
  for (const incO of (incomingState.organizations || [])) {
    if (!incO || !incO.id) continue;
    const oldO = oldOrgMap.get(String(incO.id));
    if (!oldO) {
      if (role !== 'organization' && role !== 'admin') {
        return { allowed: false, message: 'RBAC Violation: Hanya Pengurus Organisasi atau Admin yang dapat mendaftarkan organisasi baru.' };
      }
    } else {
      if (oldO.verificationStatus !== incO.verificationStatus && role !== 'admin') {
        return { allowed: false, message: 'RBAC Violation: Hanya Admin Kampus yang berwenang memverifikasi legalitas SK organisasi.' };
      }
      const orgChanged = oldO.description !== incO.description || oldO.skNumber !== incO.skNumber || oldO.name !== incO.name;
      if (orgChanged && role === 'organization' && !isOrganizationOwnedByUser(oldO, actorUser)) {
        return { allowed: false, message: 'Ownership Violation: Pengurus hanya dapat mengubah profil organisasinya sendiri.' };
      }
    }
  }

  // 3. Check Event Additions, Manual Attendance Validation & Ownership
  const oldEvMap = new Map((currentDbState.events || []).map(e => [String(e.id), e]));
  for (const incE of (incomingState.events || [])) {
    if (!incE || !incE.id) continue;
    const oldE = oldEvMap.get(String(incE.id));
    if (!oldE) {
      if (role !== 'organization' && role !== 'admin') {
        return { allowed: false, message: 'RBAC Violation: Hanya Pengurus Organisasi atau Admin yang dapat menerbitkan event baru.' };
      }
      if (role === 'organization') {
        const ownOrgs = getOrganizationsOwnedByUser(currentDbState, actorUser);
        const hasVerifiedOrg = ownOrgs.some(o => o.verificationStatus === 'VERIFIED');
        if (!hasVerifiedOrg && incE.publicationStatus === 'PUBLISHED') {
          return { allowed: false, message: 'RBAC Violation: Organisasi yang belum terverifikasi SK tidak dapat mempublikasikan event resmi.' };
        }
      }
    } else {
      if (!oldE.isAttended && incE.isAttended && role !== 'organization' && role !== 'admin') {
        return { allowed: false, message: 'RBAC Violation: Validasi kehadiran peserta hanya dapat dilakukan secara manual oleh Organisasi atau Admin.' };
      }
      if (role === 'organization' && (oldE.title !== incE.title || oldE.date !== incE.date || oldE.location !== incE.location)) {
        if (!isEventOwnedByUser(oldE, currentDbState, actorUser)) {
          return { allowed: false, message: 'Ownership Violation: Organisasi hanya dapat mengelola event miliknya sendiri.' };
        }
      }
    }
  }

  return { allowed: true };
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 8 * 1024 * 1024) {
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

  // --- 1. Health & Security Status ---
  if (pathname === '/api/health' && req.method === 'GET') {
    const state = await getFullStateFromDb();
    return sendJson(res, 200, {
      status: 'healthy',
      security: {
        passwordHashing: 'scrypt (crypto.scryptSync + timingSafeEqual)',
        rbacEnforcement: 'server-side + client-side + data-ownership',
        persistenceMode: 'non-destructive-upsert',
        attendanceMode: 'manual-name-or-nim-validation (no-qr)'
      },
      database: {
        connected: true,
        engine: state.dbEngine,
        postgresActive: isPgConnected,
        sqliteActive: Boolean(sqliteDb),
        tables: {
          users: (state.users || []).length,
          projects: (state.projects || []).length,
          organizations: (state.organizations || []).length,
          events: (state.events || []).length,
          event_registrations: (state.eventRegistrations || []).length,
          project_registrations: (state.projectRegistrations || []).length,
          partner_evaluations: (state.partnerEvaluations || []).length,
          portfolio_entries: (state.portfolioEntries || []).length,
          audit_logs: (state.auditLogs || []).length
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
        majorOrUnit: u.majorOrUnit
      }))
    });
  }

  // --- 2. Server-Side Login (scrypt verification + Account Status Check) ---
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const { identifier, password } = await parseJsonBody(req);
      const cleanId = (identifier || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();

      if (!cleanId || !cleanPass) {
        return sendJson(res, 400, { success: false, message: 'Email/NIM/NIP dan kata sandi wajib diisi.' });
      }

      const state = await getFullStateFromDb();
      const allUsers = Array.isArray(state.users) && state.users.length ? state.users : DEFAULT_USERS;
      const cleanAlphaNum = cleanId.replace(/[^0-9a-z]/g, '');

      const matched = allUsers.find(u => {
        if (u.email && u.email.toLowerCase() === cleanId) return true;
        if (u.identityNumber) {
          const idLow = u.identityNumber.toLowerCase();
          if (idLow === cleanId) return true;
          const idDigits = idLow.replace(/^(nim|nip)\s*/i, '').trim();
          if (idDigits && idDigits === cleanId) return true;
          if (cleanAlphaNum.length >= 6 && idLow.replace(/[^0-9a-z]/g, '') === cleanAlphaNum) return true;
        }
        return false;
      });

      if (!matched || !verifyPassword(cleanPass, matched.password)) {
        return sendJson(res, 401, {
          success: false,
          message: 'Kredensial tidak valid. Email/NIM/NIP tidak terdaftar atau kata sandi salah.'
        });
      }

      if (matched.accountStatus && matched.accountStatus !== 'Active') {
        return sendJson(res, 403, {
          success: false,
          message: `Akses ditolak: Status akun Anda saat ini adalah "${matched.accountStatus}". Hubungi Admin Kampus.`
        });
      }

      const token = createSessionToken(matched);
      state.isLoggedIn = true;
      state.currentUser = sanitizeUser(matched);
      appendAuditLog(state, matched, 'AUTH_LOGIN', 'user', matched.id, `Login berhasil sebagai ${matched.role} (${matched.email})`);
      await saveFullStateToDb(state, { allowSystemBypass: true });

      return sendJson(res, 200, {
        success: true,
        token,
        user: sanitizeUser(matched),
        role: matched.role
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // --- 3. Server-Side Multi-Role Registration (scrypt hashing + role-specific entities) ---
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const {
        name,
        email,
        identityNumber,
        role,
        password,
        passwordConfirm,
        bio,
        majorOrUnit,
        faculty,
        studyProgram,
        phone,
        // Organization specific
        orgCategory,
        orgLevel,
        orgAffiliation,
        chairmanName,
        advisorName,
        skNumber,
        skDocumentName,
        skDocumentType,
        skDocumentSize,
        skDocumentData,
        activityField,
        // Partner UMKM specific
        ownerName,
        businessCategory,
        address
      } = body;

      const cleanName = (name || '').trim();
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();
      const cleanIdentity = (identityNumber || '').trim();
      const requestedRole = (role || 'student').trim().toLowerCase();

      if (!cleanName) {
        return sendJson(res, 400, { success: false, message: 'Nama lengkap / nama lembaga wajib diisi.' });
      }
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return sendJson(res, 400, { success: false, message: 'Format email tidak valid.' });
      }
      if (!cleanPass || cleanPass.length < 6) {
        return sendJson(res, 400, { success: false, message: 'Kata sandi minimal harus 6 karakter.' });
      }
      if (passwordConfirm !== undefined && cleanPass !== String(passwordConfirm).trim()) {
        return sendJson(res, 400, { success: false, message: 'Konfirmasi kata sandi tidak cocok.' });
      }
      if (requestedRole === 'admin') {
        return sendJson(res, 403, {
          success: false,
          message: 'Pendaftaran mandiri untuk peran Admin Kampus tidak diizinkan.'
        });
      }
      if (!['student', 'organization', 'partner'].includes(requestedRole)) {
        return sendJson(res, 400, { success: false, message: 'Kategori peran pengguna tidak valid.' });
      }

      const state = await getFullStateFromDb();
      const existingEmail = (state.users || []).find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (existingEmail) {
        return sendJson(res, 409, {
          success: false,
          message: 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.'
        });
      }

      if (requestedRole === 'student' && cleanIdentity) {
        const normIncNim = cleanIdentity.toLowerCase().replace(/^nim\s*/i, '').trim();
        const existingNim = (state.users || []).find(
          u => u.role === 'student' && u.identityNumber && u.identityNumber.toLowerCase().replace(/^nim\s*/i, '').trim() === normIncNim
        );
        if (existingNim) {
          return sendJson(res, 409, {
            success: false,
            message: `NIM "${cleanIdentity}" sudah terdaftar pada akun mahasiswa lain.`
          });
        }
      }

      // Validate SK Document upload if Organization
      if (requestedRole === 'organization' && skDocumentName) {
        const ext = path.extname(skDocumentName).toUpperCase().replace('.', '');
        const allowedFormats = state.systemConfig?.allowedUploadFormats || ['PDF', 'JPG', 'JPEG', 'PNG'];
        if (ext && !allowedFormats.includes(ext)) {
          return sendJson(res, 400, {
            success: false,
            message: `Format dokumen SK (${ext}) tidak didukung. Gunakan: ${allowedFormats.join(', ')}.`
          });
        }
        const maxBytes = (state.systemConfig?.maxUploadSizeKb || 2048) * 1024;
        if (skDocumentSize && Number(skDocumentSize) > maxBytes) {
          return sendJson(res, 400, {
            success: false,
            message: `Ukuran file SK melebihi batas maksimal (${state.systemConfig?.maxUploadSizeKb || 2048} KB).`
          });
        }
      }

      const roleLabels = {
        student: 'Mahasiswa',
        organization: 'BEM / UKM',
        partner: 'Mitra UMKM'
      };

      const newUserId = 'U-REG-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      const newUser = {
        id: newUserId,
        name: cleanName,
        email: cleanEmail,
        identityNumber: cleanIdentity || (requestedRole === 'organization' ? (skNumber || `ORG-${Date.now()}`) : `ID-${Math.floor(10000000 + Math.random() * 90000000)}`),
        password: hashPassword(cleanPass),
        role: requestedRole,
        accountStatus: 'Active',
        majorOrUnit: (majorOrUnit || studyProgram || businessCategory || orgCategory || roleLabels[requestedRole]).trim(),
        studyProgram: (studyProgram || majorOrUnit || '').trim(),
        faculty: (faculty || orgAffiliation || 'Fakultas & Unit Akademik Terdaftar').trim(),
        phone: (phone || '').trim(),
        ownerName: (ownerName || chairmanName || '').trim(),
        address: (address || '').trim(),
        status: requestedRole === 'organization' ? 'Menunggu Verifikasi SK' : 'Akun Terdaftar Aktif',
        impactScore: 0,
        leadershipScore: 0,
        projectsCompleted: 0,
        umkmHelped: 0,
        beneficiariesReached: 0,
        contributionHours: 0,
        bio: (bio || '').trim() || `Akun ${roleLabels[requestedRole]} terdaftar di ekosistem Campus Impact Hub.`,
        interests: ['Teknologi Tepat Guna', 'Pengembangan Komunitas'],
        skills: ['Kolaborasi'],
        createdAt: new Date().toISOString()
      };

      state.users = [...(state.users || []), newUser];

      // If registering as an Organization, automatically create its Pending Organization record
      let createdOrg = null;
      if (requestedRole === 'organization') {
        const initials = cleanName.split(' ').map(w => w[0]?.toUpperCase()).join('').slice(0, 3) || 'UKM';
        createdOrg = {
          id: `ORG-${String((state.organizations || []).length + 1).padStart(3, '0')}`,
          ownerUserId: newUserId,
          name: cleanName,
          fullName: cleanName,
          category: orgCategory || 'Kemahasiswaan & Sosial',
          level: orgLevel || 'Universitas',
          affiliation: orgAffiliation || faculty || 'Universitas',
          chairmanName: chairmanName || cleanName,
          logoInitials: initials,
          skNumber: skNumber || 'SK/PENDING/2026',
          skDocumentName: skDocumentName || 'SK_Organisasi.pdf',
          skDocumentType: skDocumentType || 'application/pdf',
          skDocumentSize: Number(skDocumentSize) || 102400,
          skDocumentData: skDocumentData || '',
          advisorName: advisorName || 'Dosen Pembina',
          contact: cleanEmail,
          activityField: activityField || orgCategory || 'Pengembangan Mahasiswa',
          description: (bio || '').trim() || 'Organisasi kemahasiswaan terdaftar.',
          memberCount: 1,
          verificationStatus: 'PENDING',
          rejectionReason: '',
          createdAt: new Date().toISOString()
        };
        state.organizations = [createdOrg, ...(state.organizations || [])];
      }

      state.isLoggedIn = true;
      state.currentUser = sanitizeUser(newUser);
      appendAuditLog(state, newUser, 'AUTH_REGISTER', 'user', newUser.id, `Registrasi akun baru (${requestedRole}): ${newUser.name} (${newUser.email})`);
      await saveFullStateToDb(state, { allowSystemBypass: true });

      const token = createSessionToken(newUser);
      return sendJson(res, 201, {
        success: true,
        token,
        user: sanitizeUser(newUser),
        role: newUser.role,
        organization: createdOrg
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // --- 4. Server-Side Logout & Session Check ---
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const auth = await getAuthenticatedUser(req);
    const token = extractBearerToken(req);
    if (token) {
      activeSessions.delete(token);
    }
    const state = await getFullStateFromDb();
    state.isLoggedIn = false;
    if (auth && auth.user) {
      appendAuditLog(state, auth.user, 'AUTH_LOGOUT', 'user', auth.user.id, `Logout sesi pengguna ${auth.user.email}`);
    }
    await saveFullStateToDb(state, { allowSystemBypass: true });
    return sendJson(res, 200, { success: true, message: 'Sesi berhasil diakhiri.' });
  }

  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return sendJson(res, 401, { success: false, message: 'Sesi tidak ditemukan atau telah berakhir.' });
    }
    return sendJson(res, 200, {
      success: true,
      user: sanitizeUser(auth.user),
      role: auth.user.role
    });
  }

  // --- 5. Update Own Profile & Change Password ---
  if (pathname === '/api/profile' && req.method === 'PUT') {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    try {
      const { name, phone, bio, faculty, studyProgram, majorOrUnit, address, ownerName, skills, interests } = await parseJsonBody(req);
      const state = auth.state;
      const idx = (state.users || []).findIndex(u => u.id === auth.user.id);
      if (idx === -1) return sendJson(res, 404, { success: false, message: 'Pengguna tidak ditemukan.' });

      const target = state.users[idx];
      if (name) target.name = String(name).trim();
      if (phone !== undefined) target.phone = String(phone).trim();
      if (bio !== undefined) target.bio = String(bio).trim();
      if (faculty !== undefined) target.faculty = String(faculty).trim();
      if (studyProgram !== undefined) target.studyProgram = String(studyProgram).trim();
      if (majorOrUnit !== undefined) target.majorOrUnit = String(majorOrUnit).trim();
      if (address !== undefined) target.address = String(address).trim();
      if (ownerName !== undefined) target.ownerName = String(ownerName).trim();
      if (Array.isArray(skills)) target.skills = skills;
      if (Array.isArray(interests)) target.interests = interests;

      state.currentUser = sanitizeUser(target);
      appendAuditLog(state, auth.user, 'PROFILE_UPDATE', 'user', target.id, `Memperbarui informasi profil pribadi (${target.email})`);
      await saveFullStateToDb(state, { allowSystemBypass: true });
      return sendJson(res, 200, { success: true, user: sanitizeUser(target), message: 'Profil berhasil diperbarui.' });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  if (pathname === '/api/auth/change-password' && req.method === 'POST') {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    try {
      const { currentPassword, newPassword } = await parseJsonBody(req);
      if (!currentPassword || !newPassword || String(newPassword).length < 6) {
        return sendJson(res, 400, { success: false, message: 'Kata sandi baru minimal harus 6 karakter.' });
      }
      if (!verifyPassword(currentPassword, auth.user.password)) {
        return sendJson(res, 401, { success: false, message: 'Kata sandi saat ini tidak sesuai.' });
      }
      const state = auth.state;
      const idx = state.users.findIndex(u => u.id === auth.user.id);
      state.users[idx].password = hashPassword(newPassword);
      appendAuditLog(state, auth.user, 'PASSWORD_CHANGE', 'user', auth.user.id, 'Mengubah kata sandi akun (scrypt hash updated)');
      await saveFullStateToDb(state, { allowSystemBypass: true });
      return sendJson(res, 200, { success: true, message: 'Kata sandi berhasil diperbarui.' });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // --- 6. Organization Registration, Profile Update & Admin Verification ---
  if (pathname === '/api/organizations' && req.method === 'POST') {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    if (!['organization', 'admin'].includes(auth.user.role)) {
      return sendJson(res, 403, { success: false, message: 'RBAC Violation: Hanya BEM/UKM atau Admin yang dapat mendaftarkan organisasi.' });
    }
    try {
      const body = await parseJsonBody(req);
      const state = auth.state;

      if (body.skDocumentName) {
        const ext = path.extname(body.skDocumentName).toUpperCase().replace('.', '');
        const allowedFormats = state.systemConfig?.allowedUploadFormats || ['PDF', 'JPG', 'JPEG', 'PNG'];
        if (ext && !allowedFormats.includes(ext)) {
          return sendJson(res, 400, { success: false, message: `Format dokumen SK (${ext}) tidak valid. Gunakan: ${allowedFormats.join(', ')}.` });
        }
        const maxBytes = (state.systemConfig?.maxUploadSizeKb || 2048) * 1024;
        if (body.skDocumentSize && Number(body.skDocumentSize) > maxBytes) {
          return sendJson(res, 400, { success: false, message: 'Ukuran file SK melebihi batas maksimal 2 MB.' });
        }
      }

      // Check if this organization user already has a registration record to update/resubmit
      let existingOrg = (state.organizations || []).find(o => o.id === body.id || (auth.user.role === 'organization' && o.ownerUserId === auth.user.id));
      const initials = (body.name || 'UKM').trim().split(' ').map(w => w[0]?.toUpperCase()).join('').slice(0, 3) || 'UKM';

      if (existingOrg) {
        if (!isOrganizationOwnedByUser(existingOrg, auth.user)) {
          return sendJson(res, 403, { success: false, message: 'Ownership Violation: Anda tidak memiliki hak akses untuk mengubah organisasi ini.' });
        }
        const legalChanged =
          (body.skNumber && body.skNumber !== existingOrg.skNumber) ||
          (body.skDocumentName && body.skDocumentName !== existingOrg.skDocumentName) ||
          (body.name && body.name !== existingOrg.name);

        existingOrg.name = body.name || existingOrg.name;
        existingOrg.fullName = body.fullName || body.name || existingOrg.fullName;
        existingOrg.category = body.category || existingOrg.category;
        existingOrg.level = body.level || existingOrg.level || 'Universitas';
        existingOrg.affiliation = body.affiliation || existingOrg.affiliation || 'Universitas';
        existingOrg.chairmanName = body.chairmanName || existingOrg.chairmanName || auth.user.name;
        existingOrg.advisorName = body.advisorName || existingOrg.advisorName;
        existingOrg.skNumber = body.skNumber || existingOrg.skNumber;
        if (body.skDocumentName) existingOrg.skDocumentName = body.skDocumentName;
        if (body.skDocumentType) existingOrg.skDocumentType = body.skDocumentType;
        if (body.skDocumentSize) existingOrg.skDocumentSize = Number(body.skDocumentSize);
        if (body.skDocumentData) existingOrg.skDocumentData = body.skDocumentData;
        existingOrg.activityField = body.activityField || existingOrg.activityField || existingOrg.category;
        existingOrg.description = body.description || existingOrg.description;
        existingOrg.contact = body.contact || existingOrg.contact;
        existingOrg.logoInitials = initials;

        if (auth.user.role !== 'admin' && (existingOrg.verificationStatus === 'REJECTED' || existingOrg.verificationStatus === 'DRAFT' || legalChanged)) {
          existingOrg.verificationStatus = 'PENDING';
          existingOrg.rejectionReason = '';
        }

        appendAuditLog(state, auth.user, 'ORG_UPDATE_RESUBMIT', 'organization', existingOrg.id, `Pembaruan / pengajuan ulang data organisasi ${existingOrg.name} (Status: ${existingOrg.verificationStatus})`);
        await saveFullStateToDb(state, { allowSystemBypass: true });
        return sendJson(res, 200, { success: true, organization: existingOrg, message: `Data organisasi "${existingOrg.name}" berhasil disimpan.` });
      }

      const newOrg = {
        id: `ORG${String((state.organizations || []).length + 1).padStart(3, '0')}`,
        ownerUserId: auth.user.id,
        name: body.name || 'Organisasi Baru',
        fullName: body.fullName || body.name || 'Organisasi Kemahasiswaan',
        category: body.category || 'Kepemimpinan & Sosial',
        level: body.level || 'Universitas',
        affiliation: body.affiliation || 'Universitas',
        chairmanName: body.chairmanName || auth.user.name,
        logoInitials: initials,
        skNumber: body.skNumber || 'SK/KEMAHASISWAAN/2026',
        skDocumentName: body.skDocumentName || 'SK_Resmi_Organisasi.pdf',
        skDocumentType: body.skDocumentType || 'application/pdf',
        skDocumentSize: Number(body.skDocumentSize) || 120400,
        skDocumentData: body.skDocumentData || '',
        advisorName: body.advisorName || 'Dosen Pembina',
        contact: body.contact || auth.user.email,
        activityField: body.activityField || body.category || 'Pengembangan Mahasiswa',
        description: body.description || 'Organisasi kemahasiswaan resmi.',
        memberCount: 1,
        verificationStatus: auth.user.role === 'admin' ? 'VERIFIED' : 'PENDING',
        rejectionReason: '',
        createdAt: new Date().toISOString()
      };

      state.organizations = [newOrg, ...(state.organizations || [])];
      appendAuditLog(state, auth.user, 'ORG_REGISTER', 'organization', newOrg.id, `Pendaftaran organisasi baru: ${newOrg.name} (${newOrg.skNumber})`);
      await saveFullStateToDb(state, { allowSystemBypass: true });
      return sendJson(res, 201, { success: true, organization: newOrg, message: `Organisasi "${newOrg.name}" berhasil diajukan.` });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  if (pathname === '/api/organizations/verify' && req.method === 'POST') {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    if (auth.user.role !== 'admin') {
      return sendJson(res, 403, { success: false, message: 'RBAC Violation: Hanya Admin Kampus yang berwenang memverifikasi organisasi.' });
    }
    try {
      const { orgId, status, rejectionReason } = await parseJsonBody(req);
      const state = auth.state;
      const org = (state.organizations || []).find(o => o.id === orgId);
      if (!org) return sendJson(res, 404, { success: false, message: 'Organisasi tidak ditemukan.' });

      if (status === 'REJECTED' && !String(rejectionReason || '').trim()) {
        return sendJson(res, 400, { success: false, message: 'Alasan penolakan wajib diisi saat menolak verifikasi organisasi.' });
      }

      org.verificationStatus = status === 'VERIFIED' ? 'VERIFIED' : (status === 'REJECTED' ? 'REJECTED' : 'PENDING');
      org.rejectionReason = status === 'REJECTED' ? String(rejectionReason).trim() : '';

      appendAuditLog(
        state,
        auth.user,
        org.verificationStatus === 'VERIFIED' ? 'ORG_VERIFIED' : 'ORG_REJECTED',
        'organization',
        org.id,
        `Status verifikasi ${org.name} diubah menjadi ${org.verificationStatus}${org.rejectionReason ? ' (Alasan: ' + org.rejectionReason + ')' : ''}`
      );
      await saveFullStateToDb(state, { allowSystemBypass: true });
      return sendJson(res, 200, {
        success: true,
        organization: org,
        message: org.verificationStatus === 'VERIFIED'
          ? `Organisasi "${org.name}" berhasil diverifikasi (Verified).`
          : `Organisasi "${org.name}" ditolak dengan alasan tercatat.`
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // --- 7. Event Management, Student Registration & Manual Attendance Validation (No QR) ---
  if (pathname === '/api/events' && (req.method === 'POST' || req.method === 'PUT')) {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    if (!['organization', 'admin'].includes(auth.user.role)) {
      return sendJson(res, 403, { success: false, message: 'RBAC Violation: Hanya BEM/UKM atau Admin yang dapat mengelola event kampus.' });
    }
    try {
      const body = await parseJsonBody(req);
      const state = auth.state;
      const ownOrgs = getOrganizationsOwnedByUser(state, auth.user);

      // Update existing event
      if (body.id) {
        const existingEv = (state.events || []).find(e => e.id === body.id);
        if (!existingEv) return sendJson(res, 404, { success: false, message: 'Event tidak ditemukan.' });
        if (!isEventOwnedByUser(existingEv, state, auth.user)) {
          return sendJson(res, 403, { success: false, message: 'Ownership Violation: Anda hanya dapat mengedit event milik organisasi Anda sendiri.' });
        }
        if (auth.user.role === 'organization' && body.publicationStatus === 'PUBLISHED') {
          const verifiedOrg = ownOrgs.find(o => o.verificationStatus === 'VERIFIED');
          if (!verifiedOrg) {
            return sendJson(res, 403, { success: false, message: 'RBAC Violation: Organisasi Anda belum berstatus Verified sehingga belum dapat mempublikasikan event resmi.' });
          }
        }
        existingEv.title = body.title || existingEv.title;
        existingEv.type = body.type || existingEv.type;
        existingEv.description = body.description || existingEv.description;
        existingEv.date = body.date || existingEv.date;
        existingEv.registrationDeadline = body.registrationDeadline || existingEv.registrationDeadline;
        existingEv.location = body.location || existingEv.location;
        if (body.quota) existingEv.quota = Math.max(1, parseInt(body.quota, 10) || existingEv.quota);
        if (body.publicationStatus) existingEv.publicationStatus = body.publicationStatus;
        if (body.posterSummary) existingEv.posterSummary = body.posterSummary;

        appendAuditLog(state, auth.user, 'EVENT_UPDATE', 'event', existingEv.id, `Memperbarui event "${existingEv.title}" (${existingEv.publicationStatus})`);
        await saveFullStateToDb(state, { allowSystemBypass: true });
        return sendJson(res, 200, { success: true, event: existingEv, message: `Event "${existingEv.title}" berhasil diperbarui.` });
      }

      // Create new event
      let organizerOrg = ownOrgs[0] || null;
      if (auth.user.role === 'organization') {
        const verifiedOrg = ownOrgs.find(o => o.verificationStatus === 'VERIFIED');
        if (!verifiedOrg) {
          return sendJson(res, 403, {
            success: false,
            message: 'RBAC Violation: Organisasi Anda masih berstatus Pending/Rejected. Hanya organisasi Terverifikasi (Verified) yang dapat mempublikasikan event resmi.'
          });
        }
        organizerOrg = verifiedOrg;
      }

      const newEvId = `EV${String((state.events || []).length + 1).padStart(3, '0')}`;
      const newEvent = {
        id: newEvId,
        organizationId: organizerOrg ? organizerOrg.id : (body.organizationId || 'ORG001'),
        ownerUserId: auth.user.id,
        title: (body.title || 'Event Kampus').trim(),
        organizerName: organizerOrg ? organizerOrg.name : (body.organizer || 'Organisasi Kemahasiswaan'),
        type: body.type || 'WORKSHOP',
        description: body.description || 'Kegiatan pengayaan kompetensi mahasiswa.',
        date: body.date || 'Segera',
        registrationDeadline: body.registrationDeadline || body.date || 'Segera',
        location: body.location || 'Auditorium Kampus',
        quota: Math.max(5, parseInt(body.quota, 10) || 100),
        registeredCount: 0,
        pointsReward: 10,
        committeePointsReward: 20,
        posterSummary: body.posterCaption || `Publikasi Resmi: ${body.title} — Validasi Kehadiran Manual (Nama/NIM)`,
        publicationStatus: body.publicationStatus || 'PUBLISHED',
        verifiedByAdmin: true,
        isRegistered: false,
        isAttended: false,
        createdAt: new Date().toISOString()
      };

      state.events = [newEvent, ...(state.events || [])];
      appendAuditLog(state, auth.user, 'EVENT_CREATE', 'event', newEvent.id, `Menerbitkan event baru: "${newEvent.title}" oleh ${newEvent.organizerName}`);
      await saveFullStateToDb(state, { allowSystemBypass: true });
      return sendJson(res, 201, { success: true, event: newEvent, message: `Event "${newEvent.title}" berhasil diterbitkan.` });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // Student Event Registration & Cancellation
  if (pathname === '/api/events/register' && req.method === 'POST') {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    if (auth.user.role !== 'student') {
      return sendJson(res, 403, { success: false, message: 'RBAC Violation: Hanya Mahasiswa yang dapat mendaftar sebagai peserta event.' });
    }
    try {
      const { eventId, action } = await parseJsonBody(req);
      const state = auth.state;
      const event = (state.events || []).find(e => e.id === eventId);
      if (!event) return sendJson(res, 404, { success: false, message: 'Event tidak ditemukan.' });

      state.eventRegistrations = Array.isArray(state.eventRegistrations) ? state.eventRegistrations : [];
      const existingReg = state.eventRegistrations.find(r => r.eventId === eventId && r.studentId === auth.user.id);

      if (action === 'cancel') {
        if (!existingReg || existingReg.registrationStatus === 'Cancelled') {
          return sendJson(res, 400, { success: false, message: 'Anda belum terdaftar pada event ini.' });
        }
        if (existingReg.attendanceStatus === 'Attended') {
          return sendJson(res, 400, { success: false, message: 'Pendaftaran tidak dapat dibatalkan karena kehadiran Anda sudah divalidasi.' });
        }
        existingReg.registrationStatus = 'Cancelled';
        existingReg.attendanceStatus = 'Cancelled';
        event.registeredCount = Math.max(0, (event.registeredCount || 1) - 1);
        event.isRegistered = false;
        appendAuditLog(state, auth.user, 'EVENT_CANCEL_REG', 'event', event.id, `Mahasiswa ${auth.user.name} membatalkan pendaftaran pada event ${event.title}`);
        await saveFullStateToDb(state, { allowSystemBypass: true });
        return sendJson(res, 200, { success: true, registration: existingReg, message: 'Pendaftaran event berhasil dibatalkan.' });
      }

      if (event.publicationStatus && event.publicationStatus !== 'PUBLISHED') {
        return sendJson(res, 400, { success: false, message: 'Event ini belum dibuka untuk pendaftaran publik.' });
      }

      if (existingReg && existingReg.registrationStatus === 'Registered') {
        return sendJson(res, 409, { success: false, message: 'Anda sudah terdaftar pada event ini.' });
      }

      const activeRegsCount = state.eventRegistrations.filter(r => r.eventId === eventId && r.registrationStatus === 'Registered').length;
      if (activeRegsCount >= (event.quota || 100)) {
        return sendJson(res, 400, { success: false, message: 'Kuota peserta event ini sudah penuh.' });
      }

      let regRecord = existingReg;
      if (regRecord) {
        regRecord.registrationStatus = 'Registered';
        regRecord.attendanceStatus = 'Registered';
        regRecord.registeredAt = new Date().toISOString();
      } else {
        regRecord = {
          id: `REG-${event.id}-${auth.user.id}`,
          eventId: event.id,
          eventTitle: event.title,
          organizerName: event.organizerName,
          studentId: auth.user.id,
          studentName: auth.user.name,
          studentNim: auth.user.identityNumber || '-',
          faculty: auth.user.faculty || 'Fakultas Ilmu Komputer',
          studyProgram: auth.user.studyProgram || auth.user.majorOrUnit || 'Program Studi',
          roleInEvent: 'Participant',
          registrationStatus: 'Registered',
          attendanceStatus: 'Registered',
          registeredAt: new Date().toISOString(),
          checkInTimestamp: null,
          validatedBy: null
        };
        state.eventRegistrations.unshift(regRecord);
      }

      event.registeredCount = activeRegsCount + 1;
      event.isRegistered = true;
      appendAuditLog(state, auth.user, 'EVENT_REGISTER', 'event', event.id, `Mahasiswa ${auth.user.name} (${auth.user.identityNumber}) mendaftar pada event ${event.title}`);
      await saveFullStateToDb(state, { allowSystemBypass: true });

      return sendJson(res, 200, {
        success: true,
        registration: regRecord,
        message: `Berhasil terdaftar pada "${event.title}". Poin kontribusi akan diberikan setelah kehadiran Anda divalidasi secara manual oleh panitia.`
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // Manual Event Attendance Validation by Organization / Admin (Name or NIM)
  if (pathname === '/api/events/validate-attendance' && req.method === 'POST') {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    }
    if (!['organization', 'admin'].includes(auth.user.role)) {
      return sendJson(res, 403, {
        success: false,
        message: 'RBAC Violation: Hanya Pengurus Organisasi atau Admin yang berwenang memvalidasi kehadiran peserta.'
      });
    }

    try {
      const { eventId, participantQuery, asCommittee, attendanceStatus } = await parseJsonBody(req);
      const cleanQuery = (participantQuery || '').trim().toLowerCase();
      if (!eventId || !cleanQuery) {
        return sendJson(res, 400, { success: false, message: 'ID Event dan Nama atau NIM peserta wajib diisi.' });
      }

      const state = auth.state;
      const event = (state.events || []).find(e => e.id === eventId);
      if (!event) {
        return sendJson(res, 404, { success: false, message: 'Event tidak ditemukan.' });
      }

      // Data ownership enforcement: an organization can only validate attendance for its own events
      if (auth.user.role === 'organization' && !isEventOwnedByUser(event, state, auth.user)) {
        return sendJson(res, 403, {
          success: false,
          message: 'Ownership Violation: Anda hanya berwenang memvalidasi kehadiran peserta pada event yang diselenggarakan oleh organisasi Anda sendiri.'
        });
      }

      const participant = (state.users || []).find(u =>
        (u.id && u.id.toLowerCase() === cleanQuery) ||
        (u.name && u.name.toLowerCase() === cleanQuery) ||
        (u.name && u.name.toLowerCase().includes(cleanQuery)) ||
        (u.identityNumber && u.identityNumber.toLowerCase().includes(cleanQuery)) ||
        (u.email && u.email.toLowerCase() === cleanQuery)
      );

      if (!participant) {
        return sendJson(res, 404, {
          success: false,
          message: `Peserta dengan Nama atau NIM "${participantQuery}" tidak ditemukan dalam daftar mahasiswa.`
        });
      }

      state.eventRegistrations = Array.isArray(state.eventRegistrations) ? state.eventRegistrations : [];
      let regRecord = state.eventRegistrations.find(r => r.eventId === event.id && r.studentId === participant.id);

      const targetStatus = attendanceStatus === 'No Show' ? 'No Show' : 'Attended';
      const credCode = `ATT-${event.id}-${participant.id}`;
      const alreadyValidated = (state.portfolioEntries || []).some(pf => pf.credentialCode === credCode) ||
        (regRecord && regRecord.attendanceStatus === 'Attended' && targetStatus === 'Attended');

      if (alreadyValidated && targetStatus === 'Attended') {
        return sendJson(res, 409, {
          success: false,
          message: `Kehadiran ${participant.name} (${participant.identityNumber}) sudah divalidasi sebelumnya pada event ini.`
        });
      }

      const nowIso = new Date().toISOString();
      if (!regRecord) {
        regRecord = {
          id: `REG-${event.id}-${participant.id}`,
          eventId: event.id,
          eventTitle: event.title,
          organizerName: event.organizerName,
          studentId: participant.id,
          studentName: participant.name,
          studentNim: participant.identityNumber || '-',
          faculty: participant.faculty || 'Fakultas Ilmu Komputer',
          studyProgram: participant.studyProgram || participant.majorOrUnit || 'Program Studi',
          roleInEvent: asCommittee ? 'Committee' : 'Participant',
          registrationStatus: 'Registered',
          attendanceStatus: targetStatus,
          registeredAt: nowIso,
          checkInTimestamp: nowIso,
          validatedBy: auth.user.name
        };
        state.eventRegistrations.unshift(regRecord);
        event.registeredCount = Math.min(event.quota || 100, (event.registeredCount || 0) + 1);
      } else {
        regRecord.registrationStatus = 'Registered';
        regRecord.attendanceStatus = targetStatus;
        regRecord.roleInEvent = asCommittee ? 'Committee' : 'Participant';
        regRecord.checkInTimestamp = nowIso;
        regRecord.validatedBy = auth.user.name;
      }

      if (targetStatus === 'No Show') {
        appendAuditLog(state, auth.user, 'ATTENDANCE_NO_SHOW', 'event', event.id, `Menandai ${participant.name} (${participant.identityNumber}) sebagai No Show pada ${event.title}`);
        await saveFullStateToDb(state, { allowSystemBypass: true });
        return sendJson(res, 200, {
          success: true,
          message: `Status kehadiran ${participant.name} (${participant.identityNumber}) dicatat sebagai Tidak Hadir (No Show).`,
          registration: regRecord,
          event
        });
      }

      event.isRegistered = true;
      event.isAttended = true;

      const earnedPoints = asCommittee ? (event.committeePointsReward || 20) : (event.pointsReward || 10);
      participant.impactScore = (participant.impactScore || 0) + earnedPoints;
      if (asCommittee) {
        participant.leadershipScore = (participant.leadershipScore || 0) + 20;
      }
      participant.contributionHours = (participant.contributionHours || 0) + 4;

      const newEntry = {
        id: `PF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: participant.id,
        activityId: event.id,
        title: `${asCommittee ? 'Panitia Pelaksana' : 'Peserta Hadir Terverifikasi'}: ${event.title}`,
        organizationOrPartner: event.organizerName,
        category: 'Event Kampus',
        date: event.date,
        impactPoints: earnedPoints,
        leadershipPoints: asCommittee ? 20 : 0,
        verificationStatus: 'VERIFIED',
        verifiedBy: auth.user.name,
        outcomeSummary: `Kehadiran divalidasi secara manual oleh ${auth.user.name} (${event.organizerName}) berdasarkan identitas ${participant.name} (${participant.identityNumber}).`,
        credentialCode: credCode,
        createdAt: nowIso
      };

      state.portfolioEntries = [newEntry, ...(state.portfolioEntries || [])];
      appendAuditLog(state, auth.user, 'ATTENDANCE_VALIDATED', 'event', event.id, `Validasi kehadiran manual ${participant.name} (${participant.identityNumber}) pada ${event.title} (+${earnedPoints} Impact)`);
      await saveFullStateToDb(state, { allowSystemBypass: true });

      return sendJson(res, 200, {
        success: true,
        message: `Kehadiran ${participant.name} (${participant.identityNumber}) berhasil divalidasi (+${earnedPoints} Impact Score${asCommittee ? ' & +20 Leadership' : ''}).`,
        participant: sanitizeUser(participant),
        registration: regRecord,
        portfolioEntry: newEntry,
        event
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // --- 8. Social Projects: Partner Problem Submission, Student Application & Admin Review ---
  if (pathname === '/api/projects' && (req.method === 'POST' || req.method === 'PUT')) {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    if (!['partner', 'admin'].includes(auth.user.role)) {
      return sendJson(res, 403, { success: false, message: 'RBAC Violation: Hanya Mitra UMKM atau Admin yang dapat mengajukan atau mengelola proyek sosial.' });
    }
    try {
      const body = await parseJsonBody(req);
      const state = auth.state;

      // Update / Review existing project
      if (body.id) {
        const proj = (state.projects || []).find(p => p.id === body.id);
        if (!proj) return sendJson(res, 404, { success: false, message: 'Proyek tidak ditemukan.' });
        if (auth.user.role === 'partner' && !isProjectOwnedByUser(proj, auth.user)) {
          return sendJson(res, 403, { success: false, message: 'Ownership Violation: Mitra UMKM hanya dapat mengelola pengajuan proyek miliknya sendiri.' });
        }

        if (body.status && body.status !== proj.status) {
          if (auth.user.role === 'partner' && ['OPEN', 'REJECTED', 'UNDER_REVIEW'].includes(body.status) && ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'].includes(proj.status)) {
            return sendJson(res, 403, { success: false, message: 'RBAC Violation: Persetujuan pengajuan masalah menjadi proyek Open hanya dapat dilakukan oleh Admin Kampus.' });
          }
          if (body.status === 'REJECTED' && !String(body.rejectionReason || '').trim()) {
            return sendJson(res, 400, { success: false, message: 'Alasan penolakan proyek wajib diisi.' });
          }
          proj.status = body.status;
          if (body.status === 'OPEN') {
            proj.verifiedByAdmin = true;
            proj.rejectionReason = '';
          }
          if (body.status === 'REJECTED') {
            proj.verifiedByAdmin = false;
            proj.rejectionReason = String(body.rejectionReason).trim();
          }

          // Award points to assigned students ONLY when project is COMPLETED and verified
          if (body.status === 'COMPLETED') {
            const assigned = Array.isArray(proj.assignedStudents) ? proj.assignedStudents : [];
            for (const asg of assigned) {
              const credCode = `PRJ-DONE-${proj.id}-${asg.studentId}`;
              const alreadyAwarded = (state.portfolioEntries || []).some(pf => pf.credentialCode === credCode);
              if (!alreadyAwarded) {
                const studentUser = (state.users || []).find(u => u.id === asg.studentId);
                const isLeader = String(asg.roleInProject || '').toLowerCase().includes('ketua');
                const impPoints = isLeader ? 75 : 50;
                const leadPoints = isLeader ? 75 : 0;
                if (studentUser) {
                  studentUser.impactScore = (studentUser.impactScore || 0) + impPoints;
                  studentUser.leadershipScore = (studentUser.leadershipScore || 0) + leadPoints;
                  studentUser.projectsCompleted = (studentUser.projectsCompleted || 0) + 1;
                  studentUser.umkmHelped = (studentUser.umkmHelped || 0) + 1;
                  studentUser.contributionHours = (studentUser.contributionHours || 0) + 12;
                }
                state.portfolioEntries.unshift({
                  id: `PF-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
                  userId: asg.studentId,
                  activityId: proj.id,
                  title: `${isLeader ? 'Ketua Tim Proyek' : 'Anggota Proyek Sosial'}: ${proj.title}`,
                  organizationOrPartner: proj.organizationName,
                  category: 'Project Sosial',
                  date: 'Proyek Selesai Terverifikasi',
                  impactPoints: impPoints,
                  leadershipPoints: leadPoints,
                  verificationStatus: 'VERIFIED',
                  verifiedBy: auth.user.name,
                  outcomeSummary: `Menyelesaikan proyek sosial pada mitra ${proj.organizationName} (${proj.impactReport?.beneficiaries || 50} penerima manfaat).`,
                  credentialCode: credCode,
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        }

        if (body.title) proj.title = body.title;
        if (body.description) proj.description = body.description;
        if (body.category) proj.category = body.category;
        if (body.location) proj.location = body.location;
        if (body.expectedOutcomes) proj.expectedOutcomes = body.expectedOutcomes;
        if (body.expectedDuration) proj.expectedDuration = body.expectedDuration;

        appendAuditLog(state, auth.user, 'PROJECT_UPDATE', 'project', proj.id, `Status / data proyek "${proj.title}" diperbarui menjadi ${proj.status}`);
        await saveFullStateToDb(state, { allowSystemBypass: true });
        return sendJson(res, 200, { success: true, project: proj, message: `Proyek "${proj.title}" berhasil diperbarui (${proj.status}).` });
      }

      // Create new problem submission
      if (!body.title || !String(body.title).trim()) {
        return sendJson(res, 400, { success: false, message: 'Judul masalah / proyek wajib diisi.' });
      }

      const newId = `P${String((state.projects || []).length + 1).padStart(3, '0')}`;
      const benCount = Math.max(5, parseInt(body.estimatedBeneficiaries, 10) || 50);
      const reqList = Array.isArray(body.requirements)
        ? body.requirements
        : String(body.requirementsInput || '2 Informatika, 1 Bisnis Digital').split(',').map(s => s.trim()).filter(Boolean);

      // Partner submissions MUST enter administrative review (SUBMITTED), never OPEN automatically
      const initialStatus = auth.user.role === 'admin' ? 'OPEN' : 'SUBMITTED';

      const newProject = {
        id: newId,
        ownerUserId: auth.user.id,
        organizationName: (body.orgName || auth.user.name || 'Mitra UMKM').trim(),
        ownerName: (body.ownerName || auth.user.ownerName || auth.user.name).trim(),
        title: String(body.title).trim(),
        description: (body.description || '').trim(),
        category: body.category || 'Teknologi',
        location: (body.location || auth.user.address || 'Bandung').trim(),
        photoCaption: body.photoLabel || `Dokumentasi Usaha: ${body.orgName || auth.user.name}`,
        attachmentName: body.attachmentName || body.photoLabel || 'Lampiran_Masalah_UMKM.pdf',
        expectedOutcomes: (body.expectedOutcomes || 'Implementasi solusi tepat guna terverifikasi').trim(),
        expectedDuration: (body.expectedDuration || '8 Minggu').trim(),
        impactScore: 85,
        requirements: reqList.length ? reqList : ['2 Informatika', '1 Desain'],
        status: initialStatus,
        rejectionReason: '',
        verifiedByAdmin: auth.user.role === 'admin',
        applicantCount: 0,
        userApplicationState: 'NONE',
        userRoleInProject: 'Anggota Proyek Sosial (+50 Poin)',
        milestones: [
          { id: 'M1', title: 'Review Kelayakan & Persetujuan Admin Kampus', status: initialStatus === 'OPEN' ? 'COMPLETED' : 'ON_GOING' },
          { id: 'M2', title: 'Pendaftaran & Penugasan Mahasiswa Pelaksana', status: 'PENDING' },
          { id: 'M3', title: 'Implementasi Solusi & Evaluasi Mitra UMKM', status: 'PENDING' }
        ],
        assignedStudents: [],
        impactReport: {
          id: `I-${newId}`,
          projectId: newId,
          beforeCondition: 'Kendala operasional mitra sebelum pendampingan mahasiswa',
          afterCondition: body.expectedOutcomes || 'Target capaian: Implementasi solusi tepat guna',
          beneficiaries: benCount,
          sdgCategory: 'SDG 8 & 11: Pemberdayaan UMKM & Komunitas Berkelanjutan',
          partnerFeedback: 'Menunggu pelaksanaan dan evaluasi proyek.'
        },
        createdAt: new Date().toISOString()
      };

      state.projects = [newProject, ...(state.projects || [])];
      appendAuditLog(state, auth.user, 'PROBLEM_SUBMITTED', 'project', newProject.id, `Pengajuan masalah baru: "${newProject.title}" oleh ${newProject.organizationName} (Status: ${newProject.status})`);
      await saveFullStateToDb(state, { allowSystemBypass: true });
      return sendJson(res, 201, {
        success: true,
        project: newProject,
        message: initialStatus === 'SUBMITTED'
          ? `Masalah "${newProject.title}" berhasil diajukan dan masuk antrean Review Admin Kampus.`
          : `Proyek "${newProject.title}" berhasil diterbitkan.`
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // Student Apply to Project (No automatic points on mere registration!)
  if (pathname === '/api/projects/apply' && req.method === 'POST') {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    if (auth.user.role !== 'student') {
      return sendJson(res, 403, { success: false, message: 'RBAC Violation: Hanya Mahasiswa yang dapat mendaftar pada proyek sosial.' });
    }
    try {
      const { projectId, asTeamLeader } = await parseJsonBody(req);
      const state = auth.state;
      const project = (state.projects || []).find(p => p.id === projectId);
      if (!project) return sendJson(res, 404, { success: false, message: 'Proyek tidak ditemukan.' });

      if (!['OPEN', 'ON_GOING'].includes(project.status)) {
        return sendJson(res, 400, { success: false, message: 'Proyek ini belum dibuka untuk pendaftaran mahasiswa.' });
      }

      state.projectRegistrations = Array.isArray(state.projectRegistrations) ? state.projectRegistrations : [];
      const alreadyReg = state.projectRegistrations.find(r => r.projectId === project.id && r.studentId === auth.user.id);
      if (alreadyReg) {
        return sendJson(res, 409, { success: false, message: `Anda sudah terdaftar pada proyek "${project.title}".` });
      }

      const roleTitle = asTeamLeader ? 'Ketua Tim Proyek (+75 Poin)' : 'Anggota Proyek Sosial (+50 Poin)';
      const regRecord = {
        id: `PRJ-REG-${project.id}-${auth.user.id}`,
        projectId: project.id,
        projectTitle: project.title,
        studentId: auth.user.id,
        studentName: auth.user.name,
        studentNim: auth.user.identityNumber || '-',
        faculty: auth.user.faculty || 'Fakultas Ilmu Komputer',
        studyProgram: auth.user.studyProgram || auth.user.majorOrUnit || 'Program Studi',
        roleInProject: roleTitle,
        status: 'APPROVED',
        pointsAwarded: false,
        registeredAt: new Date().toISOString()
      };

      state.projectRegistrations.unshift(regRecord);
      project.assignedStudents = Array.isArray(project.assignedStudents) ? project.assignedStudents : [];
      if (!project.assignedStudents.some(s => s.studentId === auth.user.id)) {
        project.assignedStudents.push({
          studentId: auth.user.id,
          name: auth.user.name,
          nim: auth.user.identityNumber || '-',
          faculty: auth.user.faculty || 'Fakultas Ilmu Komputer',
          studyProgram: auth.user.studyProgram || auth.user.majorOrUnit || 'Program Studi',
          roleInProject: roleTitle,
          status: 'APPROVED'
        });
      }
      project.applicantCount = project.assignedStudents.length;
      project.userApplicationState = 'APPROVED';
      project.userRoleInProject = roleTitle;

      appendAuditLog(state, auth.user, 'PROJECT_REGISTER', 'project', project.id, `Mahasiswa ${auth.user.name} (${auth.user.identityNumber}) mendaftar pada proyek "${project.title}" sebagai ${roleTitle}`);
      await saveFullStateToDb(state, { allowSystemBypass: true });

      return sendJson(res, 200, {
        success: true,
        registration: regRecord,
        project,
        message: `Berhasil terdaftar pada proyek "${project.title}" sebagai ${roleTitle}. Poin kontribusi akan diberikan setelah proyek selesai & diverifikasi.`
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // --- 9. Partner Student Performance Evaluation ---
  if (pathname === '/api/evaluations' && req.method === 'POST') {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    if (!['partner', 'admin'].includes(auth.user.role)) {
      return sendJson(res, 403, { success: false, message: 'RBAC Violation: Hanya Mitra UMKM atau Admin yang dapat memberikan penilaian kinerja mahasiswa.' });
    }
    try {
      const { projectId, studentId, ratings, comment } = await parseJsonBody(req);
      if (!projectId || !studentId || !ratings) {
        return sendJson(res, 400, { success: false, message: 'Proyek, mahasiswa, dan nilai evaluasi wajib diisi.' });
      }

      const state = auth.state;
      const project = (state.projects || []).find(p => p.id === projectId);
      if (!project) return sendJson(res, 404, { success: false, message: 'Proyek tidak ditemukan.' });

      if (auth.user.role === 'partner' && !isProjectOwnedByUser(project, auth.user)) {
        return sendJson(res, 403, { success: false, message: 'Ownership Violation: Anda hanya dapat menilai mahasiswa pada proyek milik UMKM Anda sendiri.' });
      }

      const isAssigned = (project.assignedStudents || []).some(s => s.studentId === studentId) ||
        (state.projectRegistrations || []).some(r => r.projectId === projectId && r.studentId === studentId);
      if (!isAssigned) {
        return sendJson(res, 400, { success: false, message: 'Mahasiswa tersebut tidak terdaftar sebagai peserta pada proyek ini.' });
      }

      state.partnerEvaluations = Array.isArray(state.partnerEvaluations) ? state.partnerEvaluations : [];
      const duplicate = state.partnerEvaluations.find(ev => ev.projectId === projectId && ev.studentId === studentId);
      if (duplicate) {
        return sendJson(res, 409, { success: false, message: 'Penilaian untuk mahasiswa ini pada proyek tersebut sudah pernah dikirimkan.' });
      }

      const studentUser = (state.users || []).find(u => u.id === studentId);
      const cleanRatings = {
        workQuality: Math.min(5, Math.max(1, Number(ratings.workQuality) || 5)),
        timeliness: Math.min(5, Math.max(1, Number(ratings.timeliness) || 5)),
        communication: Math.min(5, Math.max(1, Number(ratings.communication) || 5)),
        responsibility: Math.min(5, Math.max(1, Number(ratings.responsibility) || 5)),
        objectiveAchievement: Math.min(5, Math.max(1, Number(ratings.objectiveAchievement) || 5))
      };
      const avg = Number(((cleanRatings.workQuality + cleanRatings.timeliness + cleanRatings.communication + cleanRatings.responsibility + cleanRatings.objectiveAchievement) / 5).toFixed(2));

      const evaluation = {
        id: `EVAL-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
        projectId: project.id,
        projectTitle: project.title,
        studentId,
        studentName: studentUser ? studentUser.name : 'Mahasiswa Pelaksana',
        studentNim: studentUser ? studentUser.identityNumber : '-',
        partnerId: auth.user.id,
        partnerName: project.organizationName || auth.user.name,
        ratings: cleanRatings,
        averageScore: avg,
        comment: (comment || 'Mahasiswa menunjukkan dedikasi dan kualitas kerja sangat baik.').trim(),
        verifiedByAdmin: true,
        createdAt: new Date().toISOString()
      };

      state.partnerEvaluations.unshift(evaluation);
      if (project.impactReport) {
        project.impactReport.partnerFeedback = evaluation.comment;
      }

      appendAuditLog(state, auth.user, 'PARTNER_EVALUATION', 'evaluation', evaluation.id, `Mitra ${evaluation.partnerName} menilai mahasiswa ${evaluation.studentName} pada proyek "${project.title}" (Skor: ${avg}/5)`);
      await saveFullStateToDb(state, { allowSystemBypass: true });

      return sendJson(res, 201, {
        success: true,
        evaluation,
        message: `Penilaian kinerja untuk ${evaluation.studentName} berhasil disimpan (Rata-rata: ${avg}/5.00).`
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // --- 10. Admin User & Account Status Management + System Configuration ---
  if (pathname === '/api/admin/users' && req.method === 'PUT') {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    if (auth.user.role !== 'admin') {
      return sendJson(res, 403, { success: false, message: 'RBAC Violation: Hanya Admin Kampus yang dapat mengelola data dan status akun pengguna.' });
    }
    try {
      const { userId, accountStatus, name, faculty, studyProgram, majorOrUnit } = await parseJsonBody(req);
      const state = auth.state;
      const target = (state.users || []).find(u => u.id === userId);
      if (!target) return sendJson(res, 404, { success: false, message: 'Pengguna tidak ditemukan.' });

      if (accountStatus && ['Active', 'Inactive', 'Suspended'].includes(accountStatus)) {
        target.accountStatus = accountStatus;
        target.status = accountStatus === 'Active' ? 'Mahasiswa Aktif' : `Akun ${accountStatus}`;
      }
      if (name) target.name = String(name).trim();
      if (faculty) target.faculty = String(faculty).trim();
      if (studyProgram) target.studyProgram = String(studyProgram).trim();
      if (majorOrUnit) target.majorOrUnit = String(majorOrUnit).trim();

      appendAuditLog(state, auth.user, 'ADMIN_USER_UPDATE', 'user', target.id, `Admin memperbarui data/status akun ${target.name} (${target.email}) -> Status: ${target.accountStatus}`);
      await saveFullStateToDb(state, { allowSystemBypass: true });
      return sendJson(res, 200, {
        success: true,
        user: sanitizeUser(target),
        message: `Data pengguna "${target.name}" berhasil diperbarui (Status: ${target.accountStatus}).`
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  if (pathname === '/api/admin/system-config' && req.method === 'PUT') {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
    if (auth.user.role !== 'admin') {
      return sendJson(res, 403, { success: false, message: 'RBAC Violation: Hanya Admin Kampus yang dapat mengubah konfigurasi sistem.' });
    }
    try {
      const body = await parseJsonBody(req);
      const state = auth.state;
      state.systemConfig = {
        ...(state.systemConfig || DEFAULT_SYSTEM_CONFIG),
        ...body
      };
      appendAuditLog(state, auth.user, 'SYSTEM_CONFIG_UPDATE', 'system_config', 'global', 'Admin memperbarui konfigurasi sistem platform.');
      await saveFullStateToDb(state, { allowSystemBypass: true });
      return sendJson(res, 200, { success: true, systemConfig: state.systemConfig, message: 'Konfigurasi sistem berhasil disimpan.' });
    } catch (err) {
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // --- Get Sanitized State ---
  if (pathname === '/api/state' && req.method === 'GET') {
    const state = await getFullStateFromDb();
    return sendJson(res, 200, sanitizeStateForClient(state));
  }

  // --- Save State (Protected by Server-Side Auth + RBAC + Ownership + Non-Destructive Upsert) ---
  if (pathname === '/api/state' && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        return sendJson(res, 401, {
          success: false,
          message: 'Akses ditolak: Sesi autentikasi tidak valid. Silakan login terlebih dahulu.'
        });
      }

      const body = await parseJsonBody(req);
      const rbacCheck = validateStateMutationRbac(auth.user, auth.state, body);
      if (!rbacCheck.allowed) {
        return sendJson(res, 403, {
          success: false,
          message: rbacCheck.message
        });
      }

      const savedState = await saveFullStateToDb(body);
      return sendJson(res, 200, {
        success: true,
        dbEngine: isPgConnected ? 'PostgreSQL 16 (Docker)' : (sqliteDb ? 'SQLite + PostgreSQL Ready' : 'Local Persistent DB'),
        state: sanitizeStateForClient(savedState)
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // --- Admin-Only Load Demo Data ---
  if (pathname === '/api/demo' && req.method === 'POST') {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
      }
      if (auth.user.role !== 'admin') {
        return sendJson(res, 403, { success: false, message: 'RBAC Violation: Hanya Admin Kampus yang dapat memuat data demo.' });
      }

      const current = auth.state;
      const updated = {
        ...current,
        projects: mergeRecordsById(current.projects, DEMO_PROJECTS),
        organizations: mergeRecordsById(current.organizations, DEMO_ORGANIZATIONS),
        events: mergeRecordsById(current.events, DEMO_EVENTS),
        eventRegistrations: mergeRecordsById(current.eventRegistrations, DEMO_EVENT_REGISTRATIONS),
        projectRegistrations: mergeRecordsById(current.projectRegistrations, DEMO_PROJECT_REGISTRATIONS),
        portfolioEntries: mergeRecordsById(current.portfolioEntries, DEMO_PORTFOLIO_ENTRIES)
      };
      appendAuditLog(updated, auth.user, 'ADMIN_LOAD_DEMO', 'database', 'all', 'Admin memuat data contoh (demo) secara non-destruktif.');
      const saved = await saveFullStateToDb(updated);
      return sendJson(res, 200, sanitizeStateForClient(saved));
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // --- Admin-Only Reset Data (Creates Timestamped Backup Before Reset) ---
  if (pathname === '/api/reset' && req.method === 'POST') {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        return sendJson(res, 401, { success: false, message: 'Autentikasi diperlukan.' });
      }
      if (auth.user.role !== 'admin') {
        return sendJson(res, 403, { success: false, message: 'RBAC Violation: Hanya Admin Kampus yang dapat mereset database.' });
      }

      createPreWriteBackup(`pre_reset_${Date.now()}`);
      const emptyState = {
        isLoggedIn: true,
        currentUser: sanitizeUser(auth.user),
        users: auth.state.users,
        projects: [],
        organizations: [],
        events: [],
        eventRegistrations: [],
        projectRegistrations: [],
        partnerEvaluations: [],
        portfolioEntries: [],
        auditLogs: auth.state.auditLogs || []
      };
      appendAuditLog(emptyState, auth.user, 'ADMIN_RESET_DB', 'database', 'all', 'Admin mengosongkan koleksi operasional (backup otomatis tersimpan).');
      const saved = await saveFullStateToDb(emptyState, { replaceCollections: true });
      return sendJson(res, 200, sanitizeStateForClient(saved));
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

if (require.main === module) {
  initDatabase().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`CAMPUS IMPACT HUB - FULL-STACK WEB & DATABASE SERVER`);
      console.log(`-------------------------------------------------------`);
      console.log(`URL Aplikasi : http://localhost:${PORT}`);
      console.log(`API Health   : http://localhost:${PORT}/api/health`);
      console.log(`API Database : http://localhost:${PORT}/api/state`);
      console.log(`Security     : Scrypt Password Hash + RBAC + Ownership`);
      console.log(`DB Engine    : ${isPgConnected ? 'PostgreSQL 16 (Active)' : 'SQLite + Local DB (PostgreSQL Docker Ready)'}`);
      console.log(`=======================================================`);
    });
  });
}

module.exports = { server, initDatabase };
