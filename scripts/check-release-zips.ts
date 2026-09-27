// Release zip check (REQ-SEC-008): every zip the release workflow publishes carries a production
// manifest (REQ-PRIV-001) and nothing from the e2e build. release.yml runs it on the built zips.
//   node scripts/check-release-zips.ts .output/*.zip
import { notImplemented } from '../src/core/not-implemented.ts';

/** The files of a zip archive by path (stored and deflated entries). */
export function readZip(_zip: Buffer): Map<string, Buffer> {
  return notImplemented();
}

/** What is wrong with one extension zip; empty when it can be published. */
export function zipProblems(_name: string, _files: ReadonlyMap<string, Buffer>): string[] {
  return notImplemented();
}
