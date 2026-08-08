/**
 * Lead capture — AI Agency Proposal Template landing page.
 *
 * Bind this to the Google Sheet "AI Agency Proposal — Lead Magnet Leads":
 *   the sheet  →  Extensions  →  Apps Script  →  paste this file  →  Save.
 * Then deploy it as a Web App and paste the /exec URL into
 *   public/app.js  →  CONFIG.SHEET_ENDPOINT
 * Full steps: LEAD-CAPTURE-SETUP.md
 *
 * Sheet: https://docs.google.com/spreadsheets/d/11-ozmJb5wvsgpi8uoJmBB6A7Ux1tzrg0HtFE1ofmM9o/edit
 */

var HEADERS = [
  'Timestamp', 'Email', 'Cost Method', 'Annual Cost of Inaction',
  'Source', 'Referrer', 'Lead Magnet Sent', 'Status'
];

function doPost(e) {
  var lock = LockService.getScriptLock();          // avoid clobbering rows on concurrent submits
  try {
    lock.waitLock(20000);

    var data = {};
    try { data = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (_) {}

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);   // first run only

    sheet.appendRow([
      new Date(),
      String(data.email      || ''),
      String(data.method     || ''),
      String(data.annualCost || ''),
      String(data.source     || ''),
      String(data.referrer   || ''),
      'Gumroad download',      // Lead Magnet Sent — delivery is the redirect to the download
      'New'                    // Status — for your follow-up automation
    ]);

    return json_({ result: 'ok' });
  } catch (err) {
    return json_({ result: 'error', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// A browser GET to the /exec URL returns this — handy for a quick "is it live?" check.
function doGet() {
  return json_({ result: 'ok', ping: true });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
