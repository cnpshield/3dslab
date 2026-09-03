/**
 * AReq v2.3.1 builder.
 *
 * v2.3.1 added 29 new fields to the AReq and renamed
 * `whiteListStatus` / `whiteListStatusSource` to `trustListStatus` /
 * `trustListStatusSource`. The full per-field provenance is in
 * `meta/fieldProvenance.ts`; the additions documented in
 * `comparison/3DSv2-api-documentation/source/differences_v220_v231.rst`
 * are realised below.
 *
 * Notable v2.3.1 shape changes:
 *   - `threeDSRequestorChallengeInd` is now an *array* of strings.
 *   - `threeDSRequestorAuthenticationInfo` is now an *array* of objects.
 *   - `threeDSRequestorPriorAuthenticationInfo` is now an *array* of
 *     objects.
 *   - `cardholderInfo` (returned in ARes, not AReq) is an object with
 *     structured fields; AReq does not carry cardholderInfo, so the
 *     change is reflected in the ARes builders.
 *   - `acsRenderingType` (returned in ARes) gained
 *     `deviceUserInterfaceMode`.
 *
 * v2.3.1 also removed `threeDSReqAuthMethodInd`; the v2.3.1 builder
 * intentionally does not include it.
 */

import type { Scenario } from '../../../types';
import type { PayloadBuilder } from '../types';
import { AReq_v210_FIXTURE_IDS } from './v210';

const { SERVER_TRANS_ID } = AReq_v210_FIXTURE_IDS;

export const buildAReq_v231: PayloadBuilder = (scenario: Scenario) => {
  const threeDSCompInd =
    scenario.methodPath === 'reused' || scenario.methodPath === 'executed'
      ? 'Y'
      : scenario.methodPath === 'unavailable'
        ? 'U'
        : 'N';

  return {
    messageType: 'AReq',
    messageVersion: '2.3.1',
    threeDSServerTransID: SERVER_TRANS_ID,
    threeDSServerRefNumber: 'SRV-REF-001',
    threeDSRequestorID: 'REQ-MERCH-001',
    threeDSRequestorURL: 'https://merchant.example.com/checkout',
    notificationURL: 'https://gateway.payment.com/3ds-notify_url',
    // v2.3.1: array of strings. '01' = No preference (per §A.5.4 Table A.1).
    threeDSRequestorChallengeInd: ['01'],
    threeDSCompInd,
    deviceChannel: '02',
    messageCategory: '01',
    acquirerBIN: '453201',
    acquirerMerchantID: 'MERCH_987654321',
    // v2.3.1: acquirer country code added to complement acquirerBIN.
    acquirerCountryCode: '840',
    acquirerCountryCodeSource: '01',
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
    email: 'cust-18370019@example.com',
    mobilePhone: { cc: '1', sub: '4155550199' },
    cardholderName: 'J DOE',
    merchantRiskIndicator: {
      shipIndicator: '01',
      deliveryTimeframe: '01',
      reorderItemsInd: '01',
      preOrderPurchaseInd: '01',
    },
    // v2.3.1: threeDSRequestorAuthenticationInfo is now an array of objects.
    threeDSRequestorAuthenticationInfo: [
      {
        threeDSReqAuthMethod: '01', // 01 = frictionless
        threeDSReqAuthTimestamp: '20260710160700',
        threeDSReqAuthData: 'SGFzaGVkQXV0aERhdGE=',
      },
    ],
    // v2.3.1: threeDSRequestorPriorAuthenticationInfo is now an array.
    threeDSRequestorPriorAuthenticationInfo: [],
    threeDSRequestorDecMaxTime: '1440',
    threeDSRequestorDecReqInd: 'N',
    // Renamed in v2.3.1.
    trustListStatus: 'Y',
    trustListStatusSource: '01',
    payTokenSource: 'TOKENISATION_PROVIDER_X',
    payTokenInfo: { tokenType: '01', tokenNumber: 'tkn_4242' },
    messageExtension: [
      {
        name: 'merchant-risk-v1',
        id: 'ext-risk-001',
        criticalityIndicator: false,
        data: {
          cartValueBand: 'mid',
          accountAgeDays: 620,
        },
      },
    ],
    browserIP: '198.51.100.42',
    browserAcceptHeader: 'text/html,application/xhtml+xml',
    browserLanguage: 'en-US',
    acceptLanguage: 'en-US,en;q=0.9',
    browserUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    browserScreenWidth: '1920',
    browserScreenHeight: '1080',
    browserColorDepth: '24',
    browserTZ: '-360',
    browserJavascriptEnabled: 'true',
    // v2.3.1 recurring / 3RI additions
    recurringInd: '01',
    recurringAmount: '27998',
    recurringCurrency: '840',
    recurringDate: '20260810',
    recurringExponent: '2',
    // v2.3.1: device binding
    deviceId: 'dev-abc123',
    deviceBindingStatus: 'Y',
    deviceBindingStatusSource: '01',
    // v2.3.1: card security code
    cardSecurityCode: '***',
    cardSecurityCodeStatus: 'Y',
    cardSecurityCodeStatusSource: '01',
    // v2.3.1: SPC
    threeDSRequestorSpcSupport: 'Y',
    // v2.3.1: 3DS Method correlation
    threeDSMethodId: SERVER_TRANS_ID,
    // v2.3.1: payee + seller info (for marketplace)
    payeeOrigin: 'https://marketplace.example.com',
    sellerInfo: {
      sellerId: 'SELLER-001',
      sellerName: 'Example Marketplace',
      sellerCountryCode: '840',
    },
    // v2.3.1: tax
    taxId: '***-**-1234',
    // v2.3.1: SDK fields (split-SDK / default-SDK) — empty for the browser channel
    sdkType: 'N',
    splitSdkType: {},
    defaultSdkType: {},
    sdkServerSignedContent: '',
    // v2.3.1: SPC incompletion reason (only set when SPC failed)
    spcIncompInd: '',
    // v2.3.1: free-form information channel
    broadInfo: 'lab-research-correlation',
    // v2.3.1: app-channel IP for hybrid flows
    appIp: '',
    // v2.3.1: user identity
    userId: 'cust-18370019',
    // v2.3.1: 3RI multi-transaction container
    multiTransaction: [],
  };
};
