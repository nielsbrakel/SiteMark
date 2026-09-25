import { z } from 'zod';

// D-238: zod never compiles parsers with `new Function`, so it works under the extension CSP and the
// build output stays free of dynamic code. Every core schema imports `z` from here, so this runs
// before any schema is used.
z.config({ jitless: true });

export { z };
