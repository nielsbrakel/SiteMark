// D-226: browser tests pierce shadow roots, like the e2e build. Vitest browser mode doesn't apply
// Vite's `define`, so the build constant becomes a global before any test module runs.
Object.assign(globalThis, { __SHADOW_MODE__: 'open' });
