/**
 * Field Reference page.
 *
 * A browseable, indexable reference for every field in the versioned
 * payload registry. Researchers can scan fields by message type, see
 * the version in which each field was introduced, and follow the spec
 * anchor (Table B.1, B.2, …) to the EMVCo 3DS Core Specification.
 *
 * All data comes from `FIELD_PROVENANCE` so the page stays in lockstep
 * with the lab's payload builders.
 */

import { useMemo, useState } from 'react';
import { Seo } from '../components/Seo';
import { FIELD_PROVENANCE } from '../data/payloads/meta/fieldProvenance';
import type { FieldProvenance, MessageType, SupportedPayloadVersion } from '../data/payloads/types';

const VERSION_OPTIONS: SupportedPayloadVersion[] = ['2.1.0', '2.2.0', '2.3.1'];

const MESSAGE_TYPE_ORDER: MessageType[] = ['AReq', 'ARes', 'CReq', 'CRes', 'RReq', 'RRes', 'Erro', 'OReq', 'ORes', 'PReq', 'PRes'];

function isPresentInVersion(field: FieldProvenance, version: SupportedPayloadVersion): boolean {
  const targetRank = { '2.1.0': 1, '2.2.0': 2, '2.3.1': 3 }[version];
  const sinceRank = { '2.1.0': 1, '2.2.0': 2, '2.3.1': 3 }[field.sinceVersion];
  if (targetRank < sinceRank) return false;
  if (field.untilVersion) {
    const untilRank = { '2.1.0': 1, '2.2.0': 2, '2.3.1': 3 }[field.untilVersion];
    if (targetRank > untilRank) return false;
  }
  return true;
}

export function FieldsPage() {
  const [version, setVersion] = useState<SupportedPayloadVersion>('2.3.1');
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MESSAGE_TYPE_ORDER
      .map((messageType) => {
        const fields = (FIELD_PROVENANCE[messageType] ?? []).filter((f) => isPresentInVersion(f, version));
        const filtered = q ? fields.filter((f) => f.field.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)) : fields;
        return { messageType, fields: filtered };
      })
      .filter((g) => g.fields.length > 0);
  }, [version, query]);

  const totalFields = grouped.reduce((acc, g) => acc + g.fields.length, 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'EMV 3DS Field Reference',
    description: 'Field-level reference for EMV 3-D Secure messages, indexed by message type and protocol version.',
    inLanguage: 'en',
    author: { '@id': 'https://cnpshield.github.io/3dslab/#author' },
    publisher: { '@id': 'https://cnpshield.github.io/3dslab/#website' },
    hasDefinedTerm: grouped.flatMap((g) =>
      g.fields.map((f) => ({
        '@type': 'Property',
        name: f.field,
        description: f.description,
        inDefinedTermSet: g.messageType,
        version: version,
        source: f.emvcoRef,
      })),
    ),
  };

  return (
    <>
      <Seo
        title="EMV 3DS Field Reference | AReq, ARes, CReq, CRes, RReq, RRes | EMV 3DS Protocol Lab"
        description="Browse every field in the EMV 3-D Secure v2.1.0 / v2.2.0 / v2.3.1 wire shapes, with version provenance and EMVCo spec anchors."
        path="/fields"
        ogType="article"
        jsonLd={jsonLd}
      />
      <main className="lp-main">
        <a className="lp-back-link" href="/">← Back to the interactive lab</a>
        <header className="lp-header">
          <p className="lp-eyebrow">Field reference</p>
          <h1>EMV 3DS Field Reference</h1>
          <p className="lp-lede">
            A researcher-facing reference for every field in the versioned payload registry. Each entry lists the
            version in which the field was introduced, the EMVCo spec anchor, and the source chain that justifies its
            inclusion.
          </p>
        </header>

        <section className="lp-toolbar" aria-label="Reference filters">
          <label className="lp-toolbar-field">
            <span>Protocol version</span>
            <select value={version} onChange={(e) => setVersion(e.target.value as SupportedPayloadVersion)}>
              {VERSION_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  v{v}
                </option>
              ))}
            </select>
          </label>
          <label className="lp-toolbar-field">
            <span>Search</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. whiteListStatus, browserJavascriptEnabled"
              aria-label="Filter fields by name or description"
            />
          </label>
          <p className="lp-toolbar-count" aria-live="polite">
            {totalFields} fields across {grouped.length} message types
          </p>
        </section>

        <section className="lp-section" aria-label="Fields by message type">
          {grouped.length === 0 ? (
            <p className="lp-empty">No fields match this filter combination.</p>
          ) : (
            grouped.map((g) => (
              <article key={g.messageType} className="lp-message-block" id={`message-${g.messageType}`}>
                <header className="lp-message-head">
                  <h2>{g.messageType}</h2>
                  <p>
                    {g.fields.length} fields present in v{version}.{' '}
                    <a className="lp-anchor" href={`#message-${g.messageType}`}>
                      permalink
                    </a>
                  </p>
                </header>
                <ul className="lp-field-list">
                  {g.fields.map((f) => (
                    <li key={f.field} className="lp-field" id={`field-${g.messageType}-${f.field}`}>
                      <div className="lp-field-head">
                        <code className="lp-field-name">{f.field}</code>
                        <span className="lp-field-since">since v{f.sinceVersion}</span>
                        {f.renamedFrom ? <span className="lp-field-rename">renamed from <code>{f.renamedFrom}</code></span> : null}
                        {f.renamedTo ? <span className="lp-field-rename">renamed to <code>{f.renamedTo}</code></span> : null}
                        {f.typeChanged ? <span className="lp-field-typechanged">type changed</span> : null}
                      </div>
                      <p className="lp-field-desc">{f.description}</p>
                      <p className="lp-field-ref">
                        <span>Spec anchor:</span> <code>{f.emvcoRef}</code>
                      </p>
                      <a className="lp-anchor" href={`#field-${g.messageType}-${f.field}`}>
                        permalink
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </section>

        <footer className="lp-foot">
          <p>
            Protocol Research & Data Dictionary Architecture by{' '}
            <a
              href="https://www.linkedin.com/in/cswasif/"
              target="_blank"
              rel="noreferrer"
              style={{ fontWeight: 700, color: 'var(--accent-primary)', textDecoration: 'underline' }}
            >
              Wasif Faisal
            </a>{' '}
            (BRAC University). The data shown here is generated live from{' '}
            <code>src/data/payloads/meta/fieldProvenance.ts</code>; v2.3.1 is anchored to Tables B.1–B.11 of the EMV
            3DS v2.3.1 Core Spec, and v2.1.0 / v2.2.0 fields are sourced from the 3dsecure.io re-typeset and labelled
            non-authoritative.
          </p>
        </footer>
      </main>
    </>
  );
}
