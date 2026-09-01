/**
 * GraphQL Resolvers for EMV 3DS Protocol Lab
 */

import { PARTICIPANTS, FLOW_STEPS } from '../data/flowData';
import { SCENARIO_PRESETS, type ScenarioPreset } from '../data/scenarioPresets';
import { saveStateToStore, getStateFromStore } from './stateStore';
import type { Scenario } from '../types';

export const resolvers = {
  Query: {
    scenarios: () => SCENARIO_PRESETS,
    scenario: (_: unknown, { id }: { id: string }) => {
      return SCENARIO_PRESETS.find((p: ScenarioPreset) => p.id === id) || null;
    },
    steps: () => {
      return FLOW_STEPS;
    },
    step: (_: unknown, { id }: { id: string }) => {
      return FLOW_STEPS.find((s) => s.id === id) || null;
    },
    participants: () => PARTICIPANTS,
    fields: (_: unknown, { query }: { query?: string }) => {
      // Return protocol fields filtered by query
      const sampleFields = [
        { fieldName: 'threeDSServerTransID', dataType: 'UUID', requiredIn: ['AReq', 'ARes', 'CReq', 'CRes'], description: 'Universally unique transaction identifier assigned by 3DS Server.' },
        { fieldName: 'acsTransID', dataType: 'UUID', requiredIn: ['ARes', 'CReq', 'CRes', 'RReq'], description: 'Universally unique transaction identifier assigned by ACS.' },
        { fieldName: 'dsTransID', dataType: 'UUID', requiredIn: ['AReq', 'ARes', 'RReq', 'RRes'], description: 'Universally unique transaction identifier assigned by Directory Server.' },
        { fieldName: 'transStatus', dataType: 'String(1)', requiredIn: ['ARes', 'RReq'], description: 'Transaction status indicating the result of authentication (Y, A, N, U, R, C, D, I, S).' },
        { fieldName: 'messageVersion', dataType: 'String', requiredIn: ['All'], description: 'Protocol version identifier according to EMV 3DS Core Specification (e.g. 2.1.0, 2.2.0, 2.3.1).' },
      ];
      if (!query) return sampleFields;
      const q = query.toLowerCase();
      return sampleFields.filter(f => f.fieldName.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
    },
    savedState: (_: unknown, { token }: { token: string }) => {
      const state = getStateFromStore(token);
      if (!state) return null;
      return {
        token: state.token,
        url: `${window.location.origin}/?s=${state.token}`,
        createdAt: state.createdAt,
        scenario: state.scenario,
      };
    },
  },

  Mutation: {
    saveState: (_: unknown, { input }: { input: { scenario: Scenario; currentStepIndex?: number; theme?: 'light' | 'dark'; securityLensEnabled?: boolean } }) => {
      const saved = saveStateToStore({
        scenario: input.scenario,
        currentStepIndex: input.currentStepIndex,
        theme: input.theme,
        securityLensEnabled: input.securityLensEnabled,
      });
      return {
        token: saved.token,
        url: `${window.location.origin}/?s=${saved.token}`,
        createdAt: saved.createdAt,
        scenario: saved.scenario,
      };
    },
    applyPreset: (_: unknown, { presetId }: { presetId: string }) => {
      const preset = SCENARIO_PRESETS.find((p: ScenarioPreset) => p.id === presetId);
      if (!preset) throw new Error(`Scenario preset not found: ${presetId}`);
      return preset;
    },
  },
};
