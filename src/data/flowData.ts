import type { Participant, FlowStep, StepGroupMeta, DomainOverview, ParticipantOverview, StepGroupOverview, GlossaryEntry, SecurityLensNote, Scenario, DeviceChannel } from '../types';

export const PARTICIPANTS: Participant[] = [
  {
    id: 'CH',
    name: 'Cardholder',
    fullName: 'Cardholder (Customer)',
    color: '#ea580c', // Orange/Amber
    stroke: '#f97316',
    bg: '#ffedd5',
  },
  {
    id: 'BR',
    name: 'Browser',
    fullName: 'Cardholder Browser',
    color: '#d97706', // Yellow/Amber
    stroke: '#fbbf24',
    bg: '#fef3c7',
  },
  {
    id: 'RE',
    name: 'Requestor Env',
    fullName: '3DS Requestor (Merchant Website)',
    color: '#2563eb', // Blue
    stroke: '#60a5fa',
    bg: '#dbeafe',
  },
  {
    id: 'S',
    name: '3DS Server',
    fullName: '3DS Server (Acquirer/Gateway)',
    color: '#6366f1', // Indigo
    stroke: '#818cf8',
    bg: '#e0e7ff',
  },
  {
    id: 'DS',
    name: 'Directory Server',
    fullName: 'Directory Server (DS)',
    color: '#8b5cf6', // Purple
    stroke: '#a78bfa',
    bg: '#ede9fe',
  },
  {
    id: 'ACS',
    name: 'Access Control',
    fullName: 'Access Control Server (Issuer ACS)',
    color: '#10b981', // Emerald/Green
    stroke: '#34d399',
    bg: '#d1fae5',
  },
];

const isAppChannel = (scenarioOrChannel: Scenario | DeviceChannel) =>
  (typeof scenarioOrChannel === 'string' ? scenarioOrChannel : scenarioOrChannel.deviceChannel) === 'app';

export function getParticipantsForScenario(scenarioOrChannel: Scenario | DeviceChannel): Participant[] {
  if (!isAppChannel(scenarioOrChannel)) return PARTICIPANTS;

  return PARTICIPANTS.map((participant) =>
    participant.id === 'BR'
      ? {
          ...participant,
          name: '3DS SDK',
          fullName: '3DS SDK / Challenge Runtime',
        }
      : participant.id === 'RE'
        ? {
            ...participant,
            fullName: '3DS Requestor (Merchant App)',
          }
        : participant
  );
}

export function getParticipantOverviewsForScenario(scenarioOrChannel: Scenario | DeviceChannel): ParticipantOverview[] {
  if (!isAppChannel(scenarioOrChannel)) return PARTICIPANT_OVERVIEWS;

  return PARTICIPANT_OVERVIEWS.map((participant) => {
    if (participant.id === 'BR') {
      return {
        ...participant,
        shortName: '3DS SDK',
        fullName: '3DS SDK / Challenge Runtime',
        specSection: 'App-based challenge; Table B.1 SDK fields',
        role: 'The on-device 3DS SDK and challenge runtime inside the requestor app. It binds the app-side transaction identifiers, maintains the protected SDK challenge channel to the ACS, renders issuer-directed challenge UI, and hands the final result back to the requestor app.',
        owns: [
          'The local `sdkTransID` binding for the active app-session challenge',
          'SDK challenge rendering state (`acsRenderingType`, interaction lifecycle, close/dismiss behavior)',
        ],
        doesNotOwn: [
          'The issuer decision or the final authentication result (the ACS still decides that)',
          'Merchant checkout policy after the SDK returns control to the requestor app',
        ],
        sends: ['Initial SDK CReq to ACS (step 11d)', 'Follow-up SDK challenge messages / responses (step 14)', 'Validated completion callback to requestor app (step 21e)'],
        receives: ['Challenge-start parameters from the requestor app (step 11c)', 'ACS CRes-driven challenge UI state (step 12c)', 'Final ACS CRes over the SDK channel (step 21d)'],
        authoritativeIds: ['sdkTransID (per app-channel transaction)'],
        notes: [
          'This lane is not a browser surrogate. In app challenge, the SDK owns the client-side ACS transport and rendering lifecycle.',
          'The SDK still does not make authentication decisions; it is a constrained runtime that carries ACS-directed state back to the requestor app.',
        ],
      };
    }

    if (participant.id === 'RE') {
      return {
        ...participant,
        fullName: '3DS Requestor (Merchant App)',
        role: 'The merchant requestor logic surrounding the app checkout. It collects requestor data, invokes the 3DS SDK for app challenge, validates the returned completion data, and decides how checkout resumes after 3DS.',
        owns: [
          'The requestor app checkout UI and merchant-side state',
          'The 3DS Requestor Authentication Info (3RI) when applicable',
          'The 3DS Requestor identifiers such as `threeDSRequestorID`, `threeDSRequestorURL`, and app-deep-link context',
        ],
        notes: [
          'In app scenarios, the requestor environment spans the merchant app plus whatever merchant service coordinates with the 3DS Server.',
          'The requestor app invokes the SDK, but it still must validate the final completion data before treating challenge as successful.',
        ],
      };
    }

    return participant;
  });
}

/**
 * Step group metadata used to render colored bands on the sequence diagram.
 * Each group represents a conceptual phase of the 3DS flow. The order
 * here also determines the top-to-bottom band order on the canvas.
 */
export const STEP_GROUPS: StepGroupMeta[] = [
  {
    id: 'preauth',
    title: 'Pre-Auth Cache Setup',
    description: 'Out-of-band cache warm-up. Not part of the per-transaction flow — runs at most every 12 hours (full) or every hour (partial).',
    color: '#64748b', // slate
    icon: 'cache',
    introducedIn: '2.1.0',
  },
  {
    id: 'setup',
    title: 'Step 2 — Setup',
    description: '3DS Server resolves which ACS/DS protocol versions to use and whether a 3DS Method URL is available for the card range.',
    color: '#0ea5e9', // sky
    icon: 'setup',
    introducedIn: '2.1.0',
  },
  {
    id: 'method',
    title: 'Step 3–4 — 3DS Method (HIDDEN from user)',
    description: 'A hidden iframe lets the ACS gather Browser/device fingerprint data, correlated to the same 3DS Server Transaction ID used later in AReq. The user sees nothing on screen.',
    color: '#f59e0b', // amber (warning: hidden complexity)
    icon: 'fingerprint',
    introducedIn: '2.1.0',
  },
  {
    id: 'areq',
    title: 'Step 5–6 — AReq Assembly & Send',
    description: 'The 3DS Server assembles the AReq from the requestor-collected and browser-collected data and posts it to the DS over a server-authenticated TLS link.',
    color: '#6366f1', // indigo
    icon: 'request',
    introducedIn: '2.1.0',
  },
  {
    id: 'ds_validation',
    title: 'Step 7 — DS Validation & Routing',
    description: 'The Directory Server validates the AReq, generates a DS Transaction ID, and either forwards to the ACS or returns an error.',
    color: '#8b5cf6', // purple
    icon: 'route',
    introducedIn: '2.1.0',
  },
  {
    id: 'acs_decision',
    title: 'Step 8 — ACS Risk Decision',
    description: 'The ACS uses the AReq data, prior 3DS Method data, and risk signals to decide whether to return an authenticated result (Y), an attempts result (A), challenge, decoupled authentication, or a negative outcome. Frictionless and attempts branches split here.',
    color: '#10b981', // emerald
    icon: 'shield',
    introducedIn: '2.1.0',
  },
  {
    id: 'ares',
    title: 'Step 9–10 — ARes Return',
    description: 'The ARes is validated and forwarded back through the DS to the 3DS Server, which either finishes the direct ARes path or starts browser challenge handling for `transStatus = C`.',
    color: '#06b6d4', // cyan
    icon: 'response',
    introducedIn: '2.1.0',
  },
  {
    id: 'challenge',
    title: 'Step 10–15 — Challenge',
    description: 'For `transStatus = C`, the requestor starts challenge handling using the correct client channel: browser flows post a 3DS Server-built CReq through the browser, while app flows use the 3DS SDK / ACS channel with SDK-rendered UI and repeated CReq/CRes exchanges as needed.',
    color: '#ef4444', // red
    icon: 'challenge',
    introducedIn: '2.1.0',
  },
  {
    id: 'results',
    title: 'Step 16–21 — Results Exchange',
    description: 'After challenge completion, the ACS sends the authoritative result via RReq/RRes and then closes the client-facing challenge channel using the browser notification path or the SDK completion path.',
    color: '#14b8a6', // teal
    icon: 'result',
    introducedIn: '2.1.0',
  },
  {
    id: 'completion',
    title: 'Step 22 — Checkout Continuation',
    description: '3DS processing ends. The 3DS Requestor Environment continues checkout and carries forward the issuer result correctly: authenticated outcomes use the ACS-provided authentication data, attempts uses its own ECI semantics, and non-authenticated paths stay outside liability-shift claims.',
    color: '#84cc16', // lime
    icon: 'check',
    introducedIn: '2.1.0',
  },
];

