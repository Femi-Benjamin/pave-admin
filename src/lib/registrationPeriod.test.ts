import { describe, expect, it } from "vitest";
import {
  REGISTRATION_PERIOD_OPTIONS,
  describePeriodRange,
  formatRegistrationDate,
  getPeriodRange,
  isInRange,
  parseRegistrationTime,
  resolveNow,
  type RegistrationPeriod,
} from "./registrationPeriod";

/** An instant written in Nigeria time (UTC+1), e.g. wat("2026-11-25T14:00"). */
const wat = (local: string) => Date.parse(`${local}:00+01:00`);

// Wednesday 25 Nov 2026, 2 pm in Nigeria.
const WED = wat("2026-11-25T14:00");

const inPeriod = (createdAt: string, period: RegistrationPeriod, now = WED) =>
  isInRange(createdAt, getPeriodRange(period, now));

describe("getPeriodRange", () => {
  it("starts every period at the right Nigeria-time midnight", () => {
    expect(getPeriodRange("today", WED)).toEqual({ start: wat("2026-11-25T00:00"), end: null });
    expect(getPeriodRange("yesterday", WED)).toEqual({
      start: wat("2026-11-24T00:00"),
      end: wat("2026-11-25T00:00"),
    });
    expect(getPeriodRange("3days", WED).start).toBe(wat("2026-11-23T00:00"));
    expect(getPeriodRange("7days", WED).start).toBe(wat("2026-11-19T00:00"));
    expect(getPeriodRange("week", WED).start).toBe(wat("2026-11-23T00:00")); // Monday
    expect(getPeriodRange("month", WED).start).toBe(wat("2026-11-01T00:00"));
    expect(getPeriodRange("all", WED)).toEqual({ start: null, end: null });
  });

  it("only bounds the end of Yesterday", () => {
    for (const { value } of REGISTRATION_PERIOD_OPTIONS) {
      expect(getPeriodRange(value, WED).end === null).toBe(value !== "yesterday");
    }
  });

  it("uses Monday as the start of the week, including on Sunday and Monday", () => {
    expect(getPeriodRange("week", wat("2026-11-22T10:00")).start).toBe(wat("2026-11-16T00:00")); // Sunday
    expect(getPeriodRange("week", wat("2026-11-23T00:00")).start).toBe(wat("2026-11-23T00:00")); // Monday 00:00
    expect(getPeriodRange("week", wat("2026-11-23T00:00") - 1).start).toBe(wat("2026-11-16T00:00"));
  });

  it("rolls over month and year boundaries", () => {
    const newYear = wat("2027-01-02T09:00");
    expect(getPeriodRange("month", newYear).start).toBe(wat("2027-01-01T00:00"));
    expect(getPeriodRange("7days", newYear).start).toBe(wat("2026-12-27T00:00"));
    const firstOfMonth = wat("2026-12-01T00:30"); // 30 Nov 23:30 UTC
    expect(getPeriodRange("month", firstOfMonth).start).toBe(wat("2026-12-01T00:00"));
    expect(getPeriodRange("today", firstOfMonth).start).toBe(wat("2026-12-01T00:00"));
  });
});

