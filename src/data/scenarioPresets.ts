import { DEFAULT_SCENARIO } from '../stores/flowStore';
import type { Scenario } from '../types';

export interface ScenarioPreset {
  id: string;
  label: string;
  summary: string;
  scenario: Scenario;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  { id: 'frictionless_y', label: 'Frictionless Y', summary: 'Approval without a visible challenge.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'Y' } },
  { id: 'frictionless_n', label: 'Frictionless N', summary: 'Frictionless flow returns not authenticated.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'N' } },
  { id: 'frictionless_u', label: 'Frictionless U', summary: 'Frictionless flow cannot complete because of a technical or support issue.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'U' } },
  { id: 'frictionless_r', label: 'Frictionless R', summary: 'Issuer rejects authentication and requests that authorization not be attempted.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'R' } },
  { id: 'attempts_a', label: 'Attempts A', summary: 'Attempts flow when full auth is not completed.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'A', methodPath: 'reused' } },
  { id: 'challenge_success', label: 'Challenge Success', summary: 'Interactive challenge that returns success.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'C', challengeOutcome: 'success', challengeMandated: 'Y' } },
  { id: 'challenge_failure', label: 'Challenge Failure', summary: 'Challenge completed but authentication fails.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'C', challengeOutcome: 'failure', challengeMandated: 'Y' } },
  { id: 'challenge_cancelled', label: 'Challenge Cancelled', summary: 'Cardholder abandons or cancels the browser challenge.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'C', challengeOutcome: 'cancelled', challengeMandated: 'Y' } },
  { id: 'challenge_decoupled_fallback', label: 'Challenge D Fallback', summary: 'Challenge starts in-browser but the final result pivots into decoupled authentication.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'C', challengeOutcome: 'decoupled', challengePresentation: 'oob', challengeMandated: 'Y' } },
  { id: 'decoupled_d', label: 'Decoupled D', summary: 'ACS defers completion into decoupled authentication.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'D', challengeOutcome: 'decoupled', challengePresentation: 'oob' } },
  { id: 'opt_out', label: 'Opt-out', summary: 'Requestor opt-out path with resultsStatus 02.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'C', challengeOutcome: 'optout', challengePreference: '02', challengeMandated: 'N' } },
  { id: 'info_only', label: 'Info Only', summary: 'Information-only processing path.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'I', methodPath: 'unavailable' } },
  { id: 'spc_s', label: 'SPC S', summary: 'Secure Payment Confirmation success-style branch.', scenario: { ...DEFAULT_SCENARIO, transStatus: 'S', challengePresentation: 'oob' } },
];
