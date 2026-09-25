/** Longer tokens are almost always generated, and would eat the 300-character selector budget. */
const MAX_TOKEN_LENGTH = 64;

/** Prefixes that only tooling emits: styled-components (`sc-`) and Svelte's scoped classes. */
const GENERATED_PREFIX = /^(?:sc|svelte)-/;
/** Four or more digits in a row (`ember1234`, `jsx-2893736141`, timestamps). */
const LONG_DIGIT_RUN = /\d{4,}/;
/** CSS Modules: `[name]_[local]__[hash:5]` (Next.js, CRA) or `…__[local]___[hash:5]` (css-loader). */
const CSS_MODULE_HASH = /_[^_]*_{2,}([A-Za-z0-9-]{5})$/;
const HEX_RUN = /[0-9a-f]{6,}/gi;

/**
 * Whether a class name, id or attribute value looks hand-written, so a selector built from it survives
 * the next deploy (REQ-PICK-004). Generated tokens (CSS-in-JS and CSS Modules hashes, long hex or digit
 * runs) are skipped by the selector generator. A heuristic: it prefers dropping a real name over keeping
 * a hash, because the generator always has a structural fallback.
 */
export function isStableToken(token: string): boolean {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH || /\s/.test(token)) return false;
  if (GENERATED_PREFIX.test(token) || LONG_DIGIT_RUN.test(token)) return false;
  if (hasCssModuleHash(token) || hasHexRun(token)) return false;
  return !token.split(/[^A-Za-z0-9]+/).some(isHashSegment);
}

function hasCssModuleHash(token: string): boolean {
  const hash = CSS_MODULE_HASH.exec(token)?.[1];
  return hash !== undefined && /[0-9A-Z]/.test(hash);
}

/** A run of 6+ hex characters with at least two digits (`e3b0c442`), so words like `facade` pass. */
function hasHexRun(token: string): boolean {
  return (token.match(HEX_RUN) ?? []).some(
    (run) => countMatches(run, /\d/g) >= 2 && /[a-f]/i.test(run),
  );
}

function isHashSegment(segment: string): boolean {
  return isAlphanumericMix(segment) || isRandomCase(segment);
}

/** `a1b2c3`, `3xYz9`: letters and digits switch at least twice (numeronyms like `i18n` are too short). */
function isAlphanumericMix(segment: string): boolean {
  return segment.length >= 5 && countMatches(segment, /[a-z](?=\d)|\d(?=[a-z])/gi) >= 2;
}

/** `kHqFyX`, `bdVaJa`: short, with isolated capitals making up a third of it (`myNavBar` has too few). */
function isRandomCase(segment: string): boolean {
  if (segment.length < 5 || segment.length > 8) return false;
  const isolatedCapitals = countMatches(segment, /[a-z](?=[A-Z][a-z])/g);
  const capitals = countMatches(segment, /[A-Z]/g);
  return isolatedCapitals >= 2 && capitals * 3 >= segment.length;
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}
