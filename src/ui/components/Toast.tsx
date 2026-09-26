import type { ReactNode } from 'react';
import { notImplemented } from '../../core/not-implemented';

export type ToastAction = {
  readonly label: string;
  readonly onAction: () => void;
};

export type ToastMessage = {
  readonly text: string;
  readonly action?: ToastAction;
};

/** Schedules the auto-dismiss; returns a function that cancels it. Injected by tests. */
export type ToastTimer = {
  start(callback: () => void, ms: number): () => void;
};

export type ToastProps = {
  /** The toast to show; a new object restarts the timer. `undefined` shows nothing. */
  readonly toast: ToastMessage | undefined;
  readonly onDismiss: () => void;
  /** Name of the dismiss (×) button, already translated. */
  readonly dismissLabel: string;
  /** Default 4 s; paused while hovered or focused. */
  readonly durationMs?: number;
  readonly timer?: ToastTimer;
};

export function Toast(_props: ToastProps): ReactNode {
  return notImplemented();
}
