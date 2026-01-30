/**
 * Common IANA timezones for quick selection.
 * Covers major regions and population centers.
 */
export const COMMON_TIMEZONES = [
  // UTC
  "UTC",
  // Americas
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "America/Santiago",
  "America/Bogota",
  "America/Lima",
  // Pacific
  "Pacific/Honolulu",
  "Pacific/Auckland",
  // Europe
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Moscow",
  "Europe/Istanbul",
  // Asia
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Jakarta",
  "Asia/Manila",
  // Australia
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Brisbane",
  // Africa
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Lagos",
] as const;

export type CommonTimezone = (typeof COMMON_TIMEZONES)[number];

/**
 * Get the user's current timezone from the browser.
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get a timezone list that always includes the user's timezone
 * and any additional timezones that need to be shown.
 */
export function getTimezoneOptions(...additionalTimezones: (string | undefined | null)[]): string[] {
  const userTimezone = getUserTimezone();
  const timezones = new Set<string>(COMMON_TIMEZONES);

  // Always include user's browser timezone
  timezones.add(userTimezone);

  // Include any additional timezones (e.g., current queue's timezone)
  for (const tz of additionalTimezones) {
    if (tz && isValidTimezone(tz)) {
      timezones.add(tz);
    }
  }

  // Sort alphabetically but keep UTC first
  return Array.from(timezones).sort((a, b) => {
    if (a === "UTC") return -1;
    if (b === "UTC") return 1;
    return a.localeCompare(b);
  });
}

/**
 * Check if a string is a valid IANA timezone.
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Format a timezone for display (e.g., "America/New_York" -> "America/New York (EST)")
 */
export function formatTimezoneDisplay(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const tzAbbr = parts.find((p) => p.type === "timeZoneName")?.value || "";

    // Clean up the timezone name for display
    const displayName = timezone.replace(/_/g, " ");

    return tzAbbr ? `${displayName} (${tzAbbr})` : displayName;
  } catch {
    return timezone;
  }
}

// Import and re-export date-fns-tz utilities for timezone-aware date formatting
import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";
export { toZonedTime, fromZonedTime, formatTz };

/**
 * Format an ISO date string in a specific timezone.
 * @param isoString - ISO 8601 date string (e.g., "2024-01-15T14:00:00Z")
 * @param formatStr - date-fns format string (e.g., "EEEE, MMM d" or "h:mm a")
 * @param timezone - IANA timezone (e.g., "America/New_York")
 */
export function formatInTimezone(
  isoString: string,
  formatStr: string,
  timezone: string
): string {
  try {
    const date = new Date(isoString);
    const zonedDate = toZonedTime(date, timezone);
    return formatTz(zonedDate, formatStr, { timeZone: timezone });
  } catch {
    // Fallback to basic formatting if timezone conversion fails
    return new Date(isoString).toLocaleString();
  }
}
