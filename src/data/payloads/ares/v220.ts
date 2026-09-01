/**
 * ARes v2.2.0 builder.
 *
 * v2.2.0 adds:
 *   - `whiteListStatus` / `whiteListStatusSource` (renamed in v2.3.1)
 *   - `acsDecConInd` (decoupled authentication final indicator)
 *
 * Still uses `authenticationType` (renamed in v2.3.1), and the
 * string-shaped `cardholderInfo` (object-shaped in v2.3.1).
 */

import type { Scenario } from '../../../types';
import type { PayloadBuilder } from '../types';
import { AReq_v210_FIXTURE_IDS } from '../areq/v210';
import { getAResTransStatusReason } from '../../../utils/transStatus';

const { SERVER_TRANS_ID, DS_TRANS_ID, ACS_TRANS_ID } = AReq_v210_FIXTURE_IDS;

export const buildARes_v220: PayloadBuilder = (scenario: Scenario) => {
  // v2.2.0 added D (decoupled) and I (information-only) to the
  // transStatus enum; S (SPC) was added in v2.3.0, so it is squashed
  // here to Y or C to keep the wire shape legal.
  const transStatus =
    scenario.transStatus === 'S'
      ? scenario.challengeOutcome === 'decoupled' ? 'D' : 'C'
      : scenario.transStatus;

  const isY = transStatus === 'Y';
  const isC = transStatus === 'C';
  const isD = transStatus === 'D';
  const isI = transStatus === 'I';
  const isAuthenticated = isY;

  return {
    messageType: 'ARes',
    messageVersion: '2.2.0',
    threeDSServerTransID: SERVER_TRANS_ID,
    acsTransID: ACS_TRANS_ID,
    acsReferenceNumber: 'ACS-REF-34',
    dsTransID: DS_TRANS_ID,
    transStatus,
    transStatusReason: getAResTransStatusReason(transStatus),
    acsChallengeMandated: isC ? 'N' : 'N',
    // v2.2.0: still a string.
    cardholderInfo: isC
      ? 'Please complete the authentication challenge from your issuer.'
      : isI
        ? 'Information-only acknowledgement; no authentication performed.'
        : '',
    acsRenderingType: { acsInterface: '02', acsUiTemplate: '01' },
    authenticationType: isY ? '02' : '',
    eci: isAuthenticated ? '05' : '',
    authenticationValue: isAuthenticated ? 'AAABBiiihH8DAAAAAABiSBI=' : '',
    // v2.2.0 additions
    whiteListStatus: 'Y',
    whiteListStatusSource: '02', // 02 = ACS
    acsDecConInd: isD ? 'Y' : 'N',
  };
};
