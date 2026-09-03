import React, { useMemo } from 'react';
import { getStraightPath, EdgeLabelRenderer, useStore as useReactFlowStore } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { ArrowRight, ArrowLeft, ArrowDown, ArrowUp } from 'lucide-react';
import type { StepGroupId } from '../types';

interface CustomEdgeData {
  color: string;
  isCurrent: boolean;
  isError?: boolean;
  /** True when this edge's step is the user's selected step. Triggers
   *  a thicker stroke + glow + aria-current="true" on the label. */
  isSelected?: boolean;
  /** Pixel offset to apply to the edge label, used to stagger labels
   *  for parallel edges (same source/target pair). */
  yOffset?: number;
  xOffset?: number;
  stepNum: string;
  stepGroupId?: StepGroupId;
  isCurrentGroup?: boolean;
  focusPhase?: boolean;
  orientation?: 'vertical' | 'horizontal';
  msgType?: string;
  fieldsPreview?: string[];
}

// Subscribe to the viewport zoom. This selector returns a number, so
// React.memo on the parent edge only invalidates when the actual zoom
// value changes (Object.is), not on every viewport re-render.
const useZoom = () => useReactFlowStore((s) => s.transform[2]);

/**
 * Custom message edge between two lifelines. Wrapped in React.memo so
 * panning/zooming the viewport (which fires 60+ times/sec) does not
 * re-render the ~90 message edges that are off-screen or unchanged.
 */
