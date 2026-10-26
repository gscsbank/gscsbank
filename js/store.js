// store.js - Centralized Storage & Sync Engine for Galapitiyagama Sanasa Bank
(function() {
  const STORAGE_KEY = 'GSCS_BANK_DATA_V12';  // Bumped version → Updated product images (.jpg)
  const FIREBASE_CONFIG_KEY = 'GSCS_FIREBASE_CONFIG';

  class BankStore {
    constructor() {
      this.data = this.loadData();
      this.listeners = [];
      this.firebaseInitialized = false;
      this.initFirebaseIfConfigured();
    }

    loadData() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.bankInfo) {
            // Deep-merge: keep default products, rates and members intact unless admin edited
            return {
              ...window.DEFAULT_BANK_DATA,
              ...parsed,
              products: window.DEFAULT_BANK_DATA.products,           // always use fresh products
              interestRates: window.DEFAULT_BANK_DATA.interestRates, // always use fresh rates
              heroSlides: window.DEFAULT_BANK_DATA.heroSlides,       // always use fresh slides
              partners: window.DEFAULT_BANK_DATA.partners            // always use fresh partners
            };
          }
        }
      } catch (err) {
        console.error('Failed to parse stored bank data, falling back to defaults:', err);
      }
      return JSON.parse(JSON.stringify(window.DEFAULT_BANK_DATA));
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.notify();
        this.syncToFirebase();
      } catch (err) {
        console.error('Failed to save bank data to localStorage:', err);
      }
    }

    notify() {
      this.listeners.forEach(cb => {
        try { cb(this.data); } catch(e) { console.error(e); }
      });
      window.dispatchEvent(new CustomEvent('bankDataUpdated', { detail: this.data }));
    }

    subscribe(callback) {
      this.listeners.push(callback);
      return () => {
        this.listeners = this.listeners.filter(l => l !== callback);
      };
    }

    getData() {
      return this.data;
    }

    // --- News & Announcements CRUD ---
    getNews() {
      return this.data.newsAndAnnouncements || [];
    }

    getNewsById(id) {
      return this.getNews().find(n => n.id === id);
    }

    saveNewsItem(item) {
      if (!this.data.newsAndAnnouncements) this.data.newsAndAnnouncements = [];
      const idx = this.data.newsAndAnnouncements.findIndex(n => n.id === item.id);
      if (idx >= 0) {
        this.data.newsAndAnnouncements[idx] = { ...this.data.newsAndAnnouncements[idx], ...item };
      } else {
        const newItem = {
          ...item,
          id: item.id || 'news-' + Date.now(),
          date: item.date || new Date().toISOString().split('T')[0]
        };
        this.data.newsAndAnnouncements.unshift(newItem);
      }
      this.save();
    }

    deleteNewsItem(id) {
      this.data.newsAndAnnouncements = (this.data.newsAndAnnouncements || []).filter(n => n.id !== id);
      this.save();
    }

    // --- Interest Rates CRUD ---
    getRates() {
      return this.data.interestRates;
    }

    updateRates(newRates) {
      this.data.interestRates = { ...this.data.interestRates, ...newRates };
      this.save();
    }

    updateFixedDepositRate(id, updatedFields) {
      const list = this.data.interestRates.fixedDeposits || [];
      const idx = list.findIndex(r => r.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updatedFields };
        this.save();
      }
    }

    addFixedDepositRate(item) {
      if (!this.data.interestRates.fixedDeposits) this.data.interestRates.fixedDeposits = [];
      item.id = item.id || 'fd-' + Date.now();
      this.data.interestRates.fixedDeposits.push(item);
      this.save();
    }

    deleteFixedDepositRate(id) {
      this.data.interestRates.fixedDeposits = (this.data.interestRates.fixedDeposits || []).filter(r => r.id !== id);
      this.save();
    }

    updateSavingsRate(id, updatedFields) {
      const list = this.data.interestRates.savingsAccounts || [];
      const idx = list.findIndex(r => r.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updatedFields };
        this.save();
      }
    }

    updateLoanRate(id, updatedFields) {
      const list = this.data.interestRates.loans || [];
      const idx = list.findIndex(r => r.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updatedFields };
        this.save();
      }
    }

    // --- Products & Services CRUD ---
    getProducts() {
      return this.data.products || [];
    }

    saveProduct(prod) {
      if (!this.data.products) this.data.products = [];
      const idx = this.data.products.findIndex(p => p.id === prod.id);
      if (idx >= 0) {
        this.data.products[idx] = { ...this.data.products[idx], ...prod };
      } else {
        prod.id = prod.id || 'prod-' + Date.now();
        this.data.products.push(prod);
      }
      this.save();
    }

    deleteProduct(id) {
      this.data.products = (this.data.products || []).filter(p => p.id !== id);
      this.save();
    }

    // --- Hero Slides CRUD ---
    getHeroSlides() {
      return this.data.heroSlides || [];
    }

    saveHeroSlide(slide) {
      if (!this.data.heroSlides) this.data.heroSlides = [];
      const idx = this.data.heroSlides.findIndex(s => s.id === slide.id);
      if (idx >= 0) {
        this.data.heroSlides[idx] = { ...this.data.heroSlides[idx], ...slide };
      } else {
        slide.id = slide.id || 'slide-' + Date.now();
        this.data.heroSlides.push(slide);
      }
      this.save();
    }

    deleteHeroSlide(id) {
      this.data.heroSlides = (this.data.heroSlides || []).filter(s => s.id !== id);
      this.save();
    }

    // --- Bank Info & Urgent Banner ---
    getBankInfo() {
      return this.data.bankInfo;
    }

    updateBankInfo(info) {
      this.data.bankInfo = { ...this.data.bankInfo, ...info };
      this.save();
    }

    // --- Inquiries ---
    getInquiries() {
      return this.data.inquiries || [];
    }

    addInquiry(inquiry) {
      if (!this.data.inquiries) this.data.inquiries = [];
      const now = new Date();
      const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newInq = {
        ...inquiry,
        id: 'inq-' + Date.now(),
        date: dateStr,
        status: 'pending'
      };
      this.data.inquiries.unshift(newInq);
      this.save();
      return newInq;
    }

    updateInquiryStatus(id, status) {
      const inq = (this.data.inquiries || []).find(i => i.id === id);
      if (inq) {
        inq.status = status;
        this.save();
      }
    }

    deleteInquiry(id) {
      this.data.inquiries = (this.data.inquiries || []).filter(i => i.id !== id);
      this.save();
    }

    // --- Membership Applications ---
    getMembershipApplications() {
      return this.data.membershipApplications || [];
    }

    addMembershipApplication(app) {
      if (!this.data.membershipApplications) this.data.membershipApplications = [];
      const now = new Date();
      const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const refId = 'GSCS-MEM-' + Math.floor(100000 + Math.random() * 900000);
      const newApp = {
        ...app,
        id: 'mem-' + Date.now(),
        refId: refId,
        submittedAt: dateStr,
        status: 'pending' // 'pending', 'approved', 'rejected'
      };
      this.data.membershipApplications.unshift(newApp);
      this.save();
      return newApp;
    }

    updateMembershipApplicationStatus(id, status, notes = '') {
      const app = (this.data.membershipApplications || []).find(a => a.id === id);
      if (app) {
        app.status = status;
        if (notes) app.reviewNotes = notes;
        app.reviewedAt = new Date().toLocaleDateString();
        this.save();
      }
    }

    deleteMembershipApplication(id) {
      this.data.membershipApplications = (this.data.membershipApplications || []).filter(a => a.id !== id);
      this.save();
    }

    // --- Loan Installment Payments ---
    getLoanPayments() {
      return this.data.loanPayments || [];
    }

    addLoanPayment(payment) {
      if (!this.data.loanPayments) this.data.loanPayments = [];
      const now = new Date();
      const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const refId = 'GSCS-LP-' + Math.floor(100000 + Math.random() * 900000);
      const newPayment = {
        ...payment,
        id: 'lp-' + Date.now(),
        refId: refId,
        submittedAt: dateStr,
        status: 'pending' // 'pending', 'confirmed', 'rejected'
      };
      this.data.loanPayments.unshift(newPayment);
      this.save();
      return newPayment;
    }

    updateLoanPaymentStatus(id, status, notes = '') {
      const p = (this.data.loanPayments || []).find(x => x.id === id);
      if (p) {
        p.status = status;
        if (notes) p.reviewNotes = notes;
        p.reviewedAt = new Date().toLocaleDateString();
        this.save();
      }
    }

    deleteLoanPayment(id) {
      this.data.loanPayments = (this.data.loanPayments || []).filter(x => x.id !== id);
      this.save();
    }

    // --- Smart COOP App Registration Applications ---
    getSmartCoopApplications() {
      return this.data.smartCoopApplications || [];
    }

    addSmartCoopApplication(app) {
      if (!this.data.smartCoopApplications) this.data.smartCoopApplications = [];
      const now = new Date();
      const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const refId = 'GSCS-MAA-' + Math.floor(100 + Math.random() * 900);
      const newApp = {
        ...app,
        id: 'sc-' + Date.now(),
        refId: refId,
        submittedAt: dateStr,
        status: 'pending' // 'pending', 'activated', 'rejected'
      };
      this.data.smartCoopApplications.unshift(newApp);
      this.save();
      return newApp;
    }

    updateSmartCoopApplicationStatus(id, status, notes = '') {
      const a = (this.data.smartCoopApplications || []).find(x => x.id === id);
      if (a) {
        a.status = status;
        if (notes) a.reviewNotes = notes;
        a.reviewedAt = new Date().toLocaleDateString();
        this.save();
      }
    }

    deleteSmartCoopApplication(id) {
      this.data.smartCoopApplications = (this.data.smartCoopApplications || []).filter(x => x.id !== id);
      this.save();
    }

    // --- JSON Backup & Restore ---
    exportJSON() {
      const jsonStr = JSON.stringify(this.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GSCS-Bank-Data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    importJSON(jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.bankInfo && parsed.interestRates) {
          this.data = parsed;
          this.save();
          return { success: true };
        } else {
          return { success: false, error: 'Invalid JSON format: missing required bank structure' };
        }
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    resetToDefaults() {
      this.data = JSON.parse(JSON.stringify(window.DEFAULT_BANK_DATA));
      this.save();
    }

    // --- Optional Firebase Firestore Realtime Sync ---
    getFirebaseConfig() {
      try {
        const cfg = localStorage.getItem(FIREBASE_CONFIG_KEY);
        return cfg ? JSON.parse(cfg) : null;
      } catch { return null; }
    }

    saveFirebaseConfig(config) {
      if (!config) {
        localStorage.removeItem(FIREBASE_CONFIG_KEY);
      } else {
        localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
      }
      this.initFirebaseIfConfigured();
    }

    initFirebaseIfConfigured() {
      const config = this.getFirebaseConfig();
      if (!config || !window.firebase) return;
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(config);
        }
        this.db = firebase.firestore();
        this.firebaseInitialized = true;

        // Listen for live updates from Firestore
        this.db.collection('gscs_bank').doc('live_data').onSnapshot((doc) => {
          if (doc.exists) {
            const remoteData = doc.data();
            if (remoteData && remoteData.updatedAt) {
              // Compare and update if remote is newer
              const localUpdated = this.data._updatedAt || 0;
              if (remoteData.updatedAt > localUpdated) {
                console.log('Syncing data from Firebase cloud...');
                this.data = { ...this.data, ...remoteData };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
                this.notify();
              }
            }
          }
        }, err => console.log('Firebase listen notice:', err.message));
      } catch (e) {
        console.warn('Firebase init status:', e.message);
      }
    }

    syncToFirebase() {
      if (!this.firebaseInitialized || !this.db) return;
      try {
        this.data._updatedAt = Date.now();
        this.db.collection('gscs_bank').doc('live_data').set(this.data, { merge: true })
          .catch(e => console.warn('Firebase push note:', e.message));
      } catch (e) {
        console.warn('Firebase sync note:', e.message);
      }
    }
  }

  window.bankStore = new BankStore();
})();
