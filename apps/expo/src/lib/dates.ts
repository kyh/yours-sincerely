/** Server timestamps come from Postgres `timestamp without time zone` columns
    (drizzle mode "string") as UTC wall time like "2026-07-09 18:23:45.123".
    They are zone-less, so `new Date()` would parse them as LOCAL time and skew
    all countdown/heatmap math by the device's UTC offset. */

const HAS_EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export const parseServerDate = (value: string): Date => {
  const iso = value.replace(" ", "T");
  // Date-only strings already parse as UTC; only zone-less date-times need Z.
  if (!iso.includes("T") || HAS_EXPLICIT_ZONE.test(iso)) return new Date(iso);
  return new Date(`${iso}Z`);
};
