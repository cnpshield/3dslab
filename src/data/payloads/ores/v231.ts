/**
 * ORes builder — operation-message acknowledgement added in v2.3.x and
 * modelled per EMV 3DS v2.3.1 Core Spec Table B.11.
 */

import type { PayloadBuilder } from '../types';
import { AReq_v210_FIXTURE_IDS } from '../areq/v210';

const { SERVER_TRANS_ID, DS_TRANS_ID, ACS_TRANS_ID } = AReq_v210_FIXTURE_IDS;

export const buildORes_v231: PayloadBuilder = () => ({
  messageType: 'ORes',
  messageVersion: '2.3.1',
  threeDSServerRefNumber: 'SRV-REF-001',
  threeDSServerTransID: SERVER_TRANS_ID,
  acsReferenceNumber: 'ACS-REF-34',
  acsTransID: ACS_TRANS_ID,
  dsTransID: DS_TRANS_ID,
  messageExtension: [],
  opStatus: '01',
});
