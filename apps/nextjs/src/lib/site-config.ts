export const siteConfig = {
  name: "Yours Sincerely",
  shortName: "Yours Sincerely",
  description:
    "An ephemeral anonymous blog to send each other tiny beautiful letters",
  url:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://yourssincerely.org",
  twitter: "@kaiyuhsu",
};
