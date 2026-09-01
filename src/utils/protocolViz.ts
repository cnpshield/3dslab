/**
 * Canonical implementations of payload-shaping helpers used by both the
 * main `App.tsx` and the `DetailsPanel` inspector. Keeping them here
 * (rather than duplicated inline) means the spec-accurate version is
 * the one that ships, and the two views never drift apart.
 */

import type { FlowStep, ProtocolVersion, Scenario, StepGroupMeta } from '../types';
import { getPayload } from '../data/payloads';
import { getPayloadTransStatus, getPayloadTransStatusReason } from './transStatus';

export interface CorrelationEntry {
  key: string;
  value: string;
  source: 'payload' | 'body' | 'decodedData' | 'fields';
}

export interface ScenarioBranchMeta {
  branchId: string;
  label: string;
  summary: string;
  lane: 'frictionless' | 'challenge' | 'failure' | 'decoupled' | 'info' | 'spc';
  branchKind: 'happy' | 'alternative' | 'terminal' | 'async';
}

export interface VersionDiffSummary {
  compareVersion: ProtocolVersion;
  added: StepGroupMeta[];
  removed: StepGroupMeta[];
  unchanged: StepGroupMeta[];
}

export const PROTOCOL_VERSIONS: ProtocolVersion[] = ['2.1.0', '2.2.0', '2.3.1', '2.4.0'];

const VERSION_ORDER: Record<ProtocolVersion, number> = {
  '2.1.0': 1,
  '2.2.0': 2,
  '2.3.1': 3,
  '2.4.0': 4,
};

const CORRELATION_KEYS = [
  'messageType',
  'messageVersion',
  'threeDSServerTransID',
  'dsTransID',
  'acsTransID',
  'sdkTransID',
  'resultsStatus',
  'transStatus',
  'challengeCancel',
  'threeDSCompInd',
  'threeDSRequestorChallengeInd',
  'acsChallengeMandated',
  'acsRenderingType',
  'acsDecConInd',
  'authenticationValue',
  'eci',
  'cavv',
  'xid',
  'errorCode',
  'errorComponent',
];

const APP_DEVICE_CHANNEL = '01';
const BROWSER_DEVICE_CHANNEL = '02';
const LAB_SDK_TRANS_ID = 'sdk-tx-001';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function applyChallengePreference(container: Record<string, unknown>, scenario: Scenario): void {
  if (container.threeDSRequestorChallengeInd === undefined) return;
  container.threeDSRequestorChallengeInd =
    scenario.protocolVersion === '2.3.1' || scenario.protocolVersion === '2.4.0'
      ? [scenario.challengePreference]
      : scenario.challengePreference;
}

function applyChallengeMandated(container: Record<string, unknown>, scenario: Scenario): void {
  if (container.acsChallengeMandated === undefined) return;
  container.acsChallengeMandated =
    scenario.transStatus === 'C'
      ? scenario.challengeMandated
      : 'N';
}

function stripBrowserFields(container: Record<string, unknown>): void {
  [
    'browserIP',
    'browserAcceptHeader',
    'browserLanguage',
    'browserUserAgent',
    'browserScreenWidth',
    'browserScreenHeight',
    'browserColorDepth',
    'browserTZ',
    'browserJavaEnabled',
    'browserJavascriptEnabled',
    'acceptLanguage',
  ].forEach((key) => delete container[key]);
}

function applyAppAReqFields(container: Record<string, unknown>): void {
  stripBrowserFields(container);
  container.deviceChannel = APP_DEVICE_CHANNEL;
  container.sdkAppID = '9d4b4b2b-6d73-4dc4-9f55-5f4cf4f10f10';
  container.sdkEncData = 'eyJraWQiOiJsYWItc2RrLWVuYy0wMDEifQ.eyJkZXZpY2UiOiJzeW50aGV0aWMifQ.signature';
  container.sdkEphemPubKey = {
    kty: 'EC',
    crv: 'P-256',
    x: 'MKBCTNIcX4x5lJQ3K0e7gL7uQ8rS6h1XxJv3Q0vL0mM',
    y: '4Etl6SRW2Yl9dA4T4zqM7l2fF0y0yX8l5Jf9h8nW2bI',
  };
  container.sdkMaxTimeout = '05';
  container.sdkReferenceNumber = '3DS_LOA_SDK_PPFU_020100_00007';
  container.sdkTransID = LAB_SDK_TRANS_ID;
  if (container.sdkType !== undefined) container.sdkType = '01';
  if (container.defaultSdkType !== undefined) {
    container.defaultSdkType = {
      sdkInterface: '01',
      sdkUiType: ['01', '02', '03'],
    };
  }
  if (container.splitSdkType !== undefined) container.splitSdkType = {};
  if (container.sdkServerSignedContent !== undefined) {
    container.sdkServerSignedContent = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImxhYi1zZGstc2lnbi0wMDEifQ.eyJzZGtUcmFuc0lE Ijoic2RrLXR4LTAwMSJ9.signature'.replace(' ', '');
  }
  if (container.appIp !== undefined) container.appIp = '198.51.100.42';
}

