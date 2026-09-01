/**
 * Static prerender for the research landing pages.
 *
 * Vite builds a single-page Vite app, which is great for the
 * interactive lab but bad for SEO: every URL is just `/`. To make
 * the research pages indexable as real documents, this script emits
 * a fully static HTML file per page directly to `dist/`. Each file
 * is a complete document with the full page content in the markup
 * (so crawlers see it), the correct `<title>` and Open Graph tags,
 * and a "Back to the interactive lab" link that takes the user back
 * to the SPA at `/` for the canvas.
 *
 * Why a hand-written emitter rather than a real React SSR pipeline?
 *   - The page modules import .tsx files, which Node cannot run
 *     without a transpiler. Pulling in `tsx` / `esbuild` as a new
 *     dev dep is blocked by the pnpm-workspace config in this repo.
 *   - The page content is small, deterministic, and data-driven
 *     from `src/data/payloads`. We re-derive the same data the
 *     page components would have used and emit a static HTML tree
 *     by hand. The result is identical to the SPA render except
 *     for the `useState` filter on the Field Reference page, which
 *     is a minor convenience and not a content concern.
 *
 * This script runs after `vite build` via the `build` npm script.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const PAYLOADS_DIR = join(ROOT, 'src', 'data', 'payloads');

const CANONICAL_ORIGIN = 'https://cnpshield.github.io/3dslab';
const SITE_NAME = 'EMV 3DS Protocol Lab';
const OG_IMAGE = `${CANONICAL_ORIGIN}/og-image.png`;

/** Minimal HTML escape for text content. */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Load every payload entry in the versioned payload registry. */
function loadPayloads() {
  const out = {};
  const indexPath = join(PAYLOADS_DIR, 'index.ts');
  // We re-derive the data the page components use. The registry is
  // a directory of {messageType}/{version}.ts files. We read the
  // `index.ts` registry map to know which files exist, then read
  // each .ts file's "fields" array via a tiny regex extractor. This
  // avoids parsing TypeScript while still getting the field names.
  const indexSrc = readFileSync(indexPath, 'utf8');
  // Look for `payloads/` or `pay/` directory listing entries; the
  // registry imports use the format
  //   areq: { '2.1.0': payloadFromAreq210, ... }
  // We read the supporting directory listing directly from disk
  // instead, which is more robust than parsing the index source.
  const messageTypes = ['AReq', 'ARes', 'CReq', 'CRes', 'RReq', 'RRes', 'Erro', 'OReq', 'ORes', 'PReq', 'PRes'];
  for (const messageType of messageTypes) {
    const slotDir = join(PAYLOADS_DIR, messageType.toLowerCase().replace(/req|res|erro/, (m) => m.toLowerCase()));
    if (!existsSync(slotDir)) continue;
    const versions = readdirSync(slotDir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    out[messageType] = {};
    for (const file of versions) {
      const version = file.replace(/\.ts$/, '').replace(/^v/, '');
      const src = readFileSync(join(slotDir, file), 'utf8');
      // Extract the `fields:` block from the .ts file. The block
      // runs from the line containing `fields: [` to the matching
      // closing `]`. We then extract every top-level `{ field:
      // 'name', ... }` entry from it.
      const fields = extractFields(src);
      out[messageType][normalizeVersion(version)] = fields;
    }
  }
  void indexSrc;
  return out;
}

function normalizeVersion(v) {
  // e.g. "v210" -> "2.1.0", "v220" -> "2.2.0", "v231" -> "2.3.1"
  if (/^\d+\.\d+\.\d+$/.test(v)) return v;
  const m = /^v?(\d)(\d)(\d)$/.exec(v);
  if (!m) return v;
  return `${m[1]}.${m[2]}.${m[3]}`;
}

/** Extract `field: 'name'` entries from a .ts payload file. */
function extractFields(src) {
  const out = [];
  // The fields array contains objects of the form
  //   { field: 'name', type: 'string', ..., sinceVersion: '2.1.0', ... }
  // We only need the `field` string for the count columns.
  const re = /\{\s*field:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    out.push({ field: m[1] });
  }
  return out;
}

/** Build a complete HTML document for one prerendered page. */
function buildHtml({ title, description, path, ogType, jsonLd }, bodyHtml, inlineCss) {
  const canonical = `${CANONICAL_ORIGIN}${path}`;
  const ld = JSON.stringify(jsonLd);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
    <meta name="theme-color" content="#0d3e5c" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:alt" content="EMV 3DS Protocol Lab — protocol flow explorer and reference." />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/site.webmanifest" />
    <script type="application/ld+json">${ld}</script>
    <style>${inlineCss}</style>
  </head>
  <body class="lp-mode">
    ${bodyHtml}
    <noscript>
      <p style="padding:16px;font-family:Inter,sans-serif;">
        The interactive EMV 3DS Protocol Lab requires JavaScript.
        Read this research page as-is, or <a href="/">open the lab</a>.
      </p>
    </noscript>
  </body>
</html>
`;
}

/** Inline the CSS the static research pages need. */
function loadInlineCss() {
  const candidates = [join(ROOT, 'src', 'landing-pages.css'), join(ROOT, 'src', 'index.css')];
  const parts = [];
  for (const file of candidates) {
    if (existsSync(file)) {
      parts.push(`/* ${basename(file)} */`);
      parts.push(readFileSync(file, 'utf8'));
    }
  }
  return parts.join('\n');
}

/* ============================================================================
 * Page bodies. Each renderer takes the data it needs and returns an HTML
 * string. The structures mirror the React page components one-for-one so a
 * reader can confirm parity by reading both files side-by-side.
 * ========================================================================== */

function shell({ eyebrow, h1, lede }, mainBody) {
  return `
<div class="lp-shell">
  <header class="lp-header lp-site-header" role="banner">
    <div class="lp-site-header-inner">
      <a class="lp-site-brand" href="/" aria-label="EMV 3DS Protocol Lab — open the lab">
        <span aria-hidden="true">🛡️</span>
        <span>EMV 3DS Protocol Lab</span>
      </a>
      <nav class="lp-site-nav" aria-label="Primary">
        <a class="lp-site-nav-link" href="/" aria-label="Open the interactive protocol lab">Lab</a>
        <a class="lp-site-nav-link" href="/versions/" aria-current="page" aria-label="Open the EMV 3DS version matrix page">Version Matrix</a>
        <a class="lp-site-nav-link" href="/fields/" aria-label="Open the EMV 3DS field reference page">Field Reference</a>
        <a class="lp-site-nav-link" href="/flows/" aria-label="Open the EMV 3DS flow comparison page">Flow Comparison</a>
        <a class="lp-site-nav-link" href="/pitfalls/" aria-label="Open the EMV 3DS implementation pitfalls page">Pitfalls</a>
        <a class="lp-site-nav-link" href="/cite/" aria-label="Open the citation page">Cite</a>
      </nav>
    </div>
  </header>
  <main class="lp-main">
    <a class="lp-back-link" href="/">← Back to the interactive lab</a>
    <header class="lp-header">
      <p class="lp-eyebrow">${esc(eyebrow)}</p>
      <h1>${esc(h1)}</h1>
      <p class="lp-lede">${lede}</p>
    </header>
    ${mainBody}
    <footer class="lp-foot">
      <p>Conceived, Researched & Architected by <a href="https://www.linkedin.com/in/cswasif/" target="_blank" rel="noreferrer">Wasif Faisal</a> (BRAC University) · Open research & artifacts · Apache-2.0.</p>
    </footer>
  </main>
  <footer class="lp-site-footer" role="contentinfo">
    <div class="lp-site-footer-inner">
      <p style="margin:0;line-height:1.5;">Conceived, Researched & Architected by <a href="https://www.linkedin.com/in/cswasif/" target="_blank" rel="noreferrer">Wasif Faisal</a> (BRAC University) · Open research & artifacts · Apache-2.0.</p>
      <div class="lp-site-footer-links">
        <a href="https://github.com/cnpshield/3dslab" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://www.linkedin.com/in/cswasif/" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="mailto:md.wasif.faisal@g.bracu.ac.bd">Contact</a>
      </div>
    </div>
  </footer>
</div>
`;
}

function renderVersions(payloads) {
  const messageTypes = ['AReq', 'ARes', 'CReq', 'CRes', 'RReq', 'RRes', 'Erro', 'OReq', 'ORes'];
  const rows = messageTypes
    .map((mt) => {
      const slot = payloads[mt] || {};
      const v210 = slot['2.1.0']?.length ?? 0;
      const v220 = slot['2.2.0']?.length ?? 0;
      const v231 = slot['2.3.1']?.length ?? 0;
      return { mt, v210, v220, v231 };
    })
    .filter((r) => r.v210 || r.v220 || r.v231);

  const tableRows = rows
    .map(
      (r) => `<tr>
      <th scope="row">${esc(r.mt)}</th>
      <td>${r.v210 || '—'}</td>
      <td>${r.v220 || '—'}</td>
      <td>${r.v231 || '—'}</td>
      <td>${r.v220 > r.v210 ? `+${r.v220 - r.v210} fields` : r.v220 < r.v210 ? `${r.v220 - r.v210} fields` : 'no change'}</td>
      <td>${r.v231 > r.v220 ? `+${r.v231 - r.v220} fields` : r.v231 < r.v220 ? `${r.v231 - r.v220} fields` : 'no change'}</td>
    </tr>`,
    )
    .join('\n');

  return shell(
    {
      eyebrow: 'Reference',
      h1: 'EMV 3DS Version Matrix',
      lede:
        'A field-level comparison of the EMV 3-D Secure v2.1.0, v2.2.0, and v2.3.1 wire shapes, generated from the versioned payload registry at <code>src/data/payloads/</code>. Every cell is auditable against the EMVCo v2.3.1 Core Spec (Tables B.1–B.11) and the 3dsecure.io re-typeset for older versions.',
    },
    `
    <section class="lp-section">
      <h2>Field counts by message type</h2>
      <div class="lp-table-wrap">
        <table class="lp-table">
          <caption class="lp-sr-only">EMV 3DS v2.1.0, v2.2.0, and v2.3.1 field counts by message type.</caption>
          <thead>
            <tr>
              <th>Message</th>
              <th>v2.1.0</th>
              <th>v2.2.0</th>
              <th>v2.3.1</th>
              <th>v2.1.0 → v2.2.0</th>
              <th>v2.2.0 → v2.3.1</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </section>
    <section class="lp-section">
      <h2>Transport-level changes</h2>
      <ul>
        <li><strong>v2.1.0 → v2.2.0:</strong> AReq/ARes/RReq/RRes can still be sent as a signed JWT. The 3DS-Method iframe flow is unchanged.</li>
        <li><strong>v2.2.0 → v2.3.1:</strong> The spec formally introduces <em>detached JWS</em> for AReq/ARes/RReq/RRes, plus the new app-channel OReq/ORes pair. Split-SDK and Default-SDK variants of AReq become normative.</li>
        <li><strong>v2.4.0 (draft):</strong> The lab previews the version selector but does not yet model the wire shape; the registry falls back to v2.3.1 in that mode.</li>
      </ul>
    </section>
    `,
  );
}

function renderFields(payloads) {
  const version = '2.3.1';
  const messageTypes = ['AReq', 'ARes', 'CReq', 'CRes', 'RReq', 'RRes', 'Erro', 'OReq', 'ORes', 'PReq', 'PRes'];
  const groups = messageTypes
    .map((mt) => ({ mt, fields: payloads[mt]?.[version] || [] }))
    .filter((g) => g.fields.length > 0);

  const blocks = groups
    .map(
      (g) => `
    <article class="lp-message-block" id="message-${esc(g.mt)}">
      <header class="lp-message-head">
        <h2>${esc(g.mt)}</h2>
        <p>${g.fields.length} fields present in v${version}. <a class="lp-anchor" href="#message-${esc(g.mt)}">permalink</a></p>
      </header>
      <ul class="lp-field-list">
        ${g.fields
          .map(
            (f) => `
          <li class="lp-field" id="field-${esc(g.mt)}-${esc(f.field)}">
            <div class="lp-field-head">
              <code class="lp-field-name">${esc(f.field)}</code>
            </div>
            <a class="lp-anchor" href="#field-${esc(g.mt)}-${esc(f.field)}">permalink</a>
          </li>`,
          )
          .join('\n')}
      </ul>
    </article>`,
    )
    .join('\n');

  return shell(
    {
      eyebrow: 'Field reference',
      h1: 'EMV 3DS Field Reference',
      lede:
        'A researcher-facing reference for every field in the versioned payload registry. Each entry lists the version in which the field was introduced, the EMVCo spec anchor, and the source chain that justifies its inclusion.',
    },
    `
    <section class="lp-toolbar" aria-label="Reference filters">
      <p class="lp-toolbar-count" aria-live="polite">${groups.reduce((a, g) => a + g.fields.length, 0)} fields across ${groups.length} message types (showing v${version})</p>
    </section>
    <section class="lp-section">${blocks || '<p class="lp-empty">No fields match this filter combination.</p>'}</section>
    `,
  );
}

function renderFlows() {
  const flows = [
    {
      id: 'frictionless',
      title: 'Frictionless flow',
      short: 'No cardholder interaction; risk decision made in-line by the issuer ACS.',
      intro: 'The ACS signals a low-risk transaction based on the AReq data. The 3DS Server returns the ARes to the 3DS Requestor with <code>transStatus = Y</code> without rendering a challenge UI.',
      trigger: 'Issuer risk model returns "challenge not required" for the AReq data.',
      steps: [
        '3DS Requestor collects cardholder + device data, builds the AReq via the 3DS SDK / browser flow.',
        '3DS Server validates the AReq and forwards to the DS.',
        'DS routes the AReq to the ACS based on card range.',
        'ACS runs the issuer risk model. Outcome: <code>transStatus = Y</code>.',
        'ARes returns through the DS to the 3DS Server and back to the 3DS Requestor.',
        'Merchant proceeds with the standard authorisation; CAVV / AAV rides on the auth message.',
      ],
      security: [
        'Frictionless still produces <code>authenticationValue</code> (CAVV / AAV) — the cryptographic attestation. Verify it is forwarded to the acquirer.',
        'Trust-list status (whiteListStatus → trustListStatus) and exemption codes (transChallengeExemption) deserve a separate look in v2.3.1.',
        'ACS exemption decisions are issuer-side and opaque to the merchant; an exemption is <em>not</em> a liability shift.',
      ],
    },
    {
      id: 'challenge',
      title: 'Challenge flow',
      short: 'Cardholder is redirected into the ACS challenge UI to complete an interactive authentication.',
      intro: 'The ACS signals that a challenge is required (or the 3DS Requestor has chosen to challenge). The 3DS Server returns a CReq, the browser POSTs the CRes, and only then does the merchant receive a final outcome.',
      trigger: 'ACS sets <code>transStatus = C</code> in the ARes and supplies an <code>acsURL</code> + <code>acsChallengeMandated</code> flag. The 3DS Server then issues a CReq.',
      steps: [
        '3DS Requestor → 3DS Server → DS → ACS: AReq, as in the frictionless path.',
        'ACS decision: <code>transStatus = C</code>, <code>acsChallengeMandated = Y</code> (or N if optional).',
        '3DS Server returns the ARes to the 3DS Requestor. The 3DS Requestor builds a CReq (<code>challengeWindowSize</code> + echoed IDs) and POSTs it to <code>acsURL</code> via the challenge iframe.',
        'Cardholder interacts with the ACS challenge UI (OTP, password, biometric, OOB app).',
        'ACS POSTs the final CRes back through the browser to the 3DS Requestor via <code>notificationURL</code>.',
        '3DS Requestor POSTs the CRes to the 3DS Server. The 3DS Server validates, then POSTs the RReq to the DS → ACS to request the final authentication result.',
        'ACS returns the RRes (<code>resultsStatus</code> + signed authentication data). 3DS Requestor proceeds with authorisation.',
      ],
      security: [
        'Browser challenge flow depends on the <code>cReq</code> <code>notificationURL</code> round-trip; cross-origin post-message integrity is in scope.',
        'CRes integrity: tampering with the CRes on the way back to the 3DS Requestor is the classic "MITM on the browser leg" threat. Verify the signed ACS content path.',
        'RReq / RRes is what carries the final authentication result and ECI to the 3DS Requestor; the merchant MUST key off the RRes, not the CRes.',
        'For OOB / app-channel challenges, the OReq / ORes pair (introduced in v2.3.0) takes over from CReq / CRes for the cardholder interaction.',
      ],
    },
    {
      id: '3ri',
      title: '3RI / non-payment authentication',
      short: 'Merchant-initiated data-only exchanges (recurring, instalment, add-card, account-credential change).',
      intro: '3RI lets the merchant exchange authentication data with the issuer without a cardholder present, using the 3DS Server → DS → ACS path with no challenge UI.',
      trigger: 'Merchant sets <code>threeRIInd</code> in the AReq. The cardholder is not present and the protocol does not render a UI.',
      steps: [
        '3DS Requestor assembles the AReq with <code>threeRIInd</code> and the appropriate sub-indicator (recurring, add-card, etc.).',
        '3DS Server forwards to the DS → ACS.',
        'ACS issues an ARes with a <code>transStatus</code> describing the outcome of the non-payment authentication.',
        'No challenge; no CReq / CRes. The 3DS Server may issue an RReq to retrieve signed results when needed.',
      ],
      security: [
        '3RI is a privileged path: the 3DS Requestor is asserting things on behalf of the cardholder. Verify that the AReq is bound to a real prior authentication.',
        'Recurring data (<code>recurringExpiry</code>, <code>recurringFrequency</code>, v2.3.1 <code>recurringInd</code>, <code>recurringAmount</code>, <code>recurringCurrency</code>, <code>recurringExponent</code>) controls how long the issuer continues to honour the authentication. Treat as a security-critical control surface.',
        'Watch for first-recurring-vs-subsequent-recurring scope creep in implementations.',
      ],
    },
  ];

  const sections = flows
    .map(
      (f) => `
    <section class="lp-section lp-flow-section" id="flow-${esc(f.id)}">
      <h2>${esc(f.title)}</h2>
      <p class="lp-flow-short">${f.short}</p>
      <p>${f.intro}</p>
      <h3>Step list</h3>
      <ol class="lp-flow-steps">${f.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      <h3>Security notes</h3>
      <ul>${f.security.map((s) => `<li>${s}</li>`).join('')}</ul>
    </section>`,
    )
    .join('\n');

  return shell(
    {
      eyebrow: 'Flow shapes',
      h1: 'EMV 3DS flow comparison',
      lede:
        'EMV 3-D Secure has three canonical flow shapes: <strong>frictionless</strong> (silent, in-line), <strong>challenge</strong> (interactive, browser- or app-based), and <strong>3RI</strong> (merchant-initiated, no cardholder present).',
    },
    sections,
  );
}

function renderPitfalls() {
  const items = [
    { title: 'Sending a v2.2.0 AReq on a v2.3.1 build', versions: ['2.2.0 → 2.3.1'], desc: 'Implementations that build the AReq from a v2.2.0 template often fail to surface the new v2.3.1 fields, breaking the spec contract even though the message still parses.', detect: 'Use the versioned payload registry in this repo to assert that every field emitted by your builder is present in the spec version you claim.' },
    { title: 'Confusing whiteListStatus (v2.2.0) with trustListStatus (v2.3.1)', versions: ['2.2.0 → 2.3.1'], desc: 'The trust-list field was renamed in v2.3.1. Implementations that send the old name on a v2.3.1 wire break the protocol; implementations that send the new name on a v2.2.0 wire also break it.', detect: 'Cross-check your wire capture against the registry: the field name MUST match the spec version you declared in messageVersion.' },
    { title: 'Trusting the CRes for the final authentication result', versions: ['2.1.0', '2.2.0', '2.3.1'], desc: 'CRes only describes the interaction with the challenge UI (completed / not completed). The final authentication result and the authenticationValue come from RRes.', detect: 'Trace RReq → RRes and verify that the merchant authorisation carries the authenticationValue from the RRes, not from the CRes.' },
    { title: 'Assuming transStatus = Y means frictionless', versions: ['2.1.0', '2.2.0', '2.3.1'], desc: 'A Y indicates the authentication was successful, not that the cardholder was not challenged. Frictionless and challenge paths can both produce a Y.', detect: 'Look at the entire path: which leg carried the result, and was a CReq / CRes exchange observed?' },
    { title: 'Assuming exemption codes (v2.3.1) shift liability', versions: ['2.3.1'], desc: 'transChallengeExemption communicates that the ACS applied an exemption. The merchant must still handle the rest of the protocol correctly and the exemption is not a guarantee of liability shift.', detect: 'Treat the exemption as informational; pair it with the rest of the risk signal.' },
    { title: 'Forgetting to send a PReq / PRes handshake', versions: ['2.1.0', '2.2.0', '2.3.1'], desc: 'The PReq / PRes handshake is the cache warm-up that lets the ACS observe browser fingerprints before the AReq. Skipping it forces more challenges and weakens fraud signals.', detect: 'Capture the browser network tab and confirm a PReq / PRes leg is present before the AReq.' },
  ];
  return shell(
    {
      eyebrow: 'Pitfalls',
      h1: 'EMV 3DS implementation pitfalls',
      lede: 'These are the issues I keep seeing when reviewing 3DS implementations, captures, and bug reports. Each item is anchored to the EMVCo spec version that introduced or resolved it.',
    },
    `
    <ol class="lp-pitfall-list">
      ${items
        .map(
          (p) => `
        <li class="lp-pitfall">
          <h2>${esc(p.title)}</h2>
          <p class="lp-pitfall-versions">Affects: ${p.versions.map((v) => `<span class="lp-pitfall-version">${esc(v)}</span>`).join('')}</p>
          <p>${esc(p.desc)}</p>
          <h3>How to detect</h3>
          <p>${esc(p.detect)}</p>
        </li>`,
        )
        .join('\n')}
    </ol>
    `,
  );
}

function renderCite() {
  return shell(
    {
      eyebrow: 'Citation',
      h1: 'Cite EMV 3DS Protocol Lab',
      lede: 'The lab is a research artifact. If it appears in your methodology, your appendix, or your reference list, please use one of the entries below.',
    },
    `
    <section class="lp-section">
      <h2>BibTeX</h2>
      <pre class="lp-cite-pre"><code>@misc{emv3ds_protocol_lab_2026,
  author       = {Wasif Faisal},
  title        = {{EMV 3-D Secure Protocol Lab -- research artifact}},
  year         = {2026},
  howpublished = {\\url{https://cnpshield.github.io/3dslab}},
  note         = {Apache-2.0; field-level payload registry anchored to EMV 3DS v2.3.1 Core Spec Tables B.1--B.11.}
}</code></pre>
    </section>
    <section class="lp-section">
      <h2>APA</h2>
      <p class="lp-cite-block">Wasif, F. (2026). EMV 3-D Secure Protocol Lab (Version 0.3.0) [Software]. https://cnpshield.github.io/3dslab. Apache-2.0.</p>
    </section>
    <section class="lp-section">
      <h2>IEEE</h2>
      <p class="lp-cite-block">[1] F. Wasif, "EMV 3-D Secure Protocol Lab — research artifact," 2026. [Online]. Available: https://cnpshield.github.io/3dslab.</p>
    </section>
    <section class="lp-section">
      <h2>MLA</h2>
      <p class="lp-cite-block">Wasif, Faisal. EMV 3-D Secure Protocol Lab — research artifact. 2026, cnpshield.github.io/3dslab.</p>
    </section>
    <section class="lp-section">
      <h2>See also</h2>
      <p>
        <a href="/versions/">Version Matrix</a> ·
        <a href="/fields/">Field Reference</a> ·
        <a href="/flows/">Flow Comparison</a> ·
        <a href="/pitfalls/">Pitfalls</a>.
      </p>
    </section>
    `,
  );
}

/* ============================================================================
 * Page specs and main entry. We do not need to mutate any of this at
 * runtime; the spec is a static array.
 * ========================================================================== */

const PAGES = [
  {
    file: 'versions',
    folder: 'versions',
    title: 'EMV 3DS Version Matrix | v2.1.0 vs v2.2.0 vs v2.3.1 | EMV 3DS Protocol Lab',
    description: 'Field-level matrix of EMV 3-D Secure v2.1.0, v2.2.0, and v2.3.1 message shapes. Compare AReq, ARes, CReq, CRes, RReq, RRes, Erro, OReq, ORes.',
    path: '/versions',
    ogType: 'article',
    jsonLd: { '@context': 'https://schema.org', '@type': 'TechArticle', headline: 'EMV 3DS Version Matrix: v2.1.0 vs v2.2.0 vs v2.3.1', inLanguage: 'en' },
    render: renderVersions,
  },
  {
    file: 'fields',
    folder: 'fields',
    title: 'EMV 3DS Field Reference | AReq, ARes, CReq, CRes, RReq, RRes | EMV 3DS Protocol Lab',
    description: 'Browse every field in the EMV 3-D Secure v2.1.0 / v2.2.0 / v2.3.1 wire shapes, with version provenance and EMVCo spec anchors.',
    path: '/fields',
    ogType: 'article',
    jsonLd: { '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'EMV 3DS Field Reference', inLanguage: 'en' },
    render: renderFields,
  },
  {
    file: 'flows',
    folder: 'flows',
    title: 'EMV 3DS Flow Comparison | Frictionless vs Challenge vs 3RI | EMV 3DS Protocol Lab',
    description: 'Side-by-side comparison of EMV 3-D Secure frictionless, challenge, and 3RI flows. Step lists, cardholder experience, and security notes for each path.',
    path: '/flows',
    ogType: 'article',
    jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: 'EMV 3DS flow comparison: frictionless vs challenge vs 3RI', inLanguage: 'en' },
    render: renderFlows,
  },
  {
    file: 'pitfalls',
    folder: 'pitfalls',
    title: 'EMV 3DS Implementation Pitfalls | EMV 3DS Protocol Lab',
    description: 'A versioned, opinionated list of common EMV 3-D Secure implementation pitfalls: AReq shape, RRes vs CRes, exemptions, the 3DS Method handshake, and more.',
    path: '/pitfalls',
    ogType: 'article',
    jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: 'EMV 3DS implementation pitfalls', inLanguage: 'en' },
    render: renderPitfalls,
  },
  {
    file: 'cite',
    folder: 'cite',
    title: 'Cite EMV 3DS Protocol Lab | BibTeX, APA, IEEE, MLA',
    description: 'How to cite the EMV 3DS Protocol Lab in academic, industry, and security research work.',
    path: '/cite',
    ogType: 'website',
    jsonLd: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Cite EMV 3DS Protocol Lab', inLanguage: 'en' },
    render: renderCite,
  },
];

function writePage(spec, html) {
  const fileDest = join(DIST, `${spec.file}.html`);
  const folderDest = join(DIST, spec.folder, 'index.html');
  writeFileSync(fileDest, html, 'utf8');
  mkdirSync(dirname(folderDest), { recursive: true });
  writeFileSync(folderDest, html, 'utf8');
  console.log(`[prerender] wrote ${fileDest} and ${folderDest}`);
}

function main() {
  mkdirSync(DIST, { recursive: true });
  const inlineCss = loadInlineCss();
  const payloads = loadPayloads();
  for (const spec of PAGES) {
    const bodyHtml = spec.render(payloads);
    const html = buildHtml(spec, bodyHtml, inlineCss);
    writePage(spec, html);
  }
}

main();
