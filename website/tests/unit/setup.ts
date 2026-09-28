// The website-dom setup: the build constant the shared mark preview reads (D-226, D-278). Tests
// pierce shadow roots, like the extension's tests and e2e builds.
Object.assign(globalThis, { __SHADOW_MODE__: 'open' });
