import React, { useEffect } from 'react';
import { X, Play, Eye, Compass, HelpCircle } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  items: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Playback & Simulation',
    icon: Play,
    items: [
      { keys: ['Space'], description: 'Play / Pause simulation (restarts at end)' },
      { keys: ['→'], description: 'Next step (pauses autoplay)' },
      { keys: ['←'], description: 'Previous step (pauses autoplay)' },
      { keys: ['R', 'Home'], description: 'Reset to first step' },
      { keys: ['End'], description: 'Jump to final step' },
      { keys: ['<', '>'], description: 'Decrease / increase playback delay' },
    ],
  },
  {
    title: 'View & Navigation Modes',
    icon: Eye,
    items: [
      { keys: ['M'], description: 'Toggle Reader Mode (step narrative deck)' },
      { keys: ['F'], description: 'Toggle Phase Focus (isolate current phase)' },
      { keys: ['H'], description: 'Toggle Layout (Vertical UML ↕ / Horizontal ↔)' },
      { keys: [']', 'Shift + →'], description: 'Jump to next protocol phase' },
      { keys: ['[', 'Shift + ←'], description: 'Jump to previous protocol phase' },
      { keys: ['Esc'], description: 'Exit Reader/Focus mode or close dialog' },
    ],
  },
  {
    title: 'Scenario Presets & Help',
    icon: Compass,
    items: [
      { keys: ['1 – 8'], description: 'Instant switch between 8 scenario presets' },
      { keys: ['?'], description: 'Open / close this keyboard shortcuts guide' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="shortcuts-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        className="shortcuts-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '640px',
          maxWidth: '100%',
          maxHeight: '90vh',
          background: 'var(--bg-primary, #0f172a)',
          color: 'var(--text-primary, #f8fafc)',
          border: '1px solid var(--border-active, rgba(59, 130, 246, 0.4))',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5), 0 0 24px rgba(37, 99, 235, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary, #1e293b)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary, #3b82f6)',
              }}
            >
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 id="shortcuts-modal-title" style={{ margin: 0, fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Keyboard Shortcuts Reference
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                Quick controls for protocol research, simulation & inspection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Simulation Banner */}
        <div
          style={{
            padding: '10px 22px',
            background: 'rgba(37, 99, 235, 0.08)',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11.5px',
            color: 'var(--text-secondary, #cbd5e1)',
          }}
        >
          <Play size={13} style={{ color: 'var(--accent-primary, #3b82f6)', flexShrink: 0 }} />
          <span>
            Tip: Press <kbd style={kbdStyle}>Space</kbd> anytime to simulate through the active 3DS message sequence step-by-step.
          </span>
        </div>

        {/* Shortcut Groups Body */}
        <div
          style={{
            padding: '16px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {SHORTCUT_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.title}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--accent-primary, #3b82f6)',
                    marginBottom: '8px',
                  }}
                >
                  <GroupIcon size={12} />
                  <span>{group.title}</span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '6px 16px',
                    background: 'var(--bg-secondary, #1e293b)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                  }}
                >
                  {group.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '4px 0',
                      }}
                    >
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary, #cbd5e1)' }}>
                        {item.description}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        {item.keys.map((k, ki) => (
                          <React.Fragment key={ki}>
                            <kbd style={kbdStyle}>{k}</kbd>
                            {ki < item.keys.length - 1 && (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>/</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 22px',
            background: 'var(--bg-secondary, #1e293b)',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted, #94a3b8)',
          }}
        >
          <span>Press <kbd style={kbdStyle}>Esc</kbd> to close</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '5px 14px',
              borderRadius: '8px',
              background: 'var(--accent-primary, #3b82f6)',
              color: '#ffffff',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

const kbdStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2px 7px',
  fontSize: '10.5px',
  fontWeight: 700,
  fontFamily: 'ui-monospace, monospace',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'var(--text-primary, #ffffff)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '5px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  lineHeight: 1.4,
};
