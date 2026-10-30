# 📊 Galapitiyagama Sanasa Bank (GSCS Bank)
## Google Sheets & Google Apps Script Cloud Sync Setup Guide
### (GitHub Pages සඳහා 100% නොමිලේ Cloud Database එකක් සකස් කිරීමේ පියවරෙන් පියවර මඟපෙන්වීම)

---

### 🌟 මේ මඟින් සිදුවන්නේ කුමක්ද?
1. වෙබ් අඩවියට එන ඕනෑම සාමාජිකයෙකු හෝ ගනුදෙනුකරුවෙකු ලෝකයේ ඕනෑම තැනක සිට Phone එකෙන් හෝ Computer එකෙන්:
   - **ණය වාරික ගෙවීම් (Loan Installment Payments + Slip ඡායාරූප)**
   - **සාමාජික අයදුම්පත් (Member Applications + අත්සන්)**
   - **Smart COOP යෙදුම් අයදුම්පත් (Smart COOP Applications + අත්සන්)**
   - **සාමාජික ප්‍රතිපෝෂණ (Feedback)**
   - **පාරිභෝගික විමසීම් (Inquiries)**
   පුරවා Submit කළ විට, එම දත්ත ක්ෂණිකව ඔබගේ **Google Sheet** එකට පෙළින් පෙළ (Rows) ස්වයංක්‍රීයව එකතු වේ.
2. Upload කරන Bank Slip සහ අත්සන් (Signatures) ඔබගේ Google Drive හි `GSCS_Bank_Uploads` ෆෝල්ඩරයේ ස්වයංක්‍රීයව Save වේ.
3. බැංකුවේ Admin කෙනෙක් `admin.html` විවෘත කළ විට, Google Sheet එකෙන් සියලුම දත්ත ක්ෂණිකව Admin Panel එකට ලැබේ.

---

### ⏱️ විනාඩි 3 කින් සකසා ගැනීමට පියවර (Step-by-Step):

#### 1️⃣ පියවර 1: අලුත් Google Sheet එකක් සාදා ගැනීම
1. [Google Sheets](https://sheets.google.com/) වෙත යන්න.
2. **Blank Spreadsheet** (හිස් Spreadhseet එකක්) සාදන්න.
3. Spreadsheet එකේ නම ලෙස `GSCS Bank Database` ලෙස යොදන්න.
*(මෙහි Tab හෝ Columns අතින් සෑදීමට අවශ්‍ය නැත! Script එක මඟින් සියලුම Tabs සහ Sanasa Navy Blue Headers ස්වයංක්‍රීයව සාදනු ඇත).*

---

#### 2️⃣ පියවර 2: Apps Script Code එක ඇතුළත් කිරීම
1. ඔබ සෑදූ Google Sheet එකේ ඉහළ මෙනුවේ ඇති **Extensions** ක්ලික් කර **Apps Script** තෝරන්න.
2. එහි ඇති පෙරනිමි කේතය (default code) මකා දමන්න (`myFunction()` අයින් කරන්න).
3. මෙම project එකේ ඇති `google-apps-script/Code.gs` ගොනුවේ ඇති **සම්පූර්ණ කේතය (Code)** copy කර එහි Paste කරන්න.
4. ඉහළ ඇති **Save** (💾 Diskette Icon එක) ක්ලික් කරන්න.

---

#### 3️⃣ පියවර 3: Web App එකක් ලෙස Deploy කිරීම (ඉතා වැදගත්)
1. ඉහළ දකුණු කෙළවරේ ඇති නිල් පැහැති **Deploy** බොත්තම ක්ලික් කර **New deployment** තෝරන්න.
2. වම්පස ඇති ⚙️ (Gear Icon) එක ක්ලික් කර **Web app** තෝරන්න.
3. පහත සැකසුම් හරියටම තෝරන්න:
   - **Description**: `GSCS Bank Live API`
   - **Execute as**: `Me (ඔබේ Gmail ලිපිනය)`
   - **Who has access**: **`Anyone`** *(මෙය 'Anyone' ලෙස තෝරාගත යුතුය. එවිට පමණක් වෙබ් අඩවියට එන පාරිභෝගිකයින්ට දත්ත යැවිය හැක).*
4. නිල් පාට **Deploy** බොත්තම ක්ලික් කරන්න.
5. Google මඟින් අවසර (Authorization) ඉල්ලනු ඇත:
   - **Authorize Access** ක්ලික් කරන්න.
   - ඔබගේ Google Account එක තෝරන්න.
   - **Advanced** ක්ලික් කර **Go to Untitled project (unsafe)** ක්ලික් කරන්න.
   - **Allow** ක්ලික් කරන්න.
6. සාර්ථකව Deploy වූ පසු, ඔබට **Web app URL** එකක් ලැබෙනු ඇත (උදාහරණයක් ලෙස: `https://script.google.com/macros/s/AKfycbx.../exec`).
7. එම **Web app URL එක Copy කරගන්න!**

---

#### 4️⃣ පියවර 4: අපේ Website එකට URL එක සම්බන්ධ කිරීම
URL එක සම්බන්ධ කිරීමට පහසු ක්‍රම 2ක් ඇත:

##### ක්‍රමය A: Code එකට කෙලින්ම දැමීම (GitHub push කිරීමට පෙර)
`js/api-config.js` ගොනුව විවෘත කර ඔබ Copy කරගත් URL එක Paste කරන්න:
```javascript
window.GSCS_CONFIG = {
  // ඔබගේ Google Apps Script Web App URL එක මෙතැනට paste කරන්න:
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/ඔබගේ_SCRIPT_ID_එක/exec",

  ADMIN_EMAIL: "gscsbank@gmail.com"
};
```
දැන් මෙම ගොනු සියල්ල GitHub එකට commit / push කරන්න!

##### ක්‍රමය B: Admin Panel එකෙන් කෙලින්ම දැමීම
1. වෙබ් අඩවියේ `admin.html` විවෘත කර Login වන්න (`admin` / `sanasa123`).
2. වම්පස මෙනුවේ **GitHub Pages & Sync** ටැබ් එකට යන්න.
3. එහි ඇති **Google Sheets & Apps Script Cloud Sync** කොටුවේ ඇති input field එකට Web App URL එක paste කර **Save URL** හෝ **Test & Sync Now** ක්ලික් කරන්න!
4. ඉහළ ඇති **Sync Cloud (Google Sheets)** බොත්තම මඟින්ද ඕනෑම වෙලාවක ක්ෂණිකව Google Sheet එක සමඟ සමමුහුර්ත (Live Sync) විය හැක.

---

### 🎉 සුබ පැතුම්!
දැන් ලෝකයේ ඕනෑම තැනක සිට කවුරුන් Form එකක් submit කළත්, තත්පරයෙන්:
- Google Sheet එකට වැටේ.
- Bank Slip සහ අත්සන් Google Drive එකට Save වේ.
- Admin Panel එකෙන් සියල්ල Live බලාගත හැක!
