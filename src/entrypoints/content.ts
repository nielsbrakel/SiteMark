// Marker renderer. Registered at runtime (scripting.registerContentScripts)
// only for origins the user has granted, never statically via the manifest.
// See docs/plan.md §3.3.
export default defineContentScript({
  matches: ['*://*/*'],
  registration: 'runtime',
  main() {},
});
