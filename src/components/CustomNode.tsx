import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  User, 
  Globe, 
  Laptop, 
  Server, 
  Network, 
  ShieldCheck, 
  Database,
  Search,
  RotateCw
} from 'lucide-react';

// Map participant IDs to corresponding icons
const getParticipantIcon = (id: string, color: string) => {
  switch (id) {
    case 'CH':
      return <User size={20} style={{ color }} />;
    case 'BR':
      return <Globe size={20} style={{ color }} />;
    case 'RE':
      return <Laptop size={20} style={{ color }} />;
    case 'S':
      return <Server size={20} style={{ color }} />;
    case 'DS':
      return <Network size={20} style={{ color }} />;
    case 'ACS':
      return <ShieldCheck size={20} style={{ color }} />;
    default:
      return <Server size={20} style={{ color }} />;
  }
};

export const ParticipantHeaderNode: React.FC<{ data: { name: string; fullName: string; id: string; color: string; stroke: string; bg: string; isActive?: boolean } }> = React.memo(({ data }) => {
  return (
    <div
      className={`participant-header-node ${data.isActive ? 'is-active' : ''}`}
      data-clickable
      data-testid={`participant-${data.id}`}
      data-active={data.isActive ? 'true' : 'false'}
      data-layer="rail"
      data-participant={data.id}
      role="button"
      tabIndex={0}
      aria-label={`${data.name} (${data.fullName})${data.isActive ? ' — active in current step' : ''}`}
      title={`Click to view ${data.fullName} profile`}
      style={{
        border: `1px solid ${data.isActive ? data.stroke : 'var(--border-color)'}`,
        borderTop: `3px solid ${data.stroke}`,
        boxShadow: data.isActive
          ? `0 0 14px ${data.stroke}55, var(--shadow-sm)`
          : 'var(--shadow-sm)',
        borderRadius: '8px',
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '160px',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          background: 'var(--bg-tertiary)',
          padding: '6px',
          borderRadius: '6px',
          marginBottom: '6px',
          border: '1px solid var(--border-color)',
        }}
      >
        {getParticipantIcon(data.id, data.stroke)}
      </div>
      <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>{data.name}</div>
      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '500' }}>{data.fullName}</div>

      {/* Handle for the lifeline edge stretching downwards */}
      <Handle type="source" position={Position.Bottom} id="lifeline-start" style={{ opacity: 0 }} />
    </div>
  );
});

export const LifelineAnchorNode: React.FC<{ 
  data: { 
    isActive: boolean; 
    isHighlighted: boolean; 
    color: string;
  } 
}> = React.memo(({ data }) => {
  return (
    <div
      className={`lifeline-anchor-node ${data.isHighlighted ? 'highlighted' : ''}`}
      data-layer="rail"
      data-anchor="message"
      data-highlighted={data.isHighlighted || undefined}
      style={{
        width: '10px',
        height: '36px',
        borderRadius: '4px',
        background: data.isHighlighted ? data.color : data.isActive ? 'rgba(99, 102, 241, 0.8)' : 'var(--border-color)',
        border: `1.5px solid ${data.isHighlighted ? '#ffffff' : data.isActive ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`,
        boxShadow: data.isHighlighted ? `0 0 14px ${data.color}, 0 0 4px ${data.color}` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: data.isActive ? 1 : 0.25,
      }}
    >
      {/* Handles for incoming/outgoing horizontal connections.
          Sized 8x8 (not 1x1) so screen readers and snap targets can
          hit-test the geometry, but kept visually transparent because
          the diagram is read-only — see Pillar 2 #1 of the audit. */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: 'transparent', border: 'none', width: '8px', height: '8px', opacity: 0.01 }}
        aria-label="Incoming connection target"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: 'transparent', border: 'none', width: '8px', height: '8px', opacity: 0.01 }}
        aria-label="Outgoing connection source"
      />
    </div>
  );
});

/**
 * LifelineBottomNode draws a small cap at the foot of an actor's vertical
 * rail. It gives the rail a visible terminus (a thin pill that matches the
 * participant's stroke color) and highlights when the actor is involved
 * in the current step. The rail itself is drawn as a React Flow edge from
 * the participant header to this node.
 */
