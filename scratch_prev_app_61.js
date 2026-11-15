/**
 * Campus Impact Hub - Main Application Orchestrator
 * Controls navigation, rendering all 10 Screens, interactive modals,
 * AI recommendation engine, QR ticket generator & attendance scanner.
 */

import { UserRole, ProjectStatus, VerificationStatus, SelectionStage, ApplicantStatus, EventType } from './models.js';
import { CampusRepository } from './repository.js';
import { QrCodeGenerator } from './qr.js';

class CampusImpactHubApp {
  constructor() {
    this.currentTab = 'home'; // 'auth', 'home', 'projects', 'organizations', 'events', 'impact', 'profile'
    this.isRegisterMode = false;
    this.selectedProjectCategoryFilter = 'Semua';
    this.selectedOrgSubTab = 0; // 0 = Directory, 1 = Open Recruitment
    this.selectedEventTypeFilter = 'Semua';
    this.selectedPortfolioFilter = 'Semua';
    this.currentAiProblemQuery = 'UMKM kesulitan pemasaran online';

    this.initDOMElements();
    this.bindGlobalEvents();
    this.render();
  }

  initDOMElements() {
    this.contentEl = document.getElementById('contentContainer');
    this.roleSwitcherBtn = document.getElementById('btnRoleSwitcher');
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

    // Brand logo returns to home
    if (this.brandLogoEl) {
      this.brandLogoEl.addEventListener('click', () => this.switchTab('home'));
    }

    // Role switcher button
    if (this.roleSwitcherBtn) {
      this.roleSwitcherBtn.addEventListener('click', () => this.showRoleSwitcherModal());
    }

    // Header pills click -> go to Impact hub
    if (this.headerImpactPill) {
      this.headerImpactPill.addEventListener('click', () => this.switchTab('impact'));
    }
    if (this.headerLeadershipPill) {
      this.headerLeadershipPill.addEventListener('click', () => this.switchTab('impact'));
    }

    // Sidebar user card click -> go to Profile
    if (this.sidebarUserCard) {
      this.sidebarUserCard.addEventListener('click', () => this.switchTab('profile'));
    }

    // Modal close events
    if (this.btnCloseModal) {
      this.btnCloseModal.addEventListener('click', () => this.closeModal());
    }
    if (this.modalBackdrop) {
      this.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === this.modalBackdrop) this.closeModal();
      });
    }

    // Escape key closes modal
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
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'danger') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
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

    // Header buttons & pills
    if (this.roleSwitcherBtn) {
      this.roleSwitcherBtn.innerHTML = `<span>👤 ${roleMeta.label}</span> <span style="font-size: 10px;">▾</span>`;
    }
    if (this.headerImpactPill) {
      this.headerImpactPill.innerHTML = `🌱 Impact: <strong>${user.impactScore}</strong>`;
    }
    if (this.headerLeadershipPill) {
      this.headerLeadershipPill.innerHTML = `⭐ Leadership: <strong>${user.leadershipScore}</strong>`;
    }

    // Sidebar user summary
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');

    if (sidebarAvatar) sidebarAvatar.textContent = (user.name || 'CI').slice(0, 2).toUpperCase();
    if (sidebarUserName) sidebarUserName.textContent = user.name;
    if (sidebarUserRole) sidebarUserRole.textContent = roleMeta.label;

    // Active state in sidebar and bottom navigation
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
      <div class="card hero-blue" style="margin-bottom: 24px; padding: 26px;">
        <span class="pill-badge pill-blue" style="background: rgba(255,255,255,0.2); color: #fff; margin-bottom: 12px;">
          ✨ SCREEN 1 • SUPABASE AUTHENTICATION
        </span>
        <h2 style="font-size: 26px; font-weight: 800; margin-bottom: 6px;">CAMPUS IMPACT HUB</h2>
        <p style="font-size: 14px; font-style: italic; opacity: 0.9; margin-bottom: 8px;">
          "Menghubungkan Masalah, Talenta, Organisasi, dan Dampak dalam Satu Ekosistem Kampus."
        </p>
        <p style="font-size: 12px; opacity: 0.85;">
          Akses multi-role ekosistem terpadu: Mahasiswa, Mitra Masyarakat (UMKM/Desa/Sekolah), Organisasi Kampus (BEM/UKM), dan Admin Kampus.
        </p>
      </div>

      <div class="card" style="max-width: 600px; margin: 0 auto 30px auto; padding: 28px;">
        <!-- Auth Mode Toggle -->
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <button id="btnAuthLoginMode" class="btn ${!this.isRegisterMode ? 'btn-primary' : 'btn-outline'}" style="flex: 1;">
            🔐 Masuk (Login)
          </button>
          <button id="btnAuthRegisterMode" class="btn ${this.isRegisterMode ? 'btn-primary' : 'btn-outline'}" style="flex: 1;">
            📝 Daftar (Register)
          </button>
        </div>

        <form id="authForm">
          ${this.isRegisterMode ? `
            <div class="form-group">
              <label class="form-label">Nama Lengkap / Nama Instansi</label>
              <input type="text" id="authNameInput" class="form-control" value="${user.name}" placeholder="Masukkan nama lengkap" required>
            </div>
            <div class="form-group">
              <label class="form-label">Program Studi / Unit / Organisasi</label>
              <input type="text" id="authMajorInput" class="form-control" value="${user.majorOrUnit}" placeholder="Contoh: S1 Teknik Informatika">
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">Email Kampus / Mitra (Supabase Auth)</label>
            <input type="email" id="authEmailInput" class="form-control" value="${user.email}" placeholder="budi@mail.com" required>
          </div>

          <div class="form-group">
            <label class="form-label">Kata Sandi</label>
            <input type="password" id="authPassInput" class="form-control" value="campusimpact2026" placeholder="••••••••" required>
          </div>

          <div class="form-group" style="margin-top: 20px;">
            <label class="form-label" style="margin-bottom: 10px;">Pilih Role Masuk (4 Role Ekosistem):</label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${roleKeys.map(k => {
                const r = UserRole[k];
                const isSelected = user.role === r.code;
                return `
                  <div class="auth-role-card" data-role="${r.code}" style="
                    padding: 12px 16px;
                    border: 2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
                    background: ${isSelected ? 'var(--primary-light)' : 'var(--surface)'};
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.2s;
                  ">
                    <div>
                      <div style="font-weight: 700; color: ${isSelected ? 'var(--primary-dark)' : 'var(--text-primary)'}; font-size: 13px;">
                        ${isSelected ? '✅ ' : ''}${r.label} — ${r.badgeTitle}
                      </div>
                      <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                        ${r.description}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <button type="submit" class="btn btn-success btn-block" style="margin-top: 24px; padding: 12px; font-size: 14px;">
            ${this.isRegisterMode ? '🚀 Buat Akun & Masuk ke Dashboard' : '🚀 Masuk ke Dashboard Campus Impact Hub'}
          </button>
        </form>
      </div>
    `;

    this.contentEl.innerHTML = html;

    // Bind Auth Events
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

      this.showToast(`Selamat datang, ${CampusRepository.currentUser.name}!`, 'success');
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
      <!-- 1. Hero Card -->
      <div class="card" style="border-color: var(--primary-border); padding: 22px; margin-bottom: 24px;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
          <span class="pill-badge pill-blue">👤 Role: ${roleMeta.label}</span>
          <span class="pill-badge pill-green">✅ Supabase Live Sync</span>
          <span class="pill-badge pill-purple">⚡ AI Hub Enabled</span>
        </div>
        <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
          Halo, ${user.name}! 👋
        </h2>
        <p style="font-size: 13px; font-weight: 700; font-style: italic; color: var(--primary); margin-bottom: 6px;">
          "Menghubungkan Masalah, Talenta, Organisasi, dan Dampak dalam Satu Ekosistem Kampus."
        </p>
        <p style="font-size: 12px; color: var(--text-secondary); max-width: 820px; margin-bottom: 16px;">
          Platform super app ekosistem kampus yang mengintegrasikan pengabdian masyarakat, marketplace proyek sosial, rekrutmen organisasi, manajemen event ber-QR tiket, serta portofolio dampak mahasiswa secara terukur.
        </p>

        <!-- Quick Action Buttons -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="btnQuickSubmit" class="btn btn-success" style="flex: 1; min-width: 140px;">
            🤝 Submit Masalah
          </button>
          <button id="btnQuickProjects" class="btn btn-primary" style="flex: 1; min-width: 140px;">
            🚀 Cari Proyek
          </button>
          <button id="btnQuickEvents" class="btn btn-secondary" style="flex: 1; min-width: 140px;">
            🎟️ QR Event
          </button>
        </div>
      </div>

      <!-- 2. Screen 2: 5 Indikator Analitik Ekosistem Kampus -->
      <div class="section-header">
        <div>
          <h3 class="section-title">📊 Dashboard Analitik Ekosistem Kampus</h3>
          <p class="section-subtitle">Statistik real-time kontribusi mahasiswa, organisasi, event, proyek sosial, dan dampak masyarakat.</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--primary-light); color: var(--primary);">🎓</div>
          <div class="stat-info">
            <div class="value" style="color: var(--primary);">${CampusRepository.getTotalActiveStudents().toLocaleString()}</div>
            <div class="label">Total Mahasiswa Aktif</div>
            <div class="sublabel">Talenta Lintas Jurusan</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: var(--primary-light); color: var(--primary-dark);">🏛️</div>
          <div class="stat-info">
            <div class="value" style="color: var(--primary-dark);">${CampusRepository.getTotalOrganizations()} UKM</div>
            <div class="label">Total Organisasi</div>
            <div class="sublabel">${CampusRepository.getVerifiedOrganizationsCount()} Verified Organization</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: var(--purple-light); color: var(--purple);">📅</div>
          <div class="stat-info">
            <div class="value" style="color: var(--purple);">${CampusRepository.getTotalEvents()} Event</div>
            <div class="label">Total Event Kampus</div>
            <div class="sublabel">Terintegrasi QR Ticket</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: var(--warning-light); color: var(--warning-dark);">🛠️</div>
          <div class="stat-info">
            <div class="value" style="color: var(--warning-dark);">${CampusRepository.getTotalProjects()} Proyek</div>
            <div class="label">Total Proyek Sosial</div>
            <div class="sublabel">UMKM, Desa & Sekolah</div>
          </div>
        </div>
      </div>

      <!-- Highlight Banner: Total Dampak -->
      <div class="card hero-green" id="cardTotalDampak" style="padding: 20px; cursor: pointer; margin-bottom: 28px;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.5px; opacity: 0.9; margin-bottom: 4px;">
          🌍 TOTAL DAMPAK SOSIAL KAMPUS TERUKUR
        </div>
        <div style="font-size: 20px; font-weight: 800; margin-bottom: 6px;">
          ${CampusRepository.getTotalBeneficiaries().toLocaleString()}+ Penerima Manfaat • ${user.umkmHelped} UMKM & Desa Terdigitalisasi
        </div>
        <div style="font-size: 12px; opacity: 0.95; display: flex; gap: 16px; flex-wrap: wrap;">
          <span>🌱 My Impact: <strong>${user.impactScore} Poin</strong></span>
          <span>⭐ Leadership: <strong>${user.leadershipScore} Poin</strong></span>
          <span>⏱️ Kontribusi: <strong>${user.contributionHours} Jam</strong></span>
          <span>👆 <em>Ketuk untuk detail portofolio</em></span>
        </div>
      </div>

      <!-- 3. Modul G — AI Recommendation Hub -->
      <div class="section-header">
        <div>
          <h3 class="section-title">🤖 Modul G — AI Recommendation Hub</h3>
          <p class="section-subtitle">Rekomendasi cerdas pemetaan masalah masyarakat, organisasi UKM, dan event sesuai minat.</p>
        </div>
      </div>

      <div class="card" style="border-color: #93C5FD; padding: 22px; margin-bottom: 28px;">
        <span class="pill-badge pill-blue" style="margin-bottom: 12px;">⚡ AI PROBLEM MATCHING ENGINE</span>
        
        <div class="form-group" style="margin-bottom: 10px;">
          <label class="form-label">Input Masalah Masyarakat (UMKM / Desa / Sekolah):</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="inputAiProblem" class="form-control" value="${this.currentAiProblemQuery}" placeholder="Contoh: UMKM kesulitan pemasaran online">
            <button id="btnRunAiMatch" class="btn btn-primary" style="white-space: nowrap;">
              🔍 Analisis AI
            </button>
          </div>
        </div>

        <!-- Presets -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); align-self: center;">Contoh Cepat:</span>
          <button class="pill-badge pill-blue btn-ai-preset" data-query="UMKM kesulitan pemasaran online" style="cursor: pointer; border: none;">
            UMKM Pemasaran Online
          </button>
          <button class="pill-badge pill-blue btn-ai-preset" data-query="Desa butuh bank sampah digital" style="cursor: pointer; border: none;">
            Bank Sampah Desa
          </button>
          <button class="pill-badge pill-blue btn-ai-preset" data-query="Sekolah butuh media edukasi interaktif" style="cursor: pointer; border: none;">
            Media Edukasi Sekolah
          </button>
        </div>

        <!-- AI Match Result Box -->
        <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: var(--radius-md); padding: 14px; margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 13px; color: #065F46; margin-bottom: 6px;">
            ✨ Hasil Rekomendasi AI Problem Matching:
          </div>
          <div style="font-size: 12px; color: #047857; line-height: 1.6;">
            <div>• <strong>Kategori Solusi:</strong> ${aiMatch.category}</div>
            <div>• <strong>Rekomendasi Jurusan Mahasiswa:</strong> ${aiMatch.recommendedMajors.join(', ')}</div>
            <div>• <strong>Estimasi Skor Dampak:</strong> +${aiMatch.suggestedImpactScore} Poin (${aiMatch.estimatedImpact})</div>
            <div>• <strong>Judul Rekomendasi:</strong> ${aiMatch.recommendedSolutionTitle}</div>
          </div>
        </div>

        <!-- AI Student Recommendations -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 14px;">
          <div style="font-size: 14px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
            🎯 AI Personal Recommendation (Untuk Anda)
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px;">
            Dianalisis berdasarkan Minat: <strong>${user.interests.join(', ')}</strong> | Jurusan: <strong>${user.majorOrUnit}</strong>
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
            <div>• <strong>Organisasi Direkomendasikan:</strong> ${personalRec.recommendedOrganizations.join(', ')}</div>
            <div>• <strong>Event Relevan:</strong> ${personalRec.recommendedEvents.join(', ')}</div>
            <div>• <strong>Proyek Cocok:</strong> ${personalRec.recommendedProjects.join(' • ')}</div>
          </div>
        </div>
      </div>

      <!-- 4. Featured Priority Projects -->
      <div class="section-header">
        <div>
          <h3 class="section-title">🔥 Proyek Sosial Prioritas</h3>
          <p class="section-subtitle">Masalah nyata masyarakat yang membutuhkan kolaborasi talenta lintas jurusan.</p>
        </div>
        <button id="btnViewAllProjects" class="section-action">
          Lihat Semua (${CampusRepository.projects.length}) →
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${CampusRepository.projects.slice(0, 2).map(p => this.renderProjectCardHtml(p)).join('')}
      </div>
    `;

    this.contentEl.innerHTML = html;

    // Bind Home Events
    document.getElementById('btnQuickSubmit').addEventListener('click', () => this.showSubmitProblemModal());
    document.getElementById('btnQuickProjects').addEventListener('click', () => this.switchTab('projects'));
    document.getElementById('btnQuickEvents').addEventListener('click', () => this.switchTab('events'));
    document.getElementById('cardTotalDampak').addEventListener('click', () => this.switchTab('impact'));
    document.getElementById('btnViewAllProjects').addEventListener('click', () => this.switchTab('projects'));

    document.getElementById('btnRunAiMatch').addEventListener('click', () => {
      const q = document.getElementById('inputAiProblem').value.trim();
      this.currentAiProblemQuery = q || 'UMKM kesulitan pemasaran online';
      this.render();
      this.showToast('AI Problem Matching selesai dijalankan!', 'success');
    });

    document.querySelectorAll('.btn-ai-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentAiProblemQuery = btn.getAttribute('data-query');
        this.render();
        this.showToast(`AI Matching diperbarui: ${this.currentAiProblemQuery}`, 'info');
      });
    });

    this.bindProjectCardEvents();
  }

  // =========================================================================
  // SCREEN 3: PROJECT MARKETPLACE (MODUL A - SOCIAL IMPACT HUB)
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
          <h3 class="section-title">🛠️ Modul A — Social Impact Hub</h3>
          <p class="section-subtitle">Project Marketplace: Menghubungkan masalah masyarakat (UMKM, Desa, Sekolah) dengan solusi mahasiswa.</p>
        </div>
        <button id="btnHeaderSubmitProblem" class="btn btn-success" style="font-size: 12px; padding: 7px 14px;">
          + Submit Masalah
        </button>
      </div>

      <!-- Screen 8 Call-To-Action Banner -->
      <div class="card" style="background: #EEF2FF; border-color: #818CF8; padding: 18px; margin-bottom: 20px;">
        <div style="font-weight: 800; font-size: 14px; color: #1E3A8A; margin-bottom: 4px;">
          🤝 Screen 8 — Punya Masalah UMKM, Desa, Sekolah, atau Komunitas?
        </div>
        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
          Mitra masyarakat dapat mengajukan masalah (Nama Organisasi, Judul, Deskripsi, Kategori, Lokasi, Foto) untuk dikerjakan bersama oleh tim mahasiswa multidisiplin.
        </p>
        <button id="btnBannerSubmitProblem" class="btn btn-primary" style="font-size: 12px;">
          📤 Buka Form Submit Problem (Mitra Masyarakat)
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
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${filtered.length ? filtered.map(p => this.renderProjectCardHtml(p)).join('') : `
          <div class="card" style="text-align: center; padding: 40px; color: var(--text-muted);">
            Tidak ada proyek sosial dalam kategori "${this.selectedProjectCategoryFilter}".
          </div>
        `}
      </div>
    `;

    this.contentEl.innerHTML = html;

    // Bind Filter Events
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
      <div class="card project-card" data-id="${project.id}" style="padding: 18px; margin-bottom: 0;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 10px;">
          <span class="pill-badge pill-blue">${project.category}</span>
          <span class="pill-badge pill-green">🌱 Impact Score: ${project.impactScore}</span>
          <span class="pill-badge ${statusPillClass}">${ProjectStatus[project.status]?.label || project.status}</span>
          <span class="pill-badge pill-gray">👥 ${project.applicantCount || 0} Pelamar</span>
        </div>

        <h4 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
          ${project.title}
        </h4>
        <div style="font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 8px;">
          🏢 Mitra: ${project.organizationName} • 📍 ${project.location}
        </div>

        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.5;">
          ${project.description}
        </p>

        <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px;">
          Kebutuhan Talenta: <span style="font-weight: 500; color: var(--text-secondary);">${project.requirements.join(' • ')}</span>
        </div>

        <!-- Compact Impact Report Strip -->
        <div style="background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: 800; color: #065F46; margin-bottom: 2px;">
            📊 Impact Report — Penerima Manfaat: ${project.impactReport?.beneficiaries || 0} Orang
          </div>
          <div style="font-size: 11px; color: #047857;">
            <strong>Sebelum:</strong> ${project.impactReport?.beforeCondition || '-'}<br>
            <strong>Sesudah:</strong> ${project.impactReport?.afterCondition || '-'}
          </div>
        </div>

        ${project.userApplicationState !== 'NONE' ? `
          <div style="margin-bottom: 12px; font-size: 11px; font-weight: 700; color: var(--primary-dark); background: var(--primary-light); padding: 6px 10px; border-radius: var(--radius-sm);">
            ${project.userApplicationState === 'APPROVED' ? '✅ Status Anda: Diterima dalam Tim (' + project.userRoleInProject + ')' : '⏳ Status Anda: Menunggu Persetujuan Mitra (' + project.userRoleInProject + ')'}
          </div>
        ` : ''}

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-project-detail" data-id="${project.id}" style="flex: 1; min-width: 120px;">
            👁️ Lihat Detail
          </button>
          <button class="btn btn-primary btn-project-apply" data-id="${project.id}" style="flex: 1; min-width: 160px;">
            ${project.userApplicationState === 'NONE' ? '🚀 Daftar Proyek (+50)' : '👑 Upgrade Ketua (+75)'}
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
  // SCREEN 4: PROJECT DETAIL MODAL (MODUL A)
  // =========================================================================
  showProjectDetailModal(projectId) {
    const project = CampusRepository.projects.find(p => p.id === projectId);
    if (!project) return;

    let flowStepHtml = '';
    if (project.userApplicationState === 'APPROVED') {
      flowStepHtml = '✅ 1. Lihat Detail → ✅ 2. Daftar Proyek → 🎉 3. Disetujui (' + project.userRoleInProject + ')';
    } else if (project.userApplicationState === 'PENDING') {
      flowStepHtml = '✅ 1. Lihat Detail → ✅ 2. Daftar Proyek → ⏳ 3. Menunggu Persetujuan (' + project.userRoleInProject + ')';
    } else {
      flowStepHtml = '👁️ 1. Lihat Detail → 📝 2. Daftar Proyek → ⏳ 3. Menunggu Persetujuan';
    }

    const bodyHtml = `
      <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;">
        <span class="pill-badge pill-blue">${project.category}</span>
        <span class="pill-badge pill-green">🌱 Impact Score: ${project.impactScore}</span>
        <span class="pill-badge pill-amber">${ProjectStatus[project.status]?.label || project.status}</span>
      </div>

      <h3 style="font-size: 19px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
        ${project.title}
      </h3>
      <div style="font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 14px;">
        Mitra Masyarakat: ${project.organizationName} • 📍 ${project.location}
      </div>

      <!-- Photo Box -->
      <div style="background: var(--primary-light); border: 1.5px solid var(--primary-border); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 800; color: var(--primary-dark); margin-bottom: 4px;">
          📷 ${project.photoCaption}
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
          ${project.description}
        </div>
      </div>

      <div style="margin-bottom: 14px;">
        <div style="font-size: 12px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
          Kebutuhan Talenta Mahasiswa:
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${project.requirements.map(r => `<span class="pill-badge pill-blue">👨‍💻 ${r}</span>`).join('')}
        </div>
      </div>

      <!-- Application Flow Box -->
      <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
          Alur Project Application:
        </div>
        <div style="font-size: 12px; font-weight: 700; color: var(--primary);">
          ${flowStepHtml}
        </div>
      </div>

      <!-- Impact Report Box -->
      <div style="background: #ECFDF5; border: 1.5px solid #6EE7B7; border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 800; color: #065F46; margin-bottom: 6px;">
          📊 Impact Report (Laporan Dampak Terukur)
        </div>
        <div style="font-size: 12px; color: #047857; line-height: 1.6;">
          <div>• <strong>Sebelum:</strong> ${project.impactReport?.beforeCondition}</div>
          <div>• <strong>Sesudah:</strong> ${project.impactReport?.afterCondition}</div>
          <div>• <strong>Penerima Manfaat:</strong> ${project.impactReport?.beneficiaries} Orang</div>
          <div>• <strong>Kategori SDG:</strong> ${project.impactReport?.sdgCategory}</div>
          <div>• <strong>Feedback Mitra:</strong> "${project.impactReport?.partnerFeedback}"</div>
        </div>
      </div>

      <!-- Action Buttons inside Modal -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="modalBtnApplyMember" class="btn btn-primary">
          🚀 Daftar Proyek Sosial (+50 Impact Score)
        </button>
        <button id="modalBtnApplyLeader" class="btn btn-success">
          👑 Daftar sebagai Ketua Tim Proyek (+75 Impact & +75 Leadership)
        </button>
        <button id="modalBtnCycleStatus" class="btn btn-outline" style="border-style: dashed;">
          🔄 Ubah Status Progress (${ProjectStatus[project.status]?.label} → Tahap Berikutnya)
        </button>
      </div>
    `;

    this.openModal(`Detail Proyek: ${project.title}`, bodyHtml, `<button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>`);

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
      this.showToast(`Status proyek "${project.title}" menjadi: ${ProjectStatus[next]?.label}`, 'info');
      this.closeModal();
      this.render();
    });
  }

  // =========================================================================
  // SCREEN 8: SUBMIT PROBLEM MODAL (MITRA MASYARAKAT)
  // =========================================================================
  showSubmitProblemModal() {
    const bodyHtml = `
      <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
        Hubungkan masalah UMKM, Desa, Sekolah, atau Komunitas dengan talenta mahasiswa kampus melalui AI Problem Matching.
      </p>

      <div class="form-group">
        <label class="form-label">Nama Organisasi / Mitra Masyarakat</label>
        <input type="text" id="spOrgName" class="form-control" value="UMKM Berkah Mandiri" placeholder="Contoh: UMKM Maju Jaya" required>
      </div>

      <div class="form-group">
        <label class="form-label">Judul Masalah</label>
        <input type="text" id="spTitle" class="form-control" value="UMKM kesulitan pemasaran online & katalog digital" placeholder="Judul ringkas masalah" required>
      </div>

      <div class="form-group">
        <label class="form-label">Deskripsi Masalah Lengkap</label>
        <textarea id="spDesc" class="form-control" rows="3" placeholder="Jelaskan kendala yang dialami mitra masyarakat...">Produk kuliner lokal belum memiliki toko online dan pencatatan stok masih ditulis manual di buku.</textarea>
      </div>

      <div style="margin-bottom: 14px;">
        <button type="button" id="spBtnAiFill" class="btn btn-secondary btn-block" style="font-size: 12px;">
          ✨ Analisis Otomatis dengan AI Problem Matching
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Kategori</label>
        <input type="text" id="spCategory" class="form-control" value="Digital Marketing" placeholder="Teknologi / Digital Marketing / Lingkungan / Pendidikan">
      </div>

      <div class="form-group">
        <label class="form-label">Lokasi</label>
        <input type="text" id="spLocation" class="form-control" value="Kec. Sukasari, Kota Bandung" placeholder="Contoh: Kec. Coblong, Kota Bandung">
      </div>

      <div class="form-group">
        <label class="form-label">Foto / Dokumentasi Lapangan</label>
        <input type="text" id="spPhoto" class="form-control" value="foto_lapangan_umkm_berkah.jpg (Terlampir)" placeholder="Nama file atau deskripsi foto">
      </div>

      <div class="form-group">
        <label class="form-label">Kebutuhan Mahasiswa (Multidisiplin)</label>
        <input type="text" id="spRequirements" class="form-control" value="1 Bisnis Digital, 1 Informatika, 1 DKV" placeholder="Pisahkan dengan koma: 2 Informatika, 1 Desain">
      </div>

      <div class="form-group">
        <label class="form-label">Estimasi Penerima Manfaat (Orang)</label>
        <input type="number" id="spBeneficiaries" class="form-control" value="150" min="10" placeholder="120">
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="spBtnSubmit" class="btn btn-success">📤 Submit Masalah ke Marketplace</button>
    `;

    this.openModal('🤝 Screen 8 — Submit Masalah Masyarakat', bodyHtml, footerHtml);

    document.getElementById('spBtnAiFill').addEventListener('click', () => {
      const title = document.getElementById('spTitle').value;
      const desc = document.getElementById('spDesc').value;
      const match = CampusRepository.matchProblemWithAi(`${title} ${desc}`);

      document.getElementById('spCategory').value = match.category;
      document.getElementById('spRequirements').value = match.recommendedMajors.map(m => `1 ${m}`).join(', ');
      this.showToast(`AI Matching: Kategori ${match.category} • ${match.estimatedImpact}`, 'success');
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

      this.showToast(`Masalah "${created.title}" berhasil disubmit!`, 'success');
      this.closeModal();
      this.switchTab('projects');
    });
  }

  // =========================================================================
  // SCREEN 5 & 6: ORGANIZATION HUB & OPEN RECRUITMENT (MODUL B & C)
  // =========================================================================
  renderOrganizationsHub() {
    const html = `
      <!-- Sub-Tab Switcher -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px;">
        <button id="btnSubTabDirectory" class="btn ${this.selectedOrgSubTab === 0 ? 'btn-primary' : 'btn-outline'}" style="flex: 1;">
          🏛️ Directory Organisasi (${CampusRepository.organizations.length})
        </button>
        <button id="btnSubTabOprec" class="btn ${this.selectedOrgSubTab === 1 ? 'btn-primary' : 'btn-outline'}" style="flex: 1;">
          📢 Open Recruitment (${CampusRepository.openRecruitments.length})
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
          <h3 class="section-title">🏛️ Screen 5 — Organization Hub & Directory</h3>
          <p class="section-subtitle">Pusat seluruh UKM, Himpunan, dan BEM Kampus dengan lencana verifikasi resmi.</p>
        </div>
        <button id="btnRegisterOrg" class="btn btn-primary" style="font-size: 12px; padding: 7px 14px;">
          + Registrasi UKM
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${orgs.map(org => {
          let badgePill = '<span class="pill-badge pill-green">✅ VERIFIED ORGANIZATION</span>';
          if (org.verificationStatus === 'PENDING') badgePill = '<span class="pill-badge pill-amber">⏳ STATUS: PENDING VERIFICATION</span>';
          if (org.verificationStatus === 'REJECTED') badgePill = '<span class="pill-badge pill-red">❌ STATUS: REJECTED</span>';

          return `
            <div class="card" style="padding: 18px; margin-bottom: 0;">
              <!-- Header Row -->
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
                <div style="
                  width: 48px;
                  height: 48px;
                  border-radius: var(--radius-md);
                  background: var(--primary);
                  color: #fff;
                  font-weight: 800;
                  font-size: 16px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                ">
                  ${org.logoInitials}
                </div>
                <div style="flex: 1; overflow: hidden;">
                  <h4 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
                    ${org.name} <span style="font-size: 12px; color: var(--text-muted);">(${org.id})</span>
                  </h4>
                  <div style="font-size: 12px; color: var(--text-secondary);">
                    ${org.fullName} • ${org.category}
                  </div>
                </div>
              </div>

              <!-- Badges -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                ${badgePill}
                <span class="pill-badge pill-blue">👥 ${org.memberCount} Anggota</span>
                ${org.isUserJoined ? '<span class="pill-badge pill-green">🌟 Pengurus Aktif</span>' : ''}
              </div>

              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.5;">
                ${org.description}
              </p>

              <div style="font-size: 11px; color: var(--text-muted); background: var(--surface-alt); padding: 8px 12px; border-radius: var(--radius-sm); margin-bottom: 12px;">
                <div>📄 <strong>SK Organisasi:</strong> ${org.skNumber}</div>
                <div>👨‍🏫 <strong>Dosen Pembina:</strong> ${org.advisorName}</div>
                <div>📞 <strong>Kontak:</strong> ${org.contact}</div>
              </div>

              <!-- Actions -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn btn-join-org ${org.isUserJoined ? 'btn-success' : 'btn-primary'}" data-id="${org.id}" style="flex: 1;">
                  ${org.isUserJoined ? '✅ Pengurus Aktif (+30 Poin)' : '🤝 Gabung Pengurus (+30 Poin)'}
                </button>
                ${(org.verificationStatus !== 'VERIFIED' || user.role === 'admin') ? `
                  <button class="btn btn-outline btn-verify-org" data-id="${org.id}" style="flex: 1; border-color: var(--success); color: var(--success-dark);">
                    ${org.verificationStatus === 'VERIFIED' ? '🔄 Set Pending' : '🛡️ Verify SK (Admin)'}
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
        this.showToast('Bergabung sebagai pengurus! +30 Impact & Leadership Score', 'success');
        this.render();
      });
    });

    document.querySelectorAll('.btn-verify-org').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const org = CampusRepository.organizations.find(o => o.id === id);
        const approve = org.verificationStatus !== 'VERIFIED';
        CampusRepository.verifyOrganization(id, approve);
        this.showToast(approve ? `✅ ${org.name} berstatus VERIFIED!` : `Status ${org.name} diubah.`, 'info');
        this.render();
      });
    });
  }

  renderOpenRecruitmentHtml() {
    const recruitments = CampusRepository.openRecruitments;

    return `
      <div class="section-header">
        <div>
          <h3 class="section-title">📢 Screen 6 — Modul C: Open Recruitment</h3>
          <p class="section-subtitle">Alur Seleksi Terintegrasi: Pendaftaran → Administrasi → Interview → Pengumuman.</p>
        </div>
        <button id="btnCreateOprec" class="btn btn-primary" style="font-size: 12px; padding: 7px 14px;">
          + Buka Oprec
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${recruitments.map(rec => {
          let appStatusClass = 'pill-gray';
          if (rec.applicantStatus === 'ACCEPTED') appStatusClass = 'pill-green';
          if (rec.applicantStatus === 'PENDING') appStatusClass = 'pill-amber';
          if (rec.applicantStatus === 'REJECTED') appStatusClass = 'pill-red';

          const stageNames = ['Pendaftaran', 'Administrasi', 'Interview', 'Pengumuman'];
          const currentStageIdx = ['PENDAFTARAN', 'ADMINISTRASI', 'INTERVIEW', 'PENGUMUMAN'].indexOf(rec.currentStage);

          return `
            <div class="card" style="padding: 18px; margin-bottom: 0;">
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <span class="pill-badge pill-blue">OPEN RECRUITMENT</span>
                <span class="pill-badge ${appStatusClass}">Status: ${ApplicantStatus[rec.applicantStatus]?.label || rec.applicantStatus}</span>
              </div>

              <h4 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
                ${rec.organizationName} — ${rec.title}
              </h4>
              <div style="font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 12px;">
                ⏰ Deadline: ${rec.deadline} • 👥 ${rec.totalApplicants} Pendaftar
              </div>

              <!-- Clickable Positions -->
              <div style="margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
                  Posisi Dibuka (Ketuk untuk mendaftar):
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
                        ${isSelected ? '✅ ' : '📌 '}${p}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- 4-Stage Stepper -->
              <div style="background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; margin-bottom: 14px;">
                <div style="font-size: 11px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">
                  Alur Seleksi: <span style="color: var(--primary);">${SelectionStage[rec.currentStage]?.label}</span>
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
                ${rec.selectedPosition ? '⏩ Lanjut Tahap Seleksi (Next Step)' : '📝 Pilih Posisi & Daftar'}
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
        this.showToast(`Pendaftaran posisi ${pos} terkirim! Status: Pending Administrasi`, 'success');
        this.render();
      });
    });

    document.querySelectorAll('.btn-advance-stage').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rec = CampusRepository.openRecruitments.find(r => r.id === id);
        if (!rec.selectedPosition) {
          CampusRepository.applyToRecruitment(id, rec.positions[0]);
          this.showToast(`Otomatis mendaftar ke ${rec.positions[0]}!`, 'info');
        } else {
          CampusRepository.advanceRecruitmentSelection(id, true);
          this.showToast(`Tahap seleksi diperbarui ke: ${SelectionStage[rec.currentStage]?.label}`, 'success');
        }
        this.render();
      });
    });
  }

  showRegisterOrgModal() {
    const bodyHtml = `
      <div class="form-group">
        <label class="form-label">Nama Singkatan Organisasi</label>
        <input type="text" id="roName" class="form-control" value="UKM AI & Robotika" placeholder="Contoh: HIMATIF / GDSC" required>
      </div>
      <div class="form-group">
        <label class="form-label">Nama Lengkap Organisasi</label>
        <input type="text" id="roFullName" class="form-control" value="Unit Kegiatan Mahasiswa AI & Robotika Kampus" placeholder="Contoh: Unit Kegiatan Mahasiswa Robotika">
      </div>
      <div class="form-group">
        <label class="form-label">Kategori</label>
        <input type="text" id="roCategory" class="form-control" value="Technology" placeholder="Technology / Leadership / Social">
      </div>
      <div class="form-group">
        <label class="form-label">Nomor SK Organisasi</label>
        <input type="text" id="roSk" class="form-control" value="SK/KEMAHASISWAAN/052/2026" placeholder="SK/REKTOR/052/2026">
      </div>
      <div class="form-group">
        <label class="form-label">Nama Dosen Pembina</label>
        <input type="text" id="roAdvisor" class="form-control" value="Dr. Eng. Fajar Pratama, S.T., M.T." placeholder="Nama dosen pembina">
      </div>
      <div class="form-group">
        <label class="form-label">Kontak Resmi (Email / Instagram)</label>
        <input type="text" id="roContact" class="form-control" value="ai.robotika@campusimpact.ac.id" placeholder="email@kampus.ac.id">
      </div>
      <div class="form-group">
        <label class="form-label">Deskripsi Organisasi</label>
        <textarea id="roDesc" class="form-control" rows="3">Wadah inovasi mahasiswa dalam riset kecerdasan buatan, otomasi tepat guna, dan kompetisi robotika nasional.</textarea>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="btnSubmitRegisterOrg" class="btn btn-primary">Ajukan Registrasi UKM</button>
    `;

    this.openModal('🏛️ Registrasi Organisasi / UKM Baru', bodyHtml, footerHtml);

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

      this.showToast(`Organisasi ${name} diajukan (Pending Verifikasi)!`, 'success');
      this.closeModal();
      this.render();
    });
  }

  showCreateOprecModal() {
    const bodyHtml = `
      <div class="form-group">
        <label class="form-label">Nama Organisasi</label>
        <input type="text" id="coOrgName" class="form-control" value="BEM Fakultas Teknik" required>
      </div>
      <div class="form-group">
        <label class="form-label">Judul Rekrutmen</label>
        <input type="text" id="coTitle" class="form-control" value="Open Recruitment Kabinet Kolaborasi 2027" required>
      </div>
      <div class="form-group">
        <label class="form-label">Posisi Dibuka (Pisahkan dengan koma)</label>
        <input type="text" id="coPositions" class="form-control" value="PSDM, Advokesma, Medkom, Sosmas">
      </div>
      <div class="form-group">
        <label class="form-label">Deadline Pendaftaran</label>
        <input type="text" id="coDeadline" class="form-control" value="20 Agustus 2027">
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="btnSubmitCreateOprec" class="btn btn-primary">Publikasikan Rekrutmen</button>
    `;

    this.openModal('📢 Buka Open Recruitment Baru', bodyHtml, footerHtml);

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

      this.showToast(`Open recruitment ${orgName} berhasil dibuka!`, 'success');
      this.closeModal();
      this.render();
    });
  }

  // =========================================================================
  // SCREEN 7: EVENT HUB & QR EVENT TICKET (MODUL D)
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
          <h3 class="section-title">📅 Screen 7 — Modul D: Event Hub Kampus</h3>
          <p class="section-subtitle">Satu tempat untuk seluruh Seminar, Workshop, Webinar, Bootcamp, Volunteer, Kompetisi & Pelatihan.</p>
        </div>
        <button id="btnHeaderCreateEvent" class="btn btn-primary" style="font-size: 12px; padding: 7px 14px;">
          + Buat Event
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
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${filtered.map(event => {
          const quotaPercent = Math.min(100, Math.round(((event.registeredCount || 0) / event.quota) * 100));

          return `
            <div class="card" style="padding: 18px; margin-bottom: 0;">
              <!-- Badges -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <span class="pill-badge pill-purple">${EventType[event.type]?.label || event.type}</span>
                <span class="pill-badge pill-green">🌱 +${event.pointsReward} Poin Impact</span>
                ${event.isAttended ? '<span class="pill-badge pill-green">✅ Hadir (QR Scanned)</span>' : ''}
                ${event.isRegistered && !event.isAttended ? '<span class="pill-badge pill-blue">🎟️ Terdaftar</span>' : ''}
              </div>

              <h4 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
                ${event.title}
              </h4>
              <div style="font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 8px;">
                🏛️ Penyelenggara: ${event.organizerName}<br>
                📅 ${event.date} • 📍 ${event.location}
              </div>

              <!-- Poster Banner -->
              <div style="background: var(--primary-light); border: 1px solid var(--primary-border); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 11px; font-weight: 700; color: var(--primary-dark); margin-bottom: 8px;">
                🖼️ ${event.posterSummary}
              </div>

              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5;">
                ${event.description}
              </p>

              <!-- Quota Bar -->
              <div style="margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: var(--text-secondary);">
                  <span>Kuota Peserta</span>
                  <span>${event.registeredCount} / ${event.quota} (${quotaPercent}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: ${quotaPercent}%;"></div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${!event.isRegistered ? `
                  <button class="btn btn-primary btn-register-event" data-id="${event.id}" style="flex: 1;">
                    📝 Daftar Event & Dapatkan QR Ticket
                  </button>
                ` : `
                  <button class="btn btn-secondary btn-view-qr" data-id="${event.id}" style="flex: 1;">
                    🎟️ Lihat QR Ticket (${event.qrTicketCode})
                  </button>
                  <button class="btn ${event.isAttended ? 'btn-success' : 'btn-primary'} btn-scan-qr" data-id="${event.id}" style="flex: 1;">
                    ${event.isAttended ? '✅ Poin Masuk' : '📷 Scan QR (+10)'}
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.contentEl.innerHTML = html;

    // Filter events
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
        this.showToast(`Berhasil mendaftar di ${event.title}! QR Ticket Anda: ${event.qrTicketCode}`, 'success');
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
        <label class="form-label">Nama Event</label>
        <input type="text" id="ceTitle" class="form-control" value="Social Tech Bootcamp & Demo Day" required>
      </div>
      <div class="form-group">
        <label class="form-label">Organisasi Penyelenggara</label>
        <input type="text" id="ceOrganizer" class="form-control" value="HIMATIF & Startup Club" required>
      </div>
      <div class="form-group">
        <label class="form-label">Jenis Event</label>
        <select id="ceType" class="form-control">
          ${Object.values(EventType).map(t => `<option value="${t.code}">${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Deskripsi Event</label>
        <textarea id="ceDesc" class="form-control" rows="3">Pelatihan intensif merancang solusi digital untuk mitra UMKM dan desa binaan.</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Tanggal & Waktu</label>
        <input type="text" id="ceDate" class="form-control" value="30 November 2026 • 09:00 WIB">
      </div>
      <div class="form-group">
        <label class="form-label">Lokasi</label>
        <input type="text" id="ceLocation" class="form-control" value="Aula Timur Kampus">
      </div>
      <div class="form-group">
        <label class="form-label">Kuota Peserta</label>
        <input type="number" id="ceQuota" class="form-control" value="200" min="20">
      </div>
      <div class="form-group">
        <label class="form-label">Ringkasan Poster Event</label>
        <input type="text" id="cePoster" class="form-control" value="POSTER RESMI: Social Tech Bootcamp • Free E-Certificate">
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="btnSubmitCreateEvent" class="btn btn-primary">Publikasikan Event & Aktifkan QR</button>
    `;

    this.openModal('📅 Buat Event Kampus Baru', bodyHtml, footerHtml);

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

      this.showToast(`Event "${title}" berhasil dibuat! QR Ticket otomatis aktif.`, 'success');
      this.closeModal();
      this.render();
    });
  }

  showQrTicketModal(eventId) {
    const event = CampusRepository.events.find(e => e.id === eventId);
    if (!event) return;

    const user = CampusRepository.currentUser;
    const qrPayload = `${event.qrTicketCode}|${user.id}|${event.title}`;
    const svgQr = QrCodeGenerator.generateSvgString(qrPayload, 200, '#1E3A8A', '#464FEB');

    const bodyHtml = `
      <div style="text-align: center; padding: 10px 0;">
        <span class="pill-badge ${event.isAttended ? 'pill-green' : 'pill-blue'}" style="margin-bottom: 12px;">
          ${event.isAttended ? '✅ ATTENDANCE VERIFIED (+10 POIN)' : '🎟️ E-TICKET RESMI CAMPUS IMPACT HUB'}
        </span>

        <h3 style="font-size: 19px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
          ${event.title}
        </h3>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">
          ${event.organizerName} • ${EventType[event.type]?.label || event.type}<br>
          📅 ${event.date} • 📍 ${event.location}
        </div>

        <!-- Rendered QR Code Container -->
        <div style="display: flex; justify-content: center; margin-bottom: 14px;">
          ${svgQr}
        </div>

        <div style="
          display: inline-block;
          background: var(--primary-light);
          border: 1.5px solid var(--primary-border);
          padding: 6px 16px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: 14px;
          font-weight: 800;
          color: var(--primary-dark);
          margin-bottom: 8px;
        ">
          KODE TIKET: ${event.qrTicketCode}
        </div>

        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 16px;">
          Pemegang Tiket: <strong>${user.name}</strong> (${user.identityNumber})
        </div>

        <!-- Hari H Attendance Flow -->
        <div style="background: #ECFDF5; border: 1.5px solid #6EE7B7; border-radius: var(--radius-md); padding: 12px; text-align: left; margin-bottom: 18px;">
          <div style="font-size: 11px; font-weight: 800; color: #065F46; margin-bottom: 2px;">
            Alur Kehadiran Hari H:
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #047857;">
            ${event.isAttended 
              ? '✅ QR Scan Selesai → ✅ Attendance Tercatat → 🎉 +10 Poin Impact Ditambahkan!'
              : '📲 QR Scan → 📋 Attendance → 🌱 Poin Bertambah (+10 Impact Score)'}
          </div>
        </div>

        <!-- Simulation Buttons -->
        ${!event.isAttended ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="btnScanAsAttendee" class="btn btn-success">
              📷 Simulasi Scan QR Kehadiran (Hari H) • +10 Poin
            </button>
            <button id="btnScanAsCommittee" class="btn btn-primary">
              ⭐ Scan QR sebagai Panitia Event • +20 Impact & +20 Leadership
            </button>
          </div>
        ` : `
          <div style="font-size: 12px; font-weight: 700; color: var(--success); text-align: center;">
            Kehadiran Anda telah terverifikasi pada event ini!
          </div>
        `}
      </div>
    `;

    this.openModal(`E-Ticket: ${event.qrTicketCode}`, bodyHtml, `<button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>`);

    if (!event.isAttended) {
      document.getElementById('btnScanAsAttendee').addEventListener('click', () => {
        const pts = CampusRepository.confirmEventAttendanceByQr(event.id, false);
        this.showToast(`QR Scan Berhasil! Kehadiran tercatat & Impact Score +${pts} Poin!`, 'success');
        this.closeModal();
        this.render();
      });

      document.getElementById('btnScanAsCommittee').addEventListener('click', () => {
        const pts = CampusRepository.confirmEventAttendanceByQr(event.id, true);
        this.showToast(`QR Scan Panitia Berhasil! +${pts} Impact Score & +20 Leadership Score!`, 'success');
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
      <!-- 1. Hero Analytics -->
      <div class="card hero-green" style="padding: 24px; margin-bottom: 24px;">
        <span class="pill-badge pill-green" style="background: rgba(255,255,255,0.25); color: #fff; margin-bottom: 12px;">
          🌟 SCREEN 9 • MODUL E: IMPACT & PORTFOLIO HUB
        </span>
        <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 4px;">
          My Impact & Leadership Analytics
        </h2>
        <p style="font-size: 12px; opacity: 0.9; margin-bottom: 18px;">
          Pengukuran kuantitatif kontribusi pengabdian masyarakat, kepemimpinan organisasi, dan jam sosial mahasiswa.
        </p>

        <!-- Dual Big Scores Row -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px;">
          <div style="background: #047857; border: 2px solid #34D399; border-radius: var(--radius-md); padding: 16px;">
            <div style="font-size: 12px; font-weight: 700; color: #A7F3D0; margin-bottom: 4px;">🌱 Impact Score</div>
            <div style="font-size: 36px; font-weight: 900; line-height: 1.1;">${user.impactScore}</div>
            <div style="font-size: 11px; color: #D1FAE5; margin-top: 4px;">Top 3% Kontributor Kampus</div>
          </div>

          <div style="background: #1E3A8A; border: 2px solid #60A5FA; border-radius: var(--radius-md); padding: 16px;">
            <div style="font-size: 12px; font-weight: 700; color: #BFDBFE; margin-bottom: 4px;">⭐ Leadership Score</div>
            <div style="font-size: 36px; font-weight: 900; line-height: 1.1;">${user.leadershipScore}</div>
            <div style="font-size: 11px; color: #DBEAFE; margin-top: 4px;">Pengurus • Panitia • Ketua Tim</div>
          </div>
        </div>

        <!-- 4 Summary Metrics -->
        <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 12px; font-weight: 700; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: var(--radius-md);">
          <span>📌 Project: <strong>${user.projectsCompleted}</strong></span>
          <span>🏪 UMKM Dibantu: <strong>${user.umkmHelped}</strong></span>
          <span>👥 Beneficiaries: <strong>${user.beneficiariesReached}+</strong></span>
          <span>⏱️ Jam Kontribusi: <strong>${user.contributionHours} Jam</strong></span>
        </div>
      </div>

      <!-- 2. Modul F: Activity Point System Table -->
      <div class="section-header">
        <div>
          <h3 class="section-title">🏆 Modul F — Activity Point System</h3>
          <p class="section-subtitle">Setiap aktivitas terverifikasi otomatis menambah Impact Score & Leadership Score mahasiswa.</p>
        </div>
      </div>

      <div class="card" style="padding: 18px; margin-bottom: 28px;">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${rules.map((r, idx) => `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; ${idx < rules.length - 1 ? 'border-bottom: 1px solid var(--border-color); padding-bottom: 12px;' : ''}">
              <div>
                <div style="font-size: 13px; font-weight: 800; color: var(--text-primary);">${r.activityName}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${r.description}</div>
              </div>
              <span class="pill-badge pill-green" style="font-size: 12px; padding: 6px 12px;">
                +${r.points} Poin
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 3. Student Portfolio -->
      <div class="section-header">
        <div>
          <h3 class="section-title">🎓 Student Portfolio Terverifikasi</h3>
          <p class="section-subtitle">Rekam jejak kontribusi sosial yang terukur dan dapat dibuktikan saat lulus (Pendamping Ijazah & SKPI).</p>
        </div>
        <button id="btnExportPortfolio" class="section-action">
          📤 Export CV Dampak
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
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${filteredPf.map(entry => `
          <div class="card" style="padding: 16px; margin-bottom: 0;">
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px;">
              <span class="pill-badge pill-blue">${entry.category}</span>
              <span class="pill-badge pill-green">🌱 +${entry.impactPoints} Impact</span>
              ${entry.leadershipPoints > 0 ? `<span class="pill-badge pill-amber">⭐ +${entry.leadershipPoints} Leadership</span>` : ''}
            </div>

            <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
              ${entry.title}
            </h4>
            <div style="font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 6px;">
              ${entry.organizationOrPartner} • ${entry.date} • ID: ${entry.credentialCode}
            </div>

            <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
              ${entry.outcomeSummary}
            </p>
          </div>
        `).join('')}
      </div>
    `;

    this.contentEl.innerHTML = html;

    // Filter events
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
      <div id="skpiDocumentPrintArea" style="padding: 10px 4px; line-height: 1.6;">
        <div style="border-bottom: 2px solid var(--primary); padding-bottom: 12px; margin-bottom: 14px; text-align: center;">
          <h3 style="font-size: 18px; font-weight: 900; color: var(--primary-dark); margin-bottom: 2px;">
            CAMPUS IMPACT HUB — SURAT KETERANGAN PENDAMPING IJAZAH (SKPI)
          </h3>
          <div style="font-size: 11px; color: var(--text-muted);">
            Sertifikasi Rekam Jejak Dampak Sosial & Kepemimpinan Mahasiswa Terverifikasi
          </div>
        </div>

        <div style="background: var(--surface-alt); padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: 16px; font-size: 12px;">
          <div><strong>Nama Mahasiswa:</strong> ${user.name}</div>
          <div><strong>Nomor Induk / Identitas:</strong> ${user.identityNumber}</div>
          <div><strong>Program Studi / Unit:</strong> ${user.majorOrUnit}</div>
          <div><strong>Total Impact Score:</strong> <span style="color: var(--success); font-weight: 800;">${user.impactScore} Poin</span></div>
          <div><strong>Total Leadership Score:</strong> <span style="color: var(--primary); font-weight: 800;">${user.leadershipScore} Poin</span></div>
          <div><strong>Total Kontribusi Sosial:</strong> ${user.projectsCompleted} Proyek Selesai • ${user.umkmHelped} UMKM Dibantu • ${user.beneficiariesReached}+ Penerima Manfaat</div>
        </div>

        <div style="font-size: 12px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">
          Daftar Riwayat Portofolio Terverifikasi:
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px;">
          ${CampusRepository.portfolioEntries.map((e, idx) => `
            <div style="border-left: 3px solid var(--primary); padding-left: 10px; font-size: 11px;">
              <strong>${idx + 1}. ${e.title}</strong> (${e.category})<br>
              <span style="color: var(--text-muted);">${e.organizationOrPartner} • ${e.date} • Credential: ${e.credentialCode}</span><br>
              <em>${e.outcomeSummary}</em>
            </div>
          `).join('')}
        </div>

        <div style="font-size: 11px; color: var(--success-dark); background: #D1FAE5; padding: 10px 14px; border-radius: var(--radius-sm);">
          ✅ Dokumen portofolio ini sah secara digital dalam ekosistem Campus Impact Hub & kompatibel dengan kurikulum MBKM.
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>
      <button id="btnPrintCv" class="btn btn-secondary">🖨️ Cetak / Simpan PDF</button>
      <button id="btnCopyCvLink" class="btn btn-primary">📋 Salin Tautan Portofolio</button>
    `;

    this.openModal('📄 Portofolio Dampak & SKPI Mahasiswa', bodyHtml, footerHtml);

    document.getElementById('btnPrintCv').addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btnCopyCvLink').addEventListener('click', () => {
      const shareUrl = `${window.location.origin}/#portfolio?user=${user.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Tautan portofolio berhasil disalin ke clipboard!', 'success');
      }).catch(() => {
        this.showToast(`Tautan: ${shareUrl}`, 'info');
      });
    });
  }

  // =========================================================================
  // SCREEN 10: PROFILE, ROLE SWITCHER & TECH ARCHITECTURE
  // =========================================================================
  renderProfileScreen() {
    const user = CampusRepository.currentUser;
    const roleMeta = UserRole[user.role.toUpperCase()] || UserRole.STUDENT;

    const html = `
      <!-- LinkedIn-Style Profile Banner Card -->
      <div class="card" style="padding: 24px; margin-bottom: 20px;">
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 14px;">
          <div class="avatar-circle" style="width: 64px; height: 64px; font-size: 24px;">
            ${(user.name || 'CI').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
              ${user.name}
            </h3>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
              ${user.majorOrUnit}
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">
              ${user.email} • ${user.identityNumber}
            </div>
          </div>
        </div>

        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px;">
          ${user.bio}
        </p>

        <!-- Skills and Interests -->
        <div style="background: var(--surface-alt); padding: 12px 14px; border-radius: var(--radius-md); font-size: 12px; margin-bottom: 18px;">
          <div style="margin-bottom: 6px;">
            <strong>Keahlian:</strong> ${user.skills.join(' • ')}
          </div>
          <div>
            <strong>Minat AI Recommendation:</strong> ${user.interests.join(', ')}
          </div>
        </div>

        <!-- Role Change Buttons -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="btnProfileSwitchRole" class="btn btn-primary" style="flex: 1;">
            🔄 Ganti Role Pengguna (${roleMeta.label})
          </button>
          <button id="btnProfileGoAuth" class="btn btn-secondary" style="flex: 1;">
            🔐 Buka Screen 1: Login / Register
          </button>
        </div>
      </div>

      <!-- Cloud Architecture & Database Preview -->
      <div class="section-header">
        <div>
          <h3 class="section-title">☁️ Arsitektur Teknologi & Database MVP</h3>
          <p class="section-subtitle">Web Frontend (SPA) → Supabase API → Supabase Auth → PostgreSQL → Supabase Storage</p>
        </div>
      </div>

      <div class="card" style="padding: 20px; margin-bottom: 20px;">
        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px;">
          <strong>Stack Arsitektur Sistem Campus Impact Hub:</strong><br>
          1. <strong>Web Frontend:</strong> Modern Material Design 3, Responsive Mobile/Desktop SPA, Zero-Dependency Client<br>
          2. <strong>Supabase API:</strong> RESTful & Realtime Data Sync<br>
          3. <strong>Supabase Auth:</strong> Multi-Role Authentication (Student, Partner, Organization, Admin)<br>
          4. <strong>PostgreSQL:</strong> Relational Database (Users, Projects, Applications, Organizations, Recruitment, Events, Impact Reports)<br>
          5. <strong>Supabase Storage:</strong> Cloud Bucket untuk Foto Dokumentasi Lapangan, SK Organisasi, dan Poster Event
        </p>

        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="btnViewDbJson" class="btn btn-primary" style="flex: 1;">
            🗄️ Lihat JSON Snapshot Database MVP (Live Data)
          </button>
          <button id="btnResetData" class="btn btn-outline" style="border-color: var(--danger); color: var(--danger);">
            ♻️ Reset Data ke Awal
          </button>
        </div>
      </div>

      <!-- Roadmap & Elevator Pitch -->
      <div class="card" style="padding: 20px;">
        <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">
          🗺️ Roadmap Pengembangan Campus Impact Hub
        </h4>
        <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px;">
          • <strong>MVP (2 Minggu):</strong> ✅ Login/Register, ✅ Dashboard, ✅ Project Marketplace, ✅ Submit Problem, ✅ Organization Directory, ✅ Open Recruitment, ✅ Event Hub, ✅ Impact Score<br>
          • <strong>V1 (1 Bulan):</strong> ✅ Chat Tim, ✅ Upload Dokumen, ✅ QR Attendance, ✅ Leadership Score<br>
          • <strong>V2 (2-3 Bulan):</strong> ✅ AI Recommendation, ✅ AI Problem Matching, ✅ Heatmap Masalah Sosial, ✅ SDGs Tracker<br>
          • <strong>V3 (6 Bulan):</strong> ✅ Integrasi MBKM, ✅ Integrasi Skripsi, ✅ Integrasi Pengabdian Dosen, ✅ Sertifikat Otomatis, ✅ Campus Reputation Analytics
        </div>

        <div style="background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: var(--radius-md); padding: 12px; font-size: 12px; color: #065F46; font-style: italic;">
          💡 <strong>Elevator Pitch:</strong><br>
          "Campus Impact Hub adalah Super App Ekosistem Kampus yang mengintegrasikan pengabdian masyarakat, marketplace proyek sosial, rekrutmen organisasi, manajemen event, serta portofolio dampak mahasiswa dalam satu platform terpadu. Mahasiswa tidak hanya lulus dengan IPK, tetapi juga dengan rekam jejak kontribusi sosial yang terukur dan dapat dibuktikan."
        </div>
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.getElementById('btnProfileSwitchRole').addEventListener('click', () => this.showRoleSwitcherModal());
    document.getElementById('btnProfileGoAuth').addEventListener('click', () => this.switchTab('auth'));

    document.getElementById('btnViewDbJson').addEventListener('click', () => {
      const jsonStr = CampusRepository.getMvpDatabaseJsonSnapshot();
      const bodyHtml = `
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">
          Snapshot data relasional sistem PostgreSQL / Supabase API:
        </div>
        <pre style="
          background: #0F172A;
          color: #38BDF8;
          padding: 14px;
          border-radius: var(--radius-md);
          font-family: monospace;
          font-size: 11px;
          max-height: 380px;
          overflow: auto;
        ">${jsonStr}</pre>
      `;

      const footerHtml = `
        <button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>
        <button id="btnCopyJson" class="btn btn-primary">📋 Salin JSON</button>
      `;

      this.openModal('🗄️ JSON Struktur Database MVP (Supabase)', bodyHtml, footerHtml);

      document.getElementById('btnCopyJson').addEventListener('click', () => {
        navigator.clipboard.writeText(jsonStr).then(() => {
          this.showToast('JSON Database berhasil disalin!', 'success');
        });
      });
    });

    document.getElementById('btnResetData').addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin mereset seluruh data simulasi kembali ke kondisi awal?')) {
        CampusRepository.resetToDefault();
        this.showToast('Data simulasi berhasil direset ke kondisi awal.', 'info');
        this.render();
      }
    });
  }

  // =========================================================================
  // ROLE SWITCHER MODAL (4 ROLES)
  // =========================================================================
  showRoleSwitcherModal() {
    const roles = Object.values(UserRole);
    const currentUser = CampusRepository.currentUser;

    const bodyHtml = `
      <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
        Pilih sudut pandang ekosistem untuk menguji fitur Campus Impact Hub secara menyeluruh:
      </p>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${roles.map(r => {
          const isSelected = currentUser.role === r.code;
          return `
            <div class="card role-select-card" data-role="${r.code}" style="
              padding: 14px;
              margin-bottom: 0;
              cursor: pointer;
              border: 2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
              background: ${isSelected ? 'var(--primary-light)' : 'var(--surface)'};
              transition: all 0.2s;
            ">
              <div style="font-weight: 800; font-size: 14px; color: ${isSelected ? 'var(--primary-dark)' : 'var(--text-primary)'}; margin-bottom: 2px;">
                ${isSelected ? '✅ ' : '👤 '}${r.label} <span style="font-size: 11px; font-weight: 600; color: var(--primary);">(${r.badgeTitle})</span>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary);">
                ${r.description}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>
      <button id="btnModalGoAuth" class="btn btn-secondary">🔐 Screen 1: Login & Register Lengkap</button>
    `;

    this.openModal('🔄 Pilih Role Pengguna (4 Role Ekosistem)', bodyHtml, footerHtml);

    document.querySelectorAll('.role-select-card').forEach(card => {
      card.addEventListener('click', () => {
        const role = card.getAttribute('data-role');
        CampusRepository.switchRole(role);
        this.showToast(`Mode aktif: ${UserRole[role.toUpperCase()]?.label} (${CampusRepository.currentUser.name})`, 'success');
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
