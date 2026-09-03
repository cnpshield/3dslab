/**
 * EMVCo §3.1.2.3 device data collection list. The 3DS Method URL is allowed
 * to read these browser/device attributes for fraud and risk scoring. The
 * full canonical list (CD1–CDn) is defined by the EMVCo 3DS Specification
 * and is not part of this project's open-source distribution as a verbatim
 * reproduction. This file is a *paraphrase / educational reference* with
 * the widely-cited field names and a brief research note per field.
 *
 * Researchers should consult EMVCo 3DS §3.1.2.3 (Device Data) in the latest
 * version of the spec for the normative field set and to confirm any
 * platform-specific exclusions (e.g. iOS WebKit restrictions).
 */
export interface EmvcoDeviceField {
  /** Short code or field name, as referenced in EMVCo documentation. */
  name: string;
  /** Plain-language description of what the field captures. */
  description: string;
  /** Whether the field is required (R), optional (O), or conditional (C). */
  requirement: 'R' | 'O' | 'C';
  /** Notes for a security researcher (e.g. privacy/PII considerations). */
  researchNote: string;
  /** Whether the field is typically surfaced via `navigator.*` in browsers. */
  browserSource?: string;
}

export const EMVCO_DEVICE_FIELDS: EmvcoDeviceField[] = [
  {
    name: 'BrowserAcceptHeader',
    description: 'The HTTP Accept request-header field sent by the browser. Useful as a low-entropy fingerprint and for protocol negotiation.',
    requirement: 'R',
    researchNote: 'High-entropy on bots and headless clients; matches "normal" Accept values on legitimate browsers.',
    browserSource: 'navigator.userAgent + Accept header',
  },
  {
    name: 'BrowserIP',
    description: 'Client IP address as observed by the ACS (often via X-Forwarded-For).',
    requirement: 'R',
    researchNote: 'PII. Do not log in plaintext; consider truncation. Often shared across NAT boundaries.',
  },
  {
    name: 'BrowserJavaEnabled',
    description: 'Boolean indicating whether the browser has Java enabled.',
    requirement: 'R',
    researchNote: 'Effectively always false on modern browsers; useful as a sanity check, not as a discriminator.',
    browserSource: 'navigator.javaEnabled()',
  },
  {
    name: 'BrowserJavaScriptEnabled',
    description: 'Boolean indicating whether JavaScript is enabled in the browser.',
    requirement: 'R',
    researchNote: 'Required for any 3DS Method iframe flow. If false, the entire 3DS Method step is skipped. Wire name: browserJavascriptEnabled (lowercase "s").',
    browserSource: '<script> tag presence (heuristic)',
  },
  {
    name: 'BrowserLanguage',
    description: 'IETF language tag of the browser, e.g. "en-US".',
    requirement: 'R',
    researchNote: 'Combine with timezone to detect VPN/proxy mismatches.',
    browserSource: 'navigator.language',
  },
  {
    name: 'BrowserColorDepth',
    description: 'Bit-depth of the browser color palette (e.g. 24, 30, 48).',
    requirement: 'R',
    researchNote: 'High color depth is a strong signal of a real device; headless browsers often report 24.',
    browserSource: 'screen.colorDepth',
  },
  {
    name: 'BrowserScreenHeight',
    description: 'Total height of the screen in pixels.',
    requirement: 'R',
    researchNote: 'Combine with screen width to fingerprint the device class.',
    browserSource: 'screen.height',
  },
  {
    name: 'BrowserScreenWidth',
    description: 'Total width of the screen in pixels.',
    requirement: 'R',
    researchNote: 'Same as BrowserScreenHeight. Beware: not window.innerWidth — must be screen.* to be spec-compliant.',
    browserSource: 'screen.width',
  },
  {
    name: 'BrowserTZ',
    description: 'Numeric offset in minutes from UTC for the browser timezone.',
    requirement: 'R',
    researchNote: 'Combine with BrowserIP geo to detect VPN/proxy; mismatch is a low-grade risk signal.',
    browserSource: 'new Date().getTimezoneOffset()',
  },
  {
    name: 'BrowserUserAgent',
    description: 'Full User-Agent string. ~150+ characters on most browsers.',
    requirement: 'R',
    researchNote: 'Forensics goldmine. PII-adjacent because it often reveals the device class. Many ACSes hash this for storage.',
    browserSource: 'navigator.userAgent',
  },
  {
    name: 'DeviceChannel',
    description: 'The integration channel: 01 = App-based (SDK), 02 = Browser, 03 = 3DS Requestor Initiated (3RI).',
    requirement: 'R',
    researchNote: 'Drives which subset of fields are required. 3RI and 02 (Browser) collect different fields; 01 (SDK) collects more device-native attributes.',
  },
  {
    name: 'threeDSServerData',
    description: 'Implementation-level concept (not a normative spec field name): opaque data the 3DS Server embeds in the threeDSMethodData POST to correlate the 3DS Method response with the pending transaction. The spec-defined correlation key is threeDSServerTransID.',
    requirement: 'C',
    researchNote: 'Not a Table A.1 wire field — this is the opaque payload embedded in the 3DS Method form POST. The canonical transaction-level linkage is threeDSServerTransID.',
  },
  {
    name: 'threeDSServerTransactionIdentifier',
    description: 'UUIDv4 generated by the 3DS Server. Links the 3DS Method data (Step 4) to the AReq (Step 6) and ARes (Step 8c).',
    requirement: 'R',
    researchNote: 'MUST be UUIDv4 per spec. Reuse across transactions is a serious security defect — allows fingerprint replay.',
  },
  {
    name: 'threeDSMethodNotificationURL',
    description: 'The 3DS Server endpoint the ACS POSTs the 3DS Method completion result to (not to be confused with notificationURL in AReq, which receives the final CRes).',
    requirement: 'R',
    researchNote: 'Must be HTTPS. Open redirect / SSRF vectors are common research targets here. See §5.8.1.1 [Req 82] for the 3DS Method Data POST.',
  },
];
