import type { SavedPick, SavePick } from '../../app/protocol';
import type { PickerAnswer } from '../../app/use-cases/picker-context';
import type { MarkId } from '../../core/ids';
import { sendToBackground } from '../../platform/send-message';
import { createPanel, type Panel } from './panel';
import type { PickerSession } from './picker';
import { panelLabels } from './picker-labels';
import { generateSelector } from './selector';

// From a selection to the saved mark (REQ-PICK-005): the panel gets its choices from the
// background (pickerContext) and hands a savePick intent back. The pick ends once the background
// accepted it (if it didn't, the panel stays open), after the not-granted notice where needed.

/** Without an answer the panel still works: a new site group, the system theme, no notice. */
const NO_CONTEXT: PickerAnswer = { groups: [], theme: 'system', isGranted: true };

function countMatches(selector: string): number | undefined {
  if (selector === '') return undefined;
  try {
    return document.querySelectorAll(selector).length;
  } catch {
    return undefined;
  }
}

async function save(pick: SavePick): Promise<SavedPick | undefined> {
  const reply = await sendToBackground('savePick', pick);
  return reply.ok && reply.value.ok ? reply.value.value : undefined;
}

type Flow = { readonly session: PickerSession; readonly context: PickerAnswer; panel?: Panel };

/** Save: done, or on a site that isn't granted, the "this tab only" notice first (REQ-PICK-006). */
async function saveAndFinish(pick: SavePick, flow: Flow): Promise<void> {
  if (!(await save(pick))) return;
  if (flow.context.isGranted || !flow.panel) flow.session.dispatch({ type: 'save' });
  else flow.panel.showNotGranted();
}

/** "More options…": save, then open the options page at the new mark (REQ-PICK-005). */
async function saveAndOpen(pick: SavePick, flow: Flow): Promise<void> {
  const saved = await save(pick);
  if (!saved) return;
  flow.session.dispatch({ type: 'save' });
  const route = `/groups/${saved.siteGroupId}/marks/${saved.markId}`;
  await sendToBackground('openOptions', { route });
}

/** Allow: the background opens the grant page for this site (D-229); the pick is done. */
function allow(flow: Flow): void {
  void sendToBackground('requestGrant');
  flow.session.dispatch({ type: 'save' });
}

/**
 * Opens the mini panel for `element` in the picker's container; with `repickMarkId` it only
 * replaces that mark's selector (REQ-PICK-007).
 */
export async function openPanel(
  element: Element,
  session: PickerSession,
  root: HTMLElement,
  repickMarkId?: MarkId,
): Promise<void> {
  const reply = await sendToBackground('pickerContext');
  // The user may have cancelled while the background answered.
  if (session.state().kind !== 'editing') return;
  const flow: Flow = { session, context: reply.ok ? reply.value : NO_CONTEXT };
  flow.panel = createPanel(root, {
    selection: element.getBoundingClientRect(),
    selector: generateSelector(element) ?? '',
    context: flow.context,
    origin: location.host,
    labels: panelLabels(),
    countMatches,
    onSave: (pick) => void saveAndFinish(pick, flow),
    onCancel: () => session.dispatch({ type: 'cancel' }),
    onMoreOptions: (pick) => void saveAndOpen(pick, flow),
    onAllow: () => allow(flow),
    onClose: () => session.dispatch({ type: 'save' }),
    ...(repickMarkId && { repickMarkId }),
  });
}
