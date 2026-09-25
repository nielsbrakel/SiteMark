import { defineConfig } from 'wxt';

// See docs/plan.md §3 (Architecture) for why permissions look like this.
export default defineConfig({
  srcDir: 'src',
  // Explicit imports only (D-222): no hidden globals, and layer rules stay visible to Biome.
  imports: false,
  // One manifest version everywhere (Chromium 120+, Firefox 140+, Safari 18+).
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react'],
  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    short_name: 'SiteMark',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    // Privacy by default: no host access at install time. Origins are
    // requested one by one when the user adds a URL pattern (REQ-PRIV-002).
    permissions: ['storage', 'scripting', 'activeTab'],
    optional_host_permissions: ['*://*/*'],
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