export const FLOW_STEPS: FlowStep[] = [
  // ──────────────────────────────────────────────────────────────
  // PRE-AUTH: PReq/PRes Cache Setup (Section 5.6)
  // This happens periodically, NOT per-transaction.
  // ──────────────────────────────────────────────────────────────
  {
    id: 'step_0A',
    num: '0A',
    label: 'PReq → Card Range Request',
    detail: 'Pre-authentication setup: The 3DS Server formats a Preparation Request (PReq) message and sends it to the Directory Server to request or update cached card range data. This happens periodically (full update at least every 12 hours, partial update at least once per hour) — not per transaction. Including `serialNum` triggers a partial update; omitting it triggers a full update.',
    userExperience: 'Background — the user is shopping, has not yet reached checkout. The 3DS Server is talking to the DS on its own schedule, not because of anything the user did.',
    whyItMatters: 'Caching card-range / version data locally means a per-transaction lookup can be answered in microseconds instead of a network round-trip. This is the only "slow" part of an otherwise fast protocol.',
    approxTime: '~100–500 ms',
    userVisibility: 'silent',
    groupId: 'preauth',
    source: 'S',
    target: 'DS',
    specRef: '§5.6 — PReq/PRes Message Handling [Req 246–250, 456]',
    payloadType: 'json',
    payload: {
      messageType: 'PReq',
      messageVersion: '2.3.1',
      threeDSServerRefNumber: 'SRV-REF-001',
      cardRangeDataDownloadInd: false
    },
    payloadTitle: 'PReq Payload',
    isActive: () => true
  },
  {
    id: 'step_0B',
    num: '0B',
    label: 'PRes ← Card Range Data',
    detail: 'The DS validates the PReq and returns a Preparation Response (PRes) containing card range entries. Each range entry includes: `ranges` (start/end), Action Indicator (A=Add, M=Modify, D=Delete), DS Protocol Versions, and `acsProtocolVersions` — an array of objects where each entry pairs a protocol Version with its 3DS Method URL and ACS Information Indicator. The 3DS Server caches this data for transaction-time lookups. If the Serial Number has not changed, the DS omits the `cardRangeData` element and returns only the `serialNum`.',
    userExperience: 'Background. The user is unaware this round-trip happened.',
    whyItMatters: 'Each `acsProtocolVersions` entry tells the 3DS Server which 3DS Method URL to call and which protocol version that URL speaks. This is the data the rest of the flow depends on.',
    approxTime: '~100–500 ms',
    userVisibility: 'silent',
    groupId: 'preauth',
    source: 'DS',
    target: 'S',
    specRef: '§5.6 — PReq/PRes Message Handling [Req 250, 304, 385]; Table A.6 / B.7',
    payloadType: 'json',
    payload: {
      messageType: 'PRes',
      messageVersion: '2.3.1',
      serialNum: '20260710-002',
      dsProtocolVersions: ['2.1.0', '2.2.0', '2.3.1'],
      cardRangeData: [
        {
          actionInd: 'A',
          ranges: [
            { startRange: '4000123400000000', endRange: '4000123499999999' }
          ],
          dsProtocolVersions: ['2.1.0', '2.2.0', '2.3.1'],
          acsProtocolVersions: [
            {
              version: '2.3.1',
              acsInformationIndicator: ['C'], // C = 3DS Method supported
              threeDSMethodURL: 'https://acs.issuer-bank.com/3ds-method/collect',
              threeDSMethodSupported: true
            },
            {
              version: '2.2.0',
              acsInformationIndicator: [],
              threeDSMethodURL: 'https://acs.issuer-bank.com/3ds-method/collect',
              threeDSMethodSupported: true
            },
            {
              version: '2.1.0',
              acsInformationIndicator: [],
              threeDSMethodURL: 'https://acs.issuer-bank.com/3ds-method/collect',
              threeDSMethodSupported: true
            }
          ]
        }
      ]
    },
    payloadTitle: 'PRes Payload (Card Range Data)',
    isActive: () => true
  },

  // ──────────────────────────────────────────────────────────────
  // STEP 1: The Cardholder (§3.3 Step 1)
  // "The Cardholder interacts with the 3DS Requestor using a
  //  Browser on a Consumer Device and confirms the applicable
  //  business logic."
  // ──────────────────────────────────────────────────────────────
  {
    id: 'step_1',
    num: '1',
    label: 'Initiates Checkout',
    detail: 'The Cardholder interacts with the 3DS Requestor (merchant website) using a Browser on a Consumer Device. The Cardholder provides payment details and confirms the purchase. Card number, billing/shipping address and browser metadata are captured by the merchant frontend.',
    userExperience: 'The user is actively typing — they are choosing a card, entering shipping details, and clicking "Pay". This is the only step the user is consciously aware of.',
    whyItMatters: '3DS only protects transactions that the merchant chooses to enroll. The trigger is the user pressing a button on the merchant site.',
    approxTime: '~5–60 s (user-driven)',
    userVisibility: 'visible',
    groupId: 'setup',
    source: 'CH',
    target: 'RE',
    specRef: '§3.3 Step 1 — The Cardholder',
    payloadType: 'json',
    payload: {
      cardholderName: 'Jane Doe',
      acctNumber: '4000123456789010',
      cardExpiry: '1229',
      purchaseAmount: '279.98',
      purchaseCurrency: 'USD',
      billingAddress: { city: 'San Francisco', country: 'US' },
      browserInfo: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
        screenHeight: 1080,
        screenWidth: 1920,
        colorDepth: 24,
        language: 'en-US',
        timezoneOffset: -360
      }
    },
    payloadTitle: 'Checkout Context & Browser Metadata',
    isActive: () => true
  },

  // ──────────────────────────────────────────────────────────────
  // STEP 2: The 3DS Server/3DS Requestor (§3.3 Step 2)
  // "The 3DS Requestor initiates communications with the 3DS
  //  Server and provides the necessary 3-D Secure information."
  // Sub-parts: 2a (request), 2b (cache lookup), 2c (response)
  // ──────────────────────────────────────────────────────────────
  {
    id: 'step_2a',
    num: '2a',
    label: 'Requests Versions & Method URL',
    detail: 'The 3DS Requestor sends the Cardholder Account Number (and optionally other info) to the 3DS Server to request the ACS/DS Protocol Version lists and, if present, the 3DS Method URL for that card range.',
    userExperience: 'A small spinner or no visible change — happens in tens of milliseconds because the 3DS Server is just doing a local cache lookup.',
    whyItMatters: 'The 3DS Server does not know which issuer-ACS or 3DS Method URL to use without first looking up the card range. This is a cache lookup, not a network call.',
    approxTime: '<10 ms (local cache hit)',
    userVisibility: 'silent',
    groupId: 'setup',
    source: 'RE',
    target: 'S',
    specRef: '§3.3 Step 2 — The 3DS Server/3DS Requestor [Req 80]',
    payloadType: 'json',
    payload: {
      acctNumber: '4000123456789010',
      merchantId: 'MERCH_987654321',
      purchaseAmount: '27998',
      purchaseCurrency: '840',
      deviceChannel: '02'
    },
    payloadTitle: 'Version Lookup Request',
    isActive: () => true
  },
  {
    id: 'step_2b',
    num: '2b',
    label: 'Looks Up Cached PRes',
    detail: 'The 3DS Server retrieves the ACS/DS Protocol Version lists and the 3DS Method URL (if present) from the previously cached PRes message data for this card range. It also generates the 3DS Server Transaction ID.',
    userExperience: 'Silent — happens server-side.',
    whyItMatters: 'The `threeDSServerTransID` generated here is the lynchpin: it ties the optional 3DS Method (step 3) to the AReq (step 6). Lose this correlation and the ACS cannot use the fingerprint data.',
    approxTime: '<1 ms (cache lookup)',
    userVisibility: 'silent',
    groupId: 'setup',
    source: 'S',
    target: null,
    specRef: '§3.3 Step 2 — [Req 80, 81] Retrieve versions + Generate Trans ID',
    payloadType: 'json',
    payload: {
      lookupResult: 'CARD_RANGE_MATCHED',
      cardRange: '4000123400000000–4000123499999999',
      acsProtocolVersions: ['2.1.0', '2.2.0', '2.3.1'],
      dsProtocolVersions: ['2.1.0', '2.2.0', '2.3.1'],
      threeDSMethodURL: 'https://acs.issuer-bank.com/3ds-method/collect',
      generatedTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d'
    },
    payloadTitle: 'Cached PRes Lookup Result',
    isActive: () => true
  },
  {
    id: 'step_2c',
    num: '2c',
    label: 'Returns Trans ID & Method URL',
    detail: 'The 3DS Server passes the 3DS Server Transaction ID, ACS Protocol Versions, DS Protocol Versions, and (if present) the 3DS Method URL back through the 3DS Requestor Environment to the 3DS Requestor.',
    userExperience: 'Silent.',
    whyItMatters: 'The merchant now has the transaction ID and (if present) the 3DS Method URL needed to trigger the hidden iframe flow.',
    approxTime: '<10 ms',
    userVisibility: 'silent',
    groupId: 'setup',
    source: 'S',
    target: 'RE',
    specRef: '§3.3 Step 2 — [Req 82] Pass Trans ID + versions + Method URL',
    payloadType: 'json',
    payload: {
      threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
      acsProtocolVersions: ['2.1.0', '2.2.0', '2.3.1'],
      dsProtocolVersions: ['2.1.0', '2.2.0', '2.3.1'],
      threeDSMethodURL: 'https://acs.issuer-bank.com/3ds-method/collect'
    },
    payloadTitle: 'Setup Response',
    isActive: () => true
  },

  // ──────────────────────────────────────────────────────────────
  // STEP 3: The 3DS Requestor Environment (§3.3 Step 3)
  // "Ensure that the 3DS Method is executed on the 3DS Requestor
  //  website if a 3DS Method URL exists."
  // STEP 4: Browser and the ACS (§3.3 Step 4)
  // "The Browser will connect via the 3DS Method to the ACS."
  //
  // Four scenarios: A=Reused, B=Executed, C=Unavailable, D=Timeout
  // ──────────────────────────────────────────────────────────────

  // SCENARIO A: Reuse recent 3DS Method (§5.8.1.2)
  {
    id: 'step_3a',
    num: '3a',
    label: 'Reuses Recent 3DS Method',
    detail: 'The 3DS Requestor determines that a successful 3DS Method already exists for the same card, device, and Browser within the last 10 minutes and reuses that prior result. The 3DS Server then sets the 3DS Method ID to the previous 3DS Server Transaction ID and the 3DS Method Completion Indicator = Y. This avoids a redundant round-trip while still letting the ACS correlate the cached fingerprint with the new AReq.',
    userExperience: 'Silent — the user is unaware of any reuse.',
    whyItMatters: 'Reusing a recent fingerprint saves a network round-trip and avoids a redundant iframe load. The 10-minute window matches realistic user checkout time.',
    approxTime: '<1 ms',
    userVisibility: 'silent',
    groupId: 'method',
    source: 'S',
    target: null,
    specRef: '§5.8.1.2 — Recent Prior 3DS Method Call [Req 415]',
    payloadType: 'json',
    payload: {
      status: 'REUSING_PRIOR_METHOD_DATA',
      threeDSMethodId: '1e2d3c4b-5a6f-7e8d-9c0b-1a2b3c4d5e6f',
      threeDSCompInd: 'Y',
      reusedTimestamp: '2026-07-10T16:07:15Z',
      ageSeconds: 480,
      // 3DS Requestor decides reuse (per [Req 415]); 3DS Server then sets the indicator.
      decidedBy: '3DS_Requestor',
      setBy: '3DS_Server'
    },
    payloadTitle: 'Reused 3DS Method',
    isActive: (s) => s.deviceChannel !== 'app' && s.methodPath === 'reused'
  },

  // SCENARIO B: Execute 3DS Method (§5.8.1.1 + §3.3 Steps 3–4)
  {
    id: 'step_3b',
    num: '3b',
    label: 'Creates Hidden iframe',
    detail: 'The 3DS Requestor ensures that the 3DS Method is executed on the checkout page. It opens a hidden HTML iframe in the Cardholder Browser with the required iframe and sandbox attributes from Tables A.23 and A.24. The same 3DS Server Transaction ID from Step 2 is used so the ACS can correlate fingerprint data with the subsequent AReq.',
    userExperience: 'HIDDEN — the user sees nothing on the checkout page. The iframe is `visibility: hidden` and carries the method-specific sandbox permissions the spec allows.',
    whyItMatters: 'The 3DS Method is the protocol\'s covert channel for the ACS to learn about the user\'s Browser before the AReq arrives. Making it hidden is intentional — frictionless UX.',
    approxTime: '<50 ms (DOM inject)',
    userVisibility: 'hidden',
    groupId: 'method',
    source: 'RE',
    target: 'BR',
    specRef: '§3.3 Step 3 — [Req 83, 84]; §5.8.1.1 [Req 256–261]',
    payloadType: 'form',
    payload: {
      iframeId: 'threeDSMethodIframe',
      style: 'visibility: hidden; width: 1px; height: 1px;',
      allowfullscreen: 'false',
      allowpaymentrequest: 'false',
      srcdoc: '<form id="threeDSMethodForm" method="POST"></form>',
      sandbox: 'allow-forms allow-scripts allow-same-origin',
      action: 'Inject hidden iframe into DOM'
    },
    payloadTitle: 'Hidden iframe DOM Injection',
    isActive: (s) => s.deviceChannel !== 'app' && s.methodPath === 'executed'
  },
  {
    id: 'step_4a',
    num: '4a',
    label: 'POSTs threeDSMethodData to ACS',
    detail: 'The hidden iframe automatically POSTs a form containing Base64url-encoded threeDSMethodData (with 3DS Server Transaction ID + 3DS Method Notification URL) to the ACS 3DS Method URL via HTTP POST over a server-authenticated TLS session.',
    userExperience: 'HIDDEN — the browser does this on the user\'s behalf inside the invisible iframe. The user sees a spinner on the checkout button at most.',
    whyItMatters: 'This is the one piece of data the ACS needs to know the fingerprint belongs to a specific 3DS Server Transaction ID. Without it, the fingerprint is un-attributable.',
    approxTime: '~100–300 ms',
    userVisibility: 'hidden',
    groupId: 'method',
    source: 'BR',
    target: 'ACS',
    specRef: '§3.3 Step 4 — Browser and ACS [Req 85]; §5.8.1.1 [Req 261]',
    payloadType: 'form',
    payload: {
      methodUrl: 'https://acs.issuer-bank.com/3ds-method/collect',
      fields: {
        threeDSMethodData: 'eyJ0aHJlZURTU2VydmVyVHJhbnNJRCI6IjhhMWIyYzNkLTRlNWYtNmE3Yi04YzlkLTBlMWYyYTNiNGM1ZCIsInRocmVlRFNNZXRob2ROb3RpZmljYXRpb25VUkwiOiJodHRwczovL2dhdGV3YXkucGF5bWVudC5jb20vM2RzLW5vdGlmeV91cmwifQ'
      },
      decodedData: {
        threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
        threeDSMethodNotificationURL: 'https://gateway.payment.com/3ds-notify_url'
      }
    },
    payloadTitle: 'HTTP POST — threeDSMethodData',
    isActive: (s) => s.deviceChannel !== 'app' && s.methodPath === 'executed'
  },
  {
    id: 'step_4b',
    num: '4b',
    label: 'Gathers Device Information',
    detail: 'The ACS interacts with the Cardholder Browser via the HTML iframe to gather additional browser and device information. It stores the gathered data against the 3DS Server Transaction ID for correlation when the AReq message arrives.',
    userExperience: 'HIDDEN — the iframe may make further requests to ACS sub-resources. The user sees nothing.',
    whyItMatters: 'The richer the device fingerprint, the better the ACS risk score. This is the data the ACS uses to make a frictionless decision later.',
    approxTime: '~200–800 ms',
    userVisibility: 'hidden',
    groupId: 'method',
    source: 'ACS',
    target: null,
    specRef: '§5.8.1.1 [Req 262] — ACS stores values with Trans ID',
    payloadType: 'json',
    payload: {
      gatheringStatus: 'COMPLETED',
      threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
      detailsGathered: {
        canvasHash: '98ea710c',
        pluginsList: ['PDF Viewer', 'Chrome PDF Plugin'],
        systemFonts: ['Arial', 'Helvetica', 'Times New Roman'],
        webGlVendor: 'Google Inc. (Intel)',
        audioContextHash: '20c3a2f1'
      }
    },
    payloadTitle: 'ACS Device Fingerprint Data',
    isActive: (s) => s.deviceChannel !== 'app' && s.methodPath === 'executed'
  },
  {
    id: 'step_4c',
    num: '4c',
    label: 'POSTs Completion Notification',
    detail: 'The ACS recalls the 3DS Server Transaction ID, Base64url encodes it as a threeDSMethodData JSON object, and sends it via HTTP POST through the iframe to the 3DS Method Notification URL. This notifies the 3DS Requestor that data collection is complete.',
    userExperience: 'HIDDEN — still inside the iframe.',
    whyItMatters: 'This is the "completion signal" that lets the 3DS Server set `threeDSCompInd = Y` and proceed to send the AReq.',
    approxTime: '~50–150 ms',
    userVisibility: 'hidden',
    groupId: 'method',
    source: 'ACS',
    target: 'BR',
    specRef: '§5.8.1.1 [Req 263] — ACS notification POST',
    payloadType: 'form',
    payload: {
      notificationUrl: 'https://gateway.payment.com/3ds-notify_url',
      fields: {
        threeDSMethodData: 'eyJ0aHJlZURTU2VydmVyVHJhbnNJRCI6IjhhMWIyYzNkLTRlNWYtNmE3Yi04YzlkLTBlMWYyYTNiNGM1ZCJ9'
      },
      decodedData: {
        threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d'
      }
    },
    payloadTitle: 'ACS Completion POST',
    isActive: (s) => s.deviceChannel !== 'app' && s.methodPath === 'executed'
  },
  {
    id: 'step_4d',
    num: '4d',
    label: 'Receives Method Notification',
    detail: 'The Browser receives the notification, forwarding it to the 3DS Requestor Environment. The 3DS Requestor notifies the 3DS Server that the 3DS Method completed successfully.',
    userExperience: 'HIDDEN — the user\'s checkout button may un-disable if it had been disabled.',
    whyItMatters: 'Closes the loop. Without this notification the 5-second timer fires and `threeDSCompInd` is set to N.',
    approxTime: '~10 ms',
    userVisibility: 'hidden',
    groupId: 'method',
    source: 'BR',
    target: 'RE',
    specRef: '§5.8.1.1 [Req 315] — Notification triggers CompInd = Y',
    payloadType: 'info',
    payload: {
      eventType: 'message',
      iframeOrigin: 'https://acs.issuer-bank.com',
      data: 'MethodCompletedSuccessfully',
      threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d'
    },
    payloadTitle: 'Browser Notification Event',
    isActive: (s) => s.deviceChannel !== 'app' && s.methodPath === 'executed'
  },
  {
    id: 'step_4e',
    num: '4e',
    label: 'Reports Completion to Server',
    detail: 'The 3DS Requestor Environment notifies the 3DS Server that the 3DS Method completed. The 3DS Server sets the 3DS Method Completion Indicator = Y for inclusion in the AReq.',
    userExperience: 'HIDDEN.',
    whyItMatters: 'Final step of the 3DS Method. The 3DS Server now has explicit permission to use the fingerprint when building the AReq.',
    approxTime: '<10 ms',
    userVisibility: 'hidden',
    groupId: 'method',
    source: 'RE',
    target: 'S',
    specRef: '§5.8.1.1 [Req 315] — Set CompInd = Y upon notification',
    payloadType: 'json',
    payload: {
      threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
      threeDSCompInd: 'Y'
    },
    payloadTitle: 'Method Completion Report',
    isActive: (s) => s.deviceChannel !== 'app' && s.methodPath === 'executed'
  },

  // SCENARIO C: Method URL Unavailable
  {
    id: 'step_3c1',
    num: '3c',
    label: 'No 3DS Method URL Available',
    detail: 'The 3DS Method URL does not exist for this card range in the cached PRes data. The 3DS Requestor notifies the 3DS Server, which sets the 3DS Method Completion Indicator = U (Unavailable).',
    userExperience: 'Silent.',
    whyItMatters: 'Some issuers choose not to expose a 3DS Method URL. The ACS will fall back to AReq data alone for risk scoring.',
    approxTime: '<10 ms',
    userVisibility: 'silent',
    groupId: 'method',
    source: 'RE',
    target: 'S',
    specRef: '§5.8.1.1 — No Method URL → CompInd = U',
    payloadType: 'json',
    payload: {
      threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
      threeDSCompInd: 'U',
      reason: 'No threeDSMethodURL in cached PRes for this card range'
    },
    payloadTitle: 'Method Unavailable Notification',
    isActive: (s) => s.deviceChannel !== 'app' && s.methodPath === 'unavailable'
  },

  // SCENARIO D: Method Timeout
  {
    id: 'step_3d',
    num: '3d',
    label: 'Timeout → threeDSCompInd = N',
    detail: 'The 3DS Method was triggered but the 3DS Server did not receive a completion notification within the 5-second threshold. The 3DS Server sets the 3DS Method Completion Indicator = N (not completed).',
    userExperience: 'Silent — the user just sees the page sit for ~5 seconds. The transaction will still proceed.',
    whyItMatters: 'A timeout should not block the transaction; it just means the ACS will have less data.',
    approxTime: '5 s',
    userVisibility: 'silent',
    groupId: 'method',
    source: 'S',
    target: null,
    specRef: '§5.8.1.1 [Req 315] — CompInd = N if no response in 5s',
    payloadType: 'json',
    payload: {
      threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
      threeDSCompInd: 'N',
      reason: 'No completion notification within 5000ms'
    },
    payloadTitle: 'Method Timeout',
    isActive: (s) => s.deviceChannel !== 'app' && s.methodPath === 'timeout'
  },

  // ──────────────────────────────────────────────────────────────
  // STEP 5: The 3DS Requestor Environment (§3.3 Step 5)
  // "Responsible for gathering the information for the AReq
  //  message assembled by the 3DS Server."
  // ──────────────────────────────────────────────────────────────
  {
    id: 'step_5',
    num: '5',
    label: 'Gathers AReq Data',
    detail: 'The 3DS Requestor Environment gathers all information needed for the AReq message: Cardholder Account Information, Merchant Risk Indicator, 3DS Requestor Authentication Info, Payment Information, and browser parameters. This data is made available to the 3DS Server over a TLS-secured link.',
    userExperience: 'Silent — happens before the user-visible submit.',
    whyItMatters: 'This is the data the 3DS Server will package into the AReq. The richer it is, the better the ACS can make a risk decision.',
    approxTime: '~10–50 ms',
    userVisibility: 'silent',
    groupId: 'areq',
    source: 'RE',
    target: 'S',
    specRef: '§3.3 Step 5 — The 3DS Requestor Environment [Req 86, 301]',
    payloadType: 'json',
    payload: {
      threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
      acctNumber: '4000123456789010',
      cardholderName: 'Jane Doe',
      purchaseAmount: '27998',
      purchaseCurrency: '840',
      purchaseExponent: '2',
      merchantRiskIndicator: { shipIndicator: '01', deliveryTimeframe: '02' },
      browserAcceptHeader: 'text/html,application/xhtml+xml',
      browserIP: '198.51.100.42',
      browserJavaEnabled: false,
      browserJavaScriptEnabled: true,
      browserLanguage: 'en-US',
      browserColorDepth: '24',
      browserScreenHeight: '1080',
      browserScreenWidth: '1920',
      browserTZ: '-360',
      browserUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      // Table B.1 enumerates ~150 fields; the listed names are the ones provided here.
      fieldsProvided: [
        'acctNumber', 'cardholderName', 'purchaseAmount', 'purchaseCurrency', 'purchaseExponent',
        'merchantRiskIndicator', 'browserAcceptHeader', 'browserIP', 'browserJavaEnabled',
        'browserJavaScriptEnabled', 'browserLanguage', 'browserColorDepth',
        'browserScreenHeight', 'browserScreenWidth', 'browserTZ', 'browserUserAgent',
        'threeDSRequestorID', 'threeDSRequestorURL', 'notificationURL',
        'merchantName', 'merchantCountryCode', 'mcc', 'purchaseDate'
      ]
    },
    payloadTitle: 'Transaction + Browser Data for AReq',
    isActive: () => true
  },
  {
    id: 'step_5b',
    num: '5b',
    label: 'Checks 3DS Method Freshness',
    detail: 'Before sending the AReq, the 3DS Server verifies that the executed 3DS Method is still fresh for the same card, device, and Browser. If the last successful method execution is older than 10 minutes, the 3DS Requestor must re-run it instead of reusing stale fingerprint data.',
    userExperience: 'Silent — this is an internal guardrail just before the AReq is assembled.',
    whyItMatters: 'This is the freshness check from [Req 416]. It prevents the ACS from making a decision using stale or mismatched Browser fingerprint data.',
    approxTime: '<1 ms',
    userVisibility: 'silent',
    groupId: 'areq',
    source: 'S',
    target: null,
    specRef: '§5.8.1.2 — Freshness check before AReq [Req 416]',
    payloadType: 'json',
    payload: {
      priorMethodAgeSeconds: 480,
      sameCard: true,
      sameBrowser: true,
      sameDevice: true,
      withinReuseWindow: true,
      action: 'Reuse existing 3DS Method result'
    },
    payloadTitle: '3DS Method Freshness Check',
    isActive: (s) => s.deviceChannel !== 'app'
  },

  // ──────────────────────────────────────────────────────────────
  // STEP 6: The 3DS Server (§3.3 Step 6)
  // "Obtains IDs, formats AReq, sends to DS."
  // ──────────────────────────────────────────────────────────────
  {
    id: 'step_6a',
    num: '6a',
    label: 'Formats AReq Message',
    detail: 'The 3DS Server obtains the 3DS Requestor ID, 3DS Server Reference Number, and Acquirer BIN. It determines the highest common protocol version from the cached PRes, establishes a secure link with the DS, and formats the AReq message for the active device channel: `deviceChannel = 02` for browser with browser telemetry, or `deviceChannel = 01` for app with SDK identifiers, encrypted SDK data, and SDK capability fields. In both paths it preserves the requestor challenge preference and other risk-relevant data elements.',
    userExperience: 'Silent — internal step.',
    whyItMatters: 'The 3DS Server is the one that defines the AReq structure and selects the version. It stitches together data from the requestor, the browser fingerprint, and the cached PRes into one AReq envelope, while ensuring browser data is transaction-unique and not hard-coded.',
    approxTime: '~5–20 ms',
    userVisibility: 'silent',
    groupId: 'areq',
    source: 'S',
    target: null,
    specRef: '§3.3 Step 6 — The 3DS Server [Req 87–92, 422]; Table B.1',
    payloadType: 'json',
    // v2.1.0 / v2.2.0 / v2.3.1 / v2.4.0 — the wire shape is
    // generated from the versioned payload registry. The active
    // protocol version is read from `scenario.protocolVersion`.
    messageType: 'AReq',
    payloadTitle: 'AReq Message Draft',
    isActive: () => true
  },
  {
    id: 'step_6b',
    num: '6b',
    label: 'Sends AReq → DS',
    detail: 'The 3DS Server sends the formatted AReq message to the Directory Server using the secured TLS link established in [Req 90].',
    userExperience: 'Silent — the 3DS Server is talking to the DS on the user\'s behalf.',
    whyItMatters: 'This is the protocol\'s "main" message. Everything in the AReq is governed by per-element error rules in §A.9; a single invalid value can fail the whole flow.',
    approxTime: '~50–200 ms',
    userVisibility: 'silent',
    groupId: 'areq',
    source: 'S',
    target: 'DS',
    specRef: '§3.3 Step 6 — [Req 91, 92] Send AReq to DS',
    payloadType: 'json',
    payload: {
      postUrl: 'https://directoryserver.visa.com/3ds/areq',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip'
      },
      body: {
        messageType: 'AReq',
        messageVersion: '2.3.1',
        messageCategory: '01',
        deviceChannel: '02',
        threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
        threeDSServerRefNumber: 'SRV-REF-001',
        threeDSRequestorID: 'REQ-MERCH-001',
        threeDSRequestorURL: 'https://merchant.example.com/checkout',
        notificationURL: 'https://gateway.payment.com/3ds-notify_url',
        threeDSRequestorChallengeInd: ['01'],
        threeDSCompInd: 'Y',
        acquirerBIN: '453201',
        acquirerMerchantID: 'MERCH_987654321',
        acctNumber: '4000123456789010',
        merchantName: 'ExampleMart',
        merchantCountryCode: '840',
        mcc: '5411',
        purchaseAmount: '27998',
        purchaseCurrency: '840',
        purchaseExponent: '2',
        purchaseDate: '20260710160715',
        acctID: 'cust-18370019',
        billAddrCity: 'San Francisco',
        billAddrCountry: '840',
        shipAddrCity: 'San Francisco',
        shipAddrCountry: '840',
        merchantRiskIndicator: {
          shipIndicator: '01',
          deliveryTimeframe: '01',
          reorderItemsInd: '01',
          preOrderPurchaseInd: '01'
        },
        messageExtension: [
          {
            name: 'merchant-risk-v1',
            id: 'ext-risk-001',
            criticalityIndicator: false,
            data: {
              cartValueBand: 'mid',
              accountAgeDays: 620
            }
          }
        ],
        browserIP: '198.51.100.42',
        browserAcceptHeader: 'text/html,application/xhtml+xml',
        browserLanguage: 'en-US',
        browserUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        browserScreenWidth: '1920',
        browserScreenHeight: '1080',
        browserColorDepth: '24',
        browserTZ: '-360',
        browserJavaEnabled: 'false',
        browserJavascriptEnabled: 'true'
      }
    },
    payloadTitle: 'AReq Network Transmission',
    isActive: () => true
  },

  // ──────────────────────────────────────────────────────────────
  // STEP 7: The DS (§3.3 Step 7)
  // "Receives AReq, validates, generates DS Trans ID, checks
  //  version and card range, forwards to ACS."
  // ──────────────────────────────────────────────────────────────
  {
    id: 'step_7a',
    num: '7a',
    label: 'Validates AReq at DS',
    detail: 'The DS receives the AReq, validates it per §5.9.1, generates the DS Transaction ID, checks the Message Version Number is supported, verifies the 3DS Server Reference Number, validates the MCC, and confirms the account number is in a participating range with an ACS capable of processing 3DS messages.',
    userExperience: 'Silent — happens between the 3DS Server and the DS.',
    whyItMatters: 'The DS is the routing authority. Its `dsTransID` is the only way the ACS can find the correct AReq when the 3DS Server retries due to a transient error.',
    approxTime: '~20–100 ms',
    userVisibility: 'silent',
    groupId: 'ds_validation',
    source: 'DS',
    target: null,
    specRef: '§3.3 Step 7 — The DS [Req 93–101]',
    payloadType: 'json',
    payload: {
      dsTransID: 'd9e8f7a6-b5c4-d3e2-f1a0-b9c8d7e6f5a4',
      validationResult: 'SUCCESS',
      versionSupported: true,
      serverRefValid: true,
      participatingRange: true,
      acsCapable: true,
      routingDest: 'ISSUER_ACS_34'
    },
    payloadTitle: 'DS Validation & Routing',
    isActive: (s) => s.dsRouting === 'normal'
  },

  // DS Error Path
  {
    id: 'step_7err1',
    num: '7✗',
    label: 'Returns Error / Status to Server',
    detail: 'Due to validation failure, unsupported version, non-participating card range, or inability to reach the ACS, the DS returns an Error Message or an ARes with an appropriate Transaction Status directly to the 3DS Server. Error Component = D identifies the DS as the source. The 3DS Server will end 3-D Secure processing in this path.',
    userExperience: 'Silent — but the user will likely see "Authentication failed" on the merchant site.',
    whyItMatters: 'The 3DS Server must map every Error Code to a `transStatus` (see Table A.10). A code 405 here becomes transStatus = U for the merchant.',
    approxTime: '~50–500 ms',
    userVisibility: 'silent',
    groupId: 'ds_validation',
    source: 'DS',
    target: 'S',
    specRef: '§3.3 Step 7 — [Req 95–101, 233, 235]; §A.9 Error Codes',
    payloadType: 'json',
    // Versioned via the payload registry; honours scenario.protocolVersion.
    messageType: 'Erro',
    payloadTitle: 'DS Error Response',
    isActive: (s) => s.dsRouting === 'failure'
  },
  {
    id: 'step_7err2',
    num: '10✗',
    label: 'Returns Error to Merchant',
    detail: 'The 3DS Server maps the DS error and returns a failed result to the 3DS Requestor Environment, ending 3DS processing. The merchant should treat this as authentication failure and decline, or fall back to its own risk model.',
    userExperience: 'Silent on the wire; visible on the merchant site as an "Authentication failed" or "We could not process your payment" message.',
    whyItMatters: 'The 3DS Server MUST map every Error Message to a transStatus so the merchant can decide between decline, retry, or fallback to non-3DS authorization.',
    approxTime: '<10 ms',
    userVisibility: 'visible',
    groupId: 'completion',
    source: 'S',
    target: 'RE',
    specRef: '§3.3 Step 10 — 3DS Server error path',
    payloadType: 'json',
    payload: {
      status: 'AUTHENTICATION_ERROR',
      reason: 'DIRECTORY_SERVER_ERROR',
      transStatus: 'U',
      messageType: 'Erro'
    },
    payloadTitle: 'Server Error Response',
    isActive: (s) => s.dsRouting === 'failure'
  },

  // DS Normal Forward
  {
    id: 'step_7b',
    num: '7b',
    label: 'Forwards AReq → ACS',
    detail: 'The DS stores the 3DS Server URL with the DS Transaction ID (for possible later RReq processing), establishes a secure link with the ACS, and forwards the AReq message.',
    userExperience: 'Silent.',
    whyItMatters: 'The DS is the only entity that knows where to find the ACS for a given card range. The 3DS Server does not need to know the ACS address.',
    approxTime: '~50–300 ms',
    userVisibility: 'silent',
    groupId: 'ds_validation',
    source: 'DS',
    target: 'ACS',
    specRef: '§3.3 Step 7 — [Req 99–101] Store URL, forward AReq',
    payloadType: 'json',
    payload: {
      body: {
        messageType: 'AReq',
        threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
        dsTransID: 'd9e8f7a6-b5c4-d3e2-f1a0-b9c8d7e6f5a4',
        acctNumber: '4000123456789010',
        deviceChannel: '02',
        threeDSCompInd: 'Y',
        purchaseAmount: '27998'
      }
    },
    payloadTitle: 'Forwarded AReq',
    isActive: (s) => s.dsRouting === 'normal'
  },

  // ──────────────────────────────────────────────────────────────
  // STEP 8: The ACS (§3.3 Step 8)
  // "Validates AReq, correlates 3DS Method, evaluates risk,
  //  determines Transaction Status, generates ARes."
  // ──────────────────────────────────────────────────────────────
  {
    id: 'step_8a',
    num: '8a',
    label: 'Validates AReq & Generates ACS Trans ID',
    detail: 'The ACS receives the AReq from the DS, validates it per §5.9.2, checks device support using the channel-appropriate data set, retrieves data from a previous 3DS Method execution for browser flows when present, validates SDK-facing challenge inputs for app flows, and generates the ACS Transaction ID.',
    userExperience: 'Silent.',
    whyItMatters: 'This is the correlation step: ACS matches the incoming AReq\'s 3DS Server Trans ID with the fingerprint it stored during step 4b. If the IDs don\'t match, the fingerprint is discarded.',
    approxTime: '~10–50 ms',
    userVisibility: 'silent',
    groupId: 'acs_decision',
    source: 'ACS',
    target: null,
    specRef: '§3.3 Step 8 — The ACS [Req 102–104]',
    payloadType: 'json',
    payload: {
      acsTransID: 'c7d8e9f0-a1b2-c3d4-e5f6-a7b8c9d0e1f2',
      threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
      validationResult: 'SUCCESS',
      deviceSupported: true,
      methodDataCorrelated: true,
      correlatedDataPoints: ['canvasHash', 'webGlVendor', 'systemFonts']
    },
    payloadTitle: 'ACS Validation & Correlation',
    isActive: (s) => s.dsRouting === 'normal'
  },
  {
    id: 'step_8b',
    num: '8b',
    label: 'Risk-Based Authentication Decision',
    detail: 'The ACS evaluates the AReq data — including the 3DS Requestor Challenge Indicator, Authentication Indicator, Decoupled Request Indicator, and all browser/device signals — to determine the Transaction Status. If the result is `C`, the downstream 3DS Server/3DS Requestor will later evaluate the 3DS Requestor Challenge Indicator, the ACS Challenge Mandated Indicator, and the ACS Rendering Type before deciding whether to actually perform the browser challenge.',
    userExperience: 'Silent — this is the key moment. The ACS is making a risk decision in real time that determines whether the user will be challenged or pass frictionlessly.',
    whyItMatters: 'This single decision splits the entire flow: Y = authenticated, A = attempts, N/R = negative, C = challenge, D = decoupled. The direct ARes path exits here.',
    approxTime: '~50–500 ms (risk engine latency)',
    userVisibility: 'silent',
    groupId: 'acs_decision',
    source: 'ACS',
    target: null,
    specRef: '§3.3 Step 8 — [Req 105–108] Evaluate & determine status',
    payloadType: 'json',
    payload: {
      riskScore: 12,
      deviceReputation: 'GOOD',
      ipGeoMatch: true,
      threeDSRequestorChallengeInd: ['01'],
      acsRenderingType: { acsInterface: '02', acsUiTemplate: '01' },
      decision: 'FRICTIONLESS',
      transStatus: 'Y',
      eci: '05',
      authenticationValue: 'AAABBiiihH8DAAAAAABiSBI='
    },
    payloadTitle: 'ACS Risk Assessment & Decision',
    isActive: (s) => s.dsRouting === 'normal'
  },
  {
    id: 'step_8c',
    num: '8c',
    label: 'Sends ARes → DS',
    detail: 'The ACS formats the ARes message (per Table B.2) with the Transaction Status, ECI, Authentication Value (CAVV), ACS Transaction ID and ACS Reference Number, then sends it to the DS using the secure link.',
    userExperience: 'Silent.',
    whyItMatters: 'The Authentication Value (CAVV) generated here is the cryptographic proof the merchant needs to submit with the standard authorization message. It is the whole point of 3DS.',
    approxTime: '~50–200 ms',
    userVisibility: 'silent',
    groupId: 'acs_decision',
    source: 'ACS',
    target: 'DS',
    specRef: '§3.3 Step 8 — [Req 110, 111] Format & send ARes to DS',
    payloadType: 'json',
    // Versioned via the payload registry. v2.1.0 carries
    // authenticationType (string); v2.3.1 carries authenticationMethod
    // (expanded enum) and trustListStatus (renamed from whiteListStatus).
    messageType: 'ARes',
    payloadTitle: 'ARes Message',
    isActive: (s) => s.dsRouting === 'normal'
  },

  // ──────────────────────────────────────────────────────────────
  // STEP 9: The DS (§3.3 Step 9)
  // "Validates ARes, logs transaction, forwards to 3DS Server."
  // ──────────────────────────────────────────────────────────────
  {
    id: 'step_9a',
    num: '9a',
    label: 'Validates ARes at DS',
    detail: 'The DS checks the ACS Reference Number, receives and validates the ARes message per §5.9.3, and logs transaction information as required by DS rules.',
    userExperience: 'Silent.',
    whyItMatters: 'The DS is the audit trail. Every authentication attempt (success or failure) is logged at the DS for dispute resolution.',
    approxTime: '~5–30 ms',
    userVisibility: 'silent',
    groupId: 'ares',
    source: 'DS',
    target: null,
    specRef: '§3.3 Step 9 — The DS [Req 306, 112–113]',
    payloadType: 'json',
    payload: {
      dsTransID: 'd9e8f7a6-b5c4-d3e2-f1a0-b9c8d7e6f5a4',
      validationStatus: 'SUCCESS',
      acsRefNumberVerified: true,
      transactionLogged: true
    },
    payloadTitle: 'DS ARes Validation & Logging',
    isActive: (s) => s.dsRouting === 'normal'
  },
  {
    id: 'step_9b',
    num: '9b',
    label: 'Forwards ARes → 3DS Server',
    detail: 'The DS forwards the validated ARes message to the 3DS Server using the secure link.',
    userExperience: 'Silent.',
    whyItMatters: 'Closes the round-trip; the 3DS Server can now finalize the authentication result for the merchant.',
    approxTime: '~10–50 ms',
    userVisibility: 'silent',
    groupId: 'ares',
    source: 'DS',
    target: 'S',
    specRef: '§3.3 Step 9 — [Req 114] Forward ARes to 3DS Server',
    payloadType: 'json',
    payload: {
      messageType: 'ARes',
      threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
      dsTransID: 'd9e8f7a6-b5c4-d3e2-f1a0-b9c8d7e6f5a4',
      transStatus: 'Y'
    },
    payloadTitle: 'ARes Forward',
    isActive: (s) => s.dsRouting === 'normal'
  },

  // ──────────────────────────────────────────────────────────────
  // STEP 10: The 3DS Server (§3.3 Step 10)
  // "Receives ARes, communicates result to 3DS Requestor."
  // ──────────────────────────────────────────────────────────────

  // Direct ARes Path (Y/A)
  {
    id: 'step_10a',
    num: '10',
    label: 'transStatus = Y/A → Direct ARes Outcome',
    detail: 'The 3DS Server receives and validates the ARes per §5.9.4. For `Y`, the issuer authenticated the transaction and the ACS-provided ECI and Authentication Value are carried forward for authorisation. For `A`, the issuer recorded an attempts result rather than full authentication, so the requestor must preserve the attempts semantics instead of treating it as equivalent to `Y`.',
    userExperience: 'Silent — the user still sees only the "Pay" button click they made earlier. The page will progress to confirmation.',
    whyItMatters: 'The ACS, not the 3DS Server, creates the authentication value. The 3DS Server must preserve what the issuer returned and keep `A` distinct from a fully authenticated `Y` outcome.',
    approxTime: '~5–30 ms',
    userVisibility: 'visible',
    groupId: 'ares',
    source: 'S',
    target: 'RE',
    specRef: '§3.3 Step 10 — [Req 115, 116] Y/A result handling',
    payloadType: 'json',
    payload: (s) => ({
      status: s.transStatus === 'Y' ? 'AUTHENTICATED' : 'ATTEMPTS_PROCESSED',
      transStatus: s.transStatus,
      eci: s.transStatus === 'Y' ? '05' : '06',
      authenticationValue: s.transStatus === 'Y'
        ? 'AAABBiiihH8DAAAAAABiSBI='
        : 'AAABCiQ1R2gDAAAAAABjTDE='
    }),
    payloadTitle: 'Direct ARes Result (Y/A)',
    isActive: (s) => s.dsRouting === 'normal' && (s.transStatus === 'Y' || s.transStatus === 'A')
  },

  // Failure Path (N/U/R)
  {
    id: 'step_10b',
    num: '10',
    label: 'transStatus = N/U/R → Not Authenticated',
    detail: 'For a non-authenticated transaction (N, U, or R), the 3DS Server sends the ARes information to the 3DS Requestor Environment. Authentication failed (N), could not be performed (U), or the Issuer rejected it (R).',
    userExperience: 'Visible — the user will see a "Payment declined" or "Authentication failed" message on the merchant site. The purchase cannot proceed via 3DS.',
    whyItMatters: 'The merchant can choose to retry, fall back to its own non-3DS risk model, or decline. Most merchants decline on N for liability reasons.',
    approxTime: '~5–30 ms',
    userVisibility: 'visible',
    groupId: 'ares',
    source: 'S',
    target: 'RE',
    specRef: '§3.3 Step 10 — [Req 118] Not authenticated result',
    payloadType: 'json',
    payload: {
      status: 'NOT_AUTHENTICATED',
      transStatus: 'N',
      reason: 'ACS returned negative Transaction Status'
    },
    payloadTitle: 'Authentication Result (Failure)',
    isActive: (s) => s.dsRouting === 'normal' && (s.transStatus === 'N' || s.transStatus === 'U' || s.transStatus === 'R')
  },

  // Challenge Path (C)
  {
    id: 'step_10c',
    num: '10',
    label: 'transStatus = C → Start Challenge',
    detail: 'The 3DS Server receives the ARes with `transStatus = C`, evaluates the 3DS Requestor Challenge Indicator, the ACS Challenge Mandated Indicator, and the ACS Rendering Type, and then passes the challenge-start data to the 3DS Requestor Environment. This handoff includes the ACS URL, rendering hints, and any cardholder information text needed to start the correct channel-specific path: browser POST + iframe in browser flows, or 3DS SDK challenge invocation in app flows. If challenge is mandated by the ACS or by the requestor itself, the requestor-side opt-out branch is not available.',
    userExperience: 'Visible — the checkout pauses and the issuer challenge surface is about to appear.',
    whyItMatters: 'This is the exact fork where frictionless ends. From here, the simulator must branch into the correct channel-specific challenge path instead of treating app as browser with different labels.',
    approxTime: '~5–30 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'S',
    target: 'RE',
    specRef: '§3.3 Step 10 — Challenge handling [Req 117, 356]',
    payloadType: 'json',
    payload: {
      status: 'CHALLENGE_REQUIRED',
      transStatus: 'C',
      acsURL: 'https://acs.issuer-bank.com/challenge',
      acsChallengeMandated: 'N',
      threeDSRequestorChallengeInd: ['01'],
      acsRenderingType: { acsInterface: '02', acsUiTemplate: '01' },
      cardholderInfoText: 'To continue, complete the identity check from your card issuer.',
      messageVersion: '2.3.1'
    },
    payloadTitle: 'Challenge Start Data',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C'
  },

  // Direct Decoupled Path (D) — native browser branch from ARes Step 8/10
  {
    id: 'step_10d',
    num: '10',
    label: 'transStatus = D → Decoupled Authentication',
    detail: 'The 3DS Server receives the ARes with `transStatus = D` and, per [Req 327], passes the necessary ARes information to the 3DS Requestor Environment. There is no challenge CReq/CRes loop here and no interactive challenge surface is started. The ACS will authenticate the cardholder out-of-band and deliver the result via an RReq message at a later time.',
    userExperience: 'Visible — the checkout pauses and the user is told to complete authentication in another issuer-controlled channel.',
    whyItMatters: 'This is the direct decoupled path. The challenge never started; the issuer already opted into the asynchronous flow at ARes time, so the 3DS Server now waits for the ACS to send the RReq per [Req 347].',
    approxTime: '~5–30 ms (then async)',
    userVisibility: 'visible',
    groupId: 'ares',
    source: 'S',
    target: 'RE',
    specRef: '§3.3 Step 10 — [Req 327] Decoupled Authentication result; next step is Step 16',
    payloadType: 'json',
    payload: {
      status: 'DECOUPLED_AUTHENTICATION',
      transStatus: 'D',
      cardholderInfoText: 'Approve this transaction in your banking app to continue.',
      acsRenderingType: { acsInterface: '02', acsUiTemplate: '01' },
      messageVersion: '2.3.1'
    },
    payloadTitle: 'Decoupled Authentication Start',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'D'
  },

  // Challenge Opt-Out (C → 3DS Server/Requestor declines to perform challenge)
  {
    id: 'step_10e',
    num: '10',
    label: '3DS Server Opts Out of Challenge',
    detail: 'The 3DS Server received ARes = C and, per [Req 117].a, evaluated the 3DS Requestor Challenge Indicator, the ACS Challenge Mandated Indicator, and the ACS Rendering Type. The 3DS Server (or downstream 3DS Requestor) decided not to perform the requested challenge. This branch is only valid when the merchant did not mandate challenge itself and the ACS did not mandate it. Per [Req 117].a, the 3DS Server must still receive the RReq from the DS, validate it (§5.9.9), and reply with an RRes carrying `resultsStatus = 02` ("CReq not sent to ACS by 3DS Requestor") so the ACS is told that no challenge was performed.',
    userExperience: 'Visible — the merchant may briefly show the challenge start UI, but the iframe closes quickly because the CReq is never posted to the ACS. The cardholder never enters the issuer challenge surface.',
    whyItMatters: 'This is the v2.3.1 "do not perform the challenge" branch. Without `resultsStatus = 02`, the ACS would never know whether the challenge was skipped or whether a delivery error occurred, and the merchant would have no auditable proof that the opt-out was communicated.',
    approxTime: '~5–30 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'S',
    target: 'RE',
    specRef: '§3.3 Step 10 — [Req 117].a 3DS Requestor continues without performing challenge; resultsStatus = 02',
    payloadType: 'json',
    payload: {
      status: 'CHALLENGE_OPTED_OUT',
      transStatus: 'C',
      decision: 'do_not_perform_challenge',
      threeDSRequestorChallengeInd: ['02'],
      acsChallengeMandated: 'N',
      messageVersion: '2.3.1'
    },
    payloadTitle: 'Challenge Opt-Out Decision',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'optout' && s.challengeMandated === 'N' && s.challengePreference !== '04'
  },

  // Information Only (I) — informational ARes, no authentication, no liability shift
  {
    id: 'step_10f',
    num: '10',
    label: 'transStatus = I → Information Only',
    detail: 'The 3DS Server received the ARes with `transStatus = I`. This is the "Information Only" outcome added in 2.3.0 and used primarily by 3RI (3DS Requestor Initiated) flows such as card-on-file, recurring, instalment, and data-only requests. The ACS is acknowledging the message and providing the data elements the merchant needs, but it has NOT performed authentication. There is no authentication value, no liability shift, and no challenge surface ever appears in the browser. The merchant must apply its own risk model to the data the ACS did return.',
    userExperience: 'Visible-but-quiet — the cardholder sees no challenge surface. The merchant may show a confirmation screen based on the ARes data (e.g. account or device information).',
    whyItMatters: 'Omitting `I` from the model under-represents the 2.3.x data-only and 3RI flows. Conflating `I` with `Y` is a common real-world bug and a frequent source of audit findings because it implies an authentication that did not actually happen.',
    approxTime: '~5–30 ms',
    userVisibility: 'silent',
    groupId: 'ares',
    source: 'S',
    target: 'RE',
    specRef: '§3.3 Step 8/10 — transStatus = I (Information Only), 2.3.0+; 3RI flow',
    payloadType: 'json',
    payload: {
      status: 'INFORMATION_ONLY',
      transStatus: 'I',
      authenticationValue: null,
      eci: null,
      cardholderInfoText: 'Information-only acknowledgement; no authentication performed.',
      messageVersion: '2.3.1',
      dataOnly: true
    },
    payloadTitle: 'Information Only ARes',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'I'
  },

  // Secure Payment Confirmation (S) — 2.3.0+ WebAuthn path in browser
  {
    id: 'step_10g',
    num: '10',
    label: 'transStatus = S → Secure Payment Confirmation (SPC)',
    detail: 'The 3DS Server received the ARes with `transStatus = S`. The 2.3.0+ Secure Payment Confirmation flow lets the ACS issue a WebAuthn assertion to the browser (or App), and the merchant uses the resulting SPC authentication value in authorisation. There is no 3DS challenge iframe and no RReq/RRes hand-off for SPC in the browser path; the SPC value flows straight from the browser into the merchant authorisation message. The merchant then resumes checkout per the new §3.3 Step 10b (SPA continuation).',
    userExperience: 'Visible — the browser or app shows a platform-native WebAuthn prompt (biometric / device PIN) and the cardholder confirms in-place.',
    whyItMatters: 'SPC is a new and growing browser-friendly authentication path that bypasses the challenge iframe entirely. Omitting `S` from the model makes the app unable to reason about the 2.3.x SPC path even though it is a first-class ARes outcome in 2.3.1.',
    approxTime: '~5–30 ms (then WebAuthn roundtrip)',
    userVisibility: 'visible',
    groupId: 'ares',
    source: 'S',
    target: 'RE',
    specRef: '§3.3 Step 8/10 — transStatus = S (SPC), 2.3.0+; §3.3 Step 10b (SPA continuation)',
    payloadType: 'json',
    payload: {
      status: 'SECURE_PAYMENT_CONFIRMATION',
      transStatus: 'S',
      acsRenderingType: { acsInterface: '02', acsUiTemplate: '04' },
      // SPC replaces the RReq/RRes loop with a direct browser -> merchant auth value.
      spcAuthenticationValue: 'MIIBszCCAVygAwIBAgII...AAABBiiihH8DAAAAAABiSBI=',
      eci: '05',
      cardholderInfoText: 'Confirm this purchase using your device biometric or PIN.',
      messageVersion: '2.3.1',
      webauthn: {
        rpId: 'issuer-bank.com',
        challenge: 'bWFrZS1hLWNoYWxsZW5nZS1zdHJpbmctMTIzNDU2',
        userVerification: 'required'
      }
    },
    payloadTitle: 'SPC ARes (WebAuthn)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'S'
  },
  {
    id: 'step_11a',
    num: '10h',
    label: 'Builds CReq Form (3DS Server → Browser)',
    detail: 'The 3DS Server formats the browser CReq message, Base64url-encodes it, and constructs an HTML form containing `creq`, `threeDSRequestorURL` (the merchant notificationURL that the ACS will POST the final CRes back to), and `threeDSSessionData` (merchant-supplied opaque session reference, also Base64url). The 3DS Server picks an iframe size from the `challengeWindowSize` enumeration in the ARes and uses it to create the challenge window. The 3DS Requestor then causes the browser to POST that form to the ACS URL from the ARes, falling back to a non-JS redirect ([Req 324]) if the browser has JavaScript disabled.',
    userExperience: 'Visible — the browser is redirected into the challenge iframe or modal container; the cardholder is now in the issuer-controlled authentication surface.',
    whyItMatters: 'Browser challenge requests are server-originated. The merchant page is only the transport that POSTs the encoded CReq into the ACS iframe. `threeDSRequestorURL` is the only addressable handle the ACS has to return the final CRes; `threeDSSessionData` is the preferred merchant correlation handle, but if it is absent, corrupted, or incorrect the merchant should fall back to the CRes transaction identifiers themselves.',
    approxTime: '~20–80 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'S',
    target: 'BR',
    specRef: '§3.3 Step 10 → Step 11 [Req 117.b–e, 324]; §5.8.2 iframe contract',
    payloadType: 'form',
    payload: {
      acsURL: 'https://acs.issuer-bank.com/challenge',
      method: 'POST',
      enctype: 'application/x-www-form-urlencoded',
      fields: {
        creq: 'eyJ0aHJlZURTU2VydmVyVHJhbnNJRCI6IjhhMWIyYzNkLTRlNWYtNmE3Yi04YzlkLTBlMWYyYTNiNGM1ZCIsImFjc1RyYW5zSUQiOiJjN2Q4ZTlmMC1hMWIyLWMzZDQtZTVmNi1hN2I4YzlkMGUxZjIiLCJ0aHJlZVNlcnZlclRyYW5zSUQiOiI4YTFiMmMzZC00ZTVmLTZhN2ItOGM5ZC0wZTFmMmEzYjRjNWQiLCJ0aHJlZURTUmVxdWVzdG9yVVJMIjoiaHR0cHM6Ly9nYXRld2F5LnBheW1lbnQuY29tLzNkcy1jaGFsbGVuZ2UtcmVzdWx0IiwibWVzc2FnZVR5cGUiOiJDUmVxIiwibWVzc2FnZVZlcnNpb24iOiIyLjMuMSIsImNoYWxsZW5nZVdpbmRvd1NpemUiOiIwNSJ9',
        threeDSSessionData: 'bWVyY2hhbnQtc2Vzc2lvbi05ZjdhMWExYQ'
      },
      decodedData: {
        messageType: 'CReq',
        messageVersion: '2.3.1',
        threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
        acsTransID: 'c7d8e9f0-a1b2-c3d4-e5f6-a7b8c9d0e1f2',
        threeDSRequestorURL: 'https://gateway.payment.com/3ds-challenge-result',
        challengeWindowSize: '05'
      },
      // §5.8.2: the 3DS Requestor picks a window size from the ARes challengeWindowSize
      // and creates the challenge iframe with these required attributes.
      iframeContract: {
        sizeFromARes: {
          '01': { w: 250, h: 400 },
          '02': { w: 390, h: 400 },
          '03': { w: 500, h: 600 },
          '04': { w: 600, h: 400 },
          '05': { w: '100%', h: '100%' }
        },
        selected: { w: 600, h: 400 },
        attributes: {
          name: 'three-ds-iframe',
          allowfullscreen: 'false',
          allowpaymentrequest: 'false',
          srcdoc: '<form id="challengeForm" method="POST"></form>',
          allow: 'payment *; publickey-credentials-get *',
          sandbox: 'allow-forms allow-scripts allow-same-origin allow-pointer-lock'
        }
      },
      // [Req 324]: ACS implementations that use JS for redirection MUST support a non-JS fallback.
      jsFallback: {
        active: true,
        strategy: 'top-level redirect with auto-submitting form',
        note: 'Per [Req 324] — required for browsers with JavaScript disabled.'
      }
    },
    payloadTitle: 'Browser CReq Form POST (§5.8.2)',
    isActive: (s) => s.deviceChannel !== 'app' && s.dsRouting === 'normal' && s.transStatus === 'C'
  },
  {
    id: 'step_11b',
    num: '10i',
    label: 'Browser POSTs CReq → ACS',
    detail: 'The browser opens the challenge iframe and submits the encoded CReq form to the ACS URL over the challenge channel. The iframe is hosted by the merchant page but its contents come entirely from the ACS. Once the POST lands, the next normative step is the ACS-side CReq validation and challenge-state initialization in Step 11.',
    userExperience: 'Visible — the challenge frame loads and begins rendering issuer content.',
    whyItMatters: 'The ACS owns the challenge user interface from this point onward. The merchant can host the frame, but it cannot control the authentication content inside it. The sandbox attributes (allow-forms, allow-scripts, allow-same-origin, allow-pointer-lock only) keep the issuer surface isolated from the merchant page.',
    approxTime: '~100–250 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'BR',
    target: 'ACS',
    specRef: '§3.3 Step 11 — ACS receives CReq [Req 119–121]; §5.8.2',
    payloadType: 'form',
    payload: {
      action: 'https://acs.issuer-bank.com/challenge',
      method: 'POST',
      fields: {
        creq: 'Base64url(CReq)',
        threeDSSessionData: 'bWVyY2hhbnQtc2Vzc2lvbi05ZjdhMWExYQ'
      }
    },
    payloadTitle: 'ACS Challenge Request',
    isActive: (s) => s.deviceChannel !== 'app' && s.dsRouting === 'normal' && s.transStatus === 'C'
  },
  {
    id: 'step_11c',
    num: '10h',
    label: 'Requestor App Invokes 3DS SDK Challenge',
    detail: 'For app-based challenge, the 3DS Requestor App passes the ARes challenge data into the on-device 3DS SDK. The SDK binds the `sdkTransID`, ACS transaction identifiers, and rendering hints, then prepares the protected SDK challenge channel to the ACS. This is not a browser form POST and it does not depend on an iframe.',
    userExperience: 'Visible — the app transitions from checkout into an issuer-controlled challenge sheet or screen.',
    whyItMatters: 'App challenge setup is SDK-originated. Treating this as a browser CReq form handoff misstates who owns the client transport and where the protected channel begins.',
    approxTime: '~20–80 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'RE',
    target: 'BR',
    specRef: 'App-based challenge start — SDK invocation before the first SDK CReq/CRes exchange',
    payloadType: 'json',
    payload: {
      action: 'START_SDK_CHALLENGE',
      sdkTransID: 'sdk-tx-001',
      acsTransID: 'c7d8e9f0-a1b2-c3d4-e5f6-a7b8c9d0e1f2',
      acsURL: 'https://acs.issuer-bank.com/challenge',
      acsRenderingType: { acsInterface: '01', acsUiTemplate: '01' },
      sdkReferenceNumber: '3DS_LOA_SDK_PPFU_020100_00007'
    },
    payloadTitle: '3DS SDK Challenge Start',
    isActive: (s) => s.deviceChannel === 'app' && s.dsRouting === 'normal' && s.transStatus === 'C'
  },
  {
    id: 'step_11d',
    num: '10i',
    label: '3DS SDK Sends Initial CReq → ACS',
    detail: 'The 3DS SDK constructs the initial app challenge request and sends it to the ACS over the SDK/ACS protected channel. Unlike browser challenge, this request originates on-device from the SDK and carries the SDK transaction binding rather than relying on a browser form post.',
    userExperience: 'Visible — the app is loading the issuer challenge state, but the cardholder has not yet entered proof.',
    whyItMatters: 'This is the first wire step of the app challenge lane. It is what turns the app path into a real SDK exchange instead of a browser-shaped emulation.',
    approxTime: '~50–150 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'BR',
    target: 'ACS',
    specRef: 'App-based challenge — initial SDK CReq → ACS',
    payloadType: 'json',
    messageType: 'CReq',
    payloadTitle: 'SDK CReq Message',
    isActive: (s) => s.deviceChannel === 'app' && s.dsRouting === 'normal' && s.transStatus === 'C'
  },
  {
    id: 'step_11',
    num: '11',
    label: 'ACS Validates CReq & Initializes Challenge State',
    detail: 'The ACS receives the initial challenge request and validates it per §5.9.6. If the request is valid, the ACS prepares the authentication UI, sets the `interactionCounter` to `0`, and readies the issuer-controlled challenge state. If the ACS receives more than one CReq for the same challenge, [Req 442] allows it either to restart/continue the challenge or to return an Error Message.',
    userExperience: 'Visible — the issuer challenge surface is loading, but the cardholder has not yet been asked to enter proof.',
    whyItMatters: 'This is the ACS state-initialization boundary for both browser and app challenge. The `interactionCounter = 0` starting point is what makes the later Step 15 increment-and-compare logic correct, and duplicate-CReq handling is explicitly part of the protocol rather than implementation-specific behavior.',
    approxTime: '~10–80 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'ACS',
    target: null,
    specRef: '§3.3 Step 11 — ACS receives CReq [Req 119–121, 442]',
    payloadType: 'json',
    payload: {
      messageType: 'CReq',
      validationStatus: 'SUCCESS',
      interactionCounter: 0,
      acsUiPrepared: true,
      duplicateCReqHandling: [
        'restart_or_continue_challenge',
        'return_error_message'
      ],
      duplicateErrorCodes: ['314', '315']
    },
    payloadTitle: 'ACS CReq Validation & Challenge Init',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C'
  },
  {
    id: 'step_12',
    num: '12',
    label: 'Renders ACS Challenge UI',
    detail: 'After Step 11 validation and state initialization, the ACS sends the prepared authentication UI to the browser over the same challenge channel. For browser-based challenge, the ACS must allow the UI to be framed and must keep the cardholder inside the authentication flow rather than redirecting them to unrelated pages.',
    userExperience: 'Visible — the cardholder now sees the issuer challenge UI, such as an OTP prompt or issuer approval instructions.',
    whyItMatters: 'This is the issuer-controlled trust boundary. The user is no longer looking at merchant content; they are interacting directly with the ACS challenge surface.',
    approxTime: '~50–200 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'ACS',
    target: 'BR',
    specRef: '§3.3 Step 12 — ACS UI delivery [Req 307, 122]',
    payloadType: 'json',
    payload: {
      uiType: 'OTP_HTML',
      challengeWindowSize: '05',
      cardholderInfoText: 'Enter the 6-digit code sent to your registered phone.',
      frameAllowed: true
    },
    payloadTitle: 'ACS Challenge UI',
    isActive: (s) => s.deviceChannel !== 'app' && s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengePresentation === 'html'
  },
  {
    id: 'step_12b',
    num: '12',
    label: 'Renders OOB Challenge Instructions',
    detail: 'For a Browser OOB challenge, the ACS still sends UI through the iframe, but the UI consists of instructions telling the cardholder how to authenticate in an issuer-controlled out-of-band channel. The overall browser challenge flow remains the same; only the cardholder interaction method changes.',
    userExperience: 'Visible — the cardholder sees issuer instructions such as "Open your banking app and approve this purchase" rather than an OTP or HTML form.',
    whyItMatters: 'The Core Spec explicitly states that an OOB Challenge Flow is identical to a standard browser challenge flow, except that the iframe carries instructions while the authentication itself happens outside the browser.',
    approxTime: '~50–200 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'ACS',
    target: 'BR',
    specRef: '§3.3 Step 12 — Browser OOB challenge note',
    payloadType: 'json',
    payload: {
      uiType: 'OOB_INSTRUCTIONS',
      challengeWindowSize: '05',
      cardholderInfoText: 'Approve the transaction in your issuer app, then return here.',
      frameAllowed: true,
      oob: true
    },
    payloadTitle: 'ACS OOB Instructions',
    isActive: (s) => s.deviceChannel !== 'app' && s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengePresentation === 'oob'
  },
  {
    id: 'step_12c',
    num: '12',
    label: 'ACS CRes Drives SDK Challenge UI',
    detail: 'For app-based challenge, the ACS returns a CRes over the SDK challenge channel and the 3DS SDK renders the issuer-directed challenge UI according to `acsRenderingType`. Depending on the ACS response, the SDK may render native or HTML content, or present OOB instructions while still keeping the state machine inside the SDK challenge loop.',
    userExperience: 'Visible — the cardholder now sees an issuer-controlled challenge screen inside the app.',
    whyItMatters: 'App challenge UI is driven by ACS CRes messages and SDK rendering rules, not by a browser iframe. This is the core difference between the SDK lane and the browser lane.',
    approxTime: '~50–200 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'ACS',
    target: 'BR',
    specRef: 'App-based challenge — SDK-rendered UI from ACS CRes / acsRenderingType',
    payloadType: 'json',
    payload: (s) => ({
      messageType: 'CRes',
      sdkTransID: 'sdk-tx-001',
      acsTransID: 'c7d8e9f0-a1b2-c3d4-e5f6-a7b8c9d0e1f2',
      acsRenderingType: {
        acsInterface: '01',
        acsUiTemplate: s.challengePresentation === 'oob' ? '04' : '01',
      },
      challengeInfoHeader: s.challengePresentation === 'oob'
        ? 'Approve this purchase in your issuer app.'
        : 'Confirm your identity to continue.',
      challengeInfoLabel: s.challengePresentation === 'oob'
        ? 'Out-of-band authentication pending'
        : 'Enter the proof requested by your issuer'
    }),
    payloadTitle: 'SDK Challenge UI (CRes)',
    isActive: (s) => s.deviceChannel === 'app' && s.dsRouting === 'normal' && s.transStatus === 'C'
  },
  {
    id: 'step_13',
    num: '13',
    label: 'Cardholder Enters Challenge Data',
    detail: 'The Cardholder interacts with the issuer challenge UI and enters the requested authentication data, such as an OTP or other proof required by the ACS. In browser flows this happens in the iframe; in app flows it happens in the SDK-rendered challenge surface.',
    userExperience: 'Visible — this is the clearly interactive part of the challenge flow.',
    whyItMatters: 'Challenge flow exists specifically because the ACS could not authenticate the transaction frictionlessly. This is where the extra proof is collected.',
    approxTime: '~5–60 s (user-driven)',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'CH',
    target: 'BR',
    specRef: '§3.3 Step 13 — Cardholder challenge interaction',
    payloadType: 'json',
    payload: {
      challengeEntryType: 'OTP',
      typedValue: '123456',
      submitAction: 'Verify'
    },
    payloadTitle: 'Cardholder Challenge Input',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengePresentation === 'html'
  },
  {
    id: 'step_13b',
    num: '13',
    label: 'Cardholder Authenticates Out-of-Band',
    detail: 'The Cardholder leaves the merchant interaction context and authenticates using the issuer-controlled OOB channel named in the ACS instructions, such as a banking app or issuer website. The exact OOB communication mechanism is outside the scope of the EMV 3DS Core Spec; the active client surface simply waits for the ACS to learn the outcome.',
    userExperience: 'Visible — the cardholder follows issuer instructions outside the challenge iframe, then returns once approval is complete.',
    whyItMatters: 'This is the browser-channel OOB variant the spec calls out. The browser challenge flow does not disappear; it becomes an instruction-and-wait experience rather than a data-entry experience.',
    approxTime: '~5–60 s (user-driven)',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'CH',
    target: null,
    specRef: '§3.3 Step 12 note / Step 13 — Browser OOB interaction',
    payloadType: 'json',
    payload: {
      challengeEntryType: 'OOB',
      issuerChannel: 'banking_app',
      action: 'Approve transaction out-of-band'
    },
    payloadTitle: 'Cardholder OOB Authentication',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengePresentation === 'oob'
  },
  {
    id: 'step_14',
    num: '14',
    label: 'Client Sends Challenge Response → ACS',
    detail: 'The active client channel sends the entered challenge data back to the ACS. In browser flows the browser posts the challenge data over the existing challenge channel; in app flows the 3DS SDK constructs a follow-up CReq and sends it over the SDK/ACS protected channel.',
    userExperience: 'Visible — the challenge screen briefly shows a spinner while the issuer validates the response.',
    whyItMatters: 'This is the cardholder proof entering the issuer decision engine. The exact wire carrier differs by channel, but this is the same protocol boundary.',
    approxTime: '~50–150 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'BR',
    target: 'ACS',
    specRef: '§3.3 Step 14 — Browser submits challenge data',
    payloadType: 'json',
    payload: {
      challengeDataEntry: '123456',
      challengeHTMLDataEntry: 'otp=123456',
      messageType: 'Challenge response submit'
    },
    payloadTitle: 'Challenge Data Submission',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengePresentation === 'html'
  },
  {
    id: 'step_14b',
    num: '14',
    label: 'Client Resumes / ACS Polls OOB Result',
    detail: 'After the cardholder completes the OOB action, the active client challenge session resumes and the ACS determines whether the OOB authentication succeeded. The exact OOB messaging path is outside the scope of the Core Spec; what matters is that the ACS now has enough information to continue at Step 15.',
    userExperience: 'Visible — the challenge surface remains on an issuer waiting screen while the ACS completes the out-of-band check.',
    whyItMatters: 'This is the handoff back into the standard Step 15 decision logic. The OOB mechanism is external, but the challenge flow still rejoins the same state machine.',
    approxTime: '~50–500 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'BR',
    target: 'ACS',
    specRef: '§3.3 Step 14 — Browser OOB continuation',
    payloadType: 'json',
    payload: {
      challengeDataEntry: null,
      oobResultState: 'PENDING_OR_READY',
      messageType: 'Challenge continue'
    },
    payloadTitle: 'OOB Continuation',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengePresentation === 'oob'
  },
  {
    id: 'step_15',
    num: '15',
    label: 'ACS Evaluates Challenge Submission',
    detail: 'The ACS checks the submitted challenge data, increments the interaction counter, and determines whether the challenge succeeded, failed, was cancelled, or should fall back to decoupled authentication. Per §5.8.2 [several HTML interactions note] and §3.3 Step 15, the ACS may loop back to Step 12 to render another challenge UI until either a final decision is reached or `acsMaxChallenges` is exhausted.',
    userExperience: 'Visible — the challenge surface remains active while the issuer decides whether the submitted proof is acceptable.',
    whyItMatters: 'This is the issuer-side authentication decision for the challenge flow. It drives the later RReq and final completion signal, and the loop decision is what makes the model a true state machine instead of a single pass.',
    approxTime: '~100–500 ms',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'ACS',
    target: null,
    specRef: '§3.3 Step 15 — Challenge result evaluation [Req 123, 464]; §5.8.2 several interactions',
    payloadType: 'json',
    payload: {
      interactionCounter: 1,
      acsMaxChallenges: 3,
      possibleOutcomes: ['Y', 'N', 'D'],
      challengeCancelationIndicator: '01',
      // The spec allows the ACS to loop Step 15 → Step 12 with an incremented counter.
      // This is what makes repeat challenges a first-class state.
      loopTarget: 'Step 12',
      loopBack: true
    },
    payloadTitle: 'ACS Challenge Decision',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C'
  },
  {
    id: 'step_15b',
    num: '15b',
    label: 'Loop Back: ACS Re-renders Challenge UI',
    detail: 'When the ACS decides that another challenge interaction is required (e.g. the cardholder entered a wrong OTP), it loops back to Step 12 and renders a fresh challenge UI inside the active client surface. From there, the challenge re-runs Steps 12–15: the ACS re-renders the UI, the cardholder re-enters proof, the client re-submits it, and the ACS evaluates again. Each loop increments the interaction counter, and the loop ends when the ACS reaches a final decision or `acsMaxChallenges`. The requestor must not prematurely close the challenge surface while the loop is active.',
    userExperience: 'Visible — the cardholder sees a new challenge prompt without leaving the challenge surface.',
    whyItMatters: 'Challenge is allowed to have several interactions per [§5.8.2]. Without this loop, the diagram under-models the most common real-world failure case (transient OTP mismatch) and the retry behaviour the spec allows.',
    approxTime: '~1–5 s (user-driven)',
    userVisibility: 'visible',
    groupId: 'challenge',
    source: 'ACS',
    target: 'BR',
    specRef: '§3.3 Step 15 → Step 12 loop [Req 123, 464]; §5.8.2 several HTML interactions',
    payloadType: 'json',
    payload: {
      loop: true,
      interactionCounter: 2,
      newUi: 'OTP_HTML_v2',
      retryAllowed: true,
      rerunsSteps: ['12', '13', '14', '15']
    },
    payloadTitle: 'ACS Challenge Retry',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.repeatChallenge
  },
  {
    id: 'step_16a',
    num: '16',
    label: 'RReq → DS (Challenge Succeeded)',
    detail: 'After a successful challenge, the ACS formats an RReq carrying the final authentication result and sends it to the DS. The RReq closes the issuer-side challenge decision and becomes the authoritative result for downstream systems.',
    userExperience: 'Visible — the challenge screen can already be preparing to close while the issuer sends the final result server-to-server.',
    whyItMatters: 'The final successful result is not complete until the ACS emits the RReq. This is where the authenticated outcome becomes durable for the DS and 3DS Server.',
    approxTime: '~50–150 ms',
    userVisibility: 'visible',
    groupId: 'results',
    source: 'ACS',
    target: 'DS',
    specRef: '§3.3 Step 16 — RReq after successful challenge [Req 124–128]',
    payloadType: 'json',
    // Versioned via the payload registry. v2.1.0 carries
    // authenticationType (renamed in v2.3.1 to authenticationMethod);
    // v2.3.1 also gains cardholderInfo, challengeErrorReporting,
    // deviceBindingStatus*, transStatusReasonInfo.
    messageType: 'RReq',
    payloadTitle: 'RReq Message (Success)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'success'
  },
  {
    id: 'step_16b',
    num: '16',
    label: 'RReq → DS (Challenge Failed)',
    detail: 'If the cardholder challenge fails, the ACS sets `transStatus = N`, assigns the appropriate reason code, and sends the failed result to the DS in the RReq.',
    userExperience: 'Visible — the issuer challenge is effectively over and will resolve as a decline.',
    whyItMatters: 'This is the terminal negative result for a completed challenge. The merchant will not receive a valid authentication cryptogram from this branch.',
    approxTime: '~50–150 ms',
    userVisibility: 'visible',
    groupId: 'results',
    source: 'ACS',
    target: 'DS',
    specRef: '§3.3 Step 16 — RReq after failed challenge [Req 124–128]',
    payloadType: 'json',
    messageType: 'RReq',
    payloadTitle: 'RReq Message (Failure)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'failure'
  },
  {
    id: 'step_16c',
    num: '16',
    label: 'RReq → DS (Cardholder Cancelled)',
    detail: 'If the cardholder abandons or explicitly cancels the browser challenge, the ACS sets the appropriate Challenge Cancelation Indicator in the RReq and sends the final negative result to the DS.',
    userExperience: 'Visible — the user exits the challenge and the checkout falls back to failure handling.',
    whyItMatters: 'Cancellation is a first-class outcome in the browser challenge model. It is not just a timeout; it is explicitly signaled in the results path.',
    approxTime: '~50–150 ms',
    userVisibility: 'visible',
    groupId: 'results',
    source: 'ACS',
    target: 'DS',
    specRef: '§3.3 Step 16 — Cancellation handling [Req 126, 127]',
    payloadType: 'json',
    messageType: 'RReq',
    payloadTitle: 'RReq Message (Cancelled)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'cancelled'
  },
  {
    id: 'step_16d',
    num: '16',
    label: 'RReq → DS (Decoupled Fallback)',
    detail: 'If the ACS determines that decoupled authentication fallback is necessary for a challenge-capable transaction, it sets `transStatus = D` in the RReq and shifts the user-facing outcome to a pending asynchronous authentication state.',
    userExperience: 'Visible — instead of an immediate approve/decline, the user is told that issuer approval will continue outside the browser challenge.',
    whyItMatters: 'This is the v2.3.1 browser challenge fallback path. The challenge began as `C`, but the final issuer result pivots to decoupled authentication during the results exchange.',
    approxTime: '~50–150 ms',
    userVisibility: 'visible',
    groupId: 'results',
    source: 'ACS',
    target: 'DS',
    specRef: '§3.3 Step 16 — Decoupled fallback [Req 465, 124–128]',
    payloadType: 'json',
    messageType: 'RReq',
    payloadTitle: 'RReq Message (Decoupled Fallback)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'decoupled'
  },
  {
    id: 'step_16e',
    num: '16',
    label: 'RReq → DS (Decoupled Authentication, Direct)',
    detail: 'For a transaction that started with `ARes transStatus = D`, the ACS authenticates the cardholder out-of-band and, per [Req 347] and [Req 128], sends an RReq to the DS as soon as it has a result. If the user fails to authenticate before the 3DS Requestor Decoupled Max Time (with a 1-hour grace period) expires, the ACS sends an RReq with `transStatus = U` and `Challenge Cancelation Indicator = 03` per the [Req 347] note.',
    userExperience: 'Silent — by the time the RReq arrives, the merchant page has already been showing the pending decoupled state.',
    whyItMatters: 'This is the long-tail result loop for the native browser D path. The DS and 3DS Server have been blocked since Step 10 waiting for exactly this RReq, and it is what releases the merchant from its pending state.',
    approxTime: '~50–150 ms (after async auth)',
    userVisibility: 'silent',
    groupId: 'results',
    source: 'ACS',
    target: 'DS',
    specRef: '§3.3 Step 16 — RReq for Decoupled Authentication [Req 124–128, 347]',
    payloadType: 'json',
    messageType: 'RReq',
    payloadTitle: 'RReq Message (Decoupled Direct)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'D'
  },
  {
    id: 'step_16f',
    num: '16',
    label: 'RReq → DS (After Challenge Opt-Out)',
    detail: 'Even when the 3DS Server opted out of the challenge, the ACS still emits an RReq to the DS so the results loop can close cleanly. The 3DS Server receives this RReq, validates it (§5.9.9), and replies with an RRes carrying `resultsStatus = 02` ("CReq not sent to ACS by 3DS Requestor — 3DS Server or 3DS Requestor opted out of the challenge") per [Req 117].a.',
    userExperience: 'Silent — the cardholder never saw a challenge surface, so by the time this RReq arrives the merchant has already resumed checkout.',
    whyItMatters: 'This is what makes the opt-out path auditable. Without the RReq/RRes handshake, the ACS would have no way to distinguish a deliberate opt-out from a delivery failure, and the merchant would not have a closed results loop for the 3DS Server.',
    approxTime: '~50–150 ms',
    userVisibility: 'silent',
    groupId: 'results',
    source: 'ACS',
    target: 'DS',
    specRef: '§3.3 Step 16 — RReq for challenge opt-out [Req 117].a, 124–128',
    payloadType: 'json',
    messageType: 'RReq',
    payloadTitle: 'RReq Message (Opt-Out)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'optout'
  },
  {
    id: 'step_17',
    num: '17',
    label: 'DS Forwards RReq → 3DS Server',
    detail: 'The DS validates the RReq, establishes a secure link to the stored 3DS Server URL from the original AReq, and forwards the final challenge result to the 3DS Server.',
    userExperience: 'Silent — this is entirely server-to-server while the browser challenge is winding down.',
    whyItMatters: 'The RReq is the authoritative results callback for challenge processing. Without it, the 3DS Server has no durable issuer-side completion signal.',
    approxTime: '~30–120 ms',
    userVisibility: 'silent',
    groupId: 'results',
    source: 'DS',
    target: 'S',
    specRef: '§3.3 Step 17 — DS RReq forwarding [Req 129–131]',
    payloadType: 'json',
    payload: {
      messageType: 'RReq',
      threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
      dsTransID: 'd9e8f7a6-b5c4-d3e2-f1a0-b9c8d7e6f5a4',
      transStatus: 'Y'
    },
    payloadTitle: 'Forwarded RReq',
    isActive: (s) => s.dsRouting === 'normal' && (s.transStatus === 'C' || s.transStatus === 'D')
  },
  {
    id: 'step_18',
    num: '18',
    label: '3DS Server Validates RReq & Sends RRes',
    detail: 'The 3DS Server validates the received RReq, sets `resultsStatus = 01` for normal completion, `resultsStatus = 02` for the 3DS Server/Requestor challenge opt-out, or `resultsStatus = 04` for decoupled fallback, and then sends the RRes back through the DS to acknowledge receipt of the final result.',
    userExperience: 'Silent — the cardholder does not see this transport acknowledgement.',
    whyItMatters: 'The RRes closes the server-side results loop and confirms that the 3DS Server received the final outcome. The specific `resultsStatus` value tells the ACS exactly which branch the 3DS Server took (normal, opted out, or decoupled fallback).',
    approxTime: '~20–80 ms',
    userVisibility: 'silent',
    groupId: 'results',
    source: 'S',
    target: 'DS',
    specRef: '§3.3 Step 18 — 3DS Server RReq handling [Req 132, 133, 466]',
    payloadType: 'json',
    // Versioned via the payload registry. The RRes shape is stable
    // across v2.1.0 / v2.2.0 / v2.3.1; the builder emits the same
    // fields for all three.
    messageType: 'RRes',
    payloadTitle: 'RRes Message',
    isActive: (s) => s.dsRouting === 'normal' && (s.transStatus === 'C' || s.transStatus === 'D')
  },
  {
    id: 'step_19',
    num: '19',
    label: 'DS Forwards RRes → ACS',
    detail: 'The DS validates the RRes, logs the result exchange, and forwards the RRes back to the ACS over the established secure link.',
    userExperience: 'Silent.',
    whyItMatters: 'This acknowledgement tells the ACS that the 3DS Server received the final result and that the transaction can be closed cleanly.',
    approxTime: '~20–80 ms',
    userVisibility: 'silent',
    groupId: 'results',
    source: 'DS',
    target: 'ACS',
    specRef: '§3.3 Step 19 — DS RRes forwarding [Req 134–136]',
    payloadType: 'json',
    payload: {
      messageType: 'RRes',
      dsTransID: 'd9e8f7a6-b5c4-d3e2-f1a0-b9c8d7e6f5a4',
      resultsStatus: '01'
    },
    payloadTitle: 'Forwarded RRes',
    isActive: (s) => s.dsRouting === 'normal' && (s.transStatus === 'C' || s.transStatus === 'D')
  },
  {
    id: 'step_20',
    num: '20',
    label: 'ACS Receives RRes',
    detail: 'The ACS validates the RRes. For interactive challenge this is the point where the server-side results exchange is complete and the ACS can emit the final client-facing completion signal through the browser or SDK. For direct Decoupled Authentication there is no client-facing post at all — the ACS closes the RRes loop and finishes asynchronously.',
    userExperience: 'Silent for the direct decoupled and opt-out paths. For interactive challenge paths the challenge surface is about to resolve and close.',
    whyItMatters: 'The challenge is not finished just because the user submitted data. The ACS still needs the server-side acknowledgement loop before it emits the final client-facing completion signal. For decoupled paths the ACS simply closes the RRes loop and continues authenticating out-of-band.',
    approxTime: '~10–30 ms',
    userVisibility: 'visible',
    groupId: 'results',
    source: 'ACS',
    target: null,
    specRef: '§3.3 Step 20 — ACS receives RRes [Req 137]',
    payloadType: 'json',
    payload: {
      messageType: 'RRes',
      validationStatus: 'SUCCESS'
    },
    payloadTitle: 'ACS RRes Validation',
    isActive: (s) => s.dsRouting === 'normal' && (s.transStatus === 'C' || s.transStatus === 'D')
  },
  {
    id: 'step_21a',
    num: '21',
    label: 'Posts Final CRes → Merchant (Success)',
    detail: 'For a successful challenge, the ACS formats the final CRes, Base64url encodes it, includes any 3DS Requestor Session Data if available, and posts it through the browser to the merchant notification URL. If the session data is absent or malformed, the merchant should still complete correlation using the CRes transaction identifiers. The merchant can now close the iframe and continue checkout with an authenticated result.',
    userExperience: 'Visible — the challenge UI closes immediately after success.',
    whyItMatters: 'This is the browser-facing completion signal that lets the merchant know the challenge is over and that the checkout can resume without polling.',
    approxTime: '~50–120 ms',
    userVisibility: 'visible',
    groupId: 'results',
    source: 'ACS',
    target: 'RE',
    specRef: '§3.3 Step 21 — Final CRes POST [Req 138–140]',
    payloadType: 'form',
    payload: {
      notificationUrl: 'https://gateway.payment.com/3ds-challenge-result',
      fields: {
        cres: 'eyJ0cmFuc1N0YXR1cyI6IlkiLCJjaGFsbGVuZ2VDb21wbGV0aW9uSW5kIjoiWSJ9',
        threeDSSessionData: 'merchant-session-9f7c1a'
      },
      decodedData: {
        messageType: 'CRes',
        messageVersion: '2.3.1',
        transStatus: 'Y',
        challengeCompletionInd: 'Y'
      }
    },
    payloadTitle: 'Final CRes POST (Success)',
    isActive: (s) => s.deviceChannel !== 'app' && s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'success'
  },
  {
    id: 'step_21b',
    num: '21',
    label: 'Posts Final CRes → Merchant (Failure/Cancel)',
    detail: 'For a failed or cancelled challenge, the ACS posts the final CRes to the merchant notification URL so the browser challenge can close and the merchant can transition to failure handling. If `threeDSSessionData` is missing or corrupted, the merchant should fall back to the identifiers carried in the CRes itself rather than treating the transaction as uncorrelated.',
    userExperience: 'Visible — the issuer challenge closes and the checkout resumes in a failed state.',
    whyItMatters: 'Even negative challenge outcomes must return through the final CRes so the merchant can close the challenge iframe deterministically.',
    approxTime: '~50–120 ms',
    userVisibility: 'visible',
    groupId: 'results',
    source: 'ACS',
    target: 'RE',
    specRef: '§3.3 Step 21 — Final CRes POST [Req 138–140]',
    payloadType: 'form',
    payload: {
      notificationUrl: 'https://gateway.payment.com/3ds-challenge-result',
      fields: {
        cres: 'eyJ0cmFuc1N0YXR1cyI6Ik4iLCJjaGFsbGVuZ2VDb21wbGV0aW9uSW5kIjoiWSJ9',
        threeDSSessionData: 'merchant-session-9f7c1a'
      },
      decodedData: {
        messageType: 'CRes',
        messageVersion: '2.3.1',
        transStatus: 'N',
        challengeCompletionInd: 'Y'
      }
    },
    payloadTitle: 'Final CRes POST (Failure)',
    isActive: (s) => s.deviceChannel !== 'app' && s.dsRouting === 'normal' && s.transStatus === 'C' && (s.challengeOutcome === 'failure' || s.challengeOutcome === 'cancelled')
  },
  {
    id: 'step_21c',
    num: '21',
    label: 'Posts Final CRes → Merchant (Decoupled Fallback)',
    detail: 'If the challenge pivots into decoupled authentication fallback, the ACS posts the final CRes back to the merchant notification URL so the challenge iframe can close and the cardholder can be told that issuer approval is continuing asynchronously. Per the FAQ clarification, the final CRes uses only `transStatus = Y` or `N`; the richer asynchronous state remains in the server-side RReq/RRes exchange, not in the browser-facing CRes.',
    userExperience: 'Visible — the user sees an informational completion screen instead of an immediate approve/decline.',
    whyItMatters: 'This final browser-facing CRes is what keeps the challenge UX coherent when the issuer moves the actual authentication out of band during the results phase. The merchant should treat it as a browser-close signal, while the authoritative asynchronous state continues server-side via the RReq/RRes loop.',
    approxTime: '~50–120 ms',
    userVisibility: 'visible',
    groupId: 'results',
    source: 'ACS',
    target: 'RE',
    specRef: '§3.3 Step 21 — Final CRes POST after decoupled fallback [Req 138–140, 464]',
    payloadType: 'form',
    payload: {
      notificationUrl: 'https://gateway.payment.com/3ds-challenge-result',
      fields: {
        cres: 'eyJ0cmFuc1N0YXR1cyI6Ik4iLCJjaGFsbGVuZ2VDb21wbGV0aW9uSW5kIjoiWSJ9',
        threeDSSessionData: 'merchant-session-9f7c1a'
      },
      decodedData: {
        messageType: 'CRes',
        messageVersion: '2.3.1',
        transStatus: 'N',
        challengeCompletionInd: 'Y',
        cardholderInfoText: 'Authentication will continue in your banking app.'
      }
    },
    payloadTitle: 'Final CRes POST (Decoupled)',
    isActive: (s) => s.deviceChannel !== 'app' && s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'decoupled'
  },
  {
    id: 'step_21d',
    num: '21',
    label: 'ACS Returns Final CRes → 3DS SDK',
    detail: 'For app-based challenge, the ACS returns the final CRes over the SDK challenge channel. The payload closes the issuer-controlled challenge exchange and carries the final status needed by the 3DS SDK to finish the on-device challenge session.',
    userExperience: 'Visible — the app challenge is resolving and is about to hand control back to the requestor app.',
    whyItMatters: 'This is the app analogue of the browser notification callback. The completion artifact is still a CRes, but it is delivered through the SDK lane instead of a browser POST.',
    approxTime: '~50–120 ms',
    userVisibility: 'visible',
    groupId: 'results',
    source: 'ACS',
    target: 'BR',
    specRef: 'App-based challenge completion — final CRes returned to 3DS SDK',
    payloadType: 'json',
    messageType: 'CRes',
    payloadTitle: 'Final CRes → 3DS SDK',
    isActive: (s) =>
      s.deviceChannel === 'app'
      && s.dsRouting === 'normal'
      && s.transStatus === 'C'
      && (s.challengeOutcome === 'success' || s.challengeOutcome === 'failure' || s.challengeOutcome === 'cancelled' || s.challengeOutcome === 'decoupled' || s.challengeOutcome === 'invalid_cres')
  },
  {
    id: 'step_21e',
    num: '21',
    label: '3DS SDK Returns Result → Requestor App',
    detail: 'After validating the final app challenge result, the 3DS SDK returns the completion data to the 3DS Requestor App so the merchant-side application can close the challenge surface and resume checkout logic. If the final CRes is malformed or inconsistent, the requestor app must reject it rather than treating the challenge as successful.',
    userExperience: 'Visible — the app leaves the issuer challenge view and returns to the merchant checkout context.',
    whyItMatters: 'This is the missing app-facing completion handoff. Without it, the simulator still collapses the app results path into the browser notification model.',
    approxTime: '~10–50 ms',
    userVisibility: 'visible',
    groupId: 'results',
    source: 'BR',
    target: 'RE',
    specRef: 'App-based challenge completion — SDK callback into the requestor app',
    payloadType: 'json',
    payload: (s) => ({
      source: '3DS_SDK',
      sdkTransID: 'sdk-tx-001',
      transStatus:
        s.challengeOutcome === 'success'
          ? 'Y'
          : s.challengeOutcome === 'decoupled'
            ? 'N'
            : 'N',
      challengeCompletionInd: 'Y',
      cardholderInfoText: s.challengeOutcome === 'decoupled'
        ? 'Authentication will continue in your banking app.'
        : 'Challenge session completed.',
    }),
    payloadTitle: 'SDK Challenge Completion Callback',
    isActive: (s) =>
      s.deviceChannel === 'app'
      && s.dsRouting === 'normal'
      && s.transStatus === 'C'
      && (s.challengeOutcome === 'success' || s.challengeOutcome === 'failure' || s.challengeOutcome === 'cancelled' || s.challengeOutcome === 'decoupled' || s.challengeOutcome === 'invalid_cres')
  },

  // ──────────────────────────────────────────────────────────────
  // STEP 22: The 3DS Requestor Environment (§3.3 Step 22)
  // "Continues with the checkout process."
  // Note: Steps 11–21 are Challenge Flow only.
  //       Frictionless skips directly to Step 22.
  // ──────────────────────────────────────────────────────────────
  {
    id: 'step_22a',
    num: '22',
    label: 'Continues Checkout (Authenticated or Attempts)',
    detail: '3DS processing completes. For a challenge-derived success, the 3DS Requestor Environment first receives the final completion artifact through the channel-appropriate callback (`notificationURL` in browser, SDK completion callback in app), closes the active challenge surface, and then continues checkout. For the direct ARes path, there is no challenge callback at all. `Y` continues with the authenticated ECI and Authentication Value returned by the ACS, while `A` continues with attempts semantics and must not be mislabeled as full authentication.',
    userExperience: 'Visible — the user finally sees the order confirmation page. From the user\'s perspective, the whole 3DS dance took <1 s.',
    whyItMatters: '3DS ends here, but the merchant still has to preserve the issuer outcome correctly. `Y` and challenge-success are authenticated results; `A` is an attempts result with different downstream meaning.',
    approxTime: '~0.1–2 s (depends on auth)',
    userVisibility: 'visible',
    groupId: 'completion',
    source: 'RE',
    target: 'BR',
    specRef: '§3.3 Step 22 — 3DS Requestor Environment (end of 3DS)',
    payloadType: 'json',
    payload: (s) => ({
      action: 'SUBMIT_AUTHORIZATION',
      amount: '279.98',
      eci: s.transStatus === 'A' ? '06' : '05',
      cavv: s.transStatus === 'A'
        ? 'AAABCiQ1R2gDAAAAAABjTDE='
        : 'AAABBiiihH8DAAAAAABiSBI=',
      notificationUrlHandled: true,
      iframeClosedIfChallenge: true,
      note: s.transStatus === 'A'
        ? '3DS processing complete with attempts semantics. Payment authorization is outside 3DS scope.'
        : '3DS processing complete. Payment authorization is outside 3DS scope.'
    }),
    payloadTitle: 'Checkout Continuation (Success)',
    isActive: (s) => s.dsRouting === 'normal' && ((s.transStatus === 'Y' || s.transStatus === 'A') || (s.transStatus === 'C' && s.challengeOutcome === 'success'))
  },
  {
    id: 'step_22b',
    num: '22',
    label: 'Handles Authentication Failure',
    detail: '3DS processing completes. For a challenge-derived failure, the 3DS Requestor Environment first receives the final completion artifact through the channel-appropriate callback, closes the challenge iframe or SDK surface, and then takes the appropriate action based on the negative Transaction Status. For frictionless N/U/R outcomes, the failure is conveyed directly from the ARes path without any challenge callback. Options include prompting for an alternative card, declining the order (for R), or routing as a non-3DS transaction.',
    userExperience: 'Visible — the user sees a clear failure message and is offered next steps (try a different card, contact their bank, etc.).',
    whyItMatters: 'The merchant can choose to retry, fall back to its own non-3DS risk model, or decline. Most merchants decline on R for liability reasons. The same merchant-side handling applies after a failed browser challenge.',
    approxTime: '<10 ms',
    userVisibility: 'visible',
    groupId: 'completion',
    source: 'RE',
    target: 'BR',
    specRef: '§3.3 Step 22 — 3DS Requestor Environment (end of 3DS)',
    payloadType: 'json',
    payload: {
      action: 'HANDLE_FAILURE',
      notificationUrlHandled: true,
      iframeClosedIfChallenge: true,
      options: [
        'Prompt for alternative card',
        'Reject order (for transStatus = R)',
        'Route as non-3DS transaction'
      ]
    },
    payloadTitle: 'Checkout Decision (Failure)',
    isActive: (s) => s.dsRouting === 'normal' && ((s.transStatus === 'N' || s.transStatus === 'U' || s.transStatus === 'R') || (s.transStatus === 'C' && (s.challengeOutcome === 'failure' || s.challengeOutcome === 'cancelled')))
  },
  {
    id: 'step_22c',
    num: '22',
    label: 'Shows Pending Decoupled Authentication',
    detail: 'After the ACS returns the final decoupled-fallback completion through the browser callback or SDK callback, the active challenge surface closes, but the issuer will continue authentication outside the merchant interaction context. The 3DS Requestor Environment shows a pending or informational state and may await later out-of-band confirmation from its 3DS Server.',
    userExperience: 'Visible — the user sees a message such as "Approve this transaction in your banking app" instead of an immediate success or failure.',
    whyItMatters: 'This is the merchant-facing UX for decoupled fallback. The browser challenge ends cleanly, but the authentication result is no longer immediate.',
    approxTime: '<10 ms',
    userVisibility: 'visible',
    groupId: 'completion',
    source: 'RE',
    target: 'BR',
    specRef: '§3.3 Step 22 — Checkout continuation after decoupled fallback',
    payloadType: 'json',
    payload: {
      action: 'SHOW_PENDING',
      transStatus: 'D',
      notificationUrlHandled: true,
      iframeClosedIfChallenge: true,
      cardholderInfoText: 'Authentication will continue in your banking app.',
      nextStep: 'Wait for asynchronous issuer confirmation'
    },
    payloadTitle: 'Checkout Pending (Decoupled)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'decoupled'
  },
  {
    id: 'step_22d',
    num: '22',
    label: 'Continues Checkout (Decoupled Authentication, Direct)',
    detail: 'For the native browser Decoupled Authentication path (`ARes transStatus = D`), 3DS processing has not been blocked on the browser at all. The 3DS Requestor Environment was told the result was pending, and per [Req 348] the 3DS Server now waits the 3DS Requestor Decoupled Max Time plus 1 hour and 30 seconds for the ACS RReq before assuming the authentication is not successful. Once the RReq lands, the merchant resumes checkout with the final transStatus carried in that RReq.',
    userExperience: 'Visible — the user already saw a pending state at Step 10. They now either see the order confirmation (if the issuer authenticated successfully) or a decline (if the RReq reports failure or the decoupled timer expired).',
    whyItMatters: 'This is the merchant-facing UX for the direct browser D path. The 3DS Server is contractually required to wait the full decoupled window before treating the transaction as failed, so the merchant-side handling here has to tolerate a long, asynchronous wait.',
    approxTime: '3DS Requestor Decoupled Max Time + 1h 30s (timeout)',
    userVisibility: 'visible',
    groupId: 'completion',
    source: 'RE',
    target: 'BR',
    specRef: '§3.3 Step 22 — Checkout continuation after Decoupled Authentication [Req 327, 347, 348]',
    payloadType: 'json',
    payload: {
      action: 'WAIT_FOR_RREQ_THEN_RESUME',
      transStatus: 'D',
      waitWindow: '3DS Requestor Decoupled Max Time + 1h 30s',
      outcomes: [
        'If RReq arrives with Y → continue as authenticated',
        'If RReq arrives with N or U → handle as failure',
        'If RReq never arrives → assume not successful'
      ]
    },
    payloadTitle: 'Checkout Continuation (Decoupled Direct)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'D'
  },
  {
    id: 'step_22e',
    num: '22',
    label: 'Continues Checkout (After Challenge Opt-Out)',
    detail: 'When the 3DS Server/Requestor opted out of a `C` challenge, the 3DS Server has already sent the RRes with `resultsStatus = 02` and, per [Req 117].a, "further processing is outside the scope of 3-D Secure processing." The 3DS Server may continue with Step 22, meaning the merchant is back in control of the checkout. Liability treatment is the same as the merchant\'s normal non-3DS risk path, since no authentication was performed.',
    userExperience: 'Visible — the merchant resumes its own non-3DS authorization flow. The cardholder may simply see the checkout continue as if no challenge had been requested.',
    whyItMatters: 'This is the merchant-side handling for the opt-out path. The opt-out is deliberate and auditable (`resultsStatus = 02`), but the actual transaction outcome is the merchant\'s responsibility from this point on.',
    approxTime: '<10 ms',
    userVisibility: 'visible',
    groupId: 'completion',
    source: 'RE',
    target: 'BR',
    specRef: '§3.3 Step 22 — Checkout continuation after challenge opt-out [Req 117].a',
    payloadType: 'json',
    payload: {
      action: 'RESUME_NON_3DS_AUTHORIZATION',
      transStatus: 'C',
      optOut: true,
      resultsStatus: '02',
      note: 'No 3DS authentication was performed. Merchant must apply its own risk model and authorization path.'
    },
    payloadTitle: 'Checkout Continuation (Opt-Out)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'optout'
  },
  {
    id: 'step_22f',
    num: '22',
    label: 'Continues Checkout (Information Only)',
    detail: 'For `transStatus = I`, no authentication was performed. The 3DS Requestor Environment continues checkout using its own non-3DS authorisation path. The ARes data (e.g. device info, card art) may be used to enrich the merchant UI, but the ECI / CAVV fields are not set, and the merchant must NOT advertise liability shift. The merchant authorisation request must omit the 3DS fields because no authentication was actually completed.',
    userExperience: 'Visible-but-quiet — the user sees the normal checkout flow, possibly with extra card or device information displayed.',
    whyItMatters: 'Treating `I` like `Y` is a frequent merchant-side bug. Information Only ARes values do not carry an authentication cryptogram and cannot be used to claim a liability shift.',
    approxTime: '<10 ms',
    userVisibility: 'visible',
    groupId: 'completion',
    source: 'RE',
    target: 'BR',
    specRef: '§3.3 Step 22 — Checkout continuation after Information Only',
    payloadType: 'json',
    payload: {
      action: 'RESUME_NON_3DS_AUTHORIZATION',
      transStatus: 'I',
      eci: null,
      authenticationValue: null,
      note: 'No authentication performed. Merchant must omit 3DS fields from authorization.'
    },
    payloadTitle: 'Checkout Continuation (Information Only)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'I'
  },
  {
    id: 'step_22g',
    num: '22',
    label: 'Continues Checkout (SPC WebAuthn)',
    detail: 'For `transStatus = S`, the merchant has already received the SPC authentication value via the browser. The 3DS Requestor Environment continues checkout using the SPC value as the authentication cryptogram in the standard authorization message. There is no RReq/RRes loop and no 3DS challenge iframe in the SPC browser path.',
    userExperience: 'Visible — the cardholder already saw the WebAuthn prompt at Step 10. They now see the order confirmation or the merchant\'s success page.',
    whyItMatters: 'SPC is the 2.3.x browser-friendly path that keeps authentication inside the platform UI. Modeling its completion step explicitly keeps the flow shape honest about what did and did not happen.',
    approxTime: '~0.1–2 s (depends on auth)',
    userVisibility: 'visible',
    groupId: 'completion',
    source: 'RE',
    target: 'BR',
    specRef: '§3.3 Step 10b — SPA continuation after SPC',
    payloadType: 'json',
    payload: {
      action: 'SUBMIT_AUTHORIZATION',
      transStatus: 'S',
      spcAuthenticationValue: 'MIIBszCCAVygAwIBAgII...AAABBiiihH8DAAAAAABiSBI=',
      eci: '05',
      note: 'SPC authentication value flows straight from the browser to the acquirer.'
    },
    payloadTitle: 'Checkout Continuation (SPC)',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'S'
  },
  {
    id: 'step_21_err',
    num: '21',
    label: 'ACS Posts Error Message to notificationURL',
    detail: 'If the ACS cannot serve the challenge at all, it posts an Error Message (containing errorCode, errorComponent, errorDescription, errorDetail) to the `threeDSRequestorURL` from the CReq instead of posting a final CRes. The Error Message is itself a POST form, and the 3DS Requestor must handle it as a transport-level error and end 3DS processing.',
    userExperience: 'Visible — the challenge iframe never finishes rendering; the merchant may show a generic decline or "try again" page.',
    whyItMatters: 'The Error Message is the spec-defined browser transport for "ACS could not serve the challenge". Keeping it browser-only prevents the simulator from implying that SDK challenge failures return through the same notificationURL callback.',
    approxTime: '~50–500 ms (or immediate on timeout)',
    userVisibility: 'visible',
    groupId: 'results',
    source: 'ACS',
    target: 'RE',
    specRef: '§3.3 Step 21 — Error Message to notificationURL; §3.3 browser error returns',
    payloadType: 'form',
    payload: {
      action: 'https://gateway.payment.com/3ds-challenge-result',
      method: 'POST',
      fields: {
        messageType: 'Erro',
        messageVersion: '2.3.1',
        errorCode: '1501',
        errorComponent: 'C',
        errorDescription: 'ACS could not complete the challenge',
        errorDetail: 'Issuer ACS timed out while rendering the challenge UI.',
        errorMessageType: 'CReq',
        threeDSServerTransID: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
        acsTransID: 'c7d8e9f0-a1b2-c3d4-e5f6-a7b8c9d0e1f2',
        threeDSSessionData: 'bWVyY2hhbnQtc2Vzc2lvbi05ZjdhMWExYQ'
      }
    },
    payloadTitle: 'ACS Error Message → notificationURL',
    isActive: (s) => s.deviceChannel !== 'app' && s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'error'
  },
  {
    id: 'step_21_close',
    num: '21',
    label: 'Client Closes Challenge Surface',
    detail: 'When the final challenge result arrives, the requestor side must explicitly close the active challenge surface. In browser flows that means closing the challenge iframe per [Req 811] and refreshing the parent page if needed; in app flows it means dismissing the SDK challenge sheet or screen and returning control to the requestor app.',
    userExperience: 'Visible — the cardholder sees the challenge window disappear.',
    whyItMatters: 'A common defect is to leave the challenge surface mounted after completion. This breaks re-renders, blocks focus, and confuses cardholders. The requestor side is responsible for the close.',
    approxTime: '<10 ms',
    userVisibility: 'visible',
    groupId: 'completion',
    source: 'BR',
    target: null,
    specRef: '§5.8.2 browser obligations; [Req 811] close the challenge window',
    payloadType: 'json',
    payload: {
      action: 'CLOSE_CHALLENGE_SURFACE',
      refresh: true,
      reason: 'Final challenge result received',
      policy: 'Do not leave the browser iframe or SDK challenge view mounted after completion.'
    },
    payloadTitle: 'Client Closes Challenge Surface',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && (s.challengeOutcome === 'success' || s.challengeOutcome === 'failure' || s.challengeOutcome === 'cancelled' || s.challengeOutcome === 'decoupled')
  },
  {
    id: 'step_22_invalid',
    num: '22',
    label: '3DS Requestor Detects Invalid CRes',
    detail: 'Per §3.3 Step 22 ("...the 3DS Requestor must be able to detect that the final CRes message is invalid..."), if the 3DS Requestor fails to validate the CRes (e.g. messageVersion mismatch, missing fields, base64url decoding error, or mismatched transaction identifiers), the requestor must end 3DS processing for this transaction. The transaction falls back to a non-3DS authorisation path and the merchant cannot claim a liability shift. The requestor should also notify its 3DS Server and DS that invalid CRes messages are being received.',
    userExperience: 'Visible — the user sees the merchant handle a normal (non-3DS) decline or "try a different card" prompt.',
    whyItMatters: 'Without this branch, the model under-represents the most defensive safety net the merchant has. Treating an invalid CRes as if it were valid is one of the most common ways merchants accidentally pay for fraud.',
    approxTime: '<10 ms',
    userVisibility: 'visible',
    groupId: 'completion',
    source: 'RE',
    target: 'BR',
    specRef: '§3.3 Step 22 — 3DS Requestor must detect invalid CRes',
    payloadType: 'json',
    payload: {
      action: 'END_3DS_INVALID_CRES',
      reason: 'CRes failed validation',
      validationsPerformed: [
        'messageVersion === 2.3.1',
        'threeDSServerTransID matches',
        'acsTransID matches',
        'Base64url(CRes) decodes',
        'messageType === CRes',
        'transStatus ∈ {Y, N, U, R, C, D, I, S}'
      ],
      notify: ['3DS Server', 'DS'],
      outcome: 'Non-3DS authorization path; no liability shift'
    },
    payloadTitle: 'Invalid CRes Fallback',
    isActive: (s) => s.dsRouting === 'normal' && s.transStatus === 'C' && s.challengeOutcome === 'invalid_cres'
  }
];

