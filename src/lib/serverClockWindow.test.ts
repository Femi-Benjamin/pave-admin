import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  decodeTokenWindow,
  describeClockSkew,
  getClockStatus,
  initClockFromSession,
  recordLogin,
  recordServerDate,
  registerSessionToken,
  resetServerClock,
  syncServerClock,
} from "./serverClock";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const SERVER_NOW = Date.parse("2026-11-23T20:47:00Z");

function jwt(iatMs: number, lifetimeMs = DAY): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ iat: Math.floor(iatMs / 1000), exp: Math.floor((iatMs + lifetimeMs) / 1000) })}.sig`;
}

/** Pretend this computer's clock reads `deviceMs` right now. */
const setDeviceClock = (deviceMs: number) => vi.setSystemTime(deviceMs);

describe("decodeTokenWindow", () => {
  it("reads iat and exp in milliseconds", () => {
    expect(decodeTokenWindow(jwt(SERVER_NOW))).toEqual({
      iat: Math.floor(SERVER_NOW / 1000) * 1000,
      exp: Math.floor(SERVER_NOW / 1000) * 1000 + DAY,
    });
  });

  it("returns null for anything that is not a usable token", () => {
    expect(decodeTokenWindow(undefined)).toBeNull();
    expect(decodeTokenWindow("")).toBeNull();
    expect(decodeTokenWindow("not-a-jwt")).toBeNull();
    expect(decodeTokenWindow("a.%%%.c")).toBeNull();
    expect(decodeTokenWindow(`x.${btoa(JSON.stringify({ iat: 5 }))}.z`)).toBeNull();
    expect(decodeTokenWindow(`x.${btoa(JSON.stringify({ iat: 9, exp: 3 }))}.z`)).toBeNull();
  });
});

describe("clock chosen for the Members periods", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    resetServerClock();
  });
  afterEach(() => {
    vi.useRealTimers();
    resetServerClock();
  });

  it("a computer one month ahead is corrected from the token issued at login", () => {
    const deviceAtLogin = SERVER_NOW + 31 * DAY;
    setDeviceClock(deviceAtLogin);
    recordLogin(jwt(SERVER_NOW), deviceAtLogin);

    const status = getClockStatus();
    expect(status.source).toBe("login");
    expect(status.confirmed).toBe(true);
    expect(status.offsetMs).toBeCloseTo(-31 * DAY, -3);
    expect(Date.now() + status.offsetMs).toBeCloseTo(SERVER_NOW, -4);
  });

  it("keeps the login reading after a page reload", async () => {
    const deviceAtLogin = SERVER_NOW - 3 * DAY;
    setDeviceClock(deviceAtLogin);
    const token = jwt(SERVER_NOW);
    recordLogin(token, deviceAtLogin);
    sessionStorage.setItem("pave_admin_token", token);

    vi.resetModules(); // a reload: in-memory state gone, session storage kept
    const fresh = await import("./serverClock");
    expect(fresh.getClockStatus().source).toBe("device");
    fresh.initClockFromSession();

    expect(fresh.getClockStatus()).toMatchObject({ source: "login", confirmed: true });
    expect(fresh.getClockStatus().offsetMs).toBeCloseTo(3 * DAY, -3);
  });

  it("a new login replaces the previous reading instead of reusing it", () => {
    setDeviceClock(SERVER_NOW + 31 * DAY);
    recordLogin(jwt(SERVER_NOW), SERVER_NOW + 31 * DAY);
    expect(getClockStatus().offsetMs).toBeCloseTo(-31 * DAY, -3);

    // The user fixes the computer's clock and signs in again.
    const later = SERVER_NOW + 2 * DAY;
    setDeviceClock(later);
    recordLogin(jwt(later), later);
    expect(getClockStatus().offsetMs).toBeCloseTo(0, -3);
  });

  it("ignores a reading that cannot be true for the current token", () => {
    setDeviceClock(SERVER_NOW + 5 * HOUR); // inside the 24 h window, so plausible
    registerSessionToken(jwt(SERVER_NOW));
    // The API says it is a month later than the token allows: impossible.
    recordServerDate(new Date(SERVER_NOW + 31 * DAY).toUTCString(), Date.now());
    expect(getClockStatus()).toMatchObject({ source: "device", confirmed: false, offsetMs: 0 });
  });

  it("uses an API Date header when the login reading is unavailable and it fits the window", () => {
    setDeviceClock(SERVER_NOW + 40 * DAY);
    registerSessionToken(jwt(SERVER_NOW - HOUR)); // restored session from before this feature
    recordServerDate(new Date(SERVER_NOW).toUTCString(), Date.now());
    expect(getClockStatus()).toMatchObject({ source: "api", confirmed: true });
    expect(getClockStatus().offsetMs).toBeCloseTo(-40 * DAY, -3);
  });

  it("falls back to the middle of the token window, flagged as an estimate, when nothing else is known", () => {
    setDeviceClock(SERVER_NOW + 31 * DAY);
    registerSessionToken(jwt(SERVER_NOW - 2 * HOUR));
    const status = getClockStatus();
    expect(status.source).toBe("token-window");
    expect(status.confirmed).toBe(false);
    const estimate = Date.now() + status.offsetMs;
    expect(Math.abs(estimate - SERVER_NOW)).toBeLessThanOrEqual(12 * HOUR); // never more than half a window off
  });

  it("uses a cached-but-window-consistent origin reading before resorting to an estimate", async () => {
    setDeviceClock(SERVER_NOW + 31 * DAY);
    registerSessionToken(jwt(SERVER_NOW - 2 * HOUR));
    const fetchImpl = vi.fn().mockResolvedValue({
      headers: { get: (n: string) => ({ date: new Date(SERVER_NOW).toUTCString(), age: "7200" })[n.toLowerCase()] ?? null },
    });
    await syncServerClock({ fetchImpl, url: "https://app.test/" });
    expect(getClockStatus()).toMatchObject({ source: "origin", confirmed: true });
    expect(Date.now() + getClockStatus().offsetMs).toBeCloseTo(SERVER_NOW, -4);
  });

  it("trusts a plausible computer clock without a banner-worthy flag", () => {
    setDeviceClock(SERVER_NOW + HOUR);
    registerSessionToken(jwt(SERVER_NOW));
    expect(getClockStatus()).toMatchObject({ source: "device", confirmed: false, offsetMs: 0 });
  });

  it("signing out clears the reading", () => {
    setDeviceClock(SERVER_NOW + 31 * DAY);
    recordLogin(jwt(SERVER_NOW), Date.now());
    registerSessionToken(undefined);
    expect(getClockStatus().source).toBe("device");
    expect(sessionStorage.getItem("pave_clock_login")).toBeNull();
    initClockFromSession(); // nothing stored, nothing to restore
    expect(getClockStatus().offsetMs).toBe(0);
  });
});

describe("start-up token lookup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    resetServerClock();
  });
  afterEach(() => {
    vi.useRealTimers();
    resetServerClock();
  });

  it("finds the token inside the saved login record, like the API client does", () => {
    setDeviceClock(SERVER_NOW + 31 * DAY);
    sessionStorage.setItem("pave_admin_auth", JSON.stringify({ email: "a@t.test", token: jwt(SERVER_NOW - HOUR) }));
    initClockFromSession();
    expect(getClockStatus().source).toBe("token-window");
  });

  it("copes with a corrupt saved login record", () => {
    sessionStorage.setItem("pave_admin_auth", "{not json");
    expect(() => initClockFromSession()).not.toThrow();
    expect(getClockStatus().source).toBe("device");
  });
});

describe("describeClockSkew", () => {
  it("is empty for small differences", () => expect(describeClockSkew(9 * 60_000)).toBe(""));
  it("says ahead when the server is earlier than the device", () => {
    expect(describeClockSkew(-31 * DAY)).toBe("31 days ahead of");
    expect(describeClockSkew(-DAY)).toBe("1 day ahead of");
  });
  it("says behind when the server is later than the device", () => {
    expect(describeClockSkew(3 * HOUR)).toBe("3 hours behind");
    expect(describeClockSkew(45 * 60_000)).toBe("45 minutes behind");
  });
});