function applyDeviceChannelOverlay(
  payload: Record<string, unknown>,
  step: FlowStep,
  scenario: Scenario,
): void {
  const isApp = scenario.deviceChannel === 'app';
  const containers = [
    payload,
    asRecord(payload.body),
    asRecord(payload.decodedData),
  ].filter((value): value is Record<string, unknown> => Boolean(value));

  containers.forEach((container) => {
    if (container.deviceChannel !== undefined) {
      container.deviceChannel = isApp ? APP_DEVICE_CHANNEL : BROWSER_DEVICE_CHANNEL;
    }

    applyChallengePreference(container, scenario);
    applyChallengeMandated(container, scenario);

    const messageType = typeof container.messageType === 'string'
      ? container.messageType
      : step.messageType;

    if (isApp) {
      if (messageType === 'AReq') applyAppAReqFields(container);

      if (['ARes', 'CReq', 'CRes', 'RReq', 'RRes', 'Erro'].includes(messageType || '')) {
        container.sdkTransID = LAB_SDK_TRANS_ID;
      }

      if ((messageType === 'ARes' || messageType === 'RReq') && asRecord(container.acsRenderingType)) {
        (container.acsRenderingType as Record<string, unknown>).acsInterface = '01';
      }

      if (messageType === 'CReq' && container.threeDSRequestorAppURL !== undefined) {
        container.threeDSRequestorAppURL = 'myapp://3ds/challenge';
      }
    } else {
      if (['ARes', 'CReq', 'CRes', 'RReq', 'RRes', 'Erro'].includes(messageType || '') && container.sdkTransID !== undefined) {
        container.sdkTransID = '';
      }

      if ((messageType === 'ARes' || messageType === 'RReq') && asRecord(container.acsRenderingType)) {
        (container.acsRenderingType as Record<string, unknown>).acsInterface = '02';
      }

      if (messageType === 'CReq' && container.threeDSRequestorAppURL !== undefined) {
        container.threeDSRequestorAppURL = '';
      }
    }
  });
}

/**
 * Resolve a FlowStep's payload to a JSON object for a given scenario.
 *
 * Resolution order:
 *   1. If `step.payload` is a function, call it with the scenario and
 *      deep-copy the result so downstream mutations cannot leak across
 *      re-renders.
 *   2. If `step.payload` is an object, deep-copy it.
 *   3. If neither is set but `step.messageType` is set, build the
 *      payload from the versioned registry at
 *      `src/data/payloads/index.ts`. The active protocol version is
 *      taken from `scenario.protocolVersion`.
 *   4. Otherwise, return null.
 *
 * After materialising the payload, the function overlays scenario-driven
 * fields (transStatus, threeDSCompInd, resultsStatus) on top so the
 * inspector always reflects the current scenario.
 */
export function getDynamicPayload(step: FlowStep, scenario: Scenario): Record<string, unknown> | null {
  let payload: Record<string, unknown> | null = null;

  if (typeof step.payload === 'function') {
    const built = (step.payload as (s: Scenario) => Record<string, unknown>)(scenario);
    payload = JSON.parse(JSON.stringify(built)) as Record<string, unknown>;
  } else if (step.payload && typeof step.payload === 'object') {
    payload = JSON.parse(JSON.stringify(step.payload)) as Record<string, unknown>;
  } else if (step.messageType) {
    payload = getPayload(step.messageType, scenario);
  }

  if (!payload) return null;

  applyDeviceChannelOverlay(payload, step, scenario);

  const payloadTransStatus = getPayloadTransStatus(step, scenario);

  if (payload.transStatus !== undefined) payload.transStatus = payloadTransStatus;
  if (payload.transStatusReason !== undefined) {
    payload.transStatusReason = getPayloadTransStatusReason(step, scenario, payloadTransStatus);
  }

  const body = payload.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    if ((body as Record<string, unknown>).transStatus !== undefined) {
      (body as Record<string, unknown>).transStatus = payloadTransStatus;
    }
    if ((body as Record<string, unknown>).transStatusReason !== undefined) {
      (body as Record<string, unknown>).transStatusReason =
        getPayloadTransStatusReason(step, scenario, payloadTransStatus);
    }
  }

  const threeDSCompInd =
    scenario.methodPath === 'reused' || scenario.methodPath === 'executed'
      ? 'Y'
      : scenario.methodPath === 'unavailable'
        ? 'U'
        : 'N';

  if (payload.threeDSCompInd !== undefined) payload.threeDSCompInd = threeDSCompInd;
  if (body && typeof body === 'object' && !Array.isArray(body) && (body as Record<string, unknown>).threeDSCompInd !== undefined) {
    (body as Record<string, unknown>).threeDSCompInd = threeDSCompInd;
  }

  if ((step.id === 'step_18' || step.id === 'step_19') && payload.resultsStatus !== undefined) {
    payload.resultsStatus =
      scenario.challengeOutcome === 'optout'
        ? '02'
        : scenario.challengeOutcome === 'decoupled'
          ? '04'
          : '01';
  }

  return payload;
}

