import type { Unsubscribe } from '../../app/ports';
import type { TabHandlers } from '../../app/protocol';
import { notImplemented } from '../../core/not-implemented';
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

export function startMarker(_ports: MarkerPorts): Marker {
  return notImplemented();
}
