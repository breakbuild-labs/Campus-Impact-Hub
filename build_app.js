const fs = require('fs');

const baseApp = fs.readFileSync('scratch_prev_app_134.js', 'utf8');

// We need to inspect where renderAuthScreen starts and ends in baseApp
const lines = baseApp.split('\n');
const startAuth = lines.findIndex(l => l.includes('renderAuthScreen() {'));
const endAuth = lines.findIndex((l, idx) => idx > startAuth && l.includes('// SCREEN 2: HOME DASHBOARD'));

console.log('startAuth:', startAuth, 'endAuth:', endAuth);

const newAuthScreen = `  // =========================================================================
  // SCREEN 1: LOGIN & 'TENTANG KAMU' (DEDICATED LANDING SCREEN)
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

    const html = \`
      <div class="auth-stage-container">
        
        <!-- Top Security Bar -->
        <div class="auth-security-topbar">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="security-dot"></span>
            <span>Sistem Informasi Terpadu &bull; Campus Impact Hub</span>
          </div>
          <div class="system-environment-badge">
            \${Icons.shield(14)}
            <span>Koneksi Aman TLS 256-Bit</span>
          </div>
        </div>

        <!-- Two-Column Grid: Left (Login/Register Form), Right ('Tentang Kamu' Card) -->
        <div class="auth-grid-two-col">
          
          <!-- Column 1: Login / Register Form Panel -->
          <div class="auth-panel-card">
            
            <!-- Brand Badge -->
            <div class="auth-brand-badge-box">
              <div class="auth-brand-icon">
                \${Icons.graduationCap(28)}
              </div>
              <div class="auth-brand-text">
                <h2>CAMPUS IMPACT HUB</h2>
                <p>Portal Masuk Sistem Akademik & Kolaborasi Kampus</p>
              </div>
            </div>

            <!-- Tab Switcher -->
            <div class="auth-tab-pills">
              <button type="button" class="auth-tab-pill \${!isRegister ? 'active' : ''}" id="btnSwitchToLogin">
                Masuk ke Akun
              </button>
              <button type="button" class="auth-tab-pill \${isRegister ? 'active' : ''}" id="btnSwitchToRegister">
                Daftar Akun Baru
              </button>
            </div>

            <!-- Form -->
            <form id="dedicatedAuthForm" class="auth-form" autocomplete="on">
              
              \${isRegister ? \`
                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label">Nama Lengkap <span style="color: var(--danger);">*</span></label>
                  <div class="auth-input-wrapper">
                    <span class="input-icon">\${Icons.user(16)}</span>
                    <input type="text" id="regNameInput" class="form-control" placeholder="Nama lengkap sesuai data akademik" required>
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label">Nomor Induk (NIM / NIP) <span style="color: var(--danger);">*</span></label>
                  <div class="auth-input-wrapper">
                    <span class="input-icon">\${Icons.shield(16)}</span>
                    <input type="text" id="regIdInput" class="form-control" placeholder="misal: 13523001" required>
                  </div>
                </div>
              \` : ''}

              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">Email Kampus / Identitas <span style="color: var(--danger);">*</span></label>
                <div class="auth-input-wrapper">
                  <span class="input-icon">\${Icons.mail(16)}</span>
                  <input 
                    type="text" 
                    id="authIdentifierInput" 
                    class="form-control" 
                    placeholder="misal: mahasiswa@kampus.ac.id atau 13523001" 
                    value="\${!isRegister ? (user.email || 'mahasiswa@kampus.ac.id') : ''}" 
                    required
                  >
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">Kata Sandi <span style="color: var(--danger);">*</span></label>
                <div class="auth-input-wrapper">
                  <span class="input-icon">\${Icons.key(16)}</span>
                  <input 
                    type="\${this.showPassword ? 'text' : 'password'}" 
                    id="authPasswordInput" 
                    class="form-control" 
                    placeholder="Masukkan kata sandi akun Anda" 
                    value="\${!isRegister ? 'password123' : ''}" 
                    required
                    minlength="6"
                  >
                  <button type="button" class="input-action-btn" id="btnToggleAuthPassword" title="Tampilkan/Sembunyikan Sandi">
                    \${this.showPassword ? Icons.eyeOff(16) : Icons.eye(16)}
                  </button>
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">Peran Pengguna (Role Kampus)</label>
                <div class="auth-input-wrapper">
                  <span class="input-icon">\${Icons.user(16)}</span>
                  <select id="authRoleSelect" class="form-select" style="padding-left: 44px; height: 46px; font-size: 14px; width: 100%; border: 1.5px solid #CBD5E1; border-radius: var(--radius-sm);">
                    <option value="student" \${user.role === 'student' ? 'selected' : ''}>Mahasiswa (Civitas Akademika)</option>
                    <option value="admin" \${user.role === 'admin' ? 'selected' : ''}>Dosen / Admin Pengelola Kampus</option>
                    <option value="organization" \${user.role === 'organization' ? 'selected' : ''}>Pengurus Organisasi / BEM / UKM</option>
                    <option value="partner" \${user.role === 'partner' ? 'selected' : ''}>Mitra Sosial & Lembaga Pengabdian</option>
                  </select>
                </div>
              </div>

              \${isRegister ? \`
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Tentang Kamu (Bio & Minat Pengabdian)</label>
                  <textarea 
                    id="regBioInput" 
                    class="form-control" 
                    rows="3" 
                    style="font-family: inherit; font-size: 13.5px; padding: 10px 12px; resize: vertical;"
                    placeholder="Ceritakan singkat tentang diri kamu, keahlian, atau komitmen kontribusimu di ekosistem kampus..."
                  ></textarea>
                </div>
              \` : \`
                <div class="form-action-row" style="margin-bottom: 14px;">
                  <label class="form-checkbox-label" style="font-size: 13px;">
                    <input type="checkbox" id="chkRememberMe" class="form-checkbox" checked>
                    <span>Ingat sesi di perangkat ini</span>
                  </label>
                  <button type="button" class="forgot-password-link" id="btnForgotPassLink" style="font-size: 13px;">
                    Lupa Sandi?
                  </button>
                </div>
              \`}

              <button type="submit" class="btn btn-primary btn-block" id="btnSubmitAuth" style="font-size: 15px; font-weight: 700; height: 48px;">
                \${isRegister ? Icons.check(18) : Icons.auth(18)}
                <span>\${isRegister ? 'Daftar Akun & Masuk ke Dashboard' : 'Masuk ke Dashboard'}</span>
              </button>

              \${!isRegister ? \`
                <!-- Demo Quick Fill Chips -->
                <div class="auth-demo-chips">
                  <div class="auth-demo-chips-title">
                    \${Icons.sparkles(13)}
                    <span>Uji Coba Cepat Akun Demo (1-Klik):</span>
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    <button type="button" class="auth-chip-btn" data-auth-demo="student">Mahasiswa</button>
                    <button type="button" class="auth-chip-btn" data-auth-demo="admin">Dosen / Admin</button>
                    <button type="button" class="auth-chip-btn" data-auth-demo="organization">Pengurus BEM</button>
                    <button type="button" class="auth-chip-btn" data-auth-demo="partner">Mitra Lembaga</button>
                  </div>
                </div>

                <div class="auth-divider" style="margin: 10px 0;">
                  <span>atau</span>
                </div>

                <button type="button" class="btn btn-sso btn-block" id="btnAuthSso" style="height: 44px; font-size: 13.5px;">
                  \${Icons.shield(16)}
                  <span>Masuk dengan SSO Kampus (Google Workspace / Dikti)</span>
                </button>
              \` : ''}

            </form>

          </div>

          <!-- Column 2: 'Tentang Kamu' (Profil Pengembang & Karakter Civitas) Panel -->
          <div class="about-you-panel">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <span class="about-you-badge">
                \${Icons.checkCircle(13)} Civitas & Pengembang Terverifikasi
              </span>
              <span style="font-size: 11.5px; font-weight: 700; color: var(--neutral-muted); letter-spacing: 0.5px;">
                PBSB KEMENAG RI
              </span>
            </div>

            <!-- Profile Header -->
            <div class="about-you-header">
              <div class="about-you-avatar">
                BS
              </div>
              <div class="about-you-meta">
                <h3>\${devProfile.name}</h3>
                <p>\${devProfile.program} &bull; NIM \${devProfile.nim}</p>
                <div style="font-size: 12px; color: var(--primary); font-weight: 700; margin-top: 2px;">
                  \${devProfile.affiliation}
                </div>
              </div>
            </div>

            <!-- Section: Tentang Kamu -->
            <div style="margin-bottom: 8px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--neutral-dark); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                \${Icons.user(15)} Tentang Kamu / Profil Civitas
              </div>
              <div class="about-you-bio-box">
                "\${devProfile.about}"
              </div>
            </div>

            <!-- Profile Specs -->
            <div class="about-you-spec-list">
              <div class="about-you-spec-item">
                <span class="label">Program Studi:</span>
                <span class="value">\${devProfile.program}</span>
              </div>
              <div class="about-you-spec-item">
                <span class="label">Status Civitas:</span>
                <span class="value" style="color: var(--success); font-weight: 700;">Mahasiswa Aktif (Santri PBSB)</span>
              </div>
              <div class="about-you-spec-item">
                <span class="label">Fokus Platform:</span>
                <span class="value">One Platform for Campus Life & Social Impact</span>
              </div>
            </div>

            <!-- Skills & Competencies -->
            <div style="margin-bottom: 16px;">
              <div style="font-size: 12.5px; font-weight: 700; color: var(--neutral-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                Keahlian & Kompetensi:
              </div>
              <div class="about-you-tag-cloud">
                <span class="about-you-tag primary">Full-Stack Web (SPA)</span>
                <span class="about-you-tag primary">UI/UX Design System</span>
                <span class="about-you-tag">Social Impact MBKM</span>
                <span class="about-you-tag">Sistem Tiket QR Deterministik</span>
                <span class="about-you-tag">Database Architecture</span>
              </div>
            </div>

            <!-- Interests & Contribution -->
            <div>
              <div style="font-size: 12.5px; font-weight: 700; color: var(--neutral-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                Minat & Pengabdian Masyarakat:
              </div>
              <div class="about-you-tag-cloud">
                <span class="about-you-tag">Pemberdayaan Santri</span>
                <span class="about-you-tag">Digitalisasi UMKM & Desa</span>
                <span class="about-you-tag">Teknologi Tepat Guna</span>
              </div>
            </div>

            <!-- Footer Motto -->
            <div style="margin-top: auto; padding-top: 18px; border-top: 1px dashed var(--border-color); font-size: 12px; color: var(--neutral-muted); line-height: 1.5; font-style: italic;">
              "\${devProfile.motto || 'Mewujudkan inovasi digital yang berdampak nyata bagi ekosistem kampus dan masyarakat.'}"
            </div>

          </div>

        </div>

      </div>
    \`;

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

        this.showToast(\`Kredensial demo \${target.name} (\${target.majorOrUnit}) berhasil dimuat. Mengalihkan ke Dashboard...\`, 'info');
        
        // Instant login and redirect to dashboard
        setTimeout(() => {
          CampusRepository.login(target.email, target.password, target.role);
          this.showToast(\`Berhasil masuk sebagai \${target.name}! Dialihkan ke Dashboard.\`, 'success');
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
          \`
            <p style="margin-bottom: 14px; color: var(--neutral-muted);">
              Masukkan email kampus Anda yang terdaftar untuk menerima instruksi pemulihan kata sandi.
            </p>
            <div class="form-group">
              <label class="form-label">Email Kampus Terdaftar</label>
              <input type="email" id="modalForgotEmail" class="form-control" value="mahasiswa@kampus.ac.id" required>
            </div>
          \`,
          \`
            <button class="btn btn-outline" id="btnCancelForgot">Batal</button>
            <button class="btn btn-primary" id="btnConfirmForgot">Kirim Tautan Reset</button>
          \`
        );
        document.getElementById('btnCancelForgot').addEventListener('click', () => this.closeModal());
        document.getElementById('btnConfirmForgot').addEventListener('click', () => {
          const email = document.getElementById('modalForgotEmail').value;
          this.closeModal();
          this.showToast(\`Tautan reset kata sandi telah dikirim ke \${email}.\`, 'success');
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
`;

