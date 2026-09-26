import type { Unsubscribe } from '../../app/ports';
import type { TabHandlers } from '../../app/protocol';
import type { RenderPlan } from '../../core/render/render-plan';
import type { TabStatus } from '../../core/render/status';
import type { Renderer } from './renderer';

/** What the renderer tells the marker. */
export type RendererHooks = {
  readonly onStatusChange: () => void;
  readonly onHostLost: () => void;
};

/** The marker's ties to the extension (src/content/marker/marker-ports.ts in production). */
export type MarkerPorts = {
  /** The render plan for this tab's URL; `undefined` when the background didn't answer. */
  readonly requestPlan: () => Promise<RenderPlan | undefined>;
  readonly reportStatus: (status: TabStatus) => void;
  readonly listen: (handlers: TabHandlers) => Unsubscribe;
  readonly createRenderer: (hooks: RendererHooks) => Renderer;
};

export type Marker = {
  /** Stops listening and removes everything the marker added. */
  dispose(): void;
};

/** What the background assumes for a tab that never reported (REQ-RND-009: idle stays silent). */
const IDLE: TabStatus = { marks: [], favicon: 'off', hidden: false };

/**
 * The marker content script (plan §3.3): asks for its render plan, applies it and every plan the
 * background pushes, and reports the tab status whenever it changes (REQ-RND-005). It stops when
 * its host goes away: a newer instance took over, or the extension is gone (REQ-RND-012).
 */
export function startMarker(ports: MarkerPorts): Marker {
  let reported = JSON.stringify(IDLE);
  let isDisposed = false;
  const report = () => {
    const status = renderer.status();
    const json = JSON.stringify(status);
    if (json === reported) return;
    reported = json;
    ports.reportStatus(status);
  };
  const dispose = () => {
    if (isDisposed) return;
    isDisposed = true;
    unlisten();
    renderer.dispose();
  };
  const renderer = ports.createRenderer({ onStatusChange: report, onHostLost: dispose });
  const unlisten = ports.listen({
    applyPlan: (plan) => renderer.apply(plan),
    setHidden: ({ hidden }) => renderer.setHidden(hidden),
    getStatus: () => renderer.status(),
  });
  void ports.requestPlan().then((plan) => {
    if (plan && !isDisposed) renderer.apply(plan);
  });
  return { dispose };
}
