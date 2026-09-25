import { defineConfig } from 'wxt';
import { E2E_GRANTED_ORIGINS } from './tests/e2e/hosts';

// See docs/plan.md §3 (Architecture) for why permissions look like this.
export default defineConfig({
  srcDir: 'src',
  // Explicit imports only (D-222): no hidden globals, and layer rules stay visible to Biome.
  imports: false,
  // One manifest version everywhere (Chromium 120+, Firefox 140+, Safari 18+).
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react'],
  // D-226: closed shadow roots in production; open in dev, test and e2e builds so tests can pierce them.
  vite: ({ mode }) => ({
    define: { __SHADOW_MODE__: JSON.stringify(mode === 'production' ? 'closed' : 'open') },
    // Every supported browser has native modulepreload; the polyfill would ship a fetch() (REQ-PRIV-005).
    build: { modulePreload: { polyfill: false } },
  }),
  manifest: ({ browser, mode }) => ({
    name: '__MSG_extName__',
    short_name: 'SiteMark',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    // Privacy by default: no host access at install time. Origins are
    // requested one by one when the user adds a URL pattern (REQ-PRIV-002).
    permissions: ['storage', 'scripting', 'activeTab'],
    optional_host_permissions: ['*://*/*'],
    // REQ-PRIV-005: no remote code and no requests from extension pages.
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'",
    },
    // REQ-SEC-003: no other extension or web page may message SiteMark. Firefox doesn't support the key.
    ...(browser !== 'firefox' && { externally_connectable: { ids: [], matches: [] } }),
    // `wxt build --mode e2e` (own outDir: .output/<browser>-mv3-e2e) pre-grants the fixture hosts
    // prod. and test.sitemark.test only; new.sitemark.test stays ungranted (D-233).
    ...(mode === 'e2e' && { host_permissions: E2E_GRANTED_ORIGINS }),
    commands: {
      'start-picker': {
        suggested_key: { default: 'Alt+Shift+M' },
        description: '__MSG_commandStartPicker__',
      },
    },
    // Browser floors (REQ-NFR-001).
    ...(browser === 'chrome' && { minimum_chrome_version: '120' }),
    ...(browser === 'safari' && {
      browser_specific_settings: { safari: { strict_min_version: '18.0' } },
    }),
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'sitemark@nielsbrakel',
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
  hooks: {
    // WXT copies the runtime content script's `matches` (*://*/*) into
    // host_permissions, which would grant access to every site at install time.
    // Remove only that entry: dev-server and (future) e2e hosts must survive.
    // Origins are otherwise only granted via optional_host_permissions (REQ-PRIV-002).
    'build:manifestGenerated': (_wxt, manifest) => {
      const hosts = manifest.host_permissions?.filter((p: string) => p !== '*://*/*') ?? [];
      if (hosts.length) manifest.host_permissions = hosts;
      else delete manifest.host_permissions;
    },
  },
});
