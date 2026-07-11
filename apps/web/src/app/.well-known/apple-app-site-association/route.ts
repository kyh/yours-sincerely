const APP_BUNDLE_ID = "com.kyh.yourssincerely";
const APP_PATHS = ["/posts/*", "/profile/*", "/auth/password-update*"];

export const dynamic = "force-dynamic";

export const GET = () => {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const details =
    teamId === undefined || teamId.length === 0
      ? []
      : [{ appID: `${teamId}.${APP_BUNDLE_ID}`, paths: APP_PATHS }];

  return Response.json(
    { applinks: { apps: [], details } },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
};
