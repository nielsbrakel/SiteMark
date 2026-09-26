import fc from 'fast-check';
import type { EntityId } from '../ids';
import type { Hex } from '../model/schema';
import { cleanText } from '../model/text';

// fast-check generators for single fields in their stored form (T-058).

/**
 * A few IDs every generator draws from often, so two generated states share IDs across groups,
 * patterns and marks, the collisions an import merge must resolve (REQ-DATA-004).
 */
const SHARED_IDS = ['shared-id-01', 'shared-id-02', 'shared-id-03', 'shared_id_04'];

/** A valid ID (`^[A-Za-z0-9_-]{12}$`), often one of a few shared ones. */
export function anId<I extends EntityId>(): fc.Arbitrary<I> {
  return fc
    .oneof(fc.constantFrom(...SHARED_IDS), fc.stringMatching(/^[A-Za-z0-9_-]{12}$/))
    .map((id) => id as I);
}

/** User text as stored: cleaned (see `cleanText`), `min..max` characters. */
export function userText(min: number, max: number): fc.Arbitrary<string> {
  return fc
    .string({ minLength: min, maxLength: max, unit: 'binary' })
    .map(cleanText)
    .filter((text) => text.length >= min && text.length <= max);
}

/** A lowercase `#rrggbb`. */
export const hex: fc.Arbitrary<Hex> = fc
  .integer({ min: 0, max: 0xff_ff_ff })
  .map((value) => `#${value.toString(16).padStart(6, '0')}` as Hex);
