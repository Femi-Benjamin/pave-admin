/**
 * Registration-period filtering for the Member Management screen.
 *
 * Why this lives outside the component: the filter used to read the device's
 * timezone and clock, so a computer with the wrong timezone or date showed
 * different (often empty) results than a correctly configured one. Everything
 * here is deterministic: day boundaries are always Nigeria time (WAT, UTC+1,
 * no daylight saving), and "now" is corrected for a wrong device clock.
 */

export type RegistrationPeriod = "today" | "yesterday" | "3days" | "7days" | "week" | "month" | "all";

export const REGISTRATION_PERIOD_OPTIONS: ReadonlyArray<{ value: RegistrationPeriod; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "3days", label: "Last 3 days" },
  { value: "7days", label: "Last 7 days" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

export const REGISTRATION_TIME_ZONE = "Africa/Lagos";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** West Africa Time. Nigeria does not observe daylight saving, so this is constant. */
const WAT_OFFSET_MS = HOUR_MS;
/** How far ahead of the corrected clock a registration may be before the clock is called wrong. */
const CLOCK_TOLERANCE_MS = 5 * 60 * 1000;

/** Start (inclusive) and end (exclusive) as epoch milliseconds; null means unbounded. */
export interface PeriodRange {
  start: number | null;
  end: number | null;
}

const UNZONED_TIMESTAMP = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/**
 * Parses an API timestamp to epoch milliseconds. Timestamps without a zone
 * ("2026-01-13 03:44:32") are treated as UTC rather than the device's local
 * time, which is what Date.parse would otherwise do.
 */
export function parseRegistrationTime(value: string | undefined | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const text = value.trim();
  const ms = Date.parse(UNZONED_TIMESTAMP.test(text) ? `${text.replace(" ", "T")}Z` : text);
  return Number.isFinite(ms) ? ms : undefined;
}

function startOfDayWat(ms: number): number {
  return Math.floor((ms + WAT_OFFSET_MS) / DAY_MS) * DAY_MS - WAT_OFFSET_MS;
}

function startOfMonthWat(ms: number): number {
  const shifted = new Date(ms + WAT_OFFSET_MS);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) - WAT_OFFSET_MS;
}

/** Monday-based week, matching how "This week" is described to admins. */
function daysSinceMondayWat(ms: number): number {
  const weekday = new Date(ms + WAT_OFFSET_MS).getUTCDay(); // 0 = Sunday
  return (weekday + 6) % 7;
}

/**
 * Only "yesterday" has an upper bound. Open-ended periods stay correct even if
 * the clock is slightly off, instead of silently dropping the newest members.
 */
export function getPeriodRange(period: RegistrationPeriod, now: number): PeriodRange {
  const today = startOfDayWat(now);
  switch (period) {
    case "today":
      return { start: today, end: null };
    case "yesterday":
      return { start: today - DAY_MS, end: today };
    case "3days":
      return { start: today - 2 * DAY_MS, end: null };
    case "7days":
      return { start: today - 6 * DAY_MS, end: null };
    case "week":
      return { start: today - daysSinceMondayWat(now) * DAY_MS, end: null };
    case "month":
      return { start: startOfMonthWat(now), end: null };
    case "all":
      return { start: null, end: null };
  }
}

export function isInRange(createdAt: string | undefined | null, range: PeriodRange): boolean {
  if (range.start === null && range.end === null) return true;
  const ms = parseRegistrationTime(createdAt);
  if (ms === undefined) return false;
  return (range.start === null || ms >= range.start) && (range.end === null || ms < range.end);
}

export interface ResolvedNow {
  /** The instant treated as "now" for every period. */
  now: number;
  /** True when a registration is dated after the corrected clock, so the clock is behind. */
  clockBehind: boolean;
}

/**
 * Picks the instant to use as "now".
 * - serverOffsetMs (server time minus device time) corrects a clock that is
 *   ahead or behind, when the API's Date header was readable.
 * - Otherwise, a registration dated after "now" proves the device clock is
 *   behind, so "now" is moved up to that registration.
 */
export function resolveNow(input: {
  deviceNow: number;
  serverOffsetMs?: number;
  newestRegistration?: number;
}): ResolvedNow {
  const corrected = input.deviceNow + (input.serverOffsetMs ?? 0);
  const clockBehind =
    input.newestRegistration !== undefined && input.newestRegistration > corrected + CLOCK_TOLERANCE_MS;
  return { now: clockBehind ? (input.newestRegistration as number) : corrected, clockBehind };
}

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: REGISTRATION_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: REGISTRATION_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** A registration date shown in Nigeria time, so it matches the period buckets. */
export function formatRegistrationDate(createdAt: string | undefined | null): string {
  const ms = parseRegistrationTime(createdAt);
  return ms === undefined ? "Not available" : dateFormat.format(ms);
}

/** Plain-language description of the range being counted, e.g. for a caption under the filter. */
export function describePeriodRange(range: PeriodRange): string {
  if (range.start === null && range.end === null) return "Every registration date";
  const from = range.start === null ? "the beginning" : dateTimeFormat.format(range.start);
  const to = range.end === null ? "now" : dateTimeFormat.format(range.end);
  return `${from} until ${to} (Nigeria time)`;
}