export const LifelineBottomNode: React.FC<{
  data: { color: string; isActive: boolean };
}> = React.memo(({ data }) => {
  return (
    <div
      className={`lifeline-bottom-cap ${data.isActive ? 'is-active' : ''}`}
      data-layer="rail"
      data-anchor="lifeline-bottom"
      style={{
        width: '28px',
        height: '10px',
        borderRadius: '6px',
        background: data.isActive ? data.color : 'transparent',
        border: `1.5px solid ${data.color}`,
        boxShadow: data.isActive ? `0 0 10px ${data.color}80` : 'none',
        opacity: data.isActive ? 1 : 0.85,
        transition: 'background 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease',
        pointerEvents: 'none',
      }}
    />
  );
});

export const InternalStepNode: React.FC<{
  data: {
    num: string;
    label: string;
    isHighlighted: boolean;
    isActive: boolean;
    color: string;
    stroke: string;
    isError?: boolean;
    /**
     * Optional archetype tag surfaced via `data-archetype` on the DOM.
     * Defaults to 'internal' for backward compatibility. Used by the
     * research-lens tooling to scope selectors.
     */
    archetype?: 'internal' | 'cache' | 'risk' | 'lookup';
  }
}> = React.memo(({ data }) => {
  const getInternalIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('lookup') || l.includes('cache')) {
      return <Database size={13} style={{ color: data.isActive ? data.stroke : 'var(--text-muted)' }} aria-hidden="true" />;
    }
    if (l.includes('validate')) {
      return <Search size={13} style={{ color: data.isActive ? data.stroke : 'var(--text-muted)' }} aria-hidden="true" />;
    }
    if (l.includes('risk') || l.includes('decision')) {
      return <ShieldCheck size={13} style={{ color: data.isActive ? data.stroke : 'var(--text-muted)' }} aria-hidden="true" />;
    }
    return <RotateCw size={13} style={{ color: data.isActive ? data.stroke : 'var(--text-muted)' }} aria-hidden="true" />;
  };

  // Non-color state: error steps use a dashed border (not just a red hue)
  // so users with red/green color blindness can still distinguish them.
  // Width also bumps from 1.5px → 2.25px when highlighted (a second
  // non-color cue on top of the color change).
  const isHighlighted = data.isHighlighted;
  const isError = !!data.isError;
  const borderStyle = isError
    ? `1.5px dashed ${data.stroke}`
    : `${isHighlighted ? 2.25 : 1.5}px solid ${isHighlighted ? data.stroke : data.isActive ? 'var(--border-active)' : 'var(--border-color)'}`;

  return (
    <div
      className={`internal-step-node ${isHighlighted ? 'highlighted' : ''} ${isError ? 'error' : ''}`}
      data-testid={`internal-step-${data.num}`}
      data-step-state={isError ? 'error' : isHighlighted ? 'current' : data.isActive ? 'active' : 'inactive'}
      data-layer="step"
      data-archetype={data.archetype ?? 'internal'}
      // role="button" + tabIndex makes this node focusable by keyboard
      // navigation (Tab key). The aria-current="step" attribute exposes
      // the active step to screen readers in the same way the
      // <StepNumberRailNode> does, so the two are equivalent anchors.
      role="button"
      tabIndex={isHighlighted ? 0 : -1}
      aria-current={isHighlighted ? 'step' : undefined}
      aria-invalid={isError || undefined}
      aria-label={`Step ${data.num}: ${data.label}${isError ? ' (error path)' : ''}`}
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        background: 'var(--bg-secondary)',
        border: borderStyle,
        boxShadow: isHighlighted
          ? `0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 0 0 1px ${data.stroke}20`
          : 'var(--shadow-sm)',
        color: data.isActive ? 'var(--text-primary)' : 'var(--text-muted)',
        fontSize: '11px',
        width: '180px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        opacity: data.isActive ? 1 : 0.25,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          background: 'var(--bg-tertiary)',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-color)'
        }}
      >
        {getInternalIcon(data.label)}
      </div>
      <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
        <div style={{ fontWeight: '700', color: data.isActive ? data.stroke : 'var(--text-muted)', fontSize: '10px' }}>
          STEP {data.num}
        </div>
        <div style={{
          fontWeight: '500',
          color: data.isActive ? 'var(--text-primary)' : 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginTop: '1px'
        }}>
          {data.label}
        </div>
      </div>
    </div>
  );
});

