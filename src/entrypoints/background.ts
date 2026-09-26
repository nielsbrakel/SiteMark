import { defineBackground } from 'wxt/utils/define-background';
import { startBackground } from '../platform/background-wiring';

// Service worker (Chromium/Safari) / event page (Firefox). A composition root only: the wiring is
// src/platform/background-wiring.ts, the behaviour src/app/background-app.ts (docs/plan.md §3).
export default defineBackground(() => {
  startBackground();
});
