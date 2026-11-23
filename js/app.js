/**
 * Campus Impact Hub - Main Application Orchestrator (Web Application)
 * Complete Multi-Role Architecture:
 * - Student (View & Registration User)
 * - Organization / BEM / UKM (Organization Registration, SK Upload, Event & Manual Attendance Management)
 * - Partner / UMKM (Problem Submission, My Projects Monitoring & 5-Criteria Student Performance Evaluation)
 * - Admin / Lecturer (Student Management, SK Verification, Event & Project Approval, Database & Audit Inspector)
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
import { CampusRepository } from './repository.js';
import { FirebaseAuthService } from './firebase-auth.js';
import { Icons } from './icons.js';

class CampusImpactHubApp {
  constructor() {
    this.currentTab = CampusRepository.isLoggedIn ? 'home' : 'auth';
    this.showPassword = false;
    this.isRegisterMode = false;
    this.registerCategory = 'student';
    this.pendingSkUpload = null; // { name, type, size, data }

    // Filters & UI state
    this.projectSearchQuery = '';
    this.selectedProjectCategoryFilter = 'Semua';
    this.selectedProjectStatusFilter = 'Semua';
    this.orgSearchQuery = '';
    this.eventSearchQuery = '';
    this.selectedEventTypeFilter = 'Semua';
    this.selectedPortfolioFilter = 'Semua';
    this.participantSelectedEventId = '';
    this.participantSearchQuery = '';
    this.participantStatusFilter = 'Semua';
    this.adminStudentSearch = '';
    this.adminStudentStatusFilter = 'Semua';
    this.adminDbSubTab = 'inspection'; // inspection | integrity | logs | config
    this.adminDbTable = 'users';
    this.adminDbSearch = '';

    this.initDOMElements();
    this.bindGlobalEvents();
    CampusRepository.onDatabaseSync(() => {
      if (!CampusRepository.isLoggedIn && this.currentTab !== 'auth') {
        this.currentTab = 'auth';
      }
      this.render();
    });
    FirebaseAuthService.syncConfigFromServer().then(() => this.render());
    this.render();
  }

  initDOMElements() {
    this.contentEl = document.getElementById('contentContainer');
    this.appSidebar = document.getElementById('appSidebar');
    this.sidebarNavMenu = document.getElementById('sidebarNavMenu');
    this.sidebarMenuHeading = document.getElementById('sidebarMenuHeading');
    this.sidebarQuickAction = document.getElementById('sidebarQuickAction');
    this.sidebarDbBadge = document.getElementById('sidebarDbBadge');
    this.sidebarDbText = document.getElementById('sidebarDbText');
    this.bottomNavTabs = document.getElementById('bottomNavTabs');
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
    if (this.brandLogoEl) {
      this.brandLogoEl.addEventListener('click', () => {
        this.switchTab(CampusRepository.isLoggedIn ? 'home' : 'auth');
      });
    }

    if (this.headerImpactPill) {
      this.headerImpactPill.addEventListener('click', () => {
        if (CampusRepository.isLoggedIn && CampusRepository.hasRole('student')) {
          this.switchTab('portfolio');
        }
      });
    }
    if (this.headerLeadershipPill) {
      this.headerLeadershipPill.addEventListener('click', () => {
        if (CampusRepository.isLoggedIn && CampusRepository.hasRole('student')) {
          this.switchTab('portfolio');
        }
      });
    }

    if (this.btnHeaderLogout) {
      this.btnHeaderLogout.addEventListener('click', async () => {
        await CampusRepository.logout();
        this.showToast('Sesi berakhir. Anda telah keluar dari akun.', 'info');
        this.switchTab('auth');
      });
    }

    if (this.sidebarUserCard) {
      this.sidebarUserCard.addEventListener('click', () => {
        if (!CampusRepository.isLoggedIn) {
          this.switchTab('auth');
          return;
        }
        const role = (CampusRepository.currentUser.role || 'student').toLowerCase();
        if (role === 'student') this.switchTab('profile');
        else if (role === 'organization') this.switchTab('org_profile');
        else this.showEditAccountModal();
      });
    }

    if (this.sidebarDbBadge) {
      this.sidebarDbBadge.addEventListener('click', () => {
        if (CampusRepository.hasRole('admin')) {
          this.switchTab('admin_database');
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

  // Centralized Role Tab Guard
  getAllowedTabsForRole(role) {
    switch ((role || 'student').toLowerCase()) {
      case 'student':
        return ['home', 'projects', 'organizations', 'events', 'portfolio', 'profile'];
      case 'organization':
        return ['home', 'org_registration', 'org_profile', 'org_events', 'org_participants'];
      case 'partner':
        return ['home', 'partner_submit', 'partner_projects', 'partner_evaluations'];
      case 'admin':
        return ['home', 'admin_students', 'admin_organizations', 'admin_org_verification', 'admin_events', 'admin_projects', 'admin_database'];
      default:
        return ['home'];
    }
  }

  async switchTab(tabName) {
    if (tabName === 'logout') {
      await CampusRepository.logout();
      this.showToast('Anda telah keluar dari akun.', 'info');
      this.currentTab = 'auth';
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!CampusRepository.isLoggedIn && tabName !== 'auth') {
      this.currentTab = 'auth';
      this.render();
      return;
    }

    if (CampusRepository.isLoggedIn && tabName !== 'auth') {
      const role = (CampusRepository.currentUser.role || 'student').toLowerCase();
      const allowed = this.getAllowedTabsForRole(role);
      if (!allowed.includes(tabName)) {
        this.showToast('Akses ditolak (RBAC): Modul tersebut tidak tersedia untuk peran akun Anda.', 'danger');
        this.currentTab = 'home';
        this.render();
        return;
      }
    }

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
    if (this.modalBody) this.modalBody.scrollTop = 0;
    this.modalBackdrop.classList.add('open');
  }

  closeModal() {
    this.modalBackdrop.classList.remove('open');
  }

  _reRenderPreservingFocus(inputId, renderMethod) {
    const prevEl = document.getElementById(inputId);
    const selStart = prevEl && typeof prevEl.selectionStart === 'number' ? prevEl.selectionStart : null;
    const selEnd = prevEl && typeof prevEl.selectionEnd === 'number' ? prevEl.selectionEnd : null;
    renderMethod.call(this);
    const nextEl = document.getElementById(inputId);
    if (nextEl) {
      nextEl.focus();
      if (selStart !== null && selEnd !== null && typeof nextEl.setSelectionRange === 'function') {
        try { nextEl.setSelectionRange(selStart, selEnd); } catch (_) {}
      }
    }
  }

  // =========================================================================
  // ROLE-SPECIFIC NAVIGATION CONFIGURATION (SECTION 3 SPECIFICATION)
  // =========================================================================
  getRoleSidebarConfig(role, user) {
    const openProjectsCount = CampusRepository.getOpenProjectsCount();
    const verifiedOrgsCount = CampusRepository.getVerifiedOrganizationsCount();
    const pendingOrgsCount = CampusRepository.getPendingOrganizationsCount();
    const publishedEventsCount = CampusRepository.getPublishedEvents().length;
    const myOrg = CampusRepository.getMyOrganization();
    const myOrgEvents = (CampusRepository.events || []).filter(e => CampusRepository.isOwnEvent(e));
    const myPartnerProjects = (CampusRepository.projects || []).filter(p => CampusRepository.isOwnProject(p));
    const pendingProjectsCount = CampusRepository.getPendingProjectsCount();

    switch (role) {
      case 'student':
        return {
          heading: 'NAVIGASI MAHASISWA',
          quickAction: {
            label: 'Cari Proyek Sosial',
            icon: Icons.project(15),
            onClick: () => this.switchTab('projects')
          },
          items: [
            { tab: 'home', label: 'Dashboard', mobileLabel: 'Dashboard', icon: Icons.home(18) },
            { tab: 'projects', label: 'Proyek Sosial', mobileLabel: 'Proyek', icon: Icons.project(18), badge: `${openProjectsCount} Open` },
            { tab: 'organizations', label: 'Organisasi', mobileLabel: 'Organisasi', icon: Icons.organization(18), badge: `${verifiedOrgsCount} Resmi` },
            { tab: 'events', label: 'Event Kampus', mobileLabel: 'Event', icon: Icons.event(18), badge: `${publishedEventsCount}` },
            { tab: 'portfolio', label: 'Portofolio', mobileLabel: 'Portofolio', icon: Icons.award(18), badge: `${user.impactScore || 0} Poin` },
            { tab: 'profile', label: 'Profil', mobileLabel: 'Profil', icon: Icons.user(18) }
          ]
        };

      case 'organization':
        return {
          heading: 'NAVIGASI ORGANISASI (BEM / UKM)',
          quickAction: {
            label: myOrg && myOrg.verificationStatus === 'VERIFIED' ? 'Buat Event Kampus' : 'Lengkapi Pendaftaran SK',
            icon: Icons.plus(15),
            onClick: () => {
              if (myOrg && myOrg.verificationStatus === 'VERIFIED') {
                this.showCreateEventModal();
              } else {
                this.switchTab('org_registration');
              }
            }
          },
          items: [
            { tab: 'home', label: 'Dashboard', mobileLabel: 'Dashboard', icon: Icons.home(18), badge: myOrg ? myOrg.verificationStatus : 'Pending' },
            { tab: 'org_registration', label: 'Pendaftaran Organisasi', mobileLabel: 'Pendaftaran', icon: Icons.upload(18), badge: 'SK' },
            { tab: 'org_profile', label: 'Profil Organisasi', mobileLabel: 'Profil UKM', icon: Icons.organization(18) },
            { tab: 'org_events', label: 'Manajemen Event', mobileLabel: 'Event', icon: Icons.event(18), badge: `${myOrgEvents.length}` },
            { tab: 'org_participants', label: 'Daftar Peserta', mobileLabel: 'Peserta', icon: Icons.users(18) }
          ]
        };

      case 'partner':
        return {
          heading: 'NAVIGASI MITRA / UMKM',
          quickAction: {
            label: 'Ajukan Masalah UMKM',
            icon: Icons.plus(15),
            onClick: () => this.switchTab('partner_submit')
          },
          items: [
            { tab: 'home', label: 'Dashboard', mobileLabel: 'Dashboard', icon: Icons.home(18), badge: 'UMKM' },
            { tab: 'partner_submit', label: 'Pengajuan Masalah', mobileLabel: 'Pengajuan', icon: Icons.upload(18) },
            { tab: 'partner_projects', label: 'Proyek Saya', mobileLabel: 'Proyek Saya', icon: Icons.project(18), badge: `${myPartnerProjects.length}` },
            { tab: 'partner_evaluations', label: 'Penilaian Mahasiswa', mobileLabel: 'Penilaian', icon: Icons.star(18), badge: `${(CampusRepository.partnerEvaluations || []).length}` }
          ]
        };

      case 'admin':
      default:
        return {
          heading: 'NAVIGASI ADMIN / DOSEN',
          quickAction: {
            label: `Verifikasi Organisasi (${pendingOrgsCount})`,
            icon: Icons.shieldCheck(15),
            onClick: () => this.switchTab('admin_org_verification')
          },
          items: [
            { tab: 'home', label: 'Dashboard', mobileLabel: 'Dashboard', icon: Icons.home(18), badge: 'Admin' },
            { tab: 'admin_students', label: 'Mahasiswa', mobileLabel: 'Mahasiswa', icon: Icons.users(18), badge: `${CampusRepository.getStudentUsers().length}` },
            { tab: 'admin_organizations', label: 'Organisasi', mobileLabel: 'Organisasi', icon: Icons.organization(18), badge: `${CampusRepository.getTotalOrganizations()}` },
            { tab: 'admin_org_verification', label: 'Verifikasi Organisasi', mobileLabel: 'Verifikasi SK', icon: Icons.shieldCheck(18), badge: pendingOrgsCount > 0 ? `${pendingOrgsCount} Pending` : 'OK' },
            { tab: 'admin_events', label: 'Event Kampus', mobileLabel: 'Event', icon: Icons.event(18), badge: `${CampusRepository.getTotalEvents()}` },
            { tab: 'admin_projects', label: 'Proyek Sosial', mobileLabel: 'Proyek', icon: Icons.project(18), badge: pendingProjectsCount > 0 ? `${pendingProjectsCount} Review` : `${CampusRepository.getTotalProjects()}` },
            { tab: 'admin_database', label: 'Database & Sistem', mobileLabel: 'Database', icon: Icons.database(18) }
          ]
        };
    }
  }

  updateHeaderAndSidebar() {
    const isAuthMode = !CampusRepository.isLoggedIn || this.currentTab === 'auth';
    document.body.classList.toggle('logged-out', isAuthMode);

    const user = CampusRepository.currentUser || {};
    const isLoggedIn = CampusRepository.isLoggedIn;
    const role = (user.role || 'student').toLowerCase();
    const roleMeta = UserRole[role.toUpperCase()] || UserRole.STUDENT;

    if (this.appSidebar) {
      this.appSidebar.setAttribute('data-role', role);
    }

    if (this.roleSwitcherLabel) {
      this.roleSwitcherLabel.textContent = isLoggedIn ? `Peran: ${roleMeta.label}` : 'Belum Masuk';
    }

    const showPersonalScores = isLoggedIn && role === 'student';
    if (this.headerImpactPill) {
      this.headerImpactPill.style.display = showPersonalScores ? 'inline-flex' : 'none';
      this.headerImpactPill.innerHTML = `<span class="indicator-dot"></span><span>Impact: <strong>${user.impactScore || 0}</strong></span>`;
    }
    if (this.headerLeadershipPill) {
      this.headerLeadershipPill.style.display = showPersonalScores ? 'inline-flex' : 'none';
      this.headerLeadershipPill.innerHTML = `<span class="indicator-dot"></span><span>Leadership: <strong>${user.leadershipScore || 0}</strong></span>`;
    }

    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    const sidebarUserUnit = document.getElementById('sidebarUserUnit');

    if (sidebarAvatar) {
      if (isLoggedIn && user.name) {
        const parts = user.name.trim().split(' ');
        const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]) : parts[0].slice(0, 2);
        sidebarAvatar.textContent = initials.toUpperCase();
      } else {
        sidebarAvatar.textContent = 'CI';
      }
    }
    if (sidebarUserName) sidebarUserName.textContent = isLoggedIn ? (user.name || 'Pengguna') : 'Tamu';
    if (sidebarUserRole) sidebarUserRole.textContent = isLoggedIn ? `${roleMeta.label} (${user.accountStatus || 'Active'})` : 'Silakan Masuk';
    if (sidebarUserUnit) sidebarUserUnit.textContent = isLoggedIn ? (user.majorOrUnit || roleMeta.badgeTitle) : '';
    if (this.sidebarDbText) this.sidebarDbText.textContent = CampusRepository.dbEngine || 'PostgreSQL 16 (Docker)';

    const roleConfig = this.getRoleSidebarConfig(role, user);
    if (this.sidebarMenuHeading) this.sidebarMenuHeading.textContent = roleConfig.heading;

    if (this.sidebarQuickAction && roleConfig.quickAction) {
      this.sidebarQuickAction.innerHTML = `
        <button type="button" class="btn btn-primary btn-block" id="btnSidebarRoleAction" style="font-size: 12.5px; padding: 9px 12px; justify-content: center;">
          ${roleConfig.quickAction.icon}
          <span>${roleConfig.quickAction.label}</span>
        </button>
      `;
      const actionBtn = document.getElementById('btnSidebarRoleAction');
      if (actionBtn) actionBtn.addEventListener('click', () => roleConfig.quickAction.onClick());
    }

    if (this.sidebarNavMenu) {
      const itemsHtml = roleConfig.items
        .map(item => {
          const isActive = this.currentTab === item.tab;
          return `
            <li class="nav-item ${isActive ? 'active' : ''}" data-tab="${item.tab}">
              <div class="nav-item-left">
                <span class="icon">${item.icon}</span>
                <span class="nav-item-text">${item.label}</span>
              </div>
              ${item.badge !== undefined ? `<span class="nav-badge">${item.badge}</span>` : ''}
            </li>
          `;
        })
        .join('');

      const logoutHtml = `
        <li class="nav-item" data-tab="logout" style="margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 12px; color: var(--danger);">
          <div class="nav-item-left">
            <span class="icon" style="color: var(--danger);">${Icons.logOut(18)}</span>
            <span class="nav-item-text">Keluar (Logout)</span>
          </div>
        </li>
      `;

      this.sidebarNavMenu.innerHTML = itemsHtml + logoutHtml;
      this.sidebarNavMenu.querySelectorAll('[data-tab]').forEach(el => {
        el.addEventListener('click', () => this.switchTab(el.getAttribute('data-tab')));
      });
    }

    if (this.bottomNavTabs) {
      this.bottomNavTabs.innerHTML = roleConfig.items
        .map(item => {
          const isActive = this.currentTab === item.tab;
          return `
            <li class="bottom-tab ${isActive ? 'active' : ''}" data-tab="${item.tab}">
              <span class="tab-icon">${item.icon}</span>
              <span class="tab-label">${item.mobileLabel || item.label}</span>
            </li>
          `;
        })
        .join('');

      this.bottomNavTabs.querySelectorAll('[data-tab]').forEach(el => {
        el.addEventListener('click', () => this.switchTab(el.getAttribute('data-tab')));
      });
    }
  }

  render() {
    this.updateHeaderAndSidebar();
    this.contentEl.innerHTML = '';

    if (!CampusRepository.isLoggedIn || this.currentTab === 'auth') {
      this.renderAuthScreen();
      return;
    }

    const role = (CampusRepository.currentUser.role || 'student').toLowerCase();
    const allowed = this.getAllowedTabsForRole(role);
    if (!allowed.includes(this.currentTab)) {
      this.currentTab = 'home';
      this.updateHeaderAndSidebar();
    }

    switch (this.currentTab) {
      case 'home':
        this.renderHomeDashboard();
        break;
      // Student Modules
      case 'projects':
        this.renderStudentProjectsView();
        break;
      case 'organizations':
        this.renderStudentOrganizationsView();
        break;
      case 'events':
        this.renderStudentEventsView();
        break;
      case 'portfolio':
        this.renderStudentPortfolioView();
        break;
      case 'profile':
        this.renderStudentProfileView();
        break;
      // Organization Modules
      case 'org_registration':
        this.renderOrgRegistrationView();
        break;
      case 'org_profile':
        this.renderOrgProfileView();
        break;
      case 'org_events':
        this.renderOrgEventsManagementView();
        break;
      case 'org_participants':
        this.renderOrgParticipantsView();
        break;
      // Partner UMKM Modules
      case 'partner_submit':
        this.renderPartnerProblemSubmitView();
        break;
      case 'partner_projects':
        this.renderPartnerMyProjectsView();
        break;
      case 'partner_evaluations':
        this.renderPartnerEvaluationsView();
        break;
      // Admin Modules
      case 'admin_students':
        this.renderAdminStudentsView();
        break;
      case 'admin_organizations':
        this.renderAdminOrganizationsView();
        break;
      case 'admin_org_verification':
        this.renderAdminOrgVerificationView();
        break;
      case 'admin_events':
        this.renderAdminEventsView();
        break;
      case 'admin_projects':
        this.renderAdminProjectsView();
        break;
      case 'admin_database':
        this.renderAdminDatabaseAndSystemView();
        break;
      default:
        this.renderHomeDashboard();
    }
  }

  // =========================================================================
  // AUTHENTICATION & DYNAMIC MULTI-ROLE REGISTRATION (SECTIONS 4 & 5)
  // =========================================================================
  renderAuthScreen() {
    const devProfile = CampusRepository.getDeveloperProfile();
    const isRegister = this.isRegisterMode === true;
    const cat = this.registerCategory || 'student';

    const renderDynamicRegistrationFields = () => {
      if (cat === 'student') {
        return `
          <div class="form-group" style="margin-bottom: 10px;">
            <label class="form-label">Nama Lengkap Mahasiswa <span style="color: var(--danger);">*</span></label>
            <input type="text" id="regName" class="form-control" placeholder="Nama lengkap sesuai KTM" required>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">NIM <span style="color: var(--danger);">*</span></label>
              <input type="text" id="regNim" class="form-control" placeholder="Contoh: 13523099" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Email Kampus <span style="color: var(--danger);">*</span></label>
              <input type="email" id="regEmail" class="form-control" placeholder="nama@kampus.ac.id" required>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Fakultas <span style="color: var(--danger);">*</span></label>
              <input type="text" id="regFaculty" class="form-control" placeholder="Fakultas Ilmu Komputer" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Program Studi <span style="color: var(--danger);">*</span></label>
              <input type="text" id="regStudyProgram" class="form-control" placeholder="S1 Teknik Informatika" required>
            </div>
          </div>
        `;
      }

      if (cat === 'organization') {
        return `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Nama Organisasi (BEM/UKM) <span style="color: var(--danger);">*</span></label>
              <input type="text" id="regName" class="form-control" placeholder="Contoh: UKM Robotika" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Kategori Organisasi <span style="color: var(--danger);">*</span></label>
              <select id="regOrgCategory" class="form-control">
                <option value="Teknologi & Sains">Teknologi &amp; Sains</option>
                <option value="Kepemimpinan & BEM">Kepemimpinan &amp; BEM</option>
                <option value="Sosial & Pengabdian">Sosial &amp; Pengabdian</option>
                <option value="Seni & Olahraga">Seni &amp; Olahraga</option>
              </select>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Tingkat Organisasi <span style="color: var(--danger);">*</span></label>
              <select id="regOrgLevel" class="form-control">
                <option value="Universitas">Tingkat Universitas</option>
                <option value="Fakultas">Tingkat Fakultas</option>
                <option value="Program Studi / Jurusan">Tingkat Jurusan / Prodi</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Afiliasi Fakultas / Kampus <span style="color: var(--danger);">*</span></label>
              <input type="text" id="regOrgAffiliation" class="form-control" placeholder="Universitas / Fakultas" required>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Ketua / Penanggung Jawab <span style="color: var(--danger);">*</span></label>
              <input type="text" id="regChairman" class="form-control" placeholder="Nama Ketua Organisasi" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Dosen Pembina <span style="color: var(--danger);">*</span></label>
              <input type="text" id="regAdvisor" class="form-control" placeholder="Nama & Gelar Dosen Pembina" required>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Nomor SK Pengesahan <span style="color: var(--danger);">*</span></label>
              <input type="text" id="regSkNumber" class="form-control" placeholder="SK/REKTOR/005/2026" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Unggah Dokumen SK (PDF/JPG/PNG) <span style="color: var(--danger);">*</span></label>
              <input type="file" id="regSkFile" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Email Resmi Organisasi <span style="color: var(--danger);">*</span></label>
              <input type="email" id="regEmail" class="form-control" placeholder="ukm@kampus.ac.id" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Kontak / Telepon <span style="color: var(--danger);">*</span></label>
              <input type="text" id="regPhone" class="form-control" placeholder="0812-xxxx-xxxx" required>
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 10px;">
            <label class="form-label">Deskripsi &amp; Bidang Kegiatan Organisasi <span style="color: var(--danger);">*</span></label>
            <textarea id="regBio" class="form-control" rows="2" placeholder="Jelaskan profil singkat dan bidang gerak organisasi..." required></textarea>
          </div>
        `;
      }

      // Partner / UMKM
      return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Nama Usaha / UMKM <span style="color: var(--danger);">*</span></label>
            <input type="text" id="regName" class="form-control" placeholder="Contoh: UMKM Berkah Mandiri" required>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Nama Pemilik / Penanggung Jawab <span style="color: var(--danger);">*</span></label>
            <input type="text" id="regOwnerName" class="form-control" placeholder="Nama pemilik usaha" required>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Kategori Usaha <span style="color: var(--danger);">*</span></label>
            <input type="text" id="regBusinessCategory" class="form-control" placeholder="Kuliner / Ritel / Kerajinan / Jasa" required>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Kontak / WhatsApp <span style="color: var(--danger);">*</span></label>
            <input type="text" id="regPhone" class="form-control" placeholder="0813-xxxx-xxxx" required>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Email Usaha / Mitra <span style="color: var(--danger);">*</span></label>
            <input type="email" id="regEmail" class="form-control" placeholder="mitra@umkm.id" required>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Alamat Usaha <span style="color: var(--danger);">*</span></label>
            <input type="text" id="regAddress" class="form-control" placeholder="Kecamatan / Kota lokasi usaha" required>
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 10px;">
          <label class="form-label">Deskripsi Usaha UMKM <span style="color: var(--danger);">*</span></label>
          <textarea id="regBio" class="form-control" rows="2" placeholder="Ceritakan produk/layanan UMKM dan kebutuhan kolaborasi..." required></textarea>
        </div>
      `;
    };

    const html = `
      <div class="auth-stage-container">
        <div class="auth-grid-two-col">

          <!-- Left Panel: Login or Dynamic Multi-Role Registration -->
          <div class="auth-panel-card">
            <div class="auth-brand-badge-box">
              <div class="auth-brand-icon">${Icons.graduationCap(28)}</div>
              <div class="auth-brand-text">
                <h2>CAMPUS IMPACT HUB</h2>
                <p>Platform Kolaborasi Kampus, Organisasi, UMKM &amp; Dampak Sosial</p>
              </div>
            </div>

            <div class="auth-tab-pills">
              <button type="button" class="auth-tab-pill ${!isRegister ? 'active' : ''}" id="btnSwitchToLogin">
                Masuk ke Akun
              </button>
              <button type="button" class="auth-tab-pill ${isRegister ? 'active' : ''}" id="btnSwitchToRegister">
                Registrasi Akun Baru
              </button>
            </div>

            <form id="dedicatedAuthForm" class="auth-form" autocomplete="on">
              ${!isRegister ? `
                <!-- LOGIN INTERFACE (No Role Dropdown!) -->
                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label">Email atau Identitas Kampus (NIM / NIP) <span style="color: var(--danger);">*</span></label>
                  <div class="auth-input-wrapper">
                    <span class="input-icon">${Icons.mail(16)}</span>
                    <input type="text" id="authIdentifierInput" class="form-control" placeholder="mahasiswa@kampus.ac.id atau NIM" value="mahasiswa@kampus.ac.id" required>
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label">Kata Sandi <span style="color: var(--danger);">*</span></label>
                  <div class="auth-input-wrapper">
                    <span class="input-icon">${Icons.key(16)}</span>
                    <input type="${this.showPassword ? 'text' : 'password'}" id="authPasswordInput" class="form-control" placeholder="Masukkan kata sandi akun" value="password123" required minlength="6">
                    <button type="button" class="input-action-btn" id="btnToggleAuthPassword" title="Tampilkan/Sembunyikan Sandi">
                      ${this.showPassword ? Icons.eyeOff(16) : Icons.eye(16)}
                    </button>
                  </div>
                </div>

                <div class="form-action-row" style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
                  <label class="form-checkbox-label" style="font-size: 13px;">
                    <input type="checkbox" id="chkRememberMe" class="form-checkbox" checked>
                    <span>Ingat Saya (Remember Me)</span>
                  </label>
                  <button type="button" id="btnForgotPassword" style="background:none;border:none;color:var(--primary);font-size:12.5px;font-weight:600;cursor:pointer;">
                    Lupa Kata Sandi?
                  </button>
                </div>

                <button type="submit" class="btn btn-primary btn-block" id="btnSubmitAuth" style="font-size: 15px; font-weight: 700; height: 48px;">
                  ${Icons.auth(18)}
                  <span>Masuk ke Dashboard</span>
                </button>

                <!-- FIREBASE AUTHENTICATION SECTION -->
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border-color);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 11.5px; font-weight: 700; color: var(--neutral-muted); text-transform: uppercase; letter-spacing: 0.4px;">
                      Firebase Authentication
                    </span>
                    <button type="button" id="btnOpenFirebaseConfig" class="pill-badge ${FirebaseAuthService.isConfigured() ? 'pill-green' : 'pill-blue'}" style="cursor: pointer; font-size: 11px; padding: 3px 9px;">
                      <span class="badge-dot"></span>
                      ${FirebaseAuthService.isConfigured() ? `Firebase: ${FirebaseAuthService.config.projectId}` : 'Atur Config Firebase'}
                    </button>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn btn-sso" id="btnFirebaseGoogleLogin" style="flex: 1; height: 42px; font-size: 13px; font-weight: 600;">
                      ${Icons.shield(16)}
                      <span>Masuk dengan Google (Firebase Auth)</span>
                    </button>
                    <button type="button" class="btn btn-outline" id="btnFirebaseGear" title="Pengaturan Firebase Project" style="height: 42px; padding: 0 12px;">
                      ${Icons.settings(16)}
                    </button>
                  </div>
                </div>

                <div class="auth-demo-chips">
                  <div class="auth-demo-chips-title">
                    ${Icons.sparkles(13)}
                    <span>Akun Demo Resmi (Autentikasi Kredensial Server):</span>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
                    <button type="button" class="auth-chip-btn" data-auth-demo="student" style="text-align: left; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px;">
                      <strong style="font-size: 12px; color: var(--primary);">1. Mahasiswa</strong>
                      <span style="font-size: 11px; color: var(--neutral-charcoal);">mahasiswa@kampus.ac.id</span>
                      <span style="font-size: 10.5px; color: var(--neutral-muted);">NIM: 13523001</span>
                    </button>
                    <button type="button" class="auth-chip-btn" data-auth-demo="organization" style="text-align: left; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px;">
                      <strong style="font-size: 12px; color: #7C3AED;">2. BEM / UKM</strong>
                      <span style="font-size: 11px; color: var(--neutral-charcoal);">bem@kampus.ac.id</span>
                      <span style="font-size: 10.5px; color: var(--neutral-muted);">Organisasi Kampus</span>
                    </button>
                    <button type="button" class="auth-chip-btn" data-auth-demo="partner" style="text-align: left; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px;">
                      <strong style="font-size: 12px; color: #059669;">3. Mitra UMKM</strong>
                      <span style="font-size: 11px; color: var(--neutral-charcoal);">umkm@kampus.ac.id</span>
                      <span style="font-size: 10.5px; color: var(--neutral-muted);">UMKM Maju Jaya</span>
                    </button>
                    <button type="button" class="auth-chip-btn" data-auth-demo="admin" style="text-align: left; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px;">
                      <strong style="font-size: 12px; color: #0F172A;">4. Admin / Dosen</strong>
                      <span style="font-size: 11px; color: var(--neutral-charcoal);">dosen@kampus.ac.id</span>
                      <span style="font-size: 10.5px; color: var(--neutral-muted);">Direktorat Kemahasiswaan</span>
                    </button>
                  </div>
                </div>
              ` : `
                <!-- DYNAMIC MULTI-ROLE REGISTRATION INTERFACE -->
                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label">Pilih Kategori Akun Pendaftaran <span style="color: var(--danger);">*</span></label>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                    <button type="button" class="btn ${cat === 'student' ? 'btn-primary' : 'btn-outline'} btn-reg-cat" data-cat="student" style="padding: 8px 6px; font-size: 12px;">
                      Mahasiswa
                    </button>
                    <button type="button" class="btn ${cat === 'organization' ? 'btn-primary' : 'btn-outline'} btn-reg-cat" data-cat="organization" style="padding: 8px 6px; font-size: 12px;">
                      BEM / UKM
                    </button>
                    <button type="button" class="btn ${cat === 'partner' ? 'btn-primary' : 'btn-outline'} btn-reg-cat" data-cat="partner" style="padding: 8px 6px; font-size: 12px;">
                      Mitra UMKM
                    </button>
                  </div>
                  <div style="font-size: 11.5px; color: var(--neutral-muted); margin-top: 4px;">
                    *Peran bersifat permanen setelah pendaftaran. Akun Admin tidak dapat dibuat melalui registrasi publik.
                  </div>
                </div>

                ${renderDynamicRegistrationFields()}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Kata Sandi <span style="color: var(--danger);">*</span></label>
                    <input type="password" id="regPassword" class="form-control" placeholder="Min. 6 karakter" required minlength="6">
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Konfirmasi Sandi <span style="color: var(--danger);">*</span></label>
                    <input type="password" id="regPasswordConfirm" class="form-control" placeholder="Ulangi kata sandi" required minlength="6">
                  </div>
                </div>

                <button type="submit" class="btn btn-primary btn-block" id="btnSubmitAuth" style="font-size: 14.5px; font-weight: 700; height: 46px;">
                  ${Icons.check(18)}
                  <span>Buat Akun &amp; Masuk ke Dashboard</span>
                </button>
              `}
            </form>
          </div>

          <!-- Right Panel: Platform Information -->
          <div class="about-you-panel">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
              <span class="about-you-badge">${Icons.checkCircle(13)} Sistem Terverifikasi</span>
            </div>

            <div style="margin-bottom: 18px;">
              <div style="font-size: 18px; font-weight: 800; color: var(--neutral-dark); margin-bottom: 6px;">
                Arsitektur 4 Peran Terintegrasi
              </div>
              <div style="font-size: 13.5px; color: var(--neutral-muted); line-height: 1.65;">
                <strong style="color: var(--neutral-dark);">Campus Impact Hub</strong> memfasilitasi kolaborasi proyek sosial, pendaftaran legalitas organisasi, manajemen event tanpa QR (validasi manual Nama/NIM), penilaian kinerja mahasiswa oleh UMKM, dan verifikasi terpusat Admin Kampus.
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px;">
              <div style="background: var(--surface-alt); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 12.5px;">
                <strong style="color: var(--primary);">1. Mahasiswa (` + '`student`' + `):</strong> Eksplorasi &amp; pendaftaran proyek sosial, direktori organisasi resmi, pendaftaran event kampus, dan portofolio SKPI.
              </div>
              <div style="background: var(--surface-alt); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 12.5px;">
                <strong style="color: #7C3AED;">2. BEM / UKM (` + '`organization`' + `):</strong> Pendaftaran organisasi &amp; unggah dokumen SK, manajemen event, dan validasi kehadiran manual peserta (Nama/NIM).
              </div>
              <div style="background: var(--surface-alt); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 12.5px;">
                <strong style="color: #059669;">3. Mitra UMKM (` + '`partner`' + `):</strong> Pengajuan masalah nyata UMKM, pemantauan proyek mahasiswa, dan evaluasi kinerja 5 kriteria.
              </div>
              <div style="background: var(--surface-alt); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 12.5px;">
                <strong style="color: #0F172A;">4. Admin / Dosen (` + '`admin`' + `):</strong> Manajemen mahasiswa, verifikasi SK organisasi, persetujuan proyek/event, audit log, dan ekspor data CSV/JSON.
              </div>
            </div>

            <div style="border-top: 1px dashed var(--border-color); padding-top: 14px; margin-top: auto;">
              <div style="font-size: 11px; font-weight: 700; color: var(--neutral-muted); text-transform: uppercase; margin-bottom: 8px;">
                Pengembang
              </div>
              <div class="about-you-header" style="align-items: flex-start;">
                <div class="about-you-avatar" style="overflow: hidden; background: #0B0D10; padding: 0;">
                  <img src="${devProfile.logoUrl || 'assets/breakbuild-labs-logo.png'}" alt="${devProfile.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                </div>
                <div class="about-you-meta">
                  <h3>${devProfile.name}</h3>
                  <p style="font-size: 12.5px; line-height: 1.55; color: var(--neutral-body); font-weight: 500; margin-top: 3px;">${devProfile.about}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    this.contentEl.innerHTML = html;

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

    document.querySelectorAll('.btn-reg-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        this.registerCategory = btn.getAttribute('data-cat');
        this.pendingSkUpload = null;
        this.render();
      });
    });

    const skFileInput = document.getElementById('regSkFile');
    if (skFileInput) {
      skFileInput.addEventListener('change', (e) => this.handleSkFileSelection(e.target));
    }

    const btnTogglePass = document.getElementById('btnToggleAuthPassword');
    if (btnTogglePass) {
      btnTogglePass.addEventListener('click', () => {
        this.showPassword = !this.showPassword;
        const input = document.getElementById('authPasswordInput');
        if (input) input.type = this.showPassword ? 'text' : 'password';
        btnTogglePass.innerHTML = this.showPassword ? Icons.eyeOff(16) : Icons.eye(16);
      });
    }

    const btnForgot = document.getElementById('btnForgotPassword');
    if (btnForgot) {
      btnForgot.addEventListener('click', () => {
        this.openModal(
          'Pemulihan Kata Sandi Akun Kampus',
          `<p style="font-size:13.5px;color:var(--neutral-body);line-height:1.6;margin-bottom:12px;">
            Untuk alasan keamanan, pengaturan ulang kata sandi akun mahasiswa, pengurus BEM/UKM, dan mitra UMKM diverifikasi melalui Direktorat Kemahasiswaan atau Helpdesk TI Kampus.
          </p>
          <div style="background:var(--surface-alt);padding:12px 14px;border-radius:var(--radius-sm);font-size:13px;">
            <div><strong>Akun Demo Standar:</strong> Seluruh akun demo menggunakan kata sandi <code>password123</code></div>
            <div><strong>Kontak Admin:</strong> dosen@kampus.ac.id</div>
          </div>`,
          `<button class="btn btn-primary" onclick="app.closeModal()">Mengerti</button>`
        );
      });
    }

    document.querySelectorAll('[data-auth-demo]').forEach(chip => {
      chip.addEventListener('click', async () => {
        const role = chip.getAttribute('data-auth-demo');
        const demoAccounts = CampusRepository.getDefaultDemoAccounts();
        const target = demoAccounts.find(a => a.role === role) || demoAccounts[0];

        const idInput = document.getElementById('authIdentifierInput');
        const passInput = document.getElementById('authPasswordInput');
        if (idInput) idInput.value = target.email;
        if (passInput) passInput.value = 'password123';

        const res = await CampusRepository.login(target.email, 'password123');
        if (res.success) {
          this.showToast(res.message, 'success');
          this.switchTab('home');
        } else {
          this.showToast(res.message, 'danger');
        }
      });
    });

    const btnOpenFbCfg = document.getElementById('btnOpenFirebaseConfig');
    const btnFbGear = document.getElementById('btnFirebaseGear');
    if (btnOpenFbCfg) btnOpenFbCfg.addEventListener('click', () => this.showFirebaseConfigModal());
    if (btnFbGear) btnFbGear.addEventListener('click', () => this.showFirebaseConfigModal());

    const btnFbGoogle = document.getElementById('btnFirebaseGoogleLogin');
    if (btnFbGoogle) {
      btnFbGoogle.addEventListener('click', async () => {
        if (!FirebaseAuthService.isConfigured()) {
          this.showToast('Silakan masukkan konfigurasi Firebase Project Anda atau gunakan mode Simulasi di pengaturan Firebase.', 'info');
          this.showFirebaseConfigModal();
          return;
        }
        try {
          this.showToast('Membuka jendela Google Sign-In (Firebase Auth)...', 'info');
          const fbPayload = await FirebaseAuthService.signInWithGoogle();
          const res = await CampusRepository.loginWithFirebase(fbPayload);
          if (res.success) {
            this.showToast(res.message, 'success');
            this.switchTab('home');
          } else {
            this.showToast(res.message, 'danger');
          }
        } catch (err) {
          this.showToast(`Firebase Auth Error: ${err.message}`, 'danger');
        }
      });
    }

    const authForm = document.getElementById('dedicatedAuthForm');
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!this.isRegisterMode) {
          const identifier = document.getElementById('authIdentifierInput').value;
          const password = document.getElementById('authPasswordInput').value;
          const res = await CampusRepository.login(identifier, password);
          if (res.success) {
            this.showToast(res.message, 'success');
            this.switchTab('home');
          } else {
            this.showToast(res.message, 'danger');
          }
          return;
        }

        // Dynamic Multi-Role Registration Submission
        const role = this.registerCategory;
        const name = document.getElementById('regName')?.value || '';
        const email = document.getElementById('regEmail')?.value || '';
        const password = document.getElementById('regPassword')?.value || '';
        const passwordConfirm = document.getElementById('regPasswordConfirm')?.value || '';

        if (password !== passwordConfirm) {
          this.showToast('Konfirmasi kata sandi tidak cocok.', 'danger');
          return;
        }

        const payload = { role, name, email, password, passwordConfirm };

        if (role === 'student') {
          payload.identityNumber = document.getElementById('regNim')?.value || '';
          payload.faculty = document.getElementById('regFaculty')?.value || '';
          payload.studyProgram = document.getElementById('regStudyProgram')?.value || '';
          payload.majorOrUnit = payload.studyProgram;
        } else if (role === 'organization') {
          if (!this.pendingSkUpload) {
            this.showToast('Silakan unggah dokumen SK organisasi yang valid (PDF/JPG/PNG).', 'warning');
            return;
          }
          payload.orgCategory = document.getElementById('regOrgCategory')?.value || '';
          payload.orgLevel = document.getElementById('regOrgLevel')?.value || '';
          payload.orgAffiliation = document.getElementById('regOrgAffiliation')?.value || '';
          payload.chairmanName = document.getElementById('regChairman')?.value || '';
          payload.advisorName = document.getElementById('regAdvisor')?.value || '';
          payload.skNumber = document.getElementById('regSkNumber')?.value || '';
          payload.phone = document.getElementById('regPhone')?.value || '';
          payload.bio = document.getElementById('regBio')?.value || '';
          payload.skDocumentName = this.pendingSkUpload.name;
          payload.skDocumentType = this.pendingSkUpload.type;
          payload.skDocumentSize = this.pendingSkUpload.size;
          payload.skDocumentData = this.pendingSkUpload.data;
        } else if (role === 'partner') {
          payload.ownerName = document.getElementById('regOwnerName')?.value || '';
          payload.businessCategory = document.getElementById('regBusinessCategory')?.value || '';
          payload.phone = document.getElementById('regPhone')?.value || '';
          payload.address = document.getElementById('regAddress')?.value || '';
          payload.bio = document.getElementById('regBio')?.value || '';
        }

        const res = await CampusRepository.register(payload);
        if (res.success) {
          this.pendingSkUpload = null;
          this.showToast(res.message, 'success');
          this.switchTab('home');
        } else {
          this.showToast(res.message, 'danger');
        }
      });
    }
  }

  showFirebaseConfigModal() {
    const cfg = FirebaseAuthService.config || {};
    const isReady = FirebaseAuthService.isConfigured();

    const bodyHtml = `
      <div style="margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span class="pill-badge ${isReady ? 'pill-green' : 'pill-amber'}">
            <span class="badge-dot"></span>
            ${isReady ? `Terhubung ke Project: ${cfg.projectId}` : 'Menunggu Konfigurasi Firebase Project'}
          </span>
          <span class="pill-badge pill-blue">Firebase Web SDK v11</span>
        </div>
        <p style="font-size: 13px; color: var(--neutral-muted); line-height: 1.55;">
          Hubungkan login aplikasi dengan <strong>Firebase Authentication</strong> (Google Sign-In &amp; Email/Password). Tempelkan snippet <code>firebaseConfig</code> dari Firebase Console atau isi kolom di bawah.
        </p>
      </div>

      <div class="form-group" style="margin-bottom: 12px;">
        <label class="form-label">Tempel Cepat Snippet <code>firebaseConfig</code> dari Firebase Console (Opsional)</label>
        <div style="display: flex; gap: 8px;">
          <textarea id="fbSnippetInput" class="form-control" rows="2" placeholder='const firebaseConfig = { apiKey: "AIza...", authDomain: "...", projectId: "..." };' style="font-family: monospace; font-size: 12px;"></textarea>
          <button type="button" id="btnParseFbSnippet" class="btn btn-secondary" style="white-space: nowrap;">Ekstrak</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">API Key (<code>apiKey</code>) <span style="color: var(--danger);">*</span></label>
          <input type="text" id="fbApiKey" class="form-control" value="${cfg.apiKey || ''}" placeholder="AIzaSy...">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Project ID (<code>projectId</code>) <span style="color: var(--danger);">*</span></label>
          <input type="text" id="fbProjectId" class="form-control" value="${cfg.projectId || ''}" placeholder="campus-impact-hub">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Auth Domain (<code>authDomain</code>)</label>
          <input type="text" id="fbAuthDomain" class="form-control" value="${cfg.authDomain || ''}" placeholder="campus-impact-hub.firebaseapp.com">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">App ID (<code>appId</code>)</label>
          <input type="text" id="fbAppId" class="form-control" value="${cfg.appId || ''}" placeholder="1:123456789:web:abcdef">
        </div>
      </div>

      <div style="background: var(--surface-alt); padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: 14px;">
        <label class="form-checkbox-label" style="font-size: 12.5px; font-weight: 600;">
          <input type="checkbox" id="fbUseEmulator" class="form-checkbox" ${cfg.useEmulator ? 'checked' : ''}>
          <span>Gunakan Firebase Auth Local Emulator (<code>http://localhost:9099</code>)</span>
        </label>
      </div>

      <div style="background: var(--primary-light); border: 1px solid var(--primary-border); padding: 12px 14px; border-radius: var(--radius-sm);">
        <div style="font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 6px;">
          Uji Coba Langsung Bridge Firebase Auth &rarr; Backend Server:
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <select id="fbSimRole" class="form-control" style="flex: 1; min-width: 170px; height: 36px; font-size: 12.5px; padding: 4px 10px;">
            <option value="mahasiswa@kampus.ac.id">Google Auth: Budi Santoso (Mahasiswa)</option>
            <option value="bem@kampus.ac.id">Google Auth: Rizky Pratama (BEM / UKM)</option>
            <option value="umkm@kampus.ac.id">Google Auth: UMKM Maju Jaya (Mitra UMKM)</option>
            <option value="dosen@kampus.ac.id">Google Auth: Dr. Ir. Hendra Wijaya (Admin / Dosen)</option>
          </select>
          <button type="button" id="btnSimulateFirebaseLogin" class="btn btn-primary" style="font-size: 12.5px; padding: 7px 14px;">
            ${Icons.check(14)} Tes Login via Token Firebase
          </button>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-outline" onclick="app.closeModal()">Tutup</button>
      <button type="button" class="btn btn-primary" id="btnSaveFirebaseConfig">${Icons.check(15)} Simpan Konfigurasi Firebase</button>
    `;

    this.openModal('Konfigurasi & Integrasi Firebase Authentication', bodyHtml, footerHtml);

    document.getElementById('btnParseFbSnippet')?.addEventListener('click', () => {
      const snippet = document.getElementById('fbSnippetInput').value;
      const parsed = FirebaseAuthService.parseConfigSnippet(snippet);
      if (!parsed) {
        this.showToast('Tidak dapat menemukan apiKey / projectId pada teks snippet.', 'warning');
        return;
      }
      document.getElementById('fbApiKey').value = parsed.apiKey || '';
      document.getElementById('fbProjectId').value = parsed.projectId || '';
      document.getElementById('fbAuthDomain').value = parsed.authDomain || '';
      document.getElementById('fbAppId').value = parsed.appId || '';
      this.showToast('Konfigurasi berhasil diekstrak dari snippet!', 'success');
    });

    document.getElementById('btnSaveFirebaseConfig')?.addEventListener('click', async () => {
      const apiKey = document.getElementById('fbApiKey').value.trim();
      const projectId = document.getElementById('fbProjectId').value.trim();
      const authDomain = document.getElementById('fbAuthDomain').value.trim();
      const appId = document.getElementById('fbAppId').value.trim();
      const useEmulator = document.getElementById('fbUseEmulator').checked;

      try {
        await FirebaseAuthService.saveConfig(
          { apiKey, projectId, authDomain, appId, useEmulator },
          CampusRepository.authToken
        );
        this.closeModal();
        this.showToast(
          apiKey && projectId
            ? `Firebase Authentication terhubung ke project "${projectId}"!`
            : 'Konfigurasi Firebase disimpan.',
          'success'
        );
        this.render();
      } catch (err) {
        this.showToast(`Gagal menginisialisasi SDK Firebase: ${err.message}`, 'warning');
      }
    });

    document.getElementById('btnSimulateFirebaseLogin')?.addEventListener('click', async () => {
      const targetEmail = document.getElementById('fbSimRole').value;
      const headerB64 = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payloadB64 = btoa(
        JSON.stringify({
          iss: `https://securetoken.google.com/${cfg.projectId || 'campus-impact-hub'}`,
          aud: cfg.projectId || 'campus-impact-hub',
          user_id: `firebase-uid-${targetEmail.split('@')[0]}`,
          sub: `firebase-uid-${targetEmail.split('@')[0]}`,
          email: targetEmail,
          email_verified: true,
          firebase: { sign_in_provider: 'google.com' }
        })
      );
      const mockJwt = `${headerB64}.${payloadB64}.firebase-signature`;

      const res = await CampusRepository.loginWithFirebase({
        idToken: mockJwt,
        uid: `firebase-uid-${targetEmail.split('@')[0]}`,
        email: targetEmail,
        providerId: 'google.com'
      });

      if (res.success) {
        this.closeModal();
        this.showToast(res.message, 'success');
        this.switchTab('home');
      } else {
        this.showToast(res.message, 'danger');
      }
    });
  }

  handleSkFileSelection(fileInput, previewContainerId = null) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toUpperCase();
    const allowed = ['PDF', 'JPG', 'JPEG', 'PNG'];
    if (!allowed.includes(ext)) {
      this.showToast(`Format file .${ext} tidak didukung. Gunakan PDF, JPG, JPEG, atau PNG.`, 'danger');
      fileInput.value = '';
      this.pendingSkUpload = null;
      return;
    }
    const maxBytes = (CampusRepository.systemConfig?.maxUploadSizeKb || 2048) * 1024;
    if (file.size > maxBytes) {
      this.showToast('Ukuran file melebihi batas maksimal 2 MB.', 'danger');
      fileInput.value = '';
      this.pendingSkUpload = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      this.pendingSkUpload = {
        name: file.name,
        type: file.type || (ext === 'PDF' ? 'application/pdf' : `image/${ext.toLowerCase()}`),
        size: file.size,
        data: ev.target.result
      };
      this.showToast(`Dokumen "${file.name}" (${Math.round(file.size / 1024)} KB) siap diunggah.`, 'info');
      if (previewContainerId) {
        const previewEl = document.getElementById(previewContainerId);
        if (previewEl) {
          previewEl.innerHTML = `<div style="font-size:12.5px;color:var(--success);font-weight:600;margin-top:6px;">${Icons.checkCircle(14)} File terpilih: ${file.name} (${Math.round(file.size / 1024)} KB)</div>`;
        }
      }
    };
    reader.readAsDataURL(file);
  }

  // =========================================================================
  // HOME DASHBOARDS PER ROLE
  // =========================================================================
  renderHomeDashboard() {
    const user = CampusRepository.currentUser;
    const role = (user.role || 'student').toLowerCase();
    if (role === 'admin') return this.renderDashboardAdmin(user);
    if (role === 'organization') return this.renderDashboardOrganization(user);
    if (role === 'partner') return this.renderDashboardPartner(user);
    return this.renderDashboardStudent(user);
  }

  _welcomeHeaderHtml(user, roleLabel, subtitle, actionsHtml) {
    return `
      <div class="card" style="padding:24px;margin-bottom:22px;border-color:#CBD5E1;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
          <span class="pill-badge pill-blue"><span class="badge-dot"></span>Peran: ${roleLabel}</span>
          <span class="pill-badge pill-green"><span class="badge-dot"></span>Status Akun: ${user.accountStatus || 'Active'}</span>
          <span class="pill-badge pill-gray">${user.email} &bull; ${user.identityNumber || '-'}</span>
        </div>
        <h2 style="font-size:23px;font-weight:800;color:var(--neutral-dark);margin-bottom:4px;">Selamat Datang, ${user.name}</h2>
        <p style="font-size:13.5px;color:var(--neutral-muted);max-width:840px;margin-bottom:18px;line-height:1.6;">${subtitle}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">${actionsHtml}</div>
      </div>
    `;
  }

  // =========================================================================
  // ROLE A: STUDENT DASHBOARD & MODULES
  // =========================================================================
  renderDashboardStudent(user) {
    const approvedProjects = CampusRepository.getApprovedProjects();
    const verifiedOrgs = CampusRepository.getVerifiedOrganizations();
    const publishedEvents = CampusRepository.getPublishedEvents();
    const myEventRegs = (CampusRepository.eventRegistrations || []).filter(r => r.studentId === user.id && r.registrationStatus === 'Registered');
    const myProjRegs = (CampusRepository.projectRegistrations || []).filter(r => r.studentId === user.id);
    const myPortfolio = CampusRepository.getCurrentUserPortfolioEntries();

    const html = `
      ${this._welcomeHeaderHtml(
        user,
        'Mahasiswa',
        `${user.studyProgram || user.majorOrUnit} — ${user.faculty}. Jelajahi proyek sosial yang telah disetujui, lihat organisasi resmi kampus, daftar event kampus, dan pantau portofolio kontribusi terverifikasi Anda.`,
        `<button id="btnDashProjects" class="btn btn-primary">${Icons.project(15)} Eksplorasi Proyek Sosial</button>
         <button id="btnDashOrgs" class="btn btn-secondary">${Icons.organization(15)} Organisasi Terverifikasi</button>
         <button id="btnDashEvents" class="btn btn-outline">${Icons.event(15)} Event Kampus</button>
         <button id="btnDashPortfolio" class="btn btn-outline">${Icons.award(15)} Portofolio Saya</button>`
      )}

      <div class="stats-grid">
        <div class="stat-card" style="cursor:pointer;" id="statStudentProjects">
          <div class="stat-icon" style="background:var(--primary-light);color:var(--primary);">${Icons.project(22)}</div>
          <div class="stat-info">
            <div class="value">${approvedProjects.length}</div>
            <div class="label">Proyek Sosial Tersedia</div>
            <div class="sublabel">${myProjRegs.length} Proyek Diikuti</div>
          </div>
        </div>
        <div class="stat-card" style="cursor:pointer;" id="statStudentOrgs">
          <div class="stat-icon" style="background:var(--surface-alt);color:var(--neutral-charcoal);">${Icons.organization(22)}</div>
          <div class="stat-info">
            <div class="value">${verifiedOrgs.length}</div>
            <div class="label">Organisasi Resmi</div>
            <div class="sublabel">BEM &amp; UKM Terverifikasi SK</div>
          </div>
        </div>
        <div class="stat-card" style="cursor:pointer;" id="statStudentEvents">
          <div class="stat-icon" style="background:#F5F3FF;color:#7C3AED;">${Icons.event(22)}</div>
          <div class="stat-info">
            <div class="value">${publishedEvents.length}</div>
            <div class="label">Event Kampus</div>
            <div class="sublabel">${myEventRegs.length} Event Terdaftar</div>
          </div>
        </div>
        <div class="stat-card" style="cursor:pointer;" id="statStudentPortfolio">
          <div class="stat-icon" style="background:var(--success-light);color:var(--success);">${Icons.award(22)}</div>
          <div class="stat-info">
            <div class="value">${user.impactScore || 0} / ${user.leadershipScore || 0}</div>
            <div class="label">Impact / Leadership</div>
            <div class="sublabel">${myPortfolio.length} Kontribusi Terverifikasi</div>
          </div>
        </div>
      </div>

      <!-- Registered Activities Summary -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.activity(20)} Aktivitas Terdaftar &amp; Ringkasan Portofolio</h3>
          <p class="section-subtitle">Status keikutsertaan Anda pada proyek sosial dan event kampus.</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-bottom:24px;">
        <div class="card" style="padding:18px;margin-bottom:0;">
          <div style="font-weight:700;font-size:14px;color:var(--neutral-dark);margin-bottom:10px;">${Icons.project(15)} Proyek Sosial Saya (${myProjRegs.length})</div>
          ${myProjRegs.length ? myProjRegs.map(r => `
            <div style="padding:8px 0;border-bottom:1px solid var(--border-color);font-size:13px;">
              <strong>${r.projectTitle}</strong>
              <div style="color:var(--neutral-muted);font-size:12px;">Peran: ${r.roleInProject} &bull; Status: <span style="color:var(--primary);font-weight:600;">${r.status}</span></div>
            </div>
          `).join('') : '<div style="font-size:13px;color:var(--neutral-muted);">Belum ada proyek yang diikuti.</div>'}
        </div>

        <div class="card" style="padding:18px;margin-bottom:0;">
          <div style="font-weight:700;font-size:14px;color:var(--neutral-dark);margin-bottom:10px;">${Icons.event(15)} Event Kampus Terdaftar (${myEventRegs.length})</div>
          ${myEventRegs.length ? myEventRegs.map(r => `
            <div style="padding:8px 0;border-bottom:1px solid var(--border-color);font-size:13px;">
              <strong>${r.eventTitle}</strong>
              <div style="color:var(--neutral-muted);font-size:12px;">Penyelenggara: ${r.organizerName} &bull; Kehadiran: <span style="color:${r.attendanceStatus === 'Attended' ? 'var(--success)' : 'var(--primary)'};font-weight:600;">${r.attendanceStatus}</span></div>
            </div>
          `).join('') : '<div style="font-size:13px;color:var(--neutral-muted);">Belum ada event yang didaftari.</div>'}
        </div>
      </div>

      <!-- Available Social Projects Preview -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.project(20)} Proyek Sosial Tersedia</h3>
          <p class="section-subtitle">Inisiatif mitra UMKM dan masyarakat yang telah disetujui Admin Kampus.</p>
        </div>
        <button id="btnViewAllStudentProjects" class="section-action">Lihat Semua ${Icons.arrowRight(13)}</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${approvedProjects.slice(0, 2).map(p => this.renderProjectCardHtml(p)).join('')}
      </div>
    `;

    this.contentEl.innerHTML = html;
    const bind = (id, tab) => { const el = document.getElementById(id); if (el) el.addEventListener('click', () => this.switchTab(tab)); };
    bind('btnDashProjects', 'projects');
    bind('btnDashOrgs', 'organizations');
    bind('btnDashEvents', 'events');
    bind('btnDashPortfolio', 'portfolio');
    bind('statStudentProjects', 'projects');
    bind('statStudentOrgs', 'organizations');
    bind('statStudentEvents', 'events');
    bind('statStudentPortfolio', 'portfolio');
    bind('btnViewAllStudentProjects', 'projects');
    this.bindProjectCardEvents();
  }

  // Student Module 2: Proyek Sosial
  renderStudentProjectsView() {
    const categories = ['Semua', 'Teknologi', 'Lingkungan', 'Pendidikan', 'Digital Marketing'];
    const statuses = ['Semua', 'OPEN', 'ON_GOING', 'COMPLETED'];

    const approvedProjects = CampusRepository.getApprovedProjects();
    const filtered = approvedProjects.filter(p => {
      const q = (this.projectSearchQuery || '').toLowerCase();
      const matchSearch = !q ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.organizationName && p.organizationName.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));
      const matchCat = this.selectedProjectCategoryFilter === 'Semua' ||
        (p.category && p.category.toLowerCase().includes(this.selectedProjectCategoryFilter.toLowerCase()));
      const matchStatus = this.selectedProjectStatusFilter === 'Semua' || p.status === this.selectedProjectStatusFilter;
      return matchSearch && matchCat && matchStatus;
    });

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.project(20)} Proyek Sosial</h3>
          <p class="section-subtitle">Jelajahi dan daftarkan diri Anda pada proyek penyelesaian masalah mitra masyarakat &amp; UMKM.</p>
        </div>
      </div>

      <div class="card" style="padding:16px;margin-bottom:18px;">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;">
          <input type="text" id="inputProjectSearch" class="form-control" placeholder="Cari judul proyek, mitra UMKM, atau kata kunci..." value="${this.projectSearchQuery}">
          <select id="selectProjectCat" class="form-control">
            ${categories.map(c => `<option value="${c}" ${this.selectedProjectCategoryFilter === c ? 'selected' : ''}>Kategori: ${c}</option>`).join('')}
          </select>
          <select id="selectProjectStatus" class="form-control">
            ${statuses.map(s => `<option value="${s}" ${this.selectedProjectStatusFilter === s ? 'selected' : ''}>Status: ${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        ${filtered.length ? filtered.map(p => this.renderProjectCardHtml(p)).join('') : `
          <div class="card" style="text-align:center;padding:40px 20px;">
            <p style="font-size:14px;color:var(--neutral-muted);">Tidak ada proyek sosial yang cocok dengan filter pencarian.</p>
          </div>
        `}
      </div>
    `;

    this.contentEl.innerHTML = html;
    document.getElementById('inputProjectSearch').addEventListener('input', (e) => {
      this.projectSearchQuery = e.target.value;
      this._reRenderPreservingFocus('inputProjectSearch', this.renderStudentProjectsView);
    });
    document.getElementById('selectProjectCat').addEventListener('change', (e) => {
      this.selectedProjectCategoryFilter = e.target.value;
      this.renderStudentProjectsView();
    });
    document.getElementById('selectProjectStatus').addEventListener('change', (e) => {
      this.selectedProjectStatusFilter = e.target.value;
      this.renderStudentProjectsView();
    });
    this.bindProjectCardEvents();
  }

  renderProjectCardHtml(project) {
    const isStudent = CampusRepository.hasRole('student');
    const myReg = CampusRepository.getStudentProjectRegistration(project.id);
    let statusPillClass = 'pill-blue';
    if (project.status === 'ON_GOING') statusPillClass = 'pill-amber';
    if (project.status === 'COMPLETED') statusPillClass = 'pill-green';
    if (project.status === 'SUBMITTED' || project.status === 'UNDER_REVIEW') statusPillClass = 'pill-amber';
    if (project.status === 'REJECTED') statusPillClass = 'pill-red';

    return `
      <div class="card project-card" data-id="${project.id}" style="padding:22px;margin-bottom:0;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
          <span class="pill-badge pill-blue">${project.category}</span>
          <span class="pill-badge ${statusPillClass}"><span class="badge-dot"></span>${ProjectStatus[project.status]?.label || project.status}</span>
          <span class="pill-badge pill-green">Target Penerima Manfaat: ${project.impactReport?.beneficiaries || 50} Jiwa</span>
          <span class="pill-badge pill-gray">${Icons.users(13)} ${(project.assignedStudents || []).length || project.applicantCount || 0} Mahasiswa Terdaftar</span>
        </div>

        <h4 style="font-size:18px;font-weight:700;color:var(--neutral-dark);margin-bottom:4px;">${project.title}</h4>
        <div style="font-size:13px;font-weight:600;color:var(--primary);margin-bottom:10px;">
          Mitra: ${project.organizationName} ${project.ownerName ? `(${project.ownerName})` : ''} &bull; Lokasi: ${project.location}
        </div>

        <p style="font-size:13.5px;color:var(--neutral-body);margin-bottom:12px;line-height:1.6;">${project.description}</p>

        <div style="font-size:12.5px;color:var(--neutral-dark);background:var(--surface-alt);padding:10px 14px;border-radius:var(--radius-sm);margin-bottom:14px;line-height:1.6;">
          <div><strong>Kualifikasi Mahasiswa:</strong> ${(project.requirements || []).join(' • ')}</div>
          <div><strong>Target Luaran (Outcomes):</strong> ${project.expectedOutcomes || project.impactReport?.afterCondition || '-'}</div>
          <div><strong>Estimasi Durasi:</strong> ${project.expectedDuration || '8 Minggu'}</div>
        </div>

        ${project.rejectionReason ? `
          <div style="margin-bottom:12px;padding:10px 14px;background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C;border-radius:var(--radius-sm);font-size:12.5px;">
            <strong>Alasan Penolakan Admin:</strong> ${project.rejectionReason}
          </div>
        ` : ''}

        ${myReg ? `
          <div style="margin-bottom:12px;padding:9px 14px;background:var(--primary-light);border:1px solid var(--primary-border);color:var(--primary);border-radius:var(--radius-sm);font-size:12.5px;font-weight:600;">
            ${Icons.checkCircle(14)} Anda Terdaftar sebagai: ${myReg.roleInProject} &bull; Status: ${myReg.status}
          </div>
        ` : ''}

        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-project-detail" data-id="${project.id}">
            ${Icons.eye(15)} Lihat Detail Proyek
          </button>
          ${isStudent && !myReg && project.status === 'OPEN' ? `
            <button class="btn btn-primary btn-project-apply" data-id="${project.id}" data-leader="false">
              ${Icons.check(15)} Daftar Anggota Tim
            </button>
            <button class="btn btn-outline btn-project-apply" data-id="${project.id}" data-leader="true">
              ${Icons.leadership(15)} Daftar Ketua Tim
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  bindProjectCardEvents() {
    document.querySelectorAll('.btn-project-detail').forEach(btn => {
      btn.addEventListener('click', () => this.showProjectDetailModal(btn.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-project-apply').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const asLeader = btn.getAttribute('data-leader') === 'true';
        try {
          const msg = await CampusRepository.applyForProject(id, asLeader);
          this.showToast(msg, 'success');
          this.render();
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    });
  }

  showProjectDetailModal(projectId) {
    const project = (CampusRepository.projects || []).find(p => p.id === projectId);
    if (!project) return;
    const assigned = project.assignedStudents || [];
    const milestones = project.milestones || [];

    const bodyHtml = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <span class="pill-badge pill-blue">${project.category}</span>
        <span class="pill-badge pill-green">Status: ${ProjectStatus[project.status]?.label || project.status}</span>
        <span class="pill-badge pill-gray">ID: ${project.id}</span>
      </div>
      <h4 style="font-size:18px;font-weight:800;color:var(--neutral-dark);margin-bottom:4px;">${project.title}</h4>
      <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:12px;">
        Mitra UMKM: ${project.organizationName} (${project.ownerName || 'Penanggung Jawab'}) &bull; ${project.location}
      </div>
      <p style="font-size:13.5px;color:var(--neutral-body);line-height:1.6;margin-bottom:14px;">${project.description}</p>

      <div style="background:var(--surface-alt);padding:12px 14px;border-radius:var(--radius-sm);font-size:13px;margin-bottom:14px;line-height:1.6;">
        <div><strong>Kualifikasi Mahasiswa:</strong> ${(project.requirements || []).join(', ')}</div>
        <div><strong>Luaran yang Diharapkan:</strong> ${project.expectedOutcomes || '-'}</div>
        <div><strong>Durasi Penyelesaian:</strong> ${project.expectedDuration || '8 Minggu'}</div>
        <div><strong>Estimasi Penerima Manfaat:</strong> ${project.impactReport?.beneficiaries || 50} Orang</div>
        <div><strong>Lampiran Pendukung:</strong> ${project.attachmentName || project.photoCaption || '-'}</div>
      </div>

      <div style="font-weight:700;font-size:13.5px;margin-bottom:8px;">Tahapan (Milestones) Proyek:</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">
        ${milestones.length ? milestones.map(m => `
          <div style="font-size:12.5px;padding:8px 12px;border:1px solid var(--border-color);border-radius:var(--radius-sm);display:flex;justify-content:space-between;">
            <span>${m.title}</span>
            <strong>${m.status}</strong>
          </div>
        `).join('') : '<div style="font-size:12.5px;color:var(--neutral-muted);">Belum ada milestone.</div>'}
      </div>

      <div style="font-weight:700;font-size:13.5px;margin-bottom:8px;">Mahasiswa Terdaftar / Ditugaskan (${assigned.length}):</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${assigned.length ? assigned.map(s => `
          <div style="font-size:12.5px;padding:8px 12px;background:var(--surface-alt);border-radius:var(--radius-sm);">
            <strong>${s.name}</strong> (NIM: ${s.nim}) — ${s.studyProgram || s.faculty || ''}<br>
            <span style="color:var(--primary);font-weight:600;">${s.roleInProject}</span>
          </div>
        `).join('') : '<div style="font-size:12.5px;color:var(--neutral-muted);">Belum ada mahasiswa yang terdaftar pada proyek ini.</div>'}
      </div>
    `;

    this.openModal(`Detail Proyek Sosial — ${project.id}`, bodyHtml, `<button class="btn btn-primary" onclick="app.closeModal()">Tutup</button>`);
  }

  // Student Module 3: Organisasi (Only Verified Organizations Presented as Official, View-Only for Students)
  renderStudentOrganizationsView() {
    const verifiedOrgs = CampusRepository.getVerifiedOrganizations().filter(o => {
      const q = (this.orgSearchQuery || '').toLowerCase();
      return !q ||
        (o.name && o.name.toLowerCase().includes(q)) ||
        (o.fullName && o.fullName.toLowerCase().includes(q)) ||
        (o.category && o.category.toLowerCase().includes(q));
    });

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.organization(20)} Direktori Organisasi Resmi Kampus (BEM &amp; UKM)</h3>
          <p class="section-subtitle">Daftar organisasi kemahasiswaan yang telah terverifikasi legalitas SK-nya oleh Admin Kampus.</p>
        </div>
      </div>

      <div class="card" style="padding:14px;margin-bottom:18px;">
        <input type="text" id="inputStudentOrgSearch" class="form-control" placeholder="Cari nama BEM/UKM, kategori, atau dosen pembina..." value="${this.orgSearchQuery}">
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        ${verifiedOrgs.length ? verifiedOrgs.map(org => `
          <div class="card" style="padding:22px;margin-bottom:0;">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
              <div style="width:48px;height:48px;border-radius:var(--radius-sm);background:var(--neutral-dark);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;">
                ${org.logoInitials || 'UKM'}
              </div>
              <div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                  <h4 style="font-size:18px;font-weight:700;color:var(--neutral-dark);margin:0;">${org.name}</h4>
                  <span class="pill-badge pill-green"><span class="badge-dot"></span>Verified Organization</span>
                  <span class="pill-badge pill-blue">${org.category}</span>
                </div>
                <div style="font-size:13px;color:var(--neutral-muted);margin-top:2px;">
                  ${org.fullName} &bull; Tingkat: ${org.level || 'Universitas'} (${org.affiliation || 'Kampus'})
                </div>
              </div>
            </div>

            <p style="font-size:13.5px;color:var(--neutral-body);line-height:1.6;margin-bottom:12px;">${org.description}</p>

            <div style="background:var(--surface-alt);padding:12px 16px;border-radius:var(--radius-sm);font-size:12.5px;color:var(--neutral-charcoal);line-height:1.65;">
              <div><strong>Ketua / Penanggung Jawab:</strong> ${org.chairmanName || '-'}</div>
              <div><strong>Dosen Pembina:</strong> ${org.advisorName || '-'}</div>
              <div><strong>Nomor SK Resmi:</strong> ${org.skNumber || '-'}</div>
              <div><strong>Bidang Kegiatan:</strong> ${org.activityField || org.category}</div>
              <div><strong>Kontak Organisasi:</strong> ${org.contact || '-'}</div>
            </div>
          </div>
        `).join('') : `
          <div class="card" style="text-align:center;padding:40px;">
            <p style="font-size:14px;color:var(--neutral-muted);">Belum ada organisasi terverifikasi yang cocok dengan pencarian.</p>
          </div>
        `}
      </div>
    `;

    this.contentEl.innerHTML = html;
    document.getElementById('inputStudentOrgSearch').addEventListener('input', (e) => {
      this.orgSearchQuery = e.target.value;
      this._reRenderPreservingFocus('inputStudentOrgSearch', this.renderStudentOrganizationsView);
    });
  }

  // Student Module 4: Event Kampus (Without QR Code, Registration-Based Manual Attendance)
  renderStudentEventsView() {
    const types = ['Semua', ...Object.values(EventType).map(t => t.label)];
    const publishedEvents = CampusRepository.getPublishedEvents().filter(e => {
      const q = (this.eventSearchQuery || '').toLowerCase();
      const matchSearch = !q ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.organizerName && e.organizerName.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q));
      const matchType = this.selectedEventTypeFilter === 'Semua' ||
        (EventType[e.type]?.label || e.type).toLowerCase() === this.selectedEventTypeFilter.toLowerCase();
      return matchSearch && matchType;
    });

    const myRegs = (CampusRepository.eventRegistrations || []).filter(r => r.studentId === CampusRepository.currentUser.id);

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.event(20)} Event Kampus</h3>
          <p class="section-subtitle">Daftarkan diri Anda pada kegiatan resmi kampus. Kehadiran divalidasi secara manual oleh panitia berdasarkan Nama atau NIM (Tanpa QR).</p>
        </div>
      </div>

      <div class="card" style="padding:16px;margin-bottom:18px;">
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;">
          <input type="text" id="inputStudentEventSearch" class="form-control" placeholder="Cari nama event, penyelenggara, atau lokasi..." value="${this.eventSearchQuery}">
          <select id="selectStudentEventType" class="form-control">
            ${types.map(t => `<option value="${t}" ${this.selectedEventTypeFilter === t ? 'selected' : ''}>Kategori: ${t}</option>`).join('')}
          </select>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:26px;">
        ${publishedEvents.length ? publishedEvents.map(event => {
          const myReg = CampusRepository.getStudentEventRegistration(event.id);
          const isActiveReg = myReg && myReg.registrationStatus === 'Registered';
          const isAttended = myReg && myReg.attendanceStatus === 'Attended';
          const activeCount = (CampusRepository.eventRegistrations || []).filter(r => r.eventId === event.id && r.registrationStatus === 'Registered').length;
          const quotaPercent = Math.min(100, Math.round((activeCount / (event.quota || 100)) * 100));

          return `
            <div class="card" style="padding:22px;margin-bottom:0;">
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                <span class="pill-badge pill-blue">${EventType[event.type]?.label || event.type}</span>
                <span class="pill-badge pill-green">+${event.pointsReward || 10} Impact Score (Setelah Hadir Terverifikasi)</span>
                ${isAttended ? '<span class="pill-badge pill-green"><span class="badge-dot"></span>Kehadiran Terverifikasi (Attended)</span>' : ''}
                ${isActiveReg && !isAttended ? '<span class="pill-badge pill-amber"><span class="badge-dot"></span>Terdaftar (Menunggu Validasi Kehadiran)</span>' : ''}
                ${myReg && myReg.registrationStatus === 'Cancelled' ? '<span class="pill-badge pill-red">Pendaftaran Dibatalkan</span>' : ''}
              </div>

              <h4 style="font-size:18px;font-weight:700;color:var(--neutral-dark);margin-bottom:4px;">${event.title}</h4>
              <div style="font-size:13px;font-weight:600;color:var(--primary);margin-bottom:10px;">
                Penyelenggara: ${event.organizerName} &bull; Jadwal: ${event.date} &bull; Lokasi: ${event.location}
              </div>

              <p style="font-size:13.5px;color:var(--neutral-body);line-height:1.6;margin-bottom:12px;">${event.description}</p>

              <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:600;color:var(--neutral-muted);">
                  <span>Kapasitas Peserta Terdaftar:</span>
                  <span>${activeCount} / ${event.quota} Peserta (${quotaPercent}%)</span>
                </div>
                <div class="progress-track"><div class="progress-fill" style="width:${quotaPercent}%;"></div></div>
              </div>

              ${myReg ? `
                <div style="background:var(--surface-alt);padding:10px 14px;border-radius:var(--radius-sm);font-size:12.5px;margin-bottom:12px;">
                  <div><strong>ID Registrasi:</strong> ${myReg.id}</div>
                  <div><strong>Status Pendaftaran:</strong> ${myReg.registrationStatus} &bull; <strong>Status Kehadiran:</strong> ${myReg.attendanceStatus}</div>
                  ${myReg.checkInTimestamp ? `<div><strong>Waktu Check-In:</strong> ${new Date(myReg.checkInTimestamp).toLocaleString('id-ID')} (Oleh: ${myReg.validatedBy || 'Panitia'})</div>` : ''}
                </div>
              ` : ''}

              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                ${!isActiveReg ? `
                  <button class="btn btn-primary btn-student-reg-event" data-id="${event.id}">
                    ${Icons.check(15)} Daftar Event
                  </button>
                ` : ''}
                ${isActiveReg && !isAttended ? `
                  <button class="btn btn-outline btn-student-cancel-event" data-id="${event.id}" style="border-color:var(--danger);color:var(--danger);">
                    ${Icons.xCircle(15)} Batalkan Pendaftaran
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('') : '<div class="card" style="padding:36px;text-align:center;">Tidak ada event kampus yang sesuai filter.</div>'}
      </div>

      <!-- Riwayat Pendaftaran Event Mahasiswa -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.clock(20)} Riwayat Pendaftaran &amp; Kehadiran Event Saya</h3>
        </div>
      </div>
      <div class="card" style="padding:18px;">
        ${myRegs.length ? `
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="border-bottom:2px solid var(--border-color);text-align:left;">
                  <th style="padding:8px;">ID Registrasi</th>
                  <th style="padding:8px;">Nama Event</th>
                  <th style="padding:8px;">Penyelenggara</th>
                  <th style="padding:8px;">Status Registrasi</th>
                  <th style="padding:8px;">Status Kehadiran</th>
                  <th style="padding:8px;">Waktu Check-In</th>
                </tr>
              </thead>
              <tbody>
                ${myRegs.map(r => `
                  <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:8px;font-family:monospace;">${r.id}</td>
                    <td style="padding:8px;font-weight:600;">${r.eventTitle}</td>
                    <td style="padding:8px;">${r.organizerName}</td>
                    <td style="padding:8px;">${r.registrationStatus}</td>
                    <td style="padding:8px;"><strong>${r.attendanceStatus}</strong></td>
                    <td style="padding:8px;">${r.checkInTimestamp ? new Date(r.checkInTimestamp).toLocaleString('id-ID') : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div style="font-size:13px;color:var(--neutral-muted);">Anda belum memiliki riwayat pendaftaran event.</div>'}
      </div>
    `;

    this.contentEl.innerHTML = html;
    document.getElementById('inputStudentEventSearch').addEventListener('input', (e) => {
      this.eventSearchQuery = e.target.value;
      this._reRenderPreservingFocus('inputStudentEventSearch', this.renderStudentEventsView);
    });
    document.getElementById('selectStudentEventType').addEventListener('change', (e) => {
      this.selectedEventTypeFilter = e.target.value;
      this.renderStudentEventsView();
    });

    document.querySelectorAll('.btn-student-reg-event').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await CampusRepository.registerForEvent(btn.getAttribute('data-id'));
          this.showToast(res.message, 'success');
          this.render();
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    });

    document.querySelectorAll('.btn-student-cancel-event').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await CampusRepository.cancelEventRegistration(btn.getAttribute('data-id'));
          this.showToast(res.message, 'info');
          this.render();
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    });
  }

  // Student Module 5: Portofolio (Immutable Verified Contribution Transactions)
  renderStudentPortfolioView() {
    const user = CampusRepository.currentUser;
    const rules = CampusRepository.activityPointRules;
    const userPortfolio = CampusRepository.getCurrentUserPortfolioEntries();
    const myProjRegs = (CampusRepository.projectRegistrations || []).filter(r => r.studentId === user.id);
    const myEventRegs = (CampusRepository.eventRegistrations || []).filter(r => r.studentId === user.id);
    const myEvaluations = (CampusRepository.partnerEvaluations || []).filter(ev => ev.studentId === user.id);

    const html = `
      <div class="card hero-green" style="padding:26px;margin-bottom:22px;">
        <span class="pill-badge pill-green" style="background:rgba(255,255,255,0.18);color:#fff;margin-bottom:12px;">
          Portofolio Kontribusi &amp; SKPI Terverifikasi (Read-Only / Immutable)
        </span>
        <h2 style="font-size:24px;font-weight:800;margin-bottom:4px;">${user.name} — NIM ${String(user.identityNumber || '').replace(/^NIM\s+/i, '')}</h2>
        <p style="font-size:13.5px;opacity:0.9;margin-bottom:18px;">
          ${user.studyProgram || user.majorOrUnit} &bull; ${user.faculty}. Poin hanya diberikan setelah aktivitas selesai dan diverifikasi secara resmi.
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div style="background:rgba(255,255,255,0.14);padding:16px;border-radius:var(--radius-md);">
            <div style="font-size:12.5px;color:#A7F3D0;font-weight:600;">Impact Score Terverifikasi</div>
            <div style="font-size:34px;font-weight:900;">${user.impactScore || 0}</div>
          </div>
          <div style="background:rgba(255,255,255,0.14);padding:16px;border-radius:var(--radius-md);">
            <div style="font-size:12.5px;color:#A7F3D0;font-weight:600;">Leadership Score Terverifikasi</div>
            <div style="font-size:34px;font-weight:900;">${user.leadershipScore || 0}</div>
          </div>
        </div>

        <div style="display:flex;gap:18px;flex-wrap:wrap;font-size:13px;background:rgba(0,0,0,0.18);padding:10px 16px;border-radius:var(--radius-sm);">
          <span>Proyek Terdaftar: <strong>${myProjRegs.length}</strong></span>
          <span>Event Terdaftar: <strong>${myEventRegs.length}</strong></span>
          <span>Event Dihadiri: <strong>${myEventRegs.filter(r => r.attendanceStatus === 'Attended').length}</strong></span>
          <span>Evaluasi Mitra UMKM: <strong>${myEvaluations.length}</strong></span>
        </div>
      </div>

      <!-- Immutable Contribution Transaction History -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.award(20)} Riwayat Transaksi Kontribusi Terverifikasi (${userPortfolio.length})</h3>
          <p class="section-subtitle">Catatan permanen kontribusi yang telah divalidasi oleh Organisasi, Mitra UMKM, atau Admin Kampus.</p>
        </div>
        ${userPortfolio.length ? `<button id="btnPrintSkpi" class="btn btn-primary" style="font-size:13px;">${Icons.printer(15)} Cetak SKPI</button>` : ''}
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px;">
        ${userPortfolio.length ? userPortfolio.map(entry => `
          <div class="card" style="padding:18px;margin-bottom:0;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
              <span class="pill-badge pill-blue">${entry.category}</span>
              <span class="pill-badge pill-green">+${entry.impactPoints} Impact Score</span>
              ${entry.leadershipPoints > 0 ? `<span class="pill-badge pill-amber">+${entry.leadershipPoints} Leadership Score</span>` : ''}
              <span class="pill-badge pill-gray">Status: ${entry.verificationStatus || 'VERIFIED'}</span>
            </div>
            <h4 style="font-size:16.5px;font-weight:700;color:var(--neutral-dark);margin-bottom:2px;">${entry.title}</h4>
            <div style="font-size:12.5px;color:var(--primary);font-weight:600;margin-bottom:6px;">
              Mitra/Penyelenggara: ${entry.organizationOrPartner} &bull; Tanggal: ${entry.date} &bull; Kode Kredensial: ${entry.credentialCode}
            </div>
            <p style="font-size:13px;color:var(--neutral-body);margin-bottom:4px;">${entry.outcomeSummary}</p>
            ${entry.verifiedBy ? `<div style="font-size:12px;color:var(--neutral-muted);">Diverifikasi oleh: <strong>${entry.verifiedBy}</strong></div>` : ''}
          </div>
        `).join('') : '<div class="card" style="padding:32px;text-align:center;color:var(--neutral-muted);">Belum ada transaksi kontribusi terverifikasi.</div>'}
      </div>

      <!-- Partner Evaluations Received -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.star(20)} Evaluasi Kinerja dari Mitra UMKM (${myEvaluations.length})</h3>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
        ${myEvaluations.length ? myEvaluations.map(ev => `
          <div class="card" style="padding:18px;margin-bottom:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <strong>${ev.projectTitle} — Mitra: ${ev.partnerName}</strong>
              <span class="pill-badge pill-green">Skor Rata-rata: ${ev.averageScore} / 5.00</span>
            </div>
            <p style="font-size:13px;color:var(--neutral-body);margin-bottom:6px;">"${ev.comment}"</p>
            <div style="font-size:12px;color:var(--neutral-muted);">
              Kualitas Kerja: ${ev.ratings?.workQuality}/5 &bull; Ketepatan Waktu: ${ev.ratings?.timeliness}/5 &bull; Komunikasi: ${ev.ratings?.communication}/5 &bull; Tanggung Jawab: ${ev.ratings?.responsibility}/5 &bull; Pencapaian Tujuan: ${ev.ratings?.objectiveAchievement}/5
            </div>
          </div>
        `).join('') : '<div class="card" style="padding:22px;font-size:13px;color:var(--neutral-muted);">Belum ada evaluasi kinerja dari Mitra UMKM.</div>'}
      </div>

      <!-- Point Configuration Reference -->
      <div class="card" style="padding:18px;">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px;">Standar Poin Kontribusi Terverifikasi:</div>
        ${rules.map(r => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color);font-size:13px;">
            <div><strong>${r.activityName}</strong> — <span style="color:var(--neutral-muted);">${r.description}</span></div>
            <span class="pill-badge pill-green">+${r.points} Poin</span>
          </div>
        `).join('')}
      </div>
    `;

    this.contentEl.innerHTML = html;
    const btnPrint = document.getElementById('btnPrintSkpi');
    if (btnPrint) btnPrint.addEventListener('click', () => this.showSkpiPrintPreviewModal(user, userPortfolio, myEvaluations));
  }

  showSkpiPrintPreviewModal(user, userPortfolio, myEvaluations) {
    const cleanNim = String(user.identityNumber || '-').replace(/^NIM\s+/i, '');
    const bodyHtml = `
      <div id="skpiPrintContainer" style="padding:4px 0;">
        <div style="text-align:center;border-bottom:2px solid var(--primary);padding-bottom:12px;margin-bottom:14px;">
          <div style="font-size:16px;font-weight:800;color:var(--neutral-dark);">SURAT KETERANGAN PENDAMPING IJAZAH (SKPI)</div>
          <div style="font-size:12px;color:var(--neutral-muted);">Rekam Jejak Kontribusi &amp; Dampak Sosial Terverifikasi — Campus Impact Hub</div>
        </div>
        <div style="background:var(--surface-alt);padding:12px 16px;border-radius:var(--radius-sm);font-size:13px;margin-bottom:14px;line-height:1.6;">
          <div><strong>Nama Mahasiswa:</strong> ${user.name}</div>
          <div><strong>NIM:</strong> ${cleanNim}</div>
          <div><strong>Program Studi / Fakultas:</strong> ${user.studyProgram || user.majorOrUnit} &bull; ${user.faculty}</div>
          <div><strong>Total Impact Score Terverifikasi:</strong> ${user.impactScore || 0} Poin</div>
          <div><strong>Total Leadership Score Terverifikasi:</strong> ${user.leadershipScore || 0} Poin</div>
        </div>
        <div style="font-weight:700;font-size:13.5px;margin-bottom:8px;">Daftar Aktivitas &amp; Kontribusi Terverifikasi (${userPortfolio.length}):</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
          ${userPortfolio.map((e, i) => `
            <div style="border-left:3px solid var(--primary);padding-left:10px;font-size:12.5px;">
              <strong>${i + 1}. ${e.title}</strong> (${e.category} &bull; +${e.impactPoints} Impact${e.leadershipPoints ? `, +${e.leadershipPoints} Leadership` : ''})<br>
              <span style="color:var(--neutral-muted);">${e.organizationOrPartner} &bull; ${e.date} &bull; Kredensial: ${e.credentialCode}</span>
            </div>
          `).join('')}
        </div>
        ${myEvaluations && myEvaluations.length ? `
          <div style="font-weight:700;font-size:13.5px;margin-bottom:6px;">Evaluasi Mitra UMKM (${myEvaluations.length}):</div>
          ${myEvaluations.map(ev => `<div style="font-size:12.5px;margin-bottom:4px;">&bull; <strong>${ev.projectTitle}</strong> (${ev.partnerName}): Skor Rata-rata <strong>${ev.averageScore}/5.00</strong> — "${ev.comment}"</div>`).join('')}
        ` : ''}
      </div>
    `;
    const footerHtml = `
      <button type="button" class="btn btn-outline" id="btnCloseSkpiModal">Tutup</button>
      <button type="button" class="btn btn-primary" id="btnTriggerBrowserPrint">${Icons.printer(15)} Cetak Dokumen (Print)</button>
    `;
    this.openModal(`Pratinjau Dokumen SKPI — ${user.name}`, bodyHtml, footerHtml);
    document.getElementById('btnCloseSkpiModal').addEventListener('click', () => this.closeModal());
    document.getElementById('btnTriggerBrowserPrint').addEventListener('click', () => window.print());
  }

  // Student Module 6: Profil (Edit Permitted Info & Change Password, Cannot Change Role)
  renderStudentProfileView() {
    const user = CampusRepository.currentUser;
    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.user(20)} Profil &amp; Pengaturan Akun Mahasiswa</h3>
          <p class="section-subtitle">Kelola informasi pribadi dan keamanan kata sandi Anda. Peran akun bersifat permanen (read-only).</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;">
        <div class="card" style="padding:22px;margin-bottom:0;">
          <h4 style="font-size:16px;font-weight:700;margin-bottom:14px;">Informasi Pribadi Mahasiswa</h4>
          <form id="formStudentProfile">
            <div class="form-group">
              <label class="form-label">Peran Akun &amp; NIM (Read-Only)</label>
              <input type="text" class="form-control" value="Mahasiswa (student) — NIM: ${String(user.identityNumber || '-').replace(/^NIM\s+/i, '')}" disabled style="background:var(--surface-alt);">
            </div>
            <div class="form-group">
              <label class="form-label">Email Kampus (Read-Only)</label>
              <input type="text" class="form-control" value="${user.email}" disabled style="background:var(--surface-alt);">
            </div>
            <div class="form-group">
              <label class="form-label">Nama Lengkap</label>
              <input type="text" id="profName" class="form-control" value="${user.name || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Fakultas</label>
              <input type="text" id="profFaculty" class="form-control" value="${user.faculty || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Program Studi</label>
              <input type="text" id="profStudyProgram" class="form-control" value="${user.studyProgram || user.majorOrUnit || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Nomor Telepon / Kontak</label>
              <input type="text" id="profPhone" class="form-control" value="${user.phone || ''}" placeholder="0812-xxxx-xxxx">
            </div>
            <div class="form-group">
              <label class="form-label">Bio &amp; Fokus Minat</label>
              <textarea id="profBio" class="form-control" rows="3">${user.bio || ''}</textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-block">${Icons.check(15)} Simpan Perubahan Profil</button>
          </form>
        </div>

        <div class="card" style="padding:22px;margin-bottom:0;">
          <h4 style="font-size:16px;font-weight:700;margin-bottom:14px;">Ubah Kata Sandi Akun (scrypt)</h4>
          <form id="formChangePassword">
            <div class="form-group">
              <label class="form-label">Kata Sandi Saat Ini</label>
              <input type="password" id="cpCurrent" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label">Kata Sandi Baru (Min. 6 Karakter)</label>
              <input type="password" id="cpNew" class="form-control" required minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label">Konfirmasi Kata Sandi Baru</label>
              <input type="password" id="cpConfirm" class="form-control" required minlength="6">
            </div>
            <button type="submit" class="btn btn-secondary btn-block">${Icons.key(15)} Perbarui Kata Sandi</button>
          </form>

          <div style="border-top:1px solid var(--border-color);margin-top:22px;padding-top:18px;">
            <button id="btnProfileLogout" class="btn btn-outline btn-block" style="border-color:var(--danger);color:var(--danger);">
              ${Icons.logOut(15)} Keluar dari Sesi Akun (Logout)
            </button>
          </div>
        </div>
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.getElementById('formStudentProfile').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const studyProgram = document.getElementById('profStudyProgram').value;
        const res = await CampusRepository.updateProfile({
          name: document.getElementById('profName').value,
          faculty: document.getElementById('profFaculty').value,
          studyProgram,
          majorOrUnit: studyProgram,
          phone: document.getElementById('profPhone').value,
          bio: document.getElementById('profBio').value
        });
        this.showToast(res.message, 'success');
      } catch (err) {
        this.showToast(err.message, 'danger');
      }
    });

    document.getElementById('formChangePassword').addEventListener('submit', async (e) => {
      e.preventDefault();
      const cur = document.getElementById('cpCurrent').value;
      const nw = document.getElementById('cpNew').value;
      const cnf = document.getElementById('cpConfirm').value;
      if (nw !== cnf) {
        this.showToast('Konfirmasi kata sandi baru tidak cocok.', 'danger');
        return;
      }
      try {
        const res = await CampusRepository.changePassword(cur, nw);
        this.showToast(res.message, 'success');
        e.target.reset();
      } catch (err) {
        this.showToast(err.message, 'danger');
      }
    });

    document.getElementById('btnProfileLogout').addEventListener('click', () => this.switchTab('logout'));
  }

  // =========================================================================
  // ROLE B: ORGANIZATION (BEM / UKM) DASHBOARD & MODULES
  // =========================================================================
  renderDashboardOrganization(user) {
    const myOrg = CampusRepository.getMyOrganization();
    const myEvents = (CampusRepository.events || []).filter(e => CampusRepository.isOwnEvent(e));
    const myEventIds = new Set(myEvents.map(e => e.id));
    const myParticipants = (CampusRepository.eventRegistrations || []).filter(r => myEventIds.has(r.eventId) && r.registrationStatus === 'Registered');
    const verStatus = myOrg ? myOrg.verificationStatus : 'DRAFT';

    let statusBanner = '';
    if (verStatus === 'VERIFIED') {
      statusBanner = `
        <div class="card" style="padding:18px;margin-bottom:20px;background:#ECFDF5;border-color:#A7F3D0;color:#065F46;">
          <strong>${Icons.checkCircle(16)} Status Legalitas Organisasi: TERVERIFIKASI (Verified)</strong>
          <div style="font-size:13px;margin-top:4px;">SK Organisasi (${myOrg.skNumber}) telah disetujui Admin Kampus. Anda dapat mempublikasikan event kampus resmi dan memvalidasi kehadiran peserta.</div>
        </div>
      `;
    } else if (verStatus === 'REJECTED') {
      statusBanner = `
        <div class="card" style="padding:18px;margin-bottom:20px;background:#FEF2F2;border-color:#FECACA;color:#991B1B;">
          <strong>${Icons.xCircle(16)} Status Legalitas Organisasi: DITOLAK (Rejected)</strong>
          <div style="font-size:13px;margin-top:4px;"><strong>Alasan Penolakan Admin:</strong> ${myOrg?.rejectionReason || 'Dokumen SK perlu diperbaiki.'}</div>
          <button id="btnBannerFixOrg" class="btn btn-primary" style="margin-top:10px;font-size:12.5px;">Perbaiki &amp; Ajukan Ulang Pendaftaran SK</button>
        </div>
      `;
    } else {
      statusBanner = `
        <div class="card" style="padding:18px;margin-bottom:20px;background:#FFFBEB;border-color:#FDE68A;color:#92400E;">
          <strong>${Icons.clock(16)} Status Legalitas Organisasi: MENUNGGU VERIFIKASI (Pending Verification)</strong>
          <div style="font-size:13px;margin-top:4px;">Akun Anda dapat mengakses dashboard dan memperbarui berkas pendaftaran, namun publikasi event resmi menunggu persetujuan SK dari Admin Kampus.</div>
        </div>
      `;
    }

    const html = `
      ${this._welcomeHeaderHtml(
        user,
        'BEM / UKM',
        `Dashboard Pengurus Organisasi (${myOrg ? myOrg.name : user.name}). Kelola pendaftaran & dokumen SK organisasi, profil lembaga, agenda event kampus, dan validasi kehadiran manual peserta.`,
        `<button id="btnOrgGoReg" class="btn btn-secondary">${Icons.upload(15)} Pendaftaran &amp; Berkas SK</button>
         <button id="btnOrgGoProfile" class="btn btn-outline">${Icons.organization(15)} Profil Organisasi</button>
         <button id="btnOrgGoEvents" class="btn btn-primary">${Icons.event(15)} Manajemen Event</button>
         <button id="btnOrgGoParticipants" class="btn btn-outline">${Icons.users(15)} Daftar Peserta &amp; Presensi</button>`
      )}

      ${statusBanner}

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--primary-light);color:var(--primary);">${Icons.shieldCheck(22)}</div>
          <div class="stat-info">
            <div class="value">${verStatus}</div>
            <div class="label">Status Verifikasi SK</div>
            <div class="sublabel">${myOrg ? myOrg.skNumber : 'Belum Diajukan'}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#F5F3FF;color:#7C3AED;">${Icons.event(22)}</div>
          <div class="stat-info">
            <div class="value">${myEvents.length}</div>
            <div class="label">Total Event Organisasi</div>
            <div class="sublabel">${myEvents.filter(e => e.publicationStatus === 'PUBLISHED').length} Event Dipublikasikan</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--success-light);color:var(--success);">${Icons.users(22)}</div>
          <div class="stat-info">
            <div class="value">${myParticipants.length}</div>
            <div class="label">Total Peserta Terdaftar</div>
            <div class="sublabel">${myParticipants.filter(r => r.attendanceStatus === 'Attended').length} Peserta Hadir Tervalidasi</div>
          </div>
        </div>
      </div>

      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.event(20)} Event Organisasi Kami (${myEvents.length})</h3>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${myEvents.length ? myEvents.map(ev => `
          <div class="card" style="padding:18px;margin-bottom:0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
                <span class="pill-badge pill-blue">${ev.type}</span>
                <span class="pill-badge pill-green">${ev.publicationStatus || 'PUBLISHED'}</span>
              </div>
              <h4 style="font-size:16px;font-weight:700;margin:0;">${ev.title}</h4>
              <div style="font-size:12.5px;color:var(--neutral-muted);">${ev.date} &bull; ${ev.location} &bull; Kapasitas: ${ev.registeredCount || 0}/${ev.quota}</div>
            </div>
            <button class="btn btn-secondary btn-dash-manage-participants" data-id="${ev.id}">
              ${Icons.users(15)} Kelola Peserta &amp; Validasi Kehadiran
            </button>
          </div>
        `).join('') : '<div class="card" style="padding:28px;text-align:center;color:var(--neutral-muted);">Belum ada event yang dibuat oleh organisasi ini.</div>'}
      </div>
    `;

    this.contentEl.innerHTML = html;
    const bind = (id, tab) => { const el = document.getElementById(id); if (el) el.addEventListener('click', () => this.switchTab(tab)); };
    bind('btnOrgGoReg', 'org_registration');
    bind('btnOrgGoProfile', 'org_profile');
    bind('btnOrgGoEvents', 'org_events');
    bind('btnOrgGoParticipants', 'org_participants');
    bind('btnBannerFixOrg', 'org_registration');

    document.querySelectorAll('.btn-dash-manage-participants').forEach(btn => {
      btn.addEventListener('click', () => {
        this.participantSelectedEventId = btn.getAttribute('data-id');
        this.switchTab('org_participants');
      });
    });
  }

  // Organization Module 2: Pendaftaran Organisasi (SK Upload + Preview + Resubmit)
  renderOrgRegistrationView() {
    const user = CampusRepository.currentUser;
    const myOrg = CampusRepository.getMyOrganization();
    const verStatus = myOrg ? myOrg.verificationStatus : 'DRAFT';

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.upload(20)} Pendaftaran &amp; Legalitas SK Organisasi</h3>
          <p class="section-subtitle">Lengkapi formulir pendaftaran organisasi resmi beserta unggahan dokumen Surat Keputusan (SK) untuk diverifikasi Admin Kampus.</p>
        </div>
        <span class="pill-badge ${verStatus === 'VERIFIED' ? 'pill-green' : (verStatus === 'REJECTED' ? 'pill-red' : 'pill-amber')}">
          Status: ${VerificationStatus[verStatus]?.label || verStatus}
        </span>
      </div>

      ${myOrg && myOrg.rejectionReason ? `
        <div class="card" style="padding:16px;margin-bottom:18px;background:#FEF2F2;border-color:#FECACA;color:#991B1B;">
          <strong>Catatan Penolakan dari Admin Kampus:</strong>
          <p style="font-size:13.5px;margin:4px 0 0 0;">${myOrg.rejectionReason}</p>
        </div>
      ` : ''}

      <div class="card" style="padding:24px;">
        <form id="formOrgRegistration">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div class="form-group">
              <label class="form-label">Nama Organisasi (BEM/UKM) <span style="color:var(--danger);">*</span></label>
              <input type="text" id="orName" class="form-control" value="${myOrg?.name || user.majorOrUnit || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Kategori Organisasi <span style="color:var(--danger);">*</span></label>
              <input type="text" id="orCategory" class="form-control" value="${myOrg?.category || 'Kepemimpinan & Sosial'}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Tingkat Organisasi <span style="color:var(--danger);">*</span></label>
              <select id="orLevel" class="form-control">
                <option value="Universitas" ${myOrg?.level === 'Universitas' ? 'selected' : ''}>Universitas</option>
                <option value="Fakultas" ${myOrg?.level === 'Fakultas' ? 'selected' : ''}>Fakultas</option>
                <option value="Program Studi / Jurusan" ${myOrg?.level === 'Program Studi / Jurusan' ? 'selected' : ''}>Program Studi / Jurusan</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Afiliasi Fakultas / Universitas <span style="color:var(--danger);">*</span></label>
              <input type="text" id="orAffiliation" class="form-control" value="${myOrg?.affiliation || user.faculty || 'Universitas'}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Ketua / Penanggung Jawab <span style="color:var(--danger);">*</span></label>
              <input type="text" id="orChairman" class="form-control" value="${myOrg?.chairmanName || user.name || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Dosen Pembina <span style="color:var(--danger);">*</span></label>
              <input type="text" id="orAdvisor" class="form-control" value="${myOrg?.advisorName || 'Dr. Ir. Hendra Wijaya, M.T.'}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Nomor Surat Keputusan (SK) <span style="color:var(--danger);">*</span></label>
              <input type="text" id="orSkNumber" class="form-control" value="${myOrg?.skNumber || ''}" placeholder="SK/REKTOR/..." required>
            </div>
            <div class="form-group">
              <label class="form-label">Bidang Kegiatan Utama <span style="color:var(--danger);">*</span></label>
              <input type="text" id="orActivityField" class="form-control" value="${myOrg?.activityField || 'Pengembangan Mahasiswa & Pengabdian'}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Kontak Resmi (Email / Telepon) <span style="color:var(--danger);">*</span></label>
              <input type="text" id="orContact" class="form-control" value="${myOrg?.contact || user.email || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Unggah Dokumen SK Resmi (PDF, JPG, JPEG, PNG — Maks 2MB) ${myOrg?.skDocumentName ? '' : '<span style="color:var(--danger);">*</span>'}</label>
              <input type="file" id="orSkFile" class="form-control" accept=".pdf,.jpg,.jpeg,.png">
              <div id="orSkPreviewBox" style="margin-top:6px;font-size:12px;color:var(--neutral-muted);">
                ${myOrg?.skDocumentName ? `Dokumen tersimpan: <strong>${myOrg.skDocumentName}</strong> (${Math.round((myOrg.skDocumentSize || 102400) / 1024)} KB)` : 'Belum ada file SK dipilih.'}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Deskripsi Lengkap Organisasi <span style="color:var(--danger);">*</span></label>
            <textarea id="orDescription" class="form-control" rows="3" required>${myOrg?.description || user.bio || ''}</textarea>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            ${myOrg?.skDocumentData ? `
              <button type="button" id="btnPreviewOwnSk" class="btn btn-secondary">
                ${Icons.eye(15)} Pratinjau Dokumen SK Tersimpan
              </button>
            ` : ''}
            <button type="submit" class="btn btn-primary">
              ${Icons.check(15)} ${myOrg ? 'Simpan & Ajukan Ulang Verifikasi SK' : 'Kirim Pendaftaran Organisasi'}
            </button>
          </div>
        </form>
      </div>
    `;

    this.contentEl.innerHTML = html;

    const fileInput = document.getElementById('orSkFile');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleSkFileSelection(e.target, 'orSkPreviewBox'));
    }

    const btnPreview = document.getElementById('btnPreviewOwnSk');
    if (btnPreview && myOrg) {
      btnPreview.addEventListener('click', () => this.showSkDocumentPreviewModal(myOrg));
    }

    document.getElementById('formOrgRegistration').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          id: myOrg?.id,
          name: document.getElementById('orName').value,
          fullName: document.getElementById('orName').value,
          category: document.getElementById('orCategory').value,
          level: document.getElementById('orLevel').value,
          affiliation: document.getElementById('orAffiliation').value,
          chairmanName: document.getElementById('orChairman').value,
          advisorName: document.getElementById('orAdvisor').value,
          skNumber: document.getElementById('orSkNumber').value,
          activityField: document.getElementById('orActivityField').value,
          contact: document.getElementById('orContact').value,
          description: document.getElementById('orDescription').value
        };
        if (this.pendingSkUpload) {
          payload.skDocumentName = this.pendingSkUpload.name;
          payload.skDocumentType = this.pendingSkUpload.type;
          payload.skDocumentSize = this.pendingSkUpload.size;
          payload.skDocumentData = this.pendingSkUpload.data;
        }
        const res = await CampusRepository.saveOrganization(payload);
        this.pendingSkUpload = null;
        this.showToast(res.message, 'success');
        this.render();
      } catch (err) {
        this.showToast(err.message, 'danger');
      }
    });
  }

  // Organization Module 3: Profil Organisasi
  renderOrgProfileView() {
    const myOrg = CampusRepository.getMyOrganization();
    if (!myOrg) {
      this.renderOrgRegistrationView();
      return;
    }

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.organization(20)} Profil Organisasi — ${myOrg.name}</h3>
          <p class="section-subtitle">Perbarui informasi profil publik organisasi Anda. Perubahan pada nomor atau dokumen SK akan memicu verifikasi ulang oleh Admin.</p>
        </div>
        <span class="pill-badge ${myOrg.verificationStatus === 'VERIFIED' ? 'pill-green' : 'pill-amber'}">
          Status: ${myOrg.verificationStatus}
        </span>
      </div>

      <div class="card" style="padding:24px;">
        <form id="formOrgProfileUpdate">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div class="form-group">
              <label class="form-label">Nama Organisasi</label>
              <input type="text" class="form-control" value="${myOrg.name}" disabled style="background:var(--surface-alt);">
            </div>
            <div class="form-group">
              <label class="form-label">Nomor SK Terdaftar</label>
              <input type="text" class="form-control" value="${myOrg.skNumber}" disabled style="background:var(--surface-alt);">
            </div>
            <div class="form-group">
              <label class="form-label">Ketua / Penanggung Jawab</label>
              <input type="text" id="opChairman" class="form-control" value="${myOrg.chairmanName || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Dosen Pembina</label>
              <input type="text" id="opAdvisor" class="form-control" value="${myOrg.advisorName || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Bidang Kegiatan</label>
              <input type="text" id="opActivityField" class="form-control" value="${myOrg.activityField || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Kontak Resmi</label>
              <input type="text" id="opContact" class="form-control" value="${myOrg.contact || ''}" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi Organisasi</label>
            <textarea id="opDescription" class="form-control" rows="3" required>${myOrg.description || ''}</textarea>
          </div>
          <button type="submit" class="btn btn-primary">${Icons.check(15)} Simpan Pembaruan Profil Organisasi</button>
        </form>
      </div>
    `;

    this.contentEl.innerHTML = html;
    document.getElementById('formOrgProfileUpdate').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await CampusRepository.saveOrganization({
          id: myOrg.id,
          name: myOrg.name,
          skNumber: myOrg.skNumber,
          chairmanName: document.getElementById('opChairman').value,
          advisorName: document.getElementById('opAdvisor').value,
          activityField: document.getElementById('opActivityField').value,
          contact: document.getElementById('opContact').value,
          description: document.getElementById('opDescription').value
        });
        this.showToast(res.message, 'success');
      } catch (err) {
        this.showToast(err.message, 'danger');
      }
    });
  }

  // Organization Module 4: Manajemen Event
  renderOrgEventsManagementView() {
    const myOrg = CampusRepository.getMyOrganization();
    const isVerified = myOrg && myOrg.verificationStatus === 'VERIFIED';
    const myEvents = (CampusRepository.events || []).filter(e => CampusRepository.isOwnEvent(e));

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.event(20)} Manajemen Event Organisasi</h3>
          <p class="section-subtitle">Kelola pembuatan, jadwal, kapasitas, dan publikasi event resmi organisasi Anda.</p>
        </div>
        <button id="btnOrgCreateEvent" class="btn btn-primary" ${!isVerified ? 'disabled title="Organisasi harus Terverifikasi SK terlebih dahulu"' : ''}>
          ${Icons.plus(15)} Buat Event Baru
        </button>
      </div>

      ${!isVerified ? `
        <div class="card" style="padding:16px;margin-bottom:18px;background:#FFFBEB;border-color:#FDE68A;color:#92400E;font-size:13px;">
          <strong>Perhatian:</strong> Organisasi Anda saat ini berstatus <strong>${myOrg ? myOrg.verificationStatus : 'Belum Terdaftar'}</strong>. Hanya organisasi yang telah <strong>Verified</strong> oleh Admin Kampus yang dapat menerbitkan event resmi.
        </div>
      ` : ''}

      <div style="display:flex;flex-direction:column;gap:14px;">
        ${myEvents.length ? myEvents.map(ev => {
          const regs = CampusRepository.getEventParticipants(ev.id).filter(r => r.registrationStatus === 'Registered');
          return `
            <div class="card" style="padding:20px;margin-bottom:0;">
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <span class="pill-badge pill-blue">${ev.type}</span>
                <span class="pill-badge pill-green">Status Publikasi: ${ev.publicationStatus || 'PUBLISHED'}</span>
                <span class="pill-badge pill-gray">${regs.length} / ${ev.quota} Peserta Terdaftar</span>
              </div>
              <h4 style="font-size:17px;font-weight:700;margin-bottom:4px;">${ev.title}</h4>
              <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:8px;">
                Jadwal: ${ev.date} &bull; Batas Pendaftaran: ${ev.registrationDeadline || ev.date} &bull; Lokasi: ${ev.location}
              </div>
              <p style="font-size:13.5px;color:var(--neutral-body);margin-bottom:14px;">${ev.description}</p>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button class="btn btn-secondary btn-org-edit-event" data-id="${ev.id}">
                  ${Icons.edit(15)} Edit Event
                </button>
                <button class="btn btn-primary btn-org-open-participants" data-id="${ev.id}">
                  ${Icons.users(15)} Daftar Peserta &amp; Validasi Kehadiran (${regs.length})
                </button>
              </div>
            </div>
          `;
        }).join('') : '<div class="card" style="padding:36px;text-align:center;color:var(--neutral-muted);">Belum ada event yang terdaftar untuk organisasi Anda.</div>'}
      </div>
    `;

    this.contentEl.innerHTML = html;
    const btnCreate = document.getElementById('btnOrgCreateEvent');
    if (btnCreate && isVerified) {
      btnCreate.addEventListener('click', () => this.showCreateEventModal());
    }
    document.querySelectorAll('.btn-org-edit-event').forEach(btn => {
      btn.addEventListener('click', () => {
        const ev = (CampusRepository.events || []).find(e => e.id === btn.getAttribute('data-id'));
        if (ev) this.showCreateEventModal(ev);
      });
    });
    document.querySelectorAll('.btn-org-open-participants').forEach(btn => {
      btn.addEventListener('click', () => {
        this.participantSelectedEventId = btn.getAttribute('data-id');
        this.switchTab('org_participants');
      });
    });
  }

  // Organization Module 5: Daftar Peserta & Validasi Kehadiran Manual (Nama/NIM)
  renderOrgParticipantsView() {
    const myEvents = CampusRepository.hasRole('admin')
      ? (CampusRepository.events || [])
      : (CampusRepository.events || []).filter(e => CampusRepository.isOwnEvent(e));

    if (myEvents.length && (!this.participantSelectedEventId || !myEvents.some(e => e.id === this.participantSelectedEventId))) {
      this.participantSelectedEventId = myEvents[0].id;
    }

    const selectedEvent = myEvents.find(e => e.id === this.participantSelectedEventId) || null;
    const allParticipants = selectedEvent ? CampusRepository.getEventParticipants(selectedEvent.id) : [];

    const filteredParticipants = allParticipants.filter(r => {
      const q = (this.participantSearchQuery || '').toLowerCase();
      const matchSearch = !q ||
        (r.studentName && r.studentName.toLowerCase().includes(q)) ||
        (r.studentNim && r.studentNim.toLowerCase().includes(q)) ||
        (r.studyProgram && r.studyProgram.toLowerCase().includes(q));
      const matchStatus = this.participantStatusFilter === 'Semua' || r.attendanceStatus === this.participantStatusFilter;
      return matchSearch && matchStatus;
    });

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.users(20)} Daftar Peserta &amp; Validasi Kehadiran Manual (Nama / NIM)</h3>
          <p class="section-subtitle">Cari peserta berdasarkan Nama atau NIM dan validasi kehadiran secara manual tanpa QR Code.</p>
        </div>
        ${selectedEvent ? `
          <button id="btnManualAddValidate" class="btn btn-primary">
            ${Icons.check(15)} Validasi Manual via Nama / NIM
          </button>
        ` : ''}
      </div>

      <div class="card" style="padding:18px;margin-bottom:18px;">
        <div style="display:grid;grid-template-columns:1.5fr 1.5fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Pilih Event Organisasi</label>
            <select id="selectParticipantEvent" class="form-control">
              ${myEvents.length ? myEvents.map(e => `<option value="${e.id}" ${e.id === this.participantSelectedEventId ? 'selected' : ''}>${e.title} (${e.date})</option>`).join('') : '<option value="">Belum ada event</option>'}
            </select>
          </div>
          <div>
            <label class="form-label">Cari Nama Mahasiswa atau NIM</label>
            <input type="text" id="inputParticipantSearch" class="form-control" placeholder="Ketik Nama atau NIM (misal: Budi / 13523001)..." value="${this.participantSearchQuery}">
          </div>
          <div>
            <label class="form-label">Filter Status Kehadiran</label>
            <select id="selectParticipantStatus" class="form-control">
              <option value="Semua" ${this.participantStatusFilter === 'Semua' ? 'selected' : ''}>Semua Status</option>
              <option value="Registered" ${this.participantStatusFilter === 'Registered' ? 'selected' : ''}>Registered (Belum Check-In)</option>
              <option value="Attended" ${this.participantStatusFilter === 'Attended' ? 'selected' : ''}>Attended (Hadir)</option>
              <option value="No Show" ${this.participantStatusFilter === 'No Show' ? 'selected' : ''}>No Show (Tidak Hadir)</option>
              <option value="Cancelled" ${this.participantStatusFilter === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card" style="padding:18px;">
        ${filteredParticipants.length ? `
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="border-bottom:2px solid var(--border-color);text-align:left;">
                  <th style="padding:10px 8px;">Nama Mahasiswa</th>
                  <th style="padding:10px 8px;">NIM</th>
                  <th style="padding:10px 8px;">Fakultas &amp; Prodi</th>
                  <th style="padding:10px 8px;">Waktu Registrasi</th>
                  <th style="padding:10px 8px;">Status Registrasi</th>
                  <th style="padding:10px 8px;">Status Kehadiran</th>
                  <th style="padding:10px 8px;">Aksi Validasi Panitia</th>
                </tr>
              </thead>
              <tbody>
                ${filteredParticipants.map(r => `
                  <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:10px 8px;font-weight:700;">${r.studentName}</td>
                    <td style="padding:10px 8px;font-family:monospace;">${r.studentNim}</td>
                    <td style="padding:10px 8px;">${r.studyProgram || '-'}<br><span style="font-size:11.5px;color:var(--neutral-muted);">${r.faculty || ''}</span></td>
                    <td style="padding:10px 8px;">${r.registeredAt ? new Date(r.registeredAt).toLocaleDateString('id-ID') : '-'}</td>
                    <td style="padding:10px 8px;">${r.registrationStatus}</td>
                    <td style="padding:10px 8px;">
                      <span class="pill-badge ${r.attendanceStatus === 'Attended' ? 'pill-green' : (r.attendanceStatus === 'No Show' || r.attendanceStatus === 'Cancelled' ? 'pill-red' : 'pill-amber')}">
                        ${r.attendanceStatus}
                      </span>
                    </td>
                    <td style="padding:10px 8px;">
                      ${r.attendanceStatus !== 'Attended' && r.registrationStatus === 'Registered' ? `
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">
                          <button class="btn btn-primary btn-quick-attend" data-event="${r.eventId}" data-nim="${r.studentNim}" data-committee="false" style="padding:5px 10px;font-size:11.5px;">
                            ${Icons.check(13)} Hadir Peserta (+10)
                          </button>
                          <button class="btn btn-secondary btn-quick-attend" data-event="${r.eventId}" data-nim="${r.studentNim}" data-committee="true" style="padding:5px 10px;font-size:11.5px;">
                            Panitia (+20)
                          </button>
                          <button class="btn btn-outline btn-quick-noshow" data-event="${r.eventId}" data-nim="${r.studentNim}" style="padding:5px 10px;font-size:11.5px;color:var(--danger);border-color:var(--danger);">
                            No Show
                          </button>
                        </div>
                      ` : `<span style="font-size:12px;color:var(--neutral-muted);">${r.checkInTimestamp ? 'Tervalidasi ' + new Date(r.checkInTimestamp).toLocaleTimeString('id-ID') : '-'}</span>`}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<div style="padding:32px;text-align:center;color:var(--neutral-muted);">Belum ada peserta yang sesuai filter pada event ini. Gunakan tombol "Validasi Manual via Nama / NIM" untuk memvalidasi mahasiswa.</div>`}
      </div>
    `;

    this.contentEl.innerHTML = html;

    const selectEv = document.getElementById('selectParticipantEvent');
    if (selectEv) {
      selectEv.addEventListener('change', (e) => {
        this.participantSelectedEventId = e.target.value;
        this.renderOrgParticipantsView();
      });
    }
    const searchInput = document.getElementById('inputParticipantSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.participantSearchQuery = e.target.value;
        this._reRenderPreservingFocus('inputParticipantSearch', this.renderOrgParticipantsView);
      });
    }
    const statusSel = document.getElementById('selectParticipantStatus');
    if (statusSel) {
      statusSel.addEventListener('change', (e) => {
        this.participantStatusFilter = e.target.value;
        this.renderOrgParticipantsView();
      });
    }

    const btnModalValidate = document.getElementById('btnManualAddValidate');
    if (btnModalValidate && selectedEvent) {
      btnModalValidate.addEventListener('click', () => this.showManualAttendanceModal(selectedEvent.id));
    }

    document.querySelectorAll('.btn-quick-attend').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await CampusRepository.validateEventAttendanceManual(btn.getAttribute('data-event'), {
            participantQuery: btn.getAttribute('data-nim'),
            asCommittee: btn.getAttribute('data-committee') === 'true',
            attendanceStatus: 'Attended'
          });
          this.showToast(res.message, 'success');
          this.render();
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    });

    document.querySelectorAll('.btn-quick-noshow').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await CampusRepository.validateEventAttendanceManual(btn.getAttribute('data-event'), {
            participantQuery: btn.getAttribute('data-nim'),
            asCommittee: false,
            attendanceStatus: 'No Show'
          });
          this.showToast(res.message, 'info');
          this.render();
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    });
  }

  // =========================================================================
  // ROLE C: PARTNER / UMKM DASHBOARD & MODULES
  // =========================================================================
  renderDashboardPartner(user) {
    const myProjects = (CampusRepository.projects || []).filter(p => CampusRepository.isOwnProject(p));
    const pendingCount = myProjects.filter(p => ['SUBMITTED', 'UNDER_REVIEW'].includes(p.status)).length;
    const openCount = myProjects.filter(p => p.status === 'OPEN').length;
    const ongoingCount = myProjects.filter(p => p.status === 'ON_GOING').length;
    const completedCount = myProjects.filter(p => p.status === 'COMPLETED').length;
    const myEvaluations = (CampusRepository.partnerEvaluations || []).filter(ev => ev.partnerId === user.id || ev.partnerName === user.name);

    const html = `
      ${this._welcomeHeaderHtml(
        user,
        'Mitra UMKM',
        `Dashboard Mitra Usaha (${user.name} — Penanggung Jawab: ${user.ownerName || user.name}). Ajukan permasalahan nyata UMKM, pantau perkembangan penyelesaian proyek mahasiswa, dan berikan penilaian kinerja mahasiswa.`,
        `<button id="btnPartnerGoSubmit" class="btn btn-primary">${Icons.plus(15)} Pengajuan Masalah Baru</button>
         <button id="btnPartnerGoProjects" class="btn btn-secondary">${Icons.project(15)} Proyek Saya (${myProjects.length})</button>
         <button id="btnPartnerGoEval" class="btn btn-outline">${Icons.star(15)} Penilaian Mahasiswa (${myEvaluations.length})</button>`
      )}

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--primary-light);color:var(--primary);">${Icons.project(22)}</div>
          <div class="stat-info">
            <div class="value">${myProjects.length}</div>
            <div class="label">Total Pengajuan Masalah</div>
            <div class="sublabel">${pendingCount} Menunggu Review Admin</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#FFFBEB;color:#D97706;">${Icons.clock(22)}</div>
          <div class="stat-info">
            <div class="value">${openCount + ongoingCount}</div>
            <div class="label">Proyek Aktif &amp; Berjalan</div>
            <div class="sublabel">${openCount} Open &bull; ${ongoingCount} On Going</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--success-light);color:var(--success);">${Icons.checkCircle(22)}</div>
          <div class="stat-info">
            <div class="value">${completedCount}</div>
            <div class="label">Proyek Selesai</div>
            <div class="sublabel">Solusi Terimplementasi</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#F5F3FF;color:#7C3AED;">${Icons.star(22)}</div>
          <div class="stat-info">
            <div class="value">${myEvaluations.length}</div>
            <div class="label">Evaluasi Mahasiswa</div>
            <div class="sublabel">Penilaian Kinerja Terkirim</div>
          </div>
        </div>
      </div>

      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.project(20)} Ringkasan Proyek &amp; Pengajuan Masalah Saya</h3>
          <p class="section-subtitle">Alur status proyek: Submitted &rarr; Under Review &rarr; Open &rarr; On Going &rarr; Completed.</p>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${myProjects.length ? myProjects.map(p => this.renderProjectCardHtml(p)).join('') : `
          <div class="card" style="padding:36px;text-align:center;">
            <p style="font-size:14px;color:var(--neutral-muted);margin-bottom:12px;">Anda belum mengajukan permasalahan UMKM.</p>
            <button id="btnEmptyPartnerSubmit" class="btn btn-primary">${Icons.plus(15)} Ajukan Masalah Pertama</button>
          </div>
        `}
      </div>
    `;

    this.contentEl.innerHTML = html;
    const bind = (id, tab) => { const el = document.getElementById(id); if (el) el.addEventListener('click', () => this.switchTab(tab)); };
    bind('btnPartnerGoSubmit', 'partner_submit');
    bind('btnPartnerGoProjects', 'partner_projects');
    bind('btnPartnerGoEval', 'partner_evaluations');
    bind('btnEmptyPartnerSubmit', 'partner_submit');
    this.bindProjectCardEvents();
  }

  // Partner Module 2: Pengajuan Masalah (Dedicated Form Entering Admin Review)
  renderPartnerProblemSubmitView() {
    const user = CampusRepository.currentUser;
    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.upload(20)} Formulir Pengajuan Masalah UMKM / Mitra</h3>
          <p class="section-subtitle">Setiap pengajuan masalah baru akan masuk ke tahap peninjauan kelayakan oleh Admin Kampus (Submitted &rarr; Under Review &rarr; Open).</p>
        </div>
      </div>

      <div class="card" style="padding:24px;">
        <form id="formPartnerProblemSubmit">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div class="form-group">
              <label class="form-label">Nama Usaha / UMKM <span style="color:var(--danger);">*</span></label>
              <input type="text" id="psOrgName" class="form-control" value="${user.name || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Nama Pemilik / Penanggung Jawab <span style="color:var(--danger);">*</span></label>
              <input type="text" id="psOwnerName" class="form-control" value="${user.ownerName || user.name || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Judul Masalah / Kebutuhan Proyek <span style="color:var(--danger);">*</span></label>
              <input type="text" id="psTitle" class="form-control" placeholder="Contoh: Digitalisasi Kasir & Manajemen Stok Gudang" required>
            </div>
            <div class="form-group">
              <label class="form-label">Kategori Masalah <span style="color:var(--danger);">*</span></label>
              <select id="psCategory" class="form-control">
                <option value="Teknologi">Teknologi &amp; Sistem Informasi</option>
                <option value="Digital Marketing">Digital Marketing &amp; Branding</option>
                <option value="Lingkungan">Lingkungan &amp; Pengolahan</option>
                <option value="Pendidikan">Edukasi &amp; Pemberdayaan</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Lokasi Usaha <span style="color:var(--danger);">*</span></label>
              <input type="text" id="psLocation" class="form-control" value="${user.address || 'Kec. Coblong, Kota Bandung'}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Estimasi Penerima Manfaat (Orang) <span style="color:var(--danger);">*</span></label>
              <input type="number" id="psBeneficiaries" class="form-control" value="100" min="5" required>
            </div>
            <div class="form-group">
              <label class="form-label">Keahlian Mahasiswa yang Dibutuhkan (Pisahkan koma) <span style="color:var(--danger);">*</span></label>
              <input type="text" id="psRequirements" class="form-control" placeholder="2 Informatika, 1 Bisnis Digital, 1 DKV" required>
            </div>
            <div class="form-group">
              <label class="form-label">Estimasi Durasi Penyelesaian <span style="color:var(--danger);">*</span></label>
              <input type="text" id="psDuration" class="form-control" value="8 Minggu" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Deskripsi Permasalahan Usaha Secara Rinci <span style="color:var(--danger);">*</span></label>
            <textarea id="psDescription" class="form-control" rows="3" placeholder="Jelaskan kendala operasional yang dihadapi UMKM saat ini..." required></textarea>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div class="form-group">
              <label class="form-label">Target Luaran Proyek (Expected Outcomes) <span style="color:var(--danger);">*</span></label>
              <input type="text" id="psOutcomes" class="form-control" placeholder="Aplikasi kasir siap pakai & panduan operasional" required>
            </div>
            <div class="form-group">
              <label class="form-label">Nama Lampiran / Dokumen Pendukung</label>
              <input type="text" id="psAttachment" class="form-control" placeholder="Contoh: Foto_Toko_dan_Pembukuan.pdf">
            </div>
          </div>

          <button type="submit" class="btn btn-primary">${Icons.upload(15)} Kirim Pengajuan Masalah untuk Direview Admin</button>
        </form>
      </div>
    `;

    this.contentEl.innerHTML = html;
    document.getElementById('formPartnerProblemSubmit').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await CampusRepository.submitProblem({
          orgName: document.getElementById('psOrgName').value,
          ownerName: document.getElementById('psOwnerName').value,
          title: document.getElementById('psTitle').value,
          category: document.getElementById('psCategory').value,
          location: document.getElementById('psLocation').value,
          estimatedBeneficiaries: document.getElementById('psBeneficiaries').value,
          requirementsInput: document.getElementById('psRequirements').value,
          expectedDuration: document.getElementById('psDuration').value,
          description: document.getElementById('psDescription').value,
          expectedOutcomes: document.getElementById('psOutcomes').value,
          attachmentName: document.getElementById('psAttachment').value
        });
        this.showToast(res.message, 'success');
        this.switchTab('partner_projects');
      } catch (err) {
        this.showToast(err.message, 'danger');
      }
    });
  }

  // Partner Module 3: Proyek Saya (Monitor Approval Status, Milestones, Assigned Students)
  renderPartnerMyProjectsView() {
    const myProjects = (CampusRepository.projects || []).filter(p => CampusRepository.isOwnProject(p));

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.project(20)} Proyek Saya (${myProjects.length})</h3>
          <p class="section-subtitle">Pantau status persetujuan Admin, mahasiswa yang ditugaskan, dan perkembangan penyelesaian proyek UMKM Anda.</p>
        </div>
        <button id="btnMyProjNew" class="btn btn-primary">${Icons.plus(15)} Ajukan Masalah Baru</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        ${myProjects.length ? myProjects.map(p => {
          const assigned = p.assignedStudents || [];
          return `
            <div class="card" style="padding:22px;margin-bottom:0;">
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                <span class="pill-badge pill-blue">${p.category}</span>
                <span class="pill-badge ${p.status === 'COMPLETED' ? 'pill-green' : (p.status === 'REJECTED' ? 'pill-red' : 'pill-amber')}">
                  Status Workflow: ${ProjectStatus[p.status]?.label || p.status}
                </span>
                <span class="pill-badge pill-gray">${assigned.length} Mahasiswa Ditugaskan</span>
              </div>
              <h4 style="font-size:18px;font-weight:700;margin-bottom:4px;">${p.title}</h4>
              <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:8px;">
                Durasi: ${p.expectedDuration || '8 Minggu'} &bull; Target Luaran: ${p.expectedOutcomes || '-'}
              </div>
              <p style="font-size:13.5px;color:var(--neutral-body);margin-bottom:12px;">${p.description}</p>

              ${p.rejectionReason ? `
                <div style="padding:10px 14px;background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;border-radius:var(--radius-sm);font-size:12.5px;margin-bottom:12px;">
                  <strong>Alasan Penolakan Admin:</strong> ${p.rejectionReason}
                </div>
              ` : ''}

              <div style="background:var(--surface-alt);padding:12px 14px;border-radius:var(--radius-sm);font-size:12.5px;margin-bottom:14px;">
                <strong>Mahasiswa Pelaksana (${assigned.length}):</strong>
                ${assigned.length ? assigned.map(s => `<div style="margin-top:4px;">&bull; <strong>${s.name}</strong> (NIM: ${s.nim}) — ${s.roleInProject}</div>`).join('') : '<div style="color:var(--neutral-muted);margin-top:4px;">Belum ada mahasiswa yang mendaftar.</div>'}
              </div>

              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button class="btn btn-secondary btn-project-detail" data-id="${p.id}">
                  ${Icons.eye(15)} Detail &amp; Milestone
                </button>
                ${p.status === 'OPEN' ? `
                  <button class="btn btn-primary btn-partner-status" data-id="${p.id}" data-status="ON_GOING">
                    Mulai Pelaksanaan (On Going)
                  </button>
                ` : ''}
                ${p.status === 'ON_GOING' ? `
                  <button class="btn btn-primary btn-partner-status" data-id="${p.id}" data-status="COMPLETED">
                    ${Icons.check(15)} Tandai Proyek Selesai (Completed)
                  </button>
                ` : ''}
                ${assigned.length > 0 ? `
                  <button class="btn btn-outline btn-partner-eval-goto" data-id="${p.id}">
                    ${Icons.star(15)} Beri Penilaian Mahasiswa
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('') : '<div class="card" style="padding:36px;text-align:center;color:var(--neutral-muted);">Belum ada pengajuan proyek.</div>'}
      </div>
    `;

    this.contentEl.innerHTML = html;
    document.getElementById('btnMyProjNew').addEventListener('click', () => this.switchTab('partner_submit'));
    this.bindProjectCardEvents();

    document.querySelectorAll('.btn-partner-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await CampusRepository.updateProject({
            id: btn.getAttribute('data-id'),
            status: btn.getAttribute('data-status')
          });
          this.showToast(res.message, 'success');
          this.render();
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    });

    document.querySelectorAll('.btn-partner-eval-goto').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab('partner_evaluations'));
    });
  }

  // Partner Module 4: Penilaian Mahasiswa (5 Evaluation Categories + Duplicate Prevention)
  renderPartnerEvaluationsView() {
    const myProjects = (CampusRepository.projects || []).filter(p => CampusRepository.isOwnProject(p));
    const myEvaluations = (CampusRepository.partnerEvaluations || []).filter(
      ev => CampusRepository.hasRole('admin') || ev.partnerId === CampusRepository.currentUser.id || myProjects.some(p => p.id === ev.projectId)
    );

    // Collect assigned students across partner's projects
    const assignablePairs = [];
    for (const proj of myProjects) {
      for (const st of (proj.assignedStudents || [])) {
        assignablePairs.push({
          projectId: proj.id,
          projectTitle: proj.title,
          studentId: st.studentId,
          studentName: st.name,
          studentNim: st.nim
        });
      }
    }

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.star(20)} Penilaian Kinerja Mahasiswa Pelaksana Proyek</h3>
          <p class="section-subtitle">Evaluasi resmi Mitra UMKM terhadap mahasiswa yang ditugaskan pada proyek Anda berdasarkan 5 kriteria penilaian standar.</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px;">
        <div class="card" style="padding:22px;margin-bottom:0;">
          <h4 style="font-size:16px;font-weight:700;margin-bottom:12px;">Formulir Evaluasi Kinerja Mahasiswa</h4>
          ${assignablePairs.length ? `
            <form id="formPartnerEvaluation">
              <div class="form-group">
                <label class="form-label">Pilih Proyek &amp; Mahasiswa Pelaksana <span style="color:var(--danger);">*</span></label>
                <select id="evalTargetPair" class="form-control" required>
                  ${assignablePairs.map(pair => `<option value="${pair.projectId}::${pair.studentId}">${pair.projectTitle} — ${pair.studentName} (NIM: ${pair.studentNim})</option>`).join('')}
                </select>
              </div>

              ${EvaluationCriteria.map(c => `
                <div class="form-group" style="margin-bottom:10px;">
                  <label class="form-label">${c.label} (Skala 1 - 5)</label>
                  <select id="eval_${c.key}" class="form-control">
                    <option value="5">5 — Sangat Baik (Istimewa)</option>
                    <option value="4">4 — Baik</option>
                    <option value="3">3 — Cukup</option>
                    <option value="2">2 — Kurang</option>
                    <option value="1">1 — Sangat Kurang</option>
                  </select>
                </div>
              `).join('')}

              <div class="form-group">
                <label class="form-label">Komentar &amp; Ulasan Tertulis Mitra UMKM <span style="color:var(--danger);">*</span></label>
                <textarea id="evalComment" class="form-control" rows="3" placeholder="Tuliskan ulasan kinerja, dampak solusi, dan kedisiplinan mahasiswa..." required></textarea>
              </div>

              <button type="submit" class="btn btn-primary btn-block">${Icons.check(15)} Kirim Penilaian Kinerja Mahasiswa</button>
            </form>
          ` : '<div style="font-size:13.5px;color:var(--neutral-muted);">Belum ada mahasiswa yang terdaftar pada proyek UMKM Anda.</div>'}
        </div>

        <div class="card" style="padding:22px;margin-bottom:0;">
          <h4 style="font-size:16px;font-weight:700;margin-bottom:12px;">Riwayat Evaluasi Terkirim (${myEvaluations.length})</h4>
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${myEvaluations.length ? myEvaluations.map(ev => `
              <div style="padding:14px;background:var(--surface-alt);border:1px solid var(--border-color);border-radius:var(--radius-sm);font-size:13px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <strong>${ev.studentName} (${ev.studentNim})</strong>
                  <span class="pill-badge pill-green">Skor: ${ev.averageScore}/5.00</span>
                </div>
                <div style="font-size:12px;color:var(--primary);font-weight:600;margin-bottom:6px;">Proyek: ${ev.projectTitle}</div>
                <div style="font-size:12px;color:var(--neutral-muted);margin-bottom:6px;">
                  Kualitas: ${ev.ratings?.workQuality}/5 &bull; Waktu: ${ev.ratings?.timeliness}/5 &bull; Komunikasi: ${ev.ratings?.communication}/5 &bull; Tanggung Jawab: ${ev.ratings?.responsibility}/5 &bull; Tujuan: ${ev.ratings?.objectiveAchievement}/5
                </div>
                <div style="font-style:italic;color:var(--neutral-body);">"${ev.comment}"</div>
              </div>
            `).join('') : '<div style="font-size:13px;color:var(--neutral-muted);">Belum ada riwayat evaluasi kinerja.</div>'}
          </div>
        </div>
      </div>
    `;

    this.contentEl.innerHTML = html;
    const evalForm = document.getElementById('formPartnerEvaluation');
    if (evalForm) {
      evalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const [projectId, studentId] = document.getElementById('evalTargetPair').value.split('::');
        const ratings = {};
        EvaluationCriteria.forEach(c => {
          ratings[c.key] = Number(document.getElementById(`eval_${c.key}`).value);
        });
        const comment = document.getElementById('evalComment').value;

        try {
          const res = await CampusRepository.submitPartnerEvaluation({ projectId, studentId, ratings, comment });
          this.showToast(res.message, 'success');
          this.render();
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    }
  }

  // =========================================================================
  // ROLE D: ADMIN / LECTURER DASHBOARD & 7 CENTRALIZED MODULES
  // =========================================================================
  renderDashboardAdmin(user) {
    const activeStudents = CampusRepository.getTotalActiveStudents();
    const totalOrgs = CampusRepository.getTotalOrganizations();
    const verifiedOrgs = CampusRepository.getVerifiedOrganizationsCount();
    const pendingOrgs = CampusRepository.getPendingOrganizationsCount();
    const totalEvents = CampusRepository.getTotalEvents();
    const publishedEvents = CampusRepository.getPublishedEvents().length;
    const totalProjects = CampusRepository.getTotalProjects();
    const pendingProjects = CampusRepository.getPendingProjectsCount();
    const ongoingProjects = CampusRepository.getOngoingProjectsCount();
    const completedProjects = CampusRepository.getCompletedProjectsCount();
    const recentLogs = (CampusRepository.auditLogs || []).slice(0, 6);

    const html = `
      ${this._welcomeHeaderHtml(
        user,
        'Admin / Dosen',
        'Otoritas manajemen terpusat Campus Impact Hub. Kelola akun mahasiswa, verifikasi dokumen SK organisasi, tinjau pengajuan proyek UMKM, kelola event kampus, dan inspeksi integritas database serta log audit.',
        `<button id="btnAdminGoStudents" class="btn btn-outline">${Icons.users(15)} Mahasiswa (${activeStudents})</button>
         <button id="btnAdminGoVerifyOrg" class="btn btn-primary">${Icons.shieldCheck(15)} Verifikasi SK Organisasi (${pendingOrgs} Pending)</button>
         <button id="btnAdminGoProjects" class="btn btn-secondary">${Icons.project(15)} Review Proyek UMKM (${pendingProjects})</button>
         <button id="btnAdminGoDb" class="btn btn-outline">${Icons.database(15)} Database &amp; Sistem</button>`
      )}

      <!-- Operational Statistics Grid (Section 3 Role D Specification) -->
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));">
        <div class="stat-card" style="cursor:pointer;" id="statAdminStudents">
          <div class="stat-icon" style="background:var(--primary-light);color:var(--primary);">${Icons.users(20)}</div>
          <div class="stat-info">
            <div class="value">${activeStudents}</div>
            <div class="label">Mahasiswa Aktif</div>
            <div class="sublabel">${CampusRepository.getStudentUsers().length} Total Akun Mahasiswa</div>
          </div>
        </div>
        <div class="stat-card" style="cursor:pointer;" id="statAdminOrgs">
          <div class="stat-icon" style="background:var(--surface-alt);color:var(--neutral-charcoal);">${Icons.organization(20)}</div>
          <div class="stat-info">
            <div class="value">${totalOrgs}</div>
            <div class="label">Organisasi Terdaftar</div>
            <div class="sublabel">${verifiedOrgs} Verified &bull; ${pendingOrgs} Pending</div>
          </div>
        </div>
        <div class="stat-card" style="cursor:pointer;" id="statAdminEvents">
          <div class="stat-icon" style="background:#F5F3FF;color:#7C3AED;">${Icons.event(20)}</div>
          <div class="stat-info">
            <div class="value">${totalEvents}</div>
            <div class="label">Event Kampus</div>
            <div class="sublabel">${publishedEvents} Event Published</div>
          </div>
        </div>
        <div class="stat-card" style="cursor:pointer;" id="statAdminProjects">
          <div class="stat-icon" style="background:var(--warning-light);color:var(--warning);">${Icons.project(20)}</div>
          <div class="stat-info">
            <div class="value">${totalProjects}</div>
            <div class="label">Proyek Sosial</div>
            <div class="sublabel">${pendingProjects} Review &bull; ${ongoingProjects} On Going &bull; ${completedProjects} Selesai</div>
          </div>
        </div>
      </div>

      <!-- Recent Administrative Activities (Audit Log Feed) -->
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.activity(20)} Aktivitas Administratif &amp; Sistem Terbaru</h3>
          <p class="section-subtitle">Jejak audit perubahan data, login, verifikasi organisasi, dan persetujuan proyek.</p>
        </div>
        <button id="btnAdminViewAllLogs" class="section-action">Lihat Semua Log ${Icons.arrowRight(13)}</button>
      </div>
      <div class="card" style="padding:18px;">
        ${recentLogs.length ? recentLogs.map(log => `
          <div style="padding:10px 0;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;font-size:13px;">
            <div>
              <span class="pill-badge pill-blue" style="margin-right:6px;">${log.action}</span>
              <strong>${log.actorName}</strong> (${log.actorRole}): ${log.details}
            </div>
            <span style="font-size:12px;color:var(--neutral-muted);">${new Date(log.createdAt).toLocaleString('id-ID')}</span>
          </div>
        `).join('') : '<div style="font-size:13px;color:var(--neutral-muted);">Belum ada catatan aktivitas.</div>'}
      </div>
    `;

    this.contentEl.innerHTML = html;
    const bind = (id, tab) => { const el = document.getElementById(id); if (el) el.addEventListener('click', () => this.switchTab(tab)); };
    bind('btnAdminGoStudents', 'admin_students');
    bind('btnAdminGoVerifyOrg', 'admin_org_verification');
    bind('btnAdminGoProjects', 'admin_projects');
    bind('btnAdminGoDb', 'admin_database');
    bind('statAdminStudents', 'admin_students');
    bind('statAdminOrgs', 'admin_org_verification');
    bind('statAdminEvents', 'admin_events');
    bind('statAdminProjects', 'admin_projects');
    const btnLogs = document.getElementById('btnAdminViewAllLogs');
    if (btnLogs) {
      btnLogs.addEventListener('click', () => {
        this.adminDbSubTab = 'logs';
        this.switchTab('admin_database');
      });
    }
  }

  // Admin Module 2: Mahasiswa (Student Management + Account Activation/Suspension)
  renderAdminStudentsView() {
    const students = CampusRepository.getStudentUsers().filter(s => {
      const q = (this.adminStudentSearch || '').toLowerCase();
      const matchSearch = !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.identityNumber && s.identityNumber.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q));
      const st = s.accountStatus || 'Active';
      const matchStatus = this.adminStudentStatusFilter === 'Semua' || st === this.adminStudentStatusFilter;
      return matchSearch && matchStatus;
    });

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.users(20)} Manajemen Mahasiswa (${students.length})</h3>
          <p class="section-subtitle">Kelola data mahasiswa, lihat riwayat registrasi &amp; portofolio, serta atur status akun (Active, Inactive, Suspended).</p>
        </div>
      </div>

      <div class="card" style="padding:16px;margin-bottom:18px;">
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;">
          <input type="text" id="inputAdminStudentSearch" class="form-control" placeholder="Cari nama mahasiswa, NIM, atau email..." value="${this.adminStudentSearch}">
          <select id="selectAdminStudentStatus" class="form-control">
            <option value="Semua" ${this.adminStudentStatusFilter === 'Semua' ? 'selected' : ''}>Semua Status Akun</option>
            <option value="Active" ${this.adminStudentStatusFilter === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${this.adminStudentStatusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
            <option value="Suspended" ${this.adminStudentStatusFilter === 'Suspended' ? 'selected' : ''}>Suspended</option>
          </select>
        </div>
      </div>

      <div class="card" style="padding:18px;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="border-bottom:2px solid var(--border-color);text-align:left;">
                <th style="padding:10px 8px;">Nama &amp; Email</th>
                <th style="padding:10px 8px;">NIM</th>
                <th style="padding:10px 8px;">Fakultas / Prodi</th>
                <th style="padding:10px 8px;">Impact / Leadership</th>
                <th style="padding:10px 8px;">Status Akun</th>
                <th style="padding:10px 8px;">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => {
                const st = s.accountStatus || 'Active';
                return `
                  <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:10px 8px;"><strong>${s.name}</strong><br><span style="font-size:12px;color:var(--neutral-muted);">${s.email}</span></td>
                    <td style="padding:10px 8px;font-family:monospace;">${s.identityNumber || '-'}</td>
                    <td style="padding:10px 8px;">${s.studyProgram || s.majorOrUnit || '-'}<br><span style="font-size:11.5px;color:var(--neutral-muted);">${s.faculty || ''}</span></td>
                    <td style="padding:10px 8px;"><strong>${s.impactScore || 0}</strong> Impact &bull; <strong>${s.leadershipScore || 0}</strong> Lead</td>
                    <td style="padding:10px 8px;">
                      <span class="pill-badge ${st === 'Active' ? 'pill-green' : (st === 'Suspended' ? 'pill-red' : 'pill-amber')}">${st}</span>
                    </td>
                    <td style="padding:10px 8px;">
                      <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button class="btn btn-secondary btn-admin-inspect-student" data-id="${s.id}" style="padding:5px 10px;font-size:11.5px;">Detail &amp; Edit</button>
                        ${st !== 'Active' ? `<button class="btn btn-primary btn-admin-user-status" data-id="${s.id}" data-status="Active" style="padding:5px 10px;font-size:11.5px;">Activate</button>` : ''}
                        ${st !== 'Inactive' ? `<button class="btn btn-outline btn-admin-user-status" data-id="${s.id}" data-status="Inactive" style="padding:5px 10px;font-size:11.5px;">Deactivate</button>` : ''}
                        ${st !== 'Suspended' ? `<button class="btn btn-outline btn-admin-user-status" data-id="${s.id}" data-status="Suspended" style="padding:5px 10px;font-size:11.5px;color:var(--danger);border-color:var(--danger);">Suspend</button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.contentEl.innerHTML = html;
    document.getElementById('inputAdminStudentSearch').addEventListener('input', (e) => {
      this.adminStudentSearch = e.target.value;
      this._reRenderPreservingFocus('inputAdminStudentSearch', this.renderAdminStudentsView);
    });
    document.getElementById('selectAdminStudentStatus').addEventListener('change', (e) => {
      this.adminStudentStatusFilter = e.target.value;
      this.renderAdminStudentsView();
    });

    document.querySelectorAll('.btn-admin-user-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await CampusRepository.adminUpdateUser({
            userId: btn.getAttribute('data-id'),
            accountStatus: btn.getAttribute('data-status')
          });
          this.showToast(res.message, 'success');
          this.render();
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    });

    document.querySelectorAll('.btn-admin-inspect-student').forEach(btn => {
      btn.addEventListener('click', () => this.showAdminStudentDetailModal(btn.getAttribute('data-id')));
    });
  }

  showAdminStudentDetailModal(studentId) {
    const s = (CampusRepository.users || []).find(u => u.id === studentId);
    if (!s) return;
    const pf = (CampusRepository.portfolioEntries || []).filter(e => e.userId === s.id);
    const evRegs = (CampusRepository.eventRegistrations || []).filter(r => r.studentId === s.id);

    const bodyHtml = `
      <form id="formAdminEditStudent">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Nama Mahasiswa</label>
            <input type="text" id="aesName" class="form-control" value="${s.name || ''}" required>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Status Akun</label>
            <select id="aesStatus" class="form-control">
              <option value="Active" ${(s.accountStatus || 'Active') === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${s.accountStatus === 'Inactive' ? 'selected' : ''}>Inactive</option>
              <option value="Suspended" ${s.accountStatus === 'Suspended' ? 'selected' : ''}>Suspended</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Fakultas</label>
            <input type="text" id="aesFaculty" class="form-control" value="${s.faculty || ''}">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Program Studi</label>
            <input type="text" id="aesProdi" class="form-control" value="${s.studyProgram || s.majorOrUnit || ''}">
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-bottom:16px;">${Icons.check(15)} Simpan Perubahan Data Mahasiswa</button>
      </form>

      <div style="font-weight:700;font-size:13.5px;margin-bottom:6px;">Riwayat Pendaftaran Event (${evRegs.length}) &amp; Portofolio (${pf.length}):</div>
      <div style="max-height:180px;overflow-y:auto;background:var(--surface-alt);padding:10px;border-radius:var(--radius-sm);font-size:12px;">
        ${pf.map(p => `<div style="margin-bottom:6px;">&bull; <strong>${p.title}</strong> (+${p.impactPoints} Impact) — ${p.credentialCode}</div>`).join('') || '<div>Belum ada catatan portofolio.</div>'}
      </div>
    `;

    this.openModal(`Detail & Edit Mahasiswa — ${s.name} (${s.identityNumber})`, bodyHtml);
    document.getElementById('formAdminEditStudent').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const prodi = document.getElementById('aesProdi').value;
        const res = await CampusRepository.adminUpdateUser({
          userId: s.id,
          name: document.getElementById('aesName').value,
          accountStatus: document.getElementById('aesStatus').value,
          faculty: document.getElementById('aesFaculty').value,
          studyProgram: prodi,
          majorOrUnit: prodi
        });
        this.showToast(res.message, 'success');
        this.closeModal();
        this.render();
      } catch (err) {
        this.showToast(err.message, 'danger');
      }
    });
  }

  // Admin Module 3: Organisasi (All Registered Organizations Management)
  renderAdminOrganizationsView() {
    const orgs = (CampusRepository.organizations || []).filter(o => {
      const q = (this.orgSearchQuery || '').toLowerCase();
      return !q || (o.name && o.name.toLowerCase().includes(q)) || (o.skNumber && o.skNumber.toLowerCase().includes(q));
    });

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.organization(20)} Manajemen Seluruh Organisasi (${orgs.length})</h3>
          <p class="section-subtitle">Daftar seluruh BEM dan UKM terdaftar beserta dokumen SK dan dosen pembinanya.</p>
        </div>
        <button id="btnAdminGoVerifyQueue" class="btn btn-primary">${Icons.shieldCheck(15)} Buka Antrean Verifikasi SK</button>
      </div>

      <div class="card" style="padding:14px;margin-bottom:18px;">
        <input type="text" id="inputAdminOrgSearch" class="form-control" placeholder="Cari nama organisasi atau nomor SK..." value="${this.orgSearchQuery}">
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;">
        ${orgs.map(org => `
          <div class="card" style="padding:20px;margin-bottom:0;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:8px;">
              <div>
                <h4 style="font-size:17px;font-weight:700;margin:0;">${org.name} — ${org.fullName}</h4>
                <div style="font-size:12.5px;color:var(--neutral-muted);">SK: ${org.skNumber} &bull; Pembina: ${org.advisorName} &bull; Ketua: ${org.chairmanName || '-'}</div>
              </div>
              <span class="pill-badge ${org.verificationStatus === 'VERIFIED' ? 'pill-green' : (org.verificationStatus === 'REJECTED' ? 'pill-red' : 'pill-amber')}">
                ${org.verificationStatus}
              </span>
            </div>
            <p style="font-size:13px;color:var(--neutral-body);margin-bottom:12px;">${org.description}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-secondary btn-admin-preview-sk" data-id="${org.id}" style="font-size:12px;">
                ${Icons.eye(14)} Inspeksi Dokumen SK (${org.skDocumentName || 'SK.pdf'})
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.contentEl.innerHTML = html;
    document.getElementById('btnAdminGoVerifyQueue').addEventListener('click', () => this.switchTab('admin_org_verification'));
    document.getElementById('inputAdminOrgSearch').addEventListener('input', (e) => {
      this.orgSearchQuery = e.target.value;
      this._reRenderPreservingFocus('inputAdminOrgSearch', this.renderAdminOrganizationsView);
    });
    document.querySelectorAll('.btn-admin-preview-sk').forEach(btn => {
      btn.addEventListener('click', () => {
        const org = (CampusRepository.organizations || []).find(o => o.id === btn.getAttribute('data-id'));
        if (org) this.showSkDocumentPreviewModal(org);
      });
    });
  }

  // Admin Module 4: Verifikasi Organisasi (Dedicated Verification Interface with SK Preview/Download & Rejection Reason)
  renderAdminOrgVerificationView() {
    const orgs = CampusRepository.organizations || [];
    const pendingOrgs = orgs.filter(o => o.verificationStatus === 'PENDING');

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.shieldCheck(20)} Verifikasi Legalitas &amp; Dokumen SK Organisasi</h3>
          <p class="section-subtitle">Periksa nomor SK, pratinjau/unduh dokumen SK yang diunggah, lalu setujui (Verified) atau tolak (Rejected) disertai alasan tertulis.</p>
        </div>
        <span class="pill-badge pill-amber">${pendingOrgs.length} Menunggu Verifikasi</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        ${orgs.map(org => `
          <div class="card" style="padding:22px;margin-bottom:0;border-left:4px solid ${org.verificationStatus === 'VERIFIED' ? 'var(--success)' : (org.verificationStatus === 'REJECTED' ? 'var(--danger)' : 'var(--warning)')};">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
              <div>
                <h4 style="font-size:18px;font-weight:700;margin:0;">${org.name} (${org.id})</h4>
                <div style="font-size:13px;color:var(--neutral-muted);">${org.fullName} &bull; Kategori: ${org.category} &bull; Tingkat: ${org.level || 'Universitas'}</div>
              </div>
              <span class="pill-badge ${org.verificationStatus === 'VERIFIED' ? 'pill-green' : (org.verificationStatus === 'REJECTED' ? 'pill-red' : 'pill-amber')}">
                Status: ${org.verificationStatus}
              </span>
            </div>

            <div style="background:var(--surface-alt);padding:12px 16px;border-radius:var(--radius-sm);font-size:13px;margin-bottom:14px;line-height:1.65;">
              <div><strong>Nomor SK:</strong> ${org.skNumber || '-'}</div>
              <div><strong>File Dokumen SK:</strong> ${org.skDocumentName || 'SK_Organisasi.pdf'} (${Math.round((org.skDocumentSize || 102400) / 1024)} KB)</div>
              <div><strong>Ketua / Penanggung Jawab:</strong> ${org.chairmanName || '-'} &bull; <strong>Dosen Pembina:</strong> ${org.advisorName || '-'}</div>
              <div><strong>Afiliasi:</strong> ${org.affiliation || '-'} &bull; <strong>Kontak:</strong> ${org.contact || '-'}</div>
              <div><strong>Deskripsi:</strong> ${org.description || '-'}</div>
              ${org.rejectionReason ? `<div style="color:var(--danger);"><strong>Alasan Penolakan Tercatat:</strong> ${org.rejectionReason}</div>` : ''}
            </div>

            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button class="btn btn-secondary btn-verify-preview-sk" data-id="${org.id}">
                ${Icons.eye(15)} Pratinjau &amp; Unduh Dokumen SK
              </button>
              ${org.verificationStatus !== 'VERIFIED' ? `
                <button class="btn btn-primary btn-verify-approve-org" data-id="${org.id}">
                  ${Icons.check(15)} Setujui Verifikasi (Approve &rarr; Verified)
                </button>
              ` : ''}
              <button class="btn btn-outline btn-verify-reject-org" data-id="${org.id}" style="border-color:var(--danger);color:var(--danger);">
                ${Icons.xCircle(15)} Tolak Pendaftaran (Reject dengan Alasan)
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.querySelectorAll('.btn-verify-preview-sk').forEach(btn => {
      btn.addEventListener('click', () => {
        const org = (CampusRepository.organizations || []).find(o => o.id === btn.getAttribute('data-id'));
        if (org) this.showSkDocumentPreviewModal(org);
      });
    });

    document.querySelectorAll('.btn-verify-approve-org').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await CampusRepository.verifyOrganization(btn.getAttribute('data-id'), 'VERIFIED', '');
          this.showToast(res.message, 'success');
          this.render();
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    });

    document.querySelectorAll('.btn-verify-reject-org').forEach(btn => {
      btn.addEventListener('click', () => {
        const orgId = btn.getAttribute('data-id');
        const org = (CampusRepository.organizations || []).find(o => o.id === orgId);
        if (!org) return;
        this.openModal(
          `Tolak Pendaftaran Organisasi — ${org.name}`,
          `<div class="form-group">
            <label class="form-label">Alasan Penolakan Verifikasi SK <span style="color:var(--danger);">*</span></label>
            <textarea id="inputRejectOrgReason" class="form-control" rows="3" placeholder="Tuliskan alasan penolakan secara jelas agar pengurus dapat memperbaiki berkas SK..." required>${org.rejectionReason || ''}</textarea>
          </div>`,
          `<button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
           <button id="btnConfirmRejectOrg" class="btn btn-primary" style="background:var(--danger);border-color:var(--danger);">Konfirmasi Penolakan</button>`
        );
        document.getElementById('btnConfirmRejectOrg').addEventListener('click', async () => {
          const reason = document.getElementById('inputRejectOrgReason').value.trim();
          if (!reason) {
            this.showToast('Alasan penolakan wajib diisi.', 'warning');
            return;
          }
          try {
            const res = await CampusRepository.verifyOrganization(org.id, 'REJECTED', reason);
            this.showToast(res.message, 'info');
            this.closeModal();
            this.render();
          } catch (err) {
            this.showToast(err.message, 'danger');
          }
        });
      });
    });
  }

  showSkDocumentPreviewModal(org) {
    const isImage = org.skDocumentType && org.skDocumentType.startsWith('image/');
    const hasData = Boolean(org.skDocumentData);

    const bodyHtml = `
      <div style="background:var(--surface-alt);padding:12px 14px;border-radius:var(--radius-sm);font-size:13px;margin-bottom:14px;">
        <div><strong>Organisasi:</strong> ${org.name} (${org.fullName})</div>
        <div><strong>Nomor SK:</strong> ${org.skNumber}</div>
        <div><strong>Nama File:</strong> ${org.skDocumentName || 'SK_Organisasi.pdf'} (${Math.round((org.skDocumentSize || 102400) / 1024)} KB)</div>
      </div>
      ${hasData && isImage ? `
        <div style="text-align:center;border:1px solid var(--border-color);padding:10px;border-radius:var(--radius-sm);">
          <img src="${org.skDocumentData}" alt="Pratinjau SK" style="max-width:100%;max-height:340px;object-fit:contain;">
        </div>
      ` : `
        <div style="border:1px solid var(--border-color);background:#0F172A;color:#E2E8F0;padding:20px;border-radius:var(--radius-sm);font-size:13px;line-height:1.6;">
          <div style="font-weight:700;color:#38BDF8;margin-bottom:8px;">${Icons.fileText(16)} DOKUMEN SURAT KEPUTUSAN (SK) RESMI</div>
          <div>Nomor Surat Keputusan: <strong>${org.skNumber}</strong></div>
          <div>Nama Organisasi: <strong>${org.fullName || org.name}</strong></div>
          <div>Ketua Penanggung Jawab: <strong>${org.chairmanName || '-'}</strong></div>
          <div>Dosen Pembina: <strong>${org.advisorName || '-'}</strong></div>
          <div>File Terlampir: <strong>${org.skDocumentName || 'SK_Resmi.pdf'}</strong></div>
        </div>
      `}
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Tutup</button>
      <button id="btnDownloadSkDoc" class="btn btn-primary">${Icons.download(15)} Unduh Dokumen SK</button>
    `;

    this.openModal(`Pratinjau Dokumen SK — ${org.name}`, bodyHtml, footerHtml);
    document.getElementById('btnDownloadSkDoc').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = org.skDocumentData || ('data:text/plain;charset=utf-8,' + encodeURIComponent(`SURAT KEPUTUSAN ORGANISASI\nNama: ${org.name}\nNomor SK: ${org.skNumber}\nPembina: ${org.advisorName}`));
      a.download = org.skDocumentName || `SK_${org.name}.pdf`;
      a.click();
      this.showToast(`Mengunduh dokumen ${a.download}`, 'info');
    });
  }

  // Admin Module 5: Event Kampus (Manage All Events & Inspect Attendance)
  renderAdminEventsView() {
    const events = CampusRepository.events || [];
    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.event(20)} Manajemen Event Kampus (${events.length})</h3>
          <p class="section-subtitle">Kelola seluruh event kampus, status publikasi, pendaftaran mahasiswa, dan catatan kehadiran manual.</p>
        </div>
        <button id="btnAdminCreateEvent" class="btn btn-primary">${Icons.plus(15)} Buat Event Kampus</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;">
        ${events.map(ev => {
          const regs = CampusRepository.getEventParticipants(ev.id);
          return `
            <div class="card" style="padding:20px;margin-bottom:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                <div style="display:flex;gap:8px;align-items:center;">
                  <span class="pill-badge pill-blue">${ev.type}</span>
                  <span class="pill-badge ${ev.publicationStatus === 'PUBLISHED' ? 'pill-green' : 'pill-amber'}">${ev.publicationStatus || 'PUBLISHED'}</span>
                </div>
                <span class="pill-badge pill-gray">${regs.filter(r => r.registrationStatus === 'Registered').length} Terdaftar &bull; ${regs.filter(r => r.attendanceStatus === 'Attended').length} Hadir</span>
              </div>
              <h4 style="font-size:17px;font-weight:700;margin-bottom:4px;">${ev.title}</h4>
              <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:8px;">
                Penyelenggara: ${ev.organizerName} &bull; ${ev.date} &bull; ${ev.location}
              </div>
              <p style="font-size:13.5px;color:var(--neutral-body);margin-bottom:14px;">${ev.description}</p>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-secondary btn-admin-edit-ev" data-id="${ev.id}">${Icons.edit(14)} Edit Event</button>
                <button class="btn btn-primary btn-admin-validate-att" data-id="${ev.id}">${Icons.users(14)} Validasi Kehadiran Manual (Nama/NIM)</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.contentEl.innerHTML = html;
    document.getElementById('btnAdminCreateEvent').addEventListener('click', () => this.showCreateEventModal());
    document.querySelectorAll('.btn-admin-edit-ev').forEach(btn => {
      btn.addEventListener('click', () => {
        const ev = (CampusRepository.events || []).find(e => e.id === btn.getAttribute('data-id'));
        if (ev) this.showCreateEventModal(ev);
      });
    });
    document.querySelectorAll('.btn-admin-validate-att').forEach(btn => {
      btn.addEventListener('click', () => this.showManualAttendanceModal(btn.getAttribute('data-id')));
    });
  }

  // Admin Module 6: Proyek Sosial (Review UMKM Submissions, Approve/Reject, Change Status)
  renderAdminProjectsView() {
    const projects = CampusRepository.projects || [];
    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.project(20)} Supervisi &amp; Persetujuan Proyek Sosial (${projects.length})</h3>
          <p class="section-subtitle">Tinjau pengajuan masalah dari Mitra UMKM, setujui agar berstatus Open bagi mahasiswa, dan pantau penyelesaian proyek.</p>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        ${projects.map(p => `
          <div class="card" style="padding:22px;margin-bottom:0;border-left:4px solid ${p.status === 'COMPLETED' ? 'var(--success)' : (['SUBMITTED', 'UNDER_REVIEW'].includes(p.status) ? 'var(--warning)' : 'var(--primary)')};">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
              <div style="display:flex;gap:8px;align-items:center;">
                <span class="pill-badge pill-blue">${p.category}</span>
                <span class="pill-badge ${p.status === 'COMPLETED' ? 'pill-green' : (p.status === 'REJECTED' ? 'pill-red' : 'pill-amber')}">Status: ${p.status}</span>
              </div>
              <span class="pill-badge pill-gray">${(p.assignedStudents || []).length} Mahasiswa Pelaksana</span>
            </div>
            <h4 style="font-size:18px;font-weight:700;margin-bottom:4px;">${p.title} (${p.id})</h4>
            <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:8px;">
              Mitra UMKM: ${p.organizationName} (${p.ownerName || '-'}) &bull; Lokasi: ${p.location}
            </div>
            <p style="font-size:13.5px;color:var(--neutral-body);margin-bottom:12px;">${p.description}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-secondary btn-project-detail" data-id="${p.id}">${Icons.eye(14)} Detail</button>
              ${['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'].includes(p.status) ? `
                <button class="btn btn-primary btn-admin-proj-status" data-id="${p.id}" data-status="OPEN">
                  ${Icons.check(14)} Setujui Proyek (Approve &rarr; Open)
                </button>
              ` : ''}
              ${p.status === 'OPEN' ? `
                <button class="btn btn-primary btn-admin-proj-status" data-id="${p.id}" data-status="ON_GOING">
                  Ubah ke On Going
                </button>
              ` : ''}
              ${p.status === 'ON_GOING' ? `
                <button class="btn btn-primary btn-admin-proj-status" data-id="${p.id}" data-status="COMPLETED">
                  ${Icons.checkCircle(14)} Selesaikan &amp; Beri Poin Mahasiswa (Completed)
                </button>
              ` : ''}
              ${p.status !== 'REJECTED' ? `
                <button class="btn btn-outline btn-admin-proj-reject" data-id="${p.id}" style="color:var(--danger);border-color:var(--danger);">
                  Tolak Pengajuan
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.contentEl.innerHTML = html;
    this.bindProjectCardEvents();

    document.querySelectorAll('.btn-admin-proj-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await CampusRepository.updateProject({
            id: btn.getAttribute('data-id'),
            status: btn.getAttribute('data-status')
          });
          this.showToast(res.message, 'success');
          this.render();
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    });

    document.querySelectorAll('.btn-admin-proj-reject').forEach(btn => {
      btn.addEventListener('click', () => {
        const projId = btn.getAttribute('data-id');
        this.openModal(
          `Tolak Pengajuan Proyek — ${projId}`,
          `<div class="form-group">
            <label class="form-label">Alasan Penolakan Proyek <span style="color:var(--danger);">*</span></label>
            <textarea id="inputRejectProjReason" class="form-control" rows="3" placeholder="Jelaskan alasan penolakan pengajuan masalah ini..." required></textarea>
          </div>`,
          `<button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
           <button id="btnConfirmRejectProj" class="btn btn-primary" style="background:var(--danger);border-color:var(--danger);">Simpan Penolakan</button>`
        );
        document.getElementById('btnConfirmRejectProj').addEventListener('click', async () => {
          const reason = document.getElementById('inputRejectProjReason').value.trim();
          if (!reason) {
            this.showToast('Alasan penolakan wajib diisi.', 'warning');
            return;
          }
          try {
            const res = await CampusRepository.updateProject({
              id: projId,
              status: 'REJECTED',
              rejectionReason: reason
            });
            this.showToast(res.message, 'info');
            this.closeModal();
            this.render();
          } catch (err) {
            this.showToast(err.message, 'danger');
          }
        });
      });
    });
  }

  // Admin Module 7: Database & Sistem (Section 10 Complete Administration Interface)
  renderAdminDatabaseAndSystemView() {
    const sub = this.adminDbSubTab || 'inspection';
    const integrity = CampusRepository.getDataIntegrityReport();
    const sysConfig = CampusRepository.systemConfig || {};
    const rows = CampusRepository.getSanitizedCollection(this.adminDbTable).filter(r => {
      const q = (this.adminDbSearch || '').toLowerCase();
      return !q || JSON.stringify(r).toLowerCase().includes(q);
    });

    const html = `
      <div class="section-header">
        <div>
          <h3 class="section-title">${Icons.database(20)} Administrasi Database &amp; Sistem Terpusat</h3>
          <p class="section-subtitle">Inspeksi tabel relasional, pemeriksaan integritas data, audit log aktivitas, konfigurasi sistem, dan ekspor data JSON / CSV (tanpa eksposur hash sandi).</p>
        </div>
        <span class="pill-badge pill-green"><span class="badge-dot"></span>${CampusRepository.dbEngine}</span>
      </div>

      <!-- Sub-Navigation Tabs -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
        <button class="btn ${sub === 'inspection' ? 'btn-primary' : 'btn-outline'} btn-db-subtab" data-sub="inspection">
          ${Icons.database(15)} A. Data Management &amp; Inspection
        </button>
        <button class="btn ${sub === 'integrity' ? 'btn-primary' : 'btn-outline'} btn-db-subtab" data-sub="integrity">
          ${Icons.shieldCheck(15)} B. Data Integrity (${integrity.issueCount} Temuan)
        </button>
        <button class="btn ${sub === 'logs' ? 'btn-primary' : 'btn-outline'} btn-db-subtab" data-sub="logs">
          ${Icons.activity(15)} C. Activity &amp; Audit Logs (${(CampusRepository.auditLogs || []).length})
        </button>
        <button class="btn ${sub === 'config' ? 'btn-primary' : 'btn-outline'} btn-db-subtab" data-sub="config">
          ${Icons.settings(15)} D. System Config &amp; Export
        </button>
      </div>

      ${sub === 'inspection' ? `
        <div class="card" style="padding:20px;">
          <div style="display:grid;grid-template-columns:1fr 1.5fr auto auto;gap:10px;margin-bottom:16px;align-items:end;">
            <div>
              <label class="form-label">Pilih Koleksi / Tabel Database</label>
              <select id="selectAdminDbTable" class="form-control">
                <option value="users" ${this.adminDbTable === 'users' ? 'selected' : ''}>Users (${(CampusRepository.users || []).length})</option>
                <option value="students" ${this.adminDbTable === 'students' ? 'selected' : ''}>Students (${CampusRepository.getStudentUsers().length})</option>
                <option value="organizations" ${this.adminDbTable === 'organizations' ? 'selected' : ''}>Organizations (${(CampusRepository.organizations || []).length})</option>
                <option value="events" ${this.adminDbTable === 'events' ? 'selected' : ''}>Events (${(CampusRepository.events || []).length})</option>
                <option value="projects" ${this.adminDbTable === 'projects' ? 'selected' : ''}>Social Projects (${(CampusRepository.projects || []).length})</option>
                <option value="event_registrations" ${this.adminDbTable === 'event_registrations' ? 'selected' : ''}>Event Registrations (${(CampusRepository.eventRegistrations || []).length})</option>
                <option value="project_registrations" ${this.adminDbTable === 'project_registrations' ? 'selected' : ''}>Project Registrations (${(CampusRepository.projectRegistrations || []).length})</option>
                <option value="evaluations" ${this.adminDbTable === 'evaluations' ? 'selected' : ''}>Partner Evaluations (${(CampusRepository.partnerEvaluations || []).length})</option>
                <option value="contributions" ${this.adminDbTable === 'contributions' ? 'selected' : ''}>Contribution Records (${(CampusRepository.portfolioEntries || []).length})</option>
              </select>
            </div>
            <div>
              <label class="form-label">Cari Record pada Tabel Ini</label>
              <input type="text" id="inputAdminDbSearch" class="form-control" placeholder="Ketik ID, nama, NIM, atau status..." value="${this.adminDbSearch}">
            </div>
            <button id="btnExportTableJson" class="btn btn-secondary">${Icons.download(14)} Export JSON</button>
            <button id="btnExportTableCsv" class="btn btn-primary">${Icons.download(14)} Export CSV</button>
          </div>

          <pre style="background:#0F172A;color:#38BDF8;padding:16px;border-radius:var(--radius-sm);font-size:12px;max-height:420px;overflow:auto;line-height:1.45;">${JSON.stringify(rows, null, 2)}</pre>
        </div>
      ` : ''}

      ${sub === 'integrity' ? `
        <div class="card" style="padding:22px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <div>
              <h4 style="font-size:16px;font-weight:700;margin:0;">Laporan Pemeriksaan Integritas Data Relasional</h4>
              <div style="font-size:12.5px;color:var(--neutral-muted);">Memeriksa duplikasi email/NIM, orphaned records, field wajib kosong, dan konsistensi foreign key.</div>
            </div>
            <span class="pill-badge ${integrity.healthy ? 'pill-green' : 'pill-red'}">
              ${integrity.healthy ? '100% Healthy (0 Masalah)' : `${integrity.issueCount} Masalah Ditemukan`}
            </span>
          </div>
          ${integrity.issues.length ? integrity.issues.map(iss => `
            <div style="padding:10px 14px;background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--radius-sm);margin-bottom:8px;font-size:13px;">
              <strong>[${iss.type}] ${iss.entity}:</strong> ${iss.detail}
            </div>
          `).join('') : `
            <div style="padding:18px;background:#ECFDF5;border:1px solid #A7F3D0;color:#065F46;border-radius:var(--radius-sm);font-size:13.5px;">
              ${Icons.checkCircle(16)} <strong>Seluruh Pemeriksaan Integritas Lulus:</strong> Tidak ada akun ganda, tidak ada NIM ganda, tidak ada orphaned record pada pendaftaran event/proyek, dan seluruh referensi relasional valid.
            </div>
          `}
        </div>
      ` : ''}

      ${sub === 'logs' ? `
        <div class="card" style="padding:20px;">
          <h4 style="font-size:16px;font-weight:700;margin-bottom:12px;">Log Aktivitas &amp; Audit Sistem (${(CampusRepository.auditLogs || []).length})</h4>
          <div style="max-height:460px;overflow-y:auto;">
            ${(CampusRepository.auditLogs || []).map(log => `
              <div style="padding:10px 0;border-bottom:1px solid var(--border-color);font-size:13px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                <div>
                  <span class="pill-badge pill-blue">${log.action}</span>
                  <strong>${log.actorName}</strong> (${log.actorRole}) &rarr; [${log.targetType}: ${log.targetId}]
                  <div style="color:var(--neutral-body);margin-top:2px;">${log.details}</div>
                </div>
                <span style="font-size:12px;color:var(--neutral-muted);">${new Date(log.createdAt).toLocaleString('id-ID')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${sub === 'config' ? `
        <div class="card" style="padding:22px;">
          <h4 style="font-size:16px;font-weight:700;margin-bottom:14px;">Konfigurasi Sistem &amp; Pemeliharaan Database</h4>
          <form id="formAdminSysConfig" style="margin-bottom:22px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
              <div class="form-group">
                <label class="form-label">Nama Aplikasi</label>
                <input type="text" id="cfgAppName" class="form-control" value="${sysConfig.appName || 'Campus Impact Hub'}">
              </div>
              <div class="form-group">
                <label class="form-label">Batas Maksimal Ukuran Upload SK (KB)</label>
                <input type="number" id="cfgMaxUpload" class="form-control" value="${sysConfig.maxUploadSizeKb || 2048}">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Format Dokumen SK yang Diizinkan</label>
              <input type="text" id="cfgFormats" class="form-control" value="${(sysConfig.allowedUploadFormats || ['PDF', 'JPG', 'JPEG', 'PNG']).join(', ')}" disabled style="background:var(--surface-alt);">
            </div>
            <button type="submit" class="btn btn-primary">${Icons.check(15)} Simpan Konfigurasi Sistem</button>
          </form>

          <div style="border-top:1px solid var(--border-color);padding-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
            <button id="btnAdminLoadDemo" class="btn btn-secondary">${Icons.sparkles(15)} Muat Ulang Data Demo (Non-Destructive Merge)</button>
            <button id="btnAdminResetDb" class="btn btn-outline" style="border-color:var(--danger);color:var(--danger);">${Icons.refresh(15)} Reset Data Operasional (Auto-Backup)</button>
          </div>
        </div>
      ` : ''}
    `;

    this.contentEl.innerHTML = html;

    document.querySelectorAll('.btn-db-subtab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.adminDbSubTab = btn.getAttribute('data-sub');
        this.renderAdminDatabaseAndSystemView();
      });
    });

    const tblSel = document.getElementById('selectAdminDbTable');
    if (tblSel) {
      tblSel.addEventListener('change', (e) => {
        this.adminDbTable = e.target.value;
        this.renderAdminDatabaseAndSystemView();
      });
    }
    const dbSearch = document.getElementById('inputAdminDbSearch');
    if (dbSearch) {
      dbSearch.addEventListener('input', (e) => {
        this.adminDbSearch = e.target.value;
        this._reRenderPreservingFocus('inputAdminDbSearch', this.renderAdminDatabaseAndSystemView);
      });
    }

    const btnExpJson = document.getElementById('btnExportTableJson');
    if (btnExpJson) {
      btnExpJson.addEventListener('click', () => {
        const content = CampusRepository.exportCollectionToJson(this.adminDbTable);
        this.triggerFileDownload(`campus_impact_${this.adminDbTable}.json`, content, 'application/json');
        this.showToast(`Tabel ${this.adminDbTable} berhasil diekspor ke JSON.`, 'success');
      });
    }

    const btnExpCsv = document.getElementById('btnExportTableCsv');
    if (btnExpCsv) {
      btnExpCsv.addEventListener('click', () => {
        const content = CampusRepository.exportCollectionToCsv(this.adminDbTable);
        this.triggerFileDownload(`campus_impact_${this.adminDbTable}.csv`, content, 'text/csv');
        this.showToast(`Tabel ${this.adminDbTable} berhasil diekspor ke CSV.`, 'success');
      });
    }

    const cfgForm = document.getElementById('formAdminSysConfig');
    if (cfgForm) {
      cfgForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const res = await CampusRepository.adminUpdateSystemConfig({
            appName: document.getElementById('cfgAppName').value,
            maxUploadSizeKb: Number(document.getElementById('cfgMaxUpload').value) || 2048
          });
          this.showToast(res.message, 'success');
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    }

    const btnDemo = document.getElementById('btnAdminLoadDemo');
    if (btnDemo) {
      btnDemo.addEventListener('click', async () => {
        try {
          await CampusRepository.loadDemoData();
          this.showToast('Data demo berhasil digabungkan secara non-destruktif.', 'success');
          this.render();
        } catch (err) {
          this.showToast(err.message, 'danger');
        }
      });
    }

    const btnReset = document.getElementById('btnAdminResetDb');
    if (btnReset) {
      btnReset.addEventListener('click', async () => {
        if (confirm('Konfirmasi pengosongan data operasional (backup otomatis akan disimpan di data/backups/)?')) {
          try {
            await CampusRepository.resetToEmptyState();
            this.showToast('Data operasional direset (Backup tersimpan).', 'info');
            this.render();
          } catch (err) {
            this.showToast(err.message, 'danger');
          }
        }
      });
    }
  }

  triggerFileDownload(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(urlObj), 1000);
  }

  // =========================================================================
  // SHARED MODALS: CREATE/EDIT EVENT, MANUAL ATTENDANCE, EDIT ACCOUNT
  // =========================================================================
  showCreateEventModal(existingEvent = null) {
    const myOrg = CampusRepository.getMyOrganization();
    const defaultOrgName = existingEvent?.organizerName || myOrg?.name || 'BEM UNIVERSITAS';

    const bodyHtml = `
      <div class="form-group">
        <label class="form-label">Judul Event Kampus <span style="color:var(--danger);">*</span></label>
        <input type="text" id="ceTitle" class="form-control" value="${existingEvent?.title || ''}" placeholder="Contoh: Seminar Nasional Inovasi Digital" required>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">Organisasi Penyelenggara</label>
          <input type="text" id="ceOrganizer" class="form-control" value="${defaultOrgName}" ${CampusRepository.hasRole('organization') ? 'disabled style="background:var(--surface-alt);"' : ''}>
        </div>
        <div class="form-group">
          <label class="form-label">Kategori Event</label>
          <select id="ceType" class="form-control">
            ${Object.values(EventType).map(t => `<option value="${t.code}" ${existingEvent?.type === t.code ? 'selected' : ''}>${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tanggal &amp; Waktu Pelaksanaan</label>
          <input type="text" id="ceDate" class="form-control" value="${existingEvent?.date || '10 Desember 2026 • 09:00 WIB'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Batas Pendaftaran</label>
          <input type="text" id="ceDeadline" class="form-control" value="${existingEvent?.registrationDeadline || '09 Desember 2026'}">
        </div>
        <div class="form-group">
          <label class="form-label">Lokasi Kegiatan</label>
          <input type="text" id="ceLocation" class="form-control" value="${existingEvent?.location || 'Auditorium Kampus Utama'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Kapasitas Peserta</label>
          <input type="number" id="ceQuota" class="form-control" value="${existingEvent?.quota || 100}" min="5">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status Publikasi</label>
        <select id="cePubStatus" class="form-control">
          <option value="PUBLISHED" ${(!existingEvent || existingEvent.publicationStatus === 'PUBLISHED') ? 'selected' : ''}>PUBLISHED (Terbuka untuk Pendaftaran Mahasiswa)</option>
          <option value="DRAFT" ${existingEvent?.publicationStatus === 'DRAFT' ? 'selected' : ''}>DRAFT (Simpan sebagai Draft)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Deskripsi Event</label>
        <textarea id="ceDesc" class="form-control" rows="3">${existingEvent?.description || ''}</textarea>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="btnSubmitCreateEvent" class="btn btn-primary">${Icons.check(15)} ${existingEvent ? 'Simpan Perubahan Event' : 'Terbitkan Event'}</button>
    `;

    this.openModal(existingEvent ? `Edit Event — ${existingEvent.id}` : 'Buat Event Kampus Baru', bodyHtml, footerHtml);

    document.getElementById('btnSubmitCreateEvent').addEventListener('click', async () => {
      try {
        const res = await CampusRepository.saveEvent({
          id: existingEvent?.id,
          title: document.getElementById('ceTitle').value,
          organizer: document.getElementById('ceOrganizer').value,
          type: document.getElementById('ceType').value,
          date: document.getElementById('ceDate').value,
          registrationDeadline: document.getElementById('ceDeadline').value,
          location: document.getElementById('ceLocation').value,
          quota: document.getElementById('ceQuota').value,
          publicationStatus: document.getElementById('cePubStatus').value,
          description: document.getElementById('ceDesc').value
        });
        this.showToast(res.message, 'success');
        this.closeModal();
        this.render();
      } catch (err) {
        this.showToast(err.message, 'danger');
      }
    });
  }

  showManualAttendanceModal(eventId) {
    const event = (CampusRepository.events || []).find(e => e.id === eventId);
    if (!event) return;
    const students = CampusRepository.getStudentUsers();
    const defaultQuery = students.length ? students[0].identityNumber : '13523001';

    const bodyHtml = `
      <div style="margin-bottom:12px;">
        <span class="pill-badge pill-blue">Validasi Kehadiran Manual (Tanpa QR)</span>
        <h4 style="font-size:17px;font-weight:800;margin:6px 0 2px 0;">${event.title}</h4>
        <div style="font-size:12.5px;color:var(--neutral-muted);">Penyelenggara: ${event.organizerName} &bull; ${event.date}</div>
      </div>

      ${students.length ? `
        <div class="form-group">
          <label class="form-label">Pilih Mahasiswa Terdaftar (Pintasan)</label>
          <select id="maStudentSelect" class="form-control">
            ${students.map(s => {
              const cleanNim = String(s.identityNumber || '').replace(/^NIM\s+/i, '');
              return `<option value="${cleanNim}">${s.name} — NIM: ${cleanNim} (${s.studyProgram || s.majorOrUnit})</option>`;
            }).join('')}
          </select>
        </div>
      ` : ''}

      <div class="form-group">
        <label class="form-label">Cari Nama Lengkap atau NIM Mahasiswa <span style="color:var(--danger);">*</span></label>
        <input type="text" id="maParticipantInput" class="form-control" value="${defaultQuery}" placeholder="Ketik Nama atau NIM (contoh: Budi Santoso atau 13523001)" required>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">Peran Kehadiran</label>
          <select id="maRoleSelect" class="form-control">
            <option value="attendee">Peserta Hadir (+${event.pointsReward || 10} Impact Score)</option>
            <option value="committee">Panitia Pelaksana (+${event.committeePointsReward || 20} Impact &amp; +20 Leadership)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status Validasi</label>
          <select id="maStatusSelect" class="form-control">
            <option value="Attended">Attended (Hadir Terverifikasi)</option>
            <option value="No Show">No Show (Tidak Hadir)</option>
          </select>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="app.closeModal()">Batal</button>
      <button id="btnConfirmManualAttendance" class="btn btn-primary">${Icons.check(15)} Simpan Validasi Kehadiran</button>
    `;

    this.openModal(`Validasi Kehadiran Manual — ${event.id}`, bodyHtml, footerHtml);

    const selectEl = document.getElementById('maStudentSelect');
    const inputEl = document.getElementById('maParticipantInput');
    if (selectEl && inputEl) {
      selectEl.addEventListener('change', () => {
        inputEl.value = selectEl.value;
      });
    }

    document.getElementById('btnConfirmManualAttendance').addEventListener('click', async () => {
      const query = document.getElementById('maParticipantInput').value.trim();
      const asCommittee = document.getElementById('maRoleSelect').value === 'committee';
      const attendanceStatus = document.getElementById('maStatusSelect').value;

      try {
        const result = await CampusRepository.validateEventAttendanceManual(event.id, {
          participantQuery: query,
          asCommittee,
          attendanceStatus
        });
        this.showToast(result.message, 'success');
        this.closeModal();
        this.render();
      } catch (err) {
        this.showToast(err.message, 'danger');
      }
    });
  }

  showEditAccountModal() {
    const user = CampusRepository.currentUser;
    if (!user) return;
    const roleMeta = UserRole[(user.role || '').toUpperCase()] || UserRole.STUDENT;

    const bodyHtml = `
      <form id="formModalProfileUpdate">
        <div class="form-group">
          <label class="form-label">Peran Akun (Read-Only)</label>
          <input type="text" class="form-control" value="${roleMeta.label} (${user.role})" disabled style="background:var(--surface-alt);">
        </div>
        <div class="form-group">
          <label class="form-label">Nama Lengkap / Lembaga</label>
          <input type="text" id="mpuName" class="form-control" value="${user.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Kontak / Telepon</label>
          <input type="text" id="mpuPhone" class="form-control" value="${user.phone || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi / Bio</label>
          <textarea id="mpuBio" class="form-control" rows="3">${user.bio || ''}</textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-block">${Icons.check(15)} Simpan Profil</button>
      </form>
    `;

    this.openModal(`Profil Akun — ${user.name}`, bodyHtml);
    document.getElementById('formModalProfileUpdate').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await CampusRepository.updateProfile({
          name: document.getElementById('mpuName').value,
          phone: document.getElementById('mpuPhone').value,
          bio: document.getElementById('mpuBio').value
        });
        this.showToast(res.message, 'success');
        this.closeModal();
        this.render();
      } catch (err) {
        this.showToast(err.message, 'danger');
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new CampusImpactHubApp();
});
