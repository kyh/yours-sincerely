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
      shortcuts: [
        {
          name: "Homepage",
          url: "/",
          icons: [
            {
              src: "/favicon/android-icon-96x96.png",
              sizes: "96x96",
              type: "image/png",
              purpose: "any monochrome",
            },
          ],
        },
      ],
      icons: [
        {
          src: "/favicon/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/favicon/android-chrome-384x384.png",
          sizes: "384x384",
          type: "image/png",
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
