import { browser } from 'wxt/browser';
import { listenForBackground } from '../../platform/listen-in-tab';
import { createConsoleLogger } from '../../platform/logger';
import { sendToBackground } from '../../platform/send-message';
import type { ViewLabels } from '../../shared/marker-view/effect-view';
import { createDocumentEffects } from './document-effects';
import type { DocumentEffects } from './document-effects-port';
import { createHost } from './host';
import type { MarkerPorts, RendererHooks } from './marker';
import { onRestoredFromCache, whenShown } from './page-lifecycle';
import { createProximityFade } from './proximity';
import { proximityOnMount } from './proximity-hook';
import { createRenderer } from './renderer';
import { watchUrl } from './url-watch';

/** The labels of the banner chevron, from browser.i18n (no translator: keeps the bundle small). */
export function markerLabels(): ViewLabels {
  return {
    collapseBanner: browser.i18n.getMessage('markerCollapseBanner'),
    expandBanner: browser.i18n.getMessage('markerExpandBanner'),
  };
}

/** The title prefix and favicon, created on the first plan that has one (REQ-RND-009). */
function lazyDocumentEffects(hooks: RendererHooks): DocumentEffects {
  let effects: DocumentEffects | undefined;
  return {
    apply(items) {
      effects ??= createDocumentEffects({ onFaviconStatus: hooks.onStatusChange });
      effects.apply(items);
    },
    faviconStatus: () => effects?.faviconStatus() ?? 'off',
    dispose: () => effects?.dispose(),
  };
}

/**
 * The production ports of the marker: runtime messaging (content-safe helpers only, no zod,
 * REQ-NFR-002), the URL watch, the real `<sitemark-root>` host, the shared views, the document
 * effects and the proximity fade.
 */
export function markerPorts(): MarkerPorts {
  const logger = createConsoleLogger();
  return {
    requestPlan: async () => {
      await whenShown();
      const reply = await sendToBackground('renderPlanFor');
      return reply.ok ? reply.value : undefined;
    },
    reportStatus: (status) => {
      void sendToBackground('reportStatus', status);
    },
    listen: listenForBackground,
    watchUrl: (onChange) => {
      const watch = watchUrl(onChange);
      const unrestore = onRestoredFromCache(onChange);
      return () => {
        watch.dispose();
        unrestore();
      };
    },
    createRenderer: (hooks) =>
      createRenderer({
        createHost,
        logger,
        labels: markerLabels,
        documentEffects: lazyDocumentEffects(hooks),
        onViewMount: proximityOnMount(() => createProximityFade({})),
        ...hooks,
      }),
  };
}
