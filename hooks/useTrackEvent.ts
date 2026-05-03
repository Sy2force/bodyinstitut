"use client";

import { useEffect, useRef } from "react";
import type { TrackEventType } from "@/lib/event-bus";

/** Fire-and-forget event ping — never throws. */
export function trackEvent(type: TrackEventType) {
  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
    keepalive: true,
  }).catch(() => {});
}

/** Fires "arrival" exactly once on mount. */
export function useArrivalTrack() {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent("arrival");
  }, []);
}
