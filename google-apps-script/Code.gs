/**
 * ==============================================================================
 * GALAPITIYAGAMA SANASA CO-OPERATIVE SOCIETY BANK (GSCS BANK)
 * Google Apps Script Cloud Backend & Database Engine
 * ==============================================================================
 * 
 * This script turns your Google Spreadsheet into a 100% Free, Secure Cloud Database
 * for GitHub Pages.
 * 
 * Handled Forms:
 * 1. ණය වාරික ගෙවීම් (Loan Installment Payments)
 * 2. සාමාජික අයදුම්පත් (Member Applications)
 * 3. Smart COOP ජංගම යෙදුම් අයදුම්පත් (Smart COOP Applications)
 * 4. සාමාජික ප්‍රතිපෝෂණ (Member Feedback)
 * 5. පාරිභෝගික විමසීම් (Customer Inquiries)
 */

// ------------------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------------------
var DRIVE_FOLDER_NAME = "GSCS_Bank_Uploads"; // Google Drive folder for receipts & signatures
var NOTIFY_EMAIL = ""; // Optional: e.g. "bank@gmail.com" to receive email on submissions

// ------------------------------------------------------------------------------
// HTTP GET REQUEST HANDLER (Fetch data for Admin Panel)
// ------------------------------------------------------------------------------
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAll';
  
  if (action === 'ping') {
    return createJsonResponse({
      status: 'success',
      message: 'GSCS Bank Cloud API is running successfully!',
      timestamp: new Date().toISOString()
    });
  }
  
  if (action === 'getAll') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var data = {
        inquiries: getSheetDataAsObjects(ss, 'Inquiries', getInquiryHeaders()),
        loanPayments: getSheetDataAsObjects(ss, 'LoanPayments', getLoanPaymentHeaders()),
        membershipApplications: getSheetDataAsObjects(ss, 'MemberApplications', getMembershipHeaders()),
        smartCoopApplications: getSheetDataAsObjects(ss, 'SmartCoopApplications', getSmartCoopHeaders()),
        feedbacks: getSheetDataAsObjects(ss, 'Feedback', getFeedbackHeaders()),
        newsAndAnnouncements: getSheetDataAsObjects(ss, 'News', getNewsHeaders())
      };
      
      return createJsonResponse({
        status: 'success',
        data: data,
        fetchedAt: new Date().toISOString()
      });
    } catch (err) {
      return createJsonResponse({
        status: 'error',
        message: err.toString()
      });
    }
  }

  return createJsonResponse({ status: 'error', message: 'Unknown action: ' + action });
}

