/**
 * Campus Impact Hub - CampusRepository
 * Mirrored from lat.pam.campusimpacthub.data.CampusRepository.kt
 * With localStorage state persistence
 */

import { UserRole, ProjectStatus, VerificationStatus, SelectionStage, ApplicantStatus, EventType } from './models.js';

const STORAGE_KEY = 'campus_impact_hub_state_v1';

const DEFAULT_USER = {
  id: 'U001',
  name: 'Budi Santoso',
  email: 'budi@mail.com',
  role: 'student',
  majorOrUnit: 'S1 Teknik Informatika • Semester 6',
  identityNumber: 'NIM 13523001',
  impactScore: 250,
  leadershipScore: 125,
  projectsCompleted: 8,
  umkmHelped: 5,
  beneficiariesReached: 1000,
  contributionHours: 64,
  interests: ['Programming', 'UI/UX', 'Startup'],
  skills: ['Kotlin Android', 'UI/UX Design', 'Supabase & PostgreSQL', 'Project Management'],
  bio: 'Mahasiswa Informatika yang berfokus pada pengembangan solusi teknologi tepat guna untuk digitalisasi UMKM dan desa mandiri.'
};

const DEFAULT_ACTIVITY_POINT_RULES = [
  {
    activityName: 'Mengikuti Event',
    points: 10,
    scoreType: 'Impact Score (+10)',
    description: 'Hadir dan melakukan QR Scan pada seminar, workshop, webinar, atau volunteer kampus.'
  },
  {
    activityName: 'Panitia Event',
    points: 20,
    scoreType: 'Impact (+20) & Leadership (+20)',
    description: 'Berkontribusi sebagai panitia pelaksana kegiatan atau ketua pelaksana event kampus.'
  },
  {
    activityName: 'Pengurus Organisasi',
    points: 30,
    scoreType: 'Impact (+30) & Leadership (+30)',
    description: 'Menjadi pengurus aktif UKM, Himpunan Mahasiswa, atau BEM yang terverifikasi.'
  },
  {
    activityName: 'Proyek Sosial',
    points: 50,
    scoreType: 'Impact Score (+50)',
    description: 'Terjun langsung menyelesaikan masalah mitra masyarakat, UMKM, sekolah, atau desa.'
  },
  {
    activityName: 'Ketua Tim Proyek',
    points: 75,
    scoreType: 'Impact (+75) & Leadership (+75)',
    description: 'Memimpin tim lintas jurusan dalam implementasi solusi proyek dampak sosial.'
  }
];

