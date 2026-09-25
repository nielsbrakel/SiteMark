const ID_LENGTH = 12;
const ID_FORMAT = /^[A-Za-z0-9_-]{12}$/;
/** The base64url alphabet. */
// biome-ignore lint/security/noSecrets: an alphabet, not a secret.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** A value that only validating or minting code may produce (spec §7). */
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
export function isValidId<I extends EntityId = EntityId>(value: unknown): value is I {
  return typeof value === 'string' && ID_FORMAT.test(value);
}

/** One ID from 12 random bytes. 64 symbols, so `byte & 63` is uniform: 72 random bits per ID. */
function mint(randomValues: RandomValues): string {
  const bytes = randomValues(new Uint8Array(ID_LENGTH));
  return Array.from(bytes, (byte) => ALPHABET.charAt(byte & 63)).join('');
}

/** An IdGen backed by `randomValues`; the platform passes `crypto.getRandomValues`. */
export function createIdGen(randomValues: RandomValues): IdGen {
  return {
    siteGroupId: () => mint(randomValues) as SiteGroupId,
    markId: () => mint(randomValues) as MarkId,
    patternId: () => mint(randomValues) as PatternId,
  };
}