// ------------------------------------------------------------------------------
// HTTP POST REQUEST HANDLER (Receive form submissions from website & Admin updates)
// ------------------------------------------------------------------------------
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'No post payload received' });
    }
    
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'submit';
    var type = payload.type;
    var data = payload.data || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. UPDATE STATUS ACTION
    if (action === 'updateStatus') {
      var updated = updateRecordStatus(ss, type, payload.id, payload.status, payload.notes);
      return createJsonResponse({ status: updated ? 'success' : 'not_found', id: payload.id });
    }

    // 2. DELETE ACTION
    if (action === 'delete') {
      var deleted = deleteRecord(ss, type, payload.id);
      return createJsonResponse({ status: deleted ? 'success' : 'not_found', id: payload.id });
    }

    // 3. NEW SUBMISSIONS
    if (type === 'inquiry') {
      saveInquiry(ss, data);
    } else if (type === 'loan_payment') {
      saveLoanPayment(ss, data);
    } else if (type === 'membership') {
      saveMembership(ss, data);
    } else if (type === 'smart_coop') {
      saveSmartCoop(ss, data);
    } else if (type === 'feedback') {
      saveFeedback(ss, data);
    } else if (type === 'news') {
      saveNews(ss, data);
    } else {
      return createJsonResponse({ status: 'error', message: 'Invalid submission type: ' + type });
    }

    return createJsonResponse({
      status: 'success',
      type: type,
      refId: data.refId || data.id,
      receivedAt: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

// ------------------------------------------------------------------------------
// SUBMISSION SAVERS
// ------------------------------------------------------------------------------

// 1. Inquiries
function saveInquiry(ss, item) {
  var sheet = getOrCreateSheet(ss, 'Inquiries', getInquiryHeaders());
  var row = [
    item.id || ('inq-' + Date.now()),
    item.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'),
    item.name || '',
    item.phone || '',
    item.email || '',
    item.service || '',
    item.message || '',
    item.status || 'pending'
  ];
  sheet.appendRow(row);
}

// 2. Loan Payments (ණය වාරික ගෙවීම්)
function saveLoanPayment(ss, item) {
  var sheet = getOrCreateSheet(ss, 'LoanPayments', getLoanPaymentHeaders());
  
  // Save uploaded slip to Drive if base64
  var receiptUrl = saveBase64Image(item.receiptImage, 'LoanSlip_' + (item.refId || Date.now()) + '.jpg');

  var row = [
    item.id || ('lp-' + Date.now()),
    item.refId || ('GSCS-LP-' + Math.floor(100000 + Math.random() * 900000)),
    item.submittedAt || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'),
    item.memberNo || '',
    item.memberName || '',
    item.loanType || '',
    item.loanAccNo || '',
    item.phone || '',
    item.amount || 0,
    item.bankAccount || '',
    receiptUrl || item.receiptImage || '',
    item.status || 'pending',
    item.reviewNotes || '',
    item.reviewedAt || ''
  ];
  sheet.appendRow(row);
}

// 3. Membership Applications (සාමාජික අයදුම්පත්)
function saveMembership(ss, item) {
  var sheet = getOrCreateSheet(ss, 'MemberApplications', getMembershipHeaders());
  
  // Save slip and signature to Drive
  var receiptUrl = saveBase64Image(item.receiptImage, 'MemReceipt_' + (item.refId || Date.now()) + '.jpg');
  var signatureUrl = saveBase64Image(item.signatureImage, 'MemSignature_' + (item.refId || Date.now()) + '.png');

  var row = [
    item.id || ('mem-' + Date.now()),
    item.refId || ('GSCS-MEM-' + Math.floor(100000 + Math.random() * 900000)),
    item.submittedAt || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'),
    item.fullName || '',
    item.nameWithInitials || '',
    item.nameEnglishCaps || '',
    item.nic || '',
    item.gender || '',
    item.dob || '',
    item.maritalStatus || '',
    item.address || '',
    item.city || '',
    item.gnDivision || '',
    item.religion || '',
    item.phone || '',
    item.whatsapp || '',
    item.email || '',
    item.nomineeName || '',
    item.nomineeNic || '',
    item.nomineeGender || '',
    item.nomineeRelationship || '',
    item.businessName || '',
    item.occupation || '',
    item.businessAddress || '',
    item.businessPhone || '',
    item.shareCapital || 5000,
    item.savingsDeposit || 1000,
    item.totalPaid || 6000,
    item.bankAccount || '',
    item.paymentRef || '',
    receiptUrl || item.receiptImage || '',
    signatureUrl || item.signatureImage || '',
    item.status || 'pending',
    item.reviewNotes || '',
    item.reviewedAt || ''
  ];
  sheet.appendRow(row);
}

// 4. Smart COOP Applications
function saveSmartCoop(ss, item) {
  var sheet = getOrCreateSheet(ss, 'SmartCoopApplications', getSmartCoopHeaders());
  
  var signatureUrl = saveBase64Image(item.signatureImage, 'SmartCoopSig_' + (item.refId || Date.now()) + '.png');

  var row = [
    item.id || ('sc-' + Date.now()),
    item.refId || ('GSCS-MAA-' + Math.floor(100 + Math.random() * 900)),
    item.submittedAt || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'),
    item.accNo || '',
    item.fullName || '',
    item.nameEnglishCaps || '',
    item.nic || '',
    item.gender || '',
    item.address || '',
    item.phone || '',
    item.username || '',
    signatureUrl || item.signatureImage || '',
    item.status || 'pending',
    item.reviewNotes || '',
    item.reviewedAt || ''
  ];
  sheet.appendRow(row);
}

// 5. Member Feedback (සාමාජික ප්‍රතිපෝෂණ)
function saveFeedback(ss, item) {
  var sheet = getOrCreateSheet(ss, 'Feedback', getFeedbackHeaders());
  var row = [
    item.id || ('fb-' + Date.now()),
    item.refId || ('GSCS-FB-' + Math.floor(100000 + Math.random() * 900000)),
    item.submittedAt || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'),
    item.name || '',
    item.village || '',
    item.phone || '',
    item.service || '',
    item.message || '',
    item.rating || 5,
    item.consent ? 'YES' : 'NO',
    item.status || 'pending',
    item.publishedAsTestimonial ? 'YES' : 'NO',
    item.reviewNotes || '',
    item.reviewedAt || ''
  ];
  sheet.appendRow(row);
}

// 6. News & Announcements (පුවත් සහ නිවේදන)
function saveNews(ss, item) {
  var sheet = getOrCreateSheet(ss, 'News', getNewsHeaders());

  // Check if news item already exists (by id) — update it
  var values = sheet.getDataRange().getValues();
  var headers = values[0] || [];
  var idCol = headers.indexOf('id');
  if (idCol >= 0) {
    for (var r = 1; r < values.length; r++) {
      if (String(values[r][idCol]) === String(item.id)) {
        // Update existing row
        sheet.getRange(r + 1, 1, 1, headers.length).setValues([[
          item.id || '',
          item.title || '',
          item.content || '',
          item.category || '',
          item.date || '',
          item.isPublished !== false ? 'YES' : 'NO',
          item.imageUrl || '',
          item.updatedAt || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
        ]]);
        return;
      }
    }
  }

  // New row
  var row = [
    item.id || ('news-' + Date.now()),
    item.title || '',
    item.content || '',
    item.category || 'general',
    item.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    item.isPublished !== false ? 'YES' : 'NO',
    item.imageUrl || '',
    item.updatedAt || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
  ];
  sheet.appendRow(row);
}

// ------------------------------------------------------------------------------
// STATUS UPDATE & DELETE HELPERS
// ------------------------------------------------------------------------------
function updateRecordStatus(ss, type, id, newStatus, notes) {
  var sheetName = getSheetNameForType(type);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;
  
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return false;
  
  // Find column indexes
  var headers = values[0];
  var idColIdx = headers.indexOf('id');
  var statusColIdx = headers.indexOf('status');
  var notesColIdx = headers.indexOf('reviewNotes');
  var dateColIdx = headers.indexOf('reviewedAt');
  
  if (idColIdx === -1 || statusColIdx === -1) return false;
  
  for (var r = 1; r < values.length; r++) {
    if (values[r][idColIdx] == id) {
      sheet.getRange(r + 1, statusColIdx + 1).setValue(newStatus);
      if (notesColIdx !== -1 && notes !== undefined) {
        sheet.getRange(r + 1, notesColIdx + 1).setValue(notes);
      }
      if (dateColIdx !== -1) {
        sheet.getRange(r + 1, dateColIdx + 1).setValue(new Date().toLocaleDateString());
      }
      return true;
    }
  }
  return false;
}

function deleteRecord(ss, type, id) {
  var sheetName = getSheetNameForType(type);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;
  
  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if (values[r][0] == id) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

function getSheetNameForType(type) {
  if (type === 'inquiry') return 'Inquiries';
  if (type === 'loan_payment') return 'LoanPayments';
  if (type === 'membership') return 'MemberApplications';
  if (type === 'smart_coop') return 'SmartCoopApplications';
  if (type === 'feedback') return 'Feedback';
  if (type === 'news') return 'News';
  return 'Inquiries';
}

// ------------------------------------------------------------------------------
// DRIVE IMAGE UPLOADER
// ------------------------------------------------------------------------------
function saveBase64Image(base64Data, filename) {
  if (!base64Data || typeof base64Data !== 'string') return '';
  if (base64Data.indexOf('data:image') !== 0) {
    return base64Data; // Already an external URL
  }
  try {
    var parts = base64Data.split(',');
    var meta = parts[0];
    var data = parts[1];
    var mimeMatch = meta.match(/data:([^;]+);/);
    var mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    var decoded = Utilities.base64Decode(data);
    var blob = Utilities.newBlob(decoded, mimeType, filename);

    var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
      try {
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {}
    }

    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    // Direct embeddable image URL:
    return 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200';
  } catch (err) {
    Logger.log('Drive image save note: ' + err.message);
    return base64Data; // fallback to base64 if Drive fails
  }
}

// ------------------------------------------------------------------------------
// SHEET DATA READERS & SCHEMA DEFINITIONS
// ------------------------------------------------------------------------------
function getSheetDataAsObjects(ss, sheetName, defaultHeaders) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) return [];
  
  var headers = values[0];
  var rows = [];
  
  for (var r = 1; r < values.length; r++) {
    var rowObj = {};
    var hasData = false;
    for (var c = 0; c < headers.length; c++) {
      var headerKey = headers[c];
      var val = values[r][c];
      if (val !== undefined && val !== null && val !== '') {
        hasData = true;
      }
      // Handle boolean flags
      if (headerKey === 'consent' || headerKey === 'publishedAsTestimonial') {
        val = (val === 'YES' || val === true);
      }
      rowObj[headerKey] = val;
    }
    if (hasData) {
      rows.push(rowObj);
    }
  }
  // Sort descending by id or date so latest appears first
  rows.reverse();
  return rows;
}

function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    
    // Style headers
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0B0D7C');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setFontFamily('Arial');
    sheet.setFrozenRows(1);
    
    for (var i = 1; i <= headers.length; i++) {
      sheet.setColumnWidth(i, 160);
    }
  }
  return sheet;
}