const DEFAULT_PROJECTS = [
  {
    id: 'P001',
    organizationName: 'UMKM Maju Jaya',
    title: 'Digitalisasi UMKM',
    description: 'Pencatatan transaksi harian masih manual menggunakan buku tulis dan belum memiliki katalog digital. Membutuhkan sistem kasir (POS) mobile sederhana serta desain identitas visual.',
    category: 'Teknologi',
    location: 'Kec. Coblong, Bandung',
    photoCaption: 'Foto: Warung & Produksi UMKM Maju Jaya (Dokumentasi Lapangan)',
    impactScore: 85,
    requirements: ['2 Informatika', '1 Desain'],
    status: 'OPEN',
    verifiedByAdmin: true,
    applicantCount: 14,
    userApplicationState: 'PENDING',
    userRoleInProject: 'Ketua Tim Proyek (+75 Poin)',
    impactReport: {
      id: 'I001',
      projectId: 'P001',
      beforeCondition: 'Manual (Pembukuan kertas & rekap bulanan rawan selisih)',
      afterCondition: 'Digital (Aplikasi Kasir Android & Katalog Online Terintegrasi)',
      beneficiaries: 120,
      sdgCategory: 'SDG 8: Pekerjaan Layak & Pertumbuhan Ekonomi',
      partnerFeedback: 'Sangat membantu mempercepat pembukuan harian dan meningkatkan omzet pesanan online UMKM kami.'
    }
  },
  {
    id: 'P002',
    organizationName: 'Desa Sukamaju Mandiri',
    title: 'Digitalisasi Bank Sampah',
    description: 'Desa memiliki masalah lingkungan dan administrasi penimbangan sampah warga. Dibutuhkan aplikasi pencatatan tabungan sampah warga berbasis QR dan dashboard rekapitulasi daur ulang.',
    category: 'Lingkungan',
    location: 'Desa Sukamaju, Kab. Bandung',
    photoCaption: 'Foto: Posko Bank Sampah RW 04 Desa Sukamaju',
    impactScore: 90,
    requirements: ['2 Informatika', '1 Teknik Lingkungan'],
    status: 'OPEN',
    verifiedByAdmin: true,
    applicantCount: 19,
    userApplicationState: 'NONE',
    userRoleInProject: 'Anggota Proyek Sosial (+50 Poin)',
    impactReport: {
      id: 'I002',
      projectId: 'P002',
      beforeCondition: 'Manual (Kartu kertas sering hilang & rekap tonase lambat)',
      afterCondition: 'Digital (Buku Tabungan Sampah Digital & Grafik Reduksi Sampah)',
      beneficiaries: 320,
      sdgCategory: 'SDG 11 & 13: Kota Berkelanjutan & Penanganan Perubahan Iklim',
      partnerFeedback: 'Warga kini lebih semangat memilah sampah karena saldo tabungan bisa dicek langsung dari ponsel.'
    }
  },
  {
    id: 'P003',
    organizationName: 'SDN 03 Harapan Bangsa',
    title: 'Solusi Media Edukasi & Literasi Sekolah',
    description: 'Sekolah membutuhkan solusi pendidikan berupa modul pembelajaran sains dan literasi numerasi interaktif agar siswa lebih mudah memahami konsep dasar secara visual.',
    category: 'Pendidikan',
    location: 'Kec. Cibiru, Bandung',
    photoCaption: 'Foto: Ruang Kelas & Perpustakaan SDN 03 Harapan Bangsa',
    impactScore: 75,
    requirements: ['1 Informatika', '1 DKV', '1 Pendidikan'],
    status: 'ON_GOING',
    verifiedByAdmin: true,
    applicantCount: 11,
    userApplicationState: 'APPROVED',
    userRoleInProject: 'Anggota Proyek Sosial (+50 Poin)',
    impactReport: {
      id: 'I003',
      projectId: 'P003',
      beforeCondition: 'Manual (Alat peraga terbatas & metode satu arah)',
      afterCondition: 'Digital (Media Kuis Interaktif & Modul Ilustrasi Digital)',
      beneficiaries: 210,
      sdgCategory: 'SDG 4: Pendidikan Berkualitas',
      partnerFeedback: 'Antusiasme belajar siswa meningkat drastis sejak menggunakan media interaktif buatan mahasiswa.'
    }
  },
  {
    id: 'P004',
    organizationName: 'Komunitas Tenun & Kriya Desa',
    title: 'Akselerasi Pemasaran Online & Branding UMKM',
    description: 'UMKM dan komunitas pengrajin kesulitan pemasaran online di marketplace nasional. Membutuhkan pendampingan fotografi produk, copywriting, dan manajemen toko digital.',
    category: 'Digital Marketing',
    location: 'Kab. Sumedang',
    photoCaption: 'Foto: Sentra Kerajinan Komunitas Tenun & Kriya',
    impactScore: 80,
    requirements: ['2 Bisnis Digital', '1 Informatika', '1 DKV'],
    status: 'COMPLETED',
    verifiedByAdmin: true,
    applicantCount: 22,
    userApplicationState: 'APPROVED',
    userRoleInProject: 'Ketua Tim Proyek (+75 Poin)',
    impactReport: {
      id: 'I004',
      projectId: 'P004',
      beforeCondition: 'Manual (Penjualan hanya mengandalkan tengkulak lokal)',
      afterCondition: 'Digital (Toko Resmi di 3 Marketplace & Katalog Media Sosial)',
      beneficiaries: 350,
      sdgCategory: 'SDG 8 & 9: Inovasi Industri & UMKM Berdaya',
      partnerFeedback: 'Penjualan pengrajin naik 140% dalam 2 bulan pasca pendampingan mahasiswa.'
    }
  }
];

