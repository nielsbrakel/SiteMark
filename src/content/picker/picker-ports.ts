import { createGlassPane } from './glass-pane';
import { openPanel } from './open-panel';
import { runPicker } from './picker';
import { paneLabels } from './picker-labels';
import { claimPicker } from './singleton';

// The picker's production wiring (REQ-PICK-001): the real glass pane, then the mini panel talking
// to the background. Each injection toggles: a running picker is cancelled instead.

/** Starts the picker, or cancels the one that is running. */
export function startPicking(): void {
  let cancel: () => void = () => {
    // Replaced once the session exists.
  };
  const release = claimPicker(() => cancel());
  if (!release) return;
  const labels = paneLabels();
  const session = runPicker({
    createPane: (hooks) => createGlassPane(hooks, labels),
    onSelect: (element, current, root) => void openPanel(element, current, root),
    onEnd: release,
  });
  cancel = () => session.dispatch({ type: 'cancel' });
}
