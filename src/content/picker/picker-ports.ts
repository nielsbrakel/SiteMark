import type { MarkId } from '../../core/ids';
import { listenForPicker } from '../../platform/listen-in-tab';
import { createGlassPane } from './glass-pane';
import { openPanel } from './open-panel';
import { runPicker } from './picker';
import { paneLabels } from './picker-labels';
import { claimPicker } from './singleton';

// The picker's production wiring (REQ-PICK-001): the real glass pane, then the mini panel talking
// to the background. Each injection toggles: a running picker is cancelled instead. For a re-pick
// the background sends `repick` right after injecting (REQ-PICK-007, D-269).

/** Starts the picker, or cancels the one that is running. */
export function startPicking(): void {
  let cancel: () => void = () => {
    // Replaced once the session exists.
  };
  const release = claimPicker(() => cancel());
  if (!release) return;
  let repickMarkId: MarkId | undefined;
  const stopListening = listenForPicker({
    repick: ({ markId }) => {
      repickMarkId = markId;
    },
  });
  const labels = paneLabels();
  const session = runPicker({
    createPane: (hooks) => createGlassPane(hooks, labels),
    onSelect: (element, current, root) => void openPanel(element, current, root, repickMarkId),
    onEnd: () => {
      stopListening();
      release();
    },
  });
  cancel = () => session.dispatch({ type: 'cancel' });
}
