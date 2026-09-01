/**
 * OReq builder — operation message sequence added in v2.3.x and
 * modelled per EMV 3DS v2.3.1 Core Spec Table B.10.
 *
 * OReq is not part of the authentication message flow. It carries
 * operational notices from the DS to a 3DS Server or ACS.
 */

import type { PayloadBuilder } from '../types';
import { AReq_v210_FIXTURE_IDS } from '../areq/v210';

const { DS_TRANS_ID } = AReq_v210_FIXTURE_IDS;

export const buildOReq_v231: PayloadBuilder = () => ({
  messageType: 'OReq',
  messageVersion: '2.3.1',
  dsReferenceNumber: 'DS-REF-88',
  dsTransID: DS_TRANS_ID,
  messageExtension: [],
  opCategory: '02',
  opDescription: 'Issuer ACS certificate rollover is scheduled within the maintenance window.',
  opExpDate: '20260930',
  opPriorTransRef: [
    {
      transIdType: '02',
      transId: DS_TRANS_ID,
    },
  ],
  opSeq: {
    seqId: '4317fdc3-ad24-5443-8000-000000000891',
    seqNum: '01',
    seqTotal: '01',
  },
  opSeverity: '02',
});
