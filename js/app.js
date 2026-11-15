/**
 * Campus Impact Hub - Main Application Orchestrator
 * Professional Enterprise Edition with Authentication Gate & User-Driven Data Input
 */

import { UserRole, ProjectStatus, VerificationStatus, SelectionStage, ApplicantStatus, EventType } from './models.js';
import { CampusRepository } from './repository.js';
import { QrCodeGenerator } from './qr.js';
import { Icons } from './icons.js';

class CampusImpactHubApp {
  constructor() {
    // Land on login screen first unless already authenticated in persistent storage
    this.currentTab = CampusRepository.isLoggedIn ? 'home' : 'auth';
    this.showPassword = false;
    this.isRegisterMode = false;
    this.selectedProjectCategoryFilter = 'Semua';
    this.selectedOrgSubTab = 0; // 0 = Directory, 1 = Open Recruitment
    this.selectedEventTypeFilter = 'Semua';
    this.selectedPortfolioFilter = 'Semua';
    this.currentAiProblemQuery = 'Digitalisasi sistem pembukuan dan kasir UMKM';

    this.initDOMElements();
    this.bindGlobalEvents();
    this.render();
  }

  initDOMElements() {
    this.contentEl = document.getElementById('contentContainer');
    this.roleSwitcherBtn = document.getElementById('btnRoleSwitcher');
    this.roleSwitcherLabel = document.getElementById('btnRoleSwitcherLabel');
    this.headerImpactPill = document.getElementById('headerImpactPill');
    this.headerLeadershipPill = document.getElementById('headerLeadershipPill');
    this.brandLogoEl = document.getElementById('brandLogo');
    this.sidebarUserCard = document.getElementById('sidebarUserCard');
    this.toastContainer = document.getElementById('toastContainer');
    this.modalBackdrop = document.getElementById('modalBackdrop');
    this.modalContainer = document.getElementById('modalContainer');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalBody = document.getElementById('modalBody');
    this.modalFooter = document.getElementById('modalFooter');
    this.btnCloseModal = document.getElementById('btnCloseModal');
    this.btnHeaderLogout = document.getElementById('btnHeaderLogout');
  }

  bindGlobalEvents() {
    // Navigation items with login gate
    document.querySelectorAll('[data-tab]').forEach(el => {
      el.addEventListener('click', () => {
        const targetTab = el.getAttribute('data-tab');

        // If not logged in, enforce landing on the login/auth screen
        if (!CampusRepository.isLoggedIn && targetTab !== 'auth') {
          this.showToast('Silakan masuk (login) terlebih dahulu untuk mengakses menu ini', 'info');
          this.switchTab('auth');
          return;
        }

        this.switchTab(targetTab);
      });
    });

    if (this.brandLogoEl) {
      this.brandLogoEl.addEventListener('click', () => {
        if (CampusRepository.isLoggedIn) {
          this.switchTab('home');
        } else {
          this.switchTab('auth');
        }
      });
    }

    if (this.roleSwitcherBtn) {
      this.roleSwitcherBtn.addEventListener('click', () => {
        if (!CampusRepository.isLoggedIn) {
          this.switchTab('auth');
        } else {
          this.showRoleSwitcherModal();
        }
      });
    }

    if (this.headerImpactPill) {
      this.headerImpactPill.addEventListener('click', () => {
        if (CampusRepository.isLoggedIn) this.switchTab('impact');
      });
    }
    if (this.headerLeadershipPill) {
      this.headerLeadershipPill.addEventListener('click', () => {
        if (CampusRepository.isLoggedIn) this.switchTab('impact');
      });
    }

    if (this.btnHeaderLogout) {
      this.btnHeaderLogout.addEventListener('click', () => {
        CampusRepository.logout();
        this.showToast('Anda telah keluar dari akun. Silakan masuk kembali.', 'info');
        this.switchTab('auth');
      });
    }

    if (this.sidebarUserCard) {
      this.sidebarUserCard.addEventListener('click', () => {
        if (CampusRepository.isLoggedIn) {
          this.switchTab('profile');
        } else {
          this.switchTab('auth');
        }
      });
    }

    if (this.btnCloseModal) {
      this.btnCloseModal.addEventListener('click', () => this.closeModal());
    }
    if (this.modalBackdrop) {
      this.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === this.modalBackdrop) this.closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = Icons.checkCircle(16, 'icon-svg');
    if (type === 'info') iconSvg = Icons.sparkles(16, 'icon-svg');
    if (type === 'warning') iconSvg = Icons.clock(16, 'icon-svg');
    if (type === 'danger') iconSvg = Icons.shield(16, 'icon-svg');

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  openModal(title, bodyHtml, footerHtml = '') {
    this.modalTitle.innerHTML = title;
    this.modalBody.innerHTML = bodyHtml;
    this.modalFooter.innerHTML = footerHtml;
    this.modalFooter.style.display = footerHtml ? 'flex' : 'none';
    this.modalBackdrop.classList.add('open');
  }

  closeModal() {
    this.modalBackdrop.classList.remove('open');
  }

  updateHeaderAndSidebar() {
    const isAuthMode = !CampusRepository.isLoggedIn || this.currentTab === 'auth';
    document.body.classList.toggle('logged-out', isAuthMode);

    const user = CampusRepository.currentUser;
    const isLoggedIn = CampusRepository.isLoggedIn;
    const roleMeta = UserRole[user.role.toUpperCase()] || UserRole.STUDENT;

    // Header pills & role button
    if (this.roleSwitcherLabel) {
      this.roleSwitcherLabel.textContent = isLoggedIn ? roleMeta.label : 'Masuk';
    }
    if (this.headerImpactPill) {
      this.headerImpactPill.innerHTML = `<span class="indicator-dot"></span><span>Impact: <strong>${isLoggedIn ? user.impactScore : 0}</strong></span>`;
    }
    if (this.headerLeadershipPill) {
      this.headerLeadershipPill.innerHTML = `<span class="indicator-dot"></span><span>Leadership: <strong>${isLoggedIn ? user.leadershipScore : 0}</strong></span>`;
    }

    // Sidebar user summary
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    const navAuthLabel = document.getElementById('navAuthLabel');

    if (sidebarAvatar) {
      if (isLoggedIn && user.name) {
        const parts = user.name.trim().split(' ');
        const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]) : parts[0].slice(0, 2);
        sidebarAvatar.textContent = initials.toUpperCase();
      } else {
        sidebarAvatar.textContent = 'CI';
      }
    }
    if (sidebarUserName) {
      sidebarUserName.textContent = isLoggedIn ? (user.name || 'Pengguna Terdaftar') : 'Tamu (Belum Masuk)';
    }
    if (sidebarUserRole) {
      sidebarUserRole.textContent = isLoggedIn ? roleMeta.label : 'Silakan Masuk';
    }
    if (navAuthLabel) {
      navAuthLabel.textContent = isLoggedIn ? 'Keluar / Ganti Akun' : 'Masuk ke Platform';
    }

