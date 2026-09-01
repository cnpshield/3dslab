import React, { useState, useRef, useEffect, memo } from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Activity,
  RotateCw,
  Database,
  Clock,
  ExternalLink,
  Network,
  ServerCrash,
  Check,
  XCircle,
  Compass,
  ArrowRight,
  RefreshCw,
  Layers,
  AlertTriangle,
  ShieldOff,
  Sliders,
  Zap
} from 'lucide-react';
import type {
  Scenario,
  DeviceChannel,
  MethodPath,
  DSRouting,
  TransStatus,
  ChallengeOutcome,
  ChallengePreference,
  ChallengeMandated,
  ChallengePresentation,
  FlowStep
} from '../types';
import { getParticipantsForScenario } from '../data/flowData';

interface ControlsProps {
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
  totalSteps: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playSpeed: number;
  setPlaySpeed: (speed: number) => void;
  activeStepNum: string;
  activeSteps: FlowStep[];
}

export const Controls: React.FC<ControlsProps> = memo(({
  scenario,
  setScenario,
  currentStepIndex,
  setCurrentStepIndex,
  totalSteps,
  isPlaying,
  setIsPlaying,
  playSpeed,
  setPlaySpeed,
  activeStepNum,
  activeSteps,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'config'>('timeline');
  const activeStepRef = useRef<HTMLButtonElement | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeStepRef.current) {
      activeStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStepIndex, activeTab]);
  
  const handleMethodPathChange = (val: MethodPath) => {
    setScenario({
      ...scenario,
      methodPath: val,
    });
    setCurrentStepIndex(0); // Reset to Step 0 when scenario changes
  };

  const handleDeviceChannelChange = (val: DeviceChannel) => {
    setScenario({
      ...scenario,
      deviceChannel: val,
      challengeOutcome:
        val === 'app' && scenario.challengeOutcome === 'error'
          ? 'success'
          : scenario.challengeOutcome,
    });
    setCurrentStepIndex(0);
  };

  const handleDSRoutingChange = (val: DSRouting) => {
    setScenario({
      ...scenario,
      dsRouting: val,
    });
    setCurrentStepIndex(0);
  };

  const handleTransStatusChange = (val: TransStatus) => {
    setScenario({
      ...scenario,
      transStatus: val,
    });
    setCurrentStepIndex(0);
  };

  const handleChallengeOutcomeChange = (val: ChallengeOutcome) => {
    if (val === 'optout' && (scenario.challengeMandated === 'Y' || scenario.challengePreference === '04')) {
      return;
    }
    if (val === 'error' && scenario.deviceChannel === 'app') {
      return;
    }
    setScenario({
      ...scenario,
      challengeOutcome: val,
    });
    setCurrentStepIndex(0);
  };

  const handleChallengePreferenceChange = (val: ChallengePreference) => {
    setScenario({
      ...scenario,
      challengePreference: val,
      challengeOutcome:
        scenario.challengeOutcome === 'optout' && (scenario.challengeMandated === 'Y' || val === '04')
          ? 'success'
          : scenario.challengeOutcome,
    });
    setCurrentStepIndex(0);
  };

  const handleChallengeMandatedChange = (val: ChallengeMandated) => {
    setScenario({
      ...scenario,
      challengeMandated: val,
      challengeOutcome:
        scenario.challengeOutcome === 'optout' && val === 'Y'
          ? 'success'
          : scenario.challengeOutcome,
    });
    setCurrentStepIndex(0);
  };

  const handleChallengePresentationChange = (val: ChallengePresentation) => {
    setScenario({
      ...scenario,
      challengePresentation: val,
    });
    setCurrentStepIndex(0);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.max(0, currentStepIndex - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.min(totalSteps - 1, currentStepIndex + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Helper to determine active scenario details for the overview card
  const getScenarioStatus = () => {
    if (scenario.dsRouting === 'failure') {
      return {
        badge: 'Bypassed',
        badgeClass: 'warning',
        desc: 'Directory Server validation or version check failed. Bypassing issuer ACS. Flow terminates early with transStatus = U.',
      };
    }
    switch (scenario.transStatus) {
      case 'Y':
        return {
          badge: 'Y - Success',
          badgeClass: 'success',
          desc: 'Successful authentication without challenge. Merchant receives ECI 05, granting a full liability shift.',
        };
      case 'A':
        return {
          badge: 'A - Attempt',
          badgeClass: 'attempt',
          desc: 'Authentication attempt was recorded. Merchant receives ECI 06, which may grant a liability shift depending on scheme rules.',
        };
      case 'N':
        return {
          badge: 'N - Fail',
          badgeClass: 'failure',
          desc: 'Not authenticated. The transaction failed verification. Merchant should decline or route to challenge if eligible.',
        };
      case 'U':
        return {
          badge: 'U - Unable',
          badgeClass: 'warning',
          desc: 'Authentication could not be completed (e.g. technical error). Merchant receives ECI 07 / no liability shift.',
        };
      case 'R':
        return {
          badge: 'R - Reject',
          badgeClass: 'failure',
          desc: 'Authentication rejected by the ACS. Merchant must not attempt card authorisation.',
        };
      case 'C':
        return {
          badge: 'C - Challenge',
          badgeClass: 'attempt',
          desc: scenario.deviceChannel === 'app'
            ? 'The ACS requires app challenge. The requestor app will invoke the 3DS SDK and continue over the SDK/ACS challenge channel.'
            : 'The ACS requires browser challenge. The 3DS Server will post a CReq through the browser and wait for the challenge result path.',
        };
      case 'D':
        return {
          badge: 'D - Decoupled',
          badgeClass: 'warning',
          desc: scenario.deviceChannel === 'app'
            ? 'The issuer will continue authentication asynchronously outside the in-app interaction.'
            : 'The issuer will continue authentication asynchronously outside the browser interaction.',
        };
      case 'I':
        return {
          badge: 'I - Info Only',
          badgeClass: 'warning',
          desc: 'Information Only response. The ACS returned data to help merchant risking, but no cardholder authentication took place and there is no liability shift.',
        };
      case 'S':
        return {
          badge: 'S - SPC',
          badgeClass: 'success',
          desc: 'Secure Payment Confirmation. The browser uses a WebAuthn / SPC prompt instead of the challenge iframe and returns an authentication value for authorisation.',
        };
      default:
        return {
          badge: 'U - Unable',
          badgeClass: 'warning',
          desc: 'Authentication status could not be evaluated.',
        };
    }
  };

  const statusInfo = getScenarioStatus();
  const canOptOut = scenario.challengeMandated === 'N' && scenario.challengePreference !== '04';
  const scenarioParticipants = getParticipantsForScenario(scenario);
  const isAppChannel = scenario.deviceChannel === 'app';
  const canUseBrowserChallengeError = !isAppChannel;

  return (
    <div className="controls-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      
      {/* Sidebar Tabs (Pinned at top) */}
      <div className="sidebar-tabs" style={{ flexShrink: 0, margin: '0 0 4px 0' }}>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`sidebar-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          title="Interactive Step-by-Step Protocol Walkthrough"
        >
          <Compass size={13} />
          <span>Walkthrough</span>
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`sidebar-tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          title="Scenario Outcome and Protocol Settings"
        >
          <Sliders size={13} />
          <span>Parameters</span>
        </button>
      </div>

      {activeTab === 'timeline' && (
        <div className="timeline-view-wrapper fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '10px' }}>
          
          {/* Executive Playback Deck */}
          <div className="playback-deck" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'var(--bg-secondary)',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            flexShrink: 0
          }}>
            {/* Row 1: Step counters and active badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Step <strong style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{currentStepIndex + 1}</strong> of {totalSteps}
              </div>
              <span className="active-step-badge" style={{
                fontSize: '9.5px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                letterSpacing: '0.04em'
              }}>
                STEP {activeStepNum}
              </span>
            </div>

            {/* Row 2: Scrubbing Progress Track */}
            <div
              className="progress-container"
              style={{ height: '6px', borderRadius: '4px', cursor: 'pointer', background: 'var(--bg-tertiary)', margin: '1px 0' }}
              title="Click or scrub to jump to step"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                const targetIndex = Math.floor(percentage * totalSteps);
                setCurrentStepIndex(Math.max(0, Math.min(totalSteps - 1, targetIndex)));
              }}
            >
              <div 
                className="progress-bar" 
                style={{
                  width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #6366f1, #38bdf8)'
                }}
              />
            </div>

            {/* Row 3: Action Buttons and Speed Picker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '2px' }}>
              {/* Media Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button 
                  onClick={handleReset} 
                  className="player-btn" 
                  title="Reset to first step (R)"
                  disabled={currentStepIndex === 0}
                  style={{ width: '28px', height: '28px', padding: 0 }}
                >
                  <RotateCcw size={12} />
                </button>
                <button 
                  onClick={handlePrev} 
                  className="player-btn" 
                  title="Previous step (Left Arrow)"
                  disabled={currentStepIndex === 0}
                  style={{ width: '28px', height: '28px', padding: 0 }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  onClick={togglePlay} 
                  className={`player-btn play-pause-btn ${isPlaying ? 'playing' : ''}`}
                  title={isPlaying ? 'Pause autoplay (Space)' : 'Start autoplay (Space)'}
                  style={{
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    background: isPlaying ? '#ef4444' : 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none'
                  }}
                >
                  {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" style={{ marginLeft: '1px' }} />}
                </button>
                <button 
                  onClick={handleNext} 
                  className="player-btn" 
                  title="Next step (Right Arrow)"
                  disabled={currentStepIndex === totalSteps - 1}
                  style={{ width: '28px', height: '28px', padding: 0 }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Speed cycling toggle pill — clean, never overflows! */}
              <button
                type="button"
                onClick={() => {
                  const speeds = [800, 1500, 2500, 4000];
                  const nextIdx = (speeds.indexOf(playSpeed) + 1) % speeds.length;
                  setPlaySpeed(speeds[nextIdx]);
                }}
                className="speed-cycle-pill"
                title="Click to cycle autoplay delay (0.8s, 1.5s, 2.5s, 4.0s)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '16px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <Zap size={10} style={{ color: '#f59e0b' }} />
                <span>{(playSpeed / 1000).toFixed(1)}s</span>
              </button>
            </div>
          </div>

          {/* Timeline Steps Checklist with auto-scroll */}
          <div className="timeline-wrapper" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
            background: 'var(--bg-secondary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            padding: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '2px 4px 6px 4px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '6px'
            }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Protocol Execution Path
              </span>
              <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                {activeSteps.length} steps
              </span>
            </div>

            <div
              ref={timelineContainerRef}
              className="timeline-container"
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}
            >
              {activeSteps.map((step, idx) => {
                const isPast = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                
                let statusClass = 'future';
                if (isPast) statusClass = 'past';
                if (isCurrent) statusClass = 'current';

                const sourcePart = scenarioParticipants.find(p => p.id === step.source);
                const targetPart = scenarioParticipants.find(p => p.id === step.target);
                const strokeColor = sourcePart ? sourcePart.stroke : '#6366f1';
                const isMessage = !!step.target;

                return (
                  <button
                    key={step.id}
                    ref={isCurrent ? activeStepRef : null}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIndex(idx);
                    }}
                    className={`timeline-step ${statusClass}`}
                    style={{
                      position: 'relative',
                      padding: '7px 9px',
                      minHeight: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderLeft: isCurrent ? `3px solid ${strokeColor}` : '3px solid transparent',
                      background: isCurrent ? 'var(--bg-tertiary)' : 'transparent',
                      borderTop: '1px solid transparent',
                      borderRight: '1px solid transparent',
                      borderBottom: '1px solid transparent',
                      borderColor: isCurrent ? 'var(--border-color)' : 'transparent',
                      transition: 'all 0.15s ease',
                      borderRadius: '6px',
                      width: '100%'
                    }}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span 
                      className={`timeline-dot ${statusClass}`}
                      style={
                        isCurrent 
                          ? { background: strokeColor, boxShadow: `0 0 8px ${strokeColor}` }
                          : { background: isPast ? '#10b981' : 'var(--border-color)' }
                      }
                    />
                    <span className="timeline-num" style={{
                      color: isCurrent ? strokeColor : 'var(--text-secondary)',
                      fontWeight: '800',
                      fontSize: '10.5px',
                      minWidth: '22px',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      {step.num}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', textAlign: 'left', minWidth: 0 }}>
                      <span className="timeline-text" title={step.label} style={{
                        fontSize: '11px',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {step.label}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        color: isCurrent ? strokeColor : 'var(--text-muted)',
                        fontWeight: 600,
                        marginTop: '1px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {isMessage ? `${sourcePart?.name || step.source} → ${targetPart?.name || step.target}` : `${sourcePart?.name || step.source} (Internal)`}
                      </span>
                    </div>
                    {isCurrent && (
                      <span style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', color: strokeColor, flexShrink: 0 }}>
                        {isMessage ? <ArrowRight size={12} className="fade-in" /> : <RefreshCw size={10} className="fade-in" style={{ animation: 'spin 4s linear infinite' }} />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div
          className="controls-config-scroll fade-in"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '4px 4px 16px 2px',
          }}
        >
          {/* Dynamic Scenario Status Card */}
          <div className="scenario-status-card fade-in" style={{ padding: '14px', gap: '8px', margin: 0, flexShrink: 0 }}>
            <div className="scenario-status-header">
              <span className="scenario-status-title">
                <Layers size={13} style={{ color: '#6366f1' }} />
                Active Flow Outcome
              </span>
              <span className={`scenario-status-badge ${statusInfo.badgeClass}`}>
                {statusInfo.badge}
              </span>
            </div>
            <div className="scenario-status-desc" style={{ fontSize: '11px', lineHeight: 1.4 }}>
              {statusInfo.desc}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', gap: '8px', zIndex: 1, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Method: <strong style={{ color: 'var(--text-primary)' }}>{scenario.methodPath}</strong></span>
              <span>•</span>
              <span>Routing: <strong style={{ color: 'var(--text-primary)' }}>{scenario.dsRouting}</strong></span>
              {scenario.transStatus === 'C' && (
                <>
                  <span>•</span>
                  <span>Challenge: <strong style={{ color: 'var(--text-primary)' }}>{scenario.challengeOutcome}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Flow Path Breadcrumb — visualises the active protocol path for researchers */}
          <div className="control-group" style={{ padding: '10px 14px', gap: '6px', borderTop: '1px solid var(--border-color)' }}>
            <h3 className="group-title" style={{ paddingBottom: '4px', marginBottom: '2px' }}>
              <ArrowRight size={12} className="title-icon" />
              Active Flow Path
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', fontSize: '10px', fontWeight: 700 }}>
              {(() => {
                // goToStepByNum finds the first active step whose `num` starts
                // with the supplied step-number prefix (e.g. "11a" matches
                // "11a", "11a/x"). Used by the clickable flow-path pills to
                // jump directly to that step in the canvas.
                const goToStepByNum = (numPrefix: string) => {
                  const idx = activeSteps.findIndex((s) => s.num === numPrefix || s.num.startsWith(numPrefix + '/') || s.num.startsWith(numPrefix + '_'));
                  if (idx >= 0) {
                    setIsPlaying(false);
                    setCurrentStepIndex(idx);
                  }
                };
                const pills: Array<{ label: string; tone: 'neutral' | 'success' | 'warn' | 'danger' | 'info' | 'accent'; stepPrefix?: string }> = [];
                const challengeStartStep = scenario.deviceChannel === 'app' ? '11c' : '11a';
                const challengeStartLabel = scenario.deviceChannel === 'app' ? '11c SDK' : '11a CReq';
                const challengeUiLabel = scenario.deviceChannel === 'app'
                  ? (scenario.challengePresentation === 'oob' ? '12c-14b SDK OOB' : '12c-14 SDK')
                  : (scenario.challengePresentation === 'oob' ? '12b-14b OOB' : '12-14');
                // Phase 1: 3DS Method
                pills.push({ label: scenario.methodPath === 'reused' ? 'Method 3a' : scenario.methodPath === 'executed' ? 'Method 3b-4' : scenario.methodPath === 'unavailable' ? 'Method NX' : 'Method TO', tone: scenario.methodPath === 'timeout' ? 'warn' : 'neutral', stepPrefix: '3' });
                // Phase 2: AReq/ARes
                pills.push({ label: 'AReq', tone: 'neutral', stepPrefix: '6' });
                pills.push({ label: 'ARes', tone: 'neutral', stepPrefix: '8' });
                // Phase 3: 3DS Server decision
                pills.push({ label: 'S', tone: 'neutral' });
                // Phase 4: transStatus branch
                switch (scenario.transStatus) {
                  case 'Y': pills.push({ label: 'Y', tone: 'success' }); pills.push({ label: '22a Auth', tone: 'success', stepPrefix: '22a' }); break;
                  case 'A': pills.push({ label: 'A', tone: 'success' }); pills.push({ label: '22a Attempts', tone: 'success', stepPrefix: '22a' }); break;
                  case 'N': pills.push({ label: 'N', tone: 'danger' }); pills.push({ label: '22b Decline', tone: 'danger', stepPrefix: '22b' }); break;
                  case 'U': pills.push({ label: 'U', tone: 'warn' }); pills.push({ label: '22b Decline', tone: 'danger', stepPrefix: '22b' }); break;
                  case 'R': pills.push({ label: 'R', tone: 'danger' }); pills.push({ label: '22b Decline', tone: 'danger', stepPrefix: '22b' }); break;
                  case 'D': pills.push({ label: 'D', tone: 'info' }); pills.push({ label: '16e RReq', tone: 'info', stepPrefix: '16e' }); pills.push({ label: '17-20', tone: 'info', stepPrefix: '17' }); pills.push({ label: '22d Wait', tone: 'info', stepPrefix: '22d' }); break;
                  case 'C':
                    if (scenario.challengeOutcome === 'optout') {
                      pills.push({ label: 'C', tone: 'accent' });
                      pills.push({ label: '10e Opt-Out', tone: 'warn', stepPrefix: '10e' });
                      pills.push({ label: '16f RReq', tone: 'warn', stepPrefix: '16f' });
                      pills.push({ label: '17-20', tone: 'warn', stepPrefix: '17' });
                      pills.push({ label: '22e Non-3DS', tone: 'warn', stepPrefix: '22e' });
                    } else if (scenario.challengeOutcome === 'error') {
                      pills.push({ label: 'C', tone: 'accent' });
                      pills.push({ label: challengeStartLabel, tone: 'accent', stepPrefix: challengeStartStep });
                      pills.push({ label: '12 Challenge', tone: 'accent', stepPrefix: '12' });
                      pills.push({ label: '21_err', tone: 'danger', stepPrefix: '21_err' });
                      pills.push({ label: '22b Decline', tone: 'danger', stepPrefix: '22b' });
                    } else if (scenario.challengeOutcome === 'invalid_cres') {
                      pills.push({ label: 'C', tone: 'accent' });
                      pills.push({ label: challengeStartLabel, tone: 'accent', stepPrefix: challengeStartStep });
                      pills.push({ label: scenario.deviceChannel === 'app' ? '12c SDK' : '12 Challenge', tone: 'accent', stepPrefix: '12' });
                      pills.push({ label: '21_close', tone: 'warn', stepPrefix: '21' });
                      pills.push({ label: '22 Invalid', tone: 'warn', stepPrefix: '22' });
                    } else if (scenario.challengeOutcome === 'decoupled') {
                      pills.push({ label: 'C', tone: 'accent' });
                      pills.push({ label: challengeStartLabel, tone: 'accent', stepPrefix: challengeStartStep });
                      pills.push({ label: scenario.deviceChannel === 'app' ? '12c SDK' : (scenario.challengePresentation === 'oob' ? '12b OOB' : '12 Challenge'), tone: 'accent', stepPrefix: '12' });
                      pills.push({ label: '16d RReq', tone: 'info', stepPrefix: '16d' });
                      pills.push({ label: '17-20', tone: 'info', stepPrefix: '17' });
                      pills.push({ label: '22c Pending', tone: 'info', stepPrefix: '22c' });
                    } else {
                      // success / failure / cancelled
                      pills.push({ label: 'C', tone: 'accent' });
                      pills.push({ label: challengeStartLabel, tone: 'accent', stepPrefix: challengeStartStep });
                      pills.push({ label: challengeUiLabel, tone: 'accent', stepPrefix: '12' });
                      if (scenario.repeatChallenge) pills.push({ label: '15b Retry', tone: 'warn', stepPrefix: '15b' });
                      pills.push({ label: '15', tone: 'accent', stepPrefix: '15' });
                      pills.push({ label: '16a/b RReq', tone: scenario.challengeOutcome === 'success' ? 'success' : 'danger', stepPrefix: '16' });
                      pills.push({ label: '17-20', tone: scenario.challengeOutcome === 'success' ? 'success' : 'danger', stepPrefix: '17' });
                      pills.push({ label: '21_close', tone: 'neutral', stepPrefix: '21' });
                      pills.push({ label: scenario.challengeOutcome === 'success' ? '22a' : '22b', tone: scenario.challengeOutcome === 'success' ? 'success' : 'danger', stepPrefix: scenario.challengeOutcome === 'success' ? '22a' : '22b' });
                    }
                    break;
                  case 'I': pills.push({ label: 'I', tone: 'info' }); pills.push({ label: '22f Non-3DS', tone: 'info', stepPrefix: '22f' }); break;
                  case 'S': pills.push({ label: 'S', tone: 'accent' }); pills.push({ label: 'WebAuthn', tone: 'success' }); pills.push({ label: '22g SPC', tone: 'success', stepPrefix: '22g' }); break;
                }
                return pills.map((p, idx) => {
                  const interactive = Boolean(p.stepPrefix);
                  const click = interactive ? () => goToStepByNum(p.stepPrefix!) : undefined;
                  return (
                    <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      {interactive ? (
                        <button
                          type="button"
                          onClick={click}
                          className={`path-pill path-pill-${p.tone} path-pill-clickable`}
                          title={`Jump to step ${p.stepPrefix}`}
                          aria-label={`Jump to step ${p.stepPrefix}: ${p.label}`}
                        >
                          {p.label}
                        </button>
                      ) : (
                        <span className={`path-pill path-pill-${p.tone}`}>{p.label}</span>
                      )}
                      {idx < pills.length - 1 && <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />}
                    </span>
                  );
                });
              })()}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '2px' }}>
              Researchers: this is the protocol path your current scenario traces. Toggle the controls above to switch branches and watch the chain change.
            </div>
          </div>

          {/* Interactive Scenario Controls */}
          <div className="control-group" style={{ padding: '14px', gap: '10px' }}>
            <h3 className="group-title" style={{ paddingBottom: '8px', marginBottom: '2px' }}>
              <Layers size={14} className="title-icon" />
              Device Channel
            </h3>

            <div className="field-container">
              <div className="segmented-control">
                <button
                  onClick={() => handleDeviceChannelChange('browser')}
                  className={`segment-btn ${scenario.deviceChannel === 'browser' ? 'selected' : ''}`}
                  style={{ padding: '6px 4px' }}
                  title="deviceChannel = 02 (Browser)"
                >
                  <span className="segment-title" style={{ fontSize: '10.5px' }}>Browser</span>
                  <span className="segment-desc" style={{ fontSize: '8px' }}>02 / BRW</span>
                </button>
                <button
                  onClick={() => handleDeviceChannelChange('app')}
                  className={`segment-btn ${scenario.deviceChannel === 'app' ? 'selected' : ''}`}
                  style={{ padding: '6px 4px' }}
                  title="deviceChannel = 01 (App / SDK)"
                >
                  <span className="segment-title" style={{ fontSize: '10.5px' }}>App / SDK</span>
                  <span className="segment-desc" style={{ fontSize: '8px' }}>01 / SDK</span>
                </button>
              </div>
              <div className="status-caption" style={{ fontSize: '10.5px', marginTop: '4px' }}>
                {scenario.deviceChannel === 'app'
                  ? <>The simulator is rendering the SDK-driven challenge path for <code>deviceChannel = 01</code>. Browser-only constructs such as the iframe CReq form POST and notificationURL error callback are hidden in this mode.</>
                  : <>The simulator is rendering the browser challenge path for <code>deviceChannel = 02</code>, including the CReq form POST, iframe challenge surface, and browser callback to <code>notificationURL</code>.</>}
              </div>
            </div>
          </div>

          <div className="control-group" style={{ padding: '14px', gap: '10px' }}>
            <h3 className="group-title" style={{ paddingBottom: '8px', marginBottom: '2px' }}>
              <Activity size={14} className="title-icon" />
              3DS Method Path (Steps 3–4)
            </h3>
            
            <div className="field-container">
              <div className="segmented-control">
                <button
                  onClick={() => handleMethodPathChange('reused')}
                  className={`segment-btn ${scenario.methodPath === 'reused' ? 'selected' : ''}`}
                  style={{ padding: '6px 4px' }}
                >
                  <RotateCw size={11} className="segment-icon" />
                  <span className="segment-title" style={{ fontSize: '10.5px' }}>3a. Reused</span>
                  <span className="segment-desc" style={{ fontSize: '8px' }}>&lt; 10 Mins</span>
                </button>
                <button
                  onClick={() => handleMethodPathChange('executed')}
                  className={`segment-btn ${scenario.methodPath === 'executed' ? 'selected' : ''}`}
                  style={{ padding: '6px 4px' }}
                >
                  <ExternalLink size={11} className="segment-icon" />
                  <span className="segment-title" style={{ fontSize: '10.5px' }}>3b–4. Run</span>
                  <span className="segment-desc" style={{ fontSize: '8px' }}>Fingerprint</span>
                </button>
                <button
                  onClick={() => handleMethodPathChange('unavailable')}
                  className={`segment-btn ${scenario.methodPath === 'unavailable' ? 'selected' : ''}`}
                  style={{ padding: '6px 4px' }}
                >
                  <Database size={11} className="segment-icon" />
                  <span className="segment-title" style={{ fontSize: '10.5px' }}>3c. Absent</span>
                  <span className="segment-desc" style={{ fontSize: '8px' }}>No URL</span>
                </button>
                <button
                  onClick={() => handleMethodPathChange('timeout')}
                  className={`segment-btn ${scenario.methodPath === 'timeout' ? 'selected' : ''}`}
                  style={{ padding: '6px 4px' }}
                >
                  <Clock size={11} className="segment-icon" />
                  <span className="segment-title" style={{ fontSize: '10.5px' }}>3d. Timeout</span>
                  <span className="segment-desc" style={{ fontSize: '8px' }}>&gt; 5 Secs</span>
                </button>
              </div>
            </div>
          </div>

          <div className="control-group" style={{ padding: '14px', gap: '10px' }}>
            <h3 className="group-title" style={{ paddingBottom: '8px', marginBottom: '2px' }}>
              <Network size={14} className="title-icon" />
              DS Routing (Step 7)
            </h3>

            <div className="field-container">
              <div className="segmented-control">
                <button
                  onClick={() => handleDSRoutingChange('normal')}
                  className={`segment-btn ${scenario.dsRouting === 'normal' ? 'selected' : ''}`}
                  style={{ padding: '6px 4px' }}
                >
                  <Network size={11} className="segment-icon" />
                  <span className="segment-title" style={{ fontSize: '10.5px' }}>7b. Forward</span>
                  <span className="segment-desc" style={{ fontSize: '8px' }}>Normal Route</span>
                </button>
                <button
                  onClick={() => handleDSRoutingChange('failure')}
                  className={`segment-btn ${scenario.dsRouting === 'failure' ? 'selected' : ''}`}
                  style={{ padding: '6px 4px' }}
                >
                  <ServerCrash size={11} className="segment-icon" />
                  <span className="segment-title" style={{ fontSize: '10.5px' }}>7✗. DS Error</span>
                  <span className="segment-desc" style={{ fontSize: '8px' }}>Failure</span>
                </button>
              </div>
            </div>
          </div>

          {scenario.dsRouting === 'normal' ? (
            <div className="control-group" style={{ padding: '14px', gap: '10px' }}>
              <h3 className="group-title" style={{ paddingBottom: '8px', marginBottom: '2px' }}>
                <Check size={14} className="title-icon" />
                ACS transStatus Result (Step 8–10)
              </h3>
              
              <div className="trans-status-container" style={{ gap: '8px' }}>
                <div className="status-buttons">
                  {(['Y', 'A', 'N', 'U', 'R', 'C', 'D', 'I', 'S'] as TransStatus[]).map((status) => {
                    const getLabel = (st: TransStatus) => {
                      switch (st) {
                        case 'Y': return 'Y - Success';
                        case 'A': return 'A - Attempt';
                        case 'N': return 'N - Fail';
                        case 'U': return 'U - Unable';
                        case 'R': return 'R - Reject';
                        case 'C': return 'C - Challenge';
                        case 'D': return 'D - Decoupled';
                        case 'I': return 'I - Information';
                        case 'S': return 'S - SPC';
                      }
                    };
                    const isSelected = scenario.transStatus === status;
                    return (
                      <button
                        key={status}
                        onClick={() => handleTransStatusChange(status)}
                        className={`status-btn ${status} ${isSelected ? 'selected' : ''}`}
                        title={getLabel(status)}
                        style={{ width: '32px', height: '32px', fontSize: '11px' }}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
                <div className="status-caption" style={{ fontSize: '10.5px' }}>
                  {scenario.transStatus === 'Y' && 'Y: Authenticated successfully. Liability shifted to issuer.'}
                  {scenario.transStatus === 'A' && 'A: Attempted authentication recorded. Liability shift may apply.'}
                  {scenario.transStatus === 'N' && 'N: Not authenticated. Transaction failed validation.'}
                  {scenario.transStatus === 'U' && 'U: Technical error/unavailable. Issuer unable to complete.'}
                  {scenario.transStatus === 'R' && 'R: Authentication rejected. Authorisation must not be attempted.'}
                  {scenario.transStatus === 'C' && (
                    scenario.deviceChannel === 'app'
                      ? 'C: Challenge required. The requestor app invokes the 3DS SDK, the ACS returns the final challenge result over the SDK channel, and the server-side RReq/RRes exchange closes the loop.'
                      : 'C: Challenge required. Browser CReq/CRes and RReq/RRes path will execute.'
                  )}
                  {scenario.transStatus === 'D' && 'D: Decoupled Authentication. ACS will authenticate out-of-band. 3DS Server waits for RReq per [Req 347].'}
                  {scenario.transStatus === 'I' && 'I: Information only. ACS acknowledges but does not authenticate. Common in 3RI / data-only flows. No liability shift.'}
                  {scenario.transStatus === 'S' && 'S: Secure Payment Confirmation (SPC). 2.3.0+ flow. ACS issues a WebAuthn challenge. Merchant-side Step 10b SPA continues checkout using an SPC authentication value.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="control-group" style={{ padding: '14px' }}>
              <div className="ds-failure-warning" style={{ fontSize: '10.5px', padding: '8px 10px' }}>
                ⚠️ Directory Server validation failed (Step 7). ACS is bypassed. Flow ends with transStatus = U (Unavailable) returned to 3DS Requestor.
              </div>
            </div>
          )}

          {scenario.dsRouting === 'normal' && scenario.transStatus === 'C' && (
            <div className="control-group" style={{ padding: '14px', gap: '10px' }}>
              <h3 className="group-title" style={{ paddingBottom: '8px', marginBottom: '2px' }}>
                <Check size={14} className="title-icon" />
                Challenge Outcome (Steps 15–22)
              </h3>

              <div className="field-container">
                <div className="segmented-control">
                  <button
                    onClick={() => handleChallengeOutcomeChange('success')}
                    className={`segment-btn ${scenario.challengeOutcome === 'success' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                  >
                    <Check size={11} className="segment-icon" />
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>Y. Success</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>RReq/CRes Y</span>
                  </button>
                  <button
                    onClick={() => handleChallengeOutcomeChange('failure')}
                    className={`segment-btn ${scenario.challengeOutcome === 'failure' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                  >
                    <XCircle size={11} className="segment-icon" />
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>N. Failed</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>Wrong proof</span>
                  </button>
                  <button
                    onClick={() => handleChallengeOutcomeChange('cancelled')}
                    className={`segment-btn ${scenario.challengeOutcome === 'cancelled' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                  >
                    <RotateCcw size={11} className="segment-icon" />
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>N. Cancelled</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>User aborts</span>
                  </button>
                  <button
                    onClick={() => handleChallengeOutcomeChange('decoupled')}
                    className={`segment-btn ${scenario.challengeOutcome === 'decoupled' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                  >
                    <Clock size={11} className="segment-icon" />
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>D. Fallback</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>Async issuer</span>
                  </button>
                  <button
                    onClick={() => handleChallengeOutcomeChange('optout')}
                    className={`segment-btn ${scenario.challengeOutcome === 'optout' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                    disabled={!canOptOut}
                    title={!canOptOut ? 'Opt-out is invalid when the ACS mandates challenge or the 3DS Requestor itself mandated challenge (indicator 04).' : 'Return resultsStatus = 02 and do not send CReq to the ACS'}
                  >
                    <XCircle size={11} className="segment-icon" />
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>2. Opt-Out</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>resultsStatus=02</span>
                  </button>
                  <button
                    onClick={() => handleChallengeOutcomeChange('error')}
                    className={`segment-btn ${scenario.challengeOutcome === 'error' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                    title={canUseBrowserChallengeError ? 'ACS posts an Error Message through the browser to notificationURL per §3.3 Step 21' : 'Browser-only error transport; app challenge does not return this path through notificationURL'}
                    disabled={!canUseBrowserChallengeError}
                  >
                    <AlertTriangle size={11} className="segment-icon" />
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>! Error</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>{canUseBrowserChallengeError ? 'Err to URL' : 'Browser only'}</span>
                  </button>
                  <button
                    onClick={() => handleChallengeOutcomeChange('invalid_cres')}
                    className={`segment-btn ${scenario.challengeOutcome === 'invalid_cres' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                    title="3DS Requestor detects an invalid CRes and ends 3DS per §3.3 Step 22"
                  >
                    <ShieldOff size={11} className="segment-icon" />
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>X. Invalid</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>Bad CRes</span>
                  </button>
                </div>
              </div>

              <div className="status-caption" style={{ fontSize: '10.5px' }}>
                {scenario.challengeOutcome === 'success' && (scenario.deviceChannel === 'app'
                  ? 'Successful app challenge. ACS emits RReq Y, returns the final CRes through the SDK channel, and the requestor app resumes checkout.'
                  : 'Successful browser challenge. ACS emits RReq Y and posts final CRes Y.')}
                {scenario.challengeOutcome === 'failure' && (scenario.deviceChannel === 'app'
                  ? 'Challenge proof failed. ACS emits RReq N, the SDK returns the negative completion to the requestor app, and checkout resumes in a failed state.'
                  : 'Challenge proof failed. ACS emits RReq N and the merchant resumes in a failed state.')}
                {scenario.challengeOutcome === 'cancelled' && (scenario.deviceChannel === 'app'
                  ? 'Cardholder abandoned or cancelled the app challenge. ACS sets a Challenge Cancelation Indicator in the RReq and the SDK tears down the challenge surface.'
                  : 'Cardholder abandoned or cancelled the challenge. ACS sets a Challenge Cancelation Indicator in the RReq.')}
                {scenario.challengeOutcome === 'decoupled' && (scenario.deviceChannel === 'app'
                  ? 'Issuer pivots the app challenge into decoupled fallback. The SDK closes the challenge surface and the requestor app shows a pending state.'
                  : 'Issuer pivots the browser challenge into decoupled fallback. Merchant closes the iframe and shows a pending state.')}
                {scenario.challengeOutcome === 'optout' && '3DS Server / 3DS Requestor evaluated the C challenge and decided not to perform it. This path is only valid when the ACS did not mandate the challenge and the 3DS Requestor did not mandate it itself. 3DS Server returns RRes with resultsStatus = 02 (CReq not sent to ACS); checkout resumes per [Req 117].a.'}
                {scenario.challengeOutcome === 'error' && 'ACS posts an Error Message (errorCode/errorComponent) to the merchant notificationURL. Server-side RReq/RRes still close the loop.'}
                {scenario.challengeOutcome === 'invalid_cres' && (scenario.deviceChannel === 'app'
                  ? 'The requestor app fails to validate the final SDK-delivered CRes or completion payload (e.g. mismatched transaction IDs or missing fields). Per Step 22, it must end 3DS processing.'
                  : '3DS Requestor fails to validate the final CRes (e.g. messageVersion mismatch, bad base64url payload, missing fields, or mismatched transaction IDs). Per Step 22, the requestor must detect this and end 3DS processing.')}
              </div>

              <div className="field-container" style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Challenge Decision Inputs
                </div>
                <div className="segmented-control">
                  <button
                    onClick={() => handleChallengePreferenceChange('01')}
                    className={`segment-btn ${scenario.challengePreference === '01' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                    title="01 = No preference"
                  >
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>01</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>No pref</span>
                  </button>
                  <button
                    onClick={() => handleChallengePreferenceChange('02')}
                    className={`segment-btn ${scenario.challengePreference === '02' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                    title="02 = No challenge requested"
                  >
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>02</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>No chall</span>
                  </button>
                  <button
                    onClick={() => handleChallengePreferenceChange('03')}
                    className={`segment-btn ${scenario.challengePreference === '03' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                    title="03 = Challenge requested"
                  >
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>03</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>Request</span>
                  </button>
                  <button
                    onClick={() => handleChallengePreferenceChange('04')}
                    className={`segment-btn ${scenario.challengePreference === '04' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                    title="04 = Challenge requested (mandate)"
                  >
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>04</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>Mandate</span>
                  </button>
                </div>
                <div className="status-caption" style={{ fontSize: '10.5px', marginTop: '4px' }}>
                  <code>threeDSRequestorChallengeInd</code> influences whether the 3DS Server should honor or skip the challenge. Values shown here are the high-signal challenge cases for researchers: no preference, no challenge, challenge requested, and challenge mandated.
                </div>
              </div>

              <div className="field-container" style={{ marginTop: '6px' }}>
                <div className="segmented-control">
                  <button
                    onClick={() => handleChallengeMandatedChange('N')}
                    className={`segment-btn ${scenario.challengeMandated === 'N' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                    title="acsChallengeMandated = N"
                  >
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>ACS N</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>Not mandated</span>
                  </button>
                  <button
                    onClick={() => handleChallengeMandatedChange('Y')}
                    className={`segment-btn ${scenario.challengeMandated === 'Y' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                    title="acsChallengeMandated = Y"
                  >
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>ACS Y</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>Mandated</span>
                  </button>
                </div>
                <div className="status-caption" style={{ fontSize: '10.5px', marginTop: '4px' }}>
                  <code>acsChallengeMandated</code> is returned in the ARes. If it is <code>Y</code>, the merchant-side opt-out path is not available in this model.
                </div>
              </div>

              <div className="field-container" style={{ marginTop: '6px' }}>
                <div className="segmented-control">
                  <button
                    onClick={() => handleChallengePresentationChange('html')}
                    className={`segment-btn ${scenario.challengePresentation === 'html' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                    title={isAppChannel ? 'SDK-rendered challenge UI' : 'Standard browser HTML challenge'}
                  >
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>HTML</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>{isAppChannel ? 'SDK UI' : 'Iframe UI'}</span>
                  </button>
                  <button
                    onClick={() => handleChallengePresentationChange('oob')}
                    className={`segment-btn ${scenario.challengePresentation === 'oob' ? 'selected' : ''}`}
                    style={{ padding: '6px 4px' }}
                    title={isAppChannel ? 'App OOB challenge: SDK shows issuer instructions while approval happens out-of-band' : 'Browser OOB challenge: iframe shows instructions, authentication happens out-of-band'}
                  >
                    <span className="segment-title" style={{ fontSize: '10.5px' }}>OOB</span>
                    <span className="segment-desc" style={{ fontSize: '8px' }}>Instructions</span>
                  </button>
                </div>
                <div className="status-caption" style={{ fontSize: '10.5px', marginTop: '4px' }}>
                  {isAppChannel
                    ? 'App OOB keeps the challenge state machine inside the SDK lane, but the issuer-directed approval itself happens in a separate out-of-band channel.'
                    : 'Browser OOB uses the same overall browser challenge flow, but the ACS iframe shows instructions while the actual authentication happens in an issuer-controlled out-of-band channel.'}
                </div>
              </div>

              {/* §5.8.2 / §3.3 Step 15 — repeat challenge interactions */}
              <div className="field-container" style={{ marginTop: '6px' }}>
                <label className="toggle-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={scenario.repeatChallenge}
                    onChange={(e) => {
                      setScenario({ ...scenario, repeatChallenge: e.target.checked });
                      setCurrentStepIndex(0);
                    }}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>Repeat challenge interactions</span>
                </label>
                <div className="status-caption" style={{ fontSize: '10.5px', marginTop: '4px' }}>
                  Loop Step 15 → Step 12 per ACS max challenges. Each loop increments the Interaction Counter and re-renders the challenge UI until success, max attempts, cancel, or decoupled fallback.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
Controls.displayName = 'Controls';
