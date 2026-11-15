/**
 * Campus Impact Hub - Authentication & User Session Repository
 * Dedicated Authentication System with LocalStorage Persistence
 * Professional Enterprise Edition (Emoji-free, High-Reliability)
 */

import { UserRole } from './models.js';

const STORAGE_KEY = 'campus_impact_hub_auth_v4';

const DEFAULT_USERS = [
  {
    id: 'U-MHS-001',
    name: 'Budi Santoso',
    email: 'mahasiswa@kampus.ac.id',
    identityNumber: '13523001',
    password: 'password123',
    role: 'student',
    majorOrUnit: 'S1 Teknik Informatika',
    faculty: 'Fakultas Ilmu Komputer & Teknologi Informasi',
    status: 'Mahasiswa Aktif',
    lastLogin: null
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
    lastLogin: null
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
    lastLogin: null
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
    lastLogin: null
  }
];

class CampusRepositoryClass {
  constructor() {
    this.isLoggedIn = false;
    this.sessionToken = null;
    this.sessionTime = null;
    this.currentUser = null;
    this.users = [];
    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.isLoggedIn = parsed.isLoggedIn === true;
        this.currentUser = parsed.currentUser || null;
        this.sessionToken = parsed.sessionToken || null;
        this.sessionTime = parsed.sessionTime || null;
        this.users = Array.isArray(parsed.users) && parsed.users.length > 0
          ? parsed.users
          : JSON.parse(JSON.stringify(DEFAULT_USERS));
        return;
      }
    } catch (e) {
      console.warn('Gagal memuat state autentikasi dari localStorage:', e);
    }
    this.resetState();
  }

  resetState() {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.sessionToken = null;
    this.sessionTime = null;
    this.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
    this.saveState();
  }

  saveState() {
    try {
      const state = {
        isLoggedIn: this.isLoggedIn,
        currentUser: this.currentUser,
        sessionToken: this.sessionToken,
        sessionTime: this.sessionTime,
        users: this.users
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Gagal menyimpan state autentikasi ke localStorage:', e);
    }
  }

  // Attempt login
  login(identifier, password, requestedRole = null) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId) {
      return { success: false, message: 'Silakan masukkan Email Kampus atau NIM/NIP Anda.' };
    }
    if (!cleanPass) {
      return { success: false, message: 'Silakan masukkan kata sandi akun Anda.' };
    }

    // Look for existing user
    let user = this.users.find(u =>
      u.email.toLowerCase() === cleanId ||
      (u.identityNumber && u.identityNumber.toLowerCase().includes(cleanId))
    );

    // If user exists, check password
    if (user) {
      if (user.password && user.password !== cleanPass) {
        return { success: false, message: 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.' };
      }
      if (requestedRole && user.role !== requestedRole) {
        user.role = requestedRole;
      }
    } else {
      // Dynamic registration/login fallback for testing convenience
      const role = requestedRole || 'student';
      const roleMeta = UserRole[role.toUpperCase()] || UserRole.STUDENT;
      const inferredName = cleanId.includes('@')
        ? cleanId.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : `Civitas ${cleanId}`;

      user = {
        id: 'U-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        name: inferredName,
        email: cleanId.includes('@') ? cleanId : `${cleanId}@kampus.ac.id`,
        identityNumber: cleanId.includes('@') ? `ID-${Math.floor(100000 + Math.random() * 900000)}` : cleanId,
        password: cleanPass,
        role: role,
        majorOrUnit: roleMeta.label,
        faculty: 'Civitas Akademika Kampus Terpadu',
        status: 'Terautentikasi',
        lastLogin: new Date().toISOString()
      };
      this.users.push(user);
    }

    // Set active session
    this.isLoggedIn = true;
    this.sessionToken = 'CIH-SEC-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    this.sessionTime = new Date().toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });
    user.lastLogin = this.sessionTime;
    this.currentUser = user;
    this.saveState();

    return {
      success: true,
      message: `Selamat datang kembali, ${user.name}! Sesi login berhasil aktif.`,
      user: user
    };
  }

  // Register new user
  register({ name, email, identityNumber, role, password, majorOrUnit }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanId = (identityNumber || '').trim();
    const cleanName = (name || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanName) {
      return { success: false, message: 'Nama lengkap wajib diisi.' };
    }
    if (!cleanEmail) {
      return { success: false, message: 'Email kampus wajib diisi.' };
    }
    if (!cleanPass || cleanPass.length < 6) {
      return { success: false, message: 'Kata sandi minimal harus terdiri dari 6 karakter.' };
    }

    const existing = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'Email kampus ini sudah terdaftar. Silakan langsung masuk.' };
    }

    const assignedRole = role || 'student';
    const roleMeta = UserRole[assignedRole.toUpperCase()] || UserRole.STUDENT;

    const newUser = {
      id: 'U-REG-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      name: cleanName,
      email: cleanEmail,
      identityNumber: cleanId || `NIM-${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: cleanPass,
      role: assignedRole,
      majorOrUnit: majorOrUnit || roleMeta.label,
      faculty: 'Fakultas & Unit Akademik Terdaftar',
      status: 'Akun Baru Terverifikasi',
      lastLogin: null
    };

    this.users.push(newUser);
    this.saveState();

    return {
      success: true,
      message: 'Registrasi berhasil! Akun Anda telah terdaftar. Silakan masuk menggunakan kata sandi Anda.',
      user: newUser
    };
  }

  // Logout session
  logout() {
    this.isLoggedIn = false;
    this.sessionToken = null;
    this.sessionTime = null;
    this.saveState();
  }

  // Quick helper to get default demo credentials
  getDefaultDemoAccounts() {
    return DEFAULT_USERS;
  }
}

export const CampusRepository = new CampusRepositoryClass();
