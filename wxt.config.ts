import { defineConfig } from 'wxt';

// See docs/plan.md §3 (Architecture) for why permissions look like this.
export default defineConfig({
  srcDir: 'src',
  // One manifest version everywhere (Chromium, Firefox 140+, Safari 17+).
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
    // WXT copies the runtime content script's `matches` into host_permissions,
    // which would grant access to every site at install time. Strip it: origins
    // are only ever granted via optional_host_permissions (REQ-PRIV-002).
    'build:manifestGenerated': (_wxt, manifest) => {
      delete manifest.host_permissions;
    },
  },
});