export const DomainGroupNode: React.FC<{
  data: {
    title: string;
    subtitle: string;
    color: string;
    width: number;
    height: number;
  };
}> = React.memo(({ data }) => {
  return (
    <div
      style={{
        width: `${data.width}px`,
        height: `${data.height}px`,
        border: '1px solid rgba(148, 163, 184, 0.08)',
        background: 'transparent',
        borderRadius: '8px',
        pointerEvents: 'none',
        position: 'relative',
      }}
      data-layer="background"
      data-domain="group"
    >
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          left: '12px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '6px',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: '700',
            color: data.color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: 'var(--bg-secondary)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: `1px solid var(--border-color)`,
          }}
        >
          {data.title}
        </span>
        <span
          style={{
            fontSize: '8px',
            fontWeight: '500',
            color: 'var(--text-muted)',
          }}
        >
          {data.subtitle}
        </span>
      </div>
    </div>
  );
});

/**
 * StepGroupBandNode draws a colored horizontal band behind a group of
 * related steps. It groups multiple steps into a single conceptual phase
 * (e.g., "Step 3–4 — 3DS Method"), making the complex 3DS flow easier to read.
 *
 * The band uses a dotted background texture to remain recognizable even at
 * low opacity. The current phase is fully opaque and gains a colored glow,
 * while inactive phases sit at 0.7 opacity so the user can still read the
 * phase labels without losing the focus on the active one.
 */
