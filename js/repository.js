/**
 * Campus Impact Hub - CampusRepository
 * Full-Stack Non-Destructive Database Synchronization + Server-Side Auth, RBAC & Data Ownership
 */

import {
  UserRole,
  AccountStatus,
  ProjectStatus,
  VerificationStatus,
  EventPublicationStatus,
  RegistrationStatus,
  AttendanceStatus,
  EventType,
  EvaluationCriteria
} from './models.js';

const STORAGE_KEY = 'campus_impact_hub_state_v9_enterprise';
const TOKEN_STORAGE_KEY = 'campus_impact_hub_auth_token';

export const DEVELOPER_PROFILE = {
  name: 'Budi Santoso',
  program: 'S1 Teknik Informatika',
  affiliation: 'Program Beasiswa Santri Berprestasi (PBSB) — Kementerian Agama RI & Mitra Kampus',
  nim: '13523001',
  role: 'Mahasiswa Pengembang & Koordinator Inovasi',
  email: 'budi.santoso@kampus.ac.id',
  about: 'Mahasiswa santri berprestasi yang berdedikasi membangun platform kolaboratif kampus untuk menghubungkan permasalahan nyata mitra masyarakat (UMKM, Desa, Sekolah), talenta mahasiswa multidisiplin, organisasi kemahasiswaan, dan dampak sosial yang terukur.',
  skills: [
    'Rekayasa Web Terpadu (SPA & Modular JS)',
    'Arsitektur Database PostgreSQL & Docker Container',
    'Manajemen Portofolio Dampak Sosial & MBKM',
    'Sistem Autentikasi Server-Side (scrypt) & RBAC Terpadu'
  ],
  interests: [
    'Digitalisasi UMKM & Komunitas',
    'Pemberdayaan Santri & Kampus Berdampak',
    'Sistem Informasi Pengabdian Masyarakat'
  ],
  motto: 'Mewujudkan inovasi digital yang tidak hanya berhenti sebagai transkrip akademik, namun berdampak nyata bagi masyarakat.'
};

const DEFAULT_USERS = [
  {
    id: 'U-MHS-001',
    name: 'Budi Santoso',
    email: 'mahasiswa@kampus.ac.id',
    identityNumber: '13523001',
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
    skills: ['Full-Stack Web', 'UI/UX Design', 'Database Architecture']
  },
  {
    id: 'U-DSN-002',
    name: 'Dr. Ir. Hendra Wijaya, M.T.',
    email: 'dosen@kampus.ac.id',
    identityNumber: 'NIP 198501152010121002',
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
    skills: ['Supervisi Proyek', 'Audit Kurikulum', 'Kemitraan Industri']
  },
  {
    id: 'U-BEM-003',
    name: 'Rizky Pratama',
    email: 'bem@kampus.ac.id',
    identityNumber: '13522045',
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
    skills: ['Public Speaking', 'Event Organizing', 'Team Coordination']
  },
  {
    id: 'U-MTR-004',
    name: 'UMKM Maju Jaya',
    email: 'umkm@kampus.ac.id',
    identityNumber: 'UMKM-2026-08',
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
    skills: ['Manajemen Toko', 'Produksi Kuliner & Ritel', 'Kemitraan Usaha']
  }
];

const DEFAULT_USER = JSON.parse(JSON.stringify(DEFAULT_USERS[0]));

