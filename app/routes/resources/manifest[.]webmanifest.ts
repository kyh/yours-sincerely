import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

export let loader: LoaderFunction = () => {
  return json(
    {
      short_name: "Yours Sincerely",
      name: "Yours Sincerely",
      start_url: "/",
      display: "standalone",
      theme_color: "#4d4f6a",
      background_color: "#4d4f6a",
      description:
        "An ephemeral anonymous blog to send each other tiny beautiful letters. Write as if your arms are wide open, and hold them far apart.",
      dir: "ltr",
      lang: "en",
      icons: [
        {
          src: "/favicon/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "monochrome",
        },
        {
          src: "/favicon/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=600",
        "Content-Type": "application/manifest+json",
      },
    }
  );
};
