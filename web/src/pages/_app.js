import React from "react";
import "util/analytics.js";
import { AuthProvider } from "actions/auth.js";
import { ThemeProvider } from "util/theme.js";

const MyApp = ({ Component, pageProps }) => {
  const Layout = Component.Layout ? Component.Layout : React.Fragment;
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default MyApp;
