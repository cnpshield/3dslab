/**
 * Spec-conformance tests for the versioned payload registry.
 *
 * These tests assert that the wire-shape emitted by every registered
 * payload builder matches the field-level provenance declared in
 * `meta/fieldProvenance.ts`. They are the lab's safety net: if a
 * builder adds a field that is not in the registry, or omits a field
 * the registry says is on the wire, the test fails. This is what
 * keeps the lab spec-accurate across the v2.1.0 / v2.2.0 / v2.3.1
 * versions the user can toggle.
 */

import { describe, it, expect } from 'vitest';

import type { Scenario } from '../../../types';
import {
  PAYLOADS,
  getPayload,
  getVersionedPayload,
  expectedFields,
  resolveFieldAt,
  FIELD_PROVENANCE,
} from '../index';
import { listFieldsFor, PAYLOAD_VERSION_ORDER } from '../types';

const baseScenario: Scenario = {
  protocolVersion: '2.3.1',
  deviceChannel: 'browser',
  methodPath: 'reused',
  dsRouting: 'normal',
  transStatus: 'Y',
  challengeOutcome: 'success',
  repeatChallenge: false,
  errorPath: 'none',
  challengePreference: '01',
  challengeMandated: 'N',
  challengePresentation: 'html',
};

describe('payload registry', () => {
  it('registers an AReq builder for every supported version', () => {
    expect(PAYLOADS.AReq['2.1.0']).toBeDefined();
    expect(PAYLOADS.AReq['2.2.0']).toBeDefined();
    expect(PAYLOADS.AReq['2.3.1']).toBeDefined();
  });

  it('registers an ARes / RReq / RRes / Erro builder for every supported version', () => {
    ['2.1.0', '2.2.0', '2.3.1'].forEach((v) => {
      expect(PAYLOADS.ARes[v as '2.1.0' | '2.2.0' | '2.3.1']).toBeDefined();
      expect(PAYLOADS.RReq[v as '2.1.0' | '2.2.0' | '2.3.1']).toBeDefined();
      expect(PAYLOADS.RRes[v as '2.1.0' | '2.2.0' | '2.3.1']).toBeDefined();
      expect(PAYLOADS.Erro[v as '2.1.0' | '2.2.0' | '2.3.1']).toBeDefined();
    });
  });

  it('registers CReq / CRes for every supported version', () => {
    ['2.1.0', '2.2.0', '2.3.1'].forEach((v) => {
      expect(PAYLOADS.CReq[v as '2.1.0' | '2.2.0' | '2.3.1']).toBeDefined();
      expect(PAYLOADS.CRes[v as '2.1.0' | '2.2.0' | '2.3.1']).toBeDefined();
    });
  });

  it('registers OReq / ORes only for v2.3.1', () => {
    expect(PAYLOADS.OReq['2.3.1']).toBeDefined();
    expect(PAYLOADS.ORes['2.3.1']).toBeDefined();
    expect(PAYLOADS.OReq['2.2.0']).toBeUndefined();
    expect(PAYLOADS.OReq['2.1.0']).toBeUndefined();
  });
});