const DEFAULT_ORGANIZATIONS = [
  {
    id: 'ORG001',
    name: 'HIMATIF',
    fullName: 'Himpunan Mahasiswa Teknik Informatika',
    category: 'Technology',
    logoInitials: 'HT',
    skNumber: 'SK/REKTOR/ORG-001/2026',
    advisorName: 'Dr. Hendra Wijaya, S.T., M.T.',
    contact: 'himatif@campusimpact.ac.id • @himatif.official',
    description: 'Organisasi kemahasiswaan jurusan Teknik Informatika yang berfokus pada pengembangan talenta software engineering, riset AI, dan pengabdian masyarakat berbasis teknologi.',
    memberCount: 245,
    verificationStatus: 'VERIFIED',
    isUserJoined: true,
    isUserOfficer: true
  },
  {
    id: 'ORG002',
    name: 'BEM Fakultas Teknik',
    fullName: 'Badan Eksekutif Mahasiswa Fakultas Teknik',
    category: 'Leadership & Social Impact',
    logoInitials: 'BEM',
    skNumber: 'SK/DEKAN-FT/ORG-002/2026',
    advisorName: 'Ir. Siti Rahmawati, M.Eng.',
    contact: 'bem.ft@campusimpact.ac.id • @bemft.kampus',
    description: 'Lembaga eksekutif mahasiswa tingkat fakultas yang menggerakkan advokasi mahasiswa, pengembangan SDM, dan aksi sosial desa binaan.',
    memberCount: 180,
    verificationStatus: 'VERIFIED',
    isUserJoined: false,
    isUserOfficer: false
  },
  {
    id: 'ORG003',
    name: 'GDSC',
    fullName: 'Google Developer Student Clubs Campus',
    category: 'Technology',
    logoInitials: 'GD',
    skNumber: 'SK/KEMAHASISWAAN/ORG-003/2026',
    advisorName: 'Rizky Pratama, S.Kom., M.Cs.',
    contact: 'gdsc@campusimpact.ac.id • @gdsc.campus',
    description: 'Komunitas pengembang teknologi mahasiswa yang menjembatani teori kampus dan praktik industri melalui Solution Challenge, Android, Cloud, dan Machine Learning.',
    memberCount: 310,
    verificationStatus: 'VERIFIED',
    isUserJoined: true,
    isUserOfficer: false
  },
  {
    id: 'ORG004',
    name: 'Startup Club',
    fullName: 'Campus Startup & Technopreneurship Club',
    category: 'Entrepreneurship',
    logoInitials: 'SC',
    skNumber: 'SK/KEMAHASISWAAN/ORG-004/2026',
    advisorName: 'Dr. Nadia Kusuma, M.B.A.',
    contact: 'startupclub@campusimpact.ac.id • @startupclub.id',
    description: 'Inkubator mahasiswa lintas disiplin untuk membangun wirausaha sosial (social enterprise), pendampingan bisnis digital UMKM, dan persiapan kompetisi bisnis.',
    memberCount: 156,
    verificationStatus: 'VERIFIED',
    isUserJoined: false,
    isUserOfficer: false
  },
  {
    id: 'ORG005',
    name: 'Relawan Desa Mengabdi',
    fullName: 'UKM Relawan Sosial & Lingkungan Kampus',
    category: 'Social & Environment',
    logoInitials: 'RD',
    skNumber: 'SK/PENDING/ORG-005/2026',
    advisorName: 'Dr. Bambang Sutrisno, M.Si.',
    contact: 'relawandesa@campusimpact.ac.id • 0812-3456-7890',
    description: 'Komunitas relawan lintas fakultas untuk program desa binaan, konservasi lingkungan, bank sampah, dan pengajaran sekolah pelosok.',
    memberCount: 92,
    verificationStatus: 'PENDING',
    isUserJoined: false,
    isUserOfficer: false
  }
];

const DEFAULT_RECRUITMENTS = [
  {
    id: 'REC001',
    organizationId: 'ORG002',
    organizationName: 'BEM Fakultas Teknik',
    title: 'Open Recruitment 2027',
    positions: ['PSDM', 'Advokesma', 'Medkom'],
    deadline: '20 Agustus 2027',
    status: 'open',
    currentStage: 'INTERVIEW', // PENDAFTARAN -> ADMINISTRASI -> INTERVIEW -> PENGUMUMAN
    selectedPosition: 'Medkom',
    applicantStatus: 'PENDING',
    totalApplicants: 86
  },
  {
    id: 'REC002',
    organizationId: 'ORG001',
    organizationName: 'HIMATIF',
    title: 'Open Recruitment Staff & Riset 2027',
    positions: ['Software Engineering', 'UI/UX Design', 'Pengabdian Masyarakat'],
    deadline: '10 September 2027',
    status: 'open',
    currentStage: 'PENGUMUMAN',
    selectedPosition: 'Pengabdian Masyarakat',
    applicantStatus: 'ACCEPTED',
    totalApplicants: 114
  },
  {
    id: 'REC003',
    organizationId: 'ORG003',
    organizationName: 'GDSC',
    title: 'Core Team & Mentor Open Recruitment',
    positions: ['Android Dev Lead', 'AI/ML Curriculum', 'Community & Event'],
    deadline: '25 September 2027',
    status: 'open',
    currentStage: 'PENDAFTARAN',
    selectedPosition: null,
    applicantStatus: 'NONE',
    totalApplicants: 142
  }
];

