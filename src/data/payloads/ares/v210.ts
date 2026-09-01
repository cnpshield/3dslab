/**
 * ARes v2.1.0 builder.
 *
 * v2.1.0 characteristics:
 *   - `cardholderInfo` is a string (max 128 chars).
 *   - `acsRenderingType` is `{acsInterface, acsUiTemplate}`; no
 *     `deviceUserInterfaceMode` (added in v2.3.1).
 *   - `authenticationType` is the field name (renamed to
 *     `authenticationMethod` in v2.3.1).
 */

import type { Scenario } from '../../../types';
import type { PayloadBuilder } from '../types';
import { AReq_v210_FIXTURE_IDS } from '../areq/v210';
import { getAResTransStatusReason } from '../../../utils/transStatus';

const { SERVER_TRANS_ID, DS_TRANS_ID, ACS_TRANS_ID } = AReq_v210_FIXTURE_IDS;

export const buildARes_v210: PayloadBuilder = (scenario: Scenario) => {
  // === v2.1.0 transStatus mapping: 7 values (Y, N, U, R, C, A) — D
  // === (decoupled), I (information-only) and S (SPC) were added in
  // === v2.2.0 and v2.3.0 respectively and are not legal in v2.1.0.
  const transStatus =
    scenario.transStatus === 'D' || scenario.transStatus === 'I' || scenario.transStatus === 'S'
      ? 'C' // squash to challenge for v2.1.0
      : scenario.transStatus;

  const isY = transStatus === 'Y';
  const isC = transStatus === 'C';
  const isAuthenticated = isY;

  return {
    messageType: 'ARes',
    messageVersion: '2.1.0',
    threeDSServerTransID: SERVER_TRANS_ID,
    acsTransID: ACS_TRANS_ID,
    acsReferenceNumber: 'ACS-REF-34',
    dsTransID: DS_TRANS_ID,
    transStatus,
    transStatusReason: getAResTransStatusReason(transStatus),
    acsChallengeMandated: isC ? 'N' : 'N',
    // v2.1.0: cardholderInfo is a string.
    cardholderInfo: isC ? 'Please complete the authentication challenge from your issuer.' : '',
    // v2.1.0: acsRenderingType has 2 keys, no deviceUserInterfaceMode.
    acsRenderingType: { acsInterface: '02', acsUiTemplate: '01' },
    // v2.1.0: authenticationType (renamed in v2.3.1).
    authenticationType: isY ? '02' : '', // 02 = static / frictionless
    eci: isAuthenticated ? '05' : '',
    authenticationValue: isAuthenticated ? 'AAABBiiihH8DAAAAAABiSBI=' : '',
  };
};
