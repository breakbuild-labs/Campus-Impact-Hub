/**
 * Campus Impact Hub - Main Application Orchestrator
 * Professional, Elegant Enterprise Edition (Zero Emojis, Pure SVG Icons)
 */

import { UserRole, ProjectStatus, VerificationStatus, SelectionStage, ApplicantStatus, EventType } from './models.js';
import { CampusRepository } from './repository.js';
import { QrCodeGenerator } from './qr.js';
import { Icons } from './icons.js';

class CampusImpactHubApp {
  constructor() {
    this.currentTab = 'home'; // 'auth', 'home', 'projects', 'organizations', 'events', 'impact', 'profile'
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
  }

  bindGlobalEvents() {
    // Navigation items
    document.querySelectorAll('[data-tab]').forEach(el => {
      el.addEventListener('click', () => {
        const targetTab = el.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    if (this.brandLogoEl) {
      this.brandLogoEl.addEventListener('click', () => this.switchTab('home'));
    }

    if (this.roleSwitcherBtn) {
      this.roleSwitcherBtn.addEventListener('click', () => this.showRoleSwitcherModal());
    }

    if (this.headerImpactPill) {
      this.headerImpactPill.addEventListener('click', () => this.switchTab('impact'));
    }
    if (this.headerLeadershipPill) {
      this.headerLeadershipPill.addEventListener('click', () => this.switchTab('impact'));
    }

    if (this.sidebarUserCard) {
      this.sidebarUserCard.addEventListener('click', () => this.switchTab('profile'));
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
    const user = CampusRepository.currentUser;
    const roleMeta = UserRole[user.role.toUpperCase()] || UserRole.STUDENT;

    if (this.roleSwitcherLabel) {
      this.roleSwitcherLabel.textContent = roleMeta.label;
    }
    if (this.headerImpactPill) {
      this.headerImpactPill.innerHTML = `<span class="indicator-dot"></span><span>Impact: <strong>${user.impactScore}</strong></span>`;
    }
    if (this.headerLeadershipPill) {
      this.headerLeadershipPill.innerHTML = `<span class="indicator-dot"></span><span>Leadership: <strong>${user.leadershipScore}</strong></span>`;
    }

    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');

    if (sidebarAvatar) {
      const parts = (user.name || 'CI').trim().split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]) : parts[0].slice(0, 2);
      sidebarAvatar.textContent = initials.toUpperCase();
    }
    if (sidebarUserName) sidebarUserName.textContent = user.name;
    if (sidebarUserRole) sidebarUserRole.textContent = roleMeta.label;

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
  // SCREEN 1: LOGIN & REGISTER (Supabase Auth + 4 Role Ekosistem)
  // =========================================================================
  renderAuthScreen() {
    const user = CampusRepository.currentUser;
    const roleKeys = Object.keys(UserRole);

    const html = `
      <div class="card hero-dark" style="margin-bottom: 24px; padding: 26px;">
        <span class="pill-badge pill-dark" style="margin-bottom: 12px;">
          <span class="badge-dot"></span> Modul 1 &bull; Autentikasi Supabase Multi-Role
        </span>
        <h2 style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px;">
          CAMPUS IMPACT HUB
        </h2>
        <p style="font-size: 13.5px; color: #94A3B8; margin-bottom: 10px;">
          "Menghubungkan Masalah, Talenta, Organisasi, dan Dampak dalam Satu Ekosistem Kampus."
        </p>
        <p style="font-size: 12px; color: #CBD5E1; line-height: 1.6; max-width: 680px;">
          Sistem autentikasi terpusat yang mendukung 4 pemangku kepentingan: Mahasiswa, Mitra Masyarakat, Pengurus Organisasi/UKM, serta Administrator Kampus.
        </p>
      </div>

      <div class="card" style="max-width: 580px; margin: 0 auto 30px auto; padding: 28px;">
        <!-- Auth Mode Toggle -->
        <div style="display: flex; gap: 8px; margin-bottom: 22px;">
          <button id="btnAuthLoginMode" class="btn ${!this.isRegisterMode ? 'btn-primary' : 'btn-outline'}" style="flex: 1;">
            ${Icons.auth(15)} Masuk
          </button>
          <button id="btnAuthRegisterMode" class="btn ${this.isRegisterMode ? 'btn-primary' : 'btn-outline'}" style="flex: 1;">
            ${Icons.user(15)} Registrasi Baru
          </button>
        </div>

        <form id="authForm">
          ${this.isRegisterMode ? `
            <div class="form-group">
              <label class="form-label">Nama Lengkap / Instansi</label>
              <input type="text" id="authNameInput" class="form-control" value="${user.name}" placeholder="Masukkan nama lengkap" required>
            </div>
            <div class="form-group">
              <label class="form-label">Program Studi / Unit Kerja</label>
              <input type="text" id="authMajorInput" class="form-control" value="${user.majorOrUnit}" placeholder="Contoh: S1 Teknik Informatika">
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">Alamat Email Terdaftar</label>
            <input type="email" id="authEmailInput" class="form-control" value="${user.email}" placeholder="user@campusimpact.ac.id" required>
          </div>

          <div class="form-group">
            <label class="form-label">Kata Sandi</label>
            <input type="password" id="authPassInput" class="form-control" value="campusimpact2026" placeholder="••••••••" required>
          </div>

          <div class="form-group" style="margin-top: 20px;">
            <label class="form-label" style="margin-bottom: 8px;">Pilih Peran Pengguna (Role Ekosistem):</label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${roleKeys.map(k => {
                const r = UserRole[k];
                const isSelected = user.role === r.code;
                return `
                  <div class="auth-role-card" data-role="${r.code}" style="
                    padding: 12px 16px;
                    border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
                    background: ${isSelected ? 'var(--primary-light)' : 'var(--surface)'};
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.15s ease;
                  ">
                    <div>
                      <div style="font-weight: 700; color: ${isSelected ? 'var(--primary)' : 'var(--neutral-dark)'}; font-size: 13px;">
                        ${r.label} &bull; <span style="font-weight: 500; font-size: 12px; color: var(--neutral-muted);">${r.badgeTitle}</span>
                      </div>
                      <div style="font-size: 11.5px; color: var(--neutral-muted); margin-top: 2px;">
                        ${r.description}
                      </div>
                    </div>
                    ${isSelected ? `<span style="color: var(--primary); font-weight: 700;">${Icons.check(18)}</span>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="margin-top: 22px; padding: 11px; font-size: 13.5px;">
            ${this.isRegisterMode ? 'Buat Akun & Lanjutkan' : 'Masuk ke Platform'}
          </button>
        </form>
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.getElementById('btnAuthLoginMode').addEventListener('click', () => {
      this.isRegisterMode = false;
      this.render();
    });
    document.getElementById('btnAuthRegisterMode').addEventListener('click', () => {
      this.isRegisterMode = true;
      this.render();
    });

    document.querySelectorAll('.auth-role-card').forEach(card => {
      card.addEventListener('click', () => {
        const role = card.getAttribute('data-role');
        CampusRepository.switchRole(role);
        this.render();
      });
    });

    document.getElementById('authForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmailInput').value;
      CampusRepository.currentUser.email = email;
      if (this.isRegisterMode) {
        const name = document.getElementById('authNameInput').value;
        const major = document.getElementById('authMajorInput').value;
        CampusRepository.currentUser.name = name;
        CampusRepository.currentUser.majorOrUnit = major;
      }
      CampusRepository.isLoggedIn = true;
      CampusRepository.saveState();

      this.showToast(`Autentikasi berhasil sebagai ${CampusRepository.currentUser.name}`, 'success');
      this.switchTab('home');
    });
  }

  // =========================================================================
  // SCREEN 2: HOME DASHBOARD + MODUL G (AI RECOMMENDATION HUB)
  // =========================================================================
  renderHomeDashboard() {
    const user = CampusRepository.currentUser;
    const roleMeta = UserRole[user.role.toUpperCase()] || UserRole.STUDENT;
    const aiMatch = CampusRepository.matchProblemWithAi(this.currentAiProblemQuery);
    const personalRec = CampusRepository.getAiStudentRecommendations(
      user.majorOrUnit,
      user.interests
    );

    const html = `
      <!-- Welcome Hero Banner -->
      <div class="card" style="padding: 22px; margin-bottom: 22px; border-color: #CBD5E1;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
          <span class="pill-badge pill-blue">
            <span class="badge-dot"></span> Role Aktif: ${roleMeta.label}
          </span>
          <span class="pill-badge pill-green">
            <span class="badge-dot"></span> Supabase Realtime Sinkron
          </span>
          <span class="pill-badge pill-gray">
            <span class="badge-dot"></span> Portofolio MBKM
          </span>
        </div>

        <h2 style="font-size: 21px; font-weight: 800; letter-spacing: -0.3px; color: var(--neutral-dark); margin-bottom: 4px;">
          Selamat datang, ${user.name}
        </h2>
        <p style="font-size: 13px; font-weight: 600; color: var(--primary); margin-bottom: 6px;">
          "Menghubungkan Masalah, Talenta, Organisasi, dan Dampak dalam Satu Ekosistem Kampus."
        </p>
        <p style="font-size: 12.5px; color: var(--neutral-muted); max-width: 800px; margin-bottom: 16px; line-height: 1.55;">
          Super app ekosistem kampus terpadu yang memfasilitasi pengabdian masyarakat terukur, marketplace proyek sosial, rekrutmen organisasi, manajemen event kampus, dan pencatatan portofolio prestasi pendamping ijazah (SKPI).
        </p>

        <!-- Quick Action Buttons -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="btnQuickSubmit" class="btn btn-primary" style="flex: 1; min-width: 140px;">
            ${Icons.plus(15)} Ajukan Masalah Mitra
          </button>
          <button id="btnQuickProjects" class="btn btn-secondary" style="flex: 1; min-width: 140px;">
            ${Icons.project(15)} Eksplorasi Proyek
          </button>
          <button id="btnQuickEvents" class="btn btn-outline" style="flex: 1; min-width: 140px;">
            ${Icons.qrCode(15)} Agenda & Tiket QR
          </button>
        </div>
      </div>

      <!-- 5 Indikator Analitik Ekosistem Kampus -->
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.activity(18)} Indikator Kinerja Ekosistem Kampus
          </h3>
          <p class="section-subtitle">Statistik real-time kontribusi mahasiswa, organisasi, event, proyek sosial, dan penerima manfaat.</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--primary-light); color: var(--primary);">
            ${Icons.users(20)}
          </div>
          <div class="stat-info">
            <div class="value">${CampusRepository.getTotalActiveStudents().toLocaleString()}</div>
            <div class="label">Mahasiswa Aktif</div>
            <div class="sublabel">Talenta Lintas Disiplin</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: var(--surface-alt); color: var(--neutral-charcoal);">
            ${Icons.organization(20)}
          </div>
          <div class="stat-info">
            <div class="value">${CampusRepository.getTotalOrganizations()} UKM</div>
            <div class="label">Organisasi Kampus</div>
            <div class="sublabel">${CampusRepository.getVerifiedOrganizationsCount()} Terverifikasi SK</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #F5F3FF; color: #7C3AED;">
            ${Icons.event(20)}
          </div>
          <div class="stat-info">
            <div class="value">${CampusRepository.getTotalEvents()} Agenda</div>
            <div class="label">Event Kampus</div>
            <div class="sublabel">Terintegrasi Tiket QR</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: var(--warning-light); color: var(--warning);">
            ${Icons.project(20)}
          </div>
          <div class="stat-info">
            <div class="value">${CampusRepository.getTotalProjects()} Proyek</div>
            <div class="label">Proyek Sosial</div>
            <div class="sublabel">UMKM, Desa & Sekolah</div>
          </div>
        </div>
      </div>

      <!-- Highlight Banner: Total Dampak -->
      <div class="card hero-green" id="cardTotalDampak" style="padding: 20px; cursor: pointer; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.5px; opacity: 0.85; margin-bottom: 4px; text-transform: uppercase;">
          Pengukuran Dampak Sosial Terverifikasi
        </div>
        <div style="font-size: 20px; font-weight: 800; margin-bottom: 6px;">
          ${CampusRepository.getTotalBeneficiaries().toLocaleString()}+ Penerima Manfaat &bull; ${user.umkmHelped} Entitas Masyarakat Terdampingi
        </div>
        <div style="font-size: 12px; opacity: 0.95; display: flex; gap: 18px; flex-wrap: wrap;">
          <span>Impact Score: <strong>${user.impactScore} Poin</strong></span>
          <span>Leadership Score: <strong>${user.leadershipScore} Poin</strong></span>
          <span>Jam Kontribusi: <strong>${user.contributionHours} Jam</strong></span>
          <span style="text-decoration: underline;">Buka Detail Portofolio &rarr;</span>
        </div>
      </div>

      <!-- Modul G — AI Recommendation Hub -->
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.sparkles(18)} AI Recommendation Hub
          </h3>
          <p class="section-subtitle">Pencocokan otomatis antara permasalahan masyarakat dengan kompetensi mahasiswa dan organisasi terkait.</p>
        </div>
      </div>

      <div class="card" style="padding: 22px; margin-bottom: 24px;">
        <span class="pill-badge pill-blue" style="margin-bottom: 12px;">
          <span class="badge-dot"></span> Mesin Analisis Kebutuhan Sosial (AI Problem Matching)
        </span>
        
        <div class="form-group" style="margin-bottom: 10px;">
          <label class="form-label">Deskripsi Permasalahan Mitra Masyarakat:</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="inputAiProblem" class="form-control" value="${this.currentAiProblemQuery}" placeholder="Contoh: Digitalisasi pembukuan dan kasir UMKM">
            <button id="btnRunAiMatch" class="btn btn-primary" style="white-space: nowrap;">
              ${Icons.search(14)} Analisis AI
            </button>
          </div>
        </div>

        <!-- Presets -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">
          <span style="font-size: 11.5px; font-weight: 600; color: var(--neutral-muted); align-self: center;">Pilihan Preset:</span>
          <button class="pill-badge pill-gray btn-ai-preset" data-query="Pemasaran online dan branding produk UMKM kuliner" style="cursor: pointer; border-color: var(--border-color);">
            Pemasaran & Branding UMKM
          </button>
          <button class="pill-badge pill-gray btn-ai-preset" data-query="Sistem pencatatan bank sampah dan lingkungan desa mandiri" style="cursor: pointer; border-color: var(--border-color);">
            Bank Sampah Desa
          </button>
          <button class="pill-badge pill-gray btn-ai-preset" data-query="Media modul pembelajaran interaktif sekolah dasar" style="cursor: pointer; border-color: var(--border-color);">
            Media Edukasi Sekolah
          </button>
        </div>

        <!-- AI Match Result Box -->
        <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px;">
          <div style="font-weight: 700; font-size: 12.5px; color: var(--neutral-dark); margin-bottom: 6px;">
            Rekomendasi Hasil Pemetaan AI:
          </div>
          <div style="font-size: 12px; color: var(--neutral-body); line-height: 1.6;">
            <div>&bull; <strong>Kategori Solusi:</strong> ${aiMatch.category}</div>
            <div>&bull; <strong>Kebutuhan Disiplin Ilmu:</strong> ${aiMatch.recommendedMajors.join(', ')}</div>
            <div>&bull; <strong>Estimasi Nilai Dampak:</strong> +${aiMatch.suggestedImpactScore} Poin (${aiMatch.estimatedImpact})</div>
            <div>&bull; <strong>Judul Inisiatif Rekomendasi:</strong> ${aiMatch.recommendedSolutionTitle}</div>
          </div>
        </div>

        <!-- AI Student Recommendations -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 14px;">
          <div style="font-size: 13.5px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 4px;">
            Rekomendasi Personal untuk Mahasiswa
          </div>
          <div style="font-size: 11.5px; color: var(--neutral-muted); margin-bottom: 8px;">
            Disesuaikan dengan Profil: <strong>${user.majorOrUnit}</strong> &bull; Minat: <strong>${user.interests.join(', ')}</strong>
          </div>
          <div style="font-size: 12px; color: var(--neutral-body); line-height: 1.6;">
            <div>&bull; <strong>Organisasi Terkait:</strong> ${personalRec.recommendedOrganizations.join(', ')}</div>
            <div>&bull; <strong>Kegiatan Relevan:</strong> ${personalRec.recommendedEvents.join(', ')}</div>
            <div>&bull; <strong>Proyek Mitra Terpilih:</strong> ${personalRec.recommendedProjects.join(' &bull; ')}</div>
          </div>
        </div>
      </div>

      <!-- Priority Projects Preview -->
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.project(18)} Proyek Dampak Sosial Prioritas
          </h3>
          <p class="section-subtitle">Masalah nyata dari mitra masyarakat yang membutuhkan kolaborasi tim mahasiswa.</p>
        </div>
        <button id="btnViewAllProjects" class="section-action">
          Katalog Lengkap (${CampusRepository.projects.length}) ${Icons.arrowRight(12)}
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${CampusRepository.projects.slice(0, 2).map(p => this.renderProjectCardHtml(p)).join('')}
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.getElementById('btnQuickSubmit').addEventListener('click', () => this.showSubmitProblemModal());
    document.getElementById('btnQuickProjects').addEventListener('click', () => this.switchTab('projects'));
    document.getElementById('btnQuickEvents').addEventListener('click', () => this.switchTab('events'));
    document.getElementById('cardTotalDampak').addEventListener('click', () => this.switchTab('impact'));
    document.getElementById('btnViewAllProjects').addEventListener('click', () => this.switchTab('projects'));

    document.getElementById('btnRunAiMatch').addEventListener('click', () => {
      const q = document.getElementById('inputAiProblem').value.trim();
      this.currentAiProblemQuery = q || 'Pencatatan keuangan dan digitalisasi UMKM';
      this.render();
      this.showToast('Pemetaan masalah selesai dianalisis oleh AI', 'success');
    });

    document.querySelectorAll('.btn-ai-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentAiProblemQuery = btn.getAttribute('data-query');
        this.render();
        this.showToast('Analisis preset diperbarui', 'info');
      });
    });

    this.bindProjectCardEvents();
  }

  // =========================================================================
  // SCREEN 3: PROJECT MARKETPLACE (MODUL A)
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
            ${Icons.project(18)} Social Impact Hub
          </h3>
          <p class="section-subtitle">Marketplace proyek pengabdian: Menghubungkan masalah masyarakat dengan solusi kolaboratif mahasiswa.</p>
        </div>
        <button id="btnHeaderSubmitProblem" class="btn btn-primary" style="font-size: 12px; padding: 6px 14px;">
          ${Icons.plus(14)} Ajukan Masalah Baru
        </button>
      </div>

      <!-- Call-To-Action Banner -->
      <div class="card" style="background: var(--surface-alt); border-color: var(--border-color); padding: 18px; margin-bottom: 20px;">
        <div style="font-weight: 700; font-size: 13.5px; color: var(--neutral-dark); margin-bottom: 4px;">
          Pengajuan Permasalahan Mitra Masyarakat
        </div>
        <p style="font-size: 12px; color: var(--neutral-muted); margin-bottom: 12px; line-height: 1.5;">
          Perwakilan UMKM, Desa, Sekolah, atau Komunitas dapat mendaftarkan kendala operasional untuk dicarikan solusi oleh tim mahasiswa lintas jurusan melalui program pengabdian dan MBKM.
        </p>
        <button id="btnBannerSubmitProblem" class="btn btn-secondary" style="font-size: 12px;">
          ${Icons.upload(14)} Buka Formulir Pengajuan Masalah
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

      <!-- Project Cards List -->
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${filtered.length ? filtered.map(p => this.renderProjectCardHtml(p)).join('') : `
          <div class="card" style="text-align: center; padding: 40px; color: var(--neutral-muted);">
            Tidak ditemukan proyek sosial dalam kategori "${this.selectedProjectCategoryFilter}".
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

    this.bindProjectCardEvents();
  }

  renderProjectCardHtml(project) {
    let statusPillClass = 'pill-blue';
    if (project.status === 'ON_GOING') statusPillClass = 'pill-amber';
    if (project.status === 'COMPLETED') statusPillClass = 'pill-green';

    return `
      <div class="card project-card" data-id="${project.id}" style="padding: 20px; margin-bottom: 0;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 10px;">
          <span class="pill-badge pill-blue">${project.category}</span>
          <span class="pill-badge pill-green">
            <span class="badge-dot"></span> Impact Score: ${project.impactScore}
          </span>
          <span class="pill-badge ${statusPillClass}">
            <span class="badge-dot"></span> ${ProjectStatus[project.status]?.label || project.status}
          </span>
          <span class="pill-badge pill-gray">
            ${Icons.users(12)} ${project.applicantCount || 0} Pendaftar
          </span>
        </div>

        <h4 style="font-size: 16.5px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 2px;">
          ${project.title}
        </h4>
        <div style="font-size: 12px; font-weight: 600; color: var(--primary); margin-bottom: 8px;">
          Mitra: ${project.organizationName} &bull; ${project.location}
        </div>

        <p style="font-size: 12.5px; color: var(--neutral-body); margin-bottom: 12px; line-height: 1.55;">
          ${project.description}
        </p>

        <div style="font-size: 12px; color: var(--neutral-dark); margin-bottom: 12px;">
          <strong>Kebutuhan Kompetensi:</strong> <span style="color: var(--neutral-muted);">${project.requirements.join(' &bull; ')}</span>
        </div>

        <!-- Impact Report Box -->
        <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--neutral-dark); text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 3px;">
            Laporan Dampak &bull; Estimasi ${project.impactReport?.beneficiaries || 0} Penerima Manfaat
          </div>
          <div style="font-size: 11.5px; color: var(--neutral-muted); line-height: 1.5;">
            <span>Kondisi Awal: ${project.impactReport?.beforeCondition || '-'}</span><br>
            <span>Target Capaian: ${project.impactReport?.afterCondition || '-'}</span>
          </div>
        </div>

        ${project.userApplicationState !== 'NONE' ? `
          <div style="margin-bottom: 14px; font-size: 11.5px; font-weight: 600; color: var(--primary); background: var(--primary-light); border: 1px solid var(--primary-border); padding: 8px 12px; border-radius: var(--radius-sm);">
            ${project.userApplicationState === 'APPROVED' 
              ? 'Status Registrasi: Disetujui (' + project.userRoleInProject + ')' 
              : 'Status Registrasi: Menunggu Konfirmasi Mitra (' + project.userRoleInProject + ')'}
          </div>
        ` : ''}

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-project-detail" data-id="${project.id}" style="flex: 1; min-width: 120px;">
            ${Icons.eye(14)} Rincian Proyek
          </button>
          <button class="btn btn-primary btn-project-apply" data-id="${project.id}" style="flex: 1; min-width: 160px;">
            ${project.userApplicationState === 'NONE' 
              ? `${Icons.arrowRight(14)} Daftar Proyek (+50 Poin)` 
              : `${Icons.leadership(14)} Tingkatkan ke Ketua Tim (+75)`}
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
      <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;">
        <span class="pill-badge pill-blue">${project.category}</span>
        <span class="pill-badge pill-green"><span class="badge-dot"></span> Impact Score: ${project.impactScore}</span>
        <span class="pill-badge pill-amber"><span class="badge-dot"></span> ${ProjectStatus[project.status]?.label || project.status}</span>
      </div>

      <h3 style="font-size: 18px; font-weight: 800; color: var(--neutral-dark); margin-bottom: 4px;">
        ${project.title}
      </h3>
      <div style="font-size: 12px; font-weight: 600; color: var(--primary); margin-bottom: 14px;">
        Mitra Pengusul: ${project.organizationName} &bull; Lokasi: ${project.location}
      </div>

      <!-- Photo / Documentation Box -->
      <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 14px;">
        <div style="font-size: 11.5px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 3px;">
          Dokumentasi Permasalahan: ${project.photoCaption}
        </div>
        <div style="font-size: 12px; color: var(--neutral-body); line-height: 1.55;">
          ${project.description}
        </div>
      </div>

      <div style="margin-bottom: 14px;">
        <div style="font-size: 12px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 6px;">
          Kebutuhan Keahlian Mahasiswa:
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${project.requirements.map(r => `<span class="pill-badge pill-gray">${r}</span>`).join('')}
        </div>
      </div>

      <!-- Application Flow -->
      <div style="background: var(--primary-light); border: 1px solid var(--primary-border); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 3px;">
          Alur Seleksi & Penugasan:
        </div>
        <div style="font-size: 12px; font-weight: 600; color: var(--neutral-dark);">
          ${flowStepText}
        </div>
      </div>

      <!-- Impact Report Section -->
      <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 6px;">
          Laporan Dampak Terukur (Impact Assessment)
        </div>
        <div style="font-size: 12px; color: var(--neutral-body); line-height: 1.6;">
          <div>&bull; <strong>Kondisi Sebelum:</strong> ${project.impactReport?.beforeCondition}</div>
          <div>&bull; <strong>Target Sesudah:</strong> ${project.impactReport?.afterCondition}</div>
          <div>&bull; <strong>Penerima Manfaat Langsung:</strong> ${project.impactReport?.beneficiaries} Orang</div>
          <div>&bull; <strong>Relevansi SDG:</strong> ${project.impactReport?.sdgCategory}</div>
          <div>&bull; <strong>Ulasan Mitra:</strong> "${project.impactReport?.partnerFeedback}"</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="modalBtnApplyMember" class="btn btn-primary">
          ${Icons.arrowRight(14)} Daftar sebagai Anggota Tim (+50 Impact Score)
        </button>
        <button id="modalBtnApplyLeader" class="btn btn-secondary">
          ${Icons.leadership(14)} Daftar sebagai Ketua Tim (+75 Impact & +75 Leadership)
        </button>
        <button id="modalBtnCycleStatus" class="btn btn-outline">
          ${Icons.refresh(14)} Perbarui Status Progress (${ProjectStatus[project.status]?.label})
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
      <p style="font-size: 12px; color: var(--neutral-muted); margin-bottom: 14px;">
        Formulir pengajuan masalah mitra masyarakat untuk dicarikan solusi oleh talenta mahasiswa melalui AI Problem Matching.
      </p>

      <div class="form-group">
        <label class="form-label">Nama Instansi / Entitas Mitra</label>
        <input type="text" id="spOrgName" class="form-control" value="UMKM Berkah Mandiri" placeholder="Contoh: Koperasi Desa / UMKM Maju" required>
      </div>

      <div class="form-group">
        <label class="form-label">Judul Kendala / Kebutuhan</label>
        <input type="text" id="spTitle" class="form-control" value="Pencatatan kasir dan optimasi katalog digital" placeholder="Judul ringkas kendala" required>
      </div>

      <div class="form-group">
        <label class="form-label">Uraian Masalah Lengkap</label>
        <textarea id="spDesc" class="form-control" rows="3" placeholder="Uraikan kendala operasional yang dihadapi...">Pencatatan stok dan transaksi harian masih menggunakan pembukuan konvensional sehingga rawan selisih.</textarea>
      </div>

      <div style="margin-bottom: 14px;">
        <button type="button" id="spBtnAiFill" class="btn btn-secondary btn-block" style="font-size: 12px;">
          ${Icons.sparkles(14)} Analisis Otomatis Menggunakan AI Problem Matching
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Kategori Inisiatif</label>
        <input type="text" id="spCategory" class="form-control" value="Teknologi & Digitalisasi" placeholder="Teknologi / Lingkungan / Pendidikan">
      </div>

      <div class="form-group">
        <label class="form-label">Lokasi Mitra</label>
        <input type="text" id="spLocation" class="form-control" value="Kec. Sukasari, Kota Bandung" placeholder="Kota / Kabupaten">
      </div>

      <div class="form-group">
        <label class="form-label">Dokumentasi Terlampir</label>
        <input type="text" id="spPhoto" class="form-control" value="dokumen_lapangan_umkm_berkah.jpg" placeholder="Nama berkas atau keterangan foto">
      </div>

      <div class="form-group">
        <label class="form-label">Kompetensi yang Dibutuhkan</label>
        <input type="text" id="spRequirements" class="form-control" value="2 Informatika, 1 Bisnis Digital" placeholder="Pisahkan dengan koma">
      </div>

      <div class="form-group">
        <label class="form-label">Estimasi Jumlah Penerima Manfaat</label>
        <input type="number" id="spBeneficiaries" class="form-control" value="120" min="10">
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="spBtnSubmit" class="btn btn-primary">${Icons.upload(14)} Submit ke Marketplace</button>
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

      this.showToast(`Inisiatif "${created.title}" berhasil dipublikasikan`, 'success');
      this.closeModal();
      this.switchTab('projects');
    });
  }

  // =========================================================================
  // SCREEN 5 & 6: ORGANIZATION HUB & OPEN RECRUITMENT
  // =========================================================================
  renderOrganizationsHub() {
    const html = `
      <div style="display: flex; gap: 8px; margin-bottom: 20px;">
        <button id="btnSubTabDirectory" class="btn ${this.selectedOrgSubTab === 0 ? 'btn-primary' : 'btn-outline'}" style="flex: 1;">
          ${Icons.organization(15)} Direktori Organisasi (${CampusRepository.organizations.length})
        </button>
        <button id="btnSubTabOprec" class="btn ${this.selectedOrgSubTab === 1 ? 'btn-primary' : 'btn-outline'}" style="flex: 1;">
          ${Icons.users(15)} Open Recruitment (${CampusRepository.openRecruitments.length})
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
            ${Icons.organization(18)} Direktori Organisasi Kampus
          </h3>
          <p class="section-subtitle">Daftar lembaga eksekutif, himpunan mahasiswa, dan unit kegiatan mahasiswa resmi.</p>
        </div>
        <button id="btnRegisterOrg" class="btn btn-primary" style="font-size: 12px; padding: 6px 14px;">
          ${Icons.plus(14)} Registrasi UKM Baru
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${orgs.map(org => {
          let badgePill = '<span class="pill-badge pill-green"><span class="badge-dot"></span> Verified Organization</span>';
          if (org.verificationStatus === 'PENDING') badgePill = '<span class="pill-badge pill-amber"><span class="badge-dot"></span> Menunggu Verifikasi SK</span>';
          if (org.verificationStatus === 'REJECTED') badgePill = '<span class="pill-badge pill-red"><span class="badge-dot"></span> Ditolak</span>';

          return `
            <div class="card" style="padding: 20px; margin-bottom: 0;">
              <!-- Header Row -->
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
                <div style="
                  width: 44px;
                  height: 44px;
                  border-radius: var(--radius-sm);
                  background: var(--neutral-dark);
                  color: #FFFFFF;
                  font-weight: 700;
                  font-size: 14px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  letter-spacing: 0.5px;
                ">
                  ${org.logoInitials}
                </div>
                <div style="flex: 1; overflow: hidden;">
                  <h4 style="font-size: 16.5px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 2px;">
                    ${org.name} <span style="font-size: 12px; font-weight: 500; color: var(--neutral-muted);">(${org.id})</span>
                  </h4>
                  <div style="font-size: 12px; color: var(--neutral-muted);">
                    ${org.fullName} &bull; ${org.category}
                  </div>
                </div>
              </div>

              <!-- Badges -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                ${badgePill}
                <span class="pill-badge pill-blue">
                  ${Icons.users(12)} ${org.memberCount} Anggota Terdaftar
                </span>
                ${org.isUserJoined ? '<span class="pill-badge pill-green"><span class="badge-dot"></span> Pengurus Aktif</span>' : ''}
              </div>

              <p style="font-size: 12.5px; color: var(--neutral-body); margin-bottom: 12px; line-height: 1.55;">
                ${org.description}
              </p>

              <div style="font-size: 11.5px; color: var(--neutral-muted); background: var(--surface-alt); padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: 14px; line-height: 1.6;">
                <div><strong>SK Pengesahan:</strong> ${org.skNumber}</div>
                <div><strong>Dosen Pembina:</strong> ${org.advisorName}</div>
                <div><strong>Kontak Resmi:</strong> ${org.contact}</div>
              </div>

              <!-- Actions -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
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
        }).join('')}
      </div>
    `;
  }

  bindOrganizationDirectoryEvents() {
    document.getElementById('btnRegisterOrg').addEventListener('click', () => this.showRegisterOrgModal());

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
            ${Icons.users(18)} Rekrutmen Terbuka Organisasi
          </h3>
          <p class="section-subtitle">Pusat pendaftaran pengurus baru dengan pelacakan seleksi 4 tahapan terintegrasi.</p>
        </div>
        <button id="btnCreateOprec" class="btn btn-primary" style="font-size: 12px; padding: 6px 14px;">
          ${Icons.plus(14)} Buka Rekrutmen
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${recruitments.map(rec => {
          let appStatusClass = 'pill-gray';
          if (rec.applicantStatus === 'ACCEPTED') appStatusClass = 'pill-green';
          if (rec.applicantStatus === 'PENDING') appStatusClass = 'pill-amber';
          if (rec.applicantStatus === 'REJECTED') appStatusClass = 'pill-red';

          const stageNames = ['Pendaftaran', 'Administrasi', 'Interview', 'Pengumuman'];
          const currentStageIdx = ['PENDAFTARAN', 'ADMINISTRASI', 'INTERVIEW', 'PENGUMUMAN'].indexOf(rec.currentStage);

          return `
            <div class="card" style="padding: 20px; margin-bottom: 0;">
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <span class="pill-badge pill-blue">Open Recruitment</span>
                <span class="pill-badge ${appStatusClass}">
                  <span class="badge-dot"></span> Status: ${ApplicantStatus[rec.applicantStatus]?.label || rec.applicantStatus}
                </span>
              </div>

              <h4 style="font-size: 16.5px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 2px;">
                ${rec.organizationName} &bull; ${rec.title}
              </h4>
              <div style="font-size: 12px; font-weight: 600; color: var(--primary); margin-bottom: 12px;">
                Batas Akhir: ${rec.deadline} &bull; ${rec.totalApplicants} Berkas Masuk
              </div>

              <!-- Clickable Positions -->
              <div style="margin-bottom: 14px;">
                <div style="font-size: 12px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 6px;">
                  Pilihan Formasi Tersedia:
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  ${rec.positions.map(p => {
                    const isSelected = rec.selectedPosition === p;
                    return `
                      <button class="pill-badge btn-choose-pos ${isSelected ? 'pill-blue' : 'pill-gray'}" data-id="${rec.id}" data-pos="${p}" style="
                        cursor: pointer;
                        border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
                        padding: 6px 12px;
                        font-size: 12px;
                      ">
                        ${isSelected ? `${Icons.check(12)} ` : ''}${p}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Stepper -->
              <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 14px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--neutral-dark); text-transform: uppercase; margin-bottom: 8px;">
                  Tahap Seleksi Saat Ini: <span style="color: var(--primary);">${SelectionStage[rec.currentStage]?.label}</span>
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
                ${rec.selectedPosition ? `${Icons.arrowRight(14)} Lanjutkan Tahap Seleksi` : `${Icons.check(14)} Pilih Formasi & Mendaftar`}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  bindOpenRecruitmentEvents() {
    document.getElementById('btnCreateOprec').addEventListener('click', () => this.showCreateOprecModal());

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
        <input type="text" id="roName" class="form-control" value="UKM Robotika & Otomasi" placeholder="Contoh: HIMATIF / GDSC" required>
      </div>
      <div class="form-group">
        <label class="form-label">Nama Lengkap Lembaga</label>
        <input type="text" id="roFullName" class="form-control" value="Unit Kegiatan Mahasiswa Riset Robotika & Otomasi" placeholder="Nama resmi organisasi">
      </div>
      <div class="form-group">
        <label class="form-label">Bidang / Kategori</label>
        <input type="text" id="roCategory" class="form-control" value="Sains & Teknologi" placeholder="Technology / Social / Arts">
      </div>
      <div class="form-group">
        <label class="form-label">Nomor Surat Keputusan (SK)</label>
        <input type="text" id="roSk" class="form-control" value="SK/KEMAHASISWAAN/052/2026" placeholder="SK/REKTOR/052/2026">
      </div>
      <div class="form-group">
        <label class="form-label">Dosen Pembina Pendamping</label>
        <input type="text" id="roAdvisor" class="form-control" value="Dr. Eng. Fajar Pratama, S.T., M.T." placeholder="Nama dosen pembina">
      </div>
      <div class="form-group">
        <label class="form-label">Kontak Resmi Organisasi</label>
        <input type="text" id="roContact" class="form-control" value="robotika@campusimpact.ac.id" placeholder="email@kampus.ac.id">
      </div>
      <div class="form-group">
        <label class="form-label">Deskripsi Visi & Kegiatan</label>
        <textarea id="roDesc" class="form-control" rows="3">Wadah pembinaan riset otomasi tepat guna dan kompetisi teknologi tingkat nasional.</textarea>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="btnSubmitRegisterOrg" class="btn btn-primary">${Icons.check(14)} Ajukan Registrasi Organisasi</button>
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

      CampusRepository.registerNewOrganization({
        name,
        fullName,
        category,
        skNumber,
        advisorName,
        contact,
        description
      });

      this.showToast(`Pendaftaran ${name} berhasil diajukan`, 'success');
      this.closeModal();
      this.render();
    });
  }

  showCreateOprecModal() {
    const bodyHtml = `
      <div class="form-group">
        <label class="form-label">Nama Organisasi Penyelenggara</label>
        <input type="text" id="coOrgName" class="form-control" value="BEM Fakultas Teknik" required>
      </div>
      <div class="form-group">
        <label class="form-label">Judul Rekrutmen Terbuka</label>
        <input type="text" id="coTitle" class="form-control" value="Open Recruitment Kabinet Kolaborasi 2027" required>
      </div>
      <div class="form-group">
        <label class="form-label">Divisi / Formasi Dibuka (Pisahkan dengan koma)</label>
        <input type="text" id="coPositions" class="form-control" value="PSDM, Advokasi, Media Komunikasi, Pengabdian Masyarakat">
      </div>
      <div class="form-group">
        <label class="form-label">Batas Akhir Pendaftaran</label>
        <input type="text" id="coDeadline" class="form-control" value="20 Agustus 2027">
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="btnSubmitCreateOprec" class="btn btn-primary">${Icons.upload(14)} Publikasikan Rekrutmen</button>
    `;

    this.openModal('Buka Rekrutmen Baru', bodyHtml, footerHtml);

    document.getElementById('btnSubmitCreateOprec').addEventListener('click', () => {
      const orgName = document.getElementById('coOrgName').value;
      const title = document.getElementById('coTitle').value;
      const positionsCsv = document.getElementById('coPositions').value;
      const deadline = document.getElementById('coDeadline').value;

      CampusRepository.createOpenRecruitment({
        orgName,
        title,
        positionsCsv,
        deadline
      });

      this.showToast(`Rekrutmen ${orgName} berhasil dipublikasikan`, 'success');
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
            ${Icons.event(18)} Event Hub & Presensi QR
          </h3>
          <p class="section-subtitle">Agenda kegiatan akademik, workshop keahlian, seminar nasional, dan pengabdian sosial.</p>
        </div>
        <button id="btnHeaderCreateEvent" class="btn btn-primary" style="font-size: 12px; padding: 6px 14px;">
          ${Icons.plus(14)} Buat Event Baru
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

      <!-- Event Cards -->
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${filtered.map(event => {
          const quotaPercent = Math.min(100, Math.round(((event.registeredCount || 0) / event.quota) * 100));

          return `
            <div class="card" style="padding: 20px; margin-bottom: 0;">
              <!-- Badges -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <span class="pill-badge pill-blue">${EventType[event.type]?.label || event.type}</span>
                <span class="pill-badge pill-green"><span class="badge-dot"></span> +${event.pointsReward} Poin Impact</span>
                ${event.isAttended ? '<span class="pill-badge pill-green"><span class="badge-dot"></span> Kehadiran Tervalidasi</span>' : ''}
                ${event.isRegistered && !event.isAttended ? '<span class="pill-badge pill-blue">Tiket Terbit</span>' : ''}
              </div>

              <h4 style="font-size: 16.5px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 2px;">
                ${event.title}
              </h4>
              <div style="font-size: 12px; font-weight: 600; color: var(--primary); margin-bottom: 8px;">
                Penyelenggara: ${event.organizerName} &bull; ${event.date} &bull; ${event.location}
              </div>

              <!-- Poster Description -->
              <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 11.5px; font-weight: 600; color: var(--neutral-dark); margin-bottom: 10px;">
                ${event.posterSummary}
              </div>

              <p style="font-size: 12.5px; color: var(--neutral-body); margin-bottom: 12px; line-height: 1.55;">
                ${event.description}
              </p>

              <!-- Quota Bar -->
              <div style="margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 600; color: var(--neutral-muted);">
                  <span>Kapasitas Peserta:</span>
                  <span>${event.registeredCount} / ${event.quota} Kursi (${quotaPercent}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: ${quotaPercent}%;"></div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${!event.isRegistered ? `
                  <button class="btn btn-primary btn-register-event" data-id="${event.id}" style="flex: 1;">
                    ${Icons.check(14)} Registrasi Peserta & Terbitkan Tiket QR
                  </button>
                ` : `
                  <button class="btn btn-secondary btn-view-qr" data-id="${event.id}" style="flex: 1;">
                    ${Icons.qrCode(14)} Tiket QR (${event.qrTicketCode})
                  </button>
                  <button class="btn ${event.isAttended ? 'btn-secondary' : 'btn-success'} btn-scan-qr" data-id="${event.id}" style="flex: 1;">
                    ${event.isAttended ? `${Icons.checkCircle(14)} Hadir Terverifikasi` : `${Icons.camera(14)} Validasi Presensi QR (+10)`}
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
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
    const bodyHtml = `
      <div class="form-group">
        <label class="form-label">Nama Kegiatan</label>
        <input type="text" id="ceTitle" class="form-control" value="Workshop Pengembangan Solusi Digital Berkelanjutan" required>
      </div>
      <div class="form-group">
        <label class="form-label">Lembaga Penyelenggara</label>
        <input type="text" id="ceOrganizer" class="form-control" value="HIMATIF & GDSC" required>
      </div>
      <div class="form-group">
        <label class="form-label">Kategori Event</label>
        <select id="ceType" class="form-control">
          ${Object.values(EventType).map(t => `<option value="${t.code}">${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Uraian Kegiatan</label>
        <textarea id="ceDesc" class="form-control" rows="3">Pelatihan intensif perancangan produk digital guna mendukung transformasi UMKM dan desa mandiri.</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Waktu Pelaksanaan</label>
        <input type="text" id="ceDate" class="form-control" value="30 November 2026 &bull; 09:00 WIB">
      </div>
      <div class="form-group">
        <label class="form-label">Lokasi / Ruang</label>
        <input type="text" id="ceLocation" class="form-control" value="Auditorium Gedung Utama">
      </div>
      <div class="form-group">
        <label class="form-label">Kapasitas Maksimal</label>
        <input type="number" id="ceQuota" class="form-control" value="200" min="20">
      </div>
      <div class="form-group">
        <label class="form-label">Keterangan Publikasi</label>
        <input type="text" id="cePoster" class="form-control" value="Publikasi Resmi: Terakreditasi MBKM &bull; Sertifikat Digital">
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="btnSubmitCreateEvent" class="btn btn-primary">${Icons.check(14)} Terbitkan Agenda</button>
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
    const svgQr = QrCodeGenerator.generateSvgString(qrPayload, 190, '#0F172A', '#3B49DF');

    const bodyHtml = `
      <div style="text-align: center; padding: 6px 0;">
        <span class="pill-badge ${event.isAttended ? 'pill-green' : 'pill-blue'}" style="margin-bottom: 12px;">
          <span class="badge-dot"></span> ${event.isAttended ? 'Presensi Tervalidasi (+10 Poin)' : 'E-Ticket Resmi Campus Impact Hub'}
        </span>

        <h3 style="font-size: 17.5px; font-weight: 800; color: var(--neutral-dark); margin-bottom: 4px;">
          ${event.title}
        </h3>
        <div style="font-size: 12px; color: var(--neutral-muted); margin-bottom: 16px;">
          ${event.organizerName} &bull; ${EventType[event.type]?.label || event.type}<br>
          ${event.date} &bull; ${event.location}
        </div>

        <!-- Rendered Vector QR Code Container -->
        <div style="display: flex; justify-content: center; margin-bottom: 14px;">
          ${svgQr}
        </div>

        <div style="
          display: inline-block;
          background: var(--surface-alt);
          border: 1px solid var(--border-color);
          padding: 6px 16px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: 13px;
          font-weight: 700;
          color: var(--neutral-dark);
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        ">
          KODE TIKET: ${event.qrTicketCode}
        </div>

        <div style="font-size: 11.5px; color: var(--neutral-muted); margin-bottom: 16px;">
          Pemilik Tiket: <strong>${user.name}</strong> (${user.identityNumber})
        </div>

        <!-- Flow Box -->
        <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; text-align: left; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--neutral-dark); text-transform: uppercase; margin-bottom: 2px;">
            Validasi Presensi Hari-H:
          </div>
          <div style="font-size: 12px; color: var(--neutral-body);">
            ${event.isAttended 
              ? 'Kehadiran telah dicatat dalam sistem & Impact Score bertambah +10 poin.' 
              : 'Pindai kode QR pada meja registrasi panitia untuk mencatat presensi.'}
          </div>
        </div>

        <!-- Simulation Actions -->
        ${!event.isAttended ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="btnScanAsAttendee" class="btn btn-primary">
              ${Icons.camera(14)} Simulasi Scan QR Peserta (+10 Poin)
            </button>
            <button id="btnScanAsCommittee" class="btn btn-secondary">
              ${Icons.leadership(14)} Presensi Panitia Pelaksana (+20 Poin)
            </button>
          </div>
        ` : `
          <div style="font-size: 12px; font-weight: 600; color: var(--success); text-align: center;">
            ${Icons.checkCircle(14)} Presensi kegiatan telah lengkap.
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
  // SCREEN 9: MY IMPACT & PORTFOLIO HUB (MODUL E & F)
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
      <div class="card hero-green" style="padding: 24px; margin-bottom: 22px;">
        <span class="pill-badge pill-green" style="background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.25); color: #FFFFFF; margin-bottom: 12px;">
          <span class="badge-dot" style="background: #A7F3D0;"></span> Analitik Kontribusi & Portofolio Dampak
        </span>
        <h2 style="font-size: 23px; font-weight: 800; letter-spacing: -0.4px; margin-bottom: 4px;">
          Dashboard Capaian Mahasiswa
        </h2>
        <p style="font-size: 12.5px; opacity: 0.9; margin-bottom: 18px;">
          Pengukuran kuantitatif kontribusi sosial, kepemimpinan organisasi, dan akumulasi jam kerja sosial terverifikasi.
        </p>

        <!-- Dual Scores Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px;">
          <div style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md); padding: 16px;">
            <div style="font-size: 12px; font-weight: 600; color: #A7F3D0; margin-bottom: 2px;">Impact Score</div>
            <div style="font-size: 34px; font-weight: 900; letter-spacing: -1px; line-height: 1.1;">${user.impactScore}</div>
            <div style="font-size: 11px; opacity: 0.85; margin-top: 4px;">Kontributor Aktif Teratas</div>
          </div>

          <div style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md); padding: 16px;">
            <div style="font-size: 12px; font-weight: 600; color: #A7F3D0; margin-bottom: 2px;">Leadership Score</div>
            <div style="font-size: 34px; font-weight: 900; letter-spacing: -1px; line-height: 1.1;">${user.leadershipScore}</div>
            <div style="font-size: 11px; opacity: 0.85; margin-top: 4px;">Kepengurusan & Koordinasi Proyek</div>
          </div>
        </div>

        <!-- 4 Summary Metrics -->
        <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; background: rgba(0,0,0,0.18); padding: 10px 14px; border-radius: var(--radius-sm);">
          <span>Proyek Selesai: <strong>${user.projectsCompleted}</strong></span>
          <span>Mitra Didampingi: <strong>${user.umkmHelped}</strong></span>
          <span>Penerima Manfaat: <strong>${user.beneficiariesReached}+</strong></span>
          <span>Kontribusi: <strong>${user.contributionHours} Jam</strong></span>
        </div>
      </div>

      <!-- Modul F: Activity Point System -->
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.award(18)} Standar Konversi Poin Aktivitas
          </h3>
          <p class="section-subtitle">Setiap aktivitas sosial dan kepemimpinan yang tervalidasi otomatis mengonversi poin.</p>
        </div>
      </div>

      <div class="card" style="padding: 18px; margin-bottom: 24px;">
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${rules.map((r, idx) => `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; ${idx < rules.length - 1 ? 'border-bottom: 1px solid var(--border-color); padding-bottom: 10px;' : ''}">
              <div>
                <div style="font-size: 13px; font-weight: 700; color: var(--neutral-dark);">${r.activityName}</div>
                <div style="font-size: 11.5px; color: var(--neutral-muted);">${r.description}</div>
              </div>
              <span class="pill-badge pill-green" style="font-size: 11.5px; font-weight: 700;">
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
            ${Icons.fileText(18)} Portofolio Capaian Terverifikasi
          </h3>
          <p class="section-subtitle">Dokumen rekam jejak kontribusi mahasiswa yang sah sebagai Surat Keterangan Pendamping Ijazah (SKPI).</p>
        </div>
        <button id="btnExportPortfolio" class="section-action">
          ${Icons.printer(14)} Cetak Portofolio SKPI
        </button>
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
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${filteredPf.map(entry => `
          <div class="card" style="padding: 18px; margin-bottom: 0;">
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px;">
              <span class="pill-badge pill-blue">${entry.category}</span>
              <span class="pill-badge pill-green"><span class="badge-dot"></span> +${entry.impactPoints} Impact</span>
              ${entry.leadershipPoints > 0 ? `<span class="pill-badge pill-amber"><span class="badge-dot"></span> +${entry.leadershipPoints} Leadership</span>` : ''}
            </div>

            <h4 style="font-size: 15.5px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 2px;">
              ${entry.title}
            </h4>
            <div style="font-size: 11.5px; font-weight: 600; color: var(--primary); margin-bottom: 6px;">
              ${entry.organizationOrPartner} &bull; ${entry.date} &bull; No: ${entry.credentialCode}
            </div>

            <p style="font-size: 12px; color: var(--neutral-muted); line-height: 1.5;">
              ${entry.outcomeSummary}
            </p>
          </div>
        `).join('')}
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedPortfolioFilter = btn.getAttribute('data-cat');
        this.render();
      });
    });

    document.getElementById('btnExportPortfolio').addEventListener('click', () => this.showExportPortfolioModal());
  }

  showExportPortfolioModal() {
    const user = CampusRepository.currentUser;

    const bodyHtml = `
      <div id="skpiDocumentPrintArea" style="padding: 6px 0; line-height: 1.6;">
        <div style="border-bottom: 2px solid var(--primary); padding-bottom: 12px; margin-bottom: 14px; text-align: center;">
          <h3 style="font-size: 16px; font-weight: 800; color: var(--neutral-dark); letter-spacing: -0.2px; margin-bottom: 2px;">
            CAMPUS IMPACT HUB &bull; DOKUMEN REKAM JEJAK PORTOFOLIO MAHASISWA
          </h3>
          <div style="font-size: 11px; color: var(--neutral-muted);">
            Surat Keterangan Pendamping Ijazah (SKPI) Bidang Pengabdian Masyarakat & Kepemimpinan
          </div>
        </div>

        <div style="background: var(--surface-alt); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 12px;">
          <div><strong>Nama Mahasiswa:</strong> ${user.name}</div>
          <div><strong>Nomor Induk Mahasiswa:</strong> ${user.identityNumber}</div>
          <div><strong>Program Studi:</strong> ${user.majorOrUnit}</div>
          <div><strong>Akumulasi Impact Score:</strong> ${user.impactScore} Poin</div>
          <div><strong>Akumulasi Leadership Score:</strong> ${user.leadershipScore} Poin</div>
          <div><strong>Total Kontribusi Sosial:</strong> ${user.projectsCompleted} Proyek &bull; ${user.umkmHelped} Mitra &bull; ${user.beneficiariesReached}+ Penerima Manfaat</div>
        </div>

        <div style="font-size: 12px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 8px;">
          Riwayat Aktivitas & Kontribusi Terakreditasi:
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
          ${CampusRepository.portfolioEntries.map((e, idx) => `
            <div style="border-left: 2px solid var(--primary); padding-left: 10px; font-size: 11px;">
              <strong>${idx + 1}. ${e.title}</strong> (${e.category})<br>
              <span style="color: var(--neutral-muted);">${e.organizationOrPartner} &bull; ${e.date} &bull; Kredensial: ${e.credentialCode}</span><br>
              <em>${e.outcomeSummary}</em>
            </div>
          `).join('')}
        </div>

        <div style="font-size: 11px; color: var(--success-dark); background: var(--success-light); border: 1px solid var(--success-border); padding: 8px 12px; border-radius: var(--radius-sm);">
          ${Icons.check(12)} Dokumen ini sah secara elektronik sebagai lampiran capaian pengabdian mahasiswa pada kurikulum perguruan tinggi.
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>
      <button id="btnPrintCv" class="btn btn-secondary">${Icons.printer(14)} Cetak Dokumen</button>
      <button id="btnCopyCvLink" class="btn btn-primary">${Icons.copy(14)} Salin Tautan Verifikasi</button>
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
      <div class="card" style="padding: 24px; margin-bottom: 20px;">
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 14px;">
          <div class="avatar-circle" style="width: 56px; height: 56px; font-size: 18px;">
            ${(user.name || 'CI').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: var(--neutral-dark); margin-bottom: 2px;">
              ${user.name}
            </h3>
            <div style="font-size: 12px; color: var(--neutral-body); margin-bottom: 2px;">
              ${user.majorOrUnit}
            </div>
            <div style="font-size: 11.5px; color: var(--neutral-muted);">
              ${user.email} &bull; ${user.identityNumber}
            </div>
          </div>
        </div>

        <p style="font-size: 12.5px; color: var(--neutral-body); line-height: 1.55; margin-bottom: 14px;">
          ${user.bio}
        </p>

        <!-- Competencies -->
        <div style="background: var(--surface-alt); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-sm); font-size: 12px; margin-bottom: 18px; line-height: 1.6;">
          <div><strong>Keahlian Teknis:</strong> ${user.skills.join(' &bull; ')}</div>
          <div><strong>Fokus Minat:</strong> ${user.interests.join(', ')}</div>
        </div>

        <!-- Role Change Actions -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="btnProfileSwitchRole" class="btn btn-primary" style="flex: 1;">
            ${Icons.user(14)} Beralih Peran (${roleMeta.label})
          </button>
          <button id="btnProfileGoAuth" class="btn btn-secondary" style="flex: 1;">
            ${Icons.auth(14)} Halaman Masuk / Registrasi
          </button>
        </div>
      </div>

      <!-- Cloud Architecture Overview -->
      <div class="section-header">
        <div>
          <h3 class="section-title">
            ${Icons.database(18)} Arsitektur Sistem & Database
          </h3>
          <p class="section-subtitle">Web Frontend &rarr; Supabase API &rarr; Supabase Auth &rarr; PostgreSQL &rarr; Storage Bucket</p>
        </div>
      </div>

      <div class="card" style="padding: 20px; margin-bottom: 20px;">
        <p style="font-size: 12px; color: var(--neutral-body); line-height: 1.65; margin-bottom: 14px;">
          <strong>Struktur Teknis Campus Impact Hub:</strong><br>
          1. <strong>Frontend:</strong> Single Page Application murni (HTML5, Modern CSS, ES6 Modules, Zero-Dependency)<br>
          2. <strong>REST & Realtime:</strong> Supabase API & Web Socket Protocol<br>
          3. <strong>Otentikasi Terpadu:</strong> Supabase Auth dengan Role-Based Access Control (Student, Partner, Org, Admin)<br>
          4. <strong>Basis Data Relasional:</strong> PostgreSQL (Skema tabel Users, Projects, Applications, Organizations, Events, Impact Reports)<br>
          5. <strong>Media Storage:</strong> Penyimpanan berkas foto lapangan, SK organisasi, dan poster kegiatan
        </p>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="btnViewDbJson" class="btn btn-primary" style="flex: 1;">
            ${Icons.database(14)} Struktur Database JSON (Live Data)
          </button>
          <button id="btnResetData" class="btn btn-outline" style="border-color: var(--danger); color: var(--danger);">
            ${Icons.refresh(14)} Reset Data Simulasi
          </button>
        </div>
      </div>

      <!-- Roadmap Box -->
      <div class="card" style="padding: 20px;">
        <h4 style="font-size: 14px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 8px;">
          Peta Jalan Pengembangan (Roadmap)
        </h4>
        <div style="font-size: 12px; color: var(--neutral-muted); line-height: 1.6; margin-bottom: 12px;">
          &bull; <strong>Fase 1 (MVP):</strong> Autentikasi 4 Role, Dashboard Analitik, Marketplace Proyek, Submit Masalah, Direktori UKM, Rekrutmen, Tiket QR, Impact Score.<br>
          &bull; <strong>Fase 2:</strong> Ruang Diskusi Tim, Pengunggahan Dokumen Terpusat, Validasi Presensi GPS & QR, Leadership Analytics.<br>
          &bull; <strong>Fase 3:</strong> Rekomendasi Cerdas AI Terdistribusi, Peta Sebaran Kebutuhan Sosial (Heatmap), Pelacakan Capaian SDG Kampus.<br>
          &bull; <strong>Fase 4:</strong> Integrasi Sistem Kampus Merdeka (MBKM), Konversi SKS Pengabdian, Penerbitan Sertifikat Digital Terverifikasi.
        </div>

        <div style="background: var(--surface-alt); border-left: 3px solid var(--primary); padding: 10px 14px; font-size: 11.5px; color: var(--neutral-dark);">
          Platform ini dirancang untuk memastikan setiap mahasiswa lulus tidak hanya dengan transkrip nilai akademik, melainkan memiliki portofolio kontribusi sosial nyata yang dapat diverifikasi oleh dunia industri dan pemangku kepentingan.
        </div>
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.getElementById('btnProfileSwitchRole').addEventListener('click', () => this.showRoleSwitcherModal());
    document.getElementById('btnProfileGoAuth').addEventListener('click', () => this.switchTab('auth'));

    document.getElementById('btnViewDbJson').addEventListener('click', () => {
      const jsonStr = CampusRepository.getMvpDatabaseJsonSnapshot();
      const bodyHtml = `
        <div style="font-size: 12px; color: var(--neutral-muted); margin-bottom: 10px;">
          Format data relasional sistem PostgreSQL / Supabase API:
        </div>
        <pre style="
          background: #0F172A;
          color: #38BDF8;
          padding: 14px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: 11px;
          max-height: 380px;
          overflow: auto;
          line-height: 1.4;
        ">${jsonStr}</pre>
      `;

      const footerHtml = `
        <button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>
        <button id="btnCopyJson" class="btn btn-primary">${Icons.copy(14)} Salin Data JSON</button>
      `;

      this.openModal('Struktur Database JSON (Supabase)', bodyHtml, footerHtml);

      document.getElementById('btnCopyJson').addEventListener('click', () => {
        navigator.clipboard.writeText(jsonStr).then(() => {
          this.showToast('Data JSON berhasil disalin', 'success');
        });
      });
    });

    document.getElementById('btnResetData').addEventListener('click', () => {
      if (confirm('Konfirmasi reset seluruh data simulasi kembali ke kondisi awal?')) {
        CampusRepository.resetToDefault();
        this.showToast('Data simulasi telah diatur ulang ke kondisi default', 'info');
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
      <p style="font-size: 12px; color: var(--neutral-muted); margin-bottom: 14px;">
        Pilih peran pengguna untuk menguji fitur platform dari perspektif pemangku kepentingan berbeda:
      </p>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${roles.map(r => {
          const isSelected = currentUser.role === r.code;
          return `
            <div class="card role-select-card" data-role="${r.code}" style="
              padding: 12px 14px;
              margin-bottom: 0;
              cursor: pointer;
              border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
              background: ${isSelected ? 'var(--primary-light)' : 'var(--surface)'};
              transition: all 0.15s ease;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                <div style="font-weight: 700; font-size: 13px; color: ${isSelected ? 'var(--primary)' : 'var(--neutral-dark)'};">
                  ${r.label} &bull; <span style="font-weight: 500; font-size: 11.5px; color: var(--neutral-muted);">${r.badgeTitle}</span>
                </div>
                ${isSelected ? `<span style="color: var(--primary); font-weight: 700;">${Icons.check(16)}</span>` : ''}
              </div>
              <div style="font-size: 11.5px; color: var(--neutral-muted);">
                ${r.description}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>
      <button id="btnModalGoAuth" class="btn btn-secondary">${Icons.auth(14)} Halaman Masuk Lengkap</button>
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
