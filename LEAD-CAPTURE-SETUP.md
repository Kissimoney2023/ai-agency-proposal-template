# Lead capture — Google Sheet + Gumroad (no ConvertKit)

The form no longer talks to ConvertKit. On submit it now:

1. records the lead in your Google Sheet,
2. **emails the lead the template** (from your Gmail), and
3. redirects the visitor to the Gumroad download page.

```
visitor enters email
      │
      ├─▶ POST to a Google Apps Script Web App
      │        ├─▶ new row in the Sheet
      │        └─▶ emails the lead the template link (MailApp, from your Gmail)
      │
      └─▶ redirect to  buildwithsaah.gumroad.com/l/ai-agency-proposal-template
```

No backend, no secrets in the repo: the Apps Script runs under **your** Google account and is the
only thing allowed to write to the sheet.

## The sheet (already created)

**AI Agency Proposal — Lead Magnet Leads**
<https://docs.google.com/spreadsheets/d/11-ozmJb5wvsgpi8uoJmBB6A7Ux1tzrg0HtFE1ofmM9o/edit>

Columns, one row per lead:

| Timestamp | Email | Cost Method | Annual Cost of Inaction | Source | Referrer | Lead Magnet Sent | Status |
|---|---|---|---|---|---|---|---|
| server time | what they typed | Time wasted / Leads lost | the figure they computed in the ledger | `lead-magnet-landing` | where they came from | `Gumroad download` | `New` |

The **Annual Cost of Inaction** column is the number each visitor calculated on the page — sort by
it to work your highest-pain leads first.

## One-time setup (≈3 minutes)

1. Open the sheet (link above) → **Extensions → Apps Script**.
2. Delete the placeholder `Code.gs` contents, paste everything from
   [`automation/lead-capture.gs`](automation/lead-capture.gs), and **Save** (💾).
3. **Deploy → New deployment**. Click the gear → **Web app**. Set:
   - **Description:** `lead capture`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
   - **Deploy**, then **Authorize access** and allow the permissions (it's your own script).
4. Copy the **Web app URL** — it ends in `/exec`.
5. Paste it into [`public/app.js`](public/app.js):

   ```js
   SHEET_ENDPOINT: "https://script.google.com/macros/s/AKfyc…/exec",
   ```

6. Commit and push (`git push origin main`). Netlify redeploys automatically.

> Until step 5 is done, the form still works — it just redirects to the download without recording
> the lead. Once the `/exec` URL is in place, every submit writes a row.

### Check it's live
- Paste the `/exec` URL into a browser → you should see `{"result":"ok","ping":true}`.
- Submit the real form once → a new row should appear in the sheet within a second or two.

## Emailing the lead the template

`lead-capture.gs` emails each lead the template with `MailApp` (from your Gmail, sender name
"Saah", reply-to your address). Edit the copy or link in the `sendLeadMagnet_` function /
`CONFIG` block at the top.

**Sending email needs a new permission**, so after updating the script you must re-authorize once
and redeploy:

1. Paste the updated `lead-capture.gs`, **Save**.
2. In the editor's function dropdown pick **`sendTestEmail`** → **Run**. Approve the
   **"Send email as you"** permission when prompted. This also sends the template email to your own
   address so you can preview it — check your inbox.
3. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.** (The `/exec` URL
   stays the same — no site change needed.)

The **Lead Magnet Sent** column now records `Email sent` (or `Email failed: …`) per lead, so you can
see delivery at a glance.

> **Quota:** a consumer Gmail account can send ~100 emails/day via Apps Script (Workspace ~1,500).
> Fine for a lead magnet; if you expect more, use a dedicated sender.

### Building sequences later
This same script is the hook for follow-up emails. To drip a sequence, add a time-based trigger
(**Triggers ⏰ → Add trigger**) that runs a function scanning the sheet's **Status** column and
emails leads at the right step, updating Status as it goes. Say the word and it can be scaffolded.

## Changing things later

- **Different download link:** `public/app.js` → `CONFIG.GUMROAD_URL`.
- **Redeploying the script after an edit:** Apps Script → **Deploy → Manage deployments → Edit (✏️)
  → Version: New version → Deploy.** The `/exec` URL stays the same, so you don't need to touch
  `app.js` again.
- **More columns:** add the header in the sheet and a matching value in `appendRow([...])` inside
  `lead-capture.gs`, then redeploy.

## Why Apps Script and not the Sheets API directly

A static page can't hold Google credentials without exposing them. The Apps Script Web App is the
standard bridge: it's owned by you, writes only to this one sheet, and the page just sends it a
plain POST. The request uses a `text/plain` body and `sendBeacon`/`keepalive` so it isn't blocked by
CORS and still completes as the page redirects to Gumroad.
