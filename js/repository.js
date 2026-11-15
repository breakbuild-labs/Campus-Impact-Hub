/**
 * Campus Impact Hub - CampusRepository
 * Mirrored from lat.pam.campusimpacthub.data.CampusRepository.kt
 * With localStorage state persistence & user-driven data input
 */

import { UserRole, ProjectStatus, VerificationStatus, SelectionStage, ApplicantStatus, EventType } from './models.js';

const STORAGE_KEY = 'campus_impact_hub_state_v6_clean';

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
    'UI/UX & Desain Sistem Berstandar Aksesibilitas',
    'Manajemen Portofolio Dampak Sosial & MBKM',
    'Integrasi QR Code Deterministik & Presensi'
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
    password: 'password123',
    role: 'student',
    majorOrUnit: 'S1 Teknik Informatika — PBSB',
    faculty: 'Fakultas Ilmu Komputer & Teknologi Informasi',
    status: 'Mahasiswa Aktif',
    impactScore: 0,
    leadershipScore: 0,
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
    impactScore: 0,
    leadershipScore: 0,
    bio: 'Pengurus BEM yang mengkoordinasikan kegiatan, advokasi mahasiswa, dan kolaborasi organisasi se-universitas.',
    interests: ['Advokasi Mahasiswa', 'Manajemen Event', 'Kepemimpinan'],
    skills: ['Public Speaking', 'Event Organizing', 'Team Coordination']
  },
  {
    id: 'U-MTR-004',
    name: 'Yayasan Inovasi Berdaya',
    email: 'mitra@kampus.ac.id',
    identityNumber: 'MITRA-2026-08',
    password: 'password123',
    role: 'partner',
    majorOrUnit: 'Mitra Pemberdayaan Sosial & UMKM',
    faculty: 'Jaringan Kemitraan Kampus Berdampak',
    status: 'Mitra Lembaga Terverifikasi',
    impactScore: 0,
    leadershipScore: 0,
    bio: 'Lembaga kemitraan masyarakat yang menghubungkan kebutuhan nyata UMKM dan desa dengan solusi mahasiswa.',
    interests: ['Pemberdayaan UMKM', 'Ekonomi Kerakyatan', 'Desa Binaan'],
    skills: ['Business Coaching', 'Field Mentorship', 'Community Building']
  }
];

// Starting user state (fresh/clean, ready for user inputs)
const DEFAULT_USER = {
  id: 'U001',
  name: 'Budi Santoso',
  email: 'budi@campusimpact.ac.id',
  role: 'student',
  majorOrUnit: 'S1 Teknik Informatika',
  identityNumber: 'NIM 13523001',
  impactScore: 0,
  leadershipScore: 0,
  projectsCompleted: 0,
  umkmHelped: 0,
  beneficiariesReached: 0,
  contributionHours: 0,
  interests: ['Teknologi Tepat Guna', 'Pengembangan Komunitas'],
  skills: ['Software Engineering', 'UI/UX Design'],
  bio: 'Mahasiswa yang berfokus pada kolaborasi solusi teknologi untuk pemberdayaan masyarakat.'
};

const DEFAULT_ACTIVITY_POINT_RULES = [
  {
    activityName: 'Mengikuti Event Kampus',
    points: 10,
    scoreType: 'Impact Score (+10)',
    description: 'Hadir dan melakukan pemindaian Tiket QR pada seminar, workshop, webinar, atau volunteer.'
  },
  {
    activityName: 'Panitia Pelaksana Event',
    points: 20,
    scoreType: 'Impact (+20) & Leadership (+20)',
    description: 'Berkontribusi sebagai koordinator atau panitia pelaksana kegiatan resmi kampus.'
  },
  {
    activityName: 'Pengurus Organisasi Kampus',
    points: 30,
    scoreType: 'Impact (+30) & Leadership (+30)',
    description: 'Menjadi pengurus aktif UKM, Himpunan Mahasiswa, atau BEM yang terverifikasi SK.'
  },
  {
    activityName: 'Anggota Proyek Sosial',
    points: 50,
    scoreType: 'Impact Score (+50)',
    description: 'Terjun langsung menyelesaikan masalah nyata mitra UMKM, sekolah, atau desa binaan.'
  },
  {
    activityName: 'Ketua Tim Proyek Sosial',
    points: 75,
    scoreType: 'Impact (+75) & Leadership (+75)',
    description: 'Memimpin tim multidisiplin mahasiswa dalam implementasi solusi dampak sosial.'
  }
];

