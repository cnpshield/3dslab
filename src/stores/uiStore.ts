import { createExternalStore } from './createStore';
import type { ProtocolVersion, VisualizationMode } from '../types';

export type Theme = 'dark' | 'light' | 'security';
export type DetailsKind = 'step' | 'glossary' | 'participant' | 'group' | 'domain';

/**
 * Ordered list used by `cycleTheme` to advance through the three
 * visual variants. The order is meaningful: dark → light → security
 * loops back to dark. Researchers who enable the security theme
 * typically want the highest-contrast green-on-black SOC look for
 * inspecting cryptographic payloads, so it is intentionally placed
 * last in the cycle (and not the default) to avoid surprising
 * first-time users.
 */
export const THEME_ORDER: readonly Theme[] = ['dark', 'light', 'security'] as const;

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
  compareVersion: ProtocolVersion | null;
  isLeftCollapsed: boolean;
  isRightCollapsed: boolean;
  isScenarioToolbarCollapsed: boolean;
  securityLensEnabled: boolean;
  shareCopied: boolean;
  detailsContext: DetailsContext;
  hasLoadedSharedState: boolean;
  showListView: boolean;
}

const initial: UIState = {
  theme: 'dark',
  visualizationMode: 'sequence',
  compareVersion: '2.1.0',
  // Panels are open by default so first-time users can see the
  // walkthrough controls and details pane without having to discover
  // the toggle buttons. Users can still collapse them via the
  // panel-toggle buttons or the chevron handle on each side rail.
  isLeftCollapsed: false,
  isRightCollapsed: false,
  isScenarioToolbarCollapsed: false,
  securityLensEnabled: false,
  shareCopied: false,
  detailsContext: { kind: 'step', stepId: 'step_0A' },
  hasLoadedSharedState: false,
  showListView: false,
};

export const uiStore = createExternalStore<UIState>(initial);

export const uiActions = {
  setTheme: (theme: Theme) => uiStore.setState({ theme }),
  setVisualizationMode: (visualizationMode: VisualizationMode) => uiStore.setState({ visualizationMode }),
  setCompareVersion: (compareVersion: ProtocolVersion | null) => uiStore.setState({ compareVersion }),
  /**
   * Advance to the next theme in `THEME_ORDER`. Used by the header
   * theme-toggle button so a single click walks through all three
   * variants without taking up extra header real estate.
   */
  cycleTheme: () =>
    uiStore.setState((s) => {
      const idx = THEME_ORDER.indexOf(s.theme);
      const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
      return { theme: next };
    }),
  /**
   * Backwards-compatible binary toggle: dark ↔ light. Existing share
   * links and a11y shortcuts that call `toggleTheme` keep working
   * without dropping the user out of the security theme unexpectedly.
   */
  toggleTheme: () =>
    uiStore.setState((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setLeftCollapsed: (v: boolean) => uiStore.setState({ isLeftCollapsed: v }),
  setRightCollapsed: (v: boolean) => uiStore.setState({ isRightCollapsed: v }),
  setScenarioToolbarCollapsed: (v: boolean) => uiStore.setState({ isScenarioToolbarCollapsed: v }),
  toggleScenarioToolbar: () =>
    uiStore.setState((s) => ({ isScenarioToolbarCollapsed: !s.isScenarioToolbarCollapsed })),
  setSecurityLens: (v: boolean) => uiStore.setState({ securityLensEnabled: v }),
  toggleSecurityLens: () => uiStore.setState((s) => ({ securityLensEnabled: !s.securityLensEnabled })),
  setDetailsContext: (ctx: DetailsContext) => uiStore.setState({ detailsContext: ctx, isRightCollapsed: false }),
  setHasLoadedSharedState: (v: boolean) => uiStore.setState({ hasLoadedSharedState: v }),
  setShareCopied: (v: boolean) => uiStore.setState({ shareCopied: v }),
  toggleListView: () => uiStore.setState((s) => ({ showListView: !s.showListView })),
  /** Hydrate a subset of UI state from a shared URL. */
  hydrate: (partial: Partial<UIState>) =>
    uiStore.setState((s) => ({ ...s, ...partial, hasLoadedSharedState: true })),
};