// ──────────────────────────────────────────────────────────────────
// DOMAIN OVERVIEWS — shown when user clicks a domain background.
// A "domain" in EMV 3DS is a logical/operational boundary: each side
// of the protocol is its own trust root, with clear scope, ownership,
// and rules about what messages may flow across the boundary.
// ──────────────────────────────────────────────────────────────────
export const DOMAIN_OVERVIEWS: DomainOverview[] = [
  {
    id: 'acquirer',
    title: 'Acquirer Domain',
    subtitle: 'Merchant & 3DS Requestor Environment',
    members: ['Cardholder', 'Browser', '3DS Requestor (Merchant)', '3DS Server (Acquirer/Gateway)'],
    specSection: '§1.3 — Protocol Participants; §2 — Functional Description',
    color: '#2563eb',
    responsibilities: [
      'Owns the merchant checkout experience end-to-end',
      'Generates the AReq message and assembles the 3DS Server Trans ID',
      'Maintains the cached card range / protocol version data (via PReq/PRes)',
      'Triggers and correlates the optional 3DS Method iframe flow',
      'Submits the final authorization message with ECI + CAVV',
    ],
    trustAssumptions: [
      'Browser is honest (no in-page tampering of 3DS Method URL or 3DS Server Trans ID)',
      'DS will route to the correct ACS based on BIN/issuer',
      'ACS will return a CAVV that can be verified in the standard auth flow',
    ],
    prohibitions: [
      'MUST NOT retain PAN after authorization (PCI-DSS)',
      'MUST NOT bypass the 3DS Server and contact the ACS directly',
      'MUST NOT reuse a 3DS Server Trans ID across different transactions',
    ],
    notableFeatures: [
      '3DS Method iframe is rendered on the acquirer-controlled checkout page',
      'Caches `acsProtocolVersions` and `threeDSMethodURL` per card range',
      'Reuses a 3DS Method result only if the 3DS Server Trans ID, card, and Browser match within 10 minutes',
    ],
  },
  {
    id: 'interop',
    title: 'Interoperability Domain',
    subtitle: 'Directory Server (Payment System)',
    members: ['Directory Server (DS)'],
    specSection: '§3.3 Steps 7 & 9; §5.6 PReq/PRes; §5.9.1 / §5.9.3 DS validation',
    color: '#8b5cf6',
    responsibilities: [
      'Holds the canonical card range → ACS mapping for every issuer in the payment system',
      'Validates AReq (version, 3DS Server Ref Number, MCC, participating range)',
      'Routes AReq to the correct ACS based on BIN',
      'Stores the 3DS Server callback URL for later RReq/ARes forwarding',
      'Provides PRes for periodic card-range cache warm-up',
    ],
    trustAssumptions: [
      '3DS Servers are authenticated by `threeDSServerRefNumber` issued by the payment system',
      'Acquirers and issuers are pre-registered (B2B trust)',
      'The DS itself is a payment-system-controlled trust anchor',
    ],
    prohibitions: [
      'MUST NOT validate per-transaction risk (that is the ACS job)',
      'MUST NOT store the full AReq / ARes messages for the ACS',
      'MUST NOT modify fields after generation (the protocol is a forwarder with audit logging)',
    ],
    notableFeatures: [
      'Generated `dsTransID` is the single point of correlation between the 3DS Server and the ACS during retries',
      'Logs every authentication attempt for dispute resolution',
      'Forwards ARes back using the URL stashed in step 7b (NOT the same path as the AReq)',
    ],
  },
  {
    id: 'issuer',
    title: 'Issuer Domain',
    subtitle: 'Access Control Server (Issuer)',
    members: ['Access Control Server (ACS)'],
    specSection: '§3.3 Step 8; §5.5 ACS Behaviour; §5.8.1 3DS Method',
    color: '#10b981',
    responsibilities: [
      'Makes the final authentication decision (Y / A / N / R / C / D)',
      'Operates the optional 3DS Method iframe data collection',
      'Generates the CAVV (Authentication Value) used in the standard auth flow',
      'Holds the cardholder / card credentials and risk signals',
      'Decides whether to challenge, attempt, decouple, or reject',
    ],
    trustAssumptions: [
      'DS is the only party that can address it (no public ACS directory)',
      'Browser will honestly POST 3DS Method data to its endpoint',
      'Cardholder\'s device is reasonably trustworthy for fingerprinting',
    ],
    prohibitions: [
      'MUST NOT expose 3DS Method data to the merchant',
      'MUST NOT reject a CAVV that the issuer itself generated (it is the root of trust for the CAVV)',
      'MUST NOT retain a 3DS Server Trans ID longer than 24 hours after the transaction is settled',
    ],
    notableFeatures: [
      '`acsTransID` and `acsReferenceNumber` are issuer-controlled',
      'The 3DS Method iframe is fully issuer-controlled; merchant cannot inject content into it',
      'Risk decision uses AReq data + 3DS Method fingerprint + issuer-internal signals (velocity, device reputation, etc.)',
    ],
  },
];

