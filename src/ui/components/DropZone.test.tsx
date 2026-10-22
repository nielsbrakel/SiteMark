import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { byLabel } from '../../../tests/unit/queries';
import { DropZone } from './DropZone';
import { Field } from './Field';

const file = new File(['{}'], 'export.json', { type: 'application/json' });

function setup(error?: string) {
  const onFile = vi.fn();
  const view = render(
    <Field label="Choose an export file" {...(error && { error })}>
      {(control) => (
        <DropZone
          control={control}
          accept=".json"
          dropText="Drop your export here"
          dragText="Let go to import"
          hint="or choose a file"
          onFile={onFile}
        />
      )}
    </Field>,
  );
  const zone = () => byLabel('Choose an export file').parentElement as HTMLElement;
  return { onFile, zone, container: view.container };
}

describe('REQ-DATA-004 DropZone', () => {
  it('shows the prompt and keeps the file input labelled', () => {
    const { zone } = setup();
    expect(screen.queryByText('Drop your export here')).not.toBeNull();
    expect(byLabel('Choose an export file')).toHaveAttribute('type', 'file');
    expect(zone()).not.toHaveAttribute('data-dragging');
  });

  it('hands over a chosen or dropped file and clears the drag state', () => {
    const { onFile, zone } = setup();
    fireEvent.change(byLabel('Choose an export file'), { target: { files: [file] } });
    fireEvent.dragEnter(zone(), { dataTransfer: { files: [file], types: ['Files'] } });
    expect(zone()).toHaveAttribute('data-dragging', 'true');
    expect(screen.queryByText('Let go to import')).not.toBeNull();
    fireEvent.drop(zone(), { dataTransfer: { files: [file] } });
    expect(onFile).toHaveBeenCalledTimes(2);
    expect(onFile).toHaveBeenLastCalledWith(file);
    expect(zone()).not.toHaveAttribute('data-dragging');
  });

  it('leaves the drag state when the file leaves the zone', () => {
    const { zone } = setup();
    fireEvent.dragEnter(zone(), { dataTransfer: { types: ['Files'] } });
    fireEvent.dragLeave(zone());
    expect(zone()).not.toHaveAttribute('data-dragging');
  });

  it.each([undefined, 'This file is not valid JSON.'])(
    'has no axe violations (%s)',
    async (error) => {
      const { container, zone } = setup(error);
      expect(zone()).toBeInstanceOf(HTMLElement);
      expect(await axeViolations(container)).toEqual([]);
    },
  );
});
