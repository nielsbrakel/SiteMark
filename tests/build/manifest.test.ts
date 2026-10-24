import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { outDir, readManifest, targets } from './targets';

const CSP =
  "script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'";

describe.each(targets())('%s production manifest', (target) => {
  const manifest = readManifest(target);

  describe('REQ-PRIV-001 no install-time host access', () => {
    it('requests only storage, scripting and activeTab', () => {
      expect([...(manifest.permissions as string[])].sort()).toEqual([
        'activeTab',
        'scripting',
        'storage',
      ]);
    });

    it('has no host permissions, static content scripts or web-accessible resources', () => {
      expect(manifest).not.toHaveProperty('host_permissions');
      expect(manifest).not.toHaveProperty('content_scripts');
      expect(manifest).not.toHaveProperty('web_accessible_resources');
    });

    it('asks for origins only at runtime', () => {
      expect(manifest.optional_host_permissions).toEqual(['*://*/*']);
    });

    it('declares the strict CSP for extension pages', () => {
      expect(manifest.content_security_policy).toEqual({ extension_pages: CSP });
    });
  });

  describe('REQ-ENV-002 private windows', () => {
    it('shares the site groups with private windows, where the user allows the extension', () => {
      // `spanning` (the default) keeps one background and one storage for both kinds of window.
      expect(manifest.incognito ?? 'spanning').toBe('spanning');
    });
  });

  describe('REQ-SEC-003 no external messaging', () => {
    it('lets no other extension or web page connect', () => {
      if (target === 'firefox') expect(manifest).not.toHaveProperty('externally_connectable');
      else expect(manifest.externally_connectable).toEqual({ ids: [], matches: [] });
    });
  });

  describe('REQ-CMD-001 REQ-CMD-002 keyboard commands', () => {
    it('suggests Alt+Shift+M for start-picker and leaves toggle-hide without a key (D-208)', () => {
      expect(manifest.commands).toEqual({
        'start-picker': {
          suggested_key: { default: 'Alt+Shift+M' },
          description: '__MSG_commandStartPicker__',
        },
        'toggle-hide': { description: '__MSG_commandToggleHide__' },
      });
    });
  });

  describe('REQ-NFR-001 browser floors', () => {
    it('is MV3 with the declared minimum version', () => {
      expect(manifest.manifest_version).toBe(3);
      const floors = {
        chrome: { minimum_chrome_version: '120' },
        edge: { minimum_chrome_version: '120' },
        firefox: {
          browser_specific_settings: {
            gecko: {
              id: 'sitemark@nielsbrakel',
              strict_min_version: '140.0',
              data_collection_permissions: { required: ['none'] },
            },
            // data_collection_permissions needs Firefox for Android 142 (web-ext lint).
            gecko_android: { strict_min_version: '142.0' },
          },
        },
        safari: { browser_specific_settings: { safari: { strict_min_version: '18.0' } } },
      };
      expect(manifest).toMatchObject(floors[target]);
    });

    it('uses localized names and English as the default locale', () => {
      expect(manifest).toMatchObject({
        name: '__MSG_extName__',
        description: '__MSG_extDescription__',
        default_locale: 'en',
      });
    });

    it('keeps the short brand where space is tight: short name and toolbar tooltip (D-300)', () => {
      expect(manifest).toMatchObject({
        short_name: 'SiteMark',
        homepage_url: 'https://nielsbrakel.github.io/SiteMark/',
        action: { default_title: 'SiteMark', default_popup: 'popup.html' },
      });
    });

    it('ships the icons, plus an opaque 1024 px app icon only on Safari (T-155)', () => {
      const icons = Object.fromEntries(
        [16, 32, 48, 96, 128].map((size) => [size, `icon/${size}.png`]),
      );
      const appIcon = target === 'safari' ? { 1024: 'icon/1024.png' } : {};
      expect(manifest.icons).toEqual({ ...icons, ...appIcon });
      for (const file of Object.values(manifest.icons as Record<string, string>)) {
        expect(existsSync(path.join(outDir(target), file)), file).toBe(true);
      }
      expect(existsSync(path.join(outDir(target), 'icon/1024.png'))).toBe(target === 'safari');
    });
  });
});
