import {
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
} from 'react';
import { classNames } from './class-names';
import styles from './Dialog.module.css';

export type DialogProps = {
  /** Controlled: the owner opens the dialog and closes it from `onClose`. */
  readonly open: boolean;
  /** Escape, or the browser closing the dialog, asks the owner to close it. */
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  /** Buttons at the bottom, e.g. Cancel and Delete. */
  readonly actions?: ReactNode;
  readonly className?: string;
};

function focusedElement(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

function returnFocus(opener: RefObject<HTMLElement | null>): void {
  opener.current?.focus();
  opener.current = null;
}

/**
 * A native modal `<dialog>` (design.md §4): `showModal` puts it in the top layer and makes the page
 * behind it inert, so focus stays inside. Escape asks the owner to close; focus returns to the opener.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  className,
}: DialogProps): ReactNode {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const isOpen = useRef(open);
  const titleId = useId();

  useLayoutEffect(() => {
    isOpen.current = open;
    const dialog = ref.current;
    if (!dialog || open === dialog.open) return;
    if (open) {
      opener.current = focusedElement();
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    // Removed while open: no `close` event fires, so give focus back here. (A StrictMode
    // re-mount keeps the element connected and must not move focus.)
    return () => {
      if (isOpen.current && !dialog?.isConnected) returnFocus(opener);
    };
  }, []);

  const onCancel = (event: SyntheticEvent) => {
    event.preventDefault();
    onClose();
  };
  const onClosed = () => {
    returnFocus(opener);
    if (isOpen.current) onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={classNames(styles.dialog, className)}
      onCancel={onCancel}
      onClose={onClosed}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <div className={styles.body}>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </dialog>
  );
}
