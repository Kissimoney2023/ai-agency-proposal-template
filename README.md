# AI Agency Proposal Template — opt-in landing page

A standalone static page. Plain semantic HTML + one modern CSS file + a little vanilla JS.
No framework, no build step. The email lands in Kit (ConvertKit) and triggers the existing
delivery automation.

```
public/               <- the deployable site; ONLY this directory ships
  index.html          markup + meta/OG/Twitter
  styles.css          one layered stylesheet (design tokens as custom properties)
  app.js              the live cost-of-inaction ledger + the Kit form (config at the top)
  assets/fonts/       self-hosted Instrument Sans + Spectral (latin-subset woff2)
  assets/img/         favicon, apple-touch-icon, og.png (1200×630)
netlify.toml          Netlify config (publish = "public")
vercel.json           Vercel config (outputDirectory = "public")
DESIGN-NOTES.md       tokens, type rationale, the signature element, what was tried and rejected
_source/              provided source images + the HTML that generates og.png/the icon — NOT shipped
```

Everything the visitor should ever receive lives in `public/`. Docs, deploy configs, and the
image-generation sources sit at the repo root, outside the publish directory, so they never ship.

## Run it locally

Any static server works — there is nothing to build. Serve from inside `public/` so the
absolute paths (`/styles.css`, `/assets/...`) resolve:

```bash
cd public && python -m http.server 4321
```

Then open <http://127.0.0.1:4321/>. (Serving over http, not opening the file directly, so the
self-hosted fonts load.)

## Swap the Kit form

Everything Kit-related is one object at the top of [`app.js`](app.js):

```js
const CONFIG = {
  KIT_FORM_ID: "9765381",              // Kit form "AI Agency Proposal Template — Lead Magnet"
  SENDER_EMAIL: "sahjohnny@gmail.com", // shown in the success state — match your Kit sending address
  REP_FEE: 6800,                       // the representative project fee the cost is measured against
  WORK_WEEKS: 48,                      // working weeks/year used by the Time calculation
};
```

- **To point at a different form:** change `KIT_FORM_ID` to the new numeric form id. The endpoint
  (`https://app.kit.com/forms/<id>/subscriptions`) is derived from it. Find the id via Kit →
  the form's embed, or the Kit API `list_forms` (the id is the number, not the `2b38d0cd87` slug).
- The form posts with `fetch` and `Accept: application/json`, so the visitor stays on the page and
  gets an on-page success state instead of Kit's built-in redirect. The field name Kit expects is
  `email_address` (already set on the `<input>`).
- This form is **double opt-in** — the success copy says "check your inbox to confirm" on purpose.
  If you switch the form to single opt-in, soften that line in `index.html` (`[data-done]`).

## Update the share image / favicon

`public/assets/img/og.png` (1200×630) and `apple-touch-icon.png` are rendered from the HTML
sources kept in `_source/` (`og.html`, `icon-render.html`; `favicon.svg` is the icon vector).
Those sources reference the fonts at `/assets/fonts/...`, so regenerate by copying the source into
`public/` briefly, serving `public/`, screenshotting, then removing it:

```bash
cp _source/og.html public/og.html
cd public && python -m http.server 4321 &
chrome --headless --window-size=1200,630 --screenshot=assets/img/og.png http://127.0.0.1:4321/og.html
rm og.html
```

## Set the real domain

`index.html` uses `https://proposal.buildwithsaah.com/` as a placeholder in the canonical and
OG/Twitter URLs. Replace those with the real subdomain before launch — `og:image` and
`twitter:image` in particular must be **absolute** for social scrapers to fetch the card.

## Deploy

Plain static directory (`index.html` at the root), no build step. Configs for both hosts are
included and set the same cache/security headers. Point the custom subdomain at the deployment
afterwards, then update the URLs above.

### Netlify — `netlify.toml`

Run from the repo root — `netlify.toml` sets `publish = "public"`, so only the site ships:

```bash
netlify deploy --prod
```

For the drag-and-drop path (<https://app.netlify.com/drop>), drag the **`public`** folder itself
(not the repo root) — Netlify Drop serves exactly what you drop and ignores `netlify.toml`.

### Vercel — `vercel.json`

```bash
vercel --prod
```

`outputDirectory` is set to `public`. (If Vercel's zero-config still serves the root, set the
project's **Root Directory** to `public` in the dashboard.)
