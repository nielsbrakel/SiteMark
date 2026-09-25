/** Fixture hosts (D-233). All resolve to the local fixture server. */
export const E2E_PORT = 4173;
export const fixtureUrl = (host: 'prod' | 'test' | 'new', page = '') =>
  `http://${host}.sitemark.test:${E2E_PORT}/${page}`;

/** The e2e build pre-grants these; `new.sitemark.test` stays ungranted for not-granted states. */
export const E2E_GRANTED_ORIGINS = ['*://prod.sitemark.test/*', '*://test.sitemark.test/*'];
