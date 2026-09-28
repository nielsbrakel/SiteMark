// `storage.local.setAccessLevel` (REQ-SEC-002, D-221) only works in Chromium 140+. Older Chromium,
// Firefox and Safari take an access level on `storage.session` only, so a refusal there is expected.

const CHROMIUM = /\bChrom(?:e|ium)\/(\d+)\./;
const FIRST_LOCAL_ACCESS_LEVEL = 140;

/** Does this browser (by its user agent) accept an access level on `storage.local`? */
export function acceptsLocalAccessLevel(userAgent: string): boolean {
  const version = CHROMIUM.exec(userAgent)?.[1];
  return version !== undefined && Number(version) >= FIRST_LOCAL_ACCESS_LEVEL;
}