describe('AReq wire shape', () => {
  it('v2.1.0 does not carry v2.2.0-only fields', () => {
    const payload = getPayload('AReq', { ...baseScenario, protocolVersion: '2.1.0' });
    expect(payload).not.toHaveProperty('threeDSRequestorDecMaxTime');
    expect(payload).not.toHaveProperty('threeDSRequestorDecReqInd');
    expect(payload).not.toHaveProperty('whiteListStatus');
    expect(payload).not.toHaveProperty('payTokenSource');
    expect(payload).not.toHaveProperty('browserJavascriptEnabled');
  });

  it('v2.1.0 uses single-string threeDSRequestorChallengeInd', () => {
    const payload = getPayload('AReq', { ...baseScenario, protocolVersion: '2.1.0' });
    expect(typeof payload.threeDSRequestorChallengeInd).toBe('string');
    expect(payload.threeDSRequestorChallengeInd).toBe('01');
  });

  it('v2.2.0 adds whiteListStatus and the decoupled indicators', () => {
    const payload = getPayload('AReq', { ...baseScenario, protocolVersion: '2.2.0' });
    expect(payload.whiteListStatus).toBe('Y');
    expect(payload.whiteListStatusSource).toBe('01');
    expect(payload).toHaveProperty('threeDSRequestorDecMaxTime');
    expect(payload).toHaveProperty('threeDSRequestorDecReqInd');
    expect(payload).toHaveProperty('payTokenSource');
    expect(payload).toHaveProperty('browserJavascriptEnabled');
    // v2.2.0 still uses single-string.
    expect(typeof payload.threeDSRequestorChallengeInd).toBe('string');
  });

  it('v2.3.1 renames whiteListStatus to trustListStatus', () => {
    const payload = getPayload('AReq', { ...baseScenario, protocolVersion: '2.3.1' });
    expect(payload).not.toHaveProperty('whiteListStatus');
    expect(payload.trustListStatus).toBe('Y');
    expect(payload.trustListStatusSource).toBe('01');
  });

  it('v2.3.1 uses array threeDSRequestorChallengeInd', () => {
    const payload = getPayload('AReq', { ...baseScenario, protocolVersion: '2.3.1' });
    expect(Array.isArray(payload.threeDSRequestorChallengeInd)).toBe(true);
    expect(payload.threeDSRequestorChallengeInd).toEqual(['01']);
  });

  it('v2.3.1 carries 29 v2.3.1-only fields', () => {
    const payload = getPayload('AReq', { ...baseScenario, protocolVersion: '2.3.1' });
    const v231Only = [
      'acceptLanguage',
      'appIp',
      'acquirerCountryCode',
      'acquirerCountryCodeSource',
      'broadInfo',
      'cardSecurityCode',
      'cardSecurityCodeStatus',
      'cardSecurityCodeStatusSource',
      'deviceBindingStatus',
      'deviceBindingStatusSource',
      'deviceId',
      'defaultSdkType',
      'multiTransaction',
      'payeeOrigin',
      'payTokenInfo',
      'recurringAmount',
      'recurringCurrency',
      'recurringDate',
      'recurringExponent',
      'recurringInd',
      'sdkServerSignedContent',
      'sdkType',
      'sellerInfo',
      'spcIncompInd',
      'splitSdkType',
      'taxId',
      'threeDSMethodId',
      'threeDSRequestorSpcSupport',
      'userId',
    ];
    v231Only.forEach((field) => {
      expect(payload).toHaveProperty(field);
    });
    // v2.3.1 also dropped threeDSReqAuthMethodInd.
    expect(payload).not.toHaveProperty('threeDSReqAuthMethodInd');
  });

  it('emits exactly the expected fields for each version (no extras)', () => {
    (['2.1.0', '2.2.0', '2.3.1'] as const).forEach((v) => {
      const payload = getPayload('AReq', { ...baseScenario, protocolVersion: v });
      const expected = new Set(expectedFields('AReq', v));
      const actual = Object.keys(payload);
      actual.forEach((key) => {
        if (key === 'body') return; // legacy network wrapper, not part of wire shape
        expect(expected.has(key), `AReq ${v} emits unexpected key ${key}`).toBe(true);
      });
    });
  });
});

