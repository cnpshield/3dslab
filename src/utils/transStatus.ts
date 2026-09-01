import type { FlowStep, Scenario, TransStatus } from '../types';

export const TRANS_STATUS_REASON_LABELS: Record<string, string> = {
  '01': 'Card authentication failed',
  '03': 'Unsupported device',
  '11': 'Suspected fraud',
  '14': 'Transaction timed out at the ACS',
  '19': 'Exceeds ACS maximum challenges',
  '22': 'ACS technical issue',
  '24': '3DS Requestor Decoupled Max Expiry Time exceeded',
  '26': 'Authentication attempted but not performed by the Cardholder',
  '29': 'Authentication attempted but not completed; fall back to Decoupled Authentication',
  '30': 'Authentication completed successfully but additional authentication is required; reinitiate as Decoupled Authentication',
};

function getGenericReasonForStatus(transStatus: TransStatus): string {
  switch (transStatus) {
    case 'N':
      return '01';
    case 'U':
      return '22';
    case 'R':
      return '11';
    default:
      return '';
  }
}

export function getChallengeResultTransStatus(scenario: Scenario): TransStatus {
  if (scenario.transStatus !== 'C') return scenario.transStatus;

  switch (scenario.challengeOutcome) {
    case 'success':
      return 'Y';
    case 'failure':
      return 'N';
    case 'cancelled':
      return 'N';
    case 'decoupled':
      return 'D';
    case 'optout':
      return 'C';
    case 'error':
      return 'U';
    case 'invalid_cres':
      return 'U';
    default:
      return 'C';
  }
}

export function getAResTransStatusReason(transStatus: TransStatus): string {
  if (transStatus === 'Y' || transStatus === 'A' || transStatus === 'C' || transStatus === 'D' || transStatus === 'I' || transStatus === 'S') {
    return '';
  }
  return getGenericReasonForStatus(transStatus);
}

export function getRReqTransStatusReason(transStatus: TransStatus, scenario: Scenario): string {
  if (scenario.transStatus === 'C') {
    switch (scenario.challengeOutcome) {
      case 'success':
      case 'optout':
        return '';
      case 'failure':
        return '19';
      case 'cancelled':
        return '26';
      case 'decoupled':
        return '29';
      case 'error':
      case 'invalid_cres':
        return '22';
      default:
        return '';
    }
  }

  if (transStatus === 'D' || transStatus === 'C' || transStatus === 'Y' || transStatus === 'A' || transStatus === 'I' || transStatus === 'S') {
    return '';
  }
  return getGenericReasonForStatus(transStatus);
}

export function getPayloadTransStatus(step: FlowStep, scenario: Scenario): TransStatus {
  if (step.messageType === 'RReq') {
    return getChallengeResultTransStatus(scenario);
  }
  return scenario.transStatus;
}

export function getPayloadTransStatusReason(step: FlowStep, scenario: Scenario, transStatus: TransStatus): string {
  if (step.messageType === 'ARes') {
    return getAResTransStatusReason(transStatus);
  }
  if (step.messageType === 'RReq') {
    return getRReqTransStatusReason(transStatus, scenario);
  }
  return '';
}

export function getTransStatusReasonLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return TRANS_STATUS_REASON_LABELS[code] || null;
}
