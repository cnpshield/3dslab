/**
 * ARes v2.3.1 builder.
 *
 * v2.3.1 changes:
 *   - `authenticationType` → `authenticationMethod` (renamed; expanded enum)
 *   - `whiteListStatus` → `trustListStatus` (renamed)
 *   - `whiteListStatusSource` → `trustListStatusSource` (renamed)
 *   - `cardholderInfo`: string → object `{text, issuerImage, paymentSystemImage}`
 *   - `acsRenderingType`: gained `deviceUserInterfaceMode`
 *   - 11 new fields: broadInfo, cardSecurityCodeStatus*, deviceBindingStatus*,
 *     deviceInfoRecognisedVersion, spcTransData, threeDSRequestorAppURLInd,
 *     transChallengeExemption, transStatusReasonInfo, webAuthnCredList
 */

import type { Scenario } from '../../../types';
import type { PayloadBuilder } from '../types';
import { AReq_v210_FIXTURE_IDS } from '../areq/v210';
import { getAResTransStatusReason } from '../../../utils/transStatus';

const { SERVER_TRANS_ID, DS_TRANS_ID, ACS_TRANS_ID } = AReq_v210_FIXTURE_IDS;

export const buildARes_v231: PayloadBuilder = (scenario: Scenario) => {
  const transStatus = scenario.transStatus;
  const isY = transStatus === 'Y';
  const isC = transStatus === 'C';
  const isD = transStatus === 'D';
  const isI = transStatus === 'I';
  const isS = transStatus === 'S';
  const isAuthenticated = isY || isS;

  return {
    messageType: 'ARes',
    messageVersion: '2.3.1',
    threeDSServerTransID: SERVER_TRANS_ID,
    acsTransID: ACS_TRANS_ID,
    acsReferenceNumber: 'ACS-REF-34',
    dsTransID: DS_TRANS_ID,
    transStatus,
    transStatusReason: getAResTransStatusReason(transStatus),
    acsChallengeMandated: isC ? (scenario.challengeMandated === 'Y' ? 'Y' : 'N') : 'N',
    // v2.3.1: cardholderInfo is now an object.
    cardholderInfo: isC
      ? {
          text: 'Please complete the authentication challenge from your issuer.',
          issuerImage: { url: 'https://acs.issuer-bank.com/static/issuer.png', width: 64, height: 64 },
          paymentSystemImage: { url: 'https://acs.issuer-bank.com/static/ps.png', width: 64, height: 64 },
        }
      : isI
        ? {
            text: 'Information-only acknowledgement; no authentication performed.',
            issuerImage: {},
            paymentSystemImage: {},
          }
        : { text: '', issuerImage: {}, paymentSystemImage: {} },
    // v2.3.1: acsRenderingType gained deviceUserInterfaceMode.
    acsRenderingType: {
      acsInterface: '02', // 02 = native
      acsUiTemplate: '01', // 01 = text
      deviceUserInterfaceMode: '01', // 01 = browser
    },
    // Renamed in v2.3.1. Expanded enum: 02 = frictionless, 03 = challenge-OTP,
    // 06 = SPC, etc.
    authenticationMethod: isY ? '02' : isS ? '06' : '',
    eci: isAuthenticated ? '05' : '',
    authenticationValue: isAuthenticated ? 'AAABBiiihH8DAAAAAABiSBI=' : '',
    // v2.3.1: trustListStatus replaces whiteListStatus.
    trustListStatus: 'Y',
    trustListStatusSource: '02',
    acsDecConInd: isD ? 'Y' : 'N',
    // v2.3.1 new fields
    broadInfo: 'lab-research-correlation',
    cardSecurityCodeStatus: 'Y',
    cardSecurityCodeStatusSource: '02',
    deviceBindingStatus: 'Y',
    deviceBindingStatusSource: '02',
    deviceInfoRecognisedVersion: '2.3.1',
    spcTransData: isS
      ? {
          spcAuthData: 'MIIBszCCAVygAwIBAgII...AAABBiiihH8DAAAAAABiSBI=',
          spcAuthStatus: 'Y',
        }
      : {},
    threeDSRequestorAppURLInd: isD ? 'Y' : 'N',
    transChallengeExemption: isY ? '02' : '', // 02 = low-value
    transStatusReasonInfo: '',
    webAuthnCredList: isS
      ? ['cred-001', 'cred-002']
      : [],
  };
};
