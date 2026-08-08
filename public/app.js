/* =========================================================================
   The Estimate — behaviour
   1. The live "cost of inaction" ledger (the signature element)
   2. Lead capture → Google Sheet, then redirect to the Gumroad download
   ========================================================================= */

/* ---- CONFIG — the only things you edit ---------------------------------- */
const CONFIG = {
  // Leads are captured by Netlify Forms — no external service, nothing to paste.
  // Must match the <form name="…"> and its hidden form-name field in index.html.
  FORM_NAME: "lead-magnet",

  // Where the visitor is sent to collect the template.
  GUMROAD_URL: "https://buildwithsaah.gumroad.com/l/ai-agency-proposal-template?layout=profile",

  SOURCE: "lead-magnet-landing",             // recorded on each submission
  REP_FEE: 6800,                             // the representative project fee the cost is measured against
  WORK_WEEKS: 48,                            // working weeks per year used in the time calculation
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num = (el) => { const v = parseFloat(el?.value); return Number.isFinite(v) && v > 0 ? v : 0; };
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =========================================================================
   1 · The ledger
   ========================================================================= */
(function ledger() {
  const root = $(".ledger");
  if (!root) return;

  const panels   = { time: $('[data-panel="time"]'), leads: $('[data-panel="leads"]') };
  const out       = {
    periodic: $('[data-out="periodic"]'),
    annual:   $('[data-out="annual"]'),
    ratio:    $('[data-out="ratio"]'),
    fee:      $('[data-out="fee"]'),
    verdict:  $('[data-out="verdict"]'),
  };
  const periodicLabel = $('[data-label="periodic"]');
  const inp = (k) => $(`[data-input="${k}"]`);

  let currentMethod = "time";
  let shownAnnual = 0;         // last painted annual value (for count-up)
  let raf = 0;

  function compute() {
    if (currentMethod === "time") {
      const weekly = num(inp("hours")) * num(inp("rate"));
      return { periodic: weekly, periodicLabel: "Weekly cost", annual: weekly * CONFIG.WORK_WEEKS };
    }
    const monthly = num(inp("leads")) * (num(inp("close")) / 100) * num(inp("deal"));
    return { periodic: monthly, periodicLabel: "Monthly cost", annual: monthly * 12 };
  }

  function paintAnnual(value) {
    out.annual.textContent = usd.format(Math.round(value));
  }

  function animateAnnual(target) {
    cancelAnimationFrame(raf);
    if (prefersReduced()) { shownAnnual = target; paintAnnual(target); return; }
    const from = shownAnnual, delta = target - from, start = performance.now(), dur = 360;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    (function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      paintAnnual(from + delta * ease(t));
      if (t < 1) { raf = requestAnimationFrame(tick); } else { shownAnnual = target; }
    })(start);
  }

  function verdict(annual) {
    const fee = CONFIG.REP_FEE;
    if (annual <= 0) {
      out.ratio.textContent = "—";
      return `Enter your numbers — the comparison is the point.`;
    }
    const ratio = annual / fee;
    if (ratio >= 1) {
      const r = ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1);
      out.ratio.textContent = `${r}×`;
      return `The problem costs <span class="tnum" data-out="ratio">${r}×</span> the fix — every year.`;
    }
    const months = Math.round((fee / annual) * 12);
    out.ratio.textContent = `${months} mo`;
    return `Even here, the fee pays itself back in <span class="tnum" data-out="ratio">${months}</span> months.`;
  }

  function update() {
    const { periodic, periodicLabel: pl, annual } = compute();
    periodicLabel.textContent = pl;
    out.periodic.textContent = usd.format(Math.round(periodic));
    out.fee.innerHTML = `${usd.format(CONFIG.REP_FEE)} <span class="once">once</span>`;
    out.verdict.innerHTML = verdict(annual);
    animateAnnual(annual);
  }

  // Method toggle
  $$('input[name="method"]').forEach((r) => {
    r.addEventListener("change", () => {
      currentMethod = r.value;
      panels.time.hidden  = currentMethod !== "time";
      panels.leads.hidden = currentMethod !== "leads";
      update();
    });
  });

  // Any input change
  $$('[data-input]').forEach((el) => el.addEventListener("input", update));

  // First paint (defaults already produce a real figure — no blank slate)
  shownAnnual = compute().annual;
  paintAnnual(shownAnnual);
  update();
})();

/* =========================================================================
   2 · Lead capture → Netlify Forms, then redirect to the Gumroad download
   ========================================================================= */
(function capture() {
  const form   = $("[data-capture]");
  if (!form) return;

  const email  = $("[data-email]", form);
  const submit = $("[data-submit]", form);
  const label  = $("[data-btn-label]", submit);
  const msg    = $("[data-msg]", form);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const setHidden = (key, val) => { const el = $(`[data-hidden="${key}"]`); if (el) el.value = val; };

  function setMsg(text, state) {
    if (!text) { msg.hidden = true; msg.textContent = ""; msg.removeAttribute("data-state"); return; }
    msg.hidden = false;
    msg.textContent = text;
    msg.setAttribute("data-state", state || "");
  }

  function loading(on, text) {
    submit.disabled = on;
    if (on) {
      label.textContent = text || "Saving…";
      submit.insertAdjacentHTML("afterbegin", '<span class="btn__spin" data-spin aria-hidden="true"></span>');
    } else {
      label.textContent = "Send me the template";
      $("[data-spin]", submit)?.remove();
    }
  }

  // Post the form to Netlify (same-origin, so no CORS). keepalive lets it finish
  // as the page redirects to the download.
  function submitToNetlify() {
    const body = new URLSearchParams(new FormData(form)).toString();
    return fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      keepalive: true,
    });
  }

  // Read what the visitor computed in the ledger, so each lead carries its
  // self-reported cost of inaction.
  function fillLedgerFields() {
    const method = $('input[name="method"]:checked')?.value === "leads" ? "Leads lost" : "Time wasted";
    setHidden("method",   method);
    setHidden("annual",   $('[data-out="annual"]')?.textContent.trim() || "");
    setHidden("source",   CONFIG.SOURCE);
    setHidden("referrer", document.referrer || "direct");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const address = email.value.trim();

    if (!address)               { email.setAttribute("aria-invalid", "true"); email.focus(); return setMsg("Enter your email to get the template.", "error"); }
    if (!EMAIL_RE.test(address)) { email.setAttribute("aria-invalid", "true"); email.focus(); return setMsg("That email looks incomplete — check for a typo.", "error"); }

    email.removeAttribute("aria-invalid");
    setMsg(null);
    loading(true, "Opening your download…");

    fillLedgerFields();
    try { submitToNetlify(); } catch (_) { /* keepalive best effort */ }

    // Hand off to the download. The 300ms lets the POST flush before we navigate;
    // keepalive already makes it survive the navigation.
    window.setTimeout(() => { window.location.href = CONFIG.GUMROAD_URL; }, 300);
  });

  // Clear the error the moment they start fixing it
  email.addEventListener("input", () => {
    if (email.getAttribute("aria-invalid") === "true") { email.removeAttribute("aria-invalid"); setMsg(null); }
  });

  // Quieter re-entry CTA → focus the one real form
  $("[data-reentry]")?.addEventListener("click", () => {
    document.getElementById("get-it")?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "center" });
    setTimeout(() => email.focus({ preventScroll: true }), prefersReduced() ? 0 : 420);
  });
})();