const updatedLines = [
  ...lines.slice(0, startAuth),
  newAuthScreen,
  ...lines.slice(endAuth)
];

let finalCode = updatedLines.join('\n');

// Update initDOMElements to include btnHeaderLogout
finalCode = finalCode.replace(
  "this.btnCloseModal = document.getElementById('btnCloseModal');",
  "this.btnCloseModal = document.getElementById('btnCloseModal');\n    this.btnHeaderLogout = document.getElementById('btnHeaderLogout');"
);

// Update bindGlobalEvents to wire up btnHeaderLogout
finalCode = finalCode.replace(
  "if (this.sidebarUserCard) {",
  "if (this.btnHeaderLogout) {\n      this.btnHeaderLogout.addEventListener('click', () => {\n        CampusRepository.logout();\n        this.showToast('Anda telah keluar dari akun. Silakan masuk kembali.', 'info');\n        this.switchTab('auth');\n      });\n    }\n\n    if (this.sidebarUserCard) {"
);

// Update updateHeaderAndSidebar to toggle body.logged-out
finalCode = finalCode.replace(
  "updateHeaderAndSidebar() {",
  "updateHeaderAndSidebar() {\n    const isAuthMode = !CampusRepository.isLoggedIn || this.currentTab === 'auth';\n    document.body.classList.toggle('logged-out', isAuthMode);\n"
);

fs.writeFileSync('js/app.js', finalCode);
console.log('Successfully written updated js/app.js, length:', finalCode.length);
`;

fs.writeFileSync('build_app.js', script);
console.log('Wrote build_app.js');
