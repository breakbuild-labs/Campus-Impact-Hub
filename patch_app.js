const fs = require('fs');

const baseApp = fs.readFileSync('scratch_prev_app_134.js', 'utf8');
const newAuthSnippet = fs.readFileSync('render_auth_snippet.txt', 'utf8');

const lines = baseApp.split('\n');
const startAuth = lines.findIndex(l => l.includes('renderAuthScreen() {'));
const endAuth = lines.findIndex((l, idx) => idx > startAuth && l.includes('// SCREEN 2: HOME DASHBOARD'));

console.log('Replacing lines', startAuth, 'to', endAuth);

const updatedLines = [
  ...lines.slice(0, startAuth),
  newAuthSnippet,
  ...lines.slice(endAuth)
];

let finalCode = updatedLines.join('\n');

// 1. In initDOMElements(), add btnHeaderLogout
finalCode = finalCode.replace(
  "this.btnCloseModal = document.getElementById('btnCloseModal');",
  "this.btnCloseModal = document.getElementById('btnCloseModal');\n    this.btnHeaderLogout = document.getElementById('btnHeaderLogout');"
);

// 2. In bindGlobalEvents(), wire up btnHeaderLogout
finalCode = finalCode.replace(
  "if (this.sidebarUserCard) {",
  "if (this.btnHeaderLogout) {\n      this.btnHeaderLogout.addEventListener('click', () => {\n        CampusRepository.logout();\n        this.showToast('Anda telah keluar dari akun. Silakan masuk kembali.', 'info');\n        this.switchTab('auth');\n      });\n    }\n\n    if (this.sidebarUserCard) {"
);

// 3. In updateHeaderAndSidebar(), toggle body.logged-out
finalCode = finalCode.replace(
  "updateHeaderAndSidebar() {",
  "updateHeaderAndSidebar() {\n    const isAuthMode = !CampusRepository.isLoggedIn || this.currentTab === 'auth';\n    document.body.classList.toggle('logged-out', isAuthMode);\n"
);

// 4. In constructor, ensure currentTab logic:
finalCode = finalCode.replace(
  "this.currentTab = CampusRepository.isLoggedIn ? 'home' : 'auth';",
  "this.currentTab = CampusRepository.isLoggedIn ? 'home' : 'auth';\n    this.showPassword = false;"
);

// 5. In renderProfileScreen(), ensure "Tentang Kamu / Bio" section is prominently displayed
const profileBioBox = `
        <div class="card" style="margin-bottom: 24px; padding: 24px;">
          <h3 class="section-title" style="margin-bottom: 8px;">
            \${Icons.user(20)} Tentang Kamu / Bio Pengguna
          </h3>
          <p class="section-subtitle" style="margin-bottom: 14px;">Profil singkat, visi kontribusi sosial, dan rekam jejak diri Anda di ekosistem kampus.</p>
          <div style="background: var(--surface-alt); border-left: 4px solid var(--primary); padding: 16px; border-radius: var(--radius-sm); font-size: 14px; line-height: 1.6; color: var(--neutral-charcoal);">
            "\${user.bio || 'Belum ada deskripsi profil. Anda dapat memperbarui informasi diri Anda melalui formulir akun.'}"
          </div>
        </div>
`;

finalCode = finalCode.replace(
  "renderProfileScreen() {\n    const user = CampusRepository.currentUser;",
  "renderProfileScreen() {\n    const user = CampusRepository.currentUser;"
);

// Insert profileBioBox right before the account actions in profile
finalCode = finalCode.replace(
  "<div class=\"card\" style=\"padding: 24px;\">\n        <h3 class=\"section-title\"",
  profileBioBox + "\n      <div class=\"card\" style=\"padding: 24px;\">\n        <h3 class=\"section-title\""
);

fs.writeFileSync('js/app.js', finalCode);
console.log('Successfully written js/app.js, length:', finalCode.length);