const DEFAULT_ACTIVITY_POINT_RULES = [
  {
    activityName: 'Peserta Event Kampus Terverifikasi',
    points: 10,
    scoreType: 'Impact Score (+10)',
    description: 'Diberikan setelah mahasiswa terdaftar hadir dan divalidasi secara manual oleh panitia organisasi berdasarkan Nama atau NIM.'
  },
  {
    activityName: 'Panitia Pelaksana Event',
    points: 20,
    scoreType: 'Impact (+20) & Leadership (+20)',
    description: 'Diberikan setelah kontribusi kepanitiaan divalidasi oleh penyelenggara organisasi atau administrator.'
  },
  {
    activityName: 'Pengurus Aktif Organisasi Terverifikasi',
    points: 30,
    scoreType: 'Impact (+30) & Leadership (+30)',
    description: 'Menjadi pengurus aktif organisasi kemahasiswaan yang SK-nya telah diverifikasi Admin Kampus.'
  },
  {
    activityName: 'Anggota Proyek Sosial Selesai',
    points: 50,
    scoreType: 'Impact Score (+50)',
    description: 'Diberikan setelah proyek penyelesaian masalah mitra UMKM selesai dilaksanakan dan diverifikasi.'
  },
  {
    activityName: 'Ketua Tim Proyek Sosial Selesai',
    points: 75,
    scoreType: 'Impact (+75) & Leadership (+75)',
    description: 'Diberikan setelah memimpin tim mahasiswa menyelesaikan proyek sosial mitra UMKM hingga tuntas.'
  }
];

class CampusRepositoryClass {
  constructor() {
    this.isLoggedIn = false;
    this.authToken = null;
    this.dbEngine = 'PostgreSQL 16 (Docker)';
    this.isDbConnected = false;
    this.onChangeCallbacks = [];
    this.loadState();
    this.syncFromDatabase();
  }

  onDatabaseSync(cb) {
    if (typeof cb === 'function') {
      this.onChangeCallbacks.push(cb);
    }
  }

