import { describe, it, expect } from 'vitest';
import { serializeSnapshot, parseSnapshot } from './snapshot';

const GOOD_SCENARIO = {
  protocolVersion: '2.3.1' as const,
  deviceChannel: 'browser' as const,
  methodPath: 'executed' as const,
  dsRouting: 'normal' as const,
  transStatus: 'Y' as const,
  challengeOutcome: 'success' as const,
  repeatChallenge: false,
  errorPath: 'none' as const,
  challengePreference: '01' as const,
  challengeMandated: 'N' as const,
  challengePresentation: 'html' as const,
};

const GOOD_INPUT = {
  scenario: GOOD_SCENARIO,
  currentStepIndex: 5,
  hiddenGroups: ['method' as const],
};

describe('serializeSnapshot', () => {
  it('produces well-formed JSON that includes the schema envelope', () => {
    const json = serializeSnapshot(GOOD_INPUT);
    const parsed = JSON.parse(json);
    expect(parsed.product).toBe('emv-3ds-protocol-lab');
    expect(parsed.schemaVersion).toBe(1);
    expect(typeof parsed.capturedAt).toBe('string');
    expect(parsed.scenario.transStatus).toBe('Y');
  });

  it('round-trips through parseSnapshot', () => {
    const json = serializeSnapshot(GOOD_INPUT);
    const result = parseSnapshot(json);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.snapshot?.scenario.transStatus).toBe('Y');
    expect(result.snapshot?.currentStepIndex).toBe(5);
    expect(result.snapshot?.hiddenGroups).toEqual(['method']);
  });
});

describe('parseSnapshot', () => {
  it('rejects empty input', () => {
    const r = parseSnapshot('');
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejects non-JSON input', () => {
    const r = parseSnapshot('this is not JSON');
    expect(r.ok).toBe(false);
  });

  it('rejects JSON without a product tag', () => {
    const r = parseSnapshot('{"foo":"bar"}');
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('product'))).toBe(true);
  });

  it('rejects a JSON object without a scenario', () => {
    const r = parseSnapshot(JSON.stringify({
      product: 'emv-3ds-protocol-lab',
      schemaVersion: 1,
      capturedAt: '2026-01-01T00:00:00.000Z',
    }));
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.toLowerCase().includes('scenario'))).toBe(true);
  });

  it('rejects a partial scenario (the regression from the audit)', () => {
    // A snapshot with only one scenario field used to be accepted and
    // then crash downstream at `step.isActive(scenario)`.
    const r = parseSnapshot(JSON.stringify({
      product: 'emv-3ds-protocol-lab',
      schemaVersion: 1,
      capturedAt: '2026-01-01T00:00:00.000Z',
      scenario: { protocolVersion: '2.3.1' },
    }));
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.toLowerCase().includes('malformed'))).toBe(true);
  });

  it('accepts a complete snapshot', () => {
    const json = serializeSnapshot(GOOD_INPUT);
    const r = parseSnapshot(json);
    expect(r.ok).toBe(true);
    expect(r.snapshot?.scenario.transStatus).toBe('Y');
    expect(r.snapshot?.currentStepIndex).toBe(5);
  });
});