const DEFAULT_EVENTS = [
  {
    id: 'EV001',
    title: 'UI UX Workshop',
    organizerName: 'HIMATIF',
    type: 'WORKSHOP',
    description: 'Workshop intensif merancang antarmuka aplikasi berdampak sosial dengan pendekatan Human-Centered Design, Figma Prototyping, dan Google Material Design.',
    date: '14 November 2026 • 09:00 - 15:00 WIB',
    location: 'Auditorium Kampus Lt. 3',
    quota: 200,
    registeredCount: 178,
    pointsReward: 10,
    committeePointsReward: 20,
    posterSummary: 'POSTER: UI/UX Design for Social Impact • Free E-Certificate & +10 Impact Points',
    verifiedByAdmin: true,
    isRegistered: true,
    isAttended: false,
    qrTicketCode: 'CIH-EV001-U001'
  },
  {
    id: 'EV002',
    title: 'Hackathon: Solusi Digital UMKM & Desa',
    organizerName: 'GDSC & BEM Fakultas Teknik',
    type: 'KOMPETISI',
    description: 'Kompetisi inovasi 24 jam membangun prototipe aplikasi nyata untuk menyelesaikan masalah mitra UMKM, koperasi desa, dan sekolah mitra kampus.',
    date: '22 November 2026 • 08:00 WIB',
    location: 'Innovation Hub & Co-Working Space',
    quota: 150,
    registeredCount: 132,
    pointsReward: 10,
    committeePointsReward: 20,
    posterSummary: 'POSTER: Campus Impact Hackathon 2026 • Total Hadiah Pendanaan Proyek Rp 25 Juta',
    verifiedByAdmin: true,
    isRegistered: true,
    isAttended: true,
    qrTicketCode: 'CIH-EV002-U001'
  },
  {
    id: 'EV003',
    title: 'Google Developer Event: Android Kotlin & AI',
    organizerName: 'GDSC',
    type: 'SEMINAR',
    description: 'Seminar nasional pengembangan aplikasi Android modern berbasis Kotlin, Supabase Backend, dan integrasi AI Recommendation untuk ekosistem kampus.',
    date: '29 November 2026 • 13:00 WIB',
    location: 'Aula Utama Kampus',
    quota: 300,
    registeredCount: 264,
    pointsReward: 10,
    committeePointsReward: 20,
    posterSummary: 'POSTER: Google Developer Tech Talk • Speaker: Google Developer Experts',
    verifiedByAdmin: true,
    isRegistered: false,
    isAttended: false,
    qrTicketCode: 'CIH-EV003-U001'
  },
  {
    id: 'EV004',
    title: 'Bootcamp Pendampingan Digital Marketing UMKM',
    organizerName: 'Startup Club',
    type: 'BOOTCAMP',
    description: 'Bootcamp 3 hari membekali mahasiswa dengan keterampilan manajemen katalog online, iklan digital, dan pembukuan keuangan UMKM.',
    date: '6 Desember 2026 • 09:00 WIB',
    location: 'Lab Bisnis Digital & Hybrid',
    quota: 100,
    registeredCount: 85,
    pointsReward: 10,
    committeePointsReward: 20,
    posterSummary: 'POSTER: Social Enterprise Bootcamp • Terintegrasi Proyek Pengabdian Masyarakat',
    verifiedByAdmin: true,
    isRegistered: false,
    isAttended: false,
    qrTicketCode: 'CIH-EV004-U001'
  },
  {
    id: 'EV005',
    title: 'Aksi Volunteer Mengajar & Bank Sampah Desa',
    organizerName: 'Relawan Desa Mengabdi',
    type: 'VOLUNTEER',
    description: 'Kegiatan relawan akhir pekan bersama masyarakat Desa Sukamaju: sosialisasi pemilahan sampah rumah tangga dan kelas inspirasi anak SD.',
    date: '13 Desember 2026 • 07:30 WIB',
    location: 'Desa Sukamaju, Kab. Bandung',
    quota: 80,
    registeredCount: 69,
    pointsReward: 10,
    committeePointsReward: 20,
    posterSummary: 'POSTER: One Day Social Volunteer • Transportasi & Sertifikat Pengabdian Disediakan',
    verifiedByAdmin: true,
    isRegistered: false,
    isAttended: false,
    qrTicketCode: 'CIH-EV005-U001'
  },
  {
    id: 'EV006',
    title: 'Webinar Kepemimpinan & Pengukuran Dampak SDG',
    organizerName: 'BEM Fakultas Teknik',
    type: 'WEBINAR',
    description: 'Membedah cara menyusun Impact Report terukur untuk portofolio kerja, beasiswa, dan konversi SKS pengabdian masyarakat (MBKM).',
    date: '18 Desember 2026 • 19:00 WIB',
    location: 'Live Streaming Campus Hub',
    quota: 400,
    registeredCount: 310,
    pointsReward: 10,
    committeePointsReward: 20,
    posterSummary: 'POSTER: Leadership & SDG Impact Measurement Webinar',
    verifiedByAdmin: true,
    isRegistered: false,
    isAttended: false,
    qrTicketCode: 'CIH-EV006-U001'
  },
  {
    id: 'EV007',
    title: 'Pelatihan Manajemen Proyek Sosial & Riset Desa',
    organizerName: 'HIMATIF',
    type: 'PELATIHAN',
    description: 'Pelatihan metodologi pemetaan masalah masyarakat, analisis pemangku kepentingan, dan penyusunan dokumen implementasi solusi teknologi.',
    date: '21 Desember 2026 • 09:00 WIB',
    location: 'Ruang Seminar Gedung B',
    quota: 90,
    registeredCount: 74,
    pointsReward: 10,
    committeePointsReward: 20,
    posterSummary: 'POSTER: Pelatihan Ketua Tim Proyek Sosial (+75 Leadership Readiness)',
    verifiedByAdmin: true,
    isRegistered: false,
    isAttended: false,
    qrTicketCode: 'CIH-EV007-U001'
  }
];

