export const siteConfig = {
  name: "Yours Sincerely",
  shortName: "Yours Sincerely",
  description: "Anonymous love letters written in disappearing ink.",
  url:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://yourssincerely.org",
  twitter: "@kaiyuhsu",
};
