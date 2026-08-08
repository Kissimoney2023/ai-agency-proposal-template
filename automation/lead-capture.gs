/**
 * Lead capture + lead-magnet email + follow-up sequence
 * AI Agency Proposal Template.
 *
 * Bound to the Google Sheet "AI Agency Proposal — Lead Magnet Leads".
 *
 * On website submit (doPost):
 *   1. append a row, 2. email the template, 3. Status = "New".
 * Daily (processSequence, run by a time trigger):
 *   advance each lead through the follow-up emails based on days since signup,
 *   moving Status New → Seq 1 → Seq 2 → Seq 3 → Completed.
 *
 * SETUP AFTER PASTING:
 *   a) Save.
 *   b) Triggers ⏰ (left rail) → Add Trigger → function: processSequence,
 *      event source: Time-driven, type: Day timer, ~8–9am → Save.
 *   c) Deploy → Manage deployments → ✏️ → Version: New version → Deploy
 *      (so the live /exec runs this latest code).
 * No new permissions are needed beyond what you already granted.
 *
 * Sheet: https://docs.google.com/spreadsheets/d/11-ozmJb5wvsgpi8uoJmBB6A7Ux1tzrg0HtFE1ofmM9o/edit
 */

var CONFIG = {
  GUMROAD_MAGNET: 'https://buildwithsaah.gumroad.com/l/ai-agency-proposal-template?layout=profile',
  GUMROAD_KIT:    'https://buildwithsaah.gumroad.com/l/ai-agency-builder-kit',
  FROM_NAME:      'Saah',
  REPLY_TO:       'sahjohnny@gmail.com',
  MAGNET_SUBJECT: 'The AI Agency Proposal Template'
};

var HEADERS = [
  'Timestamp', 'Email', 'Cost Method', 'Annual Cost of Inaction',
  'Source', 'Referrer', 'Lead Magnet Sent', 'Status'
];

// Column indexes (0-based)
var COL = { TS: 0, EMAIL: 1, METHOD: 2, ANNUAL: 3, SOURCE: 4, REFERRER: 5, SENT: 6, STATUS: 7 };

