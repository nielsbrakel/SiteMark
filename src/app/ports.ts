import type { DataErrorCode } from '../core/errors';
import type { SiteMarkState } from '../core/model/schema';
import type { Result } from '../core/result';

// Ports (D-222): what the use cases need from the browser, as interfaces. `platform` implements
// them with browser.*, and `src/app/testing` has in-memory fakes. Clock and IdGen are ports too;
// they live in core (src/core/ids.ts) because the pure reducers take them as well.
// Adapters turn rejected browser calls into typed errors (D-225) where a caller can react to them.

/** A function that removes the listener it was returned for. */
export type Unsubscribe = () => void;

// ── State (D-220, D-224) ─────────────────────────────────────────────────────────────────────

/** One of the 3 rotating backups of unreadable data (REQ-DATA-001). */
export type BackupSlot = 0 | 1 | 2;

export type StateBackup = {
  readonly slot: BackupSlot;
  /** Epoch milliseconds (Clock) when the data was backed up. */
  readonly savedAt: number;
  /** The stored data exactly as it was found. */
  readonly raw: unknown;
};

/**
 * What `load()` found. In every mode `state` is a valid state the background can work with:
 * - `normal`: the stored state (migrated and written back when it was older).
 * - `recovered`: the stored data was unreadable. It is in `backup`, and `state` is `emptyState()`
 *   until the next save replaces the unreadable data (REQ-DATA-001).
 * - `readOnly`: a newer SiteMark wrote the data. It stays untouched, every save is refused and
 *   `state` is `emptyState()`, because this version can't interpret it (REQ-DATA-007).
 */
export type LoadedState =
  | { readonly mode: 'normal'; readonly state: SiteMarkState }
  | { readonly mode: 'recovered'; readonly state: SiteMarkState; readonly backup: StateBackup }
  | { readonly mode: 'readOnly'; readonly state: SiteMarkState; readonly schemaVersion: number };

/** `storageFailed`: the browser rejected the write (e.g. the quota is full). */
export type SaveError = Extract<DataErrorCode, 'stateReadOnly'> | 'storageFailed';

/** Only the background uses this (D-220): every write goes through the command queue. */
export type StateRepo = {
  load(): Promise<LoadedState>;
  /** Refused with `stateReadOnly` while the stored data comes from a newer version. */
  save(state: SiteMarkState): Promise<Result<void, SaveError>>;
  /** The backups of unreadable data, newest first (options page: "download backup"). */
  backups(): Promise<StateBackup[]>;
};

// ── Permissions (D-229) ──────────────────────────────────────────────────────────────────────

/**
 * Host permissions, always read live (REQ-PRIV-002). There is deliberately no `request`: it must be
 * called first and synchronously in a click handler, so the UI calls `requestOrigins` in
 * src/platform/permissions.ts itself.
 */
export type Permissions = {
  /** Are all these origins granted right now? (`true` for an empty list.) */
  contains(origins: readonly string[]): Promise<boolean>;
  /** Every granted origin, as the browser reports it. */
  getAll(): Promise<string[]>;
  /** Revokes the origins (REQ-PRIV-004). `false` when nothing was removed. */
  remove(origins: readonly string[]): Promise<boolean>;
  /** Origins granted from now on (a prompt, or the browser's own UI). */
  onAdded(listener: (origins: string[]) => void): Unsubscribe;
  /** Origins revoked from now on (by SiteMark or the browser's own UI). */
  onRemoved(listener: (origins: string[]) => void): Unsubscribe;
};

// ── Marker registration (D-231) ──────────────────────────────────────────────────────────────

/** The one dynamic content-script registration; the adapter fixes its id, file and run options. */
export type MarkerRegistration = { readonly matches: readonly string[] };

export type RegistrationError = 'registrationFailed';

export type ScriptRegistrar = {
  getRegistered(): Promise<MarkerRegistration | undefined>;
  /** Fails when the marker is already registered. */
  register(registration: MarkerRegistration): Promise<Result<void, RegistrationError>>;
  /** Fails when the marker is not registered. */
  update(registration: MarkerRegistration): Promise<Result<void, RegistrationError>>;
  /** Fails when the marker is not registered. */
  unregister(): Promise<Result<void, RegistrationError>>;
};

// ── Tabs (no `tabs` permission: activeTab + scripting only) ─────────────────────────────────

/** `url` is only known for tabs on a granted origin or with activeTab, never for the others. */
export type TabInfo = { readonly id: number; readonly url?: string };

/** `noReceiver`: no SiteMark content script listens in that tab. */
export type TabMessageError = 'noReceiver';
/** `injectionFailed`: a restricted page, or no permission for the tab. */
export type InjectionError = 'injectionFailed';

export type Tabs = {
  /** Every open tab (the background finds matching ones by the URLs it may see). */
  list(): Promise<TabInfo[]>;
  /** The active tab of the last focused window. */
  active(): Promise<TabInfo | undefined>;
  sendMessage(tabId: number, message: unknown): Promise<Result<unknown, TabMessageError>>;
  /** `scripting.executeScript` of extension files into the tab's top frame. */
  inject(tabId: number, files: readonly string[]): Promise<Result<void, InjectionError>>;
  /** Opens a new tab, e.g. an options deep link or grant.html. */
  create(url: string): Promise<void>;
};

// ── Badge and logging ────────────────────────────────────────────────────────────────────────

/** `!`: something can't fully render (REQ-POP-007); `✕`: restricted page; `''`: none. */
export type BadgeText = '' | '!' | '✕';

export type Badge = {
  setText(tabId: number, text: BadgeText): Promise<void>;
};

/** Adds the `[SiteMark]` prefix (D-225). Never log page content, URLs or user text. */
export type Logger = {
  warn(message: string, detail?: unknown): void;
  error(message: string, detail?: unknown): void;
};
