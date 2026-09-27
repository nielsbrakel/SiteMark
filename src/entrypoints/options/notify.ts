import type { ToastMessage } from '@/ui/components/Toast';

/** A toast of the options page; undo toasts stay longer than the default 4 s. */
export type OptionsToast = ToastMessage & {
  readonly durationMs?: number;
  /** Runs when the toast goes away: its time ran out, it was closed, or its action ran. */
  readonly onExpire?: () => void;
};

/** Shows a toast at the bottom of the options page (replacing the current one). */
export type Notify = (toast: OptionsToast) => void;

/** How long a delete can be undone (REQ-GRP-001). */
export const UNDO_MS = 10_000;
