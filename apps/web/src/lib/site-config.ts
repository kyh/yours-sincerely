import { MOBILE_ANDROID_PACKAGE } from "@repo/contract/mobile-identity";
import { SITE, WEB_ORIGIN } from "@repo/contract/site";

const repository = "https://github.com/kyh/yours-sincerely";

export const siteConfig = {
  ...SITE,
  author: { name: "Kaiyu Hsu", url: "https://kyh.io" },
  contactEmail: "kai@kyh.io",
  playStoreUrl: `https://play.google.com/store/apps/details?id=${MOBILE_ANDROID_PACKAGE}`,
  repository,
  url: process.env.NODE_ENV === "development" ? "http://localhost:3000" : WEB_ORIGIN,
};
