import { createConsoleLogger } from '@/platform/logger';
import { createPermissions } from '@/platform/permissions';

/** Host permissions, always read live (REQ-PRIV-002). */
export const optionsPermissions = createPermissions(createConsoleLogger());