class CampusRepositoryClass {
  constructor() {
    this.isLoggedIn = false; // Always starts on Login screen first
    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.isLoggedIn = parsed.isLoggedIn === true;
        this.currentUser = parsed.currentUser || JSON.parse(JSON.stringify(DEFAULT_USER));
        this.projects = Array.isArray(parsed.projects) ? parsed.projects : [];
        this.organizations = Array.isArray(parsed.organizations) ? parsed.organizations : [];
        this.openRecruitments = Array.isArray(parsed.openRecruitments) ? parsed.openRecruitments : [];
        this.events = Array.isArray(parsed.events) ? parsed.events : [];
        this.portfolioEntries = Array.isArray(parsed.portfolioEntries) ? parsed.portfolioEntries : [];
        this.users = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : JSON.parse(JSON.stringify(DEFAULT_USERS));
        this.activityPointRules = JSON.parse(JSON.stringify(DEFAULT_ACTIVITY_POINT_RULES));
        return;
      }
    } catch (e) {
      console.warn('Gagal memuat state dari localStorage:', e);
    }

    this.resetToEmptyState();
  }

  saveState() {
    try {
      const state = {
        isLoggedIn: this.isLoggedIn,
        currentUser: this.currentUser,
        projects: this.projects,
        organizations: this.organizations,
        openRecruitments: this.openRecruitments,
        events: this.events,
        portfolioEntries: this.portfolioEntries,
        users: this.users
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Gagal menyimpan state ke localStorage:', e);
    }
  }

  // Resets to completely clean state: 0 projects, 0 organizations, 0 events, 0 scores
  resetToEmptyState() {
    this.isLoggedIn = false;
    this.currentUser = JSON.parse(JSON.stringify(DEFAULT_USER));
    this.projects = [];
    this.organizations = [];
    this.openRecruitments = [];
    this.events = [];
    this.portfolioEntries = [];
    this.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
    this.activityPointRules = JSON.parse(JSON.stringify(DEFAULT_ACTIVITY_POINT_RULES));
    this.saveState();
  }

  // Preloads optional demo data if user explicitly requests sample data preview
  loadDemoData() {
    this.projects = [
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
      }
    ];

    this.organizations = [
      {
        id: 'ORG001',
        name: 'HIMATIF',
        fullName: 'Himpunan Mahasiswa Teknik Informatika',
        category: 'Technology',
        logoInitials: 'HT',
        skNumber: 'SK/REKTOR/ORG-001/2026',
        advisorName: 'Dr. Hendra Wijaya, S.T., M.T.',
        contact: 'himatif@campusimpact.ac.id',
        description: 'Organisasi kemahasiswaan jurusan Teknik Informatika yang berfokus pada software engineering dan pengabdian teknologi.',
        memberCount: 120,
        verificationStatus: 'VERIFIED',
        isUserJoined: true,
        isUserOfficer: false
      }
    ];

    this.openRecruitments = [
      {
        id: 'REC001',
        organizationId: 'ORG001',
        organizationName: 'HIMATIF',
        title: 'Open Recruitment Staf & Riset Pengabdian 2027',
        positions: ['Pengabdian Masyarakat', 'Software Engineering', 'UI/UX Design'],
        deadline: '20 September 2027',
        status: 'open',
        currentStage: 'PENDAFTARAN',
        selectedPosition: null,
        applicantStatus: 'NONE',
        totalApplicants: 18
      }
    ];

    this.events = [
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
        qrTicketCode: `CIH-EV001-${this.currentUser.id}`
      }
    ];

    this.saveState();
  }

  // --- Real-Time Statistics (Dynamically calculated from user data) ---
  getTotalActiveStudents() {
    if (!this.isLoggedIn) return 0;
    // Total applicants across user projects + user itself
    const applicantSum = this.projects.reduce((acc, p) => acc + (p.applicantCount || 0), 0);
    return 1 + applicantSum;
  }

  getTotalOrganizations() {
    return this.organizations.length;
  }

  getVerifiedOrganizationsCount() {
    return this.organizations.filter(o => o.verificationStatus === 'VERIFIED').length;
  }

  getTotalEvents() {
    return this.events.length;
  }

  getTotalProjects() {
    return this.projects.length;
  }

  getTotalBeneficiaries() {
    return this.projects.reduce((acc, p) => acc + (p.impactReport?.beneficiaries || 0), 0);
  }

  // --- Role Switching ---
  switchRole(roleCode) {
    this.currentUser.role = roleCode;
    switch (roleCode) {
      case 'student':
        if (!this.currentUser.name || this.currentUser.name.includes('Admin') || this.currentUser.name.includes('Suryono')) {
          this.currentUser.name = 'Budi Santoso';
        }
        this.currentUser.majorOrUnit = 'S1 Teknik Informatika';
        this.currentUser.identityNumber = 'NIM 13523001';
        break;
      case 'partner':
        this.currentUser.name = 'H. Suryono (Mitra UMKM)';
        this.currentUser.majorOrUnit = 'Mitra Masyarakat • UMKM Binaan';
        this.currentUser.identityNumber = 'ID: MITRA-014';
        break;
      case 'organization':
        this.currentUser.name = 'Pengurus HIMATIF';
        this.currentUser.majorOrUnit = 'Organisasi Kemahasiswaan';
        this.currentUser.identityNumber = 'ID: ORG-001';
        break;
      case 'admin':
        this.currentUser.name = 'Dr. Prasetyo (Admin Kampus)';
        this.currentUser.majorOrUnit = 'Direktorat Kemahasiswaan & Pengabdian';
        this.currentUser.identityNumber = 'NIP 19820411201001';
        break;
    }
    this.saveState();
  }

  // --- Modul A: Social Impact Hub ---
  applyForProject(projectId, asTeamLeader = false) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return 'Proyek tidak ditemukan.';

    const pointsEarned = asTeamLeader ? 75 : 50;
    const roleTitle = asTeamLeader ? 'Ketua Tim Proyek (+75 Poin)' : 'Anggota Proyek Sosial (+50 Poin)';

    project.userApplicationState = 'PENDING';
    project.userRoleInProject = roleTitle;
    project.applicantCount = (project.applicantCount || 0) + 1;

    this.currentUser.impactScore += pointsEarned;
    if (asTeamLeader) {
      this.currentUser.leadershipScore += 75;
    }
    this.currentUser.projectsCompleted += 1;
    this.currentUser.contributionHours += 8;

    this.portfolioEntries.unshift({
      id: `PF00${this.portfolioEntries.length + 1}`,
      title: `${asTeamLeader ? 'Ketua Tim' : 'Anggota Pelaksana'}: ${project.title}`,
      organizationOrPartner: project.organizationName,
      category: 'Project Sosial',
      date: 'Baru Saja',
      impactPoints: pointsEarned,
      leadershipPoints: asTeamLeader ? 75 : 0,
      outcomeSummary: `Terdaftar pada inisiatif dampak masyarakat (${project.category}) untuk ${project.impactReport?.beneficiaries || 50} penerima manfaat.`,
      credentialCode: `APP-${project.id}-${this.currentUser.id}`
    });

    this.saveState();
    return `Berhasil mendaftar ke "${project.title}" sebagai ${roleTitle}! Status: Menunggu Validasi Mitra.`;
  }

  submitProblem({ orgName, title, description, category, location, photoLabel, requirementsInput, estimatedBeneficiaries }) {
    const newId = `P00${this.projects.length + 1}`;
    const reqList = requirementsInput
      ? requirementsInput.split(',').map(s => s.trim()).filter(Boolean)
      : ['2 Informatika', '1 Desain'];

    const benCount = Math.max(10, parseInt(estimatedBeneficiaries, 10) || 50);

    const newProject = {
      id: newId,
      organizationName: orgName || 'Mitra Masyarakat Mandiri',
      title: title || 'Inisiatif Pemberdayaan Sosial',
      description: description || 'Kendala operasional yang membutuhkan solusi kolaboratif mahasiswa.',
      category: category || 'Teknologi',
      location: location || 'Bandung',
      photoCaption: photoLabel || `Dokumentasi Lapangan: ${orgName}`,
      impactScore: 85,
      requirements: reqList.length ? reqList : ['2 Informatika', '1 Desain'],
      status: 'OPEN',
      verifiedByAdmin: this.currentUser.role === 'admin',
      applicantCount: 0,
      userApplicationState: 'NONE',
      userRoleInProject: 'Anggota Proyek Sosial (+50 Poin)',
      impactReport: {
        id: `I00${this.projects.length + 1}`,
        projectId: newId,
        beforeCondition: 'Kondisi awal belum terdigitalisasi',
        afterCondition: 'Target capaian: Implementasi solusi tepat guna dan pendampingan terstruktur',
        beneficiaries: benCount,
        sdgCategory: 'SDG 8 & 11: Pemberdayaan Komunitas Berkelanjutan',
        partnerFeedback: 'Inisiatif baru didaftarkan dan siap dikerjakan oleh tim mahasiswa.'
      }
    };

    this.projects.unshift(newProject);
    this.currentUser.umkmHelped += 1;
    this.currentUser.beneficiariesReached += benCount;
    this.saveState();
    return newProject;
  }

  cycleProjectStatus(projectId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return null;

    if (project.status === 'OPEN') {
      project.status = 'ON_GOING';
    } else if (project.status === 'ON_GOING') {
      project.status = 'COMPLETED';
    } else {
      project.status = 'OPEN';
    }

    if (project.userApplicationState === 'PENDING' && project.status !== 'OPEN') {
      project.userApplicationState = 'APPROVED';
    }

    this.saveState();
    return project.status;
  }

  // --- Modul B: Organization Hub ---
  registerNewOrganization({ name, fullName, category, skNumber, advisorName, contact, description }) {
    const initials = (name || 'UKM')
      .trim()
      .split(' ')
      .map(w => w[0]?.toUpperCase())
      .join('')
      .slice(0, 3) || 'UKM';

    const newOrg = {
      id: `ORG00${this.organizations.length + 1}`,
      name: name || 'UKM Baru',
      fullName: fullName || name || 'Unit Kegiatan Mahasiswa',
      category: category || 'Teknologi',
      logoInitials: initials,
      skNumber: skNumber || 'SK/KEMAHASISWAAN/001/2026',
      advisorName: advisorName || 'Dosen Pembina',
      contact: contact || 'organisasi@campusimpact.ac.id',
      description: description || 'Lembaga kemahasiswaan resmi.',
      memberCount: 1,
      verificationStatus: this.currentUser.role === 'admin' ? 'VERIFIED' : 'PENDING',
      isUserJoined: true,
      isUserOfficer: true
    };

    this.organizations.unshift(newOrg);
    this.saveState();
    return newOrg;
  }

  verifyOrganization(orgId, approve = true) {
    const org = this.organizations.find(o => o.id === orgId);
    if (org) {
      org.verificationStatus = approve ? 'VERIFIED' : 'REJECTED';
      this.saveState();
    }
  }

  joinOrganizationAsOfficer(orgId) {
    const org = this.organizations.find(o => o.id === orgId);
    if (!org) return;

    if (!org.isUserJoined) {
      org.isUserJoined = true;
      org.isUserOfficer = true;
      org.memberCount = (org.memberCount || 0) + 1;

      this.currentUser.impactScore += 30;
      this.currentUser.leadershipScore += 30;

      this.portfolioEntries.unshift({
        id: `PF00${this.portfolioEntries.length + 1}`,
        title: `Pengurus Aktif ${org.name}`,
        organizationOrPartner: org.fullName,
        category: 'Organisasi',
        date: 'Periode Aktif',
        impactPoints: 30,
        leadershipPoints: 30,
        outcomeSummary: `Terdaftar sebagai pengurus resmi organisasi kampus (${org.skNumber}).`,
        credentialCode: `ORG-MEM-${org.id}`
      });

      this.saveState();
    }
  }

  // --- Modul C: Open Recruitment ---
  createOpenRecruitment({ orgName, title, positionsCsv, deadline }) {
    const posList = positionsCsv
      ? positionsCsv.split(',').map(s => s.trim()).filter(Boolean)
      : ['Divisi Operasional', 'Divisi Hubungan Masyarakat'];

    const newRec = {
      id: `REC00${this.openRecruitments.length + 1}`,
      organizationId: 'ORG001',
      organizationName: orgName || 'Lembaga Kemahasiswaan',
      title: title || 'Perekrutan Staf Baru 2027',
      positions: posList.length ? posList : ['Divisi Inti'],
      deadline: deadline || '30 September 2027',
      status: 'open',
      currentStage: 'PENDAFTARAN',
      selectedPosition: null,
      applicantStatus: 'NONE',
      totalApplicants: 0
    };

    this.openRecruitments.unshift(newRec);
    this.saveState();
    return newRec;
  }

  applyToRecruitment(recId, chosenPosition) {
    const rec = this.openRecruitments.find(r => r.id === recId);
    if (!rec) return;

    rec.selectedPosition = chosenPosition;
    rec.applicantStatus = 'PENDING';
    rec.currentStage = 'ADMINISTRASI';
    rec.totalApplicants = (rec.totalApplicants || 0) + 1;
    this.saveState();
  }

  advanceRecruitmentSelection(recId, acceptAtEnd = true) {
    const rec = this.openRecruitments.find(r => r.id === recId);
    if (!rec) return;

    const stages = ['PENDAFTARAN', 'ADMINISTRASI', 'INTERVIEW', 'PENGUMUMAN'];
    const currentIdx = stages.indexOf(rec.currentStage);

    if (currentIdx === 0) {
      rec.currentStage = 'ADMINISTRASI';
      rec.applicantStatus = 'PENDING';
    } else if (currentIdx === 1) {
      rec.currentStage = 'INTERVIEW';
      rec.applicantStatus = 'PENDING';
    } else if (currentIdx === 2) {
      rec.currentStage = 'PENGUMUMAN';
      rec.applicantStatus = acceptAtEnd ? 'ACCEPTED' : 'REJECTED';
      if (acceptAtEnd) {
        this.currentUser.impactScore += 30;
        this.currentUser.leadershipScore += 30;
        this.portfolioEntries.unshift({
          id: `PF00${this.portfolioEntries.length + 1}`,
          title: `Staf Divisi ${rec.selectedPosition || 'Inti'} — ${rec.organizationName}`,
          organizationOrPartner: rec.organizationName,
          category: 'Organisasi',
          date: 'Lulus Seleksi Perekrutan',
          impactPoints: 30,
          leadershipPoints: 30,
          outcomeSummary: 'Lulus seluruh tahapan seleksi (Pendaftaran, Administrasi, Interview, Pengumuman).',
          credentialCode: `OPREC-${rec.id}-PASS`
        });
      }
    } else {
      rec.applicantStatus = rec.applicantStatus === 'ACCEPTED' ? 'REJECTED' : 'ACCEPTED';
    }

    this.saveState();
  }

  // --- Modul D: Event Hub & QR Ticket ---
  createNewEvent({ title, organizer, type, description, date, location, quota, posterCaption }) {
    const newId = `EV00${this.events.length + 1}`;
    const safeQuota = Math.max(10, parseInt(quota, 10) || 50);

    const event = {
      id: newId,
      title: title || 'Seminar Dampak Kampus',
      organizerName: organizer || 'Organisasi Kemahasiswaan',
      type: type || 'WORKSHOP',
      description: description || 'Kegiatan pengayaan talenta mahasiswa.',
      date: date || 'Segera',
      location: location || 'Kampus Utama',
      quota: safeQuota,
      registeredCount: 0,
      pointsReward: 10,
      committeePointsReward: 20,
      posterSummary: posterCaption || `Publikasi Resmi: ${title} oleh ${organizer}`,
      verifiedByAdmin: true,
      isRegistered: false,
      isAttended: false,
      qrTicketCode: `CIH-${newId}-${this.currentUser.id}`
    };

    this.events.unshift(event);
    this.saveState();
    return event;
  }

  registerForEvent(eventId) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return;

    if (!event.isRegistered) {
      event.isRegistered = true;
      event.registeredCount = Math.min(event.quota, (event.registeredCount || 0) + 1);
      event.qrTicketCode = `CIH-${event.id}-${this.currentUser.id}`;
      this.saveState();
    }
  }

  confirmEventAttendanceByQr(eventId, asCommittee = false) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return 0;

    if (!event.isRegistered) {
      this.registerForEvent(eventId);
    }
    if (event.isAttended) return 0;

    event.isAttended = true;
    const earnedPoints = asCommittee ? 20 : event.pointsReward;
    this.currentUser.impactScore += earnedPoints;
    if (asCommittee) {
      this.currentUser.leadershipScore += 20;
    }
    this.currentUser.contributionHours += 4;

    this.portfolioEntries.unshift({
      id: `PF00${this.portfolioEntries.length + 1}`,
      title: `${asCommittee ? 'Panitia Pelaksana' : 'Peserta Hadir Terverifikasi'}: ${event.title}`,
      organizationOrPartner: event.organizerName,
      category: 'Sertifikat',
      date: event.date,
      impactPoints: earnedPoints,
      leadershipPoints: asCommittee ? 20 : 0,
      outcomeSummary: `Kehadiran tervalidasi via Tiket QR (${event.qrTicketCode}).`,
      credentialCode: `QR-CERT-${event.id}`
    });

    this.saveState();
    return earnedPoints;
  }

  // --- Modul G: AI Recommendation Hub ---
  matchProblemWithAi(problemInput) {
    const cleanInput = (problemInput || 'Digitalisasi sistem pembukuan dan kasir UMKM').trim();
    const lower = cleanInput.toLowerCase();

    if (
      lower.includes('pemasaran') ||
      lower.includes('marketing') ||
      lower.includes('umkm') ||
      lower.includes('jualan') ||
      lower.includes('toko') ||
      lower.includes('kasir') ||
      lower.includes('pembukuan')
    ) {
      return {
        problemInput: cleanInput,
        category: 'Digital Marketing & Manajemen Usaha',
        recommendedMajors: ['Bisnis Digital', 'Teknik Informatika', 'DKV'],
        estimatedImpact: 'Tinggi (Estimasi +85 Impact Score)',
        suggestedImpactScore: 85,
        recommendedSolutionTitle: 'Transformasi Digital Pembukuan & Akselerasi Pemasaran UMKM'
      };
    }

    if (
      lower.includes('sampah') ||
      lower.includes('lingkungan') ||
      lower.includes('desa') ||
      lower.includes('air') ||
      lower.includes('tani')
    ) {
      return {
        problemInput: cleanInput,
        category: 'Teknologi Lingkungan & Smart Village',
        recommendedMajors: ['Teknik Informatika', 'Teknik Lingkungan', 'Perencanaan Wilayah'],
        estimatedImpact: 'Sangat Tinggi (Estimasi +90 Impact Score)',
        suggestedImpactScore: 90,
        recommendedSolutionTitle: 'Sistem Digitalisasi Bank Sampah & Administrasi Desa'
      };
    }

    if (
      lower.includes('sekolah') ||
      lower.includes('pendidikan') ||
      lower.includes('belajar') ||
      lower.includes('guru') ||
      lower.includes('siswa')
    ) {
      return {
        problemInput: cleanInput,
        category: 'Inovasi Pendidikan & Literasi Digital',
        recommendedMajors: ['Teknologi Pendidikan', 'Teknik Informatika', 'DKV'],
        estimatedImpact: 'Tinggi (Estimasi +80 Impact Score)',
        suggestedImpactScore: 80,
        recommendedSolutionTitle: 'Platform Modul Pembelajaran Interaktif Sekolah Mitra'
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

  getAiStudentRecommendations(major, interests = []) {
    const orgs = [];
    const evts = [];
    const projs = [];

    // Dynamically query user's actual items if available
    this.organizations.forEach(o => orgs.push(o.name));
    this.events.forEach(e => evts.push(e.title));
    this.projects.forEach(p => projs.push(p.title));

    if (orgs.length === 0) {
      orgs.push('Unit Kegiatan Mahasiswa Riset & Teknologi', 'Badan Eksekutif Mahasiswa');
    }
    if (evts.length === 0) {
      evts.push('Workshop Perancangan Proyek Sosial', 'Seminar Akselerasi Karir & MBKM');
    }
    if (projs.length === 0) {
      projs.push('Inisiatif Digitalisasi UMKM Mitra', 'Pengabdian Desa Binaan Lingkungan');
    }

    return {
      majorInput: major || 'Mahasiswa',
      interestsInput: interests,
      recommendedOrganizations: [...new Set(orgs)].slice(0, 3),
      recommendedEvents: [...new Set(evts)].slice(0, 3),
      recommendedProjects: [...new Set(projs)].slice(0, 3)
    };
  }

  // --- Live Supabase / PostgreSQL Snapshot ---
    // Authentication Methods
  login(identifier, password, requestedRole = null) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    if (!cleanId) return { success: false, message: 'Silakan masukkan Email Kampus atau NIM/NIP Anda.' };
    if (!cleanPass) return { success: false, message: 'Silakan masukkan kata sandi akun Anda.' };
    if (!Array.isArray(this.users) || this.users.length === 0) {
      this.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
    }
    let user = this.users.find(u => u.email.toLowerCase() === cleanId || (u.identityNumber && u.identityNumber.toLowerCase().includes(cleanId)));
    if (user) {
      if (user.password && user.password !== cleanPass) {
        return { success: false, message: 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.' };
      }
      if (requestedRole && user.role !== requestedRole) user.role = requestedRole;
    } else {
      const role = requestedRole || 'student';
      const roleMeta = UserRole[role.toUpperCase()] || UserRole.STUDENT;
      const inferredName = cleanId.includes('@')
        ? cleanId.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Civitas ' + cleanId;
      user = {
        id: 'U-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        name: inferredName,
        email: cleanId.includes('@') ? cleanId : cleanId + '@kampus.ac.id',
        identityNumber: cleanId.includes('@') ? 'ID-' + Math.floor(100000 + Math.random() * 900000) : cleanId,
        password: cleanPass,
        role: role,
        majorOrUnit: roleMeta.label,
        faculty: 'Civitas Akademika Kampus Terpadu',
        status: 'Terautentikasi',
        impactScore: 0,
        leadershipScore: 0,
        bio: 'Pengguna aktif ekosistem Campus Impact Hub.',
        interests: ['Teknologi Tepat Guna', 'Pengembangan Komunitas'],
        skills: ['Kolaborasi', 'Pemecahan Masalah']
      };
      this.users.push(user);
    }
    this.isLoggedIn = true;
    this.currentUser = user;
    this.saveState();
    return { success: true, message: 'Selamat datang, ' + user.name + '! Mengalihkan ke Dashboard...', user: user };
  }

  register({ name, email, identityNumber, role, password, bio, majorOrUnit }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanPass = (password || '').trim();
    if (!cleanName) return { success: false, message: 'Nama lengkap wajib diisi.' };
    if (!cleanEmail) return { success: false, message: 'Email kampus wajib diisi.' };
    if (!cleanPass || cleanPass.length < 6) return { success: false, message: 'Kata sandi minimal harus 6 karakter.' };
    if (!Array.isArray(this.users)) this.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
    const existing = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) return { success: false, message: 'Email kampus ini sudah terdaftar. Silakan langsung masuk.' };
    const assignedRole = role || 'student';
    const roleMeta = UserRole[assignedRole.toUpperCase()] || UserRole.STUDENT;
    const newUser = {
      id: 'U-REG-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      name: cleanName,
      email: cleanEmail,
      identityNumber: (identityNumber || '').trim() || 'NIM-' + Math.floor(10000000 + Math.random() * 90000000),
      password: cleanPass,
      role: assignedRole,
      majorOrUnit: (majorOrUnit || '').trim() || roleMeta.label,
      faculty: 'Fakultas & Unit Akademik Terdaftar',
      status: 'Akun Baru Terverifikasi',
      impactScore: 0,
      leadershipScore: 0,
      bio: (bio || '').trim() || 'Pengguna baru terdaftar di Campus Impact Hub.',
      interests: ['Teknologi Tepat Guna', 'Pengembangan Komunitas'],
      skills: ['Kolaborasi']
    };
    this.users.push(newUser);
    this.currentUser = newUser;
    this.isLoggedIn = true;
    this.saveState();
    return { success: true, message: 'Pendaftaran berhasil! Selamat datang, ' + newUser.name + '.', user: newUser };
  }

  logout() {
    this.isLoggedIn = false;
    this.saveState();
  }

  getDefaultDemoAccounts() {
    return DEFAULT_USERS;
  }

  getDeveloperProfile() {
    return DEVELOPER_PROFILE;
  }

  getMvpDatabaseJsonSnapshot() {
    const firstProject = this.projects[0] || {};
    const firstOrg = this.organizations[0] || {};
    const firstRec = this.openRecruitments[0] || {};
    const firstEvent = this.events[0] || {};

    return JSON.stringify(
      {
        architecture: 'Web Frontend (SPA) -> Supabase API -> Supabase Auth -> PostgreSQL -> Storage',
        session: {
          isLoggedIn: this.isLoggedIn,
          user_id: this.currentUser.id,
          role: this.currentUser.role,
          name: this.currentUser.name
        },
        metrics: {
          total_projects: this.projects.length,
          total_organizations: this.organizations.length,
          total_events: this.events.length,
          total_beneficiaries: this.getTotalBeneficiaries()
        },
        sample_records: {
          project: firstProject.id ? firstProject : null,
          organization: firstOrg.id ? firstOrg : null,
          recruitment: firstRec.id ? firstRec : null,
          event: firstEvent.id ? firstEvent : null
        }
      },
      null,
      2
    );
  }
}

export const CampusRepository = new CampusRepositoryClass();