  notifyListeners() {
    this.onChangeCallbacks.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.warn('Listener error:', e);
      }
    });
  }

  // --- Centralized RBAC & Data Ownership Guards ---
  hasRole(...allowedRoles) {
    if (!this.isLoggedIn || !this.currentUser) return false;
    const currentRole = (this.currentUser.role || '').toLowerCase();
    return allowedRoles.map(r => r.toLowerCase()).includes(currentRole);
  }

  assertRole(allowedRoles, actionLabel = 'aksi ini') {
    if (!this.isLoggedIn || !this.currentUser) {
      throw new Error(`Akses ditolak: Silakan login terlebih dahulu untuk melakukan ${actionLabel}.`);
    }
    if (!this.hasRole(...allowedRoles)) {
      const roleLabel = UserRole[(this.currentUser.role || '').toUpperCase()]?.label || this.currentUser.role;
      throw new Error(`Akses ditolak (RBAC): Peran ${roleLabel} tidak memiliki izin untuk ${actionLabel}.`);
    }
  }

  isOwnOrganization(org) {
    if (!org || !this.currentUser) return false;
    if (this.hasRole('admin')) return true;
    if (org.ownerUserId && org.ownerUserId === this.currentUser.id) return true;
    if (org.contact && this.currentUser.email && org.contact.toLowerCase() === this.currentUser.email.toLowerCase()) return true;
    if (org.name && this.currentUser.majorOrUnit && org.name.toLowerCase() === this.currentUser.majorOrUnit.toLowerCase()) return true;
    return false;
  }

  getMyOrganization() {
    if (!this.currentUser) return null;
    return (this.organizations || []).find(o => this.isOwnOrganization(o)) || null;
  }

  isOwnEvent(event) {
    if (!event || !this.currentUser) return false;
    if (this.hasRole('admin')) return true;
    if (event.ownerUserId && event.ownerUserId === this.currentUser.id) return true;
    const myOrg = this.getMyOrganization();
    if (myOrg && (event.organizationId === myOrg.id || (event.organizerName && event.organizerName.toLowerCase() === myOrg.name.toLowerCase()))) {
      return true;
    }
    return false;
  }

  isOwnProject(project) {
    if (!project || !this.currentUser) return false;
    if (this.hasRole('admin')) return true;
    if (project.ownerUserId && project.ownerUserId === this.currentUser.id) return true;
    if (project.organizationName && this.currentUser.name && project.organizationName.toLowerCase().includes(this.currentUser.name.toLowerCase())) return true;
    return false;
  }

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  loadState() {
    try {
      this.authToken = localStorage.getItem(TOKEN_STORAGE_KEY) || null;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.isLoggedIn = Boolean(parsed.isLoggedIn && this.authToken);
        this.currentUser = parsed.currentUser || JSON.parse(JSON.stringify(DEFAULT_USER));
        delete this.currentUser.password;
        this.projects = Array.isArray(parsed.projects) ? parsed.projects : [];
        this.organizations = Array.isArray(parsed.organizations) ? parsed.organizations : [];
        this.events = Array.isArray(parsed.events) ? parsed.events : [];
        this.eventRegistrations = Array.isArray(parsed.eventRegistrations) ? parsed.eventRegistrations : [];
        this.projectRegistrations = Array.isArray(parsed.projectRegistrations) ? parsed.projectRegistrations : [];
        this.partnerEvaluations = Array.isArray(parsed.partnerEvaluations) ? parsed.partnerEvaluations : [];
        this.portfolioEntries = Array.isArray(parsed.portfolioEntries) ? parsed.portfolioEntries : [];
        this.auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [];
        this.systemConfig = parsed.systemConfig || {
          appName: 'Campus Impact Hub',
          version: '2.2.0',
          allowedUploadFormats: ['PDF', 'JPG', 'JPEG', 'PNG'],
          maxUploadSizeKb: 2048
        };
        this.users = Array.isArray(parsed.users) && parsed.users.length > 0
          ? parsed.users.map(u => { const c = { ...u }; delete c.password; return c; })
          : JSON.parse(JSON.stringify(DEFAULT_USERS));
        this.activityPointRules = JSON.parse(JSON.stringify(DEFAULT_ACTIVITY_POINT_RULES));
        return;
      }
    } catch (e) {
      console.warn('Gagal memuat state dari localStorage:', e);
    }

    this.isLoggedIn = false;
    this.authToken = null;
    this.currentUser = JSON.parse(JSON.stringify(DEFAULT_USER));
    this.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
    this.projects = [];
    this.organizations = [];
    this.events = [];
    this.eventRegistrations = [];
    this.projectRegistrations = [];
    this.partnerEvaluations = [];
    this.portfolioEntries = [];
    this.auditLogs = [];
    this.systemConfig = {
      appName: 'Campus Impact Hub',
      version: '2.2.0',
      allowedUploadFormats: ['PDF', 'JPG', 'JPEG', 'PNG'],
      maxUploadSizeKb: 2048
    };
    this.activityPointRules = JSON.parse(JSON.stringify(DEFAULT_ACTIVITY_POINT_RULES));
  }

  async syncFromDatabase() {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) return;
      const dbData = await res.json();

      this.isDbConnected = true;
      this.dbEngine = dbData.dbEngine || 'PostgreSQL 16 (Docker)';

      if (Array.isArray(dbData.users) && dbData.users.length > 0) this.users = dbData.users;
      if (Array.isArray(dbData.projects)) this.projects = dbData.projects;
      if (Array.isArray(dbData.organizations)) this.organizations = dbData.organizations;
      if (Array.isArray(dbData.events)) this.events = dbData.events;
      if (Array.isArray(dbData.eventRegistrations)) this.eventRegistrations = dbData.eventRegistrations;
      if (Array.isArray(dbData.projectRegistrations)) this.projectRegistrations = dbData.projectRegistrations;
      if (Array.isArray(dbData.partnerEvaluations)) this.partnerEvaluations = dbData.partnerEvaluations;
      if (Array.isArray(dbData.portfolioEntries)) this.portfolioEntries = dbData.portfolioEntries;
      if (Array.isArray(dbData.auditLogs)) this.auditLogs = dbData.auditLogs;
      if (dbData.systemConfig) this.systemConfig = dbData.systemConfig;

      if (this.authToken) {
        const meRes = await fetch('/api/auth/me', {
          method: 'GET',
          headers: this.getAuthHeaders(),
          cache: 'no-store'
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData && meData.user) {
            this.currentUser = meData.user;
            this.isLoggedIn = true;
          }
        } else if (meRes.status === 401 || meRes.status === 403) {
          this.authToken = null;
          this.isLoggedIn = false;
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } else if (this.currentUser && this.currentUser.id) {
        const matched = this.users.find(u => u.id === this.currentUser.id);
        if (matched) this.currentUser = { ...matched };
      }

      this.saveLocalOnly();
      this.notifyListeners();
    } catch (e) {
      this.isDbConnected = false;
      this.dbEngine = 'Local Browser Storage (Offline Mode)';
    }
  }

  saveLocalOnly() {
    try {
      const safeCurrent = this.currentUser ? { ...this.currentUser } : null;
      if (safeCurrent) delete safeCurrent.password;
      const safeUsers = (this.users || []).map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });
      const state = {
        isLoggedIn: this.isLoggedIn,
        currentUser: safeCurrent,
        projects: this.projects,
        organizations: this.organizations,
        events: this.events,
        eventRegistrations: this.eventRegistrations,
        projectRegistrations: this.projectRegistrations,
        partnerEvaluations: this.partnerEvaluations,
        portfolioEntries: this.portfolioEntries,
        auditLogs: this.auditLogs,
        systemConfig: this.systemConfig,
        users: safeUsers
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (this.authToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, this.authToken);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Gagal menyimpan state ke localStorage:', e);
    }
  }

  // --- Statistics & Relational Queries ---
  getTotalActiveStudents() {
    return (this.users || []).filter(u => (u.role || '').toLowerCase() === 'student' && (u.accountStatus || 'Active') === 'Active').length;
  }

  getStudentUsers() {
    return (this.users || []).filter(u => (u.role || '').toLowerCase() === 'student');
  }

  getTotalOrganizations() {
    return (this.organizations || []).length;
  }

  getVerifiedOrganizations() {
    return (this.organizations || []).filter(o => o.verificationStatus === 'VERIFIED');
  }

  getVerifiedOrganizationsCount() {
    return this.getVerifiedOrganizations().length;
  }

  getPendingOrganizationsCount() {
    return (this.organizations || []).filter(o => o.verificationStatus === 'PENDING').length;
  }

  getTotalEvents() {
    return (this.events || []).length;
  }

  getPublishedEvents() {
    return (this.events || []).filter(e => !e.publicationStatus || e.publicationStatus === 'PUBLISHED');
  }

  getTotalProjects() {
    return (this.projects || []).length;
  }

  getApprovedProjects() {
    return (this.projects || []).filter(p => ['OPEN', 'ON_GOING', 'COMPLETED'].includes(p.status));
  }

  getOpenProjectsCount() {
    return (this.projects || []).filter(p => p.status === 'OPEN').length;
  }

  getPendingProjectsCount() {
    return (this.projects || []).filter(p => ['SUBMITTED', 'UNDER_REVIEW'].includes(p.status)).length;
  }

  getOngoingProjectsCount() {
    return (this.projects || []).filter(p => p.status === 'ON_GOING').length;
  }

  getCompletedProjectsCount() {
    return (this.projects || []).filter(p => p.status === 'COMPLETED').length;
  }

  getTotalBeneficiaries() {
    return (this.projects || []).reduce((acc, p) => acc + (p.impactReport?.beneficiaries || 0), 0);
  }

  getCurrentUserPortfolioEntries() {
    if (!this.currentUser || !this.currentUser.id) return [];
    return (this.portfolioEntries || []).filter(e => e.userId === this.currentUser.id);
  }

  getStudentEventRegistration(eventId, studentId = this.currentUser?.id) {
    if (!eventId || !studentId) return null;
    return (this.eventRegistrations || []).find(r => r.eventId === eventId && r.studentId === studentId) || null;
  }

  getStudentProjectRegistration(projectId, studentId = this.currentUser?.id) {
    if (!projectId || !studentId) return null;
    return (this.projectRegistrations || []).find(r => r.projectId === projectId && r.studentId === studentId) || null;
  }

  getEventParticipants(eventId) {
    if (!eventId) return this.eventRegistrations || [];
    return (this.eventRegistrations || []).filter(r => r.eventId === eventId);
  }

  // --- Server-Side API Actions ---
  async login(identifier, password) {
    const cleanId = (identifier || '').trim();
    const cleanPass = (password || '').trim();
    if (!cleanId) return { success: false, message: 'Silakan masukkan Email Kampus atau NIM/NIP Anda.' };
    if (!cleanPass) return { success: false, message: 'Silakan masukkan kata sandi akun Anda.' };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password: cleanPass })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Email/NIM/NIP atau kata sandi tidak sesuai.'
        };
      }

      this.authToken = data.token;
      this.isLoggedIn = true;
      this.currentUser = data.user;
      this.saveLocalOnly();
      await this.syncFromDatabase();

      const roleLabel = UserRole[(this.currentUser.role || '').toUpperCase()]?.label || this.currentUser.role;
      return {
        success: true,
        message: `Selamat datang, ${this.currentUser.name} (${roleLabel})!`,
        user: this.currentUser
      };
    } catch (err) {
      return {
        success: false,
        message: 'Gagal menghubungi server autentikasi. Pastikan server berjalan.'
      };
    }
  }

  async register(payload) {
    const cleanName = (payload.name || '').trim();
    const cleanEmail = (payload.email || '').trim().toLowerCase();
    const cleanPass = (payload.password || '').trim();
    if (!cleanName) return { success: false, message: 'Nama lengkap / nama lembaga wajib diisi.' };
    if (!cleanEmail) return { success: false, message: 'Email wajib diisi.' };
    if (!cleanPass || cleanPass.length < 6) return { success: false, message: 'Kata sandi minimal harus 6 karakter.' };
    if (payload.passwordConfirm !== undefined && cleanPass !== String(payload.passwordConfirm).trim()) {
      return { success: false, message: 'Konfirmasi kata sandi tidak cocok.' };
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Gagal mendaftarkan akun baru.'
        };
      }

      this.authToken = data.token;
      this.isLoggedIn = true;
      this.currentUser = data.user;
      this.saveLocalOnly();
      await this.syncFromDatabase();

      return {
        success: true,
        message: `Registrasi berhasil! Selamat datang, ${this.currentUser.name}.`,
        user: this.currentUser
      };
    } catch (err) {
      return {
        success: false,
        message: 'Gagal menghubungi server saat registrasi.'
      };
    }
  }

  async logout() {
    try {
      if (this.authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: this.getAuthHeaders()
        });
      }
    } catch (_) {}
    this.authToken = null;
    this.isLoggedIn = false;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.saveLocalOnly();
    this.notifyListeners();
  }

  async updateProfile(payload) {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memperbarui profil.');
    await this.syncFromDatabase();
    return data;
  }

  async changePassword(currentPassword, newPassword) {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengubah kata sandi.');
    return data;
  }

  // --- Organizations ---
  async saveOrganization(payload) {
    this.assertRole(['organization', 'admin'], 'menyimpan pendaftaran/profil organisasi');
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menyimpan data organisasi.');
    await this.syncFromDatabase();
    return data;
  }

  async verifyOrganization(orgId, status = 'VERIFIED', rejectionReason = '') {
    this.assertRole(['admin'], 'memverifikasi legalitas SK organisasi');
    const res = await fetch('/api/organizations/verify', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ orgId, status, rejectionReason })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memproses verifikasi organisasi.');
    await this.syncFromDatabase();
    return data;
  }

  // --- Events & Manual Attendance Validation (No QR) ---
  async saveEvent(payload) {
    this.assertRole(['organization', 'admin'], 'menerbitkan atau memperbarui event kampus');
    const res = await fetch('/api/events', {
      method: payload.id ? 'PUT' : 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menyimpan event kampus.');
    await this.syncFromDatabase();
    return data;
  }

  async registerForEvent(eventId) {
    this.assertRole(['student'], 'mendaftar sebagai peserta event');
    const res = await fetch('/api/events/register', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ eventId, action: 'register' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mendaftar event.');
    await this.syncFromDatabase();
    return data;
  }

  async cancelEventRegistration(eventId) {
    this.assertRole(['student'], 'membatalkan pendaftaran event');
    const res = await fetch('/api/events/register', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ eventId, action: 'cancel' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal membatalkan pendaftaran event.');
    await this.syncFromDatabase();
    return data;
  }

  async validateEventAttendanceManual(eventId, { participantQuery, asCommittee = false, attendanceStatus = 'Attended' }) {
    this.assertRole(['organization', 'admin'], 'memvalidasi kehadiran peserta event secara manual');
    const cleanQuery = (participantQuery || '').trim();
    if (!cleanQuery) {
      throw new Error('Silakan masukkan Nama Lengkap atau NIM peserta yang hadir.');
    }

    const res = await fetch('/api/events/validate-attendance', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ eventId, participantQuery: cleanQuery, asCommittee, attendanceStatus })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal memvalidasi kehadiran peserta.');
    }

    await this.syncFromDatabase();
    return data;
  }

  // --- Social Projects & Partner Evaluations ---
  async submitProblem(payload) {
    this.assertRole(['partner', 'admin'], 'mengajukan masalah atau proyek sosial baru');
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengajukan masalah.');
    await this.syncFromDatabase();
    return data;
  }

  async updateProject(payload) {
    this.assertRole(['partner', 'admin'], 'memperbarui status atau data proyek');
    const res = await fetch('/api/projects', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memperbarui proyek.');
    await this.syncFromDatabase();
    return data;
  }

  async applyForProject(projectId, asTeamLeader = false) {
    this.assertRole(['student'], 'mendaftar pada proyek sosial');
    const res = await fetch('/api/projects/apply', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ projectId, asTeamLeader })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mendaftar pada proyek sosial.');
    await this.syncFromDatabase();
    return data.message;
  }

  async submitPartnerEvaluation({ projectId, studentId, ratings, comment }) {
    this.assertRole(['partner', 'admin'], 'memberikan penilaian kinerja mahasiswa');
    const res = await fetch('/api/evaluations', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ projectId, studentId, ratings, comment })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menyimpan penilaian mahasiswa.');
    await this.syncFromDatabase();
    return data;
  }

  // --- Admin Operations, Data Integrity & Safe Export ---
  async adminUpdateUser(payload) {
    this.assertRole(['admin'], 'mengelola akun pengguna');
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memperbarui data pengguna.');
    await this.syncFromDatabase();
    return data;
  }

  async adminUpdateSystemConfig(payload) {
    this.assertRole(['admin'], 'mengubah konfigurasi sistem');
    const res = await fetch('/api/admin/system-config', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menyimpan konfigurasi sistem.');
    await this.syncFromDatabase();
    return data;
  }

  async resetToEmptyState() {
    this.assertRole(['admin'], 'mereset database sistem');
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal mereset database di server.');
    }
    await this.syncFromDatabase();
  }

  async loadDemoData() {
    this.assertRole(['admin'], 'memuat data demo ke database');
    const res = await fetch('/api/demo', {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal memuat data demo di server.');
    }
    await this.syncFromDatabase();
  }

  getDataIntegrityReport() {
    const issues = [];
    const seenEmails = new Set();
    const seenNims = new Set();
    const userIds = new Set((this.users || []).map(u => u.id));
    const eventIds = new Set((this.events || []).map(e => e.id));
    const projectIds = new Set((this.projects || []).map(p => p.id));

    for (const u of (this.users || [])) {
      if (!u.email || !u.name || !u.role) {
        issues.push({ type: 'MISSING_FIELD', entity: `User ${u.id}`, detail: 'Field wajib (name/email/role) kosong.' });
      }
      const em = (u.email || '').toLowerCase();
      if (em && seenEmails.has(em)) {
        issues.push({ type: 'DUPLICATE_ACCOUNT', entity: `User ${u.id}`, detail: `Duplikasi email: ${u.email}` });
      }
      seenEmails.add(em);

      if (u.role === 'student' && u.identityNumber) {
        const nim = u.identityNumber.toLowerCase();
        if (seenNims.has(nim)) {
          issues.push({ type: 'DUPLICATE_NIM', entity: `User ${u.id}`, detail: `Duplikasi NIM: ${u.identityNumber}` });
        }
        seenNims.add(nim);
      }
    }

    for (const reg of (this.eventRegistrations || [])) {
      if (!eventIds.has(reg.eventId)) {
        issues.push({ type: 'ORPHANED_RECORD', entity: `EventReg ${reg.id}`, detail: `Merujuk ke eventId tidak ditemukan (${reg.eventId}).` });
      }
      if (!userIds.has(reg.studentId)) {
        issues.push({ type: 'ORPHANED_RECORD', entity: `EventReg ${reg.id}`, detail: `Merujuk ke studentId tidak ditemukan (${reg.studentId}).` });
      }
    }

    for (const ev of (this.partnerEvaluations || [])) {
      if (!projectIds.has(ev.projectId)) {
        issues.push({ type: 'INVALID_RELATIONSHIP', entity: `Evaluation ${ev.id}`, detail: `Merujuk ke projectId tidak ditemukan (${ev.projectId}).` });
      }
    }

    for (const pf of (this.portfolioEntries || [])) {
      if (!userIds.has(pf.userId)) {
        issues.push({ type: 'ORPHANED_RECORD', entity: `Portfolio ${pf.id}`, detail: `Merujuk ke userId tidak ditemukan (${pf.userId}).` });
      }
    }

    return {
      healthy: issues.length === 0,
      checkedAt: new Date().toISOString(),
      issueCount: issues.length,
      issues
    };
  }

  getSanitizedCollection(collectionName) {
    const map = {
      users: (this.users || []).map(u => {
        const copy = { ...u };
        delete copy.password;
        delete copy.passwordHash;
        return copy;
      }),
      students: this.getStudentUsers().map(u => {
        const copy = { ...u };
        delete copy.password;
        delete copy.passwordHash;
        return copy;
      }),
      organizations: (this.organizations || []).map(o => {
        const copy = { ...o };
        delete copy.skDocumentData;
        return copy;
      }),
      events: this.events || [],
      projects: this.projects || [],
      event_registrations: this.eventRegistrations || [],
      project_registrations: this.projectRegistrations || [],
      evaluations: this.partnerEvaluations || [],
      contributions: this.portfolioEntries || [],
      audit_logs: this.auditLogs || []
    };
    return map[collectionName] || [];
  }

  exportCollectionToJson(collectionName = 'users') {
    const rows = this.getSanitizedCollection(collectionName);
    return JSON.stringify(rows, null, 2);
  }

  exportCollectionToCsv(collectionName = 'users') {
    const rows = this.getSanitizedCollection(collectionName);
    if (!rows.length) return 'id,info\n"EMPTY","Tidak ada data pada tabel ini"';
    const headers = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object' || rows[0][k] === null);
    const csvLines = [headers.join(',')];
    for (const row of rows) {
      const vals = headers.map(h => {
        const raw = row[h] === undefined || row[h] === null ? '' : String(row[h]);
        return `"${raw.replace(/"/g, '""')}"`;
      });
      csvLines.push(vals.join(','));
    }
    return csvLines.join('\n');
  }

  // --- AI Recommendation Helper ---
  matchProblemWithAi(problemInput) {
    const cleanInput = (problemInput || 'Digitalisasi sistem pembukuan dan kasir UMKM').trim();
    const lower = cleanInput.toLowerCase();

    if (lower.includes('pemasaran') || lower.includes('marketing') || lower.includes('umkm') || lower.includes('kasir') || lower.includes('pembukuan')) {
      return {
        problemInput: cleanInput,
        category: 'Digital Marketing & Manajemen Usaha',
        recommendedMajors: ['Bisnis Digital', 'Teknik Informatika', 'DKV'],
        estimatedImpact: 'Tinggi (Estimasi +85 Impact Score)',
        suggestedImpactScore: 85,
        recommendedSolutionTitle: 'Transformasi Digital Pembukuan & Akselerasi Pemasaran UMKM'
      };
    }
    if (lower.includes('sampah') || lower.includes('lingkungan') || lower.includes('desa')) {
      return {
        problemInput: cleanInput,
        category: 'Teknologi Lingkungan & Smart Village',
        recommendedMajors: ['Teknik Informatika', 'Teknik Lingkungan', 'Perencanaan Wilayah'],
        estimatedImpact: 'Sangat Tinggi (Estimasi +90 Impact Score)',
        suggestedImpactScore: 90,
        recommendedSolutionTitle: 'Sistem Digitalisasi Bank Sampah & Administrasi Desa'
      };
    }
    return {
      problemInput: cleanInput,
      category: 'Inovasi Teknologi Tepat Guna',
      recommendedMajors: ['Teknik Informatika', 'Sistem Informasi', 'Bisnis Digital'],
      estimatedImpact: 'Tinggi (Estimasi +85 Impact Score)',
      suggestedImpactScore: 85,
      recommendedSolutionTitle: 'Implementasi Sistem Digital & Pemberdayaan Masyarakat'
    };
  }

  getDefaultDemoAccounts() {
    return JSON.parse(JSON.stringify(DEFAULT_USERS));
  }

  getDeveloperProfile() {
    return DEVELOPER_PROFILE;
  }

  getMvpDatabaseJsonSnapshot() {
    return JSON.stringify(
      {
        architecture: 'Web Frontend (SPA) -> Node.js REST API (Scrypt + RBAC + Ownership) -> PostgreSQL 16 / SQLite (Non-Destructive Upsert)',
        database_status: {
          connected: this.isDbConnected,
          engine: this.dbEngine
        },
        session: {
          isLoggedIn: this.isLoggedIn,
          user_id: this.currentUser?.id,
          role: this.currentUser?.role,
          name: this.currentUser?.name
        },
        table_counts: {
          users: (this.users || []).length,
          projects: (this.projects || []).length,
          organizations: (this.organizations || []).length,
          events: (this.events || []).length,
          event_registrations: (this.eventRegistrations || []).length,
          project_registrations: (this.projectRegistrations || []).length,
          partner_evaluations: (this.partnerEvaluations || []).length,
          portfolio_entries: (this.portfolioEntries || []).length,
          audit_logs: (this.auditLogs || []).length,
          total_beneficiaries: this.getTotalBeneficiaries()
        },
        integrity: this.getDataIntegrityReport(),
        tables: {
          users: this.getSanitizedCollection('users'),
          projects: this.projects,
          organizations: this.getSanitizedCollection('organizations'),
          events: this.events,
          event_registrations: this.eventRegistrations,
          project_registrations: this.projectRegistrations,
          partner_evaluations: this.partnerEvaluations,
          portfolio_entries: this.portfolioEntries
        }
      },
      null,
      2
    );
  }
}

export const CampusRepository = new CampusRepositoryClass();
