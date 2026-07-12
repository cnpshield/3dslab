/**
 * Flow Comparison page.
 *
 * Static, indexable explainer of the three canonical EMV 3-D Secure
 * flow shapes — frictionless, challenge, and 3RI (non-payment) — and
 * a side-by-side explanation of when each path is taken.
 *
 * This page is one of the highest-intent "challenge flow vs
 * frictionless flow" surfaces for engineers and researchers.
 */

import { Seo } from '../components/Seo';

interface Flow {
  id: 'frictionless' | 'challenge' | '3ri';
  title: string;
  short: string;
  intro: string;
  trigger: string;
  steps: string[];
  whoInitiates: string;
  typicalLatency: string;
  cardholderExperience: string;
  securityLens: string[];
  citations: string[];
}

const FLOWS: Flow[] = [
  {
    id: 'frictionless',
    title: 'Frictionless flow',
    short: 'No cardholder interaction; risk decision made in-line by the issuer ACS.',
    intro:
      'The ACS signals a low-risk transaction based on the AReq data. The 3DS Server returns the ARes to the 3DS Requestor with `transStatus = Y` without rendering a challenge UI.',
    trigger: 'Issuer risk model returns "challenge not required" for the AReq data.',
    steps: [
      '3DS Requestor collects cardholder + device data, builds the AReq via the 3DS SDK / browser flow.',
      '3DS Server validates the AReq and forwards to the DS.',
      'DS routes the AReq to the ACS based on card range.',
      'ACS runs the issuer risk model. Outcome: `transStatus = Y`.',
      'ARes returns through the DS to the 3DS Server and back to the 3DS Requestor.',
      'Merchant proceeds with the standard authorisation; CAVV / AAV rides on the auth message.',
    ],
    whoInitiates: 'ACS — silent, in milliseconds.',
    typicalLatency: '< 2 seconds end-to-end for the protocol leg.',
    cardholderExperience: 'Transparent. The cardholder sees the merchant checkout page continue normally.',
    securityLens: [
      'Frictionless still produces `authenticationValue` (CAVV / AAV) — the cryptographic attestation. Verify it is forwarded to the acquirer.',
      'Trust-list status (whiteListStatus → trustListStatus) and exemption codes (transChallengeExemption) deserve a separate look in v2.3.1.',
      'ACS exemption decisions are issuer-side and opaque to the merchant; an exemption is *not* a liability shift.',
    ],
    citations: [
      'EMV 3DS v2.3.1 Core Spec §3.1 (Browser flow) and §4.1 (App flow).',
      'EMV 3DS v2.3.1 Core Spec Table B.2 (ARes), B.8 (RReq), B.9 (RRes).',
    ],
  },
  {
    id: 'challenge',
    title: 'Challenge flow',
    short: 'Cardholder is redirected into the ACS challenge UI to complete an interactive authentication.',
    intro:
      'The ACS signals that a challenge is required (or the 3DS Requestor has chosen to challenge). The 3DS Server returns a CReq, the browser POSTs the CRes, and only then does the merchant receive a final outcome.',
    trigger:
      'ACS sets `transStatus = C` in the ARes and supplies an `acsURL` + `acsChallengeMandated` flag. The 3DS Server then issues a CReq.',
    steps: [
      '3DS Requestor → 3DS Server → DS → ACS: AReq, as in the frictionless path.',
      'ACS decision: `transStatus = C`, `acsChallengeMandated = Y` (or N if optional).',
      '3DS Server returns the ARes to the 3DS Requestor. The 3DS Requestor builds a CReq (`challengeWindowSize` + echoed IDs) and POSTs it to `acsURL` via the challenge iframe.',
      'Cardholder interacts with the ACS challenge UI (OTP, password, biometric, OOB app).',
      'ACS POSTs the final CRes back through the browser to the 3DS Requestor via `notificationURL`.',
      '3DS Requestor POSTs the CRes to the 3DS Server. The 3DS Server validates, then POSTs the RReq to the DS → ACS to request the final authentication result.',
      'ACS returns the RRes (`resultsStatus` + signed authentication data). 3DS Requestor proceeds with authorisation.',
    ],
    whoInitiates: 'ACS — but the cardholder has to act before the protocol can continue.',
    typicalLatency: 'Seconds to minutes, depending on the challenge method and cardholder responsiveness.',
    cardholderExperience:
      'Cardholder sees the issuer challenge UI (OTP, password, OOB app prompt). The merchant page is paused behind the challenge iframe.',
    securityLens: [
      'Browser challenge flow depends on the `cReq` `notificationURL` round-trip; cross-origin post-message integrity is in scope.',
      'CRes integrity: tampering with the CRes on the way back to the 3DS Requestor is the classic "MITM on the browser leg" threat. Verify the signed ACS content path.',
      'RReq / RRes is what carries the final authentication result and ECI to the 3DS Requestor; the merchant MUST key off the RRes, not the CRes.',
      'For OOB / app-channel challenges, the OReq / ORes pair (introduced in v2.3.0) takes over from CReq / CRes for the cardholder interaction.',
    ],
    citations: [
      'EMV 3DS v2.3.1 Core Spec §3.1.2.5 (Browser challenge) and §4.2 (App challenge with split SDK).',
      'EMV 3DS v2.3.1 Core Spec Table B.3 (CReq), B.4 / B.5 (CRes), B.8 (RReq), B.10 (OReq), B.11 (ORes).',
    ],
  },
  {
    id: '3ri',
    title: '3RI / non-payment authentication',
    short: 'Merchant-initiated data-only exchanges (recurring, instalment, add-card, account-credential change).',
    intro:
      '3RI lets the merchant exchange authentication data with the issuer without a cardholder present, using the 3DS Server → DS → ACS path with no challenge UI.',
    trigger: 'Merchant sets `threeRIInd` in the AReq. The cardholder is not present and the protocol does not render a UI.',
    steps: [
      '3DS Requestor assembles the AReq with `threeRIInd` and the appropriate sub-indicator (recurring, add-card, etc.).',
      '3DS Server forwards to the DS → ACS.',
      'ACS issues an ARes with a `transStatus` describing the outcome of the non-payment authentication.',
      'No challenge; no CReq / CRes. The 3DS Server may issue an RReq to retrieve signed results when needed.',
    ],
    whoInitiates: 'Merchant / 3DS Requestor.',
    typicalLatency: '< 1 second per round-trip; no human-in-the-loop.',
    cardholderExperience: 'Silent. There is no cardholder-visible interaction.',
    securityLens: [
      '3RI is a privileged path: the 3DS Requestor is asserting things on behalf of the cardholder. Verify that the AReq is bound to a real prior authentication (`threeDSRequestorPriorAuthenticationInfo` / `threeDSRequestorAuthenticationInfo`).',
      'Recurring data (`recurringExpiry`, `recurringFrequency`, v2.3.1 `recurringInd`, `recurringAmount`, `recurringCurrency`, `recurringExponent`) controls how long the issuer continues to honour the authentication. Treat as a security-critical control surface.',
      'Watch for first-recurring-vs-subsequent-recurring scope creep in implementations.',
    ],
    citations: [
      'EMV 3DS v2.3.1 Core Spec §3.1.4 (3RI flow) and Table B.1 `threeRIInd` / `messageCategory`.',
      'EMV 3DS v2.3.1 Core Spec Table B.8 (RReq), B.9 (RRes).',
    ],
  },
];

