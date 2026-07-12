/**
 * Implementation Pitfalls page.
 *
 * A pragmatic, opinionated list of implementation pitfalls, with each
 * item anchored to the EMV 3-D Secure version that introduced or
 * resolved it. This page is one of the highest-leverage research
 * surfaces for "EMV 3DS bugs" and "3DS implementation mistakes"
 * queries.
 */

import { Seo } from '../components/Seo';

interface Pitfall {
  title: string;
  versionsAffected: string[];
  description: string;
  detection: string;
  references: string[];
}

const PITFALLS: Pitfall[] = [
  {
    title: 'Sending a v2.2.0 AReq on a v2.3.1 build',
    versionsAffected: ['2.2.0 → 2.3.1'],
    description:
      'Implementations that build the AReq from a v2.2.0 template often fail to surface the new v2.3.1 fields, breaking the spec contract even though the message still parses.',
    detection:
      'Use the versioned payload registry in this repo to assert that every field emitted by your builder is present in the spec version you claim.',
    references: ['EMV 3DS v2.3.1 Core Spec Table B.1 (29 additions, 2 renames, 1 removal vs. v2.2.0).'],
  },
  {
    title: 'Confusing `whiteListStatus` (v2.2.0) with `trustListStatus` (v2.3.1)',
    versionsAffected: ['2.2.0 → 2.3.1'],
    description:
      'The trust-list field was renamed in v2.3.1. Implementations that send the old name on a v2.3.1 wire break the protocol; implementations that send the new name on a v2.2.0 wire also break it.',
    detection:
      'Cross-check your wire capture against the registry: the field name MUST match the spec version you declared in `messageVersion`.',
    references: ['EMV 3DS v2.3.1 Core Spec Table B.1; renamedFrom / renamedTo in this repo’s registry.'],
  },
  {
    title: 'Trusting the CRes for the final authentication result',
    versionsAffected: ['2.1.0', '2.2.0', '2.3.1'],
    description:
      'CRes only describes the *interaction* with the challenge UI (completed / not completed). The final authentication result and the `authenticationValue` come from RRes.',
    detection:
      'Trace RReq → RRes and verify that the merchant authorisation carries the `authenticationValue` from the RRes, not from the CRes.',
    references: ['EMV 3DS v2.3.1 Core Spec §3.1.2.5, Table B.8 (RReq), B.9 (RRes).'],
  },
  {
    title: 'Treating `transStatus = Y` as proof of frictionless authentication',
    versionsAffected: ['2.1.0', '2.2.0', '2.3.1'],
    description:
      'A `Y` indicates the authentication was successful, not that the cardholder was not challenged. Frictionless and challenge paths can both produce a `Y`.',
    detection: 'Look at the entire path: which leg carried the result, and was a CReq / CRes exchange observed?',
    references: ['EMV 3DS v2.3.1 Core Spec Table B.2 (ARes), B.4 / B.5 (CRes).'],
  },
  {
    title: 'Assuming exemption codes (v2.3.1) shift liability',
    versionsAffected: ['2.3.1'],
    description:
      '`transChallengeExemption` communicates that the ACS applied an exemption. The merchant must still handle the rest of the protocol correctly and the exemption is not a guarantee of liability shift.',
    detection: 'Treat the exemption as informational; pair it with the rest of the risk signal.',
    references: ['EMV 3DS v2.3.1 Core Spec Table B.2, regulatory guidance from the card networks.'],
  },
  {
    title: 'Forgetting to send a PReq / PRes handshake (browser flow)',
    versionsAffected: ['2.1.0', '2.2.0', '2.3.1'],
    description:
      'The PReq / PRes handshake is the cache warm-up that lets the ACS observe browser fingerprints before the AReq. Skipping it forces more challenges and weakens fraud signals.',
    detection: 'Capture the browser network tab and confirm a PReq / PRes leg is present before the AReq.',
    references: ['EMV 3DS v2.3.1 Core Spec §3.1.1 (3DS Method); the lab models this as the `preauth` step group.'],
  },
  {
    title: 'Forwarding `browserJavaEnabled` as a modern fingerprint signal',
    versionsAffected: ['2.1.0', '2.2.0', '2.3.1'],
    description:
      '`browserJavaEnabled` is mostly informational for modern browsers. The v2.2.0 spec added `browserJavascriptEnabled` as the operative signal.',
    detection: 'Confirm both fields are present in the AReq and that downstream logic does not treat Java as a hard risk gate.',
    references: ['EMV 3DS v2.3.1 Core Spec Table B.1; this repo’s AReq_FIELDS.'],
  },
  {
    title: 'Omitting `threeDSMethodId` on retry after a 3DS Method execution',
    versionsAffected: ['2.3.1'],
    description:
      'When the 3DS Method iframe executed, the AReq should carry the `threeDSMethodId` (3DSS transaction ID from the prior Method call) so the ACS can correlate to the right fingerprint.',
    detection: 'Capture both the 3DS Method URL and the subsequent AReq; verify the ID round-trips correctly.',
    references: ['EMV 3DS v2.3.1 Core Spec Table B.1, §3.1.1.'],
  },
];

export function PitfallsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'EMV 3DS implementation pitfalls',
    description:
      'A pragmatic, versioned list of EMV 3-D Secure implementation pitfalls, with detection strategies and EMVCo spec anchors.',
    inLanguage: 'en',
    author: { '@id': 'https://cnpshield.github.io/3dslab/#author' },
    publisher: { '@id': 'https://cnpshield.github.io/3dslab/#website' },
    about: ['EMV 3DS', 'implementation pitfalls', 'payment security', 'protocol analysis'],
  };

  return (
    <>
      <Seo
        title="EMV 3DS Implementation Pitfalls | EMV 3DS Protocol Lab"
        description="A versioned, opinionated list of common EMV 3-D Secure implementation pitfalls: AReq shape, RRes vs CRes, exemptions, the 3DS Method handshake, and more."
        path="/pitfalls"
        ogType="article"
        jsonLd={jsonLd}
      />
      <main className="lp-main">
        <a className="lp-back-link" href="/">← Back to the interactive lab</a>
        <header className="lp-header">
          <p className="lp-eyebrow">Pitfalls</p>
          <h1>EMV 3DS implementation pitfalls</h1>
          <p className="lp-lede">
            These are the issues I keep seeing when reviewing 3DS implementations, captures, and bug reports. Each
            item is anchored to the EMVCo spec version that introduced or resolved it.
          </p>
        </header>

        <ol className="lp-pitfall-list">
          {PITFALLS.map((p, i) => (
            <li key={i} className="lp-pitfall">
              <h2>{p.title}</h2>
              <p className="lp-pitfall-versions">
                Affects: {p.versionsAffected.map((v) => <span key={v} className="lp-pitfall-version">{v}</span>)}
              </p>
              <p>{p.description}</p>
              <h3>How to detect</h3>
              <p>{p.detection}</p>
              <h3>Spec anchors</h3>
              <ul>
                {p.references.map((r, j) => (
                  <li key={j}>
                    <code>{r}</code>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <footer className="lp-foot">
          <p>
            Author: Wasif Faisal, BRAC University. The pitfalls list is maintained alongside the versioned payload
            registry. If you spot a new failure mode, file a finding via the GitHub issue templates.
          </p>
        </footer>
      </main>
    </>
  );
}
