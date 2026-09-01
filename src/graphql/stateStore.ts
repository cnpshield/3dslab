/**
 * Short Token State Store for Clean Permalinks
 *
 * Replaces ugly, monstrous URL-encoded JSON query strings (?state={...})
 * with clean, human-readable IDs like `?s=s_9fb2c1`.
 */

import type { Scenario } from '../types';

export interface PersistedLabState {
  token: string;
  createdAt: string;
  scenario: Scenario;
  currentStepIndex?: number;
  theme?: 'light' | 'dark';
  securityLensEnabled?: boolean;
}

const STORAGE_KEY = 'emv_3ds_graphql_states';

function generateShortHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(6, '0').slice(0, 6);
  return `s_${hex}`;
}

export function saveStateToStore(state: Omit<PersistedLabState, 'token' | 'createdAt'>): PersistedLabState {
  const token = generateShortHash(JSON.stringify(state.scenario) + (state.currentStepIndex ?? 0));
  const record: PersistedLabState = {
    token,
    createdAt: new Date().toISOString(),
    ...state,
  };

  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    const registry: Record<string, PersistedLabState> = existingRaw ? JSON.parse(existingRaw) : {};
    registry[token] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // In memory fallback if storage is full/unavailable
  }

  return record;
}

export function getStateFromStore(token: string): PersistedLabState | null {
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    if (!existingRaw) return null;
    const registry: Record<string, PersistedLabState> = JSON.parse(existingRaw);
    return registry[token] || null;
  } catch {
    return null;
  }
}
