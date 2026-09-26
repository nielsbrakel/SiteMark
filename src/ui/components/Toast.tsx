import { type FocusEvent, type ReactNode, useEffect, useEffectEvent, useState } from 'react';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { CloseIcon } from './icons';
import styles from './Toast.module.css';

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

const windowTimer: ToastTimer = {
  start(callback, ms) {
    const handle = setTimeout(callback, ms);
    return () => clearTimeout(handle);
  },
};

/**
 * A toast at the bottom center (design.md §4). The `role="status"` live region is always in the
 * page, so screen readers announce each new toast. It dismisses itself after `durationMs`, paused
 * while the pointer or focus is on it, and can carry one action such as Undo.
 */
export function Toast({
  toast,
  onDismiss,
  dismissLabel,
  durationMs = 4000,
  timer = windowTimer,
}: ToastProps): ReactNode {
  const [isPaused, setPaused] = useState(false);
  const dismiss = useEffectEvent(onDismiss);

  useEffect(() => {
    if (!toast || isPaused) return;
    return timer.start(() => dismiss(), durationMs);
  }, [toast, isPaused, durationMs, timer]);

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
  };
  const runAction = (action: ToastAction) => {
    action.onAction();
    onDismiss();
  };

  return (
    <div role="status" className={styles.region}>
      {toast && (
        // biome-ignore lint/a11y/noStaticElementInteractions: hover and focus only pause the timer.
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: same; no action of its own.
        <div
          className={styles.toast}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={onBlur}
        >
          <p className={styles.text}>{toast.text}</p>
          {toast.action && (
            <Button variant="quiet" onClick={() => toast.action && runAction(toast.action)}>
              {toast.action.label}
            </Button>
          )}
          <IconButton label={dismissLabel} icon={<CloseIcon />} onClick={onDismiss} />
        </div>
      )}
    </div>
  );
}
