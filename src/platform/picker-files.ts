/**
 * WXT's output for the picker entrypoint (`src/entrypoints/picker.content.ts` with
 * `registration: 'runtime'`, so it is never registered, only injected). A page where the
 * injection fails shows "✕" for the shortcut. tests/build/picker-bundle.test.ts checks the file.
 */
const PICKER_FILES = ['content-scripts/picker.js'] as const;

/** The files of the picker, injected on demand (REQ-PICK-001). */
export function pickerFiles(): readonly string[] {
  return PICKER_FILES;
}
