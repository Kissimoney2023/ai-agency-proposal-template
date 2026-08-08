/* =========================================================================
   The Estimate — behaviour
   1. The live "cost of inaction" ledger (the signature element)
   2. The Kit sign-up form: validation, loading, on-page success/failure
   ========================================================================= */

/* ---- CONFIG — swap the form here if it ever changes --------------------- */
const CONFIG = {
  KIT_FORM_ID: "9765381",                    // Kit form: "AI Agency Proposal Template — Lead Magnet"
  get KIT_ENDPOINT() { return `https://app.kit.com/forms/${this.KIT_FORM_ID}/subscriptions`; },
  SENDER_EMAIL: "sahjohnny@gmail.com",       // shown in the success state; match your Kit sending address
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
   2 · The Kit sign-up
   ========================================================================= */
(function signup() {
  const form   = $("[data-capture]");
  if (!form) return;

  const email  = $("[data-email]", form);
  const submit = $("[data-submit]", form);
  const label  = $("[data-btn-label]", submit);
  const msg    = $("[data-msg]", form);
  const done   = $("[data-done]");

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setMsg(text, state) {
    if (!text) { msg.hidden = true; msg.textContent = ""; msg.removeAttribute("data-state"); return; }
    msg.hidden = false;
    msg.textContent = text;
    msg.setAttribute("data-state", state);
  }

  function loading(on) {
    submit.disabled = on;
    if (on) {
      label.textContent = "Sending…";
      submit.insertAdjacentHTML("afterbegin", '<span class="btn__spin" data-spin aria-hidden="true"></span>');
    } else {
      label.textContent = "Send me the template";
      $("[data-spin]", submit)?.remove();
    }
  }

  function showSuccess(address) {
    $("[data-done-email]", done).textContent = address;
    $("[data-sender]", done).textContent = CONFIG.SENDER_EMAIL;
    form.hidden = true;
    done.hidden = false;
    done.setAttribute("tabindex", "-1");
    done.focus();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const address = email.value.trim();

    if (!address)               { email.setAttribute("aria-invalid", "true"); email.focus(); return setMsg("Enter your email to get the template.", "error"); }
    if (!EMAIL_RE.test(address)) { email.setAttribute("aria-invalid", "true"); email.focus(); return setMsg("That email looks incomplete — check for a typo.", "error"); }

    email.removeAttribute("aria-invalid");
    setMsg(null);
    loading(true);

    try {
      const body = new URLSearchParams({ email_address: address });
      const res = await fetch(CONFIG.KIT_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!res.ok) throw new Error(`kit ${res.status}`);
      // Kit returns JSON for the embed; any 2xx means the subscription was accepted.
      await res.json().catch(() => ({}));
      showSuccess(address);
    } catch (err) {
      loading(false);
      setMsg("Couldn’t reach Kit just now. Check your connection and send again.", "error");
    }
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
