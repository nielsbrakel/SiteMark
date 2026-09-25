import type { RegexPattern, SiteGroup, SiteMarkState, WildcardPattern } from '../model/schema';
import { notImplemented } from '../not-implemented';

// Test builders: each returns schema-valid data with deterministic IDs; overrides replace whole
// top-level fields.

export function aWildcardPattern(_overrides: Partial<WildcardPattern> = {}): WildcardPattern {
  return notImplemented();
}

export function aRegexPattern(_overrides: Partial<RegexPattern> = {}): RegexPattern {
  return notImplemented();
}

export function aSiteGroup(_overrides: Partial<SiteGroup> = {}): SiteGroup {
  return notImplemented();
}

export function aState(_overrides: Partial<SiteMarkState> = {}): SiteMarkState {
  return notImplemented();
}
