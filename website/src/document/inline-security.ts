import { contentSecurityPolicy, scriptHash } from '../head/csp';
import { bootstrapScript } from '../theme/bootstrap';

/** The inline theme bootstrap and the CSP that pins its hash (REQ-WEB-005, REQ-WEBUX-002). */
export function inlineSecurity(devServer: boolean): { bootstrap: string; csp: string } {
  const bootstrap = bootstrapScript();
  const csp = contentSecurityPolicy([scriptHash(bootstrap)], { inlineStyles: devServer });
  return { bootstrap, csp };
}
