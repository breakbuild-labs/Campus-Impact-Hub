/**
 * Campus Impact Hub - Firebase Authentication Integration Module
 * Supports Firebase Modular Web SDK v11 (Google Sign-In, Email/Password, Password Reset, and Emulator)
 */

const FIREBASE_CONFIG_STORAGE_KEY = 'campus_impact_hub_firebase_config';

class FirebaseAuthServiceClass {
  constructor() {
    this.app = null;
    this.auth = null;
    this.sdkModules = null;
    this.config = this.loadLocalConfig();
    this.isInitialized = false;
    this.initError = null;
  }

  loadLocalConfig() {
    const defaultCfg = {
      apiKey: 'AIzaSyCzBystkkNofNIcM7wQb2wq6PDdn9AQXJo',
      authDomain: 'campus-impact-hub.firebaseapp.com',
      projectId: 'campus-impact-hub',
      storageBucket: 'campus-impact-hub.firebasestorage.app',
      messagingSenderId: '625449186846',
      appId: '1:625449186846:web:1f9c67b4f337e88e7da00f',
      measurementId: 'G-BRS56WQ6NW',
      useEmulator: false,
      emulatorUrl: 'http://localhost:9099'
    };
    try {
      const raw = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.apiKey) return { ...defaultCfg, ...parsed };
      }
    } catch (_) {}
    return defaultCfg;
  }

  isConfigured() {
    return Boolean(this.config && this.config.apiKey && this.config.projectId);
  }

  async syncConfigFromServer() {
    try {
      const res = await fetch('/api/firebase-config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.firebaseConfig && data.firebaseConfig.apiKey) {
          this.config = { ...this.config, ...data.firebaseConfig };
          localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(this.config));
        }
      }
    } catch (_) {}
    if (this.isConfigured()) {
      await this.initialize();
    }
  }

  async saveConfig(newConfig, authToken = '') {
    this.config = {
      apiKey: (newConfig.apiKey || '').trim(),
      authDomain: (newConfig.authDomain || '').trim() || (newConfig.projectId ? `${newConfig.projectId.trim()}.firebaseapp.com` : ''),
      projectId: (newConfig.projectId || '').trim(),
      storageBucket: (newConfig.storageBucket || '').trim() || (newConfig.projectId ? `${newConfig.projectId.trim()}.firebasestorage.app` : ''),
      messagingSenderId: (newConfig.messagingSenderId || '').trim(),
      appId: (newConfig.appId || '').trim(),
      useEmulator: Boolean(newConfig.useEmulator),
      emulatorUrl: (newConfig.emulatorUrl || 'http://localhost:9099').trim()
    };

    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(this.config));

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      await fetch('/api/firebase-config', {
        method: 'POST',
        headers,
        body: JSON.stringify({ firebaseConfig: this.config })
      });
    } catch (_) {}

    this.isInitialized = false;
    this.app = null;
    this.auth = null;

    if (this.isConfigured()) {
      await this.initialize();
    }
    return this.config;
  }

  /**
   * Parses a raw pasted firebaseConfig snippet (JSON or JS object literal)
   */
  parseConfigSnippet(snippetText) {
    const raw = (snippetText || '').trim();
    if (!raw) return null;
    const extract = (key) => {
      const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`);
      const match = raw.match(regex);
      return match ? match[1].trim() : '';
    };
    const apiKey = extract('apiKey');
    const projectId = extract('projectId');
    if (!apiKey && !projectId) return null;
    return {
      apiKey,
      authDomain: extract('authDomain') || (projectId ? `${projectId}.firebaseapp.com` : ''),
      projectId,
      storageBucket: extract('storageBucket') || (projectId ? `${projectId}.firebasestorage.app` : ''),
      messagingSenderId: extract('messagingSenderId'),
      appId: extract('appId')
    };
  }

  async loadSdk() {
    if (this.sdkModules) return this.sdkModules;
    const [appMod, authMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js')
    ]);
    this.sdkModules = { ...appMod, ...authMod };
    return this.sdkModules;
  }

  async initialize() {
    if (!this.isConfigured()) {
      this.isInitialized = false;
      return false;
    }
    if (this.isInitialized && this.auth) return true;

    try {
      const sdk = await this.loadSdk();
      const existingApps = sdk.getApps ? sdk.getApps() : [];
      for (const existing of existingApps) {
        if (sdk.deleteApp) {
          try { await sdk.deleteApp(existing); } catch (_) {}
        }
      }

      this.app = sdk.initializeApp({
        apiKey: this.config.apiKey,
        authDomain: this.config.authDomain,
        projectId: this.config.projectId,
        storageBucket: this.config.storageBucket,
        messagingSenderId: this.config.messagingSenderId,
        appId: this.config.appId
      });

      this.auth = sdk.getAuth(this.app);

      if (this.config.useEmulator && this.config.emulatorUrl) {
        sdk.connectAuthEmulator(this.auth, this.config.emulatorUrl, { disableWarnings: true });
      }

      this.isInitialized = true;
      this.initError = null;
      return true;
    } catch (err) {
      this.isInitialized = false;
      this.initError = err.message;
      throw err;
    }
  }

  async signInWithGoogle() {
    const ready = await this.initialize();
    if (!ready) {
      throw new Error('Konfigurasi Firebase Project belum diisi. Silakan masukkan Firebase Config terlebih dahulu.');
    }
    const sdk = await this.loadSdk();
    const provider = new sdk.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await sdk.signInWithPopup(this.auth, provider);
    const user = result.user;
    const idToken = await user.getIdToken();
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Pengguna Google'),
      photoURL: user.photoURL || '',
      emailVerified: Boolean(user.emailVerified),
      providerId: 'google.com',
      idToken
    };
  }

  async signInOrProvisionEmailPassword(email, password, displayName = '') {
    const ready = await this.initialize();
    if (!ready) {
      throw new Error('Konfigurasi Firebase Project belum diisi.');
    }
    const sdk = await this.loadSdk();
    try {
      const result = await sdk.signInWithEmailAndPassword(this.auth, email, password);
      const user = result.user;
      const idToken = await user.getIdToken();
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || displayName || email.split('@')[0],
        photoURL: user.photoURL || '',
        emailVerified: Boolean(user.emailVerified),
        providerId: 'password',
        idToken
      };
    } catch (signInErr) {
      // If user does not exist yet in Firebase Auth, provision the user automatically
      const code = signInErr?.code || '';
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-login-credentials'
      ) {
        return await this.registerWithEmailPassword(email, password, displayName);
      }
      throw signInErr;
    }
  }

  async signInWithEmailPassword(email, password) {
    const ready = await this.initialize();
    if (!ready) {
      throw new Error('Konfigurasi Firebase Project belum diisi.');
    }
    const sdk = await this.loadSdk();
    const result = await sdk.signInWithEmailAndPassword(this.auth, email, password);
    const user = result.user;
    const idToken = await user.getIdToken();
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || email.split('@')[0],
      photoURL: user.photoURL || '',
      emailVerified: Boolean(user.emailVerified),
      providerId: 'password',
      idToken
    };
  }

  async registerWithEmailPassword(email, password, displayName = '') {
    const ready = await this.initialize();
    if (!ready) {
      throw new Error('Konfigurasi Firebase Project belum diisi.');
    }
    const sdk = await this.loadSdk();
    const result = await sdk.createUserWithEmailAndPassword(this.auth, email, password);
    const user = result.user;
    if (displayName && sdk.updateProfile) {
      try {
        await sdk.updateProfile(user, { displayName });
      } catch (_) {}
    }
    const idToken = await user.getIdToken();
    return {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || email.split('@')[0],
      photoURL: user.photoURL || '',
      emailVerified: Boolean(user.emailVerified),
      providerId: 'password',
      idToken
    };
  }

  async sendPasswordReset(email) {
    const ready = await this.initialize();
    if (!ready) {
      throw new Error('Konfigurasi Firebase Project belum diisi.');
    }
    const sdk = await this.loadSdk();
    await sdk.sendPasswordResetEmail(this.auth, email);
    return true;
  }

  async signOut() {
    if (this.isInitialized && this.auth && this.sdkModules?.signOut) {
      try {
        await this.sdkModules.signOut(this.auth);
      } catch (_) {}
    }
  }
}

export const FirebaseAuthService = new FirebaseAuthServiceClass();
