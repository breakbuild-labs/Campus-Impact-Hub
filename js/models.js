/**
 * Campus Impact Hub - Models & Domain Entities
 * Mirrored from lat.pam.campusimpacthub.model.Models.kt
 */

export const UserRole = {
  STUDENT: {
    code: 'student',
    label: 'Mahasiswa',
    badgeTitle: 'Talenta & Kontributor Kampus',
    description: 'Melihat & mendaftar proyek sosial, bergabung organisasi, daftar event (QR Ticket), dan mengelola portofolio dampak.'
  },
  PARTNER: {
    code: 'partner',
    label: 'Mitra Masyarakat',
    badgeTitle: 'UMKM / Desa / Sekolah / Komunitas',
    description: 'Submit masalah nyata masyarakat, monitoring proyek mahasiswa, memberikan feedback, dan melihat laporan dampak.'
  },
  ORGANIZATION: {
    code: 'organization',
    label: 'Organisasi / UKM',
    badgeTitle: 'Pengurus BEM / Himpunan / UKM',
    description: 'Mendaftarkan organisasi, membuka Open Recruitment, membuat event kampus, monitoring peserta, dan scan absensi QR.'
  },
  ADMIN: {
    code: 'admin',
    label: 'Admin Kampus',
    badgeTitle: 'Direktorat Kemahasiswaan & Pengabdian',
    description: 'Verifikasi organisasi (SK), verifikasi proyek sosial & event, serta monitoring analitik dampak kampus & MBKM.'
  }
};

export const ProjectStatus = {
  OPEN: { code: 'OPEN', label: 'Open' },
  ON_GOING: { code: 'ON_GOING', label: 'On Going' },
  COMPLETED: { code: 'COMPLETED', label: 'Completed' }
};

export const VerificationStatus = {
  PENDING: { code: 'PENDING', label: 'Pending' },
  VERIFIED: { code: 'VERIFIED', label: 'Verified' },
  REJECTED: { code: 'REJECTED', label: 'Rejected' }
};

export const SelectionStage = {
  PENDAFTARAN: { stepNumber: 1, label: 'Pendaftaran' },
  ADMINISTRASI: { stepNumber: 2, label: 'Administrasi' },
  INTERVIEW: { stepNumber: 3, label: 'Interview' },
  PENGUMUMAN: { stepNumber: 4, label: 'Pengumuman' }
};

export const ApplicantStatus = {
  NONE: { code: 'NONE', label: 'Belum Mendaftar' },
  PENDING: { code: 'PENDING', label: 'Pending' },
  ACCEPTED: { code: 'ACCEPTED', label: 'Accepted' },
  REJECTED: { code: 'REJECTED', label: 'Rejected' }
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
