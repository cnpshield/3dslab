import { createExternalStore } from './createStore';
import type { CanvasOrientation, ProtocolVersion, VisualizationMode } from '../types';

export type Theme = 'dark' | 'light' | 'security';
export type DetailsKind = 'step' | 'glossary' | 'participant' | 'group' | 'domain';

/**
 * Ordered list used by `cycleTheme` to advance through variants.
 * Default is light. Green security theme removed.
 */
export const THEME_ORDER: readonly Theme[] = ['light', 'dark'] as const;

export interface DetailsContext {
  kind: DetailsKind;
  stepId?: string;
  participantId?: string;
  groupId?: string;
  domainId?: string;
  glossaryTerm?: string;
}

export interface UIState {
  theme: Theme;
  visualizationMode: VisualizationMode;
  canvasOrientation: CanvasOrientation;
  readingMode: boolean;
  focusPhase: boolean;
  compareVersion: ProtocolVersion | null;
  isLeftCollapsed: boolean;
  isRightCollapsed: boolean;
  isTopBarCollapsed: boolean;
  isScenarioToolbarCollapsed: boolean;
  securityLensEnabled: boolean;
  shareCopied: boolean;
  detailsContext: DetailsContext;
  hasLoadedSharedState: boolean;
  showListView: boolean;
  isShortcutsOpen: boolean;
}

const initial: UIState = {
  theme: 'light',
  visualizationMode: 'sequence',
  canvasOrientation: 'vertical',
  readingMode: false,
  focusPhase: false,
  compareVersion: '2.1.0',
  isLeftCollapsed: false,
  isRightCollapsed: false,
  isTopBarCollapsed: true, // Hidden by default for minimal distraction-free canvas
  isScenarioToolbarCollapsed: true,
  securityLensEnabled: false,
  shareCopied: false,
  detailsContext: { kind: 'step', stepId: 'step_0A' },
  hasLoadedSharedState: false,
  showListView: false,
  isShortcutsOpen: false,
};

export const uiStore = createExternalStore<UIState>(initial);

export const uiActions = {
  setTheme: (theme: Theme) => uiStore.setState({ theme }),
  setVisualizationMode: (visualizationMode: VisualizationMode) => uiStore.setState({ visualizationMode }),
  setCanvasOrientation: (canvasOrientation: CanvasOrientation) => uiStore.setState({ canvasOrientation }),
  setReadingMode: (readingMode: boolean) => uiStore.setState({ readingMode }),
  toggleReadingMode: () => uiStore.setState((s) => ({ readingMode: !s.readingMode })),
  setFocusPhase: (focusPhase: boolean) => uiStore.setState({ focusPhase }),
  toggleFocusPhase: () => uiStore.setState((s) => ({ focusPhase: !s.focusPhase })),
  toggleCanvasOrientation: () =>
    uiStore.setState((s) => ({
      canvasOrientation: s.canvasOrientation === 'vertical' ? 'horizontal' : 'vertical',
    })),
  setShortcutsOpen: (isShortcutsOpen: boolean) => uiStore.setState({ isShortcutsOpen }),
  toggleShortcuts: () => uiStore.setState((s) => ({ isShortcutsOpen: !s.isShortcutsOpen })),
  setCompareVersion: (compareVersion: ProtocolVersion | null) => uiStore.setState({ compareVersion }),
  cycleTheme: () =>
    uiStore.setState((s) => {
      const idx = THEME_ORDER.indexOf(s.theme as 'light' | 'dark');
      const next = THEME_ORDER[(idx === -1 ? 0 : idx + 1) % THEME_ORDER.length];
      return { theme: next };
    }),
  toggleTheme: () =>
    uiStore.setState((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setLeftCollapsed: (v: boolean) => uiStore.setState({ isLeftCollapsed: v }),
  setRightCollapsed: (v: boolean) => uiStore.setState({ isRightCollapsed: v }),
  setTopBarCollapsed: (v: boolean) => uiStore.setState({ isTopBarCollapsed: v }),
  toggleTopBar: () => uiStore.setState((s) => ({ isTopBarCollapsed: !s.isTopBarCollapsed })),
  setScenarioToolbarCollapsed: (v: boolean) => uiStore.setState({ isScenarioToolbarCollapsed: v }),
  toggleScenarioToolbar: () =>
    uiStore.setState((s) => ({ isScenarioToolbarCollapsed: !s.isScenarioToolbarCollapsed })),
  setSecurityLens: (v: boolean) => uiStore.setState({ securityLensEnabled: v }),
  toggleSecurityLens: () => uiStore.setState((s) => ({ securityLensEnabled: !s.securityLensEnabled })),
  setDetailsContext: (ctx: DetailsContext) => uiStore.setState({ detailsContext: ctx, isRightCollapsed: false }),
  setHasLoadedSharedState: (v: boolean) => uiStore.setState({ hasLoadedSharedState: v }),
  setShareCopied: (v: boolean) => uiStore.setState({ shareCopied: v }),
  toggleListView: () => uiStore.setState((s) => ({ showListView: !s.showListView })),
  /** Hydrate a subset of UI state from a shared URL. Always sanitize green security theme to light. */
  hydrate: (partial: Partial<UIState>) => {
    const cleanTheme = (partial.theme === 'security' || !partial.theme) ? 'light' : partial.theme;
    uiStore.setState((s) => ({ ...s, ...partial, theme: cleanTheme, hasLoadedSharedState: true }));
  },
};
