/**
 * Parse a "YYYY-MM-DD" date string as a local date (not UTC).
 * Using new Date("YYYY-MM-DD") treats it as UTC midnight, which shifts
 * the date back one day in timezones behind UTC (e.g. EST).
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatLocalDate(dateStr: string, options: Intl.DateTimeFormatOptions): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-us", options);
}
