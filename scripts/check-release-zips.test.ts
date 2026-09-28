import { deflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { readZip, sourcesZipProblems, zipProblems } from './check-release-zips';

/** A minimal zip archive: every entry deflated or stored, no CRC (the reader doesn't check it). */
function zipOf(files: Record<string, string>, deflate = true): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const raw = Buffer.from(text);
    const data = deflate ? deflateRawSync(raw) : raw;
    const path = Buffer.from(name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(path.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(deflate ? 8 : 0, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(path.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, path, data);
    centrals.push(central, path);
    offset += local.length + path.length + data.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

/** The strict CSP for extension pages (tests/build/manifest.test.ts, REQ-PRIV-005). */
const CSP =
  "script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'";

const production = {
  manifest_version: 3,
  name: '__MSG_extName__',
  permissions: ['storage', 'scripting', 'activeTab'],
  optional_host_permissions: ['*://*/*'],
  content_security_policy: { extension_pages: CSP },
  externally_connectable: { ids: [], matches: [] },
};

function files(manifest: object, extra: Record<string, string> = {}): Map<string, Buffer> {
  return readZip(zipOf({ 'manifest.json': JSON.stringify(manifest), ...extra }));
}

describe('REQ-SEC-008 the release checks the manifest in every zip', () => {
  it.each([true, false])('reads deflated and stored entries (deflate: %s)', (deflate) => {
    const zip = readZip(zipOf({ 'a.txt': 'alpha', 'dir/b.js': 'beta'.repeat(100) }, deflate));
    expect([...zip.keys()]).toEqual(['a.txt', 'dir/b.js']);
    expect(zip.get('dir/b.js')?.toString()).toBe('beta'.repeat(100));
  });

  it('accepts a production manifest', () => {
    expect(zipProblems('sitemark-chrome.zip', files(production))).toEqual([]);
  });

  it('rejects a zip without a manifest', () => {
    expect(zipProblems('x.zip', readZip(zipOf({ 'a.txt': 'a' })))).toEqual([
      'x.zip has no manifest.json',
    ]);
  });

  it.each([
    ['permissions', { ...production, permissions: ['storage', 'scripting', 'activeTab', 'tabs'] }],
    ['host_permissions', { ...production, host_permissions: ['*://*/*'] }],
    ['content_scripts', { ...production, content_scripts: [{ matches: ['<all_urls>'] }] }],
    ['web_accessible_resources', { ...production, web_accessible_resources: [] }],
    [
      'optional_host_permissions',
      { ...production, optional_host_permissions: ['https://x.test/*'] },
    ],
  ] as const)('rejects install-time access in the manifest: %s', (field, manifest) => {
    const problems = zipProblems('sitemark-chrome.zip', files(manifest));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(field);
  });

  it('accepts a manifest without externally_connectable (Firefox has no such key)', () => {
    const { externally_connectable: _key, ...firefox } = production;
    expect(zipProblems('sitemark-firefox.zip', files(firefox))).toEqual([]);
  });

  const withoutCsp = (({ content_security_policy: _csp, ...rest }) => rest)(production);

  it.each([
    ['content_security_policy', withoutCsp],
    [
      'content_security_policy',
      { ...production, content_security_policy: { extension_pages: "script-src 'self'" } },
    ],
    [
      'content_security_policy',
      {
        ...production,
        content_security_policy: { extension_pages: CSP, sandbox: "script-src 'unsafe-eval'" },
      },
    ],
    [
      'externally_connectable',
      { ...production, externally_connectable: { matches: ['https://*.example.com/*'] } },
    ],
    ['externally_connectable', { ...production, externally_connectable: { ids: ['*'] } }],
    ['optional_permissions', { ...production, optional_permissions: ['tabs'] }],
  ] as const)('rejects a weaker manifest: %s', (field, manifest) => {
    const problems = zipProblems('sitemark-chrome.zip', files(manifest));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(field);
  });

  it('rejects anything from the e2e build (its pre-granted fixture hosts)', () => {
    const problems = zipProblems(
      'sitemark-chrome.zip',
      files(production, { 'background.js': 'grant("*://prod.sitemark.test/*")' }),
    );
    expect(problems).toEqual([
      'sitemark-chrome.zip: background.js mentions the e2e host sitemark.test',
    ]);
  });
});

describe('REQ-SEC-008 the AMO sources zip rebuilds the Firefox zip and holds nothing else', () => {
  const complete = {
    'SOURCE_REVIEW.md': '# Build',
    '.nvmrc': '22',
    'package.json': '{}',
    'pnpm-lock.yaml': 'lockfileVersion: 9',
    'wxt.config.ts': '',
    'src/entrypoints/background.ts': '',
  };

  it('accepts the sources, the lockfile, .nvmrc and the build instructions', () => {
    expect(sourcesZipProblems('s.zip', readZip(zipOf(complete)))).toEqual([]);
  });

  it.each(['SOURCE_REVIEW.md', '.nvmrc', 'pnpm-lock.yaml', 'package.json'])(
    'requires %s',
    (file) => {
      const { [file as keyof typeof complete]: _missing, ...rest } = complete;
      expect(sourcesZipProblems('s.zip', readZip(zipOf(rest)))).toEqual([`s.zip lacks ${file}`]);
    },
  );

  it.each([
    'test-results/vitest.json',
    'playwright-report/index.html',
    'coverage/lcov.info',
    '.env',
  ])('rejects local output and secrets (%s)', (file) => {
    const problems = sourcesZipProblems('s.zip', readZip(zipOf({ ...complete, [file]: 'x' })));
    expect(problems).toEqual([`s.zip must not contain ${file}`]);
  });
});
