// Release zip check (REQ-SEC-008): every zip the release workflow publishes carries a production
// manifest (REQ-PRIV-001) and nothing from the e2e build. release.yml runs it on the built zips.
//   node scripts/check-release-zips.ts .output/*.zip
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const END_OF_DIRECTORY = 0x06054b50;
const CENTRAL_ENTRY = 0x02014b50;
const PERMISSIONS = ['activeTab', 'scripting', 'storage'];
const INSTALL_TIME = ['host_permissions', 'content_scripts', 'web_accessible_resources'];
/** The e2e build pre-grants `*.sitemark.test`; a release must never contain it. */
const E2E_HOST = 'sitemark.test';

function endOfDirectory(zip: Buffer): number {
  for (let at = zip.length - 22; at >= 0; at--) {
    if (zip.readUInt32LE(at) === END_OF_DIRECTORY) return at;
  }
  throw new Error('Not a zip archive: no end of central directory');
}

function entryData(zip: Buffer, method: number, local: number, size: number): Buffer {
  const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
  const data = zip.subarray(start, start + size);
  if (method === 0) return Buffer.from(data);
  if (method === 8) return inflateRawSync(data);
  throw new Error(`Unsupported zip compression method ${method}`);
}

/** The files of a zip archive by path (stored and deflated entries). */
export function readZip(zip: Buffer): Map<string, Buffer> {
  const end = endOfDirectory(zip);
  const files = new Map<string, Buffer>();
  let at = zip.readUInt32LE(end + 16);
  for (let i = 0; i < zip.readUInt16LE(end + 10); i++) {
    if (zip.readUInt32LE(at) !== CENTRAL_ENTRY) throw new Error('Corrupt zip central directory');
    const nameLength = zip.readUInt16LE(at + 28);
    const name = zip.toString('utf8', at + 46, at + 46 + nameLength);
    const data = entryData(
      zip,
      zip.readUInt16LE(at + 10),
      zip.readUInt32LE(at + 42),
      zip.readUInt32LE(at + 20),
    );
    if (!name.endsWith('/')) files.set(name, data);
    at += 46 + nameLength + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32);
  }
  return files;
}

function manifestProblems(manifest: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const permissions = [...((manifest.permissions as string[] | undefined) ?? [])].sort();
  if (JSON.stringify(permissions) !== JSON.stringify(PERMISSIONS)) {
    problems.push(
      `permissions are ${JSON.stringify(permissions)}, not ${JSON.stringify(PERMISSIONS)}`,
    );
  }
  for (const field of INSTALL_TIME) if (field in manifest) problems.push(`declares ${field}`);
  if (JSON.stringify(manifest.optional_host_permissions) !== '["*://*/*"]') {
    problems.push('optional_host_permissions must be ["*://*/*"]');
  }
  return problems;
}

/** What is wrong with one extension zip; empty when it can be published. */
export function zipProblems(name: string, files: ReadonlyMap<string, Buffer>): string[] {
  const manifest = files.get('manifest.json');
  if (!manifest) return [`${name} has no manifest.json`];
  const problems = manifestProblems(JSON.parse(manifest.toString('utf8'))).map(
    (problem) => `${name}: the manifest ${problem}`,
  );
  for (const [file, data] of files) {
    if (data.includes(E2E_HOST))
      problems.push(`${name}: ${file} mentions the e2e host ${E2E_HOST}`);
  }
  return problems;
}

/** What a reviewer needs to rebuild the Firefox zip exactly (SOURCE_REVIEW.md). */
const BUILD_INPUTS = ['SOURCE_REVIEW.md', '.nvmrc', 'pnpm-lock.yaml', 'package.json'];
/** Local output and secrets that must never be published with the sources. */
const LOCAL_ONLY =
  /^(test-results|playwright-report|coverage|reports|\.stryker-tmp|\.output|node_modules)\/|^\.env/;

/** What is wrong with the Firefox sources zip for AMO review (REQ-SEC-008, SOURCE_REVIEW.md). */
export function sourcesZipProblems(name: string, files: ReadonlyMap<string, Buffer>): string[] {
  const missing = BUILD_INPUTS.filter((file) => !files.has(file)).map(
    (file) => `${name} lacks ${file}`,
  );
  const local = [...files.keys()]
    .filter((file) => LOCAL_ONLY.test(file))
    .map((file) => `${name} must not contain ${file}`);
  return [...missing, ...local];
}

function main(zips: readonly string[]): void {
  // The Firefox sources zip (for AMO review) is source code, not an extension.
  const isSources = (zip: string) => zip.endsWith('-sources.zip');
  const extensions = zips.filter((zip) => !isSources(zip));
  const problems = zips.flatMap((zip) => {
    const check = isSources(zip) ? sourcesZipProblems : zipProblems;
    return check(path.basename(zip), readZip(readFileSync(zip)));
  });
  for (const problem of problems) console.error(`::error::${problem}`);
  if (problems.length > 0 || extensions.length === 0) process.exit(1);
  console.log(`Checked ${extensions.length} release zip(s).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
