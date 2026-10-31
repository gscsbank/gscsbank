// admin.js - Management Controller for Galapitiyagama Sanasa Bank

// --- Tab Titles Definition (Global) ---
const tabTitles = {
  overview: 'දළ විශ්ලේෂණය (Overview)',
  news: 'පුවත් සහ නිවේදන කළමනාකරණය (News & Notices)',
  services: 'බැංකු සේවා හා නිෂ්පාදන (Products & Services)',
  rates: 'දෛනික පොලී අනුපාත (Interest Rates Board)',
  sliders: 'ප්‍රධාන බැනර් පාලනය (Hero Banners)',
  bankinfo: 'බැංකු තොරතුරු සහ විශේෂ නිවේදන (Bank Profile & Alert)',
  inquiries: 'පාරිභෝගික විමසීම් ලිපිගොනුව (Inquiries Inbox)',
  applications: 'සාමාජික සහ බාහිර තැන්පත් අයදුම්පත් (Member & Deposit Applications)',
  loanpayments: 'ණය සහ ඉතුරුම් තැන්පතු ගෙවීම් (Loan & Savings Payments)',
  smartcoop: 'Smart COOP යෙදුම් අයදුම්පත් (Smart COOP Applications)',
  sync: 'GitHub Pages දත්ත සමමුහුර්තකරණය (Data Persistence)',
  feedbacks: 'සාමාජික ප්‍රතිපෝෂණ කළමනාකරණය (Member Feedback)'
};

// Safe String & Utility Helpers (Prevents any crash if numbers or nulls appear)
function safeStr(val) {
  if (val === null || val === undefined) return '';
  return String(val);
}

function safeNum(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? fallback : n;
}

function cleanPhoneNum(val) {
  return safeStr(val).replace(/[^0-9]/g, '');
}

function makeWaUrl(phone, msg) {
  const c = cleanPhoneNum(phone);
  if (!c) return '#';
  const num = c.startsWith('0') ? c.slice(1) : c;
  return `https://wa.me/94${num}?text=${encodeURIComponent(msg || '')}`;
}

let currentTab = 'overview';

// --- Tab Switcher (Defined Immediately on window so it is ALWAYS available) ---
window.switchAdminTab = function(tabId) {
  if (!tabId) return;
  currentTab = tabId;

  // 1. Update sidebar button highlights
  const allButtons = document.querySelectorAll('.admin-tab-btn');
  allButtons.forEach(btn => {
    const btnTab = btn.getAttribute('data-tab') || '';
    const onclickAttr = btn.getAttribute('onclick') || '';
    const isMatch = (btnTab === tabId) || onclickAttr.includes(`'${tabId}'`) || onclickAttr.includes(`"${tabId}"`);
    if (isMatch) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    }
  });

  // 2. Hide all panels, show the target panel
  const allPanels = document.querySelectorAll('.admin-panel');
  allPanels.forEach(panel => {
    panel.classList.add('hidden');
    panel.style.display = 'none';
  });

  const targetPanel = document.getElementById('panel-' + tabId);
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    targetPanel.style.display = 'block';
  }

  // 3. Update header title
  const titleEl = document.getElementById('current-tab-title');
  if (titleEl) {
    titleEl.textContent = tabTitles[tabId] || 'Admin';
  }

  // 4. Scroll smoothly to top of main area
  const mainArea = document.querySelector('main');
  if (mainArea) {
    mainArea.scrollTop = 0;
  }
};