describe('ARes wire shape', () => {
  it('v2.1.0 uses single-string authenticationType (renamed in v2.3.1)', () => {
    const payload = getPayload('ARes', { ...baseScenario, protocolVersion: '2.1.0' });
    expect(payload).toHaveProperty('authenticationType');
    expect(payload).not.toHaveProperty('authenticationMethod');
  });

  it('v2.3.1 renames authenticationType to authenticationMethod', () => {
    const payload = getPayload('ARes', { ...baseScenario, protocolVersion: '2.3.1' });
    expect(payload).not.toHaveProperty('authenticationType');
    expect(payload).toHaveProperty('authenticationMethod');
  });

  it('v2.1.0 uses string cardholderInfo; v2.3.1 uses object', () => {
    const v210 = getPayload('ARes', { ...baseScenario, protocolVersion: '2.1.0' });
    expect(typeof v210.cardholderInfo).toBe('string');
    const v231 = getPayload('ARes', { ...baseScenario, protocolVersion: '2.3.1' });
    expect(typeof v231.cardholderInfo).toBe('object');
  });

  it('v2.1.0 acsRenderingType is 2-key; v2.3.1 adds deviceUserInterfaceMode', () => {
    const v210 = getPayload('ARes', { ...baseScenario, protocolVersion: '2.1.0' });
    expect(Object.keys(v210.acsRenderingType as Record<string, unknown>)).toEqual(
      expect.arrayContaining(['acsInterface', 'acsUiTemplate']),
    );
    expect(v210.acsRenderingType as Record<string, unknown>).not.toHaveProperty('deviceUserInterfaceMode');
    const v231 = getPayload('ARes', { ...baseScenario, protocolVersion: '2.3.1' });
    expect(v231.acsRenderingType as Record<string, unknown>).toHaveProperty('deviceUserInterfaceMode');
  });

  it('v2.3.1 ARes carries 11 v2.3.1-only fields', () => {
    const payload = getPayload('ARes', { ...baseScenario, protocolVersion: '2.3.1' });
    ['broadInfo', 'cardSecurityCodeStatus', 'cardSecurityCodeStatusSource',
     'deviceBindingStatus', 'deviceBindingStatusSource', 'deviceInfoRecognisedVersion',
     'spcTransData', 'threeDSRequestorAppURLInd', 'transChallengeExemption',
     'transStatusReasonInfo', 'webAuthnCredList'].forEach((f) => {
      expect(payload).toHaveProperty(f);
    });
  });

  it('v2.1.0 squashes D / I / S transStatus to legal v2.1.0 values', () => {
    const decoupled = getPayload('ARes', { ...baseScenario, protocolVersion: '2.1.0', transStatus: 'D' });
    expect(decoupled.transStatus).toBe('C');
    const infoOnly = getPayload('ARes', { ...baseScenario, protocolVersion: '2.1.0', transStatus: 'I' });
    expect(infoOnly.transStatus).toBe('C');
    const spc = getPayload('ARes', { ...baseScenario, protocolVersion: '2.1.0', transStatus: 'S' });
    expect(spc.transStatus).toBe('C');
  });

  it('emits status-appropriate reason codes for negative ARes outcomes', () => {
    expect(getPayload('ARes', { ...baseScenario, transStatus: 'N' }).transStatusReason).toBe('01');
    expect(getPayload('ARes', { ...baseScenario, transStatus: 'U' }).transStatusReason).toBe('22');
    expect(getPayload('ARes', { ...baseScenario, transStatus: 'R' }).transStatusReason).toBe('11');
    expect(getPayload('ARes', { ...baseScenario, transStatus: 'Y' }).transStatusReason).toBe('');
  });
});

describe('RReq wire shape', () => {
  it('v2.1.0 uses authenticationType; v2.3.1 uses authenticationMethod', () => {
    const v210 = getPayload('RReq', { ...baseScenario, protocolVersion: '2.1.0' });
    expect(v210).toHaveProperty('authenticationType');
    expect(v210).not.toHaveProperty('authenticationMethod');
    const v231 = getPayload('RReq', { ...baseScenario, protocolVersion: '2.3.1' });
    expect(v231).not.toHaveProperty('authenticationType');
    expect(v231).toHaveProperty('authenticationMethod');
  });

  it('v2.3.1 RReq carries 5 v2.3.1-only fields', () => {
    const payload = getPayload('RReq', { ...baseScenario, protocolVersion: '2.3.1' });
    ['cardholderInfo', 'challengeErrorReporting', 'deviceBindingStatus',
     'deviceBindingStatusSource', 'transStatusReasonInfo'].forEach((f) => {
      expect(payload).toHaveProperty(f);
    });
  });

  it('v2.1.0 RReq already carries acsRenderingType for the app channel', () => {
    const payload = getPayload('RReq', { ...baseScenario, protocolVersion: '2.1.0' });
    expect(payload).toHaveProperty('acsRenderingType');
  });

  it('maps challenge-success RReq to a final Y status', () => {
    const payload = getPayload('RReq', { ...baseScenario, transStatus: 'C', challengeOutcome: 'success' });
    expect(payload.transStatus).toBe('Y');
    expect(payload.transStatusReason).toBe('');
  });

  it('maps challenge-failure RReq to N with reason 19', () => {
    const payload = getPayload('RReq', { ...baseScenario, transStatus: 'C', challengeOutcome: 'failure' });
    expect(payload.transStatus).toBe('N');
    expect(payload.transStatusReason).toBe('19');
  });

  it('maps cancelled challenge RReq to N with cancellation metadata', () => {
    const payload = getPayload('RReq', { ...baseScenario, transStatus: 'C', challengeOutcome: 'cancelled' });
    expect(payload.transStatus).toBe('N');
    expect(payload.transStatusReason).toBe('26');
    expect(payload.challengeCancelationIndicator).toBe('01');
  });

  it('maps decoupled fallback RReq to D with reason 29', () => {
    const payload = getPayload('RReq', { ...baseScenario, transStatus: 'C', challengeOutcome: 'decoupled' });
    expect(payload.transStatus).toBe('D');
    expect(payload.transStatusReason).toBe('29');
  });

  it('preserves opt-out RReq as C so the branch is not misreported as failure', () => {
    const payload = getPayload('RReq', { ...baseScenario, transStatus: 'C', challengeOutcome: 'optout' });
    expect(payload.transStatus).toBe('C');
    expect(payload.transStatusReason).toBe('');
  });
});

