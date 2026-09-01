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
      'The ACS completes the transaction on the AReq / ARes leg without moving into challenge. In a completed frictionless path there is no CReq / CRes and no RReq / RRes.',
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
      'EMV 3DS v2.3.1 Core Spec Table B.2 (ARes).',
    ],
  },
  {
    id: 'challenge',
    title: 'Challenge flow',
    short: 'Cardholder enters issuer-controlled challenge handling; browser and app channels use different transport for the same branch.',
    intro:
      'The ACS returns `transStatus = C` in the ARes to signal that cardholder interaction is required. Browser and app challenges share the same high-level branch, but the browser path sends a 3DS Server-built `CReq` through the cardholder browser to `acsURL`, while the app path uses the 3DS SDK / ACS channel and may involve multiple SDK challenge exchanges.',
    trigger:
      'ACS sets `transStatus = C` in the ARes and returns the challenge-start data needed for the 3DS Requestor Environment or 3DS SDK to continue challenge handling.',
    steps: [
      '3DS Requestor → 3DS Server → DS → ACS: AReq, as in the frictionless path.',
      'ACS returns `ARes` with `transStatus = C` plus the challenge-start data (`acsURL`, identifiers, rendering hints, and related fields).',
      'Browser challenge: the 3DS Server formats the `CReq` and the 3DS Requestor posts it through the browser to `acsURL`. App challenge: the 3DS SDK uses the ACS data to start SDK challenge handling and may exchange multiple `CReq` / `CRes` pairs.',
      'Cardholder interacts with the ACS challenge UI (OTP, password, biometric, OOB app).',
      'The challenge-side completion artifact is `CRes`: in the browser channel the ACS POSTs it to the requestor `notificationURL`, and in the app channel the SDK receives it from the ACS.',
      'ACS sends the authoritative final result in `RReq` through the DS to the 3DS Server. The 3DS Server replies with `RRes` only to acknowledge receipt.',
      'Merchant proceeds based on the authenticated result carried by the ARes / RReq branch and closes the browser or app UX accordingly; browser-visible `CRes` alone is not the issuer result.',
    ],
    whoInitiates: 'ACS — but the cardholder has to act before the protocol can continue.',
    typicalLatency: 'Seconds to minutes, depending on the challenge method and cardholder responsiveness.',
    cardholderExperience:
      'Cardholder sees the issuer challenge UI (OTP, password, OOB app prompt). The merchant page is paused behind the challenge iframe.',
    securityLens: [
      'Browser challenge flow depends on the CReq form POST and final notification round-trip; app challenge depends on the SDK-to-ACS secure channel and correct SDK transaction binding.',
      'CRes integrity matters because the browser leg is exposed to tampering on the way back to the 3DS Requestor. Verify the ACS-signed content path rather than trusting a browser-visible completion alone.',
      'The final challenge result is carried by `RReq`; `RRes` only acknowledges receipt. The merchant / 3DS Requestor must not treat `RRes` or browser-visible CRes as the issuer result itself.',
      'Once a transaction enters challenge, expect both the challenge leg (`CReq` / `CRes`) and the server-side results leg (`RReq` / `RRes`). A completed frictionless path has neither.',
      'OOB and app-based challenges still use the challenge/result path (`CReq` / `CRes`, then `RReq` / `RRes`). `OReq` / `ORes` are separate operational messages and are not part of the authentication flow.',
    ],
    citations: [
      'EMV 3DS v2.3.1 Core Spec §3.1.2.5 (Browser challenge) and §4.2 (App challenge with split SDK).',
      'EMV 3DS v2.3.1 Core Spec Table B.3 (CReq), B.4 / B.5 (CRes), B.8 (RReq), B.9 (RRes).',
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
      'No challenge; no CReq / CRes. If the ACS later sends completion data, it does so in an `RReq` through the DS, and the 3DS Server answers with `RRes`.',
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
            Protocol Modeling & Flow Architecture by{' '}
            <a
              href="https://www.linkedin.com/in/cswasif/"
              target="_blank"
              rel="noreferrer"
              style={{ fontWeight: 700, color: 'var(--accent-primary)', textDecoration: 'underline' }}
            >
              Wasif Faisal
            </a>{' '}
            (BRAC University). All flow descriptions paraphrase the public EMV 3-D Secure Core
            Spec; no normative prose is reproduced verbatim. For the interactive sequence diagram, see the{' '}
            <a href="/">lab canvas</a>.
          </p>
        </footer>
      </main>
    </>
  );
}
