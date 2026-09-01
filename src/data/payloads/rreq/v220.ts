/**
 * RReq v2.2.0 builder. Adds `whiteListStatus` / `whiteListStatusSource`,
 * `sdkTransID`, and `acsRenderingType` per
 * `comparison/3DSv2-api-documentation/source/differences.rst`.
 */

import type { PayloadBuilder } from '../types';
import { AReq_v210_FIXTURE_IDS } from '../areq/v210';
import { getChallengeResultTransStatus, getRReqTransStatusReason } from '../../../utils/transStatus';

const { SERVER_TRANS_ID, DS_TRANS_ID, ACS_TRANS_ID } = AReq_v210_FIXTURE_IDS;

export const buildRReq_v220: PayloadBuilder = (scenario) => {
  const transStatus = getChallengeResultTransStatus(scenario);
  const isAuthenticated = transStatus === 'Y';
  const isCancelled = scenario.transStatus === 'C' && scenario.challengeOutcome === 'cancelled';

  return {
    messageType: 'RReq',
    messageVersion: '2.2.0',
    threeDSServerTransID: SERVER_TRANS_ID,
    dsTransID: DS_TRANS_ID,
    acsTransID: ACS_TRANS_ID,
    transStatus,
    transStatusReason: getRReqTransStatusReason(transStatus, scenario),
    authenticationValue: isAuthenticated ? 'AAABBiiihH8DAAAAAABiSBI=' : '',
    eci: isAuthenticated ? '05' : '',
    challengeCancel: '',
    challengeCancelationIndicator: isCancelled ? '01' : '',
    challengeCompletionInd: 'Y',
    interactionCounter: '001',
    messageExtension: [],
    whiteListStatus: 'Y',
    whiteListStatusSource: '02',
    sdkTransID: '',
    acsRenderingType: { acsInterface: '02', acsUiTemplate: '01' },
  };
};
