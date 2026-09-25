import { browser } from 'wxt/browser';
import type { BackupSlot, StateBackup } from '../app/ports';

// The 3 rotating backups of unreadable data (REQ-DATA-001, D-224): `sitemark:backup:0…2`, each
// `{ savedAt, raw }`. Only the background writes them (D-220).

const SLOTS: readonly BackupSlot[] = [0, 1, 2];

const backupKey = (slot: BackupSlot) => `sitemark:backup:${slot}`;

function parseBackup(slot: BackupSlot, value: unknown): StateBackup[] {
  if (typeof value !== 'object' || value === null) return [];
  const { savedAt, raw } = value as { savedAt?: unknown; raw?: unknown };
  return typeof savedAt === 'number' ? [{ slot, savedAt, raw }] : [];
}

/** The backups, newest first. Malformed entries count as empty slots. */
export async function readBackups(): Promise<StateBackup[]> {
  const items = await browser.storage.local.get(SLOTS.map(backupKey));
  return SLOTS.flatMap((slot) => parseBackup(slot, items[backupKey(slot)])).sort(
    (a, b) => b.savedAt - a.savedAt,
  );
}

/** An empty slot if there is one, otherwise the slot of the oldest backup. */
function nextSlot(backups: readonly StateBackup[]): BackupSlot {
  const used = new Set(backups.map((backup) => backup.slot));
  return SLOTS.find((slot) => !used.has(slot)) ?? backups.at(-1)?.slot ?? 0;
}

const sameData = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Saves `raw` into the next slot. Data that is already backed up keeps its backup, so loading the
 * same unreadable data again never pushes older backups out.
 */
export async function backUp(raw: unknown, savedAt: number): Promise<StateBackup> {
  const backups = await readBackups();
  const existing = backups.find((backup) => sameData(backup.raw, raw));
  if (existing) return existing;
  const slot = nextSlot(backups);
  await browser.storage.local.set({ [backupKey(slot)]: { savedAt, raw } });
  return { slot, savedAt, raw };
}
