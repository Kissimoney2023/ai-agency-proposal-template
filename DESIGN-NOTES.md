# Design notes — "The Estimate"

A standalone opt-in page for the AI Agency Proposal Template. One job: get an AI-automation
freelancer to hand over their email in exchange for the template. Designed from the subject's
own world — an estimate/proposal document: line items, subtotals, dotted leaders, right-aligned
currency, tier tables, a "Not included" list — not from generic SaaS-landing vernacular.

## Tokens

| Token | Hex | Role |
|---|---|---|
| `--navy` | `#0F1729` | primary ink; **dark ledger surfaces** (the calculator, the letterhead/credibility band) |
| `--blue` | `#2F6BFF` | **structure only** — card edges, field borders, focus rings, segmented-control fill |
| `--amber` | `#FFB020` | **cost of inaction, and nothing else** — the one live figure the whole page turns on |
| `--paper` | `#E8EAEE` | page ground — a **cool** blue-grey ledger stock (deliberately *not* warm cream) |
| `--sheet` | `#FCFCFB` | raised "sheets" (argument band, the prize card, the document) |
| `--slate` | `#4C566E` | mid ink — secondary text and field labels |
| `--rule` | `#C7CDDA` | hairline / dotted-leader tone |

Two AA-safe derivations of the locked blue, because `#2F6BFF` as *small text* only clears
~3.7:1 on light: `--blue-ink #2557E0` (blue text on paper/white, ≥4.9:1) and
`--blue-lite #5B86FF` (blue text/dots on navy, ≥5.4:1). The locked `#2F6BFF` is kept for all
*structure* — borders, rings, fills — where it isn't body text.

### The amber rule
Amber = the cost-of-inaction figure. It appears on exactly two things, both the same idea:
the **live** annual figure in the hero ledger, and the amber left-rule on the thesis sentence
"That's block two." Everywhere amber tried to creep in — a pulsing "live" dot, the "prize" tag,
the verdict multiplier, the document's printed total, the success bullet — it was pulled back to
navy/blue. The printed `$83,200` total in the worked example stays **ink**, because a real
proposal prints its totals in black.

## Type — two families, three roles

- **Spectral** (self-hosted) — the *document* voice: the display headline, section headings,
  the worked-proposal fragment, and every **number** (tabular lining figures). A proposal is a
  document, and the whole argument is arithmetic, so figures are set in the serif's tabular
  figures — `$6,800`, `$83,200`, `$25,920` — and threaded into the sans prose so a quoted number
  always reads as lifted from the document.
- **Instrument Sans** (self-hosted, the established brand face) — the *working* voice: interface,
  form, labels, buttons, body.

**One-line rationale:** Instrument Sans is what you type into; Spectral is what it prints as — and
the numbers live in Spectral's tabular figures because the page's entire argument is that the
problem, added up, dwarfs the fee.

Italics use real cut faces (Spectral 600-italic for the headline emphases, 400-italic for asides;
Instrument 400-italic for field hints) — no synthetic obliques.

## Signature element — the Cost-of-Inaction Ledger (Option A)

The hero **is block two of the proposal, rendered live.** The visitor fills line items on a navy
ledger card — Time method (hours lost/week × loaded rate × 48 weeks) or Leads method
(leads missed/mo × close rate × deal size × 12) — prefilled with real defaults so it resolves a
real figure on load, no blank slate. It totals like an invoice (dotted leaders, right-aligned
tabular currency, a running annual figure). *Then* a representative project fee (`$6,800 once`)
drops in beneath it and the ratio resolves — the exact reframe the template teaches, performed on
the visitor's own numbers before the ask. The count-up animates once per change (≤360ms) and snaps
instantly under `prefers-reduced-motion`. This doubles as the first artifact preview: the hero is
a legible fragment of the template.

Option B (the assembling 01–07 proposal) is deliberately kept quiet — the fixed seven-block order
survives only as the numbered index rail inside the worked-example fragment, where the numbers
encode something true.

## Layout

A single document column on cool paper: live navy ledger hero → email signature-line → a quiet
argument band on a white sheet → a **line-item "What's inside"** where each row shows its real
count (7 blocks, 5 formulas, 3 tiers, 3 lines, 11 checks) and item **03 breaks the list open into
the actual worked-proposal fragment** (the prize — one move that fixes both "six identical pairs"
and "no artifact preview") → a signed credibility band on navy → a quieter re-entry CTA.

CSS is one stylesheet in `@layer reset, base, layout, components, utils`, so section padding
(`.hero`, `.argument`, …, each owning its own block-padding at equal specificity) never fights
element padding. `minmax(0,1fr)` tracks + `min-width:0` grid items keep the ledger from forcing
horizontal overflow on phones.

## The two CTAs
One real `<form>` in the hero. Its button is **navy** (white label, blue focus ring, blue inset
edge) — high-contrast, reads as an official action, and frees amber to stay on the one figure. The
closing CTA is a quieter **outline** button that smooth-scrolls to and focuses the hero field — a
re-entry, not a second form. No duplicate inputs, no double-submit.

## States (interface voice, no apologies)
- **Success** (on-page, not a redirect): "Check your inbox to confirm." — names the double-opt-in
  confirm step, the sender address, and what arrives (Notion page + 12-page PDF). The form is
  double opt-in in Kit, so the copy says *confirm*, not "it's on its way."
- **Empty:** "Enter your email to get the template."
- **Invalid:** "That email looks incomplete — check for a typo."
- **Network/Kit failure:** "Couldn't reach Kit just now. Check your connection and send again."
- Inline `aria-invalid`, a loading spinner + "Sending…" on submit, error clears on next keystroke.

## What I tried and rejected
- **A third webfont (serif + sans + mono).** The brief floated a mono for numbers; two families is
  the cap. Chose Spectral over a mono — the serif's tabular figures give the "printed estimate"
  character *and* carry display, so one family does two jobs.
- **Warm cream ground (#F4F1EA).** That's AI-default #1 (cream + serif + terracotta). Went cool
  blue-grey paper so serif-on-paper reads as an office document, not an editorial magazine.
- **An amber primary button.** Two amber things. Button went navy; amber stays on the figure.
- **A pulsing amber "live" dot.** A second amber and a SaaS tic — the ledger proves it's live by
  responding. Removed (this was the "remove one accessory" cut); a small static blue dot remains.
- **"Big gradient number + three stat cards" hero.** Inverted: the big number is user-computed
  inside a live widget, in mono-tabular serif, not a gradient — earned, not decorative.

## Accessibility / performance floor (unannounced)
Responsive to 360px; visible blue focus ring on every control; real `<label>`s and semantic
landmarks; `prefers-reduced-motion` respected; body ≥ 4.5:1 (amber-on-navy measured ~9.8:1, slate
~6:1, blue-text derivations ≥4.9:1). Two self-hosted latin-subset families, three faces preloaded,
`font-display:swap`, fixed input/figure sizes → no CLS. No framework, no build step, ~15 KB of
first-party CSS+JS.
