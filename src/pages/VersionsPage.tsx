/**
 * EMV 3DS Version Matrix page.
 *
 * Static, indexable landing page that lists the field-level changes
 * between EMV 3DS v2.1.0, v2.2.0, and v2.3.1, derived from the
 * in-repo versioned payload registry. This page is one of the highest
 * search-intent surfaces for "EMV 3DS version comparison" queries
 * from engineers and researchers.
 *
 * No normative EMVCo prose is paraphrased. Field *names* and counts
 * are part of the protocol's wire format and are not copyrightable
 * expression. The prose is researcher-facing commentary on what the
 * field list means.
 */

import { Seo } from '../components/Seo';
import { PAYLOADS, type MessageType } from '../data/payloads';
import type { FieldProvenance, SupportedPayloadVersion } from '../data/payloads/types';

const SUPPORTED_VERSIONS: SupportedPayloadVersion[] = ['2.1.0', '2.2.0', '2.3.1'];

/** A list of message types the registry actually models, in display order. */
const MESSAGE_TYPES: MessageType[] = ['AReq', 'ARes', 'CReq', 'CRes', 'RReq', 'RRes', 'Erro', 'OReq', 'ORes'];

interface Row {
  messageType: MessageType;
  v210: number;
  v220: number;
  v231: number;
  /** v2.1.0 → v2.2.0 field-level delta. */
  v220Delta: string;
  /** v2.2.0 → v2.3.1 field-level delta. */
  v231Delta: string;
}

function buildRows(): Row[] {
  return MESSAGE_TYPES
    .map((messageType) => {
      const slot = PAYLOADS[messageType];
      const v210 = slot['2.1.0']?.fields.length ?? 0;
      const v220 = slot['2.2.0']?.fields.length ?? 0;
      const v231 = slot['2.3.1']?.fields.length ?? 0;
      const v220Delta =
        v220 && v210 ? (v220 > v210 ? `+${v220 - v210} fields` : v220 < v210 ? `${v220 - v210} fields` : 'no change') : 'n/a';
      const v231Delta =
        v231 && v220 ? (v231 > v220 ? `+${v231 - v220} fields` : v231 < v220 ? `${v231 - v220} fields` : 'no change') : 'n/a';
      return { messageType, v210, v220, v231, v220Delta, v231Delta };
    })
    .filter((row) => row.v210 || row.v220 || row.v231);
}

function fieldSince(field: FieldProvenance, version: SupportedPayloadVersion): boolean {
  return field.sinceVersion === version;
}