// ──────────────────────────────────────────────────────────────────
// PARTICIPANT OVERVIEWS — shown when user clicks a header or lifeline.
// These are the "actor" cards: who they are, what they own, what they
// send / receive, and what a researcher should remember about them.
// ──────────────────────────────────────────────────────────────────
export const PARTICIPANT_OVERVIEWS: ParticipantOverview[] = [
  {
    id: 'CH',
    shortName: 'Cardholder',
    fullName: 'Cardholder (Customer)',
    specSection: '§3.3 Step 1; §1.3.1',
    role: 'The human end-user holding a payment card and the device that runs the Browser. The Cardholder triggers 3DS by pressing "Pay" and exits it when the merchant redirects them to a confirmation page.',
    owns: [
      'Their card number (PAN) — but only discloses it to the merchant\'s checkout form',
      'Their Browser environment (fingerprint components that the ACS correlates)',
    ],
    doesNotOwn: [
      'Any 3DS Server Trans ID, DS Trans ID, or ACS Trans ID — these are generated by other parties',
      'The decision to challenge (that is the ACS\'s call)',
    ],
    sends: ['Card data + Browser metadata (via 3DS Requestor Environment)'],
    receives: ['A confirmation page or a "decline" message (after step 22)'],
    authoritativeIds: [],
    notes: [
      'The Cardholder is NEVER directly in the protocol. They are abstracted as "the 3DS Requestor Environment" on the acquirer side.',
      'Privacy: the protocol ships Browser metadata, NOT personally identifying data beyond what is already in the PAN.',
    ],
    color: '#ea580c',
    stroke: '#f97316',
  },
  {
    id: 'BR',
    shortName: 'Browser',
    fullName: 'Cardholder Browser',
    specSection: '§3.3 Steps 1, 3, 4; §A.6 Browser Information',
    role: 'The HTTPS user agent on the Cardholder\'s device. Acts as the transport between the merchant page, the hidden 3DS Method iframe, and the ACS 3DS Method URL.',
    owns: [
      'Browser fingerprint (User-Agent, screen, color depth, language, timezone, fonts, canvas hash, etc.)',
      'Sandbox restrictions on the 3DS Method iframe (per Table A.24)',
    ],
    doesNotOwn: [
      'The 3DS Method contents (the iframe src is the ACS, not the merchant)',
      'The decision to time out (the 3DS Server enforces the 5-second rule per [Req 315])',
    ],
    sends: ['3DS Method Data POST (step 4a)', '3DS Method completion event (step 4d)'],
    receives: ['3DS Method response (from ACS) in step 4a/4c', 'Checkout continuation (step 22)'],
    authoritativeIds: [],
    notes: [
      'The Browser is treated as semi-honest: it will follow script but may be compromised.',
      'Sandbox attributes per [Req 256–261] prevent the iframe from navigating or running scripts the merchant didn\'t authorize.',
    ],
    color: '#d97706',
    stroke: '#fbbf24',
  },
  {
    id: 'RE',
    shortName: '3DS Requestor',
    fullName: '3DS Requestor (Merchant Website)',
    specSection: '§3.3 Steps 1, 3, 5; §1.3.2',
    role: 'The merchant\'s checkout frontend + middleware. The 3DS Requestor Environment is responsible for collecting user data, gathering AReq fields, and rendering the hidden iframe. It DOES NOT generate IDs.',
    owns: [
      'The checkout UI',
      'The 3DS Requestor Authentication Info (3RI) when applicable',
      'The 3DS Requestor\'s own `threeDSRequestorID` and `threeDSRequestorURL`',
    ],
    doesNotOwn: [
      'The 3DS Server Trans ID (the 3DS Server generates this)',
      'The 3DS Method data (only the URL of the notification endpoint)',
    ],
    sends: ['PAN + amount (step 2a)', '3DS Method result (step 4e)', 'AReq field set (step 5)', 'Auth continuation (step 22)'],
    receives: ['3DS Server Trans ID + 3DS Method URL (step 2c)', '3DS Server result (step 10)'],
    authoritativeIds: ['threeDSRequestorID (assigned by the payment system to the merchant)'],
    notes: [
      'The "3DS Requestor Environment" is the abstract entity; in a real implementation it spans the merchant\'s web frontend + a server-side SDK.',
      'A merchant may be a 3DS Requestor without being a PCI DSS Level 1 entity — the actual PAN handling can be delegated to the 3DS Server (e.g., via a hosted-fields pattern).',
    ],
    color: '#2563eb',
    stroke: '#60a5fa',
  },
  {
    id: 'S',
    shortName: '3DS Server',
    fullName: '3DS Server (Acquirer / Gateway)',
    specSection: '§3.3 Steps 2, 6, 10; §1.3.3',
    role: 'The acquirer-side component that orchestrates the protocol. It generates the 3DS Server Trans ID, decides whether to invoke the 3DS Method, builds the AReq, forwards it to the DS, and translates the ARes into a merchant-friendly result.',
    owns: [
      'The `threeDSServerTransID` (UUID generated per transaction)',
      'The `threeDSServerRefNumber` (assigned by the payment system at registration)',
      'The cached PRes (card range data)',
      'The 5-second 3DS Method timeout',
    ],
    doesNotOwn: [
      'The risk decision (that is the ACS)',
      'The CAVV (the ACS signs it)',
    ],
    sends: ['Setup response (step 2c)', 'AReq to DS (step 6b)', 'Result to merchant (step 10)'],
    receives: ['Lookup request (step 2a)', '3DS Method completion (step 4e)', 'AReq field set (step 5)', 'ARes from DS (step 9b)'],
    authoritativeIds: ['threeDSServerTransID (per transaction)', 'threeDSServerRefNumber (per acquirer registration)'],
    notes: [
      'The 3DS Server is the single most important actor from an operational perspective — it owns the protocol\'s "memory" across the Browser/ACS split.',
      'In production, the 3DS Server is typically a managed service run by a payment gateway (Adyen, Stripe, Braintree, etc.).',
    ],
    color: '#6366f1',
    stroke: '#818cf8',
  },
  {
    id: 'DS',
    shortName: 'Directory Server',
    fullName: 'Directory Server (Payment System)',
    specSection: '§3.3 Steps 7, 9; §1.3.4',
    role: 'A payment-system-operated routing service. Holds the canonical card range → ACS mapping. Does not interpret AReq content beyond validation; just validates and forwards.',
    owns: [
      'The `dsTransID` (generated when the AReq arrives)',
      'The 3DS Server callback URL (stashed in step 7b for later ARes forwarding)',
      'The full card range database',
    ],
    doesNotOwn: [
      'Authentication decisions',
      'CAVV generation',
    ],
    sends: ['AReq to ACS (step 7b)', 'ARes to 3DS Server (step 9b)', 'PRes (step 0B)'],
    receives: ['PReq (step 0A)', 'AReq (step 6b)', 'ARes (step 8c)'],
    authoritativeIds: ['dsTransID (per AReq)'],
    notes: [
      'The DS is run by the card scheme (Visa, Mastercard, Amex, etc.). It is a high-availability, low-latency routing service.',
      'DS Trans ID survives across retries: the 3DS Server can re-send the AReq with the same `dsTransID` if a transient error occurs.',
    ],
    color: '#8b5cf6',
    stroke: '#a78bfa',
  },
  {
    id: 'ACS',
    shortName: 'ACS',
    fullName: 'Access Control Server (Issuer)',
    specSection: '§3.3 Step 8; §1.3.5; §5.5',
    role: 'The issuer-side service that makes the authentication decision. Owns the cardholder\'s risk data, holds the 3DS Method endpoint, and signs the CAVV that flows into the standard authorization message.',
    owns: [
      'The `acsTransID` and `acsReferenceNumber`',
      'The 3DS Method data store (correlated by `threeDSServerTransID`)',
      'The risk model and challenge policy',
      'The CAVV / Authentication Value (the cryptographic proof of authentication)',
    ],
    doesNotOwn: [
      'The 3DS Server Trans ID (only correlates with it)',
      'The DS Trans ID (assigned by the DS)',
    ],
    sends: ['3DS Method page (step 4a/4c)', 'ARes to DS (step 8c)'],
    receives: ['3DS Method POST (step 4a)', 'AReq (step 7b)'],
    authoritativeIds: ['acsTransID (per transaction)', 'acsReferenceNumber (per ACS registration)'],
    notes: [
      'The ACS is the only entity that can produce a valid CAVV for a given transaction. This is what makes the CAVV non-repudiable.',
      'Each issuer runs their own ACS (or a managed service like Cardinal, RSA, etc. on their behalf).',
    ],
    color: '#10b981',
    stroke: '#34d399',
  },
];

