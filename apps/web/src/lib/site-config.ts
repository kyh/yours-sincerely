import { SITE, WEB_ORIGIN } from "@repo/contracts/site";

export const siteConfig = {
  ...SITE,
  url: process.env.NODE_ENV === "development" ? "http://localhost:3000" : WEB_ORIGIN,
};