/* =========================================================================
   1 · Capture (web app)
   ========================================================================= */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var data = {};
    try { data = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (_) {}

    var sheet = firstSheet_();
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    var sentStatus = 'no email';
    if (isEmail_(data.email)) {
      try { sendMagnet_(String(data.email)); sentStatus = 'Email sent'; }
      catch (mailErr) { sentStatus = 'Email failed: ' + mailErr; }
    }

    sheet.appendRow([
      new Date(),
      String(data.email      || ''),
      String(data.method     || ''),
      String(data.annualCost || ''),
      String(data.source     || ''),
      String(data.referrer   || ''),
      sentStatus,
      'New'
    ]);

    return json_({ result: 'ok', email: sentStatus });
  } catch (err) {
    return json_({ result: 'error', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function doGet() {
  return json_({ result: 'ok', ping: true });
}

/* =========================================================================
   2 · Follow-up sequence (daily time trigger runs processSequence)
   ========================================================================= */

// Index = step. [0] is the magnet (sent at signup). Steps 1..N are follow-ups.
// `day` = days after signup this email should go out.
var SEQUENCE = [
  null,
  {
    day: 2,
    subject: 'Block two is the one that closes',
    lines: [
      'You’ve got the template. Here’s the block to get right first: block two — the cost of inaction.',
      'Most proposals put a price next to nothing, so the buyer compares it to zero. Block two puts a dollar figure on the problem, and suddenly your price is just arithmetic.',
      'Easiest way to get that number: ask what the problem costs them now — hours wasted, or leads missed — and multiply. Fill block two before you write a word about your solution.'
    ]
  },
  {
    day: 4,
    subject: 'One price gets compared to nothing',
    lines: [
      'Quick one on pricing.',
      'A single number has nothing to sit against, so the buyer compares it to not doing it at all. Three tiers give them something to compare it to — each other. Most people pick the middle.',
      'The rule from the template: three real tiers, no fake bottom one. A throwaway cheap tier doesn’t anchor — it just tells the buyer the real work is optional.'
    ]
  },
  {
    day: 6,
    subject: 'The cheapest scope-creep insurance you’ll buy',
    lines: [
      'The block almost everyone skips: “Not included.”',
      'Three lines naming what’s out of scope save you weeks of unpaid work. “Not included: data cleanup, changes after sign-off, more than two revision rounds.” Now every “can you just…” has an answer that isn’t a fight.',
      'It’s in the template. Add it to every proposal — even the small ones.'
    ]
  },
  {
    day: 8,
    subject: 'Everything else I use to run the agency',
    isPitch: true,
    lines: [
      'The proposal template is one piece. The rest of how I run a one-person AI agency — the intake questions, the scoping worksheet, the pricing calculator, the contract, the onboarding, the SOPs — lives in the AI Agency Builder Kit.',
      'If the template earned its keep, the kit is the system it came from.'
    ]
  }
];

function processSequence() {
  var sheet = firstSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return 0;

  var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var now = new Date();
  var sent = 0;

  for (var i = 0; i < rows.length; i++) {
    var email  = String(rows[i][COL.EMAIL]  || '').trim();
    var status = String(rows[i][COL.STATUS] || '').trim();
    var ts     = rows[i][COL.TS];

    if (!isEmail_(email)) continue;
    if (status === 'Unsubscribed' || status === 'Completed') continue;
    if (!(ts instanceof Date)) continue;

    var step = statusToStep_(status);          // New/'' = 0, 'Seq N' = N
    var next = step + 1;
    if (next >= SEQUENCE.length) continue;      // nothing left

    var def = SEQUENCE[next];
    if (daysSince_(ts, now) < def.day) continue; // not due yet

    try {
      sendFollowup_(email, def);
      var newStatus = (next >= SEQUENCE.length - 1) ? 'Completed' : ('Seq ' + next);
      sheet.getRange(i + 2, COL.STATUS + 1).setValue(newStatus);
      sent++;
    } catch (err) {
      // leave Status untouched — it retries on the next run
    }
  }
  return sent;
}

/* =========================================================================
   3 · Email
   ========================================================================= */
function sendMagnet_(to) {
  var inner =
    '<p>Here’s the template.</p>' +
    '<p>' + button_('Get the template', CONFIG.GUMROAD_MAGNET) + '</p>' +
    '<p>A Notion page you can duplicate into your workspace, plus a 12-page PDF.</p>' +
    '<p>Seven blocks, in order, with a fully worked example. Block two — the cost of inaction — is the one almost nobody writes; it’s built out in full inside. Swap the nouns and send it.</p>';
  var plain =
    'Here’s the template.\n\nGet it here: ' + CONFIG.GUMROAD_MAGNET + '\n' +
    'A Notion page you can duplicate into your workspace, plus a 12-page PDF.\n\n' +
    'Seven blocks, in order, with a fully worked example. Block two — the cost of inaction — ' +
    'is the one almost nobody writes; it’s built out in full inside. Swap the nouns and send it.';
  send_(to, CONFIG.MAGNET_SUBJECT, inner, plain);
}

function sendFollowup_(to, def) {
  var innerParas = def.lines.map(function (l) { return '<p>' + l + '</p>'; }).join('');
  var plain = def.lines.join('\n\n');
  if (def.isPitch) {
    innerParas += '<p>' + button_('Get the Builder Kit', CONFIG.GUMROAD_KIT) + '</p>' +
                  '<p style="color:#55607A">No pressure — the template is yours to keep either way.</p>';
    plain += '\n\nGet the Builder Kit: ' + CONFIG.GUMROAD_KIT +
             '\n\nNo pressure — the template is yours to keep either way.';
  }
  send_(to, def.subject, innerParas, plain);
}

function send_(to, subject, innerHtml, plainBody) {
  var foot = 'Not for you? Just reply and say so — I’ll take you off the list.';
  var html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#0F1729;max-width:520px">' +
      innerHtml +
      '<p style="color:#8a93a6;font-size:13px;margin-top:26px;border-top:1px solid #e3e6ec;padding-top:14px">' + foot +
      '<br>— ' + CONFIG.FROM_NAME + '</p>' +
    '</div>';
  var plain = plainBody + '\n\n— ' + CONFIG.FROM_NAME + '\n\n---\n' + foot;
  MailApp.sendEmail({
    to: to, subject: subject, body: plain, htmlBody: html,
    name: CONFIG.FROM_NAME, replyTo: CONFIG.REPLY_TO
  });
}

function button_(label, url) {
  return '<a href="' + url + '" style="display:inline-block;background:#0F1729;color:#ffffff;' +
         'text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600">' + label + ' &rarr;</a>';
}

/* =========================================================================
   Helpers / test
   ========================================================================= */
function firstSheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; }

function statusToStep_(status) {
  if (!status || status === 'New') return 0;
  var m = /^Seq\s+(\d+)$/.exec(status);
  return m ? parseInt(m[1], 10) : 0;
}

function daysSince_(from, to) {
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

function isEmail_(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run once to preview: sends the magnet + all follow-ups to your own address.
function sendTestEmail() {
  var me = CONFIG.REPLY_TO;
  sendMagnet_(me);
  for (var i = 1; i < SEQUENCE.length; i++) sendFollowup_(me, SEQUENCE[i]);
}

// Run ONCE to schedule the daily follow-up sender — no need to open the Triggers screen.
// (Approve the permission prompt the first time.)
function installTrigger() {
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === 'processSequence') ScriptApp.deleteTrigger(existing[i]);
  }
  ScriptApp.newTrigger('processSequence').timeBased().everyDays(1).atHour(8).create();
  return 'Done — processSequence will run every morning (~8am).';
}
