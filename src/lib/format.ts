/**
 * Display formatting. All times are shown in UTC so server and client render
 * identically and traces from different machines can be compared directly.
 */

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const integerFormat = new Intl.NumberFormat("en-US");

export const formatDateTime = (iso: string) =>
  `${dateTimeFormat.format(new Date(iso))} UTC`;

export const formatShortDate = (isoDate: string) =>
  dateFormat.format(new Date(`${isoDate}T00:00:00Z`));

/** HH:mm:ss, with milliseconds when the source timestamp carries them. */
export const formatClock = (iso: string, withMilliseconds = false) => {
  const time = iso.slice(11, 19);
  return withMilliseconds ? `${time}.${iso.slice(20, 23)}` : time;
};

export const formatInteger = (value: number) => integerFormat.format(value);

export const formatScore = (value: number) => value.toFixed(2);

/** Signed delta using a true minus sign so it reads clearly in tables. */
export const formatDelta = (value: number) => {
  if (value === 0) return "0.00";
  const magnitude = Math.abs(value).toFixed(2);
  return value > 0 ? `+${magnitude}` : `−${magnitude}`;
};

export const formatDuration = (milliseconds: number) =>
  milliseconds >= 1000
    ? `${(milliseconds / 1000).toFixed(2)} s`
    : `${milliseconds} ms`;

export const formatPercent = (part: number, whole: number) =>
  whole === 0 ? "0%" : `${((part / whole) * 100).toFixed(1)}%`;
