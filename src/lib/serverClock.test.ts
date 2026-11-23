import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getServerOffsetMs,
  recordServerDate,
  resetServerClock,
  subscribeServerClock,
  syncServerClock,
} from "./serverClock";

describe("syncServerClock (same-origin Date header)", () => {
  beforeEach(() => resetServerClock());

  const respond = (headers: Record<string, string>) =>
    vi.fn().mockResolvedValue({ headers: { get: (n: string) => headers[n.toLowerCase()] ?? null } });

  it("learns that the device is two days ahead and uses the request midpoint", async () => {
    const serverNow = Date.parse("2026-11-22T11:30:00Z");
    const times = [serverNow + 2 * 86_400_000, serverNow + 2 * 86_400_000 + 400]; // sent, received on the device
    const fetchImpl = respond({ date: new Date(serverNow).toUTCString() });

    await syncServerClock({ fetchImpl, url: "https://app.test/?clock=1", now: () => times.shift() ?? 0 });

    expect(fetchImpl).toHaveBeenCalledWith("https://app.test/?clock=1", { method: "HEAD", cache: "no-store" });
    // 2 days plus half the 400 ms round trip
    expect(getServerOffsetMs()).toBe(-(2 * 86_400_000 + 200));
  });

  it("ignores a response served from a stale cache", async () => {
    const fetchImpl = respond({ date: "Mon, 01 Jan 2024 00:00:00 GMT", age: "86400" });
    await syncServerClock({ fetchImpl, url: "https://app.test/", now: () => 0 });
    expect(getServerOffsetMs()).toBe(0);
  });

  it("accepts a fresh cached response", async () => {
    const fetchImpl = respond({ date: "Sun, 22 Nov 2026 11:30:00 GMT", age: "3" });
    await syncServerClock({ fetchImpl, url: "https://app.test/", now: () => Date.parse("2026-11-22T11:30:00Z") });
    expect(getServerOffsetMs()).toBe(0);
    await syncServerClock({ fetchImpl, url: "https://app.test/", now: () => Date.parse("2026-11-23T11:30:00Z") });
    expect(getServerOffsetMs()).toBe(-86_400_000);
  });

  it("never throws when offline or blocked, and keeps the previous offset", async () => {
    recordServerDate("Sun, 22 Nov 2026 11:30:00 GMT", Date.parse("2026-11-22T11:30:10Z"));
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(syncServerClock({ fetchImpl, url: "https://app.test/" })).resolves.toBeUndefined();
    expect(getServerOffsetMs()).toBe(-10_000);
  });

  it("does nothing when the Date header is missing", async () => {
    await syncServerClock({ fetchImpl: respond({}), url: "https://app.test/" });
    expect(getServerOffsetMs()).toBe(0);
  });
});

describe("serverClock subscriptions", () => {
  beforeEach(() => resetServerClock());

  it("notifies on a real change but not on network jitter", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeServerClock(listener);
    const device = Date.parse("2026-11-22T11:30:00Z");

    recordServerDate("Sun, 22 Nov 2026 11:30:00 GMT", device + 5 * 60_000); // first sample
    expect(listener).toHaveBeenCalledTimes(1);

    recordServerDate("Sun, 22 Nov 2026 11:30:00 GMT", device + 5 * 60_000 + 700); // <2 s jitter
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getServerOffsetMs()).toBe(-5 * 60_000);

    recordServerDate("Sun, 22 Nov 2026 11:30:00 GMT", device + 30 * 60_000); // user fixed/changed clock
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    recordServerDate("Sun, 22 Nov 2026 11:30:00 GMT", device);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("serverClock", () => {
  beforeEach(() => resetServerClock());

  it("stores the difference between server and device time", () => {
    recordServerDate("Wed, 25 Nov 2026 13:00:00 GMT", Date.parse("2026-11-25T13:00:30Z"));
    expect(getServerOffsetMs()).toBe(-30_000);
  });

  it("ignores missing or unparseable headers and keeps the last good offset", () => {
    recordServerDate("Wed, 25 Nov 2026 13:00:00 GMT", Date.parse("2026-11-25T13:00:10Z"));
    for (const bad of [null, undefined, "", "application/json", "garbage"]) recordServerDate(bad);
    expect(getServerOffsetMs()).toBe(-10_000);
  });
});

describe("API client records the server clock", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("captures the Date response header when the browser exposes it", async () => {
    const { authService } = await import("@/services/api");
    const clock = await import("./serverClock");
    const serverNow = Date.now() + 2 * 86_400_000; // server two days ahead of this device
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "date" ? new Date(serverNow).toUTCString() : "application/json",
      },
      json: async () => ({ message: "ok" }),
    });

    await authService.forgotPassword("a@b.com");

    expect(Math.abs(clock.getServerOffsetMs() - 2 * 86_400_000)).toBeLessThan(5_000);
  });

  it("leaves the offset at zero when the header is hidden by CORS", async () => {
    const { authService } = await import("@/services/api");
    const clock = await import("./serverClock");
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: (name: string) => (name.toLowerCase() === "date" ? null : "application/json") },
      json: async () => ({ message: "ok" }),
    });

    await authService.forgotPassword("a@b.com");

    expect(clock.getServerOffsetMs()).toBe(0);
  });
});
