/**
 * In-memory presence store — tracks active visitors in real time.
 * TTL: 60 seconds (clients ping every 25s).
 */

export interface PresenceEntry {
  page: string;   // "home" | "simulator:1" | "simulator:2" | "simulator:3" | "simulator:result"
  updatedAt: number;
}

export interface LiveStats {
  total: number;
  onHome: number;
  onSimulator: number;
  simulatorStep1: number;
  simulatorStep2: number;
  simulatorStep3: number;
  onResult: number;
}

const STORE = new Map<string, PresenceEntry>();
const TTL_MS = 60_000;

export function upsertPresence(sessionId: string, page: string): void {
  STORE.set(sessionId, { page, updatedAt: Date.now() });
  if (STORE.size > 2000) cleanup();
}

export function getLiveStats(): LiveStats {
  cleanup();
  const entries = Array.from(STORE.values());
  return {
    total:          entries.length,
    onHome:         entries.filter((e) => e.page === "home").length,
    onSimulator:    entries.filter((e) => e.page.startsWith("simulator")).length,
    simulatorStep1: entries.filter((e) => e.page === "simulator:1").length,
    simulatorStep2: entries.filter((e) => e.page === "simulator:2").length,
    simulatorStep3: entries.filter((e) => e.page === "simulator:3").length,
    onResult:       entries.filter((e) => e.page === "simulator:result").length,
  };
}

function cleanup(): void {
  const cutoff = Date.now() - TTL_MS;
  for (const [k, v] of STORE) {
    if (v.updatedAt < cutoff) STORE.delete(k);
  }
}
