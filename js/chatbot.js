// chatbot.js - "Chat GeeSee" (GSCS Bank's Virtual Assistant)
// Inspired by Commercial Bank's Virtual Assistant (ChatC) UX & Design

(function() {
  'use strict';

  // Format today's date like "26 OCT 2026"
  function getFormattedToday() {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  // Knowledge base and response generator
  function getBotResponse(input) {
    const text = (input || '').toLowerCase().trim();
    const data = window.bankStore ? window.bankStore.getData() : {};
    const info = (data && data.bankInfo) || {};
    const rates = (data && data.interestRates) || {};

    // 1. Greetings
    if (/^(hi|hello|hey|ayubowan|ආයුබෝවන්|හලෝ|හායි|kohomada|සුබ දවසක්)/i.test(text)) {
      return {
        text: `ආයුබෝවන්! මම <strong>Chat GeeSee</strong>, ගලපිටියාගම සණස බැංකුවේ ඩිජිටල් සහායිකාවයි. ඔබට අවශ්‍ය සේවාව පහත විකල්ප මඟින් තෝරන්න හෝ ඔබේ ගැටලුව මෙහි ලියන්න. මම ඔබට ක්ෂණිකව සහාය වන්නෙමි!`,
        pills: [
          { label: 'ණය පහසුකම් (Loans)', action: 'ණය වර්ග මොනවද?' },
          { label: 'පොලී අනුපාත (Rates)', action: 'පොලී අනුපාත කීයද?' },
          { label: 'Smart COOP App', action: 'Smart COOP යෙදුම' },
          { label: 'සාමාජිකත්වය (Membership)', action: 'සාමාජිකත්වය ලබාගැනීම' }
        ]
      };
    }

    // 2. Interest Rates (පොලී අනුපාත)
    if (/polie|rate|interest|අනුපාත|පොලී|fd rate|savings rate/i.test(text)) {
      let fds = rates.fixedDeposits || [
        { tenure: 'මාස 12 (1 Year)', generalRate: '11.50%', seniorRate: '12.00%' },
        { tenure: 'මාස 24 (2 Years)', generalRate: '12.00%', seniorRate: '12.50%' }
      ];
      let fdListHtml = fds.slice(0, 3).map(f => 
        `• <strong>${f.tenure}:</strong> සාමාන්‍ය ${f.generalRate} | ජ්‍යෙෂ්ඨ ${f.seniorRate || f.generalRate}`
      ).join('<br>');

      return {
        text: `📊 <strong>ගලපිටියාගම සණස බැංකුවේ දෛනික පොලී අනුපාත:</strong><br><br>
               <strong>ස්ථාවර තැන්පතු (Fixed Deposits):</strong><br>${fdListHtml}<br><br>
               <strong>ඉතුරුම් ගිණුම්:</strong> වාර්ෂිකව 4.5% - 8.5% දක්වා ඉහළම ප්‍රතිලාභ.<br>
               <strong>සුහුරු ගොවි ණය:</strong> සහනදායී පොලිය 1.0% සිට.<br><br>
               සම්පූර්ණ පොලී පුවරුව වෙබ් අඩවියේ පරීක්ෂා කළ හැක.`,
        actions: [
          { label: 'පොලී පුවරුව බලන්න', onClick: "window.location.hash='#rates'; window.chatGeeSeeClose();" },
          { label: 'තැන්පතු පොලිය ගණනය කරන්න', onClick: "window.location.hash='#fd-calculator'; window.chatGeeSeeClose();" }
        ],
        pills: [
          { label: 'තැන්පතු ආරම්භ කරන්නේ කෙසේද?', action: 'තැන්පතු විස්තර' },
          { label: 'ණය පොලී අනුපාත', action: 'ණය විස්තර' }
        ]
      };
    }

    // 3. Loans & Calculator (ණය පහසුකම්)
    if (/naya|loan|ණය|ණය මුදල්|calculator|ගණකය|agri loan|vehicle loan|ණය වර්ග/i.test(text)) {
      return {
        text: `🌾 <strong>අප ලබාදෙන ප්‍රධාන ණය සේවාවන්:</strong><br><br>
               • <strong>සුහුරු ගොවි ණය:</strong> කෘෂිකාර්මික හා ගොවිතැන් කටයුතු සඳහා අවම පොලී ණය.<br>
               • <strong>ස්වශක්ති වාහන ණය:</strong> යතුරුපැදි, ත්‍රිරෝද රථ, ට්‍රැක්ටර් හා වාහන මිලදී ගැනීමට.<br>
               • <strong>සාමාජික සාමාන්‍ය ණය:</strong> හදිසි මුදල් අවශ්‍යතා සඳහා රු. 500,000 දක්වා.<br>
               • <strong>ව්‍යාපාරික හා ක්ෂුද්‍ර මූල්‍ය ණය:</strong> ස්වයං රැකියා හා ව්‍යාපාර පුළුල් කිරීමට.<br><br>
               ඔබට ණය ඉල්ලුම්පතක් හෝ විමසීමක් මාර්ගගතව යොමු කිරීමට අවශ්‍යද?`,
        actions: [
          { label: 'ණය විමසීමක් යොමු කරන්න', onClick: "window.openInquiryModal('ණය පහසුකම්'); window.chatGeeSeeClose();" },
          { label: 'ණය වාරික ගෙවන්න', onClick: "window.openLoanPaymentModal(); window.chatGeeSeeClose();" }
        ],
        pills: [
          { label: 'ගොවි ණය අවශ්‍ය ලියකියවිලි', action: 'ගොවි ණය විස්තර' },
          { label: 'පොලී අනුපාත කීයද?', action: 'පොලී අනුපාත' }
        ]
      };
    }

    // 4. Fixed Deposits & Savings (ස්ථාවර තැන්පතු හා ඉතුරුම්)
    if (/fd|fixed deposit|thanpathu|තැන්පතු|ithuru|ඉතුරුම්|savings|account/i.test(text)) {
      return {
        text: `💰 <strong>ගලපිටියාගම සණස තැන්පතු සහ ඉතුරුම් ගිණුම්:</strong><br><br>
               • <strong>සෞභාග්‍යා ස්ථාවර තැන්පත්:</strong> උපරිම මාසික හෝ කල්පිරෙන පොලී ආදායමක්. 100% ක් සුරක්ෂිතයි.<br>
               • <strong>සාමාජික සාමාන්‍ය ඉතුරුම්:</strong> අවශ්‍ය ඕනෑම මොහොතක මුදල් ලබාගත හැකි දෛනික ශේෂයට පොලී එකතුවන ගිණුම.<br>
               • <strong>නැණසවිරු ළමා ඉතුරුම්:</strong> දරුවන්ගේ අනාගතයට ඉහළම පොලිය සහ වටිනා ත්‍යාග.<br>
               • <strong>කාන්තා රන්දිරිය ඉතුරුම්:</strong> කාන්තාවන්ට විශේෂ වරප්‍රසාද සහිත ඉතුරුම් සැලසුම.`,
        actions: [
          { label: 'තැන්පතු ගණකය (Calculator)', onClick: "window.location.hash='#fd-calculator'; window.chatGeeSeeClose();" },
          { label: 'ගිණුමක් අරඹන්න විමසන්න', onClick: "window.openInquiryModal('Fixed Deposit'); window.chatGeeSeeClose();" }
        ],
        pills: [
          { label: 'පොලී අනුපාත බලන්න', action: 'පොලී අනුපාත කීයද?' },
          { label: 'Smart COOP මඟින් බලන්න', action: 'Smart COOP යෙදුම' }
        ]
      };
    }

    // 5. Smart COOP Mobile App (ඩිජිටල් යෙදුම)
    if (/smart coop|smartcoop|mobile app|app|යෙදුම|digital|ඇප්/i.test(text)) {
      return {
        text: `📲 <strong>Smart COOP ජංගම යෙදුම:</strong><br><br>
               ගලපිටියාගම සණස බැංකු ගිණුම් ශේෂය පරීක්ෂා කිරීම, ණය වාරික තොරතුරු බැලීම, මුදල් හුවමාරු සහ බිල්පත් ගෙවීම් දැන් ඔබේ ජංගම දුරකථනයෙන්ම සිදු කළ හැක.<br><br>
               • ඔබ තවමත් ලියාපදිංචි වී නොමැති නම් මාර්ගගතව Smart COOP සක්‍රීය කරගත හැක.<br>
               • Android (Google Play) සහ iOS (App Store) හරහා යෙදුම නොමිලේ බාගත හැක.`,
        actions: [
          { label: 'Smart COOP සක්‍රීය කරගන්න', onClick: "window.openSmartCoopRegModal(); window.chatGeeSeeClose();" },
          { label: 'Smart COOP විස්තර බලන්න', onClick: "window.location.hash='#digital-banking'; window.chatGeeSeeClose();" }
        ],
        pills: [
          { label: 'ණය වාරික ගෙවන්නේ කෙසේද?', action: 'ණය වාරික ගෙවීම්' },
          { label: 'සාමාජිකයෙකු වන්නේ කෙසේද?', action: 'සාමාජිකත්වය ලබාගැනීම' }
        ]
      };
    }

    // 6. Online Membership Application (සාමාජිකත්වය)
    if (/membership|samajika|සාමාජික|සාමාජිකත්වය|join|register|අයදුම්පත|application/i.test(text)) {
      return {
        text: `🤝 <strong>සණස බැංකුවේ සාමාජිකත්වය ලබාගැනීම:</strong><br><br>
               ගලපිටියාගම සණස සමූපකාර බැංකුවේ කොටස් හිමි සාමාජිකයෙකු වීමෙන් ඔබට සහනදායී ණය, වාර්ෂික ලාභාංශ සහ විශේෂ සුභසාධන ප්‍රතිලාභ රැසක් හිමිවේ.<br><br>
               <strong>අවශ්‍ය තොරතුරු:</strong><br>
               • සාමාජික කොටස් මුදල්: රු. 5,000.00<br>
               • සාමාජික ඉතුරුම් තැන්පතුව: රු. 1,000.00 (එකතුව රු. 6,000)<br>
               • ජාතික හැඳුනුම්පත් ඡායාරූපය සහ බැංකු තැන්පතු පත්‍රිකාව (Slip)<br><br>
               දැන්ම වෙබ් අඩවියෙන් ඩිජිටල් අත්සන (E-Signature) සහිතව අයදුම් කළ හැක!`,
        actions: [
          { label: 'මාර්ගගත සාමාජික අයදුම්පත පුරවන්න', onClick: "window.openMembershipModal(); window.chatGeeSeeClose();" }
        ],
        pills: [
          { label: 'ණය පහසුකම් පිළිබඳ විමසන්න', action: 'ණය පහසුකම්' },
          { label: 'ශාඛාව අමතන්න', action: 'ශාඛාව සහ දුරකථන' }
        ]
      };
    }

    // 7. Loan Installment Payment (ණය වාරික ගෙවීම්)
    if (/pay|gewanna|payment|slip|warika|වාරික|වාරිකය|ගෙවීම|රිසිට්|transfer|peoples bank/i.test(text)) {
      return {
        text: `💳 <strong>ණය වාරික බැංකු ගිණුමට තැන්පත් කර රිසිට්පත එවීම:</strong><br><br>
               ඔබට ශාඛාවට නොපැමිණ මහජන බැංකුව හරහා ණය වාරික ගෙවිය හැක:<br>
               • <strong>බැංකුව:</strong> People's Bank (මහජන බැංකුව) - නිකවැරටිය ශාඛාව<br>
               • <strong>ගිණුම් නම:</strong> Galapitiyagama Sanasa Society<br>
               • <strong>ගිණුම් අංකය:</strong> <code>124200110064754</code><br><br>
               මුදල් තැන්පත් කිරීමෙන් පසු රිසිට්පතේ ඡායාරූපය අපගේ පද්ධතියට උඩුගත කරන්න. අපගේ නිලධාරීන් එය සත්‍යාපනය කර SMS / WhatsApp තහවුරු කිරීමක් එවනු ඇත.`,
        actions: [
          { label: 'ණය ගෙවීමේ රිසිට්පත යොමු කරන්න', onClick: "window.openLoanPaymentModal(); window.chatGeeSeeClose();" }
        ],
        pills: [
          { label: 'Smart COOP මඟින් ගෙවන්න', action: 'Smart COOP යෙදුම' },
          { label: 'ක්ෂණික ඇමතුම් අංකය', action: 'ශාඛාව සහ දුරකථන' }
        ]
      };
    }

    // 8. Branch, Location & Operating Hours (ශාඛාව හා වේලාවන්)
    if (/branch|location|address|office|koheda|ලිපිනය|නිකවැරටිය|ගලපිටියාගම|hours|welawa|වේලාව|open|close|සඳුදා|සෙනසුරාදා|map/i.test(text)) {
      return {
        text: `📍 <strong>ගලපිටියාගම සණස බැංකු කාර්යාලය:</strong><br><br>
               • <strong>ලිපිනය:</strong> නො. 247, පුත්තලම් පාර, ගලපිටියාගම, නිකවැරටිය.<br>
               • <strong>කාර්යාල වේලාවන්:</strong> සඳුදා සිට සෙනසුරාදා දක්වා පෙ.ව. 9.00 සිට ප.ව. 3.30 දක්වා.<br>
               • <strong>නිවාඩු දින:</strong> ඉරිදා, පෝය දින සහ වෙළඳ නිවාඩු දිනවල වසා ඇත.<br><br>
               ඔබට Google Maps මඟින් අපගේ නිශ්චිත පිහිටීම පහසුවෙන් සොයාගත හැක.`,
        actions: [
          { label: 'Google Maps හි බලන්න', onClick: "window.open('https://maps.google.com/maps?q=7.753640477761326,80.11416811097814', '_blank');" },
          { label: 'ශාඛා විස්තර වෙත යන්න', onClick: "window.location.hash='#contact'; window.chatGeeSeeClose();" }
        ],
        pills: [
          { label: 'දුරකථන අංක මොනවාද?', action: 'ක්ෂණික දුරකථන සේවාව' },
          { label: 'බැංකු සේවා විස්තර', action: 'ණය සහ තැන්පතු' }
        ]
      };
    }

    // 9. Hotlines & Contact (දුරකථන සහ සම්බන්ධතා)
    if (/phone|call|hotline|contact|dura|දුරකථන|ඇමතුම්|email|තැපෑල|whatsapp|වට්ස්ඇප්/i.test(text)) {
      return {
        text: `📞 <strong>ගලපිටියාගම සණස ක්ෂණික සම්බන්ධතා:</strong><br><br>
               • <strong>ක්ෂණික දුරකථන ඇමතුම්:</strong> <a href="tel:+94372260658" class="text-blue-600 font-bold underline">+94 37 22 60 658</a><br>
               • <strong>විද්‍යුත් තැපෑල (Email):</strong> galapitiyagama.sanasa@gmail.com<br>
               • <strong>WhatsApp උපකාරක සේවාව:</strong> <a href="https://wa.me/94771234567" target="_blank" class="text-emerald-600 font-bold underline">WhatsApp පණිවිඩයක් එවන්න</a><br><br>
               ඔබගේ ඕනෑම විමසීමකට බැංකු කාර්යාල වේලාවන් තුළ ක්ෂණික සහාය ලබාදීමට අප සූදානම්!`,
        actions: [
          { label: '📞 දැන්ම අමතන්න (+94 37 22 60 658)', onClick: "window.location.href='tel:+94372260658';" },
          { label: 'මාර්ගගත විමසීම් පත්‍රය', onClick: "window.openInquiryModal('සාමාන්‍ය විමසීම'); window.chatGeeSeeClose();" }
        ],
        pills: [
          { label: 'කාර්යාල වේලාවන්', action: 'කාර්යාල වේලාවන්' },
          { label: 'ප්‍රතිපෝෂණයක් ලියන්න', action: 'අදහස් හා යෝජනා' }
        ]
      };
    }

    // 10. Feedback / Suggestions (අදහස් සහ යෝජනා)
    if (/feedback|adahas|yojana|අදහස්|යෝජනා|ප්‍රතිපෝෂණ|complain|review/i.test(text)) {
      return {
        text: `⭐ <strong>ඔබේ වටිනා අදහස් හා යෝජනා අපට බෙදාගන්න:</strong><br><br>
               අපගේ සාමාජිකයින්ගේ අදහස් හා සාර්ථකත්වයේ කතා අප වෙබ් අඩවියේ පළ කිරීමට සහ සේවාව තවදුරටත් දියුණු කිරීමට ඔබේ අදහස් බෙහෙවින් උපකාරී වේ.`,
        actions: [
          { label: 'ප්‍රතිපෝෂණ පෝරමයට යන්න', onClick: "window.location.hash='#feedback'; window.chatGeeSeeClose();" }
        ],
        pills: [
          { label: 'සාමාජික කතා බලන්න', action: 'සාර්ථකත්වයේ කතා' },
          { label: 'බැංකු සේවා පිළිබඳ විමසන්න', action: 'ණය සහ තැන්පතු' }
        ]
      };
    }

    // 11. General Information (සාමාන්‍ය බැංකු තොරතුරු)
    if (/general|information|විස්තර|තොරතුරු|sanasa|සණස|බැංකුව|ගැන/i.test(text)) {
      return {
        text: `🏛️ <strong>සීමාසහිත ගලපිටියාගම සණස සමූපකාර බැංකුව:</strong><br><br>
               ශ්‍රී ලංකා සමුපකාර සංවර්ධන දෙපාර්තමේන්තුවේ ලියාපදිංචි, ගලපිටියාගම හා අවට ගම්මාන රැසක සාමාජිකයින් දහස් ගණනකගේ විශ්වාසය දිනූ ප්‍රමුඛතම ග්‍රාමීය බැංකු සමිතියයි.<br><br>
               • වසර 39කට අධික අඛණ්ඩ විශිෂ්ට සේවාව<br>
               • 100% ක් සුරක්ෂිත ස්ථාවර තැන්පතු හා ඉතුරුම්<br>
               • සහනදායී කෘෂිකාර්මික හා ව්‍යාපාරික ණය<br>
               • Smart COOP ඩිජිටල් බැංකු පහසුකම්`,
        actions: [
          { label: 'සාමාජිකයෙකු වන්න', onClick: "window.openMembershipModal(); window.chatGeeSeeClose();" },
          { label: 'සේවාවන් පරීක්ෂා කරන්න', onClick: "window.location.hash='#products'; window.chatGeeSeeClose();" }
        ],
        pills: [
          { label: 'පොලී අනුපාත', action: 'පොලී අනුපාත කීයද?' },
          { label: 'ශාඛාව සහ දුරකථන', action: 'ශාඛාව සහ දුරකථන' }
        ]
      };
    }

    // Default Fallback Response
    return {
      text: `ඔබ ඇසූ පැනයට නිශ්චිත තොරතුරු ලබාගැනීමට පහත ප්‍රධාන සේවාවන් අතරින් එකක් තෝරන්න, නැතහොත් ක්ෂණික විමසීමක් යොමු කරන්න. අපගේ නිලධාරියෙකු පැය 24ක් තුළ ඔබ අමතනු ඇත:`,
      actions: [
        { label: 'මාර්ගගත විමසීමක් යොමු කරන්න', onClick: "window.openInquiryModal('සාමාන්‍ය විමසීම'); window.chatGeeSeeClose();" },
        { label: 'ශාඛාව අමතන්න (+94 37 22 60 658)', onClick: "window.location.href='tel:+94372260658';" }
      ],
      pills: [
        { label: 'ණය පහසුකම් (Loans)', action: 'ණය වර්ග මොනවද?' },
        { label: 'පොලී අනුපාත (Rates)', action: 'පොලී අනුපාත කීයද?' },
        { label: 'Smart COOP App', action: 'Smart COOP යෙදුම' },
        { label: 'සාමාජික අයදුම්පත', action: 'සාමාජිකත්වය ලබාගැනීම' },
        { label: 'ණය වාරික ගෙවීම්', action: 'ණය වාරික ගෙවීම්' },
        { label: 'ශාඛාවේ වේලාවන්', action: 'කාර්යාල වේලාවන්' }
      ]
    };
  }

  // Build the Widget DOM
  function initChatGeeSee() {
    // 1. Floating Launcher (Bottom Right)
    const launcherHtml = `
      <div id="chat-geesee-launcher" class="fixed bottom-5 right-5 z-40 flex items-center cursor-pointer select-none group transition-all duration-300 hover:scale-105" onclick="window.chatGeeSeeOpen()" title="Chat with Chat GeeSee!">
        <!-- Assistant Avatar Graphic -->
        <div class="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 z-10 transition-transform group-hover:-translate-y-1">
          <img src="assets/images/chat-geesee-avatar.png" alt="Chat GeeSee" class="w-full h-full object-contain filter drop-shadow-xl">
          <!-- Pulse Online Green Dot -->
          <span class="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-400/40 animate-pulse"></span>
        </div>

        <!-- Yellow ComBank style banner -->
        <div class="-ml-3 pl-5 pr-4 py-2 sm:py-2.5 rounded-2xl sm:rounded-full bg-gradient-to-r from-[#FEE500] via-[#FFEB3B] to-[#FEE500] text-slate-900 border-2 border-[#0B0D7C]/20 shadow-xl flex flex-col justify-center transition-all group-hover:shadow-2xl">
          <div class="flex items-center gap-1.5 leading-none">
            <span class="text-[11px] sm:text-xs font-semibold text-slate-800">Chat with</span>
            <span class="text-xs sm:text-sm font-black text-[#0B0D7C] tracking-tight">Chat GeeSee!</span>
          </div>
          <div class="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-pink-700 mt-0.5">
            <i class="fa-solid fa-sparkles text-[8px] text-pink-600"></i>
            <span>GSCS Bank Virtual Assistant</span>
          </div>
        </div>
      </div>

      <!-- Floating Close Button when open (Seen in screenshot 2 bottom right) -->
      <button id="chat-geesee-toggle-btn" class="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-2xl bg-white border-2 border-slate-300 text-slate-700 shadow-2xl hidden flex items-center justify-center hover:bg-slate-100 hover:text-red-500 transition-all cursor-pointer" onclick="window.chatGeeSeeClose()" title="Close Assistant">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>

      <!-- Main Chat Modal Window -->
      <div id="chat-geesee-modal" class="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[410px] max-w-[430px] h-[580px] sm:h-[620px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden hidden transition-all duration-300 transform scale-95 opacity-0">
        
        <!-- Header: Deep Sanasa Blue with curve & controls -->
        <div class="bg-gradient-to-r from-[#0B0D7C] via-[#0E1196] to-[#181DA8] text-white p-4 sm:p-4.5 flex items-center justify-between border-b border-white/10 flex-shrink-0 shadow-md">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full bg-white/20 p-0.5 border border-white/30 flex items-center justify-center overflow-hidden">
              <img src="assets/images/chat-geesee-avatar.png" alt="GeeSee" class="w-full h-full object-contain">
            </div>
            <div>
              <h3 class="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
                <span>GSCS Bank's Virtual Assistant</span>
              </h3>
              <p class="text-[10px] sm:text-[11px] text-emerald-300 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Chat GeeSee • 24/7 Online</span>
              </p>
            </div>
          </div>

          <!-- Header Action Icons (Bell, Refresh, Minimize) -->
          <div class="flex items-center gap-1 text-white/80">
            <button onclick="window.chatGeeSeeShowAlert()" class="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center text-xs transition-colors" title="Notice">
              <i class="fa-regular fa-bell"></i>
            </button>
            <button onclick="window.chatGeeSeeReset()" class="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center text-xs transition-colors" title="Restart Chat">
              <i class="fa-solid fa-rotate-right"></i>
            </button>
            <button onclick="window.chatGeeSeeClose()" class="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center text-sm transition-colors" title="Minimize">
              <i class="fa-solid fa-chevron-down"></i>
            </button>
          </div>
        </div>

        <!-- Chat Body (Scrollable messages) -->
        <div id="chat-geesee-messages" class="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50 text-xs sm:text-sm">
          <!-- Injected dynamically -->
        </div>

        <!-- Quick Menu Drawer (Slides up when hamburger is tapped) -->
        <div id="chat-geesee-quickmenu" class="hidden bg-white border-t border-slate-200 p-3 shadow-lg max-h-48 overflow-y-auto space-y-1.5 transition-all text-xs flex-shrink-0">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span class="font-bold text-slate-700">ක්ෂණික මෙනුව (Quick Topics)</span>
            <button onclick="window.chatGeeSeeToggleQuickMenu()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="grid grid-cols-2 gap-1.5 pt-1">
            <button onclick="window.chatGeeSeeSendPrompt('General Information')" class="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-pink-50 hover:text-[#DF0178] border border-slate-200 font-semibold truncate">🏛️ බැංකු තොරතුරු</button>
            <button onclick="window.chatGeeSeeSendPrompt('Products & Services')" class="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-pink-50 hover:text-[#DF0178] border border-slate-200 font-semibold truncate">💳 ණය සහ තැන්පතු</button>
            <button onclick="window.chatGeeSeeSendPrompt('Interest Rates')" class="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-pink-50 hover:text-[#DF0178] border border-slate-200 font-semibold truncate">📊 පොලී අනුපාත</button>
            <button onclick="window.chatGeeSeeSendPrompt('FD Calculator')" class="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-pink-50 hover:text-[#DF0178] border border-slate-200 font-semibold truncate">🧮 තැන්පතු ගණකය</button>
            <button onclick="window.chatGeeSeeSendPrompt('Smart COOP App')" class="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-pink-50 hover:text-[#DF0178] border border-slate-200 font-semibold truncate">📲 Smart COOP</button>
            <button onclick="window.chatGeeSeeSendPrompt('Membership')" class="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-pink-50 hover:text-[#DF0178] border border-slate-200 font-semibold truncate">🤝 සාමාජික අයදුම්පත</button>
            <button onclick="window.chatGeeSeeSendPrompt('Loan Installment')" class="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-pink-50 hover:text-[#DF0178] border border-slate-200 font-semibold truncate">💵 ණය වාරික ගෙවීම්</button>
            <button onclick="window.chatGeeSeeSendPrompt('Branch & Hotlines')" class="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-pink-50 hover:text-[#DF0178] border border-slate-200 font-semibold truncate">📍 ශාඛාව & දුරකථන</button>
          </div>
        </div>

        <!-- Input Bar (Matching ComBank layout) -->
        <div class="p-3 bg-white border-t border-slate-200/90 flex items-center gap-2 flex-shrink-0">
          <button onclick="window.chatGeeSeeToggleQuickMenu()" class="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors flex-shrink-0" title="Quick Menu">
            <i class="fa-solid fa-bars text-sm"></i>
          </button>
          <div class="relative flex-grow">
            <input type="text" id="chat-geesee-input" placeholder="Type your message here..." class="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-full px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0B0D7C] transition-all pr-10 shadow-inner">
            <button onclick="window.chatGeeSeeSendMessage()" class="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#0B0D7C] hover:bg-[#DF0178] text-white flex items-center justify-center text-xs transition-colors shadow">
              <i class="fa-solid fa-paper-plane text-[10px]"></i>
            </button>
          </div>
        </div>

      </div>
    `;

    const div = document.createElement('div');
    div.id = 'chat-geesee-container';
    div.innerHTML = launcherHtml;
    document.body.appendChild(div);

    // Initial render of welcome card
    renderWelcomeScreen();

    // Setup input enter listener
    const inputEl = document.getElementById('chat-geesee-input');
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.chatGeeSeeSendMessage();
        }
      });
    }
  }

  // Render the initial ComBank-style Welcome Card
  function renderWelcomeScreen() {
    const container = document.getElementById('chat-geesee-messages');
    if (!container) return;

    const todayStr = getFormattedToday();

    container.innerHTML = `
      <!-- Date stamp -->
      <div class="flex items-center justify-center my-1">
        <div class="text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs uppercase tracking-wider">
          ${todayStr}
        </div>
      </div>

      <!-- Welcome Card (Golden Yellow Layout matching Commercial Bank reference) -->
      <div class="flex items-start gap-2.5">
        <!-- GeeSee Avatar on the Left -->
        <div class="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 pt-1">
          <img src="assets/images/chat-geesee-avatar.png" alt="Chat GeeSee" class="w-full h-full object-contain filter drop-shadow">
        </div>

        <!-- Yellow Welcome Speech Card -->
        <div class="flex-grow bg-[#FEE500] text-slate-900 rounded-3xl rounded-tl-sm p-4 sm:p-5 shadow-md border border-yellow-300">
          <div class="mb-3">
            <p class="text-xs sm:text-sm font-semibold text-slate-800 leading-tight">Hi,</p>
            <div class="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 flex flex-wrap items-center gap-1.5">
              <span>I'm</span>
              <span class="text-[#0B0D7C] font-black text-base sm:text-lg">Chat GeeSee</span>
              <span class="text-xs font-bold text-slate-700">GSCS Bank's virtual assistant.</span>
            </div>
          </div>

          <p class="text-xs text-slate-800 mb-4 leading-relaxed">
            I can assist you with your queries with regard to our Banking products and services. You may select from the following options or type your specific requirement.
          </p>

          <!-- ComBank Style Pill Buttons -->
          <div class="space-y-2">
            <button onclick="window.chatGeeSeeSendPrompt('General Information')" class="w-full text-center px-4 py-2 rounded-full bg-white hover:bg-[#0B0D7C] text-[#0B0D7C] hover:text-white border-2 border-[#0B0D7C]/30 hover:border-[#0B0D7C] font-bold text-xs shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer">
              General Information (බැංකු තොරතුරු)
            </button>
            <button onclick="window.chatGeeSeeSendPrompt('Products & Services')" class="w-full text-center px-4 py-2 rounded-full bg-white hover:bg-[#0B0D7C] text-[#0B0D7C] hover:text-white border-2 border-[#0B0D7C]/30 hover:border-[#0B0D7C] font-bold text-xs shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer">
              Products & Services (ණය සහ තැන්පතු)
            </button>
            <button onclick="window.chatGeeSeeSendPrompt('Interest Rates')" class="w-full text-center px-4 py-2 rounded-full bg-white hover:bg-[#0B0D7C] text-[#0B0D7C] hover:text-white border-2 border-[#0B0D7C]/30 hover:border-[#0B0D7C] font-bold text-xs shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer">
              Interest Rates Board (පොලී අනුපාත)
            </button>
            <button onclick="window.chatGeeSeeSendPrompt('Download Mobile Apps')" class="w-full text-center px-4 py-2 rounded-full bg-white hover:bg-[#0B0D7C] text-[#0B0D7C] hover:text-white border-2 border-[#0B0D7C]/30 hover:border-[#0B0D7C] font-bold text-xs shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer">
              Download Smart COOP Mobile App
            </button>
            <button onclick="window.chatGeeSeeSendPrompt('Member Application')" class="w-full text-center px-4 py-2 rounded-full bg-white hover:bg-[#0B0D7C] text-[#0B0D7C] hover:text-white border-2 border-[#0B0D7C]/30 hover:border-[#0B0D7C] font-bold text-xs shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer">
              Online Membership (සාමාජික අයදුම්පත)
            </button>
            <button onclick="window.chatGeeSeeSendPrompt('Loan Installment')" class="w-full text-center px-4 py-2 rounded-full bg-white hover:bg-[#0B0D7C] text-[#0B0D7C] hover:text-white border-2 border-[#0B0D7C]/30 hover:border-[#0B0D7C] font-bold text-xs shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer">
              Loan Installment Payment (වාරික ගෙවීම්)
            </button>
            <button onclick="window.chatGeeSeeSendPrompt('GSCS Bank Near Me')" class="w-full text-center px-4 py-2 rounded-full bg-white hover:bg-[#0B0D7C] text-[#0B0D7C] hover:text-white border-2 border-[#0B0D7C]/30 hover:border-[#0B0D7C] font-bold text-xs shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer">
              Branch Near Me & Contact (ශාඛාව & ඇමතුම්)
            </button>
          </div>

          <div class="text-[10px] text-slate-600 text-right mt-2 font-mono">
            ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  }

  // Open Chat Window
  window.chatGeeSeeOpen = function() {
    const launcher = document.getElementById('chat-geesee-launcher');
    const modal = document.getElementById('chat-geesee-modal');
    const toggleBtn = document.getElementById('chat-geesee-toggle-btn');
    if (!modal) return;

    if (launcher) launcher.classList.add('hidden');
    if (toggleBtn) toggleBtn.classList.remove('hidden');

    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('scale-95', 'opacity-0');
      modal.classList.add('scale-100', 'opacity-100');
    }, 10);

    const input = document.getElementById('chat-geesee-input');
    if (input) input.focus();
  };

  // Close / Minimize Chat Window
  window.chatGeeSeeClose = function() {
    const launcher = document.getElementById('chat-geesee-launcher');
    const modal = document.getElementById('chat-geesee-modal');
    const toggleBtn = document.getElementById('chat-geesee-toggle-btn');
    if (!modal) return;

    modal.classList.remove('scale-100', 'opacity-100');
    modal.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
      modal.classList.add('hidden');
      if (toggleBtn) toggleBtn.classList.add('hidden');
      if (launcher) launcher.classList.remove('hidden');
    }, 250);
  };

  // Reset Conversation
  window.chatGeeSeeReset = function() {
    renderWelcomeScreen();
    const input = document.getElementById('chat-geesee-input');
    if (input) input.value = '';
  };

  // Show Urgent Alert
  window.chatGeeSeeShowAlert = function() {
    const data = window.bankStore ? window.bankStore.getData() : {};
    const info = (data && data.bankInfo) || {};
    if (info.urgentNoticeActive && info.urgentNotice) {
      appendBotMessage({
        text: `📢 <strong>විශේෂ බැංකු නිවේදනය (Notice):</strong><br><br>${info.urgentNotice}`
      });
    } else {
      appendBotMessage({
        text: `ℹ️ <strong>දැනුම්දීම:</strong> මේ මොහොතේ කිසිදු හදිසි නිවේදනයක් ක්‍රියාත්මක නොවේ. සණස බැංකුවේ සාමාන්‍ය සේවාවන් බාධාවකින් තොරව ක්‍රියාත්මකයි.`
      });
    }
  };

  // Toggle Quick Menu
  window.chatGeeSeeToggleQuickMenu = function() {
    const qm = document.getElementById('chat-geesee-quickmenu');
    if (qm) qm.classList.toggle('hidden');
  };

  // Send a pre-defined prompt button
  window.chatGeeSeeSendPrompt = function(promptText) {
    const qm = document.getElementById('chat-geesee-quickmenu');
    if (qm) qm.classList.add('hidden');

    appendUserMessage(promptText);
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();
      const botReply = getBotResponse(promptText);
      appendBotMessage(botReply);
    }, 450);
  };

  // Send User Message from input
  window.chatGeeSeeSendMessage = function() {
    const input = document.getElementById('chat-geesee-input');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    const qm = document.getElementById('chat-geesee-quickmenu');
    if (qm) qm.classList.add('hidden');

    appendUserMessage(msg);
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();
      const botReply = getBotResponse(msg);
      appendBotMessage(botReply);
    }, 550);
  };

  // Append user message bubble (Right side)
  function appendUserMessage(text) {
    const container = document.getElementById('chat-geesee-messages');
    if (!container) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userBubble = document.createElement('div');
    userBubble.className = 'flex justify-end';
    userBubble.innerHTML = `
      <div class="max-w-[80%] bg-gradient-to-r from-[#DF0178] to-[#BA0063] text-white p-3.5 rounded-2xl rounded-tr-xs shadow-md">
        <p class="text-xs sm:text-sm leading-relaxed">${escapeHtml(text)}</p>
        <div class="text-[9px] text-pink-200 text-right mt-1 font-mono">${timeStr}</div>
      </div>
    `;
    container.appendChild(userBubble);
    container.scrollTop = container.scrollHeight;
  }

  // Append bot message bubble (Left side)
  function appendBotMessage(responseObj) {
    const container = document.getElementById('chat-geesee-messages');
    if (!container) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let actionButtonsHtml = '';
    if (responseObj.actions && responseObj.actions.length > 0) {
      actionButtonsHtml = `
        <div class="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap gap-2">
          ${responseObj.actions.map(btn => `
            <button onclick="${btn.onClick}" class="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-[#0B0D7C] hover:bg-[#DF0178] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
              <span>${btn.label}</span>
              <i class="fa-solid fa-arrow-right text-[10px]"></i>
            </button>
          `).join('')}
        </div>
      `;
    }

    let pillsHtml = '';
    if (responseObj.pills && responseObj.pills.length > 0) {
      pillsHtml = `
        <div class="mt-2.5 flex flex-wrap gap-1.5">
          ${responseObj.pills.map(p => `
            <button onclick="window.chatGeeSeeSendPrompt('${escapeHtml(p.action)}')" class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white hover:bg-yellow-100 text-slate-700 border border-slate-300 hover:border-yellow-400 transition-colors shadow-2xs cursor-pointer">
              ${p.label}
            </button>
          `).join('')}
        </div>
      `;
    }

    const botBubble = document.createElement('div');
    botBubble.className = 'flex items-start gap-2.5';
    botBubble.innerHTML = `
      <div class="w-9 h-9 flex-shrink-0 pt-0.5">
        <img src="assets/images/chat-geesee-avatar.png" alt="GeeSee" class="w-full h-full object-contain filter drop-shadow">
      </div>
      <div class="max-w-[85%] bg-white text-slate-800 p-3.5 rounded-2xl rounded-tl-xs shadow-md border border-slate-200">
        <div class="text-[10px] font-extrabold text-[#0B0D7C] mb-1 flex items-center gap-1">
          <span>Chat GeeSee</span>
          <span class="text-[8px] px-1.5 py-0.2 rounded-full bg-pink-100 text-[#DF0178]">AI</span>
        </div>
        <div class="text-xs sm:text-sm leading-relaxed">${responseObj.text}</div>
        ${actionButtonsHtml}
        ${pillsHtml}
        <div class="text-[9px] text-slate-400 text-right mt-1.5 font-mono">${timeStr}</div>
      </div>
    `;
    container.appendChild(botBubble);
    container.scrollTop = container.scrollHeight;
  }

  // Typing indicator
  function showTypingIndicator() {
    const container = document.getElementById('chat-geesee-messages');
    if (!container) return;

    const ind = document.createElement('div');
    ind.id = 'chat-geesee-typing';
    ind.className = 'flex items-start gap-2.5';
    ind.innerHTML = `
      <div class="w-9 h-9 flex-shrink-0 pt-0.5">
        <img src="assets/images/chat-geesee-avatar.png" alt="GeeSee" class="w-full h-full object-contain opacity-80">
      </div>
      <div class="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-xs shadow-sm border border-slate-200 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-[#DF0178] animate-bounce"></span>
        <span class="w-2 h-2 rounded-full bg-[#0B0D7C] animate-bounce [animation-delay:0.2s]"></span>
        <span class="w-2 h-2 rounded-full bg-yellow-400 animate-bounce [animation-delay:0.4s]"></span>
      </div>
    `;
    container.appendChild(ind);
    container.scrollTop = container.scrollHeight;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('chat-geesee-typing');
    if (el) el.remove();
  }

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.innerText = string;
    return div.innerHTML;
  }

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatGeeSee);
  } else {
    initChatGeeSee();
  }
})();
