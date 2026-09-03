import { createExternalStore } from './createStore';
import type { Scenario, FlowStep, StepGroupId, ProtocolVersion } from '../types';
import { FLOW_STEPS, STEP_GROUPS } from '../data/flowData';

export type PlaySpeed = 800 | 1500 | 2500 | 5000;

export interface FlowState {
  scenario: Scenario;
  currentStepIndex: number;
  hiddenGroups: StepGroupId[];
  isPlaying: boolean;
  playSpeed: PlaySpeed;
  activeSteps: FlowStep[];
  activeGroupIds: StepGroupId[];
}

/**
 * Numeric ordering for protocol version comparison. Higher = newer.
 * Adding a new version here automatically enables version-aware filtering
 * for any step group that sets `introducedIn`.
 */
const VERSION_ORDER: Record<ProtocolVersion, number> = {
  '2.1.0': 1,
  '2.2.0': 2,
  '2.3.1': 3,
  '2.4.0': 4,
};

function isStepGroupAvailableForVersion(groupId: StepGroupId, version: ProtocolVersion): boolean {
  const group = STEP_GROUPS.find((g) => g.id === groupId);
  if (!group || !group.introducedIn) return true;
  return VERSION_ORDER[version] >= VERSION_ORDER[group.introducedIn];
}

function deriveActiveSteps(scenario: Scenario, hiddenGroups: Set<StepGroupId>): FlowStep[] {
  return FLOW_STEPS.filter(
    (step) =>
      step.isActive(scenario) &&
      (!step.groupId || !hiddenGroups.has(step.groupId)) &&
      (!step.groupId || isStepGroupAvailableForVersion(step.groupId, scenario.protocolVersion))
  );
}

// === Exported for unit tests. The spec-bound derivation logic is the
// === single most-testable piece of the lab; covering it with a small
// === test set gives the CI a real teeth when an EMVCo version bumps.
export function _deriveActiveStepsForTest(
  steps: FlowStep[],
  scenario: Scenario,
  visibleGroups: Set<StepGroupId>,
): FlowStep[] {
  return steps.filter((step) => {
    if (!step.groupId) return false;
    if (!visibleGroups.has(step.groupId)) return false;
    return step.isActive(scenario);
  });
}

export function computeSequenceDigest(
  scenario: Scenario,
  version: ProtocolVersion,
  currentStepIndex: number,
): string {
  // Stable, hashable representation used by the URL persist effect and
  // the share-link deduper. Sorted on key=value pairs so the digest
  // is stable across field-order changes.
  return [
    `t=${scenario.transStatus}`,
    `dc=${scenario.deviceChannel}`,
    `m=${scenario.methodPath}`,
    `r=${scenario.dsRouting}`,
    `e=${scenario.errorPath}`,
    `cp=${scenario.challengePreference}`,
    `cm=${scenario.challengeMandated}`,
    `co=${scenario.challengeOutcome}`,
    `rx=${scenario.repeatChallenge ? 1 : 0}`,
    `v=${version}`,
    `i=${currentStepIndex}`,
  ].join('|');
}

function deriveActiveGroupIds(activeSteps: FlowStep[]): StepGroupId[] {
  const ids = new Set<StepGroupId>();
  activeSteps.forEach((s) => s.groupId && ids.add(s.groupId));
  // Preserve canonical ordering from STEP_GROUPS
  return STEP_GROUPS.map((g) => g.id).filter((id) => ids.has(id));
}

const DEFAULT_SCENARIO: Scenario = {
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

const initial: FlowState = {
  scenario: DEFAULT_SCENARIO,
  currentStepIndex: 0,
  hiddenGroups: [],
  isPlaying: false,
  playSpeed: 1500,
  activeSteps: deriveActiveSteps(DEFAULT_SCENARIO, new Set()),
  activeGroupIds: deriveActiveGroupIds(deriveActiveSteps(DEFAULT_SCENARIO, new Set())),
};

export const flowStore = createExternalStore<FlowState>(initial);

function rebuild(scenario: Scenario, hiddenGroups: StepGroupId[], currentStepIndex: number): Partial<FlowState> {
  const hiddenSet = new Set(hiddenGroups);
  const activeSteps = deriveActiveSteps(scenario, hiddenSet);
  const activeGroupIds = deriveActiveGroupIds(activeSteps);
  const clampedIndex = activeSteps.length === 0
    ? 0
    : Math.min(currentStepIndex, activeSteps.length - 1);
  return { scenario, hiddenGroups, activeSteps, activeGroupIds, currentStepIndex: clampedIndex };
}

export const flowActions = {
  setScenario: (scenario: Scenario) => {
    flowStore.setState((s) => rebuild(scenario, s.hiddenGroups, s.currentStepIndex));
  },
  patchScenario: (patch: Partial<Scenario>) => {
    flowStore.setState((s) => rebuild({ ...s.scenario, ...patch }, s.hiddenGroups, s.currentStepIndex));
  },
  setCurrentStepIndex: (idx: number) => {
    flowStore.setState((s) => {
      const max = Math.max(0, s.activeSteps.length - 1);
      return { currentStepIndex: Math.min(Math.max(0, idx), max) };
    });
  },
  nextStep: () => {
    flowStore.setState((s) => {
      if (s.currentStepIndex >= s.activeSteps.length - 1) {
        return { isPlaying: false, currentStepIndex: s.activeSteps.length - 1 };
      }
      return { currentStepIndex: s.currentStepIndex + 1 };
    });
  },
  prevStep: () => {
    flowStore.setState((s) => ({ currentStepIndex: Math.max(0, s.currentStepIndex - 1) }));
  },
  reset: () => {
    flowStore.setState({ currentStepIndex: 0, isPlaying: false });
  },
  togglePlay: () => {
    flowStore.setState((s) => {
      const willPlay = !s.isPlaying;
      if (willPlay && s.currentStepIndex >= s.activeSteps.length - 1) {
        return { isPlaying: true, currentStepIndex: 0 };
      }
      return { isPlaying: willPlay };
    });
  },
  play: () => {
    flowStore.setState((s) => {
      if (s.currentStepIndex >= s.activeSteps.length - 1) {
        return { isPlaying: true, currentStepIndex: 0 };
      }
      return { isPlaying: true };
    });
  },
  pause: () => {
    flowStore.setState({ isPlaying: false });
  },
  setPlaySpeed: (speed: PlaySpeed) => {
    flowStore.setState({ playSpeed: speed });
  },
  toggleGroup: (groupId: StepGroupId) => {
    flowStore.setState((s) => {
      const hidden = s.hiddenGroups.includes(groupId)
        ? s.hiddenGroups.filter((g) => g !== groupId)
        : [...s.hiddenGroups, groupId];
      return rebuild(s.scenario, hidden, s.currentStepIndex);
    });
  },
  showAllGroups: () => {
    flowStore.setState((s) => rebuild(s.scenario, [], s.currentStepIndex));
  },
  hideAllGroups: () => {
    flowStore.setState((s) => {
      const all = s.activeGroupIds;
      return rebuild(s.scenario, [...all], s.currentStepIndex);
    });
  },
  hydrate: (partial: { scenario?: Scenario; currentStepIndex?: number; hiddenGroups?: StepGroupId[] }) => {
    flowStore.setState((s) => {
      const scenario = partial.scenario ?? s.scenario;
      const hiddenGroups = partial.hiddenGroups ?? s.hiddenGroups;
      const currentStepIndex = partial.currentStepIndex ?? s.currentStepIndex;
      return rebuild(scenario, hiddenGroups, currentStepIndex);
    });
  },
};

export { DEFAULT_SCENARIO };
