import type { ZodType } from 'zod';
import type { PatternId } from '../ids';
import { idSchema } from './fields';
import type { OriginPattern, UrlPattern } from './schema';
import { z } from './zod';

// Shape and limits only (REQ-SEC-004, REQ-URL-004, REQ-URL-010). Whether a pattern parses, is safe
// and isn't too broad is the URL engine's job (src/core/url), run by reducers and import.

const MAX_LENGTH = 500;
const MAX_STARS = 10;
const MAX_ORIGINS = 20;

/** `^(\*|https?)://(\*\.)?host(:port)?/\*$` with a lowercase DNS name, IPv4 or bracketed IPv6. */
const ORIGIN =
  /^(\*|https?):\/\/(\*\.)?([a-z0-9-]+(\.[a-z0-9-]+)*|\[[0-9a-f:.]+\])(:\d{1,5})?\/\*$/;

const originSchema = z.custom<OriginPattern>(
  (value) => typeof value === 'string' && ORIGIN.test(value),
  { error: 'Expected an origin pattern like https://*.example.com/*' },
);

const lengthMessage = `Expected 1-${MAX_LENGTH} characters`;
const patternValue = z.string().min(1, lengthMessage).max(MAX_LENGTH, lengthMessage);

const wildcardSchema = z.strictObject({
  id: idSchema<PatternId>(),
  kind: z.literal('wildcard'),
  value: patternValue.refine(
    (value) => value.split('*').length - 1 <= MAX_STARS,
    `Expected at most ${MAX_STARS} * wildcards`,
  ),
});

const regexSchema = z.strictObject({
  id: idSchema<PatternId>(),
  kind: z.literal('regex'),
  value: patternValue,
  origins: z
    .array(originSchema)
    .min(1, 'A regex needs at least one origin')
    .max(MAX_ORIGINS, `Expected at most ${MAX_ORIGINS} origins`),
});

export const urlPatternSchema: ZodType<UrlPattern> = z.discriminatedUnion('kind', [
  wildcardSchema,
  regexSchema,
]);
