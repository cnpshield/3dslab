<div align="center">

<img src="./public/brandmark.svg" alt="EMV 3DS Protocol Lab logo" width="96" height="96" />

# EMV 3-D Secure Protocol Lab

**A vendor-neutral, browser-based reference lab for visualising, comparing,
and debugging EMV 3-D Secure (3DS) protocol flows across every published
spec version.**

[Live Lab](https://emv-3ds-lab.github.io) ·
[CITATION.cff](./CITATION.cff) ·
[Threat Model](./THREATMODEL.md) ·
[Security Policy](./SECURITY.md) ·
[Apache-2.0](./LICENSE)

</div>

<br />

<p align="center">
  <img src="src/assets/hero.png" alt="EMV 3-D Secure Protocol Lab — the 3-Domain Model visualised across PReq / AReq / CReq / RReq" width="88%" />
</p>

<p align="center">
  <sub><em>One canvas, every message, every spec version, every trust boundary — with the spec section next to every edge.</em></sub>
</p>

---

> **One paragraph for the impatient:** This is the open lab for the
> EMV® 3-D Secure (3DS) protocol — the SCA layer that sits behind Visa Secure,
> Mastercard Identity Check, Amex SafeKey 2.0, J/Secure, and UnionPay 3DS.
> It is *not* a production 3DS Server, ACS, or SDK. It is a visual,
> interactive, side-by-side protocol debugger built so that security researchers,
> payment engineers, and students can finally
> *see* what is happening between the merchant, the 3DS Server, the
> Directory Server, and the ACS — including the modern extensions that
> most 3DS diagrams skip: SPC, WebAuthn / FIDO2, and Decoupled
> Authentication.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [The 30-second tour](#the-30-second-tour)
- [A one-paragraph primer on EMV 3DS](#a-one-paragraph-primer-on-emv-3ds)
- [What this lab is — and what it isn't](#what-this-lab-is--and-what-it-isnt)
- [Features](#features)
- [Specification coverage](#specification-coverage)
- [Quickstart](#quickstart)
- [Using the lab for analysis](#using-the-lab-for-analysis)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
- [Threat model](#threat-model)
- [Related work](#related-work)
- [Contributing](#contributing)
- [Reporting issues](#reporting-issues)
- [Citing this work](#citing-this-work)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Why this exists

The EMV 3-D Secure specification is **gated, paywalled, and sprawling**.
Most public resources show one of two things: a marketing diagram with
three boxes and three arrows, or a Wireshark capture from a single
implementation with no normative context. Neither is enough if you are:

- **A payment engineer** debugging a 3DS Server integration at 02:00,
  trying to understand *why* your AReq is being rejected.
- **A security researcher** reviewing protocol behavior, trust boundaries,
  and implementation choices across the EMV 3DS flow.
- **A graduate student or instructor** trying to teach 3DS without
  handing out a 300-page PDF and hoping for the best.
- **A reviewer or instructor** trying to explain how issuer decisions,
  challenge paths, and message fields actually fit together.

This lab is a working answer to all four. The spec is the source of
truth — every node, edge, and message in the visualiser cites the
relevant EMV 3DS section. When the lab disagrees with an implementation
or with a third-party tutorial, the lab is the thing that is wrong, and
that is treated as a bug.

The design constraints are non-negotiable:

- **The lab is a lab.** It is a visual model of the protocol, not a
  working 3DS Server. There is no real PAN, no real BIN, no live ACS
  call, and no production card-data path. Sensitive test values are
  clearly fake and the UI cues this loudly.
- **The lab is vendor-neutral.** It will not explain one card scheme's
  flavour of 3DS over another. Where implementations differ, the lab
  shows the difference; it does not pick a winner.
- **The lab is permissively licensed.** The work is released under
  Apache 2.0, with the explicit patent grant that a project touching
  FIDO, WebAuthn, and EMVCo-encumbered material needs. See
  [License](#license).

---

## The 30-second tour

1. **Open the [live lab](https://emv-3ds-lab.github.io)** — no install, no auth, no account.
2. Pick a **scenario** (e.g. *Frictionless* vs *Challenge* vs *Decoupled*).
3. Press **Play** to watch the message flow across the 3-Domain Model:
   Cardholder → Merchant → 3DS Server → Directory Server → ACS.
4. Click any **message** to inspect its JWS/JWE payload with the
   correct EMVCo section annotation, every required and conditional
   field highlighted, and base64url / MAC errors spotlighted in place.
5. Toggle the **Security Lens** to overlay trust-boundary notes,
   implementation checks, and protocol-integrity considerations for that message.
6. **Export** the current scenario as a JSON snapshot for regression
   tests, internal reviews, or technical write-ups.

> **Try this first:** Scenario → *Challenge (browser)* → step through
> until the CReq → **CRes** pair, then toggle the **Security Lens**.
> That single click answers more "what is the issuer actually asking?"
> questions than any spec PDF.

---

## A one-paragraph primer on EMV 3DS

EMV 3-D Secure is the protocol that decides whether a card-not-present
(CNP) transaction needs to be challenged (OTP, biometrics, 3DS Method,
etc.) or can be silently approved. It exists so that issuers (the bank
that issued the card) can take on the fraud liability for
e-commerce purchases — and to do it without forcing every customer
through an OTP for every coffee.

The protocol is built around a **3-Domain Model** of six logical actors
(Cardholder, Cardholder Device, Merchant, Acquirer, Issuer, and the
3DS Interoperability Domain), with four "server" roles mediating
between them: the **3DS SDK** on the device, the **3DS Server** at the
merchant / acquirer, the **Directory Server (DS)** as a routing
directory, and the **Access Control Server (ACS)** at the issuer. The
five canonical messages are:

| Message | Direction | Purpose |
|---|---|---|
| **PReq / PRes** | 3DS Server ↔ DS | Out-of-band card-range + protocol-version lookup (cache warm-up) |
| **AReq / ARes** | 3DS Server ↔ DS ↔ ACS | Authentication request: the ACS decides frictionless vs challenge |
| **CReq / CRes** | Browser: 3DS Server / Browser ↔ ACS; App: 3DS SDK ↔ ACS | Challenge interaction and browser/app challenge completion |
| **RReq / RRes** | ACS → DS → 3DS Server, then 3DS Server → DS → ACS | Authoritative final result (`RReq`) and acknowledgement (`RRes`) |

EMVCo owns the spec; the current production version is **2.3.1** and
**2.4.0** is in draft (comment period ending July 2026). See
[EMVCo's 3DS page](https://www.emvco.com/emv-technologies/3-d-secure/)
for the authoritative documents.

---

## What this lab is — and what it isn't

| It **is** | It **is not** |
|---|---|
| A visual model of every 3DS 2.x message flow | A real 3DS Server, DS, ACS, or 3DS SDK |
| An annotated reference for the spec's required / conditional fields | A replacement for reading the actual spec |
| A sandbox for understanding SPA / UCAF, SPC, WebAuthn, Decoupled Auth | A production payment gateway |
| A regression test surface (JSON snapshots are importable) | A PCI-DSS scope-reduction tool |
| A teaching aid with traceable spec citations | A compliance attestation |
| A protocol-analysis workflow aid with a reporting policy for lab issues | A hosted disclosure platform |

---

## Features

### Protocol model

- **3-Domain Model visualisation** with swimlanes, vertical phase bands
  (pre-auth, auth, challenge, results), and a left-mounted step-rail
  so you can never lose your place in a long flow.
- **Side-by-side scenario comparison.** Open *Frictionless (browser)*
  next to *Frictionless (app / SDK)* in two tabs and diff the JWS
  payloads by hand.
- **Out-of-band (OOB) callouts** for Decoupled Authentication so the
  polling / callback hooks don't look like the protocol just
  "stopped working".
- **PReq / PRes rendered as Step 0A / 0B** in a `preauth` group with a
  `silent` visibility flag — they're cache warm-up, not a per-transaction
  step, but you can't reason about AReq routing without them.

### Modern authentication extensions

- **SPC (Secure Payment Confirmation)** as a first-class alternative to
  OTP — visualised as an FIDO2 / WebAuthn ceremony between the ACS and
  the cardholder's authenticator.
- **WebAuthn / FIDO2 challenge path** with public-key assertion shape
  shown alongside the CReq wrapper.
- **Decoupled Authentication** with explicit out-of-band arrows and
  an RReq-driven "still pending" state until the issuer comes back.
- **3RI (3DS Requestor-Initiated)** flows for recurring, instalment,
  and merchant-initiated transactions.

### Cryptographic payload presentation

- Dedicated parser for `threeDSMethodData`, `CReq / CRes`, and
  `AReq / ARes` with **JWS / JWE structural validation**:
  base64url alphabet, segment count, kid match, MAC length, signature
  recovery.
- **Error spotlighting in place.** A bad base64url padding, a missing
  conditional field, or a corrupted MAC is highlighted on the exact
  node, not in a separate console.
- **Tri-state theme** (`dark` / `light` / `security`) for accessibility
  and for matching the look of the SOC dashboards most 3DS work happens in.

### Failure injection (alpha)

- **Network failure injection** for DS rejections, ACS signature
  failures, HTTP timeouts, and unexpected response codes.
- **Business-rule failure injection** for the rule codes each server
  can return at each message.
- All injections are local to the sandbox; they cannot affect any
  real 3DS Server.

### Reproducibility & DX

- **JSON snapshot export and re-injection** — every scenario can be
  frozen to disk and replayed exactly. This is the regression-test
  primitive.
- **Shared-state URL encoding** — paste a link and a colleague sees
  the exact same scenario, step, hidden group, and theme.
- **Keyboard-first navigation** with `prefers-reduced-motion` honoured
  across every animation.
- **Privacy cues** on every sensitive test field (PAN, CVV, key material)
  are loud by default. There's no such thing as an *incidental* card
  number in this lab.

---

## Specification coverage

| Spec | Status | Notes |
|---|---|---|
| EMV 3DS v2.1.0 | Stable | Full coverage; the default "legacy" baseline |
| EMV 3DS v2.2.0 | Stable | Full coverage incl. 3RI, decoupled auth baseline |
| EMV 3DS v2.3.1 | Stable | Full coverage incl. SPC, expanded device data |
| EMV 3DS v2.4.0 (DRAFT 1) | Preview | UI-exposed preview that currently falls back to the v2.3.1 registry while native builders are in progress |

Message-level coverage:

- [x] **PReq / PRes** — card-range + protocol-version synchronisation
- [x] **AReq / ARes** — including both defined `messageCategory` values
      (`01` = PA, `02` = NPA). 3RI is modelled via `deviceChannel` / `threeRIInd`, not a separate `messageCategory`.
- [x] **CReq / CRes** — browser challenge flow in the interactive canvas; browser and app/SDK message shapes in the payload registry
- [x] **RReq / RRes** — final results, including decoupled polling, with `RReq` as the result carrier and `RRes` as the acknowledgement
- [x] **threeDSMethodData** — hidden browser-collector flow
- [x] **ER (Error) messages** — protocol-level error codes per role
- [x] **SPC** — Secure Payment Confirmation
- [x] **WebAuthn / FIDO2** challenge path
- [x] **Decoupled Authentication** with OOB callouts
- [x] **3RI** — recurring / instalment / merchant-initiated
- [ ] **v2.4.0 native 3DS2 OOB browser flow** — draft, in progress
- [ ] **EUDI Wallet binding** — planned (see [Roadmap](#roadmap))

---

## Quickstart

The lab is a static SPA. There is **no build server to trust and no
account to create**.

### Option A — Use the hosted lab

> **Recommended for most users.**
> [emv-3ds-lab.github.io](https://emv-3ds-lab.github.io)

It is served from this repository's `main` branch via GitHub Pages and
is rebuilt on every commit.

### Option B — Run it locally

```bash
# 1. Clone into a cleaner local folder name
git clone https://github.com/emv-3ds-lab/emv-3ds-lab.github.io.git emv-3ds-protocol-lab
cd emv-3ds-protocol-lab

# 2. Install (Node 22 LTS or newer; pnpm 9+)
pnpm install

# 3. Run the dev server with HMR
pnpm dev             # → http://localhost:5173

# 4. Or build + preview the production bundle
pnpm build
pnpm preview         # → http://localhost:4173
```

### Option C — Pin to a specific commit (for reproducible analysis)

```bash
git clone https://github.com/emv-3ds-lab/emv-3ds-lab.github.io.git emv-3ds-protocol-lab
cd emv-3ds-protocol-lab
git checkout <commit-sha>
pnpm install --frozen-lockfile
pnpm build
pnpm preview
```

This is the workflow to use when you are writing up a finding and need
the lab to render identically a year from now.

---

## Using the lab for analysis

Concrete patterns the lab is designed to support:

- **Reconstructing a 3DS capture.** Load a captured JWS payload from
  your local analysis into the relevant scenario, step through it,
  and export the annotated JSON for your notes or report.
- **Security review.** Use the Security Lens as a structured checklist
  while you inspect a branch. Each overlay points back to the protocol
  phase, message shape, and trust assumption in play.
- **Teaching.** Run the lab live, scrub through a Challenge flow, and
  pause on the ARes to ask the room "what does the issuer know at this
  point?". The details panel surfaces exactly that.
- **Regression fixtures.** Export a known-bad AReq as JSON, commit it
  to your test suite, and re-inject it whenever the lab moves to a
  newer spec version to confirm the failure mode still reproduces.
- **Threat modelling.** Treat the lab as your data-flow diagram. The
  edges are the trust boundaries; the message inspectors are where you
  reason about confidentiality, integrity, and replay.

If you publish work that uses the lab, please [cite it](#citing-this-work) —
it helps the project survive long enough to be useful to the next
researcher.

---

## Architecture

```
emv-3ds-protocol-lab/
├── src/
│   ├── App.tsx                    # Root: shared-state hydration, layout
│   ├── tokens.ts                  # Design-system primitives (theme tokens)
│   ├── data/
│   │   ├── flowData.ts            # All scenario / step / message data
│   │   └── emvcoFingerprint.ts    # Spec-section citation graph
│   ├── components/                # Canvas nodes, edges, controls, panels
│   ├── stores/                    # Zustand stores (flow + UI)
│   └── utils/                     # JWS validator, snapshot (re)injector
├── public/                        # Static assets served verbatim
├── docs/
│   ├── architecture.md            # Deep architectural notes
│   ├── product-strategy.md        # Positioning, audience, principles
│   ├── competitive-landscape.md   # Adjacent projects + how we differ
│   └── roadmap.md                 # Near- and mid-term plans
├── .github/                       # Issue + PR templates
├── CITATION.cff                   # Academic citation metadata
├── SECURITY.md                    # Reporting policy for issues in the lab itself
└── CONTRIBUTING.md                # Contribution workflow
```

The app is a React 19 SPA built with Vite, using [React Flow (`@xyflow/react`)](https://reactflow.dev/)
for the canvas. State is split into a `flowStore` (scenarios, steps,
current step, hidden groups) and a `uiStore` (theme, security lens,
panels, toolbar state). Hydration from the URL `?state=` parameter is
handled in `App.tsx`; JSON snapshots are importable / exportable from
the toolbar.

For the design rationale — including why we shipped a "Public Lab /
alpha" instead of waiting for a 1.0 — see
[docs/product-strategy.md](./docs/product-strategy.md).

---

## Roadmap

The mid-term direction, in priority order. Pull requests that move any
of these forward are welcome; open an issue first if you'd like to
coordinate.

1. **EMV 3DS v2.4.0 (DRAFT 1) coverage** — once the comment period
   closes on 1 July 2026, work the new messages and updated field
   shapes into the visualiser.
2. **WebAuthn / FIDO2 deeper inspection** — show the assertion object
   alongside the CRes wrapper.
3. **Failure-injection DSL** — let users script custom
   DS / ACS / network failure sequences for regression fixtures.
4. **EUDI Wallet binding** for 3DS, once the EMVCo guidance is final.
5. **Internationalisation** — pull message labels and tooltip copy
   out of the data layer.
6. **Static export of a "lab paper"** — a printable, citable PDF
   version of any scenario for inclusion in coursework and reports.

See [docs/roadmap.md](./docs/roadmap.md) for the longer view, including
explicit non-goals.

---

## Threat model

This section is for analysts and security reviewers evaluating
whether the lab itself introduces any risk to a protocol-analysis workflow.

**In scope of the lab's threat model**

- A scenario payload or shared URL that, when imported, executes
  arbitrary JavaScript in the lab. *Mitigation: all scenario data
  flows through a typed parser; nothing is `eval`'d; imported JSON is
  validated against the `Scenario` schema before rendering.*
- Cross-site leakage via the `?state=` URL parameter.
  *Mitigation: only the minimum scenario metadata is serialised; no
  arbitrary HTML, no remote loads, no third-party origins.*
- Fingerprinting via the GitHub Pages CDN. *Mitigation: standard
  GitHub Pages headers; no custom telemetry or analytics.*

**Out of scope**

- The lab is a visualisation, not a live payment system. It cannot
  affect, observe, or interfere with a real 3DS Server, DS, ACS, or
  SDK. There is no network egress to any production 3DS endpoint.
- The lab does not store, transmit, or log any data outside of the
  browser tab it is loaded in, except for the explicit JSON snapshot
  the user chooses to export.
- PCI-DSS scope: the lab is **not** a payment system and **does not**
  reduce any PCI-DSS scope for any other system. All test data is
  synthetic and clearly labelled as such in the UI.

If you find a real issue in the lab itself, please follow
[SECURITY.md](./SECURITY.md). The default reporting window is **90
days** in line with common coordinated-reporting norms.

---

## Related work

A short, honest map of adjacent projects. Full comparison in
[docs/competitive-landscape.md](./docs/competitive-landscape.md).

| Project | What it is | How this lab differs |
|---|---|---|
| [copyleftdev/emv-3ds](https://github.com/copyleftdev/emv-3ds) | A Rust crate that implements the 3DS 2.x message layer and state machine. Production-shaped. | The lab is a visual model of the *protocol*, not an implementation. If you want a `no_std` 3DS encoder for a service mesh, use that crate. If you want to *see* the spec, use this lab. |
| [EMVCo 3DS specifications](https://www.emvco.com/emv-technologies/3-d-secure/) | The authoritative spec (gated, requires EMVCo registration for some documents). | The lab is a *teaching-grade* rendering of the spec, with the spec text as the citation graph. The lab does not replace the spec — every node in the lab carries a "this comes from §X.Y" pointer. |
| [PortSwigger / Burp extensions for 3DS](https://portswigger.net/burp) | Interception and manipulation tools for 3DS request/response traffic. | Burp is the right tool for *active* testing against a real 3DS Server. The lab is the right tool for *understanding* the protocol before you point Burp at a target. |
| Wireshark 3DS dissectors | Packet-capture decoders for 3DS over the wire. | Wireshark shows you what one implementation *did*. The lab shows you what the spec *says it should do*. They are complements, not competitors. |

The lab is intentionally **not** a clone or a fork of any of these.
If you want a single sentence to differentiate the lab from each, the
table above is it.

---

## Contributing

Contributions of all sizes are welcome — typo fixes, new scenarios,
spec citations, failure-injection cases, accessibility reports.

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull
request. The short version:

- **Small fixes** (typos, broken links, dead images) → open a PR
  directly. Don't gate them on an issue.
- **New scenarios or new spec coverage** → open an issue first so we
  can agree on the spec section it cites, the data model, and the
  visual treatment.
- **Security-relevant changes** (anything touching the JWS parser,
  the snapshot import path, or the URL hydration) → follow the
  reporting process in [SECURITY.md](./SECURITY.md), not the normal PR process.
- All commits are accepted under the Apache 2.0 license that ships
  with the project. By contributing, you affirm the standard
  Developer Certificate of Origin (DCO) and agree your contribution
  may be distributed under that license.
  See [License](#license).

The project is maintained on a best-effort basis. If a PR is
unresponsive for more than 30 days, please ping the issue and we'll
either pick it up or hand it off.

---

## Reporting issues

This is a protocol reference tool that people may rely on for
security analysis and implementation review. We treat the lab's own
security and correctness with the same seriousness as if it were production.

**Please report issues privately first.** See
[SECURITY.md](./SECURITY.md) for the full policy, including the
90-day coordination window, the private reporting channels, and the
scope of what counts as a reportable issue.

---

## Citing this work

If the lab contributed to a paper, post, technical report, or
teaching material, please cite it. A [CITATION.cff](./CITATION.cff)
file is shipped in the repository root, so most citation managers
(GitHub's "Cite this repository" button, Zotero, etc.) will pick up
the metadata automatically.

A plain-text citation for the current version:

> Wasif Faisal, BRAC University. (2026). *EMV 3-D Secure Protocol Lab* (Version 0.3.0)
> [Software]. https://github.com/emv-3ds-lab/emv-3ds-lab.github.io

A BibTeX entry, regenerated by your reference manager from
`CITATION.cff`:

```bibtex
@software{emv_3ds_protocol_lab_2026,
  author = {Wasif, Faisal},
  organization = {BRAC University},
  title  = {{EMV 3-D Secure Protocol Lab}},
  year   = {2026},
  url    = {https://github.com/emv-3ds-lab/emv-3ds-lab.github.io},
  note   = {Open-source visual lab for the EMV 3-D Secure protocol suite}
}
```

For a long-term-stable identifier, mint a Zenodo DOI from the tagged
release before citing the artifact in a camera-ready paper or appendix.

---

## License

This project is released under the **Apache License, Version 2.0**
([LICENSE](./LICENSE)). The choice is deliberate:

- **Permissive, with an explicit patent grant.** Apache 2.0 is the
  de-facto license for security and infrastructure code because each
  contributor grants a patent licence for their contribution. For a
  project that touches FIDO, WebAuthn, and EMVCo-encumbered material,
  that peace of mind matters.
- **Vendor-friendly by default.** Any 3DS Server, ACS, or SDK vendor
  can embed the lab in internal training material, screenshot it for
  documentation, or fork it for a product demo without asking first.
  This is the fastest path to the lab being actually *used*, which is
  the protection that matters most for a research tool.
- **Still open.** Apache 2.0 requires that any distributed copy include
  the licence and preserve attribution. Derivative works remain free
  to read, modify, and redistribute — the same commons guarantee that
  has kept the lab healthy so far.
- **The unkillable part is the community, not the licence.** Going
  permissive is a decision to grow the number of people with a
  reason to care about the lab. That is the research-commons
  protection this project actually needs.

EMV® and EMVCo® are trademarks of EMVCo, LLC. All references to the
EMV 3-D Secure specification are made under fair use for educational
and research purposes.

---

## Acknowledgements

This project would not exist without the patient, public work of:

- **EMVCo** for stewarding the 3-D Secure specification across versions
  and for the public FAQ documents that anchor a lot of the lab's
  spec-citation graph.
- The **OWASP** community, whose threat-modelling discipline shaped
  the lab's Security Lens.
- The **3DS implementer community** — payment engineers, ACS
  operators, and SDK maintainers — whose public write-ups and
  conference talks are the difference between a working lab and a
  guess.
- The **Wireshark and Burp Suite maintainers** for setting the
  standard for what a good protocol-debugging tool feels like.
- The **researchers and contributors** who file issues, fix typos,
  and submit scenarios. You are listed in the
  [contributors graph](https://github.com/emv-3ds-lab/emv-3ds-lab.github.io/graphs/contributors).
- The **emv-3ds-lab** maintainers, who keep the lights on.

If the lab saved you time, found a real bug, or made a class easier
to teach, that is the entire metric we optimise for. Thank you for
being here.

---

<div align="center">

**EMV 3-D Secure Protocol Lab** · [Lab](https://emv-3ds-lab.github.io) ·
[Issues](https://github.com/emv-3ds-lab/emv-3ds-lab.github.io/issues) ·
[Security](./SECURITY.md) ·
[Cite](./CITATION.cff)

</div>
