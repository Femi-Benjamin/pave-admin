/**
 * Works out the real (server) time so period filters ("Today", "This week", ...)
 * stay right on a computer whose date or time is wrong.
 *
 * Sources of "server time minus device time" (the offset), best first:
 *  1. login   – the `iat` (issued-at) the server stamped into the admin token,
 *               compared with the device clock at the moment of login. Needs no
 *               CORS header and no extra request, and survives page reloads.
 *  2. api     – the `Date` header of API responses. Browsers only expose it to a
 *               cross-origin page when the API lists it in
 *               Access-Control-Expose-Headers, so this is a bonus.
 *  3. origin  – the `Date` header of the app's own origin, fetched at start-up.
 *
 * Every source is checked against the token's validity window [iat, exp]. The
 * server only accepts a token inside that window, so a reading of "now" outside
 * it cannot be right and is discarded. If nothing trustworthy is left and the
 * device clock is also outside the window, the middle of the window is used as a
 * flagged estimate. The result is always visible to the user (see getClockStatus).
 */
export type ClockSource = "login" | "api" | "origin" | "token-window" | "device";

export interface ClockStatus {
  /** Server time minus device time, in milliseconds. */
  offsetMs: number;
  source: ClockSource;
  /** True when a server-derived reading backs the offset; false for guesses. */
  confirmed: boolean;
}

interface TokenWindow {
  iat: number; // epoch ms
  exp: number; // epoch ms
}

const LOGIN_STORAGE_KEY = "pave_clock_login";
/** Ignore sub-threshold changes so network jitter never re-renders subscribers. */
const DRIFT_THRESHOLD_MS = 2_000;
/** Slack around the token window for rounding and small server/server differences. */
const WINDOW_TOLERANCE_MS = 5 * 60 * 1000;
/** A cached copy older than this says little about the current time. */
const MAX_FRESH_AGE_S = 60;

let tokenWindow: TokenWindow | null = null;
let loginOffset: number | undefined;
let apiOffset: number | undefined;
let originOffset: number | undefined;
/** An origin reading that came with a large Age header: only a tie-breaker. */
let originAgedOffset: number | undefined;

const listeners = new Set<() => void>();
let snapshot: ClockStatus = { offsetMs: 0, source: "device", confirmed: false };

/** Reads iat/exp from a JWT without verifying it (the server does that). */
export function decodeTokenWindow(token: string | undefined | null): TokenWindow | null {
  if (!token) return null;
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4))) as {
      iat?: unknown;
      exp?: unknown;
    };
    const iat = Number(json.iat);
    const exp = Number(json.exp);
    if (!Number.isFinite(iat) || !Number.isFinite(exp) || exp <= iat) return null;
    return { iat: iat * 1000, exp: exp * 1000 };
  } catch {
    return null;
  }
}

function inWindow(serverMs: number): boolean {
  if (!tokenWindow) return true; // nothing to check against
  return serverMs >= tokenWindow.iat - WINDOW_TOLERANCE_MS && serverMs <= tokenWindow.exp + WINDOW_TOLERANCE_MS;
}

function choose(deviceNow: number): ClockStatus {
  const candidates: Array<[ClockSource, number | undefined]> = [
    ["login", loginOffset],
    ["api", apiOffset],
    ["origin", originOffset],
  ];
  for (const [source, offset] of candidates) {
    if (offset !== undefined && inWindow(deviceNow + offset)) return { offsetMs: offset, source, confirmed: true };
  }
  // No trustworthy reading. Without a token window we can only use the device clock.
  if (!tokenWindow) return { offsetMs: 0, source: "device", confirmed: false };
  if (inWindow(deviceNow)) return { offsetMs: 0, source: "device", confirmed: false };
  // The device clock is impossible for this session.
  if (originAgedOffset !== undefined && inWindow(deviceNow + originAgedOffset)) {
    return { offsetMs: originAgedOffset, source: "origin", confirmed: true };
  }
  const middle = (tokenWindow.iat + tokenWindow.exp) / 2;
  return { offsetMs: middle - deviceNow, source: "token-window", confirmed: false };
}