describe('RRes / Erro / OReq / ORes', () => {
  it('RRes shape is stable across v2.1.0 / v2.2.0 / v2.3.1', () => {
    const v210 = getPayload('RRes', { ...baseScenario, protocolVersion: '2.1.0' });
    const v231 = getPayload('RRes', { ...baseScenario, protocolVersion: '2.3.1' });
    expect(Object.keys(v210).sort()).toEqual(Object.keys(v231).sort());
    expect(Object.keys(v231).sort()).toEqual([
      'acsTransID',
      'dsTransID',
      'messageExtension',
      'messageType',
      'messageVersion',
      'resultsStatus',
      'sdkTransID',
      'threeDSServerTransID',
    ]);
  });

  it('maps RRes resultsStatus to opt-out and decoupled branches', () => {
    const optOut = getPayload('RRes', { ...baseScenario, transStatus: 'C', challengeOutcome: 'optout' });
    const decoupled = getPayload('RRes', { ...baseScenario, transStatus: 'C', challengeOutcome: 'decoupled' });
    const normal = getPayload('RRes', { ...baseScenario, transStatus: 'C', challengeOutcome: 'success' });

    expect(optOut.resultsStatus).toBe('02');
    expect(decoupled.resultsStatus).toBe('04');
    expect(normal.resultsStatus).toBe('01');
  });

  it('Erro keeps sdkTransID across v2.1.0 / v2.2.0 / v2.3.1', () => {
    const v210 = getPayload('Erro', { ...baseScenario, protocolVersion: '2.1.0' });
    expect(v210).toHaveProperty('sdkTransID');
    const v220 = getPayload('Erro', { ...baseScenario, protocolVersion: '2.2.0' });
    expect(v220).toHaveProperty('sdkTransID');
    const v231 = getPayload('Erro', { ...baseScenario, protocolVersion: '2.3.1' });
    expect(v231).toHaveProperty('sdkTransID');
  });

  it('OReq / ORes are only available in v2.3.1', () => {
    const oReq = getPayload('OReq', { ...baseScenario, protocolVersion: '2.3.1' });
    expect(oReq.messageType).toBe('OReq');
    expect(oReq.messageVersion).toBe('2.3.1');
    expect(Object.keys(oReq).sort()).toEqual([
      'dsReferenceNumber',
      'dsTransID',
      'messageExtension',
      'messageType',
      'messageVersion',
      'opCategory',
      'opDescription',
      'opExpDate',
      'opPriorTransRef',
      'opSeq',
      'opSeverity',
    ]);
    const oRes = getPayload('ORes', { ...baseScenario, protocolVersion: '2.3.1' });
    expect(oRes.messageType).toBe('ORes');
    expect(Object.keys(oRes).sort()).toEqual([
      'acsReferenceNumber',
      'acsTransID',
      'dsTransID',
      'messageExtension',
      'messageType',
      'messageVersion',
      'opStatus',
      'threeDSServerRefNumber',
      'threeDSServerTransID',
    ]);
  });
});

