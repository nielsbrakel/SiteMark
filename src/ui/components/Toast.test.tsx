import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { Toast, type ToastMessage, type ToastTimer } from './Toast';

/** A timer the test runs by hand: `pending` lists what is scheduled. */
function manualTimer() {
  const pending: { callback: () => void; ms: number }[] = [];
  const timer: ToastTimer = {
    start(callback, ms) {
      const entry = { callback, ms };
      pending.push(entry);
      return () => pending.splice(pending.indexOf(entry), 1);
    },
  };
  const elapse = () =>
    act(() => {
      for (const entry of pending.splice(0)) entry.callback();
    });
  return { timer, pending, elapse };
}

const saved: ToastMessage = { text: 'Site group deleted' };

function renderToast(toast: ToastMessage | undefined, durationMs?: number) {
  const clock = manualTimer();
  const onDismiss = vi.fn();
  const props = { onDismiss, dismissLabel: 'Dismiss', timer: clock.timer };
  const view = render(
    durationMs === undefined ? (
      <Toast toast={toast} {...props} />
    ) : (
      <Toast toast={toast} durationMs={durationMs} {...props} />
    ),
  );
  const rerender = (next: ToastMessage | undefined) =>
    view.rerender(<Toast toast={next} {...props} />);
  return { ...clock, onDismiss, rerender, container: view.container };
}

describe('REQ-A11Y-003 REQ-THEME-002 Toast', () => {
  it('keeps an empty status live region in place before any toast', () => {
    renderToast(undefined);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('announces its text in the live region', () => {
    renderToast(saved);
    expect(screen.getByRole('status')).toHaveTextContent('Site group deleted');
  });

  it('dismisses itself after 4 s by default', () => {
    const { pending, elapse, onDismiss } = renderToast(saved);
    expect(pending.map((entry) => entry.ms)).toEqual([4000]);
    expect(onDismiss).not.toHaveBeenCalled();
    elapse();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('takes a custom duration', () => {
    const { pending } = renderToast(saved, 10_000);
    expect(pending.map((entry) => entry.ms)).toEqual([10_000]);
  });

  it('schedules nothing without a toast', () => {
    const { pending } = renderToast(undefined);
    expect(pending).toEqual([]);
  });

  it('pauses while hovered and restarts when the pointer leaves', () => {
    const { pending } = renderToast(saved);
    const toast = screen.getByText('Site group deleted').parentElement as HTMLElement;
    fireEvent.pointerEnter(toast);
    expect(pending).toEqual([]);
    fireEvent.pointerLeave(toast);
    expect(pending.map((entry) => entry.ms)).toEqual([4000]);
  });

  it('pauses while focus is inside and restarts when focus leaves', () => {
    const { pending } = renderToast(saved);
    const dismiss = screen.getByRole('button', { name: 'Dismiss' });
    fireEvent.focus(dismiss);
    expect(pending).toEqual([]);
    fireEvent.blur(dismiss, { relatedTarget: document.body });
    expect(pending).toHaveLength(1);
  });

  it('restarts the timer for a new toast', () => {
    const { pending, rerender } = renderToast(saved);
    rerender({ text: 'Mark deleted' });
    expect(pending).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Mark deleted');
  });

  it('runs its action (e.g. Undo) and then dismisses', () => {
    const onAction = vi.fn();
    const { onDismiss } = renderToast({
      text: 'Site group deleted',
      action: { label: 'Undo', onAction },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('can be dismissed by hand', () => {
    const { onDismiss } = renderToast(saved);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('has no axe violations', async () => {
    const { container } = renderToast({
      text: 'Site group deleted',
      action: { label: 'Undo', onAction: () => undefined },
    });
    expect(await axeViolations(container)).toEqual([]);
  });
});
