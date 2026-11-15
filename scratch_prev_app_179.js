/**
 * Campus Impact Hub - Dedicated Authentication & Login Portal Controller
 * Professional Enterprise Edition (Emoji-free, High-Reliability)
 */

import { UserRole } from './models.js';
import { CampusRepository } from './repository.js';
import { Icons } from './icons.js';

class CampusImpactHubAuthApp {
  constructor() {
    this.mode = 'login'; // 'login' | 'register'
    this.showPassword = false;
    this.showConfirmPassword = false;

    this.initDOMElements();
    this.bindGlobalEvents();
    this.render();
  }

  initDOMElements() {
    this.containerEl = document.getElementById('authCardContainer');
    this.toastContainer = document.getElementById('toastContainer');
    this.modalBackdrop = document.getElementById('modalBackdrop');
    this.modalContainer = document.getElementById('modalContainer');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalBody = document.getElementById('modalBody');
    this.modalFooter = document.getElementById('modalFooter');
    this.btnCloseModal = document.getElementById('btnCloseModal');
  }

  bindGlobalEvents() {
    if (this.btnCloseModal && this.modalBackdrop) {
      this.btnCloseModal.addEventListener('click', () => this.hideModal());
      this.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === this.modalBackdrop) this.hideModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideModal();
    });
  }

  render() {
    if (!this.containerEl) return;

    if (CampusRepository.isLoggedIn && CampusRepository.currentUser) {
      this.renderAuthenticatedView();
    } else {
      if (this.mode === 'register') {
        this.renderRegisterView();
      } else {
        this.renderLoginView();
      }
    }
  }

  // ==========================================================================
  // Login Form Screen
  // ==========================================================================
  renderLoginView() {
    const demoAccounts = CampusRepository.getDefaultDemoAccounts();

    this.containerEl.innerHTML = `
      <div class="auth-card">
        
        <!-- Brand Header -->
        <div class="auth-brand-header">
          <div class="auth-logo-badge" title="Campus Impact Hub">
            ${Icons.graduationCap(30)}
          </div>
          <h1 class="auth-brand-title">CAMPUS IMPACT HUB</h1>
          <p class="auth-brand-subtitle">Portal Masuk Sistem Akademik & Kolaborasi Kampus</p>
        </div>

        <!-- Mode Segment Switcher -->
        <div class="auth-tabs">
          <button type="button" class="auth-tab active" id="tabLogin">Masuk ke Akun</button>
          <button type="button" class="auth-tab" id="tabRegister">Daftar Akun Baru</button>
        </div>

        <!-- Form Login -->
        <form class="auth-form" id="loginForm" autocomplete="on">
          
          <div class="form-group">
            <label class="form-label" for="loginIdentifier">
              <span>Email Kampus / NIM / NIP <span class="required-dot">*</span></span>
            </label>
            <div class="input-icon-wrapper">
              <span class="input-icon">${Icons.mail(18)}</span>
              <input 
                type="text" 
                id="loginIdentifier" 
                class="form-input" 
                placeholder="misal: mahasiswa@kampus.ac.id atau 13523001"
                required
                autocomplete="username"
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="loginPassword">
              <span>Kata Sandi <span class="required-dot">*</span></span>
            </label>
            <div class="input-icon-wrapper">
              <span class="input-icon">${Icons.key(18)}</span>
              <input 
                type="${this.showPassword ? 'text' : 'password'}" 
                id="loginPassword" 
                class="form-input" 
                placeholder="Masukkan kata sandi akun Anda"
                required
                autocomplete="current-password"
              >
              <button type="button" class="input-action-btn" id="btnTogglePassword" title="Tampilkan/Sembunyikan Sandi" aria-label="Toggle password">
                ${this.showPassword ? Icons.eyeOff(18) : Icons.eye(18)}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="loginRole">
              <span>Pilihan Peran Kampus</span>
            </label>
            <div class="input-icon-wrapper">
              <span class="input-icon">${Icons.user(18)}</span>
              <select id="loginRole" class="form-select">
                <option value="student">Mahasiswa (Civitas Akademika)</option>
                <option value="admin">Dosen / Admin Pengelola Kampus</option>
                <option value="organization">Pengurus Organisasi / BEM / UKM</option>
                <option value="partner">Mitra Sosial / Lembaga Pengabdian</option>
              </select>
            </div>
          </div>

          <div class="form-action-row">
            <label class="form-checkbox-label">
              <input type="checkbox" id="rememberMeCheckbox" class="form-checkbox" checked>
              <span>Ingat sesi masuk di perangkat ini</span>
            </label>
            <button type="button" class="forgot-password-link" id="btnForgotPassword">
              Lupa Sandi?
            </button>
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="btnSubmitLogin">
            ${Icons.auth(18)}
            <span>Masuk ke Sistem</span>
          </button>

          <!-- Fast Demo Credentials Quick Fill -->
          <div class="demo-accounts-box">
            <div class="demo-accounts-title">
              ${Icons.sparkles(14)}
              <span>Akses Cepat Pengujian Akun Demo:</span>
            </div>
            <div class="demo-chips-list">
              <button type="button" class="demo-chip" data-demo-role="student" title="Masuk sebagai Mahasiswa">
                Mahasiswa
              </button>
              <button type="button" class="demo-chip" data-demo-role="admin" title="Masuk sebagai Dosen/Admin">
                Dosen / Admin
              </button>
              <button type="button" class="demo-chip" data-demo-role="organization" title="Masuk sebagai Pengurus BEM">
                Pengurus BEM
              </button>
              <button type="button" class="demo-chip" data-demo-role="partner" title="Masuk sebagai Mitra">
                Mitra Lembaga
              </button>
            </div>
          </div>

          <div class="auth-divider">
            <span>atau</span>
          </div>

          <!-- Single Sign-On Button -->
          <button type="button" class="btn btn-sso btn-block" id="btnSsoLogin">
            ${Icons.shield(18)}
            <span>Masuk dengan SSO Kampus (Google Workspace / Dikti)</span>
          </button>

        </form>

      </div>
    `;

    this.bindLoginEvents();
  }

  bindLoginEvents() {
    // Mode Switch
    const tabRegister = document.getElementById('tabRegister');
    if (tabRegister) {
      tabRegister.addEventListener('click', () => {
        this.mode = 'register';
        this.render();
      });
    }

    // Toggle Password Visibility
    const btnTogglePassword = document.getElementById('btnTogglePassword');
    if (btnTogglePassword) {
      btnTogglePassword.addEventListener('click', () => {
        this.showPassword = !this.showPassword;
        const passInput = document.getElementById('loginPassword');
        if (passInput) {
          passInput.type = this.showPassword ? 'text' : 'password';
        }
        btnTogglePassword.innerHTML = this.showPassword ? Icons.eyeOff(18) : Icons.eye(18);
      });
    }

    // Quick Demo Chips Fill
    document.querySelectorAll('[data-demo-role]').forEach(chip => {
      chip.addEventListener('click', () => {
        const role = chip.getAttribute('data-demo-role');
        const demoAccounts = CampusRepository.getDefaultDemoAccounts();
        const target = demoAccounts.find(a => a.role === role) || demoAccounts[0];

        const idInput = document.getElementById('loginIdentifier');
        const passInput = document.getElementById('loginPassword');
        const roleSelect = document.getElementById('loginRole');

        if (idInput) idInput.value = target.email;
        if (passInput) passInput.value = target.password;
        if (roleSelect) roleSelect.value = target.role;

        this.showToast(`Akun demo ${target.name} (${target.majorOrUnit}) berhasil dimuat. Silakan klik Masuk.`, 'info');
      });
    });

    // SSO Button
    const btnSsoLogin = document.getElementById('btnSsoLogin');
    if (btnSsoLogin) {
      btnSsoLogin.addEventListener('click', () => {
        this.showToast('Menghubungkan ke Portal SSO Kampus...', 'info');
        setTimeout(() => {
          const res = CampusRepository.login('mahasiswa@kampus.ac.id', 'password123', 'student');
          if (res.success) {
            this.showToast(res.message, 'success');
            this.render();
          }
        }, 750);
      });
    }

    // Forgot Password
    const btnForgot = document.getElementById('btnForgotPassword');
    if (btnForgot) {
      btnForgot.addEventListener('click', () => this.showForgotPasswordModal());
    }

    // Form Submit
    const form = document.getElementById('loginForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const identifier = document.getElementById('loginIdentifier').value;
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;

        const submitBtn = document.getElementById('btnSubmitLogin');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span>Memverifikasi kredensial...</span>`;
        }

        setTimeout(() => {
          const result = CampusRepository.login(identifier, password, role);
          if (result.success) {
            this.showToast(result.message, 'success');
            this.render();
          } else {
            this.showToast(result.message, 'danger');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = `${Icons.auth(18)}<span>Masuk ke Sistem</span>`;
            }
          }
        }, 400);
      });
    }
  }

  // ==========================================================================
  // Register Form Screen
  // ==========================================================================
  renderRegisterView() {
    this.containerEl.innerHTML = `
      <div class="auth-card">
        
        <!-- Brand Header -->
        <div class="auth-brand-header">
          <div class="auth-logo-badge" title="Campus Impact Hub">
            ${Icons.graduationCap(30)}
          </div>
          <h1 class="auth-brand-title">CAMPUS IMPACT HUB</h1>
          <p class="auth-brand-subtitle">Registrasi Akun Baru Civitas Akademika</p>
        </div>

        <!-- Mode Segment Switcher -->
        <div class="auth-tabs">
          <button type="button" class="auth-tab" id="tabLogin">Masuk ke Akun</button>
          <button type="button" class="auth-tab active" id="tabRegister">Daftar Akun Baru</button>
        </div>

        <!-- Form Registrasi -->
        <form class="auth-form" id="registerForm" autocomplete="on">
          
          <div class="form-group">
            <label class="form-label" for="regName">
              <span>Nama Lengkap <span class="required-dot">*</span></span>
            </label>
            <div class="input-icon-wrapper">
              <span class="input-icon">${Icons.user(18)}</span>
              <input 
                type="text" 
                id="regName" 
                class="form-input" 
                placeholder="Nama lengkap sesuai data akademik"
                required
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="regEmail">
              <span>Email Institusi / Kampus <span class="required-dot">*</span></span>
            </label>
            <div class="input-icon-wrapper">
              <span class="input-icon">${Icons.mail(18)}</span>
              <input 
                type="email" 
                id="regEmail" 
                class="form-input" 
                placeholder="nama@kampus.ac.id"
                required
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="regIdentity">
              <span>Nomor Induk (NIM / NIP / NIDN) <span class="required-dot">*</span></span>
            </label>
            <div class="input-icon-wrapper">
              <span class="input-icon">${Icons.shield(18)}</span>
              <input 
                type="text" 
                id="regIdentity" 
                class="form-input" 
                placeholder="misal: 13523001"
                required
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="regRole">
              <span>Peran Civitas Akademika <span class="required-dot">*</span></span>
            </label>
            <div class="input-icon-wrapper">
              <span class="input-icon">${Icons.user(18)}</span>
              <select id="regRole" class="form-select">
                <option value="student">Mahasiswa</option>
                <option value="admin">Dosen / Tenaga Kependidikan</option>
                <option value="organization">Pengurus Organisasi / BEM / UKM</option>
                <option value="partner">Mitra Sosial & Industri</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="regPassword">
              <span>Kata Sandi Baru <span class="required-dot">*</span></span>
            </label>
            <div class="input-icon-wrapper">
              <span class="input-icon">${Icons.key(18)}</span>
              <input 
                type="${this.showPassword ? 'text' : 'password'}" 
                id="regPassword" 
                class="form-input" 
                placeholder="Minimal 6 karakter"
                required
                minlength="6"
              >
              <button type="button" class="input-action-btn" id="btnToggleRegPassword" title="Tampilkan/Sembunyikan Sandi" aria-label="Toggle password">
                ${this.showPassword ? Icons.eyeOff(18) : Icons.eye(18)}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="regConfirmPassword">
              <span>Konfirmasi Kata Sandi <span class="required-dot">*</span></span>
            </label>
            <div class="input-icon-wrapper">
              <span class="input-icon">${Icons.key(18)}</span>
              <input 
                type="password" 
                id="regConfirmPassword" 
                class="form-input" 
                placeholder="Ulangi kata sandi di atas"
                required
                minlength="6"
              >
            </div>
          </div>

          <div class="form-action-row">
            <label class="form-checkbox-label" style="align-items: flex-start; gap: 8px;">
              <input type="checkbox" id="regTermsCheckbox" class="form-checkbox" required style="margin-top: 3px;">
              <span style="font-size: 13px; line-height: 1.5;">
                Saya menyatakan data di atas akurat sesuai identitas civitas akademika kampus.
              </span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="btnSubmitRegister">
            ${Icons.check(18)}
            <span>Daftar Akun Baru</span>
          </button>

          <button type="button" class="btn btn-secondary btn-block" id="btnBackToLogin">
            <span>Sudah Memiliki Akun? Masuk di Sini</span>
          </button>

        </form>

      </div>
    `;

    this.bindRegisterEvents();
  }

  bindRegisterEvents() {
    // Switch to Login
    const tabLogin = document.getElementById('tabLogin');
    const btnBack = document.getElementById('btnBackToLogin');
    const switchToLogin = () => {
      this.mode = 'login';
      this.render();
    };

    if (tabLogin) tabLogin.addEventListener('click', switchToLogin);
    if (btnBack) btnBack.addEventListener('click', switchToLogin);

    // Toggle Password
    const btnToggleRegPassword = document.getElementById('btnToggleRegPassword');
    if (btnToggleRegPassword) {
      btnToggleRegPassword.addEventListener('click', () => {
        this.showPassword = !this.showPassword;
        const pass = document.getElementById('regPassword');
        if (pass) pass.type = this.showPassword ? 'text' : 'password';
        btnToggleRegPassword.innerHTML = this.showPassword ? Icons.eyeOff(18) : Icons.eye(18);
      });
    }

    // Submit Registration
    const form = document.getElementById('registerForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const identity = document.getElementById('regIdentity').value;
        const role = document.getElementById('regRole').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        if (password !== confirmPassword) {
          this.showToast('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.', 'danger');
          return;
        }

        const res = CampusRepository.register({
          name,
          email,
          identityNumber: identity,
          role,
          password
        });

        if (res.success) {
          this.showToast(res.message, 'success');
          this.mode = 'login';
          this.render();
          setTimeout(() => {
            const idInput = document.getElementById('loginIdentifier');
            if (idInput) idInput.value = email;
          }, 100);
        } else {
          this.showToast(res.message, 'danger');
        }
      });
    }
  }

  // ==========================================================================
  // Authenticated View (After Successful Login)
  // ==========================================================================
  renderAuthenticatedView() {
    const user = CampusRepository.currentUser;
    const roleMeta = UserRole[user.role.toUpperCase()] || UserRole.STUDENT;

    this.containerEl.innerHTML = `
      <div class="auth-card authenticated-card">
        
        <!-- Big Green Success Verification Shield -->
        <div class="auth-success-badge" title="Autentikasi Terverifikasi">
          ${Icons.shieldCheck(36)}
        </div>

        <h2 class="session-user-name">${user.name || 'Pengguna Terverifikasi'}</h2>
        <span class="session-user-role">${roleMeta.label} &bull; ${user.majorOrUnit || 'Civitas Kampus'}</span>

        <!-- Specification Summary Card -->
        <div class="profile-spec-table">
          <div class="spec-row">
            <span class="spec-label">Status Sesi Masuk:</span>
            <span class="spec-value">
              <span class="badge-verified">${Icons.checkCircle(14)} Sesi Aktif Terverifikasi</span>
            </span>
          </div>

          <div class="spec-row">
            <span class="spec-label">Nomor Induk / NIM:</span>
            <span class="spec-value">${user.identityNumber || '-'}</span>
          </div>

          <div class="spec-row">
            <span class="spec-label">Email Institusi:</span>
            <span class="spec-value">${user.email}</span>
          </div>

          <div class="spec-row">
            <span class="spec-label">Hak Akses:</span>
            <span class="spec-value">${roleMeta.badgeTitle || roleMeta.label}</span>
          </div>

          <div class="spec-row">
            <span class="spec-label">ID Token Keamanan:</span>
            <span class="spec-value" style="font-family: monospace; font-size: 12px; color: var(--primary);">
              ${CampusRepository.sessionToken || 'CIH-SEC-TOKEN-OK'}
            </span>
          </div>

          <div class="spec-row">
            <span class="spec-label">Waktu Autentikasi:</span>
            <span class="spec-value" style="font-size: 12.5px;">
              ${CampusRepository.sessionTime || new Date().toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <!-- Session Action Group -->
        <div class="session-action-group">
          <button type="button" class="btn btn-danger btn-block" id="btnLogoutSession">
            ${Icons.logOut(18)}
            <span>Keluar dari Akun (Logout)</span>
          </button>

          <button type="button" class="btn btn-secondary btn-block" id="btnSwitchAccount">
            ${Icons.refresh(16)}
            <span>Ganti Akun Lain</span>
          </button>
        </div>

      </div>
    `;

    // Logout Event
    const btnLogout = document.getElementById('btnLogoutSession');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        CampusRepository.logout();
        this.showToast('Sesi Anda telah berhasil diakhiri. Silakan masuk kembali.', 'info');
        this.mode = 'login';
        this.render();
      });
    }

    // Switch Account Event
    const btnSwitch = document.getElementById('btnSwitchAccount');
    if (btnSwitch) {
      btnSwitch.addEventListener('click', () => {
        CampusRepository.logout();
        this.mode = 'login';
        this.render();
      });
    }
  }

  // ==========================================================================
  // Forgot Password Modal
  // ==========================================================================
  showForgotPasswordModal() {
    this.modalTitle.textContent = 'Pemulihan Kata Sandi Akun';
    this.modalBody.innerHTML = `
      <p style="margin-bottom: 16px; color: var(--neutral-muted);">
        Masukkan email institusi kampus Anda yang terdaftar. Kami akan mengirimkan tautan verifikasi pemulihan kata sandi secara aman.
      </p>
      <div class="form-group">
        <label class="form-label" for="resetEmailInput">
          <span>Email Kampus Terdaftar</span>
        </label>
        <div class="input-icon-wrapper">
          <span class="input-icon">${Icons.mail(18)}</span>
          <input 
            type="email" 
            id="resetEmailInput" 
            class="form-input" 
            placeholder="misal: mahasiswa@kampus.ac.id" 
            value="mahasiswa@kampus.ac.id"
            required
          >
        </div>
      </div>
    `;

    this.modalFooter.innerHTML = `
      <button type="button" class="btn btn-secondary" id="btnCancelReset">Batal</button>
      <button type="button" class="btn btn-primary" id="btnConfirmReset">
        ${Icons.arrowRight(16)}
        <span>Kirim Tautan Reset</span>
      </button>
    `;

    this.showModal();

    document.getElementById('btnCancelReset').addEventListener('click', () => this.hideModal());
    document.getElementById('btnConfirmReset').addEventListener('click', () => {
      const email = document.getElementById('resetEmailInput').value;
      if (!email || !email.includes('@')) {
        this.showToast('Silakan masukkan format email yang valid.', 'warning');
        return;
      }
      this.hideModal();
      this.showToast(`Tautan pemulihan kata sandi berhasil dikirim ke ${email}. Silakan periksa kotak masuk email Anda.`, 'success');
    });
  }

  showModal() {
    if (this.modalBackdrop) this.modalBackdrop.classList.add('active');
  }

  hideModal() {
    if (this.modalBackdrop) this.modalBackdrop.classList.remove('active');
  }

  showToast(message, type = 'info') {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? Icons.check(18) : Icons.shield(18)}</span>
      <span class="toast-msg">${message}</span>
    `;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.CampusAuthApp = new CampusImpactHubAuthApp();
});
