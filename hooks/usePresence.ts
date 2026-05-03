"use client";

import { useEffect, useRef } from "react";

const PING_INTERVAL_MS = 25_000;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("bi_sid");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("bi_sid", id);
  }
  return id;
}

export function usePresence(page: string) {
  const pageRef = useRef(page);
  pageRef.current = page;

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const ping = () => {
      fetch("/api/analytics/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, page: pageRef.current }),
        keepalive: true,
      }).catch(() => {});
    };

    ping();
    const id = window.setInterval(ping, PING_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    fetch("/api/analytics/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, page }),
      keepalive: true,
    }).catch(() => {});
  }, [page]);
}
