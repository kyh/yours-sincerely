import { z } from "zod";

// WARNING: server timestamps are zone-less UTC wall time; new Date() on them parses local time.
const HAS_EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/iu;

export const parseServerDate = (value: string) => {
  const iso = value.replace(" ", "T");

  if (!iso.includes("T") || HAS_EXPLICIT_ZONE.test(iso)) {
    return new Date(iso);
  }

  return new Date(`${iso}Z`);
};

/** A server timestamp echoed back as input, as keyset cursors do. Postgres rejects
    anything else with a cast error, which would reach the client as a 500 instead
    of a 400. `z.iso.datetime` cannot express it: it demands the `T` that Postgres
    prints as a space. */
export const serverTimestamp = z
  .string()
  .regex(
    /^(?!0000)\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])[ T](?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:0\d|1[0-5])(?::?[0-5]\d)?)?$/u,
    "Not a server timestamp",
  )
  .refine((value) => {
    const day = value.slice(0, 10);
    const parsed = parseServerDate(day);

    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(day);
  }, "Not a calendar date");
