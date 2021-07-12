import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    // Render app and page and get the context of the page with collected side effects.
    const styledComponentsSheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            styledComponentsSheet.collectStyles(<App {...props} />),
        });
      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <React.Fragment>
            {initialProps.styles}
            {styledComponentsSheet.getStyleElement()}
          </React.Fragment>
        ),
      };
    } finally {
      styledComponentsSheet.seal();
    }
  }

  render() {
    return (
      <Html lang="en" dir="ltr">
        <Head>
          <meta name="referrer" content="origin" />
          <meta name="application-name" content="Yours sincerely" />
          <meta name="theme-color" content="#8389E1" />
          <meta name="title" content="Yours sincerely | Notes to no one" />
          <meta
            name="keywords"
            content="anonymous blog, write letters, yours sincerely"
          />
          <meta name="robots" content="index, follow" />
          <meta
            name="description"
            content="Write as if your arms are wide open, and hold them far apart. An ephemeral anonymous blog to send each other tiny beautiful letters."
          />

          <meta property="fb:app_id" content="{FB_ID}" />
          <meta property="og:url" content="https://yourssincerely.org" />
          <meta property="og:type" content="website" />
          <meta
            property="og:title"
            content="Yours sincerely | Notes to no one"
          />
          <meta property="og:image" content="/featured.png" />
          <meta
            property="og:description"
            content="Write as if your arms are wide open, and hold them far apart. An ephemeral anonymous blog to send each other tiny beautiful letters."
          />
          <meta property="og:site_name" content="UI Capsule" />
          <meta property="og:locale" content="en_US" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@kaiyuhsu" />
          <meta name="twitter:creator" content="@kaiyuhsu" />
          <meta name="twitter:url" content="https://yourssincerely.org" />
          <meta
            name="twitter:title"
            content="Yours sincerely | Notes to no one"
          />
          <meta
            name="twitter:description"
            content="Write as if your arms are wide open, and hold them far apart. An ephemeral anonymous blog to send each other tiny beautiful letters."
          />
          <meta name="twitter:image" content="/featured.png" />
          <meta property="article:author" content="Kaiyu Hsu" />
          <link rel="manifest" href="/manifest.json" />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="favicons/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="favicons/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="favicons/favicon-16x16.png"
          />
          <style jsx global>
            {`
              @font-face {
                font-family: "HelveticaNow";
                src: url(/fonts/subset-HelveticaNowText-BoldIt.woff2)
                    format("woff2"),
                  url(/fonts/subset-HelveticaNowText-BoldIt.woff) format("woff");
                font-weight: 700;
                font-style: italic;
                font-display: fallback;
              }
              @font-face {
                font-family: "HelveticaNow";
                src: url(/fonts/subset-HelveticaNowText-It.woff2)
                    format("woff2"),
                  url(/fonts/subset-HelveticaNowText-It.woff) format("woff");
                font-weight: 400;
                font-style: italic;
                font-display: fallback;
              }
              @font-face {
                font-family: "HelveticaNow";
                src: url(/fonts/subset-HelveticaNowText-Regular.woff2)
                    format("woff2"),
                  url(/fonts/subset-HelveticaNowText-Regular.woff)
                    format("woff");
                font-weight: 400;
                font-style: normal;
                font-display: fallback;
              }
              @font-face {
                font-family: "HelveticaNow";
                src: url(/fonts/subset-HelveticaNowDisplay-Black.woff2)
                    format("woff2"),
                  url(/fonts/subset-HelveticaNowDisplay-Black.woff)
                    format("woff");
                font-weight: 900;
                font-style: normal;
                font-display: fallback;
              }
              @font-face {
                font-family: "HelveticaNow";
                src: url(/fonts/subset-HelveticaNowText-Bold.woff2)
                    format("woff2"),
                  url(/fonts/subset-HelveticaNowText-Bold.woff) format("woff");
                font-weight: 700;
                font-style: normal;
                font-display: fallback;
              }
            `}
          </style>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
