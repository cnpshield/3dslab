/**
 * Per-route SEO helper.
 *
 * The lab ships as a single-page Vite app, but it now exposes a small
 * set of indexable routes (via `window.location.hash`). Each route has
 * its own title, description, canonical URL, and Open Graph / Twitter
 * card. The helper writes to `document.title`, the named `<meta>`
 * elements, and the `<link rel="canonical">` element so search engines
 * and social crawlers see a clean per-page surface.
 *
 * The DOM elements are created once and updated in place; that avoids
 * accumulating duplicate <meta> tags when the user navigates inside
 * the SPA.
 */

import { useEffect } from 'react';

export interface SeoConfig {
  title: string;
  description: string;
  /**
   * Absolute path under the canonical host. Defaults to '/' when the
   * caller does not specify one. Leading slash is added automatically.
   */
  path?: string;
  /**
   * og:type override. Defaults to 'website'. Pages with structured
   * research content may want to use 'article'.
   */
  ogType?: 'website' | 'article';
  /**
   * Optional JSON-LD block to inject for this page. The component will
   * replace the existing `#page-jsonld` <script> tag if present.
   */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_NAME = 'EMV 3DS Protocol Lab';
const CANONICAL_ORIGIN = 'https://cnpshield.github.io/3dslab';
const OG_IMAGE = `${CANONICAL_ORIGIN}/og-image.png`;
const DEFAULT_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

/**
 * Ensure a <meta> tag exists with the given name and return the element.
 * If a matching tag already exists, it is reused.
 */
function ensureMeta(name: string, content?: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  if (content !== undefined) {
    el.setAttribute('content', content);
  }
  return el;
}

/**
 * Ensure an OG <meta> tag exists with the given property and return it.
 */
function ensureOgMeta(property: string, content?: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  if (content !== undefined) {
    el.setAttribute('content', content);
  }
  return el;
}

/**
 * Ensure the canonical link element exists.
 */
function ensureCanonical(href: string): HTMLLinkElement {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return el;
}

/**
 * Ensure a JSON-LD <script> tag exists with the given id.
 */
function ensureJsonLd(): HTMLScriptElement {
  let el = document.getElementById('page-jsonld') as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'page-jsonld';
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Update document metadata for the current route. Safe to call on every
 * render; this is the React equivalent of a side-effect-only effect.
 */
export function Seo({ title, description, path, ogType = 'website', jsonLd }: SeoConfig): null {
  useEffect(() => {
    const canonicalPath = path && path.startsWith('/') ? path : `/${path ?? ''}`;
    const canonical = `${CANONICAL_ORIGIN}${canonicalPath === '/' ? '/' : canonicalPath}`;

    document.title = title;
    ensureMeta('description', description);
    ensureMeta('robots', DEFAULT_ROBOTS);

    ensureCanonical(canonical);

    ensureOgMeta('og:site_name', SITE_NAME);
    ensureOgMeta('og:type', ogType);
    ensureOgMeta('og:title', title);
    ensureOgMeta('og:description', description);
    ensureOgMeta('og:url', canonical);
    ensureOgMeta('og:image', OG_IMAGE);
    ensureOgMeta('og:image:alt', 'EMV 3DS Protocol Lab — protocol flow explorer and reference.');

    ensureMeta('twitter:card', 'summary_large_image');
    ensureMeta('twitter:title', title);
    ensureMeta('twitter:description', description);
    ensureMeta('twitter:image', OG_IMAGE);

    if (jsonLd !== undefined) {
      const el = ensureJsonLd();
      el.textContent = JSON.stringify(jsonLd);
    } else {
      // No per-page JSON-LD requested; clear any stale block.
      const el = document.getElementById('page-jsonld');
      if (el) el.textContent = '';
    }
  }, [title, description, path, ogType, jsonLd]);

  return null;
}