// Schema headers
function getInquiryHeaders() {
  return ['id', 'date', 'name', 'phone', 'email', 'service', 'message', 'status'];
}

function getLoanPaymentHeaders() {
  return ['id', 'refId', 'submittedAt', 'memberNo', 'memberName', 'loanType', 'loanAccNo', 'phone', 'amount', 'bankAccount', 'receiptImage', 'status', 'reviewNotes', 'reviewedAt'];
}

function getMembershipHeaders() {
  return [
    'id', 'refId', 'submittedAt', 'fullName', 'nameWithInitials', 'nameEnglishCaps', 'nic', 'gender', 'dob',
    'maritalStatus', 'address', 'city', 'gnDivision', 'religion', 'phone', 'whatsapp', 'email',
    'nomineeName', 'nomineeNic', 'nomineeGender', 'nomineeRelationship',
    'businessName', 'occupation', 'businessAddress', 'businessPhone',
    'shareCapital', 'savingsDeposit', 'totalPaid', 'bankAccount', 'paymentRef',
    'receiptImage', 'signatureImage', 'status', 'reviewNotes', 'reviewedAt'
  ];
}

function getSmartCoopHeaders() {
  return [
    'id', 'refId', 'submittedAt', 'accNo', 'fullName', 'nameEnglishCaps', 'nic', 'gender',
    'address', 'phone', 'username', 'signatureImage', 'status', 'reviewNotes', 'reviewedAt'
  ];
}

function getFeedbackHeaders() {
  return [
    'id', 'refId', 'submittedAt', 'name', 'village', 'phone', 'service', 'message',
    'rating', 'consent', 'status', 'publishedAsTestimonial', 'reviewNotes', 'reviewedAt'
  ];
}

function getNewsHeaders() {
  return ['id', 'title', 'content', 'category', 'date', 'isPublished', 'imageUrl', 'updatedAt'];
}

// ------------------------------------------------------------------------------
// JSON RESPONSE HELPER
// ------------------------------------------------------------------------------
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
