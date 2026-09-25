import { describe, expect, it } from 'vitest';
import { readManifest, targets } from './targets';

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

  describe('REQ-SEC-003 no external messaging', () => {
    it('lets no other extension or web page connect', () => {
      if (target === 'firefox') expect(manifest).not.toHaveProperty('externally_connectable');
      else expect(manifest.externally_connectable).toEqual({ ids: [], matches: [] });
    });
  });

  describe('REQ-NFR-001 browser floors', () => {
    it('is MV3 with the declared minimum version', () => {
      expect(manifest.manifest_version).toBe(3);
      const floors = {
        chrome: { minimum_chrome_version: '120' },
        firefox: {
          browser_specific_settings: {
            gecko: {
              id: 'sitemark@nielsbrakel',
              strict_min_version: '140.0',
              data_collection_permissions: { required: ['none'] },
            },
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
  });
});
