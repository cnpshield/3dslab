import { describe, it, expect } from 'vitest';
import { validateScenario, extractPayloadFields } from './protocolViz';

describe('validateScenario', () => {
  it('rejects non-objects', () => {
    expect(validateScenario(null).length).toBeGreaterThan(0);
    expect(validateScenario(undefined).length).toBeGreaterThan(0);
    expect(validateScenario('not an object').length).toBeGreaterThan(0);
    expect(validateScenario(42).length).toBeGreaterThan(0);
    expect(validateScenario([]).length).toBeGreaterThan(0);
  });

  it('accepts a fully-populated scenario', () => {
    const result = validateScenario({
      protocolVersion: '2.3.1',
      deviceChannel: 'browser',
      methodPath: 'executed',
      dsRouting: 'normal',
      transStatus: 'Y',
      challengeOutcome: 'success',
      repeatChallenge: false,
      errorPath: 'none',
      challengePreference: '01',
      challengeMandated: 'N',
      challengePresentation: 'html',
    });
    expect(result).toEqual([]);
  });

  it('flags a partial scenario (e.g. a snapshot with only protocolVersion)', () => {
    // This is the exact case where the old code silently accepted an
    // incomplete scenario and crashed `step.isActive(scenario)` on
    // the undefined `transStatus`.
    const errors = validateScenario({ protocolVersion: '2.3.1' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('transStatus'))).toBe(true);
    expect(errors.some((e) => e.includes('methodPath'))).toBe(true);
  });

  it('flags enum values that are not in the spec', () => {
    const errors = validateScenario({
      protocolVersion: '2.3.1',
      deviceChannel: 'browser',
      methodPath: 'executed',
      dsRouting: 'normal',
      transStatus: 'X', // not in VALID_TRANS_STATUS
      challengeOutcome: 'success',
      repeatChallenge: false,
      errorPath: 'none',
      challengePreference: '01',
      challengeMandated: 'N',
      challengePresentation: 'html',
    });
    expect(errors.some((e) => e.includes('transStatus'))).toBe(true);
  });
});

describe('extractPayloadFields', () => {
  it('returns top-level field names', () => {
    const fields = extractPayloadFields({ a: 1, b: 'two', c: null });
    expect(fields).toContain('a');
    expect(fields).toContain('b');
    expect(fields).toContain('c');
  });

  it('flattens common nested containers', () => {
    const fields = extractPayloadFields({
      threeDSServerTransID: 'abc',
      body: { transStatus: 'Y' },
      decodedData: { x: 1 },
    });
    expect(fields).toContain('threeDSServerTransID');
    expect(fields).toContain('transStatus');
    expect(fields).toContain('x');
  });

  it('handles non-objects gracefully', () => {
    expect(extractPayloadFields(null)).toEqual([]);
    expect(extractPayloadFields(undefined)).toEqual([]);
    expect(extractPayloadFields('string')).toEqual([]);
    expect(extractPayloadFields(42)).toEqual([]);
  });
});
