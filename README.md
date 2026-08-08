# AI Agency Proposal Template — opt-in landing page

A standalone static page. Plain semantic HTML + one modern CSS file + a little vanilla JS.
No framework, no build step. On submit the lead is captured by Netlify Forms and the visitor is
redirected to the Gumroad download — see [LEAD-CAPTURE-SETUP.md](LEAD-CAPTURE-SETUP.md).

```
public/               <- the deployable site; ONLY this directory ships
  index.html          markup + meta/OG/Twitter
  styles.css          one layered stylesheet (design tokens as custom properties)
  app.js              the live cost-of-inaction ledger + lead capture (config at the top)
  assets/fonts/       self-hosted Instrument Sans + Spectral (latin-subset woff2)
  assets/img/         favicon, apple-touch-icon, og.png (1200×630)
netlify.toml          Netlify config (publish = "public")
vercel.json           Vercel config (outputDirectory = "public")
LEAD-CAPTURE-SETUP.md  how the Netlify Forms + Gumroad flow works
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

## Lead capture (Netlify Forms → Gumroad)

Leads are captured by **Netlify Forms** — no external service, nothing to paste. Config lives at the
top of [`public/app.js`](public/app.js):

```js
const CONFIG = {
  FORM_NAME:   "lead-magnet",   // matches <form name> + the hidden form-name field
  GUMROAD_URL: "https://buildwithsaah.gumroad.com/l/ai-agency-proposal-template?layout=profile",
  SOURCE:      "lead-magnet-landing",
  REP_FEE:     6800,   // representative project fee the cost is measured against
  WORK_WEEKS:  48,     // working weeks/year used by the Time calculation
};
```

- Submissions appear in **Netlify → your site → Forms → lead-magnet** after the first deploy + a
  test submit. Set up email notifications and CSV export there. Full details:
  [LEAD-CAPTURE-SETUP.md](LEAD-CAPTURE-SETUP.md).
- Each submission carries the **annual cost of inaction** the visitor computed, so you can sort your
  list by pain.
- **Change the download link:** edit `GUMROAD_URL`.

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
