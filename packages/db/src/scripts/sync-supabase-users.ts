/**
 * Sync Supabase Auth users to the User table
 *
 * This script ensures all users in Supabase auth.users exist in our User table.
 * Run this once before removing Supabase auth to ensure no users are lost.
 *
 * Usage: pnpm -F db sync-users
 */
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";

import { db } from "../drizzle-client";
import { authUsers, user } from "../drizzle-schema";

const createTempPasswordHash = async () => {
  const tempPassword = randomBytes(20).toString("hex");
  return await hash(tempPassword, 10);
};

const syncSupabaseUsers = async () => {
  console.log("Starting Supabase user sync...\n");

  // Get all Supabase auth users
  const supabaseUsers = await db.select().from(authUsers);
  console.log(`Found ${supabaseUsers.length} users in Supabase auth.users\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const sbUser of supabaseUsers) {
    try {
      // Check if user already exists in our User table
      const existingUser = await db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, sbUser.id),
      });

      if (existingUser) {
        console.log(`[SKIP] User ${sbUser.id} (${sbUser.email}) already exists`);
        skipped++;
        continue;
      }

      // Extract metadata from Supabase user
      const metadata = sbUser.rawUserMetaData as Record<string, unknown> | null;
      const displayName =
        (metadata?.name as string) ??
        (metadata?.full_name as string) ??
        (metadata?.user_name as string) ??
        "Anonymous";
      const displayImage =
        (metadata?.avatar_url as string) ?? (metadata?.picture as string);

      // Create user in our table with a temp password
      // Users will need to reset their password or use OAuth
      await db.insert(user).values({
        id: sbUser.id,
        email: sbUser.email,
        displayName,
        displayImage,
        passwordHash: await createTempPasswordHash(),
        createdAt: new Date().toISOString(),
      });

      console.log(`[CREATE] User ${sbUser.id} (${sbUser.email})`);
      created++;
    } catch (error) {
      console.error(`[ERROR] Failed to sync user ${sbUser.id}:`, error);
      errors++;
    }
  }

  console.log("\n--- Sync Complete ---");
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors:  ${errors}`);
  console.log(`Total:   ${supabaseUsers.length}`);

  process.exit(errors > 0 ? 1 : 0);
};

syncSupabaseUsers().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