const DEFAULT_PORTFOLIO = [
  {
    id: 'PF001',
    title: 'Ketua Tim Proyek: Akselerasi E-Commerce Komunitas Tenun',
    organizationOrPartner: 'Komunitas Tenun & Kriya Desa',
    category: 'Project Sosial',
    date: 'Oktober 2026',
    impactPoints: 75,
    leadershipPoints: 75,
    outcomeSummary: 'Berhasil mendigitalisasi 15 pengrajin lokal dengan peningkatan omzet 140% dan 350 penerima manfaat.',
    credentialCode: 'CERT-PRJ-2026-004'
  },
  {
    id: 'PF002',
    title: 'Anggota Tim Teknis: Media Edukasi Interaktif SDN 03',
    organizationOrPartner: 'SDN 03 Harapan Bangsa',
    category: 'Project Sosial',
    date: 'September 2026',
    impactPoints: 50,
    leadershipPoints: 0,
    outcomeSummary: 'Mengembangkan aplikasi kuis literasi & numerasi tablet untuk 210 siswa sekolah dasar.',
    credentialCode: 'CERT-PRJ-2026-003'
  },
  {
    id: 'PF003',
    title: 'Kepala Divisi Pengabdian Masyarakat HIMATIF',
    organizationOrPartner: 'HIMATIF (Verified Organization)',
    category: 'Organisasi',
    date: 'Periode 2026/2027',
    impactPoints: 30,
    leadershipPoints: 30,
    outcomeSummary: 'Menginisiasi 4 program desa binaan teknologi dan kolaborasi lintas UKM kampus.',
    credentialCode: 'SK-ORG-HIMATIF-2026'
  },
  {
    id: 'PF004',
    title: 'Ketua Panitia Campus Tech for Good Symposium',
    organizationOrPartner: 'GDSC & HIMATIF',
    category: 'Event',
    date: 'Agustus 2026',
    impactPoints: 20,
    leadershipPoints: 20,
    outcomeSummary: 'Memimpin 45 panitia dan menghadirkan 320 peserta mahasiswa serta 12 mitra UMKM.',
    credentialCode: 'CERT-PAN-2026-019'
  },
  {
    id: 'PF005',
    title: 'Juara 1 Best Social Impact App — Campus Hackathon',
    organizationOrPartner: 'BEM Fakultas Teknik & Direktorat Inovasi',
    category: 'Prestasi',
    date: 'Juli 2026',
    impactPoints: 50,
    leadershipPoints: 0,
    outcomeSummary: 'Merancang sistem integrasi bank sampah desa berbasis QR dan analitik dampak real-time.',
    credentialCode: 'AWARD-HACK-2026-01'
  },
  {
    id: 'PF006',
    title: 'Sertifikat Kompetensi: Full-Stack Android & Cloud Impact',
    organizationOrPartner: 'Google Developer Student Clubs (GDSC)',
    category: 'Sertifikat',
    date: 'Juni 2026',
    impactPoints: 25,
    leadershipPoints: 0,
    outcomeSummary: 'Lulus ujian proyek akhir pembuatan aplikasi layanan publik dengan skor 96/100.',
    credentialCode: 'GDSC-CERT-88412'
  }
];

