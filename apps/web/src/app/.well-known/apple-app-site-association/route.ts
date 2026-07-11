import {
  MOBILE_APPLE_TEAM_ID,
  MOBILE_DEEP_LINK_PATH_PREFIXES,
  MOBILE_IOS_BUNDLE_ID,
} from "@repo/contracts/mobile-identity";

const APP_PATHS = MOBILE_DEEP_LINK_PATH_PREFIXES.map((prefix) => `${prefix}*`);

export const dynamic = "force-dynamic";

export const GET = () => {
  const details = [{ appID: `${MOBILE_APPLE_TEAM_ID}.${MOBILE_IOS_BUNDLE_ID}`, paths: APP_PATHS }];

  return Response.json(
    { applinks: { apps: [], details } },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
};
