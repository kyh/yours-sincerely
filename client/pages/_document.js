import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheets } from '@material-ui/styles';
// eslint-disable-next-line import/no-extraneous-dependencies
import flush from 'styled-jsx/server';

const TITLE = 'Yours sincerely | Endless senseless collaborative book';
const DESCRIPTION =
  'To write is to put pen to paper or fingers to keyboard. If you have trouble falling asleep, write down all the thoughts swimming around your head before getting into bed as a way to clear your mind.';
const PREVIEW_IMAGE_URL = '';
const SITE_URL = 'https://yourssincerely.org';
const FB_ID = '';

class YSDocument extends Document {
  render() {
    return (
      <html lang="en" dir="ltr">
        <Head>
          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui"
          />
          <meta name="referrer" content="origin" />

          <meta name="application-name" content={TITLE} />
          <meta name="theme-color" content="#8389E1" />
          <meta name="title" content={TITLE} />
          <meta name="description" content={DESCRIPTION} />

          <meta property="fb:app_id" content={FB_ID} />
          <meta property="og:url" content={SITE_URL} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={TITLE} />
          <meta property="og:image" content={PREVIEW_IMAGE_URL} />
          <meta property="og:description" content={DESCRIPTION} />
          <meta property="og:site_name" content={TITLE} />
          <meta property="og:locale" content="en_US" />
          <meta property="article:author" content="Kaiyu Hsu" />

          <meta name="twitter:card" content="summary" />
          <meta name="twitter:site" content="@yourssincerely" />
          <meta name="twitter:creator" content="@tehkaiyu" />
          <meta name="twitter:url" content={SITE_URL} />
          <meta name="twitter:title" content={TITLE} />
          <meta name="twitter:description" content={DESCRIPTION} />
          <meta name="twitter:image" content={PREVIEW_IMAGE_URL} />

          <meta name="msapplication-TileColor" content="#2C4452" />
          <meta
            name="msapplication-TileImage"
            content="static/favicons/ms-icon-144x144.png"
          />

          <link rel="manifest" href="static/manifest.json" />
          <link
            rel="apple-touch-icon"
            sizes="57x57"
            href="static/favicons/apple-icon-57x57.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="60x60"
            href="static/favicons/apple-icon-60x60.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="72x72"
            href="static/favicons/apple-icon-72x72.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="76x76"
            href="static/favicons/apple-icon-76x76.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="114x114"
            href="static/favicons/apple-icon-114x114.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="120x120"
            href="static/favicons/apple-icon-120x120.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="144x144"
            href="static/favicons/apple-icon-144x144.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="152x152"
            href="static/favicons/apple-icon-152x152.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="static/favicons/apple-icon-180x180.png"
          />
          <link
            rel="shortcut icon"
            type="image/png"
            sizes="192x192"
            href="static/favicons/android-icon-192x192.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="static/favicons/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="96x96"
            href="static/favicons/favicon-96x96.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="static/favicons/favicon-16x16.png"
          />
          <link
            rel="stylesheet"
            type="text/css"
            href="static/assets/nprogress.css"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}

YSDocument.getInitialProps = async (ctx) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  // Render app and page and get the context of the page with collected side effects.
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      // eslint-disable-next-line react/jsx-props-no-spreading
      enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
    });

  const initialProps = await Document.getInitialProps(ctx);

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: (
      <>
        {sheets.getStyleElement()}
        {flush() || null}
      </>
    ),
  };
};

export default YSDocument;