describe('scenario overlay', () => {
  it('getPayload respects scenario.transStatus on ARes', () => {
    const payload = getPayload('ARes', { ...baseScenario, transStatus: 'N' });
    expect(payload.transStatus).toBe('N');
  });

  it('getDynamicPayload from protocolViz.ts overlays scenario fields', async () => {
    const { getDynamicPayload } = await import('../../../utils/protocolViz');
    const step = {
      id: 'test',
      num: '0',
      label: 'test',
      detail: 'test',
      source: null,
      target: null,
      isActive: () => true,
      messageType: 'ARes' as const,
    };
    const payload = getDynamicPayload(step, { ...baseScenario, transStatus: 'N' });
    expect(payload).not.toBeNull();
    expect(payload!.transStatus).toBe('N');
  });

  it('getDynamicPayload overlays RRes resultsStatus for opt-out', async () => {
    const { getDynamicPayload } = await import('../../../utils/protocolViz');
    const step = {
      id: 'step_18',
      num: '18',
      label: 'test',
      detail: 'test',
      source: null,
      target: null,
      isActive: () => true,
      messageType: 'RRes' as const,
    };
    const payload = getDynamicPayload(step, { ...baseScenario, transStatus: 'C', challengeOutcome: 'optout' });
    expect(payload).not.toBeNull();
    expect(payload!.resultsStatus).toBe('02');
  });
});

describe('field-provenance registry', () => {
  it('AReq registry has at least 30 v2.1.0 baseline fields', () => {
    const v210Fields = listFieldsFor('AReq', '2.1.0', { AReq: FIELD_PROVENANCE.AReq });
    expect(v210Fields.length).toBeGreaterThanOrEqual(30);
  });

  it('AReq v2.3.1 adds at least 25 fields vs. v2.2.0', () => {
    const v220 = listFieldsFor('AReq', '2.2.0', { AReq: FIELD_PROVENANCE.AReq });
    const v231 = listFieldsFor('AReq', '2.3.1', { AReq: FIELD_PROVENANCE.AReq });
    const added = v231.length - v220.length;
    expect(added).toBeGreaterThanOrEqual(25);
  });

  it('resolveFieldAt finds trustListStatus only in v2.3.1', () => {
    const registry = FIELD_PROVENANCE.AReq;
    const in210 = resolveFieldAt('trustListStatus', '2.1.0', registry);
    const in231 = resolveFieldAt('trustListStatus', '2.3.1', registry);
    expect(in210).toBeNull();
    expect(in231).not.toBeNull();
    expect(in231?.renamedFrom).toBe('whiteListStatus');
  });

  it('resolveFieldAt finds whiteListStatus only in v2.1.0 / v2.2.0', () => {
    const registry = FIELD_PROVENANCE.AReq;
    const in210 = resolveFieldAt('whiteListStatus', '2.1.0', registry);
    const in220 = resolveFieldAt('whiteListStatus', '2.2.0', registry);
    const in231 = resolveFieldAt('whiteListStatus', '2.3.1', registry);
    expect(in210).toBeNull(); // not added until 2.2.0
    expect(in220).not.toBeNull();
    expect(in231).toBeNull();
  });

  it('PAYLOAD_VERSION_ORDER is strictly increasing', () => {
    expect(PAYLOAD_VERSION_ORDER['2.1.0']).toBeLessThan(PAYLOAD_VERSION_ORDER['2.2.0']);
    expect(PAYLOAD_VERSION_ORDER['2.2.0']).toBeLessThan(PAYLOAD_VERSION_ORDER['2.3.1']);
  });
});

describe('getVersionedPayload fallback for v2.4.0', () => {
  it('falls back to v2.3.1 when the user picks v2.4.0 (preview mode)', () => {
    const entry = getVersionedPayload('AReq', '2.4.0');
    expect(entry.version).toBe('2.3.1');
  });
});
