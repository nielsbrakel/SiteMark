import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { Field, type FieldControlProps } from './Field';

const controls = {
  input: (control: FieldControlProps) => <input {...control} defaultValue="Production" />,
  select: (control: FieldControlProps) => (
    <select {...control} defaultValue="a">
      <option value="a">Production</option>
    </select>
  ),
  textarea: (control: FieldControlProps) => <textarea {...control} defaultValue="Production" />,
} as const;

const kinds = Object.keys(controls) as (keyof typeof controls)[];

describe('REQ-A11Y-008 REQ-A11Y-003 Field', () => {
  it.each(kinds)('labels its %s', (kind) => {
    render(<Field label="Name">{controls[kind]}</Field>);
    const control = screen.getByLabelText('Name');
    expect(control.tagName).toBe(kind.toUpperCase());
    expect(control).not.toHaveAttribute('aria-invalid');
    expect(control).not.toHaveAttribute('aria-describedby');
  });

  it('describes the control with its helper text', () => {
    render(
      <Field label="Name" description="Shown in the popup">
        {controls.input}
      </Field>,
    );
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Shown in the popup');
  });

  it('marks the control invalid and describes it with the inline error, icon decorative', () => {
    render(
      <Field label="Pattern" description="e.g. *.example.com" error="This pattern is too broad">
        {controls.input}
      </Field>,
    );
    const control = screen.getByLabelText('Pattern');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAccessibleDescription('e.g. *.example.com This pattern is too broad');
    const error = screen.getByText('This pattern is too broad');
    expect(error).toBeVisible();
    expect(error.closest('p')?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps extra classes on the field', () => {
    const { container } = render(
      <Field label="Name" className="wide">
        {controls.input}
      </Field>,
    );
    expect(container.firstElementChild).toHaveClass('wide');
  });

  it.each(kinds)('%s has no axe violations, with and without an error', async (kind) => {
    const { container } = render(
      <>
        <Field label="Name" description="Helper">
          {controls[kind]}
        </Field>
        <Field label="Other" error="Required">
          {controls[kind]}
        </Field>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