    // Active state highlighting in sidebar & bottom nav
    document.querySelectorAll('[data-tab]').forEach(el => {
      const tab = el.getAttribute('data-tab');
      if (tab === this.currentTab) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  render() {
    this.updateHeaderAndSidebar();
    this.contentEl.innerHTML = '';

    switch (this.currentTab) {
      case 'auth':
        this.renderAuthScreen();
        break;
      case 'home':
        this.renderHomeDashboard();
        break;
      case 'projects':
        this.renderProjectsMarketplace();
        break;
      case 'organizations':
        this.renderOrganizationsHub();
        break;
      case 'events':
        this.renderEventsHub();
        break;
      case 'impact':
        this.renderImpactAndPortfolioHub();
        break;
      case 'profile':
        this.renderProfileScreen();
        break;
      default:
        this.renderHomeDashboard();
    }
  }

  // =========================================================================
  // SCREEN 1: LOGIN & 'TENTANG KAMI' (DEDICATED LANDING SCREEN)
  // =========================================================================
  renderAuthScreen() {
    const user = CampusRepository.currentUser;
    const devProfile = CampusRepository.getDeveloperProfile ? CampusRepository.getDeveloperProfile() : {
      name: 'Budi Santoso',
      program: 'S1 Teknik Informatika',
      affiliation: 'Program Beasiswa Santri Berprestasi (PBSB) & Universitas',
      nim: '13523001',
      about: 'Mahasiswa santri berprestasi yang berfokus pada kolaborasi rekayasa perangkat lunak dan solusi teknologi tepat guna untuk pemberdayaan masyarakat, UMKM, dan digitalisasi organisasi kampus.'
    };

    const isRegister = this.isRegisterMode === true;

    const html = `
      <div class="auth-stage-container">

        <!-- Two-Column Grid: Left (Login/Register Form), Right ('Tentang Kami' Card) -->
        <div class="auth-grid-two-col">

          <!-- Column 1: Login / Register Form Panel -->
          <div class="auth-panel-card">

            <!-- Brand Badge -->
            <div class="auth-brand-badge-box">
              <div class="auth-brand-icon">
                ${Icons.graduationCap(28)}
              </div>
              <div class="auth-brand-text">
                <h2>CAMPUS IMPACT HUB</h2>
                <p>Portal Masuk Sistem Akademik &amp; Kolaborasi Kampus</p>
              </div>
            </div>

            <!-- Tab Switcher -->
            <div class="auth-tab-pills">
              <button type="button" class="auth-tab-pill ${!isRegister ? 'active' : ''}" id="btnSwitchToLogin">
                Masuk ke Akun
              </button>
              <button type="button" class="auth-tab-pill ${isRegister ? 'active' : ''}" id="btnSwitchToRegister">
                Daftar Akun Baru
              </button>
            </div>

            <!-- Form -->
            <form id="dedicatedAuthForm" class="auth-form" autocomplete="on">

              ${isRegister ? `
                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label">Nama Lengkap <span style="color: var(--danger);">*</span></label>
                  <div class="auth-input-wrapper">
                    <span class="input-icon">${Icons.user(16)}</span>
                    <input type="text" id="regNameInput" class="form-control" placeholder="Nama lengkap sesuai data akademik" required>
                  </div>
                </div>
                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label">Nomor Induk (NIM / NIP) <span style="color: var(--danger);">*</span></label>
                  <div class="auth-input-wrapper">
                    <span class="input-icon">${Icons.shield(16)}</span>
                    <input type="text" id="regIdInput" class="form-control" placeholder="misal: 13523001" required>
                  </div>
                </div>
              ` : ''}

              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">Email Kampus / Identitas <span style="color: var(--danger);">*</span></label>
                <div class="auth-input-wrapper">
                  <span class="input-icon">${Icons.mail(16)}</span>
                  <input
                    type="text"
                    id="authIdentifierInput"
                    class="form-control"
                    placeholder="misal: mahasiswa@kampus.ac.id atau NIM"
                    value="${!isRegister ? (user.email || 'mahasiswa@kampus.ac.id') : ''}"
                    required
                  >
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">Kata Sandi <span style="color: var(--danger);">*</span></label>
                <div class="auth-input-wrapper">
                  <span class="input-icon">${Icons.key(16)}</span>
                  <input
                    type="${this.showPassword ? 'text' : 'password'}"
                    id="authPasswordInput"
                    class="form-control"
                    placeholder="Masukkan kata sandi akun Anda"
                    value="${!isRegister ? 'password123' : ''}"
                    required
                    minlength="6"
                  >
                  <button type="button" class="input-action-btn" id="btnToggleAuthPassword" title="Tampilkan/Sembunyikan Sandi">
                    ${this.showPassword ? Icons.eyeOff(16) : Icons.eye(16)}
                  </button>
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">Peran Pengguna</label>
                <div class="auth-input-wrapper">
                  <span class="input-icon">${Icons.user(16)}</span>
                  <select id="authRoleSelect" class="form-select" style="padding-left: 44px; height: 46px; font-size: 14px; width: 100%; border: 1.5px solid #CBD5E1; border-radius: var(--radius-sm);">
                    <option value="student" ${user.role === 'student' ? 'selected' : ''}>Mahasiswa (Civitas Akademika)</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Dosen / Admin Pengelola Kampus</option>
                    <option value="organization" ${user.role === 'organization' ? 'selected' : ''}>Pengurus Organisasi / BEM / UKM</option>
                    <option value="partner" ${user.role === 'partner' ? 'selected' : ''}>Mitra Sosial &amp; Lembaga Pengabdian</option>
                  </select>
                </div>
              </div>

              ${isRegister ? `
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Tentang Kamu (Bio)</label>
                  <textarea
                    id="regBioInput"
                    class="form-control"
                    rows="3"
                    style="font-family: inherit; font-size: 13.5px; padding: 10px 12px; resize: vertical;"
                    placeholder="Ceritakan singkat tentang diri kamu dan komitmen kontribusimu..."
                  ></textarea>
                </div>
              ` : `
                <div class="form-action-row" style="margin-bottom: 14px;">
                  <label class="form-checkbox-label" style="font-size: 13px;">
                    <input type="checkbox" id="chkRememberMe" class="form-checkbox" checked>
                    <span>Ingat sesi di perangkat ini</span>
                  </label>
                  <button type="button" class="forgot-password-link" id="btnForgotPassLink" style="font-size: 13px;">
                    Lupa Sandi?
                  </button>
                </div>
              `}

              <button type="submit" class="btn btn-primary btn-block" id="btnSubmitAuth" style="font-size: 15px; font-weight: 700; height: 48px;">
                ${isRegister ? Icons.check(18) : Icons.auth(18)}
                <span>${isRegister ? 'Daftar &amp; Masuk ke Dashboard' : 'Masuk ke Dashboard'}</span>
              </button>

              ${!isRegister ? `
                <div class="auth-demo-chips">
                  <div class="auth-demo-chips-title">
                    ${Icons.sparkles(13)}
                    <span>Akun Demo — Klik untuk Masuk Langsung:</span>
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    <button type="button" class="auth-chip-btn" data-auth-demo="student">Mahasiswa</button>
                    <button type="button" class="auth-chip-btn" data-auth-demo="admin">Dosen / Admin</button>
                    <button type="button" class="auth-chip-btn" data-auth-demo="organization">Pengurus BEM</button>
                    <button type="button" class="auth-chip-btn" data-auth-demo="partner">Mitra Lembaga</button>
                  </div>
                </div>
                <div class="auth-divider" style="margin: 10px 0;"><span>atau</span></div>
                <button type="button" class="btn btn-sso btn-block" id="btnAuthSso" style="height: 44px; font-size: 13.5px;">
                  ${Icons.shield(16)}
                  <span>Masuk dengan SSO Kampus (Google Workspace / Dikti)</span>
                </button>
              ` : ''}

            </form>
          </div>

          <!-- Column 2: 'Tentang Kami' — Platform & Developer Info Panel -->
          <div class="about-you-panel">

            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
              <span class="about-you-badge">
                ${Icons.checkCircle(13)} Platform Terverifikasi
              </span>
              <span style="font-size: 11px; font-weight: 700; color: var(--neutral-muted); letter-spacing: 0.5px; text-transform: uppercase;">
                PBSB KEMENAG RI
              </span>
            </div>

            <!-- Section: Tentang Kami -->
            <div style="margin-bottom: 20px;">
              <div style="font-size: 18px; font-weight: 800; color: var(--neutral-dark); margin-bottom: 6px; letter-spacing: -0.3px;">
                Tentang Kami
              </div>
              <div style="font-size: 13.5px; color: var(--neutral-muted); line-height: 1.65;">
                <strong style="color: var(--neutral-dark);">Campus Impact Hub</strong> adalah platform ekosistem kampus terpadu yang menghubungkan mahasiswa, organisasi kemahasiswaan, dosen, dan mitra masyarakat dalam satu sistem kolaborasi dampak sosial yang terukur.
              </div>
            </div>

            <!-- Mission -->
            <div style="margin-bottom: 18px; background: var(--surface-alt); border-radius: var(--radius-md); padding: 14px 16px; border-left: 3px solid var(--primary);">
              <div style="font-size: 11.5px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                Misi Platform
              </div>
              <div style="font-size: 13px; color: var(--neutral-charcoal); line-height: 1.6;">
                Mewujudkan inovasi digital kampus yang tidak hanya berhenti sebagai transkrip akademik, namun berdampak nyata bagi masyarakat melalui kolaborasi multidisiplin yang terorganisir.
              </div>
            </div>

            <!-- Features -->
            <div style="margin-bottom: 18px;">
              <div style="font-size: 12px; font-weight: 700; color: var(--neutral-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                Fitur Utama Platform:
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--neutral-charcoal);">
                  <span style="width: 20px; height: 20px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;">${Icons.checkCircle(11)}</span>
                  <span><strong>Social Impact Hub</strong> — Marketplace proyek pengabdian MBKM &amp; KKN</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--neutral-charcoal);">
                  <span style="width: 20px; height: 20px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;">${Icons.checkCircle(11)}</span>
                  <span><strong>Organization Hub</strong> — Direktori organisasi &amp; rekrutmen terbuka</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--neutral-charcoal);">
                  <span style="width: 20px; height: 20px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;">${Icons.checkCircle(11)}</span>
                  <span><strong>Event Hub &amp; Tiket QR</strong> — Manajemen acara &amp; presensi digital</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--neutral-charcoal);">
                  <span style="width: 20px; height: 20px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;">${Icons.checkCircle(11)}</span>
                  <span><strong>Portofolio Dampak</strong> — Rekam jejak kontribusi &amp; Impact Score</span>
                </div>
              </div>
            </div>

            <!-- Developer Profile -->
            <div style="border-top: 1px dashed var(--border-color); padding-top: 16px; margin-top: auto;">
              <div style="font-size: 11.5px; font-weight: 700; color: var(--neutral-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                Pengembang
              </div>
              <div class="about-you-header" style="margin-bottom: 10px;">
                <div class="about-you-avatar">
                  BS
              </div>
              <div class="about-you-meta">
                <h3>${devProfile.name}</h3>
                <p>${devProfile.program} &bull; NIM ${devProfile.nim}</p>
                <div style="font-size: 12px; color: var(--primary); font-weight: 700; margin-top: 2px;">
                  ${devProfile.affiliation}
                </div>
              </div>
            </div>

            <!-- About Platform -->
            <div style="margin-bottom: 16px;">
              <div style="font-size: 17px; font-weight: 800; color: var(--neutral-dark); margin-bottom: 8px; letter-spacing: -0.3px;">
                Tentang Kami
              </div>
              <div style="font-size: 13px; color: var(--neutral-muted); line-height: 1.65;">
                <strong style="color: var(--neutral-dark);">Campus Impact Hub</strong> adalah platform ekosistem kampus terpadu yang menghubungkan mahasiswa, organisasi kemahasiswaan, dosen, dan mitra masyarakat dalam satu sistem kolaborasi dampak sosial yang terukur.
              </div>
            </div>

            <!-- Mission -->
            <div style="margin-bottom: 16px; background: var(--surface-alt); border-radius: var(--radius-md); padding: 12px 14px; border-left: 3px solid var(--primary);">
              <div style="font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                Misi Platform
              </div>
              <div style="font-size: 12.5px; color: var(--neutral-charcoal); line-height: 1.6; font-style: italic;">
                "${devProfile.motto || 'Mewujudkan inovasi digital yang tidak hanya berhenti sebagai transkrip akademik, namun berdampak nyata bagi masyarakat.'}"
              </div>
            </div>

            <!-- Features -->
            <div style="margin-bottom: 16px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--neutral-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                Fitur Utama:
              </div>
              <div style="display: flex; flex-direction: column; gap: 7px;">
                <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; color: var(--neutral-charcoal);">
                  <span style="color: var(--success); flex-shrink: 0; margin-top: 1px;">${Icons.checkCircle(13)}</span>
                  <span><strong>Social Impact Hub</strong> — Marketplace proyek pengabdian MBKM &amp; KKN</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; color: var(--neutral-charcoal);">
                  <span style="color: var(--success); flex-shrink: 0; margin-top: 1px;">${Icons.checkCircle(13)}</span>
                  <span><strong>Organization Hub</strong> — Direktori organisasi &amp; rekrutmen terbuka</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; color: var(--neutral-charcoal);">
                  <span style="color: var(--success); flex-shrink: 0; margin-top: 1px;">${Icons.checkCircle(13)}</span>
                  <span><strong>Event Hub &amp; Tiket QR</strong> — Manajemen acara &amp; presensi digital</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; color: var(--neutral-charcoal);">
                  <span style="color: var(--success); flex-shrink: 0; margin-top: 1px;">${Icons.checkCircle(13)}</span>
                  <span><strong>Portofolio Dampak</strong> — Rekam jejak kontribusi &amp; Impact Score</span>
                </div>
              </div>
            </div>

            <!-- Developer Info -->
            <div style="border-top: 1px dashed var(--border-color); padding-top: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--neutral-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                Pengembang
              </div>
              <div class="about-you-spec-list" style="margin: 0;">
                <div class="about-you-spec-item">
                  <span class="label">Nama:</span>
                  <span class="value" style="font-weight: 700;">${devProfile.name}</span>
                </div>
                <div class="about-you-spec-item">
                  <span class="label">Program:</span>
                  <span class="value">${devProfile.program}</span>
                </div>
                <div class="about-you-spec-item">
                  <span class="label">Afiliasi:</span>
                  <span class="value" style="color: var(--primary); font-weight: 600;">${devProfile.affiliation}</span>
                </div>
                <div class="about-you-spec-item">
                  <span class="label">Status:</span>
                  <span class="value" style="color: var(--success); font-weight: 700;">Mahasiswa Aktif (Santri PBSB)</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    `;

    this.contentEl.innerHTML = html;

    // Bind Auth Events
    const btnSwitchLogin = document.getElementById('btnSwitchToLogin');
    const btnSwitchRegister = document.getElementById('btnSwitchToRegister');

    if (btnSwitchLogin) {
      btnSwitchLogin.addEventListener('click', () => {
        this.isRegisterMode = false;
        this.render();
      });
    }

    if (btnSwitchRegister) {
      btnSwitchRegister.addEventListener('click', () => {
        this.isRegisterMode = true;
        this.render();
      });
    }

    // Toggle Password
    const btnTogglePass = document.getElementById('btnToggleAuthPassword');
    if (btnTogglePass) {
      btnTogglePass.addEventListener('click', () => {
        this.showPassword = !this.showPassword;
        const input = document.getElementById('authPasswordInput');
        if (input) input.type = this.showPassword ? 'text' : 'password';
        btnTogglePass.innerHTML = this.showPassword ? Icons.eyeOff(16) : Icons.eye(16);
      });
    }

    // Demo Fast Fill Chips
    document.querySelectorAll('[data-auth-demo]').forEach(chip => {
      chip.addEventListener('click', () => {
        const role = chip.getAttribute('data-auth-demo');
        const demoAccounts = CampusRepository.getDefaultDemoAccounts();
        const target = demoAccounts.find(a => a.role === role) || demoAccounts[0];

        const idInput = document.getElementById('authIdentifierInput');
        const passInput = document.getElementById('authPasswordInput');
        const roleSelect = document.getElementById('authRoleSelect');

        if (idInput) idInput.value = target.email;
        if (passInput) passInput.value = target.password;
        if (roleSelect) roleSelect.value = target.role;

        this.showToast(`Kredensial demo ${target.name} (${target.majorOrUnit}) berhasil dimuat. Mengalihkan ke Dashboard...`, 'info');
        
        // Instant login and redirect to dashboard
        setTimeout(() => {
          CampusRepository.login(target.email, target.password, target.role);
          this.showToast(`Berhasil masuk sebagai ${target.name}! Dialihkan ke Dashboard.`, 'success');
          this.switchTab('home');
        }, 300);
      });
    });

    // SSO Button
    const btnSso = document.getElementById('btnAuthSso');
    if (btnSso) {
      btnSso.addEventListener('click', () => {
        this.showToast('Menghubungkan ke Portal SSO Kampus Terpadu...', 'info');
        setTimeout(() => {
          CampusRepository.login('mahasiswa@kampus.ac.id', 'password123', 'student');
          this.showToast('Autentikasi SSO Berhasil! Mengalihkan ke Dashboard...', 'success');
          this.switchTab('home');
        }, 400);
      });
    }

    // Forgot Password Link
    const btnForgot = document.getElementById('btnForgotPassLink');
    if (btnForgot) {
      btnForgot.addEventListener('click', () => {
        this.openModal(
          'Pemulihan Kata Sandi Akun',
          `
            <p style="margin-bottom: 14px; color: var(--neutral-muted);">
              Masukkan email kampus Anda yang terdaftar untuk menerima instruksi pemulihan kata sandi.
            </p>
            <div class="form-group">
              <label class="form-label">Email Kampus Terdaftar</label>
              <input type="email" id="modalForgotEmail" class="form-control" value="mahasiswa@kampus.ac.id" required>
            </div>
          `,
          `
            <button class="btn btn-outline" id="btnCancelForgot">Batal</button>
            <button class="btn btn-primary" id="btnConfirmForgot">Kirim Tautan Reset</button>
          `
        );
        document.getElementById('btnCancelForgot').addEventListener('click', () => this.closeModal());
        document.getElementById('btnConfirmForgot').addEventListener('click', () => {
          const email = document.getElementById('modalForgotEmail').value;
          this.closeModal();
          this.showToast(`Tautan reset kata sandi telah dikirim ke ${email}.`, 'success');
        });
      });
    }

    // Form Submit (Login & Register) -> "alihkan ke dashbord seperti semula"
    const authForm = document.getElementById('dedicatedAuthForm');
    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const role = document.getElementById('authRoleSelect').value;
        const password = document.getElementById('authPasswordInput').value;

        if (this.isRegisterMode) {
          const name = document.getElementById('regNameInput').value;
          const identity = document.getElementById('regIdInput').value;
          const email = document.getElementById('authIdentifierInput').value;
          const bio = document.getElementById('regBioInput').value;

          const res = CampusRepository.register({
            name,
            email,
            identityNumber: identity,
            role,
            password,
            bio
          });

          if (res.success) {
            this.showToast(res.message, 'success');
            // Alihkan ke dashboard seperti semula
            this.switchTab('home');
          } else {
            this.showToast(res.message, 'danger');
          }
        } else {
          const identifier = document.getElementById('authIdentifierInput').value;
          const res = CampusRepository.login(identifier, password, role);

          if (res.success) {
            this.showToast(res.message, 'success');
            // Alihkan ke dashboard seperti semula
            this.switchTab('home');
          } else {
            this.showToast(res.message, 'danger');
          }
        }
      });
    }
  }

  // =========================================================================
  // SCREEN 2: HOME DASHBOARD — ROLE-BASED VIEW
  // =========================================================================
  renderHomeDashboard() {
    const user = CampusRepository.currentUser;
    const role = (user.role || 'student').toLowerCase();
    switch (role) {
      case 'admin':       this.renderDashboardAdmin(user);        break;
      case 'organization':this.renderDashboardOrganization(user); break;
      case 'partner':     this.renderDashboardPartner(user);      break;
      default:            this.renderDashboardStudent(user);      break;
    }
  }

  // ── Shared: Stats Grid ───────────────────────────────────────────────────
  _statsGridHtml() {
    const ts = CampusRepository.getTotalActiveStudents();
    const to = CampusRepository.getTotalOrganizations();
    const te = CampusRepository.getTotalEvents();
    const tp = CampusRepository.getTotalProjects();
    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--primary-light);color:var(--primary);">${Icons.users(22)}</div>
          <div class="stat-info"><div class="value">${ts}</div><div class="label">Mahasiswa Aktif</div><div class="sublabel">${ts>0?'Kontributor Terdaftar':'Belum ada pendaftar'}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--surface-alt);color:var(--neutral-charcoal);">${Icons.organization(22)}</div>
          <div class="stat-info"><div class="value">${to}</div><div class="label">Organisasi</div><div class="sublabel">${CampusRepository.getVerifiedOrganizationsCount()} Terverifikasi</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#F5F3FF;color:#7C3AED;">${Icons.event(22)}</div>
          <div class="stat-info"><div class="value">${te}</div><div class="label">Event Kampus</div><div class="sublabel">${te>0?'Terintegrasi QR':'Belum ada agenda'}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--warning-light);color:var(--warning);">${Icons.project(22)}</div>
          <div class="stat-info"><div class="value">${tp}</div><div class="label">Proyek Sosial</div><div class="sublabel">${tp>0?'Inisiatif Pengabdian':'Belum ada proyek'}</div></div>
        </div>
      </div>
    `;
  }

  // ── Shared: Welcome Header ───────────────────────────────────────────────
  _welcomeHeaderHtml(user, label, subtitle, actions) {
    return `
      <div class="card" style="padding:26px;margin-bottom:24px;border-color:#CBD5E1;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
          <span class="pill-badge pill-blue"><span class="badge-dot"></span>${label}</span>
          <span class="pill-badge pill-green"><span class="badge-dot"></span>Sesi Aktif</span>
          <span class="pill-badge pill-gray"><span class="badge-dot"></span>Campus Impact Hub</span>
        </div>
        <h2 style="font-size:24px;font-weight:800;letter-spacing:-0.3px;color:var(--neutral-dark);margin-bottom:4px;">Selamat Datang, ${user.name}</h2>
        <p style="font-size:14px;color:var(--neutral-muted);max-width:820px;margin-bottom:20px;line-height:1.6;">${subtitle}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">${actions}</div>
      </div>
    `;
  }

  // =========================================================================
  // DASHBOARD: MAHASISWA (student)
  // =========================================================================
  renderDashboardStudent(user) {
    const roleMeta = UserRole.STUDENT || { label: 'Mahasiswa' };
    const aiMatch     = CampusRepository.matchProblemWithAi(this.currentAiProblemQuery);
    const personalRec = CampusRepository.getAiStudentRecommendations(user.majorOrUnit, user.interests);
    const totalProjects = CampusRepository.getTotalProjects();
    const totalBeneficiaries = CampusRepository.getTotalBeneficiaries();

    const html = `
      ${this._welcomeHeaderHtml(user, roleMeta.label || 'Mahasiswa',
        'Dashboard khusus mahasiswa. Eksplorasi proyek pengabdian, daftar organisasi, ikuti event, dan rekam dampak kontribusimu.',
        `<button id="btnQuickSubmit" class="btn btn-primary" style="flex:1;min-width:155px;">${Icons.plus(15)} Ajukan Proyek</button>
         <button id="btnQuickAddOrg" class="btn btn-secondary" style="flex:1;min-width:155px;">${Icons.organization(15)} Daftarkan UKM</button>
         <button id="btnQuickAddEvent" class="btn btn-outline" style="flex:1;min-width:155px;">${Icons.event(15)} Lihat Event</button>`
      )}

      ${this._statsGridHtml()}

      <!-- Dampak Pribadi -->
      <div class="card hero-green" id="cardTotalDampak" style="padding:22px;cursor:pointer;margin-bottom:26px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.8px;opacity:0.85;margin-bottom:4px;text-transform:uppercase;">Rekam Jejak Kontribusi Saya</div>
        <div style="font-size:20px;font-weight:800;margin-bottom:6px;">
          Impact Score: ${user.impactScore||0} Poin &bull; Leadership: ${user.leadershipScore||0} Poin
        </div>
        <div style="font-size:13px;opacity:0.9;display:flex;gap:18px;flex-wrap:wrap;">
          <span>Proyek Selesai: <strong>${user.projectsCompleted||0}</strong></span>
          <span>UMKM Didampingi: <strong>${user.umkmHelped||0}</strong></span>
          <span>Jam Kontribusi: <strong>${user.contributionHours||0} Jam</strong></span>
          <span style="text-decoration:underline;cursor:pointer;">Lihat Portofolio &rarr;</span>
        </div>
      </div>

      <!-- AI Recommendation -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.sparkles(20)} AI — Pemetaan Masalah &amp; Rekomendasi</h3>
          <p class="section-subtitle">Temukan proyek yang sesuai dengan minat dan keahlianmu secara cerdas.</p>
        </div>
      </div>
      <div class="card" style="padding:22px;margin-bottom:26px;">
        <div class="form-group" style="margin-bottom:12px;">
          <label class="form-label">Cari Masalah / Topik Pengabdian:</label>
          <div style="display:flex;gap:10px;">
            <input type="text" id="inputAiProblem" class="form-control" value="${this.currentAiProblemQuery}" placeholder="Contoh: Digitalisasi UMKM">
            <button id="btnRunAiMatch" class="btn btn-primary" style="white-space:nowrap;">${Icons.search(15)} Analisis</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
          <button class="pill-badge pill-gray btn-ai-preset" data-query="Pemasaran online dan branding produk UMKM kuliner" style="cursor:pointer;">Pemasaran UMKM</button>
          <button class="pill-badge pill-gray btn-ai-preset" data-query="Sistem pencatatan bank sampah dan lingkungan desa mandiri" style="cursor:pointer;">Bank Sampah Desa</button>
          <button class="pill-badge pill-gray btn-ai-preset" data-query="Media modul pembelajaran interaktif sekolah dasar" style="cursor:pointer;">Media Edukasi</button>
        </div>
        <div style="background:var(--surface-alt);border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:14px;margin-bottom:14px;">
          <div style="font-weight:700;font-size:13.5px;color:var(--neutral-dark);margin-bottom:8px;">Hasil Analisis AI:</div>
          <div style="font-size:13px;color:var(--neutral-body);line-height:1.65;">
            <div>&bull; <strong>Kategori:</strong> ${aiMatch.category}</div>
            <div>&bull; <strong>Disiplin Ilmu:</strong> ${aiMatch.recommendedMajors.join(', ')}</div>
            <div>&bull; <strong>Estimasi Dampak:</strong> +${aiMatch.suggestedImpactScore} Poin (${aiMatch.estimatedImpact})</div>
            <div>&bull; <strong>Program Terpetakan:</strong> ${aiMatch.recommendedSolutionTitle}</div>
          </div>
        </div>
        <div style="border-top:1px solid var(--border-color);padding-top:14px;">
          <div style="font-size:14px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">Rekomendasi Personal — ${user.majorOrUnit||'Mahasiswa'}</div>
          <div style="font-size:13px;color:var(--neutral-body);line-height:1.65;">
            <div>&bull; <strong>Organisasi:</strong> ${personalRec.recommendedOrganizations.join(', ')}</div>
            <div>&bull; <strong>Event:</strong> ${personalRec.recommendedEvents.join(', ')}</div>
            <div>&bull; <strong>Proyek Cocok:</strong> ${personalRec.recommendedProjects.join(' &bull; ')}</div>
          </div>
        </div>
      </div>

      <!-- Proyek Tersedia -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.project(20)} Proyek Sosial Tersedia</h3>
          <p class="section-subtitle">Proyek pengabdian masyarakat yang dapat kamu ikuti.</p>
        </div>
        ${totalProjects>0?`<button id="btnViewAllProjects" class="section-action">Lihat Semua (${totalProjects}) ${Icons.arrowRight(13)}</button>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;">
        ${totalProjects>0 ? CampusRepository.projects.slice(0,2).map(p=>this.renderProjectCardHtml(p)).join('') : `
          <div class="card" style="text-align:center;padding:40px 24px;border:1.5px dashed var(--border-color);">
            <div style="color:var(--neutral-muted);margin-bottom:12px;">${Icons.project(36)}</div>
            <h4 style="font-size:16px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">Belum Ada Proyek</h4>
            <p style="font-size:13.5px;color:var(--neutral-muted);max-width:420px;margin:0 auto 18px auto;">Jadilah yang pertama mengajukan proyek pengabdian masyarakat.</p>
            <button id="btnEmptyAddProject" class="btn btn-primary">${Icons.plus(15)} Ajukan Proyek Pertama</button>
          </div>
        `}
      </div>
    `;

    this.contentEl.innerHTML = html;
    const safe = (id,fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };
    safe('btnQuickSubmit',    () => this.showSubmitProblemModal());
    safe('btnQuickAddOrg',    () => this.showRegisterOrgModal());
    safe('btnQuickAddEvent',  () => this.showCreateEventModal());
    safe('cardTotalDampak',   () => this.switchTab('impact'));
    safe('btnViewAllProjects',() => this.switchTab('projects'));
    safe('btnEmptyAddProject',() => this.showSubmitProblemModal());
    safe('btnRunAiMatch', () => {
      const q = document.getElementById('inputAiProblem').value.trim();
      this.currentAiProblemQuery = q || 'Digitalisasi UMKM';
      this.render();
      this.showToast('Analisis AI selesai', 'success');
    });
    document.querySelectorAll('.btn-ai-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentAiProblemQuery = btn.getAttribute('data-query');
        this.render();
        this.showToast('Preset diperbarui', 'info');
      });
    });
    this.bindProjectCardEvents();
  }

  // =========================================================================
  // DASHBOARD: DOSEN / ADMIN
  // =========================================================================
  renderDashboardAdmin(user) {
    const roleMeta = UserRole.ADMIN || { label: 'Admin / Dosen' };
    const totalProjects      = CampusRepository.getTotalProjects();
    const totalOrgs          = CampusRepository.getTotalOrganizations();
    const totalEvents        = CampusRepository.getTotalEvents();
    const totalStudents      = CampusRepository.getTotalActiveStudents();
    const totalBeneficiaries = CampusRepository.getTotalBeneficiaries();

    const html = `
      ${this._welcomeHeaderHtml(user, roleMeta.label || 'Admin / Dosen',
        'Panel administrasi & supervisi ekosistem kampus. Kelola proyek, verifikasi organisasi, terbitkan event, dan pantau rekap dampak seluruh civitas.',
        `<button id="btnQuickSubmit" class="btn btn-primary" style="flex:1;min-width:148px;">${Icons.plus(15)} Tambah Proyek</button>
         <button id="btnQuickAddOrg" class="btn btn-secondary" style="flex:1;min-width:148px;">${Icons.organization(15)} Verifikasi Org</button>
         <button id="btnQuickAddEvent" class="btn btn-outline" style="flex:1;min-width:148px;">${Icons.event(15)} Buat Event</button>`
      )}

      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.activity(20)} Ringkasan Platform — Seluruh Civitas</h3>
          <p class="section-subtitle">Data agregat seluruh ekosistem kampus yang tercatat di sistem.</p>
        </div>
      </div>
      ${this._statsGridHtml()}

      <!-- Dampak Total -->
      <div class="card" style="background:linear-gradient(135deg,#1E293B 0%,#0F172A 100%);color:#FFFFFF;padding:24px;margin-bottom:26px;border-radius:var(--radius-xl);">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.8px;opacity:0.7;margin-bottom:6px;text-transform:uppercase;">Total Dampak Terukur Platform</div>
        <div style="font-size:26px;font-weight:800;margin-bottom:10px;">${totalBeneficiaries.toLocaleString()} Penerima Manfaat</div>
        <div style="display:flex;gap:24px;flex-wrap:wrap;font-size:13.5px;opacity:0.85;">
          <span>${Icons.project(14)} ${totalProjects} Proyek</span>
          <span>${Icons.organization(14)} ${totalOrgs} Organisasi</span>
          <span>${Icons.event(14)} ${totalEvents} Event</span>
          <span>${Icons.users(14)} ${totalStudents} Mahasiswa</span>
        </div>
      </div>

      <!-- Panel Manajemen -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.shield(20)} Panel Manajemen &amp; Verifikasi</h3>
          <p class="section-subtitle">Aksi administratif untuk pengelolaan ekosistem kampus.</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;margin-bottom:28px;">
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid var(--primary);" id="cardAdminProjects">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.project(16)} Kelola Proyek Sosial</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Tambah, edit, atau arsipkan proyek pengabdian & MBKM yang berjalan.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:var(--primary);">${totalProjects} proyek terdaftar &rarr;</div>
        </div>
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid var(--success);" id="cardAdminOrgs">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.organization(16)} Verifikasi Organisasi</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Setujui atau tolak pendaftaran UKM, Himpunan, dan BEM baru.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:var(--success);">${totalOrgs} organisasi terdaftar &rarr;</div>
        </div>
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid #7C3AED;" id="cardAdminEvents">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.event(16)} Manajemen Event</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Terbitkan agenda kampus dengan tiket QR terintegrasi dan sistem presensi.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:#7C3AED;">${totalEvents} event aktif &rarr;</div>
        </div>
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid var(--warning);" id="cardAdminImpact">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.activity(16)} Rekap Dampak &amp; Skor</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Pantau Impact Score & Leadership Score seluruh mahasiswa secara real-time.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:var(--warning);">Lihat Portofolio &rarr;</div>
        </div>
      </div>

      <!-- Proyek Terbaru -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.project(20)} Proyek Terbaru di Platform</h3>
          <p class="section-subtitle">Daftar inisiatif pengabdian yang perlu supervisi admin.</p>
        </div>
        ${totalProjects>0?`<button id="btnViewAllProjects" class="section-action">Semua Proyek ${Icons.arrowRight(13)}</button>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${totalProjects>0 ? CampusRepository.projects.slice(0,3).map(p=>this.renderProjectCardHtml(p)).join('') : `
          <div class="card" style="text-align:center;padding:40px 24px;border:1.5px dashed var(--border-color);">
            <div style="color:var(--neutral-muted);margin-bottom:10px;">${Icons.project(34)}</div>
            <h4 style="font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">Belum Ada Proyek</h4>
            <p style="font-size:13.5px;color:var(--neutral-muted);max-width:420px;margin:0 auto 16px auto;">Tambahkan proyek sosial pertama untuk mulai mengelola ekosistem pengabdian kampus.</p>
            <button id="btnEmptyAddProject" class="btn btn-primary">${Icons.plus(15)} Tambah Proyek</button>
          </div>
        `}
      </div>
    `;

    this.contentEl.innerHTML = html;
    const safe = (id,fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };
    safe('btnQuickSubmit',    () => this.showSubmitProblemModal());
    safe('btnQuickAddOrg',    () => this.showRegisterOrgModal());
    safe('btnQuickAddEvent',  () => this.showCreateEventModal());
    safe('cardAdminProjects', () => this.switchTab('projects'));
    safe('cardAdminOrgs',     () => this.switchTab('organizations'));
    safe('cardAdminEvents',   () => this.switchTab('events'));
    safe('cardAdminImpact',   () => this.switchTab('impact'));
    safe('btnViewAllProjects',() => this.switchTab('projects'));
    safe('btnEmptyAddProject',() => this.showSubmitProblemModal());
    this.bindProjectCardEvents();
  }

  // =========================================================================
  // DASHBOARD: PENGURUS ORGANISASI (organization)
  // =========================================================================
  renderDashboardOrganization(user) {
    const roleMeta = UserRole.ORGANIZATION || { label: 'Pengurus Organisasi' };
    const totalOrgs   = CampusRepository.getTotalOrganizations();
    const totalEvents = CampusRepository.getTotalEvents();
    const totalRec    = CampusRepository.openRecruitments ? CampusRepository.openRecruitments.length : 0;

    const html = `
      ${this._welcomeHeaderHtml(user, roleMeta.label || 'Pengurus Organisasi',
        'Dashboard pengurus organisasi kemahasiswaan. Kelola profil UKM/BEM, buka rekrutmen anggota baru, dan terbitkan event organisasi.',
        `<button id="btnQuickAddOrg" class="btn btn-primary" style="flex:1;min-width:155px;">${Icons.organization(15)} Daftarkan Organisasi</button>
         <button id="btnQuickAddEvent" class="btn btn-secondary" style="flex:1;min-width:155px;">${Icons.event(15)} Buat Event</button>
         <button id="btnQuickRecruitment" class="btn btn-outline" style="flex:1;min-width:155px;">${Icons.users(15)} Buka Rekrutmen</button>`
      )}

      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.activity(20)} Statistik Ekosistem Organisasi</h3>
          <p class="section-subtitle">Ringkasan organisasi, event, dan rekrutmen yang berjalan di platform.</p>
        </div>
      </div>
      ${this._statsGridHtml()}

      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.organization(20)} Manajemen Organisasi</h3>
          <p class="section-subtitle">Kelola semua aspek kegiatan UKM/Himpunan/BEM Anda.</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:28px;">
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid var(--primary);" id="cardOrgDirectory">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.organization(16)} Direktori Organisasi</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Lihat dan perbarui profil UKM/BEM Anda di direktori kampus.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:var(--primary);">${totalOrgs} organisasi terdaftar &rarr;</div>
        </div>
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid var(--success);" id="cardOrgRecruitment">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.users(16)} Rekrutmen Terbuka</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Buka lowongan anggota baru dan kelola proses seleksi calon pengurus.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:var(--success);">${totalRec} rekrutmen aktif &rarr;</div>
        </div>
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid #7C3AED;" id="cardOrgEvents">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.event(16)} Event Organisasi</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Terbitkan dan kelola event yang diselenggarakan oleh organisasi Anda.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:#7C3AED;">${totalEvents} event berjalan &rarr;</div>
        </div>
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid var(--warning);" id="cardOrgImpact">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.activity(16)} Dampak &amp; Portofolio</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Rekam kontribusi dan dokumentasikan dampak kegiatan organisasi Anda.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:var(--warning);">Lihat Portofolio &rarr;</div>
        </div>
      </div>

      <!-- Panduan Memulai -->
      <div class="card" style="background:var(--surface-alt);border-color:var(--border-color);padding:22px;margin-bottom:24px;">
        <div style="font-size:15px;font-weight:700;color:var(--neutral-dark);margin-bottom:14px;">${Icons.sparkles(16)} Panduan Memulai sebagai Pengurus Organisasi</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${[['1','Daftarkan profil UKM/BEM Anda di menu Organization Hub.','organizations'],
              ['2','Buka lowongan rekrutmen anggota baru untuk memperkuat tim.','organizations'],
              ['3','Terbitkan agenda event dengan sistem tiket QR terintegrasi.','events'],
              ['4','Dokumentasikan dampak kegiatan di Portofolio Dampak.','impact'],
            ].map(([n,t,tab])=>`
            <div style="display:flex;align-items:flex-start;gap:12px;cursor:pointer;" data-nav-tab="${tab}">
              <span style="width:24px;height:24px;background:var(--primary);color:#fff;border-radius:50%;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${n}</span>
              <span style="font-size:13.5px;color:var(--neutral-charcoal);line-height:1.5;padding-top:2px;">${t}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.contentEl.innerHTML = html;
    const safe = (id,fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };
    safe('btnQuickAddOrg',      () => this.showRegisterOrgModal());
    safe('btnQuickAddEvent',    () => this.showCreateEventModal());
    safe('btnQuickRecruitment', () => this.switchTab('organizations'));
    safe('cardOrgDirectory',    () => this.switchTab('organizations'));
    safe('cardOrgRecruitment',  () => this.switchTab('organizations'));
    safe('cardOrgEvents',       () => this.switchTab('events'));
    safe('cardOrgImpact',       () => this.switchTab('impact'));
    document.querySelectorAll('[data-nav-tab]').forEach(el => {
      el.addEventListener('click', () => this.switchTab(el.getAttribute('data-nav-tab')));
    });
  }

  // =========================================================================
  // DASHBOARD: MITRA SOSIAL / LEMBAGA (partner)
  // =========================================================================
  renderDashboardPartner(user) {
    const roleMeta = UserRole.PARTNER || { label: 'Mitra Sosial' };
    const totalProjects      = CampusRepository.getTotalProjects();
    const totalBeneficiaries = CampusRepository.getTotalBeneficiaries();

    const html = `
      ${this._welcomeHeaderHtml(user, roleMeta.label || 'Mitra Sosial',
        'Dashboard mitra masyarakat dan lembaga sosial. Ajukan permasalahan nyata untuk dicarikan solusi oleh tim mahasiswa kampus.',
        `<button id="btnQuickSubmit" class="btn btn-primary" style="flex:1;min-width:155px;">${Icons.plus(15)} Ajukan Permasalahan</button>
         <button id="btnViewProjects" class="btn btn-secondary" style="flex:1;min-width:155px;">${Icons.project(15)} Lihat Proyek Aktif</button>
         <button id="btnViewImpact" class="btn btn-outline" style="flex:1;min-width:155px;">${Icons.activity(15)} Rekap Dampak</button>`
      )}

      <!-- Dampak Kemitraan -->
      <div class="card" style="background:linear-gradient(135deg,#064E3B 0%,#065F46 100%);color:#FFFFFF;padding:24px;margin-bottom:26px;border-radius:var(--radius-xl);">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.8px;opacity:0.75;margin-bottom:6px;text-transform:uppercase;">Dampak Kemitraan Kampus</div>
        <div style="font-size:26px;font-weight:800;margin-bottom:8px;">${totalBeneficiaries.toLocaleString()} Total Penerima Manfaat</div>
        <div style="font-size:13.5px;opacity:0.85;display:flex;gap:20px;flex-wrap:wrap;">
          <span>${Icons.project(14)} ${totalProjects} Proyek Berjalan</span>
          <span style="text-decoration:underline;cursor:pointer;" id="btnPartnerImpactDetail">Lihat Rincian Dampak &rarr;</span>
        </div>
      </div>

      <!-- Panel Mitra -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.users(20)} Panduan Kolaborasi Mitra</h3>
          <p class="section-subtitle">Langkah-langkah untuk memulai kolaborasi dengan ekosistem kampus.</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:28px;">
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid var(--primary);" id="cardPartnerSubmit">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.plus(16)} Ajukan Permasalahan</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Daftarkan permasalahan UMKM, Desa, atau Komunitas untuk dicarikan solusi oleh mahasiswa.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:var(--primary);">Mulai pengajuan &rarr;</div>
        </div>
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid var(--success);" id="cardPartnerProjects">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.project(16)} Pantau Proyek</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Lihat perkembangan proyek pengabdian yang sedang menangani permasalahan Anda.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:var(--success);">${totalProjects} proyek aktif &rarr;</div>
        </div>
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid #7C3AED;" id="cardPartnerEvents">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.event(16)} Ikuti Workshop &amp; Event</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Daftarkan partisipasi dalam workshop, pelatihan, dan seminar bersama kampus.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:#7C3AED;">Lihat agenda &rarr;</div>
        </div>
        <div class="card" style="padding:20px;cursor:pointer;border-left:3px solid var(--warning);" id="cardPartnerImpact">
          <div style="font-size:13px;font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">${Icons.activity(16)} Laporan Dampak</div>
          <p style="font-size:12.5px;color:var(--neutral-muted);line-height:1.5;">Akses laporan dampak terukur dari seluruh proyek kemitraan yang telah berjalan.</p>
          <div style="margin-top:10px;font-size:12px;font-weight:700;color:var(--warning);">Unduh laporan &rarr;</div>
        </div>
      </div>

      <!-- Proyek Mitra -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.project(20)} Proyek Kemitraan Aktif</h3>
          <p class="section-subtitle">Inisiatif yang melibatkan mitra dalam ekosistem kampus.</p>
        </div>
        ${totalProjects>0?`<button id="btnViewAllProjects" class="section-action">Semua Proyek ${Icons.arrowRight(13)}</button>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${totalProjects>0 ? CampusRepository.projects.slice(0,2).map(p=>this.renderProjectCardHtml(p)).join('') : `
          <div class="card" style="text-align:center;padding:40px 24px;border:1.5px dashed var(--border-color);">
            <div style="color:var(--neutral-muted);margin-bottom:10px;">${Icons.project(34)}</div>
            <h4 style="font-weight:700;color:var(--neutral-dark);margin-bottom:6px;">Belum Ada Proyek Kemitraan</h4>
            <p style="font-size:13.5px;color:var(--neutral-muted);max-width:420px;margin:0 auto 16px auto;">Ajukan permasalahan pertama Anda agar tim mahasiswa dapat mulai bekerja.</p>
            <button id="btnEmptyAddProject" class="btn btn-primary">${Icons.plus(15)} Ajukan Permasalahan</button>
          </div>
        `}
      </div>
    `;

    this.contentEl.innerHTML = html;
    const safe = (id,fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };
    safe('btnQuickSubmit',        () => this.showSubmitProblemModal());
    safe('btnViewProjects',       () => this.switchTab('projects'));
    safe('btnViewImpact',         () => this.switchTab('impact'));
    safe('btnPartnerImpactDetail',() => this.switchTab('impact'));
    safe('cardPartnerSubmit',     () => this.showSubmitProblemModal());
    safe('cardPartnerProjects',   () => this.switchTab('projects'));
    safe('cardPartnerEvents',     () => this.switchTab('events'));
    safe('cardPartnerImpact',     () => this.switchTab('impact'));
    safe('btnViewAllProjects',    () => this.switchTab('projects'));
    safe('btnEmptyAddProject',    () => this.showSubmitProblemModal());
    this.bindProjectCardEvents();
  }
  // =========================================================================
  // SCREEN 3: PROJECT MARKETPLACE
  // =========================================================================
  renderProjectsMarketplace() {
    const categories = ['Semua', 'Open', 'On Going', 'Completed', 'Teknologi', 'Lingkungan', 'Pendidikan', 'Digital Marketing'];

    const filtered = CampusRepository.projects.filter(p => {
      if (this.selectedProjectCategoryFilter === 'Semua') return true;
      if (this.selectedProjectCategoryFilter === 'Open') return p.status === 'OPEN';
      if (this.selectedProjectCategoryFilter === 'On Going') return p.status === 'ON_GOING';
      if (this.selectedProjectCategoryFilter === 'Completed') return p.status === 'COMPLETED';
      return p.category.toLowerCase() === this.selectedProjectCategoryFilter.toLowerCase();
    });

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.project(20)} Social Impact Hub
          </h3>
          <p class="section-subtitle">Marketplace proyek pengabdian masyarakat: Menghubungkan masalah nyata dengan mahasiswa.</p>
        </div>
        <button id="btnHeaderSubmitProblem" class="btn btn-primary" style="font-size: 13px; padding: 8px 16px;">
          ${Icons.plus(15)} Tambah Masalah Baru
        </button>
      </div>

      <!-- Call-To-Action Banner -->
      <div class="card" style="background: var(--surface-alt); border-color: var(--border-color); padding: 22px; margin-bottom: 22px;">
        <div style="font-weight: 700; font-size: 15px; color: var(--neutral-dark); margin-bottom: 4px;">
          Pengajuan Permasalahan Mitra Masyarakat Mandiri
        </div>
        <p style="font-size: 13.5px; color: var(--neutral-muted); margin-bottom: 14px; line-height: 1.6;">
          Daftarkan kendala UMKM, Desa, Sekolah, atau Komunitas untuk dicarikan solusi oleh tim mahasiswa lintas jurusan melalui program pengabdian dan MBKM.
        </p>
        <button id="btnBannerSubmitProblem" class="btn btn-secondary" style="font-size: 13.5px;">
          ${Icons.upload(15)} Buka Formulir Pengajuan Masalah
        </button>
      </div>

      <!-- Filter Chips Bar -->
      <div class="filter-scroll-container">
        ${categories.map(c => `
          <button class="filter-chip ${this.selectedProjectCategoryFilter === c ? 'active' : ''}" data-category="${c}">
            ${c}
          </button>
        `).join('')}
      </div>

      <!-- Project Cards List (Clean empty state if empty) -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${filtered.length ? filtered.map(p => this.renderProjectCardHtml(p)).join('') : `
          <div class="card" style="text-align: center; padding: 48px 24px; border: 1.5px dashed var(--border-color);">
            <div style="color: var(--neutral-muted); margin-bottom: 12px;">
              ${Icons.project(36)}
            </div>
            <h4 style="font-size: 17px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 6px;">
              Katalog Proyek Masih Kosong
            </h4>
            <p style="font-size: 14px; color: var(--neutral-muted); max-width: 480px; margin: 0 auto 20px auto; line-height: 1.6;">
              Belum ada proyek sosial yang ditambahkan. Silakan gunakan tombol di bawah untuk mendaftarkan proyek pertama Anda.
            </p>
            <button id="btnEmptyProjectsAdd" class="btn btn-primary">
              ${Icons.plus(15)} Ajukan Masalah / Proyek Baru
            </button>
          </div>
        `}
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedProjectCategoryFilter = btn.getAttribute('data-category');
        this.render();
      });
    });

    document.getElementById('btnHeaderSubmitProblem').addEventListener('click', () => this.showSubmitProblemModal());
    document.getElementById('btnBannerSubmitProblem').addEventListener('click', () => this.showSubmitProblemModal());

    const btnEmptyAdd = document.getElementById('btnEmptyProjectsAdd');
    if (btnEmptyAdd) {
      btnEmptyAdd.addEventListener('click', () => this.showSubmitProblemModal());
    }

    this.bindProjectCardEvents();
  }

  renderProjectCardHtml(project) {
    let statusPillClass = 'pill-blue';
    if (project.status === 'ON_GOING') statusPillClass = 'pill-amber';
    if (project.status === 'COMPLETED') statusPillClass = 'pill-green';

    return `
      <div class="card project-card" data-id="${project.id}" style="padding: 22px; margin-bottom: 0;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 12px;">
          <span class="pill-badge pill-blue">${project.category}</span>
          <span class="pill-badge pill-green">
            <span class="badge-dot"></span> Impact Score: ${project.impactScore}
          </span>
          <span class="pill-badge ${statusPillClass}">
            <span class="badge-dot"></span> ${ProjectStatus[project.status]?.label || project.status}
          </span>
          <span class="pill-badge pill-gray">
            ${Icons.users(13)} ${project.applicantCount || 0} Pendaftar
          </span>
        </div>

        <h4 style="font-size: 18px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 4px;">
          ${project.title}
        </h4>
        <div style="font-size: 13px; font-weight: 600; color: var(--primary); margin-bottom: 10px;">
          Mitra: ${project.organizationName} &bull; ${project.location}
        </div>

        <p style="font-size: 14px; color: var(--neutral-body); margin-bottom: 14px; line-height: 1.6;">
          ${project.description}
        </p>

        <div style="font-size: 13px; color: var(--neutral-dark); margin-bottom: 14px;">
          <strong>Kebutuhan Kompetensi:</strong> <span style="color: var(--neutral-muted);">${project.requirements.join(' &bull; ')}</span>
        </div>

        <!-- Impact Report Box -->
        <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--neutral-dark); text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 4px;">
            Laporan Dampak &bull; Estimasi ${project.impactReport?.beneficiaries || 0} Penerima Manfaat
          </div>
          <div style="font-size: 13px; color: var(--neutral-muted); line-height: 1.55;">
            <span>Kondisi Awal: ${project.impactReport?.beforeCondition || '-'}</span><br>
            <span>Target Capaian: ${project.impactReport?.afterCondition || '-'}</span>
          </div>
        </div>

        ${project.userApplicationState !== 'NONE' ? `
          <div style="margin-bottom: 14px; font-size: 12.5px; font-weight: 600; color: var(--primary); background: var(--primary-light); border: 1px solid var(--primary-border); padding: 9px 14px; border-radius: var(--radius-sm);">
            ${project.userApplicationState === 'APPROVED' 
              ? 'Status Registrasi: Disetujui (' + project.userRoleInProject + ')' 
              : 'Status Registrasi: Menunggu Konfirmasi Mitra (' + project.userRoleInProject + ')'}
          </div>
        ` : ''}

        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-project-detail" data-id="${project.id}" style="flex: 1; min-width: 140px;">
            ${Icons.eye(15)} Rincian Proyek
          </button>
          <button class="btn btn-primary btn-project-apply" data-id="${project.id}" style="flex: 1; min-width: 170px;">
            ${project.userApplicationState === 'NONE' 
              ? `${Icons.arrowRight(15)} Daftar Proyek (+50 Poin)` 
              : `${Icons.leadership(15)} Tingkatkan ke Ketua Tim (+75)`}
          </button>
        </div>
      </div>
    `;
  }

  bindProjectCardEvents() {
    document.querySelectorAll('.btn-project-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.showProjectDetailModal(id);
      });
    });

    document.querySelectorAll('.btn-project-apply').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const project = CampusRepository.projects.find(p => p.id === id);
        const asLeader = project.userApplicationState !== 'NONE';
        const msg = CampusRepository.applyForProject(id, asLeader);
        this.showToast(msg, 'success');
        this.render();
      });
    });
  }

  // =========================================================================
  // SCREEN 4: PROJECT DETAIL MODAL
  // =========================================================================
  showProjectDetailModal(projectId) {
    const project = CampusRepository.projects.find(p => p.id === projectId);
    if (!project) return;

    let flowStepText = 'Tahap 1: Registrasi Tim &rarr; Tahap 2: Seleksi & Validasi Mitra &rarr; Tahap 3: Implementasi Solusi';
    if (project.userApplicationState === 'APPROVED') {
      flowStepText = 'Registrasi Disetujui &bull; Peran: ' + project.userRoleInProject + ' &bull; Status: Implementasi Lapangan';
    } else if (project.userApplicationState === 'PENDING') {
      flowStepText = 'Registrasi Terkirim &bull; Status: Menunggu Verifikasi Mitra & Dosen Pendamping';
    }

    const bodyHtml = `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
        <span class="pill-badge pill-blue">${project.category}</span>
        <span class="pill-badge pill-green"><span class="badge-dot"></span> Impact Score: ${project.impactScore}</span>
        <span class="pill-badge pill-amber"><span class="badge-dot"></span> ${ProjectStatus[project.status]?.label || project.status}</span>
      </div>

      <h3 style="font-size: 20px; font-weight: 800; color: var(--neutral-dark); margin-bottom: 4px;">
        ${project.title}
      </h3>
      <div style="font-size: 13.5px; font-weight: 600; color: var(--primary); margin-bottom: 16px;">
        Mitra Pengusul: ${project.organizationName} &bull; Lokasi: ${project.location}
      </div>

      <!-- Photo / Documentation Box -->
      <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px 16px; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 4px;">
          Dokumentasi: ${project.photoCaption}
        </div>
        <div style="font-size: 13.5px; color: var(--neutral-body); line-height: 1.6;">
          ${project.description}
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="font-size: 13.5px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 8px;">
          Kebutuhan Keahlian Mahasiswa:
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${project.requirements.map(r => `<span class="pill-badge pill-gray">${r}</span>`).join('')}
        </div>
      </div>

      <!-- Application Flow -->
      <div style="background: var(--primary-light); border: 1px solid var(--primary-border); border-radius: var(--radius-sm); padding: 14px 16px; margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 4px;">
          Alur Seleksi & Penugasan:
        </div>
        <div style="font-size: 13px; font-weight: 600; color: var(--neutral-dark);">
          ${flowStepText}
        </div>
      </div>

      <!-- Impact Report Section -->
      <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 18px;">
        <div style="font-size: 13.5px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 8px;">
          Laporan Dampak Terukur (Impact Assessment)
        </div>
        <div style="font-size: 13px; color: var(--neutral-body); line-height: 1.65;">
          <div>&bull; <strong>Kondisi Sebelum:</strong> ${project.impactReport?.beforeCondition}</div>
          <div>&bull; <strong>Target Sesudah:</strong> ${project.impactReport?.afterCondition}</div>
          <div>&bull; <strong>Penerima Manfaat Langsung:</strong> ${project.impactReport?.beneficiaries} Orang</div>
          <div>&bull; <strong>Relevansi SDG:</strong> ${project.impactReport?.sdgCategory}</div>
          <div>&bull; <strong>Ulasan Mitra:</strong> "${project.impactReport?.partnerFeedback}"</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button id="modalBtnApplyMember" class="btn btn-primary">
          ${Icons.arrowRight(15)} Daftar sebagai Anggota Tim (+50 Impact Score)
        </button>
        <button id="modalBtnApplyLeader" class="btn btn-secondary">
          ${Icons.leadership(15)} Daftar sebagai Ketua Tim (+75 Impact & +75 Leadership)
        </button>
        <button id="modalBtnCycleStatus" class="btn btn-outline">
          ${Icons.refresh(15)} Perbarui Status Progress (${ProjectStatus[project.status]?.label})
        </button>
      </div>
    `;

    this.openModal(`Rincian Inisiatif: ${project.title}`, bodyHtml, `<button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>`);

    document.getElementById('modalBtnApplyMember').addEventListener('click', () => {
      const msg = CampusRepository.applyForProject(project.id, false);
      this.showToast(msg, 'success');
      this.closeModal();
      this.render();
    });

    document.getElementById('modalBtnApplyLeader').addEventListener('click', () => {
      const msg = CampusRepository.applyForProject(project.id, true);
      this.showToast(msg, 'success');
      this.closeModal();
      this.render();
    });

    document.getElementById('modalBtnCycleStatus').addEventListener('click', () => {
      const next = CampusRepository.cycleProjectStatus(project.id);
      this.showToast(`Status proyek diperbarui: ${ProjectStatus[next]?.label}`, 'info');
      this.closeModal();
      this.render();
    });
  }

  // =========================================================================
  // SCREEN 8: SUBMIT PROBLEM MODAL
  // =========================================================================
  showSubmitProblemModal() {
    const bodyHtml = `
      <p style="font-size: 13px; color: var(--neutral-muted); margin-bottom: 16px;">
        Formulir pengajuan masalah mitra masyarakat untuk dicarikan solusi oleh talenta mahasiswa melalui AI Problem Matching.
      </p>

      <div class="form-group">
        <label class="form-label">Nama Instansi / Entitas Mitra</label>
        <input type="text" id="spOrgName" class="form-control" placeholder="Contoh: Koperasi Desa / UMKM Mandiri" required>
      </div>

      <div class="form-group">
        <label class="form-label">Judul Kendala / Kebutuhan</label>
        <input type="text" id="spTitle" class="form-control" placeholder="Contoh: Digitalisasi pembukuan kasir harian" required>
      </div>

      <div class="form-group">
        <label class="form-label">Uraian Masalah Lengkap</label>
        <textarea id="spDesc" class="form-control" rows="3" placeholder="Uraikan kendala operasional yang dihadapi mitra masyarakat..."></textarea>
      </div>

      <div style="margin-bottom: 16px;">
        <button type="button" id="spBtnAiFill" class="btn btn-secondary btn-block" style="font-size: 13px;">
          ${Icons.sparkles(15)} Analisis Otomatis Menggunakan AI Problem Matching
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Kategori Inisiatif</label>
        <input type="text" id="spCategory" class="form-control" value="Teknologi" placeholder="Teknologi / Lingkungan / Pendidikan">
      </div>

      <div class="form-group">
        <label class="form-label">Lokasi Mitra</label>
        <input type="text" id="spLocation" class="form-control" placeholder="Contoh: Kec. Coblong, Kota Bandung">
      </div>

      <div class="form-group">
        <label class="form-label">Dokumentasi Terlampir</label>
        <input type="text" id="spPhoto" class="form-control" placeholder="Contoh: foto_lapangan_kegiatan.jpg">
      </div>

      <div class="form-group">
        <label class="form-label">Kompetensi yang Dibutuhkan</label>
        <input type="text" id="spRequirements" class="form-control" placeholder="Contoh: 2 Informatika, 1 Bisnis Digital">
      </div>

      <div class="form-group">
        <label class="form-label">Estimasi Jumlah Penerima Manfaat (Orang)</label>
        <input type="number" id="spBeneficiaries" class="form-control" value="50" min="1">
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="spBtnSubmit" class="btn btn-primary">${Icons.upload(15)} Submit ke Marketplace</button>
    `;

    this.openModal('Formulir Pengajuan Masalah Mitra', bodyHtml, footerHtml);

    document.getElementById('spBtnAiFill').addEventListener('click', () => {
      const title = document.getElementById('spTitle').value;
      const desc = document.getElementById('spDesc').value;
      const match = CampusRepository.matchProblemWithAi(`${title} ${desc}`);

      document.getElementById('spCategory').value = match.category;
      document.getElementById('spRequirements').value = match.recommendedMajors.map(m => `1 ${m}`).join(', ');
      this.showToast(`Kategori terpetakan: ${match.category} (+${match.suggestedImpactScore} Poin)`, 'info');
    });

    document.getElementById('spBtnSubmit').addEventListener('click', () => {
      const orgName = document.getElementById('spOrgName').value;
      const title = document.getElementById('spTitle').value;
      const description = document.getElementById('spDesc').value;
      const category = document.getElementById('spCategory').value;
      const location = document.getElementById('spLocation').value;
      const photoLabel = document.getElementById('spPhoto').value;
      const requirementsInput = document.getElementById('spRequirements').value;
      const estimatedBeneficiaries = document.getElementById('spBeneficiaries').value;

      if (!title) {
        this.showToast('Judul masalah wajib diisi', 'warning');
        return;
      }

      const created = CampusRepository.submitProblem({
        orgName,
        title,
        description,
        category,
        location,
        photoLabel,
        requirementsInput,
        estimatedBeneficiaries
      });

      this.showToast(`Inisiatif "${created.title}" berhasil ditambahkan!`, 'success');
      this.closeModal();
      this.switchTab('projects');
    });
  }

  // =========================================================================
  // SCREEN 5 & 6: ORGANIZATION HUB & OPEN RECRUITMENT
  // =========================================================================
  renderOrganizationsHub() {
    const html = `
      <div style="display: flex; gap: 10px; margin-bottom: 22px;">
        <button id="btnSubTabDirectory" class="btn ${this.selectedOrgSubTab === 0 ? 'btn-primary' : 'btn-outline'}" style="flex: 1;">
          ${Icons.organization(16)} Direktori Organisasi (${CampusRepository.organizations.length})
        </button>
        <button id="btnSubTabOprec" class="btn ${this.selectedOrgSubTab === 1 ? 'btn-primary' : 'btn-outline'}" style="flex: 1;">
          ${Icons.users(16)} Open Recruitment (${CampusRepository.openRecruitments.length})
        </button>
      </div>

      <div id="orgSubTabContainer"></div>
    `;

    this.contentEl.innerHTML = html;

    document.getElementById('btnSubTabDirectory').addEventListener('click', () => {
      this.selectedOrgSubTab = 0;
      this.render();
    });
    document.getElementById('btnSubTabOprec').addEventListener('click', () => {
      this.selectedOrgSubTab = 1;
      this.render();
    });

    const subContainer = document.getElementById('orgSubTabContainer');
    if (this.selectedOrgSubTab === 0) {
      subContainer.innerHTML = this.renderOrganizationDirectoryHtml();
      this.bindOrganizationDirectoryEvents();
    } else {
      subContainer.innerHTML = this.renderOpenRecruitmentHtml();
      this.bindOpenRecruitmentEvents();
    }
  }

  renderOrganizationDirectoryHtml() {
    const orgs = CampusRepository.organizations;
    const user = CampusRepository.currentUser;

    return `
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.organization(20)} Direktori Organisasi Kampus
          </h3>
          <p class="section-subtitle">Daftar lembaga eksekutif, himpunan mahasiswa, dan unit kegiatan mahasiswa resmi.</p>
        </div>
        <button id="btnRegisterOrg" class="btn btn-primary" style="font-size: 13px; padding: 8px 16px;">
          ${Icons.plus(15)} Daftarkan Organisasi Baru
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${orgs.length ? orgs.map(org => {
          let badgePill = '<span class="pill-badge pill-green"><span class="badge-dot"></span> Verified Organization</span>';
          if (org.verificationStatus === 'PENDING') badgePill = '<span class="pill-badge pill-amber"><span class="badge-dot"></span> Menunggu Verifikasi SK</span>';
          if (org.verificationStatus === 'REJECTED') badgePill = '<span class="pill-badge pill-red"><span class="badge-dot"></span> Ditolak</span>';

          return `
            <div class="card" style="padding: 22px; margin-bottom: 0;">
              <!-- Header Row -->
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
                <div style="
                  width: 48px;
                  height: 48px;
                  border-radius: var(--radius-sm);
                  background: var(--neutral-dark);
                  color: #FFFFFF;
                  font-weight: 700;
                  font-size: 15px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  letter-spacing: 0.5px;
                ">
                  ${org.logoInitials}
                </div>
                <div style="flex: 1; overflow: hidden;">
                  <h4 style="font-size: 18px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 2px;">
                    ${org.name} <span style="font-size: 13px; font-weight: 500; color: var(--neutral-muted);">(${org.id})</span>
                  </h4>
                  <div style="font-size: 13px; color: var(--neutral-muted);">
                    ${org.fullName} &bull; ${org.category}
                  </div>
                </div>
              </div>

              <!-- Badges -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                ${badgePill}
                <span class="pill-badge pill-blue">
                  ${Icons.users(13)} ${org.memberCount} Anggota Terdaftar
                </span>
                ${org.isUserJoined ? '<span class="pill-badge pill-green"><span class="badge-dot"></span> Pengurus Aktif</span>' : ''}
              </div>

              <p style="font-size: 14px; color: var(--neutral-body); margin-bottom: 14px; line-height: 1.6;">
                ${org.description}
              </p>

              <div style="font-size: 12.5px; color: var(--neutral-muted); background: var(--surface-alt); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 16px; line-height: 1.6;">
                <div><strong>SK Pengesahan:</strong> ${org.skNumber}</div>
                <div><strong>Dosen Pembina:</strong> ${org.advisorName}</div>
                <div><strong>Kontak Resmi:</strong> ${org.contact}</div>
              </div>

              <!-- Actions -->
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-join-org ${org.isUserJoined ? 'btn-secondary' : 'btn-primary'}" data-id="${org.id}" style="flex: 1;">
                  ${org.isUserJoined ? `${Icons.check(14)} Pengurus Aktif (+30 Poin)` : `${Icons.users(14)} Gabung Pengurus (+30 Poin)`}
                </button>
                ${(org.verificationStatus !== 'VERIFIED' || user.role === 'admin') ? `
                  <button class="btn btn-outline btn-verify-org" data-id="${org.id}" style="flex: 1;">
                    ${org.verificationStatus === 'VERIFIED' ? `${Icons.refresh(14)} Kembalikan ke Pending` : `${Icons.shield(14)} Verifikasi Legalitas SK`}
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('') : `
          <div class="card" style="text-align: center; padding: 48px 24px; border: 1.5px dashed var(--border-color);">
            <div style="color: var(--neutral-muted); margin-bottom: 12px;">
              ${Icons.organization(36)}
            </div>
            <h4 style="font-size: 17px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 6px;">
              Belum Ada Organisasi Terdaftar
            </h4>
            <p style="font-size: 14px; color: var(--neutral-muted); max-width: 480px; margin: 0 auto 20px auto; line-height: 1.6;">
              Data direktori organisasi masih kosong. Daftarkan lembaga BEM, Himpunan Mahasiswa, atau UKM pertama Anda.
            </p>
            <button id="btnEmptyOrgAdd" class="btn btn-primary">
              ${Icons.plus(15)} Daftarkan Organisasi Pertama
            </button>
          </div>
        `}
      </div>
    `;
  }

  bindOrganizationDirectoryEvents() {
    const btnReg = document.getElementById('btnRegisterOrg');
    if (btnReg) btnReg.addEventListener('click', () => this.showRegisterOrgModal());

    const btnEmptyAdd = document.getElementById('btnEmptyOrgAdd');
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => this.showRegisterOrgModal());

    document.querySelectorAll('.btn-join-org').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        CampusRepository.joinOrganizationAsOfficer(id);
        this.showToast('Bergabung sebagai pengurus (+30 Impact & Leadership Score)', 'success');
        this.render();
      });
    });

    document.querySelectorAll('.btn-verify-org').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const org = CampusRepository.organizations.find(o => o.id === id);
        const approve = org.verificationStatus !== 'VERIFIED';
        CampusRepository.verifyOrganization(id, approve);
        this.showToast(approve ? `Legalitas ${org.name} terverifikasi` : `Status ${org.name} diubah`, 'info');
        this.render();
      });
    });
  }

  renderOpenRecruitmentHtml() {
    const recruitments = CampusRepository.openRecruitments;

    return `
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.users(20)} Rekrutmen Terbuka Organisasi
          </h3>
          <p class="section-subtitle">Pusat pendaftaran pengurus baru dengan pelacakan seleksi 4 tahapan terintegrasi.</p>
        </div>
        <button id="btnCreateOprec" class="btn btn-primary" style="font-size: 13px; padding: 8px 16px;">
          ${Icons.plus(15)} Buka Rekrutmen Baru
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${recruitments.length ? recruitments.map(rec => {
          let appStatusClass = 'pill-gray';
          if (rec.applicantStatus === 'ACCEPTED') appStatusClass = 'pill-green';
          if (rec.applicantStatus === 'PENDING') appStatusClass = 'pill-amber';
          if (rec.applicantStatus === 'REJECTED') appStatusClass = 'pill-red';

          const stageNames = ['Pendaftaran', 'Administrasi', 'Interview', 'Pengumuman'];
          const currentStageIdx = ['PENDAFTARAN', 'ADMINISTRASI', 'INTERVIEW', 'PENGUMUMAN'].indexOf(rec.currentStage);

          return `
            <div class="card" style="padding: 22px; margin-bottom: 0;">
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <span class="pill-badge pill-blue">Open Recruitment</span>
                <span class="pill-badge ${appStatusClass}">
                  <span class="badge-dot"></span> Status: ${ApplicantStatus[rec.applicantStatus]?.label || rec.applicantStatus}
                </span>
              </div>

              <h4 style="font-size: 18px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 2px;">
                ${rec.organizationName} &bull; ${rec.title}
              </h4>
              <div style="font-size: 13px; font-weight: 600; color: var(--primary); margin-bottom: 14px;">
                Batas Akhir: ${rec.deadline} &bull; ${rec.totalApplicants} Berkas Masuk
              </div>

              <!-- Clickable Positions -->
              <div style="margin-bottom: 16px;">
                <div style="font-size: 13.5px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 8px;">
                  Pilihan Formasi Tersedia:
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${rec.positions.map(p => {
                    const isSelected = rec.selectedPosition === p;
                    return `
                      <button class="pill-badge btn-choose-pos ${isSelected ? 'pill-blue' : 'pill-gray'}" data-id="${rec.id}" data-pos="${p}" style="
                        cursor: pointer;
                        border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
                        padding: 7px 14px;
                        font-size: 13px;
                      ">
                        ${isSelected ? `${Icons.check(13)} ` : ''}${p}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Stepper -->
              <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 16px;">
                <div style="font-size: 12px; font-weight: 700; color: var(--neutral-dark); text-transform: uppercase; margin-bottom: 10px;">
                  Tahap Seleksi: <span style="color: var(--primary);">${SelectionStage[rec.currentStage]?.label}</span>
                </div>
                <div class="stepper-container">
                  <div class="stepper-bar-bg">
                    <div class="stepper-bar-fill" style="width: ${(currentStageIdx / 3) * 100}%;"></div>
                  </div>
                  ${stageNames.map((s, idx) => `
                    <div class="stepper-step ${idx <= currentStageIdx ? 'active' : ''}">
                      <div class="step-circle">${idx + 1}</div>
                      <div class="step-label">${s}</div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <button class="btn btn-primary btn-advance-stage" data-id="${rec.id}" style="width: 100%;">
                ${rec.selectedPosition ? `${Icons.arrowRight(15)} Lanjutkan Tahap Seleksi` : `${Icons.check(15)} Pilih Formasi & Mendaftar`}
              </button>
            </div>
          `;
        }).join('') : `
          <div class="card" style="text-align: center; padding: 48px 24px; border: 1.5px dashed var(--border-color);">
            <div style="color: var(--neutral-muted); margin-bottom: 12px;">
              ${Icons.users(36)}
            </div>
            <h4 style="font-size: 17px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 6px;">
              Belum Ada Rekrutmen Dibuka
            </h4>
            <p style="font-size: 14px; color: var(--neutral-muted); max-width: 480px; margin: 0 auto 20px auto; line-height: 1.6;">
              Tidak ada rekrutmen pengurus yang aktif saat ini. Buka pendaftaran pengurus baru untuk organisasi Anda.
            </p>
            <button id="btnEmptyOprecAdd" class="btn btn-primary">
              ${Icons.plus(15)} Buka Pendaftaran Oprec Baru
            </button>
          </div>
        `}
      </div>
    `;
  }

  bindOpenRecruitmentEvents() {
    const btnCreate = document.getElementById('btnCreateOprec');
    if (btnCreate) btnCreate.addEventListener('click', () => this.showCreateOprecModal());

    const btnEmptyAdd = document.getElementById('btnEmptyOprecAdd');
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => this.showCreateOprecModal());

    document.querySelectorAll('.btn-choose-pos').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const pos = btn.getAttribute('data-pos');
        CampusRepository.applyToRecruitment(id, pos);
        this.showToast(`Pendaftaran formasi ${pos} berhasil dikirim`, 'success');
        this.render();
      });
    });

    document.querySelectorAll('.btn-advance-stage').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rec = CampusRepository.openRecruitments.find(r => r.id === id);
        if (!rec.selectedPosition) {
          CampusRepository.applyToRecruitment(id, rec.positions[0]);
          this.showToast(`Terdaftar pada formasi ${rec.positions[0]}`, 'info');
        } else {
          CampusRepository.advanceRecruitmentSelection(id, true);
          this.showToast(`Tahap seleksi diperbarui: ${SelectionStage[rec.currentStage]?.label}`, 'success');
        }
        this.render();
      });
    });
  }

  showRegisterOrgModal() {
    const bodyHtml = `
      <div class="form-group">
        <label class="form-label">Nama Singkatan Organisasi</label>
        <input type="text" id="roName" class="form-control" placeholder="Contoh: HIMATIF / GDSC" required>
      </div>
      <div class="form-group">
        <label class="form-label">Nama Lengkap Lembaga</label>
        <input type="text" id="roFullName" class="form-control" placeholder="Nama resmi organisasi kemahasiswaan">
      </div>
      <div class="form-group">
        <label class="form-label">Bidang / Kategori</label>
        <input type="text" id="roCategory" class="form-control" value="Teknologi" placeholder="Teknologi / Kepemimpinan / Sosial">
      </div>
      <div class="form-group">
        <label class="form-label">Nomor Surat Keputusan (SK)</label>
        <input type="text" id="roSk" class="form-control" placeholder="Contoh: SK/REKTOR/001/2026">
      </div>
      <div class="form-group">
        <label class="form-label">Dosen Pembina Pendamping</label>
        <input type="text" id="roAdvisor" class="form-control" placeholder="Nama dosen pembina">
      </div>
      <div class="form-group">
        <label class="form-label">Kontak Resmi Organisasi</label>
        <input type="text" id="roContact" class="form-control" placeholder="organisasi@campusimpact.ac.id">
      </div>
      <div class="form-group">
        <label class="form-label">Deskripsi Visi & Kegiatan</label>
        <textarea id="roDesc" class="form-control" rows="3" placeholder="Uraikan fokus pembinaan dan kontribusi organisasi..."></textarea>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="btnSubmitRegisterOrg" class="btn btn-primary">${Icons.check(15)} Daftarkan Organisasi</button>
    `;

    this.openModal('Pendaftaran Organisasi / UKM Baru', bodyHtml, footerHtml);

    document.getElementById('btnSubmitRegisterOrg').addEventListener('click', () => {
      const name = document.getElementById('roName').value;
      const fullName = document.getElementById('roFullName').value;
      const category = document.getElementById('roCategory').value;
      const skNumber = document.getElementById('roSk').value;
      const advisorName = document.getElementById('roAdvisor').value;
      const contact = document.getElementById('roContact').value;
      const description = document.getElementById('roDesc').value;

      if (!name) {
        this.showToast('Nama organisasi wajib diisi', 'warning');
        return;
      }

      CampusRepository.registerNewOrganization({
        name,
        fullName,
        category,
        skNumber,
        advisorName,
        contact,
        description
      });

      this.showToast(`Organisasi "${name}" berhasil didaftarkan`, 'success');
      this.closeModal();
      this.render();
    });
  }

  showCreateOprecModal() {
    const orgs = CampusRepository.organizations;
    const defaultOrg = orgs.length ? orgs[0].name : 'Lembaga Kemahasiswaan';

    const bodyHtml = `
      <div class="form-group">
        <label class="form-label">Nama Organisasi Penyelenggara</label>
        <input type="text" id="coOrgName" class="form-control" value="${defaultOrg}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Judul Rekrutmen Terbuka</label>
        <input type="text" id="coTitle" class="form-control" placeholder="Contoh: Open Recruitment Pengurus Periode 2027" required>
      </div>
      <div class="form-group">
        <label class="form-label">Divisi / Formasi Dibuka (Pisahkan dengan koma)</label>
        <input type="text" id="coPositions" class="form-control" placeholder="Contoh: PSDM, Riset, Humas, Medkom">
      </div>
      <div class="form-group">
        <label class="form-label">Batas Akhir Pendaftaran</label>
        <input type="text" id="coDeadline" class="form-control" value="30 September 2027">
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="btnSubmitCreateOprec" class="btn btn-primary">${Icons.upload(15)} Publikasikan Rekrutmen</button>
    `;

    this.openModal('Buka Rekrutmen Baru', bodyHtml, footerHtml);

    document.getElementById('btnSubmitCreateOprec').addEventListener('click', () => {
      const orgName = document.getElementById('coOrgName').value;
      const title = document.getElementById('coTitle').value;
      const positionsCsv = document.getElementById('coPositions').value;
      const deadline = document.getElementById('coDeadline').value;

      if (!title) {
        this.showToast('Judul rekrutmen wajib diisi', 'warning');
        return;
      }

      CampusRepository.createOpenRecruitment({
        orgName,
        title,
        positionsCsv,
        deadline
      });

      this.showToast(`Rekrutmen "${orgName}" berhasil dibuka`, 'success');
      this.closeModal();
      this.render();
    });
  }

  // =========================================================================
  // SCREEN 7: EVENT HUB & TIKET QR
  // =========================================================================
  renderEventsHub() {
    const types = ['Semua', ...Object.values(EventType).map(t => t.label)];

    const filtered = CampusRepository.events.filter(e => {
      if (this.selectedEventTypeFilter === 'Semua') return true;
      return (EventType[e.type]?.label || e.type).toLowerCase() === this.selectedEventTypeFilter.toLowerCase();
    });

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.event(20)} Event Hub & Presensi QR
          </h3>
          <p class="section-subtitle">Agenda kegiatan akademik, workshop keahlian, seminar nasional, dan pengabdian sosial.</p>
        </div>
        <button id="btnHeaderCreateEvent" class="btn btn-primary" style="font-size: 13px; padding: 8px 16px;">
          ${Icons.plus(15)} Terbitkan Event Baru
        </button>
      </div>

      <!-- Category Filter Chips -->
      <div class="filter-scroll-container">
        ${types.map(t => `
          <button class="filter-chip ${this.selectedEventTypeFilter === t ? 'active' : ''}" data-type="${t}">
            ${t}
          </button>
        `).join('')}
      </div>

      <!-- Event Cards List (Clean empty state if empty) -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${filtered.length ? filtered.map(event => {
          const quotaPercent = Math.min(100, Math.round(((event.registeredCount || 0) / event.quota) * 100));

          return `
            <div class="card" style="padding: 22px; margin-bottom: 0;">
              <!-- Badges -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                <span class="pill-badge pill-blue">${EventType[event.type]?.label || event.type}</span>
                <span class="pill-badge pill-green"><span class="badge-dot"></span> +${event.pointsReward} Poin Impact</span>
                ${event.isAttended ? '<span class="pill-badge pill-green"><span class="badge-dot"></span> Presensi Tervalidasi</span>' : ''}
                ${event.isRegistered && !event.isAttended ? '<span class="pill-badge pill-blue">Tiket Terbit</span>' : ''}
              </div>

              <h4 style="font-size: 18px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 2px;">
                ${event.title}
              </h4>
              <div style="font-size: 13px; font-weight: 600; color: var(--primary); margin-bottom: 10px;">
                Penyelenggara: ${event.organizerName} &bull; ${event.date} &bull; ${event.location}
              </div>

              <!-- Poster Description -->
              <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 12.5px; font-weight: 600; color: var(--neutral-dark); margin-bottom: 12px;">
                ${event.posterSummary}
              </div>

              <p style="font-size: 14px; color: var(--neutral-body); margin-bottom: 14px; line-height: 1.6;">
                ${event.description}
              </p>

              <!-- Quota Bar -->
              <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; color: var(--neutral-muted);">
                  <span>Kapasitas Pendaftar:</span>
                  <span>${event.registeredCount} / ${event.quota} (${quotaPercent}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: ${quotaPercent}%;"></div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${!event.isRegistered ? `
                  <button class="btn btn-primary btn-register-event" data-id="${event.id}" style="flex: 1;">
                    ${Icons.check(15)} Registrasi Peserta & Terbitkan Tiket QR
                  </button>
                ` : `
                  <button class="btn btn-secondary btn-view-qr" data-id="${event.id}" style="flex: 1;">
                    ${Icons.qrCode(15)} Tiket QR (${event.qrTicketCode})
                  </button>
                  <button class="btn ${event.isAttended ? 'btn-secondary' : 'btn-success'} btn-scan-qr" data-id="${event.id}" style="flex: 1;">
                    ${event.isAttended ? `${Icons.checkCircle(15)} Hadir Terverifikasi` : `${Icons.camera(15)} Validasi Presensi QR (+10)`}
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('') : `
          <div class="card" style="text-align: center; padding: 48px 24px; border: 1.5px dashed var(--border-color);">
            <div style="color: var(--neutral-muted); margin-bottom: 12px;">
              ${Icons.event(36)}
            </div>
            <h4 style="font-size: 17px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 6px;">
              Belum Ada Agenda Event
            </h4>
            <p style="font-size: 14px; color: var(--neutral-muted); max-width: 480px; margin: 0 auto 20px auto; line-height: 1.6;">
              Daftar kegiatan kampus masih kosong. Terbitkan seminar, workshop, webinar, atau aksi sosial pertama Anda.
            </p>
            <button id="btnEmptyEventAdd" class="btn btn-primary">
              ${Icons.plus(15)} Terbitkan Event Pertama
            </button>
          </div>
        `}
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedEventTypeFilter = btn.getAttribute('data-type');
        this.render();
      });
    });

    document.getElementById('btnHeaderCreateEvent').addEventListener('click', () => this.showCreateEventModal());

    const btnEmptyAdd = document.getElementById('btnEmptyEventAdd');
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => this.showCreateEventModal());

    document.querySelectorAll('.btn-register-event').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        CampusRepository.registerForEvent(id);
        const event = CampusRepository.events.find(e => e.id === id);
        this.showToast(`Pendaftaran terkonfirmasi. Kode tiket: ${event.qrTicketCode}`, 'success');
        this.render();
        this.showQrTicketModal(id);
      });
    });

    document.querySelectorAll('.btn-view-qr, .btn-scan-qr').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.showQrTicketModal(id);
      });
    });
  }

  showCreateEventModal() {
    const orgs = CampusRepository.organizations;
    const defaultOrg = orgs.length ? orgs[0].name : 'HIMATIF & BEM';

    const bodyHtml = `
      <div class="form-group">
        <label class="form-label">Nama Kegiatan</label>
        <input type="text" id="ceTitle" class="form-control" placeholder="Contoh: Workshop Pengembangan Solusi Berkelanjutan" required>
      </div>
      <div class="form-group">
        <label class="form-label">Lembaga Penyelenggara</label>
        <input type="text" id="ceOrganizer" class="form-control" value="${defaultOrg}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Kategori Event</label>
        <select id="ceType" class="form-control">
          ${Object.values(EventType).map(t => `<option value="${t.code}">${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Uraian Kegiatan</label>
        <textarea id="ceDesc" class="form-control" rows="3" placeholder="Uraikan materi, tujuan, dan sasaran peserta..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Waktu Pelaksanaan</label>
        <input type="text" id="ceDate" class="form-control" value="28 November 2026 &bull; 09:00 WIB">
      </div>
      <div class="form-group">
        <label class="form-label">Lokasi / Tautan Kegiatan</label>
        <input type="text" id="ceLocation" class="form-control" value="Auditorium Gedung Utama">
      </div>
      <div class="form-group">
        <label class="form-label">Kapasitas Maksimal Peserta</label>
        <input type="number" id="ceQuota" class="form-control" value="100" min="10">
      </div>
      <div class="form-group">
        <label class="form-label">Keterangan Tambahan / Poster</label>
        <input type="text" id="cePoster" class="form-control" value="Publikasi Resmi: E-Sertifikat MBKM & +10 Impact Score">
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="btnSubmitCreateEvent" class="btn btn-primary">${Icons.check(15)} Terbitkan Agenda</button>
    `;

    this.openModal('Pembuatan Agenda Kampus Baru', bodyHtml, footerHtml);

    document.getElementById('btnSubmitCreateEvent').addEventListener('click', () => {
      const title = document.getElementById('ceTitle').value;
      const organizer = document.getElementById('ceOrganizer').value;
      const type = document.getElementById('ceType').value;
      const description = document.getElementById('ceDesc').value;
      const date = document.getElementById('ceDate').value;
      const location = document.getElementById('ceLocation').value;
      const quota = document.getElementById('ceQuota').value;
      const posterCaption = document.getElementById('cePoster').value;

      if (!title) {
        this.showToast('Nama kegiatan wajib diisi', 'warning');
        return;
      }

      CampusRepository.createNewEvent({
        title,
        organizer,
        type,
        description,
        date,
        location,
        quota,
        posterCaption
      });

      this.showToast(`Event "${title}" berhasil diterbitkan`, 'success');
      this.closeModal();
      this.render();
    });
  }

  showQrTicketModal(eventId) {
    const event = CampusRepository.events.find(e => e.id === eventId);
    if (!event) return;

    const user = CampusRepository.currentUser;
    const qrPayload = `${event.qrTicketCode}|${user.id}|${event.title}`;
    const svgQr = QrCodeGenerator.generateSvgString(qrPayload, 200, '#0F172A', '#3B49DF');

    const bodyHtml = `
      <div style="text-align: center; padding: 10px 0;">
        <span class="pill-badge ${event.isAttended ? 'pill-green' : 'pill-blue'}" style="margin-bottom: 14px;">
          <span class="badge-dot"></span> ${event.isAttended ? 'Presensi Tervalidasi (+10 Poin)' : 'E-Ticket Resmi Campus Impact Hub'}
        </span>

        <h3 style="font-size: 19px; font-weight: 800; color: var(--neutral-dark); margin-bottom: 6px;">
          ${event.title}
        </h3>
        <div style="font-size: 13px; color: var(--neutral-muted); margin-bottom: 18px;">
          ${event.organizerName} &bull; ${EventType[event.type]?.label || event.type}<br>
          ${event.date} &bull; ${event.location}
        </div>

        <div style="display: flex; justify-content: center; margin-bottom: 16px;">
          ${svgQr}
        </div>

        <div style="
          display: inline-block;
          background: var(--surface-alt);
          border: 1px solid var(--border-color);
          padding: 8px 18px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: 14px;
          font-weight: 700;
          color: var(--neutral-dark);
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        ">
          KODE TIKET: ${event.qrTicketCode}
        </div>

        <div style="font-size: 12.5px; color: var(--neutral-muted); margin-bottom: 18px;">
          Pemilik Tiket: <strong>${user.name}</strong> (${user.identityNumber})
        </div>

        <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; text-align: left; margin-bottom: 18px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--neutral-dark); text-transform: uppercase; margin-bottom: 4px;">
            Validasi Presensi Hari-H:
          </div>
          <div style="font-size: 13px; color: var(--neutral-body);">
            ${event.isAttended 
              ? 'Kehadiran telah dicatat dalam sistem & Impact Score bertambah +10 poin.' 
              : 'Pindai kode QR pada meja registrasi panitia untuk mencatat presensi.'}
          </div>
        </div>

        ${!event.isAttended ? `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="btnScanAsAttendee" class="btn btn-primary">
              ${Icons.camera(15)} Simulasi Scan QR Peserta (+10 Poin)
            </button>
            <button id="btnScanAsCommittee" class="btn btn-secondary">
              ${Icons.leadership(15)} Presensi Panitia Pelaksana (+20 Poin)
            </button>
          </div>
        ` : `
          <div style="font-size: 13px; font-weight: 600; color: var(--success); text-align: center;">
            ${Icons.checkCircle(16)} Presensi kegiatan telah lengkap.
          </div>
        `}
      </div>
    `;

    this.openModal(`Tiket Elektronik: ${event.qrTicketCode}`, bodyHtml, `<button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>`);

    if (!event.isAttended) {
      document.getElementById('btnScanAsAttendee').addEventListener('click', () => {
        const pts = CampusRepository.confirmEventAttendanceByQr(event.id, false);
        this.showToast(`Presensi berhasil. Impact Score bertambah +${pts} poin`, 'success');
        this.closeModal();
        this.render();
      });

      document.getElementById('btnScanAsCommittee').addEventListener('click', () => {
        const pts = CampusRepository.confirmEventAttendanceByQr(event.id, true);
        this.showToast(`Presensi panitia tervalidasi (+${pts} Impact & +20 Leadership)`, 'success');
        this.closeModal();
        this.render();
      });
    }
  }

  // =========================================================================
  // SCREEN 9: MY IMPACT & PORTFOLIO HUB
  // =========================================================================
  renderImpactAndPortfolioHub() {
    const user = CampusRepository.currentUser;
    const rules = CampusRepository.activityPointRules;

    const pfCategories = ['Semua', 'Project Sosial', 'Organisasi', 'Event', 'Sertifikat', 'Prestasi'];
    const filteredPf = CampusRepository.portfolioEntries.filter(e => {
      if (this.selectedPortfolioFilter === 'Semua') return true;
      return e.category.toLowerCase() === this.selectedPortfolioFilter.toLowerCase();
    });

    const html = `
      <!-- Hero Score Box -->
      <div class="card hero-green" style="padding: 28px; margin-bottom: 24px;">
        <span class="pill-badge pill-green" style="background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.25); color: #FFFFFF; margin-bottom: 14px;">
          <span class="badge-dot" style="background: #A7F3D0;"></span> Analitik Kontribusi & Portofolio Dampak
        </span>
        <h2 style="font-size: 26px; font-weight: 800; letter-spacing: -0.4px; margin-bottom: 6px;">
          Dashboard Capaian Mahasiswa
        </h2>
        <p style="font-size: 13.5px; opacity: 0.9; margin-bottom: 20px;">
          Akumulasi poin dampak sosial, kepemimpinan organisasi, dan jam kerja sosial terverifikasi.
        </p>

        <!-- Dual Scores Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md); padding: 18px;">
            <div style="font-size: 13px; font-weight: 600; color: #A7F3D0; margin-bottom: 4px;">Impact Score</div>
            <div style="font-size: 38px; font-weight: 900; letter-spacing: -1px; line-height: 1.1;">${user.impactScore}</div>
            <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">Akumulasi Kontribusi Nyata</div>
          </div>

          <div style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md); padding: 18px;">
            <div style="font-size: 13px; font-weight: 600; color: #A7F3D0; margin-bottom: 4px;">Leadership Score</div>
            <div style="font-size: 38px; font-weight: 900; letter-spacing: -1px; line-height: 1.1;">${user.leadershipScore}</div>
            <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">Kepengurusan & Koordinasi Proyek</div>
          </div>
        </div>

        <!-- 4 Summary Metrics -->
        <div style="display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; background: rgba(0,0,0,0.18); padding: 12px 18px; border-radius: var(--radius-sm);">
          <span>Proyek Selesai: <strong>${user.projectsCompleted}</strong></span>
          <span>Mitra Didampingi: <strong>${user.umkmHelped}</strong></span>
          <span>Penerima Manfaat: <strong>${user.beneficiariesReached}+</strong></span>
          <span>Jam Kerja Sosial: <strong>${user.contributionHours} Jam</strong></span>
        </div>
      </div>

      <!-- Modul F: Activity Point System -->
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.award(20)} Standar Konversi Poin Aktivitas
          </h3>
          <p class="section-subtitle">Setiap aktivitas sosial dan kepemimpinan yang tervalidasi otomatis mengonversi poin.</p>
        </div>
      </div>

      <div class="card" style="padding: 20px; margin-bottom: 26px;">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${rules.map((r, idx) => `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; ${idx < rules.length - 1 ? 'border-bottom: 1px solid var(--border-color); padding-bottom: 12px;' : ''}">
              <div>
                <div style="font-size: 14px; font-weight: 700; color: var(--neutral-dark);">${r.activityName}</div>
                <div style="font-size: 12.5px; color: var(--neutral-muted);">${r.description}</div>
              </div>
              <span class="pill-badge pill-green" style="font-size: 12.5px; font-weight: 700;">
                +${r.points} Poin
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Student Portfolio Section -->
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.fileText(20)} Portofolio Capaian Terverifikasi
          </h3>
          <p class="section-subtitle">Dokumen rekam jejak kontribusi mahasiswa yang sah sebagai Surat Keterangan Pendamping Ijazah (SKPI).</p>
        </div>
        ${CampusRepository.portfolioEntries.length > 0 ? `
          <button id="btnExportPortfolio" class="section-action">
            ${Icons.printer(15)} Cetak Dokumen SKPI
          </button>
        ` : ''}
      </div>

      <!-- Filter chips -->
      <div class="filter-scroll-container">
        ${pfCategories.map(c => `
          <button class="filter-chip ${this.selectedPortfolioFilter === c ? 'active' : ''}" data-cat="${c}">
            ${c}
          </button>
        `).join('')}
      </div>

      <!-- Portfolio entries -->
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${filteredPf.length ? filteredPf.map(entry => `
          <div class="card" style="padding: 20px; margin-bottom: 0;">
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
              <span class="pill-badge pill-blue">${entry.category}</span>
              <span class="pill-badge pill-green"><span class="badge-dot"></span> +${entry.impactPoints} Impact</span>
              ${entry.leadershipPoints > 0 ? `<span class="pill-badge pill-amber"><span class="badge-dot"></span> +${entry.leadershipPoints} Leadership</span>` : ''}
            </div>

            <h4 style="font-size: 17px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 2px;">
              ${entry.title}
            </h4>
            <div style="font-size: 12.5px; font-weight: 600; color: var(--primary); margin-bottom: 8px;">
              ${entry.organizationOrPartner} &bull; ${entry.date} &bull; No: ${entry.credentialCode}
            </div>

            <p style="font-size: 13px; color: var(--neutral-muted); line-height: 1.55;">
              ${entry.outcomeSummary}
            </p>
          </div>
        `).join('') : `
          <div class="card" style="text-align: center; padding: 48px 24px; border: 1.5px dashed var(--border-color);">
            <div style="color: var(--neutral-muted); margin-bottom: 12px;">
              ${Icons.award(36)}
            </div>
            <h4 style="font-size: 17px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 6px;">
              Belum Ada Rekam Jejak Portofolio
            </h4>
            <p style="font-size: 14px; color: var(--neutral-muted); max-width: 480px; margin: 0 auto 20px auto; line-height: 1.6;">
              Portofolio Anda akan terisi secara otomatis ketika mendaftar proyek sosial, menghadiri event kampus via QR, atau bergabung dengan pengurus organisasi.
            </p>
            <button id="btnEmptyPortfolioExplore" class="btn btn-primary">
              ${Icons.project(15)} Eksplorasi Proyek Sosial
            </button>
          </div>
        `}
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedPortfolioFilter = btn.getAttribute('data-cat');
        this.render();
      });
    });

    const btnExport = document.getElementById('btnExportPortfolio');
    if (btnExport) btnExport.addEventListener('click', () => this.showExportPortfolioModal());

    const btnEmptyExplore = document.getElementById('btnEmptyPortfolioExplore');
    if (btnEmptyExplore) btnEmptyExplore.addEventListener('click', () => this.switchTab('projects'));
  }

  showExportPortfolioModal() {
    const user = CampusRepository.currentUser;

    const bodyHtml = `
      <div id="skpiDocumentPrintArea" style="padding: 10px 0; line-height: 1.6;">
        <div style="border-bottom: 2px solid var(--primary); padding-bottom: 14px; margin-bottom: 16px; text-align: center;">
          <h3 style="font-size: 17px; font-weight: 800; color: var(--neutral-dark); letter-spacing: -0.2px; margin-bottom: 2px;">
            CAMPUS IMPACT HUB &bull; DOKUMEN REKAM JEJAK PORTOFOLIO MAHASISWA
          </h3>
          <div style="font-size: 12px; color: var(--neutral-muted);">
            Surat Keterangan Pendamping Ijazah (SKPI) Bidang Pengabdian Masyarakat & Kepemimpinan
          </div>
        </div>

        <div style="background: var(--surface-alt); padding: 14px 18px; border-radius: var(--radius-sm); margin-bottom: 18px; font-size: 13px;">
          <div><strong>Nama Mahasiswa:</strong> ${user.name}</div>
          <div><strong>Nomor Induk Mahasiswa:</strong> ${user.identityNumber}</div>
          <div><strong>Program Studi:</strong> ${user.majorOrUnit}</div>
          <div><strong>Akumulasi Impact Score:</strong> ${user.impactScore} Poin</div>
          <div><strong>Akumulasi Leadership Score:</strong> ${user.leadershipScore} Poin</div>
          <div><strong>Total Kontribusi Sosial:</strong> ${user.projectsCompleted} Proyek &bull; ${user.umkmHelped} Mitra &bull; ${user.beneficiariesReached}+ Penerima Manfaat</div>
        </div>

        <div style="font-size: 13.5px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 10px;">
          Riwayat Aktivitas & Kontribusi Terakreditasi:
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px;">
          ${CampusRepository.portfolioEntries.length ? CampusRepository.portfolioEntries.map((e, idx) => `
            <div style="border-left: 2px solid var(--primary); padding-left: 12px; font-size: 12px;">
              <strong>${idx + 1}. ${e.title}</strong> (${e.category})<br>
              <span style="color: var(--neutral-muted);">${e.organizationOrPartner} &bull; ${e.date} &bull; Kredensial: ${e.credentialCode}</span><br>
              <em>${e.outcomeSummary}</em>
            </div>
          `).join('') : '<div style="color: var(--neutral-muted); font-size: 12px;">Belum ada entri portofolio yang tervalidasi.</div>'}
        </div>

        <div style="font-size: 12px; color: var(--success-dark); background: var(--success-light); border: 1px solid var(--success-border); padding: 10px 14px; border-radius: var(--radius-sm);">
          ${Icons.check(14)} Dokumen ini sah secara elektronik sebagai lampiran capaian pengabdian mahasiswa pada kurikulum perguruan tinggi.
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>
      <button id="btnPrintCv" class="btn btn-secondary">${Icons.printer(15)} Cetak Dokumen</button>
      <button id="btnCopyCvLink" class="btn btn-primary">${Icons.copy(15)} Salin Tautan Verifikasi</button>
    `;

    this.openModal('Portofolio & Rekam Jejak SKPI', bodyHtml, footerHtml);

    document.getElementById('btnPrintCv').addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btnCopyCvLink').addEventListener('click', () => {
      const shareUrl = `${window.location.origin}/#portfolio?user=${user.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Tautan verifikasi portofolio disalin ke clipboard', 'success');
      }).catch(() => {
        this.showToast(`Tautan: ${shareUrl}`, 'info');
      });
    });
  }

  // =========================================================================
  // SCREEN 10: PROFILE & TECH STACK
  // =========================================================================
  renderProfileScreen() {
    const user = CampusRepository.currentUser;
    const roleMeta = UserRole[user.role.toUpperCase()] || UserRole.STUDENT;

    const html = `
      <div class="card" style="padding: 26px; margin-bottom: 22px;">
        <div style="display: flex; gap: 18px; align-items: center; margin-bottom: 16px;">
          <div class="avatar-circle" style="width: 60px; height: 60px; font-size: 20px;">
            ${(user.name || 'CI').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--neutral-dark); margin-bottom: 2px;">
              ${user.name || 'Pengguna Terdaftar'}
            </h3>
            <div style="font-size: 13.5px; color: var(--neutral-body); margin-bottom: 2px;">
              ${user.majorOrUnit}
            </div>
            <div style="font-size: 12.5px; color: var(--neutral-muted);">
              ${user.email} &bull; ${user.identityNumber}
            </div>
          </div>
        </div>

        <p style="font-size: 13.5px; color: var(--neutral-body); line-height: 1.6; margin-bottom: 16px;">
          ${user.bio}
        </p>

        <!-- Competencies -->
        <div style="background: var(--surface-alt); border: 1px solid var(--border-color); padding: 14px 16px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 20px; line-height: 1.65;">
          <div><strong>Keahlian:</strong> ${user.skills.join(' &bull; ')}</div>
          <div><strong>Fokus Minat:</strong> ${user.interests.join(', ')}</div>
        </div>

        <!-- Role Change & Logout Actions -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="btnProfileSwitchRole" class="btn btn-primary" style="flex: 1; min-width: 160px;">
            ${Icons.user(15)} Beralih Peran (${roleMeta.label})
          </button>
          <button id="btnLogout" class="btn btn-outline" style="border-color: var(--danger); color: var(--danger); flex: 1; min-width: 160px;">
            ${Icons.auth(15)} Keluar dari Akun (Logout)
          </button>
        </div>
      </div>

      <!-- Cloud Architecture Overview -->
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.database(20)} Arsitektur Sistem & Database
          </h3>
          <p class="section-subtitle">Web Frontend &rarr; Supabase API &rarr; Supabase Auth &rarr; PostgreSQL &rarr; Storage Bucket</p>
        </div>
      </div>

      <div class="card" style="padding: 22px; margin-bottom: 22px;">
        <p style="font-size: 13px; color: var(--neutral-body); line-height: 1.7; margin-bottom: 16px;">
          <strong>Struktur Teknis Campus Impact Hub:</strong><br>
          1. <strong>Frontend:</strong> Single Page Application murni (HTML5, Modern CSS, ES6 Modules, Zero-Dependency)<br>
          2. <strong>REST & Realtime:</strong> Supabase API & Web Socket Protocol<br>
          3. <strong>Otentikasi Terpadu:</strong> Supabase Auth dengan Role-Based Access Control<br>
          4. <strong>Basis Data Relasional:</strong> PostgreSQL (Skema tabel Users, Projects, Organizations, Events, Impact Reports)<br>
          5. <strong>Media Storage:</strong> Penyimpanan berkas foto lapangan, SK organisasi, dan poster kegiatan
        </p>

        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="btnViewDbJson" class="btn btn-primary" style="flex: 1; min-width: 160px;">
            ${Icons.database(15)} Struktur Database JSON (Live Data)
          </button>
          <button id="btnLoadDemoData" class="btn btn-secondary" style="flex: 1; min-width: 160px;">
            ${Icons.sparkles(15)} Muat Data Contoh (Demo)
          </button>
          <button id="btnResetData" class="btn btn-outline" style="border-color: var(--danger); color: var(--danger); flex: 1; min-width: 160px;">
            ${Icons.refresh(15)} Kosongkan Semua Data
          </button>
        </div>
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.getElementById('btnProfileSwitchRole').addEventListener('click', () => this.showRoleSwitcherModal());

    document.getElementById('btnLogout').addEventListener('click', () => {
      CampusRepository.isLoggedIn = false;
      CampusRepository.saveState();
      this.showToast('Anda telah keluar dari akun. Silakan masuk kembali.', 'info');
      this.switchTab('auth');
    });

    document.getElementById('btnViewDbJson').addEventListener('click', () => {
      const jsonStr = CampusRepository.getMvpDatabaseJsonSnapshot();
      const bodyHtml = `
        <div style="font-size: 13px; color: var(--neutral-muted); margin-bottom: 10px;">
          Format data relasional sistem PostgreSQL / Supabase API:
        </div>
        <pre style="
          background: #0F172A;
          color: #38BDF8;
          padding: 16px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: 12px;
          max-height: 400px;
          overflow: auto;
          line-height: 1.45;
        ">${jsonStr}</pre>
      `;

      const footerHtml = `
        <button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>
        <button id="btnCopyJson" class="btn btn-primary">${Icons.copy(15)} Salin Data JSON</button>
      `;

      this.openModal('Struktur Database JSON (Supabase)', bodyHtml, footerHtml);

      document.getElementById('btnCopyJson').addEventListener('click', () => {
        navigator.clipboard.writeText(jsonStr).then(() => {
          this.showToast('Data JSON berhasil disalin ke clipboard', 'success');
        });
      });
    });

    document.getElementById('btnLoadDemoData').addEventListener('click', () => {
      CampusRepository.loadDemoData();
      this.showToast('Data contoh (demo) berhasil dimuat', 'success');
      this.render();
    });

    document.getElementById('btnResetData').addEventListener('click', () => {
      if (confirm('Konfirmasi pengosongan seluruh data ke kondisi awal (0)?')) {
        CampusRepository.resetToEmptyState();
        this.showToast('Seluruh data berhasil dikosongkan ke kondisi awal (0)', 'info');
        this.render();
      }
    });
  }

  // =========================================================================
  // ROLE SWITCHER MODAL
  // =========================================================================
  showRoleSwitcherModal() {
    const roles = Object.values(UserRole);
    const currentUser = CampusRepository.currentUser;

    const bodyHtml = `
      <p style="font-size: 13px; color: var(--neutral-muted); margin-bottom: 16px;">
        Pilih peran pengguna untuk menguji fitur platform dari perspektif pemangku kepentingan berbeda:
      </p>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${roles.map(r => {
          const isSelected = currentUser.role === r.code;
          return `
            <div class="card role-select-card" data-role="${r.code}" style="
              padding: 14px 16px;
              margin-bottom: 0;
              cursor: pointer;
              border: 1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
              background: ${isSelected ? 'var(--primary-light)' : 'var(--surface)'};
              transition: all 0.15s ease;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <div style="font-weight: 700; font-size: 14px; color: ${isSelected ? 'var(--primary)' : 'var(--neutral-dark)'};">
                  ${r.label} &bull; <span style="font-weight: 500; font-size: 12.5px; color: var(--neutral-muted);">${r.badgeTitle}</span>
                </div>
                ${isSelected ? `<span style="color: var(--primary); font-weight: 700;">${Icons.check(18)}</span>` : ''}
              </div>
              <div style="font-size: 12.5px; color: var(--neutral-muted);">
                ${r.description}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>
      <button id="btnModalGoAuth" class="btn btn-secondary">${Icons.auth(15)} Halaman Autentikasi</button>
    `;

    this.openModal('Pilih Peran Pengguna (Role)', bodyHtml, footerHtml);

    document.querySelectorAll('.role-select-card').forEach(card => {
      card.addEventListener('click', () => {
        const role = card.getAttribute('data-role');
        CampusRepository.switchRole(role);
        this.showToast(`Beralih ke peran: ${UserRole[role.toUpperCase()]?.label}`, 'success');
        this.closeModal();
        this.render();
      });
    });

    document.getElementById('btnModalGoAuth').addEventListener('click', () => {
      this.closeModal();
      this.switchTab('auth');
    });
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.app = new CampusImpactHubApp();
});
