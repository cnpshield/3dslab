import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Copy, Check, ExternalLink, Eye, EyeOff, EyeClosed, Clock, Lightbulb, User, Server, Network, Building2, BookOpen, Shield, AlertTriangle, ArrowRight, ArrowLeft, Key, Lock, CheckCircle2, XCircle, FileCode, Layers, Zap, MapPin, Terminal, ClipboardPaste, FileWarning, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react';
import type { FlowStep, Scenario, UserVisibility, StepGroupMeta, StepGroupId, ParticipantId, SecurityLensNote } from '../types';
import { PARTICIPANTS, FLOW_STEPS, STEP_GROUPS, DOMAIN_OVERVIEWS, PARTICIPANT_OVERVIEWS, STEP_GROUP_OVERVIEWS, GLOSSARY, SECURITY_LENS_BY_STEP, inferRiskLevelForStep } from '../data/flowData';
import { JsonHighlighter } from './JsonHighlighter';
import { validate3dsMessage, toCurl, decodeJws } from '../utils/jwsValidator';
import type { ValidationIssue, Severity } from '../utils/jwsValidator';
import { extractPayloadFields, getDynamicPayload } from '../utils/protocolViz';

export type DetailsContext =
  | { kind: 'step'; stepId: string }
  | { kind: 'domain'; domainId: 'acquirer' | 'interop' | 'issuer' }
  | { kind: 'participant'; participantId: ParticipantId }
  | { kind: 'group'; groupId: StepGroupId }
  | { kind: 'glossary' };

interface DetailsPanelProps {
  step: FlowStep;
  scenario: Scenario;
  context: DetailsContext;
  securityLensEnabled: boolean;
  onShowStep: (stepId: string) => void;
  onShowGroup: (groupId: StepGroupId) => void;
  onShowParticipant: (participantId: ParticipantId) => void;
  onShowDomain: (domainId: 'acquirer' | 'interop' | 'issuer') => void;
  onShowGlossary: () => void;
}

const VISIBILITY_META: Record<UserVisibility, { label: string; icon: any; color: string; description: string }> = {
  visible: {
    label: 'User-visible',
    icon: Eye,
    color: '#10b981',
    description: 'The user can see or interact with something on the screen during this step.',
  },
  silent: {
    label: 'Silent (backend)',
    icon: EyeOff,
    color: '#64748b',
    description: 'Happens entirely on the server. The user sees nothing different on the screen.',
  },
  hidden: {
    label: 'Hidden iframe',
    icon: EyeClosed,
    color: '#f59e0b',
    description: 'Runs inside a hidden HTML iframe. The user cannot see it, but it is making HTTP requests on their behalf.',
  },
};

const SectionHeader: React.FC<{ icon: any; title: string; color: string; subtitle?: string }> = ({ icon: Icon, title, color, subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
    <Icon size={14} style={{ color }} />
    <div>
      <div style={{ fontSize: '10.5px', fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '1px' }}>{subtitle}</div>}
    </div>
  </div>
);

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.55 }}>
    {items.map((it, i) => <li key={i} style={{ marginBottom: '2px' }}>{it}</li>)}
  </ul>
);

const Pill: React.FC<{ children: React.ReactNode; color?: string; bg?: string }> = ({ children, color = 'var(--text-primary)', bg = 'var(--bg-tertiary)' }) => (
  <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px', color, background: bg, border: '1px solid var(--border-color)', margin: '1px 2px 1px 0' }}>
    {children}
  </span>
);

const RISK_META: Record<NonNullable<SecurityLensNote['riskLevel']>, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: '#fecaca', bg: 'rgba(239, 68, 68, 0.18)' },
  high: { label: 'High', color: '#fde68a', bg: 'rgba(245, 158, 11, 0.18)' },
  medium: { label: 'Medium', color: '#bfdbfe', bg: 'rgba(59, 130, 246, 0.18)' },
  low: { label: 'Low', color: '#d1fae5', bg: 'rgba(16, 185, 129, 0.18)' },
};

// Color tokens for the JWS/AReq/ARes validator issues. Aligned to the
// same severity palette as RISK_META so the visual language is consistent.
const SEVERITY_COLOR: Record<Severity, { accent: string; bg: string; border: string }> = {
  critical: { accent: '#ef4444', bg: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.30)' },
  high:     { accent: '#f59e0b', bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.30)' },
  medium:   { accent: '#3b82f6', bg: 'rgba(59, 130, 246, 0.10)', border: 'rgba(59, 130, 246, 0.30)' },
  low:      { accent: '#10b981', bg: 'rgba(16, 185, 129, 0.10)', border: 'rgba(16, 185, 129, 0.30)' },
  info:     { accent: '#94a3b8', bg: 'rgba(148, 163, 184, 0.08)', border: 'rgba(148, 163, 184, 0.25)' },
};

const normalizeSpecHook = (value: string) =>
  value.replace(/Â§/g, '§').replace(/â€¢/g, '•').replace(/â€”/g, '—').replace(/â€“/g, '–');

const uniq = (items: Array<string | undefined>) =>
  Array.from(new Set(items.filter((item): item is string => Boolean(item && item.trim()))));

