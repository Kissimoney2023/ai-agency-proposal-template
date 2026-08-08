# Lead capture — Netlify Forms + Gumroad (no external service)

On submit the page:

1. posts the lead to **Netlify Forms** (built into your Netlify site), then
2. redirects the visitor to the Gumroad download.

```
visitor enters email
      │
      ├─▶ POST "/" (Netlify Forms)  ─▶  submission stored in your Netlify dashboard
      │
      └─▶ redirect to  buildwithsaah.gumroad.com/l/ai-agency-proposal-template
```

No API keys, no Apps Script, nothing to paste. Netlify detects the form at deploy time and starts
collecting submissions automatically.

## What gets captured

The form sends these fields (see `public/index.html`), so each submission carries the visitor's
self-reported cost of inaction:

| Field | Value |
|---|---|
| `email` | what they typed |
| `cost_method` | `Time wasted` / `Leads lost` |
| `annual_cost_of_inaction` | the figure they computed in the ledger (e.g. `$81,600`) |
| `source` | `lead-magnet-landing` |
| `referrer` | where they came from |

Netlify also stamps each submission with a date automatically.

## How it works (already wired — nothing to do)

- The `<form>` has `data-netlify="true"`, a hidden `form-name` field, and a honeypot (`bot-field`)
  to filter spam. Netlify's deploy scan finds it and enables the form named **`lead-magnet`**.
- `public/app.js` posts the form with `fetch("/")` + `keepalive` (same-origin, so no CORS), then
  redirects to `CONFIG.GUMROAD_URL`.

## Where your leads land

Netlify Dashboard → your site → **Forms** → **lead-magnet**. From there you can:

- **See every submission** with all fields.
- **Get notified** on each new lead: Forms → **Settings & notifications → Add notification →
  Email notification** (or Slack / outgoing webhook).
- **Export** the whole list as **CSV** (which opens straight into Google Sheets).
- **Pipe into a Google Sheet automatically** (optional): add an *outgoing webhook* notification, or
  connect Netlify → Zapier/Make → Google Sheets. Not required — CSV export covers most needs.

> The **Forms** tab appears after the first deploy that contains the form, and the first real
> submission activates it. A quick test submit on the live site makes it show up.

## Changing things later

- **Download link:** `public/app.js` → `CONFIG.GUMROAD_URL`.
- **Add a field:** add an `<input type="hidden" name="…" data-hidden="…">` in `index.html`, set it
  in `fillLedgerFields()` in `app.js`, and redeploy. Netlify picks up new fields automatically.

## Note
The earlier Google Sheet ("AI Agency Proposal — Lead Magnet Leads") and Apps Script approach were
dropped in favour of this. That sheet is now unused — keep it or delete it, your call.
