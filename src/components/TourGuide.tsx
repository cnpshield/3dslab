import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Layers,
  Sliders,
  FileCode,
  Shield
} from 'lucide-react';

export interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '.canvas-flow-shell',
    title: 'Interactive Protocol Canvas',
    description: 'Visualizes the complete EMV® 3-D Secure 2.x authentication flow across all 6 lifelines. Every arrow represents a real protocol message or browser interaction with animated message packet flows.',
    badge: '1 of 5',
    icon: Compass,
  },
  {
    targetSelector: '.canvas-participant-bar',
    title: 'Participant Lifelines & Roles',
    description: 'Track the 6 protocol participants (CH, BR, 3DS Requestor, 3DS Server, Directory Server, ACS). Real-time "OUT" and "IN" badges highlight the sender and receiver. Click any participant to open their authoritative responsibilities and trust boundaries.',
    badge: '2 of 5',
    icon: Layers,
  },
  {
    targetSelector: '.sidebar',
    title: 'Playback Deck & Timeline Controls',
    description: 'Step through messages using the media controls, auto-play with cycle speed (0.8s to 4.0s), or scrub directly to any step. Switch to the "Parameters" tab to configure protocol version (2.1.0, 2.2.0, 2.3.1), challenge preferences, and device channels.',
    badge: '3 of 5',
    icon: Sliders,
  },
  {
    targetSelector: '.details-sidebar',
    title: 'Deep Protocol Inspector & Security Lens',
    description: 'Explore normative EMVCo specification references, synthetic payloads with cURL export and live JWS validation. Switch to the "Research Lens" tab to analyze security invariants, attack vectors, and false positive guards.',
    badge: '4 of 5',
    icon: FileCode,
  },
  {
    targetSelector: '.scenario-toolbar',
    title: 'Scenario Catalog & Phase Filtering',
    description: 'Switch between 8 pre-configured production scenarios (Frictionless, HTML Challenge, OOB App Challenge, Method Timeout, Fallback, Decoupled). Use the "Phases" button on the canvas to isolate specific protocol phases.',
    badge: '5 of 5',
    icon: Shield,
  },
];

interface TourGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TourGuide: React.FC<TourGuideProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Update target rect when step changes or window resizes
  const updateTargetRect = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;
    updateTargetRect();
    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, currentStepIndex, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex(currentStepIndex - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, onClose]);

  if (!isOpen || !step) return null;

  const IconComponent = step.icon;

  return (
    <>
      {/* Target Spotlight Outline (Blue accent, zero blur, non-blocking) */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: Math.max(0, targetRect.top - 4),
            left: Math.max(0, targetRect.left - 4),
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            borderRadius: '10px',
            border: '2px solid var(--accent-primary, #2563eb)',
            boxShadow: '0 0 20px rgba(37, 99, 235, 0.4), inset 0 0 10px rgba(37, 99, 235, 0.1)',
            pointerEvents: 'none',
            zIndex: 9998,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}

      {/* Floating Tour Guide Card (Theme-adaptive, docked cleanly bottom-right, zero blur on UI) */}
      <div
        className="tour-card"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--bg-tertiary, #ffffff)',
          border: '1px solid var(--border-active, rgba(37, 99, 235, 0.35))',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-lg, 0 16px 36px rgba(15, 23, 42, 0.14))',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'rgba(37, 99, 235, 0.10)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary, #2563eb)',
            }}>
              <IconComponent size={16} />
            </div>
            <div>
              <div style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--accent-primary, #2563eb)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Guided Tour • Step {step.badge}
              </div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close Tour (Esc)"
            aria-label="Close tour"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}>
          {step.description}
        </p>

        {/* Navigation row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-color)',
        }}>
          {/* Progress indicator */}
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStepIndex(i)}
                style={{
                  width: i === currentStepIndex ? '16px' : '6px',
                  height: '5px',
                  borderRadius: '3px',
                  background: i === currentStepIndex ? 'var(--accent-primary, #2563eb)' : 'var(--border-color)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title={`Jump to step ${i + 1}`}
                aria-label={`Jump to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '5px 8px',
              }}
            >
              Skip
            </button>
            {currentStepIndex > 0 && (
              <button
                onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '5px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={11} /> Back
              </button>
            )}
            <button
              onClick={() => {
                if (currentStepIndex < TOUR_STEPS.length - 1) {
                  setCurrentStepIndex(currentStepIndex + 1);
                } else {
                  onClose();
                }
              }}
              style={{
                background: 'var(--accent-primary, #2563eb)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '5px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            >
              {currentStepIndex < TOUR_STEPS.length - 1 ? (
                <>Next <ArrowRight size={11} /></>
              ) : (
                <><CheckCircle2 size={11} /> Finish</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