export const DetailsPanel: React.FC<DetailsPanelProps> = memo(({ step, scenario, context, securityLensEnabled, onShowStep, onShowGroup, onShowParticipant, onShowDomain, onShowGlossary }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payload' | 'security'>('overview');
  const [copied, setCopied] = useState(false);
  const [copiedSecurity, setCopiedSecurity] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [pastedPayload, setPastedPayload] = useState('');
  const [validationOpen, setValidationOpen] = useState(true);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

  useEffect(() => {
    setActiveTab('overview');
    setCopied(false);
    setCopiedSecurity(false);
    setCopiedCurl(false);
    // Reset the paste buffer when navigating to a different step — keeping
    // it across step changes would mislead the user into thinking the
    // validation result applies to the newly-shown payload.
    setPastedPayload('');
    setValidationIssues([]);
    setValidationOpen(true);
  }, [context]);

  useEffect(() => {
    if (!securityLensEnabled && activeTab === 'security') {
      setActiveTab('overview');
    }
  }, [securityLensEnabled, activeTab]);

  const sourceParticipant = PARTICIPANTS.find(p => p.id === step.source);
  const targetParticipant = PARTICIPANTS.find(p => p.id === step.target);

  const groupMeta: StepGroupMeta | undefined = useMemo(
    () => (step.groupId ? STEP_GROUPS.find(g => g.id === step.groupId) : undefined),
    [step.groupId]
  );

  const isStepContext = context.kind === 'step';
  const isGlossaryContext = context.kind === 'glossary';
  const isDomainContext = context.kind === 'domain';
  const isParticipantContext = context.kind === 'participant';
  const isGroupContext = context.kind === 'group';

  const visibility = step.userVisibility || 'silent';
  const visibilityMeta = VISIBILITY_META[visibility];
  const VisibilityIcon = visibilityMeta.icon;

  const dynamicPayload = getDynamicPayload(step, scenario);
  const effectiveTransStatus = scenario.transStatus === 'C'
    ? (step.groupId === 'results' || step.groupId === 'completion'
      ? (scenario.challengeOutcome === 'success' ? 'Y' : scenario.challengeOutcome === 'decoupled' ? 'D' : 'N')
      : 'C')
    : scenario.transStatus;

  const securityLensNote: SecurityLensNote | null = useMemo(() => {
    const direct = SECURITY_LENS_BY_STEP[step.id];
    if (direct) return direct;

    const groupOverview = step.groupId ? STEP_GROUP_OVERVIEWS.find((g) => g.id === step.groupId) : undefined;
    if (!groupOverview) return null;

    const scenarioSpecificChecks: string[] = [];
    if (scenario.transStatus === 'C') {
      scenarioSpecificChecks.push('Validate that browser-facing challenge behavior stays consistent with the server-side results loop.');
    }
    if (scenario.challengeOutcome === 'invalid_cres') {
      scenarioSpecificChecks.push('Confirm invalid CRes handling terminates 3DS rather than falling through into success-oriented checkout logic.');
    }
    if (scenario.transStatus === 'D') {
      scenarioSpecificChecks.push('Treat direct decoupled authentication as pending until the RReq arrives or the wait window expires.');
    }

    return {
      summary: `${groupOverview.title} is a protocol boundary with both security and state-consistency implications.`,
      abuseCases: groupOverview.failureModes.slice(0, 3),
      observables: groupOverview.keyDataStructures.slice(0, 3).map((item) => `${item.name}: ${item.description}`),
      defenderChecks: [...groupOverview.securityNotes.slice(0, 3), ...scenarioSpecificChecks].slice(0, 4),
      reportingAngle: `Useful for phase-level analysis of ${groupOverview.title.toLowerCase()} when no step-specific note is defined.`,
      specHooks: [groupOverview.specSection]
    };
  }, [step.id, step.groupId, scenario.transStatus, scenario.challengeOutcome]);

  const enrichedSecurityLensNote: SecurityLensNote | null = useMemo(() => {
    if (!securityLensNote) return null;

    const inferredRisk: NonNullable<SecurityLensNote['riskLevel']> =
      inferRiskLevelForStep(step.id, securityLensNote.riskLevel);

    const inferredAttackers = securityLensNote.attackerPositions || uniq([
      step.groupId === 'challenge' || step.groupId === 'method' ? 'Browser / merchant page surface' : undefined,
      step.groupId === 'results' || step.groupId === 'completion' ? 'Merchant callback / server-side result handler' : undefined,
      step.source === 'S' || step.target === 'S' ? '3DS Server integration surface' : undefined,
      step.source === 'DS' || step.target === 'DS' ? 'Directory Server forwarding / validation boundary' : undefined,
      step.source === 'ACS' || step.target === 'ACS' ? 'Issuer / ACS output surface' : undefined,
      step.source === 'RE' || step.target === 'RE' ? '3DS Requestor / merchant application logic' : undefined,
    ]);

    const inferredPrereqs = securityLensNote.prerequisites || uniq([
      scenario.transStatus === 'C' ? 'Challenge-capable branch is active (`transStatus = C`).' : undefined,
      scenario.transStatus === 'D' ? 'Direct decoupled branch is active (`transStatus = D`).' : undefined,
      step.groupId === 'results' || step.groupId === 'completion' ? 'A prior protocol step has already established transaction identifiers and branch state.' : undefined,
      step.groupId === 'challenge' ? 'Browser challenge transport and issuer render path are reachable.' : undefined,
    ]);

    const payloadFields = extractPayloadFields(step.payload);
    const inferredArtifactFocus = securityLensNote.artifactFocus || uniq([
      ...payloadFields.slice(0, 6),
      step.groupId === 'ares' || step.groupId === 'acs_decision' ? 'transStatus' : undefined,
      step.groupId === 'ares' ? 'acsChallengeMandated' : undefined,
      step.groupId === 'ares' && (scenario.transStatus === 'D' || step.id === 'step_10d') ? 'acsDecConInd' : undefined,
      step.groupId === 'challenge' ? 'threeDSRequestorURL' : undefined,
      step.groupId === 'challenge' ? 'threeDSSessionData' : undefined,
      step.groupId === 'results' ? 'resultsStatus' : undefined,
      step.groupId === 'results' || step.groupId === 'completion' ? 'threeDSServerTransID' : undefined,
      step.groupId === 'results' || step.groupId === 'completion' ? 'acsTransID' : undefined,
    ]);

    const inferredEvidence = securityLensNote.evidenceToCollect || uniq([
      ...securityLensNote.observables.map((item) => `Capture evidence for: ${item}`),
      step.payload ? 'Save the rendered payload or its decoded form alongside timestamps.' : undefined,
      step.groupId === 'challenge' || step.groupId === 'method' ? 'Record browser network traces and DOM/iframe lifecycle events.' : undefined,
      step.groupId === 'results' || step.groupId === 'completion' ? 'Preserve server-side logs showing how callback/result data was validated and consumed.' : undefined,
    ]);

    const inferredGuards = securityLensNote.falsePositiveGuards || uniq([
      step.groupId === 'completion' ? 'Confirm the claimed issue changes trust or authorization behavior, not just cosmetic UI state.' : undefined,
      step.groupId === 'results' ? 'Compare browser-visible state with the authoritative RReq/RRes path before calling it a protocol break.' : undefined,
      scenario.challengeOutcome === 'optout' ? 'Do not call opt-out a bypass unless challenge policy inputs should have forbidden it.' : undefined,
      scenario.transStatus === 'D' ? 'A pending decoupled state is expected; the defect is early success, silent expiry, or incorrect branch handling.' : undefined,
      'Distinguish protocol failure from issuer business decline or expected negative authentication outcomes.',
    ]);

    const inferredImpact = securityLensNote.impactIfBroken
      || (step.id === 'step_22_invalid'
        ? 'A forged, stale, or malformed browser completion could still influence merchant authorization decisions.'
        : step.groupId === 'challenge'
          ? 'Challenge state could be skipped, replayed, or desynchronized, weakening issuer-controlled authentication.'
          : step.groupId === 'results' || step.groupId === 'completion'
            ? 'Merchant-visible completion may diverge from authoritative protocol state, creating incorrect trust or audit outcomes.'
            : 'Protocol branching or trust boundaries may be mis-modeled, making downstream security decisions unreliable.');

    return {
      ...securityLensNote,
      riskLevel: inferredRisk,
      attackerPositions: inferredAttackers,
      prerequisites: inferredPrereqs,
      artifactFocus: inferredArtifactFocus,
      evidenceToCollect: inferredEvidence,
      falsePositiveGuards: inferredGuards,
      impactIfBroken: inferredImpact,
      specHooks: securityLensNote.specHooks?.map(normalizeSpecHook),
    };
  }, [securityLensNote, step.id, step.groupId, step.source, step.target, step.payload, scenario.transStatus, scenario.challengeOutcome]);

  const handleCopy = () => {
    if (!dynamicPayload) return;
    const textToCopy = JSON.stringify(dynamicPayload, null, 2);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // === Copy-as-cURL (audit §4.6) ===
  // Renders the payload as a cURL command — the format an integration
  // engineer pastes into their sandbox to manually exercise the endpoint.
  // For the AReq step the endpoint is the 3DS Server; for ARes the URL
  // is the requestor's notification URL. We default to a labeled placeholder.
  const handleCopyCurl = () => {
    const payload = pastedPayload.trim() || (dynamicPayload ? JSON.stringify(dynamicPayload, null, 2) : '');
    if (!payload) return;
    // Pick a reasonable endpoint hint per step.
    let endpoint = 'https://3dss.example/areq';
    if (step.id.includes('6_b') || step.id.includes('ares')) endpoint = 'https://3dss.example/ares-receiver';
    else if (step.id.includes('cres')) endpoint = (dynamicPayload?.notificationUrl as string | undefined) || 'https://merchant.example/3ds-notify';
    const curl = toCurl(payload, endpoint);
    navigator.clipboard.writeText(curl).then(() => {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    });
  };

  // === Validate paste (audit §1.1 / §1.5) ===
  // Runs the JWS/JSON validator against the user's pasted input and renders
  // a structured issue list. This is the diagnostic tool that closes the
  // "tracking down a cryptographic signing failure" stall point.
  const handleValidate = useCallback((value: string) => {
    setPastedPayload(value);
    if (!value.trim()) {
      setValidationIssues([]);
      return;
    }
    setValidationIssues(validate3dsMessage(value));
  }, []);

  // Decoded JWS preview (if the paste is a JWS compact serialization).
  const decodedJws = useMemo(() => {
    if (!pastedPayload.trim()) return null;
    const parts = pastedPayload.trim().split('.');
    if (parts.length !== 3) return null;
    return decodeJws(pastedPayload);
  }, [pastedPayload]);

  const handleCopySecurity = () => {
    if (!enrichedSecurityLensNote) return;
    const markdown = [
      `## Step ${step.num} — ${step.label}`,
      '',
      `**Risk:** ${enrichedSecurityLensNote.riskLevel ? RISK_META[enrichedSecurityLensNote.riskLevel].label : 'Unspecified'}`,
      enrichedSecurityLensNote.specHooks?.length ? `**Spec Hooks:** ${enrichedSecurityLensNote.specHooks.join(' | ')}` : '',
      '',
      '### Summary',
      enrichedSecurityLensNote.summary,
      '',
      ...(enrichedSecurityLensNote.prerequisites?.length ? ['### Preconditions', ...enrichedSecurityLensNote.prerequisites.map((item) => `- ${item}`), ''] : []),
      ...(enrichedSecurityLensNote.attackerPositions?.length ? ['### Attacker Positions', ...enrichedSecurityLensNote.attackerPositions.map((item) => `- ${item}`), ''] : []),
      ...(enrichedSecurityLensNote.artifactFocus?.length ? ['### Artifact Focus', ...enrichedSecurityLensNote.artifactFocus.map((item) => `- ${item}`), ''] : []),
      '### Abuse Ideas',
      ...enrichedSecurityLensNote.abuseCases.map((item) => `- ${item}`),
      '',
      '### Observables',
      ...enrichedSecurityLensNote.observables.map((item) => `- ${item}`),
      '',
      ...(enrichedSecurityLensNote.evidenceToCollect?.length ? ['### Evidence To Collect', ...enrichedSecurityLensNote.evidenceToCollect.map((item) => `- ${item}`), ''] : []),
      '### Defender Checks',
      ...enrichedSecurityLensNote.defenderChecks.map((item) => `- ${item}`),
      '',
      ...(enrichedSecurityLensNote.falsePositiveGuards?.length ? ['### False Positive Guards', ...enrichedSecurityLensNote.falsePositiveGuards.map((item) => `- ${item}`), ''] : []),
      ...(enrichedSecurityLensNote.impactIfBroken ? ['### Impact If Broken', enrichedSecurityLensNote.impactIfBroken, ''] : []),
      ...(enrichedSecurityLensNote.reportingAngle ? ['### Reporting Angle', enrichedSecurityLensNote.reportingAngle, ''] : []),
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(markdown).then(() => {
      setCopiedSecurity(true);
      setTimeout(() => setCopiedSecurity(false), 2000);
    });
  };

  const renderDomainView = (domain: typeof DOMAIN_OVERVIEWS[0]) => (
    <>
      <div className="context-banner" style={{ background: `${domain.color}10`, border: `1px solid ${domain.color}40`, borderLeft: `4px solid ${domain.color}`, borderRadius: '6px', padding: '10px 12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <Building2 size={18} style={{ color: domain.color, flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '9.5px', fontWeight: '800', color: domain.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Domain Overview</div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '1px' }}>{domain.title}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>{domain.subtitle}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>{domain.specSection}</div>
        </div>
      </div>

      <div className="content-card">
        <SectionHeader icon={Server} title="Members" color="var(--text-primary)" subtitle="Protocol entities that belong to this domain" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
          {domain.members.map(m => <Pill key={m}>{m}</Pill>)}
        </div>
      </div>

      <div className="content-card">
        <SectionHeader icon={CheckCircle2} title="Responsibilities" color="#10b981" subtitle="What this domain owns" />
        <BulletList items={domain.responsibilities} />
      </div>

      <div className="content-card">
        <SectionHeader icon={Key} title="Trust Assumptions" color="#6366f1" subtitle="What this domain trusts about the others" />
        <BulletList items={domain.trustAssumptions} />
      </div>

      <div className="content-card">
        <SectionHeader icon={Lock} title="Prohibitions" color="#ef4444" subtitle="What this domain is NOT allowed to do" />
        <BulletList items={domain.prohibitions} />
      </div>

      <div className="content-card">
        <SectionHeader icon={Zap} title="Notable Features" color="#f59e0b" subtitle="Protocol mechanics anchored in this domain" />
        <BulletList items={domain.notableFeatures} />
      </div>

      <div className="content-card" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
        <button
          onClick={onShowGlossary}
          className="ghost-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: '600', color: 'var(--accent-primary)', background: 'transparent', border: '1px solid var(--border-color)', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
        >
          <BookOpen size={12} /> Open Reference Glossary <ArrowRight size={11} />
        </button>
      </div>
    </>
  );

  const renderParticipantView = (p: typeof PARTICIPANT_OVERVIEWS[0]) => (
    <>
      <div className="context-banner" style={{ background: `${p.color}10`, border: `1px solid ${p.color}40`, borderLeft: `4px solid ${p.color}`, borderRadius: '6px', padding: '10px 12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <Network size={18} style={{ color: p.color, flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '9.5px', fontWeight: '800', color: p.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Participant Profile</div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '1px' }}>{p.fullName}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>{p.shortName}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>{p.specSection}</div>
        </div>
      </div>

      <div className="content-card">
        <SectionHeader icon={FileCode} title="Role" color="var(--text-primary)" />
        <p style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0 }}>{p.role}</p>
      </div>

      <div className="content-card">
        <SectionHeader icon={CheckCircle2} title="Owns" color="#10b981" subtitle="What this participant is responsible for" />
        <BulletList items={p.owns} />
      </div>

      <div className="content-card">
        <SectionHeader icon={XCircle} title="Does Not Own" color="#ef4444" subtitle="What this participant must delegate" />
        <BulletList items={p.doesNotOwn} />
      </div>

      <div className="content-card">
        <SectionHeader icon={ArrowRight} title="Sends" color="var(--accent-primary)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {p.sends.map((m, i) => <div key={i} style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', padding: '2px 0' }}>→ {m}</div>)}
        </div>
      </div>

      <div className="content-card">
        <SectionHeader icon={ArrowRight} title="Receives" color="var(--accent-primary)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {p.receives.map((m, i) => <div key={i} style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', padding: '2px 0' }}>← {m}</div>)}
        </div>
      </div>

      {p.authoritativeIds.length > 0 && (
        <div className="content-card">
          <SectionHeader icon={Key} title="Authoritative IDs" color="#6366f1" subtitle="ID-spaces this participant owns" />
          <BulletList items={p.authoritativeIds} />
        </div>
      )}

      <div className="content-card">
        <SectionHeader icon={Lightbulb} title="Researcher Notes" color="#f59e0b" />
        <BulletList items={p.notes} />
      </div>

      {(() => {
        // Find the domain this participant belongs to.
        // Match by the participant's full name OR short name appearing in any domain member string,
        // OR by a substring check.
        const memberStrings = DOMAIN_OVERVIEWS.flatMap(d => d.members.map(m => ({ domain: d, member: m })));
        const match = memberStrings.find(({ member }) => {
          const ml = member.toLowerCase();
          const pl = p.fullName.toLowerCase();
          const sl = p.shortName.toLowerCase();
          return ml === pl || ml === sl || ml.includes(sl) || pl.includes(sl);
        });
        const finalDomain = match?.domain;
        if (!finalDomain) return null;
        return (
          <div className="content-card" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
            <button
              onClick={() => onShowDomain(finalDomain.id)}
              className="ghost-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: '600', color: finalDomain.color, background: `${finalDomain.color}10`, border: `1px solid ${finalDomain.color}40`, padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
            >
              <MapPin size={12} />
              Belongs to {finalDomain.title}
              <ArrowRight size={11} />
            </button>
          </div>
        );
      })()}
    </>
  );

  const renderGroupView = (g: typeof STEP_GROUP_OVERVIEWS[0]) => (
    <>
      <div className="context-banner" style={{ background: `${g.color}10`, border: `1px solid ${g.color}40`, borderLeft: `4px solid ${g.color}`, borderRadius: '6px', padding: '10px 12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <Layers size={18} style={{ color: g.color, flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '9.5px', fontWeight: '800', color: g.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phase Overview</div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '1px' }}>{g.title}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>{g.summary}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>{g.specSection}</div>
        </div>
      </div>

      <div className="content-card">
        <SectionHeader icon={Zap} title="What Happens" color="var(--text-primary)" />
        <BulletList items={g.whatHappens} />
      </div>

      <div className="content-card">
        <SectionHeader icon={Lightbulb} title="Why This Phase Exists" color="#6366f1" />
        <p style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0 }}>{g.whyItExists}</p>
      </div>

      <div className="content-card">
        <SectionHeader icon={Clock} title="Typical Duration" color="var(--text-muted)" />
        <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>{g.typicalDuration}</div>
      </div>

      <div className="content-card">
        <SectionHeader icon={AlertTriangle} title="Failure Modes" color="#ef4444" subtitle="How this phase can go wrong" />
        <BulletList items={g.failureModes} />
      </div>

      <div className="content-card">
        <SectionHeader icon={FileCode} title="Key Data Structures" color="var(--text-primary)" />
        {g.keyDataStructures.map((d, i) => (
          <div key={i} style={{ marginBottom: '6px', paddingBottom: '6px', borderBottom: i < g.keyDataStructures.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <code style={{ fontSize: '11px', color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono', fontWeight: '700' }}>{d.name}</code>
              <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{d.ref}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.5, marginTop: '2px' }}>{d.description}</div>
          </div>
        ))}
      </div>

      <div className="content-card">
        <SectionHeader icon={Shield} title="Security Notes" color="#10b981" />
        <BulletList items={g.securityNotes} />
      </div>
    </>
  );

  const renderGlossaryView = () => (
    <>
      <div className="context-banner" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderLeft: '4px solid #6366f1', borderRadius: '6px', padding: '10px 12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <BookOpen size={18} style={{ color: '#6366f1', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reference</div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '1px' }}>3DS Glossary & Spec Index</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>Every term a researcher needs, with spec section references.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {GLOSSARY.map((g, i) => (
          <div key={i} className="content-card glossary-entry">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <code style={{ fontSize: '12px', color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono', fontWeight: '700' }}>{g.term}</code>
              {g.abbreviation && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>({g.abbreviation})</span>}
              {g.specRef && <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginLeft: 'auto' }}>{g.specRef}</span>}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.55, margin: '4px 0 0 0' }}>{g.definition}</p>
            {g.example && (
              <div style={{ marginTop: '4px', fontSize: '10.5px', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '3px 6px', borderRadius: '4px' }}>
                e.g. {g.example}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const renderHeader = () => {
    if (!isStepContext) return null;
    return (
      <div className="details-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div className="details-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span className="details-step-badge" style={{ fontSize: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            Step {step.num}
          </span>
          {groupMeta && (
            <button
              onClick={() => onShowGroup(groupMeta.id)}
              title={groupMeta.description}
              className="badge-button"
              style={{ fontSize: '9.5px', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', color: '#fff', background: groupMeta.color, letterSpacing: '0.03em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}
            >
              {groupMeta.title.split('—')[0].trim()}
            </button>
          )}
          <span
            className="details-visibility-badge"
            title={visibilityMeta.description}
            style={{ fontSize: '9.5px', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', color: visibilityMeta.color, background: `${visibilityMeta.color}15`, border: `1px solid ${visibilityMeta.color}40`, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
          >
            <VisibilityIcon size={10} />
            {visibilityMeta.label}
          </span>
          {step.approxTime && (
            <span className="details-time-badge" style={{ fontSize: '9.5px', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={10} />
              {step.approxTime}
            </span>
          )}
        </div>
        <h2 className="details-title" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 8px 0' }}>{step.label}</h2>

        <div className="flow-direction" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          {sourceParticipant ? (
            <button
              onClick={() => onShowParticipant(sourceParticipant.id)}
              className="badge-button"
              style={{ fontSize: '11px', color: sourceParticipant.stroke, fontWeight: '700', padding: '2px 8px', background: `${sourceParticipant.stroke}15`, borderRadius: '4px', border: `1px solid ${sourceParticipant.stroke}40`, cursor: 'pointer' }}
              title={`View ${sourceParticipant.fullName} profile`}
            >
              {sourceParticipant.name}
            </button>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              Internal Step
            </div>
          )}

          {targetParticipant && (
            <>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>→</div>
              <button
                onClick={() => onShowParticipant(targetParticipant.id)}
                className="badge-button"
                style={{ fontSize: '11px', color: targetParticipant.stroke, fontWeight: '700', padding: '2px 8px', background: `${targetParticipant.stroke}15`, borderRadius: '4px', border: `1px solid ${targetParticipant.stroke}40`, cursor: 'pointer' }}
                title={`View ${targetParticipant.fullName} profile`}
              >
                {targetParticipant.name}
              </button>
            </>
          )}

          {step.specRef && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500', marginLeft: 'auto', fontFamily: 'JetBrains Mono' }}>
              {step.specRef}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="details-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {renderHeader()}

      {isStepContext && (
        <div className="details-tabs" style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: '6px', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            style={{ flex: 1, border: 'none', background: activeTab === 'overview' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: activeTab === 'overview' ? 'var(--shadow-sm)' : 'none' }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('payload')}
            className={`tab-btn ${activeTab === 'payload' ? 'active' : ''}`}
            disabled={!step.payload}
            style={{ flex: 1, border: 'none', background: activeTab === 'payload' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'payload' ? 'var(--text-primary)' : 'var(--text-secondary)', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: step.payload ? 'pointer' : 'not-allowed', opacity: step.payload ? 1 : 0.4, transition: 'all 0.15s ease', boxShadow: activeTab === 'payload' ? 'var(--shadow-sm)' : 'none' }}
          >
            Protocol Data
          </button>
          {securityLensEnabled && (
            <button
              onClick={() => setActiveTab('security')}
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              style={{ flex: 1, border: 'none', background: activeTab === 'security' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'security' ? 'var(--text-primary)' : 'var(--text-secondary)', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: activeTab === 'security' ? 'var(--shadow-sm)' : 'none' }}
            >
              Research Lens
            </button>
          )}
        </div>
      )}

      <div className="details-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isStepContext && activeTab === 'overview' && (
          <div className="tab-pane fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
            <p className="step-explanation" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{step.detail}</p>

            {step.userExperience && (
              <div className="user-experience-card" style={{ background: `${visibilityMeta.color}08`, border: `1px solid ${visibilityMeta.color}30`, borderLeft: `3px solid ${visibilityMeta.color}`, borderRadius: '6px', padding: '10px 12px', display: 'flex', gap: '10px' }}>
                <User size={15} style={{ color: visibilityMeta.color, flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '9.5px', fontWeight: '800', color: visibilityMeta.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                    What the user experiences
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0 }}>{step.userExperience}</p>
                </div>
              </div>
            )}

            {step.whyItMatters && (
              <div className="why-it-matters-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderLeft: '3px solid #6366f1', borderRadius: '6px', padding: '10px 12px', display: 'flex', gap: '10px' }}>
                <Lightbulb size={15} style={{ color: '#6366f1', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                    Why this step exists
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0 }}>{step.whyItMatters}</p>
                </div>
              </div>
            )}

            <div className="parameter-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', margin: '4px 0 2px 0' }}>
                Key Protocol Fields
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="details-key-value-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800' }}>
                    <code style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>threeDSServerTransID</code>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>UUID v4 (RFC 4122)</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '2px' }}>
                    The unique ID generated by the 3DS Server. Links the 3DS Method data (step 4) to the subsequent <code>AReq</code> (step 6) and the final <code>ARes</code> (step 8c).
                  </div>
                </div>
                <div className="details-key-value-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800' }}>
                    <code style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>deviceChannel</code>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '10.5px' }}>02 (Browser)</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '2px' }}>
                    Always set to <code>02</code> for browser-based 3DS. (Use <code>01</code> for App-based / SDK flows.)
                  </div>
                </div>
                <div className="details-key-value-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800' }}>
                    <code style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>messageCategory</code>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '10.5px' }}>01 (Payment Auth)</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '2px' }}>
                    <code>01</code> for Payment Authentication (PA), <code>02</code> for Non-Payment Authentication (NPA). Per Table A.1, all other values (<code>03-79</code>) are reserved for EMVCo future use and <code>80-99</code> for DS use.
                  </div>
                </div>
                <div className="details-key-value-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800' }}>
                    <code style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>threeDSCompInd</code>
                    <span className={`status-badge-text ${scenario.methodPath === 'reused' || scenario.methodPath === 'executed' ? 'Y' : scenario.methodPath === 'unavailable' ? 'U' : 'N'}`}>
                      {scenario.methodPath === 'reused' || scenario.methodPath === 'executed' ? 'Y (Completed)' : scenario.methodPath === 'unavailable' ? 'U (Unavailable)' : 'N (No/Timeout)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '2px' }}>
                    Tells the ACS whether the 3DS Method succeeded. <strong>Y</strong>=Completed, <strong>N</strong>=Not Completed / timed out, <strong>U</strong>=Unavailable (no URL).
                  </div>
                </div>
                {step.groupId === 'acs_decision' || step.groupId === 'ares' || step.groupId === 'challenge' || step.groupId === 'results' || step.groupId === 'completion' ? (
                  <div className="details-key-value-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800' }}>
                      <code style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>transStatus</code>
                      <span className={`status-badge-text ${effectiveTransStatus}`}>
                        {effectiveTransStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '2px' }}>
                      ACS / challenge result state. <strong>Y</strong>=Authenticated, <strong>A</strong>=Attempt, <strong>N</strong>=Not authenticated, <strong>U</strong>=Unable to authenticate, <strong>R</strong>=Rejected, <strong>C</strong>=Challenge required, <strong>D</strong>=Decoupled / asynchronous issuer authentication, <strong>I</strong>=Information Only, <strong>S</strong>=Secure Payment Confirmation.
                    </div>
                  </div>
                ) : null}
                {scenario.transStatus === 'C' ? (
                  <>
                    <div className="details-key-value-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800' }}>
                        <code style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>threeDSRequestorChallengeInd</code>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '10.5px' }}>{scenario.challengePreference}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '2px' }}>
                        Merchant / 3DS Server challenge preference in the AReq. In this browser model: <strong>01</strong>=No preference, <strong>02</strong>=No challenge requested, <strong>03</strong>=Challenge requested, <strong>04</strong>=Challenge mandated by the requestor.
                      </div>
                    </div>
                    <div className="details-key-value-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800' }}>
                        <code style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>acsChallengeMandated</code>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '10.5px' }}>{scenario.challengeMandated}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '2px' }}>
                        ARes flag indicating whether the ACS requires the challenge for local/regional mandates. The 3DS Requestor still evaluates it together with the 3DS Requestor Challenge Indicator and ACS Rendering Type ([Req 117] ¶4), and may opt out regardless by emitting <code>resultsStatus = 02</code>.
                      </div>
                    </div>
                  </>
                ) : null}
                {((scenario.transStatus === 'Y') || (scenario.transStatus === 'C' && scenario.challengeOutcome === 'success')) && (step.groupId === 'acs_decision' || step.groupId === 'ares' || step.groupId === 'results' || step.groupId === 'completion') ? (
                  <div className="details-key-value-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800' }}>
                      <code style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>eci / authenticationValue</code>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '10.5px' }}>05 / CAVV</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '2px' }}>
                      <strong>ECI</strong> (Electronic Commerce Indicator): <code>05</code> = fully authenticated. The <strong>CAVV</strong> is the cryptogram the merchant must include in the standard authorization to receive the liability shift.
                    </div>
                  </div>
                ) : null}
                {step.num.startsWith('7✗') ? (
                  <div className="details-key-value-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800' }}>
                      <code style={{ color: '#ef4444', fontFamily: 'JetBrains Mono' }}>errorCode / errorComponent</code>
                      <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '10.5px' }}>405 / D</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '2px' }}>
                      <strong>405</strong> = System Connection Failure. <strong>errorComponent = D</strong> = DS. The 3DS Server maps this to <code>transStatus = U</code> per Table A.10.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Step navigation footer: prev / next step */}
            {(() => {
              const stepList = FLOW_STEPS.filter(s => s.isActive(scenario));
              const idx = stepList.findIndex(s => s.id === step.id);
              if (idx === -1) return null;
              const prev = idx > 0 ? stepList[idx - 1] : null;
              const next = idx < stepList.length - 1 ? stepList[idx + 1] : null;
              return (
                <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                  {prev ? (
                    <button
                      onClick={() => onShowStep(prev.id)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', padding: '8px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '5px', cursor: 'pointer', fontSize: '10.5px', color: 'var(--text-secondary)', textAlign: 'left', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    >
                      <ArrowLeft size={12} />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Step {prev.num}</span>
                        <span style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prev.label}</span>
                      </div>
                    </button>
                  ) : <div style={{ flex: 1 }} />}
                  {next ? (
                    <button
                      onClick={() => onShowStep(next.id)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', padding: '8px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '5px', cursor: 'pointer', fontSize: '10.5px', color: 'var(--text-secondary)', textAlign: 'right', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Step {next.num}</span>
                        <span style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{next.label}</span>
                      </div>
                      <ArrowRight size={12} />
                    </button>
                  ) : <div style={{ flex: 1 }} />}
                </div>
              );
            })()}
          </div>
        )}

        {isStepContext && activeTab === 'payload' && dynamicPayload && (
          <div className="tab-pane fade-in payload-pane" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Synthetic payload watermark (audit §4.2). Every payload
                rendered by the lab is fabricated for visualization.
                Without this chip, a screenshot of the lab could be
                mistaken for a real capture in a write-up or report. */}
            <div
              role="note"
              aria-label="Synthetic payload notice"
              data-testid="synthetic-watermark"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '10px',
                fontWeight: 700,
                color: '#a78bfa',
                background: 'rgba(139, 92, 246, 0.10)',
                borderTop: '1px solid rgba(139, 92, 246, 0.30)',
                borderBottom: '1px solid rgba(139, 92, 246, 0.30)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              <FlaskConical size={11} aria-hidden="true" />
              <span>Synthetic payload</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
                All values are fabricated for visualization — no real PAN, BIN, or signature.
              </span>
            </div>
            <div className="payload-toolbar">
              <span className="payload-title">{step.payloadTitle || 'Request Payload'}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={handleCopyCurl} className="copy-btn" title="Copy this payload as a cURL command — paste into your terminal to exercise the endpoint">
                  {copiedCurl ? <><Check size={13} className="copied-icon" /><span>Copied!</span></> : <><Terminal size={13} /><span>Copy as cURL</span></>}
                </button>
                <button onClick={handleCopy} className="copy-btn">
                  {copied ? <><Check size={13} className="copied-icon" /><span>Copied!</span></> : <><Copy size={13} /><span>Copy JSON</span></>}
                </button>
              </div>
            </div>

            {step.payloadType === 'form' ? (
              <div className="form-data-display" style={{ overflowY: 'auto' }}>
                <div style={{ marginBottom: '8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  HTTP POST target: <code style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>{String((dynamicPayload.methodUrl || dynamicPayload.notificationUrl) ?? '')}</code>
                </div>
                <div className="form-fields-box">
                  {Object.entries(dynamicPayload.fields || {}).map(([key, value]) => (
                    <div key={key} className="form-field-row">
                      <div className="form-field-key">{key}:</div>
                      <div className="form-field-value">{value as string}</div>
                    </div>
                  ))}
                </div>
                {dynamicPayload.decodedData != null && (
                  <div className="decoded-json-box">
                    <div className="decoded-header" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ExternalLink size={12} style={{ color: '#10b981' }} />
                      <span>Decoded 3DS Payload (Base64url)</span>
                    </div>
                    <JsonHighlighter data={dynamicPayload.decodedData} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <JsonHighlighter data={dynamicPayload} />
              </div>
            )}

            {/* === Paste & validate (audit §1.1 / §1.5) ===
                 A textarea where an integration engineer can paste a real
                 AReq/ARes (JWS or JSON) and instantly see structural issues
                 against the EMVCo Table A.1 / B.1 schema. The validation
                 result updates on every keystroke (debounced via React's
                 batching). This is the diagnostic loop that closes the
                 "where do I track down a cryptographic signing failure"
                 gap from the audit. */}
            <div
              className="paste-validate-box"
              style={{
                marginTop: '10px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
              }}
            >
              <div
                className="paste-validate-header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <ClipboardPaste size={11} aria-hidden="true" />
                <span>Paste a real {dynamicPayload?.messageType as string || (step.id.includes('ares') ? 'ARes' : 'AReq')} and validate</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
                  JWS compact serialization or raw JSON
                </span>
              </div>
              <textarea
                value={pastedPayload}
                onChange={(e) => handleValidate(e.target.value)}
                placeholder="Paste your AReq or ARes here (JWS or JSON). Validation runs locally — nothing is sent."
                aria-label="Paste a real 3DS message to validate"
                spellCheck={false}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  maxHeight: '120px',
                  resize: 'vertical',
                  padding: '8px 10px',
                  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  fontSize: '10.5px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  border: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {pastedPayload.trim() && (
                <div
                  className="validation-accordion"
                  role="region"
                  aria-label="Validation issues"
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    padding: '6px 10px',
                    background: 'var(--bg-tertiary)',
                  }}
                >
                  <button
                    onClick={() => setValidationOpen((v) => !v)}
                    aria-expanded={validationOpen}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {validationOpen ? <ChevronUp size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
                    <span>
                      Validation Issues
                      <span
                        style={{
                          marginLeft: '6px',
                          padding: '0 6px',
                          borderRadius: '10px',
                          fontSize: '9px',
                          fontWeight: 700,
                          color: validationIssues.length === 0 ? '#065f46' : '#7c2d12',
                          background: validationIssues.length === 0 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                        }}
                      >
                        {validationIssues.length}
                      </span>
                    </span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 500 }}>
                      {validationIssues.length === 0
                        ? 'No issues found'
                        : `${validationIssues.filter((i) => i.severity === 'critical' || i.severity === 'high').length} critical/high`}
                    </span>
                  </button>

                  {validationOpen && (
                    <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {validationIssues.length === 0 && pastedPayload.trim() && (
                        <li style={{ fontSize: '10.5px', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={12} aria-hidden="true" />
                          <span>No structural issues detected against the EMVCo schema check.</span>
                        </li>
                      )}
                      {validationIssues.map((issue, i) => (
                        <li
                          key={i}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr auto',
                            gap: '6px',
                            alignItems: 'flex-start',
                            padding: '5px 6px',
                            border: `1px solid ${SEVERITY_COLOR[issue.severity].border}`,
                            borderLeft: `3px solid ${SEVERITY_COLOR[issue.severity].accent}`,
                            borderRadius: '4px',
                            background: SEVERITY_COLOR[issue.severity].bg,
                          }}
                        >
                          <span
                            title={`Severity: ${issue.severity}`}
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              color: SEVERITY_COLOR[issue.severity].accent,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              paddingTop: '1px',
                            }}
                          >
                            {issue.severity}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-primary)' }}>
                              <code
                                style={{
                                  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                                  fontSize: '10px',
                                  background: 'var(--bg-secondary)',
                                  padding: '0 4px',
                                  borderRadius: '3px',
                                  color: 'var(--accent-primary)',
                                }}
                              >
                                {issue.field}
                              </code>
                              {' '}— {issue.message}
                            </div>
                            {issue.suggestion && (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Suggestion: {issue.suggestion}
                              </div>
                            )}
                          </div>
                          <code
                            title={`Spec reference: ${issue.specRef}`}
                            style={{
                              fontSize: '9px',
                              color: 'var(--text-muted)',
                              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                              whiteSpace: 'nowrap',
                              paddingTop: '1px',
                            }}
                          >
                            {issue.specRef}
                          </code>
                        </li>
                      ))}
                    </ul>
                  )}

                  {decodedJws && (decodedJws.header || decodedJws.payload) && (
                    <details
                      style={{
                        marginTop: '8px',
                        borderTop: '1px dashed var(--border-color)',
                        paddingTop: '6px',
                      }}
                    >
                      <summary
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          cursor: 'pointer',
                        }}
                      >
                        Decoded JWS preview
                      </summary>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                        {decodedJws.header && (
                          <div>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Header</div>
                            <JsonHighlighter data={decodedJws.header} />
                          </div>
                        )}
                        {decodedJws.payload && (
                          <div>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Payload</div>
                            <JsonHighlighter data={decodedJws.payload} />
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              )}

              <div
                className="paste-validate-footer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <FileWarning size={11} aria-hidden="true" />
                <span>Structural validation only — does not verify the JWS signature against an issuer JWK.</span>
              </div>
            </div>
          </div>
        )}

        {isStepContext && activeTab === 'security' && securityLensEnabled && enrichedSecurityLensNote && (
          <div className="tab-pane fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
            <div className="context-banner" style={{ background: 'var(--accent-secondary-bg-trans)', border: '1px solid var(--accent-secondary-border-trans)', borderLeft: '4px solid var(--accent-secondary)', borderRadius: '6px', padding: '10px 12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Shield size={18} style={{ color: 'var(--accent-secondary)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '9.5px', fontWeight: '800', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Security Research Lens</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {enrichedSecurityLensNote.riskLevel && (
                    <Pill color={RISK_META[enrichedSecurityLensNote.riskLevel].color} bg={RISK_META[enrichedSecurityLensNote.riskLevel].bg}>
                      Risk: {RISK_META[enrichedSecurityLensNote.riskLevel].label}
                    </Pill>
                  )}
                  <Pill color="var(--accent-primary)" bg="rgba(13, 62, 92, 0.12)">
                    Step {step.num}
                  </Pill>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.55, marginTop: '6px' }}>{enrichedSecurityLensNote.summary}</div>
                {enrichedSecurityLensNote.specHooks && enrichedSecurityLensNote.specHooks.length > 0 && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '5px', fontFamily: 'JetBrains Mono' }}>
                    {enrichedSecurityLensNote.specHooks.join(' • ')}
                  </div>
                )}
                <div style={{ marginTop: '8px' }}>
                  <button onClick={handleCopySecurity} className="copy-btn">
                    {copiedSecurity ? <><Check size={13} className="copied-icon" /><span>Copied Note</span></> : <><Copy size={13} /><span>Copy Markdown</span></>}
                  </button>
                </div>
              </div>
            </div>

            {(enrichedSecurityLensNote.prerequisites?.length || enrichedSecurityLensNote.attackerPositions?.length) && (
              <div className="content-card">
                <SectionHeader icon={MapPin} title="Research Setup" color="#60a5fa" subtitle="Preconditions and vantage points for meaningful testing" />
                {enrichedSecurityLensNote.prerequisites && enrichedSecurityLensNote.prerequisites.length > 0 && (
                  <>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Preconditions</div>
                    <BulletList items={enrichedSecurityLensNote.prerequisites} />
                  </>
                )}
                {enrichedSecurityLensNote.attackerPositions && enrichedSecurityLensNote.attackerPositions.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Attacker Positions</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {enrichedSecurityLensNote.attackerPositions.map((item) => <Pill key={item}>{item}</Pill>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {enrichedSecurityLensNote.artifactFocus && enrichedSecurityLensNote.artifactFocus.length > 0 && (
              <div className="content-card">
                <SectionHeader icon={Key} title="Artifact Focus" color="#a78bfa" subtitle="Fields, messages, or UI surfaces most worth instrumenting" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {enrichedSecurityLensNote.artifactFocus.map((item) => <Pill key={item} color="#e9d5ff" bg="rgba(139, 92, 246, 0.18)">{item}</Pill>)}
                </div>
              </div>
            )}

            <div className="content-card">
              <SectionHeader icon={AlertTriangle} title="Abuse Ideas" color="#f59e0b" subtitle="What is worth trying against this step" />
              <BulletList items={enrichedSecurityLensNote.abuseCases} />
            </div>

            <div className="content-card">
              <SectionHeader icon={Eye} title="What To Observe" color="#60a5fa" subtitle="Signals to watch in browser, logs, or protocol traces" />
              <BulletList items={enrichedSecurityLensNote.observables} />
            </div>

            {enrichedSecurityLensNote.evidenceToCollect && enrichedSecurityLensNote.evidenceToCollect.length > 0 && (
              <div className="content-card">
                <SectionHeader icon={FileCode} title="Evidence To Collect" color="#38bdf8" subtitle="Artifacts that make a finding reproducible and citable" />
                <BulletList items={enrichedSecurityLensNote.evidenceToCollect} />
              </div>
            )}

            {enrichedSecurityLensNote.impactIfBroken && (
              <div className="content-card">
                <SectionHeader icon={Shield} title="Impact If Broken" color="#fb7185" subtitle="Why this step matters beyond implementation detail" />
                <p style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0 }}>
                  {enrichedSecurityLensNote.impactIfBroken}
                </p>
              </div>
            )}

            <div className="content-card">
              <SectionHeader icon={CheckCircle2} title="What Must Hold" color="#10b981" subtitle="Defensive invariants for this branch" />
              <BulletList items={enrichedSecurityLensNote.defenderChecks} />
            </div>

            {enrichedSecurityLensNote.falsePositiveGuards && enrichedSecurityLensNote.falsePositiveGuards.length > 0 && (
              <div className="content-card">
                <SectionHeader icon={Lock} title="False Positive Guards" color="#f97316" subtitle="What to rule out before claiming a vulnerability" />
                <BulletList items={enrichedSecurityLensNote.falsePositiveGuards} />
              </div>
            )}

            {enrichedSecurityLensNote.reportingAngle && (
              <div className="content-card">
                <SectionHeader icon={FileCode} title="Reporting Angle" color="#6366f1" subtitle="How to frame a finding if something breaks here" />
                <p style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0 }}>
                  {enrichedSecurityLensNote.reportingAngle}
                </p>
              </div>
            )}
          </div>
        )}

        {isDomainContext && (() => {
          const domain = DOMAIN_OVERVIEWS.find(d => d.id === context.domainId);
          return domain ? (
            <div className="tab-pane fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
              {renderDomainView(domain)}
            </div>
          ) : null;
        })()}

        {isParticipantContext && (() => {
          const p = PARTICIPANT_OVERVIEWS.find(p => p.id === context.participantId);
          return p ? (
            <div className="tab-pane fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
              {renderParticipantView(p)}
            </div>
          ) : null;
        })()}

        {isGroupContext && (() => {
          const g = STEP_GROUP_OVERVIEWS.find(g => g.id === context.groupId);
          return g ? (
            <div className="tab-pane fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
              {renderGroupView(g)}
            </div>
          ) : null;
        })()}

        {isGlossaryContext && (
          <div className="tab-pane fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
            {renderGlossaryView()}
          </div>
        )}
      </div>
    </div>
  );
});
DetailsPanel.displayName = 'DetailsPanel';