// ──────────────────────────────────────────────────────────────────
// STEP GROUP OVERVIEWS — shown when user clicks a colored phase band.
// These are the "zoom out" cards: what the whole phase is about.
// ──────────────────────────────────────────────────────────────────
export const SECURITY_LENS_BY_STEP: Record<string, SecurityLensNote> = {
  step_3b: {
    summary: 'The hidden 3DS Method iframe is an early privacy and correlation boundary. It is useful for fingerprinting, but it also creates silent browser-side behavior that many merchants do not inspect closely.',
    abuseCases: [
      'Swap or suppress the Method iframe to test whether the merchant or ACS over-trusts missing browser data.',
      'Force timeout behavior and compare downstream risk decisions against the fully fingerprinted path.',
      'Probe whether third-party script interference can alter or block the method POST without checkout noticing.'
    ],
    observables: [
      'Hidden iframe creation, outbound POST target, and timing relative to AReq generation.',
      'Whether the same threeDSServerTransID is reused across the Method and AReq path.',
      'Frontend error handling when the iframe load stalls, is blocked, or never returns.'
    ],
    defenderChecks: [
      'Method completion should only influence risk inputs, not authenticate the user by itself.',
      'The merchant should preserve timeout and unavailable cases distinctly rather than collapsing them into success.',
      'Browser instrumentation should log method start and completion without leaking sensitive values.'
    ],
    reportingAngle: 'Good place to analyze passive fingerprinting assumptions, privacy leakage, and silent control-flow pivots.',
    specHooks: ['§3.3 Steps 3-4', 'threeDSCompInd semantics']
  },
  step_4b: {
    summary: 'The browser-to-ACS method POST is a trust boundary crossing from merchant-controlled page context into issuer-controlled risk collection.',
    abuseCases: [
      'Block or replay the method POST to see whether issuer-side risk scoring degrades safely.',
      'Mutate browser environment values to test device-binding or anti-automation assumptions.'
    ],
    observables: [
      'Exact ACS endpoint reached and whether CSP, ad blockers, or privacy tools interfere.',
      'Correlation of method payload timing with later ARes outcomes.'
    ],
    defenderChecks: [
      'No merchant business decision should be made solely from the presence of a successful method callback.',
      'Unexpected retries should not create duplicate transaction linkage.'
    ],
    specHooks: ['§5.8', 'threeDSMethodData / threeDSCompInd']
  },
  step_5: {
    summary: 'AReq assembly is where merchant, browser, and gateway inputs are normalized into one issuer-visible assertion set.',
    abuseCases: [
      'Feed inconsistent browser metadata to see whether the 3DS Server preserves, normalizes, or drops conflicting values.',
      'Test whether challenge preference, notification URLs, or decoupled indicators can be tampered with before signing or transmission.'
    ],
    observables: [
      'Final AReq field set, especially challenge preference, requestor URL, and browser/device fields.',
      'Whether local validation rejects malformed UUIDs, enum values, or impossible combinations before send.'
    ],
    defenderChecks: [
      'Merchant-controlled fields should be validated before the DS sees them.',
      'Sensitive protocol fields should not be silently defaulted in ways that alter liability or challenge behavior.'
    ],
    specHooks: ['Table B.1', '§3.3 Steps 5-6']
  },
  step_6a: {
    summary: 'The AReq is the main policy message of the flow. Small field changes here can change whether the transaction becomes frictionless, challenge, decoupled, or rejected.',
    abuseCases: [
      'Flip threeDSRequestorChallengeInd values to probe downgrade and challenge-skipping behavior.',
      'Try inconsistent device or browser metadata to measure issuer fallback behavior.'
    ],
    observables: [
      'Outbound request body and corresponding ARes branch taken later.',
      'Whether any upstream value is normalized or overwritten by the 3DS Server.'
    ],
    defenderChecks: [
      'The gateway should preserve an auditable mapping from merchant input to outbound AReq.',
      'High-impact flags should be immutable once the request is handed to the 3DS Server.'
    ],
    reportingAngle: 'Useful for proving that a vulnerability is a field-integrity issue rather than an issuer decisioning quirk.',
    specHooks: ['Table B.1', '§6.1.3.1']
  },
  step_7a: {
    summary: 'DS validation decides whether the issuer path is even reachable. Failures here are often mis-modeled as issuer outcomes when they are really routing failures.',
    abuseCases: [
      'Send invalid protocol versions or malformed identifiers to test DS-side early termination.',
      'Explore BIN/range edge cases to see whether routing ambiguity can bypass issuer participation.'
    ],
    observables: [
      'Error component, code, and whether the ACS is bypassed entirely.',
      'Differences between DS failure, DS fallback ARes, and normal forward behavior.'
    ],
    defenderChecks: [
      'Merchant UI should distinguish DS validation failure from issuer refusal.',
      'No ACS-dependent state should be assumed after DS rejection.'
    ],
    specHooks: ['§3.3 Step 7', '§5.9.1']
  },
  step_7err1: {
    summary: 'A DS-side error is a protocol-layer failure, not proof that the issuer saw or evaluated the transaction.',
    abuseCases: [
      'Force transient DS faults to see whether merchants incorrectly continue as if authentication merely returned U.',
      'Test whether retry behavior reuses transaction identifiers unsafely.'
    ],
    observables: [
      'errorCode/errorComponent pairing and merchant fallback treatment.',
      'Whether the ACS is contacted at all.'
    ],
    defenderChecks: [
      'Retries should create a clean new authentication attempt when required.',
      'The merchant should not claim issuer-backed outcomes after DS failure.'
    ],
    specHooks: ['§5.9.1', 'DS error handling']
  },
  step_8a: {
    summary: 'Issuer/ACS decisioning is where risk scoring turns protocol inputs into the decisive transStatus branch.',
    abuseCases: [
      'Compare ARes behavior under method success, timeout, and unavailable states to identify over-weighted browser signals.',
      'Probe whether issuer challenge policy can be influenced by requestor challenge preference beyond what scheme rules intend.'
    ],
    observables: [
      'Branch deltas across identical carts with small device/browser changes.',
      'Whether the ACS returns challenge, decoupled, informational, or SPC under stable merchant inputs.'
    ],
    defenderChecks: [
      'Outcome changes should be explainable by actual input deltas, not UI timing artifacts.',
      'Challenge mandate and rendering type should remain internally consistent.'
    ],
    reportingAngle: 'Good step for differential testing and issuer-policy misconfiguration analysis.',
    specHooks: ['§3.3 Step 8', 'Table B.2']
  },
  step_10c: {
    summary: 'The browser challenge branch starts a user-facing high-value surface where transport, iframe handling, and challenge policy converge.',
    abuseCases: [
      'Manipulate challenge preference versus ACS mandate combinations to look for unauthorized opt-out paths.',
      'Test whether merchant UI leaks internal state before the ACS challenge actually starts.'
    ],
    observables: [
      'ARes fields such as acsURL, acsChallengeMandated, and rendering hints.',
      'Whether the merchant immediately commits to challenge UX or still allows branch changes.'
    ],
    defenderChecks: [
      'The app should only expose opt-out when both requestor and ACS rules allow it.',
      'Challenge-start metadata should be traceable to the ARes received from the ACS.'
    ],
    specHooks: ['Req 117', 'Table B.2']
  },
  step_10d: {
    summary: 'Direct decoupled authentication removes the browser challenge surface and replaces it with an asynchronous wait on issuer-side completion.',
    abuseCases: [
      'Test whether merchants misread D as success instead of pending authentication.',
      'Probe timeout-handling paths to see whether pending decoupled states silently age into approval.'
    ],
    observables: [
      'Absence of CReq/CRes traffic and later arrival of RReq.',
      'Pending-state UX and any checkout continuation before final issuer result.'
    ],
    defenderChecks: [
      'The merchant must not claim authentication success before the decoupled RReq lands.',
      'Timeout windows should follow the spec wait model instead of arbitrary UI timers.'
    ],
    specHooks: ['Req 327', 'Req 347', 'Req 348']
  },
  step_10e: {
    summary: 'Challenge opt-out is a legitimate branch, but it is also a classic downgrade surface because it intentionally avoids sending CReq to the ACS.',
    abuseCases: [
      'Check whether opt-out can be reached when acsChallengeMandated = Y or requestor indicator = 04.',
      'Verify that the system records an auditable opted-out result instead of silently falling back to non-3DS.'
    ],
    observables: [
      'No CReq posted to the ACS, followed by RReq/RRes closure with resultsStatus = 02.',
      'Merchant checkout resumes without browser challenge completion.'
    ],
    defenderChecks: [
      'Opt-out must be policy-gated and traceable in server-side logs.',
      'resultsStatus = 02 should be emitted rather than overloading normal completion values.'
    ],
    reportingAngle: 'Strong place to test unauthorized challenge bypass or incomplete audit trails.',
    specHooks: ['Req 117 (opt-out branch)', 'Table B.9 resultsStatus']
  },
  step_11a: {
    summary: 'The browser CReq form is the Step 10 handoff from server-side state to browser-side transport toward the ACS.',
    abuseCases: [
      'Tamper with threeDSRequestorURL or threeDSSessionData handling to test callback and correlation weaknesses.',
      'Try malformed base64url CReq payloads and observe whether the merchant, browser, or ACS catches the problem.'
    ],
    observables: [
      'Form fields posted to the ACS, especially creq and optional threeDSSessionData.',
      'Whether non-JS fallback or iframe creation behavior diverges across browsers.'
    ],
    defenderChecks: [
      'The browser should act as a transport layer, not originator of CReq semantics.',
      'Correlation data should be treated as opaque and optional, never as the sole truth source.'
    ],
    specHooks: ['Step 10', 'Req 117.b-e', 'Table A.3', '§5.8.2']
  },
  step_11b: {
    summary: 'Once the browser posts CReq, the transport leg is complete and the ACS-side Step 11 validation boundary begins.',
    abuseCases: [
      'Refresh or recover the page to see whether duplicate CReqs are sent and how the ACS reacts.',
      'Attempt out-of-order challenge delivery after the results path has already closed.'
    ],
    observables: [
      'Duplicate CReq submissions; per [Req 442] the ACS may either restart/continue the challenge OR return error 314/315 — both are spec-compliant.',
      'Browser console and network traces around iframe lifecycle.'
    ],
    defenderChecks: [
      'The merchant should treat this POST as transport only; the ACS decides whether challenge state is initialized or rejected.',
      'The merchant should not assume the first rendered challenge state is the final one.'
    ],
    specHooks: ['Step 10', '§5.8.2']
  },
  step_11: {
    summary: 'ACS CReq validation is the state-initialization boundary of the browser challenge and the place where duplicate CReq handling becomes normative rather than implementation-defined.',
    abuseCases: [
      'Replay the same CReq and compare whether the ACS restarts, continues, or returns an Error Message.',
      'Mutate identifiers or base64url content to verify that malformed CReq payloads terminate challenge processing cleanly.'
    ],
    observables: [
      'CReq validation result, initial interactionCounter value, and whether the ACS prepares UI or returns an error.',
      'Duplicate-CReq branch behavior, including restart/continue versus Error Message outcomes.'
    ],
    defenderChecks: [
      'The ACS should initialize `interactionCounter = 0` before any cardholder submission is evaluated.',
      'Duplicate CReq handling should be deterministic, logged, and auditable.'
    ],
    specHooks: ['Step 11', 'Req 119', 'Req 120', 'Req 121', 'Req 442']
  },
  step_12: {
    summary: 'The issuer-controlled challenge UI is where phishing resistance and origin trust matter most from the cardholder perspective.',
    abuseCases: [
      'Measure whether the merchant page visually blurs the boundary between merchant and ACS content.',
      'Test clickjacking, overlay, or frame-resize issues that could mislead the cardholder during challenge.'
    ],
    observables: [
      'Iframe origin, origin indicators, and whether merchant DOM can interact with challenge content.',
      'Challenge window size and rendering differences across browsers.'
    ],
    defenderChecks: [
      'Merchant code should not be able to introspect or alter issuer challenge contents.',
      'UI should preserve a clear issuer-versus-merchant boundary.'
    ],
    specHooks: ['§5.8.2', 'ACS rendering type']
  },
  step_15b: {
    summary: 'Repeated challenge loops create state-machine complexity and are a common place for desynchronization bugs.',
    abuseCases: [
      'Force multiple retries and compare interaction counters against actual UI loops.',
      'Test whether looping challenge state can be confused with duplicate or replayed requests.'
    ],
    observables: [
      'Interaction counter changes, repeated issuer prompts, and final branch taken.',
      'Whether the ACS preserves or resets prior challenge context.'
    ],
    defenderChecks: [
      'Loop limits must be enforced consistently by the ACS and reflected in merchant state.',
      'Repeated interactions should not produce contradictory terminal statuses.'
    ],
    specHooks: ['§3.3 Step 15', 'Challenge interaction counter', 'Loop re-runs Steps 12–15']
  },
  step_16e: {
    summary: 'The decoupled direct RReq is the authoritative result carrier for asynchronous issuer authentication.',
    abuseCases: [
      'Delay or suppress the decoupled RReq to test timeout assumptions in the merchant and 3DS Server.',
      'Compare successful and timed-out decoupled results to ensure the merchant does not collapse both into generic pending.'
    ],
    observables: [
      'RReq timing relative to max time and grace period.',
      'transStatus and challenge cancellation indicators in the final server-side result.'
    ],
    defenderChecks: [
      'Decoupled completion should only be accepted through RReq, not inferred from browser state.',
      'Timeout handling should align with Req 347 and 348.'
    ],
    specHooks: ['Req 347', 'Req 348', 'Table B.8']
  },
  step_16f: {
    summary: 'This is the audit-closing handshake for requestor/merchant challenge opt-out. It is critical for distinguishing deliberate bypass from transport failure.',
    abuseCases: [
      'Verify whether resultsStatus = 02 is emitted only for genuine opt-out cases.',
      'Test whether the ACS, DS, or merchant accepts normal completion codes after the challenge was never sent.'
    ],
    observables: [
      'Presence of RReq despite no CReq having reached the ACS.',
      'RRes resultsStatus value and downstream merchant logging.'
    ],
    defenderChecks: [
      'The server should validate the incoming RReq before sending the opt-out RRes.',
      'Operational logs should preserve that no challenge occurred.'
    ],
    specHooks: ['Req 117 (opt-out branch)', '§5.9.9', 'Table B.9']
  },
  step_17: {
    summary: 'RRes is the server-side acknowledgement point. It closes the authoritative results loop that the browser alone cannot prove.',
    abuseCases: [
      'Test whether merchants or gateways over-trust browser-visible CRes while ignoring RReq/RRes state.',
      'Probe whether result acknowledgements can be mismatched across transaction IDs.'
    ],
    observables: [
      'resultsStatus transitions for normal completion, opt-out, and decoupled fallback.',
      'Consistency among threeDSServerTransID, dsTransID, and acsTransID.'
    ],
    defenderChecks: [
      'Every RReq should map to exactly one RRes with consistent identifiers.',
      'resultsStatus should encode branch semantics, not just transport success.'
    ],
    reportingAngle: 'Useful when showing that the authoritative protocol result and the browser-visible UI result diverge.',
    specHooks: ['Table B.9', '§3.3 Steps 17-19']
  },
  step_21a: {
    summary: 'The final CRes success POST is browser-facing proof that the challenge window can close, not the only authoritative result source.',
    abuseCases: [
      'Tamper with session correlation to see whether the merchant falls back safely to transaction identifiers.',
      'Try replaying a stale success CRes against the notification URL.'
    ],
    observables: [
      'POST body at the notification URL, including cres and optional threeDSSessionData.',
      'How the merchant correlates the POST to the checkout session.'
    ],
    defenderChecks: [
      'The merchant should validate identifiers and message structure before honoring success.',
      'threeDSSessionData should aid correlation, not replace message-level validation.'
    ],
    specHooks: ['Table A.3', 'Table B.5', '§3.3 Step 21']
  },
  step_21b: {
    summary: 'Negative challenge outcomes must still close the browser loop cleanly; otherwise merchants often leave users in ambiguous UI states.',
    abuseCases: [
      'Return failure or cancellation states with missing session data to test fallback correlation.',
      'Probe whether merchant code accidentally treats failure CRes as just a UI-close event without state validation.'
    ],
    observables: [
      'Final CRes contents for N outcomes and resulting checkout transitions.',
      'Whether iframe closure and failure messaging remain synchronized.'
    ],
    defenderChecks: [
      'Negative CRes paths should be validated with the same rigor as success.',
      'Failure handling should not leak into success-oriented authorization code paths.'
    ],
    specHooks: ['Table B.5', '§3.3 Step 21']
  },
  step_21c: {
    summary: 'Decoupled fallback uses the browser CRes mainly as a close signal while the richer asynchronous state remains server-side.',
    abuseCases: [
      'Test whether merchants incorrectly interpret the browser-facing decoupled close path as final success.',
      'Compare RReq state to final browser behavior to find UI/protocol desynchronization.'
    ],
    observables: [
      'CRes limited browser-facing status versus server-side asynchronous outcome.',
      'Whether the checkout enters a pending state instead of final approval.'
    ],
    defenderChecks: [
      'Browser close behavior should not erase or override pending decoupled status.',
      'Operator tooling should show that authoritative state remains in RReq/RRes.'
    ],
    specHooks: ['FAQ 2026 clarification', '§3.3 Step 21']
  },
  step_21_err: {
    summary: 'An ACS Error Message to the notification URL is a transport-layer failure surface and should terminate 3DS cleanly.',
    abuseCases: [
      'Force malformed CReq delivery or ACS-side rendering errors to test merchant termination behavior.',
      'Check whether error POSTs can be mistaken for valid CRes callbacks.'
    ],
    observables: [
      'errorCode, errorComponent, errorDescription, and whether the iframe ever rendered.',
      'Merchant-side branching between protocol error handling and ordinary auth failure.'
    ],
    defenderChecks: [
      'Error Message parsing should be separate from CRes parsing.',
      'The merchant should end 3DS processing rather than continue with assumed success.'
    ],
    specHooks: ['§3.3 Step 21', 'Error Message POST']
  },
  step_21_close: {
    summary: 'Explicit iframe closure is an integrity boundary for UI state. Leaving the challenge window mounted is both a UX defect and a state-management smell.',
    abuseCases: [
      'Check whether stale iframes can keep intercepting focus or trigger duplicate callbacks after completion.',
      'Verify whether parent-page refresh races can mask invalid or duplicate completion messages.'
    ],
    observables: [
      'DOM teardown of the iframe after CRes or Error Message arrival.',
      'Whether the parent page updates exactly once with the new auth state.'
    ],
    defenderChecks: [
      'Close behavior should be deterministic across success, failure, error, and decoupled fallback.',
      'UI teardown should only happen after completion data has been validated and recorded.'
    ],
    specHooks: ['§3.3 Step 22 note', 'close the challenge iframe']
  },
  step_22_invalid: {
    summary: 'Invalid final CRes detection is one of the strongest merchant-side safety controls in the browser flow.',
    abuseCases: [
      'Mutate messageVersion, identifiers, or base64url encoding to verify rejection.',
      'Replay old CRes payloads against current sessions to test anti-replay and correlation logic.'
    ],
    observables: [
      'Exact validation failures logged by the requestor environment.',
      'Whether the system notifies its 3DS Server and DS when invalid CRes messages are received.'
    ],
    defenderChecks: [
      'The merchant must end 3DS processing on invalid CRes rather than degrade into success.',
      'Validation should cover identifiers, message type, decoding, and allowed transaction-status semantics.'
    ],
    reportingAngle: 'Excellent place for write-ups because the spec clearly expects active invalid-message detection.',
    specHooks: ['§3.3 Step 22 note', 'Table B.5']
  },
  step_22d: {
    summary: 'Direct decoupled checkout continuation is an asynchronous pending state, not an authenticated completion.',
    abuseCases: [
      'Check whether the merchant exposes goods or marks payment as trusted before the decoupled result lands.',
      'Test timeout handling when no RReq arrives within the spec window.'
    ],
    observables: [
      'Pending UI, wait-window timers, and post-timeout merchant actions.',
      'Differences between success, timeout, and absent-RReq behavior.'
    ],
    defenderChecks: [
      'Business logic should treat D as pending, not successful authorization proof.',
      'Operational alerts should exist for missing or late RReq completions.'
    ],
    specHooks: ['Req 347', 'Req 348']
  },
  step_22e: {
    summary: 'After opt-out, the merchant is back on its ordinary non-3DS risk path. That is intentional, but it must be explicit.',
    abuseCases: [
      'Verify whether the merchant still claims liability-shift semantics after a deliberate non-3DS continuation.',
      'Look for audit gaps where an opted-out transaction appears indistinguishable from normal challenge completion.'
    ],
    observables: [
      'Checkout continuation path, authorization payload contents, and merchant audit logs.',
      'Absence of authenticated 3DS values in the downstream auth request.'
    ],
    defenderChecks: [
      'No liability-shift or authenticated-status claims should survive into the post-opt-out flow.',
      'The non-3DS continuation should be traceable to the earlier resultsStatus = 02.'
    ],
    specHooks: ['Req 117 (opt-out branch)', 'Step 22 continuation']
  },
  step_22f: {
    summary: 'Information Only is easy to misinterpret because it looks like a protocol success path while performing no cardholder authentication at all.',
    abuseCases: [
      'Check whether merchants attach ECI/CAVV-like meaning to I outcomes.',
      'Probe whether data-only or 3RI-derived states bleed into checkout messaging that suggests authentication occurred.'
    ],
    observables: [
      'Absence of actual authentication values in the merchant continuation path.',
      'Any UI or API field implying liability shift or user verification.'
    ],
    defenderChecks: [
      'The downstream authorization request should omit 3DS auth values for I.',
      'Merchant messaging should clearly avoid implying that the user passed 3DS.'
    ],
    specHooks: ['Table A.17', 'transStatus field §A.4 (I = Informational Only)']
  },
  step_22g: {
    summary: 'SPC moves the user interaction into the browser platform and WebAuthn stack, which changes both the trust model and the observable artifacts.',
    abuseCases: [
      'Test browser compatibility and fallback handling when SPC or WebAuthn APIs are partially available.',
      'Check whether merchants mix SPC completion with ordinary challenge assumptions or nonexistent RReq/RRes state.'
    ],
    observables: [
      'WebAuthn/SPC browser prompt behavior and resulting authentication value handling.',
      'Absence of challenge iframe and server-side results loop in the browser SPC path.'
    ],
    defenderChecks: [
      'The 3DS Requestor retrieves Assertion Data from the SPC API call ([Req 450]); it must not change or store any of that data. Downstream CAVV/AV are obtained via a separate 3RI authentication initiated by the 3DS Server ([Req 467]), not from the SPC assertion in the original transaction authorization.',
      'Feature detection and permission policy must be explicit and auditable.'
    ],
    specHooks: ['§3.5', 'SPC Transaction Data', 'transStatus = S', 'Req 450 (Assertion Data handling)', 'Req 467 (3RI CAVV delivery)']
  }
};

