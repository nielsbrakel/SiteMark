import type { SavedPick, SavePick } from '../../app/protocol';
import type { PickerContext } from '../../app/use-cases/picker-context';
import { sendToBackground } from '../../platform/send-message';
import { createPanel } from './panel';
import type { PickerSession } from './picker';
import { panelLabels } from './picker-labels';
import { generateSelector } from './selector';

// From a selection to the saved mark (REQ-PICK-005): the panel gets its choices from the
// background (pickerContext) and hands a savePick intent back. The pick ends once the background
// accepted it; if it didn't, the panel stays open.

/** Without an answer the panel still works: it offers a new site group, in the system theme. */
const NO_CONTEXT: PickerContext = { groups: [], theme: 'system' };

function countMatches(selector: string): number | undefined {
  if (selector === '') return undefined;
  try {
    return document.querySelectorAll(selector).length;
  } catch {
    return undefined;
  }
}

async function save(pick: SavePick, session: PickerSession): Promise<SavedPick | undefined> {
  const reply = await sendToBackground('savePick', pick);
  if (!reply.ok || !reply.value.ok) return undefined;
  session.dispatch({ type: 'save' });
  return reply.value.value;
}

/** "More options…": save, then open the options page at the new mark (REQ-PICK-005). */
async function saveAndOpen(pick: SavePick, session: PickerSession): Promise<void> {
  const saved = await save(pick, session);
  if (!saved) return;
  const route = `/groups/${saved.siteGroupId}/marks/${saved.markId}`;
  await sendToBackground('openOptions', { route });
}

/** Opens the mini panel for `element` in the picker's container. */
export async function openPanel(
  element: Element,
  session: PickerSession,
  root: HTMLElement,
): Promise<void> {
  const reply = await sendToBackground('pickerContext');
  // The user may have cancelled while the background answered.
  if (session.state().kind !== 'editing') return;
  createPanel(root, {
    selector: generateSelector(element) ?? '',
    context: reply.ok ? reply.value : NO_CONTEXT,
    origin: location.host,
    labels: panelLabels(),
    countMatches,
    onSave: (pick) => void save(pick, session),
    onCancel: () => session.dispatch({ type: 'cancel' }),
    onMoreOptions: (pick) => void saveAndOpen(pick, session),
  });
}
