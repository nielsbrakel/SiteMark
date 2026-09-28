import {
  type FocusEvent,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
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
  /**
   * Moves focus to the action when the toast appears (e.g. Undo after a delete), so keyboard and
   * screen reader users reach it; the timer waits while focus is inside.
   */
  readonly takeFocus?: boolean;
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
  /** Runs when the action or × closes the toast with focus inside, to put focus somewhere else. */
  readonly onFocusLost?: () => void;
};

const windowTimer: ToastTimer = {
  start(callback, ms) {
    const handle = setTimeout(callback, ms);
    return () => clearTimeout(handle);
  },
};

type PauseHandlers = {
  readonly onPointerEnter: () => void;
  readonly onPointerLeave: () => void;
  readonly onFocus: () => void;
  readonly onBlur: (event: FocusEvent<HTMLElement>) => void;
};

/** Paused while the pointer or focus is on the toast: either one holds the timer. */
function usePause(toast: ToastMessage | undefined): [boolean, PauseHandlers] {
  const [isHovered, setHovered] = useState(false);
  const [hasFocus, setFocus] = useState(false);
  const isPaused = isHovered || hasFocus;
  // A closed toast fires no blur or pointerleave; the next one starts unpaused.
  if (!toast && isPaused) {
    setHovered(false);
    setFocus(false);
  }
  return [
    isPaused,
    {
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
      onFocus: () => setFocus(true),
      onBlur: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocus(false);
      },
    },
  ];
}

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
  onFocusLost,
}: ToastProps): ReactNode {
  const [isPaused, pauseHandlers] = usePause(toast);
  const dismiss = useEffectEvent(onDismiss);
  const toastRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!toast || isPaused) return;
    return timer.start(() => dismiss(), durationMs);
  }, [toast, isPaused, durationMs, timer]);

  useEffect(() => {
    if (toast?.takeFocus) actionRef.current?.focus();
  }, [toast]);

  const close = () => {
    const hadFocus = toastRef.current?.contains(document.activeElement) ?? false;
    onDismiss();
    if (hadFocus) onFocusLost?.();
  };
  const runAction = (action: ToastAction) => {
    action.onAction();
    close();
  };

  return (
    <div role="status" className={styles.region}>
      {toast && (
        // Hover and focus only pause the timer: the wrapper has no action of its own.
        <div ref={toastRef} className={styles.toast} {...pauseHandlers}>
          <p className={styles.text}>{toast.text}</p>
          {toast.action && (
            <Button
              ref={actionRef}
              variant="quiet"
              onClick={() => toast.action && runAction(toast.action)}
            >
              {toast.action.label}
            </Button>
          )}
          <IconButton label={dismissLabel} icon={<CloseIcon />} onClick={close} />
        </div>
      )}
    </div>
  );
}
