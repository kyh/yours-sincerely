const url = "https://yourssincerely.org";
const ogImage = `${url}/favicon/featured.png`;

export const createMeta = ({
  title = "",
  siteTitle = "Yours Sincerely",
  description = "An ephemeral anonymous blog to send each other tiny beautiful letters. Write as if your arms are wide open, and hold them far apart.",
} = {}) => {
  const finalTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  return {
    title: finalTitle,
    description,
    "og:type": "website",
    "og:title": title,
    "og:description": description,
    "og:site_name": siteTitle,
    "og:url": url,
    "og:image": ogImage,
    "og:image:width": "1200",
    "og:image:height": "628",
    "og:locale": "en_US",
    "twitter:card": "summary",
    "twitter:creator": "@kaiyuhsu",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:site": siteTitle,
    "twitter:url": url,
    "twitter:image": ogImage,
  };
};
