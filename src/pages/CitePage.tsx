/**
 * Cite page.
 *
 * The official "how to cite" landing page for academic users. Hosts
 * the BibTeX entries, CITATION.cff pointer, Zenodo DOI placeholder,
 * and the per-version citation block.
 */

import { Seo } from '../components/Seo';

const BIBTEX = `@misc{emv3ds_protocol_lab_2026,
  author       = {Wasif Faisal},
  title        = {{EMV 3-D Secure Protocol Lab -- research artifact}},
  year         = {2026},
  howpublished = {\\url{https://cnpshield.github.io/3dslab}},
  note         = {Apache-2.0; field-level payload registry anchored to EMV 3DS v2.3.1 Core Spec Tables B.1--B.11.}
}`;

const APA = `Wasif, F. (2026). EMV 3-D Secure Protocol Lab (Version 0.3.0) [Software]. https://cnpshield.github.io/3dslab. Apache-2.0.`;

const IEEE = `[1] F. Wasif, “EMV 3-D Secure Protocol Lab — research artifact,” 2026. [Online]. Available: https://cnpshield.github.io/3dslab.`;

const MLA = `Wasif, Faisal. EMV 3-D Secure Protocol Lab — research artifact. 2026, cnpshield.github.io/3dslab.`;

export function CitePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Cite EMV 3DS Protocol Lab',
    description: 'How to cite EMV 3DS Protocol Lab in academic, industry, and security research work.',
    inLanguage: 'en',
    author: { '@id': 'https://cnpshield.github.io/3dslab/#author' },
    publisher: { '@id': 'https://cnpshield.github.io/3dslab/#website' },
    about: ['EMV 3DS', 'citation', 'reproducibility', 'research artifact'],
  };

  return (
    <>
      <Seo
        title="Cite EMV 3DS Protocol Lab | BibTeX, APA, IEEE, MLA"
        description="How to cite the EMV 3DS Protocol Lab in academic, industry, and security research work. Includes BibTeX, APA, IEEE, and MLA entries."
        path="/cite"
        jsonLd={jsonLd}
      />
      <main className="lp-main">
        <a className="lp-back-link" href="/">← Back to the interactive lab</a>
        <header className="lp-header">
          <p className="lp-eyebrow">Citation</p>
          <h1>Cite EMV 3DS Protocol Lab</h1>
          <p className="lp-lede">
            The lab is a research artifact. If it appears in your methodology, your appendix, or your reference list,
            please use one of the entries below. The canonical citation surface is the <code>CITATION.cff</code>{' '}
            file at the repository root; GitHub will render a “Cite this repository” button automatically.
          </p>
        </header>

        <section className="lp-section">
          <h2>BibTeX</h2>
          <pre className="lp-cite-pre"><code>{BIBTEX}</code></pre>
        </section>

        <section className="lp-section">
          <h2>APA</h2>
          <p className="lp-cite-block">{APA}</p>
        </section>

        <section className="lp-section">
          <h2>IEEE</h2>
          <p className="lp-cite-block">{IEEE}</p>
        </section>

        <section className="lp-section">
          <h2>MLA</h2>
          <p className="lp-cite-block">{MLA}</p>
        </section>

        <section className="lp-section">
          <h2>Versioned citation</h2>
          <p>
            For reproducibility, cite the specific version of the lab you used. Versions are tagged in Git and
            archived on Zenodo (DOI minted on first GitHub release; the DOI will appear here).
          </p>
          <ul>
            <li>
              <strong>v0.3.0 (2026-07-12):</strong> first public alpha of the versioned payload registry.{' '}
              <a href="https://github.com/cnpshield/3dslab/releases/tag/v0.3.0">release page</a>.
            </li>
            <li>
              <strong>Future releases:</strong> each GitHub release will mint a Zenodo DOI; the corresponding BibTeX
              entry will be added to this page.
            </li>
          </ul>
        </section>

        <section className="lp-section">
          <h2>Source provenance</h2>
          <p>
            Wire shapes are anchored to <em>EMV 3-D Secure Protocol and Core Functions Specification, v2.3.1</em>{' '}
            (EMVCo, 2022-08-31). v2.1.0 / v2.2.0 data is sourced from the 3dsecure.io re-typeset
            (<code>3DSv2-api-documentation</code>) and is labelled non-authoritative in the lab. The lab's legal
            posture is recorded in <code>LICENSES/EMVCo-notice.md</code>.
          </p>
        </section>

        <section className="lp-section">
          <h2>Author</h2>
          <p>
            Wasif Faisal, BRAC University. Contact: <a href="mailto:md.wasif.faisal@g.bracu.ac.bd">md.wasif.faisal@g.bracu.ac.bd</a>.
          </p>
        </section>

        <footer className="lp-foot">
          <p>
            See also: <a href="/versions/">Version Matrix</a> · <a href="/fields/">Field Reference</a> ·{' '}
            <a href="/flows/">Flow Comparison</a> · <a href="/pitfalls/">Pitfalls</a>.
          </p>
        </footer>
      </main>
    </>
  );
}
