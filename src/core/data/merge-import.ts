import type { SiteGroupErrorCode } from '../errors';
import type { IdGen, SiteGroupId } from '../ids';
import type { OriginPattern, RegexPattern, SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';
import type { ImportData } from './import';

// Applying a parsed import (REQ-DATA-004): a preview, then Merge (D-218) or Replace.

/** A regex pattern or exclude in the file, highlighted in the preview. */
export type ImportedRegex = {
  readonly siteGroupId: SiteGroupId;
  readonly list: 'patterns' | 'excludes';
  readonly pattern: RegexPattern;
};

export type ImportPreview = {
  /** Site groups in the file whose ID exists locally. */
  readonly updated: number;
  /** Site groups in the file that are new. */
  readonly added: number;
  /** Origins the imported groups need that the local state did not (the same for both modes). */
  readonly newOrigins: OriginPattern[];
  readonly regexPatterns: ImportedRegex[];
};

export type MergeError = Extract<SiteGroupErrorCode, 'siteGroupLimitReached'>;

/** What the file would change: "N updated, M new, K new origins", with its regex patterns. */
export function previewImport(_local: SiteMarkState, _incoming: ImportData): ImportPreview {
  return notImplemented();
}

/** Merge: upsert the file's site groups by ID and keep the local settings (D-218). */
export function mergeImport(
  _local: SiteMarkState,
  _incoming: ImportData,
  _deps: { readonly idGen: IdGen },
): Result<SiteMarkState, MergeError> {
  return notImplemented();
}

/** Replace (after confirmation): the file's site groups and settings replace the local ones. */
export function replaceImport(_local: SiteMarkState, _incoming: ImportData): SiteMarkState {
  return notImplemented();
}
