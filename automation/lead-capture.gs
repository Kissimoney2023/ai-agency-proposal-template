/**
 * Lead capture + lead-magnet email — AI Agency Proposal Template.
 *
 * Bound to the Google Sheet "AI Agency Proposal — Lead Magnet Leads".
 * On each website submit it:
 *   1. appends a row with the lead + the cost figure they computed, and
 *   2. emails the lead the template link (from your Gmail).
 *
 * ⚠️ Sending email needs a NEW permission. After pasting this you must:
 *    a) Run  sendTestEmail  once → authorize "send email as you" → check your inbox.
 *    b) Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.
 * The /exec URL does NOT change. Full steps: LEAD-CAPTURE-SETUP.md
 *
 * Sheet: https://docs.google.com/spreadsheets/d/11-ozmJb5wvsgpi8uoJmBB6A7Ux1tzrg0HtFE1ofmM9o/edit
 */

var CONFIG = {
  GUMROAD_URL: 'https://buildwithsaah.gumroad.com/l/ai-agency-proposal-template?layout=profile',
  FROM_NAME:   'Saah',
  SUBJECT:     'The AI Agency Proposal Template'
};

var HEADERS = [
  'Timestamp', 'Email', 'Cost Method', 'Annual Cost of Inaction',
  'Source', 'Referrer', 'Lead Magnet Sent', 'Status'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var data = {};
    try { data = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (_) {}

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    // Email the lead the template (never let a mail error drop the lead)
    var sentStatus = 'no email';
    if (isEmail_(data.email)) {
      try { sendLeadMagnet_(String(data.email)); sentStatus = 'Email sent'; }
      catch (mailErr) { sentStatus = 'Email failed: ' + mailErr; }
    }

    sheet.appendRow([
      new Date(),
      String(data.email      || ''),
      String(data.method     || ''),
      String(data.annualCost || ''),
      String(data.source     || ''),
      String(data.referrer   || ''),
      sentStatus,              // Lead Magnet Sent
      'New'                    // Status — for your follow-up automation
    ]);

    return json_({ result: 'ok', email: sentStatus });
  } catch (err) {
    return json_({ result: 'error', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function sendLeadMagnet_(to) {
  var url = CONFIG.GUMROAD_URL;
  var plain = [
    'Here’s the template.',
    '',
    'Get it here: ' + url,
    'A Notion page you can duplicate into your workspace, plus a 12-page PDF.',
    '',
    'Seven blocks, in order, with a fully worked example. Block two — the cost of',
    'inaction — is the one almost nobody writes; it’s built out in full inside.',
    'Swap the nouns and send it.',
    '',
    '— ' + CONFIG.FROM_NAME
  ].join('\n');

  var html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#0F1729;max-width:520px">' +
      '<p>Here’s the template.</p>' +
      '<p><a href="' + url + '" style="display:inline-block;background:#0F1729;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600">Get the template &rarr;</a></p>' +
      '<p>A Notion page you can duplicate into your workspace, plus a 12-page PDF.</p>' +
      '<p>Seven blocks, in order, with a fully worked example. Block two — the cost of inaction — is the one almost nobody writes; it’s built out in full inside. Swap the nouns and send it.</p>' +
      '<p style="color:#55607A">— ' + CONFIG.FROM_NAME + '</p>' +
    '</div>';

  MailApp.sendEmail({
    to: to,
    subject: CONFIG.SUBJECT,
    body: plain,
    htmlBody: html,
    name: CONFIG.FROM_NAME,
    replyTo: Session.getEffectiveUser().getEmail()
  });
}

// Run this once from the editor to authorize email-sending AND preview the email
// (it sends the template email to your own address).
function sendTestEmail() {
  sendLeadMagnet_(Session.getEffectiveUser().getEmail());
}

function isEmail_(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function doGet() {
  return json_({ result: 'ok', ping: true });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