describe("isInRange", () => {
  it("assigns registrations to the Nigeria-time day, not the UTC day", () => {
    // 25 Nov 00:30 in Nigeria is still 24 Nov in UTC: it belongs to Today.
    expect(inPeriod("2026-11-24T23:30:00.000Z", "today")).toBe(true);
    expect(inPeriod("2026-11-24T23:30:00.000Z", "yesterday")).toBe(false);
    // 24 Nov 23:59:59 in Nigeria is Yesterday.
    expect(inPeriod("2026-11-24T22:59:59.000Z", "yesterday")).toBe(true);
    expect(inPeriod("2026-11-24T22:59:59.000Z", "today")).toBe(false);
  });

  it("includes the first instant and excludes the instant before each start", () => {
    const start = wat("2026-11-23T00:00");
    expect(isInRange(new Date(start).toISOString(), getPeriodRange("3days", WED))).toBe(true);
    expect(isInRange(new Date(start - 1).toISOString(), getPeriodRange("3days", WED))).toBe(false);
  });

  it("keeps recent members even if they are dated after 'now' (slow device clock)", () => {
    expect(inPeriod("2026-11-26T09:00:00.000Z", "today")).toBe(true);
    expect(inPeriod("2026-11-26T09:00:00.000Z", "month")).toBe(true);
  });

  it("matches every option the dropdown offers for a known member set", () => {
    const members = {
      justNow: "2026-11-25T11:00:00.000Z", // Wed 12:00 WAT
      earlyToday: "2026-11-24T23:10:00.000Z", // Wed 00:10 WAT
      yesterday: "2026-11-24T15:00:00.000Z",
      twoDaysAgo: "2026-11-23T09:00:00.000Z",
      lastFriday: "2026-11-20T09:00:00.000Z", // before this week, inside 7 days
      earlierMonth: "2026-11-05T09:00:00.000Z",
      lastMonth: "2026-10-30T09:00:00.000Z",
    };
    const count = (period: RegistrationPeriod) =>
      Object.values(members).filter((createdAt) => inPeriod(createdAt, period)).length;
    expect(count("today")).toBe(2);
    expect(count("yesterday")).toBe(1);
    expect(count("3days")).toBe(4);
    expect(count("7days")).toBe(5);
    expect(count("week")).toBe(4);
    expect(count("month")).toBe(6);
    expect(count("all")).toBe(7);
  });

  it("excludes members with a missing or invalid date from every period except All time", () => {
    for (const bad of [undefined, null, "", "not a date"]) {
      expect(isInRange(bad, getPeriodRange("month", WED))).toBe(false);
      expect(isInRange(bad, getPeriodRange("all", WED))).toBe(true);
    }
  });

  it("is independent of the device timezone", () => {
    const original = process.env.TZ;
    const sample = ["2026-11-24T23:30:00.000Z", "2026-11-24T22:59:59.000Z", "2026-11-25T11:00:00.000Z"];
    const run = () =>
      REGISTRATION_PERIOD_OPTIONS.map(({ value }) => ({
        value,
        range: getPeriodRange(value, WED),
        hits: sample.map((createdAt) => inPeriod(createdAt, value)),
        label: describePeriodRange(getPeriodRange(value, WED)),
      }));
    try {
      const results = ["Africa/Lagos", "Pacific/Midway", "Pacific/Kiritimati", "America/Los_Angeles"].map((tz) => {
        process.env.TZ = tz;
        return run();
      });
      for (const result of results) expect(result).toEqual(results[0]);
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
});

describe("parseRegistrationTime", () => {
  it("reads ISO timestamps and treats zone-less ones as UTC", () => {
    expect(parseRegistrationTime("2026-01-13T03:44:32.592Z")).toBe(Date.UTC(2026, 0, 13, 3, 44, 32, 592));
    expect(parseRegistrationTime("2026-01-13 03:44:32")).toBe(Date.UTC(2026, 0, 13, 3, 44, 32));
    expect(parseRegistrationTime("2026-01-13T03:44:32")).toBe(Date.UTC(2026, 0, 13, 3, 44, 32));
    expect(parseRegistrationTime("2026-01-13T04:44:32+01:00")).toBe(Date.UTC(2026, 0, 13, 3, 44, 32));
  });

  it("returns undefined for anything unusable", () => {
    for (const bad of [undefined, null, "", "   ", "nonsense"]) {
      expect(parseRegistrationTime(bad)).toBeUndefined();
    }
  });
});

describe("resolveNow", () => {
  const device = wat("2026-11-25T14:00");

  it("uses the device clock when nothing contradicts it", () => {
    expect(resolveNow({ deviceNow: device, newestRegistration: device - 3_600_000 })).toEqual({
      now: device,
      clockBehind: false,
    });
  });

  it("corrects a device clock that is days ahead using the server offset", () => {
    const ahead = device + 3 * 86_400_000;
    const resolved = resolveNow({ deviceNow: ahead, serverOffsetMs: -3 * 86_400_000 });
    expect(resolved.now).toBe(device);
    expect(getPeriodRange("today", resolved.now).start).toBe(wat("2026-11-25T00:00"));
  });

  it("moves 'now' up to the newest registration when the device clock is behind", () => {
    const behind = device - 10 * 86_400_000;
    const newest = device - 60_000;
    const resolved = resolveNow({ deviceNow: behind, newestRegistration: newest });
    expect(resolved).toEqual({ now: newest, clockBehind: true });
  });

  it("tolerates a few minutes of clock difference without flagging it", () => {
    const resolved = resolveNow({ deviceNow: device, newestRegistration: device + 2 * 60_000 });
    expect(resolved).toEqual({ now: device, clockBehind: false });
  });
});

describe("formatting", () => {
  it("shows registration dates in Nigeria time", () => {
    expect(formatRegistrationDate("2026-11-24T23:30:00.000Z")).toBe("25 Nov 2026");
    expect(formatRegistrationDate(undefined)).toBe("Not available");
    expect(formatRegistrationDate("junk")).toBe("Not available");
  });

  it("describes the range being counted", () => {
    expect(describePeriodRange(getPeriodRange("all", WED))).toBe("Every registration date");
    expect(describePeriodRange(getPeriodRange("today", WED))).toMatch(/^25 Nov 2026, 12:00 am until now \(Nigeria time\)$/i);
    expect(describePeriodRange(getPeriodRange("yesterday", WED))).toMatch(
      /^24 Nov 2026, 12:00 am until 25 Nov 2026, 12:00 am \(Nigeria time\)$/i,
    );
  });
});
