import { type EntityId, isValidId } from '../ids';
import type { Hex } from './schema';
import { cleanText } from './text';
import { z } from './zod';

// Field schemas shared by the model schemas.

const HEX = /^#[0-9a-f]{6}$/i;

/** `#rrggbb` in any case, stored lowercase (REQ-MARK-012). */
export const hexSchema = z
  .string()
  .regex(HEX, 'Expected a hex color like #1f6feb')
  .transform((value) => value.toLowerCase() as Hex);

/** An ID of the given kind: 12 characters of `[A-Za-z0-9_-]` (REQ-SEC-004). */
export function idSchema<I extends EntityId>() {
  return z.custom<I>((value) => isValidId<I>(value), {
    error: 'Expected an ID of 12 characters A-Z, a-z, 0-9, _ or -',
  });
}

/** User-visible text: cleaned (see `cleanText`), then `min..max` characters. */
export function userText(min: number, max: number) {
  const message = `Expected ${min}-${max} characters`;
  return z.string().transform(cleanText).pipe(z.string().min(min, message).max(max, message));
}
