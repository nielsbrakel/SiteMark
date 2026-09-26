/**
 * WXT's output for the picker entrypoint (T-111: `src/entrypoints/picker.content.ts` with
 * `registration: 'runtime'`, so it is never registered, only injected). Until it exists the
 * injection fails, which the shortcut shows as "✕".
 */
const PICKER_FILES = ['content-scripts/picker.js'] as const;

/** The files of the picker, injected on demand (REQ-PICK-001). */
export function pickerFiles(): readonly string[] {
  return PICKER_FILES;
}
