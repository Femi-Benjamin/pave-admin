/**
 * Tracks how far this device's clock is from a real server clock, so period
 * filters ("Today", "This week", ...) stay right on a computer whose date or
 * time is wrong.
 *
 * Two sources feed the same offset (server time minus device time):
 *  1. The `Date` header of the app's own origin, fetched once at start-up. A
 *     same-origin response always exposes it, so no backend change is needed.
 *  2. The `Date` header of API responses. Browsers only expose that to a
 *     cross-origin page when the API lists it in Access-Control-Expose-Headers,
 *     so this is a bonus rather than something to rely on.
 *
 * If neither is readable the offset stays 0 and callers use the device clock.
 */
let offsetMs = 0;
let hasSample = false;
const listeners = new Set<() => void>();

/** Ignore sub-threshold changes so network jitter never re-renders subscribers. */
const DRIFT_THRESHOLD_MS = 2_000;
/** A cached copy older than this says nothing about the current time. */
const MAX_RESPONSE_AGE_S = 60;

export function recordServerDate(header: string | null | undefined, deviceNow: number = Date.now()): void {
  if (typeof header !== "string") return;
  const serverMs = Date.parse(header);
  if (!Number.isFinite(serverMs)) return;
  const next = serverMs - deviceNow;
  if (hasSample && Math.abs(next - offsetMs) <= DRIFT_THRESHOLD_MS) return;
  offsetMs = next;
  hasSample = true;
  listeners.forEach((listener) => listener());
}

/** Server time minus device time, in milliseconds (0 when unknown). */
export function getServerOffsetMs(): number {
  return offsetMs;
}

/** For useSyncExternalStore. */
export function subscribeServerClock(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetServerClock(): void {
  offsetMs = 0;
  hasSample = false;
  listeners.forEach((listener) => listener());
}

interface SyncOptions {
  fetchImpl?: typeof fetch;
  url?: string;
  now?: () => number;
}

/**
 * Reads the server time from the app's own origin. Never throws: offline,
 * blocked or odd responses just leave the offset unchanged.
 */
export async function syncServerClock(options: SyncOptions = {}): Promise<void> {
  const fetchImpl = options.fetchImpl ?? (typeof fetch === "function" ? fetch : undefined);
  const now = options.now ?? Date.now;
  const origin = typeof window !== "undefined" ? window.location.origin : undefined;
  const url = options.url ?? (origin ? `${origin}/?clock=${now()}` : undefined);
  if (!fetchImpl || !url) return;
  try {
    const sentAt = now();
    const response = await fetchImpl(url, { method: "HEAD", cache: "no-store" });
    const receivedAt = now();
    const age = Number(response.headers.get("age"));
    if (Number.isFinite(age) && age > MAX_RESPONSE_AGE_S) return;
    // The server stamped the response somewhere between send and receive; use the midpoint.
    recordServerDate(response.headers.get("date"), sentAt + (receivedAt - sentAt) / 2);
  } catch {
    // Keep using the device clock.
  }
}