// Global click event delegation: guarantees clicks anywhere on .admin-tab-btn switch tabs
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.admin-tab-btn');
  if (btn) {
    const tab = btn.getAttribute('data-tab');
    if (tab) {
      window.switchAdminTab(tab);
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const AUTH_KEY = 'GSCS_ADMIN_LOGGED_IN';
  let inquiryFilter = 'all';
  let currentAppFilter = 'all';
  let currentLpFilter = 'all';
  let currentScFilter = 'all';
  let currentFbFilter = 'all';

  function checkAuth() {
    const isLoggedIn = sessionStorage.getItem(AUTH_KEY) === 'true';
    const loginView = document.getElementById('admin-login-view');
    const appView = document.getElementById('admin-app-view');

    if (isLoggedIn) {
      if (loginView) loginView.classList.add('hidden');
      if (appView) appView.classList.remove('hidden');
      initDashboard();
    } else {
      if (loginView) loginView.classList.remove('hidden');
      if (appView) appView.classList.add('hidden');
    }
  }

  function setupAuthForm() {
    const form = document.getElementById('admin-login-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('admin-user').value.trim();
        const p = document.getElementById('admin-pass').value.trim();

        if ((u === 'admin' || u === 'gscs') && (p === 'sanasa123' || p === '1987')) {
          sessionStorage.setItem(AUTH_KEY, 'true');
          checkAuth();
        } else {
          alert('වලංගු නොවන පරිශීලක නාමයක් හෝ මුරපදයකි! (Invalid Username or Password)\nDefault: admin / sanasa123');
        }
      });
    }
  }

  window.adminLogout = () => {
    if (confirm('ඔබට පද්ධතියෙන් ඉවත්වීමට (Logout) අවශ්‍ය බව තහවුරු කරන්න?')) {
      sessionStorage.removeItem(AUTH_KEY);
      checkAuth();
    }
  };

  // --- Initializer ---
  function initDashboard() {
    try { renderOverview(); } catch(e) { console.error('Error in renderOverview:', e); }
    try { renderNewsTable(); } catch(e) { console.error('Error in renderNewsTable:', e); }
    try { renderProductsList(); } catch(e) { console.error('Error in renderProductsList:', e); }
    try { renderRatesEditor(); } catch(e) { console.error('Error in renderRatesEditor:', e); }
    try { renderSlidersEditor(); } catch(e) { console.error('Error in renderSlidersEditor:', e); }
    try { renderBankInfoForm(); } catch(e) { console.error('Error in renderBankInfoForm:', e); }
    try { renderInquiriesTable(); } catch(e) { console.error('Error in renderInquiriesTable:', e); }
    try { renderApplicationsTable(); } catch(e) { console.error('Error in renderApplicationsTable:', e); }
    try { renderLoanPaymentsTable(); } catch(e) { console.error('Error in renderLoanPaymentsTable:', e); }
    try { renderSmartCoopTable(); } catch(e) { console.error('Error in renderSmartCoopTable:', e); }
    try { renderFeedbackTable(); } catch(e) { console.error('Error in renderFeedbackTable:', e); }
    try { setupForms(); } catch(e) { console.error('Error in setupForms:', e); }

    // Set initial active tab state
    window.switchAdminTab(currentTab || 'overview');

    // Populate Apps Script URL input if present
    const appScriptInput = document.getElementById('appscript-url-input');
    if (appScriptInput && window.bankStore.getAppsScriptUrl) {
      appScriptInput.value = window.bankStore.getAppsScriptUrl();
    }
    if (window.bankStore.getAppsScriptUrl && window.bankStore.getAppsScriptUrl()) {
      if (typeof window.syncFromCloud === 'function') {
        window.syncFromCloud(false).catch(err => console.warn('Cloud sync on init:', err));
      }
      if (!window._cloudSyncTimer) {
        window._cloudSyncTimer = setInterval(() => {
          if (document.visibilityState === 'visible' && typeof window.syncFromCloud === 'function') {
            window.syncFromCloud(false).catch(err => console.warn('Interval sync error:', err));
          }
        }, 60000); // 60s auto-sync
      }
    }

    // Listen to changes (Same Window)
    window.addEventListener('bankDataUpdated', () => {
      try { renderOverview(); } catch(e) {}
      try { renderNewsTable(); } catch(e) {}
      try { renderProductsList(); } catch(e) {}
      try { renderInquiriesTable(); } catch(e) {}
      try { renderApplicationsTable(); } catch(e) {}
      try { renderLoanPaymentsTable(); } catch(e) {}
      try { renderSmartCoopTable(); } catch(e) {}
      try { renderFeedbackTable(); } catch(e) {}
    });

    // Cross-tab Instant Sync: when website (index.html) submits in another tab
    window.addEventListener('storage', (e) => {
      if (e.key === 'GSCS_BANK_DATA_V12') {
        // Re-render directly from current in-memory store (safe — no loadData() risk)
        try { renderOverview(); } catch(e) {}
        try { renderInquiriesTable(); } catch(e) {}
        try { renderApplicationsTable(); } catch(e) {}
        try { renderLoanPaymentsTable(); } catch(e) {}
        try { renderSmartCoopTable(); } catch(e) {}
        try { renderFeedbackTable(); } catch(e) {}
      }
    });
  }

  // --- 1. Overview ---
  function renderOverview() {
    try {
      const data = window.bankStore.getData();
      const news = window.bankStore.getNews();
      const prods = window.bankStore.getProducts();
      const inqs = window.bankStore.getInquiries();
      const apps = window.bankStore.getMembershipApplications ? window.bankStore.getMembershipApplications() : [];
      const feedbacks = window.bankStore.getFeedbacks ? window.bankStore.getFeedbacks() : [];
      const info = window.bankStore.getBankInfo();

      const newsCountEl = document.getElementById('ov-news-count');
      const prodCountEl = document.getElementById('ov-services-count');
      const inqCountEl = document.getElementById('ov-inq-count');
      if (newsCountEl) newsCountEl.textContent = news.length;
      if (prodCountEl) prodCountEl.textContent = prods.length;
      if (inqCountEl) inqCountEl.textContent = inqs.length;

      // Feedback count
      const ovFbCountEl = document.getElementById('ov-fb-count');
      const ovFbPendingEl = document.getElementById('ov-fb-pending');
      const fbBadgeEl = document.getElementById('sidebar-fb-badge');
      const pendingFbs = feedbacks.filter(f => safeStr(f.status) === 'pending');
      if (ovFbCountEl) ovFbCountEl.textContent = feedbacks.length;
      if (ovFbPendingEl) ovFbPendingEl.textContent = `${pendingFbs.length}ක් පොරොත්තු ලේඛනයේ`;
      if (fbBadgeEl) fbBadgeEl.textContent = pendingFbs.length;

      const appsCountEl = document.getElementById('ov-apps-count');
      const appsPendingEl = document.getElementById('ov-apps-pending');
      const appsBadgeEl = document.getElementById('sidebar-apps-badge');
      const pendingApps = apps.filter(a => safeStr(a.status) === 'pending');
      if (appsCountEl) appsCountEl.textContent = apps.length;
      if (appsPendingEl) appsPendingEl.textContent = `${pendingApps.length}ක් පොරොත්තු ලේඛනයේ`;
      if (appsBadgeEl) appsBadgeEl.textContent = pendingApps.length;

      const pendingInqs = inqs.filter(i => safeStr(i.status) === 'pending');
      const badgeEl = document.getElementById('sidebar-inq-badge');
      if (badgeEl) badgeEl.textContent = pendingInqs.length;

      // Urgent notice
      const ovUrgentBadge = document.getElementById('ov-urgent-badge');
      const ovUrgentText = document.getElementById('ov-urgent-text');
      if (info.urgentNoticeActive) {
        if (ovUrgentBadge) {
          ovUrgentBadge.textContent = 'ACTIVE';
          ovUrgentBadge.className = 'px-2 py-0.5 rounded text-[10px] font-black bg-pink-500 text-white';
        }
      } else {
        if (ovUrgentBadge) {
          ovUrgentBadge.textContent = 'INACTIVE';
          ovUrgentBadge.className = 'px-2 py-0.5 rounded text-[10px] font-black bg-slate-600 text-slate-300';
        }
      }
      if (ovUrgentText) ovUrgentText.textContent = info.urgentNotice || 'කිසිදු විශේෂ නිවේදනයක් ක්‍රියාත්මක නැත.';

      // Recent Inquiries Table (first 4)
      const recentBody = document.getElementById('ov-recent-inquiries');
      if (recentBody) {
        recentBody.innerHTML = inqs.slice(0, 4).map(i => {
          const st = safeStr(i.status || 'pending').toLowerCase();
          return `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="py-2.5 px-3 font-bold text-slate-800">${safeStr(i.name)}</td>
              <td class="py-2.5 px-3 text-slate-600">${safeStr(i.phone)}</td>
              <td class="py-2.5 px-3 text-slate-600">${safeStr(i.service)}</td>
              <td class="py-2.5 px-3 text-slate-400 text-[11px]">${safeStr(i.date)}</td>
              <td class="py-2.5 px-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${st === 'replied' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                  ${st.toUpperCase()}
                </span>
              </td>
            </tr>
          `;
        }).join('');
        if (inqs.length === 0) {
          recentBody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-slate-400">කිසිදු විමසීමක් මෙතෙක් ලැබී නැත.</td></tr>';
        }
      }
    } catch (err) {
      console.error('Error in renderOverview:', err);
    }
  }

  // --- 2. News CRUD ---
  function renderNewsTable() {
    const news = window.bankStore.getNews();
    const tbody = document.getElementById('admin-news-table-body');
    if (!tbody) return;

    tbody.innerHTML = news.map(n => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4">
          <img src="${n.image}" alt="thumb" class="w-12 h-10 object-cover rounded-lg border border-slate-200">
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900 max-w-xs truncate">${n.title}</div>
          <div class="text-[11px] text-slate-400 line-clamp-1">${n.summary}</div>
        </td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-1 rounded-full text-[11px] font-bold text-white ${n.badgeColor || 'bg-[#0B0D7C]'}">
            ${n.category}
          </span>
        </td>
        <td class="py-3 px-4 text-slate-500">${n.date}</td>
        <td class="py-3 px-4">
          ${n.urgent ? '<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-600 text-white">URGENT</span>' : '<span class="text-slate-400">-</span>'}
        </td>
        <td class="py-3 px-4 text-right whitespace-nowrap space-x-2">
          <button onclick="window.editNewsItem('${n.id}')" class="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="Edit">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="window.deleteNewsItemConfirm('${n.id}')" class="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  window.openNewsEditor = (item = null) => {
    const modal = document.getElementById('modal-news-editor');
    const form = document.getElementById('news-editor-form');
    form.reset();

    if (item) {
      document.getElementById('news-editor-title').textContent = 'පුවත සංස්කරණය (Edit Article)';
      document.getElementById('edit-news-id').value = item.id;
      document.getElementById('edit-news-title').value = item.title || '';
      document.getElementById('edit-news-title-en').value = item.titleEn || '';
      document.getElementById('edit-news-category').value = item.category || 'Notice';
      document.getElementById('edit-news-date').value = item.date || new Date().toISOString().split('T')[0];
      document.getElementById('edit-news-image').value = item.image || '';
      document.getElementById('edit-news-summary').value = item.summary || '';
      document.getElementById('edit-news-content').value = item.content || '';
      document.getElementById('edit-news-urgent').checked = !!item.urgent;
    } else {
      document.getElementById('news-editor-title').textContent = 'නව පුවතක් හෝ නිවේදනයක් පළ කිරීම';
      document.getElementById('edit-news-id').value = '';
      document.getElementById('edit-news-date').value = new Date().toISOString().split('T')[0];
      document.getElementById('edit-news-image').value = 'assets/images/wix/d7b655_8b90b4687fad497bb55da48a880da264~mv2.png';
    }

    modal.classList.remove('hidden');
  };

  window.closeNewsEditor = () => {
    document.getElementById('modal-news-editor').classList.add('hidden');
  };

  window.editNewsItem = (id) => {
    const item = window.bankStore.getNewsById(id);
    if (item) window.openNewsEditor(item);
  };

  window.deleteNewsItemConfirm = (id) => {
    if (confirm('මෙම පුවත / නිවේදනය මකාදැමීමට අවශ්‍ය බව තහවුරු කරන්න?')) {
      window.bankStore.deleteNewsItem(id);
      renderNewsTable();
      renderOverview();
      showAdminToast('පුවත සාර්ථකව මකාදමන ලදී.');
    }
  };

  // --- 3. Products & Services CRUD ---
  function renderProductsList() {
    const prods = window.bankStore.getProducts();
    const container = document.getElementById('admin-products-list');
    if (!container) return;

    container.innerHTML = prods.map(p => `
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between mb-3">
            <span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-[#0B0D7C]">
              ${p.category}
            </span>
            ${p.badge ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-pink-100 text-pink-800">${p.badge}</span>` : ''}
          </div>
          <h4 class="font-extrabold text-slate-900 text-base mb-1.5">${p.title}</h4>
          <p class="text-xs text-slate-500 mb-4 line-clamp-2">${p.desc}</p>
          <div class="border-t border-slate-100 pt-3 mb-4">
            <ul class="text-[11px] text-slate-600 space-y-1">
              ${(p.features || []).slice(0, 3).map(f => `<li class="truncate">• ${f}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button onclick="window.editProductItem('${p.id}')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-[#0B0D7C] hover:bg-blue-100 transition-colors">
            <i class="fa-solid fa-pen-to-square mr-1"></i> සංස්කරණය
          </button>
          <button onclick="window.deleteProductConfirm('${p.id}')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            <i class="fa-solid fa-trash mr-1"></i> මකන්න
          </button>
        </div>
      </div>
    `).join('');
  }

  window.openProductEditor = (prod = null) => {
    const modal = document.getElementById('modal-product-editor');
    const form = document.getElementById('product-editor-form');
    form.reset();

    if (prod) {
      document.getElementById('product-editor-title').textContent = 'බැංකු සේවාව සංස්කරණය (Edit Product)';
      document.getElementById('edit-prod-id').value = prod.id;
      document.getElementById('edit-prod-category').value = prod.category || 'savings';
      document.getElementById('edit-prod-title').value = prod.title || '';
      document.getElementById('edit-prod-badge').value = prod.badge || '';
      document.getElementById('edit-prod-icon').value = prod.icon || 'piggy-bank';
      document.getElementById('edit-prod-desc').value = prod.desc || '';
      document.getElementById('edit-prod-features').value = (prod.features || []).join('\n');
    } else {
      document.getElementById('product-editor-title').textContent = 'නව බැංකු සේවාවක් එක් කිරීම';
      document.getElementById('edit-prod-id').value = '';
    }

    modal.classList.remove('hidden');
  };

  window.closeProductEditor = () => {
    document.getElementById('modal-product-editor').classList.add('hidden');
  };

  window.editProductItem = (id) => {
    const prods = window.bankStore.getProducts();
    const p = prods.find(item => item.id === id);
    if (p) window.openProductEditor(p);
  };

  window.deleteProductConfirm = (id) => {
    if (confirm('මෙම බැංකු සේවාව මකාදැමීමට අවශ්‍ය බව තහවුරු කරන්න?')) {
      window.bankStore.deleteProduct(id);
      renderProductsList();
      renderOverview();
      showAdminToast('සේවාව සාර්ථකව මකාදමන ලදී.');
    }
  };

  // --- 4. Rates Editor ---
  function renderRatesEditor() {
    const rates = window.bankStore.getRates();
    if (!rates) return;

    // FD
    const fdBody = document.getElementById('rates-edit-fd-body');
    if (fdBody && rates.fixedDeposits) {
      fdBody.innerHTML = rates.fixedDeposits.map((fd, idx) => `
        <tr data-fd-id="${fd.id}">
          <td class="py-2 px-3">
            <input type="text" class="fd-tenure w-36 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold" value="${fd.tenure}">
          </td>
          <td class="py-2 px-3">
            <input type="text" class="fd-annual w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-[#0B0D7C]" value="${fd.annualRate}">
          </td>
          <td class="py-2 px-3">
            <input type="text" class="fd-monthly w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-amber-600" value="${fd.monthlyRate}">
          </td>
          <td class="py-2 px-3">
            <input type="text" class="fd-min w-28 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" value="${fd.minDeposit}">
          </td>
          <td class="py-2 px-3 text-center">
            <input type="checkbox" class="fd-pop" ${fd.popular ? 'checked' : ''}>
          </td>
          <td class="py-2 px-3 text-right">
            <button onclick="this.closest('tr').remove()" class="text-red-500 hover:text-red-700">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    // Savings
    const saBody = document.getElementById('rates-edit-sa-body');
    if (saBody && rates.savingsAccounts) {
      saBody.innerHTML = rates.savingsAccounts.map(sa => `
        <tr data-sa-id="${sa.id}">
          <td class="py-2 px-3">
            <input type="text" class="sa-name w-48 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold" value="${sa.name}">
          </td>
          <td class="py-2 px-3">
            <input type="text" class="sa-rate w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-emerald-600" value="${sa.rate}">
          </td>
          <td class="py-2 px-3">
            <input type="text" class="sa-min w-28 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" value="${sa.minBalance}">
          </td>
          <td class="py-2 px-3">
            <input type="text" class="sa-note w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" value="${sa.note}">
          </td>
        </tr>
      `).join('');
    }

    // Loans
    const lnBody = document.getElementById('rates-edit-ln-body');
    if (lnBody && rates.loans) {
      lnBody.innerHTML = rates.loans.map(ln => `
        <tr data-ln-id="${ln.id}">
          <td class="py-2 px-3">
            <input type="text" class="ln-name w-48 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold" value="${ln.name}">
          </td>
          <td class="py-2 px-3">
            <input type="text" class="ln-rate w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-[#0B0D7C]" value="${ln.rate}">
          </td>
          <td class="py-2 px-3">
            <input type="text" class="ln-amount w-36 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" value="${ln.maxAmount}">
          </td>
          <td class="py-2 px-3">
            <input type="text" class="ln-period w-28 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" value="${ln.maxPeriod}">
          </td>
        </tr>
      `).join('');
    }
  }

  window.addNewFdRow = () => {
    const tbody = document.getElementById('rates-edit-fd-body');
    const tr = document.createElement('tr');
    tr.dataset.fdId = 'fd-' + Date.now();
    tr.innerHTML = `
      <td class="py-2 px-3"><input type="text" class="fd-tenure w-36 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold" value="නව කාලසීමාව"></td>
      <td class="py-2 px-3"><input type="text" class="fd-annual w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-[#0B0D7C]" value="12.00%"></td>
      <td class="py-2 px-3"><input type="text" class="fd-monthly w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-amber-600" value="11.50%"></td>
      <td class="py-2 px-3"><input type="text" class="fd-min w-28 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" value="රු. 10,000"></td>
      <td class="py-2 px-3 text-center"><input type="checkbox" class="fd-pop"></td>
      <td class="py-2 px-3 text-right"><button onclick="this.closest('tr').remove()" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
  };

  window.saveAllRatesFromForm = () => {
    // 1. Fixed Deposits
    const fdList = [];
    document.querySelectorAll('#rates-edit-fd-body tr').forEach(row => {
      fdList.push({
        id: row.dataset.fdId || ('fd-' + Date.now()),
        tenure: row.querySelector('.fd-tenure').value,
        annualRate: row.querySelector('.fd-annual').value,
        monthlyRate: row.querySelector('.fd-monthly').value,
        minDeposit: row.querySelector('.fd-min').value,
        popular: row.querySelector('.fd-pop').checked
      });
    });

    // 2. Savings
    const saList = [];
    document.querySelectorAll('#rates-edit-sa-body tr').forEach(row => {
      saList.push({
        id: row.dataset.saId,
        name: row.querySelector('.sa-name').value,
        rate: row.querySelector('.sa-rate').value,
        minBalance: row.querySelector('.sa-min').value,
        note: row.querySelector('.sa-note').value
      });
    });

    // 3. Loans
    const lnList = [];
    document.querySelectorAll('#rates-edit-ln-body tr').forEach(row => {
      lnList.push({
        id: row.dataset.lnId,
        name: row.querySelector('.ln-name').value,
        rate: row.querySelector('.ln-rate').value,
        maxAmount: row.querySelector('.ln-amount').value,
        maxPeriod: row.querySelector('.ln-period').value
      });
    });

    window.bankStore.updateRates({
      fixedDeposits: fdList,
      savingsAccounts: saList,
      loans: lnList
    });

    showAdminToast('දෛනික පොලී අනුපාත සාර්ථකව වෙබ් අඩවියට සුරකින ලදී!');
  };

  // --- 5. Hero Sliders ---
  function renderSlidersEditor() {
    const slides = window.bankStore.getHeroSlides();
    const container = document.getElementById('admin-slides-container');
    if (!container) return;

    container.innerHTML = slides.map((s, idx) => `
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4" data-slide-id="${s.id}">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <span class="text-xs font-black uppercase text-[#0B0D7C]">Slide ${idx + 1}</span>
          <span class="text-xs text-slate-400">ID: ${s.id}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Badge ටැගය (උදා: 13.50% දක්වා)</label>
            <input type="text" class="slide-badge w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold" value="${s.badge || ''}">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">බොත්තමේ පාඨය (Button Text)</label>
            <input type="text" class="slide-cta w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold" value="${s.ctaText || ''}">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">ප්‍රධාන සිරස්තලය (Title)</label>
          <input type="text" class="slide-title w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900" value="${s.title || ''}">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">විස්තර පාඨය (Description)</label>
          <textarea class="slide-desc w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs" rows="2">${s.desc || ''}</textarea>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">පසුබිම් පින්තූරයේ URL (Background Image Path)</label>
          <input type="text" class="slide-bg w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono" value="${s.bgImage || ''}">
        </div>

        <div class="flex justify-end">
          <button onclick="window.saveSlideItem('${s.id}')" class="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B0D7C] text-white hover:bg-[#070954]">
            Save Slide
          </button>
        </div>
      </div>
    `).join('');
  }

  window.saveSlideItem = (id) => {
    const card = document.querySelector(`[data-slide-id="${id}"]`);
    if (!card) return;

    const updated = {
      id: id,
      badge: card.querySelector('.slide-badge').value,
      ctaText: card.querySelector('.slide-cta').value,
      title: card.querySelector('.slide-title').value,
      desc: card.querySelector('.slide-desc').value,
      bgImage: card.querySelector('.slide-bg').value,
      ctaLink: '#savings'
    };

    window.bankStore.saveHeroSlide(updated);
    showAdminToast('ස්ලයිඩරය සාර්ථකව සුරකින ලදී.');
  };

  window.saveAllSliders = () => {
    const cards = document.querySelectorAll('#admin-slides-container [data-slide-id]');
    cards.forEach(card => {
      const id = card.dataset.slideId;
      if (id) {
        const updated = {
          id: id,
          badge: card.querySelector('.slide-badge') ? card.querySelector('.slide-badge').value : '',
          ctaText: card.querySelector('.slide-cta') ? card.querySelector('.slide-cta').value : '',
          title: card.querySelector('.slide-title') ? card.querySelector('.slide-title').value : '',
          desc: card.querySelector('.slide-desc') ? card.querySelector('.slide-desc').value : '',
          bgImage: card.querySelector('.slide-bg') ? card.querySelector('.slide-bg').value : '',
          ctaLink: '#savings'
        };
        window.bankStore.saveHeroSlide(updated);
      }
    });
    showAdminToast('සියලුම ස්ලයිඩර් සාර්ථකව සුරකින ලදී!');
  };

  // --- 6. Bank Info Form ---
  function renderBankInfoForm() {
    const info = window.bankStore.getBankInfo();
    if (!info) return;

    document.getElementById('info-urgent-active').checked = !!info.urgentNoticeActive;
    document.getElementById('info-urgent-text').value = info.urgentNotice || '';
    document.getElementById('info-name-si').value = info.sinhalaName || '';
    document.getElementById('info-name-en').value = info.name || '';
    document.getElementById('info-regno').value = info.regNo || '';
    document.getElementById('info-cbsl').value = info.centralBankApproval || '';
    document.getElementById('info-hotline').value = info.hotline || '';
    document.getElementById('info-whatsapp').value = info.whatsapp || '';
    document.getElementById('info-email').value = info.email || '';
    document.getElementById('info-address').value = info.address || '';
    document.getElementById('info-hours').value = info.workingHours || '';
  }

  // --- 7. Inquiries Inbox ---
  function renderInquiriesTable() {
    try {
      const inqs = window.bankStore.getInquiries() || [];
      const tbody = document.getElementById('admin-inquiries-table-body');
      if (!tbody) return;

      const filtered = inquiryFilter === 'all' ? inqs : inqs.filter(i => i.status === inquiryFilter);

      tbody.innerHTML = filtered.map(i => {
        const cleanPhone = cleanPhoneNum(i.phone);
        const waLink = makeWaUrl(cleanPhone, `Hello ${safeStr(i.name)}, regarding your inquiry at Galapitiyagama Sanasa Bank:`);

        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-3 px-4">
              <div class="font-bold text-slate-900">${safeStr(i.name)}</div>
              <div class="text-[11px] text-slate-500 line-clamp-1">${safeStr(i.message)}</div>
            </td>
            <td class="py-3 px-4 font-mono">${safeStr(i.phone)}</td>
            <td class="py-3 px-4 text-slate-600">${safeStr(i.email) || '-'}</td>
            <td class="py-3 px-4 font-semibold text-slate-800">${safeStr(i.service)}</td>
            <td class="py-3 px-4 text-slate-400 text-[11px]">${safeStr(i.date)}</td>
            <td class="py-3 px-4">
              <button onclick="window.toggleInqStatus('${i.id}', '${i.status === 'replied' ? 'pending' : 'replied'}')" class="px-2.5 py-1 rounded-full text-[10px] font-bold ${i.status === 'replied' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                ${safeStr(i.status || 'pending').toUpperCase()}
              </button>
            </td>
            <td class="py-3 px-4 text-right whitespace-nowrap space-x-2">
              ${cleanPhone ? `
                <a href="${waLink}" target="_blank" class="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50" title="Reply on WhatsApp">
                  <i class="fa-brands fa-whatsapp text-sm"></i>
                </a>
              ` : ''}
              <button onclick="window.deleteInquiryConfirm('${i.id}')" class="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Delete">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400 font-semibold">මෙම කාණ්ඩය යටතේ විමසීම් නොමැත.</td></tr>';
      }
    } catch (err) {
      console.error('Error in renderInquiriesTable:', err);
    }
  }

  window.filterInquiries = (status) => {
    inquiryFilter = status;
    document.querySelectorAll('.inq-filter-btn').forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      const match = onclickAttr.includes(`'${status}'`) || onclickAttr.includes(`"${status}"`);
      btn.className = match ? 'inq-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0B0D7C] text-white' : 'inq-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200';
    });
    renderInquiriesTable();
  };

  window.toggleInqStatus = (id, newStatus) => {
    window.bankStore.updateInquiryStatus(id, newStatus);
    renderInquiriesTable();
    renderOverview();
  };

  window.deleteInquiryConfirm = (id) => {
    if (confirm('මෙම විමසීම මකාදැමීමට අවශ්‍ය බව තහවුරු කරන්න?')) {
      window.bankStore.deleteInquiry(id);
      renderInquiriesTable();
      renderOverview();
      showAdminToast('විමසීම මකාදමන ලදී.');
    }
  };

  // --- 8. Forms Handlers ---
  function setupForms() {
    // News Form Submit
    const newsForm = document.getElementById('news-editor-form');
    if (newsForm) {
      newsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-news-id').value;
        const item = {
          id: id || undefined,
          title: document.getElementById('edit-news-title').value,
          titleEn: document.getElementById('edit-news-title-en').value,
          category: document.getElementById('edit-news-category').value,
          date: document.getElementById('edit-news-date').value,
          image: document.getElementById('edit-news-image').value,
          summary: document.getElementById('edit-news-summary').value,
          content: document.getElementById('edit-news-content').value,
          urgent: document.getElementById('edit-news-urgent').checked
        };
        window.bankStore.saveNewsItem(item);
        window.closeNewsEditor();
        renderNewsTable();
        renderOverview();
        showAdminToast('පුවත / නිවේදනය සාර්ථකව පළ කරන ලදී!');
      });
    }

    // Product Form Submit
    const prodForm = document.getElementById('product-editor-form');
    if (prodForm) {
      prodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-prod-id').value;
        const featuresText = document.getElementById('edit-prod-features').value;
        const features = featuresText.split('\n').map(s => s.trim()).filter(s => s.length > 0);

        const prod = {
          id: id || undefined,
          category: document.getElementById('edit-prod-category').value,
          title: document.getElementById('edit-prod-title').value,
          badge: document.getElementById('edit-prod-badge').value,
          icon: document.getElementById('edit-prod-icon').value,
          desc: document.getElementById('edit-prod-desc').value,
          features: features
        };

        window.bankStore.saveProduct(prod);
        window.closeProductEditor();
        renderProductsList();
        renderOverview();
        showAdminToast('බැංකු සේවාව සාර්ථකව සුරකින ලදී!');
      });
    }

    // Bank Info Form Submit
    const bankInfoForm = document.getElementById('bank-info-form');
    if (bankInfoForm) {
      bankInfoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
          urgentNoticeActive: document.getElementById('info-urgent-active').checked,
          urgentNotice: document.getElementById('info-urgent-text').value,
          sinhalaName: document.getElementById('info-name-si').value,
          name: document.getElementById('info-name-en').value,
          regNo: document.getElementById('info-regno').value,
          centralBankApproval: document.getElementById('info-cbsl').value,
          hotline: document.getElementById('info-hotline').value,
          whatsapp: document.getElementById('info-whatsapp').value,
          email: document.getElementById('info-email').value,
          address: document.getElementById('info-address').value,
          workingHours: document.getElementById('info-hours').value
        };

        window.bankStore.updateBankInfo(updated);
        renderOverview();
        showAdminToast('බැංකු තොරතුරු සහ නිවේදනය සාර්ථකව සුරකින ලදී!');
      });
    }

    // Load Firebase Config if saved
    const fbCfg = window.bankStore.getFirebaseConfig();
    const fbInput = document.getElementById('firebase-config-input');
    if (fbInput && fbCfg) {
      fbInput.value = JSON.stringify(fbCfg, null, 2);
    }
  }

  // --- JSON Upload Handler ---
  window.handleJSONUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = window.bankStore.importJSON(event.target.result);
      if (res.success) {
        showAdminToast('දත්ත ගොනුව සාර්ථකව ආයාත (Import) කරන ලදී!');
        initDashboard();
      } else {
        alert('දත්ත ආයාත කිරීම අසාර්ථකයි: ' + res.error);
      }
    };
    reader.readAsText(file);
  };

  // --- Google Apps Script / Google Sheets Cloud Sync ---
  window.saveAppsScriptUrlFromAdmin = () => {
    const el = document.getElementById('appscript-url-input');
    const msgEl = document.getElementById('appscript-sync-msg');
    const val = el ? el.value.trim() : '';

    if (!val) {
      if (confirm('Google Apps Script URL එක ඉවත් කිරීමට අවශ්‍ය බව තහවුරු කරන්න?')) {
        window.bankStore.saveAppsScriptUrl('');
        if (msgEl) msgEl.textContent = 'Apps Script URL ඉවත් කරන ලදී.';
        showAdminToast('Google Apps Script URL එක ඉවත් කරන ලදී.');
      }
      return;
    }

    if (!val.startsWith('http')) {
      alert('කරුණාකර නිවැරදි Web App URL එකක් ඇතුළත් කරන්න (e.g. https://script.google.com/...)');
      return;
    }

    window.bankStore.saveAppsScriptUrl(val);
    if (msgEl) msgEl.textContent = 'සැකසුම සාර්ථකව සුරකින ලදී. සජීවීව පරීක්ෂා කරමින්...';
    showAdminToast('Google Apps Script URL එක සාර්ථකව සුරකින ලදී!');
    window.syncFromCloud(true);
  };

  window.syncFromCloud = async (showFeedback = true) => {
    const icon = document.getElementById('admin-sync-icon');
    const label = document.getElementById('admin-sync-label');
    const badgeText = document.getElementById('cloud-sync-status-text');
    const msgEl = document.getElementById('appscript-sync-msg');

    if (icon) icon.classList.add('fa-spin');
    if (label) label.textContent = 'Syncing...';
    if (badgeText) badgeText.textContent = 'Syncing from Cloud...';

    try {
      const res = await window.bankStore.fetchFromAppsScript();
      if (res.success) {
        if (badgeText) badgeText.textContent = 'Cloud Sync Connected';
        // Immediately re-render all submission tables
        try { renderInquiriesTable(); } catch(e) {}
        try { renderApplicationsTable(); } catch(e) {}
        try { renderLoanPaymentsTable(); } catch(e) {}
        try { renderSmartCoopTable(); } catch(e) {}
        try { renderFeedbackTable(); } catch(e) {}
        try { renderOverview(); } catch(e) {}

        if (showFeedback) {
          showAdminToast('Google Sheet එකෙන් නවතම දත්ත සාර්ථකව ලබාගන්නා ලදී!');
        }
      } else {
        if (badgeText) badgeText.textContent = 'Sync Idle';
        if (msgEl) msgEl.innerHTML = `<span class="text-amber-600 font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> ${res.error}</span>`;
        if (showFeedback && res.error !== 'No Apps Script Web App URL configured.') {
          alert('Cloud Sync දෝෂයක්: ' + res.error);
        }
      }
    } catch (err) {
      if (badgeText) badgeText.textContent = 'Sync Error';
      if (msgEl) msgEl.innerHTML = `<span class="text-red-600 font-semibold"><i class="fa-solid fa-circle-xmark"></i> දෝෂයක්: ${err.message}</span>`;
    } finally {
      if (icon) icon.classList.remove('fa-spin');
      if (label) label.textContent = 'Sync Cloud';
    }
  };

  // --- Firebase Config Save ---
  window.saveFirebaseConfig = () => {
    const val = document.getElementById('firebase-config-input').value.trim();
    if (!val) {
      window.bankStore.saveFirebaseConfig(null);
      showAdminToast('Firebase Cloud Sync ඉවත් කරන ලදී.');
      return;
    }
    try {
      const parsed = JSON.parse(val);
      window.bankStore.saveFirebaseConfig(parsed);
      showAdminToast('Firebase Cloud Sync සැකසුම් සුරකින ලදී!');
    } catch (err) {
      alert('වලංගු JSON ආකෘතියක් නොවේ: ' + err.message);
    }
  };

  // --- Factory Reset ---
  window.confirmResetDefaults = () => {
    if (confirm('අවවාදයයි: ඔබ විසින් ඇතුළත් කළ සියලුම දත්ත මකාදමා පෙරනිමි (Default) දත්ත නැවත පිහිටුවීමට ඔබට අවශ්‍ය බව තහවුරු කරන්න?')) {
      window.bankStore.resetToDefaults();
      initDashboard();
      showAdminToast('සියලුම දත්ත නැවත පෙරනිමි තත්ත්වයට පත් කරන ලදී.');
    }
  };

  // --- Toast ---
  function showAdminToast(msg) {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'admin-toast-container';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = 'padding:14px 20px;border-radius:12px;background:#0B0D7C;color:#ffffff;box-shadow:0 10px 25px rgba(0,0,0,0.25);border-left:5px solid #DF0178;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;animation:slideInUp 0.3s ease;';
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-pink-400 text-base"></i><span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // =========================================================================
  // --- MEMBERSHIP APPLICATIONS MANAGEMENT CONTROLLER ---
  // =========================================================================

  function renderApplicationsTable() {
    try {
      const apps = window.bankStore.getMembershipApplications ? window.bankStore.getMembershipApplications() : [];
      const tbody = document.getElementById('admin-apps-table-body');
      if (!tbody) return;

      const searchInput = document.getElementById('admin-apps-search');
      const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

      let filtered = apps;
      if (currentAppFilter !== 'all') {
        filtered = filtered.filter(a => a.status === currentAppFilter);
      }
      if (query) {
        filtered = filtered.filter(a => 
          safeStr(a.fullName).toLowerCase().includes(query) ||
          safeStr(a.nameEnglishCaps).toLowerCase().includes(query) ||
          safeStr(a.nic).toLowerCase().includes(query) ||
          safeStr(a.refId).toLowerCase().includes(query) ||
          safeStr(a.phone).includes(query)
        );
      }

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center py-8 text-slate-400">
              <i class="fa-solid fa-address-card text-3xl mb-2 block"></i>
              සාමාජික අයදුම්පත් කිසිවක් හමු නොවීය.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(app => {
        const cleanPhone = cleanPhoneNum(app.phone);
        const isEda = safeStr(app.refId).startsWith('GSCS-EDA') || app.isExternalDeposit || app.appType === 'EXTERNAL_DEPOSIT';
        const waMsg = isEda
          ? `ගරු ${safeStr(app.fullName)} මහතා/මිය,\n\nඔබ විසින් යොමු කරන ලද බාහිර තැන්පත් ගිණුම් අයදුම්පත (යොමු අංකය: ${safeStr(app.refId)}) සම්බන්ධයෙනි.\n\nගලපිටියාගම සණස සමූපකාර බැංකුව`
          : `Hello ${safeStr(app.fullName)}, regarding your GSCS Bank Membership Application ${safeStr(app.refId)}:`;
        const waLink = makeWaUrl(cleanPhone, waMsg);

        let statusBadge = '';
        if (app.status === 'approved') {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">APPROVED</span>';
        } else if (app.status === 'rejected') {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">REJECTED</span>';
        } else {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">PENDING</span>';
        }

        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-3 px-4">
              <span class="font-black ${isEda ? 'text-emerald-700' : 'text-[#0B0D7C]'} font-mono">${safeStr(app.refId)}</span>
              <div>
                ${isEda ? '<span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">EXTERNAL DEPOSIT</span>' : '<span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-[#0B0D7C]">MEMBERSHIP</span>'}
              </div>
              <div class="text-[10px] text-slate-400">${safeStr(app.submittedAt)}</div>
            </td>
            <td class="py-3 px-4">
              <div class="font-bold text-slate-900">${safeStr(app.fullName)}</div>
              <div class="text-[11px] text-slate-500 font-mono">${safeStr(app.nic)} • ${safeStr(app.gender)}</div>
            </td>
            <td class="py-3 px-4">
              <div class="font-mono text-slate-800">${safeStr(app.phone)}</div>
              <a href="${waLink}" target="_blank" class="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-semibold">
                <i class="fa-brands fa-whatsapp text-xs"></i> WhatsApp
              </a>
            </td>
            <td class="py-3 px-4 font-semibold text-slate-800">
              <div class="text-emerald-700 font-bold">රු. ${Number(app.totalPaid || 6000).toLocaleString()}.00</div>
              <div class="text-[10px] text-slate-400 font-mono">${safeStr(app.paymentRef) || 'No Ref'}</div>
            </td>
            <td class="py-3 px-4">
              ${app.receiptImage ? `
                <img src="${app.receiptImage}" onclick="window.viewApplicationDetails('${app.id}')" class="w-10 h-10 object-cover rounded-lg border border-slate-200 cursor-pointer hover:scale-110 transition-transform shadow-sm" title="රිසිට්පත බලන්න">
              ` : '<span class="text-slate-400 text-[10px]">නැත</span>'}
            </td>
            <td class="py-3 px-4">
              ${app.signatureImage ? `
                <img src="${app.signatureImage}" onclick="window.viewApplicationDetails('${app.id}')" class="w-12 h-6 object-contain rounded border border-slate-200 bg-white cursor-pointer hover:scale-110 transition-transform" title="අත්සන බලන්න">
              ` : '<span class="text-slate-400 text-[10px]">නැත</span>'}
            </td>
            <td class="py-3 px-4">
              ${statusBadge}
            </td>
            <td class="py-3 px-4 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button onclick="window.viewApplicationDetails('${app.id}')" class="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#0B0D7C] text-xs font-bold" title="සම්පූර්ණ අයදුම්පත බලන්න">
                  <i class="fa-solid fa-eye"></i>
                </button>
                ${app.status === 'pending' ? `
                  <button onclick="window.setAppStatus('${app.id}', 'approved')" class="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold" title="අනුමත කරන්න">
                    <i class="fa-solid fa-check"></i>
                  </button>
                  <button onclick="window.setAppStatus('${app.id}', 'rejected')" class="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold" title="ප්‍රතික්ෂේප කරන්න">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                ` : ''}
                <button onclick="window.deleteAppConfirm('${app.id}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs" title="මකාදමන්න">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Error in renderApplicationsTable:', err);
    }
  }

  window.setAppFilter = (filter) => {
    currentAppFilter = filter;
    document.querySelectorAll('.app-filter-btn').forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      const active = onclickAttr.includes(filter);
      btn.classList.toggle('bg-[#0B0D7C]', active);
      btn.classList.toggle('text-white', active);
      btn.classList.toggle('bg-white', !active);
      btn.classList.toggle('text-slate-700', !active);
    });
    renderApplicationsTable();
  };

  window.filterApplications = () => {
    renderApplicationsTable();
  };

  // --- Loan Payments ---

  function renderLoanPaymentsTable() {
    try {
      const payments = window.bankStore.getLoanPayments ? window.bankStore.getLoanPayments() : [];
      const tbody = document.getElementById('admin-lp-table-body');
      if (!tbody) return;

      const searchEl = document.getElementById('admin-lp-search');
      const query = searchEl ? safeStr(searchEl.value).toLowerCase().trim() : '';

      let filtered = payments;
      if (currentLpFilter !== 'all') {
        filtered = filtered.filter(p => safeStr(p.status) === currentLpFilter);
      }
      if (query) {
        filtered = filtered.filter(p =>
          safeStr(p.memberName).toLowerCase().includes(query) ||
          safeStr(p.memberNo).toLowerCase().includes(query) ||
          safeStr(p.loanType).toLowerCase().includes(query) ||
          safeStr(p.refId).toLowerCase().includes(query) ||
          safeStr(p.phone).includes(query)
        );
      }

      // Update badge
      const badge = document.getElementById('sidebar-lp-badge');
      const pendingCount = payments.filter(p => safeStr(p.status) === 'pending').length;
      if (badge) badge.textContent = pendingCount;

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center py-8 text-slate-400">
              <i class="fa-solid fa-money-bill-transfer text-3xl mb-2 block"></i>
              ණය වාරික ගෙවීම් කිසිවක් හමු නොවීය.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(p => {
        const cleanPhone = cleanPhoneNum(p.phone);
        const amountNum = safeNum(p.amount);
        const isDep = safeStr(p.refId).startsWith('GSCS-DEP') || safeStr(p.loanType).includes('තැන්පතු') || p.isDeposit;
        const itemTypeLabel = isDep ? 'තැන්පතුව' : 'ණය වාරිකය';
        const waMsg = isDep
          ? `ගරු ${safeStr(p.memberName)} මහතා/මිය,\n\nඔබගේ ${safeStr(p.loanType)} ගිණුමේ රු. ${amountNum.toLocaleString()}.00 තැන්පතුව (යොමු: ${safeStr(p.refId)}) ගිණුමට බැර කරන ලදී. ස්තූතියි!\n\nගලපිටියාගම සණස සමූපකාර බැංකුව`
          : `ගරු ${safeStr(p.memberName)} මහතා/මිය,\n\nඔබගේ ${safeStr(p.loanType)} ණය ගිණුමේ රු. ${amountNum.toLocaleString()}.00 වාරිකය (යොමු: ${safeStr(p.refId)}) ගිණුමට බැර කරන ලදී. ස්තූතියි!\n\nගලපිටියාගම සණස සමූපකාර බැංකුව`;
        const smsMsg = encodeURIComponent(`ගලපිටියාගම සණස: ${safeStr(p.memberName)} - ${safeStr(p.loanType)} ${itemTypeLabel} රු.${amountNum.toLocaleString()} තහවුරු විය. Ref: ${safeStr(p.refId)}`);
        const waLink = makeWaUrl(cleanPhone, waMsg);
        const smsLink = cleanPhone ? `sms:+94${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}?body=${smsMsg}` : '#';

        let statusBadge = '';
        const st = safeStr(p.status).toLowerCase();
        if (st === 'confirmed') {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">CONFIRMED</span>';
        } else if (st === 'rejected') {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">REJECTED</span>';
        } else {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">PENDING</span>';
        }

        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-3 px-4">
              <span class="font-black ${isDep ? 'text-emerald-700' : 'text-[#DF0178]'} font-mono text-[11px]">${safeStr(p.refId)}</span>
              <div class="text-[10px] text-slate-400">${safeStr(p.submittedAt)}</div>
            </td>
            <td class="py-3 px-4">
              <div class="font-bold text-slate-900">${safeStr(p.memberName)}</div>
              <div class="text-[11px] text-slate-500 font-mono">${safeStr(p.memberNo)}${p.loanAccNo ? ' | ' + safeStr(p.loanAccNo) : ''}</div>
            </td>
            <td class="py-3 px-4">
              <div>
                ${isDep ? '<span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 mr-1">DEPOSIT</span>' : '<span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-pink-100 text-[#DF0178] mr-1">LOAN</span>'}
                <span class="text-slate-800 font-semibold">${safeStr(p.loanType)}</span>
              </div>
            </td>
            <td class="py-3 px-4">
              <div class="font-mono text-slate-800">${safeStr(p.phone)}</div>
              <div class="flex gap-1.5 mt-1">
                <a href="${waLink}" target="_blank" class="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5 font-semibold">
                  <i class="fa-brands fa-whatsapp text-xs"></i> WhatsApp
                </a>
                <span class="text-slate-300">|</span>
                <a href="${smsLink}" class="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-semibold">
                  <i class="fa-solid fa-sms text-xs"></i> SMS
                </a>
              </div>
            </td>
            <td class="py-3 px-4">
              <div class="text-emerald-700 font-black font-mono">රු. ${amountNum.toLocaleString()}.00</div>
            </td>
            <td class="py-3 px-4">
              ${p.receiptImage ? `
                <img src="${p.receiptImage}" onclick="window.open('${p.receiptImage}','_blank')" class="w-10 h-10 object-cover rounded-lg border border-slate-200 cursor-pointer hover:scale-110 transition-transform shadow-sm" title="රිසිට්පත බලන්න">
              ` : '<span class="text-slate-400 text-[10px]">නැත</span>'}
            </td>
            <td class="py-3 px-4">${statusBadge}</td>
            <td class="py-3 px-4 text-right">
              <div class="flex items-center justify-end gap-1.5">
                ${st === 'pending' ? `
                  <button onclick="window.confirmLoanPayment('${p.id}')" class="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold" title="තහවුරු කරන්න">
                    <i class="fa-solid fa-check"></i>
                  </button>
                  <button onclick="window.rejectLoanPayment('${p.id}')" class="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold" title="ප්‍රතික්ෂේප කරන්න">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                ` : ''}
                <a href="${waLink}" target="_blank" class="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold" title="WhatsApp Message">
                  <i class="fa-brands fa-whatsapp"></i>
                </a>
                <a href="${smsLink}" class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold" title="SMS">
                  <i class="fa-solid fa-message"></i>
                </a>
                <button onclick="window.deleteLoanPayment('${p.id}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs" title="මකාදමන්න">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Error in renderLoanPaymentsTable:', err);
    }
  }

  window.setLpFilter = (filter) => {
    currentLpFilter = filter;
    document.querySelectorAll('.lp-filter-btn').forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      const active = onclickAttr.includes(`'${filter}'`) || onclickAttr.includes(`"${filter}"`);
      btn.classList.toggle('bg-[#0B0D7C]', active);
      btn.classList.toggle('text-white', active);
      btn.classList.toggle('bg-white', !active);
      btn.classList.toggle('text-slate-700', !active);
    });
    renderLoanPaymentsTable();
  };

  window.filterLoanPayments = () => { renderLoanPaymentsTable(); };

  window.confirmLoanPayment = (id) => {
    if (confirm('ණය වාරිකය ගිණුමේ ලැබිණිද? තහවුරු කරන්නද?')) {
      window.bankStore.updateLoanPaymentStatus(id, 'confirmed');
      renderLoanPaymentsTable();
      // Open WhatsApp confirm message for this payment
      const payments = window.bankStore.getLoanPayments ? window.bankStore.getLoanPayments() : [];
      const p = payments.find(x => x.id === id);
      if (p && p.phone) {
        const cleanPhone = cleanPhoneNum(p.phone);
        const amountNum = safeNum(p.amount);
        const isDep = safeStr(p.refId).startsWith('GSCS-DEP') || safeStr(p.loanType).includes('තැන්පතු') || p.isDeposit;
        const msg = isDep
          ? `ගරු ${safeStr(p.memberName)} මහතා/මිය,\n\nඔබගේ ${safeStr(p.loanType)} ගිණුමේ රු. ${amountNum.toLocaleString()}.00 තැන්පතුව (යොමු: ${safeStr(p.refId)}) ගිණුමට බැර කරන ලදී. ස්තූතියි!\n\nගලපිටියාගම සණස සමූපකාර බැංකුව`
          : `ගරු ${safeStr(p.memberName)} මහතා/මිය,\n\nඔබගේ ${safeStr(p.loanType)} ණය ගිණුමේ රු. ${amountNum.toLocaleString()}.00 වාරිකය (යොමු: ${safeStr(p.refId)}) ගිණුමට බැර කරන ලදී. ස්තූතියි!\n\nගලපිටියාගම සණස සමූපකාර බැංකුව`;
        const waLink = makeWaUrl(cleanPhone, msg);
        if (confirm('WhatsApp හරහා ගෙවීම් තහවුරු කිරීමේ පණිවිඩය යැවීමට අවශ්‍යද?')) {
          window.open(waLink, '_blank');
        }
      }
    }
  };

  window.rejectLoanPayment = (id) => {
    if (confirm('ණය ගෙවීම ප්‍රතික්ෂේප කරන්නද?')) {
      window.bankStore.updateLoanPaymentStatus(id, 'rejected');
      renderLoanPaymentsTable();
    }
  };

  window.deleteLoanPayment = (id) => {
    if (confirm('මෙම ගෙවීම් ලේඛනය සදහටම මකාදමන්නද?')) {
      window.bankStore.deleteLoanPayment(id);
      renderLoanPaymentsTable();
    }
  };

  // --- Smart COOP Applications ---

  function renderSmartCoopTable() {
    try {
      const apps = window.bankStore.getSmartCoopApplications ? window.bankStore.getSmartCoopApplications() : [];
      const tbody = document.getElementById('admin-sc-table-body');
      if (!tbody) return;

      const searchEl = document.getElementById('admin-sc-search');
      const query = searchEl ? safeStr(searchEl.value).toLowerCase().trim() : '';

      let filtered = apps;
      if (currentScFilter !== 'all') {
        filtered = filtered.filter(a => safeStr(a.status) === currentScFilter);
      }
      if (query) {
        filtered = filtered.filter(a =>
          safeStr(a.fullName).toLowerCase().includes(query) ||
          safeStr(a.nameEnglishCaps).toLowerCase().includes(query) ||
          safeStr(a.accNo).toLowerCase().includes(query) ||
          safeStr(a.nic).toLowerCase().includes(query) ||
          safeStr(a.phone).includes(query) ||
          safeStr(a.username).toLowerCase().includes(query) ||
          safeStr(a.refId).toLowerCase().includes(query)
        );
      }

      // Badge
      const badge = document.getElementById('sidebar-sc-badge');
      const pendingCount = apps.filter(a => safeStr(a.status) === 'pending').length;
      if (badge) badge.textContent = pendingCount;

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-8 text-slate-400">
              <i class="fa-solid fa-mobile-screen-button text-3xl mb-2 block"></i>
              Smart COOP අයදුම්පත් කිසිවක් හමු නොවීය.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(app => {
        const cleanPhone = cleanPhoneNum(app.phone);
        const waMsg = `ගරු ${safeStr(app.fullName)} මහතා/මිය,\n\nඔබගේ Smart COOP ජංගම බැංකු සේවාව (ගිණුම්: ${safeStr(app.accNo)}) සක්‍රීය කරන ලදී. ඔබගේ පරිශීලක නාමය (Username): ${safeStr(app.username)}.\n\nගලපිටියාගම සණස සමූපකාර බැංකුව`;
        const waLink = makeWaUrl(cleanPhone, waMsg);

        let statusBadge = '';
        const st = safeStr(app.status).toLowerCase();
        if (st === 'activated') {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">ACTIVATED</span>';
        } else if (st === 'rejected') {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">REJECTED</span>';
        } else {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">PENDING</span>';
        }

        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-3 px-4">
              <span class="font-black text-[#0B0D7C] font-mono">${safeStr(app.refId)}</span>
              <div class="text-[10px] text-slate-400">${safeStr(app.submittedAt)}</div>
            </td>
            <td class="py-3 px-4">
              <span class="font-black font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">${safeStr(app.accNo)}</span>
            </td>
            <td class="py-3 px-4">
              <div class="font-bold text-slate-900">${safeStr(app.fullName)}</div>
              <div class="text-[11px] text-slate-500 font-mono">${safeStr(app.nic)} • ${safeStr(app.gender)}</div>
            </td>
            <td class="py-3 px-4">
              <div class="font-mono text-slate-800">${safeStr(app.phone)}</div>
              <div class="text-[11px] text-slate-500 font-mono">User: <strong>${safeStr(app.username)}</strong></div>
            </td>
            <td class="py-3 px-4">
              ${app.signatureImage ? `
                <img src="${app.signatureImage}" onclick="window.printSmartCoopApp('${app.id}')" class="w-12 h-6 object-contain rounded border border-slate-200 bg-white cursor-pointer hover:scale-110 transition-transform" title="අත්සන බලන්න">
              ` : '<span class="text-slate-400 text-[10px]">නැත</span>'}
            </td>
            <td class="py-3 px-4">${statusBadge}</td>
            <td class="py-3 px-4 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button onclick="window.printSmartCoopApp('${app.id}')" class="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#0B0D7C] text-xs font-bold" title="A4 ලෙස මුද්‍රණය කරන්න">
                  <i class="fa-solid fa-print"></i>
                </button>
                ${st === 'pending' ? `
                  <button onclick="window.setSmartCoopStatus('${app.id}', 'activated')" class="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold" title="සක්‍රීය කරන්න">
                    <i class="fa-solid fa-check"></i>
                  </button>
                  <button onclick="window.setSmartCoopStatus('${app.id}', 'rejected')" class="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold" title="ප්‍රතික්ෂේප කරන්න">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                ` : ''}
                <a href="${waLink}" target="_blank" class="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold" title="WhatsApp Message">
                  <i class="fa-brands fa-whatsapp"></i>
                </a>
                <button onclick="window.deleteSmartCoopApp('${app.id}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs" title="මකාදමන්න">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Error in renderSmartCoopTable:', err);
    }
  }

  window.setScFilter = (filter) => {
    currentScFilter = filter;
    document.querySelectorAll('.sc-filter-btn').forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      const active = onclickAttr.includes(`'${filter}'`) || onclickAttr.includes(`"${filter}"`);
      btn.classList.toggle('bg-[#0B0D7C]', active);
      btn.classList.toggle('text-white', active);
      btn.classList.toggle('bg-white', !active);
      btn.classList.toggle('text-slate-700', !active);
    });
    renderSmartCoopTable();
  };

  window.filterSmartCoopApps = () => { renderSmartCoopTable(); };

  window.setSmartCoopStatus = (id, status) => {
    if (confirm(`අයදුම්පත ${status === 'activated' ? 'සක්‍රීය (Activated)' : 'ප්‍රතික්ෂේප (Rejected)'} කිරීමට අවශ්‍ය බව තහවුරු කරන්න?`)) {
      window.bankStore.updateSmartCoopApplicationStatus(id, status);
      renderSmartCoopTable();

      if (status === 'activated') {
        const apps = window.bankStore.getSmartCoopApplications ? window.bankStore.getSmartCoopApplications() : [];
        const app = apps.find(x => x.id === id);
        if (app && app.phone) {
          const cleanPhone = cleanPhoneNum(app.phone);
          const waMsg = `ගරු ${safeStr(app.fullName)} මහතා/මිය,\n\nඔබගේ Smart COOP ජංගම බැංකු සේවාව (ගිණුම්: ${safeStr(app.accNo)}) සක්‍රීය කරන ලදී. ඔබගේ පරිශීලක නාමය (Username): ${safeStr(app.username)}.\n\nස්තූතියි!\nගලපිටියාගම සණස සමූපකාර බැංකුව`;
          const waLink = makeWaUrl(cleanPhone, waMsg);
          if (confirm('WhatsApp හරහා සක්‍රීය කිරීමේ පණිවිඩය යැවීමට අවශ්‍යද?')) {
            window.open(waLink, '_blank');
          }
        }
      }
    }
  };

  window.deleteSmartCoopApp = (id) => {
    if (confirm('මෙම Smart COOP අයදුම්පත සදහටම මකාදමන්නද?')) {
      window.bankStore.deleteSmartCoopApplication(id);
      renderSmartCoopTable();
    }
  };

  // --- Smart COOP Official 2-Page A4 Black & White Printable Form ---
  window.printSmartCoopApp = (appId) => {
    const apps = window.bankStore.getSmartCoopApplications ? window.bankStore.getSmartCoopApplications() : [];
    const app = apps.find(a => a.id === appId);
    if (!app) return;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('කරුණාකර Popup විවෘත කිරීමට අවසර දෙන්න.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="si">
      <head>
        <title>Smart COOP Application - ${app.refId}</title>
        <meta charset="utf-8">
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm 12mm 15mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { font-family: 'Times New Roman', 'Noto Serif Sinhala', 'Iskoola Pota', serif; font-size: 11pt; color: #000; line-height: 1.35; margin: 0; padding: 0; background: #fff; }
          .sheet { width: 100%; max-width: 180mm; margin: 0 auto; }
          .page-break { page-break-after: always; break-after: page; }
          .no-print { text-align: right; margin-bottom: 15px; }
          .btn-print { padding: 8px 20px; background: #000; color: #fff; border: none; font-weight: bold; cursor: pointer; border-radius: 4px; }
          .header-box { border: 1.5px solid #000; padding: 8px 12px; margin-bottom: 10px; }
          .title { font-size: 15pt; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; margin: 4px 0; }
          .sub-title { font-size: 11pt; font-weight: bold; text-align: center; margin-bottom: 6px; }
          .bank-name { font-size: 10pt; text-align: center; font-weight: bold; }
          .acc-box { display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; font-size: 10pt; }
          .form-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10.5pt; }
          .form-table td, .form-table th { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
          .form-table th { width: 35%; text-align: left; background: #f0f0f0; font-weight: bold; }
          .box-grid { display: flex; gap: 3px; }
          .box-cell { width: 18px; height: 22px; border: 1px solid #000; display: inline-flex; align-items: center; justify-content: center; font-family: monospace; font-size: 11pt; font-weight: bold; }
          .declaration { border: 1px solid #000; padding: 8px; margin: 8px 0; font-size: 9.5pt; text-align: justify; }
          .sig-box { border: 1px solid #000; height: 60px; display: flex; align-items: center; justify-content: center; }
          .terms-list { font-size: 8.5pt; line-height: 1.3; margin: 0; padding-left: 18px; text-align: justify; }
          .terms-list li { margin-bottom: 4px; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">A4 ලෙස මුද්‍රණය කරන්න (Print A4 Black & White)</button>
        </div>

        <!-- ================= PAGE 1 ================= -->
        <div class="sheet">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 9pt;">
            <div>
              <strong>Application ID:</strong> ${safeStr(app.refId)}<br>
              <span style="font-family: monospace;">GSCS-MAA-${safeStr(app.refId).replace(/[^0-9]/g, '')}</span>
            </div>
            <div style="border: 1px solid #000; padding: 4px 8px;">
              <strong>Bank use only:</strong><br>
              Active status: [ &nbsp; ] &nbsp; Date: .....................<br>
              Activated Officer: ............................
            </div>
            <div style="text-align: right;">
              <strong>දිනය:</strong> ${app.submittedAt.split(' ')[0]}
            </div>
          </div>

          <div class="header-box">
            <div class="bank-name">සීමා රහිත ගලපිටියාගම සකසුරුවම් හා ණය ගනුදෙනු පිළිබඳ සමූපකාර සමිතිය</div>
            <div class="title">SMART COOP</div>
            <div class="sub-title">ජංගම දුරකථන යෙදුම සඳහා අයදුම් පත්‍රය</div>
            <div style="font-size: 9pt; border-top: 1px dashed #000; padding-top: 4px; text-align: justify;">
              සීමා රහිත ගලපිටියාගම සකසුරුවම් හා ණය ගනුදෙනු පිළිබඳ සමූපකාර සමිතියේ පවත්වාගෙන යනු ලබන මගේ/අපගේ ගිණුම සඳහා ස්මාර්ට් කෝප් ජංගම දුරකථන යෙදුම සක්‍රිය කරදෙන ලෙස ඉල්ලා සිටිමි/සිටිමු.<br>
              <em style="font-size: 8.5pt;">(සටහන: අයදුම්කරු සමිතියක් නම්, අදාළ කිරීම් කාරක සහ තීරණ ගත් වාර්තා පිටපත් මේ සමඟ ඉදිරිපත් කර යුතුය).</em>
            </div>
          </div>

          <table class="form-table">
            <tr>
              <th>ගිණුම් අංකය</th>
              <td><strong style="font-family: monospace; font-size: 12pt;">${app.accNo}</strong></td>
            </tr>
            <tr>
              <th>සම්පූර්ණ නම</th>
              <td>${app.fullName}</td>
            </tr>
            <tr>
              <th>මුලකුරු සමඟ නම (ඉංග්‍රීසි කැපිටල්)</th>
              <td style="font-family: monospace; font-weight: bold;">${safeStr(app.nameEnglishCaps).toUpperCase()}</td>
            </tr>
            <tr>
              <th>ජාතික හැඳුනුම්පත් අංකය</th>
              <td><strong style="font-family: monospace;">${app.nic}</strong> &nbsp; | &nbsp; <strong>ස්ත්‍රී/පුරුෂ භාවය:</strong> ${app.gender}</td>
            </tr>
            <tr>
              <th>ස්ථිර ලිපිනය</th>
              <td>${app.address}</td>
            </tr>
            <tr>
              <th>දුරකථන අංකය</th>
              <td><strong style="font-family: monospace; font-size: 11pt;">${app.phone}</strong> <em>(මූල්‍යමය ගනුදෙනු කෙටි පණිවිඩයක් මඟින් ලැබෙන අංකය)</em></td>
            </tr>
            <tr>
              <th>පරිශීලක නාමය (Username)</th>
              <td><strong style="font-family: monospace; font-size: 11pt;">${app.username}</strong> <em>(ඉංග්‍රීසි අකුරෙන්)</em></td>
            </tr>
          </table>

          <div style="display: flex; gap: 15px; margin-bottom: 8px;">
            <div style="flex: 1;">
              <strong>අයදුම්කරුගේ අත්සන:</strong>
              <div class="sig-box">
                ${app.signatureImage ? `<img src="${app.signatureImage}" style="max-height: 55px; max-width: 90%; object-fit: contain;">` : '<span style="font-size: 9pt; color: #888;">[ඩිජිටල් අත්සන]</span>'}
              </div>
              <div style="font-size: 8pt; text-align: center; margin-top: 2px;">(හවුල් ගිණුමක් වේනම් හවුල්කරුවන් සියල්ලන්ගේ අත්සන් කළ යුතුය)</div>
            </div>
          </div>

          <div style="font-size: 9.5pt; font-weight: bold; margin-top: 6px; margin-bottom: 4px; border-bottom: 1px solid #000; padding-bottom: 2px;">
            සේවාව සඳහා අදාළ වන නියමයන් හා කොන්දේසි මාලාව
          </div>
          <ol class="terms-list">
            <li>ලියාපදිංචි සාමාජිකයන්/ගනුදෙනුකරුවන් වෙත පුද්ගලික හඳුනාගැනීමේ අංකයක්/රහස් වචනයක් නිකුත් කරනු ලබන අතර එය අන් අයට අනාවරණය/අස්ථානගත කිරීමෙන් සිදුවන අලාභ සඳහා සමිතිය වගකියනු නොලැබේ.</li>
            <li>ජංගම බැංකුකරණ සේවා දුරකථන අංකය සමිතිය සමග ලියාපදිංචි කරනු ලබන දුරකථන අංකය වෙනස් කරනු ලබන්නේ නම් නව දුරකථන අංක සඳහා යළි ලියාපදිංචි විය යුතුය.</li>
            <li>ක්‍රියාපදවී දුරකථන අංක සහිත සිම් කාඩ්පත/දුරකථනය නැති වූවහොත් හෝ අස්ථානගත වූවහොත් ජංගම බැංකුකරණ සේවාව අත්හිටුවීමට හැකිවන පිණිස ඒ බව වහාම සමිතිය වෙත දැනුම් දීම සාමාජිකයාගේ/ගනුදෙනුකරුගේ වගකීම වේ. කුමන හේතුවක් මත හෝ ජංගම බැංකුකරණ සේවය තුළින් එම අංකය හෝ එම දුරකථනය භාවිතා කරමින් ගනුදෙනුකරුගේ ගිණුම් වල සිදුකර ඇති ගනු දෙනුවකින් හෝ ගිණුම් තොරතුරු ලබා ගැනීමකින්, ගනුදෙනුකරුට යම් හානියක් අලාභයක් හෝ පාඩුවක් සිදු උවහොත් එම උපකරණ අංකය සිම් කාඩ්පත නැති වූ බවට හෝ අන්ධා ලෙස පාවිච්චි කරන බවට කලින් දන්වා නොතිබූ අවස්ථාවල, මොනයම් ආකාරයකින්වත් සමිතිය වගකීමට බැඳී නැත.</li>
            <li>සාමාජිකයාට/ගනුදෙනුකරුට තම නමින් ඇති තමාට අයත් ගිණුම් අතර මුදල් හුවමාරු කිරීමේ හැකියාව ඇත. එසේ හුවමාරු කිරීමේ දී සමිතිය මගින් ගිණුමක පවත්වා ගත යුතු අවම ශේෂයන් හා පනවා ඇති අනෙකුත් නීති රීති හා රෙගුලාසි වලට යටත්ව සිදු කල යුතු අතර තෙවන පාර්ශවයන්ගේ ගිණුම් තුල හුවමාරු කිරීමට හැකියාවක් නොමැත.</li>
            <li>සාමාජිකයන්/ගනුදෙනුකරුවන් තම දුරකථන සේවා සපයන වෙත මෙම සේවාව ලබාගැනීම සඳහා සාමාන්‍ය ගාස්තු ගෙවීම් හිමි පරිදි කළ යුතු අතර සමිතිය එහි ගාස්තු ගෙවීම පිළිබඳව වගකීම භාරගනු නොලැබේ.</li>
            <li>ව්‍යාපාර වර්ධන තොරතුරු ඇතුලත් හෝ සමිතිය විසින් නිකුත් කරන වෙනත් සේවා පණිවිඩ ගනුදෙනුකරු වෙත විටින් විට ලැබෙනු ඇත. එම කෙටි පණිවිඩ සඳහා ගනුදෙනුකරුගෙන් ගාස්තු අය නොකරනු ලබන අතර, මෙම සේවාව සඳහා ක්‍රියාපදවී වීම මඟින් එවන් කෙටි පණිවිඩ ලබා ගැනීමට ගනුදෙනුකරු කැමැත්ත ප්‍රකාශ කරනු ලබයි.</li>
            <li>දුරකථන සිග්නල් නොමැතිව හේතුවෙන් හෝ වෙනත් මොනයම් හේතුවක් නිසා හෝ ගනුදෙනුකරුගේ දුරකථන සේවාව විසන්ධි කිරීම හේතුවෙන් කෙටි පණිවිඩ සේවාව ඇණසිටීමට නොහැකි වීම පිළිබඳව සමිතිය වග කියනු නොලැබේ.</li>
            <li>කුමන තත්වයක් යටතේ වුවද කෙටි පණිවිඩ නොලැබීම හේතුවෙන් දන්වා ඇති කරුණක් නොදැනුවත්ව සිටියායැයි ප්‍රකාශ කිරීමට නොහැකිය.</li>
            <li>මෙම සේවාව සමිතිය මඟින් සපයනු ලබන්නේ ඒ ඒ අවස්ථාවනුකූලව සේවාව ලබාදිය හැකි අයුරිනි. ඒ අනුව කලින් දැනුම් දීමකින් තොරව සේවාව සැපයීමේ බාධාවන් හෝ සේවා නොසැපයීම් නිසා ඇතිවිය හැකි අපහසුතාවයන් පිළිබඳව සමිතිය වගකීමට නොබැඳෙනු ඇත.</li>
            <li>මෙම සේවාව ශ්‍රී ලංකාවේ බලපැවැත්වෙන සියලු නීති රීති රෙගුලාසි සහ සමිතියේ ගනුදෙනු සඳහා යාවත් කාලීනව බලපැවැත්වෙන නියමයන් හා කොන්දේසි වලට යටත් වේ. කවර අවස්ථාවක හෝ මෙම සේවාව නතර කිරීමට සමිතියට පූර්ණ බලය ඇත.</li>
          </ol>
          <div style="text-align: right; font-size: 8pt; margin-top: 4px;">(පසුපිට බලන්න)</div>
        </div>

        <div class="page-break"></div>

        <!-- ================= PAGE 2 ================= -->
        <div class="sheet" style="padding-top: 10px;">
          <ol class="terms-list" start="11">
            <li>එක්ස්ප්‍රස් කෝප් ජංගම යෙදුම භාවිතා කරමින් විදුලි බිල්පත්, ජල බිල්පත්, දුරකථන බිල්පත් හා වෙනත් උපයෝගිතා බිල්පත් ගෙවීමේදී එම බිල්පත් සඳහා ගෙවන මුදල තමාගේ ගිණුමෙන් අඩු කර ගැනීමට සාමාජිකයා/ගිණුම් හිමියා එකඟතාවය දක්වන අතර එම මුදලට අමතරව එම බිල්පත් ගෙවීමේදී එම බිල්පත් සේවා සඳහා අදාළ සේවා ආයතන විසින් අයකිරීම් සිදු කරන්නේ නම් එම ගාස්තුද අඩු කරගැනීමට සාමාජිකයා එකඟ වේ.</li>
            <li>විදුලි බිල්පත්, ජල බිල්පත්, දුරකථන බිල්පත් හා වෙනත් උපයෝගිතා බිල්පත් ගෙවීමේදී එම ගෙවීම් සිදු කිරීමට අදාළ ආයතනය හා මුදල නිවැරදිව සඳහන් කර යෙදුම් මඟින් මුදල් ගනුදෙනු කළ යුතු අතර නොසැලකිලිමත්කම හෝ ප්‍රමාදදෝෂයන් සිදුවන අනෙකුත් ගෙවීම් සම්බන්ධයෙන් සමිතිය කිසිදු අයුරකින් වගකීමට බැඳී නැත.</li>
            <li>මෙම නියමයන් හා කොන්දේසි අලුතින් හඳුන්වා දීමට, වෙනස් කිරීමට, සංශෝධනය කිරීමට හෝ අත්හිටුවීමට සමිතියට පූර්ණ බලය ඇති අතර, එවන් වෙනස්කම් සිදුකිරීමෙන් පසු යෙදුම භාවිතා කිරීම මගින් එම වෙනස්කම් සඳහා එකඟතාවය පලකළ බවට සැලකේ.</li>
            <li>මෙම සේවාව සම්බන්ධයෙන් යම් ගැටලුවක් මතු වූ විට සමිතිය ගනුදෙනුකරු වෙත ලබාදෙන තීරණය අවසන් තීරණය වේ.</li>
          </ol>

          <div class="declaration" style="margin-top: 15px;">
            මම සමිතියේ පවත්වාගෙන යනු ලබන මගේ/අපගේ ගිණුම සඳහා ස්මාර්ට් කෝප් ජංගම දුරකථන යෙදුම සක්‍රිය කර දෙන ලෙස ඉල්ලා සිටින අතර, ඉහත සඳහන් සියලු නියමයන් හා කොන්දේසි මාලාව කියවා තේරුම් ගෙන ඊට පූර්ණ එකඟතාවය පළ කරමි.
          </div>

          <div style="display: flex; gap: 20px; margin-top: 15px; align-items: flex-end;">
            <div style="flex: 1;">
              <strong>අයදුම්කරුගේ අත්සන:</strong>
              <div class="sig-box">
                ${app.signatureImage ? `<img src="${app.signatureImage}" style="max-height: 55px; max-width: 90%; object-fit: contain;">` : '<span style="font-size: 9pt; color: #888;">[ඩිජිටල් අත්සන]</span>'}
              </div>
              <div style="font-size: 8.5pt; text-align: center; margin-top: 3px;">(හවුල් ගිණුමක් වේනම් හවුල්කරුවන් සියල්ලන්ගේ අත්සන් කළ යුතුය)</div>
            </div>
            <div style="flex: 1; border: 1px solid #000; padding: 10px; font-size: 9pt;">
              <strong>කාර්යාලීය භාවිතය සඳහා පමණි:</strong><br><br>
              තහවුරු කළ නිලධාරී අත්සන: .............................<br><br>
              සක්‍රිය කළ දිනය: .................... &nbsp;|&nbsp; තත්ත්වය: <strong>${safeStr(app.status || 'PENDING').toUpperCase()}</strong>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  window.viewApplicationDetails = (appId) => {
    const apps = window.bankStore.getMembershipApplications ? window.bankStore.getMembershipApplications() : [];
    const app = apps.find(a => a.id === appId);
    if (!app) return;

    const modal = document.getElementById('app-detail-modal');
    const refEl = document.getElementById('adm-app-ref');
    const subEl = document.getElementById('adm-app-submitted');
    const badgeEl = document.getElementById('adm-app-status-badge');
    const content = document.getElementById('adm-app-content');
    const approveBtn = document.getElementById('adm-app-approve-btn');
    const rejectBtn = document.getElementById('adm-app-reject-btn');
    const printBtn = document.getElementById('adm-app-print-btn');

    if (refEl) refEl.textContent = app.refId;
    if (subEl) subEl.textContent = `යොමු කළ දිනය: ${app.submittedAt}`;
    
    let badgeHtml = '';
    if (app.status === 'approved') {
      badgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">APPROVED</span>';
    } else if (app.status === 'rejected') {
      badgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">REJECTED</span>';
    } else {
      badgeHtml = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">PENDING REVIEW</span>';
    }
    if (badgeEl) badgeEl.innerHTML = badgeHtml;

    if (content) {
      content.innerHTML = `
        <!-- Section 1 -->
        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <h4 class="font-bold text-[#0B0D7C] text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-5 h-5 rounded bg-[#0B0D7C] text-white flex items-center justify-center text-[10px]">1</span>
            පුද්ගලික තොරතුරු (Personal Information)
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><span class="text-slate-500">සම්පූර්ණ නම:</span> <strong class="text-slate-900 block">${app.fullName}</strong></div>
            <div><span class="text-slate-500">මුලකුරු සමඟ නම:</span> <strong class="text-slate-900 block">${app.nameWithInitials}</strong></div>
            <div><span class="text-slate-500">ඉංග්‍රීසි නම (Capital):</span> <strong class="text-slate-900 block font-mono">${app.nameEnglishCaps}</strong></div>
            <div><span class="text-slate-500">ජාතික හැඳුනුම්පත් අංකය:</span> <strong class="text-slate-900 block font-mono">${app.nic}</strong></div>
            <div class="sm:col-span-2"><span class="text-slate-500">ස්ථිර ලිපිනය (Address):</span> <strong class="text-slate-900 block">${app.address}</strong></div>
            <div><span class="text-slate-500">නගරය (City):</span> <strong class="text-slate-900 block font-bold text-[#0B0D7C]">${app.city}</strong></div>
            <div><span class="text-slate-500">උපන් දිනය (DOB):</span> <strong class="text-slate-800 block">${app.dob}</strong></div>
            <div><span class="text-slate-500">ස්ත්‍රී / පුරුෂ භාවය:</span> <strong class="text-slate-800">${app.gender}</strong></div>
            <div><span class="text-slate-500">විවාහක / අවිවාහක බව:</span> <strong class="text-slate-800">${app.maritalStatus}</strong></div>
            <div><span class="text-slate-500">ආගම:</span> <strong class="text-slate-800">${app.religion}</strong></div>
            <div><span class="text-slate-500">ග්‍රාම නිලධාරී වසම:</span> <strong class="text-slate-900 block">${app.gnDivision}</strong></div>
            <div><span class="text-slate-500">දුරකථනය:</span> <strong class="text-slate-900 font-mono">${app.phone}</strong></div>
            <div><span class="text-slate-500">WhatsApp:</span> <strong class="text-slate-900 font-mono">${app.whatsapp}</strong></div>
            <div class="sm:col-span-2"><span class="text-slate-500">විද්‍යුත් තැපෑල (Email):</span> <strong class="text-slate-900">${app.email || '-'}</strong></div>
          </div>
        </div>

        <!-- Section 2 -->
        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <h4 class="font-bold text-[#0B0D7C] text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-5 h-5 rounded bg-[#0B0D7C] text-white flex items-center justify-center text-[10px]">2</span>
            පසු උරුමය (13 වන නියෝගය යටතේ නම් කිරීම)
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><span class="text-slate-500">පසු උරුමකරුගේ නම:</span> <strong class="text-slate-900 block">${app.nomineeName}</strong></div>
            <div><span class="text-slate-500">ජ.හැ. අංකය:</span> <strong class="text-slate-900 font-mono block">${app.nomineeNic} (${app.nomineeGender})</strong></div>
            <div><span class="text-slate-500">නෑදෑකම:</span> <strong class="text-slate-900 block">${app.nomineeRelationship}</strong></div>
          </div>
        </div>

        <!-- Section 3 -->
        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <h4 class="font-bold text-[#0B0D7C] text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-5 h-5 rounded bg-[#0B0D7C] text-white flex items-center justify-center text-[10px]">3</span>
            ව්‍යාපාරය හෝ රැකියාව පිළිබඳ තොරතුරු
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><span class="text-slate-500">ව්‍යාපාරයේ නම / රැකියාව:</span> <strong class="text-slate-900 block">${app.businessName || '-'} (${app.occupation || '-'})</strong></div>
            <div><span class="text-slate-500">ලිපිනය / දුරකථනය:</span> <strong class="text-slate-900 block">${app.businessAddress || '-'} | ${app.businessPhone || '-'}</strong></div>
          </div>
        </div>

        <!-- Section 4: Payment Verification -->
        <div class="bg-pink-50/50 rounded-2xl p-4 border border-pink-200">
          <h4 class="font-bold text-[#DF0178] text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-5 h-5 rounded bg-[#DF0178] text-white flex items-center justify-center text-[10px]">4</span>
            සාමාජික ගාස්තු තැන්පතුව (People's Bank Payment Verification)
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <div><span class="text-slate-500">ගෙවූ මුළු මුදල:</span> <strong class="text-emerald-700 text-base font-extrabold block">රු. ${Number(app.totalPaid || 6000).toLocaleString()}.00</strong></div>
              <div><span class="text-slate-500">කොටස් මුදල්:</span> <strong class="text-slate-800">රු. 5,000.00</strong></div>
              <div><span class="text-slate-500">ඉතුරුම් තැන්පතුව:</span> <strong class="text-slate-800">රු. 1,000.00</strong></div>
              <div><span class="text-slate-500">බැංකු ගිණුම:</span> <strong class="text-slate-800 font-mono">People's Bank - 124200110064754 (Nikaweratiya)</strong></div>
              <div><span class="text-slate-500">රිසිට්පත් / Ref අංකය:</span> <strong class="text-slate-900 font-mono block">${app.paymentRef || '-'}</strong></div>
            </div>
            <div>
              <span class="text-slate-500 block mb-1 font-bold">තැන්පතු රිසිට්පත (Uploaded Slip):</span>
              ${app.receiptImage ? `
                <div class="relative group">
                  <img src="${app.receiptImage}" class="max-h-40 rounded-xl border border-slate-300 shadow-sm object-contain bg-white">
                  <a href="${app.receiptImage}" target="_blank" class="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#DF0178] hover:underline">
                    <i class="fa-solid fa-up-right-from-square"></i> සම්පූර්ණ ප්‍රමාණයෙන් බලන්න (View Full)
                  </a>
                </div>
              ` : '<p class="text-slate-400">රිසිට්පතක් උඩුගත කර නැත.</p>'}
            </div>
          </div>
        </div>

        <!-- Section 5: Signature -->
        <div class="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 class="font-bold text-[#0B0D7C] text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
              <span class="w-5 h-5 rounded bg-[#0B0D7C] text-white flex items-center justify-center text-[10px]">5</span>
              අයදුම්කරුගේ ඩිජිටල් අත්සන (Digital E-Signature)
            </h4>
            <p class="text-[11px] text-slate-500">නීත්‍යානුකූල ප්‍රකාශය පිළිගෙන අයදුම්කරු විසින් තබන ලද අත්සන</p>
          </div>
          <div class="bg-white p-2 rounded-xl border border-indigo-100 shadow-sm">
            ${app.signatureImage ? `
              <img src="${app.signatureImage}" class="max-h-16 max-w-xs object-contain">
            ` : '<span class="text-slate-400 text-xs italic">අත්සනක් නැත</span>'}
          </div>
        </div>

        <!-- Section 6: Committee Recommendation (For Print / Manager Approval) -->
        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-300">
          <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            <span class="w-5 h-5 rounded bg-slate-800 text-white flex items-center justify-center text-[10px]">6</span>
            කාරක සභා නිර්දේශය (Committee Recommendation)
          </h4>
          <p class="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 mb-3">
            .................................................................... දින පැවති කාරක සභා රැස්වීමේදී සලකා බලා සාමාජිකත්වය ලබා දීමට සුදුසුකම් ඇති අයෙකු බැවින් ඊළඟ මහාසභා රැස්වීමට ඉදිරිපත් කිරීමට තීරණය කරන ලදි. (කාරක සභා වාර්තා පොතේ අංක ................ දරන පිටුව)
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div class="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
              <span class="text-slate-500 block text-[10px] mb-1">දිනය (Date)</span>
              <strong class="text-slate-800 font-mono">[ D | D ] [ M | M ] [ Y | Y | Y | Y ]</strong>
            </div>
            <div class="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
              <span class="text-slate-500 block text-[10px] mb-2">ගරු සභාපති අත්සන</span>
              <div class="border-b border-dashed border-slate-400 h-6"></div>
            </div>
            <div class="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
              <span class="text-slate-500 block text-[10px] mb-2">ගරු ලේකම් අත්සන</span>
              <div class="border-b border-dashed border-slate-400 h-6"></div>
            </div>
          </div>
        </div>

        <!-- Section 7: General Assembly Recommendation (For Print / Manager Approval) -->
        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-300">
          <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            <span class="w-5 h-5 rounded bg-slate-800 text-white flex items-center justify-center text-[10px]">7</span>
            මහා සභා නිර්දේශය (General Assembly / AGM Decision)
          </h4>
          <p class="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 mb-3">
            .................................................................... දින පැවති මහා සභා රැස්වීමේදී සලකා බලා සාමාජිකත්වය ලබා දීමට තීරණය කරන ලදි. (මහාසභා වාර්තා පොතේ අංක ................ දරන පිටුව)
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div class="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
              <span class="text-slate-500 block text-[10px] mb-1">දිනය (Date)</span>
              <strong class="text-slate-800 font-mono">[ D | D ] [ M | M ] [ Y | Y | Y | Y ]</strong>
            </div>
            <div class="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
              <span class="text-slate-500 block text-[10px] mb-2">ගරු සභාපති අත්සන</span>
              <div class="border-b border-dashed border-slate-400 h-6"></div>
            </div>
            <div class="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
              <span class="text-slate-500 block text-[10px] mb-2">ගරු ලේකම් අත්සන</span>
              <div class="border-b border-dashed border-slate-400 h-6"></div>
            </div>
          </div>
        </div>
      `;
    }

    if (approveBtn) {
      approveBtn.onclick = () => {
        window.setAppStatus(app.id, 'approved');
        window.closeAppDetailModal();
      };
    }
    if (rejectBtn) {
      rejectBtn.onclick = () => {
        window.setAppStatus(app.id, 'rejected');
        window.closeAppDetailModal();
      };
    }
    if (printBtn) {
      printBtn.onclick = () => {
        window.printAdminApplication(app);
      };
    }

    if (modal) {
      modal.classList.remove('hidden');
    }
  };

  window.closeAppDetailModal = () => {
    const modal = document.getElementById('app-detail-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.setAppStatus = (id, newStatus) => {
    window.bankStore.updateMembershipApplicationStatus(id, newStatus);
    renderApplicationsTable();
    renderOverview();
    showAdminToast(`අයදුම්පතේ තත්වය ${safeStr(newStatus).toUpperCase()} ලෙස යාවත්කාලීන විය.`);
  };

  window.deleteAppConfirm = (id) => {
    if (confirm('මෙම සාමාජික අයදුම්පත මකාදැමීමට අවශ්‍ය බව තහවුරු කරන්න?')) {
      window.bankStore.deleteMembershipApplication(id);
      renderApplicationsTable();
      renderOverview();
      showAdminToast('අයදුම්පත මකාදමන ලදී.');
    }
  };

  window.printAdminApplication = (app) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>සාමාජික අයදුම් පත්‍රය - ${app.refId}</title>
        <meta charset="utf-8">
        <style>
          @page {
            size: A4 portrait;
            margin: 7mm 9mm 7mm 9mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Segoe UI', Arial, 'Noto Sans Sinhala', 'Iskoola Pota', sans-serif;
            color: #000000;
            background: #ffffff;
            margin: 0;
            padding: 10px 15px;
            font-size: 10.5px;
            line-height: 1.35;
          }
          .sheet {
            max-width: 192mm;
            margin: 0 auto;
          }
          .no-print {
            text-align: right;
            margin-bottom: 12px;
          }
          .btn-print {
            padding: 7px 18px;
            background: #000000;
            color: #ffffff;
            border: 1px solid #000;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; break-before: page; }
          }
          .header-grid {
            display: grid;
            grid-template-columns: 1fr 180px;
            gap: 10px;
            align-items: start;
            border-bottom: 1.5px solid #000000;
            padding-bottom: 6px;
            margin-bottom: 6px;
          }
          .bank-title {
            font-size: 14px;
            font-weight: bold;
            color: #000000;
            line-height: 1.25;
          }
          .bank-sub {
            font-size: 9.5px;
            color: #111111;
            margin-top: 2px;
          }
          .doc-title {
            font-size: 13px;
            font-weight: bold;
            text-decoration: underline;
            margin-top: 5px;
            letter-spacing: 0.5px;
          }
          .bank-use-box {
            border: 1.5px solid #000000;
            padding: 4px 6px;
            font-size: 9px;
            background: #ffffff;
            line-height: 1.3;
          }
          .bank-use-title {
            font-weight: bold;
            text-align: center;
            border-bottom: 1px solid #000000;
            padding-bottom: 2px;
            margin-bottom: 3px;
            font-size: 9.5px;
          }
          .section-bar {
            background: #000000 !important;
            color: #ffffff !important;
            font-weight: bold;
            font-size: 10px;
            padding: 2.5px 6px;
            margin-top: 6px;
            margin-bottom: 3px;
            letter-spacing: 0.3px;
          }
          table.app-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 3px;
          }
          table.app-table th, table.app-table td {
            border: 1px solid #000000;
            padding: 3px 5px;
            vertical-align: middle;
          }
          table.app-table th {
            background: #f2f2f2 !important;
            font-weight: bold;
            text-align: left;
            width: 32%;
          }
          .declaration-box {
            border: 1px solid #000000;
            padding: 5px 7px;
            margin-top: 4px;
            font-size: 9.5px;
          }
          .recom-box {
            border: 1px solid #000000;
            padding: 5px 7px;
            margin-top: 5px;
            font-size: 9.5px;
          }
          .recom-title {
            font-weight: bold;
            font-size: 10.5px;
            border-bottom: 1px solid #000000;
            padding-bottom: 2px;
            margin-bottom: 4px;
          }
          .date-box-wrap {
            display: inline-flex;
            gap: 1px;
            vertical-align: middle;
            margin-left: 4px;
          }
          .d-cell {
            display: inline-block;
            width: 12px;
            height: 14px;
            border: 1px solid #000000;
            text-align: center;
            font-size: 8.5px;
            line-height: 14px;
            font-family: monospace;
            font-weight: bold;
          }
          .sig-line {
            border-top: 1px dashed #000000;
            margin-top: 26px;
            padding-top: 2px;
            font-size: 9.5px;
            font-weight: bold;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">A4 Black & White මුද්‍රණය කරන්න (Print Form)</button>
        </div>

        <div class="sheet">
          <!-- TOP HEADER -->
          <div class="header-grid">
            <div>
              <div class="bank-title">සීමා රහිත ගලපිටියාගම සකසුරුවම් හා ණය ගනුදෙනු පිළිබඳ සමූපකාර සමිතිය</div>
              <div class="bank-sub">1972 අංක 5 දරන සමූපකාර සමිති පනත යටතේ ලියාපදිංචි අංක: කුලි/395 | ගලපිටියාගම, නිකවැරටිය</div>
              <div class="doc-title">සාමාජික අයදුම් පත්‍රය (MEMBERSHIP APPLICATION FORM)</div>
              <div style="font-size: 9.5px; margin-top: 3px;">
                <strong>යොමු අංකය:</strong> <span style="font-family: monospace; font-weight: bold;">${app.refId}</span> &nbsp;|&nbsp;
                <strong>අයදුම් කළ දිනය:</strong> <span>${app.submittedAt}</span> &nbsp;|&nbsp;
                <strong>තත්ත්වය:</strong> <span style="font-weight: bold;">${safeStr(app.status || 'PENDING').toUpperCase()}</span>
              </div>
            </div>

            <!-- Top Right: Bank Use Box -->
            <div class="bank-use-box">
              <div class="bank-use-title">කාර්යාලීය ප්‍රයෝජනය සඳහා පමණි</div>
              <div>සාමාජික අංකය: ....................</div>
              <div>ගිණුම් අංකය: .........................</div>
              <div>ඇතුළත් කළේ: .........................</div>
              <div>කළමනාකරු: .........................</div>
            </div>
          </div>

          <!-- SECTION 1 -->
          <div class="section-bar">1. පුද්ගලික තොරතුරු (PERSONAL INFORMATION)</div>
          <table class="app-table">
            <tr>
              <th>සම්පූර්ණ නම (සිංහලෙන්)</th>
              <td colspan="3"><strong>${app.fullName}</strong></td>
            </tr>
            <tr>
              <th>මුලකුරු සමඟ නම (සිංහලෙන්)</th>
              <td colspan="3">${app.nameWithInitials}</td>
            </tr>
            <tr>
              <th>මුලකුරු සමඟ නම (ඉංග්‍රීසි කැපිටල්)</th>
              <td colspan="3" style="font-family: monospace; font-weight: bold;">${app.nameEnglishCaps}</td>
            </tr>
            <tr>
              <th>ජාතික හැඳුනුම්පත් අංකය (NIC)</th>
              <td style="font-family: monospace; font-weight: bold;">${app.nic}</td>
              <th style="width: 25%;">ස්ත්‍රී / පුරුෂ භාවය</th>
              <td>${app.gender}</td>
            </tr>
            <tr>
              <th>ස්ථිර ලිපිනය (Address)</th>
              <td colspan="3"><strong>${app.address}</strong></td>
            </tr>
            <tr>
              <th>නගරය (City)</th>
              <td><strong>${app.city}</strong></td>
              <th>උපන් දිනය (DOB)</th>
              <td>${app.dob}</td>
            </tr>
            <tr>
              <th>විවාහක / අවිවාහක බව</th>
              <td>${app.maritalStatus}</td>
              <th>ආගම</th>
              <td>${app.religion}</td>
            </tr>
            <tr>
              <th>ග්‍රාම නිලධාරී වසම</th>
              <td>${app.gnDivision}</td>
              <th>විද්‍යුත් තැපෑල (Email)</th>
              <td>${app.email || '-'}</td>
            </tr>
            <tr>
              <th>දුරකථන අංකය</th>
              <td style="font-family: monospace;">${app.phone}</td>
              <th>WhatsApp අංකය</th>
              <td style="font-family: monospace;">${app.whatsapp}</td>
            </tr>
          </table>

          <!-- SECTION 2 -->
          <div class="section-bar">2. පසු උරුමය සම්බන්ධ තොරතුරු (13 වන නියෝගය යටතේ නම් කිරීම)</div>
          <table class="app-table">
            <tr>
              <th>පසු උරුමකරුගේ සම්පූර්ණ නම</th>
              <td colspan="3">${app.nomineeName}</td>
            </tr>
            <tr>
              <th>ජාතික හැඳුනුම්පත් අංකය</th>
              <td style="font-family: monospace;">${app.nomineeNic}</td>
              <th style="width: 25%;">ස්ත්‍රී / පුරුෂ භාවය</th>
              <td>${app.nomineeGender}</td>
            </tr>
            <tr>
              <th>අයදුම්කරුට ඇති නෑදෑකම</th>
              <td colspan="3"><strong>${app.nomineeRelationship}</strong></td>
            </tr>
          </table>

          <!-- SECTION 3 -->
          <div class="section-bar">3. ව්‍යාපාරය හෝ රැකියාව පිළිබඳ තොරතුරු</div>
          <table class="app-table">
            <tr>
              <th>ව්‍යාපාරයේ නම / රැකියාව</th>
              <td>${app.businessName || '-'} (${app.occupation || '-'})</td>
              <th style="width: 20%;">දුරකථන අංකය</th>
              <td>${app.businessPhone || '-'}</td>
            </tr>
            <tr>
              <th>සේවා ස්ථානයේ ලිපිනය</th>
              <td colspan="3">${app.businessAddress || '-'}</td>
            </tr>
          </table>

          <!-- SECTION 4: APPLICANT DECLARATION & SIGNATURE -->
          <div class="section-bar">4. අයදුම්කරුගේ ප්‍රකාශය සහ අත්සන (DECLARATION & SIGNATURE)</div>
          <div class="declaration-box">
            <div style="text-align: justify; margin-bottom: 5px;">
              "ඉහත සඳහන් සියලු විස්තර සත්‍ය හා නිවැරදි බවට සහතික කරන මා හට මෙම සමිතියේ සාමාජිකත්වය ලබාදෙන මෙන් ඉල්ලා සිටිමි. සමිතියේ අතුරු ව්‍යවස්ථාවන්ට හා නීති රීති වලට එකඟව කටයුතු කිරීමටත්, සාමාජික කොටස් මුදල් (රු. 5,000/-) හා සාමාජික ඉතුරුම් තැන්පතුව (රු. 1,000/-) තැන්පත් කර ඇති බවත් මෙයින් සහතික කර ප්‍රකාශ කරමි."
            </div>
            <table style="width: 100%; border: none; margin-top: 4px;">
              <tr>
                <td style="border: none; width: 45%; vertical-align: bottom;">
                  <div><strong>දිනය:</strong> ${app.submittedAt}</div>
                  <div style="font-size: 8.5px; color: #333; margin-top: 3px;">(ඩිජිටල් ක්‍රමවේදය ඔස්සේ ඉදිරිපත් කරන ලදි)</div>
                </td>
                <td style="border: none; width: 55%; text-align: center; vertical-align: bottom;">
                  <div style="min-height: 38px; display: flex; align-items: center; justify-content: center;">
                    ${app.signatureImage ? `<img src="${app.signatureImage}" style="max-height: 38px; max-width: 170px; filter: grayscale(100%) contrast(150%);">` : '<span style="font-style: italic;">[ ඩිජිටල් අත්සන ඇතුළත් කර ඇත ]</span>'}
                  </div>
                  <div style="border-top: 1px solid #000; padding-top: 2px; font-weight: bold; font-size: 9.5px;">අයදුම්කරුගේ අත්සන</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- SECTION 5: කාරක සභා නිර්දේශය -->
          <div class="recom-box">
            <div class="recom-title">■ කාරක සභා නිර්දේශය</div>
            <div style="text-align: justify; line-height: 1.35;">
              ........................................................................................................ දින පැවති කාරක සභා රැස්වීමේදී සලකා බලා සාමාජිකත්වය ලබා දීමට සුදුසුකම් ඇති අයෙකු බැවින් ඊළඟ මහාසභා රැස්වීමට ඉදිරිපත් කිරීමට තීරණය කරන ලදි. (කාරක සභා වාර්තා පොතේ අංක ................ දරන පිටුව)
            </div>
            <table style="width: 100%; border: none; margin-top: 6px;">
              <tr>
                <td style="border: none; width: 34%; vertical-align: bottom;">
                  <strong>දිනය :</strong>
                  <span class="date-box-wrap">
                    <span class="d-cell">D</span><span class="d-cell">D</span>
                    <span style="font-size: 9px; line-height: 14px;">/</span>
                    <span class="d-cell">M</span><span class="d-cell">M</span>
                    <span style="font-size: 9px; line-height: 14px;">/</span>
                    <span class="d-cell">2</span><span class="d-cell">0</span><span class="d-cell">&nbsp;</span><span class="d-cell">&nbsp;</span>
                  </span>
                </td>
                <td style="border: none; width: 33%; text-align: center; vertical-align: bottom;">
                  <div class="sig-line">ගරු සභාපති</div>
                </td>
                <td style="border: none; width: 33%; text-align: center; vertical-align: bottom;">
                  <div class="sig-line">ගරු ලේකම්</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- SECTION 6: මහා සභා නිර්දේශය -->
          <div class="recom-box">
            <div class="recom-title">■ මහා සභා නිර්දේශය</div>
            <div style="text-align: justify; line-height: 1.35;">
              ........................................................................................................ දින පැවති මහා සභා රැස්වීමේදී සලකා බලා සාමාජිකත්වය ලබා දීමට තීරණය කරන ලදි. (මහාසභා වාර්තා පොතේ අංක ................ දරන පිටුව)
            </div>
            <table style="width: 100%; border: none; margin-top: 6px;">
              <tr>
                <td style="border: none; width: 34%; vertical-align: bottom;">
                  <strong>දිනය :</strong>
                  <span class="date-box-wrap">
                    <span class="d-cell">D</span><span class="d-cell">D</span>
                    <span style="font-size: 9px; line-height: 14px;">/</span>
                    <span class="d-cell">M</span><span class="d-cell">M</span>
                    <span style="font-size: 9px; line-height: 14px;">/</span>
                    <span class="d-cell">2</span><span class="d-cell">0</span><span class="d-cell">&nbsp;</span><span class="d-cell">&nbsp;</span>
                  </span>
                </td>
                <td style="border: none; width: 33%; text-align: center; vertical-align: bottom;">
                  <div class="sig-line">ගරු සභාපති</div>
                </td>
                <td style="border: none; width: 33%; text-align: center; vertical-align: bottom;">
                  <div class="sig-line">ගරු ලේකම්</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- ================= PAGE 2: PAYMENT VERIFICATION ================= -->
          <div class="page-break" style="margin-top: 15px;"></div>

          <div style="border-bottom: 1.5px solid #000; padding-bottom: 5px; margin-bottom: 8px;">
            <div class="bank-title">සීමා රහිත ගලපිටියාගම සකසුරුවම් හා ණය ගනුදෙනු පිළිබඳ සමූපකාර සමිතිය</div>
            <div class="doc-title" style="margin-top: 2px;">සාමාජික ගාස්තු තැන්පතු තහවුරු කිරීමේ ලේඛනය (PAYMENT SLIP PROOF)</div>
            <div style="font-size: 9.5px; margin-top: 2px;">යොමු අංකය: <strong>${app.refId}</strong> &nbsp;|&nbsp; අයදුම්කරු: <strong>${app.fullName}</strong> (${app.nic})</div>
          </div>

          <table class="app-table" style="margin-bottom: 8px;">
            <tr>
              <th style="width: 32%;">සාමාජික කොටස් මුදල්</th>
              <td>රු. 5,000.00</td>
              <th style="width: 25%;">සාමාජික ඉතුරුම් තැන්පතුව</th>
              <td>රු. 1,000.00</td>
            </tr>
            <tr>
              <th>තැන්පත් කළ සම්පූර්ණ මුදල</th>
              <td colspan="3"><strong style="font-size: 11px;">රු. ${Number(app.totalPaid || 6000).toLocaleString()}.00</strong></td>
            </tr>
            <tr>
              <th>තැන්පත් කළ බැංකු ගිණුම</th>
              <td colspan="3">People's Bank (මහජන බැංකුව) - ගිණුම් අංකය: <strong>124200110064754</strong> (නිකවැරටිය ශාඛාව)</td>
            </tr>
            <tr>
              <th>බැංකු රිසිට්පත් / Ref අංකය</th>
              <td colspan="3"><strong style="font-family: monospace;">${app.paymentRef || '-'}</strong></td>
            </tr>
          </table>

          <div style="border: 1px solid #000; padding: 8px; text-align: center; margin-bottom: 12px; background: #fafafa;">
            <div style="font-weight: bold; font-size: 10px; margin-bottom: 6px; text-align: left;">අයදුම්කරු විසින් උඩුගත කළ බැංකු තැන්පතු පත්‍රිකාව (Uploaded Slip Image):</div>
            ${app.receiptImage ? `
              <img src="${app.receiptImage}" style="max-height: 180mm; max-width: 100%; border: 1px solid #000; object-contain; filter: contrast(110%);">
            ` : '<div style="padding: 40px; font-style: italic; color: #555;">බැංකු රිසිට්පතක් උඩුගත කර නොමැත.</div>'}
          </div>

          <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 10px;">
            <tr>
              <td style="border: 1px solid #000; width: 50%; padding: 8px; vertical-align: top;">
                <strong>මුදල් ලැබීම හා රිසිට්පත පරීක්ෂා කළේ:</strong><br><br>
                අත්සන: ................................................................<br>
                නම / තනතුර: ....................................................<br>
                දිනය: ....................................................................
              </td>
              <td style="border: 1px solid #000; width: 50%; padding: 8px; vertical-align: top;">
                <strong>කළමනාකරුගේ අනුමැතිය (Manager's Sign-Off):</strong><br><br>
                අත්සන: ................................................................<br>
                සටහන: ................................................................<br>
                දිනය: ....................................................................
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
  };
  // ============================================================
  // --- FEEDBACK MANAGEMENT ---
  // ============================================================

  function renderFeedbackTable() {
    try {
      const allFeedbacks = window.bankStore.getFeedbacks ? window.bankStore.getFeedbacks() : [];
      const tbody = document.getElementById('admin-fb-table-body');
      if (!tbody) return;

      const filtered = currentFbFilter === 'all'
        ? allFeedbacks
        : allFeedbacks.filter(f => safeStr(f.status) === currentFbFilter);

      // Update sidebar badge (pending count)
      const pendingFbs = allFeedbacks.filter(f => safeStr(f.status) === 'pending');
      const badgeEl = document.getElementById('sidebar-fb-badge');
      if (badgeEl) badgeEl.textContent = pendingFbs.length;

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="py-6 text-center text-slate-400 text-xs">ප්‍රතිපෝෂණ කිසිවක් ලැබී නොමැත.</td></tr>';
        return;
      }

      const starHtml = (rating) => {
        const r = safeNum(rating, 5);
        return [1,2,3,4,5].map(s =>
          `<i class="${s <= r ? 'fa-solid' : 'fa-regular'} fa-star text-yellow-400"></i>`
        ).join('');
      };

      const statusBadge = (status, published) => {
        if (published) return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">Published</span>';
        const st = safeStr(status).toLowerCase();
        if (st === 'approved') return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Approved</span>';
        if (st === 'rejected') return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Rejected</span>';
        return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Pending</span>';
      };

      tbody.innerHTML = filtered.map(f => `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="py-3 px-4">
            <div class="font-bold text-slate-900">${safeStr(f.name)}</div>
            <div class="text-[11px] text-slate-400">${safeStr(f.village)} &bull; ${safeStr(f.phone)}</div>
          </td>
          <td class="py-3 px-4 text-sm">${starHtml(f.rating)} <span class="text-[11px] text-slate-400 ml-1">(${safeNum(f.rating, 5)}/5)</span></td>
          <td class="py-3 px-4 text-slate-600 text-[11px]">${safeStr(f.service) || '-'}</td>
          <td class="py-3 px-4 max-w-xs">
            <p class="text-slate-700 text-[11px] line-clamp-2 italic">"${safeStr(f.message)}"</p>
          </td>
          <td class="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">${safeStr(f.submittedAt) || '-'}</td>
          <td class="py-3 px-4 text-center">
            ${f.publishedAsTestimonial
              ? '<i class="fa-solid fa-check-circle text-indigo-500 text-base" title="ප්‍රකාශිත"></i>'
              : '<i class="fa-regular fa-circle text-slate-300 text-base"></i>'
            }
          </td>
          <td class="py-3 px-4">${statusBadge(f.status, f.publishedAsTestimonial)}</td>
          <td class="py-3 px-4 text-right whitespace-nowrap space-x-1">
            ${!f.publishedAsTestimonial ? `
            <button onclick="window.approveFeedback('${f.id}')" class="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50" title="Approve">
              <i class="fa-solid fa-check"></i>
            </button>
            <button onclick="window.publishFeedbackAsTestimonial('${f.id}')" class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50" title="Publish as Testimonial">
              <i class="fa-solid fa-star"></i>
            </button>
            <button onclick="window.rejectFeedback('${f.id}')" class="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50" title="Reject">
              <i class="fa-solid fa-ban"></i>
            </button>
            ` : ''}
            <button onclick="window.deleteFeedbackConfirm('${f.id}')" class="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error in renderFeedbackTable:', err);
    }
  }

  window.setFbFilter = function(filter) {
    currentFbFilter = filter;
    document.querySelectorAll('.fb-filter-btn').forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      const isActive = onclickAttr.includes(`'${filter}'`) || onclickAttr.includes(`"${filter}"`);
      btn.className = isActive
        ? 'fb-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0B0D7C] text-white'
        : 'fb-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200';
    });
    renderFeedbackTable();
  };

  window.approveFeedback = function(id) {
    window.bankStore.updateFeedbackStatus(id, 'approved');
    renderFeedbackTable();
    showAdminToast('ප්‍රතිපෝෂණය අනුමත කරන ලදී.');
  };

  window.rejectFeedback = function(id) {
    window.bankStore.updateFeedbackStatus(id, 'rejected');
    renderFeedbackTable();
    showAdminToast('ප්‍රතිපෝෂණය ප්‍රතික්ෂේප කරන ලදී.');
  };

  window.publishFeedbackAsTestimonial = function(id) {
    if (confirm('මෙම ප්‍රතිපෝෂණය "සාමාජිකයින්ගේ සාර්ථකත්වයේ කතා" කොටසේ ප්‍රකාශිත කිරීමට අවශ්‍ය බව තහවුරු කරන්න?')) {
      window.bankStore.publishFeedbackAsTestimonial(id);
      renderFeedbackTable();
      showAdminToast('ප්‍රතිපෝෂණය ප්‍රකාශිත කරන ලදී! දැන් වෙබ් අඩවියේ testimonials කොටසේ දිස්වේ.');
    }
  };

  window.deleteFeedbackConfirm = function(id) {
    if (confirm('මෙම ප්‍රතිපෝෂණය ස්ථිරවශයෙන් මකා දැමීමට අවශ්‍ය බව තහවුරු කරන්න?')) {
      window.bankStore.deleteFeedback(id);
      renderFeedbackTable();
      showAdminToast('ප්‍රතිපෝෂණය මකාදමන ලදී.');
    }
  };

  // --- Initialize Auth & Dashboard AFTER all functions, tables & window methods are registered ---
  setupAuthForm();
  checkAuth();

});
