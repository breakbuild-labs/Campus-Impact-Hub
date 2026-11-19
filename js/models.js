/**
 * Campus Impact Hub - Domain Models & Enums
 * Complete Web Application Domain Model Specification
 */

export const UserRole = {
  STUDENT: {
    code: 'student',
    label: 'Mahasiswa',
    badgeTitle: 'Talenta & Kontributor Kampus',
    description: 'Melihat & mendaftar proyek sosial, melihat organisasi terverifikasi, mendaftar event kampus, dan memantau portofolio kontribusi.'
  },
  ORGANIZATION: {
    code: 'organization',
    label: 'BEM / UKM',
    badgeTitle: 'Pengurus Organisasi Kemahasiswaan',
    description: 'Mendaftarkan organisasi & unggah SK resmi, mengelola profil organisasi, membuat event kampus, dan memvalidasi kehadiran peserta secara manual (Nama/NIM).'
  },
  PARTNER: {
    code: 'partner',
    label: 'Mitra UMKM',
    badgeTitle: 'Mitra Masyarakat & Pelaku UMKM',
    description: 'Mengajukan permasalahan nyata UMKM, memantau progress proyek mahasiswa, dan memberikan penilaian kinerja mahasiswa.'
  },
  ADMIN: {
    code: 'admin',
    label: 'Admin / Dosen',
    badgeTitle: 'Direktorat Kemahasiswaan & Supervisi',
    description: 'Mengelola mahasiswa, memverifikasi SK organisasi, menyetujui proyek sosial & event kampus, serta mengelola database & audit log sistem.'
  }
};

export const AccountStatus = {
  ACTIVE: { code: 'Active', label: 'Active' },
  INACTIVE: { code: 'Inactive', label: 'Inactive' },
  SUSPENDED: { code: 'Suspended', label: 'Suspended' }
};

export const VerificationStatus = {
  DRAFT: { code: 'DRAFT', label: 'Draft' },
  PENDING: { code: 'PENDING', label: 'Pending Verification' },
  VERIFIED: { code: 'VERIFIED', label: 'Verified' },
  REJECTED: { code: 'REJECTED', label: 'Rejected' }
};

export const ProjectStatus = {
  SUBMITTED: { code: 'SUBMITTED', label: 'Submitted' },
  UNDER_REVIEW: { code: 'UNDER_REVIEW', label: 'Under Review' },
  OPEN: { code: 'OPEN', label: 'Open' },
  ON_GOING: { code: 'ON_GOING', label: 'On Going' },
  COMPLETED: { code: 'COMPLETED', label: 'Completed' },
  REJECTED: { code: 'REJECTED', label: 'Rejected' }
};

export const EventPublicationStatus = {
  DRAFT: { code: 'DRAFT', label: 'Draft' },
  PENDING: { code: 'PENDING', label: 'Menunggu Persetujuan' },
  PUBLISHED: { code: 'PUBLISHED', label: 'Published' },
  REJECTED: { code: 'REJECTED', label: 'Ditolak' }
};

export const RegistrationStatus = {
  REGISTERED: { code: 'Registered', label: 'Terdaftar' },
  CANCELLED: { code: 'Cancelled', label: 'Dibatalkan' }
};

export const AttendanceStatus = {
  REGISTERED: { code: 'Registered', label: 'Terdaftar (Belum Check-In)' },
  CANCELLED: { code: 'Cancelled', label: 'Dibatalkan' },
  ATTENDED: { code: 'Attended', label: 'Hadir Terverifikasi' },
  NO_SHOW: { code: 'No Show', label: 'Tidak Hadir (No Show)' }
};

export const EventType = {
  SEMINAR: { code: 'SEMINAR', label: 'Seminar' },
  WORKSHOP: { code: 'WORKSHOP', label: 'Workshop' },
  WEBINAR: { code: 'WEBINAR', label: 'Webinar' },
  BOOTCAMP: { code: 'BOOTCAMP', label: 'Bootcamp' },
  VOLUNTEER: { code: 'VOLUNTEER', label: 'Volunteer' },
  KOMPETISI: { code: 'KOMPETISI', label: 'Kompetisi' },
  PELATIHAN: { code: 'PELATIHAN', label: 'Pelatihan' }
};

export const EvaluationCriteria = [
  { key: 'workQuality', label: 'Kualitas Pekerjaan (Work Quality)' },
  { key: 'timeliness', label: 'Ketepatan Waktu (Timeliness)' },
  { key: 'communication', label: 'Komunikasi & Kolaborasi (Communication)' },
  { key: 'responsibility', label: 'Tanggung Jawab (Responsibility)' },
  { key: 'objectiveAchievement', label: 'Pencapaian Tujuan Proyek (Achievement of Objectives)' }
];
