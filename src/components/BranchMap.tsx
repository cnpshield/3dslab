import React, { memo, useMemo } from 'react';
import { ArrowRight, GitBranch, Layers3, Route, ShieldCheck, TimerReset, Zap } from 'lucide-react';

import type { FlowStep, ProtocolVersion, Scenario, StepGroupId } from '../types';
import { STEP_GROUPS } from '../data/flowData';
import { getScenarioBranchMeta, getVersionDiffSummary } from '../utils/protocolViz';

interface BranchMapProps {
  scenario: Scenario;
  activeSteps: FlowStep[];
  currentStepIndex: number;
  compareVersion: ProtocolVersion | null;
  onSelectStep: (index: number) => void;
}

const TRUNK_GROUPS: StepGroupId[] = ['preauth', 'setup', 'method', 'areq', 'ds_validation', 'acs_decision'];
const BRANCH_GROUPS: StepGroupId[] = ['ares', 'challenge', 'results', 'completion'];

export const BranchMap: React.FC<BranchMapProps> = memo(({
  scenario,
  activeSteps,
  currentStepIndex,
  compareVersion,
  onSelectStep,
}) => {
  const branchMeta = useMemo(() => getScenarioBranchMeta(scenario), [scenario]);
  const versionDiff = useMemo(
    () => getVersionDiffSummary(scenario.protocolVersion, compareVersion, STEP_GROUPS),
    [scenario.protocolVersion, compareVersion]
  );

  const groupedSteps = useMemo(() => {
    const map = new Map<StepGroupId, Array<{ step: FlowStep; index: number }>>();
    activeSteps.forEach((step, index) => {
      if (!step.groupId) return;
      const bucket = map.get(step.groupId) ?? [];
      bucket.push({ step, index });
      map.set(step.groupId, bucket);
    });
    return map;
  }, [activeSteps]);

  const challengeOutcomeLabel =
    scenario.transStatus === 'C'
      ? scenario.challengeOutcome === 'success'
        ? 'Challenge completes with authenticated result'
        : scenario.challengeOutcome === 'decoupled'
          ? 'Challenge pivots to decoupled authentication'
          : scenario.challengeOutcome === 'invalid_cres'
            ? 'Requestor rejects invalid completion artifact'
            : scenario.challengeOutcome === 'optout'
              ? 'Requestor locally opts out of the challenge'
              : 'Challenge drives a negative or error outcome'
      : scenario.transStatus === 'D'
        ? 'Issuer completes authentication out of band'
        : 'Issuer stays on the server-authenticated branch';

  const branchCards = [
    {
      id: 'frictionless',
      title: 'Frictionless / direct ARes',
      description: 'ARes closes the transaction without a visible challenge surface or a CReq/CRes and RReq/RRes loop.',
      active: branchMeta.lane === 'frictionless',
      accent: '#10b981',
    },
    {
      id: 'challenge',
      title: 'Challenge branch',
      description: challengeOutcomeLabel,
      active: branchMeta.lane === 'challenge',
      accent: '#f59e0b',
    },
    {
      id: 'decoupled',
      title: 'Async / decoupled',
      description: 'Issuer-controlled waiting branch that resolves through RReq rather than immediate UI completion.',
      active: branchMeta.lane === 'decoupled',
      accent: '#38bdf8',
    },
    {
      id: 'terminal',
      title: 'Terminal negative / info path',
      description: 'Rejection, unavailable, information-only, or SPC-specific continuation.',
      active: branchMeta.lane === 'failure' || branchMeta.lane === 'info' || branchMeta.lane === 'spc',
      accent: '#ef4444',
    },
  ];

  return (
    <div className="branch-map-root" role="region" aria-label="Branch map view">
      <div className="branch-map-summary">
        <div className="branch-map-summary-card">
          <div className="branch-map-summary-kicker">
            <GitBranch size={12} aria-hidden="true" />
            Active Branch
          </div>
          <div className="branch-map-summary-title">{branchMeta.label}</div>
          <div className="branch-map-summary-copy">{branchMeta.summary}</div>
        </div>

        <div className="branch-map-summary-card">
          <div className="branch-map-summary-kicker">
            <Layers3 size={12} aria-hidden="true" />
            Version Compare
          </div>
          <div className="branch-map-summary-title">
            {versionDiff ? `v${scenario.protocolVersion} vs v${versionDiff.compareVersion}` : `v${scenario.protocolVersion}`}
          </div>
          <div className="branch-map-summary-copy">
            {versionDiff
              ? versionDiff.added.length > 0
                ? `${versionDiff.added.length} modeled phase${versionDiff.added.length === 1 ? '' : 's'} exist in the active version but not in the compare target.`
                : versionDiff.removed.length > 0
                  ? `${versionDiff.removed.length} phase${versionDiff.removed.length === 1 ? '' : 's'} appear only in the compare target.`
                  : 'No modeled phase delta yet. The current step data is identical across these versions in the repo.'
              : 'Choose a compare version in the triage rail to see modeled phase differences.'}
          </div>
        </div>
      </div>

      <div className="branch-map-grid">
        <div className="branch-map-column">
          <div className="branch-map-column-title">
            <Route size={13} aria-hidden="true" />
            Protocol trunk
          </div>
          {TRUNK_GROUPS.map((groupId) => {
            const meta = STEP_GROUPS.find((group) => group.id === groupId);
            const steps = groupedSteps.get(groupId) ?? [];
            if (!meta || steps.length === 0) return null;
            const isCurrent = steps.some((entry) => entry.index === currentStepIndex);
            return (
              <div
                key={groupId}
                className={`branch-map-card ${isCurrent ? 'is-current' : ''}`}
                style={{ '--branch-accent': meta.color } as React.CSSProperties}
              >
                <div className="branch-map-card-header">
                  <span className="branch-map-card-chip">{meta.title}</span>
                  <span className="branch-map-card-count">{steps.length} step{steps.length === 1 ? '' : 's'}</span>
                </div>
                <div className="branch-map-step-list">
                  {steps.map(({ step, index }) => (
                    <button
                      key={step.id}
                      type="button"
                      className={`branch-map-step-btn ${index === currentStepIndex ? 'is-current' : ''}`}
                      onClick={() => onSelectStep(index)}
                    >
                      <span className="branch-map-step-num">{step.num}</span>
                      <span className="branch-map-step-label">{step.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="branch-map-column">
          <div className="branch-map-column-title">
            <ShieldCheck size={13} aria-hidden="true" />
            Branch lanes
          </div>
          <div className="branch-map-branch-row">
            {branchCards.map((card) => (
              <div
                key={card.id}
                className={`branch-lane-card ${card.active ? 'is-active' : ''}`}
                style={{ '--branch-accent': card.accent } as React.CSSProperties}
              >
                <div className="branch-lane-title">{card.title}</div>
                <div className="branch-lane-copy">{card.description}</div>
              </div>
            ))}
          </div>

          <div className="branch-map-column-title branch-map-column-title-secondary">
            <TimerReset size={13} aria-hidden="true" />
            Challenge + result closure
          </div>
          {BRANCH_GROUPS.map((groupId) => {
            const meta = STEP_GROUPS.find((group) => group.id === groupId);
            const steps = groupedSteps.get(groupId) ?? [];
            if (!meta || steps.length === 0) return null;
            const isCurrent = steps.some((entry) => entry.index === currentStepIndex);
            return (
              <div
                key={groupId}
                className={`branch-map-card branch-map-card-secondary ${isCurrent ? 'is-current' : ''}`}
                style={{ '--branch-accent': meta.color } as React.CSSProperties}
              >
                <div className="branch-map-card-header">
                  <span className="branch-map-card-chip">{meta.title}</span>
                  <span className="branch-map-card-count">{steps.length} step{steps.length === 1 ? '' : 's'}</span>
                </div>
                <div className="branch-map-step-list">
                  {steps.map(({ step, index }) => (
                    <button
                      key={step.id}
                      type="button"
                      className={`branch-map-step-btn ${index === currentStepIndex ? 'is-current' : ''}`}
                      onClick={() => onSelectStep(index)}
                    >
                      <span className="branch-map-step-num">{step.num}</span>
                      <span className="branch-map-step-label">{step.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="branch-map-closure">
            <div className="branch-map-closure-kicker">
              <Zap size={12} aria-hidden="true" />
              Current interpretation
            </div>
            <div className="branch-map-closure-copy">
              The active scenario stays in the <strong>{branchMeta.label}</strong> lane. Use the branch cards above to reason about what this repo models explicitly, then click any step to drill back into the inspector.
            </div>
            <div className="branch-map-closure-arrow" aria-hidden="true">
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BranchMap.displayName = 'BranchMap';
