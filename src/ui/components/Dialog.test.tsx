import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { Dialog } from './Dialog';

function Harness({ onClose }: { readonly onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose?.();
    setOpen(false);
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Delete site group
      </button>
      <Dialog
        open={open}
        onClose={close}
        title="Delete Production?"
        actions={
          <button type="button" onClick={close}>
            Cancel
          </button>
        }
      >
        <p>Its marks are deleted too.</p>
      </Dialog>
    </>
  );
}

const opener = () => screen.getByRole('button', { name: 'Delete site group' });
const dialogElement = () => document.querySelector('dialog') as HTMLDialogElement;

function openDialog() {
  opener().focus();
  fireEvent.click(opener());
  return screen.getByRole('dialog', { name: 'Delete Production?' });
}

describe('REQ-A11Y-002 REQ-A11Y-003 Dialog', () => {
  it('is a closed native dialog until opened', () => {
    render(<Harness />);
    expect(dialogElement()).toBeInTheDocument();
    expect(dialogElement().open).toBe(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens modally with showModal, named by its title', () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    render(<Harness />);
    const dialog = openDialog();
    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByRole('heading', { name: 'Delete Production?' })).toBeInTheDocument();
    expect(dialog).toContainElement(screen.getByText('Its marks are deleted too.'));
    expect(dialog).toContainElement(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('asks to close on Escape (the cancel event) and lets the owner decide', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const dialog = openDialog();
    const cancel = new Event('cancel', { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
    expect(dialogElement().open).toBe(false);
  });

  it('closes when the owner closes it and returns focus to the opener', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    openDialog();
    screen.getByRole('button', { name: 'Cancel' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(dialogElement().open).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();
    expect(opener()).toHaveFocus();
  });

  it('reports a close by the browser (e.g. a form with method="dialog") once', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    openDialog();
    act(() => {
      dialogElement().close();
    });
    expect(onClose).toHaveBeenCalledOnce();
    expect(opener()).toHaveFocus();
  });

  it('returns focus when it unmounts while open', () => {
    function Unmounting() {
      const [shown, setShown] = useState(true);
      return shown ? (
        <Dialog open onClose={() => setShown(false)} title="Hi">
          <button type="button" onClick={() => setShown(false)}>
            Done
          </button>
        </Dialog>
      ) : null;
    }
    const before = document.createElement('button');
    document.body.append(before);
    before.focus();
    render(<Unmounting />);
    screen.getByRole('button', { name: 'Done' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(before).toHaveFocus();
    before.remove();
  });

  it('has no axe violations while open', async () => {
    const { container } = render(<Harness />);
    openDialog();
    expect(await axeViolations(container)).toEqual([]);
  });
});