export function FlowsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'EMV 3DS flow comparison: frictionless vs challenge vs 3RI',
    description:
      'Side-by-side comparison of the EMV 3-D Secure frictionless, challenge, and 3RI flows, with step lists, security notes, and EMVCo spec anchors.',
    inLanguage: 'en',
    author: { '@id': 'https://cnpshield.github.io/3dslab/#author' },
    publisher: { '@id': 'https://cnpshield.github.io/3dslab/#website' },
    about: ['EMV 3DS', 'frictionless flow', 'challenge flow', '3RI'],
    keywords: 'EMV 3DS challenge flow, frictionless flow, 3RI flow, AReq, CReq, RReq',
  };

  return (
    <>
      <Seo
        title="EMV 3DS Flow Comparison | Frictionless vs Challenge vs 3RI | EMV 3DS Protocol Lab"
        description="Side-by-side comparison of EMV 3-D Secure frictionless, challenge, and 3RI flows. Step lists, cardholder experience, and security notes for each path."
        path="/flows"
        ogType="article"
        jsonLd={jsonLd}
      />
      <main className="lp-main">
        <a className="lp-back-link" href="/">← Back to the interactive lab</a>
        <header className="lp-header">
          <p className="lp-eyebrow">Flow shapes</p>
          <h1>EMV 3DS flow comparison</h1>
          <p className="lp-lede">
            EMV 3-D Secure has three canonical flow shapes: <strong>frictionless</strong> (silent, in-line),{' '}
            <strong>challenge</strong> (interactive, browser- or app-based), and <strong>3RI</strong>{' '}
            (merchant-initiated, no cardholder present). This page walks through when each path is taken, what the
            cardholder experiences, and where the security-relevant controls live.
          </p>
        </header>

        <nav aria-label="Flow navigation" className="lp-flow-nav">
          {FLOWS.map((f) => (
            <a key={f.id} href={`#flow-${f.id}`}>
              {f.title}
            </a>
          ))}
        </nav>

        {FLOWS.map((f) => (
          <section key={f.id} id={`flow-${f.id}`} className="lp-section lp-flow-section">
            <h2>{f.title}</h2>
            <p className="lp-flow-short">{f.short}</p>
            <p>{f.intro}</p>

            <dl className="lp-flow-facts">
              <div>
                <dt>Trigger</dt>
                <dd>{f.trigger}</dd>
              </div>
              <div>
                <dt>Who initiates</dt>
                <dd>{f.whoInitiates}</dd>
              </div>
              <div>
                <dt>Typical latency</dt>
                <dd>{f.typicalLatency}</dd>
              </div>
              <div>
                <dt>Cardholder experience</dt>
                <dd>{f.cardholderExperience}</dd>
              </div>
            </dl>

            <h3>Step list</h3>
            <ol className="lp-flow-steps">
              {f.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>

            <h3>Security notes</h3>
            <ul>
              {f.securityLens.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>

            <h3>Spec anchors</h3>
            <ul>
              {f.citations.map((c, i) => (
                <li key={i}>
                  <code>{c}</code>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <footer className="lp-foot">
          <p>
            Author: Wasif Faisal, BRAC University. All flow descriptions paraphrase the public EMV 3-D Secure Core
            Spec; no normative prose is reproduced verbatim. For the interactive sequence diagram, see the{' '}
            <a href="/">lab canvas</a>.
          </p>
        </footer>
      </main>
    </>
  );
}
