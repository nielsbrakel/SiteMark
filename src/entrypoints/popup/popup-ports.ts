import { createConsoleLogger } from '@/platform/logger';
import { createPermissions } from '@/platform/permissions';
import { createTabs } from '@/platform/tabs';

// The browser adapters the popup uses directly. Everything that changes data goes to the
// background instead (D-220); these only read permissions and open tabs.

const logger = createConsoleLogger();

/** Host permissions, always read live (REQ-PRIV-002). */
export const popupPermissions = createPermissions(logger);

/** Opens tabs such as grant.html; never rejects. */
export const popupTabs = createTabs(logger);
