// store.js - Centralized Storage & Sync Engine for Galapitiyagama Sanasa Bank
(function() {
  const STORAGE_KEY = 'GSCS_BANK_DATA_V12';  // Bumped version → Updated product images (.jpg)
  const FIREBASE_CONFIG_KEY = 'GSCS_FIREBASE_CONFIG';
  const APPS_SCRIPT_CONFIG_KEY = 'GSCS_APPS_SCRIPT_URL';
  const GITHUB_CONFIG_KEY = 'GSCS_GITHUB_CONFIG';

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
              newsAndAnnouncements: (parsed.newsAndAnnouncements && parsed.newsAndAnnouncements.length) ? parsed.newsAndAnnouncements : window.DEFAULT_BANK_DATA.newsAndAnnouncements,
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
            // If repoData has news, use them. If repoData.newsAndAnnouncements is empty, preserve existing news or default news!
            const rawNews = (repoData.newsAndAnnouncements && repoData.newsAndAnnouncements.length)
              ? repoData.newsAndAnnouncements
              : ((this.data.newsAndAnnouncements && this.data.newsAndAnnouncements.length) ? this.data.newsAndAnnouncements : window.DEFAULT_BANK_DATA.newsAndAnnouncements);

            // Normalize news: map imageUrl -> image, ensure booleans are correct
            const normalizedNews = (rawNews || []).map(n => ({
              ...n,
              image: n.image || n.imageUrl || '',
              imageUrl: n.image || n.imageUrl || '',
              isPublished: n.isPublished !== false && n.isPublished !== 'NO',
              urgent: n.urgent === true || n.urgent === 'YES',
              badgeColor: n.badgeColor || 'bg-[#0B0D7C]',
              summary: n.summary || n.content || ''
            }));
            this.data = {
              ...this.data,
              ...repoData,
              newsAndAnnouncements: normalizedNews,
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
      const list = this.data.newsAndAnnouncements;
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
      return (window.DEFAULT_BANK_DATA && window.DEFAULT_BANK_DATA.newsAndAnnouncements) || [];
    }

    getNewsById(id) {
      return this.getNews().find(n => n.id === id);
    }

    saveNewsItem(item) {
      if (!this.data.newsAndAnnouncements) this.data.newsAndAnnouncements = [];
      if (!this.data.deletedNewsIds) this.data.deletedNewsIds = [];
      if (item && item.id) {
        this.data.deletedNewsIds = this.data.deletedNewsIds.filter(d => d !== item.id);
      }

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

      // Sync to Google Sheets cloud
      const savedItem = idx >= 0 ? this.data.newsAndAnnouncements[idx] : this.data.newsAndAnnouncements[0];
      const payloadItem = {
        ...savedItem,
        image: savedItem.image || savedItem.imageUrl || '',
        imageUrl: savedItem.image || savedItem.imageUrl || ''
      };
      this.syncToAppsScript('submit', 'news', payloadItem);
      this.triggerAutoPushToGitHub('News saved: ' + (savedItem.title || ''));
    }

    deleteNewsItem(id) {
      if (!id) return;
      if (!this.data.deletedNewsIds) this.data.deletedNewsIds = [];
      if (!this.data.deletedNewsIds.includes(id)) {
        this.data.deletedNewsIds.push(id);
      }
      this.data.newsAndAnnouncements = (this.data.newsAndAnnouncements || []).filter(n => n.id !== id);
      this.save();

      // Delete from Google Sheets cloud
      this.syncToAppsScript('delete', 'news', { id: id });
      this.triggerAutoPushToGitHub('News deleted: ' + id);
    }

    // --- Interest Rates CRUD ---
    getRates() {
      return this.data.interestRates;
    }

    updateRates(newRates) {
      this.data.interestRates = { ...this.data.interestRates, ...newRates };
      this.save();
      this.triggerAutoPushToGitHub('Rates updated');
    }

    updateFixedDepositRate(id, updatedFields) {
      const list = this.data.interestRates.fixedDeposits || [];
      const idx = list.findIndex(r => r.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updatedFields };
        this.save();
        this.triggerAutoPushToGitHub('Fixed deposit rate updated');
      }
    }

    addFixedDepositRate(item) {
      if (!this.data.interestRates.fixedDeposits) this.data.interestRates.fixedDeposits = [];
      item.id = item.id || 'fd-' + Date.now();
      this.data.interestRates.fixedDeposits.push(item);
      this.save();
      this.triggerAutoPushToGitHub('Fixed deposit rate added');
    }

    deleteFixedDepositRate(id) {
      this.data.interestRates.fixedDeposits = (this.data.interestRates.fixedDeposits || []).filter(r => r.id !== id);
      this.save();
      this.triggerAutoPushToGitHub('Fixed deposit rate deleted');
    }

    updateSavingsRate(id, updatedFields) {
      const list = this.data.interestRates.savingsAccounts || [];
      const idx = list.findIndex(r => r.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updatedFields };
        this.save();
        this.triggerAutoPushToGitHub('Savings rate updated');
      }
    }

    updateLoanRate(id, updatedFields) {
      const list = this.data.interestRates.loans || [];
      const idx = list.findIndex(r => r.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updatedFields };
        this.save();
        this.triggerAutoPushToGitHub('Loan rate updated');
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
      this.triggerAutoPushToGitHub('Product saved: ' + (prod.title || ''));
    }

    deleteProduct(id) {
      this.data.products = (this.data.products || []).filter(p => p.id !== id);
      this.save();
      this.triggerAutoPushToGitHub('Product deleted: ' + id);
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
      this.triggerAutoPushToGitHub('Hero slide saved');
    }

    deleteHeroSlide(id) {
      this.data.heroSlides = (this.data.heroSlides || []).filter(s => s.id !== id);
      this.save();
      this.triggerAutoPushToGitHub('Hero slide deleted: ' + id);
    }

    // --- Bank Info & Urgent Banner ---
    getBankInfo() {
      return this.data.bankInfo;
    }

    updateBankInfo(info) {
      this.data.bankInfo = { ...this.data.bankInfo, ...info };
      this.save();
      this.triggerAutoPushToGitHub('Bank info updated');
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

    // --- Membership, External Deposit & Child Applications ---
    normalizeApplication(app) {
      if (!app || typeof app !== 'object') return app;
      const ref = (app.refId || '').toString();

      // Check if Child Savings
      const isChild = Boolean(
        app.appType === 'CHILD_SAVINGS' ||
        app.isChildSavings ||
        ref.includes('CHD') ||
        app.childAccountType ||
        app.childFullName ||
        app.guardianFullName ||
        app.birthCertFrontImage ||
        app.birthCertBackImage
      );
      if (isChild) {
        app.appType = 'CHILD_SAVINGS';
        app.isChildSavings = true;
        if (ref.startsWith('GSCS-MEM-')) {
          app.refId = ref.replace('GSCS-MEM-', 'GSCS-CHD-');
        }
        return app;
      }

      // Check if External Deposit
      const isEda = Boolean(
        app.appType === 'EXTERNAL_DEPOSIT' ||
        app.isExternalDeposit ||
        ref.includes('EDA') ||
        app.applicant2 ||
        (app.accountType && (app.accountType.includes('ගිණුම') || app.accountType.includes('Account'))) ||
        (app.idFrontImage && !app.childFullName && !app.guardianFullName && !app.isChildSavings)
      );
      if (isEda) {
        app.appType = 'EXTERNAL_DEPOSIT';
        app.isExternalDeposit = true;
        if (ref.startsWith('GSCS-MEM-')) {
          app.refId = ref.replace('GSCS-MEM-', 'GSCS-EDA-');
        }
        return app;
      }

      // Default: Membership Application
      app.appType = 'MEMBERSHIP';
      app.isMembership = true;
      return app;
    }

    getMembershipApplications() {
      const list = this.data.membershipApplications || [];
      return list.map(a => this.normalizeApplication(a));
    }

    addMembershipApplication(app) {
      if (!this.data.membershipApplications) this.data.membershipApplications = [];
      const now = new Date();
      const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const normalized = this.normalizeApplication({ ...app });
      let prefix = 'GSCS-MEM-';
      if (normalized.appType === 'CHILD_SAVINGS') prefix = 'GSCS-CHD-';
      else if (normalized.appType === 'EXTERNAL_DEPOSIT') prefix = 'GSCS-EDA-';

      const refId = (normalized.refId && !normalized.refId.startsWith('GSCS-MEM-') && !normalized.refId.startsWith('GSCS-MA-'))
        ? normalized.refId
        : (prefix + Math.floor(100000 + Math.random() * 900000));

      const newApp = {
        ...normalized,
        id: normalized.id || ('app-' + Date.now()),
        refId: refId,
        submittedAt: normalized.submittedAt || dateStr,
        status: normalized.status || 'pending'
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

    // --- Export data.json for GitHub Pages (public content only — no private submissions) ---
    // Mobile phone visitors fetch this file to see admin-edited news, rates, products etc.
    exportDataJson() {
      const publicData = {
        bankInfo: this.data.bankInfo || {},
        newsAndAnnouncements: ((this.data.newsAndAnnouncements && this.data.newsAndAnnouncements.length) ? this.data.newsAndAnnouncements : (window.DEFAULT_BANK_DATA.newsAndAnnouncements || [])).filter(n => n && n.isPublished !== false),
        interestRates: this.data.interestRates || {},
        products: this.data.products || [],
        heroSlides: this.data.heroSlides || [],
        partners: this.data.partners || [],
        // Private submissions deliberately excluded (inquiries, applications, loanPayments, etc.)
        _exportedAt: new Date().toISOString(),
        _version: 'GSCS-DATA-V1'
      };
      const jsonStr = JSON.stringify(publicData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
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

    // --- GitHub Direct Repository Sync Engine (Auto-Push data.json) ---
    getGitHubConfig() {
      try {
        const stored = localStorage.getItem(GITHUB_CONFIG_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            owner: parsed.owner || 'gscsbank',
            repo: parsed.repo || 'gscsbank',
            branch: parsed.branch || 'main',
            token: parsed.token || '',
            autoPush: parsed.autoPush !== undefined ? Boolean(parsed.autoPush) : true
          };
        }
      } catch (e) {}
      return {
        owner: 'gscsbank',
        repo: 'gscsbank',
        branch: 'main',
        token: '',
        autoPush: true
      };
    }

    saveGitHubConfig(config) {
      if (!config) {
        localStorage.removeItem(GITHUB_CONFIG_KEY);
      } else {
        localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
      }
    }

    async pushDataJsonToGitHub(commitMsg = 'Update data.json via GSCS Bank Admin Panel') {
      const cfg = this.getGitHubConfig();
      if (!cfg || !cfg.token) {
        return { success: false, error: 'GitHub Personal Access Token (PAT) එක ඇතුළත් කර නොමැත. කරුණාකර Sync පිටුවේ Token එක save කරන්න.' };
      }

      const owner = (cfg.owner || 'gscsbank').trim();
      const repo = (cfg.repo || 'gscsbank').trim();
      const branch = (cfg.branch || 'main').trim();
      const token = cfg.token.trim();
      const path = 'data.json';

      // 1. Prepare public data JSON string
      const publicData = {
        bankInfo: this.data.bankInfo || {},
        newsAndAnnouncements: ((this.data.newsAndAnnouncements && this.data.newsAndAnnouncements.length) ? this.data.newsAndAnnouncements : (window.DEFAULT_BANK_DATA.newsAndAnnouncements || [])).filter(n => n && n.isPublished !== false),
        interestRates: this.data.interestRates || {},
        products: this.data.products || [],
        heroSlides: this.data.heroSlides || [],
        partners: this.data.partners || [],
        _exportedAt: new Date().toISOString(),
        _version: 'GSCS-DATA-V1'
      };
      const jsonStr = JSON.stringify(publicData, null, 2);

      try {
        // 2. Fetch existing file SHA if it exists
        const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}&_t=${Date.now()}`;
        let sha = null;
        try {
          const checkRes = await fetch(getUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github+json'
            }
          });
          if (checkRes.ok) {
            const fileData = await checkRes.json();
            sha = fileData.sha;
          }
        } catch (e) {
          console.warn('[Store] Could not fetch existing file SHA, will create new file:', e);
        }

        // 3. UTF-8 safe base64 encoding
        const utf8Bytes = new TextEncoder().encode(jsonStr);
        let binaryStr = '';
        for (let i = 0; i < utf8Bytes.length; i++) {
          binaryStr += String.fromCharCode(utf8Bytes[i]);
        }
        const contentBase64 = btoa(binaryStr);

        // 4. PUT request to GitHub Contents API
        const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const putPayload = {
          message: commitMsg,
          content: contentBase64,
          branch: branch
        };
        if (sha) {
          putPayload.sha = sha;
        }

        const putRes = await fetch(putUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(putPayload)
        });

        const resJson = await putRes.json().catch(() => ({}));
        if (putRes.ok) {
          console.log('[Store] GitHub direct push successful:', resJson);
          return { success: true, commit: resJson.commit };
        } else {
          console.error('[Store] GitHub push error:', resJson);
          return {
            success: false,
            error: resJson.message || `HTTP ${putRes.status}: GitHub error`
          };
        }
      } catch (err) {
        console.error('[Store] GitHub push exception:', err);
        return { success: false, error: err.message };
      }
    }

    triggerAutoPushToGitHub(reason) {
      const cfg = this.getGitHubConfig();
      if (cfg && cfg.token && cfg.autoPush) {
        if (this._githubPushTimer) clearTimeout(this._githubPushTimer);
        this._githubPushTimer = setTimeout(() => {
          this.pushDataJsonToGitHub(`Update: ${reason || 'Admin modification'}`)
            .then(res => {
              if (res.success) {
                window.dispatchEvent(new CustomEvent('githubAutoPushStatus', { detail: { success: true, reason } }));
              } else {
                window.dispatchEvent(new CustomEvent('githubAutoPushStatus', { detail: { success: false, error: res.error, reason } }));
              }
            })
            .catch(err => {
              window.dispatchEvent(new CustomEvent('githubAutoPushStatus', { detail: { success: false, error: err.message, reason } }));
            });
        }, 1500);
      }
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
          this.mergeCloudData(json.data); // mergeCloudData → save() → notify() already fires
          // DO NOT call this.notify() again here — mergeCloudData already triggers it via save()
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
      // Merge news from cloud (admin-managed content)
      if (Array.isArray(cloudData.newsAndAnnouncements)) {
        const deletedIds = this.data.deletedNewsIds || [];
        const normalizedNews = cloudData.newsAndAnnouncements
          .filter(n => n && n.id && !deletedIds.includes(String(n.id)))
          .map(n => ({
            ...n,
            image: n.image || n.imageUrl || '',
            imageUrl: n.image || n.imageUrl || '',
            isPublished: n.isPublished === 'YES' || n.isPublished === true,
            urgent: n.urgent === 'YES' || n.urgent === true,
            badgeColor: n.badgeColor || 'bg-[#0B0D7C]',
            summary: n.summary || n.content || '',
            titleEn: n.titleEn || ''
          }));

        // Preserve local edits (local properties take precedence)
        const newsMap = new Map();
        (normalizedNews || []).forEach(remote => {
          if (remote && remote.id) newsMap.set(String(remote.id), remote);
        });

        (this.data.newsAndAnnouncements || []).forEach(local => {
          if (local && local.id && !deletedIds.includes(String(local.id))) {
            const remote = newsMap.get(String(local.id));
            if (remote) {
              newsMap.set(String(local.id), {
                ...remote,
                ...local,
                image: local.image || remote.image || remote.imageUrl || '',
                imageUrl: local.image || remote.image || remote.imageUrl || '',
                summary: local.summary || remote.summary || remote.content || '',
                titleEn: local.titleEn || remote.titleEn || '',
                urgent: local.urgent !== undefined ? local.urgent : (remote.urgent || false),
                badgeColor: local.badgeColor || remote.badgeColor || 'bg-[#0B0D7C]'
              });
            } else {
              newsMap.set(String(local.id), local);
            }
          }
        });

        this.data.newsAndAnnouncements = Array.from(newsMap.values()).filter(n => !deletedIds.includes(String(n.id)));
      }

      this.save();
    }
  }

  window.bankStore = new BankStore();
})();
