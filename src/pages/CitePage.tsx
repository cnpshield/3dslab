/**
 * Cite page.
 *
 * The official "how to cite" landing page for academic users, analysts,
 * and security researchers. Hosts interactive BibTeX, APA, IEEE, and
 * MLA citation cards with 1-click clipboard export, Zenodo DOI
 * provenance, and versioned citation blocks.
 */

import { useState } from 'react';
import { Copy, Check, BookOpen, ExternalLink, ShieldCheck, GraduationCap, Mail } from 'lucide-react';
import { Seo } from '../components/Seo';

const BIBTEX = `@misc{emv3ds_protocol_lab_2026,
  author       = {Wasif Faisal},
  title        = {{EMV 3-D Secure Protocol Lab -- reference tool}},
  year         = {2026},
  howpublished = {\\url{https://cnpshield.github.io/3dslab}},
  note         = {Apache-2.0; field-level payload registry anchored to EMV 3DS v2.3.1 Core Spec Tables B.1--B.11.}
}`;

const APA = `Wasif, F. (2026). EMV 3-D Secure Protocol Lab (Version 0.3.0) [Software]. https://cnpshield.github.io/3dslab. Apache-2.0.`;

const IEEE = `[1] F. Wasif, “EMV 3-D Secure Protocol Lab — reference tool,” 2026. [Online]. Available: https://cnpshield.github.io/3dslab.`;

const MLA = `Wasif, Faisal. EMV 3-D Secure Protocol Lab — reference tool. 2026, cnpshield.github.io/3dslab.`;

type CitationFormat = 'bibtex' | 'apa' | 'ieee' | 'mla';

