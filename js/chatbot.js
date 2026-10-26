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

  // Build the Widget DOM - Mobile-First Design
  function initChatGeeSee() {

    // Inline styles used for reliable mobile rendering
    const launcherHtml = `
      <!-- Floating Launcher Button -->
      <div id="chat-geesee-launcher" role="button" tabindex="0" onclick="window.chatGeeSeeOpen(event)" title="Chat GeeSee"
        style="position:fixed;bottom:18px;right:14px;z-index:9998;cursor:pointer;display:flex;align-items:flex-end;filter:drop-shadow(0 6px 20px rgba(11,13,124,0.28));-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
        <div style="position:relative;flex-shrink:0;pointer-events:none;">
          <img src="assets/images/chat-geesee-avatar.png" alt="Chat GeeSee"
            style="width:58px;height:58px;object-fit:contain;border-radius:50%;background:#fff;padding:3px;box-shadow:0 4px 16px rgba(11,13,124,0.20);border:2.5px solid #FEE500;display:block;">
          <span style="position:absolute;bottom:3px;right:3px;width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid #fff;box-shadow:0 0 0 2px rgba(34,197,94,0.3);"></span>
        </div>
        <div id="chat-geesee-label"
          style="pointer-events:none;margin-left:-8px;padding:6px 14px 6px 18px;background:linear-gradient(90deg,#FEE500,#FFEB3B);border:2px solid rgba(11,13,124,0.15);border-radius:0 20px 20px 0;box-shadow:0 4px 14px rgba(11,13,124,0.12);display:flex;flex-direction:column;justify-content:center;line-height:1.3;">
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:10px;font-weight:600;color:#374151;">Chat with</span>
            <span style="font-size:12px;font-weight:900;color:#0B0D7C;">Chat GeeSee!</span>
          </div>
          <div style="font-size:9px;font-weight:700;color:#be185d;">
            <i class="fa-solid fa-sparkles" style="font-size:8px;color:#db2777;margin-right:2px;"></i>GSCS Virtual Assistant
          </div>
        </div>
      </div>

      <!-- Close button (visible when chat is open) -->
      <button id="chat-geesee-toggle-btn" onclick="window.chatGeeSeeClose(event)"
        style="position:fixed;bottom:18px;right:14px;z-index:9999;width:50px;height:50px;border-radius:14px;background:#fff;border:2px solid #e2e8f0;color:#475569;box-shadow:0 6px 22px rgba(0,0,0,0.16);display:none;align-items:center;justify-content:center;cursor:pointer;font-size:18px;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <!-- Chat Window (size controlled by JS) -->
      <div id="chat-geesee-modal"
        style="position:fixed;z-index:9997;background:#fff;display:none;flex-direction:column;overflow:hidden;transition:transform 0.22s ease,opacity 0.22s ease;transform:scale(0.94);opacity:0;box-shadow:0 20px 60px rgba(11,13,124,0.28);">

        <!-- Header -->
        <div style="background:linear-gradient(90deg,#0B0D7C,#0E1196,#181DA8);color:#fff;padding:11px 13px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.1);">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.3);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
              <img src="assets/images/chat-geesee-avatar.png" alt="GeeSee" style="width:100%;height:100%;object-fit:contain;">
            </div>
            <div style="min-width:0;">
              <div style="font-weight:800;font-size:13px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">GSCS Bank's Virtual Assistant</div>
              <div style="font-size:10px;color:#86efac;display:flex;align-items:center;gap:4px;margin-top:2px;">
                <span style="width:6px;height:6px;border-radius:50%;background:#4ade80;display:inline-block;"></span>
                Chat GeeSee &bull; 24/7 Online
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:2px;flex-shrink:0;">
            <button onclick="window.chatGeeSeeShowAlert()" style="width:34px;height:34px;border-radius:50%;background:transparent;border:none;color:rgba(255,255,255,0.8);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;-webkit-tap-highlight-color:transparent;">
              <i class="fa-regular fa-bell"></i>
            </button>
            <button onclick="window.chatGeeSeeReset()" style="width:34px;height:34px;border-radius:50%;background:transparent;border:none;color:rgba(255,255,255,0.8);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;-webkit-tap-highlight-color:transparent;">
              <i class="fa-solid fa-rotate-right"></i>
            </button>
            <button onclick="window.chatGeeSeeClose()" style="width:34px;height:34px;border-radius:50%;background:transparent;border:none;color:rgba(255,255,255,0.8);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;-webkit-tap-highlight-color:transparent;">
              <i class="fa-solid fa-chevron-down"></i>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div id="chat-geesee-messages"
          style="flex:1;overflow-y:auto;padding:13px;background:#f8fafc;display:flex;flex-direction:column;gap:12px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;">
        </div>

        <!-- Quick Menu -->
        <div id="chat-geesee-quickmenu"
          style="display:none;background:#fff;border-top:1px solid #e2e8f0;padding:10px 12px;max-height:200px;overflow-y:auto;flex-shrink:0;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:7px;border-bottom:1px solid #f1f5f9;margin-bottom:8px;">
            <span style="font-weight:700;font-size:11px;color:#374151;">ක්ෂණික මෙනුව</span>
            <button onclick="window.chatGeeSeeToggleQuickMenu()" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:15px;padding:0;line-height:1;"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <button onclick="window.chatGeeSeeSendPrompt('General Information')" style="text-align:left;padding:7px 9px;border-radius:9px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;font-weight:600;color:#374151;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:inherit;-webkit-tap-highlight-color:transparent;">🏛️ බැංකු</button>
            <button onclick="window.chatGeeSeeSendPrompt('Products & Services')" style="text-align:left;padding:7px 9px;border-radius:9px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;font-weight:600;color:#374151;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:inherit;-webkit-tap-highlight-color:transparent;">💳 ණය</button>
            <button onclick="window.chatGeeSeeSendPrompt('Interest Rates')" style="text-align:left;padding:7px 9px;border-radius:9px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;font-weight:600;color:#374151;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:inherit;-webkit-tap-highlight-color:transparent;">📊 පොලී</button>
            <button onclick="window.chatGeeSeeSendPrompt('Smart COOP App')" style="text-align:left;padding:7px 9px;border-radius:9px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;font-weight:600;color:#374151;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:inherit;-webkit-tap-highlight-color:transparent;">📲 Smart COOP</button>
            <button onclick="window.chatGeeSeeSendPrompt('Membership')" style="text-align:left;padding:7px 9px;border-radius:9px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;font-weight:600;color:#374151;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:inherit;-webkit-tap-highlight-color:transparent;">🤝 සාමාජිකත්වය</button>
            <button onclick="window.chatGeeSeeSendPrompt('Branch & Hotlines')" style="text-align:left;padding:7px 9px;border-radius:9px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;font-weight:600;color:#374151;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:inherit;-webkit-tap-highlight-color:transparent;">📍 ශාඛාව</button>
          </div>
        </div>

        <!-- Input Bar -->
        <div style="padding:9px 12px;background:#fff;border-top:1px solid #e2e8f0;display:flex;align-items:center;gap:8px;flex-shrink:0;">
          <button onclick="window.chatGeeSeeToggleQuickMenu()"
            style="width:40px;height:40px;border-radius:12px;background:#f1f5f9;border:none;color:#475569;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;-webkit-tap-highlight-color:transparent;">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div style="position:relative;flex:1;">
            <input type="text" id="chat-geesee-input"
              placeholder="ඔබේ ප්‍රශ්නය ලියන්න..."
              style="width:100%;background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:99px;padding:10px 44px 10px 15px;font-size:13px;outline:none;font-family:inherit;box-sizing:border-box;-webkit-appearance:none;color:#1e293b;">
            <button onclick="window.chatGeeSeeSendMessage()"
              style="position:absolute;right:5px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:#0B0D7C;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;-webkit-tap-highlight-color:transparent;">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>

      </div>

      <style>
        @keyframes gsFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        #chat-geesee-launcher { animation: gsFloat 3s ease-in-out infinite; }
        #chat-geesee-launcher:hover, #chat-geesee-launcher:active { animation: none; transform: scale(0.97); }
        #chat-geesee-input:focus { border-color: #0B0D7C !important; background: #fff !important; }
        #chat-geesee-messages::-webkit-scrollbar { width: 3px; }
        #chat-geesee-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .gs-btn-action { display:inline-flex;align-items:center;gap:5px;padding:8px 13px;border-radius:10px;background:#0B0D7C;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer;transition:background 0.18s;font-family:inherit;margin:3px 2px;-webkit-tap-highlight-color:transparent; }
        .gs-btn-action:hover,.gs-btn-action:active { background:#DF0178; }
        .gs-btn-pill { display:inline-block;padding:6px 12px;border-radius:99px;background:#fff;color:#374151;border:1.5px solid #e2e8f0;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:inherit;margin:2px;-webkit-tap-highlight-color:transparent; }
        .gs-btn-pill:hover,.gs-btn-pill:active { background:#fef9c3;border-color:#fbbf24; }
        .gs-welcome-pill { display:block;width:100%;text-align:center;padding:10px 14px;border-radius:99px;background:#fff;color:#0B0D7C;border:2px solid rgba(11,13,124,0.22);font-size:12px;font-weight:700;cursor:pointer;transition:all 0.18s;font-family:inherit;margin-bottom:8px;box-sizing:border-box;-webkit-tap-highlight-color:transparent; }
        .gs-welcome-pill:hover,.gs-welcome-pill:active { background:#0B0D7C;color:#fff;border-color:#0B0D7C; }
      </style>
    `;

    const div = document.createElement('div');
    div.id = 'chat-geesee-container';
    div.innerHTML = launcherHtml;
    document.body.appendChild(div);

    applyModalSizing();
    window.addEventListener('resize', applyModalSizing);

    renderWelcomeScreen();

    const inputEl = document.getElementById('chat-geesee-input');
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); window.chatGeeSeeSendMessage(); }
      });
    }

    // Touch event listener for mobile devices to guarantee click response
    const launcherEl = document.getElementById('chat-geesee-launcher');
    if (launcherEl) {
      launcherEl.addEventListener('touchend', (e) => {
        e.preventDefault();
        window.chatGeeSeeOpen(e);
      }, { passive: false });
    }
  }

  // Responsive sizing: Mobile = full screen, Desktop = floating panel
  function applyModalSizing() {
    const modal    = document.getElementById('chat-geesee-modal');
    const label    = document.getElementById('chat-geesee-label');
    const launcher = document.getElementById('chat-geesee-launcher');
    if (!modal) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (vw < 640) {
      // MOBILE: Fills entire screen like a native app
      modal.style.left    = '0';
      modal.style.right   = '0';
      modal.style.top     = '0';
      modal.style.bottom  = '0';
      modal.style.width   = '100%';
      modal.style.height  = '100%';
      modal.style.maxHeight = '100%';
      modal.style.borderRadius = '0';
      // Hide label text on mobile launcher (avatar only)
      if (label) label.style.display = 'none';
    } else {
      // DESKTOP / TABLET: Compact floating panel
      const w = Math.min(420, vw - 48);
      const h = Math.min(650, vh - 110);
      modal.style.left   = '';
      modal.style.right  = '20px';
      modal.style.bottom = '90px';
      modal.style.top    = '';
      modal.style.width  = w + 'px';
      modal.style.height = h + 'px';
      modal.style.maxHeight = '';
      modal.style.borderRadius = '22px';
      if (label) label.style.display = 'flex';
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
  window.chatGeeSeeOpen = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const launcher = document.getElementById('chat-geesee-launcher');
    const modal = document.getElementById('chat-geesee-modal');
    const toggleBtn = document.getElementById('chat-geesee-toggle-btn');
    if (!modal) return;

    applyModalSizing();

    if (launcher) launcher.style.display = 'none';
    if (toggleBtn) toggleBtn.style.display = 'flex';

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modal.style.transform = 'scale(1)';
      modal.style.opacity = '1';
    });

    const input = document.getElementById('chat-geesee-input');
    if (input) {
      setTimeout(() => {
        // Only focus automatically on non-touch devices to avoid iOS/Android keyboard jumping
        if (window.innerWidth >= 640) input.focus();
      }, 100);
    }
  };

  // Close / Minimize Chat Window
  window.chatGeeSeeClose = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const launcher = document.getElementById('chat-geesee-launcher');
    const modal = document.getElementById('chat-geesee-modal');
    const toggleBtn = document.getElementById('chat-geesee-toggle-btn');
    if (!modal) return;

    modal.style.transform = 'scale(0.94)';
    modal.style.opacity = '0';

    setTimeout(() => {
      modal.style.display = 'none';
      if (toggleBtn) toggleBtn.style.display = 'none';
      if (launcher) launcher.style.display = 'flex';
    }, 220);
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
