import { browser } from 'wxt/browser';
import { createGlassPane } from './glass-pane';
import type { PaneLabels } from './highlight';
import { type PickerDeps, runPicker } from './picker';
import { claimPicker } from './singleton';

// The picker's production wiring (REQ-PICK-001): browser.i18n strings (no translator, to keep the
// bundle small) and the real glass pane. Each injection toggles: a running picker is cancelled.

/** The pane's texts from browser.i18n. */
export function paneLabels(): PaneLabels {
  const { i18n } = browser;
  return {
    frameNote: i18n.getMessage('pickerFrameNote'),
    componentNote: i18n.getMessage('pickerComponentNote'),
    paneName: i18n.getMessage('pickerPaneName'),
    hint: i18n.getMessage('pickerHint'),
    size: (width, height) => i18n.getMessage('pickerSize', [String(width), String(height)]),
  };
}

export type PickerPorts = Pick<PickerDeps, 'onSelect'>;

/** Starts the picker, or cancels the one that is running. */
export function startPicking(ports: PickerPorts): void {
  let cancel: () => void = () => {
    // Replaced once the session exists.
  };
  const release = claimPicker(() => cancel());
  if (!release) return;
  const labels = paneLabels();
  const session = runPicker({
    createPane: (hooks) => createGlassPane(hooks, labels),
    onSelect: ports.onSelect,
    onEnd: release,
  });
  cancel = () => session.dispatch({ type: 'cancel' });
}