export const StepGroupBandNode: React.FC<{
  data: {
    title: string;
    color: string;
    width: number;
    height: number;
    isCurrent: boolean;
    /** 1-based phase index (rendered on the right edge as a chip). */
    phaseIndex: number;
    /** Number of steps in this phase (for the chip footer). */
    stepCount: number;
    /**
     * If set, the badge is rendered on the band's title row showing the
     * earliest protocol version that this phase applies to. Phases with
     * introducedIn > activeVersion are filtered out at the store level
     * so this badge is mostly informational; we still show it because
     * it helps readers cross-reference the EMVCo spec.
     */
    introducedIn?: import('../types').ProtocolVersion;
    /**
     * Active protocol version (passed by the App for the version-diff
     * tier calculation). Optional — if absent, the badge is hidden.
     */
    activeVersion?: import('../types').ProtocolVersion;
  };
}> = React.memo(({ data }) => {
  // Version tier: same (default), introduced later (amber), or deprecated
  // (red, reserved for future use).
  const versionTier: 'same' | 'newer' | 'hidden' = !data.introducedIn
    ? 'same'
    : !data.activeVersion
    ? 'same'
    : data.introducedIn === data.activeVersion
    ? 'same'
    : 'newer';
  return (
    <div
      className={`step-group-band ${data.isCurrent ? 'is-current' : ''}`}
      data-layer="background"
      data-domain="phase-band"
      data-current={data.isCurrent || undefined}
      style={{
        width: `${data.width}px`,
        height: `${data.height}px`,
        background: `linear-gradient(90deg, ${data.color}${data.isCurrent ? '10' : '04'} 0%, ${data.color}${data.isCurrent ? '18' : '08'} 50%, ${data.color}${data.isCurrent ? '10' : '04'} 100%)`,
        borderLeft: `3px solid ${data.color}`,
        borderRight: `3px solid ${data.color}`,
        borderTop: `1px solid ${data.color}${data.isCurrent ? '50' : '20'}`,
        borderBottom: `1px solid ${data.color}${data.isCurrent ? '50' : '20'}`,
        borderRadius: '8px',
        pointerEvents: 'none',
        position: 'relative',
        opacity: data.isCurrent ? 1 : 0.45,
        boxShadow: data.isCurrent
          ? `0 0 16px -4px ${data.color}40`
          : 'none',
        transition: 'opacity 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '4px',
          left: '10px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '9.5px',
          fontWeight: 800,
          color: data.color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          background: 'var(--bg-secondary)',
          padding: '2px 8px',
          borderRadius: '4px',
          border: `1px solid ${data.color}${data.isCurrent ? '80' : '40'}`,
          boxShadow: data.isCurrent
            ? `0 4px 10px -2px ${data.color}40`
            : '0 2px 4px rgba(0,0,0,0.12)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            minWidth: '14px',
            padding: '0 3px',
            background: data.color,
            color: '#08141d',
            fontSize: '8.5px',
            fontWeight: 900,
            borderRadius: '3px',
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}
        >
          P{data.phaseIndex.toString().padStart(2, '0')}
        </span>
        {data.title}
        {data.introducedIn && (
          <span
            title={`Introduced in EMV 3DS v${data.introducedIn}`}
            style={{
              fontSize: '8.5px',
              fontWeight: 700,
              color: versionTier === 'newer' ? '#fb923c' : 'var(--text-muted)',
              background: versionTier === 'newer' ? 'rgba(251, 146, 60, 0.10)' : 'var(--bg-tertiary)',
              padding: '0 4px',
              borderRadius: '3px',
              border: `1px solid ${versionTier === 'newer' ? 'rgba(251, 146, 60, 0.35)' : 'var(--border-color)'}`,
              marginLeft: '2px',
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            }}
            aria-label={`Introduced in protocol version ${data.introducedIn}`}
          >
            ≥ v{data.introducedIn}
          </span>
        )}
        <span
          style={{
            fontSize: '8.5px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            background: 'var(--bg-tertiary)',
            padding: '0 4px',
            borderRadius: '3px',
            border: '1px solid var(--border-color)',
            marginLeft: '2px',
          }}
        >
          {data.stepCount} step{data.stepCount === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
});

export const BranchFrameNode: React.FC<{
  data: {
    width: number;
    height: number;
    color: string;
    kind: 'alt' | 'opt' | 'loop' | 'async' | 'par';
    title: string;
    detail: string;
  };
}> = React.memo(({ data }) => {
  return (
    <div
      className="branch-frame-node"
      data-layer="background"
      data-branch-kind={data.kind}
      style={{
        width: `${data.width}px`,
        height: `${data.height}px`,
        borderRadius: '12px',
        border: `1.5px dashed ${data.color}55`,
        background: `linear-gradient(180deg, ${data.color}10 0%, ${data.color}04 100%)`,
        boxShadow: `inset 0 0 0 1px ${data.color}18`,
        position: 'relative',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '14px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 8px',
          borderRadius: '999px',
          background: 'var(--bg-secondary)',
          border: `1px solid ${data.color}45`,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span
          style={{
            fontSize: '8.5px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: data.color,
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          }}
        >
          {data.kind}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)' }}>{data.title}</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '14px',
          right: '14px',
          fontSize: '10px',
          lineHeight: 1.45,
          color: 'var(--text-muted)',
          maxWidth: '300px',
        }}
      >
        {data.detail}
      </div>
    </div>
  );
});

/**
 * StepNumberRailNode renders a small numbered chip on the left margin of
 * the diagram, aligned to a specific step's Y coordinate. Because it lives
 * inside the React Flow viewport, the chip pans and zooms in lock-step
 * with the step it labels. The chip lights up when the step is the
 * currently focused one and shows a soft trail effect for executed steps.
 */
export const StepNumberRailNode: React.FC<{
  data: {
    num: string;
    label: string;
    isActive: boolean;
    isCurrent: boolean;
    color: string;
  };
}> = React.memo(({ data }) => {
  const ring = data.isCurrent
    ? `0 0 0 2px ${data.color}, 0 4px 12px -2px ${data.color}80`
    : data.isActive
      ? `0 0 0 1px ${data.color}40`
      : 'none';
  return (
    <div
      className={`step-number-rail ${data.isCurrent ? 'is-current' : ''} ${
        data.isActive ? 'is-active' : 'is-inactive'
      }`}
      data-testid={`rail-${data.num}`}
      data-step-state={data.isCurrent ? 'current' : data.isActive ? 'active' : 'inactive'}
      data-layer="rail"
      role={data.isCurrent ? 'button' : undefined}
      tabIndex={data.isCurrent ? 0 : -1}
      aria-current={data.isCurrent ? 'step' : undefined}
      aria-label={data.isCurrent ? `Step ${data.num}: ${data.label} (current)` : undefined}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '1px',
        padding: '3px 6px 3px 4px',
        borderRadius: '6px',
        background: data.isCurrent
          ? `linear-gradient(90deg, ${data.color}24, ${data.color}08)`
          : data.isActive
            ? 'var(--bg-tertiary)'
            : 'transparent',
        border: data.isCurrent
          ? `1px solid ${data.color}80`
          : '1px solid transparent',
        boxShadow: ring,
        pointerEvents: 'none',
        transition: 'all 0.2s ease',
        opacity: data.isActive ? 1 : 0.4,
        minWidth: '76px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          fontWeight: 800,
          color: data.isCurrent ? data.color : data.isActive ? 'var(--text-primary)' : 'var(--text-muted)',
          letterSpacing: '0.02em',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: data.isCurrent ? data.color : data.isActive ? `${data.color}99` : 'var(--text-muted)',
            boxShadow: data.isCurrent ? `0 0 6px ${data.color}` : 'none',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        {data.num}
      </div>
      <div
        style={{
          fontSize: '8.5px',
          fontWeight: 600,
          color: data.isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
          maxWidth: '72px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'right',
          lineHeight: 1.1,
        }}
        title={data.label}
      >
        {data.label}
      </div>
    </div>
  );
});

/**
 * SwimlaneColumnNode draws a full-height background rectangle aligned with a
 * participant's vertical lane. It lives inside the React Flow viewport so it
 * pans and zooms in lock-step with the participant header — keeping the
 * vertical guide rails anchored to the actor column at all times.
 *
 * Visually it renders as a soft tint with two thin vertical guide lines at
 * the left and right edges. When the participant is involved in the current
 * step, the column brightens.
 */
/**
 * SwimlaneColumnNode draws a full-height background rectangle aligned with a
 * participant's vertical lane. It lives inside the React Flow viewport so it
 * pans and zooms in lock-step with the participant header — keeping the
 * vertical guide rails anchored to the actor column at all times.
 *
 * The column is wider than the participant header (220px) and is positioned
 * so its center coincides with the participant's X coordinate. It draws:
 *   • a soft vertical tint that brightens when the actor is involved in the
 *     current step (so the user can immediately see *who* is talking)
 *   • two thin vertical guide lines at the column edges (dashed, low alpha)
 *   • a translucent "actor pill" at the top that doubles as a phase label
 *     carrier when the current step belongs to this participant.
 */
export const SwimlaneColumnNode: React.FC<{
  data: {
    stroke: string;
    bg: string;
    isActive: boolean;
    width: number;
    height: number;
    /** Display label rendered on the top-edge pill. */
    label: string;
    /** Full role name shown beneath the label. */
    fullName: string;
  };
}> = React.memo(({ data }) => {
  return (
    <div
      className={`swimlane-column-node ${data.isActive ? 'is-active' : ''}`}
      data-layer="background"
      data-domain="swimlane"
      data-active={data.isActive || undefined}
      style={{
        width: `${data.width}px`,
        height: `${data.height}px`,
        background: data.isActive ? `linear-gradient(180deg, ${data.stroke}12 0%, ${data.stroke}03 50%, transparent 100%)` : 'transparent',
        pointerEvents: 'none',
        transition: 'background 0.25s ease',
        position: 'relative',
      }}
    >
      {/* Tiny phase anchor badge at the top of the column. The label
          reads the participant short name; the full name appears on hover
          via the native title attribute. When the lane is active, the
          badge becomes a filled pill matching the participant stroke
          color so the user can lock onto it visually. */}
      <div
        className="swimlane-column-anchor"
        title={data.fullName}
        style={{
          position: 'absolute',
          top: '-18px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 7px',
          fontSize: '8.5px',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          borderRadius: '6px',
          background: data.isActive ? data.stroke : 'var(--bg-secondary)',
          color: data.isActive ? '#080d16' : data.stroke,
          border: `1px solid ${data.stroke}${data.isActive ? '' : '35'}`,
          whiteSpace: 'nowrap',
          boxShadow: data.isActive
            ? `0 4px 10px -2px ${data.stroke}44`
            : 'none',
          transition: 'all 0.2s ease',
          opacity: data.isActive ? 1 : 0.6,
        }}
      >
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: data.isActive ? '#080d16' : data.stroke,
            boxShadow: data.isActive ? 'none' : `0 0 4px ${data.stroke}`,
          }}
        />
        {data.label}
      </div>
    </div>
  );
});