function RenameSummary({ fields }: { fields: readonly FieldProvenance[] }) {
  const renames = fields.filter((f) => f.renamedFrom || f.renamedTo);
  if (renames.length === 0) return <p className="versions-empty">No field renames in this message.</p>;
  return (
    <ul className="versions-rename-list">
      {renames.map((f) => (
        <li key={f.field}>
          <code>{f.renamedFrom ?? f.field}</code>
          <span aria-hidden="true"> → </span>
          <code>{f.renamedTo ?? f.field}</code>
          {f.renamedTo ? <span className="versions-rename-when"> (effective from v{f.sinceVersion})</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function VersionsPage() {
  const rows = buildRows();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'EMV 3DS Version Matrix: v2.1.0 vs v2.2.0 vs v2.3.1',
    description:
      'Field-level matrix of EMV 3-D Secure v2.1.0, v2.2.0, and v2.3.1 message shapes, derived from a versioned payload registry with field-level provenance.',
    inLanguage: 'en',
    author: { '@id': 'https://cnpshield.github.io/3dslab/#author' },
    publisher: { '@id': 'https://cnpshield.github.io/3dslab/#website' },
    about: ['EMV 3DS', 'EMV 3-D Secure', 'protocol analysis', 'payment security'],
    keywords: 'EMV 3DS version matrix, AReq, ARes, CReq, CRes, RReq, RRes, 2.1.0, 2.2.0, 2.3.1',
  };

  return (
    <>
      <Seo
        title="EMV 3DS Version Matrix | v2.1.0 vs v2.2.0 vs v2.3.1 | EMV 3DS Protocol Lab"
        description="Field-level matrix of EMV 3-D Secure v2.1.0, v2.2.0, and v2.3.1 message shapes. Compare AReq, ARes, CReq, CRes, RReq, RRes, Erro, OReq, ORes."
        path="/versions"
        ogType="article"
        jsonLd={jsonLd}
      />
      <main className="lp-main">
        <a className="lp-back-link" href="/">← Back to the interactive lab</a>
        <header className="lp-header">
          <p className="lp-eyebrow">Reference</p>
          <h1>EMV 3DS Version Matrix</h1>
          <p className="lp-lede">
            A field-level comparison of the EMV 3-D Secure v2.1.0, v2.2.0, and v2.3.1 wire shapes, generated from the
            versioned payload registry at <code>src/data/payloads/</code>. Every cell is auditable against the EMVCo
            v2.3.1 Core Spec (Tables B.1–B.11) and the 3dsecure.io re-typeset for older versions.
          </p>
        </header>

        <section aria-labelledby="matrix-table" className="lp-section">
          <h2 id="matrix-table">Field counts by message type</h2>
          <div className="lp-table-wrap">
            <table className="lp-table">
              <caption className="lp-sr-only">
                EMV 3DS v2.1.0, v2.2.0, and v2.3.1 field counts by message type.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Message</th>
                  <th scope="col">v2.1.0</th>
                  <th scope="col">v2.2.0</th>
                  <th scope="col">v2.3.1</th>
                  <th scope="col">v2.1.0 → v2.2.0</th>
                  <th scope="col">v2.2.0 → v2.3.1</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.messageType}>
                    <th scope="row">{row.messageType}</th>
                    <td>{row.v210 || '—'}</td>
                    <td>{row.v220 || '—'}</td>
                    <td>{row.v231 || '—'}</td>
                    <td>{row.v220Delta}</td>
                    <td>{row.v231Delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="renames" className="lp-section">
          <h2 id="renames">Field renames</h2>
          <p>
            Renames are tracked per field via <code>renamedFrom</code> / <code>renamedTo</code> in the registry. The
            wire on v2.2.0 still carries the old name; from v2.3.1 onward the new name is mandatory.
          </p>
          <div className="lp-rename-grid">
            {rows.map((row) => {
              const slot = PAYLOADS[row.messageType];
              const fields = slot['2.3.1']?.fields ?? slot['2.2.0']?.fields ?? slot['2.1.0']?.fields ?? [];
              return (
                <article key={row.messageType} className="lp-rename-card">
                  <h3>{row.messageType}</h3>
                  <RenameSummary fields={fields} />
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="transport" className="lp-section">
          <h2 id="transport">Transport-level changes</h2>
          <ul>
            <li>
              <strong>v2.1.0 → v2.2.0:</strong> AReq/ARes/RReq/RRes can still be sent as a signed JWT. The
              3DS-Method iframe flow is unchanged.
            </li>
            <li>
              <strong>v2.2.0 → v2.3.1:</strong> The spec formally introduces <em>detached JWS</em> for AReq/ARes/RReq/RRes,
              plus the new OReq/ORes operation-message pair. Split-SDK and Default-SDK variants of AReq become normative.
            </li>
            <li>
              <strong>v2.4.0 (draft):</strong> The lab previews the version selector but does not yet model the
              wire shape; the registry falls back to v2.3.1 in that mode.
            </li>
          </ul>
        </section>

        <section aria-labelledby="v210-additions" className="lp-section">
          <h2 id="v210-additions">Fields added in each version</h2>
          <div className="lp-version-blocks">
            {SUPPORTED_VERSIONS.slice(1).map((v) => {
              const added = rows
                .map((row) => {
                  const fields = PAYLOADS[row.messageType][v]?.fields ?? [];
                  const newFields = fields.filter((f) => fieldSince(f, v));
                  return { messageType: row.messageType, fields: newFields };
                })
                .filter((b) => b.fields.length > 0);
              return (
                <article key={v} className="lp-version-card">
                  <h3>Added in v{v}</h3>
                  {added.length === 0 ? (
                    <p className="versions-empty">No new fields in this release.</p>
                  ) : (
                    added.map((b) => (
                      <div key={b.messageType} className="lp-version-message">
                        <h4>{b.messageType}</h4>
                        <ul>
                          {b.fields.map((f) => (
                            <li key={f.field}>
                              <code>{f.field}</code>
                              <span className="lp-version-ref"> — {f.emvcoRef}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <footer className="lp-foot">
          <p>
            Protocol Research & Specification Analysis by{' '}
            <a
              href="https://www.linkedin.com/in/cswasif/"
              target="_blank"
              rel="noreferrer"
              style={{ fontWeight: 700, color: 'var(--accent-primary)', textDecoration: 'underline' }}
            >
              Wasif Faisal
            </a>{' '}
            (BRAC University). Wire-shape data is derived from the versioned payload registry in
            this repository; v2.3.1 is anchored to Tables B.1–B.11 of the EMV 3DS v2.3.1 Core Spec. v2.1.0 and v2.2.0
            data is sourced from the 3dsecure.io re-typeset and is labelled non-authoritative in the lab UI.
          </p>
        </footer>
      </main>
    </>
  );
}
