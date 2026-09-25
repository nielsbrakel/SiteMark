// Common multi-part public suffixes (REQ-URL-009, D-212). `*.` + one of these is rejected as too
// broad, just like `*.` + any single-label TLD (which needs no list). This is a curated subset of the
// Public Suffix List (https://publicsuffix.org), not the full list, which would cost ~200 KB:
//   • second-level registries of widely used country TLDs (co.uk, com.au, co.jp, com.br, …);
//   • large hosting platforms where every subdomain belongs to a different owner (github.io, …).
// Extend it when users report a suffix that should be rejected; entries are lowercase ASCII.

const COUNTRY_SECOND_LEVEL: Readonly<Record<string, readonly string[]>> = {
  ar: ['com', 'gob', 'net', 'org'],
  at: ['ac', 'co', 'gv', 'or'],
  au: ['asn', 'com', 'edu', 'gov', 'id', 'net', 'org'],
  bd: ['com', 'edu', 'gov', 'net', 'org'],
  br: ['com', 'edu', 'gov', 'net', 'org'],
  cn: ['ac', 'com', 'edu', 'gov', 'net', 'org'],
  co: ['com', 'edu', 'gov', 'net', 'org'],
  eg: ['com', 'edu', 'gov', 'org'],
  es: ['com', 'edu', 'gob', 'nom', 'org'],
  gr: ['com', 'edu', 'gov', 'net', 'org'],
  hk: ['com', 'edu', 'gov', 'net', 'org'],
  id: ['ac', 'co', 'go', 'or', 'web'],
  il: ['ac', 'co', 'gov', 'net', 'org'],
  in: ['ac', 'co', 'edu', 'firm', 'gen', 'gov', 'ind', 'net', 'org'],
  jp: ['ac', 'co', 'ed', 'go', 'gr', 'lg', 'ne', 'or'],
  ke: ['ac', 'co', 'go', 'or'],
  kr: ['ac', 'co', 'go', 'ne', 'or', 're'],
  mx: ['com', 'edu', 'gob', 'net', 'org'],
  my: ['com', 'edu', 'gov', 'net', 'org'],
  ng: ['com', 'edu', 'gov', 'org'],
  nz: ['ac', 'co', 'geek', 'govt', 'net', 'org', 'school'],
  pe: ['com', 'edu', 'gob', 'net', 'org'],
  ph: ['com', 'edu', 'gov', 'net', 'org'],
  pk: ['com', 'edu', 'gov', 'net', 'org'],
  pl: ['com', 'net', 'org'],
  pt: ['com', 'edu', 'gov', 'org'],
  ru: ['com', 'net', 'org'],
  sa: ['com', 'edu', 'gov', 'net', 'org'],
  sg: ['com', 'edu', 'gov', 'net', 'org'],
  th: ['ac', 'co', 'go', 'in', 'or'],
  tr: ['com', 'edu', 'gov', 'net', 'org'],
  tw: ['com', 'edu', 'gov', 'net', 'org'],
  ua: ['com', 'edu', 'gov', 'net', 'org'],
  uk: ['ac', 'co', 'gov', 'ltd', 'me', 'net', 'nhs', 'org', 'plc', 'police', 'sch'],
  vn: ['com', 'edu', 'gov', 'net', 'org'],
  za: ['ac', 'co', 'gov', 'net', 'org', 'web'],
};

const HOSTING_PLATFORMS: readonly string[] = [
  'appspot.com',
  'azurewebsites.net',
  'blogspot.com',
  'cloudfront.net',
  'firebaseapp.com',
  'github.io',
  'gitlab.io',
  'herokuapp.com',
  'netlify.app',
  'pages.dev',
  'vercel.app',
  'web.app',
  'workers.dev',
];

export const MULTI_PART_SUFFIXES: ReadonlySet<string> = new Set([
  ...Object.entries(COUNTRY_SECOND_LEVEL).flatMap(([tld, labels]) =>
    labels.map((label) => `${label}.${tld}`),
  ),
  ...HOSTING_PLATFORMS,
]);