const CustomMessageEdgeInner: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  style = {},
  markerEnd,
  data,
}) => {
  const zoom = useZoom();

  const [edgePath, labelX, labelY] = useMemo(
    () => getStraightPath({ sourceX, sourceY, targetX, targetY }),
    [sourceX, sourceY, targetX, targetY]
  );

  const edgeData = data as unknown as CustomEdgeData | undefined;
  const isCurrent = !!edgeData?.isCurrent;
  const isError = !!edgeData?.isError;
  const isSelected = !!edgeData?.isSelected;
  const yOffset = edgeData?.yOffset ?? 0;
  const xOffset = edgeData?.xOffset ?? 0;
  const strokeColor = edgeData?.color || 'var(--accent-primary)';
  const isDimmed = !!(edgeData?.focusPhase && !edgeData?.isCurrentGroup);

  // Combined visual cue: selected > current > error > default.
  const edgeStrokeWidth = isSelected ? 3.5 : isCurrent ? 2.5 : 1.5;
  const edgeFilter = isDimmed
    ? undefined
    : isSelected
    ? `drop-shadow(0 0 8px ${strokeColor})`
    : isCurrent
      ? `drop-shadow(0 0 6px ${strokeColor}66)`
      : undefined;

  // Detect whether edge is mostly vertical or horizontal
  const isVerticalEdge = Math.abs(targetY - sourceY) > Math.abs(targetX - sourceX);
  const flowsForward = isVerticalEdge ? targetY >= sourceY : targetX >= sourceX;
  const DirectionIcon = isVerticalEdge
    ? (flowsForward ? ArrowDown : ArrowUp)
    : (flowsForward ? ArrowRight : ArrowLeft);

  // Travel distance along the primary axis of message flow
  const travelDistance = isVerticalEdge ? targetY - sourceY : targetX - sourceX;
  const travelDuration = useMemo(
    () => Math.min(2.6, Math.max(1.4, Math.abs(travelDistance) / 280)),
    [travelDistance]
  );
  const scaledTravelPx = travelDistance * zoom;

  const packetLabel =
    edgeData?.msgType || (typeof label === 'string' ? label.split(' ')[0] : '') || 'DATA';
  const packetField = edgeData?.fieldsPreview && edgeData.fieldsPreview[0];

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path ${isCurrent ? 'active-message-edge' : ''} ${isError ? 'error-message-edge' : ''} ${isSelected ? 'selected-message-edge' : ''}`}
        d={edgePath}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: edgeStrokeWidth,
          opacity: isDimmed ? 0.1 : (isCurrent ? 1 : isSelected ? 0.95 : 0.75),
          filter: edgeFilter,
          transition: 'stroke 0.3s, stroke-width 0.3s, opacity 0.3s, filter 0.3s',
        }}
        markerEnd={markerEnd}
        data-step-state={isCurrent ? 'current' : isError ? 'error' : isSelected ? 'selected' : 'default'}
        data-step-group={edgeData?.stepGroupId}
        data-step-group-current={edgeData?.stepGroupId ? (edgeData?.isCurrentGroup ? 'true' : 'false') : undefined}
        data-selected={isSelected || undefined}
        aria-current={isSelected ? 'true' : undefined}
        data-testid={`edge-${id}`}
      />

      {isCurrent && (
        <EdgeLabelRenderer>
          <div
            className="data-packet"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translate(${sourceX * zoom}px, ${sourceY * zoom}px) scale(${zoom})`,
              transformOrigin: '0 0',
              pointerEvents: 'none',
              zIndex: 1001,
            }}
            aria-hidden="true"
          >
            <div
              className={`data-packet-chip ${isVerticalEdge ? 'is-vertical' : ''}`}
              style={{
                '--travel-distance': `${scaledTravelPx}px`,
                '--travel-duration': `${travelDuration}s`,
                '--packet-color': strokeColor,
              } as React.CSSProperties}
              title={packetField ? `${packetLabel}: ${packetField}` : packetLabel}
            >
              <span className="data-packet-dot" />
              <span className="data-packet-type">{packetLabel}</span>
              {packetField && (
                <span className="data-packet-field">· {packetField}</span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              // Edge-label staggering: yOffset / xOffset shifts the label
              // for parallel edges (same source/target pair) so they don't overlap.
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX + xOffset}px,${labelY + yOffset}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            className="nodrag nopan"
          >
            <div
              className={`react-flow__edge-label-box ${isCurrent ? 'current' : ''} ${isError ? 'error' : ''} ${isSelected ? 'selected' : ''}`}
              aria-current={isSelected ? 'true' : undefined}
              data-step-group={edgeData?.stepGroupId}
              data-step-group-current={edgeData?.stepGroupId ? (edgeData?.isCurrentGroup ? 'true' : 'false') : undefined}
              data-selected={isSelected || undefined}
              style={{
                background: isCurrent ? 'var(--bg-tertiary)' : isSelected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                border: isError
                  ? `1.5px dashed ${strokeColor}`
                  : isSelected
                    ? `2.5px solid ${strokeColor}`
                    : `1.5px solid ${isCurrent ? strokeColor : 'rgba(148, 163, 184, 0.25)'}`,
                color: isCurrent || isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '700',
                opacity: isDimmed ? 0.12 : 1,
                boxShadow: isSelected
                  ? `0 0 20px ${strokeColor}55, 0 6px 20px rgba(0,0,0,0.4)`
                  : isCurrent
                    ? `0 0 16px ${strokeColor}40, 0 4px 14px rgba(0,0,0,0.35)`
                    : '0 2px 8px rgba(0,0,0,0.25)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              role="button"
              tabIndex={isSelected ? 0 : -1}
              aria-label={`Message ${edgeData?.msgType || ''} ${typeof label === 'string' ? label : ''} ${flowsForward ? (isVerticalEdge ? 'flowing down' : 'flowing right') : (isVerticalEdge ? 'flowing up' : 'flowing left')}${isSelected ? ' (selected)' : ''}`}
              data-testid={`edge-label-${id}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {edgeData?.msgType && (
                  <span style={{
                    background: `${strokeColor}22`,
                    color: strokeColor,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '9.5px',
                    fontWeight: '800',
                    border: `1px solid ${strokeColor}40`,
                    letterSpacing: '0.04em'
                  }}>
                    {edgeData.msgType}
                  </span>
                )}
                <span style={{ color: 'var(--text-primary)', letterSpacing: '0.01em' }}>{label}</span>
                <DirectionIcon
                  size={13}
                  strokeWidth={2.6}
                  style={{
                    color: isCurrent ? strokeColor : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                  aria-label={flowsForward ? (isVerticalEdge ? 'flows down' : 'flows right') : (isVerticalEdge ? 'flows up' : 'flows left')}
                />
              </div>

              {edgeData?.fieldsPreview && edgeData.fieldsPreview.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '3px',
                  justifyContent: 'center',
                  marginTop: '3px',
                  borderTop: '1px dashed var(--border-color)',
                  paddingTop: '3.5px',
                  width: '100%'
                }}>
                  {edgeData.fieldsPreview.map((f: string, i: number) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '8px',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-primary)',
                        padding: '1px 3px',
                        borderRadius: '2px',
                        border: '1px solid var(--border-color)',
                        fontFamily: 'JetBrains Mono',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export const CustomMessageEdge = React.memo(CustomMessageEdgeInner);
CustomMessageEdge.displayName = 'CustomMessageEdge';
