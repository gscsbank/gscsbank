// store.js - Centralized Storage & Sync Engine for Galapitiyagama Sanasa Bank
(function() {
  const STORAGE_KEY = 'GSCS_BANK_DATA_V12';  // Bumped version → Updated product images (.jpg)
  const FIREBASE_CONFIG_KEY = 'GSCS_FIREBASE_CONFIG';
  const APPS_SCRIPT_CONFIG_KEY = 'GSCS_APPS_SCRIPT_URL';

  class BankStore {
    constructor() {
      this.data = this.loadData();
      this.listeners = [];
      this.firebaseInitialized = false;
      this.initFirebaseIfConfigured();
      this.loadRepoDataJson();
      if (this.getAppsScriptUrl()) {
        setTimeout(() => {
          this.fetchFromAppsScript().catch(() => {});
        }, 800);
      }
    }

    loadData() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.bankInfo) {
            // Deep-merge: keep admin edited data if available, fallback to defaults
            return {
              ...window.DEFAULT_BANK_DATA,
              ...parsed,
              products: (parsed.products && parsed.products.length) ? parsed.products : window.DEFAULT_BANK_DATA.products,
              interestRates: (parsed.interestRates && parsed.interestRates.fixedDeposits) ? parsed.interestRates : window.DEFAULT_BANK_DATA.interestRates,
              heroSlides: (parsed.heroSlides && parsed.heroSlides.length) ? parsed.heroSlides : window.DEFAULT_BANK_DATA.heroSlides,
              partners: (parsed.partners && parsed.partners.length) ? parsed.partners : window.DEFAULT_BANK_DATA.partners,
              inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
              membershipApplications: Array.isArray(parsed.membershipApplications) ? parsed.membershipApplications : [],
              loanPayments: Array.isArray(parsed.loanPayments) ? parsed.loanPayments : [],
              smartCoopApplications: Array.isArray(parsed.smartCoopApplications) ? parsed.smartCoopApplications : [],
              feedbacks: Array.isArray(parsed.feedbacks) ? parsed.feedbacks : []
            };
          }
        }
      } catch (err) {
        console.error('Failed to parse stored bank data, falling back to defaults:', err);
      }
      return JSON.parse(JSON.stringify(window.DEFAULT_BANK_DATA));
    }

    async loadRepoDataJson() {
      try {
        const res = await fetch('data.json?_t=' + Date.now());
        if (res.ok) {
          const repoData = await res.json();
          if (repoData && repoData.bankInfo) {
            console.log('[Store] Live data.json loaded from repository.');
            this.data = {
              ...this.data,
              ...repoData,
              inquiries: this.data.inquiries || repoData.inquiries || [],
              membershipApplications: this.data.membershipApplications || repoData.membershipApplications || [],
              loanPayments: this.data.loanPayments || repoData.loanPayments || [],
              smartCoopApplications: this.data.smartCoopApplications || repoData.smartCoopApplications || [],
              feedbacks: this.data.feedbacks || repoData.feedbacks || []
            };
            this.notify();
          }
        }
      } catch (err) {
        // data.json not found in root, fallback silently
      }
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.notify();
        this.syncToFirebase();
      } catch (err) {
        console.warn('LocalStorage save quota protection active:', err);
        try {
          // If quota reached, strip large base64 strings from local storage copy only (keeping in-memory and cloud intact)
          const lightweightCopy = JSON.parse(JSON.stringify(this.data));
          if (Array.isArray(lightweightCopy.loanPayments)) {
            lightweightCopy.loanPayments.forEach(p => {
              if (p.receiptImage && p.receiptImage.startsWith('data:image')) p.receiptImage = '';
            });
          }
          if (Array.isArray(lightweightCopy.membershipApplications)) {
            lightweightCopy.membershipApplications.forEach(a => {
              if (a.receiptImage && a.receiptImage.startsWith('data:image')) a.receiptImage = '';
              if (a.signatureImage && a.signatureImage.startsWith('data:image')) a.signatureImage = '';
            });
          }
          if (Array.isArray(lightweightCopy.smartCoopApplications)) {
            lightweightCopy.smartCoopApplications.forEach(s => {
              if (s.signatureImage && s.signatureImage.startsWith('data:image')) s.signatureImage = '';
            });
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightCopy));
          this.notify();
        } catch (innerErr) {
          console.error('Critical storage quota:', innerErr);
          this.notify(); // still notify UI so buttons and state continue working!
        }
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
      this.syncToAppsScript('submit', 'inquiry', newInq);
      return newInq;
    }

    updateInquiryStatus(id, status) {
      const inq = (this.data.inquiries || []).find(i => i.id === id);
      if (inq) {
        inq.status = status;
        this.save();
        this.syncToAppsScript('updateStatus', 'inquiry', { id, status });
      }
    }

    deleteInquiry(id) {
      this.data.inquiries = (this.data.inquiries || []).filter(i => i.id !== id);
      this.save();
      this.syncToAppsScript('delete', 'inquiry', { id });
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
      this.syncToAppsScript('submit', 'membership', newApp);
      return newApp;
    }

    updateMembershipApplicationStatus(id, status, notes = '') {
      const app = (this.data.membershipApplications || []).find(a => a.id === id);
      if (app) {
        app.status = status;
        if (notes) app.reviewNotes = notes;
        app.reviewedAt = new Date().toLocaleDateString();
        this.save();
        this.syncToAppsScript('updateStatus', 'membership', { id, status, notes });
      }
    }

    deleteMembershipApplication(id) {
      this.data.membershipApplications = (this.data.membershipApplications || []).filter(a => a.id !== id);
      this.save();
      this.syncToAppsScript('delete', 'membership', { id });
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
      this.syncToAppsScript('submit', 'loan_payment', newPayment);
      return newPayment;
    }

    updateLoanPaymentStatus(id, status, notes = '') {
      const p = (this.data.loanPayments || []).find(x => x.id === id);
      if (p) {
        p.status = status;
        if (notes) p.reviewNotes = notes;
        p.reviewedAt = new Date().toLocaleDateString();
        this.save();
        this.syncToAppsScript('updateStatus', 'loan_payment', { id, status, notes });
      }
    }

    deleteLoanPayment(id) {
      this.data.loanPayments = (this.data.loanPayments || []).filter(x => x.id !== id);
      this.save();
      this.syncToAppsScript('delete', 'loan_payment', { id });
    }

    // --- Member Feedback (සාමාජික ප්‍රතිපෝෂණ) ---
    getFeedbacks() {
      return this.data.feedbacks || [];
    }

    addFeedback(feedback) {
      if (!this.data.feedbacks) this.data.feedbacks = [];
      const now = new Date();
      const dateStr = now.toLocaleDateString('si-LK') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const refId = 'GSCS-FB-' + Math.floor(100000 + Math.random() * 900000);
      const newFeedback = {
        ...feedback,
        id: 'fb-' + Date.now(),
        refId: refId,
        submittedAt: dateStr,
        status: 'pending', // 'pending', 'approved', 'rejected'
        publishedAsTestimonial: false
      };
      this.data.feedbacks.unshift(newFeedback);
      this.save();
      this.syncToAppsScript('submit', 'feedback', newFeedback);
      return newFeedback;
    }

    updateFeedbackStatus(id, status, notes = '') {
      const fb = (this.data.feedbacks || []).find(f => f.id === id);
      if (fb) {
        fb.status = status;
        if (notes) fb.reviewNotes = notes;
        fb.reviewedAt = new Date().toLocaleDateString();
        this.save();
        this.syncToAppsScript('updateStatus', 'feedback', { id, status, notes });
      }
    }

    publishFeedbackAsTestimonial(id) {
      const fb = (this.data.feedbacks || []).find(f => f.id === id);
      if (fb) {
        fb.publishedAsTestimonial = true;
        fb.status = 'approved';
        this.save();
        this.syncToAppsScript('updateStatus', 'feedback', { id, status: 'approved', notes: 'Published as Testimonial' });
      }
    }

    deleteFeedback(id) {
      this.data.feedbacks = (this.data.feedbacks || []).filter(f => f.id !== id);
      this.save();
      this.syncToAppsScript('delete', 'feedback', { id });
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
      this.syncToAppsScript('submit', 'smart_coop', newApp);
      return newApp;
    }

    updateSmartCoopApplicationStatus(id, status, notes = '') {
      const a = (this.data.smartCoopApplications || []).find(x => x.id === id);
      if (a) {
        a.status = status;
        if (notes) a.reviewNotes = notes;
        a.reviewedAt = new Date().toLocaleDateString();
        this.save();
        this.syncToAppsScript('updateStatus', 'smart_coop', { id, status, notes });
      }
    }

    deleteSmartCoopApplication(id) {
      this.data.smartCoopApplications = (this.data.smartCoopApplications || []).filter(x => x.id !== id);
      this.save();
      this.syncToAppsScript('delete', 'smart_coop', { id });
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

    // --- Google Apps Script / Google Sheets Cloud Sync Engine ---
    getAppsScriptUrl() {
      if (window.GSCS_CONFIG && window.GSCS_CONFIG.APPS_SCRIPT_URL) {
        return window.GSCS_CONFIG.APPS_SCRIPT_URL.trim();
      }
      return (localStorage.getItem(APPS_SCRIPT_CONFIG_KEY) || '').trim();
    }

    saveAppsScriptUrl(url) {
      if (!url) {
        localStorage.removeItem(APPS_SCRIPT_CONFIG_KEY);
      } else {
        localStorage.setItem(APPS_SCRIPT_CONFIG_KEY, url.trim());
      }
      if (window.GSCS_CONFIG) {
        window.GSCS_CONFIG.APPS_SCRIPT_URL = url ? url.trim() : '';
      }
    }

    syncToAppsScript(action, type, data) {
      const url = this.getAppsScriptUrl();
      if (!url) {
        console.log(`[Store] Note: Apps Script URL not configured yet. Record saved locally (${type}).`);
        return Promise.resolve(null);
      }

      const payload = {
        action: action,
        type: type,
        data: data || {},
        id: data && data.id ? data.id : undefined,
        status: data && data.status ? data.status : undefined,
        notes: data && data.notes !== undefined ? data.notes : undefined
      };

      return fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).then(() => {
        console.log(`[AppsScript Sync] POST ${action} for ${type} sent successfully.`);
        return { success: true };
      }).catch(err => {
        console.warn(`[AppsScript Sync Notice] ${action} ${type}:`, err);
        return { success: false, error: err.message };
      });
    }

    async fetchFromAppsScript() {
      const url = this.getAppsScriptUrl();
      if (!url) {
        return { success: false, error: 'No Apps Script Web App URL configured.' };
      }
      try {
        const queryUrl = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'action=getAll&_t=' + Date.now();
        const res = await fetch(queryUrl);
        const json = await res.json();
        if (json && json.status === 'success' && json.data) {
          this.mergeCloudData(json.data);
          this.notify();
          return { success: true, data: json.data };
        } else {
          return { success: false, error: json.message || 'Invalid server response' };
        }
      } catch (err) {
        console.warn('[AppsScript Fetch Notice]', err);
        return { success: false, error: err.message };
      }
    }

    mergeCloudData(cloudData) {
      if (!cloudData) return;

      const mergeList = (localList = [], remoteList = []) => {
        const map = new Map();
        const refMap = new Map();

        // 1. Index local items so pending offline entries and uploaded images are preserved
        (localList || []).forEach(item => {
          if (!item) return;
          const kId = item.id ? String(item.id) : '';
          const kRef = item.refId ? String(item.refId) : '';
          if (kId) map.set(kId, item);
          if (kRef) refMap.set(kRef, item);
        });

        // 2. Merge remote items: if matched, merge remote properties; if new, add it
        (remoteList || []).forEach(remoteItem => {
          if (!remoteItem) return;
          const kId = remoteItem.id ? String(remoteItem.id) : '';
          const kRef = remoteItem.refId ? String(remoteItem.refId) : '';

          let existing = (kId && map.get(kId)) || (kRef && refMap.get(kRef));
          if (existing) {
            Object.assign(existing, remoteItem, {
              receiptImage: remoteItem.receiptImage || existing.receiptImage || '',
              signatureImage: remoteItem.signatureImage || existing.signatureImage || ''
            });
          } else {
            const key = kId || kRef || ('item-' + Math.random());
            map.set(key, remoteItem);
          }
        });

        return Array.from(map.values());
      };

      if (Array.isArray(cloudData.inquiries)) {
        this.data.inquiries = mergeList(this.data.inquiries, cloudData.inquiries);
      }
      if (Array.isArray(cloudData.loanPayments)) {
        this.data.loanPayments = mergeList(this.data.loanPayments, cloudData.loanPayments);
      }
      if (Array.isArray(cloudData.membershipApplications)) {
        this.data.membershipApplications = mergeList(this.data.membershipApplications, cloudData.membershipApplications);
      }
      if (Array.isArray(cloudData.smartCoopApplications)) {
        this.data.smartCoopApplications = mergeList(this.data.smartCoopApplications, cloudData.smartCoopApplications);
      }
      if (Array.isArray(cloudData.feedbacks)) {
        this.data.feedbacks = mergeList(this.data.feedbacks, cloudData.feedbacks);
      }

      this.save();
    }
  }

  window.bankStore = new BankStore();
})();