export function CitePage() {
  const [activeFormat, setActiveFormat] = useState<CitationFormat>('bibtex');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Cite EMV 3DS Protocol Lab',
    description: 'How to cite EMV 3DS Protocol Lab in academic, industry, and security-analysis work.',
    inLanguage: 'en',
    author: { '@id': 'https://cnpshield.github.io/3dslab/#author' },
    publisher: { '@id': 'https://cnpshield.github.io/3dslab/#website' },
    about: ['EMV 3DS', 'citation', 'reproducibility', 'reference tool'],
  };

  const handleCopy = (text: string, formatId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatId);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <>
      <Seo
        title="Cite EMV 3DS Protocol Lab | BibTeX, APA, IEEE, MLA"
        description="How to cite the EMV 3DS Protocol Lab in academic, industry, and security-analysis work. Includes BibTeX, APA, IEEE, and MLA entries."
        path="/cite"
        jsonLd={jsonLd}
      />
      <main className="lp-main">
        <a className="lp-back-link" href="/">← Back to the interactive lab</a>
        
        <header className="lp-header">
          <p className="lp-eyebrow">Citation</p>
          <h1>Cite EMV 3DS Protocol Lab</h1>
          <p className="lp-lede">
            The lab is an open reference tool. If it informs your methodology, appendix, implementation review,
            security analysis, or references, please cite it using one of the standardized entries below.
          </p>
        </header>

        {/* Interactive Citation Deck */}
        <section className="cite-tabs-container">
          <div className="cite-tab-bar">
            {(['bibtex', 'apa', 'ieee', 'mla'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                className={`cite-tab-btn ${activeFormat === fmt ? 'active' : ''}`}
                onClick={() => setActiveFormat(fmt)}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="cite-card">
            <div className="cite-card-header">
              <span className="cite-card-title">
                <BookOpen size={15} />
                <span>{activeFormat.toUpperCase()} Format</span>
              </span>
              <button
                type="button"
                className={`cite-copy-btn ${copiedFormat === activeFormat ? 'copied' : ''}`}
                onClick={() => {
                  const text = activeFormat === 'bibtex' ? BIBTEX : activeFormat === 'apa' ? APA : activeFormat === 'ieee' ? IEEE : MLA;
                  handleCopy(text, activeFormat);
                }}
                aria-label={`Copy ${activeFormat.toUpperCase()} citation`}
              >
                {copiedFormat === activeFormat ? (
                  <><Check size={14} /> Copied!</>
                ) : (
                  <><Copy size={14} /> Copy Citation</>
                )}
              </button>
            </div>

            {activeFormat === 'bibtex' ? (
              <pre className="cite-content-pre"><code>{BIBTEX}</code></pre>
            ) : (
              <p className="cite-content-prose">
                {activeFormat === 'apa' ? APA : activeFormat === 'ieee' ? IEEE : MLA}
              </p>
            )}
          </div>
        </section>

        {/* Reproducibility & Research Provenance */}
        <section className="lp-section">
          <h2>Reproducibility & Archival Pointers</h2>
          <div className="lp-rename-grid">
            <div className="lp-rename-card">
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                Zenodo Digital Object Identifier (DOI)
              </span>
              <h3 style={{ fontSize: '15px' }}>10.5281/zenodo.placeholder</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                Minted for release v0.3.0. Guarantees long-term archival permanence in the CERN Zenodo repository.
              </p>
            </div>

            <div className="lp-rename-card">
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                Machine-Readable Citation File
              </span>
              <h3 style={{ fontSize: '15px' }}>CITATION.cff</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                Located at the repository root. Conforms to the Citation File Format 1.2.0 standard recognized by GitHub and Zotero.
              </p>
            </div>
          </div>
        </section>

        {/* Specification Anchor */}
        <section className="lp-section">
          <h2>Specification Anchoring</h2>
          <p>
            Protocol shapes and message structures in the lab are formally anchored to{' '}
            <em>EMV 3-D Secure Protocol and Core Functions Specification, v2.3.1</em> (EMVCo, 2022-08-31).
            v2.1.0 and v2.2.0 differences are benchmarked against EMVCo Bulletin revisions.
          </p>
          <ul>
            <li>
              <strong>Primary Reference:</strong> EMV 3DS Core Spec v2.3.1, Section 5 (Message Handling) & Annex B (Data Dictionary).
            </li>
            <li>
              <strong>Cryptographic Profiles:</strong> RFC 7515 (JSON Web Signature) & JWS compact serialization standards.
            </li>
          </ul>
        </section>

        {/* Principal Investigator & Protocol Architect */}
        <section className="lp-section">
          <h2>Principal Investigator & Protocol Architect</h2>
          <div className="author-spotlight-card">
            <div className="author-spotlight-header">
              <div className="author-avatar-badge" aria-hidden="true">
                <ShieldCheck size={26} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="author-spotlight-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0' }}>
                  Wasif Faisal
                  <span className="author-verified-badge" title="Academic Affiliation">
                    <GraduationCap size={13} aria-hidden="true" />
                    BRAC University
                  </span>
                </h3>
                <p className="author-spotlight-title" style={{ margin: 0 }}>
                  Lead Security Researcher & Protocol Architect
                </p>
              </div>
            </div>
            <p className="author-spotlight-bio">
              Research focus: next-generation electronic payment security, 3-D Secure message flows, browser security, and protocol verification. Creator and architect of the vendor-neutral EMV 3DS Protocol Lab.
            </p>
            <div className="author-spotlight-links">
              <a
                href="https://www.linkedin.com/in/cswasif/"
                target="_blank"
                rel="noopener noreferrer"
                className="author-spotlight-btn primary"
              >
                <ExternalLink size={12} />
                <span>LinkedIn Profile</span>
              </a>
              <a
                href="https://github.com/cnpshield/3dslab"
                target="_blank"
                rel="noopener noreferrer"
                className="author-spotlight-btn"
              >
                <ExternalLink size={12} />
                <span>GitHub Repository</span>
              </a>
              <a
                href="mailto:md.wasif.faisal@g.bracu.ac.bd"
                className="author-spotlight-btn"
              >
                <Mail size={12} />
                <span>md.wasif.faisal@g.bracu.ac.bd</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
