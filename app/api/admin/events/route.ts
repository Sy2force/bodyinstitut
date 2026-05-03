import bus from "@/lib/event-bus";
import type { TrackEvent } from "@/lib/event-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream — admin only (protected by middleware).
 * Admin dashboard connects once and receives live TrackEvent objects.
 */
export async function GET() {
  const encoder = new TextEncoder();

  let onEvent: ((e: TrackEvent) => void) | null = null;
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Initial handshake comment
      controller.enqueue(encoder.encode(": connected\n\n"));

      onEvent = (event: TrackEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // stream already closed — will be cleaned up by cancel()
        }
      };

      bus.on("track", onEvent);

      // Keepalive every 25s so the connection stays alive through proxies
      keepaliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          if (keepaliveTimer) clearInterval(keepaliveTimer);
          if (onEvent) bus.off("track", onEvent);
        }
      }, 25_000);
    },

    cancel() {
      if (keepaliveTimer) clearInterval(keepaliveTimer);
      if (onEvent) bus.off("track", onEvent);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
