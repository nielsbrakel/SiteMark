import { browser } from 'wxt/browser';
import { listenForBackground } from '../../platform/listen-in-tab';
import { createConsoleLogger } from '../../platform/logger';
import { sendToBackground } from '../../platform/send-message';
import type { ViewLabels } from '../../shared/marker-view/effect-view';
import { createHost } from './host';
import type { MarkerPorts } from './marker';
import { createRenderer } from './renderer';

/** The labels of the banner chevron, from browser.i18n (no translator: keeps the bundle small). */
export function markerLabels(): ViewLabels {
  return {
    collapseBanner: browser.i18n.getMessage('markerCollapseBanner'),
    expandBanner: browser.i18n.getMessage('markerExpandBanner'),
  };
}

/**
 * The production ports of the marker: runtime messaging (content-safe helpers only, no zod,
 * REQ-NFR-002), the real `<sitemark-root>` host and the shared views.
 */
export function markerPorts(): MarkerPorts {
  const logger = createConsoleLogger();
  return {
    requestPlan: async () => {
      const reply = await sendToBackground('renderPlanFor');
      return reply.ok ? reply.value : undefined;
    },
    reportStatus: (status) => {
      void sendToBackground('reportStatus', status);
    },
    listen: listenForBackground,
    createRenderer: (hooks) =>
      createRenderer({ createHost, logger, labels: markerLabels, ...hooks }),
  };
}