export const STEP_GROUP_OVERVIEWS: StepGroupOverview[] = [
  {
    id: 'preauth',
    title: 'Pre-Auth Cache Setup',
    specSection: '§5.6 — PReq/PRes; [Req 246–250, 304, 385, 456]',
    summary: 'Out-of-band cache warm-up. The 3DS Server pulls card range / version data from the DS so the per-transaction lookup in step 2b is a local cache hit.',
    whatHappens: [
      '3DS Server builds a PReq with optional `serialNum` (omitting it forces a full update)',
      '3DS Server sends PReq to DS via mutually-authenticated TLS',
      'DS validates the request and returns a PRes with the card range database',
      'Each card range carries: ACS/DS protocol versions, optional 3DS Method URL, Action Indicator',
      '3DS Server caches the PRes keyed by card range',
    ],
    whyItExists: 'A per-transaction lookup against the DS would add 100+ ms to every checkout. Caching makes the per-transaction cost near-zero. Periodic refreshes (full every 12 h, partial every 1 h) keep the cache fresh.',
    typicalDuration: '~100–500 ms (per refresh). Total cache size: thousands of ranges × 3–5 versions each.',
    failureModes: [
      'Network failure to DS: 3DS Server uses stale cache; logs the gap for ops',
      'Version skew: a PRes arriving after a card range is updated may have stale `serialNum`; the 3DS Server falls back to its most recent cached values',
    ],
    keyDataStructures: [
      { name: 'PReq', ref: 'Table B.6', description: 'Minimal message: messageType, messageVersion, threeDSServerRefNumber, optional serialNum' },
      { name: 'PRes', ref: 'Table B.7', description: 'serialNum, dsProtocolVersions, cardRangeData[]' },
      { name: 'cardRangeData entry', ref: 'Table A.6', description: 'ranges[], actionInd, acsProtocolVersions[]' },
    ],
    securityNotes: [
      'PReq/PRes is over server-authenticated TLS; the 3DS Server authenticates the DS by certificate',
      'The 3DS Server Ref Number is the authentication token; a forged ref number would allow arbitrary 3DS Server impersonation',
    ],
    color: '#64748b',
  },
  {
    id: 'setup',
    title: 'Step 2 — Setup',
    specSection: '§3.3 Step 2; [Req 80–82]',
    summary: 'The 3DS Server looks up cached card range data and returns the highest common protocol version + 3DS Method URL to the merchant.',
    whatHappens: [
      '3DS Requestor sends PAN to 3DS Server',
      '3DS Server looks up the card range in the cached PRes (local cache, <1 ms)',
      '3DS Server picks the highest protocol version supported by the 3DS Server AND the card range',
      '3DS Server generates a `threeDSServerTransID` (UUID)',
      '3DS Server returns the Trans ID + version list + (optional) 3DS Method URL to the merchant',
    ],
    whyItExists: 'Establishes the protocol version negotiation without a per-transaction DS round-trip. The 3DS Server Trans ID becomes the lynchpin for the rest of the flow.',
    typicalDuration: '<10 ms (local cache hit)',
    failureModes: [
      'No cache match: 3DS Server triggers a PReq refresh; if that fails too, the transaction falls back to 3DS 1.0 or is declined',
    ],
    keyDataStructures: [
      { name: 'threeDSServerTransID', ref: '§A.5', description: 'UUID v4; this is the only ID that links the 3DS Method data (step 4) to the AReq (step 6)' },
    ],
    securityNotes: [
      'The 3DS Server Trans ID MUST be unguessable; a guessable ID would allow an attacker to spoof 3DS Method completion',
    ],
    color: '#0ea5e9',
  },
  {
    id: 'method',
    title: 'Step 3–4 — 3DS Method',
    specSection: '§3.3 Steps 3–4; §5.8.1; [Req 83–85, 256–315, 415]',
    summary: 'A hidden iframe lets the ACS collect Browser fingerprint data correlated to the same 3DS Server Trans ID used later in the AReq. The user sees nothing on screen.',
    whatHappens: [
      '3DS Requestor injects a hidden iframe pointing at the ACS 3DS Method URL',
      'The iframe auto-POSTs `threeDSMethodData` (3DS Server Trans ID + Notification URL) to the ACS',
      'ACS reads the iframe context and gathers device fingerprint (canvas hash, fonts, WebGL, etc.)',
      'ACS stores the fingerprint under the 3DS Server Trans ID',
      'ACS POSTs a completion notification back to the 3DS Server Trans Notification URL (also through the iframe)',
      '3DS Requestor Environment receives the postMessage, notifies the 3DS Server',
      '3DS Server sets `threeDSCompInd = Y` and includes it in the AReq',
    ],
    whyItExists: 'The risk engine needs device data BEFORE the AReq arrives. Without the 3DS Method, the ACS would have to reject any device that wasn\'t whitelisted — making frictionless impossible. The 5-second timeout (per [Req 315]) ensures the protocol doesn\'t stall if the ACS is slow.',
    typicalDuration: '~300–1100 ms (ACS-dependent). 5 s hard timeout.',
    failureModes: [
      'Iframe blocked by Content-Security-Policy: ACS cannot collect data; `threeDSCompInd = N`',
      'ACS unreachable: `threeDSCompInd = N`',
      '5 s timeout (per [Req 315]): `threeDSCompInd = N`',
      'Browser doesn\'t support sandboxed iframes: merchant falls back to no-3DS-Method flow',
    ],
    keyDataStructures: [
      { name: 'threeDSMethodData', ref: '§A.7', description: 'JSON object Base64url-encoded into a single form field. Contains threeDSServerTransID + threeDSMethodNotificationURL' },
      { name: 'threeDSMethodID', ref: '§5.8.1.2', description: 'The 3DS Server Trans ID of a prior 3DS Method call when reusing (set to the previous Trans ID)' },
    ],
    securityNotes: [
      'The iframe is sandboxed per Table A.24 — no same-origin, no top-frame navigation, no form submission to top frame',
      'The 3DS Method Data is one-way (request) + one-way (notification) — there is no path from the ACS back into the merchant page',
      'Content-Security-Policy: the merchant can use frame-src / child-src to control which 3DS Method URLs may be loaded',
    ],
    color: '#f59e0b',
  },
  {
    id: 'areq',
    title: 'Step 5–6 — AReq Assembly & Send',
    specSection: '§3.3 Steps 5–6; §5.4; Table B.1 [Req 86–92, 422]',
    summary: 'The 3DS Server assembles the AReq from requestor-collected data + browser fingerprint + cached PRes, then posts it to the DS over a secured TLS link.',
    whatHappens: [
      '3DS Requestor Environment gathers AReq data (~150 fields; see Table B.1)',
      'Data is sent to 3DS Server over a secure (server-authenticated TLS) link',
      '3DS Server adds 3DS Server IDs (Trans ID, Ref Number) and the 3DS Method Completion Indicator',
      '3DS Server establishes a server-authenticated TLS link to the DS',
      '3DS Server POSTs the AReq JSON to the DS',
    ],
    whyItExists: 'The AReq is the protocol\'s "main" message. It contains all the data the ACS needs to make a risk decision in a single round-trip.',
    typicalDuration: '~50–200 ms total. Most of the time is the AReq → DS network hop.',
    failureModes: [
      'Invalid AReq field (per §A.9): DS returns a 4-character errorCode',
      'TLS handshake failure: 3DS Server retries up to 3 times per [Req 90]; then surfaces a 405',
      '3DS Server cannot find the DS URL for a given BIN: AReq is never sent; merchant falls back',
    ],
    keyDataStructures: [
      { name: 'AReq', ref: 'Table B.1', description: '~150 fields; the most complex message in the protocol. Key fields: messageType, messageVersion, threeDSServerTransID, threeDSRequestorID, threeDSCompInd, deviceChannel, messageCategory, acctNumber, purchaseAmount, purchaseCurrency, browser*' },
    ],
    securityNotes: [
      'The AReq contains the full PAN — protected by TLS only. No field-level encryption in 2.x (this is 3DS 2.x vs 3DS Secure 1.0)',
      'PAN MUST NOT be logged at the 3DS Server (PCI-DSS scope)',
    ],
    color: '#6366f1',
  },
  {
    id: 'ds_validation',
    title: 'Step 7 — DS Validation & Routing',
    specSection: '§3.3 Step 7; §5.9.1; [Req 93–101]',
    summary: 'The DS validates the AReq, generates a DS Trans ID, looks up the right ACS for the card range, and forwards the AReq.',
    whatHappens: [
      'DS validates messageVersion is supported (per [Req 96])',
      'DS validates threeDSServerRefNumber (per [Req 97])',
      'DS validates MCC (per [Req 98])',
      'DS checks the card range is participating (per [Req 99])',
      'DS checks the ACS is capable of processing 3DS 2.x (per [Req 100])',
      'DS generates a `dsTransID`',
      'DS stores the 3DS Server URL with the dsTransID for later callback',
      'DS forwards the AReq to the selected ACS',
    ],
    whyItExists: 'The DS is the protocol\'s gatekeeper. It stops malformed, misrouted, or out-of-scope AReq messages before they reach the issuer.',
    typicalDuration: '~70–400 ms (validation + routing + forward)',
    failureModes: [
      'Unsupported version: 102 (Message Version Number Not Supported)',
      'Bad 3DS Server Ref Number: 303 (Access Denied, Invalid Endpoint)',
      'Card not in participating range: 305 (Transaction Data Not Valid)',
      'MCC not valid: 306 (Merchant Category Code Not Valid)',
      'ACS unreachable: 405 (System Connection Failure) — exactly the code our step_7err1 shows',
    ],
    keyDataStructures: [
      { name: 'dsTransID', ref: '§A.5', description: 'UUID generated by DS. Acts as the routing token for the 3DS Server\'s retries.' },
    ],
    securityNotes: [
      'The DS is the only entity that knows the ACS address for a card range. An attacker who can\'t compromise the DS cannot route AReqs to attacker-controlled ACS endpoints.',
    ],
    color: '#8b5cf6',
  },
  {
    id: 'acs_decision',
    title: 'Step 8 — ACS Risk Decision',
    specSection: '§3.3 Step 8; §5.5, §5.9.2; [Req 102–111]',
    summary: 'The ACS validates the AReq, correlates it with any 3DS Method data, and decides on the final Transaction Status. The frictionless path exits here.',
    whatHappens: [
      'ACS validates the AReq (per §5.9.2)',
      'ACS checks device support (Browser Information per §A.6)',
      'ACS retrieves prior 3DS Method data (if 3DSMethodID is present in the AReq)',
      'ACS evaluates risk using: AReq fields, 3DS Method fingerprint, issuer-internal signals',
      'ACS sets the Transaction Status (Y / A / N / R / C / D)',
      'ACS generates the Authentication Value (CAVV) if authenticated',
      'ACS sends ARes to DS',
    ],
    whyItExists: 'The ACS is the issuer\'s risk boundary. It is the only place where a CAVV can be created, and the only place that can decide to challenge the cardholder.',
    typicalDuration: '~60–700 ms (validation + risk model + CAVV signing)',
    failureModes: [
      'AReq validation failure: Error Message (A.9)',
      '3DS Method ID doesn\'t match stored fingerprint: fingerprint discarded, ACS proceeds with AReq data only',
      'Risk model returns "challenge needed": ACS sets transStatus = C, browser must render challenge (we are showing frictionless only)',
    ],
    keyDataStructures: [
      { name: 'ARes', ref: 'Table B.2', description: 'messageType, messageVersion, threeDSServerTransID, acsTransID, acsReferenceNumber, dsTransID, transStatus, eci, authenticationValue (CAVV), acsChallengeMandated' },
      { name: 'transStatus', ref: '§A.10', description: 'Y / A / N / U / R / C / D — see spec for exact semantics of each value' },
    ],
    securityNotes: [
      'The CAVV is the cryptographic proof of authentication. The merchant must include it in the standard authorization message to receive the liability shift.',
      'The CAVV is signed by the issuer; the merchant\'s acquirer verifies it during the standard auth flow, not during 3DS.',
    ],
    color: '#10b981',
  },
  {
    id: 'ares',
    title: 'Step 9–10 — ARes Return',
    specSection: '§3.3 Steps 9–10; §5.9.3, §5.9.4; [Req 112–118]',
    summary: 'The ARes travels DS → 3DS Server → 3DS Requestor, each hop logging and validating. This is the branch point between frictionless completion and browser challenge.',
    whatHappens: [
      'DS validates the ARes (per §5.9.3)',
      'DS logs the transaction for dispute resolution',
      'DS forwards the ARes to the 3DS Server (using the URL stored in step 7b)',
      '3DS Server validates the ARes (per §5.9.4)',
      '3DS Server translates the ARes into a merchant-friendly result',
      'For Y/A/N/U/R: 3DS Server returns the result to the 3DS Requestor Environment and frictionless processing ends',
      'For C: 3DS Server prepares the browser CReq handoff and starts the challenge flow',
    ],
    whyItExists: 'Closes the initial AReq/ARes round-trip and tells the merchant whether 3DS is done or whether the browser challenge has to begin.',
    typicalDuration: '~30–200 ms',
    failureModes: [
      'ARes validation failure: 3DS Server surfaces error to merchant; merchant falls back to non-3DS',
      '3DS Server cannot reach 3DS Requestor: merchant never sees the result; merchant-side timeout applies',
    ],
    keyDataStructures: [
      { name: 'ARes', ref: 'Table B.2', description: 'Same structure as in step 8c; fields consumed by the merchant: transStatus, eci, authenticationValue' },
    ],
    securityNotes: [
      'The 3DS Server MUST validate the ARes before forwarding to the merchant (per [Req 115, 116, 118]) — otherwise a malicious DS could inject a forged authentication',
    ],
    color: '#06b6d4',
  },
  {
    id: 'challenge',
    title: 'Step 10 (CReq Handoff)–15 — Browser Challenge',
    specSection: '§3.3 Steps 10–15; §5.8.2; [Req 117, 119–123, 307, 356, 464]',
    summary: 'The 3DS Server posts a browser CReq through the Cardholder Browser, the ACS validates it and initializes challenge state, then the ACS renders challenge UI and the Cardholder submits the requested proof to the issuer.',
    whatHappens: [
      '3DS Server formats the browser CReq and Base64url-encodes it',
      '3DS Requestor Environment causes the Browser to POST the CReq form to the ACS URL from the ARes',
      'ACS validates the CReq, sets `interactionCounter = 0`, and prepares the framed challenge UI',
      'If the ACS receives a duplicate CReq, it either restarts/continues the challenge or returns an Error Message per [Req 442]',
      'Browser renders issuer-controlled HTML inside the challenge iframe',
      'Cardholder enters the requested proof (for example OTP)',
      'Browser submits the challenge data back to the ACS',
      'ACS evaluates the submission and decides: Y, N, or decoupled fallback',
    ],
    whyItExists: 'This is the cardholder-interactive branch of browser 3DS. It exists for the exact cases where the issuer cannot reach enough confidence from AReq data + 3DS Method alone.',
    typicalDuration: '~5–60 s (mostly human time)',
    failureModes: [
      'Browser cannot frame the ACS UI: challenge cannot complete in-browser',
      'Cardholder abandons or cancels the challenge: final result becomes N with a Challenge Cancelation Indicator in the RReq',
      'Wrong OTP / incomplete proof: ACS may re-render the challenge UI or terminate with N',
      'ACS determines decoupled fallback is necessary: browser challenge ends in a pending issuer-auth state',
    ],
    keyDataStructures: [
      { name: 'CReq', ref: 'Table B.3', description: 'Browser challenge request created by the 3DS Server and POSTed through the browser to the ACS URL from the ARes.' },
      { name: 'ACS URL', ref: 'Table B.2', description: 'Challenge endpoint returned in the ARes when the ACS sets transStatus = C.' },
      { name: 'threeDSSessionData', ref: 'Table A.3', description: 'Merchant-provided state that can round-trip through the challenge form and the final CRes POST, but the merchant should fall back to CRes identifiers if it is absent or corrupted.' },
    ],
    securityNotes: [
      'The ACS challenge UI must remain inside the authentication flow and must not redirect the user to unrelated registration or marketing pages.',
      'The merchant hosts the frame, but the challenge content itself is issuer-controlled and must be treated as a separate trust boundary.',
    ],
    color: '#ef4444',
  },
  {
    id: 'results',
    title: 'Step 16–21 — Results Exchange',
    specSection: '§3.3 Steps 16–21; [Req 124–140, 465, 466]',
    summary: 'After the ACS has a final challenge outcome, it sends RReq/RRes server-to-server and then posts the final CRes back through the browser to the merchant notification URL. The richer issuer outcome lives in the RReq; the final CRes is the browser-close signal.',
    whatHappens: [
      'ACS formats the RReq with the final outcome of the challenge',
      'DS validates and forwards the RReq to the 3DS Server using the URL stored from the original AReq',
      '3DS Server validates the RReq and returns an RRes acknowledgement',
      'DS validates/logs the RRes and forwards it back to the ACS',
      'ACS validates the RRes and then POSTs the final CRes to the merchant notification URL through the browser',
      '3DS Requestor Environment receives the CRes, closes the challenge iframe, and continues checkout handling',
    ],
    whyItExists: 'The browser-facing challenge UX and the server-facing final result are deliberately split. RReq/RRes gives the protocol a durable server-side completion signal, while the final CRes lets the merchant close the browser challenge cleanly.',
    typicalDuration: '~100–400 ms after the cardholder submits the challenge',
    failureModes: [
      'RReq validation failure: DS or 3DS Server ends processing before the merchant sees a durable final result',
      'Notification URL receives an invalid CRes: merchant should alert its 3DS Server and DS per the spec note in Step 22',
      'Decoupled fallback: the browser challenge closes, but the merchant must treat the transaction as pending rather than immediately successful',
    ],
    keyDataStructures: [
      { name: 'RReq', ref: 'Table B.8', description: 'Results Request from ACS to DS/3DS Server carrying the final challenge outcome.' },
      { name: 'RRes', ref: 'Table B.9', description: 'Acknowledgement from the 3DS Server back to the ACS that the final result was received.' },
      { name: 'final CRes', ref: 'Table B.5', description: 'Browser-facing completion message POSTed to the merchant notification URL so the challenge iframe can close; in the final CRes the transaction status is constrained to Y or N.' },
    ],
    securityNotes: [
      'The authoritative completion signal for challenge is the RReq, not just the browser-visible CRes.',
      'For decoupled fallback, the 3DS Server may set resultsStatus = 04 to mark the shift into asynchronous issuer authentication.',
    ],
    color: '#14b8a6',
  },
  {
    id: 'completion',
    title: 'Step 22 — Checkout Continuation',
    specSection: '§3.3 Step 22',
    summary: '3DS processing is over. The merchant either submits the standard authorization (success), handles the failure, or shows a pending state after decoupled fallback.',
    whatHappens: [
      'On success (Y / A): merchant includes ECI and CAVV in the standard authorization message; the issuer\'s standard auth flow then verifies the CAVV',
      'On failure (N / R): merchant typically declines',
      'On U (unable to authenticate): merchant can retry, fall back, or decline per its own risk policy',
      'After decoupled fallback: merchant closes the challenge frame and informs the cardholder that issuer approval will continue asynchronously',
    ],
    whyItExists: 'Defines the boundary between 3DS and the standard payment authorization flow. 3DS is an authentication add-on; the actual money movement is unchanged.',
    typicalDuration: '~0.1–2 s (the standard auth flow latency, not 3DS)',
    failureModes: [
      'Standard auth fails: 3DS success doesn\'t guarantee the charge goes through (e.g., insufficient funds, fraud after auth)',
    ],
    keyDataStructures: [
      { name: 'ECI', ref: '§A.10', description: 'Electronic Commerce Indicator. 05 for fully authenticated, 06 for attempted, 02 for non-3DS' },
      { name: 'CAVV', ref: '§A.10', description: 'Cardholder Authentication Verification Value — the CAVV generated by the ACS in step 8b' },
    ],
    securityNotes: [
      'A CAVV proves the issuer authenticated the cardholder for THIS transaction. It is single-use.',
      'The CAVV is the basis for the issuer\'s chargeback defense (the "3DS liability shift").',
    ],
    color: '#84cc16',
  },
];

