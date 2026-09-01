/**
 * RRes builder — common across v2.1.0 / v2.2.0 / v2.3.1. The RRes
 * message shape did not change between these versions (per
 * `comparison/3DSv2-api-documentation/source/differences_v220_v231.rst`
 * which explicitly omits RRes from the delta table).
 */

import type { PayloadBuilder } from '../types';
import { AReq_v210_FIXTURE_IDS } from '../areq/v210';

const { SERVER_TRANS_ID, DS_TRANS_ID, ACS_TRANS_ID } = AReq_v210_FIXTURE_IDS;

const buildRRes = (version: '2.1.0' | '2.2.0' | '2.3.1'): PayloadBuilder => (scenario) => {
  const resultsStatus =
    scenario.challengeOutcome === 'optout'
      ? '02'
      : scenario.challengeOutcome === 'decoupled'
        ? '04'
        : '01';

  return {
    messageType: 'RRes',
    messageVersion: version,
    threeDSServerTransID: SERVER_TRANS_ID,
    dsTransID: DS_TRANS_ID,
    acsTransID: ACS_TRANS_ID,
    // 01 = RReq received; 02 = opt-out; 03 = not received; 04 = decoupled.
    resultsStatus,
    messageExtension: [],
    sdkTransID: 'sdk-tx-001',
  };
};

export const buildRRes_v210 = buildRRes('2.1.0');
export const buildRRes_v220 = buildRRes('2.2.0');
export const buildRRes_v231 = buildRRes('2.3.1');