class CampusRepositoryClass {
  constructor() {
    this.isLoggedIn = true;
    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.currentUser = parsed.currentUser || JSON.parse(JSON.stringify(DEFAULT_USER));
        this.projects = parsed.projects || JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
        this.organizations = parsed.organizations || JSON.parse(JSON.stringify(DEFAULT_ORGANIZATIONS));
        this.openRecruitments = parsed.openRecruitments || JSON.parse(JSON.stringify(DEFAULT_RECRUITMENTS));
        this.events = parsed.events || JSON.parse(JSON.stringify(DEFAULT_EVENTS));
        this.portfolioEntries = parsed.portfolioEntries || JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO));
        this.activityPointRules = JSON.parse(JSON.stringify(DEFAULT_ACTIVITY_POINT_RULES));
        return;
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }

    this.resetToDefault();
  }

  saveState() {
    try {
      const state = {
        currentUser: this.currentUser,
        projects: this.projects,
        organizations: this.organizations,
        openRecruitments: this.openRecruitments,
        events: this.events,
        portfolioEntries: this.portfolioEntries
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }

  resetToDefault() {
    this.currentUser = JSON.parse(JSON.stringify(DEFAULT_USER));
    this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
    this.organizations = JSON.parse(JSON.stringify(DEFAULT_ORGANIZATIONS));
    this.openRecruitments = JSON.parse(JSON.stringify(DEFAULT_RECRUITMENTS));
    this.events = JSON.parse(JSON.stringify(DEFAULT_EVENTS));
    this.portfolioEntries = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO));
    this.activityPointRules = JSON.parse(JSON.stringify(DEFAULT_ACTIVITY_POINT_RULES));
    this.saveState();
  }

  // --- Statistics ---
  getTotalActiveStudents() {
    const applicantSum = this.projects.reduce((acc, p) => acc + (p.applicantCount || 0), 0);
    return 4850 + applicantSum;
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
    const benSum = this.projects.reduce((acc, p) => acc + (p.impactReport?.beneficiaries || 0), 0);
    return benSum + 200;
  }

  // --- Role Switching ---
  switchRole(roleCode) {
    this.currentUser.role = roleCode;
    switch (roleCode) {
      case 'student':
        this.currentUser.name = 'Budi Santoso';
        this.currentUser.email = 'budi@mail.com';
        this.currentUser.majorOrUnit = 'S1 Teknik Informatika • Semester 6';
        this.currentUser.identityNumber = 'ID: U001 • NIM 13523001';
        break;
      case 'partner':
        this.currentUser.name = 'H. Suryono (UMKM Maju Jaya)';
        this.currentUser.email = 'mitra@majujaya.id';
        this.currentUser.majorOrUnit = 'Mitra Masyarakat • UMKM & Desa Binaan';
        this.currentUser.identityNumber = 'ID: MITRA-014 • Terverifikasi Kampus';
        break;
      case 'organization':
        this.currentUser.name = 'Admin Pengurus HIMATIF';
        this.currentUser.email = 'himatif@campusimpact.ac.id';
        this.currentUser.majorOrUnit = 'Organisasi / UKM • Technology';
        this.currentUser.identityNumber = 'ID: ORG001 • SK/REKTOR/ORG-001/2026';
        break;
      case 'admin':
        this.currentUser.name = 'Dr. Prasetyo (Admin Kampus)';
        this.currentUser.email = 'admin.dampak@campusimpact.ac.id';
        this.currentUser.majorOrUnit = 'Direktorat Kemahasiswaan & Pengabdian';
        this.currentUser.identityNumber = 'ID: ADM-001 • NIP 19820411201001';
        break;
    }
    this.saveState();
  }

  // --- Modul A: Social Impact Hub ---
  applyForProject(projectId, asTeamLeader = false) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return 'Proyek tidak ditemukan.';

    const pointsEarned = asTeamLeader ? 75 : 50;
    const roleTitle = asTeamLeader ? 'Ketua Tim Proyek (+75 Poin)' : 'Proyek Sosial (+50 Poin)';

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
      title: `${asTeamLeader ? 'Ketua Tim' : 'Kontributor'}: ${project.title}`,
      organizationOrPartner: project.organizationName,
      category: 'Project Sosial',
      date: 'Baru Saja',
      impactPoints: pointsEarned,
      leadershipPoints: asTeamLeader ? 75 : 0,
      outcomeSummary: `Terdaftar pada proyek solusi masyarakat (${project.category}) untuk ${project.impactReport?.beneficiaries || 100} penerima manfaat.`,
      credentialCode: `APP-${project.id}-${this.currentUser.id}`
    });

    this.saveState();
    return `Berhasil mendaftar ke "${project.title}" sebagai ${roleTitle}! Status: Menunggu Persetujuan Mitra.`;
  }

  submitProblem({ orgName, title, description, category, location, photoLabel, requirementsInput, estimatedBeneficiaries }) {
    const newId = `P00${this.projects.length + 1}`;
    const reqList = requirementsInput
      ? requirementsInput.split(',').map(s => s.trim()).filter(Boolean)
      : ['2 Informatika', '1 Desain'];

    const benCount = Math.max(50, parseInt(estimatedBeneficiaries, 10) || 120);

    const newProject = {
      id: newId,
      organizationName: orgName || 'UMKM Maju Jaya',
      title: title || 'Digitalisasi Komunitas',
      description: description || 'Kendala operasional dan pencatatan manual.',
      category: category || 'Teknologi',
      location: location || 'Bandung',
      photoCaption: photoLabel || `Foto Dokumentasi Lapangan: ${orgName}`,
      impactScore: 85,
      requirements: reqList.length ? reqList : ['2 Informatika', '1 Desain'],
      status: 'OPEN',
      verifiedByAdmin: this.currentUser.role === 'admin',
      applicantCount: 1,
      userApplicationState: 'NONE',
      userRoleInProject: 'Anggota Proyek Sosial (+50 Poin)',
      impactReport: {
        id: `I00${this.projects.length + 1}`,
        projectId: newId,
        beforeCondition: 'Manual / Belum Terdigitalisasi',
        afterCondition: 'Target: Implementasi Solusi Digital & Pendampingan Mahasiswa',
        beneficiaries: benCount,
        sdgCategory: 'SDG 8 & 11: Pemberdayaan Komunitas Berkelanjutan',
        partnerFeedback: 'Masalah baru diajukan oleh mitra masyarakat dan siap dikerjakan tim mahasiswa.'
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
    const initials = name
      .trim()
      .split(' ')
      .map(w => w[0]?.toUpperCase())
      .join('')
      .slice(0, 3) || 'UKM';

    const newOrg = {
      id: `ORG00${this.organizations.length + 1}`,
      name: name || 'UKM Baru',
      fullName: fullName || name || 'Unit Kegiatan Mahasiswa',
      category: category || 'Technology',
      logoInitials: initials,
      skNumber: skNumber || 'SK/PENDING/2026',
      advisorName: advisorName || 'Dosen Pembina',
      contact: contact || 'org@campusimpact.ac.id',
      description: description || 'Organisasi kemahasiswaan kampus.',
      memberCount: 25,
      verificationStatus: 'PENDING',
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
        outcomeSummary: `Bergabung sebagai pengurus organisasi kampus terverifikasi (${org.skNumber}).`,
        credentialCode: `ORG-MEM-${org.id}`
      });

      this.saveState();
    }
  }

  // --- Modul C: Open Recruitment ---
  createOpenRecruitment({ orgName, title, positionsCsv, deadline }) {
    const posList = positionsCsv
      ? positionsCsv.split(',').map(s => s.trim()).filter(Boolean)
      : ['PSDM', 'Advokesma', 'Medkom'];

    const newRec = {
      id: `REC00${this.openRecruitments.length + 1}`,
      organizationId: 'ORG001',
      organizationName: orgName || 'HIMATIF',
      title: title || 'Open Recruitment 2027',
      positions: posList.length ? posList : ['Divisi Inti'],
      deadline: deadline || '20 Agustus 2027',
      status: 'open',
      currentStage: 'PENDAFTARAN',
      selectedPosition: null,
      applicantStatus: 'NONE',
      totalApplicants: 1
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
          date: 'Lulus Seleksi Oprec',
          impactPoints: 30,
          leadershipPoints: 30,
          outcomeSummary: 'Lulus seluruh tahapan seleksi (Pendaftaran → Administrasi → Interview → Pengumuman).',
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
    const safeQuota = Math.max(20, parseInt(quota, 10) || 100);

    const event = {
      id: newId,
      title: title || 'Seminar Campus Impact',
      organizerName: organizer || 'HIMATIF',
      type: type || 'WORKSHOP',
      description: description || 'Kegiatan pengayaan talenta mahasiswa.',
      date: date || 'Segera',
      location: location || 'Kampus Utama',
      quota: safeQuota,
      registeredCount: 1,
      pointsReward: 10,
      committeePointsReward: 20,
      posterSummary: posterCaption || `POSTER RESMI: ${title} oleh ${organizer}`,
      verifiedByAdmin: true,
      isRegistered: true,
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
      title: `${asCommittee ? 'Panitia Event' : 'Peserta Terverifikasi QR'}: ${event.title}`,
      organizationOrPartner: event.organizerName,
      category: 'Sertifikat',
      date: event.date,
      impactPoints: earnedPoints,
      leadershipPoints: asCommittee ? 20 : 0,
      outcomeSummary: `Kehadiran Hari-H tervalidasi via QR Scan (${event.qrTicketCode}).`,
      credentialCode: `QR-CERT-${event.id}`
    });

    this.saveState();
    return earnedPoints;
  }

  // --- Modul G: AI Recommendation Hub ---
  matchProblemWithAi(problemInput) {
    const cleanInput = (problemInput || 'UMKM kesulitan pemasaran online').trim();
    const lower = cleanInput.toLowerCase();

    if (
      lower.includes('pemasaran') ||
      lower.includes('marketing') ||
      lower.includes('umkm') ||
      lower.includes('jualan') ||
      lower.includes('toko')
    ) {
      return {
        problemInput: cleanInput,
        category: 'Digital Marketing',
        recommendedMajors: ['Bisnis Digital', 'Informatika', 'DKV'],
        estimatedImpact: 'Tinggi (Estimasi +85 Impact Score • 120+ Penerima Manfaat)',
        suggestedImpactScore: 85,
        recommendedSolutionTitle: 'Akselerasi Pemasaran Digital & E-Commerce UMKM'
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
        recommendedMajors: ['Informatika', 'Teknik Lingkungan', 'Perencanaan Wilayah & Kota'],
        estimatedImpact: 'Sangat Tinggi (Estimasi +90 Impact Score • 300+ Warga Desa)',
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
        category: 'EdTech & Inovasi Pendidikan',
        recommendedMajors: ['Teknologi Pendidikan', 'Informatika', 'DKV'],
        estimatedImpact: 'Tinggi (Estimasi +80 Impact Score • 200+ Siswa Terbantu)',
        suggestedImpactScore: 80,
        recommendedSolutionTitle: 'Platform Modul Pembelajaran Interaktif Sekolah Mitra'
      };
    }

    return {
      problemInput: cleanInput,
      category: 'Teknologi & Inovasi Sosial',
      recommendedMajors: ['Informatika', 'Sistem Informasi', 'Bisnis Digital', 'DKV'],
      estimatedImpact: 'Tinggi (Estimasi +85 Impact Score • 150+ Penerima Manfaat)',
      suggestedImpactScore: 85,
      recommendedSolutionTitle: 'Transformasi Digital & Otomatisasi Layanan Masyarakat'
    };
  }

  getAiStudentRecommendations(major, interests) {
    const orgs = [];
    const evts = [];
    const projs = [];

    const joined = (interests.join(' ') + ' ' + (major || '')).toLowerCase();

    if (joined.includes('programming') || joined.includes('informatika') || joined.includes('ui/ux')) {
      orgs.push('GDSC', 'HIMATIF');
      evts.push('Hackathon', 'UI/UX Workshop', 'Google Developer Event');
      projs.push('Digitalisasi UMKM (85 Impact Score)', 'Digitalisasi Bank Sampah (90 Impact Score)');
    }
    if (joined.includes('startup') || joined.includes('bisnis')) {
      if (!orgs.includes('Startup Club')) orgs.push('Startup Club');
      evts.push('Bootcamp Pendampingan Digital Marketing UMKM');
      projs.push('Akselerasi Pemasaran Online & Branding UMKM');
    }
    if (joined.includes('sosial') || joined.includes('leadership') || joined.includes('volunteer')) {
      orgs.push('BEM Fakultas Teknik', 'Relawan Desa Mengabdi');
      evts.push('Aksi Volunteer Mengajar & Bank Sampah Desa', 'Webinar Kepemimpinan & Pengukuran Dampak SDG');
      projs.push('Solusi Media Edukasi & Literasi Sekolah');
    }

    if (orgs.length === 0) {
      orgs.push('GDSC', 'HIMATIF', 'Startup Club');
    }
    if (evts.length === 0) {
      evts.push('Hackathon', 'UI/UX Workshop', 'Google Developer Event');
    }

    return {
      majorInput: major,
      interestsInput: interests,
      recommendedOrganizations: [...new Set(orgs)],
      recommendedEvents: [...new Set(evts)],
      recommendedProjects: [...new Set(projs)]
    };
  }

  // --- Live Supabase / PostgreSQL Snapshot ---
  getMvpDatabaseJsonSnapshot() {
    const firstProject = this.projects[0] || {};
    const firstOrg = this.organizations[0] || {};
    const firstRec = this.openRecruitments[0] || {};
    const firstEvent = this.events[0] || {};

    return JSON.stringify(
      {
        architecture: 'Web Frontend (SPA) -> Supabase API -> Supabase Auth -> PostgreSQL -> Storage',
        Users: {
          id: this.currentUser.id,
          name: this.currentUser.name,
          email: this.currentUser.email,
          role: this.currentUser.role,
          impact_score: this.currentUser.impactScore,
          leadership_score: this.currentUser.leadershipScore
        },
        Projects: {
          id: firstProject.id,
          title: firstProject.title,
          organization: firstProject.organizationName,
          category: firstProject.category,
          impact_score: firstProject.impactScore,
          status: firstProject.status ? firstProject.status.toLowerCase() : 'open'
        },
        Applications: {
          id: 'A001',
          project_id: firstProject.id,
          student_id: this.currentUser.id,
          status: firstProject.userApplicationState ? firstProject.userApplicationState.toLowerCase() : 'none'
        },
        Organizations: {
          id: firstOrg.id,
          name: firstOrg.name,
          category: firstOrg.category,
          verified: firstOrg.verificationStatus === 'VERIFIED'
        },
        Recruitment: {
          id: firstRec.id,
          organization: firstRec.organizationName,
          positions: firstRec.positions || [],
          deadline: firstRec.deadline,
          status: firstRec.status
        },
        Events: {
          id: firstEvent.id,
          title: firstEvent.title,
          type: firstEvent.type,
          quota: firstEvent.quota,
          qr_ticket: firstEvent.qrTicketCode
        },
        Impact_Reports: {
          id: firstProject.impactReport?.id,
          project_id: firstProject.id,
          before: firstProject.impactReport?.beforeCondition,
          after: firstProject.impactReport?.afterCondition,
          beneficiaries: firstProject.impactReport?.beneficiaries
        }
      },
      null,
      2
    );
  }
}

export const CampusRepository = new CampusRepositoryClass();
