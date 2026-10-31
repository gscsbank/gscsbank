// app.js - Main Client Application for Galapitiyagama Sanasa Bank
document.addEventListener('DOMContentLoaded', () => {
  let currentLang = localStorage.getItem('GSCS_LANG') || 'si';
  let activeCategory = 'all';
  let heroSlideTimer = null;
  let currentHeroIdx = 0;
  let statsAlreadyAnimated = false;

  // Initialize
  initApp();

  function initApp() {
    const steps = [
      ['renderUrgentNotice', renderUrgentNotice],
      ['renderHeroSlider', renderHeroSlider],
      ['renderVisionMission', renderVisionMission],
      ['renderQuickStats', renderQuickStats],
      ['renderProducts', renderProducts],
      ['renderRates', renderRates],
      ['renderNews', renderNews],
      ['renderPartners', renderPartners],
      ['renderTestimonials', renderTestimonials],
      ['renderBranches', renderBranches],
      ['initCalculators', initCalculators],
      ['setupEventListeners', setupEventListeners],
      ['setupScrollReveal', setupScrollReveal]
    ];

    const errorLog = [];
    steps.forEach(([name, fn]) => {
      try {
        fn();
      } catch (err) {
        console.error(`Error in ${name}:`, err);
        errorLog.push(`${name}: ${err.message}\n${err.stack}`);
      }
    });

    if (errorLog.length > 0) {
      const dbg = document.createElement('div');
      dbg.id = 'debug-error-log';
      dbg.style.display = 'none';
      dbg.textContent = errorLog.join('\n---\n');
      document.body.appendChild(dbg);
    }

    // Listen for data updates from store (e.g. if updated via admin or sync)
    window.addEventListener('bankDataUpdated', () => {
      try { renderUrgentNotice(); } catch(e) {}
      try { renderHeroSlider(); } catch(e) {}
      try { renderQuickStats(); } catch(e) {}
      try { renderProducts(); } catch(e) {}
      try { renderRates(); } catch(e) {}
      try { renderNews(); } catch(e) {}
      try { renderBranches(); } catch(e) {}
    });

    // Auto-fetch latest news & content from Google Sheets cloud on page load
    // This ensures every visitor sees the latest admin-published content
    if (window.bankStore && window.bankStore.fetchFromAppsScript) {
      window.bankStore.fetchFromAppsScript().catch(() => {});
    }
  }

  // --- Helpers ---
  function formatLKR(val) {
    return 'රු. ' + Number(val).toLocaleString('en-LK', { maximumFractionDigits: 2 });
  }

  function toggleLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('GSCS_LANG', lang);
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    renderUrgentNotice();
    renderHeroSlider();
    renderVisionMission();
    renderProducts();
    renderRates();
    renderNews();
    renderBranches();
  }

  // --- Vision & Mission Multi-language ---
  function renderVisionMission() {
    const vTitle = document.getElementById('vm-vision-title');
    const vDesc = document.getElementById('vm-vision-desc');
    const mTitle = document.getElementById('vm-mission-title');
    const mDesc = document.getElementById('vm-mission-desc');

    if (currentLang === 'en') {
      if (vTitle) vTitle.textContent = 'Our Vision';
      if (vDesc) vDesc.textContent = '"Build a Better World"';
      if (mTitle) mTitle.textContent = 'Our Mission';
      if (mDesc) mDesc.textContent = '"Empowering members within the operational area economically and socially while ensuring environmental sustainability."';
    } else {
      if (vTitle) vTitle.textContent = 'අපගේ දැක්ම';
      if (vDesc) vDesc.textContent = '"වඩා යහපත් ලොවක් ගොඩනැගීම"';
      if (mTitle) mTitle.textContent = 'අපගේ මෙහෙවර';
      if (mDesc) mDesc.textContent = '"පරිසර තිරසාරභාවය සහතික කරමින්, අපගේ බලප්‍රදේශයේ සාමාජිකයින් ආර්ථික හා සමාජීය වශයෙන් සවිබල ගැන්වීම."';
    }
  }

  // --- Urgent Notice Banner ---
  function renderUrgentNotice() {
    const bankInfo = window.bankStore.getBankInfo();
    const ticker = document.getElementById('urgent-notice-ticker');
    const container = document.getElementById('urgent-notice-container');
    if (!ticker || !container) return;

    if (bankInfo.urgentNoticeActive && bankInfo.urgentNotice) {
      container.classList.remove('hidden');
      const text = currentLang === 'en' ? (bankInfo.urgentNoticeEn || bankInfo.urgentNotice) : bankInfo.urgentNotice;
      ticker.innerHTML = `
        <span class="urgent-ticker-content inline-flex items-center gap-2 font-medium text-pink-950">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-[#DF0178] animate-ping flex-shrink-0"></span>
          <strong class="text-[#0B0D7C] flex-shrink-0">${currentLang === 'en' ? 'BANK NOTICE:' : 'විශේෂ නිවේදනය:'}</strong>
          <span class="urgent-notice-text flex-shrink-0">${text}</span>
        </span>
      `;
    } else {
      container.classList.add('hidden');
    }
  }

  // --- Hero Slider ---
  function renderHeroSlider() {
    const slides = window.bankStore.getHeroSlides();
    const container = document.getElementById('hero-slider-wrapper');
    const dotsContainer = document.getElementById('hero-dots');
    if (!container || !slides || slides.length === 0) return;

    container.innerHTML = slides.map((slide, idx) => {
      const title = currentLang === 'en' ? (slide.titleEn || slide.title) : slide.title;
      const desc = currentLang === 'en' ? (slide.descEn || slide.desc) : slide.desc;
      const badge = currentLang === 'en' ? (slide.badgeEn || slide.badge) : slide.badge;
      const cta = currentLang === 'en' ? (slide.ctaTextEn || slide.ctaText) : slide.ctaText;

      return `
        <div class="hero-slide ${idx === currentHeroIdx ? 'active' : ''}" data-index="${idx}">
          <div class="hero-bg" style="background-image: url('${slide.bgImage}'); background-position: ${slide.bgPosition || '65% center'};"></div>
          <div class="hero-overlay"></div>
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center relative z-10">
            <div class="max-w-2xl text-white pt-10 pb-20">
              <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#DF0178] text-white mb-4 shadow-lg">
                <i class="fa-solid fa-star text-amber-300"></i> ${badge}
              </span>
              <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4 text-white drop-shadow-md">
                ${title}
              </h1>
              <p class="text-base sm:text-lg text-slate-200 mb-8 leading-relaxed max-w-xl">
                ${desc}
              </p>
              <div class="flex flex-wrap gap-4 items-center">
                <a href="${slide.ctaLink}" class="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#DF0178] to-[#BA0063] hover:from-[#BA0063] hover:to-[#DF0178] text-white shadow-xl shadow-pink-900/30 transition-all transform hover:-translate-y-0.5">
                  <span>${cta}</span>
                  <i class="fa-solid fa-arrow-right text-xs"></i>
                </a>
                <button onclick="window.openInquiryModal('${slide.title}')" class="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all">
                  <i class="fa-solid fa-paper-plane text-pink-400"></i>
                  <span>${currentLang === 'en' ? 'Inquire Online' : 'විමසීම් කරන්න'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (dotsContainer) {
      dotsContainer.innerHTML = slides.map((_, idx) => `
        <button class="w-3 h-3 rounded-full transition-all ${idx === currentHeroIdx ? 'bg-[#DF0178] w-8' : 'bg-white/50 hover:bg-white'}" onclick="window.jumpToHeroSlide(${idx})"></button>
      `).join('');
    }

    startHeroAutoSlide(slides.length);
  }

  function startHeroAutoSlide(total) {
    if (heroSlideTimer) clearInterval(heroSlideTimer);
    heroSlideTimer = setInterval(() => {
      currentHeroIdx = (currentHeroIdx + 1) % total;
      updateActiveSlide();
    }, 6500);
  }

  function updateActiveSlide() {
    document.querySelectorAll('.hero-slide').forEach((el, idx) => {
      el.classList.toggle('active', idx === currentHeroIdx);
    });
    document.querySelectorAll('#hero-dots button').forEach((btn, idx) => {
      if (idx === currentHeroIdx) {
        btn.className = 'w-8 h-3 rounded-full bg-[#DF0178] transition-all';
      } else {
        btn.className = 'w-3 h-3 rounded-full bg-white/50 hover:bg-white transition-all';
      }
    });
  }

  window.jumpToHeroSlide = (idx) => {
    currentHeroIdx = idx;
    updateActiveSlide();
    const slides = window.bankStore.getHeroSlides();
    startHeroAutoSlide(slides.length);
  };

  window.prevHeroSlide = () => {
    const slides = window.bankStore.getHeroSlides();
    currentHeroIdx = (currentHeroIdx - 1 + slides.length) % slides.length;
    updateActiveSlide();
    startHeroAutoSlide(slides.length);
  };

  window.nextHeroSlide = () => {
    const slides = window.bankStore.getHeroSlides();
    currentHeroIdx = (currentHeroIdx + 1) % slides.length;
    updateActiveSlide();
    startHeroAutoSlide(slides.length);
  };

  // --- Quick Stats Counter with Animation ---
  function animateCounter(el, target, suffix = '') {
    if (!el) return;
    const duration = 1800;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(ease * target);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString() + suffix;
      }
    };
    window.requestAnimationFrame(step);
  }

  function renderQuickStats() {
    const bankInfo = window.bankStore.getBankInfo();
    if (!bankInfo.stats) return;
    const stats = bankInfo.stats;

    const elMembers = document.getElementById('stat-members');
    const elCustomers = document.getElementById('stat-customers');
    const elWelfare = document.getElementById('stat-welfare');
    const elYears = document.getElementById('stat-years');

    if (!statsAlreadyAnimated) {
      statsAlreadyAnimated = true;
      if (elMembers) animateCounter(elMembers, 1000, '+');
      if (elCustomers) animateCounter(elCustomers, 5000, '+');
      if (elWelfare) animateCounter(elWelfare, 400, '+');
      if (elYears) animateCounter(elYears, 38, '+ Years');
    } else {
      if (elMembers) elMembers.textContent = stats.members || '1,000+';
      if (elCustomers) elCustomers.textContent = stats.customers || '5,000+';
      if (elWelfare) elWelfare.textContent = stats.welfare || '400+';
      if (elYears) elYears.textContent = stats.yearsOfTrust || '38+ Years';
    }
  }

  // --- Products & Services Grid ---
  function renderProducts(category = 'all') {
    activeCategory = category;
    const products = window.bankStore.getProducts();
    const container = document.getElementById('products-grid');
    if (!container) return;

    const filtered = category === 'all' ? products : products.filter(p => p.category === category);

    const iconMap = {
      'piggy-bank': 'fa-solid fa-piggy-bank',
      'baby': 'fa-solid fa-child-reaching',
      'vault': 'fa-solid fa-vault',
      'sprout': 'fa-solid fa-seedling',
      'coins': 'fa-solid fa-coins',
      'hand-holding-heart': 'fa-solid fa-hand-holding-heart',
      'user-shield': 'fa-solid fa-user-shield',
      'building-columns': 'fa-solid fa-building-columns',
      'person-dress': 'fa-solid fa-person-dress',
      'gem': 'fa-solid fa-gem',
      'graduation-cap': 'fa-solid fa-graduation-cap',
      'bolt': 'fa-solid fa-bolt',
      'handshake': 'fa-solid fa-handshake-simple',
      'house-chimney': 'fa-solid fa-house-chimney',
      'money-bill-wave': 'fa-solid fa-money-bill-wave',
      'gifts': 'fa-solid fa-gifts',
      'briefcase': 'fa-solid fa-briefcase',
      'motorcycle': 'fa-solid fa-motorcycle',
      'screwdriver-wrench': 'fa-solid fa-screwdriver-wrench',
      'seedling': 'fa-solid fa-seedling'
    };

    container.innerHTML = filtered.map(prod => {
      const title = currentLang === 'en' ? (prod.titleEn || prod.title) : prod.title;
      const desc = currentLang === 'en' ? (prod.descEn || prod.desc) : prod.desc;
      const badge = currentLang === 'en' ? (prod.badgeEn || prod.badge) : prod.badge;
      const features = currentLang === 'en' ? (prod.featuresEn || prod.features) : prod.features;
      const iconClass = iconMap[prod.icon] || 'fa-solid fa-building-columns';
      const isMemberSavings = prod.id === 'prod-1' || (prod.title && prod.title.includes('සාමාජික ඉතුරුම්')) || (prod.titleEn && prod.titleEn.toLowerCase().includes('member savings'));
      const isExternalSavings = prod.id === 'prod-2' || (prod.title && prod.title.includes('බාහිර තැන්පත්')) || (prod.titleEn && prod.titleEn.toLowerCase().includes('external savings'));

      return `
        <div class="product-card group ${prod.image ? 'p-0 overflow-hidden flex flex-col' : 'p-6 sm:p-7 flex flex-col'}">
          ${prod.image ? `
            <div class="relative h-48 w-full overflow-hidden bg-slate-100 flex-shrink-0">
              <img src="${prod.image}" alt="${title}" class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-black/25 to-transparent"></div>
              ${badge ? `<span class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-[#DF0178] text-white shadow-md">${badge}</span>` : ''}
              <div class="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                <span class="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-sm border border-white/30">
                  <i class="${iconClass}"></i>
                </span>
              </div>
            </div>
            <div class="p-6 sm:p-7 flex-1 flex flex-col justify-between">
          ` : `
            <div class="flex items-start justify-between mb-5">
              <div class="product-icon-wrap w-14 h-14 rounded-2xl bg-indigo-50 text-[#0B0D7C] flex items-center justify-center text-2xl shadow-sm border border-indigo-100">
                <i class="${iconClass}"></i>
              </div>
              ${badge ? `<span class="px-3 py-1 rounded-full text-xs font-bold badge-pink shadow-sm">${badge}</span>` : ''}
            </div>
          `}

          <h3 class="text-xl font-bold text-slate-900 group-hover:text-[#0B0D7C] transition-colors mb-2">
            ${title}
          </h3>
          <p class="text-sm text-slate-600 mb-5 flex-grow line-clamp-3">
            ${desc}
          </p>

          <div class="border-t border-slate-100 pt-4 mb-6">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              ${currentLang === 'en' ? 'Key Privileges' : 'ප්‍රධාන වරප්‍රසාද'}
            </h4>
            <ul class="space-y-2">
              ${(features || []).slice(0, 3).map(f => `
                <li class="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                  <i class="fa-solid fa-circle-check text-[#DF0178] mt-0.5 text-xs"></i>
                  <span>${f}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="pt-2">
            ${isMemberSavings ? `
              <div class="grid grid-cols-2 gap-2">
                <button onclick="window.openInquiryModal('${title}')" class="py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-[#0B0D7C] text-slate-800 hover:text-white transition-all flex items-center justify-center gap-1.5 border border-slate-200 shadow-sm" title="${currentLang === 'en' ? 'Inquire' : 'විමසීම්'}">
                  <i class="fa-solid fa-circle-question text-xs"></i>
                  <span>${currentLang === 'en' ? 'Inquire' : 'විමසීම්'}</span>
                </button>
                <button onclick="window.openMembershipModal()" class="py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#DF0178] to-[#BA0063] hover:from-[#BA0063] hover:to-[#DF0178] text-white shadow-md shadow-pink-900/20 transition-all flex items-center justify-center gap-1.5" title="${currentLang === 'en' ? 'Apply for Membership' : 'අයදුම් කිරීම'}">
                  <i class="fa-solid fa-file-signature text-xs"></i>
                  <span>${currentLang === 'en' ? 'Apply Now' : 'අයදුම් කිරීම'}</span>
                </button>
              </div>
            ` : isExternalSavings ? `
              <div class="grid grid-cols-2 gap-2">
                <button onclick="window.openInquiryModal('${title}')" class="py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-[#0B0D7C] text-slate-800 hover:text-white transition-all flex items-center justify-center gap-1.5 border border-slate-200 shadow-sm" title="${currentLang === 'en' ? 'Inquire' : 'විමසීම්'}">
                  <i class="fa-solid fa-circle-question text-xs"></i>
                  <span>${currentLang === 'en' ? 'Inquire' : 'විමසීම්'}</span>
                </button>
                <button onclick="window.openExternalDepositModal()" class="py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-1.5" title="${currentLang === 'en' ? 'Open Account' : 'අයදුම් කිරීම'}">
                  <i class="fa-solid fa-file-signature text-xs"></i>
                  <span>${currentLang === 'en' ? 'Apply Now' : 'අයදුම් කිරීම'}</span>
                </button>
              </div>
            ` : `
              <button onclick="window.openInquiryModal('${title}')" class="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 group-hover:bg-[#0B0D7C] text-slate-800 group-hover:text-white transition-all flex items-center justify-center gap-2">
                <span>${currentLang === 'en' ? 'Apply / Inquire' : 'අයදුම් කිරීම / විමසීම්'}</span>
                <i class="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
              </button>
            `}
          </div>
          ${prod.image ? `</div>` : ''}
        </div>
      `;
    }).join('');
  }

  window.filterProducts = (cat, btn) => {
    document.querySelectorAll('.prod-tab').forEach(t => {
      t.classList.remove('bg-[#0B0D7C]', 'text-white');
      t.classList.add('bg-white', 'text-slate-700', 'border', 'border-slate-200');
    });
    if (btn) {
      btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
      btn.classList.add('bg-[#0B0D7C]', 'text-white');
    }
    renderProducts(cat);
  };

  // --- Interest Rates Board ---
  function renderRates() {
    const rates = window.bankStore.getRates();
    if (!rates) return;

    // FD Table
    const fdBody = document.getElementById('rates-fd-tbody');
    if (fdBody && rates.fixedDeposits) {
      fdBody.innerHTML = rates.fixedDeposits.map(fd => {
        const tenure = currentLang === 'en' ? (fd.tenureEn || fd.tenure) : fd.tenure;
        return `
          <tr class="hover:bg-pink-50/40 transition-colors ${fd.popular ? 'bg-pink-50/20' : ''}">
            <td class="py-4 px-5 font-semibold text-slate-900 flex items-center gap-2">
              <span>${tenure}</span>
              ${fd.popular ? `<span class="px-2 py-0.5 text-[11px] font-bold rounded bg-[#DF0178] text-white">${currentLang === 'en' ? 'Popular' : 'ජනප්‍රිය'}</span>` : ''}
            </td>
            <td class="py-4 px-5 text-right font-extrabold text-[#0B0D7C] text-base sm:text-lg">${fd.annualRate}</td>
            <td class="py-4 px-5 text-right font-bold text-[#DF0178] text-base">${fd.monthlyRate}</td>
            <td class="py-4 px-5 text-right text-slate-600 text-xs sm:text-sm">${fd.minDeposit}</td>
          </tr>
        `;
      }).join('');
    }

    // Savings Table
    const saBody = document.getElementById('rates-sa-tbody');
    if (saBody && rates.savingsAccounts) {
      saBody.innerHTML = rates.savingsAccounts.map(sa => {
        const name = currentLang === 'en' ? (sa.nameEn || sa.name) : sa.name;
        return `
          <tr class="hover:bg-sky-50/40 transition-colors">
            <td class="py-4 px-5 font-semibold text-slate-900">${name}</td>
            <td class="py-4 px-5 text-right font-extrabold text-emerald-600 text-base sm:text-lg">${sa.rate}</td>
            <td class="py-4 px-5 text-right text-slate-600 text-xs sm:text-sm">${sa.minBalance}</td>
            <td class="py-4 px-5 text-slate-500 text-xs">${sa.note}</td>
          </tr>
        `;
      }).join('');
    }

    // Loans Table
    const lnBody = document.getElementById('rates-loan-tbody');
    if (lnBody && rates.loans) {
      lnBody.innerHTML = rates.loans.map(ln => {
        const name = currentLang === 'en' ? (ln.nameEn || ln.name) : ln.name;
        return `
          <tr class="hover:bg-indigo-50/40 transition-colors">
            <td class="py-4 px-5 font-semibold text-slate-900">${name}</td>
            <td class="py-4 px-5 text-right font-extrabold text-[#0B0D7C] text-base sm:text-lg">${ln.rate}</td>
            <td class="py-4 px-5 text-right text-slate-600 text-xs sm:text-sm">${ln.maxAmount}</td>
            <td class="py-4 px-5 text-right text-slate-500 text-xs sm:text-sm">${ln.maxPeriod}</td>
          </tr>
        `;
      }).join('');
    }
  }

  window.switchRatesTab = (type, btn) => {
    document.querySelectorAll('.rates-tab-btn').forEach(b => {
      b.classList.remove('bg-[#0B0D7C]', 'text-white');
      b.classList.add('bg-slate-100', 'text-slate-700');
    });
    if (btn) {
      btn.classList.remove('bg-slate-100', 'text-slate-700');
      btn.classList.add('bg-[#0B0D7C]', 'text-white');
    }

    const fdP = document.getElementById('rates-panel-fd');
    const saP = document.getElementById('rates-panel-savings');
    const lnP = document.getElementById('rates-panel-loans');
    if (fdP) fdP.classList.toggle('hidden', type !== 'fd');
    if (saP) saP.classList.toggle('hidden', type !== 'savings');
    if (lnP) lnP.classList.toggle('hidden', type !== 'loans');
  };

  // --- Financial Calculators (Fixed Deposit Growth Calculator) ---
  function initCalculators() {
    const fdAmountRange = document.getElementById('fd-amount-range');
    const fdAmountInput = document.getElementById('fd-amount-input');
    const fdCustomRateRange = document.getElementById('fd-custom-rate-range');
    const fdCustomRateInput = document.getElementById('fd-custom-rate-input');
    const fdPeriodInput = document.getElementById('fd-period-input');
    const fdPayoutSelect = document.getElementById('fd-payout-select');

    if (fdAmountRange && fdAmountInput) {
      const calcFD = () => {
        const P = parseFloat(fdAmountRange.value) || 100000;
        fdAmountInput.value = Number(P).toLocaleString();

        const annualRate = parseFloat(fdCustomRateInput ? fdCustomRateInput.value : 13.0) || 13.0;
        const months = parseInt(fdPeriodInput ? fdPeriodInput.value : 12) || 12;
        const payout = fdPayoutSelect ? fdPayoutSelect.value : 'maturity';

        let profit = 0;
        let monthlyIncome = 0;

        if (payout === 'monthly') {
          monthlyIncome = (P * (annualRate / 100)) / 12;
          profit = monthlyIncome * months;
        } else {
          profit = (P * (annualRate / 100) * (months / 12));
          monthlyIncome = profit / months;
        }

        const maturityTotal = P + profit;

        const elMaturity = document.getElementById('fd-maturity-val');
        const elProfit = document.getElementById('fd-profit-val');
        const elMonthly = document.getElementById('fd-monthly-income-val');
        const elApplied = document.getElementById('fd-applied-rate');
        const elTenure = document.getElementById('fd-display-tenure');

        if (elMaturity) elMaturity.textContent = formatLKR(Math.round(maturityTotal));
        if (elProfit) elProfit.textContent = formatLKR(Math.round(profit));
        if (elMonthly) elMonthly.textContent = formatLKR(Math.round(monthlyIncome));
        if (elApplied) elApplied.textContent = annualRate.toFixed(2) + '% p.a.';
        if (elTenure) elTenure.textContent = 'මාස ' + months;
      };

      // Amount events
      fdAmountRange.addEventListener('input', () => calcFD());
      fdAmountInput.addEventListener('input', (e) => {
        const raw = e.target.value.replace(/,/g, '');
        if (raw !== '') {
          const val = parseFloat(raw);
          if (!isNaN(val)) {
            fdAmountRange.value = Math.min(10000000, Math.max(10000, val));
            const annualRate = parseFloat(fdCustomRateInput ? fdCustomRateInput.value : 13.0) || 13.0;
            const months = parseInt(fdPeriodInput ? fdPeriodInput.value : 12) || 12;
            const profit = (val * (annualRate / 100) * (months / 12));
            const monthlyIncome = profit / months;
            const maturityTotal = val + profit;

            const elMaturity = document.getElementById('fd-maturity-val');
            const elProfit = document.getElementById('fd-profit-val');
            const elMonthly = document.getElementById('fd-monthly-income-val');
            if (elMaturity) elMaturity.textContent = formatLKR(Math.round(maturityTotal));
            if (elProfit) elProfit.textContent = formatLKR(Math.round(profit));
            if (elMonthly) elMonthly.textContent = formatLKR(Math.round(monthlyIncome));
          }
        }
      });
      fdAmountInput.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value.replace(/,/g, '')) || 100000;
        fdAmountRange.value = Math.min(10000000, Math.max(10000, val));
        calcFD();
      });

      // Custom Rate events
      if (fdCustomRateRange && fdCustomRateInput) {
        fdCustomRateRange.addEventListener('input', (e) => {
          fdCustomRateInput.value = parseFloat(e.target.value).toFixed(2);
          calcFD();
        });
        fdCustomRateInput.addEventListener('change', (e) => {
          const r = parseFloat(e.target.value) || 13.0;
          fdCustomRateRange.value = Math.min(25.0, Math.max(1.0, r));
          calcFD();
        });
      }

      // Period input events
      if (fdPeriodInput) {
        fdPeriodInput.addEventListener('change', (e) => {
          const m = parseInt(e.target.value) || 12;
          fdPeriodInput.value = Math.min(120, Math.max(1, m));
          document.querySelectorAll('.fd-tenure-btn').forEach(btn => {
            btn.classList.remove('bg-[#0B0D7C]', 'text-white', 'border-[#0B0D7C]');
            btn.classList.add('border-slate-200', 'text-slate-700');
          });
          calcFD();
        });
      }

      // Tenure button helper
      window.setFDTenure = (months, btn) => {
        if (fdPeriodInput) fdPeriodInput.value = months;
        document.querySelectorAll('.fd-tenure-btn').forEach(b => {
          b.classList.remove('bg-[#0B0D7C]', 'text-white', 'border-[#0B0D7C]');
          b.classList.add('border-slate-200', 'text-slate-700');
        });
        if (btn) {
          btn.classList.remove('border-slate-200', 'text-slate-700');
          btn.classList.add('bg-[#0B0D7C]', 'text-white', 'border-[#0B0D7C]');
        }
        calcFD();
      };

      if (fdPayoutSelect) {
        fdPayoutSelect.addEventListener('change', () => calcFD());
      }

      calcFD();
    }
  }

  // --- Latest News & Notices Grid ---
  function renderNews() {
    const news = window.bankStore.getNews();
    const container = document.getElementById('news-grid');
    if (!container) return;

    container.innerHTML = (news || []).slice(0, 4).map(item => {
      const title = currentLang === 'en' ? (item.titleEn || item.title) : item.title;
      const summary = currentLang === 'en' ? (item.summaryEn || item.summary) : item.summary;
      const category = currentLang === 'en' ? (item.categoryEn || item.category) : item.category;

      return `
        <article class="news-card flex flex-col h-full group cursor-pointer" onclick="window.openNewsModal('${item.id}')">
          <div class="relative h-48 overflow-hidden bg-slate-100">
            <img src="${item.image || 'assets/images/wix/d7b655_8b90b4687fad497bb55da48a880da264~mv2.png'}" alt="${title}" class="news-img w-full h-full object-cover">
            <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${item.badgeColor || 'bg-[#0B0D7C]'}">
              ${category}
            </span>
            ${item.urgent ? `<span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#DF0178] text-white animate-pulse">URGENT</span>` : ''}
          </div>
          <div class="p-5 sm:p-6 flex flex-col flex-grow">
            <div class="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-2">
              <i class="fa-regular fa-calendar"></i>
              <span>${item.date}</span>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#0B0D7C] transition-colors mb-2.5 line-clamp-2">
              ${title}
            </h3>
            <p class="text-xs sm:text-sm text-slate-600 mb-4 line-clamp-3 flex-grow">
              ${summary}
            </p>
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0B0D7C] group-hover:text-[#DF0178]">
              <span>${currentLang === 'en' ? 'Read Full Announcement' : 'සම්පූර්ණ විස්තරය කියවන්න'}</span>
              <i class="fa-solid fa-arrow-right transition-transform group-hover:translate-x-1"></i>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // --- Development Partners ---
  function renderPartners() {
    const data = window.bankStore.getData();
    const container = document.getElementById('partners-grid');
    if (!container || !data.partners) return;

    container.innerHTML = data.partners.map(p => `
      <div class="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center justify-between text-center hover:shadow-md transition-shadow group h-full">
        <div class="h-16 flex items-center justify-center mb-2 w-full">
          <img src="${p.img}" alt="${p.name}" class="max-h-14 max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all">
        </div>
        <div class="w-full">
          <h5 class="text-[11px] font-bold text-slate-800 leading-tight break-words mb-1">${p.name}</h5>
          <p class="text-[10px] text-slate-500 leading-tight break-words">${p.sinhala}</p>
        </div>
      </div>
    `).join('');
  }

  // --- Testimonials ---
  function renderTestimonials() {
    const container = document.getElementById('testimonials-grid');
    if (!container) return;

    // Combine approved+published store feedbacks with hardcoded testimonials
    const storeFeedbacks = (window.bankStore.getFeedbacks ? window.bankStore.getFeedbacks() : [])
      .filter(f => f.publishedAsTestimonial === true && f.status === 'approved');

    const defaultTestimonials = [
      {
        name: "W.M. සුසන්ත වන්නිනායක මහතා",
        role: "කෘෂි ව්‍යවසායක - ගලපිටියාගම",
        icon: "fa-solid fa-user-tie",
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        quote: "වසර ගණනාවක් තිස්සේ මගේ ගොවිතැන් කටයුතුවලට අතහිත දුන්නේ ගලපිටියාගම සණස බැංකුවයි. අවම ලියකියවිලි සහිත සහන පොලී ණය නිසා අද මට සාර්ථක ගොවිපලක් පවත්වාගෙන යන්න පුළුවන් වෙලා තියෙනවා."
      },
      {
        name: "සුලෝචනා සඳමාලි මහත්මිය",
        role: "ව්‍යවසායිකා - ගලපිටියාගම",
        icon: "fa-solid fa-user-tie",
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        quote: "ව්‍යාපාරික ණය පහසුකමෙන් අඟුරු කම්හලක් ආරම්භ කළ මට අද සේවකයින් විශාල ප්‍රමාණයකට රැකියා දෙන්න හැකියාව ලැබුණා. සණස බැංකුවේ කාර්ය මණ්ඩලයේ සුහදශීලී සේවය අගය කරමි."
      },
      {
        name: "ධර්මදාස විජේසිංහ මහතා",
        role: "විශ්‍රාමික ගුරුභවතා - ගලපිටියාගම",
        icon: "fa-solid fa-user-tie",
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        quote: "ස්ථාවර තැන්පතු සඳහා මාසිකව ලැබෙන ඉහළම පොලිය මගේ විශ්‍රාම දිවිය සැපවත් කර ඇත. ශ්‍රී ලංකා මහ බැංකුවේ අනුමැතිය සහ සමූපකාර නීතියට යටත් බැවින් බියක් නැතිව මුදල් තැන්පත් කළ හැක."
      }
    ];

    // Merge: published store feedbacks first, then defaults (up to 6 total)
    const storeCards = storeFeedbacks.map(f => ({
      name: f.name,
      role: (f.service || 'සාමාජිකයා') + (f.village ? ' - ' + f.village : ''),
      icon: "fa-solid fa-user",
      iconBg: "bg-pink-100",
      iconColor: "text-[#DF0178]",
      quote: f.message,
      rating: f.rating || 5
    }));

    const combined = [...storeCards, ...defaultTestimonials].slice(0, 6);

    container.innerHTML = combined.map(t => `
      <div class="testimonial-card flex flex-col justify-between">
        <div>
          <div class="flex text-pink-500 gap-1 mb-4 text-sm">
            ${[1,2,3,4,5].map(s => `<i class="${s <= (t.rating || 5) ? 'fa-solid' : 'fa-regular'} fa-star"></i>`).join('')}
          </div>
          <p class="text-slate-700 italic text-sm sm:text-base leading-relaxed mb-6 relative z-10">
            "${t.quote}"
          </p>
        </div>
        <div class="flex items-center gap-3.5 pt-4 border-t border-slate-100">
          <div class="w-12 h-12 rounded-full flex items-center justify-center ${t.iconBg} border-2 border-[#DF0178] flex-shrink-0">
            <i class="${t.icon} text-xl ${t.iconColor}"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-900 text-sm">${t.name}</h4>
            <p class="text-xs text-slate-500">${t.role}</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  // --- Branches ---
  function renderBranches() {
    const container = document.getElementById('branches-list');
    if (!container) return;

    const branches = [
      {
        name: "ගලපිටියාගම සණස බැංකු කාර්යාලය",
        nameEn: "Galapitiyagama SANASA Bank Office",
        address: "නො. 247, පුත්තලම් පාර, ගලපිටියගම, නිකවැරටිය",
        phone: "+94 37 22 60 658",
        hours: "පෙ.ව. 9.00 - ප.ව. 3.30"
      }
    ];

    container.innerHTML = branches.map(b => {
      const name = currentLang === 'en' ? (b.nameEn || b.name) : b.name;
      return `
        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#0B0D7C] transition-all">
          <h4 class="font-bold text-slate-900 text-sm mb-1">${name}</h4>
          <p class="text-xs text-slate-600 mb-1 flex items-center gap-1.5">
            <i class="fa-solid fa-location-dot text-[#DF0178]"></i> ${b.address}
          </p>
          <div class="flex items-center text-xs text-slate-500 pt-2 border-t border-slate-200/60 mt-2">
            <span><i class="fa-regular fa-clock text-xs mr-1.5 text-[#DF0178]"></i> කාර්යාල වේලාවන්: ${b.hours}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- YouTube Video Switcher & Facade Player ---
  let currentYtVideoId = 'EYEONwM6xBM';

  window.playMainYoutubeVideo = function() {
    const container = document.getElementById('yt-player-container');
    if (!container) return;
    container.innerHTML = `
      <iframe
        id="yt-main-iframe"
        src="https://www.youtube-nocookie.com/embed/${currentYtVideoId}?autoplay=1&rel=0&enablejsapi=1"
        title="YouTube video player"
        class="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    `;
    container.onclick = null;
    container.classList.remove('cursor-pointer');
  };

  window.switchYoutubeVideo = function(videoId, title, tag, el) {
    currentYtVideoId = videoId;
    const titleEl = document.getElementById('yt-main-title');
    const badgeEl = document.getElementById('yt-main-badge');
    const linkEl = document.getElementById('yt-main-link');
    const container = document.getElementById('yt-player-container');

    if (titleEl) titleEl.textContent = title;
    if (badgeEl) badgeEl.textContent = tag;
    if (linkEl) linkEl.href = 'https://www.youtube.com/watch?v=' + videoId;

    if (container) {
      container.innerHTML = `
        <iframe
          id="yt-main-iframe"
          src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1"
          title="${title}"
          class="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      `;
      container.onclick = null;
      container.classList.remove('cursor-pointer');
    }

    document.querySelectorAll('.yt-playlist-item').forEach(item => {
      item.classList.remove('ring-2', 'ring-red-500', 'bg-white/20');
    });
    if (el) {
      el.classList.add('ring-2', 'ring-red-500', 'bg-white/20');
    }
  };

  // --- Modals & Popups ---
  window.openNewsModal = (newsId) => {
    const item = window.bankStore.getNewsById(newsId);
    if (!item) return;

    const modal = document.getElementById('news-modal');
    const content = document.getElementById('news-modal-content');
    if (!modal || !content) return;

    const title = currentLang === 'en' ? (item.titleEn || item.title) : item.title;
    const body = currentLang === 'en' ? (item.contentEn || item.content) : item.content;

    content.innerHTML = `
      <div class="relative">
        <img src="${item.image}" alt="${title}" class="w-full h-64 object-cover rounded-t-2xl">
        <span class="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white ${item.badgeColor || 'bg-[#0B0D7C]'}">
          ${item.category}
        </span>
      </div>
      <div class="p-6 sm:p-8">
        <div class="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-2">
          <i class="fa-regular fa-calendar"></i>
          <span>${item.date}</span>
        </div>
        <h2 class="text-2xl font-bold text-slate-900 mb-4">${title}</h2>
        <div class="prose max-w-none text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line border-t border-slate-100 pt-4">
          ${body}
        </div>
        <div class="mt-8 pt-4 border-t border-slate-100 flex justify-end">
          <button onclick="window.closeNewsModal()" class="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors">
            ${currentLang === 'en' ? 'Close' : 'වසන්න'}
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  window.closeNewsModal = () => {
    const modal = document.getElementById('news-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  };

  window.openInquiryModal = (preferredService = '') => {
    const modal = document.getElementById('inquiry-modal');
    const serviceSelect = document.getElementById('modal-inq-service');
    if (serviceSelect && preferredService) {
      serviceSelect.value = preferredService;
    }
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeInquiryModal = () => {
    const modal = document.getElementById('inquiry-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  };

  window.openOnlineBankingModal = () => {
    const modal = document.getElementById('online-banking-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeOnlineBankingModal = () => {
    const modal = document.getElementById('online-banking-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  };

  // --- Form Submissions ---
  function setupEventListeners() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleLanguage(btn.dataset.lang);
      });
    });

    const inquiryForm = document.getElementById('modal-inquiry-form');
    if (inquiryForm) {
      inquiryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('modal-inq-name').value;
        const phone = document.getElementById('modal-inq-phone').value;
        const email = document.getElementById('modal-inq-email').value;
        const service = document.getElementById('modal-inq-service').value;
        const message = document.getElementById('modal-inq-message').value;

        window.bankStore.addInquiry({ name, phone, email, service, message });
        window.closeInquiryModal();
        inquiryForm.reset();
        showToast(currentLang === 'en' ? 'Your inquiry has been submitted! Our loan officer will contact you shortly.' : 'ඔබගේ අයදුම්පත සාර්ථකව යොමු විය! අපගේ නිලධාරියෙකු කඩිනමින් ඔබ හා සම්බන්ධ වනු ඇත.', 'success');
      });
    }

    const homeContactForm = document.getElementById('home-contact-form');
    if (homeContactForm) {
      homeContactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('home-c-name').value;
        const phone = document.getElementById('home-c-phone').value;
        const email = document.getElementById('home-c-email').value;
        const service = document.getElementById('home-c-service').value;
        const message = document.getElementById('home-c-message').value;

        window.bankStore.addInquiry({ name, phone, email, service, message });
        homeContactForm.reset();
        showToast(currentLang === 'en' ? 'Inquiry sent successfully to Galapitiyagama Sanasa Bank!' : 'විමසීම සාර්ථකව බැංකුව වෙත යොමු විය! ස්තූතියි.', 'success');
      });
    }

    const obForm = document.getElementById('ob-login-form');
    if (obForm) {
      obForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('ob-username').value;
        showToast(`ආයුබෝවන් ${user}! Smart COOP පද්ධතියට ආරක්ෂිතව සම්බන්ධ වීම සඳහා ශාඛාවෙන් ලියාපදිංචි වන්න.`, 'info');
        window.closeOnlineBankingModal();
      });
    }

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    if (mobileMenuBtn && mobileDrawer) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileDrawer.classList.toggle('hidden');
      });
    }
    if (closeDrawerBtn && mobileDrawer) {
      closeDrawerBtn.addEventListener('click', () => {
        mobileDrawer.classList.add('hidden');
      });
    }

    // Auto-select Loans filter tab when navigating to #loans
    document.querySelectorAll('a[href="#loans"]').forEach(link => {
      link.addEventListener('click', () => {
        const loanTab = document.querySelector('button[onclick*="\'loans\'"]');
        if (loanTab && window.filterProducts) window.filterProducts('loans', loanTab);
      });
    });
  }

  function showToast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? 'fa-circle-check text-pink-400' : 'fa-circle-info text-amber-400';
    toast.innerHTML = `
      <i class="fa-solid ${icon} text-lg"></i>
      <span>${msg}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
  window.showToast = showToast;

  // --- Accessibility Font Scaler (Clean Sri Lanka Gov.lk standard) ---
  let currentFontScale = 1;
  window.adjustFontSize = function(delta) {
    if (delta === 0) currentFontScale = 1;
    else currentFontScale = Math.min(1.25, Math.max(0.85, currentFontScale + delta * 0.08));
    document.documentElement.style.fontSize = `${currentFontScale * 100}%`;
  };

  // --- Scroll Reveal Animation Observer ---
  function setupScrollReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
  }
  window.setupScrollReveal = setupScrollReveal;

  // =========================================================================
  // --- DIGITAL MEMBERSHIP APPLICATION CONTROLLER & E-SIGNATURE ENGINE ---
  // =========================================================================
  let uploadedReceiptBase64 = '';
  let hasDrawnSignature = false;
  let isDrawingSignature = false;
  let sigCanvas = null;
  let sigCtx = null;
  let lastSubmittedApp = null;

  function initSignaturePad() {
    sigCanvas = document.getElementById('signature-pad');
    if (!sigCanvas) return;
    sigCtx = sigCanvas.getContext('2d');

    // High-DPI sharpness
    const rect = sigCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    sigCanvas.width = (rect.width || 600) * dpr;
    sigCanvas.height = (rect.height || 160) * dpr;
    sigCtx.scale(dpr, dpr);
    sigCtx.strokeStyle = '#0B0D7C';
    sigCtx.lineWidth = 2.5;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';

    function getPos(e) {
      const r = sigCanvas.getBoundingClientRect();
      if (e.touches && e.touches[0]) {
        return {
          x: e.touches[0].clientX - r.left,
          y: e.touches[0].clientY - r.top
        };
      }
      return {
        x: e.clientX - r.left,
        y: e.clientY - r.top
      };
    }

    function startDraw(e) {
      e.preventDefault();
      isDrawingSignature = true;
      const pos = getPos(e);
      sigCtx.beginPath();
      sigCtx.moveTo(pos.x, pos.y);
      const placeholder = document.getElementById('signature-placeholder');
      if (placeholder) placeholder.classList.add('hidden');
    }

    function moveDraw(e) {
      if (!isDrawingSignature) return;
      e.preventDefault();
      const pos = getPos(e);
      sigCtx.lineTo(pos.x, pos.y);
      sigCtx.stroke();
      hasDrawnSignature = true;
    }

    function stopDraw(e) {
      if (!isDrawingSignature) return;
      e.preventDefault();
      isDrawingSignature = false;
      sigCtx.closePath();
    }

    // Mouse Events
    sigCanvas.addEventListener('mousedown', startDraw);
    sigCanvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', stopDraw);

    // Touch Events
    sigCanvas.addEventListener('touchstart', startDraw, { passive: false });
    sigCanvas.addEventListener('touchmove', moveDraw, { passive: false });
    sigCanvas.addEventListener('touchend', stopDraw, { passive: false });
  }

  window.openMembershipModal = () => {
    const modal = document.getElementById('membership-modal');
    const formContainer = document.getElementById('membership-form-container');
    const successView = document.getElementById('membership-success-view');
    if (formContainer) formContainer.classList.remove('hidden');
    if (successView) successView.classList.add('hidden');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      setTimeout(() => initSignaturePad(), 150);
    }
  };

  window.closeMembershipModal = () => {
    const modal = document.getElementById('membership-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  };

  window.clearSignatureCanvas = () => {
    if (!sigCanvas || !sigCtx) return;
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    hasDrawnSignature = false;
    const placeholder = document.getElementById('signature-placeholder');
    if (placeholder) placeholder.classList.remove('hidden');
  };

  // Safe client-side image compressor: keeps image quality while reducing size to <100KB
  function compressImageFile(file, maxWidth = 900, maxHeight = 900, quality = 0.65) {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth || h > maxHeight) {
            if (w > h) {
              h = Math.round((h * maxWidth) / w);
              w = maxWidth;
            } else {
              w = Math.round((w * maxHeight) / h);
              h = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result || '');
        img.src = e.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  window.handleReceiptSelected = async (input) => {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const nameEl = document.getElementById('receipt-file-name');
      if (nameEl) nameEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>රිසිට්පත සූදානම් කරමින්...</span>`;

      try {
        uploadedReceiptBase64 = await compressImageFile(file, 900, 900, 0.65);
        const prompt = document.getElementById('receipt-upload-prompt');
        const container = document.getElementById('receipt-preview-container');
        const img = document.getElementById('receipt-preview-img');
        if (prompt) prompt.classList.add('hidden');
        if (container) container.classList.remove('hidden');
        if (img) img.src = uploadedReceiptBase64;
        if (nameEl) nameEl.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600"></i> <span>${file.name} සාර්ථකව තෝරාගන්නා ලදී</span>`;
      } catch (err) {
        console.error('Receipt compression error:', err);
      }
    }
  };

  window.clearReceiptUpload = () => {
    uploadedReceiptBase64 = '';
    const input = document.getElementById('mem-receipt-file');
    if (input) input.value = '';
    const prompt = document.getElementById('receipt-upload-prompt');
    const container = document.getElementById('receipt-preview-container');
    if (prompt) prompt.classList.remove('hidden');
    if (container) container.classList.add('hidden');
  };

  window.handleMembershipSubmit = (e) => {
    e.preventDefault();

    // Check Signature
    if (!hasDrawnSignature) {
      alert('කරුණාකර අයදුම්පත සඳහා ඔබගේ ඩිජිටල් අත්සන (E-Signature) යොදන්න.');
      const pad = document.getElementById('signature-pad');
      if (pad) pad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Check Receipt
    if (!uploadedReceiptBase64) {
      alert('කරුණාකර මහජන බැංකුවට (People\'s Bank) මුදල් තැන්පත් කළ රිසිට්පත හෝ Online Transfer ස්ලිප්පත Upload කරන්න.');
      const zone = document.getElementById('receipt-dropzone');
      if (zone) zone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Get Signature data URL
    let signatureDataUrl = '';
    try {
      signatureDataUrl = sigCanvas.toDataURL('image/png');
    } catch(err) {
      console.warn('Canvas toDataURL issue:', err);
    }

    // Gather application data
    const newApplication = {
      fullName: document.getElementById('mem-fullname').value.trim(),
      nameWithInitials: document.getElementById('mem-initials-name').value.trim(),
      nameEnglishCaps: document.getElementById('mem-name-en').value.trim().toUpperCase(),
      nic: document.getElementById('mem-nic').value.trim(),
      gender: document.getElementById('mem-gender').value,
      dob: document.getElementById('mem-dob').value,
      maritalStatus: document.getElementById('mem-marital').value,
      address: document.getElementById('mem-address').value.trim(),
      city: document.getElementById('mem-city').value.trim(),
      gnDivision: document.getElementById('mem-gn').value.trim(),
      religion: document.getElementById('mem-religion').value,
      phone: document.getElementById('mem-phone').value.trim(),
      whatsapp: document.getElementById('mem-whatsapp').value.trim(),
      email: document.getElementById('mem-email').value.trim(),

      // Nominee details
      nomineeName: document.getElementById('mem-nominee-name').value.trim(),
      nomineeNic: document.getElementById('mem-nominee-nic').value.trim(),
      nomineeGender: document.getElementById('mem-nominee-gender').value,
      nomineeRelationship: document.getElementById('mem-nominee-relationship').value.trim(),

      // Business details
      businessName: document.getElementById('mem-biz-name').value.trim(),
      occupation: document.getElementById('mem-biz-occupation').value.trim(),
      businessAddress: document.getElementById('mem-biz-address').value.trim(),
      businessPhone: document.getElementById('mem-biz-phone').value.trim(),

      // Payment details
      shareCapital: 5000,
      savingsDeposit: 1000,
      totalPaid: 6000,
      bankAccount: "People's Bank - 124200110064754 (Nikaweratiya)",
      paymentRef: document.getElementById('mem-payment-ref') ? document.getElementById('mem-payment-ref').value.trim() : '',
      receiptImage: uploadedReceiptBase64,
      signatureImage: signatureDataUrl
    };

    // Save in Store
    const savedApp = window.bankStore.addMembershipApplication(newApplication);
    lastSubmittedApp = savedApp;

    // Trigger update for admin
    window.dispatchEvent(new CustomEvent('bankDataUpdated'));

    // Switch to Success View
    const formContainer = document.getElementById('membership-form-container');
    const successView = document.getElementById('membership-success-view');
    if (formContainer) formContainer.classList.add('hidden');
    if (successView) successView.classList.remove('hidden');

    const refEl = document.getElementById('succ-mem-ref');
    const nameEl = document.getElementById('succ-mem-name');
    const nicEl = document.getElementById('succ-mem-nic');
    if (refEl) refEl.textContent = savedApp.refId;
    if (nameEl) nameEl.textContent = savedApp.fullName;
    if (nicEl) nicEl.textContent = savedApp.nic;

    showToast('සාමාජික අයදුම්පත සාර්ථකව යොමු කරන ලදී!', 'success');
  };

  window.printMembershipApplicationCopy = () => {
    const app = lastSubmittedApp;
    if (!app) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('කරුණාකර Popup විවෘත කිරීමට අවසර දෙන්න.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>සාමාජික අයදුම් පත්‍රය - ${app.refId}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, 'Iskoola Pota', sans-serif; padding: 25px; color: #1e293b; max-width: 800px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #0B0D7C; padding-bottom: 15px; margin-bottom: 15px; }
          .logo { height: 60px; margin-bottom: 5px; }
          .title { font-size: 20px; font-weight: bold; color: #0B0D7C; margin: 3px 0; }
          .sub { font-size: 13px; color: #475569; }
          .badge { display: inline-block; padding: 4px 10px; background: #DF0178; color: #fff; border-radius: 12px; font-size: 11px; font-weight: bold; margin-top: 5px; }
          .section-title { font-size: 14px; font-weight: bold; color: #0B0D7C; background: #f1f5f9; padding: 6px 10px; border-left: 4px solid #DF0178; margin-top: 15px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background: #f8fafc; font-weight: bold; width: 35%; color: #334155; }
          .payment-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; border-radius: 8px; margin: 10px 0; font-size: 12px; }
          .sig-box { border: 1px solid #cbd5e1; padding: 10px; text-align: center; background: #fafafa; border-radius: 8px; }
          .sig-img { max-height: 70px; object-contain; }
          .receipt-img { max-height: 140px; border: 1px solid #ddd; margin-top: 5px; border-radius: 6px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; margin-bottom: 15px; display: flex; justify-content: flex-end; gap: 10px;">
          <button onclick="window.print()" style="padding: 9px 18px; background: #DF0178; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; display: inline-flex; items-center; gap: 6px;">
            <span>PDF ලෙස සුරකින්න / මුද්‍රණය කරන්න (Save as PDF / Print)</span>
          </button>
        </div>

        <div class="header">
          <img src="${window.location.origin + '/' + 'assets/images/gscs-logo.png'}" class="logo" onerror="this.style.display='none'">
          <div class="title">සාමාජික අයදුම් පත්‍රය</div>
          <div class="sub">සීමා රහිත ගලපිටියාගම සකසුරුවම් හා ණය ගනුදෙනු පිළිබඳ සමූපකාර සමිතිය</div>
          <div class="sub">1972 අංක 5 දරන සමූපකාර සමිති පනත යටතේ ලියාපදිංචි අංක: කුලි/395</div>
          <div class="badge">යොමු අංකය: ${app.refId} | දිනය: ${app.submittedAt}</div>
        </div>

        <div class="section-title">1. පුද්ගලික තොරතුරු (Personal Information)</div>
        <table>
          <tr><th>සම්පූර්ණ නම</th><td>${app.fullName}</td></tr>
          <tr><th>මුලකුරු සමඟ නම (සිංහලෙන්)</th><td>${app.nameWithInitials}</td></tr>
          <tr><th>මුලකුරු සමඟ නම (English)</th><td style="font-family: monospace; font-weight: bold;">${app.nameEnglishCaps}</td></tr>
          <tr><th>ජාතික හැඳුනුම්පත් අංකය</th><td style="font-family: monospace; font-weight: bold;">${app.nic}</td></tr>
          <tr><th>ස්ත්‍රී / පුරුෂ භාවය | විවාහක තත්වය</th><td>${app.gender} | ${app.maritalStatus}</td></tr>
          <tr><th>උපන් දිනය | ආගම</th><td>${app.dob} | ${app.religion}</td></tr>
          <tr><th>ස්ථිර ලිපිනය (Address)</th><td>${app.address}</td></tr>
          <tr><th>නගරය (City)</th><td><strong>${app.city}</strong></td></tr>
          <tr><th>ග්‍රාම නිලධාරී වසම</th><td>${app.gnDivision}</td></tr>
          <tr><th>දුරකථන අංකය | WhatsApp</th><td>${app.phone} | ${app.whatsapp}</td></tr>
          <tr><th>විද්‍යුත් තැපෑල (Email)</th><td>${app.email || '-'}</td></tr>
        </table>

        <div class="section-title">2. පසු උරුමය සම්බන්ධ තොරතුරු (13 වන නියෝගය යටතේ)</div>
        <table>
          <tr><th>පසු උරුමකරුගේ සම්පූර්ණ නම</th><td>${app.nomineeName}</td></tr>
          <tr><th>ජාතික හැඳුනුම්පත් අංකය | ස්ත්‍රී/පුරුෂ</th><td>${app.nomineeNic} | ${app.nomineeGender}</td></tr>
          <tr><th>අයදුම්කරුට ඇති නෑදෑකම</th><td>${app.nomineeRelationship}</td></tr>
        </table>

        <div class="section-title">3. ව්‍යාපාරය හෝ රැකියාව පිළිබඳ තොරතුරු</div>
        <table>
          <tr><th>ව්‍යාපාරයේ නම | රැකියාව</th><td>${app.businessName || '-'} | ${app.occupation || '-'}</td></tr>
          <tr><th>සේවා ස්ථානයේ ලිපිනය | දුරකථනය</th><td>${app.businessAddress || '-'} | ${app.businessPhone || '-'}</td></tr>
        </table>

        <div class="section-title">4. සාමාජික ගාස්තු සහ බැංකු තැන්පතුව (Payment Verification)</div>
        <div class="payment-box">
          <strong>තැන්පත් කළ සම්පූර්ණ මුදල: රු. ${Number(app.totalPaid).toLocaleString()}.00</strong> (කොටස් මුදල් රු. 5,000 + ඉතුරුම් රු. 1,000)<br>
          <span>බැංකු ගිණුම: People's Bank - 124200110064754 (Nikaweratiya)</span><br>
          ${app.paymentRef ? `<span>රිසිට්පත් / Ref අංකය: <strong>${app.paymentRef}</strong></span><br>` : ''}
          ${app.receiptImage ? `<img src="${app.receiptImage}" class="receipt-img">` : ''}
        </div>

        <div class="section-title">5. එකඟතාවය සහ ඩිජිටල් අත්සන (Declaration & Signature)</div>
        <p style="font-size: 11px; color: #475569; font-style: italic;">
          "ඉහත සඳහන් විස්තර සත්‍ය බවට සහතික කරන මා ඔබ සමිතියේ සාමාජිකත්වය ඉල්ලුම්කර සිටින අතර සමිතියේ නීති රීති වලට එකඟව කටයුතු කිරීමට මෙයින් පොරොන්දු වෙමි. තවද මාගේ ඇතුළත්වීමේ ගාස්තුව හා කොටස් මුදල් වෙනුවෙන් ගෙවිය යුතු මුදල ද, මේ සමඟ ඉදිරිපත් කරමි."
        </p>
        <div class="sig-box">
          ${app.signatureImage ? `<img src="${app.signatureImage}" class="sig-img"><br>` : ''}
          <strong style="font-size: 12px;">සාමාජික අයදුම්කරුගේ අත්සන</strong>
        </div>

        <div style="margin-top: 20px; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 11px; color: #64748b;">
          <strong>කාර්යාලීය ප්‍රයෝජනය සඳහා පමණි (Bank Use Only):</strong><br>
          කාරක සභා නිර්දේශය: ................................... | ගරු සභාපති අත්සන: .................... | ගරු ලේකම් අත්සන: ....................
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  // Download Application as PDF
  window.downloadMembershipApplicationPDF = () => {
    window.printMembershipApplicationCopy();
  };

  // ================= ණය වාරික ගෙවීම් (LOAN INSTALLMENT PAYMENT) CONTROLLER =================
  let uploadedLoanReceiptBase64 = null;

  window.openLoanPaymentModal = () => {
    const modal = document.getElementById('loan-payment-modal');
    const formContainer = document.getElementById('loan-payment-form-container');
    const successView = document.getElementById('loan-payment-success-view');
    const form = document.getElementById('loan-payment-form');

    if (form) form.reset();
    window.clearLoanReceiptUpload();

    if (formContainer) formContainer.classList.remove('hidden');
    if (successView) successView.classList.add('hidden');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeLoanPaymentModal = () => {
    const modal = document.getElementById('loan-payment-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  };

  window.handleLoanReceiptSelected = async (input) => {
    const file = input.files && input.files[0];
    if (!file) return;

    const prompt = document.getElementById('lp-receipt-upload-prompt');
    const previewCont = document.getElementById('lp-receipt-preview-container');
    const previewImg = document.getElementById('lp-receipt-preview-img');

    try {
      uploadedLoanReceiptBase64 = await compressImageFile(file, 900, 900, 0.65);
      if (prompt) prompt.classList.add('hidden');
      if (previewCont) previewCont.classList.remove('hidden');
      if (previewImg) {
        if (file.type.startsWith('image/')) {
          previewImg.src = uploadedLoanReceiptBase64;
          previewImg.classList.remove('hidden');
        } else {
          previewImg.src = 'assets/images/gscs-logo.png';
        }
      }
    } catch (err) {
      console.error('Loan receipt error:', err);
    }
  };

  window.clearLoanReceiptUpload = () => {
    uploadedLoanReceiptBase64 = null;
    const input = document.getElementById('lp-receipt-file');
    if (input) input.value = '';
    const prompt = document.getElementById('lp-receipt-upload-prompt');
    const previewCont = document.getElementById('lp-receipt-preview-container');
    const previewImg = document.getElementById('lp-receipt-preview-img');

    if (prompt) prompt.classList.remove('hidden');
    if (previewCont) previewCont.classList.add('hidden');
    if (previewImg) previewImg.src = '';
  };

  window.handleLoanPaymentSubmit = (e) => {
    e.preventDefault();

    if (!uploadedLoanReceiptBase64) {
      alert('කරුණාකර ඔබගේ බැංකු තැන්පතු රිසිට්පත හෝ Online Transfer ස්ලිප්පත Upload කරන්න!');
      return;
    }

    const memberNo = document.getElementById('lp-member-no').value.trim();
    const memberName = document.getElementById('lp-member-name').value.trim();
    const loanType = document.getElementById('lp-loan-type').value;
    const phone = document.getElementById('lp-phone').value.trim();
    const amount = document.getElementById('lp-amount').value.trim();
    const loanAccNo = document.getElementById('lp-loan-acc-no') ? document.getElementById('lp-loan-acc-no').value.trim() : '';

    const newPayment = {
      memberNo,
      memberName,
      loanType,
      phone,
      amount: parseFloat(amount) || 0,
      loanAccNo,
      bankAccount: "People's Bank - 124200110064754 (Nikaweratiya)",
      receiptImage: uploadedLoanReceiptBase64
    };

    const savedPayment = window.bankStore.addLoanPayment(newPayment);

    // Notify listeners
    window.dispatchEvent(new CustomEvent('bankDataUpdated'));

    // Switch to success view
    const formContainer = document.getElementById('loan-payment-form-container');
    const successView = document.getElementById('loan-payment-success-view');
    if (formContainer) formContainer.classList.add('hidden');
    if (successView) successView.classList.remove('hidden');

    const refEl = document.getElementById('succ-lp-ref');
    const memEl = document.getElementById('succ-lp-member');
    const loanEl = document.getElementById('succ-lp-loan-type');
    const amtEl = document.getElementById('succ-lp-amount');

    if (refEl) refEl.textContent = savedPayment.refId;
    if (memEl) memEl.textContent = `${savedPayment.memberNo} - ${savedPayment.memberName}`;
    if (loanEl) loanEl.textContent = savedPayment.loanType;
    if (amtEl) amtEl.textContent = `රු. ${Number(savedPayment.amount).toLocaleString()}.00`;

    showToast('ණය වාරික ගෙවීම් විස්තර සාර්ථකව යොමු කරන ලදී!', 'success');
  };

  // ================= ඉතුරුම් තැන්පත් කිරීම් (SAVINGS & DEPOSIT PAYMENT) CONTROLLER =================
  let uploadedSavingsReceiptBase64 = null;

  window.openSavingsDepositModal = () => {
    const modal = document.getElementById('savings-deposit-modal');
    const formContainer = document.getElementById('savings-deposit-form-container');
    const successView = document.getElementById('savings-deposit-success-view');
    const form = document.getElementById('savings-deposit-form');

    if (form) form.reset();
    window.clearSavingsReceiptUpload();

    if (formContainer) formContainer.classList.remove('hidden');
    if (successView) successView.classList.add('hidden');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeSavingsDepositModal = () => {
    const modal = document.getElementById('savings-deposit-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  };

  window.handleSavingsReceiptSelected = async (input) => {
    const file = input.files && input.files[0];
    if (!file) return;

    const prompt = document.getElementById('dep-receipt-upload-prompt');
    const previewCont = document.getElementById('dep-receipt-preview-container');
    const previewImg = document.getElementById('dep-receipt-preview-img');

    try {
      uploadedSavingsReceiptBase64 = await compressImageFile(file, 900, 900, 0.65);
      if (prompt) prompt.classList.add('hidden');
      if (previewCont) previewCont.classList.remove('hidden');
      if (previewImg) {
        if (file.type.startsWith('image/')) {
          previewImg.src = uploadedSavingsReceiptBase64;
          previewImg.classList.remove('hidden');
        } else {
          previewImg.src = 'assets/images/gscs-logo.png';
        }
      }
    } catch (err) {
      console.error('Savings receipt error:', err);
    }
  };

  window.clearSavingsReceiptUpload = () => {
    uploadedSavingsReceiptBase64 = null;
    const input = document.getElementById('dep-receipt-file');
    if (input) input.value = '';
    const prompt = document.getElementById('dep-receipt-upload-prompt');
    const previewCont = document.getElementById('dep-receipt-preview-container');
    const previewImg = document.getElementById('dep-receipt-preview-img');

    if (prompt) prompt.classList.remove('hidden');
    if (previewCont) previewCont.classList.add('hidden');
    if (previewImg) previewImg.src = '';
  };

  window.handleSavingsDepositSubmit = (e) => {
    e.preventDefault();

    if (!uploadedSavingsReceiptBase64) {
      alert('කරුණාකර ඔබගේ බැංකු තැන්පතු රිසිට්පත හෝ Online Transfer ස්ලිප්පත Upload කරන්න!');
      return;
    }

    const memberNo = document.getElementById('dep-member-no').value.trim();
    const memberName = document.getElementById('dep-member-name').value.trim();
    const depositType = document.getElementById('dep-deposit-type').value;
    const phone = document.getElementById('dep-phone').value.trim();
    const amount = document.getElementById('dep-amount').value.trim();
    const savingsAccNo = document.getElementById('dep-savings-acc-no') ? document.getElementById('dep-savings-acc-no').value.trim() : '';

    const newDeposit = {
      memberNo,
      memberName,
      loanType: 'තැන්පතු: ' + depositType,
      depositType: depositType,
      isDeposit: true,
      phone,
      amount: parseFloat(amount) || 0,
      loanAccNo: savingsAccNo,
      bankAccount: "People's Bank - 124200110064754 (Nikaweratiya)",
      receiptImage: uploadedSavingsReceiptBase64
    };

    // Save using bankStore (with GSCS-DEP prefix refId)
    const savedDeposit = window.bankStore.addLoanPayment(newDeposit);
    if (savedDeposit && savedDeposit.refId && savedDeposit.refId.startsWith('GSCS-LP')) {
      savedDeposit.refId = savedDeposit.refId.replace('GSCS-LP-', 'GSCS-DEP-');
      window.bankStore.save();
    }

    // Notify listeners
    window.dispatchEvent(new CustomEvent('bankDataUpdated'));

    // Switch to success view
    const formContainer = document.getElementById('savings-deposit-form-container');
    const successView = document.getElementById('savings-deposit-success-view');
    if (formContainer) formContainer.classList.add('hidden');
    if (successView) successView.classList.remove('hidden');

    const refEl = document.getElementById('succ-dep-ref');
    const memEl = document.getElementById('succ-dep-member');
    const depEl = document.getElementById('succ-dep-deposit-type');
    const amtEl = document.getElementById('succ-dep-amount');

    if (refEl) refEl.textContent = savedDeposit.refId;
    if (memEl) memEl.textContent = `${savedDeposit.memberNo} - ${savedDeposit.memberName}`;
    if (depEl) depEl.textContent = depositType;
    if (amtEl) amtEl.textContent = `රු. ${Number(savedDeposit.amount).toLocaleString()}.00`;

    showToast('ඉතුරුම් තැන්පතු විස්තර සාර්ථකව යොමු කරන ලදී!', 'success');
  };

  // ================= SMART COOP APP REGISTRATION APPLICATION CONTROLLER =================
  let smartCoopSigCanvas, smartCoopSigCtx;
  let isDrawingScSig = false;
  let scSignatureDataUrl = '';
  let lastSubmittedSmartCoopApp = null;

  function initSmartCoopSignaturePad() {
    smartCoopSigCanvas = document.getElementById('sc-sig-canvas');
    if (!smartCoopSigCanvas) return;
    smartCoopSigCtx = smartCoopSigCanvas.getContext('2d');

    smartCoopSigCtx.strokeStyle = '#000000';
    smartCoopSigCtx.lineWidth = 2.2;
    smartCoopSigCtx.lineCap = 'round';
    smartCoopSigCtx.lineJoin = 'round';

    const getPos = (e) => {
      const rect = smartCoopSigCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scaleX = smartCoopSigCanvas.width / rect.width;
      const scaleY = smartCoopSigCanvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      isDrawingScSig = true;
      const pos = getPos(e);
      smartCoopSigCtx.beginPath();
      smartCoopSigCtx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!isDrawingScSig) return;
      e.preventDefault();
      const pos = getPos(e);
      smartCoopSigCtx.lineTo(pos.x, pos.y);
      smartCoopSigCtx.stroke();
    };

    const stopDraw = (e) => {
      if (!isDrawingScSig) return;
      isDrawingScSig = false;
      scSignatureDataUrl = smartCoopSigCanvas.toDataURL('image/png');
    };

    smartCoopSigCanvas.addEventListener('mousedown', startDraw);
    smartCoopSigCanvas.addEventListener('mousemove', draw);
    smartCoopSigCanvas.addEventListener('mouseup', stopDraw);
    smartCoopSigCanvas.addEventListener('mouseleave', stopDraw);

    smartCoopSigCanvas.addEventListener('touchstart', startDraw, { passive: false });
    smartCoopSigCanvas.addEventListener('touchmove', draw, { passive: false });
    smartCoopSigCanvas.addEventListener('touchend', stopDraw, { passive: false });
  }

  window.clearSmartCoopSigCanvas = () => {
    if (smartCoopSigCanvas && smartCoopSigCtx) {
      smartCoopSigCtx.clearRect(0, 0, smartCoopSigCanvas.width, smartCoopSigCanvas.height);
      scSignatureDataUrl = '';
    }
  };

  window.openSmartCoopRegModal = () => {
    const modal = document.getElementById('smartcoop-reg-modal');
    const formCont = document.getElementById('sc-form-container');
    const succCont = document.getElementById('sc-success-view');
    const form = document.getElementById('smartcoop-reg-form');

    if (form) form.reset();
    window.clearSmartCoopSigCanvas();

    if (formCont) formCont.classList.remove('hidden');
    if (succCont) succCont.classList.add('hidden');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      setTimeout(initSmartCoopSignaturePad, 100);
    }
  };

  window.closeSmartCoopRegModal = () => {
    const modal = document.getElementById('smartcoop-reg-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  };

  window.handleSmartCoopSubmit = (e) => {
    e.preventDefault();

    if (!scSignatureDataUrl) {
      alert('කරුණාකර ඔබගේ ඩිජිටල් අත්සන (Digital E-Signature) ඇතුළත් කරන්න!');
      return;
    }

    const accNo = document.getElementById('sc-acc-no').value.trim();
    const fullName = document.getElementById('sc-full-name').value.trim();
    const nameEnglishCaps = document.getElementById('sc-name-en').value.trim().toUpperCase();
    const nic = document.getElementById('sc-nic').value.trim();
    const gender = document.getElementById('sc-gender').value;
    const address = document.getElementById('sc-address').value.trim();
    const phone = document.getElementById('sc-phone').value.trim();
    const username = document.getElementById('sc-username').value.trim();

    const newApp = {
      accNo,
      fullName,
      nameEnglishCaps,
      nic,
      gender,
      address,
      phone,
      username,
      signatureImage: scSignatureDataUrl
    };

    const savedApp = window.bankStore.addSmartCoopApplication(newApp);
    lastSubmittedSmartCoopApp = savedApp;

    window.dispatchEvent(new CustomEvent('bankDataUpdated'));

    const formCont = document.getElementById('sc-form-container');
    const succCont = document.getElementById('sc-success-view');
    if (formCont) formCont.classList.add('hidden');
    if (succCont) succCont.classList.remove('hidden');

    const refEl = document.getElementById('succ-sc-ref');
    const accEl = document.getElementById('succ-sc-acc');
    const nameEl = document.getElementById('succ-sc-name');
    const userEl = document.getElementById('succ-sc-user');

    if (refEl) refEl.textContent = savedApp.refId;
    if (accEl) accEl.textContent = savedApp.accNo;
    if (nameEl) nameEl.textContent = savedApp.fullName;
    if (userEl) userEl.textContent = savedApp.username;

    showToast('Smart COOP අයදුම්පත සාර්ථකව යොමු කරන ලදී!', 'success');
  };

  window.downloadSmartCoopApplicationPDF = () => {
    if (lastSubmittedSmartCoopApp) {
      window.printSmartCoopApp(lastSubmittedSmartCoopApp.id);
    } else {
      window.print();
    }
  };

  // ============================================================
  // --- MEMBER FEEDBACK FORM HANDLER ---
  // ============================================================
  let selectedFeedbackRating = 0;

  window.resetFeedbackStars = function() {
    selectedFeedbackRating = 0;
    document.querySelectorAll('.fb-star').forEach(s => {
      s.classList.remove('text-yellow-400');
      s.classList.add('text-slate-300');
    });
    const ratingInput = document.getElementById('fb-rating');
    const ratingText = document.getElementById('fb-rating-text');
    if (ratingInput) ratingInput.value = 0;
    if (ratingText) ratingText.textContent = 'තරුවකක් click කරන්න';
  };

  function setupFeedbackForm() {
    // Star rating interaction
    const starContainer = document.getElementById('fb-star-container');
    const ratingInput = document.getElementById('fb-rating');
    const ratingText = document.getElementById('fb-rating-text');
    const ratingLabels = ['', 'දුර්වලයි', 'සාමාන්‍යයි', 'හොඳයි', 'ඉතා හොඳයි', 'විශිෂ්ටයි!'];

    if (starContainer) {
      starContainer.querySelectorAll('.fb-star').forEach(star => {
        star.addEventListener('click', () => {
          selectedFeedbackRating = parseInt(star.getAttribute('data-value'));
          if (ratingInput) ratingInput.value = selectedFeedbackRating;
          if (ratingText) ratingText.textContent = ratingLabels[selectedFeedbackRating] || '';
          starContainer.querySelectorAll('.fb-star').forEach(s => {
            const v = parseInt(s.getAttribute('data-value'));
            if (v <= selectedFeedbackRating) {
              s.classList.remove('text-slate-300');
              s.classList.add('text-yellow-400');
            } else {
              s.classList.remove('text-yellow-400');
              s.classList.add('text-slate-300');
            }
          });
        });

        star.addEventListener('mouseover', () => {
          const hoverVal = parseInt(star.getAttribute('data-value'));
          starContainer.querySelectorAll('.fb-star').forEach(s => {
            const v = parseInt(s.getAttribute('data-value'));
            if (v <= hoverVal) {
              s.classList.add('text-yellow-400');
              s.classList.remove('text-slate-300');
            } else {
              s.classList.remove('text-yellow-400');
              s.classList.add('text-slate-300');
            }
          });
        });

        star.addEventListener('mouseleave', () => {
          starContainer.querySelectorAll('.fb-star').forEach(s => {
            const v = parseInt(s.getAttribute('data-value'));
            if (v <= selectedFeedbackRating) {
              s.classList.add('text-yellow-400');
              s.classList.remove('text-slate-300');
            } else {
              s.classList.remove('text-yellow-400');
              s.classList.add('text-slate-300');
            }
          });
        });
      });
    }

    // Form submit
    const feedbackForm = document.getElementById('feedback-form');
    if (!feedbackForm) return;

    feedbackForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('fb-name').value.trim();
      const village = document.getElementById('fb-village').value.trim();
      const phone = document.getElementById('fb-phone').value.trim();
      const service = document.getElementById('fb-service').value;
      const message = document.getElementById('fb-message').value.trim();
      const consent = document.getElementById('fb-consent').checked;
      const rating = parseInt(document.getElementById('fb-rating').value) || 0;

      if (!name || !village || !phone || !message) {
        showToast('කරුණාකර සියලු අවශ්‍ය ක්ෂේත්‍ර පුරවන්න.', 'error');
        return;
      }
      if (!consent) {
        showToast('ප්‍රකාශනය සඳහා අනුමැතිය ලබාදෙන්න.', 'error');
        return;
      }
      if (rating === 0) {
        showToast('කරුණාකර ශ්‍රේණිගත කිරීමක් select කරන්න.', 'error');
        return;
      }

      const savedFeedback = window.bankStore.addFeedback({
        name, village, phone, service, message, rating, consent
      });

      // Show success
      document.getElementById('feedback-form-container').classList.add('hidden');
      const successView = document.getElementById('feedback-success-view');
      successView.classList.remove('hidden');
      const refEl = document.getElementById('feedback-ref-display');
      if (refEl) refEl.textContent = 'යොමු අංකය: ' + savedFeedback.refId;

      showToast('ප්‍රතිපෝෂණය සාර්ථකව ලැබිණ! ස්තූතියි.', 'success');
    });
  }

  // Call setup
  try { setupFeedbackForm(); } catch(e) { console.error('Feedback form error:', e); }


  // =========================================================================
  // --- DIGITAL EXTERNAL DEPOSIT APPLICATION (බාහිර තැන්පත් අයදුම්පත) CONTROLLER ---
  // =========================================================================
  let uploadedEdaReceiptBase64 = null;
  let hasDrawnEdaSig1 = false;
  let hasDrawnEdaSig2 = false;
  let isDrawingEdaSig1 = false;
  let isDrawingEdaSig2 = false;
  let edaSigCanvas1 = null, edaSigCtx1 = null;
  let edaSigCanvas2 = null, edaSigCtx2 = null;
  let lastSubmittedEdaApp = null;

  function initEdaSignaturePads() {
    // Pad 1
    edaSigCanvas1 = document.getElementById('eda-sig-pad-1');
    if (edaSigCanvas1) {
      edaSigCtx1 = edaSigCanvas1.getContext('2d');
      const rect1 = edaSigCanvas1.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      edaSigCanvas1.width = (rect1.width || 600) * dpr;
      edaSigCanvas1.height = (rect1.height || 150) * dpr;
      edaSigCtx1.scale(dpr, dpr);
      edaSigCtx1.strokeStyle = '#0B0D7C';
      edaSigCtx1.lineWidth = 2.4;
      edaSigCtx1.lineCap = 'round';
      edaSigCtx1.lineJoin = 'round';

      function getPos1(e) {
        const r = edaSigCanvas1.getBoundingClientRect();
        if (e.touches && e.touches[0]) {
          return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
        }
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      }

      function startDraw1(e) {
        e.preventDefault();
        isDrawingEdaSig1 = true;
        const pos = getPos1(e);
        edaSigCtx1.beginPath();
        edaSigCtx1.moveTo(pos.x, pos.y);
        const pl = document.getElementById('eda-sig-placeholder-1');
        if (pl) pl.classList.add('hidden');
      }

      function moveDraw1(e) {
        if (!isDrawingEdaSig1) return;
        e.preventDefault();
        const pos = getPos1(e);
        edaSigCtx1.lineTo(pos.x, pos.y);
        edaSigCtx1.stroke();
        hasDrawnEdaSig1 = true;
      }

      function endDraw1(e) {
        if (isDrawingEdaSig1) {
          edaSigCtx1.closePath();
          isDrawingEdaSig1 = false;
        }
      }

      edaSigCanvas1.onmousedown = startDraw1;
      edaSigCanvas1.onmousemove = moveDraw1;
      window.addEventListener('mouseup', endDraw1);
      edaSigCanvas1.ontouchstart = startDraw1;
      edaSigCanvas1.ontouchmove = moveDraw1;
      window.addEventListener('touchend', endDraw1);
    }

    // Pad 2 (Joint)
    edaSigCanvas2 = document.getElementById('eda-sig-pad-2');
    if (edaSigCanvas2) {
      edaSigCtx2 = edaSigCanvas2.getContext('2d');
      const rect2 = edaSigCanvas2.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      edaSigCanvas2.width = (rect2.width || 600) * dpr;
      edaSigCanvas2.height = (rect2.height || 150) * dpr;
      edaSigCtx2.scale(dpr, dpr);
      edaSigCtx2.strokeStyle = '#0B0D7C';
      edaSigCtx2.lineWidth = 2.4;
      edaSigCtx2.lineCap = 'round';
      edaSigCtx2.lineJoin = 'round';

      function getPos2(e) {
        const r = edaSigCanvas2.getBoundingClientRect();
        if (e.touches && e.touches[0]) {
          return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
        }
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      }

      function startDraw2(e) {
        e.preventDefault();
        isDrawingEdaSig2 = true;
        const pos = getPos2(e);
        edaSigCtx2.beginPath();
        edaSigCtx2.moveTo(pos.x, pos.y);
        const pl = document.getElementById('eda-sig-placeholder-2');
        if (pl) pl.classList.add('hidden');
      }

      function moveDraw2(e) {
        if (!isDrawingEdaSig2) return;
        e.preventDefault();
        const pos = getPos2(e);
        edaSigCtx2.lineTo(pos.x, pos.y);
        edaSigCtx2.stroke();
        hasDrawnEdaSig2 = true;
      }

      function endDraw2(e) {
        if (isDrawingEdaSig2) {
          edaSigCtx2.closePath();
          isDrawingEdaSig2 = false;
        }
      }

      edaSigCanvas2.onmousedown = startDraw2;
      edaSigCanvas2.onmousemove = moveDraw2;
      window.addEventListener('mouseup', endDraw2);
      edaSigCanvas2.ontouchstart = startDraw2;
      edaSigCanvas2.ontouchmove = moveDraw2;
      window.addEventListener('touchend', endDraw2);
    }
  }

  window.clearEdaSignatureCanvas = (num) => {
    if (num === 1) {
      if (!edaSigCanvas1 || !edaSigCtx1) return;
      edaSigCtx1.clearRect(0, 0, edaSigCanvas1.width, edaSigCanvas1.height);
      hasDrawnEdaSig1 = false;
      const pl1 = document.getElementById('eda-sig-placeholder-1');
      if (pl1) pl1.classList.remove('hidden');
    } else if (num === 2) {
      if (!edaSigCanvas2 || !edaSigCtx2) return;
      edaSigCtx2.clearRect(0, 0, edaSigCanvas2.width, edaSigCanvas2.height);
      hasDrawnEdaSig2 = false;
      const pl2 = document.getElementById('eda-sig-placeholder-2');
      if (pl2) pl2.classList.remove('hidden');
    }
  };

  window.toggleEdaJoint = (isJoint) => {
    const sec = document.getElementById('eda-joint-applicant-section');
    if (!sec) return;
    if (isJoint) {
      sec.classList.remove('hidden');
      setTimeout(() => initEdaSignaturePads(), 100);
    } else {
      sec.classList.add('hidden');
    }
  };

  window.openExternalDepositModal = () => {
    const modal = document.getElementById('external-deposit-modal');
    const formCont = document.getElementById('eda-form-container');
    const succView = document.getElementById('eda-success-view');
    const form = document.getElementById('external-deposit-app-form');

    if (form) form.reset();
    window.clearEdaReceiptUpload();
    window.clearEdaSignatureCanvas(1);
    window.clearEdaSignatureCanvas(2);
    window.toggleEdaJoint(false);

    const indRadio = document.querySelector('input[name="eda_account_type"][value="individual"]');
    if (indRadio) indRadio.checked = true;

    if (formCont) formCont.classList.remove('hidden');
    if (succView) succView.classList.add('hidden');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      setTimeout(() => initEdaSignaturePads(), 150);
    }
  };

  window.closeExternalDepositModal = () => {
    const modal = document.getElementById('external-deposit-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  };

  window.handleEdaReceiptSelected = async (input) => {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      try {
        uploadedEdaReceiptBase64 = await compressImageFile(file, 900, 900, 0.65);
        const prompt = document.getElementById('eda-receipt-upload-prompt');
        const container = document.getElementById('eda-receipt-preview-container');
        const img = document.getElementById('eda-receipt-preview-img');
        if (prompt) prompt.classList.add('hidden');
        if (container) container.classList.remove('hidden');
        if (img) img.src = uploadedEdaReceiptBase64;
      } catch (err) {
        console.error('EDA receipt upload error:', err);
      }
    }
  };

  window.clearEdaReceiptUpload = () => {
    uploadedEdaReceiptBase64 = null;
    const input = document.getElementById('eda-receipt-file');
    if (input) input.value = '';
    const prompt = document.getElementById('eda-receipt-upload-prompt');
    const container = document.getElementById('eda-receipt-preview-container');
    const img = document.getElementById('eda-receipt-preview-img');
    if (prompt) prompt.classList.remove('hidden');
    if (container) container.classList.add('hidden');
    if (img) img.src = '';
  };

  window.handleExternalDepositSubmit = (e) => {
    e.preventDefault();

    if (!hasDrawnEdaSig1) {
      alert('කරුණාකර අයදුම්කරු 01 සඳහා විද්‍යුත් අත්සන (E-Signature) තබන්න.');
      const pad = document.getElementById('eda-sig-pad-1');
      if (pad) pad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const accountType = document.querySelector('input[name="eda_account_type"]:checked') ? document.querySelector('input[name="eda_account_type"]:checked').value : 'individual';
    const isJoint = accountType === 'joint';

    if (isJoint && !hasDrawnEdaSig2) {
      alert('හවුල් ගිණුමක් සඳහා දෙවන අයදුම්කරුගේ (Applicant 02) විද්‍යුත් අත්සනද අවශ්‍ය වේ.');
      const pad2 = document.getElementById('eda-sig-pad-2');
      if (pad2) pad2.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!uploadedEdaReceiptBase64) {
      alert('කරුණාකර රු. 2,000/- හෝ ඊට වැඩි ආරම්භක තැන්පතු රිසිට්පත Upload කරන්න.');
      const zone = document.getElementById('eda-receipt-dropzone');
      if (zone) zone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const amountVal = parseFloat(document.getElementById('eda-deposit-amount').value) || 2000;
    if (amountVal < 2000) {
      alert('බාහිර ඉතුරුම් ගිණුමක් විවෘත කිරීම සඳහා අවම තැන්පතුව රු. 2,000.00 කි.');
      return;
    }

    let sig1DataUrl = '';
    let sig2DataUrl = '';
    try { if (edaSigCanvas1) sig1DataUrl = edaSigCanvas1.toDataURL('image/png'); } catch(err) {}
    try { if (isJoint && edaSigCanvas2) sig2DataUrl = edaSigCanvas2.toDataURL('image/png'); } catch(err) {}

    const newEdaApp = {
      appType: 'EXTERNAL_DEPOSIT',
      isExternalDeposit: true,
      accountType: isJoint ? 'හවුල් ගිණුම (Joint Account)' : 'තනි ගිණුම (Individual Account)',
      
      // Applicant 01
      fullName: document.getElementById('eda-fullname-1').value.trim(),
      nameWithInitials: document.getElementById('eda-initials-name-1').value.trim(),
      nameEnglishCaps: document.getElementById('eda-name-en-1').value.trim().toUpperCase(),
      nic: document.getElementById('eda-nic-1').value.trim(),
      gender: document.getElementById('eda-gender-1').value,
      address: document.getElementById('eda-address-1').value.trim(),
      city: document.getElementById('eda-city-1').value.trim(),
      dob: document.getElementById('eda-dob-1').value,
      maritalStatus: document.getElementById('eda-marital-1').value,
      phone: document.getElementById('eda-phone-1').value.trim(),
      whatsapp: document.getElementById('eda-whatsapp-1').value.trim(),
      email: document.getElementById('eda-email-1').value.trim(),
      religion: document.getElementById('eda-religion-1').value,
      gnDivision: document.getElementById('eda-gn-1').value.trim(),
      signatureImage: sig1DataUrl,

      // Applicant 02 (if joint)
      applicant2: isJoint ? {
        fullName: document.getElementById('eda-fullname-2').value.trim(),
        nameWithInitials: document.getElementById('eda-initials-name-2').value.trim(),
        nameEnglishCaps: document.getElementById('eda-name-en-2').value.trim().toUpperCase(),
        nic: document.getElementById('eda-nic-2').value.trim(),
        gender: document.getElementById('eda-gender-2').value,
        address: document.getElementById('eda-address-2').value.trim(),
        city: document.getElementById('eda-city-2').value.trim(),
        dob: document.getElementById('eda-dob-2').value,
        maritalStatus: document.getElementById('eda-marital-2').value,
        phone: document.getElementById('eda-phone-2').value.trim(),
        whatsapp: document.getElementById('eda-whatsapp-2').value.trim(),
        email: document.getElementById('eda-email-2').value.trim(),
        religion: document.getElementById('eda-religion-2').value,
        gnDivision: document.getElementById('eda-gn-2').value.trim(),
        signatureImage: sig2DataUrl
      } : null,

      // Business / Employment
      businessName: document.getElementById('eda-business-name').value.trim(),
      occupation: document.getElementById('eda-occupation').value.trim(),
      businessAddress: document.getElementById('eda-business-address').value.trim(),
      businessPhone: document.getElementById('eda-business-phone').value.trim(),

      // Nominee
      nomineeName: document.getElementById('eda-nominee-name').value.trim(),
      nomineeNic: document.getElementById('eda-nominee-nic').value.trim(),
      nomineeGender: document.getElementById('eda-nominee-gender').value,
      nomineeRelationship: document.getElementById('eda-nominee-rel').value,

      // Initial Deposit
      totalPaid: amountVal,
      receiptImage: uploadedEdaReceiptBase64,
      bankAccount: "People's Bank - 124200110064754 (Nikaweratiya)"
    };

    // Save via store
    const savedApp = window.bankStore.addMembershipApplication(newEdaApp);
    if (savedApp && savedApp.refId && savedApp.refId.startsWith('GSCS-MA-')) {
      savedApp.refId = savedApp.refId.replace('GSCS-MA-', 'GSCS-EDA-');
      window.bankStore.save();
      window.dispatchEvent(new CustomEvent('bankDataUpdated'));
    }
    lastSubmittedEdaApp = savedApp;

    // Switch to success view
    const formCont = document.getElementById('eda-form-container');
    const succView = document.getElementById('eda-success-view');
    if (formCont) formCont.classList.add('hidden');
    if (succView) succView.classList.remove('hidden');

    const refEl = document.getElementById('succ-eda-ref');
    const nameEl = document.getElementById('succ-eda-name');
    const nicEl = document.getElementById('succ-eda-nic');
    const amtEl = document.getElementById('succ-eda-amount');

    if (refEl) refEl.textContent = savedApp.refId;
    if (nameEl) nameEl.textContent = `${savedApp.fullName} (${savedApp.nameWithInitials})`;
    if (nicEl) nicEl.textContent = savedApp.nic;
    if (amtEl) amtEl.textContent = `රු. ${Number(savedApp.totalPaid).toLocaleString()}.00`;

    showToast('බාහිර තැන්පත් අයදුම්පත සාර්ථකව යොමු කරන ලදී!', 'success');
  };

  // Print & PDF for External Deposit Application
  window.printExternalDepositApplicationCopy = (targetId) => {
    let app = null;
    if (targetId) {
      const apps = window.bankStore.getMembershipApplications();
      app = apps.find(a => a.id === targetId || a.refId === targetId);
    }
    if (!app) app = lastSubmittedEdaApp;
    if (!app) {
      alert('අයදුම්පත් විස්තර හමු නොවීය.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=900,height=750');
    if (!printWin) {
      alert('කරුණාකර Popup අවහිර කිරීම ඉවත් කරන්න.');
      return;
    }

    const isJoint = app.accountType && app.accountType.includes('හවුල්');
    const app2 = app.applicant2;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>බාහිර තැන්පත් අයදුම් පත්‍රය - ${app.refId}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, 'Iskoola Pota', sans-serif; padding: 25px; color: #1e293b; max-width: 800px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #0B0D7C; padding-bottom: 12px; margin-bottom: 15px; }
          .logo { height: 55px; margin-bottom: 5px; }
          .title { font-size: 19px; font-weight: bold; color: #0B0D7C; margin: 3px 0; }
          .sub { font-size: 12px; color: #475569; }
          .badge { display: inline-block; padding: 4px 10px; background: #059669; color: #fff; border-radius: 12px; font-size: 11px; font-weight: bold; margin-top: 5px; }
          .section-title { font-size: 13px; font-weight: bold; color: #0B0D7C; background: #f1f5f9; padding: 6px 10px; border-left: 4px solid #059669; margin-top: 14px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11.5px; }
          th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; vertical-align: top; }
          th { background: #f8fafc; font-weight: bold; width: 35%; color: #334155; }
          .payment-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; border-radius: 8px; margin: 10px 0; font-size: 11.5px; }
          .sig-box { border: 1px solid #cbd5e1; padding: 8px; text-align: center; background: #fafafa; border-radius: 8px; }
          .sig-img { max-height: 60px; object-fit: contain; }
          .receipt-img { max-height: 130px; border: 1px solid #ddd; margin-top: 5px; border-radius: 6px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; margin-bottom: 15px; display: flex; justify-content: flex-end; gap: 10px;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            PDF ලෙස සුරකින්න / මුද්‍රණය කරන්න (Print / Save PDF)
          </button>
        </div>

        <div class="header">
          <img src="assets/images/gscs-logo.png" class="logo"><br>
          <div class="title">බාහිර තැන්පත් අයදුම් පත්‍රය (External Deposit Application)</div>
          <div class="sub">සීමා රහිත ගලපිටියාගම සකසුරුවම් හා ණය ගනුදෙනු පිළිබඳ සමූපකාර සමිතිය (කුලි/395)</div>
          <span class="badge">${app.accountType || 'තනි ගිණුම'} | යොමු අංකය: ${app.refId}</span>
        </div>

        <div class="section-title">1. පුද්ගලික තොරතුරු - ප්‍රධාන අයදුම්කරු 01</div>
        <table>
          <tr><th>සම්පූර්ණ නම</th><td>${app.fullName}</td></tr>
          <tr><th>මුලකුරු සමඟ නම</th><td>${app.nameWithInitials}</td></tr>
          <tr><th>ඉංග්‍රීසි නම (Capital)</th><td>${app.nameEnglishCaps}</td></tr>
          <tr><th>ජාතික හැඳුනුම්පත් අංකය</th><td><strong>${app.nic}</strong></td></tr>
          <tr><th>ස්ත්‍රී / පුරුෂ භාවය | උපන් දිනය</th><td>${app.gender} | ${app.dob}</td></tr>
          <tr><th>විවාහක / අවිවාහක | ආගම</th><td>${app.maritalStatus} | ${app.religion || '-'}</td></tr>
          <tr><th>ස්ථිර ලිපිනය | නගරය</th><td>${app.address}, ${app.city}</td></tr>
          <tr><th>ග්‍රාම නිලධාරී වසම</th><td>${app.gnDivision || '-'}</td></tr>
          <tr><th>දුරකථන අංකය | WhatsApp</th><td>${app.phone} | ${app.whatsapp || '-'}</td></tr>
          <tr><th>ඊ-මේල් ලිපිනය</th><td>${app.email || '-'}</td></tr>
        </table>

        ${isJoint && app2 ? `
        <div class="section-title">2. පුද්ගලික තොරතුරු - දෙවන අයදුම්කරු 02 (හවුල් ගිණුම)</div>
        <table>
          <tr><th>සම්පූර්ණ නම</th><td>${app2.fullName}</td></tr>
          <tr><th>මුලකුරු සමඟ නම</th><td>${app2.nameWithInitials}</td></tr>
          <tr><th>ඉංග්‍රීසි නම (Capital)</th><td>${app2.nameEnglishCaps}</td></tr>
          <tr><th>ජාතික හැඳුනුම්පත් අංකය</th><td><strong>${app2.nic}</strong></td></tr>
          <tr><th>ස්ත්‍රී / පුරුෂ භාවය | උපන් දිනය</th><td>${app2.gender} | ${app2.dob}</td></tr>
          <tr><th>ස්ථිර ලිපිනය | නගරය</th><td>${app2.address}, ${app2.city}</td></tr>
          <tr><th>දුරකථන අංකය | WhatsApp</th><td>${app2.phone} | ${app2.whatsapp || '-'}</td></tr>
        </table>
        ` : ''}

        <div class="section-title">3. ව්‍යාපාරික / රැකියා තොරතුරු</div>
        <table>
          <tr><th>ව්‍යාපාරයේ නම | රැකියාව</th><td>${app.businessName || '-'} | ${app.occupation || '-'}</td></tr>
          <tr><th>ස්ථානයේ ලිපිනය | දුරකථනය</th><td>${app.businessAddress || '-'} | ${app.businessPhone || '-'}</td></tr>
        </table>

        <div class="section-title">4. පසු උරුමය සම්බන්ධ තොරතුරු</div>
        <table>
          <tr><th>පසු උරුමකරුගේ සම්පූර්ණ නම</th><td>${app.nomineeName}</td></tr>
          <tr><th>ජාතික හැඳුනුම්පත් අංකය | ස්ත්‍රී/පුරුෂ</th><td>${app.nomineeNic} | ${app.nomineeGender}</td></tr>
          <tr><th>අයදුම්කරුට ඇති නෑදෑකම</th><td>${app.nomineeRelationship}</td></tr>
        </table>

        <div class="section-title">5. ආරම්භක තැන්පතුව (Initial Deposit)</div>
        <div class="payment-box">
          <strong>ආරම්භක තැන්පතු මුදල: රු. ${Number(app.totalPaid).toLocaleString()}.00</strong> (අවම රු. 2,000/-)<br>
          <span>බැංකු ගිණුම: People's Bank - 124200110064754 (Nikaweratiya)</span><br>
          ${app.receiptImage ? `<img src="${app.receiptImage}" class="receipt-img">` : ''}
        </div>

        <div class="section-title">6. ප්‍රකාශය සහ අත්සන් (Signatures)</div>
        <table style="border: none;">
          <tr style="border: none;">
            <td style="border: none; width: ${isJoint ? '50%' : '100%'};">
              <div class="sig-box">
                ${app.signatureImage ? `<img src="${app.signatureImage}" class="sig-img"><br>` : ''}
                <strong>අයදුම්කරු 01 අත්සන</strong>
              </div>
            </td>
            ${isJoint && app2 ? `
            <td style="border: none; width: 50%;">
              <div class="sig-box">
                ${app2.signatureImage ? `<img src="${app2.signatureImage}" class="sig-img"><br>` : ''}
                <strong>අයදුම්කරු 02 අත්සන</strong>
              </div>
            </td>
            ` : ''}
          </tr>
        </table>

        <div style="margin-top: 15px; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 11px; color: #64748b;">
          <strong>කාර්යාලීය ප්‍රයෝජනය සඳහා පමණි (Bank Use Only):</strong><br>
          නව ගිණුම් අංකය: ................................... | දත්ත ඇතුළත් කළේ: .................... | කළමනාකරු: ....................
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  window.downloadExternalDepositApplicationPDF = () => {
    window.printExternalDepositApplicationCopy();
  };


});
