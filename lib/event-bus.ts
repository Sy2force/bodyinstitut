import { EventEmitter } from "node:events";

/**
 * Global singleton EventEmitter bridging analytics/event → admin/events SSE.
 * Uses globalThis to survive Next.js hot-reloads in dev.
 */
declare global {
  // eslint-disable-next-line no-var
  var __biEventBus: EventEmitter | undefined;
}

const bus: EventEmitter =
  globalThis.__biEventBus ??
  (globalThis.__biEventBus = new EventEmitter());

bus.setMaxListeners(200);

export default bus;

export type TrackEventType =
  | "arrival"        // visitor arrived on the site
  | "simulator_open" // clicked / started the simulator
  | "step_2"         // advanced to step 2
  | "step_3"         // advanced to step 3 (contact)
  | "submitted"      // form submitted
  | "result";        // result page shown

export interface TrackEvent {
  id: string;
  type: TrackEventType;
  ts: number; // Unix ms
}