function recompute(deviceNow: number = Date.now()): void {
  const next = choose(deviceNow);
  const unchanged =
    next.source === snapshot.source &&
    next.confirmed === snapshot.confirmed &&
    Math.abs(next.offsetMs - snapshot.offsetMs) <= DRIFT_THRESHOLD_MS;
  if (unchanged) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the reading just won't survive a reload */
  }
}

/**
 * Tells the clock which admin token is current, and restores the offset measured
 * at that token's login. Call on start-up, after login, and with undefined on logout.
 */
export function registerSessionToken(token: string | undefined | null): void {
  tokenWindow = decodeTokenWindow(token);
  loginOffset = undefined;
  if (tokenWindow) {
    try {
      const saved = JSON.parse(readSession(LOGIN_STORAGE_KEY) ?? "null") as { iat?: number; offsetMs?: number } | null;
      if (saved && saved.iat === tokenWindow.iat && Number.isFinite(saved.offsetMs)) loginOffset = saved.offsetMs;
    } catch {
      /* ignore a corrupt saved reading */
    }
  } else {
    writeSession(LOGIN_STORAGE_KEY, null);
  }
  recompute();
}

/** Call right after a successful login, with the freshly issued token. */
export function recordLogin(token: string, deviceNow: number = Date.now()): void {
  const window = decodeTokenWindow(token);
  if (!window) {
    registerSessionToken(token);
    return;
  }
  // iat is when the server minted the token; the device received it a moment later.
  const offsetMs = window.iat - deviceNow;
  writeSession(LOGIN_STORAGE_KEY, JSON.stringify({ iat: window.iat, offsetMs }));
  registerSessionToken(token);
}

/** Reads the current token from session storage (start-up only). */
export function initClockFromSession(): void {
  // Same two places the API client looks for the token.
  let token = readSession("pave_admin_token");
  if (!token) {
    try {
      const saved = JSON.parse(readSession("pave_admin_auth") ?? "null") as { token?: unknown } | null;
      if (saved && typeof saved.token === "string") token = saved.token;
    } catch {
      /* ignore a corrupt saved session */
    }
  }
  registerSessionToken(token);
}

export function recordServerDate(header: string | null | undefined, deviceNow: number = Date.now()): void {
  if (typeof header !== "string") return;
  const serverMs = Date.parse(header);
  if (!Number.isFinite(serverMs)) return;
  const next = serverMs - deviceNow;
  if (apiOffset !== undefined && Math.abs(next - apiOffset) <= DRIFT_THRESHOLD_MS) return;
  apiOffset = next;
  recompute(deviceNow);
}

function recordOriginDate(header: string | null, deviceNow: number, aged: boolean): void {
  if (typeof header !== "string") return;
  const serverMs = Date.parse(header);
  if (!Number.isFinite(serverMs)) return;
  const next = serverMs - deviceNow;
  if (aged) originAgedOffset = next;
  else originOffset = next;
  recompute(deviceNow);
}

export function getClockStatus(): ClockStatus {
  return snapshot;
}

/** Server time minus device time, in milliseconds (0 when unknown). */
export function getServerOffsetMs(): number {
  return snapshot.offsetMs;
}

/** For useSyncExternalStore. */
export function subscribeServerClock(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetServerClock(): void {
  tokenWindow = null;
  loginOffset = apiOffset = originOffset = originAgedOffset = undefined;
  writeSession(LOGIN_STORAGE_KEY, null);
  snapshot = { offsetMs: 0, source: "device", confirmed: false };
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
    const aged = Number.isFinite(age) && age > MAX_FRESH_AGE_S;
    // The server stamped the response somewhere between send and receive; use the midpoint.
    recordOriginDate(response.headers.get("date"), sentAt + (receivedAt - sentAt) / 2, aged);
  } catch {
    // Keep using the other sources.
  }
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** e.g. "31 days ahead", "3 hours behind"; empty when the difference is negligible. */
export function describeClockSkew(offsetMs: number): string {
  const abs = Math.abs(offsetMs);
  if (abs < 10 * MINUTE) return "";
  const direction = offsetMs < 0 ? "ahead of" : "behind";
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
  const size = abs >= DAY ? plural(Math.round(abs / DAY), "day") : abs >= HOUR ? plural(Math.round(abs / HOUR), "hour") : plural(Math.round(abs / MINUTE), "minute");
  return `${size} ${direction}`;
}