export function stringifyPayloadForInspector(
  payload: Record<string, unknown> | null,
  payloadType: FlowStep['payloadType'],
): string {
  if (!payload) return '';

  if (payloadType === 'form') {
    const fields = payload.fields;
    if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
      return Object.entries(fields as Record<string, unknown>)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join('&');
    }
  }

  return JSON.stringify(payload, null, 2);
}

export function extractCorrelationEntries(
  payload: Record<string, unknown> | null,
  limit = 8,
): CorrelationEntry[] {
  if (!payload) return [];

  const candidates: Array<{ source: CorrelationEntry['source']; value: Record<string, unknown> }> = [
    { source: 'payload', value: payload },
  ];

  (['body', 'decodedData', 'fields'] as const).forEach((key) => {
    const nested = payload[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      candidates.push({ source: key, value: nested as Record<string, unknown> });
    }
  });

  const seen = new Set<string>();
  const entries: CorrelationEntry[] = [];

  candidates.forEach(({ source, value }) => {
    CORRELATION_KEYS.forEach((key) => {
      const raw = value[key];
      if (raw === undefined || raw === null || raw === '') return;

      const dedupeKey = `${key}:${String(raw)}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      entries.push({
        key,
        value: Array.isArray(raw) ? raw.join(', ') : String(raw),
        source,
      });
    });
  });

  return entries.slice(0, limit);
}

export function getScenarioBranchMeta(scenario: Scenario): ScenarioBranchMeta {
  if (scenario.challengeOutcome === 'optout') {
    return {
      branchId: 'optout',
      label: 'Requestor Opt-out',
      summary: 'The requested challenge is skipped locally and the results loop closes with resultsStatus 02.',
      lane: 'challenge',
      branchKind: 'alternative',
    };
  }

  if (scenario.dsRouting === 'failure') {
    return {
      branchId: 'ds_failure',
      label: 'DS Routing Failure',
      summary: 'Directory Server validation fails before issuer routing, producing an unavailable outcome.',
      lane: 'failure',
      branchKind: 'terminal',
    };
  }

  switch (scenario.transStatus) {
    case 'Y':
      return {
        branchId: 'frictionless_y',
        label: 'Frictionless Authentication',
        summary: 'The issuer authenticates without challenge, so the flow closes on ARes with no CReq/CRes or RReq/RRes results loop.',
        lane: 'frictionless',
        branchKind: 'happy',
      };
    case 'A':
      return {
        branchId: 'attempts_a',
        label: 'Attempts Outcome',
        summary: 'Authentication is attempted and recorded, but the final state is not a full issuer-authenticated success.',
        lane: 'frictionless',
        branchKind: 'alternative',
      };
    case 'C':
      return {
        branchId: `challenge_${scenario.challengeOutcome}`,
        label: 'Challenge Branch',
        summary:
          scenario.challengeOutcome === 'success'
            ? 'The challenge completes successfully and the results loop closes with an authenticated state.'
            : scenario.challengeOutcome === 'decoupled'
              ? 'The challenge pivots into an asynchronous issuer-controlled decoupled path.'
              : scenario.challengeOutcome === 'invalid_cres'
                ? 'The challenge returns a completion artifact that the requestor must reject.'
                : scenario.challengeOutcome === 'error'
                  ? 'The challenge ends in an explicit error notification path.'
                  : 'The challenge becomes the decisive branch for the transaction outcome.',
        lane: 'challenge',
        branchKind: scenario.challengeOutcome === 'decoupled' ? 'async' : 'alternative',
      };
    case 'D':
      return {
        branchId: 'decoupled_d',
        label: 'Decoupled Authentication',
        summary: 'The issuer moves authentication out of the immediate requestor session and waits for the authoritative RReq.',
        lane: 'decoupled',
        branchKind: 'async',
      };
    case 'I':
      return {
        branchId: 'info_only',
        label: 'Information Only',
        summary: 'The issuer returns data useful for risk analysis without authenticating the cardholder.',
        lane: 'info',
        branchKind: 'alternative',
      };
    case 'S':
      return {
        branchId: 'spc_s',
        label: 'SPC / WebAuthn',
        summary: 'The browser path uses Secure Payment Confirmation instead of the standard challenge iframe.',
        lane: 'spc',
        branchKind: 'happy',
      };
    case 'N':
    case 'R':
    case 'U':
      return {
        branchId: `terminal_${scenario.transStatus.toLowerCase()}`,
        label: 'Terminal Negative Outcome',
        summary: 'The protocol reaches a negative or unavailable terminal state and checkout must not treat it as authenticated.',
        lane: 'failure',
        branchKind: 'terminal',
      };
    default:
      return {
        branchId: 'default',
        label: 'Protocol Branch',
        summary: 'Inspect the branch map and the step inspector to understand the active path.',
        lane: 'frictionless',
        branchKind: 'alternative',
      };
  }
}

export function getVersionDiffSummary(
  activeVersion: ProtocolVersion,
  compareVersion: ProtocolVersion | null,
  groups: StepGroupMeta[],
): VersionDiffSummary | null {
  if (!compareVersion || compareVersion === activeVersion) return null;

  const activeRank = VERSION_ORDER[activeVersion];
  const compareRank = VERSION_ORDER[compareVersion];

  const added: StepGroupMeta[] = [];
  const removed: StepGroupMeta[] = [];
  const unchanged: StepGroupMeta[] = [];

  groups.forEach((group) => {
    const introducedRank = VERSION_ORDER[group.introducedIn ?? '2.1.0'];
    const visibleInActive = activeRank >= introducedRank;
    const visibleInCompare = compareRank >= introducedRank;

    if (visibleInActive && !visibleInCompare) added.push(group);
    else if (!visibleInActive && visibleInCompare) removed.push(group);
    else unchanged.push(group);
  });

  return {
    compareVersion,
    added,
    removed,
    unchanged,
  };
}

export function isVersionAtLeast(version: ProtocolVersion, minimum: ProtocolVersion): boolean {
  return VERSION_ORDER[version] >= VERSION_ORDER[minimum];
}

/**
 * Walk a payload shape and return every field name (top-level + common
 * nested containers). Single source of truth used by the Security Lens
 * to derive an artifact-focus list and by the validator to enumerate
 * fields for cross-referencing.
 */
export function extractPayloadFields(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return [];
  const data = payload as Record<string, unknown>;
  const fields = new Set<string>();

  Object.keys(data).forEach((key) => fields.add(key));

  const nestedCandidates = ['body', 'decodedData', 'fields'] as const;
  for (const key of nestedCandidates) {
    const value = data[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value as Record<string, unknown>).forEach((nestedKey) => fields.add(nestedKey));
    }
  }

  return Array.from(fields);
}

/**
 * Validate a Scenario object. Returns a list of human-readable errors
 * describing missing or wrong-typed fields. Used by `parseSnapshot` to
 * surface malformed snapshot files before they crash the flow reducer
 * downstream.
 */
export function validateScenario(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ['Scenario must be a JSON object.'];
  }
  const obj = value as Record<string, unknown>;
  const errors: string[] = [];
  const required: Array<{ key: keyof Scenario; type: 'string'; values?: readonly string[] }> = [
    { key: 'protocolVersion', type: 'string', values: PROTOCOL_VERSIONS as readonly string[] },
    { key: 'deviceChannel', type: 'string', values: ['browser', 'app'] },
    { key: 'methodPath', type: 'string', values: ['reused', 'executed', 'unavailable', 'timeout'] },
    { key: 'dsRouting', type: 'string', values: ['normal', 'failure'] },
    { key: 'transStatus', type: 'string', values: ['Y', 'A', 'N', 'U', 'R', 'C', 'D', 'I', 'S'] },
    { key: 'challengeOutcome', type: 'string', values: ['success', 'failure', 'cancelled', 'decoupled', 'optout', 'error', 'invalid_cres'] },
    { key: 'errorPath', type: 'string', values: ['none', 'cres_invalid', 'acs_error', 'browser_timeout'] },
    { key: 'challengePreference', type: 'string', values: ['01', '02', '03', '04'] },
    { key: 'challengeMandated', type: 'string', values: ['Y', 'N'] },
    { key: 'challengePresentation', type: 'string', values: ['html', 'oob'] },
  ];

  for (const field of required) {
    const actual = obj[field.key];
    if (typeof actual !== 'string') {
      errors.push(`Scenario.${field.key} is missing or not a string.`);
      continue;
    }
    if (field.values && !field.values.includes(actual)) {
      errors.push(`Scenario.${field.key} = "${actual}" is not one of [${field.values.join(', ')}].`);
    }
  }

  if (typeof obj.repeatChallenge !== 'boolean') {
    errors.push('Scenario.repeatChallenge is missing or not a boolean.');
  }

  return errors;
}
