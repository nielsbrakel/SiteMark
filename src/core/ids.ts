import { notImplemented } from './not-implemented';

/** A string (or number) that only validated or minted code may produce (spec §7). */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type SiteGroupId = Brand<string, 'SiteGroupId'>;
export type MarkId = Brand<string, 'MarkId'>;
export type PatternId = Brand<string, 'PatternId'>;
export type EntityId = SiteGroupId | MarkId | PatternId;

/** Mints new IDs (12 characters of `[A-Za-z0-9_-]`). Only the background mints (D-220). */
export type IdGen = {
  siteGroupId(): SiteGroupId;
  markId(): MarkId;
  patternId(): PatternId;
};

/** Current time in epoch milliseconds. Core never reads the clock itself; it gets one injected. */
export type Clock = {
  now(): number;
};

/** Fills `bytes` with random values, like `crypto.getRandomValues` (core has no crypto global). */
export type RandomValues = (bytes: Uint8Array) => Uint8Array;

/**
 * Checks the ID format `^[A-Za-z0-9_-]{12}$` (REQ-SEC-004). The type parameter says which kind of ID
 * the caller is validating, e.g. `isValidId<MarkId>(input.id)`.
 */
export function isValidId<I extends EntityId = EntityId>(_value: unknown): _value is I {
  return notImplemented();
}

/** An IdGen backed by `randomValues`; the platform passes `crypto.getRandomValues`. */
export function createIdGen(_randomValues: RandomValues): IdGen {
  return notImplemented();
}
