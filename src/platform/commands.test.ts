import { describe, expect, it, vi } from 'vitest';
import { fakes } from '../../tests/fakes/install';
import { createInMemoryTabs } from '../app/testing/in-memory-tabs';
import { createCommandDispatcher, listenForCommands } from './commands';
import { pickerFiles } from './picker-files';

function setup(active = true) {
  const run = vi.fn(async () => undefined);
  const tabs = createInMemoryTabs([{ id: 1 }, { id: 5, active }]);
  const dispatch = createCommandDispatcher(run, tabs);
  return { run, dispatch };
}

describe('REQ-CMD-001 REQ-CMD-002 keyboard commands run on the right tab', () => {
  it.each(['start-picker', 'toggle-hide'])(
    'runs %s on the tab the browser passes',
    async (name) => {
      const { run, dispatch } = setup();
      await dispatch(name, { id: 1 });
      expect(run).toHaveBeenCalledExactlyOnceWith(name, 1);
    },
  );

  it('looks up the active tab where onCommand passes none (REQ-CMD-001)', async () => {
    const { run, dispatch } = setup();
    await dispatch('start-picker');
    await dispatch('toggle-hide', {});
    expect(run.mock.calls).toEqual([
      ['start-picker', 5],
      ['toggle-hide', 5],
    ]);
  });

  it('does nothing without a tab', async () => {
    const { run, dispatch } = setup(false);
    await dispatch('start-picker');
    expect(run).not.toHaveBeenCalled();
  });

  it('ignores commands it does not know', async () => {
    const { run, dispatch } = setup();
    await dispatch('_execute_action', { id: 1 });
    await dispatch('toString', { id: 1 });
    expect(run).not.toHaveBeenCalled();
  });

  it('listens to commands.onCommand and stops again', async () => {
    const dispatch = vi.fn(async () => undefined);
    const stop = listenForCommands(dispatch);
    fakes().commands.press('start-picker', { id: 9 });
    expect(dispatch).toHaveBeenCalledExactlyOnceWith('start-picker', { id: 9 });
    stop();
    expect(fakes().commands.api.onCommand.hasListeners()).toBe(false);
  });
});

describe('REQ-PICK-001 the picker is its own bundle, injected on demand', () => {
  it('lives at content-scripts/picker.js (the picker entrypoint, T-111)', () => {
    expect(pickerFiles()).toEqual(['content-scripts/picker.js']);
  });
});
