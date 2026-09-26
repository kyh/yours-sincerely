/**
 * `test:db`'s global setup. Without `POSTGRES_URL` the db client falls back to
 * local Supabase's default `postgres` database, so a missing variable would
 * quietly run every suite against whatever that holds, and against every other
 * run doing the same. `post-counters` asserts drift across whole tables, so
 * sharing a database makes it race.
 */
export const globalSetup = () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error(
      "test:db needs POSTGRES_URL, from the root .env or the shell. It will not fall back to the default local database.",
    );
  }
};