// ──────────────────────────────────────────────────────────────────
// GLOSSARY — shown in the Reference tab of the Details Panel.
// A research-grade vocabulary of every term a researcher needs.
// ──────────────────────────────────────────────────────────────────
export const GLOSSARY: GlossaryEntry[] = [
  { term: '3DS Requestor', abbreviation: '3DS_REQ', definition: 'The merchant\'s checkout component. In a real implementation this is a combination of the merchant\'s web frontend, server-side SDK, and PCI-DSS-compliant PAN handling.', specRef: '§1.3.2' },
  { term: '3DS Server', definition: 'The acquirer/gateway component that orchestrates the protocol. Generates the 3DS Server Trans ID, builds the AReq, and translates the ARes into a merchant result.', specRef: '§1.3.3' },
  { term: 'Directory Server', abbreviation: 'DS', definition: 'The payment-system-operated service that holds the card range → ACS mapping and routes AReqs accordingly.', specRef: '§1.3.4' },
  { term: 'Access Control Server', abbreviation: 'ACS', definition: 'The issuer-side service that authenticates the cardholder and generates the CAVV.', specRef: '§1.3.5' },
  { term: '3DS Server Transaction ID', abbreviation: 'threeDSServerTransID', definition: 'UUID v4 generated by the 3DS Server. Links the 3DS Method data (step 4) to the AReq (step 6) and the ARes (step 8c).', specRef: '§A.5', example: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d' },
  { term: 'DS Transaction ID', abbreviation: 'dsTransID', definition: 'UUID generated by the DS when an AReq arrives. Stays constant across retries.', specRef: '§A.5' },
  { term: 'ACS Transaction ID', abbreviation: 'acsTransID', definition: 'UUID generated by the ACS for the transaction. Issuer-controlled.', specRef: '§A.5' },
  { term: 'ACS Reference Number', abbreviation: 'acsReferenceNumber', definition: 'Identifier assigned to the ACS at registration with the payment system. Used by the DS to verify the ARes sender.', specRef: '§A.5' },
  { term: '3DS Requestor ID', abbreviation: 'threeDSRequestorID', definition: 'Identifier assigned to the merchant by the payment system. Uniquely identifies the merchant to the DS.', specRef: '§A.5' },
  { term: '3DS Method', definition: 'An optional hidden iframe flow that lets the ACS collect Browser fingerprint data correlated to the 3DS Server Trans ID. Max duration: 5 seconds (per [Req 315]).', specRef: '§5.8.1' },
  { term: '3DS Method Completion Indicator', abbreviation: 'threeDSCompInd', definition: 'Set by the 3DS Server in the AReq. Y = completed, N = not completed, U = unavailable.', specRef: '§A.5' },
  { term: 'AReq', definition: 'Authentication Request — the main message from 3DS Server to ACS. ~150 fields.', specRef: 'Table B.1' },
  { term: 'ARes', definition: 'Authentication Response — the main message from ACS to 3DS Server. Carries transStatus, ECI, and CAVV.', specRef: 'Table B.2' },
  { term: 'CReq', definition: 'Challenge Request — in browser flows, this is created by the 3DS Server, Base64url-encoded, and POSTed through the Cardholder Browser to the ACS URL returned in the ARes.', specRef: 'Table B.3' },
  { term: 'CRes', definition: 'Challenge Response — the challenge completion message the ACS posts back through the browser to the merchant notification URL so the challenge iframe can close. In the final CRes, the Transaction Status is constrained to Y or N.', specRef: 'Table B.5' },
  { term: 'PReq', definition: 'Preparation Request — the pre-auth cache refresh request from 3DS Server to DS.', specRef: 'Table B.6' },
  { term: 'PRes', definition: 'Preparation Response — the pre-auth cache response from DS to 3DS Server. Contains card range data.', specRef: 'Table B.7' },
  { term: 'RReq', definition: 'Results Request — the final server-to-server challenge outcome sent from ACS to DS and then to the 3DS Server.', specRef: 'Table B.8' },
  { term: 'RRes', definition: 'Results Response — the acknowledgement sent back from the 3DS Server to the ACS after receiving the RReq.', specRef: 'Table B.9' },
  { term: 'CAVV', definition: 'Cardholder Authentication Verification Value — the cryptographic proof of authentication, generated by the ACS. The merchant includes it in the standard authorization message.', specRef: 'Table A.1 (§A.4) — authenticationValue' },
  { term: 'ECI', definition: 'Electronic Commerce Indicator — 05 (fully authenticated), 06 (attempted), 02 (non-3DS). Tells the issuer\'s standard auth flow what 3DS result to expect.', specRef: 'Table A.1 (§A.4) — eci' },
  { term: 'Transaction Status', abbreviation: 'transStatus', definition: 'The ACS\'s decision: Y (authenticated), A (attempted), N (not authenticated), U (unable to authenticate), R (rejected), C (challenge required), D (decoupled), I (information only), or S (secure payment confirmation). In the final CRes, the allowed values are limited to Y or N.', specRef: 'Table A.1 (§A.4) — transStatus; Table A.17 for per-message restrictions' },
  { term: 'ACS URL', abbreviation: 'acsURL', definition: 'Challenge endpoint returned in the ARes when the ACS requires browser challenge. The browser posts the encoded CReq to this URL.', specRef: 'Table B.2' },
  { term: 'ACS Challenge Mandated', abbreviation: 'acsChallengeMandated', definition: 'Indicator in the ARes that helps the 3DS Requestor decide whether it will honor the requested challenge.', specRef: 'Table B.2' },
  { term: 'Challenge Cancelation Indicator', abbreviation: 'challengeCancelationIndicator', definition: 'Field set in the RReq when the Cardholder abandons or cancels the browser challenge. It distinguishes a user-side cancellation from other negative outcomes.', specRef: '§3.3 Step 16 / Annex A' },
  { term: 'Challenge Completion Indicator', abbreviation: 'challengeCompletionInd', definition: 'Field carried in challenge completion messages to signal whether the challenge interaction reached a final state.', specRef: 'Table B.5 / B.8' },
  { term: 'Interaction Counter', abbreviation: 'interactionCounter', definition: 'Counter maintained by the ACS across challenge attempts so the issuer can limit the number of retries before ending the challenge.', specRef: 'Glossary / §3.3 Steps 11 & 15' },
  { term: 'threeDSSessionData', definition: 'Merchant-provided opaque state that may be included with the browser CReq and returned with the final CRes POST. It is a correlation aid, not the only recovery handle: if it is absent, corrupted, or incorrect the merchant should fall back to the CRes transaction identifiers.', specRef: 'Table A.3' },
  { term: 'Cardholder Information Text', abbreviation: 'cardholderInfoText', definition: 'Issuer-provided text that the 3DS Server conveys to the 3DS Requestor Environment, often used to explain a pending or decoupled authentication state to the user.', specRef: '§3.3 Step 10 [Req 356]' },
  { term: 'Error Message', abbreviation: 'messageType = "Erro"', definition: 'A non-standard message used to communicate protocol errors. Carries errorCode, errorComponent (A/D/S), errorDescription, and errorDetail.', specRef: '§A.9' },
  { term: 'Frictionless', definition: 'A 3DS flow that completes without challenging the cardholder. The ACS decides "this is low-risk" based on the AReq and 3DS Method data.', specRef: '§3.3 Step 8' },
  { term: 'Challenge', definition: 'A 3DS flow where the ACS shows the cardholder an authentication challenge (e.g., OTP). Used when frictionless isn\'t possible.', specRef: '§3.3 Steps 11–21' },
  { term: 'Decoupled Authentication Fallback', definition: 'A challenge-time pivot where the ACS ends the browser challenge and continues issuer authentication asynchronously, returning `transStatus = D` in the results exchange.', specRef: '§3.3 Steps 15–16 [Req 464, 465]' },
  { term: 'Liability Shift', definition: 'A commercial rule: when 3DS authenticates a transaction, the chargeback liability moves from the merchant to the issuer.', specRef: '§1.4 — Liability' },
  { term: 'Frictionless Rate', definition: 'The percentage of transactions that complete without a challenge. Driven by data quality (AReq + 3DS Method) and issuer risk model.', specRef: 'Operational metric' },
];

/**
 * Risk taxonomy — single source of truth for the Security Lens's
 * inferred risk level. Previously these three Sets lived inside
 * `DetailsPanel.tsx`, which meant edits to the per-step entries in
 * `SECURITY_LENS_BY_STEP` could drift away from the inferred risk
 * without anyone noticing. Now the Sets are co-located with the
 * per-step notes, and `inferRiskLevelForStep` is the only function
 * the panel calls.
 */
export const HIGH_RISK_STEPS = new Set<string>([
  'step_10e', 'step_11a', 'step_11b', 'step_11', 'step_16e', 'step_16f', 'step_17',
  'step_21a', 'step_21b', 'step_21c', 'step_22e',
]);

export const CRITICAL_RISK_STEPS = new Set<string>(['step_22_invalid']);

export const MEDIUM_RISK_STEPS = new Set<string>([
  'step_3b', 'step_4b', 'step_5', 'step_6a', 'step_7a', 'step_7err1', 'step_8a',
  'step_10c', 'step_10d', 'step_12', 'step_15b', 'step_21_err', 'step_21_close',
  'step_22d', 'step_22f', 'step_22g',
]);

/**
 * Look up the inferred risk level for a step. Per-step entries in
 * `SECURITY_LENS_BY_STEP` take precedence; only when the entry omits
 * `riskLevel` do we fall back to the taxonomy Sets. Returns
 * `'low'` when nothing else matches.
 */
export function inferRiskLevelForStep(
  stepId: string,
  explicitRiskLevel?: SecurityLensNote['riskLevel'],
): NonNullable<SecurityLensNote['riskLevel']> {
  if (explicitRiskLevel) return explicitRiskLevel;
  if (CRITICAL_RISK_STEPS.has(stepId)) return 'critical';
  if (HIGH_RISK_STEPS.has(stepId)) return 'high';
  if (MEDIUM_RISK_STEPS.has(stepId)) return 'medium';
  return 'low';
}
