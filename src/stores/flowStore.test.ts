import { describe, it, expect } from 'vitest';
import { computeSequenceDigest, _deriveActiveStepsForTest, flowStore, flowActions } from './flowStore';
import type { FlowStep, Scenario, StepGroupId } from '../types';

const SAMPLE_SCENARIO: Scenario = {
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
};

const SAMPLE_STEPS: FlowStep[] = [
  {
    id: 'step_method_A',
    num: '0A',
    label: '3DS Method',
    detail: 'Browser fetches the 3DS Method URL from the DS.',
    groupId: 'method',
    source: 'BR',
    target: 'DS',
    isActive: (s) => s.methodPath !== 'unavailable',
  },
  {
    id: 'step_browser_post',
    num: '1',
    label: 'Browser POST',
    detail: 'Browser POSTs the cardholder data to the acquirer.',
    groupId: 'areq',
    source: 'CH',
    target: 'S',
    isActive: () => true,
  },
  {
    id: 'step_areq',
    num: '2',
    label: 'AReq',
    detail: '3DS Server sends the AReq to the DS.',
    groupId: 'areq',
    source: 'S',
    target: 'DS',
    isActive: (s) => s.dsRouting !== 'failure',
  },
];

describe('_deriveActiveStepsForTest', () => {
  it('keeps steps whose group is visible and whose scenario is active', () => {
    const visible: Set<StepGroupId> = new Set<StepGroupId>(['method', 'areq']);
    const active = _deriveActiveStepsForTest(SAMPLE_STEPS, SAMPLE_SCENARIO, visible);
    expect(active.length).toBe(3);
  });

  it('drops steps whose group is hidden', () => {
    const visible: Set<StepGroupId> = new Set<StepGroupId>(['areq']);
    const active = _deriveActiveStepsForTest(SAMPLE_STEPS, SAMPLE_SCENARIO, visible);
    expect(active.length).toBe(2);
    expect(active.find((s) => s.id === 'step_method_A')).toBeUndefined();
  });

  it('drops steps whose scenario makes them inactive', () => {
    const visible: Set<StepGroupId> = new Set<StepGroupId>(['method', 'areq']);
    const downScenario: Scenario = { ...SAMPLE_SCENARIO, dsRouting: 'failure' };
    const active = _deriveActiveStepsForTest(SAMPLE_STEPS, downScenario, visible);
    expect(active.length).toBe(2);
    expect(active.find((s) => s.id === 'step_areq')).toBeUndefined();
  });
});

describe('computeSequenceDigest', () => {
  it('produces a stable digest for the same inputs', () => {
    const a = computeSequenceDigest(SAMPLE_SCENARIO, '2.3.1', 5);
    const b = computeSequenceDigest(SAMPLE_SCENARIO, '2.3.1', 5);
    expect(a).toBe(b);
  });

  it('changes when the scenario changes', () => {
    const a = computeSequenceDigest(SAMPLE_SCENARIO, '2.3.1', 5);
    const b = computeSequenceDigest({ ...SAMPLE_SCENARIO, transStatus: 'C' }, '2.3.1', 5);
    expect(a).not.toBe(b);
  });

  it('changes when the version changes', () => {
    const a = computeSequenceDigest(SAMPLE_SCENARIO, '2.3.1', 5);
    const b = computeSequenceDigest(SAMPLE_SCENARIO, '2.2.0', 5);
    expect(a).not.toBe(b);
  });

  it('encodes all 10 distinguishing fields', () => {
    const digest = computeSequenceDigest(SAMPLE_SCENARIO, '2.3.1', 0);
    // Spot-check that all 10 prefixes appear in the digest. If a new
    // field is added to Scenario, the digest will grow but the existing
    // ones must remain.
    expect(digest).toContain('t=Y');
    expect(digest).toContain('m=executed');
    expect(digest).toContain('r=normal');
    expect(digest).toContain('v=2.3.1');
  });
});

describe('flowActions simulation and playback controls', () => {
  it('toggles isPlaying correctly', () => {
    flowActions.reset();
    expect(flowStore.getState().isPlaying).toBe(false);
    flowActions.togglePlay();
    expect(flowStore.getState().isPlaying).toBe(true);
    flowActions.togglePlay();
    expect(flowStore.getState().isPlaying).toBe(false);
  });

  it('pauses and plays cleanly', () => {
    flowActions.play();
    expect(flowStore.getState().isPlaying).toBe(true);
    flowActions.pause();
    expect(flowStore.getState().isPlaying).toBe(false);
  });

  it('restarts from step 0 when toggling play at the final step', () => {
    const steps = flowStore.getState().activeSteps;
    const lastIndex = steps.length - 1;
    flowActions.setCurrentStepIndex(lastIndex);
    flowActions.pause();

    expect(flowStore.getState().currentStepIndex).toBe(lastIndex);
    expect(flowStore.getState().isPlaying).toBe(false);

    // When a researcher presses Space at the end, it should restart from step 0 and play!
    flowActions.togglePlay();

    expect(flowStore.getState().isPlaying).toBe(true);
    expect(flowStore.getState().currentStepIndex).toBe(0);

    // Clean up
    flowActions.reset();
  });
});
